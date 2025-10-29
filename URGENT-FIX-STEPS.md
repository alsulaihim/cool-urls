# URGENT: Fix "This short URL doesn't exist" Error

## Step 1: Check What's in the Database

After Railway deploys (wait 2-3 minutes), visit:
```
https://cool-urls-dev.up.railway.app/api/test-db
```

This will show you:
- How many URLs are in the database
- What shortCodes exist
- If URLs are being saved at all

### Expected Results:

**If you see `"totalUrls": 0`:**
- URLs are NOT being saved
- This is a permissions or schema issue

**If you see `"totalUrls": 5` (or any number > 0):**
- URLs ARE being saved
- The issue is in the lookup/query logic

## Step 2: Create a New URL (After Schema Push)

1. Go to homepage: https://cool-urls-dev.up.railway.app
2. Enter a URL (e.g., https://google.com)
3. Click "Shorten URL"
4. Check browser console for any errors
5. Try clicking the generated short URL

## Step 3: Check Railway Logs

```bash
railway logs --tail 50
```

Look for:
- `[Redirect] Total URLs found: X` - Should be > 0
- `[Redirect] All shortCodes in database:` - Should list your codes
- Any "Mutation failed" errors - Means schema/perms not working

## Step 4: Verify InstantDB Dashboard

1. Go to: https://instantdb.com/dash
2. Select your Cool URLs app
3. Click "Explorer" tab
4. Look for "urls" table
5. Click on it to see records

**If you don't see the "urls" table:**
- Schema wasn't pushed correctly
- Try running the push command again with verbose output:

```bash
npx instant-cli@latest push schema --verbose
npx instant-cli@latest push perms --verbose
```

## Step 5: Check Environment Variables in Railway

Make sure BOTH are set:
1. `NEXT_PUBLIC_INSTANT_APP_ID` - Your app ID
2. `INSTANT_ADMIN_TOKEN` - Your admin token

To check:
```bash
railway variables list
```

## Step 6: Manual Schema Push (Alternative Method)

If the script isn't working, try manually:

```bash
# 1. Install instant-cli globally
npm install -g instant-cli

# 2. Login to instant
instant-cli login

# 3. Push schema
instant-cli push schema

# 4. Push permissions
instant-cli push perms
```

## Common Issues and Solutions

### Issue: "totalUrls: 0" from test endpoint
**Solution**: Schema not pushed or permissions blocking

```bash
# Check if schema file exists
cat instant.schema.ts

# Push again
npx instant-cli@latest push schema --force
npx instant-cli@latest push perms --force
```

### Issue: "Mutation failed {}" in console
**Solution**: Client-side can't write to database

1. Check permissions in `instant.perms.ts`
2. The `create: 'true'` should allow anyone to create
3. Push permissions again

### Issue: Schema pushed but still no URLs
**Solution**: Check if URLs are actually being created

1. Open browser console
2. Create a new URL
3. Look for any errors
4. Check Network tab for failed requests

## Quick Test Command Sequence

```bash
# 1. Push schema and perms
npx instant-cli@latest push schema
npx instant-cli@latest push perms

# 2. Check Railway logs
railway logs --tail 20

# 3. Visit test endpoint in browser
open https://cool-urls-dev.up.railway.app/api/test-db

# 4. Create a new URL on homepage
open https://cool-urls-dev.up.railway.app

# 5. Check logs again
railway logs --tail 20
```

## What to Share for Help

If still not working, share:
1. Output from `/api/test-db`
2. Railway logs when creating a URL
3. Railway logs when clicking a short URL
4. Browser console errors (if any)

## Most Likely Fix

Based on the symptoms, this is almost certainly a **schema/permissions issue**.

**Try this sequence**:
1. ✅ Run: `npx instant-cli@latest push schema --force`
2. ✅ Run: `npx instant-cli@latest push perms --force`
3. ✅ Wait 30 seconds
4. ✅ Visit: `https://cool-urls-dev.up.railway.app/api/test-db`
5. ✅ Create a NEW URL (after schema push)
6. ✅ Click it

If after all this it still doesn't work, there might be an issue with how InstantDB is querying. In that case, we may need to switch to a different query method or check if there's a bug in the InstantDB admin SDK.
