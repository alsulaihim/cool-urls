/**
 * Script to completely delete all subscriptions from the database
 *
 * This removes all subscription records as if they never existed
 * No confirmation required - use with caution!
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

async function deleteAllSubscriptions() {
  try {
    console.log('🔍 Fetching all subscriptions...\n');

    const data = await db.query({ subscriptions: {} });
    const subscriptions = data?.subscriptions || [];

    if (subscriptions.length === 0) {
      console.log('✅ No subscriptions found in the database.');
      return;
    }

    console.log(`Found ${subscriptions.length} subscriptions:\n`);

    subscriptions.forEach((sub: any, index: number) => {
      console.log(`${index + 1}. User ID: ${sub.userId}`);
      console.log(`   Plan: ${sub.planId}`);
      console.log(`   Provider: ${sub.provider}`);
      console.log(`   Status: ${sub.status}\n`);
    });

    console.log('🗑️  Deleting all subscriptions...');

    // Delete all subscriptions using subscription ID (not userId)
    const deleteTransactions = subscriptions.map((sub: any) =>
      db.tx.subscriptions[sub.id].delete()
    );

    await db.transact(deleteTransactions);

    console.log(`\n✅ Successfully deleted all ${subscriptions.length} subscriptions!`);
    console.log('🎉 The database now has no subscription records.');
    console.log('💡 Users can create new subscriptions by upgrading through the pricing page.');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

deleteAllSubscriptions();
