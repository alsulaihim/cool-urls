/**
 * Setup Admin User - Direct Grant
 * 
 * Grants super_admin access to nasser@majesticsolutions.co
 * Run this after pushing the schema to InstantDB
 */

import { init } from '@instantdb/admin';
import { config } from 'dotenv';
import { resolve } from 'path';
import { randomUUID } from 'crypto';

// Load .env.local file explicitly
config({ path: resolve(process.cwd(), '.env.local') });

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;

if (!APP_ID || !ADMIN_TOKEN) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const db = init({
  appId: APP_ID,
  adminToken: ADMIN_TOKEN,
});

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

async function setupAdmin() {
  const email = 'nasser@majesticsolutions.co';
  
  console.log(`\n🔐 Setting up super admin for: ${email}\n`);

  try {
    // Query user profiles to find the user
    console.log('🔍 Looking up user in profiles...');
    
    const data = await db.query({
      userProfiles: {},
    });

    if (!data?.userProfiles || data.userProfiles.length === 0) {
      console.error('\n❌ No users found. You must sign up first at your app URL.');
      console.error('   Steps:');
      console.error('   1. Go to your app (localhost:3000 or hoturl.me)');
      console.error('   2. Click "Sign In"');
      console.error(`   3. Enter: ${email}`);
      console.error('   4. Complete the magic link verification');
      console.error('   5. Run this script again');
      process.exit(1);
    }

    // For now, we'll use the first user profile found
    // In production, you'd want to match by email or provide userId
    const userProfile = data.userProfiles[0];
    const userId = userProfile.userId;
    
    console.log(`✅ Found user profile: ${userProfile.name || 'Unknown'}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Note: Granting admin to the first user in the system`);

    // Check if already admin
    const adminCheck = await db.query({
      adminUsers: {
        $: {
          where: {
            userId: userId,
          },
        },
      },
    });

    if (adminCheck?.adminUsers && adminCheck.adminUsers.length > 0) {
      console.log('\n⚠️  User is already an admin. Updating to super_admin...');
      
      const adminId = adminCheck.adminUsers[0].id;
      await db.transact([
        db.tx.adminUsers[adminId].update({
          role: 'super_admin',
          permissions: JSON.stringify(SUPER_ADMIN_PERMISSIONS),
          lastActiveAt: Date.now(),
        }),
      ]);

      console.log('✅ Admin role updated to super_admin');
    } else {
      console.log('\n🎯 Creating super admin...');
      
      const adminId = randomUUID();
      await db.transact([
        db.tx.adminUsers[adminId].update({
          userId: userId,
          role: 'super_admin',
          permissions: JSON.stringify(SUPER_ADMIN_PERMISSIONS),
          mfaEnabled: false,
          createdAt: Date.now(),
          createdBy: 'system',
        }),
      ]);

      console.log('✅ Super admin access granted!');
    }

    // Create audit log
    const auditId = randomUUID();
    await db.transact([
      db.tx.auditLogs[auditId].update({
        adminId: userId,
        adminEmail: email,
        action: 'admin.grant',
        targetType: 'admin',
        targetId: userId,
        metadata: JSON.stringify({ role: 'super_admin', grantedBy: 'system' }),
        ipAddress: 'system',
        userAgent: 'setup-admin-user script',
        timestamp: Date.now(),
      }),
    ]);

    console.log('\n📋 Summary:');
    console.log(`   Email: ${email}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Role: super_admin`);
    console.log(`   Permissions: ${SUPER_ADMIN_PERMISSIONS.length} permissions granted`);
    console.log('\n🎉 Done! You can now access the admin panel.\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure schema is pushed: npm run push-schema');
    console.error('2. Make sure user has signed up at least once');
    console.error('3. Check environment variables are set correctly');
  }
}

setupAdmin();

