import { init_experimental as init, i } from '@instantdb/admin';

// Use the same schema from the client-side db
const schema = i.schema({
  entities: {
    urls: i.entity({
      originalUrl: i.string(),
      shortCode: i.string().unique().indexed(),
      prefix: i.string().optional(),
      createdAt: i.number(),
      clicks: i.number(),
      userId: i.string(),
      analyticsData: i.string().optional(),
      expiresAt: i.number().optional(),
      isAnonymous: i.boolean().optional(),
    }),
    userProfiles: i.entity({
      userId: i.string().unique().indexed(),
      name: i.string(),
      createdAt: i.number(),
    }),
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
    subscriptions: i.entity({
      userId: i.string().unique().indexed(),
      planId: i.string(),
      status: i.string(),
      provider: i.string(),
      providerSubscriptionId: i.string().optional(),
      providerCustomerId: i.string().optional(),
      currentPeriodStart: i.number(),
      currentPeriodEnd: i.number(),
      cancelAtPeriodEnd: i.boolean(),
      clicksUsed: i.number(),
      clicksLimit: i.number(),
      createdAt: i.number(),
      updatedAt: i.number(),
      cancelledAt: i.number().optional(),
    }),
    payments: i.entity({
      userId: i.string().indexed(),
      subscriptionId: i.string().optional(),
      provider: i.string(),
      providerPaymentId: i.string().indexed(),
      amount: i.number(),
      currency: i.string(),
      status: i.string(),
      planId: i.string(),
      metadata: i.string().optional(),
      createdAt: i.number(),
    }),
    invoices: i.entity({
      userId: i.string().indexed(),
      subscriptionId: i.string().optional(),
      provider: i.string(),
      providerInvoiceId: i.string().optional(),
      invoiceNumber: i.string().optional(),
      amount: i.number(),
      currency: i.string(),
      status: i.string(),
      pdfUrl: i.string().optional(),
      hostedInvoiceUrl: i.string().optional(),
      periodStart: i.number(),
      periodEnd: i.number(),
      createdAt: i.number(),
      paidAt: i.number().optional(),
    }),
    usageTracking: i.entity({
      userId: i.string().indexed(),
      urlId: i.string().indexed(),
      date: i.string().indexed(),
      clicks: i.number(),
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
  },
});

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;

if (!APP_ID || !ADMIN_TOKEN) {
  console.error('⚠️  Missing InstantDB configuration for admin client');
  console.error('   NEXT_PUBLIC_INSTANT_APP_ID:', APP_ID ? 'set' : 'missing');
  console.error('   INSTANT_ADMIN_TOKEN:', ADMIN_TOKEN ? 'set' : 'missing');
}

// Singleton instance of the admin database
let adminDbInstance: ReturnType<typeof init<typeof schema>> | null = null;

/**
 * Get the admin database instance with server-side admin privileges.
 * This should only be used in API routes and server-side code.
 *
 * @returns Promise<AdminDB> - The admin database instance
 */
export async function getDb() {
  if (!adminDbInstance && APP_ID && ADMIN_TOKEN) {
    adminDbInstance = init({
      appId: APP_ID,
      adminToken: ADMIN_TOKEN,
      schema,
    });
  }

  if (!adminDbInstance) {
    throw new Error('Failed to initialize admin database. Check environment variables.');
  }

  return adminDbInstance;
}
