'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowLeft, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const plans = getAllPlans();
  const userCurrentPlan = subscription ? getPlanById(subscription.planId) : getPlanById('free');

  // Update arrow visibility based on scroll position
  const updateArrowVisibility = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Scroll left/right
  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 350; // Slightly more than one card width
    const newScrollLeft = direction === 'left'
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  // Listen for scroll events to update arrow visibility
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateArrowVisibility();
    container.addEventListener('scroll', updateArrowVisibility);
    window.addEventListener('resize', updateArrowVisibility);

    return () => {
      container.removeEventListener('scroll', updateArrowVisibility);
      window.removeEventListener('resize', updateArrowVisibility);
    };
  }, []);

  const handleSubscribe = (planId: PlanId) => {
    const plan = getPlanById(planId);

    // Prevent subscribing to current plan
    if (user && userCurrentPlan && planId === userCurrentPlan.id) {
      alert(`You are already on the ${userCurrentPlan.name} plan!`);
      return;
    }

    // Free plan doesn't need payment
    if (planId === 'free') {
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
      sessionStorage.setItem('selectedPlan', planId);
      // Show login prompt instead of silently redirecting
      setShowLoginPrompt(true);
      setSelectedPlan(planId);
      return;
    }

    // If user has an active subscription (not cancelled), show plan change modal instead of checkout
    if (subscription && subscription.providerSubscriptionId && userCurrentPlan && userCurrentPlan.id !== 'free' && !subscription.cancelAtPeriodEnd) {
      setSelectedPlan(planId);
      setShowPlanChangeModal(true);
      return;
    }

    // Show checkout form inline for new subscriptions
    setSelectedPlan(planId);
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
    setSelectedPlan(null);
    // Show success message and redirect to dashboard
    router.push('/dashboard?upgraded=true');
  };

  const handleCheckoutCancel = () => {
    setShowCheckout(false);
    setSelectedPlan(null);
  };

  const handleCancelSuccess = () => {
    // InstantDB will automatically refetch subscription data
    // Redirect to dashboard with success message
    router.push('/dashboard?subscription-canceled=true');
  };

  return (
    <>
      {/* Global styles for scrollbar hiding and snap scrolling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .pricing-scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
          scroll-behavior: smooth;
        }
        .pricing-scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .pricing-snap-x {
          scroll-snap-type: x mandatory;
        }
        .pricing-snap-start {
          scroll-snap-align: start;
        }
        @media (max-width: 768px) {
          .pricing-snap-x {
            scroll-snap-type: x proximity;
          }
        }
      `}} />

      <div className="min-h-screen bg-white">
        {/* Navigation Header */}
        <AuthHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-black mb-3">
              Choose Your Plan
            </h1>
            <p className="text-base text-gray-600">
              Compare plans and find the perfect fit for your needs
            </p>
          </motion.div>
        </div>

        {/* Pricing Comparison Table */}
        <div className="w-full pb-8">
          {/* Scroll hint */}
          <div className="text-center mb-4">
            <p className="text-xs text-gray-500">← Scroll to see all plans →</p>
          </div>

          {/* All Plans - Single Horizontal Scroll */}
          <div className="relative px-12">
            {/* Left Arrow */}
            {showLeftArrow && (
              <button
                type="button"
                onClick={() => scroll('left')}
                className="absolute -left-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 hover:bg-white shadow-xl rounded-full p-3 transition-all hover:scale-110 border-2 border-gray-300"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-6 h-6 text-gray-800" />
              </button>
            )}

            {/* Right Arrow */}
            {showRightArrow && (
              <button
                type="button"
                onClick={() => scroll('right')}
                className="absolute -right-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 hover:bg-white shadow-xl rounded-full p-3 transition-all hover:scale-110 border-2 border-gray-300"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-6 h-6 text-gray-800" />
              </button>
            )}

            <div
              ref={scrollContainerRef}
              className="overflow-x-auto overflow-y-visible pb-4 pricing-scrollbar-hide pricing-snap-x"
            >
              <div className="flex gap-6 px-1 pt-6" style={{ width: 'max-content' }}>
                {/* Show ALL plans in one row */}
                {plans.map((plan, index) => {
                const isCurrentPlan = user && userCurrentPlan && plan.id === userCurrentPlan.id;
                const isPopular = plan.isPopular;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 + (index % 7) * 0.05 }}
                    className={`relative bg-white rounded-xl border-2 transition-all hover:shadow-xl flex-shrink-0 w-[320px] pricing-snap-start ${
                      isPopular
                        ? 'border-blue-600 shadow-lg'
                        : isCurrentPlan
                        ? 'border-green-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Popular Badge */}
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow-lg">
                          Most Popular
                        </span>
                      </div>
                    )}

                    {/* Current Plan Badge */}
                    {isCurrentPlan && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="bg-green-600 text-white px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow-lg">
                          Current Plan
                        </span>
                      </div>
                    )}

                    <div className="p-6">
                      {/* Plan Header */}
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-black mb-2">{plan.name}</h3>
                        <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-4xl font-bold text-black">
                            {formatPrice(plan.price)}
                          </span>
                          {plan.price > 0 && (
                            <span className="text-gray-600">/mo</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {plan.clicksLimit?.toLocaleString()} clicks/month
                        </p>
                      </div>

                      {/* CTA Button */}
                      <button
                        type="button"
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={isCurrentPlan}
                        className={`w-full py-3 px-6 rounded-lg font-semibold text-sm transition-all mb-6 ${
                          isCurrentPlan
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : isPopular
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                            : 'bg-black hover:bg-gray-800 text-white'
                        }`}
                      >
                        {isCurrentPlan
                          ? 'Current Plan'
                          : plan.price === 0
                          ? 'Get Started Free'
                          : user && subscription && subscription.providerSubscriptionId && userCurrentPlan && userCurrentPlan.id !== 'free' && !subscription.cancelAtPeriodEnd
                          ? (plan.price > userCurrentPlan.price ? 'Upgrade' : 'Downgrade')
                          : 'Get Started'}
                      </button>

                      {/* Features List */}
                      <div className="space-y-3 border-t border-gray-200 pt-6">
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4">
                          Features
                        </p>
                        {plan.features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700 leading-snug">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Subscription Button - show when user has active paid subscription */}
        {user && userCurrentPlan && userCurrentPlan.id !== 'free' && subscription && subscription.providerSubscriptionId && !subscription.cancelAtPeriodEnd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="text-center mt-8"
          >
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center gap-2 py-2.5 px-6 rounded-lg font-medium text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors border-2 border-red-200"
            >
              Cancel Current Subscription
            </button>
          </motion.div>
        )}

        {/* Subscription Canceled Notice */}
        {user && subscription && subscription.cancelAtPeriodEnd && userCurrentPlan && subscription.provider && subscription.provider !== 'none' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="max-w-2xl mx-auto mt-6 py-3 px-4 rounded-lg text-sm text-orange-700 bg-orange-50 border-2 border-orange-200 text-center"
          >
            Your subscription will be canceled at the end of the billing period.
          </motion.div>
        )}

        {/* Inline Checkout Section */}
        <AnimatePresence>
          {showCheckout && selectedPlan && user && (
            <motion.div
              id="checkout-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-8 max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-xl border-2 border-gray-200 p-8 shadow-lg">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-black mb-2">
                    Complete Subscription
                  </h2>
                  <p className="text-base text-gray-600">
                    {getPlanById(selectedPlan).name} • {formatPrice(getPlanById(selectedPlan).price)}/month
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
        {user && subscription && showPlanChangeModal && selectedPlan && (
          <PlanChangeModal
            isOpen={showPlanChangeModal}
            onClose={() => setShowPlanChangeModal(false)}
            currentPlan={userCurrentPlan}
            newPlan={getPlanById(selectedPlan)}
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
    </>
  );
}
