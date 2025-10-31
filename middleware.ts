/**
 * Middleware - Route handling and admin subdomain detection
 *
 * Handles:
 * - Admin subdomain routing (admin.hoturl.me → /admin)
 * - Admin authentication verification
 * - Production security enforcement
 * - Main app routing
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  const isProduction = process.env.NODE_ENV === 'production';

  // Detect admin subdomain or port
  const isAdminDomain = hostname.startsWith('admin.') || hostname.includes(':3001') || hostname.includes(':8088');
  const isAdminPath = pathname.startsWith('/admin');
  const isAdminLoginPath = pathname === '/admin/login';

  // Check if running on Railway or other platform without custom domain
  const isRailwayDomain = hostname.includes('.railway.app') || hostname.includes('.up.railway.app');
  const isVercelDomain = hostname.includes('.vercel.app');
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  const isPlatformDomain = isRailwayDomain || isVercelDomain || isLocalhost;

  // Production: Enforce admin subdomain requirement (only for custom domains)
  // Exception: Allow /admin/login to be accessible from any domain
  // Exception: Allow platform domains (Railway, Vercel, localhost) to access /admin directly
  if (isProduction && isAdminPath && !isAdminLoginPath && !isAdminDomain && !isPlatformDomain) {
    // Only redirect for custom domains (e.g., hoturl.me)
    const adminUrl = new URL(request.url);
    adminUrl.hostname = `admin.${adminUrl.hostname.replace(/^(www\.)?/, '')}`;
    adminUrl.port = '8088';
    return NextResponse.redirect(adminUrl);
  }

  // Production: Block non-admin paths on admin subdomain
  if (isProduction && isAdminDomain && !isAdminPath && pathname !== '/' && !pathname.startsWith('/_next')) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // If accessing admin subdomain/port and not already on /admin
  if (isAdminDomain && !isAdminPath) {
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Add security headers for admin routes
  if (isAdminPath || isAdminDomain) {
    const response = NextResponse.next();

    // Security headers for admin panel
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    if (isProduction) {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    return response;
  }

  // Allow all other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

