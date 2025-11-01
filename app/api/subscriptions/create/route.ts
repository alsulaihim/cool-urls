import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, createStripeCustomer, createStripeSubscription } from '@/lib/stripe';
import type { PlanId } from '@/lib/pricing';
import { getPlanById } from '@/lib/pricing';

export async function POST(request: NextRequest) {
  // Dynamic import to avoid build-time evaluation
  const { createSubscription, recordPayment } = await import('@/lib/subscription-service');
  try {
    const body = await request.json();
    const { userId, email, planId, paymentMethodId } = body as {
      userId: string;
      email: string;
      planId: PlanId;
      paymentMethodId: string;
    };

    // Validate required fields
    if (!userId || !email || !planId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the plan details
    const plan = getPlanById(planId);
    if (!plan.stripePriceId) {
      return NextResponse.json(
        { error: 'Plan does not have a Stripe price ID' },
        { status: 400 }
      );
    }

    // Create or retrieve Stripe customer
    let customer;
    try {
      // Try to find existing customer by email
      const customers = await stripe.customers.list({ email, limit: 1 });

      if (customers.data.length > 0) {
        customer = customers.data[0];
      } else {
        // Create new customer
        customer = await createStripeCustomer({
          email,
          userId,
        });
      }
    } catch (error: any) {
      console.error('Error creating/finding customer:', error);
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      );
    }

    // Attach payment method to customer
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });

      // Set as default payment method
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    } catch (error: any) {
      console.error('Error attaching payment method:', error);
      return NextResponse.json(
        { error: 'Failed to attach payment method' },
        { status: 500 }
      );
    }

    // Create subscription
    let subscription;
    try {
      subscription = await createStripeSubscription({
        customerId: customer.id,
        priceId: plan.stripePriceId,
        metadata: {
          userId,
          planId,
        },
      });
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    // Get the latest invoice and payment intent
    const latestInvoice = subscription.latest_invoice;
    if (!latestInvoice || typeof latestInvoice === 'string') {
      return NextResponse.json(
        { error: 'Invalid invoice data' },
        { status: 500 }
      );
    }

    // Cast to any to access payment_intent property
    const paymentIntent = (latestInvoice as any).payment_intent as Stripe.PaymentIntent | string | null;
    if (!paymentIntent || typeof paymentIntent === 'string') {
      return NextResponse.json(
        { error: 'Invalid payment intent data' },
        { status: 500 }
      );
    }

    // Check if payment requires confirmation (3D Secure)
    if (paymentIntent?.status === 'requires_action' || paymentIntent?.status === 'requires_confirmation') {
      return NextResponse.json({
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
        subscriptionId: subscription.id,
      });
    }

    // Payment is processing or requires payment method
    if (paymentIntent?.status === 'requires_payment_method' || paymentIntent?.status === 'processing') {
      return NextResponse.json({
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
        subscriptionId: subscription.id,
      });
    }

    // Payment succeeded or subscription is active/trialing
    if (
      paymentIntent?.status === 'succeeded' ||
      subscription.status === 'active' ||
      subscription.status === 'trialing'
    ) {
      // Save subscription to database
      await createSubscription({
        userId,
        planId,
        provider: 'stripe',
        providerSubscriptionId: subscription.id,
        providerCustomerId: customer.id,
      });

      // Record the payment if there is one
      if (paymentIntent && latestInvoice && paymentIntent.status === 'succeeded') {
        await recordPayment({
          userId,
          subscriptionId: subscription.id,
          provider: 'stripe',
          providerPaymentId: paymentIntent.id,
          amount: latestInvoice.amount_paid,
          currency: latestInvoice.currency,
          status: 'succeeded',
          planId,
        });
      }

      return NextResponse.json({
        success: true,
        subscriptionId: subscription.id,
        customerId: customer.id,
      });
    }

    // Log detailed error information for debugging
    console.error('Unexpected payment/subscription state:', {
      paymentIntentStatus: paymentIntent?.status,
      subscriptionStatus: subscription.status,
      subscriptionId: subscription.id,
    });

    // Payment failed or unexpected state
    return NextResponse.json(
      { error: `Payment failed with status: ${paymentIntent?.status || 'unknown'}` },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
