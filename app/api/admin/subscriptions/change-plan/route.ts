import { NextRequest, NextResponse } from 'next/server';
import { adminChangePlan } from '@/lib/admin/subscription-actions';
import type { PlanId } from '@/lib/pricing';

/**
 * Admin API: Change a user's subscription plan
 *
 * POST /api/admin/subscriptions/change-plan
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminUserId, adminEmail, userId, newPlanId, reason } = body as {
      adminUserId: string;
      adminEmail: string;
      userId: string;
      newPlanId: PlanId;
      reason: string;
    };

    if (!adminUserId || !adminEmail || !userId || !newPlanId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await adminChangePlan({
      adminUserId,
      adminEmail,
      userId,
      newPlanId,
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
    console.error('Admin change plan API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
