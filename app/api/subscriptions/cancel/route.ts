import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/instant-admin';
import { cancelPayPalSubscription } from '@/lib/paypal';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, reason } = body as {
      subscriptionId: string;
      reason?: string;
    };

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Missing subscription ID' },
        { status: 400 }
      );
    }

    console.log('[Cancel Subscription] Canceling subscription:', subscriptionId);

    const db = await getDb();

    // Get subscription from database
    const result = await db.query({
      subscriptions: {
        $: {
          where: {
            id: subscriptionId,
          },
        },
      },
    });

    const subscription = result.subscriptions?.[0];

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    console.log('[Cancel Subscription] Found subscription:', {
      provider: subscription.provider,
      providerSubscriptionId: subscription.providerSubscriptionId,
      status: subscription.status,
    });

    // Cancel with the provider
    if (subscription.provider === 'stripe' && subscription.providerSubscriptionId) {
      console.log('[Cancel Subscription] Canceling Stripe subscription...');

      try {
        // Cancel at period end (keeps active until end of billing period)
        await stripe.subscriptions.update(subscription.providerSubscriptionId, {
          cancel_at_period_end: true,
          cancellation_details: reason ? {
            comment: reason,
          } : undefined,
        });

        console.log('[Cancel Subscription] Stripe subscription canceled at period end');
      } catch (stripeError: any) {
        console.error('[Cancel Subscription] Stripe error:', stripeError);
        throw new Error(`Failed to cancel Stripe subscription: ${stripeError.message}`);
      }
    } else if (subscription.provider === 'paypal' && subscription.providerSubscriptionId) {
      console.log('[Cancel Subscription] Canceling PayPal subscription...');

      try {
        await cancelPayPalSubscription(subscription.providerSubscriptionId, reason);
        console.log('[Cancel Subscription] PayPal subscription canceled');
      } catch (paypalError: any) {
        console.error('[Cancel Subscription] PayPal error:', paypalError);
        throw new Error(`Failed to cancel PayPal subscription: ${paypalError.message}`);
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid subscription provider or missing provider subscription ID' },
        { status: 400 }
      );
    }

    // Update database to mark subscription as canceling at period end
    await db.transact([
      db.tx.subscriptions[subscriptionId].update({
        cancelAtPeriodEnd: true,
        updatedAt: Date.now(),
      }),
    ]);

    console.log('[Cancel Subscription] Database updated - subscription will cancel at period end');

    return NextResponse.json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
    });
  } catch (error: any) {
    console.error('[Cancel Subscription] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
