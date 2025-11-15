import { NextRequest, NextResponse } from 'next/server';
import type { PlanId } from '@/lib/pricing';
import { getPlanById } from '@/lib/pricing';

// Force Node.js runtime and dynamic rendering
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/subscriptions/change-plan
 *
 * Handles plan changes for MyFatoorah and PayPal subscriptions
 * by canceling the current subscription and initiating a new one.
 *
 * For Stripe subscriptions, it delegates to the regular update endpoint.
 */
export async function POST(request: NextRequest) {
  // Dynamic import to avoid build-time evaluation
  const { getSubscription } = await import('@/lib/subscription-service');
  const { getDb } = await import('@/lib/instant-admin');

  try {
    const body = await request.json();

    const { userId, subscriptionId, newPlanId } = body as {
      userId: string;
      subscriptionId: string;
      newPlanId: PlanId;
    };

    // Validate required fields
    if (!userId || !subscriptionId || !newPlanId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, subscriptionId, or newPlanId' },
        { status: 400 }
      );
    }

    // Get current subscription from database
    const currentSubscription = await getSubscription(userId);
    if (!currentSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Get the new plan details
    const newPlan = getPlanById(newPlanId);

    console.log(`[Change Plan] User ${userId} changing from ${currentSubscription.planId} to ${newPlanId} (provider: ${currentSubscription.provider})`);

    // For Stripe subscriptions, delegate to the regular update endpoint
    if (currentSubscription.provider === 'stripe') {
      console.log('[Change Plan] Stripe subscription - delegating to update endpoint');

      // Forward to the update endpoint
      const updateResponse = await fetch(new URL('/api/subscriptions/update', request.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, subscriptionId, newPlanId }),
      });

      return updateResponse;
    }

    // For MyFatoorah and PayPal, cancel the current subscription
    if (currentSubscription.provider === 'myfatoorah' || currentSubscription.provider === 'paypal') {
      console.log(`[Change Plan] Canceling ${currentSubscription.provider} subscription`);

      const db = await getDb();
      const now = Date.now();

      // Cancel the current subscription immediately (don't wait for period end)
      // This allows the user to subscribe to a new plan right away
      await db.transact([
        db.tx.subscriptions[userId].update({
          status: 'cancelled',
          cancelAtPeriodEnd: true,
          provider: 'none',
          providerSubscriptionId: undefined,
          providerCustomerId: undefined,
          cancelledAt: now,
          updatedAt: now,
        }),
      ]);

      console.log(`[Change Plan] Cancelled ${currentSubscription.provider} subscription, ready for new subscription`);

      // Return success with instruction to show checkout
      return NextResponse.json({
        success: true,
        requiresCheckout: true,
        newPlanId,
        message: `Your ${currentSubscription.provider} subscription has been cancelled. Please complete payment for the new ${newPlan.name} plan.`,
      });
    }

    // For cancelled or 'none' provider subscriptions
    if (currentSubscription.provider === 'none' || !currentSubscription.provider) {
      console.log('[Change Plan] Already cancelled - ready for new subscription');

      return NextResponse.json({
        success: true,
        requiresCheckout: true,
        newPlanId,
        message: `Please complete payment for the ${newPlan.name} plan.`,
      });
    }

    // Shouldn't reach here, but handle unknown providers
    return NextResponse.json(
      { error: 'Unsupported subscription provider' },
      { status: 400 }
    );

  } catch (error: unknown) {
    console.error('[Change Plan] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
