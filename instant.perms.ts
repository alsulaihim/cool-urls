// instant.perms.ts
// This file defines permissions for InstantDB
// Run `npx instant-cli push perms` to push this to your InstantDB app

export default {
  urls: {
    // Anyone can create URLs (logged in or anonymous)
    allow: {
      create: 'true',
      // Users can read all URLs
      view: 'true',
      // Users can update their own URLs or anonymous URLs
      update: "data.userId == auth.id || data.userId == 'anonymous'",
      // Users can delete their own URLs
      delete: "data.userId == auth.id",
    },
  },
  userProfiles: {
    allow: {
      // Only authenticated users can create profiles
      create: 'auth.id != null',
      // Anyone can view profiles
      view: 'true',
      // Users can only update their own profile
      update: 'data.userId == auth.id',
      // Users can only delete their own profile
      delete: 'data.userId == auth.id',
    },
  },
  adminUsers: {
    allow: {
      // Only existing admins can create new admins
      create: 'false', // Admins created via server-side only
      // Admins can view their own record
      view: 'data.userId == auth.id',
      // Admins can update their own record
      update: 'data.userId == auth.id',
      // Cannot delete admin users
      delete: 'false',
    },
  },
  auditLogs: {
    allow: {
      // Only server can create audit logs
      create: 'false',
      // Admins can view audit logs
      view: 'false', // Admin-only, use server queries
      // Cannot update audit logs
      update: 'false',
      // Cannot delete audit logs
      delete: 'false',
    },
  },
  userStatus: {
    allow: {
      // Only admins can create user status
      create: 'false',
      // Users can view their own status
      view: 'data.userId == auth.id',
      // Only admins can update
      update: 'false',
      // Only admins can delete
      delete: 'false',
    },
  },
  subscriptions: {
    allow: {
      // Users can create their own subscription (or server-side)
      create: 'auth.id != null',
      // Users can view their own subscription
      view: 'data.userId == auth.id',
      // Users can update their own subscription
      update: 'data.userId == auth.id',
      // Users cannot delete subscriptions
      delete: 'false',
    },
  },
  payments: {
    allow: {
      // Only server can create payments
      create: 'false',
      // Users can view their own payments
      view: 'data.userId == auth.id',
      // Cannot update payments
      update: 'false',
      // Cannot delete payments
      delete: 'false',
    },
  },
  invoices: {
    allow: {
      // Only server can create invoices
      create: 'false',
      // Users can view their own invoices
      view: 'data.userId == auth.id',
      // Cannot update invoices
      update: 'false',
      // Cannot delete invoices
      delete: 'false',
    },
  },
  usageTracking: {
    allow: {
      // Server creates usage tracking
      create: 'false',
      // Users can view their own usage
      view: 'data.userId == auth.id',
      // Cannot update usage
      update: 'false',
      // Cannot delete usage
      delete: 'false',
    },
  },
};
