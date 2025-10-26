// instant.schema.ts
// This file defines the schema for InstantDB
// Run `npx instant-cli push-schema` to push this to your InstantDB app

import { i } from '@instantdb/core';

// Schema version with full type definitions
const graph = i.graph(
  {
    urls: i.entity({
      originalUrl: i.string(),
      shortCode: i.string().unique().indexed(),
      prefix: i.string().optional(),
      createdAt: i.number(),
      clicks: i.number(),
      userId: i.string(),
      analyticsData: i.string().optional(),
    }),
    userProfiles: i.entity({
      userId: i.string().unique().indexed(),
      name: i.string(),
      createdAt: i.number(),
    }),
  },
  {}
);

export default graph;
