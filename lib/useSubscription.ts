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
  // Query subscriptions - wrapped in try/catch for safety
  try {
    const { data, isLoading, error } = db.useQuery(
      userId ? { subscriptions: { $: { where: { userId } } } } : null as any
    );

    if (error) {
      console.warn('Subscriptions query error:', error);
      return { subscription: null, isLoading: false };
    }

    const subscription = userId && data
      ? (data as any)?.subscriptions?.[0] as Subscription | undefined
      : null;

    return { subscription: subscription || null, isLoading };
  } catch (error) {
    console.warn('Error querying subscriptions:', error);
    return { subscription: null, isLoading: false };
  }
}
