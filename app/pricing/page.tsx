'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ArrowLeft, AlertCircle, X } from 'lucide-react';
import Link from 'next/link';
import { getAllPlans, formatPrice, type PlanId } from '@/lib/pricing';
import { db } from '@/lib/instant';
import { useRouter } from 'next/navigation';
import UnifiedCheckout from '@/components/checkout/unified-checkout';
import { AuthHeader } from '@/components/auth/auth-header';
import { useSubscription } from '@/lib/useSubscription';
import { getPlanById } from '@/lib/pricing';
import PlanChangeModal from '@/components/subscription/plan-change-modal';
import CancelSubscriptionModal from '@/components/subscription/cancel-subscription-modal';

export default function PricingPage() {
  const { user } = db.useAuth();
  const { subscription } = useSubscription(user?.id);
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('growth');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const plans = getAllPlans();
  const userCurrentPlan = subscription ? getPlanById(subscription.planId) : getPlanById('free');

  const currentPlan = plans.find(p => p.id === selectedPlan) || plans[0];

  // Handle plan upgrade from query params (after MyFatoorah/PayPal plan change)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const planParam = params.get('plan') as PlanId | null;
      const upgradeParam = params.get('upgrade');

      if (planParam && upgradeParam === 'true') {
        setSelectedPlan(planParam);
        setShowCheckout(true);

        // Scroll to checkout
        setTimeout(() => {
          document.getElementById('checkout-section')?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }, 100);

        // Clean up URL
        window.history.replaceState({}, '', '/pricing');
      }
    }
  }, []);

  const handleSubscribe = () => {
    // Prevent subscribing to current plan
    if (user && userCurrentPlan && selectedPlan === userCurrentPlan.id) {
      alert(`You are already on the ${userCurrentPlan.name} plan!`);
      return;
    }

    // Free plan doesn't need payment
    if (selectedPlan === 'free') {
      if (!user) {
        router.push('/');
        return;
      }
      // User already has free access
      router.push('/dashboard');
      return;
    }

    // Require login for paid plans
    if (!user) {
      // Save selected plan in sessionStorage
      sessionStorage.setItem('selectedPlan', selectedPlan);
      // Show login prompt instead of silently redirecting
      setShowLoginPrompt(true);
      return;
    }

    // If user has an active subscription (not cancelled), show plan change modal instead of checkout
    if (subscription && subscription.providerSubscriptionId && userCurrentPlan && userCurrentPlan.id !== 'free' && !subscription.cancelAtPeriodEnd) {
      setShowPlanChangeModal(true);
      return;
    }

    // Show checkout form inline for new subscriptions
    setShowCheckout(true);

    // Smooth scroll to checkout form
    setTimeout(() => {
      document.getElementById('checkout-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 100);
  };

  const handlePlanChangeSuccess = () => {
    // InstantDB will automatically refetch subscription data
    // Redirect to dashboard with success message
    router.push('/dashboard?plan-changed=true');
  };

  const handleCheckoutSuccess = () => {
    setShowCheckout(false);
    setSelectedPlan('free');
    // Show success message and redirect to dashboard
    router.push('/dashboard?upgraded=true');
  };

  const handleCheckoutCancel = () => {
    setShowCheckout(false);
    setSelectedPlan('free');
  };

  const handleCancelSuccess = () => {
    // InstantDB will automatically refetch subscription data
    // Redirect to dashboard with success message
    router.push('/dashboard?subscription-canceled=true');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <AuthHeader />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </motion.div>

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-black mb-2">
              Choose Your Plan
            </h1>
            <p className="text-sm text-gray-600">
              Select the perfect plan for your needs
            </p>
          </motion.div>
        </div>

        {/* Main Pricing Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="bg-white border border-gray-200 rounded-lg">
            {/* Plan Selector Dropdown */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative z-10">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-black">{currentPlan.name}</span>
                        {currentPlan.isPopular && (
                          <span className="px-1.5 py-0.5 bg-black text-white text-xs rounded">
                            Popular
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-600">{currentPlan.clicksLimit?.toLocaleString()} clicks/month</span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-600 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md border border-gray-200 z-50 overflow-hidden"
                    >
                      {plans.map((plan) => (
                        <button
                          key={plan.id}
                          onClick={() => {
                            setSelectedPlan(plan.id);
                            setShowDropdown(false);
                            setShowCheckout(false);
                          }}
                          className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left ${
                            selectedPlan === plan.id ? 'bg-gray-50' : ''
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-black">{plan.name}</span>
                              {plan.isPopular && (
                                <span className="px-1.5 py-0.5 bg-black text-white text-xs rounded">
                                  Popular
                                </span>
                              )}
                              {user && userCurrentPlan && plan.id === userCurrentPlan.id && (
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                                  Current Plan
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-600">{plan.clicksLimit?.toLocaleString()} clicks/mo</span>
                          </div>
                          <span className="text-sm font-semibold text-black">{formatPrice(plan.price)}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Pricing Display */}
            <div className="p-6 text-center border-b border-gray-200">
              <motion.div
                key={selectedPlan}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-black">
                    {formatPrice(currentPlan.price)}
                  </span>
                  {currentPlan.price > 0 && (
                    <span className="text-lg text-gray-600">/month</span>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Features List */}
            <div className="p-6">
              <motion.div
                key={selectedPlan}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <ul className="space-y-2.5">
                  {currentPlan.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5"
                    >
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        className="flex items-start gap-2.5 w-full"
                      >
                        <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </motion.div>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* CTA Button */}
              {!showCheckout && (
                <>
                  <motion.button
                    key={`btn-${selectedPlan}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    onClick={handleSubscribe}
                    disabled={!!(user && userCurrentPlan && selectedPlan === userCurrentPlan.id)}
                    className={`w-full mt-6 py-3 px-6 rounded-md font-medium text-sm transition-colors ${
                      user && userCurrentPlan && selectedPlan === userCurrentPlan.id
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-black hover:bg-gray-800 text-white'
                    }`}
                  >
                    {user && userCurrentPlan && selectedPlan === userCurrentPlan.id
                      ? 'Current Plan'
                      : currentPlan.price === 0
                      ? 'Get Started'
                      : user && subscription && subscription.providerSubscriptionId && userCurrentPlan && userCurrentPlan.id !== 'free' && !subscription.cancelAtPeriodEnd
                      ? (currentPlan.price > userCurrentPlan.price ? 'Upgrade Plan' : 'Downgrade Plan')
                      : 'Continue'}
                  </motion.button>

                  {/* Cancel Subscription Button - show whenever user has active paid subscription */}
                  {user && userCurrentPlan && userCurrentPlan.id !== 'free' && subscription && subscription.providerSubscriptionId && !subscription.cancelAtPeriodEnd && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      onClick={() => setShowCancelModal(true)}
                      className="w-full mt-3 py-2.5 px-6 rounded-md font-medium text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors border border-red-200"
                    >
                      Cancel Subscription
                    </motion.button>
                  )}

                  {/* Subscription Canceled Notice - only show if user has an active provider */}
                  {user && subscription && subscription.cancelAtPeriodEnd && userCurrentPlan && subscription.provider && subscription.provider !== 'none' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      className="w-full mt-3 py-2.5 px-4 rounded-md text-xs text-orange-700 bg-orange-50 border border-orange-200"
                    >
                      Your subscription will be canceled at the end of the billing period.
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Inline Checkout Section */}
        <AnimatePresence>
          {showCheckout && selectedPlan && user && (
            <motion.div
              id="checkout-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-black mb-1">
                    Complete Subscription
                  </h2>
                  <p className="text-sm text-gray-600">
                    {currentPlan.name} • {formatPrice(currentPlan.price)}/month
                  </p>
                </div>

                <UnifiedCheckout
                  planId={selectedPlan}
                  userId={user.id}
                  email={user.email || ''}
                  onSuccess={handleCheckoutSuccess}
                  onCancel={handleCheckoutCancel}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-8"
        >
          <div className="flex flex-wrap justify-center gap-4 text-gray-600 text-xs">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-green-600" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-pink-600" />
              <span>Secure payments</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-green-600" />
              <span>24/7 support</span>
            </div>
          </div>
        </motion.div>

        {/* Plan Change Modal */}
        {user && subscription && showPlanChangeModal && (
          <PlanChangeModal
            isOpen={showPlanChangeModal}
            onClose={() => setShowPlanChangeModal(false)}
            currentPlan={userCurrentPlan}
            newPlan={currentPlan}
            userId={user.id}
            subscriptionId={subscription.providerSubscriptionId || ''}
            onSuccess={handlePlanChangeSuccess}
          />
        )}

        {/* Cancel Subscription Modal */}
        {user && subscription && showCancelModal && userCurrentPlan && (
          <CancelSubscriptionModal
            isOpen={showCancelModal}
            onClose={() => setShowCancelModal(false)}
            currentPlan={userCurrentPlan}
            provider={subscription.provider as 'stripe' | 'paypal'}
            subscriptionId={subscription.id}
            onSuccess={handleCancelSuccess}
          />
        )}

        {/* Login Prompt Modal */}
        <AnimatePresence>
          {showLoginPrompt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLoginPrompt(false)}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-lg shadow-2xl max-w-md w-full p-6"
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Login Required
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      You need to be logged in to subscribe to a paid plan. Please sign in or create an account to continue.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowLoginPrompt(false);
                          router.push('/');
                        }}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md transition-colors"
                      >
                        Go to Login
                      </button>
                      <button
                        onClick={() => setShowLoginPrompt(false)}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
