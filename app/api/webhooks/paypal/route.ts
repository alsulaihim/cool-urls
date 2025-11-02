import { NextRequest, NextResponse } from 'next/server';
import { verifyPayPalWebhook, getPayPalSubscription } from '@/lib/paypal';
import { getDb } from '@/lib/instant-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = Object.fromEntries(request.headers.entries());

    console.log('[PayPal Webhook] Received event:', body.event_type);

    // Verify webhook signature (recommended for production)
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (webhookId) {
      try {
        const verification = await verifyPayPalWebhook({
          webhookId,
          headers,
          body,
        });

        if (verification.verificationStatus !== 'SUCCESS') {
          console.error('[PayPal Webhook] Verification failed');
          return NextResponse.json(
            { error: 'Webhook verification failed' },
            { status: 401 }
          );
        }
      } catch (error) {
        console.error('[PayPal Webhook] Verification error:', error);
        // In development, you might want to skip verification
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json(
            { error: 'Webhook verification failed' },
            { status: 401 }
          );
        }
      }
    }

    const db = await getDb();
    const eventType = body.event_type;
    const resource = body.resource;

    // Handle different webhook events
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        console.log('[PayPal Webhook] Subscription activated:', resource.id);

        // Update subscription status
        const subscriptions = await db.query({
          subscriptions: {
            $: {
              where: {
                paypalSubscriptionId: resource.id,
              },
            },
          },
        });

        if (subscriptions.subscriptions && subscriptions.subscriptions.length > 0) {
          const subscription = subscriptions.subscriptions[0];
          await db.transact([
            db.tx.subscriptions[subscription.id].update({
              status: 'active',
              updatedAt: Date.now(),
            }),
          ]);
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        console.log('[PayPal Webhook] Subscription cancelled/expired:', resource.id);

        const subscriptions = await db.query({
          subscriptions: {
            $: {
              where: {
                paypalSubscriptionId: resource.id,
              },
            },
          },
        });

        if (subscriptions.subscriptions && subscriptions.subscriptions.length > 0) {
          const subscription = subscriptions.subscriptions[0];
          await db.transact([
            db.tx.subscriptions[subscription.id].update({
              status: eventType === 'BILLING.SUBSCRIPTION.CANCELLED' ? 'canceled' : 'expired',
              canceledAt: Date.now(),
              updatedAt: Date.now(),
            }),
          ]);
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        console.log('[PayPal Webhook] Subscription suspended:', resource.id);

        const subscriptions = await db.query({
          subscriptions: {
            $: {
              where: {
                paypalSubscriptionId: resource.id,
              },
            },
          },
        });

        if (subscriptions.subscriptions && subscriptions.subscriptions.length > 0) {
          const subscription = subscriptions.subscriptions[0];
          await db.transact([
            db.tx.subscriptions[subscription.id].update({
              status: 'past_due',
              updatedAt: Date.now(),
            }),
          ]);
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.UPDATED': {
        console.log('[PayPal Webhook] Subscription updated:', resource.id);

        // Fetch full subscription details
        const paypalSubscription = await getPayPalSubscription(resource.id);

        const subscriptions = await db.query({
          subscriptions: {
            $: {
              where: {
                paypalSubscriptionId: resource.id,
              },
            },
          },
        });

        if (subscriptions.subscriptions && subscriptions.subscriptions.length > 0) {
          const subscription = subscriptions.subscriptions[0];

          // Update subscription details
          const updates: any = {
            updatedAt: Date.now(),
          };

          if (paypalSubscription.billingInfo?.nextBillingTime) {
            updates.currentPeriodEnd = new Date(paypalSubscription.billingInfo.nextBillingTime).getTime();
          }

          await db.transact([
            db.tx.subscriptions[subscription.id].update(updates),
          ]);
        }
        break;
      }

      case 'PAYMENT.SALE.COMPLETED': {
        console.log('[PayPal Webhook] Payment completed for subscription:', resource.billing_agreement_id);

        // Reset clicks for the new billing period
        if (resource.billing_agreement_id) {
          const subscriptions = await db.query({
            subscriptions: {
              $: {
                where: {
                  paypalSubscriptionId: resource.billing_agreement_id,
                },
              },
            },
          });

          if (subscriptions.subscriptions && subscriptions.subscriptions.length > 0) {
            const subscription = subscriptions.subscriptions[0];

            await db.transact([
              db.tx.subscriptions[subscription.id].update({
                clicksUsed: 0,
                currentPeriodStart: Date.now(),
                currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
                updatedAt: Date.now(),
              }),
            ]);
          }
        }
        break;
      }

      default:
        console.log('[PayPal Webhook] Unhandled event type:', eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[PayPal Webhook] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
