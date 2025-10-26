import { NextRequest, NextResponse } from 'next/server';
import { init } from '@instantdb/admin';
import { v4 as uuidv4 } from 'uuid';
import { UAParser } from 'ua-parser-js';
import { createHash } from 'crypto';

const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

// Helper function to get geolocation data from IP
async function getGeolocation(ip: string) {
  try {
    // For localhost/private IPs, return mock data for testing
    if (ip === '127.0.0.1' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      console.log('[Geolocation] Using mock data for local IP:', ip);
      return {
        country: 'United States',
        city: 'San Francisco',
        region: 'California',
        latitude: 37.7749,
        longitude: -122.4194,
      };
    }

    console.log('[Geolocation] Fetching location for IP:', ip);

    // Using ip-api.com for free geolocation (rate limited to 45 requests per minute)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,regionName,lat,lon`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('[Geolocation] API response not OK:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('[Geolocation] API response:', data);

    if (data.status === 'success') {
      return {
        country: data.country,
        city: data.city,
        region: data.regionName,
        latitude: data.lat,
        longitude: data.lon,
      };
    } else {
      console.error('[Geolocation] API returned failure status:', data);
    }
  } catch (error) {
    console.error('[Geolocation] Error:', error);
  }
  return null;
}

// Helper to hash IP for privacy
function hashIP(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

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

    // Parse user agent
    const userAgent = request.headers.get('user-agent') || '';
    const parser = new UAParser(userAgent);
    const uaResult = parser.getResult();

    // Get IP address
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                request.headers.get('x-real-ip') ||
                '127.0.0.1';

    // Get referrer
    const referrer = request.headers.get('referer') || request.headers.get('referrer');

    // Get geolocation data
    const geoData = await getGeolocation(ip);
    console.log('[Analytics] Geolocation data:', geoData);

    // Increment click count and save analytics
    try {
      const newClickData = {
        id: uuidv4(),
        timestamp: Date.now(),
        // Geolocation
        country: geoData?.country,
        city: geoData?.city,
        region: geoData?.region,
        latitude: geoData?.latitude,
        longitude: geoData?.longitude,
        // Device & Browser
        deviceType: uaResult.device.type || 'desktop',
        os: uaResult.os.name,
        osVersion: uaResult.os.version,
        browser: uaResult.browser.name,
        browserVersion: uaResult.browser.version,
        // Metadata
        referrer: referrer || undefined,
        userAgent: userAgent,
        ipHash: hashIP(ip),
      };

      console.log('[Analytics] Saving analytics:', newClickData);

      // Parse existing analytics data
      let analyticsArray = [];
      try {
        if (url.analyticsData) {
          analyticsArray = JSON.parse(url.analyticsData);
        }
      } catch (e) {
        console.error('[Analytics] Error parsing existing analytics:', e);
      }

      // Add new click data
      analyticsArray.push(newClickData);

      // Keep only last 1000 clicks to prevent data bloat
      if (analyticsArray.length > 1000) {
        analyticsArray = analyticsArray.slice(-1000);
      }

      await db.transact([
        db.tx.urls[url.id].update({
          clicks: (url.clicks || 0) + 1,
          analyticsData: JSON.stringify(analyticsArray),
        }),
      ]);
      console.log('[Analytics] Click analytics saved successfully for:', shortCode);
    } catch (updateError) {
      console.error('Error saving analytics:', updateError);
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
