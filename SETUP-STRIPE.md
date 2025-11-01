# Stripe Payment Setup Guide

Follow these steps exactly to set up Stripe payments for your Cool URLs application.

## Step 1: Create a Stripe Account (if you don't have one)

1. Go to https://stripe.com
2. Click "Sign up"
3. Create your account
4. You'll be in **Test Mode** by default (perfect for development)

## Step 2: Get Your Stripe API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. You'll see two keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`) - Click "Reveal test key" to see it

3. Copy both keys and add them to your `.env.local` file:

Open the file at: `/Users/alsulaihim/All-Day-Dev/cool-urls-0/.env.local`

Add these lines (replace with your actual keys):

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 3: Push the Database Schema

Run this command in your terminal:

```bash
npx instant-cli push-schema --yes
```

This will add the new subscription tables to your database.

## Step 4: Create Stripe Products & Get Price IDs

Now you need to create 6 products in Stripe (one for each paid plan).

### Method 1: Use the Stripe Dashboard (Easiest)

1. Go to https://dashboard.stripe.com/test/products
2. Click "+ Add product" button

**Create Product 1: Starter Plan**
- Product name: `Starter Plan`
- Description: `Up to 1,000 clicks - Branded URLs`
- Click "+ Add price"
  - Price: `13.00` USD
  - Billing period: `Monthly` (Recurring)
  - Click "Add price"
- Click "Save product"
- **Copy the Price ID** (starts with `price_`) - you'll need this!

**Create Product 2: Growth Plan**
- Product name: `Growth Plan`
- Description: `Up to 25,000 clicks - Branded URLs`
- Price: `33.00` USD monthly (recurring)
- **Copy the Price ID**

**Create Product 3: Business Plan**
- Product name: `Business Plan`
- Description: `Up to 50,000 clicks - Branded URLs`
- Price: `49.00` USD monthly (recurring)
- **Copy the Price ID**

**Create Product 4: Enterprise Plan**
- Product name: `Enterprise Plan`
- Description: `Up to 100,000 clicks - Branded URLs`
- Price: `74.00` USD monthly (recurring)
- **Copy the Price ID**

**Create Product 5: Scale Plan**
- Product name: `Scale Plan`
- Description: `Up to 500,000 clicks - Branded URLs`
- Price: `129.00` USD monthly (recurring)
- **Copy the Price ID**

**Create Product 6: Premium Plan**
- Product name: `Premium Plan`
- Description: `Up to 1,000,000+ clicks - Branded URLs`
- Price: `299.00` USD monthly (recurring)
- **Copy the Price ID**

### Method 2: Use the Automated Script (Faster)

I can create a script that will create all 6 products automatically. Let me know if you want this option!

## Step 5: Update the Pricing Configuration with Price IDs

After creating all products, you'll have 6 Price IDs. Update the file:

`/Users/alsulaihim/All-Day-Dev/cool-urls-0/lib/pricing.ts`

Find each plan and add the `stripePriceId`:

```typescript
starter: {
  id: 'starter',
  name: 'Starter',
  // ... other fields
  stripePriceId: 'price_1ABC123xyz...', // 👈 Add your Price ID here
},
growth: {
  id: 'growth',
  name: 'Growth',
  // ... other fields
  stripePriceId: 'price_1DEF456xyz...', // 👈 Add your Price ID here
},
business: {
  id: 'business',
  name: 'Business',
  // ... other fields
  stripePriceId: 'price_1GHI789xyz...', // 👈 Add your Price ID here
},
enterprise: {
  id: 'enterprise',
  name: 'Enterprise',
  // ... other fields
  stripePriceId: 'price_1JKL012xyz...', // 👈 Add your Price ID here
},
scale: {
  id: 'scale',
  name: 'Scale',
  // ... other fields
  stripePriceId: 'price_1MNO345xyz...', // 👈 Add your Price ID here
},
premium: {
  id: 'premium',
  name: 'Premium',
  // ... other fields
  stripePriceId: 'price_1PQR678xyz...', // 👈 Add your Price ID here
},
```

## Step 6: Set Up Stripe CLI for Local Webhook Testing

For local development, you need to forward Stripe webhooks to your localhost.

1. **Install Stripe CLI**: https://stripe.com/docs/stripe-cli#install

   - **macOS**: `brew install stripe/stripe-cli/stripe`
   - **Windows**: Download from https://github.com/stripe/stripe-cli/releases
   - **Linux**: Download from https://github.com/stripe/stripe-cli/releases

2. **Login to Stripe CLI**:
   ```bash
   stripe login
   ```
   This will open your browser to authorize the CLI.

3. **Forward webhooks to localhost**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   This command will output a **webhook signing secret** like:
   ```
   > Ready! Your webhook signing secret is whsec_abc123xyz... (^C to quit)
   ```

4. **Add the webhook secret to `.env.local`**:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_abc123xyz...
   ```

5. **Keep the terminal running** while you test. Open a new terminal tab for other commands.

## Step 7: Test with Stripe Test Cards

Use these test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

For all test cards:
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

## Quick Checklist

- [ ] Created Stripe account
- [ ] Got API keys and added to `.env.local`
- [ ] Ran `npx instant-cli push-schema --yes`
- [ ] Created 6 products in Stripe Dashboard
- [ ] Copied all 6 Price IDs
- [ ] Updated `lib/pricing.ts` with Price IDs
- [ ] Installed Stripe CLI
- [ ] Running `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- [ ] Added webhook secret to `.env.local`

## What's Next?

Once you complete these steps, I'll create:
1. The pricing page with inline payment form
2. The subscription management in the dashboard
3. The webhook handler to process payments
4. Usage tracking and enforcement

Let me know when you're ready, or if you need help with any step!

## Need an Automated Setup?

I can create a script that:
- Creates all 6 Stripe products automatically
- Outputs the Price IDs for you to copy
- Updates the pricing.ts file automatically

Just let me know if you want this!
