# Railway Configuration for Admin Panel

## Overview

This guide explains how to configure Railway to serve both the main app and admin panel from the same deployment with different domains/ports.

---

## 🎯 Goal Configuration

- **Main App**: `hoturl.me` (port 80/443)
- **Admin Panel**: `admin.hoturl.me` (port 8088)
- **Both served from**: Same Railway service

---

## 📋 Step-by-Step Setup

### Step 1: Deploy to Railway

```bash
# If not already deployed
railway login
railway init
railway up
```

Or connect via Railway Dashboard:
1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your repository
4. Railway auto-detects Next.js

### Step 2: Add Environment Variables

In Railway Dashboard → Your Project → Variables:

```env
NEXT_PUBLIC_INSTANT_APP_ID=your_instant_app_id
INSTANT_ADMIN_TOKEN=your_admin_token
NEXT_PUBLIC_APP_URL=https://hoturl.me
NEXT_PUBLIC_SHORT_DOMAIN=https://hoturl.me

# Optional
NODE_ENV=production
```

### Step 3: Configure Custom Domains

#### Add Main Domain

1. Railway Dashboard → Settings → Domains
2. Click "Add Domain"
3. Enter: `hoturl.me`
4. Railway provides DNS instructions:
   ```
   Type: A
   Name: @
   Value: <railway-ip>
   
   Type: CNAME
   Name: www
   Value: <your-project>.up.railway.app
   ```

#### Add Admin Subdomain

1. Click "Add Domain" again
2. Enter: `admin.hoturl.me`
3. Railway provides DNS instructions:
   ```
   Type: CNAME
   Name: admin
   Value: <your-project>.up.railway.app
   ```

### Step 4: Configure Your DNS Provider

Go to your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.) and add these records:

#### For Main Domain (hoturl.me)
```
Type: A
Name: @
Value: <railway-ip>
TTL: Auto

Type: CNAME  
Name: www
Value: <your-project>.up.railway.app
TTL: Auto
```

#### For Admin Subdomain (admin.hoturl.me)
```
Type: CNAME
Name: admin
Value: <your-project>.up.railway.app
TTL: Auto
```

### Step 5: Wait for DNS Propagation

- DNS changes can take 5-60 minutes
- Check status: `dig hoturl.me` or `nslookup admin.hoturl.me`
- Railway auto-provisions SSL certificates

---

## 🔧 Alternative: Port-Based Access

If you want admin panel on a different port (8088):

### Option A: Update start script

**package.json**:
```json
{
  "scripts": {
    "start": "next start -p 80",
    "start:admin": "next start -p 8088"
  }
}
```

### Option B: Use Railway's PORT env

Railway sets `PORT` automatically. To support multiple ports:

**Create `start.sh`**:
```bash
#!/bin/bash
# Start main app on $PORT (Railway default)
npm run start &

# Start admin on port 8088
PORT=8088 npm run start
```

Make executable:
```bash
chmod +x start.sh
```

**Update package.json**:
```json
{
  "scripts": {
    "start": "./start.sh"
  }
}
```

**Note**: Railway's free tier supports one port. For multiple ports, you may need to upgrade or use subdomains (recommended).

---

## ✅ Recommended Approach: Subdomain + Middleware

**This is already implemented!**

Our `middleware.ts` detects the subdomain and routes appropriately:

```typescript
// admin.hoturl.me → /admin routes
// hoturl.me → main app routes
```

This works with **single port deployment** on Railway. ✨

---

## 🧪 Testing

### Local Testing

```bash
# Test main app
npm run dev
# Visit: http://localhost:3000

# Test admin (simulate subdomain)
npm run dev:admin  
# Visit: http://localhost:3001/admin
```

### Production Testing

After DNS propagation:

```bash
# Test main domain
curl https://hoturl.me

# Test admin subdomain  
curl https://admin.hoturl.me

# Check SSL
curl -I https://admin.hoturl.me | grep -i ssl
```

---

## 🔒 Security Configuration

### 1. Environment Variables

Ensure these are set in Railway (not in code):
- `INSTANT_ADMIN_TOKEN` (secret)
- `NEXT_PUBLIC_INSTANT_APP_ID` (public)

### 2. Firewall Rules (Optional)

If using port 8088, you can restrict access:

**Cloudflare**: Enable "Under Attack Mode" for admin subdomain
**Railway**: Use private networking (Enterprise plan)

### 3. Rate Limiting

Consider adding rate limiting for admin endpoints:

```typescript
// middleware.ts
if (pathname.startsWith('/admin')) {
  // Add rate limiting logic
}
```

---

## 📊 Monitoring

### Railway Dashboard

Monitor your deployment:
- Deployments → View logs
- Metrics → CPU, Memory, Network
- Settings → Check domain status

### Check Domains

```bash
# Check main domain
dig hoturl.me

# Check admin subdomain  
dig admin.hoturl.me

# Check SSL certificate
openssl s_client -connect admin.hoturl.me:443 -servername admin.hoturl.me
```

---

## 🚨 Troubleshooting

### Issue: Admin subdomain not working

**Check:**
1. DNS records propagated? (`dig admin.hoturl.me`)
2. Railway domain added? (Dashboard → Domains)
3. Middleware detecting subdomain? (Check logs)

**Solution:**
```bash
# Clear DNS cache
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Check Railway logs
railway logs
```

### Issue: SSL certificate error

**Check:**
- Railway auto-provisions SSL (takes 5-10 min)
- Domain must be verified in Railway first

**Solution:**
Wait 10 minutes after adding domain, then check again.

### Issue: 404 on admin routes

**Check middleware.ts**:
```typescript
const isAdminDomain = hostname.startsWith('admin.');
console.log('Hostname:', hostname, 'Is Admin:', isAdminDomain);
```

---

## 📝 Deployment Checklist

- [ ] Railway project created
- [ ] Environment variables set
- [ ] Schema pushed to InstantDB
- [ ] Admin user created
- [ ] Main domain added to Railway
- [ ] Admin subdomain added to Railway
- [ ] DNS records configured
- [ ] DNS propagated (wait 5-60 min)
- [ ] SSL certificates active
- [ ] Test main app access
- [ ] Test admin panel access
- [ ] Verify non-admins can't access admin
- [ ] Check audit logs working

---

## 🎉 You're Done!

Your admin panel should now be accessible at:

- **Main App**: https://hoturl.me
- **Admin Panel**: https://admin.hoturl.me

Both are served from the same Railway deployment, using the middleware to route based on subdomain!

---

## 📞 Next Steps

1. **Set up monitoring**: Add error tracking (Sentry, LogRocket)
2. **Configure backups**: InstantDB handles this automatically
3. **Add admin email notifications**: For important actions
4. **Enable MFA**: For super admin accounts
5. **Set up staging environment**: Test changes before production

---

*Last Updated: Now*
*Railway Plan: Hobby ($5/month) or higher recommended*

