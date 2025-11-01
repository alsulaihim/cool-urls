# Subscription System Status

## Current Status: TEMPORARILY DISABLED

The subscription system has been temporarily disabled due to an InstantDB schema sync issue.

## The Problem

- ✅ The `subscriptions` entity **IS** defined in [instant.schema.ts](instant.schema.ts)
- ✅ The schema has been pushed to InstantDB (`npx instant-cli push schema`)
- ✅ The Admin SDK **CAN** create subscription records successfully
- ❌ Client-side queries **FAIL** with error: `Entity 'subscriptions' does not exist in schema`

## Current Workaround

All users are shown as "Free" plan users until this is resolved. See [lib/useSubscription.ts](lib/useSubscription.ts) for the temporary implementation.

## What We've Tried

1. ✅ Defined full schema with subscriptions, payments, invoices entities
2. ✅ Pushed schema with `npx instant-cli push schema` (confirmed "No schema changes")
3. ✅ Created 4 test subscription records via Admin SDK (confirmed with check-entities script)
4. ❌ Client queries still fail with "Entity does not exist"

## Possible Causes

1. **Schema Permissions**: Client-side queries might need explicit read permissions
2. **InstantDB Bug**: Known issue with schema sync between admin and client SDKs
3. **Cache Issue**: InstantDB dashboard or client might have stale schema cache
4. **Version Mismatch**: Different versions of @instantdb packages

## How to Fix

### Option 1: Check InstantDB Dashboard
1. Go to https://instantdb.com/dash
2. Select your app (aba22924-dcfd-4836-b475-9135b8036c08)
3. Check the Schema tab
4. Verify that `subscriptions`, `payments`, `invoices` entities are visible
5. Check if there are any permission settings for client queries

### Option 2: Force Schema Refresh
```bash
# Try forcing a schema update
npx instant-cli pull
npx instant-cli push schema --force
```

### Option 3: Re-enable Queries (Once Fixed)

In [lib/useSubscription.ts](lib/useSubscription.ts), uncomment the original query code and remove the temporary workaround:

```typescript
export function useSubscription(userId: string | undefined) {
  const result = db.useQuery(
    userId ? { subscriptions: { $: { where: { userId } } } } : null as any
  );

  if (!result || result.error) {
    console.warn('Subscriptions query error:', result?.error);
    return { subscription: null, isLoading: false };
  }

  const { data, isLoading } = result;

  if (isLoading) {
    return { subscription: null, isLoading: true };
  }

  const subscription = userId && data
    ? (data as any)?.subscriptions?.[0] as Subscription | undefined
    : null;

  return { subscription: subscription || null, isLoading: false };
}
```

## Verification Scripts

### Check if entities exist:
```bash
npx tsx scripts/check-entities.ts
```

### List all users:
```bash
npx tsx scripts/create-subscription.ts
```

### Create subscription for a user:
```bash
npx tsx scripts/create-subscription.ts <userNumber> <planId>
# Example: npx tsx scripts/create-subscription.ts 1 growth
```

### Reset all subscriptions to free:
```bash
npx tsx scripts/reset-subscriptions.ts
```

## Next Steps

1. Contact InstantDB support about client query permissions
2. Check if there's a way to enable read permissions for subscription entities
3. Consider alternative approaches (server-side API routes, edge functions)
4. Once working, test full subscription flow end-to-end

## Related Files

- [instant.schema.ts](instant.schema.ts) - Schema definition
- [lib/useSubscription.ts](lib/useSubscription.ts) - Subscription hook (currently disabled)
- [scripts/check-entities.ts](scripts/check-entities.ts) - Verify entities exist
- [scripts/create-subscription.ts](scripts/create-subscription.ts) - Manually create subscriptions
- [scripts/reset-subscriptions.ts](scripts/reset-subscriptions.ts) - Reset all to free plan
