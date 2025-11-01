import Stripe from 'stripe';

// Lazy singleton instance
let stripeInstance: Stripe | null = null;

// Get Stripe instance with lazy initialization
export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }

    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-10-29.clover',
      typescript: true,
    });
  }

  return stripeInstance;
}

// Backward compatibility: export stripe getter
export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    return getStripe()[prop as keyof Stripe];
  }
});

// Helper to create a Stripe customer
export async function createStripeCustomer(params: {
  email: string;
  name?: string;
  userId: string;
}) {
  const stripe = getStripe();
  return await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      userId: params.userId,
    },
  });
}

// Helper to create a subscription
export async function createStripeSubscription(params: {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
}) {
  const stripe = getStripe();
  return await stripe.subscriptions.create({
    customer: params.customerId,
    items: [{ price: params.priceId }],
    metadata: params.metadata,
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent', 'customer'],
  });
}

// Helper to update a subscription
export async function updateStripeSubscription(params: {
  subscriptionId: string;
  priceId: string;
}) {
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(params.subscriptionId);

  return await stripe.subscriptions.update(params.subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: params.priceId,
    }],
    proration_behavior: 'create_prorations',
  });
}

// Helper to cancel a subscription
export async function cancelStripeSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true) {
  const stripe = getStripe();
  if (cancelAtPeriodEnd) {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  } else {
    return await stripe.subscriptions.cancel(subscriptionId);
  }
}

// Helper to create a setup intent for saving payment method
export async function createSetupIntent(customerId: string) {
  const stripe = getStripe();
  return await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
  });
}

// Helper to get customer portal session (for managing billing)
export async function createCustomerPortalSession(params: {
  customerId: string;
  returnUrl: string;
}) {
  const stripe = getStripe();
  return await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });
}

// Helper to retrieve subscription details
export async function getStripeSubscription(subscriptionId: string) {
  const stripe = getStripe();
  return await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method', 'customer'],
  });
}

// Helper to retrieve customer
export async function getStripeCustomer(customerId: string) {
  const stripe = getStripe();
  return await stripe.customers.retrieve(customerId);
}

// Helper to list customer invoices
export async function listCustomerInvoices(customerId: string, limit: number = 10) {
  const stripe = getStripe();
  return await stripe.invoices.list({
    customer: customerId,
    limit,
  });
}
