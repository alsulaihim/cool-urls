// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  // We inferred 1 attribute!
  // Take a look at this schema, and if everything looks good,
  // run `push schema` again to enforce the types.
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
    }),
    adminUsers: i.entity({
      createdAt: i.number(),
      createdBy: i.string(),
      lastActiveAt: i.number().optional(),
      mfaEnabled: i.boolean(),
      mfaSecret: i.string().optional(),
      permissions: i.string(),
      role: i.string(),
      userId: i.string().unique().indexed(),
    }),
    appSettings: i.entity({
      key: i.string().unique().indexed(),
      updatedAt: i.number(),
      updatedBy: i.string(),
      value: i.string(),
    }),
    auditLogs: i.entity({
      action: i.string(),
      adminEmail: i.string(),
      adminId: i.string().indexed(),
      ipAddress: i.string(),
      metadata: i.string(),
      targetId: i.string(),
      targetType: i.string(),
      timestamp: i.number(),
      userAgent: i.string(),
    }),
    invoices: i.entity({
      amount: i.number(),
      createdAt: i.number(),
      currency: i.string(),
      hostedInvoiceUrl: i.string().optional(),
      invoiceNumber: i.string().optional(),
      paidAt: i.number().optional(),
      pdfUrl: i.string().optional(),
      periodEnd: i.number(),
      periodStart: i.number(),
      provider: i.string(),
      providerInvoiceId: i.string().optional(),
      status: i.string(),
      subscriptionId: i.string().optional(),
      userId: i.string().indexed(),
    }),
    payments: i.entity({
      amount: i.number(),
      createdAt: i.number(),
      currency: i.string(),
      metadata: i.string().optional(),
      planId: i.string(),
      provider: i.string(),
      providerPaymentId: i.string().indexed(),
      status: i.string(),
      subscriptionId: i.string().optional(),
      userId: i.string().indexed(),
    }),
    subscriptions: i.entity({
      cancelAtPeriodEnd: i.boolean(),
      cancelledAt: i.number().optional(),
      clicksLimit: i.number(),
      clicksUsed: i.number(),
      createdAt: i.number(),
      currentPeriodEnd: i.number(),
      currentPeriodStart: i.number(),
      myFatoorahSubscriptionId: i.string().indexed().optional(),
      paypalSubscriptionId: i.string().indexed().optional(),
      planId: i.string(),
      provider: i.string(),
      providerCustomerId: i.string().optional(),
      providerSubscriptionId: i.string().optional(),
      status: i.string(),
      updatedAt: i.number(),
      userId: i.string().unique().indexed(),
    }),
    urls: i.entity({
      analyticsData: i.string().optional(),
      clicks: i.number(),
      createdAt: i.number(),
      expiresAt: i.number().optional(),
      isAnonymous: i.boolean().optional(),
      originalUrl: i.string(),
      prefix: i.string().optional(),
      shortCode: i.string().unique().indexed(),
      userId: i.string(),
    }),
    usageTracking: i.entity({
      clicks: i.number(),
      createdAt: i.number(),
      date: i.string().indexed(),
      updatedAt: i.number(),
      urlId: i.string().indexed(),
      userId: i.string().indexed(),
    }),
    userProfiles: i.entity({
      createdAt: i.number(),
      name: i.string(),
      userId: i.string().unique().indexed(),
    }),
    userStatus: i.entity({
      modifiedAt: i.number(),
      modifiedBy: i.string(),
      notes: i.string().optional(),
      reason: i.string().optional(),
      status: i.string(),
      userId: i.string().unique().indexed(),
    }),
  },
  links: {
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
  },
  rooms: {},
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
