// Pricing plans configuration
export type PlanId = 'free' | 'starter' | 'growth' | 'business' | 'enterprise' | 'scale' | 'premium';

export interface PricingPlan {
  id: PlanId;
  name: string;
  description: string;
  price: number; // Monthly price in dollars
  priceYearly?: number; // Yearly price in dollars (optional)
  clicksLimit: number;
  features: string[];
  isBranded: boolean;
  isPopular?: boolean;
  stripePriceId?: string; // Stripe price ID (to be set after creating products in Stripe)
  stripeYearlyPriceId?: string;
  paypalPlanId?: string; // PayPal plan ID (to be set after creating products in PayPal)
  paypalYearlyPlanId?: string;
}

export const PRICING_PLANS: Record<PlanId, PricingPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out the service',
    price: 0,
    clicksLimit: 1000,
    isBranded: false,
    features: [
      'Up to 1,000 clicks per month',
      'Unbranded short URLs',
      'Random URL codes',
      'Basic analytics',
      '24-hour link expiration',
      'Community support',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Great for individuals and small projects',
    price: 13,
    priceYearly: 130, // ~2 months free
    clicksLimit: 1000,
    isBranded: true,
    stripePriceId: 'price_1SOPDNFslEt6ImixLcKFinPI',
    paypalPlanId: 'P-4WR29071861086255NEDRAZA',
    features: [
      'Up to 1,000 clicks per month',
      'Custom branded URLs with -go suffix',
      'Custom prefixes',
      'Advanced analytics',
      'No link expiration',
      'Email support',
      'API access',
    ],
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    description: 'Ideal for growing businesses',
    price: 33,
    priceYearly: 330, // ~2 months free
    clicksLimit: 25000,
    isBranded: true,
    isPopular: true,
    stripePriceId: 'price_1SOPDOFslEt6ImixxImtx2i1',
    paypalPlanId: 'P-0NL797317C096192DNEDRAZQ',
    features: [
      'Up to 25,000 clicks per month',
      'Custom branded URLs with -go suffix',
      'Custom prefixes',
      'Advanced analytics & insights',
      'No link expiration',
      'Priority email support',
      'API access',
      'Team collaboration (up to 3 users)',
      'Custom domain support',
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    description: 'For established businesses with high traffic',
    price: 49,
    priceYearly: 490, // ~2 months free
    clicksLimit: 50000,
    isBranded: true,
    stripePriceId: 'price_1SOPDOFslEt6ImixfrTHqjSm',
    paypalPlanId: 'P-1JP3304933369332PNEDRAZY',
    features: [
      'Up to 50,000 clicks per month',
      'Custom branded URLs with -go suffix',
      'Custom prefixes',
      'Advanced analytics & insights',
      'No link expiration',
      'Priority support (24/7)',
      'Full API access',
      'Team collaboration (up to 10 users)',
      'Multiple custom domains',
      'White-label option',
      'Bulk URL creation',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: 74,
    priceYearly: 740, // ~2 months free
    clicksLimit: 100000,
    isBranded: true,
    stripePriceId: 'price_1SOPDPFslEt6Imixj3qEg0un',
    paypalPlanId: 'P-211250920K272762ENEDRAZY',
    features: [
      'Up to 100,000 clicks per month',
      'Custom branded URLs with -go suffix',
      'Custom prefixes',
      'Enterprise analytics & reporting',
      'No link expiration',
      'Dedicated account manager',
      'Full API access with higher limits',
      'Unlimited team members',
      'Multiple custom domains',
      'White-label solution',
      'Bulk URL creation',
      'SSO integration',
      'Advanced security features',
    ],
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    description: 'For high-volume applications',
    price: 129,
    priceYearly: 1290, // ~2 months free
    clicksLimit: 500000,
    isBranded: true,
    stripePriceId: 'price_1SOPDQFslEt6ImixxgeKln1a',
    paypalPlanId: 'P-3WH93136UP459172KNEDRA2A',
    features: [
      'Up to 500,000 clicks per month',
      'Custom branded URLs with -go suffix',
      'Custom prefixes',
      'Enterprise analytics & reporting',
      'No link expiration',
      'Dedicated account manager',
      'Full API access with premium limits',
      'Unlimited team members',
      'Multiple custom domains',
      'White-label solution',
      'Bulk URL creation',
      'SSO integration',
      'Advanced security features',
      'SLA guarantee (99.9% uptime)',
      'Custom integrations',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'For enterprises with massive scale',
    price: 299,
    priceYearly: 2990, // ~2 months free
    clicksLimit: 1000000,
    isBranded: true,
    stripePriceId: 'price_1SOPDRFslEt6ImixU0B7ohJd',
    paypalPlanId: 'P-1R81717797901360SNEDRA2I',
    features: [
      'Up to 1,000,000+ clicks per month',
      'Custom branded URLs with -go suffix',
      'Custom prefixes',
      'Enterprise analytics & reporting',
      'No link expiration',
      'Dedicated account manager',
      'Full API access with premium limits',
      'Unlimited team members',
      'Multiple custom domains',
      'White-label solution',
      'Bulk URL creation',
      'SSO integration',
      'Advanced security features',
      'SLA guarantee (99.99% uptime)',
      'Custom integrations',
      'Priority feature requests',
      'Dedicated infrastructure option',
    ],
  },
};

// Helper function to get plan by ID
export function getPlanById(planId: PlanId): PricingPlan {
  return PRICING_PLANS[planId];
}

// Helper function to get plan by Stripe price ID
export function getPlanByStripePriceId(stripePriceId: string): PricingPlan | null {
  const plans = getAllPlans();
  return plans.find(plan =>
    plan.stripePriceId === stripePriceId ||
    plan.stripeYearlyPriceId === stripePriceId
  ) || null;
}

// Helper function to get plan by PayPal plan ID
export function getPlanByPayPalPlanId(paypalPlanId: string): PricingPlan | null {
  const plans = getAllPlans();
  return plans.find(plan =>
    plan.paypalPlanId === paypalPlanId ||
    plan.paypalYearlyPlanId === paypalPlanId
  ) || null;
}

// Helper function to get all plans as array
export function getAllPlans(): PricingPlan[] {
  return Object.values(PRICING_PLANS);
}

// Helper function to check if user has reached click limit
export function hasReachedClickLimit(clicksUsed: number, planId: PlanId): boolean {
  const plan = getPlanById(planId);
  return clicksUsed >= plan.clicksLimit;
}

// Helper function to get remaining clicks
export function getRemainingClicks(clicksUsed: number, planId: PlanId): number {
  const plan = getPlanById(planId);
  return Math.max(0, plan.clicksLimit - clicksUsed);
}

// Helper function to get usage percentage
export function getUsagePercentage(clicksUsed: number, planId: PlanId): number {
  const plan = getPlanById(planId);
  return Math.min(100, (clicksUsed / plan.clicksLimit) * 100);
}

// Helper function to determine if user can create branded URLs
export function canCreateBrandedUrls(planId: PlanId): boolean {
  const plan = getPlanById(planId);
  return plan.isBranded;
}

// Format price for display
export function formatPrice(price: number): string {
  if (price === 0) return 'Free';
  return `$${price}`;
}

// Calculate discount percentage for yearly plans
export function getYearlyDiscount(monthlyPrice: number, yearlyPrice: number): number {
  if (!yearlyPrice || monthlyPrice === 0) return 0;
  const monthlyCost = monthlyPrice * 12;
  return Math.round(((monthlyCost - yearlyPrice) / monthlyCost) * 100);
}
