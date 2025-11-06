import { NextRequest, NextResponse } from 'next/server';
import { getPayPalSubscription } from '@/lib/paypal';
import { getDb } from '@/lib/instant-admin';
import { getPlanByPayPalPlanId } from '@/lib/pricing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, userId } = body as {
      subscriptionId: string;
      userId: string;
    };

    if (!subscriptionId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('[PayPal Activate] Activating subscription:', subscriptionId, 'for user:', userId);

    // Get subscription details from PayPal
    const subscription = await getPayPalSubscription(subscriptionId);

    console.log('[PayPal Activate] Subscription details:', JSON.stringify(subscription, null, 2));
    console.log('[PayPal Activate] Subscription status:', subscription.status);

    if (subscription.status !== 'ACTIVE' && subscription.status !== 'APPROVED') {
      return NextResponse.json(
        { error: `Subscription is not active. Status: ${subscription.status}` },
        { status: 400 }
      );
    }

    // Get plan ID from PayPal plan ID (PayPal API returns plan_id with underscore)
    const paypalPlanId = subscription.plan_id || subscription.planId;
    console.log('[PayPal Activate] PayPal plan ID:', paypalPlanId);

    const plan = getPlanByPayPalPlanId(paypalPlanId);

    if (!plan) {
      return NextResponse.json(
        { error: 'Unknown subscription plan' },
        { status: 400 }
      );
    }

    console.log('[PayPal Activate] Plan identified:', plan.id);

    // Save subscription to database
    const db = await getDb();

    // Check if subscription already exists by provider subscription ID
    const existingByProvider = await db.query({
      subscriptions: {
        $: {
          where: {
            providerSubscriptionId: subscriptionId,
          },
        },
      },
    });

    if (existingByProvider.subscriptions && existingByProvider.subscriptions.length > 0) {
      console.log('[PayPal Activate] Subscription already exists by provider ID');
      return NextResponse.json({ success: true });
    }

    // Check if user already has a subscription
    const existingByUser = await db.query({
      subscriptions: {
        $: {
          where: {
            userId,
          },
        },
      },
    });

    const now = Date.now();
    const oneMonthFromNow = now + 30 * 24 * 60 * 60 * 1000; // 30 days

    if (existingByUser.subscriptions && existingByUser.subscriptions.length > 0) {
      // User already has a subscription - update it
      const existingSub = existingByUser.subscriptions[0];
      console.log('[PayPal Activate] User already has a subscription, updating it');

      await db.transact([
        db.tx.subscriptions[existingSub.id].update({
          planId: plan.id,
          provider: 'paypal',
          providerSubscriptionId: subscriptionId,
          status: 'active',
          clicksLimit: plan.clicksLimit,
          cancelAtPeriodEnd: false,
          currentPeriodStart: now,
          currentPeriodEnd: oneMonthFromNow,
          updatedAt: now,
        }),
      ]);

      console.log('[PayPal Activate] Subscription updated in database');
    } else {
      // Create new subscription record
      console.log('[PayPal Activate] Creating new subscription');

      await db.transact([
        db.tx.subscriptions[crypto.randomUUID()].update({
          userId,
          planId: plan.id,
          provider: 'paypal',
          providerSubscriptionId: subscriptionId,
          status: 'active',
          clicksUsed: 0,
          clicksLimit: plan.clicksLimit,
          cancelAtPeriodEnd: false,
          currentPeriodStart: now,
          currentPeriodEnd: oneMonthFromNow,
          createdAt: now,
          updatedAt: now,
        }),
      ]);
    }

    console.log('[PayPal Activate] Subscription saved to database');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PayPal Activate] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to activate subscription' },
      { status: 500 }
    );
  }
}
