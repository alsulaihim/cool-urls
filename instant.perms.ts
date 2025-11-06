// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

const rules = {
  userStatus: {
    allow: {
      view: "data.userId == auth.id",
      create: "false",
      delete: "false",
      update: "false",
    },
  },
  urls: {
    allow: {
      view: "true",
      create: "true",
      delete: "data.userId == auth.id",
      update: "data.userId == auth.id || data.userId == 'anonymous'",
    },
  },
  auditLogs: {
    allow: {
      view: "false",
      create: "false",
      delete: "false",
      update: "false",
    },
  },
  adminUsers: {
    allow: {
      view: "data.userId == auth.id",
      create: "false",
      delete: "false",
      update: "data.userId == auth.id",
    },
  },
  payments: {
    allow: {
      view: "data.userId == auth.id",
      create: "false",
      delete: "false",
      update: "false",
    },
  },
  usageTracking: {
    allow: {
      view: "data.userId == auth.id",
      create: "false",
      delete: "false",
      update: "false",
    },
  },
  invoices: {
    allow: {
      view: "data.userId == auth.id",
      create: "false",
      delete: "false",
      update: "false",
    },
  },
  userProfiles: {
    allow: {
      view: "true",
      create: "auth.id != null",
      delete: "data.userId == auth.id",
      update: "data.userId == auth.id",
    },
  },
  subscriptions: {
    allow: {
      view: "data.userId == auth.id",
      create: "auth.id != null",
      delete: "false",
      update: "data.userId == auth.id",
    },
  },
} satisfies InstantRules;

export default rules;
