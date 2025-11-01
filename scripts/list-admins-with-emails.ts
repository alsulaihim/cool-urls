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

async function listAdminsWithEmails() {
  console.log('\n📋 Listing all admin users with emails...\n');

  try {
    // Query admin users and user profiles
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

    // For each admin, we need to get their email from InstantDB auth
    for (const [idx, admin] of admins.entries()) {
      const profile = profiles.find((p: any) => p.userId === admin.userId);
      const permissions = JSON.parse(admin.permissions || '[]');

      console.log(`${idx + 1}. 👤 ${profile?.name || 'Admin'}`);
      console.log(`   User ID: ${admin.userId}`);

      // Try to get email from audit logs (which stores adminEmail)
      const auditResult = await db.query({
        auditLogs: {
          $: {
            where: {
              adminId: admin.userId,
            },
            limit: 1,
          }
        }
      });

      if (auditResult.auditLogs && auditResult.auditLogs.length > 0) {
        console.log(`   Email: ${auditResult.auditLogs[0].adminEmail}`);
      } else {
        console.log(`   Email: Not found in audit logs`);
      }

      console.log(`   Role: ${admin.role}`);
      console.log(`   Permissions: ${permissions.length} granted`);
      console.log(`   MFA Enabled: ${admin.mfaEnabled ? 'Yes' : 'No'}`);
      console.log(`   Created: ${new Date(admin.createdAt).toLocaleString()}`);
      console.log(`   Created By: ${admin.createdBy}`);
      if (admin.lastActiveAt) {
        console.log(`   Last Active: ${new Date(admin.lastActiveAt).toLocaleString()}`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error fetching admins:', error);
  }

  process.exit(0);
}

listAdminsWithEmails();
