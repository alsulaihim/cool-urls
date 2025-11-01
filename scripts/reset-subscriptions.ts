/**
 * Script to reset all subscriptions to free plan
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
  console.log('🔍 Checking current subscriptions...\n');

  try {
    // Get all subscriptions
    const subsResult = await db.query({ subscriptions: {} });
    const subscriptions = (subsResult as any).subscriptions || [];

    console.log(`Found ${subscriptions.length} existing subscriptions\n`);

    if (subscriptions.length > 0) {
      console.log('📋 Current subscriptions:');
      subscriptions.forEach((sub: any, index: number) => {
        console.log(`${index + 1}. User ID: ${sub.userId}`);
        console.log(`   Plan: ${sub.planId}`);
        console.log(`   Status: ${sub.status}\n`);
      });

      console.log('🗑️  Deleting all subscriptions...');

      // Delete all subscriptions
      const deleteTransactions = subscriptions.map((sub: any) =>
        db.tx.subscriptions[sub.userId].delete()
      );

      await db.transact(deleteTransactions);

      console.log('✅ All subscriptions deleted!');
    } else {
      console.log('ℹ️  No subscriptions found to delete');
    }

    // Get all user profiles
    const userProfilesResult = await db.query({ userProfiles: {} });
    const profiles = (userProfilesResult as any).userProfiles || [];

    console.log(`\n🔄 Creating free plan subscriptions for all ${profiles.length} users...\n`);

    const now = Date.now();
    const oneMonthFromNow = now + 30 * 24 * 60 * 60 * 1000;

    // Create free plan for all users
    const createTransactions = profiles.map((profile: any) =>
      db.tx.subscriptions[profile.userId].update({
        userId: profile.userId,
        planId: 'free',
        status: 'active',
        provider: 'stripe',
        providerSubscriptionId: `manual_free_${Date.now()}_${profile.userId}`,
        providerCustomerId: `manual_customer_${profile.userId}`,
        currentPeriodStart: now,
        currentPeriodEnd: oneMonthFromNow,
        cancelAtPeriodEnd: false,
        clicksUsed: 0,
        clicksLimit: 1000,
        createdAt: now,
        updatedAt: now,
      })
    );

    await db.transact(createTransactions);

    console.log('✅ All users reset to free plan!');
    console.log('\n📊 Reset complete:');
    profiles.forEach((p: any, index: number) => {
      console.log(`${index + 1}. ${p.name} - Free plan (1,000 clicks/mo)`);
    });

    console.log('\n🎉 All subscriptions have been reset to free!');
    console.log('💡 You can now upgrade to your desired plan through the pricing page.');

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

main().catch(console.error);
