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
  // Don't query if no userId
  const { data, isLoading, error } = db.useQuery(
    userId ? { subscriptions: { $: { where: { userId } } } } : null as any
  );

  // If there's an error (entity doesn't exist), return null subscription
  if (error) {
    console.warn('Subscriptions entity not found in schema. User will default to free plan.');
    return { subscription: null, isLoading: false };
  }

  const subscription = userId && data
    ? (data as any)?.subscriptions?.[0] as Subscription | undefined
    : null;

  return { subscription, isLoading };
}
