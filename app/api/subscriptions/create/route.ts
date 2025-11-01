import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe, createStripeCustomer } from '@/lib/stripe';
import type { PlanId } from '@/lib/pricing';
import { getPlanById } from '@/lib/pricing';

// Force Node.js runtime and dynamic rendering
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Dynamic import to avoid build-time evaluation
  const { createSubscription, recordPayment } = await import('@/lib/subscription-service');
  try {
    // Get Stripe instance
    const stripe = getStripe();

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
    let customer: Stripe.Customer;
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
    } catch (error: unknown) {
      console.error('Error creating/finding customer:', error);
      const message = error instanceof Error ? error.message : 'Failed to create customer';
      return NextResponse.json(
        { error: message },
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
    } catch (error: unknown) {
      console.error('Error attaching payment method:', error);
      const message = error instanceof Error ? error.message : 'Failed to attach payment method';
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }

    // Create subscription with immediate payment
    let subscription: Stripe.Subscription;
    try {
      subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: plan.stripePriceId }],
        default_payment_method: paymentMethodId,
        metadata: {
          userId,
          planId,
        },
        expand: ['latest_invoice.payment_intent'],
      });
    } catch (error: unknown) {
      console.error('Error creating subscription:', error);
      const message = error instanceof Error ? error.message : 'Failed to create subscription';
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }

    // Get the latest invoice and payment intent
    const latestInvoice = subscription.latest_invoice;

    // Handle case where subscription is active/trialing without payment required
    if (!latestInvoice || typeof latestInvoice === 'string') {
      // If subscription is active or trialing, save it even without an invoice
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        await createSubscription({
          userId,
          planId,
          provider: 'stripe',
          providerSubscriptionId: subscription.id,
          providerCustomerId: customer.id,
        });

        return NextResponse.json({
          success: true,
          subscriptionId: subscription.id,
          customerId: customer.id,
        });
      }

      return NextResponse.json(
        { error: 'Invalid invoice data' },
        { status: 500 }
      );
    }

    // Type the expanded invoice properly - payment_intent is expanded from the subscription query
    const invoice = latestInvoice as Stripe.Invoice & {
      payment_intent: Stripe.PaymentIntent | string | null;
    };

    const paymentIntentRaw = invoice.payment_intent;

    // Handle case where there's no payment intent (e.g., $0 invoice)
    if (!paymentIntentRaw || typeof paymentIntentRaw === 'string') {
      // Check if subscription is already active
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        await createSubscription({
          userId,
          planId,
          provider: 'stripe',
          providerSubscriptionId: subscription.id,
          providerCustomerId: customer.id,
        });

        return NextResponse.json({
          success: true,
          subscriptionId: subscription.id,
          customerId: customer.id,
        });
      }

      return NextResponse.json(
        { error: 'Invalid payment intent data' },
        { status: 500 }
      );
    }

    const paymentIntent = paymentIntentRaw as Stripe.PaymentIntent;

    // Check if payment requires confirmation (3D Secure)
    if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_confirmation') {
      return NextResponse.json({
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
        subscriptionId: subscription.id,
      });
    }

    // Payment is processing or requires payment method
    if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'processing') {
      return NextResponse.json({
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
        subscriptionId: subscription.id,
      });
    }

    // Payment succeeded or subscription is active/trialing
    if (
      paymentIntent.status === 'succeeded' ||
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
      if (paymentIntent.status === 'succeeded') {
        await recordPayment({
          userId,
          subscriptionId: subscription.id,
          provider: 'stripe',
          providerPaymentId: paymentIntent.id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
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
      paymentIntentStatus: paymentIntent.status,
      subscriptionStatus: subscription.status,
      subscriptionId: subscription.id,
    });

    // Payment failed or unexpected state
    return NextResponse.json(
      { error: `Payment failed with status: ${paymentIntent.status}` },
      { status: 400 }
    );

  } catch (error: unknown) {
    console.error('Subscription creation error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
