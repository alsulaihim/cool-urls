import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import type { PlanId } from '@/lib/pricing';
import Stripe from 'stripe';

// Force dynamic rendering (don't pre-render during build)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  // Dynamic import to avoid build-time evaluation
  const { createSubscription, updateSubscription, recordPayment, handleSubscriptionExpiration } = await import('@/lib/subscription-service');

  // Get Stripe instance
  const stripe = getStripe();

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
          const userId = (subscription as any).metadata.userId;
          const planId = (subscription as any).metadata.planId as PlanId;

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
        const userId = (subscription as any).metadata.userId;
        const planId = (subscription as any).metadata.planId as PlanId;

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
        const userId = subscription.metadata?.userId;
        const planId = subscription.metadata?.planId as PlanId | undefined;

        if (userId) {
          const updates: any = {
            userId,
          };

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

          // Detect plan change by checking the price ID
          const currentPriceId = subscription.items.data[0]?.price.id;
          if (currentPriceId) {
            // Dynamically import to avoid build-time issues
            const { getPlanByStripePriceId } = await import('@/lib/pricing');
            const newPlan = getPlanByStripePriceId(currentPriceId);

            if (newPlan) {
              updates.planId = newPlan.id;
              console.log(`[Webhook] Plan changed to ${newPlan.id} for user ${userId}`);
            }
          }

          // Fallback to metadata planId if price mapping fails
          if (!updates.planId && planId) {
            updates.planId = planId;
          }

          await updateSubscription(updates);

          console.log(`[Webhook] Subscription updated for user ${userId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = (subscription as any).metadata.userId;

        if (userId) {
          // Downgrade to free plan while preserving clicks used
          await handleSubscriptionExpiration(userId);

          console.log(`[Webhook] Subscription cancelled and downgraded to free for user ${userId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const subscription = invoice.subscription;

        if (subscription && invoice.customer_email) {
          const subscriptionObj = await stripe.subscriptions.retrieve(subscription as string);
          const userId = (subscriptionObj as any).metadata.userId;
          const planId = (subscriptionObj as any).metadata.planId as PlanId;

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
        const invoice = event.data.object as any;
        const subscription = invoice.subscription;

        if (subscription) {
          const subscriptionObj = await stripe.subscriptions.retrieve(subscription as string);
          const userId = (subscriptionObj as any).metadata.userId;
          const planId = (subscriptionObj as any).metadata.planId as PlanId;

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
