/**
 * Script to check details of a specific subscription
 */

import { init } from '@instantdb/admin';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID!;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN!;

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

async function checkSubscription() {
  const userId = 'c048fa16-c793-41b0-b0c7-c0d0255c81bd';

  const data = await db.query({
    subscriptions: { $: { where: { userId } } },
    userProfiles: { $: { where: { userId } } },
  });

  console.log('Subscription data:', JSON.stringify(data, null, 2));

  // Try deleting specifically by userId
  console.log('\nDeleting subscription for user:', userId);
  await db.transact([
    db.tx.subscriptions[userId].delete()
  ]);

  console.log('Deleted! Checking again...');

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));

  const afterDelete = await db.query({
    subscriptions: { $: { where: { userId } } },
  });

  console.log('After delete:', JSON.stringify(afterDelete, null, 2));
}

checkSubscription();
