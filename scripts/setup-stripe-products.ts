/**
 * Automated Stripe Product Setup Script
 *
 * This script creates all 6 pricing plans in your Stripe account
 * and outputs the Price IDs you need to add to lib/pricing.ts
 */

import Stripe from 'stripe';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly
config({ path: resolve(process.cwd(), '.env.local') });

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ Error: STRIPE_SECRET_KEY not found in .env.local');
  console.log('\nPlease add your Stripe secret key to .env.local:');
  console.log('STRIPE_SECRET_KEY=sk_test_...\n');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

const plans = [
  {
    name: 'Starter Plan',
    description: 'Up to 1,000 clicks per month - Branded URLs',
    price: 1300, // $13.00 in cents
    planId: 'starter',
  },
  {
    name: 'Growth Plan',
    description: 'Up to 25,000 clicks per month - Branded URLs',
    price: 3300, // $33.00 in cents
    planId: 'growth',
  },
  {
    name: 'Business Plan',
    description: 'Up to 50,000 clicks per month - Branded URLs',
    price: 4900, // $49.00 in cents
    planId: 'business',
  },
  {
    name: 'Enterprise Plan',
    description: 'Up to 100,000 clicks per month - Branded URLs',
    price: 7400, // $74.00 in cents
    planId: 'enterprise',
  },
  {
    name: 'Scale Plan',
    description: 'Up to 500,000 clicks per month - Branded URLs',
    price: 12900, // $129.00 in cents
    planId: 'scale',
  },
  {
    name: 'Premium Plan',
    description: 'Up to 1,000,000+ clicks per month - Branded URLs',
    price: 29900, // $299.00 in cents
    planId: 'premium',
  },
];

async function setupStripeProducts() {
  console.log('🚀 Setting up Stripe products...\n');
  console.log('━'.repeat(60));

  const priceIds: Record<string, string> = {};

  for (const plan of plans) {
    try {
      console.log(`\n📦 Creating product: ${plan.name}`);

      // Create product
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: {
          planId: plan.planId,
        },
      });

      console.log(`   ✅ Product created: ${product.id}`);

      // Create price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price,
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        metadata: {
          planId: plan.planId,
        },
      });

      console.log(`   ✅ Price created: ${price.id}`);
      console.log(`   💰 Price: $${(plan.price / 100).toFixed(2)}/month`);

      priceIds[plan.planId] = price.id;
    } catch (error: any) {
      console.error(`   ❌ Error creating ${plan.name}:`, error.message);
    }
  }

  console.log('\n' + '━'.repeat(60));
  console.log('\n✅ All products created successfully!\n');

  console.log('📋 Copy these Price IDs to lib/pricing.ts:\n');
  console.log('━'.repeat(60));
  console.log('\nexport const PRICING_PLANS: Record<PlanId, PricingPlan> = {');
  console.log('  // ... free plan stays the same');

  for (const [planId, priceId] of Object.entries(priceIds)) {
    const plan = plans.find(p => p.planId === planId);
    console.log(`\n  ${planId}: {`);
    console.log(`    // ... existing fields`);
    console.log(`    stripePriceId: '${priceId}', // $${(plan!.price / 100).toFixed(2)}/month`);
    console.log(`  },`);
  }

  console.log('};\n');
  console.log('━'.repeat(60));

  console.log('\n📝 Quick Copy Format:\n');
  for (const [planId, priceId] of Object.entries(priceIds)) {
    console.log(`${planId}: stripePriceId: '${priceId}',`);
  }

  console.log('\n✅ Setup complete! Next steps:');
  console.log('   1. Update lib/pricing.ts with the Price IDs above');
  console.log('   2. Set up webhooks: stripe listen --forward-to localhost:3000/api/webhooks/stripe');
  console.log('   3. Add STRIPE_WEBHOOK_SECRET to .env.local');
  console.log('   4. Start building the pricing page!\n');
}

setupStripeProducts().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
