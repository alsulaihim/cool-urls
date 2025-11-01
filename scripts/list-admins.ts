import { init } from '@instantdb/admin';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID!;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN!;

const db = init({
  appId: APP_ID,
  adminToken: ADMIN_TOKEN,
});

async function listAdmins() {
  console.log('\n📋 Listing all admin users...\n');

  try {
    const result = await db.query({
      adminUsers: {},
      userProfiles: {},
    });

    const admins = result.adminUsers;
    const profiles = result.userProfiles;

    if (!admins || admins.length === 0) {
      console.log('❌ No admin users found');
      return;
    }

    console.log(`✅ Found ${admins.length} admin user(s):\n`);

    admins.forEach((admin: any, idx: number) => {
      const profile = profiles.find((p: any) => p.userId === admin.userId);
      const permissions = JSON.parse(admin.permissions || '[]');

      console.log(`${idx + 1}. 👤 Admin`);
      console.log(`   User ID: ${admin.userId}`);
      console.log(`   Name: ${profile?.name || 'N/A'}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Permissions: ${permissions.length} granted`);
      console.log(`   MFA Enabled: ${admin.mfaEnabled ? 'Yes' : 'No'}`);
      console.log(`   Created: ${new Date(admin.createdAt).toLocaleString()}`);
      console.log(`   Created By: ${admin.createdBy}`);
      if (admin.lastActiveAt) {
        console.log(`   Last Active: ${new Date(admin.lastActiveAt).toLocaleString()}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error fetching admins:', error);
  }

  process.exit(0);
}

listAdmins();
