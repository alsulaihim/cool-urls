import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createSubscription, updateSubscription, recordPayment } from '@/lib/subscription-service';
import type { PlanId } from '@/lib/pricing';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not set');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    console.log(`[Webhook] Received event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('[Webhook] Checkout session completed:', session.id);

        if (session.mode === 'subscription' && session.subscription) {
          const subscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id;

          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata.userId;
          const planId = subscription.metadata.planId as PlanId;

          if (userId && planId) {
            await createSubscription({
              userId,
              planId,
              provider: 'stripe',
              providerSubscriptionId: subscription.id,
              providerCustomerId: subscription.customer as string,
            });

            console.log(`[Webhook] Created subscription for user ${userId}, plan ${planId}`);
          }
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;
        const planId = subscription.metadata.planId as PlanId;

        if (userId && planId) {
          await createSubscription({
            userId,
            planId,
            provider: 'stripe',
            providerSubscriptionId: subscription.id,
            providerCustomerId: subscription.customer as string,
          });

          console.log(`[Webhook] Subscription created for user ${userId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;

        if (userId) {
          const updates: any = {};

          // Map Stripe status to our status
          if (subscription.status === 'active') {
            updates.status = 'active';
          } else if (subscription.status === 'past_due') {
            updates.status = 'past_due';
          } else if (subscription.status === 'canceled') {
            updates.status = 'cancelled';
          }

          updates.cancelAtPeriodEnd = (subscription as any).cancel_at_period_end;
          updates.currentPeriodEnd = (subscription as any).current_period_end * 1000; // Convert to ms

          // Check if plan changed
          if ((subscription as any).items.data[0]?.price.metadata.planId) {
            updates.planId = (subscription as any).items.data[0].price.metadata.planId as PlanId;
          }

          await updateSubscription({
            userId,
            ...updates,
          });

          console.log(`[Webhook] Subscription updated for user ${userId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;

        if (userId) {
          await updateSubscription({
            userId,
            status: 'cancelled',
          });

          console.log(`[Webhook] Subscription cancelled for user ${userId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = invoice.subscription;

        if (subscription && invoice.customer_email) {
          const subscriptionObj = await stripe.subscriptions.retrieve(subscription as string);
          const userId = subscriptionObj.metadata.userId;
          const planId = subscriptionObj.metadata.planId as PlanId;

          if (userId && planId) {
            await recordPayment({
              userId,
              subscriptionId: subscription as string,
              provider: 'stripe',
              providerPaymentId: invoice.payment_intent as string,
              amount: invoice.amount_paid,
              currency: invoice.currency,
              status: 'succeeded',
              planId,
              metadata: {
                invoiceId: invoice.id,
                invoiceNumber: invoice.number,
              },
            });

            console.log(`[Webhook] Payment succeeded for user ${userId}: $${invoice.amount_paid / 100}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = invoice.subscription;

        if (subscription) {
          const subscriptionObj = await stripe.subscriptions.retrieve(subscription as string);
          const userId = subscriptionObj.metadata.userId;
          const planId = subscriptionObj.metadata.planId as PlanId;

          if (userId && planId) {
            // Update subscription status to past_due
            await updateSubscription({
              userId,
              status: 'past_due',
            });

            // Record failed payment
            await recordPayment({
              userId,
              subscriptionId: subscription as string,
              provider: 'stripe',
              providerPaymentId: invoice.payment_intent as string,
              amount: invoice.amount_due,
              currency: invoice.currency,
              status: 'failed',
              planId,
              metadata: {
                invoiceId: invoice.id,
                failureMessage: invoice.last_finalization_error?.message,
              },
            });

            console.log(`[Webhook] Payment failed for user ${userId}`);
          }
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('[Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
