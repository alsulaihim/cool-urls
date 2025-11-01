import { NextResponse } from 'next/server';

// Force dynamic rendering (don't pre-render during build)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Type for InstantDB instance
type InstantDBInstance = any;

// Lazy initialization for build-time compatibility
let dbInstance: InstantDBInstance | null = null;

async function getDb() {
  if (!dbInstance) {
    const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
    const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;

    if (!APP_ID || !ADMIN_TOKEN) {
      throw new Error('InstantDB credentials not configured');
    }

    // Dynamic import to prevent module evaluation during build
    const { init } = await import('@instantdb/admin');
    dbInstance = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });
  }
  return dbInstance;
}

export async function GET() {
  try {
    console.log('[Test DB] Querying database...');
    console.log('[Test DB] App ID:', process.env.NEXT_PUBLIC_INSTANT_APP_ID);
    console.log('[Test DB] Admin Token exists:', !!process.env.INSTANT_ADMIN_TOKEN);

    // Query all URLs from InstantDB
    const db = await getDb();
    const result = await db.query({
      urls: {},
    });

    console.log('[Test DB] Query result:', JSON.stringify(result, null, 2));

    return NextResponse.json({
      success: true,
      totalUrls: result.urls?.length || 0,
      urls: result.urls?.map((u: any) => ({
        id: u.id,
        shortCode: u.shortCode,
        originalUrl: u.originalUrl,
        clicks: u.clicks,
        userId: u.userId,
        createdAt: u.createdAt,
      })) || [],
      raw: result,
    });
  } catch (error) {
    console.error('[Test DB] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
