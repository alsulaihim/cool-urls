/**
 * Script to list users and create a subscription
 */

import { init } from '@instantdb/admin';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as readline from 'readline';

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🔍 Fetching all users...\n');

  try {
    // Get all user profiles
    const userProfilesResult = await db.query({ userProfiles: {} });
    const profiles = (userProfilesResult as any).userProfiles || [];

    if (profiles.length === 0) {
      console.log('❌ No users found in database');
      rl.close();
      return;
    }

    console.log('📋 Available users:\n');
    profiles.forEach((p: any, index: number) => {
      console.log(`${index + 1}. ${p.name || 'Unknown'}`);
      console.log(`   User ID: ${p.userId}`);
      console.log(`   Created: ${new Date(p.createdAt).toLocaleString()}\n`);
    });

    // Ask which user
    const userChoice = await question('Enter user number (1-' + profiles.length + '): ');
    const userIndex = parseInt(userChoice) - 1;

    if (userIndex < 0 || userIndex >= profiles.length) {
      console.log('❌ Invalid user number');
      rl.close();
      return;
    }

    const selectedUser = profiles[userIndex];
    console.log(`\n✅ Selected: ${selectedUser.name} (${selectedUser.userId})\n`);

    // Available plans
    console.log('Available plans:');
    console.log('1. free - Free plan (1,000 clicks/mo)');
    console.log('2. growth - Growth plan (50,000 clicks/mo)');
    console.log('3. enterprise - Enterprise plan (unlimited clicks)\n');

    const planInput = await question('Enter plan (free/growth/enterprise): ');
    const planId = planInput.trim().toLowerCase() as 'free' | 'growth' | 'enterprise';

    if (!['free', 'growth', 'enterprise'].includes(planId)) {
      console.log('❌ Invalid plan. Must be: free, growth, or enterprise');
      rl.close();
      return;
    }

    // Set click limits
    const clickLimits = {
      free: 1000,
      growth: 50000,
      enterprise: 999999999,
    };

    const now = Date.now();
    const oneMonthFromNow = now + 30 * 24 * 60 * 60 * 1000;

    console.log(`\n📝 Creating ${planId} subscription for ${selectedUser.name}...`);

    await db.transact([
      db.tx.subscriptions[selectedUser.userId].update({
        userId: selectedUser.userId,
        planId,
        status: 'active',
        provider: 'stripe',
        providerSubscriptionId: `manual_${Date.now()}`,
        providerCustomerId: `manual_customer_${selectedUser.userId}`,
        currentPeriodStart: now,
        currentPeriodEnd: oneMonthFromNow,
        cancelAtPeriodEnd: false,
        clicksUsed: 0,
        clicksLimit: clickLimits[planId],
        createdAt: now,
        updatedAt: now,
      }),
    ]);

    console.log('\n✅ Subscription created successfully!');
    console.log('\n📊 Subscription Details:');
    console.log(`  User: ${selectedUser.name}`);
    console.log(`  User ID: ${selectedUser.userId}`);
    console.log(`  Plan: ${planId}`);
    console.log(`  Clicks Limit: ${clickLimits[planId].toLocaleString()}/month`);
    console.log(`  Status: active`);
    console.log(`  Period: ${new Date(now).toLocaleDateString()} - ${new Date(oneMonthFromNow).toLocaleDateString()}`);
    console.log('\n🎉 The user should now see the correct plan in their navbar!');
    console.log('💡 Have the user refresh their browser to see the changes.');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    rl.close();
  }
}

main();
