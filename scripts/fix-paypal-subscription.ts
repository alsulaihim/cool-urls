/**
 * Script to fix existing PayPal subscriptions that have clicksLimit: 0
 * Run: npx tsx scripts/fix-paypal-subscription.ts
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

import { getDb } from '../lib/instant-admin';
import { getPlanById } from '../lib/pricing';

async function fixPayPalSubscriptions() {
  try {
    const db = await getDb();

    console.log('Fetching all PayPal subscriptions...\n');

    // Get all PayPal subscriptions
    const result = await db.query({
      subscriptions: {
        $: {
          where: {
            provider: 'paypal',
          },
        },
      },
    });

    const subscriptions = result.subscriptions || [];

    if (subscriptions.length === 0) {
      console.log('No PayPal subscriptions found.');
      return;
    }

    console.log(`Found ${subscriptions.length} PayPal subscription(s).\n`);

    for (const subscription of subscriptions) {
      console.log(`\nSubscription ID: ${subscription.id}`);
      console.log(`  User ID: ${subscription.userId}`);
      console.log(`  Plan ID: ${subscription.planId}`);
      console.log(`  Status: ${subscription.status}`);
      console.log(`  Current clicksLimit: ${subscription.clicksLimit}`);

      // Get the correct plan details
      const plan = getPlanById(subscription.planId as any);

      if (!plan) {
        console.log(`  ❌ Unknown plan ID: ${subscription.planId}`);
        continue;
      }

      // Check if clicksLimit needs fixing
      if (subscription.clicksLimit === 0 || subscription.clicksLimit !== plan.clicksLimit) {
        console.log(`  ⚠️  Fixing clicksLimit from ${subscription.clicksLimit} to ${plan.clicksLimit}...`);

        await db.transact([
          db.tx.subscriptions[subscription.id].update({
            clicksLimit: plan.clicksLimit,
            updatedAt: Date.now(),
          }),
        ]);

        console.log(`  ✅ Fixed! clicksLimit now set to ${plan.clicksLimit}`);
      } else {
        console.log(`  ✓ clicksLimit is correct (${subscription.clicksLimit})`);
      }
    }

    console.log('\n✅ Done fixing PayPal subscriptions!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPayPalSubscriptions();
