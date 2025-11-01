import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { UAParser } from 'ua-parser-js';
import { createHash } from 'crypto';

// Force dynamic rendering (don't pre-render during build)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Type for URL object from InstantDB
interface URLData {
  id: string;
  shortCode: string;
  originalUrl: string;
  clicks: number;
  userId: string;
  analyticsData?: string;
  createdAt: number;
}

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

// Helper function to clean up ISP names
function cleanISPName(isp: string): string {
  if (!isp) return isp;

  // Simply remove parenthetical information and extra whitespace
  // Keep the ISP name as-is from the API
  let cleaned = isp
    .replace(/\s*\(.*?\)\s*/g, '') // Remove anything in parentheses
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  return cleaned;
}

// Helper function to get geolocation and ISP data from IP
async function getGeolocation(ip: string) {
  try {
    // If localhost IP, try to get the real public IP first
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' ||
        ip.startsWith('192.168.') || ip.startsWith('10.') ||
        ip.startsWith('172.') || ip.startsWith('::ffff:127.')) {
      console.log('[Geolocation] Localhost IP detected, fetching public IP...');
      try {
        // Get the actual public IP when testing locally
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          ip = ipData.ip;
          console.log('[Geolocation] Using public IP:', ip);
        }
      } catch (e) {
        console.log('[Geolocation] Could not fetch public IP, using original:', ip);
      }
    }

    console.log('[Geolocation] Fetching location for IP:', ip);

    // Using ip-api.com for free geolocation with ISP data (rate limited to 45 requests per minute)
    // Include proxy, mobile, hosting, and timezone fields
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,regionName,lat,lon,isp,org,proxy,mobile,hosting,timezone`, {
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
        isp: data.isp,
        org: data.org,
        isProxy: data.proxy,
        isMobile: data.mobile,
        isHosting: data.hosting,
        timezone: data.timezone,
      };
    } else {
      console.error('[Geolocation] API returned failure status:', data);
    }
  } catch (error) {
    console.error('[Geolocation] Error:', error);
  }
  return null;
}

// Helper function to detect referrer application from user agent and referrer
function detectReferrerApp(userAgent: string, referrer?: string | null): string | undefined {
  const ua = userAgent.toLowerCase();
  const ref = referrer?.toLowerCase() || '';

  // Check referrer URL first (most reliable)
  if (ref.includes('instagram.com') || ref.includes('ig.me')) return 'Instagram';
  if (ref.includes('facebook.com') || ref.includes('fb.com') || ref.includes('fb.me')) return 'Facebook';
  if (ref.includes('twitter.com') || ref.includes('t.co')) return 'Twitter';
  if (ref.includes('linkedin.com') || ref.includes('lnkd.in')) return 'LinkedIn';
  if (ref.includes('reddit.com')) return 'Reddit';
  if (ref.includes('tiktok.com')) return 'TikTok';
  if (ref.includes('pinterest.com') || ref.includes('pin.it')) return 'Pinterest';
  if (ref.includes('youtube.com') || ref.includes('youtu.be')) return 'YouTube';
  if (ref.includes('snapchat.com')) return 'Snapchat';
  if (ref.includes('telegram.org') || ref.includes('t.me')) return 'Telegram';
  if (ref.includes('discord.com') || ref.includes('discord.gg')) return 'Discord';
  if (ref.includes('whatsapp.com')) return 'WhatsApp';
  if (ref.includes('slack.com')) return 'Slack';
  if (ref.includes('messenger.com')) return 'Messenger';

  // Check user agent for in-app browsers
  if (ua.includes('instagram')) return 'Instagram';
  if (ua.includes('fban') || ua.includes('fbav') || ua.includes('fb_iab')) return 'Facebook';
  if (ua.includes('twitter')) return 'Twitter';
  if (ua.includes('linkedin')) return 'LinkedIn';
  if (ua.includes('pinterest')) return 'Pinterest';
  if (ua.includes('whatsapp')) return 'WhatsApp';
  if (ua.includes('snapchat')) return 'Snapchat';
  if (ua.includes('telegram')) return 'Telegram';
  if (ua.includes('tiktok')) return 'TikTok';
  if (ua.includes('discord')) return 'Discord';
  if (ua.includes('line/')) return 'LINE';
  if (ua.includes('kakaotalk')) return 'KakaoTalk';
  if (ua.includes('wechat') || ua.includes('micromessenger')) return 'WeChat';

  // If no specific app detected, return undefined
  return undefined;
}

// Helper to hash IP for privacy
function hashIP(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

// Helper function to detect if a user agent is a bot
function isBot(userAgent: string): boolean {
  if (!userAgent) return false;

  const ua = userAgent.toLowerCase();
  const botPatterns = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python',
    'java', 'apache', 'http', 'monitor', 'check', 'scan', 'test',
    'facebook', 'twitter', 'linkedin', 'pinterest', 'slack',
    'whatsapp', 'telegram', 'discord', 'headless', 'phantom',
    'selenium', 'puppeteer', 'playwright'
  ];

  return botPatterns.some(pattern => ua.includes(pattern));
}

// Helper function to extract primary language from Accept-Language header
function extractLanguage(acceptLanguage: string | null): string | undefined {
  if (!acceptLanguage) return undefined;

  // Accept-Language format: "en-US,en;q=0.9,ar;q=0.8"
  // Extract the first language code
  const primaryLang = acceptLanguage.split(',')[0].split(';')[0].trim();
  return primaryLang || undefined;
}

// Helper function to extract domain from referrer URL
function extractDomain(url: string | null | undefined): string | undefined {
  if (!url) return undefined;

  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return undefined;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params;
    console.log('[Redirect] Looking for shortCode:', shortCode);

    // Query all URLs from InstantDB
    const db = await getDb();
    const result = await db.query({
      urls: {},
    });

    console.log('[Redirect] Query result:', JSON.stringify(result, null, 2));
    console.log('[Redirect] Total URLs found:', result.urls?.length || 0);

    if (result.urls && result.urls.length > 0) {
      console.log('[Redirect] All shortCodes in database:', result.urls.map((u: any) => u.shortCode));
    }

    // Find the URL with matching shortCode
    const url = result.urls?.find((u: any) => u.shortCode === shortCode) as URLData | undefined;

    console.log('[Redirect] Found URL:', url ? JSON.stringify(url, null, 2) : 'null');

    if (!url) {
      console.log('[Redirect] URL not found for shortCode:', shortCode);
      console.log('[Redirect] Available shortCodes:', result.urls?.map((u: any) => u.shortCode).join(', ') || 'none');
      return NextResponse.json(
        { error: 'Short URL not found', shortCode, availableCount: result.urls?.length || 0 },
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

    // Get language
    const acceptLanguage = request.headers.get('accept-language');
    const language = extractLanguage(acceptLanguage);

    // Get geolocation data
    const geoData = await getGeolocation(ip);
    console.log('[Analytics] Geolocation data:', geoData);

    // Detect referrer application
    const referrerApp = detectReferrerApp(userAgent, referrer);
    console.log('[Analytics] Referrer app detected:', referrerApp);

    // Detect if bot
    const botDetected = isBot(userAgent);
    console.log('[Analytics] Bot detected:', botDetected);

    // Extract referrer domain
    const referrerDomain = extractDomain(referrer);

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
        timezone: geoData?.timezone,
        // ISP - cleaned up for better display
        isp: geoData?.isp ? cleanISPName(geoData.isp) : undefined,
        org: geoData?.org,
        // Network type detection
        isProxy: geoData?.isProxy,
        isMobileConnection: geoData?.isMobile,
        isHosting: geoData?.isHosting,
        // Device & Browser
        deviceType: uaResult.device.type || 'desktop',
        os: uaResult.os.name,
        osVersion: uaResult.os.version,
        browser: uaResult.browser.name,
        browserVersion: uaResult.browser.version,
        // Metadata
        referrer: referrer || undefined,
        referrerApp: referrerApp,
        referrerDomain: referrerDomain,
        userAgent: userAgent,
        ipHash: hashIP(ip),
        // New analytics
        language: language,
        isBot: botDetected,
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

      const db = await getDb();
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
