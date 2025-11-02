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

    console.log('[PayPal Activate] Subscription status:', subscription.status);

    if (subscription.status !== 'ACTIVE' && subscription.status !== 'APPROVED') {
      return NextResponse.json(
        { error: `Subscription is not active. Status: ${subscription.status}` },
        { status: 400 }
      );
    }

    // Get plan ID from PayPal plan ID
    const plan = getPlanByPayPalPlanId(subscription.planId);

    if (!plan) {
      return NextResponse.json(
        { error: 'Unknown subscription plan' },
        { status: 400 }
      );
    }

    console.log('[PayPal Activate] Plan identified:', plan.id);

    // Save subscription to database
    const db = await getDb();

    // Check if subscription already exists
    const existingSubscription = await db.query({
      subscriptions: {
        $: {
          where: {
            paypalSubscriptionId: subscriptionId,
          },
        },
      },
    });

    if (existingSubscription.subscriptions && existingSubscription.subscriptions.length > 0) {
      console.log('[PayPal Activate] Subscription already exists');
      return NextResponse.json({ success: true });
    }

    // Create new subscription record
    await db.transact([
      db.tx.subscriptions[crypto.randomUUID()].update({
        userId,
        planId: plan.id,
        provider: 'paypal',
        paypalSubscriptionId: subscriptionId,
        status: 'active',
        clicksUsed: 0,
        currentPeriodStart: Date.now(),
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    ]);

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
