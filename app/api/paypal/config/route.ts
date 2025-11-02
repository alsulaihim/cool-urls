import { NextResponse } from 'next/server';
import { getPayPalClientId } from '@/lib/paypal';

export async function GET() {
  try {
    const clientId = getPayPalClientId();

    return NextResponse.json({ clientId });
  } catch (error: any) {
    console.error('[PayPal Config] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get PayPal configuration' },
      { status: 500 }
    );
  }
}
