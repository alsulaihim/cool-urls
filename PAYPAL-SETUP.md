# PayPal Payment Integration Setup Guide

This guide will help you set up PayPal payments with inline checkout (no redirects) for your Cool URLs subscription system.

## Features

✅ **Inline PayPal Buttons** - No redirects, smooth UX
✅ **Dual Payment Support** - Users can choose between Stripe (Credit Card) or PayPal
✅ **Subscription Management** - Automatic billing, cancellation, webhooks
✅ **Sandbox Testing** - Test with PayPal sandbox before going live

## Prerequisites

- PayPal Business Account (or Sandbox account for testing)
- PayPal Developer Account access
- Your application already running

## Step 1: Create PayPal App

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard)
2. Click **Apps & Credentials**
3. Switch to **Sandbox** (for testing) or **Live** (for production)
4. Click **Create App**
5. Enter app name: `Cool URLs Subscriptions`
6. Click **Create App**
7. **Copy your Client ID and Secret** - you'll need these!

## Step 2: Create Subscription Plans

### Using PayPal Dashboard:

1. Go to [PayPal Subscriptions](https://www.paypal.com/billing/plans)
2. Click **Create Plan**
3. For each pricing tier (Starter, Growth, Business, etc.):
   - **Plan Name**: `Cool URLs - Starter` (etc.)
   - **Billing Cycle**: Monthly
   - **Price**: Match your pricing.ts prices
   - **Setup Fee**: $0
   - Click **Save**
   - **Copy the Plan ID** (format: `P-XXXXXXXXXXXX`)

### Plans to Create:

| Plan | Price | PayPal Plan Name |
|------|-------|------------------|
| Starter | $13/month | Cool URLs - Starter |
| Growth | $33/month | Cool URLs - Growth |
| Business | $49/month | Cool URLs - Business |
| Enterprise | $74/month | Cool URLs - Enterprise |
| Scale | $129/month | Cool URLs - Scale |
| Premium | $299/month | Cool URLs - Premium |

## Step 3: Configure Environment Variables

Add these to your `.env.local` file:

```bash
# PayPal Configuration
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_client_id_here

# For webhook verification (optional but recommended for production)
PAYPAL_WEBHOOK_ID=your_webhook_id_here
```

**Important**:
- Use **Sandbox** credentials for development
- Use **Live** credentials for production
- The `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is used by the frontend PayPal buttons

## Step 4: Update Pricing Plans with PayPal IDs

Edit `lib/pricing.ts` and add PayPal plan IDs:

```typescript
starter: {
  id: 'starter',
  name: 'Starter',
  price: 13,
  stripePriceId: 'price_1SOPDNFslEt6ImixLcKFinPI',
  paypalPlanId: 'P-XXXXXXXXXXXX', // Add this
  // ... rest of config
},
```

Repeat for all plans that support PayPal.

## Step 5: Push Database Schema

The PayPal subscription field has been added to the schema. Push it to InstantDB:

```bash
npx instant-cli push schema
```

## Step 6: Set Up Webhooks

### For Development (using ngrok or similar):

1. Install ngrok: `npm install -g ngrok`
2. Start your dev server: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)

### Configure PayPal Webhook:

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard)
2. Click your app
3. Go to **Webhooks**
4. Click **Add Webhook**
5. **Webhook URL**: `https://your-domain.com/api/webhooks/paypal` (or ngrok URL for dev)
6. **Event types** - Select these:
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.EXPIRED`
   - `BILLING.SUBSCRIPTION.SUSPENDED`
   - `BILLING.SUBSCRIPTION.UPDATED`
   - `PAYMENT.SALE.COMPLETED`
7. Click **Save**
8. **Copy the Webhook ID** and add it to your `.env.local`

## Step 7: Update Your Pricing Page

Replace the checkout component with the unified version:

```typescript
// Before
import CheckoutForm from '@/components/checkout/checkout-form';

// After
import UnifiedCheckout from '@/components/checkout/unified-checkout';

// In your component
<UnifiedCheckout
  planId={selectedPlan}
  userId={user.id}
  email={user.email}
  onSuccess={() => router.push('/dashboard')}
  onCancel={() => setShowCheckout(false)}
/>
```

## Step 8: Test in Sandbox

### Create Test Account:

1. Go to [PayPal Sandbox Accounts](https://developer.paypal.com/dashboard/accounts)
2. You should see auto-generated **Personal** and **Business** accounts
3. Click on **Personal Account** to view credentials
4. Note the email and password

### Test Flow:

1. Start your app: `npm run dev`
2. Go to pricing page
3. Select a plan
4. Click **PayPal** tab
5. Click **Subscribe** button
6. **Login with Sandbox Personal Account** credentials
7. Approve the subscription
8. Verify subscription appears in dashboard

### Verify in PayPal:

1. Check [Sandbox Dashboard](https://www.sandbox.paypal.com)
2. Login with **Business Account** credentials
3. Go to **Activity** → should see the subscription

## Step 9: Go Live

### Switch to Production:

1. Get **Live** credentials from PayPal Developer Dashboard
2. Create **Live** subscription plans
3. Update `.env.local` with **Live** credentials:

```bash
# Use LIVE credentials (remove sandbox ones)
PAYPAL_CLIENT_ID=your_live_client_id
PAYPAL_CLIENT_SECRET=your_live_client_secret
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_live_client_id
```

4. Set up webhook with **production URL**
5. Update `lib/pricing.ts` with **Live** PayPal plan IDs
6. Deploy to production

## Troubleshooting

### PayPal buttons not showing:

- Check browser console for errors
- Verify `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is set
- Make sure you're using the correct environment (sandbox vs live)

### Subscription not activating:

- Check `/api/webhooks/paypal` logs
- Verify webhook URL is accessible
- Check PayPal Developer Dashboard → Webhooks → Recent Deliveries

### "PayPal is not configured for this plan":

- Make sure `paypalPlanId` is set in `lib/pricing.ts`
- Verify the plan ID is correct (format: `P-XXXXXXXXXXXX`)

### Payment fails immediately:

- In sandbox, make sure you're using sandbox test accounts
- Check that subscription plan is active in PayPal
- Verify client ID matches the environment (sandbox/live)

## Security Best Practices

1. **Never commit credentials** - Use environment variables only
2. **Enable webhook verification** - Set `PAYPAL_WEBHOOK_ID` in production
3. **Use HTTPS** - PayPal requires HTTPS for webhooks in production
4. **Monitor webhooks** - Check PayPal Dashboard regularly for failed deliveries
5. **Test thoroughly** - Always test in sandbox before going live

## Testing with PayPal Sandbox

### Sandbox Test Cards:

PayPal uses real PayPal accounts in sandbox, but here are test credit cards you can add to sandbox accounts:

- **Visa**: 4032039697210072
- **Mastercard**: 5425233430109903
- **Discover**: 6011000991001201
- **Amex**: 374245455400001

Use any future expiry date and any 3-digit CVV.

### Sandbox Personal Account Funding:

All sandbox personal accounts come with unlimited funds - no need to add money!

## Support

- [PayPal Developer Docs](https://developer.paypal.com/docs/subscriptions/)
- [PayPal Subscriptions API](https://developer.paypal.com/docs/subscriptions/)
- [PayPal Webhooks Guide](https://developer.paypal.com/docs/api-basics/notifications/)

## What's Next?

- **Test thoroughly in sandbox**
- **Set up monitoring** for webhook failures
- **Add cancellation flow** in user dashboard
- **Configure email notifications** for subscription events

Your PayPal integration is now ready! 🎉
