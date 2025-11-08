/**
 * Script to completely delete all subscriptions from the database
 *
 * This removes all subscription records as if they never existed
 */

import { init } from '@instantdb/admin';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

// Load environment variables
dotenv.config({ path: '.env.local' });

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID!;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN!;

if (!APP_ID || !ADMIN_TOKEN) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function deleteAllSubscriptions() {
  try {
    console.log('🔍 Fetching all subscriptions...\n');

    const data = await db.query({ subscriptions: {} });
    const subscriptions = data?.subscriptions || [];

    if (subscriptions.length === 0) {
      console.log('✅ No subscriptions found in the database.');
      rl.close();
      return;
    }

    console.log(`Found ${subscriptions.length} subscriptions:\n`);

    subscriptions.forEach((sub: any, index: number) => {
      console.log(`${index + 1}. User ID: ${sub.userId}`);
      console.log(`   Plan: ${sub.planId}`);
      console.log(`   Provider: ${sub.provider}`);
      console.log(`   Status: ${sub.status}\n`);
    });

    const confirmation = await question(
      `⚠️  WARNING: This will PERMANENTLY DELETE all ${subscriptions.length} subscriptions.\nType 'DELETE ALL' to confirm: `
    );

    if (confirmation !== 'DELETE ALL') {
      console.log('\n❌ Deletion cancelled. No changes made.');
      rl.close();
      return;
    }

    console.log('\n🗑️  Deleting all subscriptions...');

    // Delete all subscriptions
    const deleteTransactions = subscriptions.map((sub: any) =>
      db.tx.subscriptions[sub.userId].delete()
    );

    await db.transact(deleteTransactions);

    console.log(`\n✅ Successfully deleted all ${subscriptions.length} subscriptions!`);
    console.log('🎉 The database now has no subscription records.');
    console.log('💡 Users can create new subscriptions by upgrading through the pricing page.');

    rl.close();
  } catch (error) {
    console.error('\n❌ Error:', error);
    rl.close();
    process.exit(1);
  }
}

deleteAllSubscriptions();
