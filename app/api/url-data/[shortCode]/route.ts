import { NextRequest, NextResponse } from 'next/server';
import { init } from '@instantdb/admin';

const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

// This endpoint gets URL data WITHOUT tracking clicks (for metadata generation)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params;
    console.log('[URL Data] Looking for shortCode:', shortCode);

    // Query all URLs from InstantDB
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
