/**
 * Script to check detailed subscription information
 */

import { init } from '@instantdb/admin';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID!;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN!;

if (!APP_ID || !ADMIN_TOKEN) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

async function main() {
  console.log('🔍 Fetching detailed subscription information...\n');

  try {
    // Get all subscriptions
    const subscriptionsResult = await db.query({ subscriptions: {} });
    const subscriptions = (subscriptionsResult as any).subscriptions || [];

    console.log('📋 Detailed subscription data:\n');

    for (const sub of subscriptions) {
      console.log(`Subscription ID: ${sub.id}`);
      console.log(`  User ID: ${sub.userId}`);
      console.log(`  Plan ID: ${sub.planId}`);
      console.log(`  Status: ${sub.status}`);
      console.log(`  Provider: ${sub.provider || 'N/A'}`);
      console.log(`  Provider Sub ID: ${sub.providerSubscriptionId || 'MISSING'}`);
      console.log(`  Cancel at Period End: ${sub.cancelAtPeriodEnd || false}`);
      console.log(`  Clicks: ${sub.clicksUsed}/${sub.clicksLimit}`);
      console.log('');
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total Subscriptions: ${subscriptions.length}`);
    console.log(`   With Provider Sub ID: ${subscriptions.filter((s: any) => s.providerSubscriptionId).length}`);
    console.log(`   Without Provider Sub ID: ${subscriptions.filter((s: any) => !s.providerSubscriptionId).length}`);

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

main().catch(console.error);
