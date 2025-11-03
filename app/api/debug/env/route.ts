import { NextResponse } from 'next/server';

export async function GET() {
  // Only allow in development or with a secret key
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  return NextResponse.json({
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? '✅ Set (length: ' + process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.length + ')' : '❌ Not set',
    googleClientName: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_NAME || '❌ Not set',
    appleClientName: process.env.NEXT_PUBLIC_APPLE_CLIENT_NAME || '❌ Not set',
    appleServiceId: process.env.NEXT_PUBLIC_APPLE_SERVICE_ID ? '✅ Set' : '❌ Not set',
    nodeEnv: process.env.NODE_ENV,
  });
}
