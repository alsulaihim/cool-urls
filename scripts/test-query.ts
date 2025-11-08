/**
 * Test if subscription queries work after deletion
 */

import { init } from '@instantdb/admin';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID!;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN!;

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

async function test() {
  console.log('Testing queries...\n');

  // Test 1: Query all subscriptions
  const subs = await db.query({ subscriptions: {} });
  console.log('1. All subscriptions:', subs.subscriptions?.length || 0);

  // Test 2: Query with specific userId
  const userId = 'c048fa16-c793-41b0-b0c7-c0d0255c81bd';
  const userSub = await db.query({
    subscriptions: { $: { where: { userId } } },
  });
  console.log(`2. Subscriptions for user ${userId}:`, userSub.subscriptions?.length || 0);

  // Test 3: Query users
  const users = await db.query({ userProfiles: {} });
  console.log('3. User profiles:', users.userProfiles?.length || 0);

  console.log('\n✅ All queries completed successfully!');
}

test();
