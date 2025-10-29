import { NextResponse } from 'next/server';
import { init } from '@instantdb/admin';

const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

export async function GET() {
  try {
    console.log('[Test DB] Querying database...');
    console.log('[Test DB] App ID:', process.env.NEXT_PUBLIC_INSTANT_APP_ID);
    console.log('[Test DB] Admin Token exists:', !!process.env.INSTANT_ADMIN_TOKEN);

    // Query all URLs from InstantDB
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
