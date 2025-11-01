import { db } from '@/lib/instant';
import type { PlanId } from './pricing';

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

export function useSubscription(userId: string | undefined) {
  // Query subscriptions from InstantDB
  // Permissions have been configured to allow users to view their own subscriptions
  const result = db.useQuery(
    userId ? { subscriptions: { $: { where: { userId } } } } : null as any
  );

  if (!result || result.error) {
    console.warn('Subscriptions query error:', result?.error);
    // Fallback to null subscription on error
    return { subscription: null, isLoading: false };
  }

  const { data, isLoading } = result;

  if (isLoading) {
    return { subscription: null, isLoading: true };
  }

  // Extract subscription data
  const subscription = userId && data
    ? (data as any)?.subscriptions?.[0] as Subscription | undefined
    : null;

  return { subscription: subscription || null, isLoading: false };
}
