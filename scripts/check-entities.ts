/**
 * Script to check what entities exist in InstantDB
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

async function checkEntities() {
  console.log('🔍 Checking existing entities in InstantDB...\n');

  try {
    // Try to query each entity
    const entities = ['urls', 'userProfiles', 'adminUsers', 'auditLogs', 'userStatus', 'subscriptions', 'payments', 'invoices'];

    for (const entity of entities) {
      try {
        const result = await db.query({ [entity]: {} } as any);
        const count = (result as any)[entity]?.length || 0;
        console.log(`✅ ${entity}: ${count} records`);
      } catch (error: any) {
        console.log(`❌ ${entity}: Not found (${error.message?.split('\n')[0]})`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkEntities();
