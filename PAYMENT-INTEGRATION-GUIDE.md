# Payment Integration Guide

This guide walks you through setting up Stripe and PayPal integration for the Cool URLs subscription system.

## Overview

The application now supports:
- **7 pricing tiers**: Free, Starter ($13), Growth ($33), Business ($49), Enterprise ($74), Scale ($129), Premium ($299)
- **Click limits**: From 1K to 1M+ clicks per month
- **Branded URLs**: Available for paid plans only
- **Payment providers**: Stripe and PayPal

## Database Schema

The following entities have been added to `instant.schema.ts`:

1. **subscriptions**: Stores user subscription data
2. **payments**: Records individual payment transactions
3. **invoices**: Stores invoice data
4. **usageTracking**: Tracks daily click usage per URL

## Step 1: Environment Variables

Add the following variables to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal Configuration
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...
PAYPAL_MODE=sandbox  # or 'live' for production

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 2: Push Schema to InstantDB

Run the following command to push the updated schema:

```bash
npx instant-cli push-schema --yes
```

## Step 3: Create Stripe Products

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Create products for each plan:
   - **Starter**: $13/month (1K clicks, branded)
   - **Growth**: $33/month (25K clicks, branded) - Mark as popular
   - **Business**: $49/month (50K clicks, branded)
   - **Enterprise**: $74/month (100K clicks, branded)
   - **Scale**: $129/month (500K clicks, branded)
   - **Premium**: $299/month (1M+ clicks, branded)

3. For each product, create:
   - A **monthly** price
   - A **yearly** price (with ~16% discount for 2 months free)

4. Copy the price IDs and update `lib/pricing.ts`:

```typescript
starter: {
  // ...
  stripePriceId: 'price_xxxxx',  // Monthly price ID
  stripeYearlyPriceId: 'price_xxxxx',  // Yearly price ID
}
```

## Step 4: Create PayPal Products

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/live)
2. Create products and billing plans for each tier
3. Copy the plan IDs and update `lib/pricing.ts`:

```typescript
starter: {
  // ...
  paypalPlanId: 'P-xxxxx',  // Monthly plan ID
  paypalYearlyPlanId: 'P-xxxxx',  // Yearly plan ID
}
```

## Step 5: Set Up Webhooks

### Stripe Webhooks

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret to `.env.local`

### PayPal Webhooks

1. Go to [PayPal Webhooks](https://developer.paypal.com/dashboard/webhooks)
2. Add webhook: `https://your-domain.com/api/webhooks/paypal`
3. Select events:
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.UPDATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.SUSPENDED`
   - `BILLING.SUBSCRIPTION.EXPIRED`
   - `PAYMENT.SALE.COMPLETED`
4. Copy the webhook ID to `.env.local`

## Step 6: Implementation Checklist

### ✅ Completed
- [x] Database schema with subscriptions, payments, invoices, usageTracking
- [x] Pricing plans configuration (`lib/pricing.ts`)
- [x] Installed Stripe and PayPal SDKs

### 🚧 In Progress
- [ ] Environment variables template

### 📝 Remaining Tasks

#### Core Integration
- [ ] Stripe API client setup (`lib/stripe.ts`)
- [ ] PayPal API client setup (`lib/paypal.ts`)
- [ ] Pricing page UI (`app/pricing/page.tsx`)
- [ ] Checkout API routes:
  - [ ] `/api/checkout/stripe` - Create Stripe checkout session
  - [ ] `/api/checkout/paypal` - Create PayPal order
- [ ] Webhook handlers:
  - [ ] `/api/webhooks/stripe` - Handle Stripe events
  - [ ] `/api/webhooks/paypal` - Handle PayPal events

#### Subscription Management
- [ ] Subscription service (`lib/subscription-service.ts`)
  - [ ] Create subscription
  - [ ] Update subscription
  - [ ] Cancel subscription
  - [ ] Check usage limits
- [ ] Dashboard subscription widget
  - [ ] Current plan display
  - [ ] Usage meter (clicks used vs limit)
  - [ ] Upgrade/downgrade buttons
  - [ ] Cancel subscription button
- [ ] Billing page (`app/dashboard/billing/page.tsx`)
  - [ ] Payment history
  - [ ] Invoices list
  - [ ] Download invoices

#### Usage Tracking
- [ ] Click tracking middleware
- [ ] Usage tracking service
- [ ] Daily usage aggregation
- [ ] Usage limit enforcement
  - [ ] Prevent URL creation when limit reached
  - [ ] Prevent URL clicks when limit reached
  - [ ] Display warning at 80% usage

#### Admin Panel
- [ ] Subscriptions management page (`app/admin/subscriptions/page.tsx`)
- [ ] View all subscriptions
- [ ] Cancel/modify user subscriptions
- [ ] View payment history
- [ ] Generate reports

## Implementation Priority

### Phase 1: Core Payment Flow (Start Here)
1. Create Stripe/PayPal API clients
2. Build pricing page
3. Implement checkout flows
4. Set up webhook handlers
5. Test with Stripe test mode

### Phase 2: Subscription Management
1. Add subscription widget to dashboard
2. Implement upgrade/downgrade logic
3. Add cancellation flow
4. Create billing history page

### Phase 3: Usage Tracking
1. Implement click tracking
2. Add usage limits enforcement
3. Create usage dashboard
4. Add usage warnings

### Phase 4: Admin Features
1. Build admin subscriptions page
2. Add subscription modification tools
3. Create billing reports

## Testing

### Stripe Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

### PayPal Sandbox
- Use sandbox accounts from PayPal Developer Dashboard
- Test all subscription flows

## Next Steps

1. **Add environment variables** to `.env.local`
2. **Push schema** to InstantDB
3. **Create Stripe products** and get price IDs
4. **Create PayPal plans** and get plan IDs
5. **Update `lib/pricing.ts`** with IDs
6. **Implement Stripe client** and checkout
7. **Implement PayPal client** and checkout
8. **Set up webhooks** for both providers

## Support

For questions or issues:
- Stripe: https://stripe.com/docs
- PayPal: https://developer.paypal.com/docs
- InstantDB: https://instantdb.com/docs
