/**
 * Admin Subscription Actions
 *
 * Server-side functions for admin to manage subscriptions
 */

import { getDb } from '@/lib/instant-admin';
import { getStripe } from '@/lib/stripe';
import { cancelPayPalSubscription } from '@/lib/paypal';
import { createAuditLog } from './audit';
import { requirePermission } from './permissions';
import type { PlanId } from '@/lib/pricing';
import { getPlanById } from '@/lib/pricing';

/**
 * Cancel a user's subscription (admin action)
 */
export async function adminCancelSubscription(params: {
  adminUserId: string;
  adminEmail: string;
  subscriptionId: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check permission
    await requirePermission(params.adminUserId, 'user.write');

    const db = await getDb();
    const stripe = getStripe();

    // Get subscription
    const result = await db.query({
      subscriptions: {
        $: {
          where: {
            id: params.subscriptionId,
          },
        },
      },
    });

    const subscription = result.subscriptions?.[0];

    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    // Cancel with provider
    if (subscription.provider === 'stripe' && subscription.providerSubscriptionId) {
      try {
        await stripe.subscriptions.update(subscription.providerSubscriptionId, {
          cancel_at_period_end: true,
          cancellation_details: {
            comment: `Cancelled by admin: ${params.reason}`,
          },
        });
      } catch (error: any) {
        console.error('Stripe cancellation error:', error);
        // Continue even if Stripe fails
      }
    } else if (subscription.provider === 'paypal' && subscription.providerSubscriptionId) {
      try {
        await cancelPayPalSubscription(subscription.providerSubscriptionId, params.reason);
      } catch (error) {
        console.error('PayPal cancellation error:', error);
        // Continue even if PayPal fails
      }
    }

    // Update database
    await db.transact([
      db.tx.subscriptions[params.subscriptionId].update({
        cancelAtPeriodEnd: true,
        updatedAt: Date.now(),
      }),
    ]);

    // Create audit log
    await createAuditLog({
      adminId: params.adminUserId,
      adminEmail: params.adminEmail,
      action: 'subscription.cancel',
      targetType: 'subscription',
      targetId: params.subscriptionId,
      metadata: { reason: params.reason, userId: subscription.userId },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Admin cancel subscription error:', error);
    return { success: false, error: error.message || 'Failed to cancel subscription' };
  }
}

/**
 * Change a user's subscription plan (admin action)
 */
export async function adminChangePlan(params: {
  adminUserId: string;
  adminEmail: string;
  userId: string;
  newPlanId: PlanId;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check permission
    await requirePermission(params.adminUserId, 'user.write');

    const db = await getDb();
    const stripe = getStripe();
    const newPlan = getPlanById(params.newPlanId);

    // Get current subscription
    const result = await db.query({
      subscriptions: {
        $: {
          where: {
            userId: params.userId,
          },
        },
      },
    });

    const subscription = result.subscriptions?.[0];

    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    // Update with provider if paid plan
    if (subscription.provider === 'stripe' && subscription.providerSubscriptionId && newPlan.stripePriceId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.providerSubscriptionId);
        await stripe.subscriptions.update(subscription.providerSubscriptionId, {
          items: [
            {
              id: stripeSubscription.items.data[0].id,
              price: newPlan.stripePriceId,
            },
          ],
          proration_behavior: 'create_prorations',
        });
      } catch (error: any) {
        console.error('Stripe plan change error:', error);
        return { success: false, error: `Failed to update Stripe subscription: ${error.message}` };
      }
    }

    // Update database
    await db.transact([
      db.tx.subscriptions[subscription.id].update({
        planId: params.newPlanId,
        clicksLimit: newPlan.clicksLimit,
        updatedAt: Date.now(),
      }),
    ]);

    // Create audit log
    await createAuditLog({
      adminId: params.adminUserId,
      adminEmail: params.adminEmail,
      action: 'subscription.plan_change',
      targetType: 'subscription',
      targetId: subscription.id,
      metadata: {
        reason: params.reason,
        userId: params.userId,
        oldPlanId: subscription.planId,
        newPlanId: params.newPlanId,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Admin change plan error:', error);
    return { success: false, error: error.message || 'Failed to change plan' };
  }
}

/**
 * Reset a user's monthly usage (admin action)
 */
export async function adminResetUsage(params: {
  adminUserId: string;
  adminEmail: string;
  userId: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check permission
    await requirePermission(params.adminUserId, 'user.write');

    const db = await getDb();

    // Get subscription
    const result = await db.query({
      subscriptions: {
        $: {
          where: {
            userId: params.userId,
          },
        },
      },
    });

    const subscription = result.subscriptions?.[0];

    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    // Reset usage
    await db.transact([
      db.tx.subscriptions[subscription.id].update({
        clicksUsed: 0,
        updatedAt: Date.now(),
      }),
    ]);

    // Create audit log
    await createAuditLog({
      adminId: params.adminUserId,
      adminEmail: params.adminEmail,
      action: 'usage.reset',
      targetType: 'subscription',
      targetId: subscription.id,
      metadata: {
        reason: params.reason,
        userId: params.userId,
        previousUsage: subscription.clicksUsed,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Admin reset usage error:', error);
    return { success: false, error: error.message || 'Failed to reset usage' };
  }
}

/**
 * Extend a user's trial period (admin action)
 */
export async function adminExtendTrial(params: {
  adminUserId: string;
  adminEmail: string;
  userId: string;
  days: number;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check permission
    await requirePermission(params.adminUserId, 'user.write');

    const db = await getDb();

    // Get subscription
    const result = await db.query({
      subscriptions: {
        $: {
          where: {
            userId: params.userId,
          },
        },
      },
    });

    const subscription = result.subscriptions?.[0];

    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    // Extend period end
    const extensionMs = params.days * 24 * 60 * 60 * 1000;
    const newPeriodEnd = subscription.currentPeriodEnd + extensionMs;

    await db.transact([
      db.tx.subscriptions[subscription.id].update({
        currentPeriodEnd: newPeriodEnd,
        updatedAt: Date.now(),
      }),
    ]);

    // Create audit log
    await createAuditLog({
      adminId: params.adminUserId,
      adminEmail: params.adminEmail,
      action: 'subscription.trial_extend',
      targetType: 'subscription',
      targetId: subscription.id,
      metadata: {
        reason: params.reason,
        userId: params.userId,
        days: params.days,
        newPeriodEnd,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Admin extend trial error:', error);
    return { success: false, error: error.message || 'Failed to extend trial' };
  }
}

/**
 * Apply credit to a user's account (admin action)
 */
export async function adminApplyCredit(params: {
  adminUserId: string;
  adminEmail: string;
  userId: string;
  clicks: number;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check permission
    await requirePermission(params.adminUserId, 'user.write');

    const db = await getDb();

    // Get subscription
    const result = await db.query({
      subscriptions: {
        $: {
          where: {
            userId: params.userId,
          },
        },
      },
    });

    const subscription = result.subscriptions?.[0];

    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    // Apply credit (increase limit or decrease usage)
    await db.transact([
      db.tx.subscriptions[subscription.id].update({
        clicksLimit: subscription.clicksLimit + params.clicks,
        updatedAt: Date.now(),
      }),
    ]);

    // Create audit log
    await createAuditLog({
      adminId: params.adminUserId,
      adminEmail: params.adminEmail,
      action: 'usage.credit_apply',
      targetType: 'subscription',
      targetId: subscription.id,
      metadata: {
        reason: params.reason,
        userId: params.userId,
        clicks: params.clicks,
        newLimit: subscription.clicksLimit + params.clicks,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Admin apply credit error:', error);
    return { success: false, error: error.message || 'Failed to apply credit' };
  }
}
