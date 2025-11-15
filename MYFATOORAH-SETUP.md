# MyFatoorah Integration - Quick Setup Guide

## Step 1: Add Environment Variables

Add these to your `.env.local` file:

```bash
# MyFatoorah Configuration (Test Mode)
MYFATOORAH_API_KEY=your_test_api_key_here
MYFATOORAH_MODE=test
NEXT_PUBLIC_MYFATOORAH_ENABLED=true
```

**Where to get your API key:**
1. Login to [MyFatoorah Portal](https://portal.myfatoorah.com/)
2. Go to **Integration Settings**
3. Copy your **Test API Token**

## Step 2: Update Database Schema

Push the updated schema to InstantDB:

```bash
npx instant-cli push schema
```

This adds the `myFatoorahSubscriptionId` field to subscriptions.

## Step 3: Enable MyFatoorah in Admin

1. Go to your admin panel: `http://localhost:3000/admin/settings`
2. Scroll to **Payment Provider Settings**
3. Toggle **MyFatoorah** to **Enabled**
4. Click **Save Settings**

## Step 4: Test the Integration

1. Go to pricing page: `http://localhost:3000/pricing`
2. Select a plan (e.g., Growth - $33/month)
3. Click "Get Started"
4. You should now see **three payment options**:
   - Credit Card (Stripe)
   - PayPal
   - **MyFatoorah** ← New!

5. Select MyFatoorah and the embedded payment form should load

## Step 5: Test Mode Cards

Use these test cards in MyFatoorah test mode:

| Card Number | Expiry | CVV | Result |
|-------------|--------|-----|--------|
| 5453 0100 1000 0007 | 05/25 | 100 | Success |
| 4005 5500 1000 0001 | 05/25 | 100 | Success |
| 5111 1111 1111 1118 | 05/25 | 100 | Success |

## Step 6: Production Setup (When Ready)

### 6.1 Get Production Credentials

1. Go to [MyFatoorah Portal](https://portal.myfatoorah.com/)
2. Switch to **Live** mode
3. Go to Integration Settings
4. Copy your **Live API Token**

### 6.2 Update Environment Variables

In Railway (or your production environment):

```bash
MYFATOORAH_API_KEY=your_live_api_key_here
MYFATOORAH_MODE=production
NEXT_PUBLIC_MYFATOORAH_ENABLED=true
```

### 6.3 Create Production Plans

Plans are created through MyFatoorah dashboard:

1. Login to MyFatoorah Portal
2. Go to "Recurring Payments" or "Subscriptions"
3. Create plans matching your pricing:
   - Starter: $13/month
   - Growth: $33/month
   - Business: $49/month
   - Enterprise: $74/month
   - Scale: $129/month
   - Premium: $299/month

4. Copy each Plan ID

5. Update `lib/pricing.ts`:
```typescript
starter: {
  // ...existing fields
  myFatoorahPlanId: 'YOUR_STARTER_PLAN_ID',
},
```

## Features Included

✅ **Inline Embedded Checkout** - No redirects (using MyFatoorah Embedded Payment)
✅ **Test Mode** - Safe testing before production
✅ **Worldwide Support** - Not limited to specific countries
✅ **Multiple Payment Methods** - Credit cards, debit cards, KNET, etc.
✅ **3D Secure Support** - Automatic redirect for 3DS verification
✅ **Recurring Billing** - Automated monthly subscriptions
✅ **Admin Controls** - Show/hide payment providers
✅ **Webhook Support** - Real-time payment notifications

## Webhook Setup (Recommended)

1. Go to MyFatoorah Portal → Integration Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/myfatoorah`
3. Select events: Payment Success, Payment Failed
4. Save

## Troubleshooting

### Payment form not loading
- Check that `MYFATOORAH_API_KEY` is set correctly
- Verify `NEXT_PUBLIC_MYFATOORAH_ENABLED=true`
- Check browser console for errors
- Ensure you're using correct API key for the mode (test/production)

### "MyFatoorah is not enabled" error
- Go to Admin Settings and enable MyFatoorah
- Check that the toggle is ON and settings are saved

### Payment fails immediately
- Verify you're using test cards in test mode
- Check API key permissions in MyFatoorah dashboard
- Review webhook logs in admin panel

## Support

- [MyFatoorah Documentation](https://docs.myfatoorah.com/)
- [Embedded Payment Guide](https://docs.myfatoorah.com/docs/embedded-payment)
- [API Reference](https://myfatoorah.readme.io/docs)

## Security Notes

- ✅ API keys stored in environment variables (not in code)
- ✅ PCI compliance not required (using embedded payment)
- ✅ HTTPS required for production
- ✅ Webhook signature verification included
- ✅ Session-based payment initialization
