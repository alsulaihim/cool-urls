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

    // Subscription and Billing Entities
    subscriptions: i.entity({
      userId: i.string().unique().indexed(),
      planId: i.string(), // 'free' | 'starter' | 'growth' | 'business' | 'enterprise' | 'scale' | 'premium'
      status: i.string(), // 'active' | 'cancelled' | 'past_due' | 'expired' | 'trialing'
      provider: i.string(), // 'stripe' | 'paypal' | 'none'
      providerSubscriptionId: i.string().optional(), // Stripe/PayPal subscription ID
      providerCustomerId: i.string().optional(), // Stripe customer ID or PayPal payer ID
      currentPeriodStart: i.number(),
      currentPeriodEnd: i.number(),
      cancelAtPeriodEnd: i.boolean(),
      clicksUsed: i.number(), // Clicks used in current billing period
      clicksLimit: i.number(), // Monthly click limit based on plan
      createdAt: i.number(),
      updatedAt: i.number(),
      cancelledAt: i.number().optional(),
    }),

    payments: i.entity({
      userId: i.string().indexed(),
      subscriptionId: i.string().optional(), // Link to subscription entity ID
      provider: i.string(), // 'stripe' | 'paypal'
      providerPaymentId: i.string().indexed(), // Stripe payment intent ID or PayPal order ID
      amount: i.number(), // Amount in cents
      currency: i.string(), // 'usd', 'eur', etc.
      status: i.string(), // 'succeeded' | 'failed' | 'pending' | 'refunded'
      planId: i.string(), // Plan at time of payment
      metadata: i.string().optional(), // JSON with additional payment details
      createdAt: i.number(),
    }),

    invoices: i.entity({
      userId: i.string().indexed(),
      subscriptionId: i.string().optional(),
      provider: i.string(), // 'stripe' | 'paypal'
      providerInvoiceId: i.string().optional(),
      invoiceNumber: i.string().optional(),
      amount: i.number(), // Amount in cents
      currency: i.string(),
      status: i.string(), // 'paid' | 'open' | 'void' | 'uncollectible'
      pdfUrl: i.string().optional(), // Link to invoice PDF
      hostedInvoiceUrl: i.string().optional(), // Stripe hosted invoice page
      periodStart: i.number(),
      periodEnd: i.number(),
      createdAt: i.number(),
      paidAt: i.number().optional(),
    }),

    usageTracking: i.entity({
      userId: i.string().indexed(),
      urlId: i.string().indexed(), // Link to urls entity
      date: i.string().indexed(), // YYYY-MM-DD format for daily tracking
      clicks: i.number(), // Number of clicks on this day
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
  },
  {}
);

export default graph;
