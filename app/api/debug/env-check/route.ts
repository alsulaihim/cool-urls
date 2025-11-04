import { NextResponse } from 'next/server';

export async function GET() {
  // Check which environment variables are set (without exposing values)
  const envVars = {
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_SECRET_KEY_PREFIX: process.env.STRIPE_SECRET_KEY?.substring(0, 7) || 'NOT_SET',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    PAYPAL_CLIENT_ID: !!process.env.PAYPAL_CLIENT_ID,
    PAYPAL_CLIENT_SECRET: !!process.env.PAYPAL_CLIENT_SECRET,
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    INSTANT_ADMIN_TOKEN: !!process.env.INSTANT_ADMIN_TOKEN,
    NEXT_PUBLIC_INSTANT_APP_ID: !!process.env.NEXT_PUBLIC_INSTANT_APP_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET',
    NODE_ENV: process.env.NODE_ENV,
  };

  return NextResponse.json({
    message: 'Environment variables check',
    environment: envVars,
    timestamp: new Date().toISOString(),
  });
}
