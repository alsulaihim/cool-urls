/**
 * Script to create PayPal subscription plans
 * Run: npx tsx scripts/create-paypal-plans.ts
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

import { getPayPal } from '../lib/paypal';
import { PRICING_PLANS } from '../lib/pricing';

async function createPayPalPlans() {
  try {
    const paypal = getPayPal();

    console.log('Creating PayPal subscription plans...\n');

    // Skip free plan
    const paidPlans = Object.values(PRICING_PLANS).filter(plan => plan.price > 0);

    for (const plan of paidPlans) {
      console.log(`Creating plan: ${plan.name} ($${plan.price}/month)...`);

      try {
        // Create product first
        const productRequest = {
          body: {
            name: `Cool URLs - ${plan.name}`,
            description: plan.description,
            type: 'SERVICE',
            category: 'SOFTWARE',
            imageUrl: 'https://hoturl.me/og-image.jpg',
            homeUrl: 'https://hoturl.me',
          },
        };

        const productResponse = await paypal.products.productsCreate(productRequest);
        const productId = productResponse.result.id;
        console.log(`  ✓ Product created: ${productId}`);

        // Create billing plan
        const planRequest = {
          body: {
            productId: productId,
            name: `Cool URLs - ${plan.name}`,
            description: plan.description,
            billingCycles: [
              {
                frequency: {
                  intervalUnit: 'MONTH',
                  intervalCount: 1,
                },
                tenureType: 'REGULAR',
                sequence: 1,
                totalCycles: 0, // Infinite
                pricingScheme: {
                  fixedPrice: {
                    value: plan.price.toString(),
                    currencyCode: 'USD',
                  },
                },
              },
            ],
            paymentPreferences: {
              autoBillOutstanding: true,
              setupFeeFailureAction: 'CONTINUE',
              paymentFailureThreshold: 3,
            },
          },
        };

        const planResponse = await paypal.subscriptions.plansCreate(planRequest);
        const planId = planResponse.result.id;
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
