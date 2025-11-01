/**
 * Script to manually create a subscription for a user
 * Use this if the payment succeeded but subscription wasn't created
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

async function createUserSubscription() {
  console.log('🎯 Create User Subscription\n');
  console.log('Available plans:');
  console.log('1. free - Free plan (1,000 clicks/mo)');
  console.log('2. growth - Growth plan (50,000 clicks/mo)');
  console.log('3. enterprise - Enterprise plan (unlimited clicks)\n');

  try {
    // Get user email
    const email = await question('Enter user email: ');

    // Find user
    const userProfilesResult = await db.query({ userProfiles: {} });
    const profiles = (userProfilesResult as any).userProfiles || [];
    const userProfile = profiles.find((p: any) =>
      p.userId && p.userId.toLowerCase().includes(email.toLowerCase())
    );

    if (!userProfile) {
      console.log('\n❌ User not found with that email.');
      console.log('\nAvailable users:');
      profiles.forEach((p: any) => {
        console.log(`  - ${p.name || 'Unknown'} (userId: ${p.userId})`);
      });
      rl.close();
      return;
    }

    const userId = userProfile.userId;
    console.log(`✅ Found user: ${userProfile.name} (${userId})\n`);

    // Get plan
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

    console.log(`\n📝 Creating ${planId} subscription for ${userProfile.name}...`);

    await db.transact([
      db.tx.subscriptions[userId].update({
        userId,
        planId,
        status: 'active',
        provider: 'stripe',
        providerSubscriptionId: `manual_${Date.now()}`,
        providerCustomerId: `manual_customer_${userId}`,
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
    console.log(`  User: ${userProfile.name}`);
    console.log(`  Email: ${email}`);
    console.log(`  Plan: ${planId}`);
    console.log(`  Clicks Limit: ${clickLimits[planId].toLocaleString()}/month`);
    console.log(`  Status: active`);
    console.log(`  Period: ${new Date(now).toLocaleDateString()} - ${new Date(oneMonthFromNow).toLocaleDateString()}`);
    console.log('\n🎉 The user should now see the correct plan in their navbar!');

  } catch (error) {
    console.error('\n❌ Error creating subscription:', error);
  } finally {
    rl.close();
  }
}

createUserSubscription();
