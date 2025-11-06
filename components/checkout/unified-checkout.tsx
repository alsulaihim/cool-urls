'use client';

import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { motion } from 'framer-motion';
import { CreditCard, Loader2 } from 'lucide-react';
import CheckoutForm from './checkout-form';
import PayPalCheckout from './paypal-checkout';
import type { PlanId } from '@/lib/pricing';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface UnifiedCheckoutProps {
  planId: PlanId;
  userId: string;
  email: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type PaymentMethod = 'stripe' | 'paypal';

interface PaymentProviders {
  stripe: boolean;
  paypal: boolean;
}

export default function UnifiedCheckout({
  planId,
  userId,
  email,
  onSuccess,
  onCancel,
}: UnifiedCheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [enabledProviders, setEnabledProviders] = useState<PaymentProviders | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch enabled payment providers
  useEffect(() => {
    fetch('/api/settings/payment-providers')
      .then(res => res.json())
      .then(data => {
        const providers: PaymentProviders = {
          stripe: data.stripe ?? true,
          paypal: data.paypal ?? true,
        };
        setEnabledProviders(providers);

        // Set initial payment method to the first enabled provider
        if (providers.stripe) {
          setPaymentMethod('stripe');
        } else if (providers.paypal) {
          setPaymentMethod('paypal');
        }

        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch payment providers:', err);
        // Default to all enabled on error
        setEnabledProviders({ stripe: true, paypal: true });
        setPaymentMethod('stripe');
        setLoading(false);
      });
  }, []);

  if (loading || !enabledProviders || !paymentMethod) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  // Check if both providers are enabled (show tabs)
  const showTabs = enabledProviders.stripe && enabledProviders.paypal;

  return (
    <div className="space-y-6">
      {/* Payment Method Tabs - Only show if both providers are enabled */}
      {showTabs && (
        <div className="flex gap-3">
          {enabledProviders.stripe && (
            <button
              onClick={() => setPaymentMethod('stripe')}
              className={`flex-1 py-3 px-6 rounded-lg border-2 font-medium transition-all ${
                paymentMethod === 'stripe'
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <CreditCard className="w-5 h-5" />
                <span>Credit Card</span>
              </div>
            </button>
          )}

          {enabledProviders.paypal && (
            <button
              onClick={() => setPaymentMethod('paypal')}
              className={`flex-1 py-3 px-6 rounded-lg border-2 font-medium transition-all ${
                paymentMethod === 'paypal'
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              <span>PayPal</span>
            </button>
          )}
        </div>
      )}

      {/* Payment Form */}
      <motion.div
        key={paymentMethod}
        initial={{ opacity: 0, x: paymentMethod === 'stripe' ? -20 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {paymentMethod === 'stripe' && enabledProviders.stripe ? (
          <Elements stripe={stripePromise}>
            <CheckoutForm
              planId={planId}
              userId={userId}
              email={email}
              onSuccess={onSuccess}
              onCancel={onCancel}
            />
          </Elements>
        ) : paymentMethod === 'paypal' && enabledProviders.paypal ? (
          <PayPalCheckout
            planId={planId}
            userId={userId}
            email={email}
            onSuccess={onSuccess}
            onCancel={onCancel}
          />
        ) : null}
      </motion.div>
    </div>
  );
}
