'use client';

import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { Loader2, CreditCard, Check } from 'lucide-react';
import type { PlanId } from '@/lib/pricing';
import { getPlanById } from '@/lib/pricing';

interface CheckoutFormProps {
  planId: PlanId;
  userId: string;
  email: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const CARD_ELEMENT_OPTIONS = {
  hidePostalCode: true,
  style: {
    base: {
      fontSize: '16px',
      color: '#000000',
      '::placeholder': {
        color: '#9CA3AF',
      },
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    invalid: {
      color: '#EF4444',
    },
  },
};

export default function CheckoutForm({
  planId,
  userId,
  email,
  onSuccess,
  onCancel,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const plan = getPlanById(planId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          email,
        },
      });

      if (paymentMethodError) {
        setError(paymentMethodError.message || 'Failed to create payment method');
        setLoading(false);
        return;
      }

      // Call our API to create the subscription
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email,
          planId,
          paymentMethodId: paymentMethod!.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      // Handle 3D Secure or other actions
      if (data.requiresAction && data.clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret);

        if (confirmError) {
          throw new Error(confirmError.message);
        }
      }

      // Success!
      setSuccess(true);

      // Wait a moment to show success message, then call onSuccess
      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-black mb-2">
          Subscription Successful!
        </h3>
        <p className="text-gray-600">
          Welcome to the {plan.name} plan. Redirecting to your dashboard...
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Element */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-black">Payment Details</h3>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-300">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Test card: 4242 4242 4242 4242 • Exp: 12/25 • CVC: 123
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <p className="text-red-600 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Summary */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Total due today:</span>
          <span className="text-2xl font-bold text-black">
            ${plan.price.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Your subscription will renew automatically each month. Cancel anytime.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-3 px-6 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 py-3 px-6 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Subscribe Now
            </>
          )}
        </button>
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        <span>Secured by Stripe • Your payment information is encrypted</span>
      </div>
    </form>
  );
}
