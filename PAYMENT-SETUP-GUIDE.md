# Payment System Setup Guide

## 🎉 What's Already Complete

Your payment infrastructure is fully built and ready to use:

✅ **Database Schema**: All subscription entities added to InstantDB
✅ **Stripe Products**: All 6 pricing tiers created in Stripe
✅ **API Endpoints**: Subscription creation and management
✅ **Webhook Handler**: Processing Stripe events
✅ **Inline Pricing Page**: `/pricing` with all tiers displayed
✅ **Inline Checkout**: No redirects or popups, as requested

## 📋 Next Steps to Test Payments

### 1. Set Up Stripe Webhook for Local Development

To receive Stripe events locally, you need to set up the Stripe CLI:

```bash
# Install Stripe CLI (if not already installed)
# macOS:
brew install stripe/stripe-cli/stripe

# Or download from: https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhook events to your local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The CLI will output a webhook signing secret that looks like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### 2. Add Webhook Secret to .env.local

Copy the webhook secret and add it to your `.env.local` file:

```bash
# Add this line to .env.local
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

Your `.env.local` should now have:
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Restart the Development Server

After adding the webhook secret, restart your dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## 🧪 Testing the Payment Flow

### Test Card Numbers

Use these Stripe test cards:

- **Success**: `4242 4242 4242 4242`
- **Requires 3D Secure**: `4000 0025 0000 3155`
- **Declined**: `4000 0000 0000 0002`

For all test cards:
- **Expiry**: Any future date (e.g., `12/25`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

### Testing Steps

1. **Navigate to Pricing Page**:
   ```
   http://localhost:3000/pricing
   ```

2. **Sign In**:
   - If not logged in, click "Get Started" on any paid plan
   - You'll be redirected to sign in
   - Use magic link authentication

3. **Select a Plan**:
   - Click "Subscribe" on any paid plan (Starter, Growth, Business, etc.)
   - The checkout form will appear inline on the same page

4. **Enter Payment Details**:
   - Use test card: `4242 4242 4242 4242`
   - Enter any future expiry date and CVC
   - Click "Subscribe Now"

5. **Verify Success**:
   - You should see a success message
   - You'll be redirected to the dashboard
   - Check your Stripe Dashboard to see the subscription

### What Happens Behind the Scenes

1. **Payment Method Created**: Stripe securely saves the card
2. **Subscription Created**: Your API creates the subscription
3. **Webhook Triggered**: Stripe sends events to your webhook
4. **Database Updated**: Subscription saved to InstantDB
5. **User Redirected**: To dashboard with upgraded access

## 🔍 Monitoring Webhooks

While the Stripe CLI is running, you'll see webhook events in real-time:

```
→ POST /api/webhooks/stripe [202]
  customer.subscription.created

→ POST /api/webhooks/stripe [202]
  invoice.payment_succeeded
```

## 📊 Your Pricing Tiers

| Plan | Price | Clicks/Month | Stripe Price ID |
|------|-------|--------------|-----------------|
| Free | $0 | 1,000 | - |
| Starter | $13 | 1,000 | `price_1SOPDNFslEt6ImixLcKFinPI` |
| Growth | $33 | 25,000 | `price_1SOPDOFslEt6ImixxImtx2i1` |
| Business | $49 | 50,000 | `price_1SOPDOFslEt6ImixfrTHqjSm` |
| Enterprise | $74 | 100,000 | `price_1SOPDPFslEt6Imixj3qEg0un` |
| Scale | $129 | 500,000 | `price_1SOPDQFslEt6ImixxgeKln1a` |
| Premium | $299 | 1,000,000+ | `price_1SOPDRFslEt6ImixU0B7ohJd` |

## 🎨 Features Included

### Inline Checkout
- ✅ No redirects or popups
- ✅ Smooth animations
- ✅ Real-time validation
- ✅ 3D Secure support
- ✅ Clear error messages
- ✅ Success confirmation

### Subscription Management
- ✅ Create subscriptions
- ✅ Update subscriptions
- ✅ Cancel subscriptions
- ✅ Track usage (clicks)
- ✅ Payment history
- ✅ Invoice records

### Webhook Events Handled
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`
- ✅ `checkout.session.completed`

## 🚀 Production Deployment

When you're ready to deploy to production:

1. **Update Environment Variables**:
   ```env
   STRIPE_SECRET_KEY=sk_live_...  # Live key instead of test
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...  # From production webhook
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

2. **Create Production Webhook** in Stripe Dashboard:
   - Go to: https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events to send: Select all `customer.subscription.*` and `invoice.*` events
   - Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

3. **Test in Production**:
   - Use real card numbers
   - Verify webhook events are received
   - Check subscription data in InstantDB

## 📁 Key Files Reference

### Configuration
- [lib/pricing.ts](lib/pricing.ts) - Pricing plans and Stripe Price IDs
- [lib/stripe.ts](lib/stripe.ts) - Stripe client and helpers
- [lib/subscription-service.ts](lib/subscription-service.ts) - Database operations

### API Routes
- [app/api/subscriptions/create/route.ts](app/api/subscriptions/create/route.ts) - Create subscription
- [app/api/webhooks/stripe/route.ts](app/api/webhooks/stripe/route.ts) - Webhook handler

### UI Components
- [app/pricing/page.tsx](app/pricing/page.tsx) - Pricing page
- [components/checkout/checkout-form.tsx](components/checkout/checkout-form.tsx) - Checkout form

## 💡 Tips

- **Test Thoroughly**: Use different test cards to verify all scenarios
- **Monitor Logs**: Check server logs and Stripe webhook logs
- **Check Database**: Verify subscriptions are saved correctly in InstantDB
- **Test Errors**: Try declined cards to ensure error handling works
- **Test 3D Secure**: Use `4000 0025 0000 3155` to test authentication flow

## 🐛 Troubleshooting

### Webhook Not Receiving Events
- Ensure Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Check `STRIPE_WEBHOOK_SECRET` is correctly set in `.env.local`
- Restart dev server after adding webhook secret

### Payment Not Processing
- Check browser console for errors
- Verify Stripe keys are correct (test keys for development)
- Check server logs for API errors

### Subscription Not Saving
- Check webhook logs in Stripe CLI output
- Verify `INSTANT_ADMIN_TOKEN` is set correctly
- Check server logs for database errors

## 📚 Documentation

- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Elements](https://stripe.com/docs/stripe-js)
- [InstantDB Admin](https://instantdb.com/docs/admin)

---

## Ready to Test! 🎉

Your payment system is complete and ready to test. Follow the steps above to:

1. Set up local webhooks
2. Add webhook secret to `.env.local`
3. Test with Stripe test cards
4. Verify subscriptions in your dashboard

If you encounter any issues, check the troubleshooting section above.
