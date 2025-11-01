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
  // TEMPORARY: Subscriptions entity doesn't exist in InstantDB backend yet
  // The schema file has it defined, but it needs to be manually created in the InstantDB dashboard
  //
  // To fix: Go to InstantDB dashboard and create the 'subscriptions' entity with these fields:
  // - userId: string (unique, indexed)
  // - planId: string
  // - status: string
  // - provider: string
  // - providerSubscriptionId: string (optional)
  // - providerCustomerId: string (optional)
  // - currentPeriodStart: number
  // - currentPeriodEnd: number
  // - cancelAtPeriodEnd: boolean
  // - clicksUsed: number
  // - clicksLimit: number
  // - createdAt: number
  // - updatedAt: number
  // - cancelledAt: number (optional)
  //
  // Until then, all users default to Free plan

  return { subscription: null, isLoading: false };

  // UNCOMMENT THIS WHEN SUBSCRIPTIONS ENTITY EXISTS:
  /*
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
  */
}
