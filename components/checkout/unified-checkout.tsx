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
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .758-.653h8.431c2.908 0 5.171 1.975 5.171 4.697 0 3.495-2.758 6.199-6.157 6.199H9.15l-1.285 7.371a.64.64 0 0 1-.633.636h-.156z"/>
              <path d="M20.91 7.168c0 2.953-2.356 5.309-5.309 5.309h-3.48l-1.443 8.268h5.099c2.908 0 5.171-1.975 5.171-4.697 0-3.495-2.758-6.199-6.157-6.199h-3.997l.116-.681z"/>
            </svg>
            <span>PayPal</span>
          </div>
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
