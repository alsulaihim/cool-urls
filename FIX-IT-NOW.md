# FIX IT NOW - Redirect Issue

## What Likely Happened

You said it was working before. This means:
1. ✅ The code is correct
2. ✅ The schema was pushed at some point
3. ❌ Something changed with the InstantDB connection

## Most Likely Causes (in order)

### 1. Railway and Local are using DIFFERENT InstantDB Apps
**This is the #1 cause**

Check if Railway's `NEXT_PUBLIC_INSTANT_APP_ID` matches your local `.env.local` file.

```bash
# Check local
cat .env.local | grep NEXT_PUBLIC_INSTANT_APP_ID

# Check Railway
railway variables list | grep NEXT_PUBLIC_INSTANT_APP_ID
```

**If they're different**: You pushed schema to one app, but Railway is using another!

**Solution**: Make them match, then push schema to the RIGHT app.

### 2. Old URLs in Database, New Schema Required New Format
If you changed the schema, old URLs might not match the new format.

**Solution**: Create a brand new URL AFTER pushing schema.

### 3. InstantDB App Was Recreated
If you deleted and recreated the InstantDB app, all data is gone.

**Solution**: Push schema again to the new app.

## DEFINITIVE TEST

Visit this URL in your browser (wait for Railway to deploy first):
```
https://cool-urls-dev.up.railway.app/api/test-db
```

### What to Look For:

**Scenario A: `"totalUrls": 0`**
```json
{
  "success": true,
  "totalUrls": 0,
  "urls": []
}
```
**Meaning**: No URLs in the database at all.
**Cause**: Either:
- Schema not pushed to this InstantDB app
- Or this is a different/new InstantDB app

**Solution**:
```bash
# 1. Make sure you're pushing to the RIGHT app
cat .env.local | grep NEXT_PUBLIC_INSTANT_APP_ID

# 2. Push schema
npx instant-cli@latest push schema

# 3. Push permissions
npx instant-cli@latest push perms

# 4. Create a NEW URL on the homepage
# 5. Try clicking it
```

**Scenario B: URLs exist but yours isn't there**
```json
{
  "success": true,
  "totalUrls": 5,
  "urls": [
    {"shortCode": "abc123", ...},
    {"shortCode": "def456", ...}
  ]
}
```
**Meaning**: Database works, but your specific URL isn't saved.
**Cause**: The URL creation failed silently.

**Solution**: Check browser console when creating URL.

**Scenario C: Your URL is there!**
```json
{
  "totalUrls": 3,
  "urls": [
    {"shortCode": "YOUR_SHORT_CODE", "originalUrl": "https://..."}
  ]
}
```
**Meaning**: URL IS in database, but redirect logic is broken.
**This should not happen** - our redirect code is simple and correct.

## Quick Fix Commands

```bash
# Step 1: Verify you're connected to the right InstantDB app
npx instant-cli@latest whoami

# Step 2: Push schema and perms (force flags ensure it overwrites)
npx instant-cli@latest push schema --force
npx instant-cli@latest push perms --force

# Step 3: Check Railway has correct env vars
railway variables list

# Step 4: If Railway's app ID is different, fix it
railway variables set NEXT_PUBLIC_INSTANT_APP_ID=<your-actual-app-id>
railway variables set INSTANT_ADMIN_TOKEN=<your-actual-token>

# Step 5: Wait for Railway to redeploy (2-3 min)

# Step 6: Test
# Visit: https://cool-urls-dev.up.railway.app/api/test-db
# Create new URL on homepage
# Click it
```

## What To Check Right Now

1. **Visit `/api/test-db`** - This tells you EVERYTHING
2. **Check Railway env vars match local** - They must be identical
3. **Look at InstantDB dashboard** - Go to https://instantdb.com/dash
   - Do you see your app?
   - Is there a "urls" table?
   - Are there records in it?

## If Nothing Works

There are only 3 possibilities:
1. Schema not pushed to the InstantDB app Railway is using
2. Railway is using wrong app ID (different from local)
3. Permissions are blocking the query (but this would error, not return empty)

**The `/api/test-db` endpoint will definitively tell you which one it is.**

## Expected Flow (When Working)

1. User creates URL on homepage
2. Client-side saves to InstantDB with `db.transact()`
3. URL stored with unique shortCode
4. User clicks short URL
5. API route queries all URLs: `db.query({ urls: {} })`
6. Finds matching shortCode
7. Redirects to original URL

**The only way this fails is if step 5 returns no URLs** (schema issue) **or if step 6 can't find the shortCode** (URL wasn't saved).

## My Recommendation

1. Visit `/api/test-db` NOW - before doing anything else
2. Share the output with me
3. Based on that, we'll know exactly what's wrong
