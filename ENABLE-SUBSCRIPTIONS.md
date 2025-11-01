# How to Enable Subscriptions

The subscription feature is currently disabled because the `subscriptions` entity doesn't exist in the InstantDB backend yet.

## Problem

The schema file (`instant.schema.ts`) has the subscriptions entity defined, but InstantDB CLI says "No schema changes to apply" even though the entity doesn't exist in the backend.

## Solution

You need to manually create the `subscriptions` entity in the InstantDB dashboard.

### Steps:

1. **Go to InstantDB Dashboard**
   - Visit: https://instantdb.com/dash
   - Select your app: `aba22924-dcfd-4836-b475-9135b8036c08`

2. **Create the `subscriptions` Entity**

   Click "Create Entity" and add these fields:

   | Field Name              | Type    | Options                |
   |-------------------------|---------|------------------------|
   | userId                  | string  | unique, indexed        |
   | planId                  | string  |                        |
   | status                  | string  |                        |
   | provider                | string  |                        |
   | providerSubscriptionId  | string  | optional               |
   | providerCustomerId      | string  | optional               |
   | currentPeriodStart      | number  |                        |
   | currentPeriodEnd        | number  |                        |
   | cancelAtPeriodEnd       | boolean |                        |
   | clicksUsed              | number  |                        |
   | clicksLimit             | number  |                        |
   | createdAt               | number  |                        |
   | updatedAt               | number  |                        |
   | cancelledAt             | number  | optional               |

3. **Also Create These Related Entities** (Optional but recommended):

   - `payments` - Track payment history
   - `invoices` - Store invoice records
   - `usageTracking` - Track daily click usage

   See `instant.schema.ts` for full field definitions.

4. **Enable Subscriptions in Code**

   After creating the entity, uncomment the query code in:
   ```
   lib/useSubscription.ts (lines 47-62)
   ```

   And remove the early return on line 44.

5. **Test**
   - Refresh the app
   - The navbar should now show your actual plan
   - Pricing page should display "Current Plan" correctly

## Current Workaround

Until the entity is created:
- All users default to "Free" plan in the navbar
- Subscription payments still work (they create the subscription record)
- The data is stored but can't be queried/displayed yet

## Files to Check

- `lib/useSubscription.ts` - Contains the disabled query
- `instant.schema.ts` - Has the complete schema definition
- `lib/subscription-service.ts` - Server-side subscription management
- `app/api/subscriptions/create/route.ts` - Subscription creation endpoint
