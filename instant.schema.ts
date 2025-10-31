// instant.schema.ts
// This file defines the schema for InstantDB
// Run `npx instant-cli push-schema` to push this to your InstantDB app

import { i } from '@instantdb/core';

// Schema version with full type definitions
const graph = i.graph(
  {
    // Existing entities
    urls: i.entity({
      originalUrl: i.string(),
      shortCode: i.string().unique().indexed(),
      prefix: i.string().optional(),
      createdAt: i.number(),
      clicks: i.number(),
      userId: i.string(),
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
      role: i.string(), // 'super_admin' | 'admin' | 'moderator'
      permissions: i.string(), // JSON array of permissions
      mfaEnabled: i.boolean(),
      mfaSecret: i.string().optional(), // TOTP secret for 2FA
      createdAt: i.number(),
      createdBy: i.string(), // Admin who granted access
      lastActiveAt: i.number().optional(),
    }),
    
    auditLogs: i.entity({
      adminId: i.string().indexed(),
      adminEmail: i.string(), // Denormalized for quick display
      action: i.string(), // e.g., 'user.suspend', 'url.delete'
      targetType: i.string(), // 'user' | 'url' | 'system' | 'admin'
      targetId: i.string(),
      metadata: i.string(), // JSON object with action details
      ipAddress: i.string(),
      userAgent: i.string(),
      timestamp: i.number(),
    }),
    
    userStatus: i.entity({
      userId: i.string().unique().indexed(),
      status: i.string(), // 'active' | 'suspended' | 'banned'
      reason: i.string().optional(),
      notes: i.string().optional(),
      modifiedBy: i.string(), // Admin ID
      modifiedAt: i.number(),
    }),
  },
  {}
);

export default graph;
