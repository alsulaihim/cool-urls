import { NextResponse } from 'next/server';
import { init } from '@instantdb/admin';

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID!;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN!;

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

/**
 * Admin API: Get all subscriptions with user data
 *
 * GET /api/admin/subscriptions
 *
 * Returns all subscriptions in the system (bypasses client permissions)
 */
export async function GET() {
  try {
    const data = await db.query({
      subscriptions: {},
      userProfiles: {},
    });

    return NextResponse.json({
      subscriptions: data?.subscriptions || [],
      userProfiles: data?.userProfiles || [],
    });
  } catch (error) {
    console.error('Get admin subscriptions API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
