/**
 * Script to delete subscription by ID
 */

import { init } from '@instantdb/admin';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID!;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN!;

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

async function deleteById() {
  const subscriptionId = '03ec003a-6675-4e08-96a5-5a9674ec3bc6';

  console.log('Deleting subscription by ID:', subscriptionId);

  try {
    await db.transact([
      db.tx.subscriptions[subscriptionId].delete()
    ]);

    console.log('Delete transaction complete!');

    // Wait and check
    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = await db.query({ subscriptions: {} });
    console.log('\nRemaining subscriptions:', result.subscriptions?.length || 0);

    if (result.subscriptions && result.subscriptions.length > 0) {
      console.log('\nSubscriptions still in database:');
      result.subscriptions.forEach((sub: any) => {
        console.log(`  - ID: ${sub.id}, User: ${sub.userId}, Plan: ${sub.planId}`);
      });
    } else {
      console.log('\n✅ All subscriptions successfully deleted!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

deleteById();
