import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe, updateStripeSubscription } from '@/lib/stripe';
import type { PlanId } from '@/lib/pricing';
import { getPlanById } from '@/lib/pricing';

// Force Node.js runtime and dynamic rendering
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Dynamic import to avoid build-time evaluation
  const { updateSubscription, getSubscription } = await import('@/lib/subscription-service');

  try {
    const stripe = getStripe();
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

    // Get current subscription from database to check provider
    const dbSubscription = await getSubscription(userId);
    if (!dbSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Check if this is a MyFatoorah or PayPal subscription
    if (dbSubscription.provider === 'myfatoorah' || dbSubscription.provider === 'paypal') {
      return NextResponse.json(
        {
          error: `Plan changes are not supported for ${dbSubscription.provider} subscriptions. Please cancel your current subscription and subscribe to the new plan.`
        },
        { status: 400 }
      );
    }

    // Get the new plan details
    const newPlan = getPlanById(newPlanId);
    if (!newPlan.stripePriceId) {
      return NextResponse.json(
        { error: 'Plan does not have a Stripe price ID' },
        { status: 400 }
      );
    }

    // Retrieve the current subscription from Stripe
    let currentSubscription: Stripe.Subscription;
    try {
      currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error: unknown) {
      console.error('Error retrieving subscription:', error);
      const message = error instanceof Error ? error.message : 'Subscription not found';
      return NextResponse.json(
        { error: message },
        { status: 404 }
      );
    }

    // Check if already on this plan
    const currentPriceId = currentSubscription.items.data[0].price.id;
    if (currentPriceId === newPlan.stripePriceId) {
      return NextResponse.json(
        { error: 'Already subscribed to this plan' },
        { status: 400 }
      );
    }

    // Update the subscription in Stripe with proration
    let updatedSubscription: Stripe.Subscription;
    try {
      updatedSubscription = await updateStripeSubscription({
        subscriptionId,
        priceId: newPlan.stripePriceId,
      });
    } catch (error: unknown) {
      console.error('Error updating subscription in Stripe:', error);
      const message = error instanceof Error ? error.message : 'Failed to update subscription';
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }

    // Update the subscription in the database
    try {
      await updateSubscription({
        userId,
        subscriptionId,
        newPlanId,
      });
    } catch (error: unknown) {
      console.error('Error updating subscription in database:', error);
      const message = error instanceof Error ? error.message : 'Failed to update database';

      // Try to rollback Stripe change
      try {
        await updateStripeSubscription({
          subscriptionId,
          priceId: currentPriceId,
        });
      } catch (rollbackError) {
        console.error('Failed to rollback Stripe subscription:', rollbackError);
      }

      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        planId: newPlanId,
        status: updatedSubscription.status,
        currentPeriodEnd: (updatedSubscription as any).current_period_end,
      },
    });

  } catch (error: unknown) {
    console.error('Subscription update error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
