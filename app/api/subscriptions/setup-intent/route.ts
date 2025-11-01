import { NextRequest, NextResponse } from 'next/server';
import { stripe, createStripeCustomer } from '@/lib/stripe';

// Force dynamic rendering (don't pre-render during build)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email } = body as {
      userId: string;
      email: string;
    };

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find or create Stripe customer
    let customer;
    try {
      const customers = await stripe.customers.list({ email, limit: 1 });

      if (customers.data.length > 0) {
        customer = customers.data[0];
      } else {
        customer = await createStripeCustomer({
          email,
          userId,
        });
      }
    } catch (error) {
      console.error('Error creating/finding customer:', error);
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      );
    }

    // Create setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      metadata: {
        userId,
      },
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId: customer.id,
    });

  } catch (error: any) {
    console.error('Setup intent creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
