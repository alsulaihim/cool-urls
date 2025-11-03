'use client';

import { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
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

export default function UnifiedCheckout({
  planId,
  userId,
  email,
  onSuccess,
  onCancel,
}: UnifiedCheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');

  return (
    <div className="space-y-6">
      {/* Payment Method Tabs */}
      <div className="flex gap-3">
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
      </div>

      {/* Payment Form */}
      <motion.div
        key={paymentMethod}
        initial={{ opacity: 0, x: paymentMethod === 'stripe' ? -20 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {paymentMethod === 'stripe' ? (
          <Elements stripe={stripePromise}>
            <CheckoutForm
              planId={planId}
              userId={userId}
              email={email}
              onSuccess={onSuccess}
              onCancel={onCancel}
            />
          </Elements>
        ) : (
          <PayPalCheckout
            planId={planId}
            userId={userId}
            email={email}
            onSuccess={onSuccess}
            onCancel={onCancel}
          />
        )}
      </motion.div>
    </div>
  );
}
