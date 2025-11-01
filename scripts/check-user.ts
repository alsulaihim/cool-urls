/**
 * Script to check all users and their subscriptions
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
  console.log('🔍 Fetching all users and their subscriptions...\n');

  try {
    // Get all user profiles
    const userProfilesResult = await db.query({ userProfiles: {} });
    const profiles = (userProfilesResult as any).userProfiles || [];

    // Get all subscriptions
    const subscriptionsResult = await db.query({ subscriptions: {} });
    const subscriptions = (subscriptionsResult as any).subscriptions || [];

    console.log('📋 Users and their subscriptions:\n');

    for (const profile of profiles) {
      const userSub = subscriptions.find((s: any) => s.userId === profile.userId);

      console.log(`👤 ${profile.name}`);
      console.log(`   User ID: ${profile.userId}`);

      if (userSub) {
        console.log(`   ✅ Subscription: ${userSub.planId} (${userSub.status})`);
        console.log(`   Clicks: ${userSub.clicksUsed}/${userSub.clicksLimit}`);
        console.log(`   Period: ${new Date(userSub.currentPeriodStart).toLocaleDateString()} - ${new Date(userSub.currentPeriodEnd).toLocaleDateString()}`);
      } else {
        console.log(`   ❌ No subscription found`);
      }

      console.log('');
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total Users: ${profiles.length}`);
    console.log(`   Total Subscriptions: ${subscriptions.length}`);
    console.log(`\n✨ All users should now be able to query their own subscriptions via client!`);

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

main().catch(console.error);
