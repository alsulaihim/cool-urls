import { NextRequest, NextResponse } from 'next/server';
import { createPayPalSubscription } from '@/lib/paypal';
import { getPlanById } from '@/lib/pricing';
import type { PlanId } from '@/lib/pricing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, planId } = body as {
      userId: string;
      email: string;
      planId: PlanId;
    };

    if (!userId || !planId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const plan = getPlanById(planId);

    if (!plan.paypalPlanId) {
      return NextResponse.json(
        { error: 'PayPal is not configured for this plan' },
        { status: 400 }
      );
    }

    console.log('[PayPal Create] Creating subscription for user:', userId, 'plan:', planId);

    // Create PayPal subscription
    const subscription = await createPayPalSubscription({
      planId: plan.paypalPlanId,
      userId,
      email,
    });

    console.log('[PayPal Create] Subscription created:', subscription.id);

    return NextResponse.json({
      subscriptionId: subscription.id,
    });
  } catch (error: any) {
    console.error('[PayPal Create] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
