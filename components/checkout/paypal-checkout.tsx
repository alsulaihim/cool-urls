'use client';

import { useState, useEffect } from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import type { PlanId } from '@/lib/pricing';
import { getPlanById } from '@/lib/pricing';

interface PayPalCheckoutProps {
  planId: PlanId;
  userId: string;
  email: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PayPalCheckout({
  planId,
  userId,
  email,
  onSuccess,
  onCancel,
}: PayPalCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  const plan = getPlanById(planId);

  // Fetch PayPal client ID
  useEffect(() => {
    fetch('/api/paypal/config')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }
        if (!data.clientId) {
          throw new Error('PayPal is not configured. Please contact support.');
        }
        setClientId(data.clientId);
      })
      .catch(err => {
        console.error('Failed to load PayPal config:', err);
        setError(err.message || 'Failed to load PayPal. Please try again or use Stripe payment.');
      });
  }, []);

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

  if (!clientId) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* PayPal Buttons */}
      <PayPalScriptProvider
        options={{
          clientId: clientId,
          vault: true,
          intent: 'subscription',
        }}
      >
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg z-10">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          )}

          <PayPalButtons
            style={{
              layout: 'vertical',
              color: 'black',
              shape: 'rect',
              label: 'subscribe',
            }}
            createSubscription={async (data, actions) => {
              console.log('🔵 PayPal: Creating subscription...', { userId, email, planId });
              setLoading(true);
              setError(null);

              try {
                // Create subscription via our API
                const response = await fetch('/api/paypal/subscription/create', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userId,
                    email,
                    planId,
                  }),
                });

                const result = await response.json();
                console.log('🔵 PayPal: API response:', result);

                if (!response.ok) {
                  console.error('🔴 PayPal: API error:', result);
                  throw new Error(result.error || 'Failed to create subscription');
                }

                console.log('✅ PayPal: Subscription created:', result.subscriptionId);
                return result.subscriptionId;
              } catch (err: any) {
                console.error('🔴 PayPal subscription creation error:', err);
                setError(err.message || 'Failed to create subscription');
                setLoading(false);
                throw err;
              }
            }}
            onApprove={async (data, actions) => {
              try {
                // Verify and activate subscription
                const response = await fetch('/api/paypal/subscription/activate', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    subscriptionId: data.subscriptionID,
                    userId,
                  }),
                });

                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.error || 'Failed to activate subscription');
                }

                // Success!
                setSuccess(true);
                setLoading(false);

                // Wait a moment to show success message, then call onSuccess
                setTimeout(() => {
                  onSuccess();
                }, 1500);
              } catch (err: any) {
                console.error('PayPal approval error:', err);
                setError(err.message || 'Failed to activate subscription');
                setLoading(false);
              }
            }}
            onCancel={() => {
              setLoading(false);
              setError('Payment cancelled. You can try again when ready.');
            }}
            onError={(err) => {
              console.error('PayPal error:', err);
              console.error('PayPal error details:', JSON.stringify(err, null, 2));
              setError(`PayPal error: ${err?.message || 'An error occurred with PayPal. Please try again.'}`);
              setLoading(false);
            }}
          />
        </div>
      </PayPalScriptProvider>

      {/* Cancel Button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="py-2 px-6 text-gray-600 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Cancel
        </button>
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        <span>Secured by PayPal • Your payment information is protected</span>
      </div>
    </div>
  );
}
