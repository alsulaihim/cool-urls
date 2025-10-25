// Configuration for the application

/**
 * Get the base URL for short links
 * Falls back to current origin if no custom domain is set
 */
export function getShortUrlBase(): string {
  // Check if we're in browser
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_SHORT_DOMAIN || 'https://localhost:3000';
  }

  // Use custom short domain if provided, otherwise use current origin
  return process.env.NEXT_PUBLIC_SHORT_DOMAIN || window.location.origin;
}

/**
 * Get the display domain (without protocol) for showing to users
 */
export function getDisplayDomain(): string {
  const baseUrl = getShortUrlBase();
  return baseUrl.replace(/^https?:\/\//, '');
}
