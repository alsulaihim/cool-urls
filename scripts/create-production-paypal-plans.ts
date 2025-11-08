/**
 * Create Production PayPal Subscription Plans
 *
 * This script creates subscription plans in PRODUCTION PayPal
 * Make sure you have production credentials set in Railway environment
 */

import * as dotenv from 'dotenv';

// Load .env.production with override to ensure production credentials are used
dotenv.config({ path: '.env.production', override: true });

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = 'production'; // Force production mode

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.error('❌ Error: PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set');
  console.error('Please set production credentials in your environment');
  process.exit(1);
}

const PAYPAL_API_BASE = 'https://api-m.paypal.com'; // Production endpoint

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function createProduct(accessToken: string, name: string, description: string): Promise<string> {
  const response = await fetch(`${PAYPAL_API_BASE}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description,
      type: 'SERVICE',
      category: 'SOFTWARE',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create product: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

async function createPlan(
  accessToken: string,
  productId: string,
  planName: string,
  price: number
): Promise<string> {
  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: productId,
      name: planName,
      description: `${planName} subscription plan`,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: {
            interval_unit: 'MONTH',
            interval_count: 1,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // 0 = infinite
          pricing_scheme: {
            fixed_price: {
              value: price.toString(),
              currency_code: 'USD',
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: '0',
          currency_code: 'USD',
        },
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create plan: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

async function main() {
  console.log('🚀 Creating PRODUCTION PayPal Subscription Plans\n');
  console.log('⚠️  WARNING: This will create plans in PRODUCTION PayPal!');
  console.log('📍 API Endpoint:', PAYPAL_API_BASE);
  console.log('🔑 Client ID:', PAYPAL_CLIENT_ID?.substring(0, 20) + '...\n');

  const plans = [
    { name: 'Starter', price: 13, id: 'starter' },
    { name: 'Growth', price: 33, id: 'growth' },
    { name: 'Business', price: 49, id: 'business' },
    { name: 'Enterprise', price: 74, id: 'enterprise' },
    { name: 'Scale', price: 129, id: 'scale' },
    { name: 'Premium', price: 299, id: 'premium' },
  ];

  try {
    console.log('1️⃣  Getting access token...');
    const accessToken = await getAccessToken();
    console.log('✅ Access token obtained\n');

    console.log('2️⃣  Creating product...');
    const productId = await createProduct(
      accessToken,
      'Cool URLs Subscriptions',
      'URL shortening and analytics service subscription plans'
    );
    console.log('✅ Product created:', productId, '\n');

    console.log('3️⃣  Creating subscription plans...\n');
    const results: Array<{ name: string; id: string; planId: string }> = [];

    for (const plan of plans) {
      console.log(`   Creating ${plan.name} plan ($${plan.price}/month)...`);
      const planId = await createPlan(
        accessToken,
        productId,
        `Cool URLs - ${plan.name}`,
        plan.price
      );
      results.push({ name: plan.name, id: plan.id, planId });
      console.log(`   ✅ ${plan.name}: ${planId}\n`);
    }

    console.log('🎉 All plans created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Update lib/pricing.ts with these Plan IDs:\n');

    results.forEach(({ name, id, planId }) => {
      console.log(`  ${id}: {`);
      console.log(`    ...existing fields,`);
      console.log(`    paypalPlanId: '${planId}',`);
      console.log(`  },\n`);
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📝 Copy-paste friendly format:\n');

    results.forEach(({ id, planId }) => {
      console.log(`paypalPlanId: '${planId}', // ${id}`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
