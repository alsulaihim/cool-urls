import { NextRequest, NextResponse } from 'next/server';
import { adminCancelSubscription } from '@/lib/admin/subscription-actions';

/**
 * Admin API: Cancel a subscription
 *
 * POST /api/admin/subscriptions/cancel
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminUserId, adminEmail, subscriptionId, reason } = body as {
      adminUserId: string;
      adminEmail: string;
      subscriptionId: string;
      reason: string;
    };

    if (!adminUserId || !adminEmail || !subscriptionId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await adminCancelSubscription({
      adminUserId,
      adminEmail,
      subscriptionId,
      reason,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin cancel subscription API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
