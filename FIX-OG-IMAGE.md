# Fix Open Graph Image Not Showing

## Problem

When sharing your Cool URLs link on social media (WhatsApp, Twitter, Facebook, etc.), the image is not showing because `NEXT_PUBLIC_APP_URL` is set to `http://localhost:3000` in your local environment.

Social media platforms cannot access localhost, so they can't fetch the image.

## Solution

Add the production URL as an environment variable in Railway.

### Step 1: Add Environment Variable to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Open your **Cool URLs** project
3. Click on your service (the deployment)
4. Go to the **Variables** tab
5. Click **Add Variable**
6. Add this variable:
   ```
   NEXT_PUBLIC_APP_URL=https://cool-urls-dev.up.railway.app
   ```
7. Click **Add**

Railway will automatically redeploy with the new environment variable.

### Step 2: Wait for Deployment

- Wait 2-3 minutes for Railway to redeploy
- Check the deployment logs to ensure it completes successfully

### Step 3: Test

1. Create a new short URL (or use an existing one)
2. Copy the link
3. Paste it into WhatsApp, Twitter, or Facebook
4. The preview should now show:
   - ✅ Cool URLs - URL Shortener (title)
   - ✅ Create beautiful short links with custom prefixes (description)
   - ✅ The og-image.png image

## Alternative: Use Custom Domain

If you have a custom domain configured (from CUSTOM-DOMAIN.md), use that instead:

```
NEXT_PUBLIC_APP_URL=https://your-custom-domain.com
```

## Verification

To verify the Open Graph tags are working:

1. Visit: https://www.opengraph.xyz/
2. Enter your Railway URL: `https://cool-urls-dev.up.railway.app`
3. Check that the image loads correctly

Or use:
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

## Technical Details

The issue is in `app/layout.tsx:18`:
```typescript
metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
```

Without the environment variable in Railway, it defaults to localhost, which makes the image URL:
```
http://localhost:3000/og-image.jpg  ❌ Not accessible from internet
```

With the correct environment variable:
```
https://cool-urls-dev.up.railway.app/og-image.jpg  ✅ Accessible from internet
```

### WhatsApp-Specific Requirements ✅

WhatsApp has strict requirements for Open Graph images that we've now optimized for:
- **Maximum file size**: 300KB (we optimized to **172KB** ✅)
- **Recommended dimensions**: 1200x630 pixels (we use exactly this ✅)
- **Format**: JPEG works better than PNG for WhatsApp
- **File type declaration**: Must include `type: 'image/jpeg'` in metadata

## Quick Command Reference

If you want to set it via Railway CLI:
```bash
railway variables set NEXT_PUBLIC_APP_URL=https://cool-urls-dev.up.railway.app
```

---

**Once you add this variable and redeploy, your social previews will work perfectly!** 🎉
