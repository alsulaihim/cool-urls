/**
 * Script to create a subscription for a specific user
 * Usage: npx tsx scripts/create-subscription.ts <userNumber> <planId>
 * Example: npx tsx scripts/create-subscription.ts 1 growth
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
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // List users mode
    console.log('🔍 Fetching all users...\n');

    const userProfilesResult = await db.query({ userProfiles: {} });
    const profiles = (userProfilesResult as any).userProfiles || [];

    if (profiles.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    console.log('📋 Available users:\n');
    profiles.forEach((p: any, index: number) => {
      console.log(`${index + 1}. ${p.name || 'Unknown'}`);
      console.log(`   User ID: ${p.userId}`);
      console.log(`   Created: ${new Date(p.createdAt).toLocaleString()}\n`);
    });

    console.log('Usage: npx tsx scripts/create-subscription.ts <userNumber> <planId>');
    console.log('Plans: free, starter, growth, business, enterprise, scale, premium');
    console.log('Example: npx tsx scripts/create-subscription.ts 1 growth');
    return;
  }

  // Create subscription mode
  const userNumber = parseInt(args[0]);
  const planId = args[1] as 'free' | 'starter' | 'growth' | 'business' | 'enterprise' | 'scale' | 'premium';

  if (!['free', 'starter', 'growth', 'business', 'enterprise', 'scale', 'premium'].includes(planId)) {
    console.log('❌ Invalid plan. Must be: free, starter, growth, business, enterprise, scale, or premium');
    return;
  }

  console.log('🔍 Fetching users...\n');

  const userProfilesResult = await db.query({ userProfiles: {} });
  const profiles = (userProfilesResult as any).userProfiles || [];

  const userIndex = userNumber - 1;

  if (userIndex < 0 || userIndex >= profiles.length) {
    console.log('❌ Invalid user number');
    return;
  }

  const selectedUser = profiles[userIndex];
  console.log(`✅ Selected: ${selectedUser.name} (${selectedUser.userId})\n`);

  // Set click limits (from pricing.ts)
  const clickLimits = {
    free: 1000,
    starter: 1000,
    growth: 25000,
    business: 50000,
    enterprise: 100000,
    scale: 500000,
    premium: 1000000,
  };

  const now = Date.now();
  const oneMonthFromNow = now + 30 * 24 * 60 * 60 * 1000;

  console.log(`📝 Creating ${planId} subscription for ${selectedUser.name}...`);

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
}

main().catch(console.error);
