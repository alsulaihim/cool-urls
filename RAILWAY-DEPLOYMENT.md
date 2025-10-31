# Railway Deployment Guide

## Current Setup

**Railway Dev URL:** `https://cool-urls-dev.up.railway.app`

## Admin Panel Access on Railway

### On Railway Default Domain (.up.railway.app)

Your admin panel will be accessible at:

```
Main App:       https://cool-urls-dev.up.railway.app
Admin Panel:    https://cool-urls-dev.up.railway.app/admin
```

**All Admin Routes:**
- Dashboard: `/admin`
- Users: `/admin/users`
- URLs: `/admin/urls`
- Analytics: `/admin/analytics`
- Audit Logs: `/admin/audit`
- Settings: `/admin/settings`

### How It Works

The middleware detects Railway domains (`*.railway.app` or `*.up.railway.app`) and allows admin routes on the same domain **without subdomain requirement**.

**This is safe because:**
- Admin authentication still required (only users in `adminUsers` table can access)
- Security headers still applied
- Audit logging still active

## Deployment Steps

### 1. Commit Your Changes

```bash
git add .
git commit -m "Add admin panel with production-ready security"
git push origin main
```

### 2. Railway Auto-Deploy

If you have GitHub integration enabled, Railway will automatically deploy when you push to `main`.

**Or manually deploy:**

```bash
railway up
```

### 3. Set Environment Variables

In Railway dashboard, ensure these are set:

```env
NODE_ENV=production
NEXT_PUBLIC_INSTANT_APP_ID=your_instant_app_id
INSTANT_ADMIN_TOKEN=your_admin_token
```

### 4. Create First Admin User

After deployment, you need to create an admin user. You have two options:

#### Option A: Using Railway CLI (Recommended)

```bash
# Login to Railway
railway login

# Link to your project
railway link

# Run the setup script
railway run npm run setup-admin
```

#### Option B: Using InstantDB Dashboard

1. Sign in to user account on your app first
2. Get your `userId` from browser console or InstantDB dashboard
3. Go to https://instantdb.com → Your App → Data
4. Add record to `adminUsers`:
   ```json
   {
     "userId": "your-user-id-here",
     "role": "super_admin",
     "permissions": "[\"all\"]",
     "mfaEnabled": false,
     "createdAt": 1234567890000,
     "createdBy": "system"
   }
   ```

### 5. Test Admin Access

1. Go to `https://cool-urls-dev.up.railway.app/admin`
2. Sign in with your admin email
3. You should see the admin dashboard

## When You Add Custom Domain (hoturl.me)

### Step 1: Add Custom Domains in Railway

1. Go to Railway dashboard → Your project → Settings → Domains
2. Click "Add Custom Domain"
3. Add: `hoturl.me`
4. Add: `admin.hoturl.me`

### Step 2: Configure DNS

Add these DNS records to your domain registrar:

```
Type: A
Name: @
Value: [Railway provides this IP]
TTL: 3600

Type: A
Name: admin
Value: [Railway provides this IP]
TTL: 3600
```

**OR** (if Railway provides CNAME):

```
Type: CNAME
Name: @
Value: cool-urls-dev.up.railway.app
TTL: 3600

Type: CNAME
Name: admin
Value: cool-urls-dev.up.railway.app
TTL: 3600
```

### Step 3: Admin Access Changes

Once custom domain is active:

**Main App:**
- `https://hoturl.me` → Main routes

**Admin Panel:**
- `https://admin.hoturl.me` → Admin dashboard (enforced by middleware)
- `https://hoturl.me/admin` → Redirects to `https://admin.hoturl.me`

**Note:** Port 8088 is optional. Railway handles HTTPS on standard port 443.

## Environment Variables

### Required Variables

```env
# Required for all environments
NODE_ENV=production
NEXT_PUBLIC_INSTANT_APP_ID=your_instant_app_id
INSTANT_ADMIN_TOKEN=your_admin_token

# Optional - URLs are auto-detected
NEXT_PUBLIC_MAIN_URL=https://cool-urls-dev.up.railway.app
NEXT_PUBLIC_ADMIN_URL=https://cool-urls-dev.up.railway.app/admin
```

### After Custom Domain Setup

```env
NODE_ENV=production
NEXT_PUBLIC_INSTANT_APP_ID=your_instant_app_id
INSTANT_ADMIN_TOKEN=your_admin_token
NEXT_PUBLIC_MAIN_URL=https://hoturl.me
NEXT_PUBLIC_ADMIN_URL=https://admin.hoturl.me
```

## Monitoring

### View Logs

```bash
# Via Railway CLI
railway logs

# Or in Railway dashboard → Deployments → [Your deployment] → Logs
```

### Check Admin Activity

Visit `/admin/audit` to see all admin actions logged.

## Troubleshooting

### Admin page shows 404

1. Check that deployment succeeded
2. Verify middleware is loaded (check Railway logs)
3. Try clearing browser cache

### Can't access admin (redirected to dashboard)

1. Verify you're added to `adminUsers` table
2. Check your `userId` matches the one in `adminUsers`
3. Try signing out and back in

### Changes not showing up

```bash
# Force new deployment
railway up --detach

# Or trigger via git push
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

## Security Notes

### On Railway Domain (.up.railway.app)

- Admin routes accessible at `/admin` (no subdomain required)
- Still protected by authentication
- Security headers still applied
- Audit logging active

### On Custom Domain (hoturl.me)

- Admin routes **only** accessible via `admin.hoturl.me`
- Accessing `hoturl.me/admin` redirects to admin subdomain
- Enhanced security with subdomain isolation

## Next Steps

1. **Now:** Deploy to Railway dev environment
   - Access admin at `https://cool-urls-dev.up.railway.app/admin`
   - Test all admin features

2. **Later:** Add custom domain
   - Configure `hoturl.me` and `admin.hoturl.me`
   - Admin will automatically enforce subdomain access

3. **Future:** Consider separate Railway project for admin
   - Complete isolation
   - Independent scaling
   - Different authentication provider

## Summary

✅ Ready to deploy to Railway now
✅ Admin accessible at `/admin` on Railway domain
✅ No subdomain required until you add custom domain
✅ All security features active
✅ Admin authentication separate from regular users

**Deploy now, add custom domain later!**
