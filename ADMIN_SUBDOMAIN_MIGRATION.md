# Admin Subdomain Migration Guide

## Overview
This document outlines how to migrate the admin panel from `/admin` route to a separate subdomain `admin.yourdomain.com`.

---

## Current Setup (Development)
- **Main App**: `http://localhost:3000`
- **Admin Panel**: `http://localhost:3000/admin`
- **Structure**: Monolithic Next.js app with admin under `/app/admin/*`

---

## Target Setup (Production)
- **Main App**: `https://yourdomain.com`
- **Admin Panel**: `https://admin.yourdomain.com`
- **Structure**: Two separate deployments or subdomain routing

---

## Migration Options

### **Option 1: Separate Next.js App (Recommended)**

#### Advantages:
- ✅ Complete isolation
- ✅ Independent deployments
- ✅ Better security (different domain)
- ✅ Separate environment variables
- ✅ Can scale independently

#### Structure:
```
your-project/
├── apps/
│   ├── web/           # Main app
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── admin/         # Admin app
│       ├── app/
│       ├── components/
│       └── lib/
├── packages/
│   ├── ui/            # Shared UI components
│   ├── lib/           # Shared utilities
│   └── config/        # Shared config
```

#### Steps:
1. Create new Next.js app for admin
2. Move `/app/admin/*` to new app root
3. Move `/components/admin/*` to admin app
4. Move `/lib/admin/*` to admin app
5. Share common components via packages
6. Deploy separately to Vercel/Netlify

---

### **Option 2: Next.js Rewrites (Current Setup Compatible)**

This keeps your current monolithic structure but routes the subdomain.

#### Configuration:

**next.config.js:**
```javascript
module.exports = {
  async rewrites() {
    return {
      beforeFiles: [
        // If hostname is admin subdomain, rewrite to /admin routes
        {
          source: '/:path*',
          has: [
            {
              type: 'host',
              value: 'admin.yourdomain.com',
            },
          ],
          destination: '/admin/:path*',
        },
      ],
    };
  },
};
```

**middleware.ts** (at root):
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');

  // Admin subdomain
  if (hostname?.startsWith('admin.')) {
    // If accessing admin subdomain but not /admin route
    if (!request.nextUrl.pathname.startsWith('/admin')) {
      const url = request.nextUrl.clone();
      url.pathname = `/admin${url.pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Main domain - prevent access to /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Redirect to admin subdomain
    const url = request.nextUrl.clone();
    url.host = `admin.${url.host}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

#### Deployment (Vercel):
1. Deploy app to Vercel
2. Add custom domain: `yourdomain.com`
3. Add custom domain: `admin.yourdomain.com`
4. Both point to same deployment
5. Middleware handles routing

---

### **Option 3: Reverse Proxy (Infrastructure Level)**

Use a reverse proxy (Nginx, Cloudflare Workers) to route requests.

#### Nginx Example:
```nginx
# Main app
server {
    server_name yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
    }
}

# Admin app
server {
    server_name admin.yourdomain.com;
    location / {
        proxy_pass http://localhost:3000/admin;
    }
}
```

---

## Recommended Migration Path

### **For Your Project: Option 2 (Next.js Rewrites)**

Since your admin is already well-isolated, Option 2 is the easiest:

### Step 1: Add Middleware
Create `middleware.ts` at project root with the code above.

### Step 2: Update next.config.js
Add the rewrites configuration.

### Step 3: Update Environment Variables
Create separate env files if needed:
- `.env.local` - Main app
- `.env.admin.local` - Admin (same InstantDB credentials)

### Step 4: Test Locally
```bash
# Test main domain
curl http://localhost:3000

# Test admin (simulating subdomain)
curl -H "Host: admin.localhost:3000" http://localhost:3000
```

### Step 5: Deploy to Vercel
```bash
vercel --prod
```

### Step 6: Configure Domains in Vercel
1. Go to Project Settings → Domains
2. Add `yourdomain.com`
3. Add `admin.yourdomain.com`
4. Both point to same deployment

---

## Security Considerations

### 1. **CORS Configuration**
If admin and main app need to communicate:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Allow admin subdomain to access main API
  if (request.nextUrl.pathname.startsWith('/api')) {
    response.headers.set('Access-Control-Allow-Origin', 'https://admin.yourdomain.com');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}
```

### 2. **Cookie Configuration**
Admin cookies should be domain-scoped:

```typescript
// lib/admin/auth.ts
const cookieOptions = {
  domain: process.env.NODE_ENV === 'production'
    ? '.yourdomain.com'  // Works for all subdomains
    : 'localhost',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};
```

### 3. **Environment Variables**
```bash
# .env.production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_ADMIN_URL=https://admin.yourdomain.com
```

---

## Database Access

**Good news**: Your setup already uses InstantDB which is accessible from both domains!

```typescript
// Both main and admin use the same InstantDB instance
const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID,
});
```

No changes needed! Both domains will connect to the same database.

---

## Testing Subdomain Locally

### Using /etc/hosts:
```bash
# Edit /etc/hosts
sudo nano /etc/hosts

# Add:
127.0.0.1 admin.localhost
127.0.0.1 localhost
```

Then access:
- Main: `http://localhost:3000`
- Admin: `http://admin.localhost:3000`

---

## Deployment Checklist

- [ ] Add `middleware.ts` with subdomain routing
- [ ] Update `next.config.js` with rewrites
- [ ] Test locally with hosts file
- [ ] Deploy to Vercel/Netlify
- [ ] Configure custom domains
- [ ] Test admin.yourdomain.com
- [ ] Test CORS if needed
- [ ] Update cookie domain settings
- [ ] Verify InstantDB connection from both domains
- [ ] Test admin authentication
- [ ] Verify API endpoints work from admin
- [ ] Check Stripe/PayPal webhooks still work

---

## Current Setup Benefits

Your current setup is **already optimized** for subdomain deployment because:

✅ **Isolated routes** - All admin is under `/admin/*`
✅ **Separate layout** - Independent navigation
✅ **Separate auth** - AdminUsers entity
✅ **Shared database** - InstantDB works from any domain
✅ **No tight coupling** - Admin doesn't depend on main app routes

**You can deploy to subdomain with minimal changes!**

---

## Questions?

**Q: Will this break existing admin access at `/admin`?**
A: With Option 2, you can support both or redirect one to the other.

**Q: Do I need separate Vercel projects?**
A: No! One project, multiple domains pointing to it.

**Q: What about API routes?**
A: They stay at `/api/*` and are accessible from both domains.

**Q: Will InstantDB work?**
A: Yes! It's client-side and domain-agnostic.

**Q: What about Stripe webhooks?**
A: They target `/api/webhooks/stripe` which works from any domain.
