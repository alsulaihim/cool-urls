import { init, type InstantGraph } from "@instantdb/admin";
import 'dotenv/config';

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID!;

const schema = {} as InstantGraph<any, any>;

const db = init({ appId: APP_ID, adminToken: process.env.INSTANT_ADMIN_TOKEN! }, schema);

async function listNonAdminUsers() {
  console.log('\n📋 Listing all NON-ADMIN users...\n');

  try {
    const result = await db.query({
      userProfiles: {},
      adminUsers: {},
      auditLogs: {
        $: {
          where: { action: 'auth.sign_in' },
        }
      }
    });

    const adminUserIds = result.adminUsers.map((a: any) => a.userId);
    const nonAdminProfiles = result.userProfiles.filter((p: any) => !adminUserIds.includes(p.userId));

    console.log(`✅ Found ${nonAdminProfiles.length} non-admin user(s):\n`);

    for (const profile of nonAdminProfiles) {
      console.log(`User ID: ${profile.userId}`);
      console.log(`Created: ${new Date(profile.createdAt).toLocaleString()}`);

      // Try to find email from audit logs
      const loginLog = result.auditLogs.find((log: any) => log.userId === profile.userId);
      if (loginLog) {
        console.log(`Email: ${loginLog.userEmail || 'N/A'}`);
      } else {
        console.log(`Email: Not found`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

listNonAdminUsers();
