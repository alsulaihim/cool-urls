# Stripe Webhook Setup Guide

## Current Status

✅ **Webhook Handler**: Already implemented at [app/api/webhooks/stripe/route.ts](app/api/webhooks/stripe/route.ts)
✅ **Subscription Service**: Updated to UPSERT (create or update) subscriptions
❌ **Webhook Secret**: Not configured in `.env.local`

## The Problem

When users subscribe through Stripe, the payment succeeds but the subscription doesn't update in our database because:

1. **Missing Webhook Secret**: The `STRIPE_WEBHOOK_SECRET` environment variable is not set
2. **Webhooks Not Configured**: Stripe doesn't know where to send webhook events

## Solution: Two Approaches

### Option 1: Local Development with Stripe CLI (Recommended for Testing)

#### Step 1: Install Stripe CLI

**macOS (Homebrew)**:
```bash
brew install stripe/stripe-cli/stripe
```

**Other platforms**: Download from https://docs.stripe.com/stripe-cli

#### Step 2: Login to Stripe CLI

```bash
stripe login
```

This will open your browser to authenticate.

#### Step 3: Start Webhook Forwarding

In a new terminal, run:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This command will:
- Start listening for Stripe events
- Forward them to your local dev server
- **Output a webhook secret** (starts with `whsec_...`)

#### Step 4: Add Webhook Secret to .env.local

Copy the webhook secret from step 3 and add it to `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

#### Step 5: Restart Dev Server

```bash
# Kill existing server
pkill -f "next dev"

# Start again
npm run dev
```

#### Step 6: Test Webhooks

Create a test subscription:

```bash
stripe trigger checkout.session.completed
```

Check your terminal - you should see webhook events being processed!

---

### Option 2: Production Setup with Stripe Dashboard

#### Step 1: Deploy Your Application

Deploy to production (Vercel, etc.) and note your production URL.

#### Step 2: Add Webhook in Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. Enter your webhook URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**

#### Step 3: Get Webhook Signing Secret

1. Click on the webhook you just created
2. Click **"Reveal"** next to **Signing secret**
3. Copy the secret (starts with `whsec_...`)

#### Step 4: Add to Production Environment

Add the secret to your production environment variables:

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_production_secret_here
```

For Vercel:
```bash
vercel env add STRIPE_WEBHOOK_SECRET
```

Or add it in the Vercel dashboard under Settings > Environment Variables.

---

## Webhook Events We Handle

Our webhook handler ([app/api/webhooks/stripe/route.ts](app/api/webhooks/stripe/route.ts:44-212)) processes these events:

| Event | What It Does |
|-------|--------------|
| `checkout.session.completed` | Creates subscription when checkout completes |
| `customer.subscription.created` | Creates subscription when subscription is created |
| `customer.subscription.updated` | Updates subscription (plan changes, status changes) |
| `customer.subscription.deleted` | Marks subscription as cancelled |
| `invoice.payment_succeeded` | Records successful payment |
| `invoice.payment_failed` | Records failed payment, marks subscription as past_due |

## Testing Webhooks Locally

### 1. Trigger Test Events

```bash
# Trigger checkout completed
stripe trigger checkout.session.completed

# Trigger subscription created
stripe trigger customer.subscription.created

# Trigger payment succeeded
stripe trigger invoice.payment_succeeded
```

### 2. Check Logs

Watch your dev server terminal for logs like:

```
[Webhook] Received event: checkout.session.completed
[Webhook] Checkout session completed: cs_test_...
[Subscription] Created subscription for user a86e99b6-5928-495d-b1f3-2ea695ac20a7: growth
[Webhook] Created subscription for user ..., plan growth
```

### 3. Verify in Database

```bash
npx tsx scripts/check-user.ts
```

Should show the updated subscription!

---

## Troubleshooting

### Problem: "Webhook signature verification failed"

**Cause**: Wrong webhook secret
**Fix**: Make sure the secret in `.env.local` matches the one from `stripe listen`

### Problem: "Webhook secret not configured"

**Cause**: `STRIPE_WEBHOOK_SECRET` not set
**Fix**: Add it to `.env.local` and restart dev server

### Problem: Webhooks not received

**Cause**: Stripe CLI not forwarding
**Fix**: Make sure `stripe listen` is running in a separate terminal

### Problem: Subscription not created

**Cause**: Missing metadata (userId, planId) in Stripe subscription
**Fix**: Check that your checkout flow includes metadata:

```typescript
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: priceId }],
  metadata: {
    userId: 'user_123',
    planId: 'growth',
  },
});
```

---

## For Your Current Situation

Since you already subscribed but it didn't update:

1. **Your subscription was manually updated** to Growth plan using:
   ```bash
   npx tsx scripts/create-subscription.ts 1 growth
   ```

2. **To prevent this in future**: Set up webhooks using Option 1 above

3. **To test if webhooks work now**:
   - Install Stripe CLI
   - Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   - Add the webhook secret to `.env.local`
   - Try subscribing again (or trigger test events)

---

## Next Steps

1. ✅ Subscription service updated to UPSERT (done)
2. 🔲 Install Stripe CLI (optional, for local testing)
3. 🔲 Set up webhook forwarding for development
4. 🔲 Configure production webhooks in Stripe Dashboard
5. 🔲 Test end-to-end subscription flow

---

## Related Files

- [app/api/webhooks/stripe/route.ts](app/api/webhooks/stripe/route.ts) - Webhook handler
- [lib/subscription-service.ts](lib/subscription-service.ts) - Subscription CRUD operations
- [app/api/subscriptions/create/route.ts](app/api/subscriptions/create/route.ts) - Subscription creation API
- [scripts/check-user.ts](scripts/check-user.ts) - Check user subscriptions

---

## Documentation

- [Stripe Webhooks Guide](https://docs.stripe.com/webhooks)
- [Stripe CLI](https://docs.stripe.com/stripe-cli)
- [Testing Webhooks](https://docs.stripe.com/webhooks/test)
