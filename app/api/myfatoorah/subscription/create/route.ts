import { NextResponse } from 'next/server';
import { executePayment } from '@/lib/myfatoorah';
import { db } from '@/lib/instant';
import { getDb } from '@/lib/instant-admin';
import { PRICING_PLANS } from '@/lib/pricing';

/**
 * POST /api/myfatoorah/subscription/create
 *
 * Create MyFatoorah subscription after successful payment
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, planId, userId, customerName, customerEmail, invoiceValue, recurringId } = body;

    console.log('🔵 MyFatoorah subscription create request:', { sessionId, planId, userId, customerName, customerEmail, invoiceValue });

    if (!planId || !userId || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: planId, userId, and customerEmail are required' },
        { status: 400 }
      );
    }

    // Validate plan exists
    const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS];
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // Execute payment with MyFatoorah (without sessionId for redirect flow)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const paymentRequest: any = {
      InvoiceValue: invoiceValue || plan.price,
      CustomerName: customerName || customerEmail,
      CustomerEmail: customerEmail,
      CallBackUrl: `${baseUrl}/api/myfatoorah/callback`,
      ErrorUrl: `${baseUrl}/pricing?error=payment_failed`,
      Language: 'en',
      CustomerReference: userId,
      UserDefinedField: planId,
      DisplayCurrencyIso: 'USD',
    };

    // Add SessionId only if provided (for embedded flow)
    if (sessionId) {
      paymentRequest.SessionId = sessionId;
    }

    console.log('🔵 Executing MyFatoorah payment with:', paymentRequest);

    const paymentResult = await executePayment(paymentRequest);

    console.log('🔵 MyFatoorah payment result:', JSON.stringify(paymentResult, null, 2));

    if (!paymentResult.IsSuccess) {
      console.error('❌ MyFatoorah payment failed:', {
        message: paymentResult.Message,
        validationErrors: paymentResult.ValidationErrors,
        fullResponse: paymentResult,
      });
      return NextResponse.json(
        {
          error: paymentResult.Message || 'Payment failed',
          details: paymentResult.ValidationErrors || [],
        },
        { status: 400 }
      );
    }

    // Create subscription record in database
    const adminDb = await getDb();
    const now = Date.now();
    const oneMonthFromNow = now + 30 * 24 * 60 * 60 * 1000;

    // Check if subscription already exists to preserve some fields
    const { subscriptions } = await adminDb.query({
      subscriptions: {
        $: {
          where: {
            userId,
          },
        },
      },
    });

    const existing = subscriptions?.[0];

    const subscriptionData: any = {
      userId, // Always include userId as it's required by InstantDB schema
      planId,
      status: 'active',
      provider: 'myfatoorah',
      providerSubscriptionId: paymentResult.Data.InvoiceId.toString(),
      currentPeriodStart: now,
      currentPeriodEnd: oneMonthFromNow,
      cancelAtPeriodEnd: false,
      clicksLimit: plan.clicksLimit,
      updatedAt: now,
    };

    // Preserve existing data if updating, otherwise initialize
    if (existing) {
      subscriptionData.clicksUsed = existing.clicksUsed;
      subscriptionData.createdAt = existing.createdAt;
    } else {
      subscriptionData.clicksUsed = 0;
      subscriptionData.createdAt = now;
    }

    await adminDb.transact([
      adminDb.tx.subscriptions[userId].update(subscriptionData),
    ]);

    console.log(`✅ ${existing ? 'Updated' : 'Created'} MyFatoorah subscription for user ${userId}`);

    return NextResponse.json({
      success: true,
      invoiceId: paymentResult.Data.InvoiceId,
      paymentURL: paymentResult.Data.PaymentURL,
      recurringId: paymentResult.Data.RecurringId,
      isDirectPayment: paymentResult.Data.IsDirectPayment,
    });

  } catch (error) {
    console.error('MyFatoorah subscription creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
