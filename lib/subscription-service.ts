import type { PlanId } from './pricing';
import { getPlanById } from './pricing';

// Type for the InstantDB instance
type InstantDBInstance = any;

// Lazy initialization for build-time compatibility
let dbInstance: InstantDBInstance | null = null;

async function getDb() {
  if (!dbInstance) {
    const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
    const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;

    // Detect build-time execution and return a mock to prevent build failures
    // Next.js may execute this during "Collecting page data" phase
    if (!APP_ID || !ADMIN_TOKEN || APP_ID === 'build-time-placeholder') {
      console.warn('[InstantDB] Credentials not available - this should only happen during build');
      // Return a mock object that will fail at runtime if actually used
      return {
        query: async () => ({ subscriptions: [] }),
        transact: async () => ({ txId: 'mock' }),
        tx: new Proxy({}, { get: () => new Proxy({}, { get: () => ({ update: () => ({}) }) }) })
      } as any;
    }

    // Dynamic import to prevent module evaluation during build
    const { init } = await import('@instantdb/admin');
    dbInstance = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });
  }
  return dbInstance;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: PlanId;
  status: 'active' | 'cancelled' | 'past_due' | 'expired' | 'trialing';
  provider: 'stripe' | 'paypal' | 'none';
  providerSubscriptionId?: string;
  providerCustomerId?: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  clicksUsed: number;
  clicksLimit: number;
  createdAt: number;
  updatedAt: number;
  cancelledAt?: number;
}

/**
 * Create or update a subscription for a user (UPSERT)
 * This will update an existing subscription or create a new one
 */
export async function createSubscription(params: {
  userId: string;
  planId: PlanId;
  provider: 'stripe' | 'paypal';
  providerSubscriptionId: string;
  providerCustomerId: string;
}): Promise<void> {
  const plan = getPlanById(params.planId);
  const now = Date.now();
  const oneMonthFromNow = now + 30 * 24 * 60 * 60 * 1000; // 30 days

  // Check if subscription already exists
  const existing = await getSubscription(params.userId);

  const subscriptionData: any = {
    userId: params.userId,
    planId: params.planId,
    status: 'active',
    provider: params.provider,
    providerSubscriptionId: params.providerSubscriptionId,
    providerCustomerId: params.providerCustomerId,
    currentPeriodStart: now,
    currentPeriodEnd: oneMonthFromNow,
    cancelAtPeriodEnd: false,
    clicksLimit: plan.clicksLimit,
    updatedAt: now,
  };

  // If updating an existing subscription, preserve clicksUsed and createdAt
  if (existing) {
    subscriptionData.clicksUsed = existing.clicksUsed; // Preserve existing usage
    subscriptionData.createdAt = existing.createdAt; // Preserve original creation date
  } else {
    subscriptionData.clicksUsed = 0;
    subscriptionData.createdAt = now;
  }

  const db = await getDb();
  await db.transact([
    db.tx.subscriptions[params.userId].update(subscriptionData),
  ]);

  console.log(`[Subscription] ${existing ? 'Updated' : 'Created'} subscription for user ${params.userId}: ${params.planId}`);
}

/**
 * Update an existing subscription
 */
export async function updateSubscription(params: {
  userId: string;
  subscriptionId?: string;
  newPlanId?: PlanId;
  planId?: PlanId;
  status?: 'active' | 'cancelled' | 'past_due' | 'expired';
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: number;
}): Promise<void> {
  const updates: any = {
    updatedAt: Date.now(),
  };

  // Handle new plan ID (for plan changes)
  const planToUse = params.newPlanId || params.planId;

  if (planToUse) {
    const plan = getPlanById(planToUse);
    updates.planId = planToUse;
    updates.clicksLimit = plan.clicksLimit;

    console.log(`[Subscription] Updating plan to ${planToUse} for user ${params.userId}`);
  }

  if (params.status) {
    updates.status = params.status;
    if (params.status === 'cancelled') {
      updates.cancelledAt = Date.now();
    }
  }

  if (params.cancelAtPeriodEnd !== undefined) {
    updates.cancelAtPeriodEnd = params.cancelAtPeriodEnd;
  }

  if (params.currentPeriodEnd) {
    updates.currentPeriodEnd = params.currentPeriodEnd;
  }

  const db = await getDb();
  await db.transact([
    db.tx.subscriptions[params.userId].update(updates),
  ]);

  console.log(`[Subscription] Updated subscription for user ${params.userId}`, updates);
}

/**
 * Get a user's subscription
 */
export async function getSubscription(userId: string): Promise<Subscription | null> {
  const db = await getDb();
  const result = await db.query({
    subscriptions: {
      $: {
        where: { userId },
      },
    },
  });

  if (result.subscriptions && result.subscriptions.length > 0) {
    return result.subscriptions[0] as unknown as Subscription;
  }

  return null;
}

/**
 * Create a free subscription for a new user
 */
export async function createFreeSubscription(userId: string): Promise<void> {
  const now = Date.now();
  const oneMonthFromNow = now + 30 * 24 * 60 * 60 * 1000;

  const db = await getDb();
  await db.transact([
    db.tx.subscriptions[userId].update({
      userId,
      planId: 'free',
      status: 'active',
      provider: 'none',
      currentPeriodStart: now,
      currentPeriodEnd: oneMonthFromNow,
      cancelAtPeriodEnd: false,
      clicksUsed: 0,
      clicksLimit: 1000, // Free plan limit
      createdAt: now,
      updatedAt: now,
    }),
  ]);
}

/**
 * Track click usage for a user
 */
export async function incrementClickUsage(userId: string, clicks: number = 1): Promise<void> {
  const subscription = await getSubscription(userId);

  if (subscription) {
    const db = await getDb();
  await db.transact([
    db.tx.subscriptions[userId].update({
        clicksUsed: subscription.clicksUsed + clicks,
        updatedAt: Date.now(),
      }),
    ]);
  }
}

/**
 * Reset monthly click usage (called by cron job at start of billing period)
 */
export async function resetClickUsage(userId: string): Promise<void> {
  const db = await getDb();
  await db.transact([
    db.tx.subscriptions[userId].update({
      clicksUsed: 0,
      updatedAt: Date.now(),
    }),
  ]);
}

/**
 * Check if user has reached their click limit
 */
export async function hasReachedLimit(userId: string): Promise<boolean> {
  const subscription = await getSubscription(userId);

  if (!subscription) {
    return true; // No subscription = no access
  }

  return subscription.clicksUsed >= subscription.clicksLimit;
}

/**
 * Record a payment
 */
export async function recordPayment(params: {
  userId: string;
  subscriptionId?: string;
  provider: 'stripe' | 'paypal';
  providerPaymentId: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded';
  planId: PlanId;
  metadata?: Record<string, any>;
}): Promise<void> {
  const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const db = await getDb();
  await db.transact([
    db.tx.payments[paymentId].update({
      userId: params.userId,
      subscriptionId: params.subscriptionId,
      provider: params.provider,
      providerPaymentId: params.providerPaymentId,
      amount: params.amount,
      currency: params.currency,
      status: params.status,
      planId: params.planId,
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
      createdAt: Date.now(),
    }),
  ]);
}

/**
 * Get user's payment history
 */
export async function getPaymentHistory(userId: string, limit: number = 10) {
  const db = await getDb();
  const result = await db.query({
    payments: {
      $: {
        where: { userId },
        limit,
      },
    },
  });

  return result.payments || [];
}

/**
 * Handle subscription expiration after cancellation
 * Downgrades to free plan while preserving clicks used and access until period end
 */
export async function handleSubscriptionExpiration(userId: string): Promise<void> {
  const subscription = await getSubscription(userId);

  if (!subscription) {
    console.warn(`[Subscription] No subscription found for user ${userId}`);
    return;
  }

  const now = Date.now();
  const freePlan = getPlanById('free');

  // Get the current clicks used to preserve them
  const currentClicksUsed = subscription.clicksUsed;

  const db = await getDb();
  await db.transact([
    db.tx.subscriptions[userId].update({
      planId: 'free',
      status: 'active',
      provider: 'none',
      providerSubscriptionId: null,
      providerCustomerId: null,
      clicksLimit: freePlan.clicksLimit,
      clicksUsed: currentClicksUsed, // Preserve clicks used
      cancelAtPeriodEnd: false,
      cancelledAt: now,
      updatedAt: now,
      // Note: We keep currentPeriodStart and currentPeriodEnd as is
      // This allows users to see when their paid period ended
    }),
  ]);

  console.log(`[Subscription] Downgraded user ${userId} to free plan, preserved ${currentClicksUsed} clicks used`);
}
