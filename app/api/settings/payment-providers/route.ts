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

    // Default to Stripe and PayPal enabled, MyFatoorah disabled
    let stripeEnabled = true;
    let paypalEnabled = true;
    let myFatoorahEnabled = false;

    if (data?.appSettings) {
      const stripeSetting = data.appSettings.find((s: any) => s.key === 'payment.stripe.enabled');
      const paypalSetting = data.appSettings.find((s: any) => s.key === 'payment.paypal.enabled');
      const myFatoorahSetting = data.appSettings.find((s: any) => s.key === 'payment.myfatoorah.enabled');

      if (stripeSetting) {
        stripeEnabled = stripeSetting.value === 'true';
      }
      if (paypalSetting) {
        paypalEnabled = paypalSetting.value === 'true';
      }
      if (myFatoorahSetting) {
        myFatoorahEnabled = myFatoorahSetting.value === 'true';
      }
    }

    return NextResponse.json({
      stripe: stripeEnabled,
      paypal: paypalEnabled,
      myfatoorah: myFatoorahEnabled,
      providers: {
        stripe: {
          enabled: stripeEnabled,
          label: 'Credit Card',
        },
        paypal: {
          enabled: paypalEnabled,
          label: 'PayPal',
        },
        myfatoorah: {
          enabled: myFatoorahEnabled,
          label: 'MyFatoorah',
        },
      },
    });
  } catch (error) {
    console.error('Get payment providers API error:', error);
    // On error, default to Stripe and PayPal enabled
    return NextResponse.json({
      stripe: true,
      paypal: true,
      myfatoorah: false,
      providers: {
        stripe: {
          enabled: true,
          label: 'Credit Card',
        },
        paypal: {
          enabled: true,
          label: 'PayPal',
        },
        myfatoorah: {
          enabled: false,
          label: 'MyFatoorah',
        },
      },
    });
  }
}
