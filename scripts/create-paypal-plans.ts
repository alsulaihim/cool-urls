/**
 * Script to create PayPal subscription plans
 * Run: npx tsx scripts/create-paypal-plans.ts
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

import { PRICING_PLANS } from '../lib/pricing';

// Helper to get PayPal access token
async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set');
  }

  const paypalMode = process.env.PAYPAL_MODE || 'sandbox';
  const baseUrl = paypalMode === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function createPayPalPlans() {
  try {
    const token = await getAccessToken();
    const paypalMode = process.env.PAYPAL_MODE || 'sandbox';
    const baseUrl = paypalMode === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    console.log(`Creating PayPal subscription plans in ${paypalMode} mode...\n`);

    // Skip free plan
    const paidPlans = Object.values(PRICING_PLANS).filter(plan => plan.price > 0);

    for (const plan of paidPlans) {
      console.log(`Creating plan: ${plan.name} ($${plan.price}/month)...`);

      try {
        // Create product first
        const productResponse = await fetch(`${baseUrl}/v1/catalogs/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: `Cool URLs - ${plan.name}`,
            description: plan.description,
            type: 'SERVICE',
            category: 'SOFTWARE',
            image_url: 'https://hoturl.me/og-image.jpg',
            home_url: 'https://hoturl.me',
          }),
        });

        if (!productResponse.ok) {
          const error = await productResponse.json();
          throw new Error(error.message || productResponse.statusText);
        }

        const product = await productResponse.json();
        const productId = product.id;
        console.log(`  ✓ Product created: ${productId}`);

        // Create billing plan
        const planResponse = await fetch(`${baseUrl}/v1/billing/plans`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            product_id: productId,
            name: `Cool URLs - ${plan.name}`,
            description: plan.description,
            billing_cycles: [
              {
                frequency: {
                  interval_unit: 'MONTH',
                  interval_count: 1,
                },
                tenure_type: 'REGULAR',
                sequence: 1,
                total_cycles: 0, // Infinite
                pricing_scheme: {
                  fixed_price: {
                    value: plan.price.toString(),
                    currency_code: 'USD',
                  },
                },
              },
            ],
            payment_preferences: {
              auto_bill_outstanding: true,
              setup_fee_failure_action: 'CONTINUE',
              payment_failure_threshold: 3,
            },
          }),
        });

        if (!planResponse.ok) {
          const error = await planResponse.json();
          throw new Error(error.message || planResponse.statusText);
        }

        const billingPlan = await planResponse.json();
        const planId = billingPlan.id;
        console.log(`  ✓ Plan created: ${planId}`);
        console.log(`  → Add to lib/pricing.ts: paypalPlanId: '${planId}'\n`);
      } catch (error: any) {
        console.error(`  ✗ Error creating ${plan.name}:`, error.message);
      }
    }

    console.log('\n✅ Done! Copy the plan IDs above and add them to lib/pricing.ts');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createPayPalPlans();
