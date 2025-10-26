# WhatsApp Image Not Showing - URGENT FIX

## Current Problem

I checked your production site and found that **the environment variable is NOT being used**.

The HTML shows:
```html
<meta property="og:image" content="http://localhost:3000/og-image.jpg"/>
```

This should be:
```html
<meta property="og:image" content="https://cool-urls-dev.up.railway.app/og-image.jpg"/>
```

## Why This Happens

Railway needs to **redeploy** after adding environment variables. Sometimes adding the variable doesn't trigger an automatic redeploy.

## Solution - Do This Now

### Option 1: Force Redeploy in Railway Dashboard (RECOMMENDED)

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Open your Cool URLs project
3. Go to the **Deployments** tab
4. Find the latest deployment
5. Click the **three dots menu** (•••)
6. Click **"Redeploy"**
7. Wait 2-3 minutes for deployment to complete

### Option 2: Verify Environment Variable is Set

1. Go to Railway Dashboard → Your service
2. Click the **Variables** tab
3. **Verify this exists:**
   ```
   NEXT_PUBLIC_APP_URL=https://cool-urls-dev.up.railway.app
   ```
4. If it's NOT there, add it now
5. Railway should auto-redeploy when you add it

### Option 3: Make a Small Code Change (Forces Deploy)

If the above doesn't work, push a small change to trigger deployment:

```bash
# Add a space to README or any file
echo "" >> README.md
git add README.md
git commit -m "Trigger redeploy for env vars"
git push origin dev
```

## Verification

After redeployment, check:

1. **Visit**: `https://cool-urls-dev.up.railway.app/`
2. **View Page Source** (right-click → View Page Source)
3. **Search for**: `og:image`
4. **Should see**: `https://cool-urls-dev.up.railway.app/og-image.jpg`
5. **Should NOT see**: `localhost`

Or use this command:
```bash
curl -s https://cool-urls-dev.up.railway.app/ | grep "og:image"
```

You should see:
```html
<meta property="og:image" content="https://cool-urls-dev.up.railway.app/og-image.jpg"/>
```

## Test in WhatsApp

After the environment variable is working:

1. Create a NEW short URL (or use existing)
2. Share it in WhatsApp
3. **Important**: Share to a different chat (WhatsApp caches heavily)
4. The image should now appear!

## Debug Commands

Check if env var is live:
```bash
curl -s https://cool-urls-dev.up.railway.app/ | grep -o 'content="[^"]*og-image[^"]*"'
```

Should output:
```
content="https://cool-urls-dev.up.railway.app/og-image.jpg"
```

If you still see `localhost`, the env var isn't loaded.

## Why WhatsApp is Particularly Strict

WhatsApp validates:
- ✅ Image must be < 300KB (we're at 172KB)
- ✅ Dimensions should be 1200x630 (we have this)
- ✅ JPEG format (we're using this)
- ✅ **Absolute URL** (this is what's broken - showing localhost)
- ✅ **Public accessibility** (image is public, but URL is wrong)

The localhost URL makes WhatsApp think the image doesn't exist.

---

**TL;DR**: The env var `NEXT_PUBLIC_APP_URL` is set in Railway but the deployment isn't using it. Force a redeploy!
