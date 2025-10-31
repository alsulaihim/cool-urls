/**
 * Create First Admin User
 * 
 * Run this script ONCE after pushing the admin schema to create your first super admin.
 * 
 * Usage: npm run create-first-admin
 */

import { init } from '@instantdb/admin';
import * as readline from 'readline';

// Load environment variables
import 'dotenv/config';

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;

if (!APP_ID || !ADMIN_TOKEN) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_INSTANT_APP_ID');
  console.error('   INSTANT_ADMIN_TOKEN');
  console.error('\nMake sure these are set in your .env.local file');
  process.exit(1);
}

// Initialize admin SDK
const db = init({
  appId: APP_ID,
  adminToken: ADMIN_TOKEN,
});

// Super admin permissions
const SUPER_ADMIN_PERMISSIONS = [
  'user.read',
  'user.write',
  'user.suspend',
  'user.delete',
  'url.read',
  'url.write',
  'url.moderate',
  'url.delete',
  'analytics.read',
  'audit.read',
  'config.read',
  'config.write',
  'admin.manage',
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('\n🔐 Create First Admin User\n');
  console.log('This script will grant super_admin access to a user.\n');

  // Get user email
  const email = await question('Enter the email address of the user to make admin: ');

  if (!email || !email.includes('@')) {
    console.error('\n❌ Invalid email address');
    rl.close();
    process.exit(1);
  }

  console.log('\n🔍 Looking up user...');

  try {
    // Query user by email (assuming they've already signed up)
    const result = await db.query({
      users: {
        $: {
          where: {
            email,
          },
        },
      },
    });

    if (!result?.users || result.users.length === 0) {
      console.error('\n❌ No user found with that email address');
      console.error('   The user must sign up first before being made an admin.');
      rl.close();
      process.exit(1);
    }

    const user = result.users[0];
    console.log(`\n✅ Found user: ${user.email}`);
    console.log(`   User ID: ${user.id}`);

    // Confirm
    const confirm = await question('\nGrant super_admin privileges to this user? (yes/no): ');

    if (confirm.toLowerCase() !== 'yes') {
      console.log('\n❌ Cancelled');
      rl.close();
      process.exit(0);
    }

    // Check if already admin
    const { data: adminCheck } = await db.query({
      adminUsers: {
        $: {
          where: {
            userId: user.id,
          },
        },
      },
    });

    if (adminCheck?.adminUsers && adminCheck.adminUsers.length > 0) {
      console.log('\n⚠️  User is already an admin');
      const update = await question('Update their role to super_admin? (yes/no): ');

      if (update.toLowerCase() !== 'yes') {
        console.log('\n❌ Cancelled');
        rl.close();
        process.exit(0);
      }

      // Update existing admin
      const adminId = adminCheck.adminUsers[0].id;
      await db.transact([
        db.tx.adminUsers[adminId].update({
          role: 'super_admin',
          permissions: JSON.stringify(SUPER_ADMIN_PERMISSIONS),
        }),
      ]);

      console.log('\n✅ Admin role updated to super_admin');
    } else {
      // Create new admin user
      const adminId = crypto.randomUUID();

      await db.transact([
        db.tx.adminUsers[adminId].update({
          userId: user.id,
          role: 'super_admin',
          permissions: JSON.stringify(SUPER_ADMIN_PERMISSIONS),
          mfaEnabled: false,
          createdAt: Date.now(),
          createdBy: 'system',
        }),
      ]);

      console.log('\n✅ Super admin access granted!');
    }

    // Create audit log
    const auditId = crypto.randomUUID();
    await db.transact([
      db.tx.auditLogs[auditId].update({
        adminId: user.id,
        adminEmail: user.email,
        action: 'admin.grant',
        targetType: 'admin',
        targetId: user.id,
        metadata: JSON.stringify({ role: 'super_admin' }),
        ipAddress: 'system',
        userAgent: 'create-first-admin script',
        timestamp: Date.now(),
      }),
    ]);

    console.log('\n📋 Summary:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: super_admin`);
    console.log(`   Permissions: ${SUPER_ADMIN_PERMISSIONS.length} permissions granted`);
    console.log('\n🎉 Done! The user can now access the admin panel at admin.hoturl.me\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    rl.close();
  }
}

main();

