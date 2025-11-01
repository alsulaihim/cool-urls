import { NextRequest, NextResponse } from 'next/server';

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

    // Detect build-time execution and return a mock to prevent build failures
    if (!APP_ID || !ADMIN_TOKEN) {
      console.warn('[InstantDB] Credentials not available - returning mock for build');
      return {
        query: async () => ({ urls: [] }),
        transact: async () => ({ txId: 'mock' }),
        tx: new Proxy({}, { get: () => new Proxy({}, { get: () => ({ update: () => ({}) }) }) })
      } as any;
    }

    // Dynamic import to prevent module evaluation during build
    const { init } = await import('@instantdb/admin');
    dbInstance = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });
  }
  return dbInstance;
}

// This endpoint gets URL data WITHOUT tracking clicks (for metadata generation)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params;
    console.log('[URL Data] Looking for shortCode:', shortCode);

    // Query all URLs from InstantDB
    const db = await getDb();
    const result = await db.query({
      urls: {},
    });

    // Find the URL with matching shortCode
    const url = result.urls?.find((u: any) => u.shortCode === shortCode);

    if (!url) {
      return NextResponse.json(
        { error: 'Short URL not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
    });
  } catch (error) {
    console.error('URL data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch URL data' },
      { status: 500 }
    );
  }
}
