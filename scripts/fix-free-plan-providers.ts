/**
 * Script to fix free plan subscriptions that incorrectly have payment providers
 *
 * Free plans should have:
 * - provider: 'none'
 * - No providerSubscriptionId
 * - No providerCustomerId
 * - No paypalSubscriptionId
 */

import { init } from '@instantdb/admin';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID!;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN!;

if (!APP_ID || !ADMIN_TOKEN) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

async function fixFreePlanProviders() {
  try {
    console.log('🔍 Finding free plan subscriptions with incorrect providers...\n');

    const data = await db.query({
      subscriptions: {},
    });

    const subscriptions = data?.subscriptions || [];

    // Find free plans with incorrect provider data
    const incorrectSubs = subscriptions.filter(
      (sub: any) => sub.planId === 'free' && sub.provider !== 'none'
    );

    if (incorrectSubs.length === 0) {
      console.log('✅ No free plan subscriptions with incorrect providers found!');
      return;
    }

    console.log(`Found ${incorrectSubs.length} free plan subscriptions with incorrect providers:\n`);

    incorrectSubs.forEach((sub: any, index: number) => {
      console.log(`${index + 1}. User ID: ${sub.userId}`);
      console.log(`   Current Provider: ${sub.provider} (should be 'none')`);
      if (sub.providerSubscriptionId) {
        console.log(`   Has providerSubscriptionId: ${sub.providerSubscriptionId}`);
      }
      if (sub.providerCustomerId) {
        console.log(`   Has providerCustomerId: ${sub.providerCustomerId}`);
      }
      if (sub.paypalSubscriptionId) {
        console.log(`   Has paypalSubscriptionId: ${sub.paypalSubscriptionId}`);
      }
      console.log('');
    });

    console.log('🔧 Fixing these subscriptions...\n');

    // Fix each subscription
    const fixTransactions = incorrectSubs.map((sub: any) =>
      db.tx.subscriptions[sub.userId].update({
        provider: 'none',
        providerSubscriptionId: null,
        providerCustomerId: null,
        paypalSubscriptionId: null,
        updatedAt: Date.now(),
      })
    );

    await db.transact(fixTransactions);

    console.log('✅ Successfully fixed all free plan subscriptions!');
    console.log(`\n📊 Fixed ${incorrectSubs.length} subscriptions:`);

    incorrectSubs.forEach((sub: any, index: number) => {
      console.log(`${index + 1}. User ID: ${sub.userId} - provider set to 'none'`);
    });

    console.log('\n🎉 All free plans now correctly have provider: "none"');

  } catch (error) {
    console.error('Error fixing free plan providers:', error);
    process.exit(1);
  }
}

fixFreePlanProviders();
