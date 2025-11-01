import { init } from '@instantdb/admin';
import type { PlanId } from './pricing';
import { getPlanById } from './pricing';

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID || '';
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN || '';

// Lazy initialization for build-time compatibility
let dbInstance: ReturnType<typeof init> | null = null;

function getDb() {
  if (!dbInstance) {
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

  await getDb().transact([
    getDb().tx.subscriptions[params.userId].update(subscriptionData),
  ]);

  console.log(`[Subscription] ${existing ? 'Updated' : 'Created'} subscription for user ${params.userId}: ${params.planId}`);
}

/**
 * Update an existing subscription
 */
export async function updateSubscription(params: {
  userId: string;
  planId?: PlanId;
  status?: 'active' | 'cancelled' | 'past_due' | 'expired';
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: number;
}): Promise<void> {
  const updates: any = {
    updatedAt: Date.now(),
  };

  if (params.planId) {
    const plan = getPlanById(params.planId);
    updates.planId = params.planId;
    updates.clicksLimit = plan.clicksLimit;
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

  await getDb().transact([
    getDb().tx.subscriptions[params.userId].update(updates),
  ]);
}

/**
 * Get a user's subscription
 */
export async function getSubscription(userId: string): Promise<Subscription | null> {
  const result = await getDb().query({
    subscriptions: {
      $: {
        where: { userId },
      },
    },
  });

  if (result.subscriptions && result.subscriptions.length > 0) {
    return result.subscriptions[0] as Subscription;
  }

  return null;
}

/**
 * Create a free subscription for a new user
 */
export async function createFreeSubscription(userId: string): Promise<void> {
  const now = Date.now();
  const oneMonthFromNow = now + 30 * 24 * 60 * 60 * 1000;

  await getDb().transact([
    getDb().tx.subscriptions[userId].update({
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
    await getDb().transact([
      getDb().tx.subscriptions[userId].update({
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
  await getDb().transact([
    getDb().tx.subscriptions[userId].update({
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

  await getDb().transact([
    getDb().tx.payments[paymentId].update({
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
  const result = await getDb().query({
    payments: {
      $: {
        where: { userId },
        limit,
      },
    },
  });

  return result.payments || [];
}
