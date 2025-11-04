import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/instant-admin';
import { cancelPayPalSubscription } from '@/lib/paypal';
import { getStripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const stripe = getStripe();
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
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    });

    // Check if subscription is already marked for cancellation
    if (subscription.cancelAtPeriodEnd) {
      console.log('[Cancel Subscription] Subscription is already scheduled for cancellation');
      return NextResponse.json({
        success: true,
        message: 'Subscription is already scheduled to be canceled at the end of the billing period',
      });
    }

    // Cancel with the provider
    if (subscription.provider === 'stripe' && subscription.providerSubscriptionId) {
      console.log('[Cancel Subscription] Canceling Stripe subscription...');

      try {
        // First check the current status of the Stripe subscription
        let stripeSubscription;
        try {
          stripeSubscription = await stripe.subscriptions.retrieve(subscription.providerSubscriptionId);
        } catch (retrieveError: any) {
          console.error('[Cancel Subscription] Error retrieving subscription:', retrieveError);

          // If subscription doesn't exist in Stripe, consider it cancelled
          if (retrieveError.statusCode === 404 || retrieveError.type === 'invalid_request_error') {
            await db.transact([
              db.tx.subscriptions[subscriptionId].update({
                cancelAtPeriodEnd: true,
                status: 'cancelled',
                updatedAt: Date.now(),
              }),
            ]);

            return NextResponse.json({
              success: true,
              message: 'Subscription is already canceled',
            });
          }
          throw retrieveError;
        }

        console.log('[Cancel Subscription] Stripe subscription status:', {
          status: stripeSubscription.status,
          cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        });

        // If already cancelled or scheduled for cancellation, don't try to cancel again
        if (stripeSubscription.status === 'canceled' ||
            stripeSubscription.status === 'cancelled' ||
            stripeSubscription.cancel_at_period_end === true) {
          console.log('[Cancel Subscription] Stripe subscription is already cancelled or scheduled for cancellation');
          // Just update our database to reflect this
          await db.transact([
            db.tx.subscriptions[subscriptionId].update({
              cancelAtPeriodEnd: true,
              updatedAt: Date.now(),
            }),
          ]);

          return NextResponse.json({
            success: true,
            message: 'Subscription is already scheduled to be canceled at the end of the billing period',
          });
        }

        // Cancel at period end (keeps active until end of billing period)
        await stripe.subscriptions.update(subscription.providerSubscriptionId, {
          cancel_at_period_end: true,
          cancellation_details: reason ? {
            comment: reason,
          } : undefined,
        });

        console.log('[Cancel Subscription] Stripe subscription canceled at period end');
      } catch (stripeError: any) {
        console.error('[Cancel Subscription] Stripe error:', {
          message: stripeError.message,
          type: stripeError.type,
          code: stripeError.code,
        });

        // Check if the error is about subscription already being cancelled
        const errorMessage = stripeError.message?.toLowerCase() || '';
        if (errorMessage.includes('canceled subscription') ||
            errorMessage.includes('cancellation_details') ||
            errorMessage.includes('can only update') ||
            stripeError.code === 'resource_missing') {
          console.log('[Cancel Subscription] Subscription already cancelled, updating database');

          // Update database to reflect cancellation
          await db.transact([
            db.tx.subscriptions[subscriptionId].update({
              cancelAtPeriodEnd: true,
              updatedAt: Date.now(),
            }),
          ]);

          return NextResponse.json({
            success: true,
            message: 'Subscription is already scheduled to be canceled at the end of the billing period',
          });
        }

        throw new Error(`Failed to cancel Stripe subscription: ${stripeError.message}`);
      }
    } else if (subscription.provider === 'paypal' && subscription.providerSubscriptionId) {
      console.log('[Cancel Subscription] Canceling PayPal subscription...');

      try {
        await cancelPayPalSubscription(subscription.providerSubscriptionId, reason);
        console.log('[Cancel Subscription] PayPal subscription canceled');
      } catch (paypalError: any) {
        console.error('[Cancel Subscription] PayPal error:', paypalError);

        // If PayPal returns an error that subscription is already cancelled, handle gracefully
        if (paypalError.message?.includes('SUBSCRIPTION_STATUS_INVALID') ||
            paypalError.message?.includes('already') ||
            paypalError.message?.includes('cancelled')) {
          console.log('[Cancel Subscription] PayPal subscription is already cancelled');
          // Update our database to reflect this
          await db.transact([
            db.tx.subscriptions[subscriptionId].update({
              cancelAtPeriodEnd: true,
              updatedAt: Date.now(),
            }),
          ]);

          return NextResponse.json({
            success: true,
            message: 'Subscription is already scheduled to be canceled at the end of the billing period',
          });
        }

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
