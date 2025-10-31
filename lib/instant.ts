import { init, i } from '@instantdb/react';

// Define the schema for our database using InstantDB's schema builder
const schema = i.schema({
  entities: {
    urls: i.entity({
      originalUrl: i.string(),
      shortCode: i.string().unique().indexed(),
      prefix: i.string().optional(),
      createdAt: i.number(),
      clicks: i.number(),
      userId: i.string(),
      // Store analytics as JSON string array
      analyticsData: i.string().optional(),
      expiresAt: i.number().optional(), // Expiration timestamp for temporary URLs
      isAnonymous: i.boolean().optional(), // Whether created by anonymous user
    }),
    userProfiles: i.entity({
      userId: i.string().unique().indexed(),
      name: i.string(),
      createdAt: i.number(),
    }),
    // Admin Panel Entities
    adminUsers: i.entity({
      userId: i.string().unique().indexed(),
      role: i.string(),
      permissions: i.string(),
      mfaEnabled: i.boolean(),
      mfaSecret: i.string().optional(),
      createdAt: i.number(),
      createdBy: i.string(),
      lastActiveAt: i.number().optional(),
    }),
    auditLogs: i.entity({
      adminId: i.string().indexed(),
      adminEmail: i.string(),
      action: i.string(),
      targetType: i.string(),
      targetId: i.string(),
      metadata: i.string(),
      ipAddress: i.string(),
      userAgent: i.string(),
      timestamp: i.number(),
    }),
    userStatus: i.entity({
      userId: i.string().unique().indexed(),
      status: i.string(),
      reason: i.string().optional(),
      notes: i.string().optional(),
      modifiedBy: i.string(),
      modifiedAt: i.number(),
    }),
  },
});

// Get the app ID from environment variables
const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;

// Validate that APP_ID is set
if (!APP_ID) {
  console.error('⚠️  NEXT_PUBLIC_INSTANT_APP_ID is not set in environment variables');
  console.error('📝 Please follow these steps:');
  console.error('   1. Go to https://instantdb.com and create an account');
  console.error('   2. Create a new app and copy your App ID');
  console.error('   3. Create a .env.local file in the root directory');
  console.error('   4. Add: NEXT_PUBLIC_INSTANT_APP_ID=your_app_id_here');
  console.error('   5. Add: INSTANT_ADMIN_TOKEN=your_admin_token_here');
  console.error('   6. Restart the development server');
  console.error('\n   See SETUP.md for detailed instructions');
}

// Use a placeholder UUID format for development if not set (this won't work for real operations)
// This prevents the initialization error while allowing the app to load
const appId = APP_ID || '00000000-0000-0000-0000-000000000000';

// Initialize InstantDB with schema for full type safety and auto-completion
export const db = init({ appId, schema });
