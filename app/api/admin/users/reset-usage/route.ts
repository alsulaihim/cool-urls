import { NextRequest, NextResponse } from 'next/server';
import { adminResetUsage } from '@/lib/admin/subscription-actions';

/**
 * Admin API: Reset a user's monthly usage
 *
 * POST /api/admin/users/reset-usage
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminUserId, adminEmail, userId, reason } = body as {
      adminUserId: string;
      adminEmail: string;
      userId: string;
      reason: string;
    };

    if (!adminUserId || !adminEmail || !userId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await adminResetUsage({
      adminUserId,
      adminEmail,
      userId,
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
    console.error('Admin reset usage API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
