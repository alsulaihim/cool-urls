# Production Deployment Guide - Admin Subdomain Setup

## Overview

Your app is ready to deploy with admin panel on a subdomain (`admin.hoturl.me:8088`). The current architecture uses a single Next.js app with middleware-based routing.

## Architecture

```
Single Next.js App
├── Main App Routes (/)
│   └── Accessible from: hoturl.me
│
└── Admin Routes (/admin/*)
    └── Accessible from: admin.hoturl.me:8088
```

**How it works:**
- Middleware detects subdomain and rewrites URLs
- Production mode enforces admin subdomain access
- Security headers protect admin routes
- Separate `adminUsers` entity (not regular users)

---

## Deployment Options

### Option 1: Railway (Recommended - Easiest)

Railway can handle this with a single deployment + custom domain configuration.

#### Step 1: Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project or create new
railway init

# Deploy
railway up
```

#### Step 2: Configure Domains in Railway Dashboard

1. Go to your Railway project → Settings → Domains
2. Add custom domain: `hoturl.me`
3. Add custom domain: `admin.hoturl.me`
4. Configure DNS records as shown by Railway

#### Step 3: Environment Variables

In Railway dashboard, add:

```env
NODE_ENV=production
NEXT_PUBLIC_INSTANT_APP_ID=your_instant_app_id
INSTANT_ADMIN_TOKEN=your_admin_token
NEXT_PUBLIC_MAIN_URL=https://hoturl.me
NEXT_PUBLIC_ADMIN_URL=https://admin.hoturl.me:8088
```

#### Step 4: Configure Port (Optional)

By default Railway auto-assigns port. To use 8088 for admin:
- Use reverse proxy (nginx) in front
- Or configure Railway to listen on multiple ports

**Note:** Railway uses port 443 for HTTPS. Port 8088 is mainly for direct server access or custom setups.

---

### Option 2: Vercel

Vercel deploys are simpler but require additional configuration for custom ports.

#### Step 1: Deploy to Vercel

```bash
npm i -g vercel
vercel login
vercel --prod
```

#### Step 2: Configure Domains

In Vercel dashboard:
1. Add domain: `hoturl.me`
2. Add domain: `admin.hoturl.me`

#### Step 3: Environment Variables

```env
NODE_ENV=production
NEXT_PUBLIC_INSTANT_APP_ID=your_instant_app_id
INSTANT_ADMIN_TOKEN=your_admin_token
```

**Note:** Vercel doesn't support custom ports directly. Admin will be accessible at `admin.hoturl.me` (standard HTTPS port 443), not `:8088`.

---

### Option 3: VPS/Server (Full Control)

Use this for complete control over ports and configuration.

#### Server Requirements
- Ubuntu 22.04 or similar
- Node.js 18+
- nginx
- PM2 (process manager)

#### Step 1: Server Setup

```bash
# SSH into your server
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install nginx
sudo apt install nginx
```

#### Step 2: Deploy Your App

```bash
# Clone repo
cd /var/www
git clone https://github.com/yourusername/cool-urls-0.git
cd cool-urls-0

# Install dependencies
npm install

# Build
npm run build

# Start with PM2
pm2 start npm --name "hoturl-app" -- start
pm2 save
pm2 startup
```

#### Step 3: Configure nginx

Create `/etc/nginx/sites-available/hoturl`:

```nginx
# Main app - hoturl.me
server {
    listen 80;
    listen 443 ssl http2;
    server_name hoturl.me www.hoturl.me;

    # SSL configuration (using Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/hoturl.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hoturl.me/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin panel - admin.hoturl.me:8088
server {
    listen 8088 ssl http2;
    server_name admin.hoturl.me;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/hoturl.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hoturl.me/privkey.pem;

    # Security headers (additional to middleware)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Optional: IP whitelist for extra security
    # allow YOUR_OFFICE_IP;
    # deny all;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS for admin
server {
    listen 8088;
    server_name admin.hoturl.me;
    return 301 https://$server_name$request_uri;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/hoturl /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 4: SSL Certificates

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificates
sudo certbot --nginx -d hoturl.me -d www.hoturl.me -d admin.hoturl.me

# Auto-renewal (already set up by certbot)
sudo certbot renew --dry-run
```

#### Step 5: Firewall

```bash
# Allow necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8088/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
```

#### Step 6: Environment Variables

Create `/var/www/cool-urls-0/.env.local`:

```env
NODE_ENV=production
NEXT_PUBLIC_INSTANT_APP_ID=your_instant_app_id
INSTANT_ADMIN_TOKEN=your_admin_token
NEXT_PUBLIC_MAIN_URL=https://hoturl.me
NEXT_PUBLIC_ADMIN_URL=https://admin.hoturl.me:8088
```

Restart the app:

```bash
pm2 restart hoturl-app
```

---

## DNS Configuration

For all deployment options, configure your DNS:

### For Main Domain (hoturl.me)

```
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: 3600
```

```
Type: A
Name: www
Value: YOUR_SERVER_IP
TTL: 3600
```

### For Admin Subdomain (admin.hoturl.me)

```
Type: A
Name: admin
Value: YOUR_SERVER_IP
TTL: 3600
```

**Note:** If using Railway/Vercel, use CNAME records pointing to their provided URLs instead.

---

## Security Checklist

Before going live, ensure:

- [ ] SSL certificates are installed and valid
- [ ] Admin access is restricted to `admin.hoturl.me` in production
- [ ] Environment variables are set correctly
- [ ] `NODE_ENV=production` is set
- [ ] Security headers are enabled (done by middleware)
- [ ] Firewall rules are configured
- [ ] At least one admin user is created (run `npm run setup-admin`)
- [ ] InstantDB schema is pushed (`npx instant-cli push-schema`)
- [ ] Regular backups are configured for InstantDB
- [ ] Consider IP whitelisting for admin panel (optional)
- [ ] Monitor logs with PM2 (`pm2 logs`) or Railway/Vercel dashboards

---

## Testing Before Production

### Test subdomain routing locally:

1. Edit `/etc/hosts` (Mac/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1 hoturl.local
127.0.0.1 admin.hoturl.local
```

2. Start dev server:

```bash
npm run dev
```

3. Test URLs:
   - Main app: `http://hoturl.local:3000`
   - Admin: `http://admin.hoturl.local:3000`

4. Verify:
   - Admin routes redirect to `/admin/*`
   - Security headers are present (check DevTools → Network)
   - Admin authentication works

---

## Admin User Management

### Create First Admin

```bash
# Development
npm run setup-admin

# Production (via SSH)
cd /var/www/cool-urls-0
npm run setup-admin
```

The script will prompt for:
- Admin email
- Permissions
- Role

### Grant Additional Admin Access

You can also use InstantDB dashboard to manually add admin users:
1. Go to https://instantdb.com
2. Select your app
3. Navigate to `adminUsers` entity
4. Add new record with `userId` from `userProfiles`

---

## Monitoring & Maintenance

### View Logs

**PM2:**
```bash
pm2 logs hoturl-app
pm2 monit
```

**Railway:**
- View logs in Railway dashboard

**Vercel:**
- View logs in Vercel dashboard

### Update Deployment

**Railway:**
```bash
git push origin main  # Auto-deploys if connected to GitHub
# or
railway up
```

**Vercel:**
```bash
git push origin main  # Auto-deploys
# or
vercel --prod
```

**VPS:**
```bash
ssh user@your-server
cd /var/www/cool-urls-0
git pull
npm install
npm run build
pm2 restart hoturl-app
```

---

## Performance Optimization

### Enable Caching (nginx)

Add to nginx location blocks:

```nginx
# Static assets
location /_next/static {
    proxy_pass http://localhost:3000;
    proxy_cache_valid 200 60m;
    add_header Cache-Control "public, max-age=3600, immutable";
}

# Images
location ~* \.(jpg|jpeg|png|gif|svg|webp)$ {
    proxy_pass http://localhost:3000;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
}
```

### PM2 Cluster Mode

For better performance, use cluster mode:

```bash
pm2 start npm --name "hoturl-app" -i max -- start
```

---

## Troubleshooting

### Admin subdomain not working

1. Check DNS propagation: `dig admin.hoturl.me`
2. Verify nginx config: `sudo nginx -t`
3. Check middleware logs
4. Verify `NODE_ENV=production`

### SSL certificate issues

```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

### Port 8088 not accessible

1. Check firewall: `sudo ufw status`
2. Check nginx: `sudo systemctl status nginx`
3. Check if port is listening: `sudo netstat -tlnp | grep 8088`

### Admin authentication failing

1. Verify admin user exists in InstantDB
2. Check `INSTANT_ADMIN_TOKEN` is set
3. Check browser console for errors
4. Verify InstantDB schema is pushed

---

## Summary

**You're ready to deploy** with your current setup:

✅ Admin authentication system complete
✅ Middleware handles subdomain routing
✅ Security headers implemented
✅ Separate admin user entity
✅ All admin pages built

**Choose deployment:**
- **Railway** - Easiest, good for startups
- **Vercel** - Great DX, no custom port support
- **VPS** - Full control, requires maintenance

**Next steps:**
1. Choose deployment platform
2. Configure DNS
3. Set environment variables
4. Deploy!
5. Create admin user
6. Test admin.hoturl.me:8088

Need help with any specific deployment? Let me know!
