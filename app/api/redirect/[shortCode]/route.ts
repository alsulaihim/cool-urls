import { NextRequest, NextResponse } from 'next/server';
import { init } from '@instantdb/admin';

const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params;
    console.log('Looking for shortCode:', shortCode);

    // Query all URLs from InstantDB
    const result = await db.query({
      urls: {},
    });

    console.log('Query result:', result);
    console.log('Total URLs found:', result.urls?.length || 0);

    // Find the URL with matching shortCode
    const url = result.urls?.find((u: any) => u.shortCode === shortCode);

    console.log('Found URL:', url);

    if (!url) {
      console.log('URL not found for shortCode:', shortCode);
      return NextResponse.json(
        { error: 'Short URL not found' },
        { status: 404 }
      );
    }

    // Increment click count
    try {
      await db.transact([
        db.tx.urls[url.id].update({
          clicks: (url.clicks || 0) + 1,
        }),
      ]);
      console.log('Click count incremented for:', shortCode);
    } catch (updateError) {
      console.error('Error updating click count:', updateError);
      // Continue anyway, redirect is more important
    }

    return NextResponse.json({
      originalUrl: url.originalUrl,
    });
  } catch (error) {
    console.error('Redirect error:', error);
    return NextResponse.json(
      { error: 'Failed to redirect', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
