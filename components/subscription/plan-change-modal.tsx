'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, TrendingUp, TrendingDown, Check, Loader2 } from 'lucide-react';
import { PricingPlan } from '@/lib/pricing';

interface PlanChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: PricingPlan;
  newPlan: PricingPlan;
  userId: string;
  subscriptionId: string;
  onSuccess: () => void;
}

export default function PlanChangeModal({
  isOpen,
  onClose,
  currentPlan,
  newPlan,
  userId,
  subscriptionId,
  onSuccess,
}: PlanChangeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUpgrade = newPlan.price > currentPlan.price;
  const priceDiff = Math.abs(newPlan.price - currentPlan.price);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscriptions/change-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          subscriptionId,
          newPlanId: newPlan.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subscription');
      }

      // Check if checkout is required (for MyFatoorah/PayPal)
      if (data.requiresCheckout) {
        console.log('Plan change requires checkout:', data);
        // Close modal and redirect to pricing page with the new plan selected
        onClose();
        window.location.href = `/pricing?plan=${newPlan.id}&upgrade=true`;
        return;
      }

      // Success! (Stripe plan change)
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Plan change error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isUpgrade ? (
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-orange-600" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-black">
                  {isUpgrade ? 'Upgrade' : 'Downgrade'} Plan
                </h2>
                <p className="text-xs text-gray-600">
                  {currentPlan.name} → {newPlan.name}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
              title="Close modal"
            >
              <X className="w-5 h-5" aria-hidden="true" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Plan Comparison */}
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Current Plan</span>
                  <span className="text-sm text-gray-600">${currentPlan.price}/mo</span>
                </div>
                <div className="text-xs text-gray-600">
                  {currentPlan.clicksLimit.toLocaleString()} clicks/month
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
                  {isUpgrade ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                </div>
              </div>

              <div className={`rounded-lg p-4 ${
                isUpgrade ? 'bg-green-50 border-2 border-green-200' : 'bg-orange-50 border-2 border-orange-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">New Plan</span>
                  <span className="text-sm font-semibold text-gray-900">${newPlan.price}/mo</span>
                </div>
                <div className="text-xs text-gray-700">
                  {newPlan.clicksLimit.toLocaleString()} clicks/month
                </div>
              </div>
            </div>

            {/* Pricing Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    {isUpgrade ? 'Prorated Charge' : 'Prorated Credit'}
                  </p>
                  <p className="text-xs text-blue-700">
                    {isUpgrade ? (
                      <>
                        You&apos;ll be charged approximately <span className="font-semibold">${priceDiff}</span> today for the remainder of your billing period.
                        Your next bill will be <span className="font-semibold">${newPlan.price}</span> on your regular billing date.
                      </>
                    ) : (
                      <>
                        You&apos;ll receive a credit of approximately <span className="font-semibold">${priceDiff}</span> for the unused time on your current plan.
                        This credit will be applied to your next invoice.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Warning for downgrades */}
            {!isUpgrade && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-900 mb-1">
                      Feature Access Changes
                    </p>
                    <p className="text-xs text-orange-700">
                      Your click limit will change from {currentPlan.clicksLimit.toLocaleString()} to {newPlan.clicksLimit.toLocaleString()} clicks/month immediately.
                      Some features may no longer be available.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">Error</p>
                    <p className="text-xs text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                isUpgrade
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Confirm {isUpgrade ? 'Upgrade' : 'Downgrade'}</>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
