/**
 * Script to create a test subscription record
 * This will force InstantDB to create the subscriptions entity
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
  console.error('Missing required environment variables:');
  console.error('NEXT_PUBLIC_INSTANT_APP_ID:', APP_ID ? '✓' : '✗');
  console.error('INSTANT_ADMIN_TOKEN:', ADMIN_TOKEN ? '✓' : '✗');
  process.exit(1);
}

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

async function createSubscriptionsEntity() {
  console.log('🚀 Creating subscriptions entity by adding a test record...\n');

  try {
    // Get current user to create a subscription for
    // We'll create a test subscription that can be deleted later
    const testUserId = 'test-user-' + Date.now();
    const now = Date.now();
    const oneMonthFromNow = now + 30 * 24 * 60 * 60 * 1000;

    console.log('Creating test subscription record...');

    await db.transact([
      db.tx.subscriptions[testUserId].update({
        userId: testUserId,
        planId: 'free',
        status: 'active',
        provider: 'none',
        providerSubscriptionId: undefined,
        providerCustomerId: undefined,
        currentPeriodStart: now,
        currentPeriodEnd: oneMonthFromNow,
        cancelAtPeriodEnd: false,
        clicksUsed: 0,
        clicksLimit: 1000,
        createdAt: now,
        updatedAt: now,
        cancelledAt: undefined,
      }),
    ]);

    console.log('✅ Test subscription created successfully!\n');
    console.log('The subscriptions entity should now exist in InstantDB.');
    console.log('\n📝 Next steps:');
    console.log('1. Go to lib/useSubscription.ts');
    console.log('2. Uncomment lines 47-62 (the query code)');
    console.log('3. Remove/comment line 44 (the early return)');
    console.log('4. Refresh your app\n');
    console.log('Note: You can delete the test subscription record from the InstantDB dashboard if needed.');
    console.log('Test userId:', testUserId);

  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    process.exit(1);
  }
}

createSubscriptionsEntity();
