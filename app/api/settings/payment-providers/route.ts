import { NextResponse } from 'next/server';
import { init } from '@instantdb/admin';

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID!;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN!;

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

/**
 * Public API: Get enabled payment providers
 *
 * GET /api/settings/payment-providers
 *
 * Returns which payment providers are currently enabled for customer checkouts
 */
export async function GET() {
  try {
    const data = await db.query({
      appSettings: {},
    });

    // Default to both enabled if no settings exist yet
    let stripeEnabled = true;
    let paypalEnabled = true;

    if (data?.appSettings) {
      const stripeSetting = data.appSettings.find(s => s.key === 'payment.stripe.enabled');
      const paypalSetting = data.appSettings.find(s => s.key === 'payment.paypal.enabled');

      if (stripeSetting) {
        stripeEnabled = stripeSetting.value === 'true';
      }
      if (paypalSetting) {
        paypalEnabled = paypalSetting.value === 'true';
      }
    }

    return NextResponse.json({
      stripe: stripeEnabled,
      paypal: paypalEnabled,
      providers: {
        stripe: {
          enabled: stripeEnabled,
          label: 'Credit Card',
        },
        paypal: {
          enabled: paypalEnabled,
          label: 'PayPal',
        },
      },
    });
  } catch (error) {
    console.error('Get payment providers API error:', error);
    // On error, default to all providers enabled to prevent checkout failures
    return NextResponse.json({
      stripe: true,
      paypal: true,
      providers: {
        stripe: {
          enabled: true,
          label: 'Credit Card',
        },
        paypal: {
          enabled: true,
          label: 'PayPal',
        },
      },
    });
  }
}
