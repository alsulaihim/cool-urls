/**
 * Script to create PayPal subscription plans using REST API
 * Run: npx tsx scripts/create-paypal-plans-api.ts
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com'; // Sandbox

interface Plan {
  name: string;
  description: string;
  price: number;
}

const plans: Plan[] = [
  { name: 'Starter', description: 'Great for individuals and small projects', price: 13 },
  { name: 'Growth', description: 'Ideal for growing businesses', price: 33 },
  { name: 'Business', description: 'For established businesses with high traffic', price: 49 },
  { name: 'Enterprise', description: 'For large organizations', price: 74 },
  { name: 'Scale', description: 'For high-volume applications', price: 129 },
  { name: 'Premium', description: 'For enterprises with massive scale', price: 299 },
];

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

  const data = await response.json();
  return data.access_token;
}

async function createProduct(accessToken: string, plan: Plan): Promise<string> {
  const response = await fetch(`${PAYPAL_API_BASE}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `Cool URLs - ${plan.name}`,
      description: plan.description,
      type: 'SERVICE',
      category: 'SOFTWARE',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to create product: ${JSON.stringify(data)}`);
  }

  return data.id;
}

async function createBillingPlan(accessToken: string, productId: string, plan: Plan): Promise<string> {
  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to create billing plan: ${JSON.stringify(data)}`);
  }

  return data.id;
}

async function createAllPlans() {
  try {
    console.log('🔐 Getting PayPal access token...\n');
    const accessToken = await getAccessToken();
    console.log('✅ Access token obtained\n');

    console.log('Creating PayPal subscription plans...\n');
    console.log('═'.repeat(60));

    const planIds: Record<string, string> = {};

    for (const plan of plans) {
      try {
        console.log(`\n📦 Creating: ${plan.name} ($${plan.price}/month)`);

        // Create product
        console.log('  → Creating product...');
        const productId = await createProduct(accessToken, plan);
        console.log(`  ✓ Product ID: ${productId}`);

        // Create billing plan
        console.log('  → Creating billing plan...');
        const planId = await createBillingPlan(accessToken, productId, plan);
        console.log(`  ✓ Plan ID: ${planId}`);

        planIds[plan.name.toLowerCase()] = planId;

        console.log(`  ✅ ${plan.name} plan created successfully!`);
      } catch (error: any) {
        console.error(`  ❌ Error creating ${plan.name}:`, error.message);
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('\n🎉 All plans created! Copy these IDs to lib/pricing.ts:\n');

    console.log('```typescript');
    Object.entries(planIds).forEach(([name, id]) => {
      console.log(`  ${name}: {`);
      console.log(`    // ... existing config ...`);
      console.log(`    paypalPlanId: '${id}',`);
      console.log(`  },`);
    });
    console.log('```\n');

    console.log('Plan IDs Summary:');
    console.log('─'.repeat(60));
    Object.entries(planIds).forEach(([name, id]) => {
      console.log(`${name.padEnd(15)} → ${id}`);
    });
    console.log('─'.repeat(60));

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

createAllPlans();
