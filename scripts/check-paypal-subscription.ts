/**
 * Script to check PayPal subscription details from PayPal API
 * Run: npx tsx scripts/check-paypal-subscription.ts <subscriptionId>
 *
 * Example: npx tsx scripts/check-paypal-subscription.ts I-69854HWKNKU0
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

import { getPayPalSubscription } from '../lib/paypal';
import { getPlanByPayPalPlanId, PRICING_PLANS } from '../lib/pricing';

async function checkPayPalSubscription() {
  try {
    const subscriptionId = process.argv[2];

    if (!subscriptionId) {
      console.log('\n📋 Usage:');
      console.log('  npx tsx scripts/check-paypal-subscription.ts <subscriptionId>');
      console.log('\n📋 Example:');
      console.log('  npx tsx scripts/check-paypal-subscription.ts I-69854HWKNKU0');
      return;
    }

    console.log(`\n🔍 Fetching subscription details from PayPal API...\n`);
    console.log(`Subscription ID: ${subscriptionId}\n`);

    const subscription = await getPayPalSubscription(subscriptionId);

    console.log('📋 PayPal Subscription Details:\n');
    console.log(JSON.stringify(subscription, null, 2));

    console.log('\n\n📊 Parsed Details:\n');
    console.log(`Status: ${subscription.status}`);
    console.log(`Plan ID: ${subscription.plan_id || subscription.planId || 'N/A'}`);

    const planId = subscription.plan_id || subscription.planId;

    if (planId) {
      const plan = getPlanByPayPalPlanId(planId);
      if (plan) {
        console.log(`\n✅ Matched Plan: ${plan.name}`);
        console.log(`   Plan ID: ${plan.id}`);
        console.log(`   Price: $${plan.price}/month`);
        console.log(`   Clicks Limit: ${plan.clicksLimit.toLocaleString()}`);
      } else {
        console.log(`\n⚠️  No matching plan found in pricing.ts for PayPal Plan ID: ${planId}`);
        console.log('\n📋 Available PayPal Plan IDs in pricing.ts:');
        Object.values(PRICING_PLANS).forEach(p => {
          if (p.paypalPlanId) {
            console.log(`  - ${p.paypalPlanId}: ${p.name}`);
          }
        });
      }
    }

    if (subscription.subscriber) {
      console.log(`\nSubscriber Email: ${subscription.subscriber.email_address || 'N/A'}`);
    }

    if (subscription.billing_info) {
      console.log(`\nBilling Info:`);
      console.log(`  Next Billing Time: ${subscription.billing_info.next_billing_time || 'N/A'}`);
      console.log(`  Last Payment Amount: ${subscription.billing_info.last_payment?.amount?.value || 'N/A'} ${subscription.billing_info.last_payment?.amount?.currency_code || ''}`);
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

checkPayPalSubscription();
