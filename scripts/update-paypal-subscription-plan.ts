/**
 * Script to update a PayPal subscription to the correct plan
 * Run: npx tsx scripts/update-paypal-subscription-plan.ts <userId> <newPlanId>
 *
 * Example: npx tsx scripts/update-paypal-subscription-plan.ts c048fa16-c793-41b0-b0c7-c0d0255c81bd growth
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

import { getDb } from '../lib/instant-admin';
import { getPlanById, PRICING_PLANS, type PlanId } from '../lib/pricing';

async function updatePayPalSubscription() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.log('\n📋 Usage:');
      console.log('  npx tsx scripts/update-paypal-subscription-plan.ts <userId> <newPlanId>');
      console.log('\n📋 Available plans:');
      Object.values(PRICING_PLANS).forEach(plan => {
        console.log(`  - ${plan.id}: ${plan.name} ($${plan.price}/month, ${plan.clicksLimit.toLocaleString()} clicks)`);
      });
      console.log('\n📋 Showing all PayPal subscriptions:\n');
    }

    const userId = args[0];
    const newPlanId = args[1] as PlanId;

    const db = await getDb();

    // Get all PayPal subscriptions or filter by userId
    const query = userId ? {
      subscriptions: {
        $: {
          where: {
            provider: 'paypal',
            userId: userId,
          },
        },
      },
    } : {
      subscriptions: {
        $: {
          where: {
            provider: 'paypal',
          },
        },
      },
    };

    const result = await db.query(query);
    const subscriptions = result.subscriptions || [];

    if (subscriptions.length === 0) {
      console.log(userId ? `No PayPal subscriptions found for user: ${userId}` : 'No PayPal subscriptions found.');
      return;
    }

    console.log(`Found ${subscriptions.length} PayPal subscription(s):\n`);

    for (const subscription of subscriptions) {
      const plan = getPlanById(subscription.planId as PlanId);
      console.log(`Subscription ID: ${subscription.id}`);
      console.log(`  User ID: ${subscription.userId}`);
      console.log(`  Current Plan: ${subscription.planId} (${plan?.name || 'Unknown'})`);
      console.log(`  Status: ${subscription.status}`);
      console.log(`  Clicks Used: ${subscription.clicksUsed}`);
      console.log(`  Clicks Limit: ${subscription.clicksLimit}`);
      console.log(`  PayPal Subscription ID: ${subscription.providerSubscriptionId || 'N/A'}`);
      console.log(`  Created At: ${new Date(subscription.createdAt).toLocaleString()}`);
      console.log('');
    }

    // If newPlanId is provided, update the subscription
    if (newPlanId) {
      const newPlan = getPlanById(newPlanId);

      if (!newPlan) {
        console.error(`❌ Invalid plan ID: ${newPlanId}`);
        console.log('\n📋 Available plans:');
        Object.values(PRICING_PLANS).forEach(plan => {
          console.log(`  - ${plan.id}: ${plan.name} ($${plan.price}/month, ${plan.clicksLimit.toLocaleString()} clicks)`);
        });
        return;
      }

      if (subscriptions.length === 0) {
        console.log('❌ No subscription found to update');
        return;
      }

      const subscription = subscriptions[0];

      console.log(`\n⚠️  Updating subscription to: ${newPlan.name}`);
      console.log(`  New clicks limit: ${newPlan.clicksLimit.toLocaleString()}`);
      console.log(`  New price: $${newPlan.price}/month`);

      await db.transact([
        db.tx.subscriptions[subscription.id].update({
          planId: newPlanId,
          clicksLimit: newPlan.clicksLimit,
          updatedAt: Date.now(),
        }),
      ]);

      console.log('\n✅ Subscription updated successfully!');
      console.log('\n📋 Updated subscription details:');
      console.log(`  Plan: ${newPlan.name}`);
      console.log(`  Clicks Limit: ${newPlan.clicksLimit.toLocaleString()}`);
      console.log(`  Price: $${newPlan.price}/month`);
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updatePayPalSubscription();
