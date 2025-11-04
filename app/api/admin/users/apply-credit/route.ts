import { NextRequest, NextResponse } from 'next/server';
import { adminApplyCredit } from '@/lib/admin/subscription-actions';

/**
 * Admin API: Apply credit to a user's account
 *
 * POST /api/admin/users/apply-credit
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminUserId, adminEmail, userId, clicks, reason } = body as {
      adminUserId: string;
      adminEmail: string;
      userId: string;
      clicks: number;
      reason: string;
    };

    if (!adminUserId || !adminEmail || !userId || !clicks || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (clicks <= 0) {
      return NextResponse.json(
        { error: 'Credit amount must be positive' },
        { status: 400 }
      );
    }

    const result = await adminApplyCredit({
      adminUserId,
      adminEmail,
      userId,
      clicks,
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
    console.error('Admin apply credit API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
