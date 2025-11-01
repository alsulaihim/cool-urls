# Inline Payment Implementation Guide

This document provides the complete implementation for inline, embedded payment flows with Stripe (no redirects or popups).

## ✅ Completed Setup

1. **Database Schema**: Added subscriptions, payments, invoices, usageTracking entities
2. **Pricing Configuration**: Created `lib/pricing.ts` with all 7 tiers
3. **Packages Installed**:
   - `stripe` - Server-side Stripe SDK
   - `@stripe/stripe-js` - Client-side Stripe.js
   - `@stripe/react-stripe-js` - React components for Stripe Elements
   - `@paypal/paypal-server-sdk` - PayPal integration

## 🎯 Implementation Approach

### Inline Payment Flow (No Redirects/Popups)

1. User clicks "Upgrade" on pricing page
2. Payment form **expands inline** on the same page
3. User enters card details in embedded Stripe Elements
4. Payment processes **without leaving the page**
5. Success message shows inline with confetti animation
6. Dashboard automatically updates with new subscription

## 📋 Required Environment Variables

Add to `.env.local`:

```env
# Stripe Keys (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Get after creating webhook

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🚀 Implementation Steps

### Step 1: Push Schema to InstantDB

```bash
npx instant-cli push-schema --yes
```

### Step 2: Create Stripe Products

Before running the app, you need to create products in Stripe:

1. Go to: https://dashboard.stripe.com/test/products
2. Create 6 products (Free plan doesn't need Stripe product):

**Product 1: Starter**
- Name: "Starter Plan"
- Description: "Up to 1K clicks - Branded URLs"
- Add price: $13.00 USD / month (recurring)
- Copy the Price ID (starts with `price_`)

**Product 2: Growth**
- Name: "Growth Plan"
- Description: "Up to 25K clicks - Branded URLs"
- Add price: $33.00 USD / month (recurring)
- Copy the Price ID

**Product 3: Business**
- Name: "Business Plan"
- Description: "Up to 50K clicks - Branded URLs"
- Add price: $49.00 USD / month (recurring)
- Copy the Price ID

**Product 4: Enterprise**
- Name: "Enterprise Plan"
- Description: "Up to 100K clicks - Branded URLs"
- Add price: $74.00 USD / month (recurring)
- Copy the Price ID

**Product 5: Scale**
- Name: "Scale Plan"
- Description: "Up to 500K clicks - Branded URLs"
- Add price: $129.00 USD / month (recurring)
- Copy the Price ID

**Product 6: Premium**
- Name: "Premium Plan"
- Description: "Up to 1M+ clicks - Branded URLs"
- Add price: $299.00 USD / month (recurring)
- Copy the Price ID

### Step 3: Update Pricing Configuration

After creating products, update `lib/pricing.ts` with the actual Stripe Price IDs:

```typescript
// lib/pricing.ts
export const PRICING_PLANS: Record<PlanId, PricingPlan> = {
  // ... existing config
  starter: {
    // ... existing fields
    stripePriceId: 'price_xxxxxxxxxxxxx', // Replace with actual Stripe Price ID
  },
  growth: {
    // ... existing fields
    stripePriceId: 'price_xxxxxxxxxxxxx', // Replace with actual Stripe Price ID
  },
  // ... do the same for business, enterprise, scale, premium
};
```

### Step 4: Set Up Stripe Webhook

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "+ Add endpoint"
3. Endpoint URL: `http://localhost:3000/api/webhooks/stripe` (for local testing, use Stripe CLI)
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the "Signing secret" (starts with `whsec_`) to `.env.local`

**For Local Development:**

Use Stripe CLI to forward webhooks to localhost:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will give you a webhook signing secret starting with `whsec_` - add it to `.env.local`

## 📁 Files to Create

I'll now create all the necessary files for the inline payment implementation.

### Summary of Features

✅ **Inline Checkout**
- Stripe Elements embedded directly on pricing page
- No redirects, no popups
- Smooth animations and transitions
- Real-time validation

✅ **Clean UI**
- Minimalist design matching your current style
- Card input with nice styling
- Loading states and success animations
- Error handling inline

✅ **User Experience**
- One-click upgrade from dashboard
- Instant plan changes
- Usage meter showing clicks used
- Cancel anytime

✅ **Admin Features**
- View all subscriptions
- Manual subscription management
- Revenue analytics

## Next Steps

After I create all the files, you'll need to:

1. Add Stripe API keys to `.env.local`
2. Create products in Stripe Dashboard
3. Update price IDs in `lib/pricing.ts`
4. Push schema to InstantDB
5. Test the flow with Stripe test cards

The implementation will be completely inline - users will never leave your page during payment!
