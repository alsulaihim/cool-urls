'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { getAllPlans, formatPrice, type PlanId } from '@/lib/pricing';
import { db } from '@/lib/instant';
import { useRouter } from 'next/navigation';
import CheckoutForm from '@/components/checkout/checkout-form';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { AuthHeader } from '@/components/auth/auth-header';
import { useSubscription } from '@/lib/useSubscription';
import { getPlanById } from '@/lib/pricing';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PricingPage() {
  const { user } = db.useAuth();
  const { subscription, isLoading: subLoading } = useSubscription(user?.id);
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('growth');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const plans = getAllPlans();
  const userCurrentPlan = subscription ? getPlanById(subscription.planId) : getPlanById('free');

  const currentPlan = plans.find(p => p.id === selectedPlan) || plans[0];

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
      router.push('/'); // Redirect to home to trigger auth
      return;
    }

    // Show checkout form inline
    setShowCheckout(true);

    // Smooth scroll to checkout form
    setTimeout(() => {
      document.getElementById('checkout-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 100);
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
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      className="flex items-start gap-2.5"
                    >
                      <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              {/* CTA Button */}
              {!showCheckout && (
                <motion.button
                  key={`btn-${selectedPlan}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  onClick={handleSubscribe}
                  disabled={user && userCurrentPlan && selectedPlan === userCurrentPlan.id}
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
                    : 'Continue'}
                </motion.button>
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

                <Elements stripe={stripePromise}>
                  <CheckoutForm
                    planId={selectedPlan}
                    userId={user.id}
                    email={user.email || ''}
                    onSuccess={handleCheckoutSuccess}
                    onCancel={handleCheckoutCancel}
                  />
                </Elements>
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
      </div>
    </div>
  );
}
