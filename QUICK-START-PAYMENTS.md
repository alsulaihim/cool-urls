# Quick Start: Setting Up Payments

## ⚡ Fast Track Setup (5 minutes)

### Step 1: Get Your Stripe Keys

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Click "Reveal test key" and copy your **Secret key** (starts with `sk_test_`)

### Step 2: Add Keys to Environment File

Open this file in your code editor:
```
/Users/alsulaihim/All-Day-Dev/cool-urls-0/.env.local
```

Add these lines at the end (replace with your actual keys):

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Push Database Schema

Run this in your terminal:

```bash
cd /Users/alsulaihim/All-Day-Dev/cool-urls-0
npx instant-cli push-schema --yes
```

### Step 4: Create Stripe Products Automatically

Run this script to create all 6 products in Stripe:

```bash
npx tsx scripts/setup-stripe-products.ts
```

This will:
- Create all 6 pricing plans in your Stripe account
- Output the Price IDs you need
- Show you exactly what to copy

### Step 5: Update Pricing File

The script will tell you exactly what Price IDs to add. Open:
```
lib/pricing.ts
```

And add the `stripePriceId` to each plan (the script output shows exactly where).

### Step 6: Set Up Webhooks (for local testing)

Install Stripe CLI (one time):
```bash
# On macOS:
brew install stripe/stripe-cli/stripe

# On Windows/Linux: download from
# https://github.com/stripe/stripe-cli/releases
```

Login to Stripe:
```bash
stripe login
```

Forward webhooks to your local server:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook secret (starts with `whsec_`) and add it to `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

**Keep this terminal tab running!** Open a new tab for other commands.

## ✅ You're Done!

Now I can create the pricing page and payment UI for you. Let me know when you've completed these steps!

## 🎨 What You'll Get

Once set up, your app will have:

1. **Beautiful Pricing Page** (`/pricing`)
   - Inline payment form (no redirects!)
   - Stripe Elements for secure card input
   - One-click upgrades

2. **Dashboard Subscription Widget**
   - Current plan display
   - Usage meter showing clicks used
   - Upgrade/downgrade buttons

3. **Billing Page** (`/dashboard/billing`)
   - Payment history
   - Download invoices
   - Manage subscription

4. **Admin Panel**
   - View all subscriptions
   - Manage user plans
   - Revenue analytics

## 🧪 Testing

Use Stripe test cards:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- Any future expiry date and any CVC

## Need Help?

Check the detailed guides:
- [SETUP-STRIPE.md](SETUP-STRIPE.md) - Detailed setup instructions
- [PAYMENT-INTEGRATION-GUIDE.md](PAYMENT-INTEGRATION-GUIDE.md) - Technical implementation details
- [INLINE-PAYMENT-IMPLEMENTATION.md](INLINE-PAYMENT-IMPLEMENTATION.md) - Inline checkout approach

Let me know when you're ready for me to build the UI!
