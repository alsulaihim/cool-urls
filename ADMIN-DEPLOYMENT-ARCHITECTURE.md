# Admin Panel - Separate Deployment Architecture

## Overview

The admin panel will run as a **separate Next.js application** with its own subdomain and port:

- **Production**: `admin.hoturl.me:8088`
- **Development**: `localhost:3001`
- **Main App Production**: `hoturl.me` (default port 443/80)
- **Main App Development**: `localhost:3000`

---

## Architecture Options (Recommended → Selected)

### ✅ **Option 1: Separate Next.js Application (RECOMMENDED)**

**Structure:**
```
cool-urls/                    # Main app (existing)
├── app/
├── components/
├── lib/
└── package.json

cool-urls-admin/              # New admin app (separate)
├── app/
├── components/
├── lib/
└── package.json
```

**Pros:**
- ✅ Complete isolation (security)
- ✅ Independent deployments
- ✅ Different port/domain configurations
- ✅ Separate dependencies & bundle sizes
- ✅ Can scale independently

**Cons:**
- ⚠️ Code duplication (shared types, utils)
- ⚠️ Two deployments to manage

**Best For:** Maximum security & independence

---

### ⭐ **Option 2: Monorepo with Turborepo (BEST CHOICE)**

**Structure:**
```
cool-urls-monorepo/
├── apps/
│   ├── web/                  # Main app (localhost:3000)
│   │   ├── app/
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   └── admin/                # Admin app (localhost:3001)
│       ├── app/
│       ├── package.json
│       └── next.config.js
│
├── packages/
│   ├── ui/                   # Shared components
│   ├── database/             # Shared DB client
│   ├── auth/                 # Shared auth logic
│   └── types/                # Shared TypeScript types
│
├── package.json
├── turbo.json
└── pnpm-workspace.yaml
```

**Pros:**
- ✅ Code sharing (no duplication)
- ✅ Separate apps (security)
- ✅ Single repo management
- ✅ Shared tooling & configs
- ✅ Easy cross-app changes

**Cons:**
- ⚠️ Initial setup complexity
- ⚠️ Learning curve for turborepo

**Best For:** Professional, scalable architecture (THIS IS MY RECOMMENDATION)

---

### Option 3: Same App with Subdomain Routing

**Structure:**
```
cool-urls/
├── app/
│   ├── (main)/              # Main app routes
│   └── (admin)/             # Admin routes
├── middleware.ts            # Subdomain detection
└── package.json
```

**Pros:**
- ✅ Single codebase
- ✅ Easy code sharing

**Cons:**
- ❌ Same process/port (harder to separate)
- ❌ Shared dependencies & bundle
- ❌ Less security isolation
- ❌ Can't run on different ports easily

**Best For:** Simpler projects (not recommended for your use case)

---

## 🎯 Recommended Solution: Turborepo Monorepo

I recommend **Option 2 (Turborepo Monorepo)** because:
1. ✅ Separate ports/domains as required
2. ✅ Code sharing without duplication
3. ✅ Independent deployments possible
4. ✅ Production-ready architecture
5. ✅ Used by Vercel, Netflix, and others

---

## Implementation Plan

### Phase 1: Setup Monorepo Structure

#### Step 1: Install Turborepo
```bash
# Create new monorepo (or migrate existing)
cd ..
npx create-turbo@latest cool-urls-monorepo

# Or manually:
mkdir cool-urls-monorepo
cd cool-urls-monorepo
pnpm init
pnpm add -D turbo
```

#### Step 2: Create Workspace Structure
```bash
mkdir -p apps/web apps/admin packages/ui packages/database packages/auth packages/types
```

#### Step 3: Configure `pnpm-workspace.yaml`
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

#### Step 4: Configure `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "type-check": {
      "dependsOn": ["^type-check"]
    }
  }
}
```

---

### Phase 2: Move Existing App to `apps/web`

```bash
# Move existing app
mv cool-urls/* cool-urls-monorepo/apps/web/

# Update package.json in apps/web
```

**apps/web/package.json:**
```json
{
  "name": "web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 80",
    "lint": "next lint"
  },
  "dependencies": {
    "@repo/ui": "workspace:*",
    "@repo/database": "workspace:*",
    "@repo/types": "workspace:*",
    "next": "14.x.x",
    "react": "18.x.x"
  }
}
```

---

### Phase 3: Create Admin App in `apps/admin`

#### Initialize Admin App
```bash
cd apps/admin
pnpm create next-app@latest . --typescript --tailwind --app --no-src-dir
```

**apps/admin/package.json:**
```json
{
  "name": "admin",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 8088",
    "lint": "next lint"
  },
  "dependencies": {
    "@repo/ui": "workspace:*",
    "@repo/database": "workspace:*",
    "@repo/auth": "workspace:*",
    "@repo/types": "workspace:*",
    "next": "14.x.x",
    "react": "18.x.x",
    "speakeasy": "^2.0.0",
    "qrcode": "^1.5.3"
  }
}
```

**apps/admin/next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production runs on port 8088
  experimental: {
    serverActions: {
      allowedOrigins: ['admin.hoturl.me:8088', 'localhost:3001']
    }
  }
};

module.exports = nextConfig;
```

**apps/admin/.env.local:**
```env
# Admin-specific environment variables
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Production overrides
# NEXT_PUBLIC_ADMIN_URL=https://admin.hoturl.me:8088
# NEXT_PUBLIC_API_URL=https://hoturl.me/api
```

---

### Phase 4: Create Shared Packages

#### 1. Shared Types Package

**packages/types/package.json:**
```json
{
  "name": "@repo/types",
  "version": "1.0.0",
  "main": "./index.ts",
  "types": "./index.ts",
  "exports": {
    ".": "./index.ts",
    "./admin": "./admin.ts"
  }
}
```

**packages/types/index.ts:**
```typescript
// Shared types for both apps
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: number;
}

export interface Url {
  id: string;
  shortCode: string;
  originalUrl: string;
  userId: string;
  createdAt: number;
}

export interface Click {
  id: string;
  urlId: string;
  timestamp: number;
  // ... analytics fields
}
```

**packages/types/admin.ts:**
```typescript
// Admin-specific types
export * from './lib/admin/types'; // Import from main types file
```

#### 2. Shared Database Package

**packages/database/package.json:**
```json
{
  "name": "@repo/database",
  "version": "1.0.0",
  "main": "./index.ts",
  "dependencies": {
    "@instantdb/react": "latest"
  }
}
```

**packages/database/index.ts:**
```typescript
import { init } from '@instantdb/react';

// Shared database client
export const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!
});

export * from './queries';
```

#### 3. Shared UI Components Package

**packages/ui/package.json:**
```json
{
  "name": "@repo/ui",
  "version": "1.0.0",
  "main": "./index.tsx",
  "dependencies": {
    "react": "18.x.x",
    "lucide-react": "latest"
  }
}
```

**packages/ui/index.tsx:**
```typescript
// Re-export shared components
export { Button } from './button';
export { Card } from './card';
export { Input } from './input';
// ... other shadcn components
```

---

### Phase 5: Development Scripts

**Root `package.json`:**
```json
{
  "name": "cool-urls-monorepo",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "dev:web": "turbo run dev --filter=web",
    "dev:admin": "turbo run dev --filter=admin",
    "dev:both": "turbo run dev --filter=web --filter=admin",
    "build": "turbo run build",
    "build:web": "turbo run build --filter=web",
    "build:admin": "turbo run build --filter=admin",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check"
  },
  "devDependencies": {
    "turbo": "latest"
  },
  "packageManager": "pnpm@8.0.0"
}
```

---

## Development Workflow

### Start Both Apps
```bash
# Terminal 1: Start main app on :3000
pnpm dev:web

# Terminal 2: Start admin app on :3001
pnpm dev:admin

# Or run both simultaneously
pnpm dev:both
```

### Access Apps
- **Main App**: http://localhost:3000
- **Admin Panel**: http://localhost:3001

---

## Production Deployment

### Option A: Separate Deployments (Vercel)

#### Deploy Main App
```bash
cd apps/web
vercel --prod
# Configure: hoturl.me
```

#### Deploy Admin App
```bash
cd apps/admin
vercel --prod
# Configure: admin.hoturl.me:8088
```

**Vercel Configuration for Admin (`apps/admin/vercel.json`):**
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

---

### Option B: Single Server with Reverse Proxy (Nginx)

**Nginx Configuration:**
```nginx
# Main app
server {
    listen 80;
    listen 443 ssl;
    server_name hoturl.me;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Admin panel
server {
    listen 8088 ssl;
    server_name admin.hoturl.me;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000" always;
}
```

**PM2 Configuration (`ecosystem.config.js`):**
```javascript
module.exports = {
  apps: [
    {
      name: 'web',
      script: 'npm',
      args: 'start',
      cwd: './apps/web',
      env: {
        PORT: 3000,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'admin',
      script: 'npm',
      args: 'start',
      cwd: './apps/admin',
      env: {
        PORT: 3001,
        NODE_ENV: 'production'
      }
    }
  ]
};
```

**Start with PM2:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

### Option C: Docker Compose

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: ./apps/web/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: always

  admin:
    build:
      context: .
      dockerfile: ./apps/admin/Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
      - "8088:8088"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - web
      - admin
    restart: always
```

---

## Security Considerations

### 1. Network Isolation
```typescript
// apps/admin/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only allow admin subdomain
  const host = request.headers.get('host');
  
  if (!host?.startsWith('admin.')) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
```

### 2. CORS Configuration
```typescript
// apps/web/app/api/[...admin]/route.ts
// API routes accessible from admin panel

export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  
  // Only allow admin subdomain
  if (!origin?.includes('admin.hoturl.me')) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Handle request...
  const response = new Response(data);
  response.headers.set('Access-Control-Allow-Origin', origin);
  return response;
}
```

### 3. Firewall Rules
```bash
# Allow main app (port 80/443)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow admin panel (port 8088) - restrict to specific IPs if possible
sudo ufw allow 8088/tcp
# Or restrict: sudo ufw allow from YOUR_IP to any port 8088
```

---

## Migration Steps (If Starting from Existing App)

### Step-by-Step Migration

1. **Create monorepo structure** (5 min)
2. **Move existing app to `apps/web`** (10 min)
3. **Extract shared code to packages** (30 min)
4. **Create admin app skeleton** (15 min)
5. **Test both apps run independently** (10 min)
6. **Update import paths** (20 min)
7. **Configure deployment** (30 min)

**Total Time: ~2 hours**

---

## Summary

| Aspect | Main App | Admin Panel |
|--------|----------|-------------|
| **Dev URL** | localhost:3000 | localhost:3001 |
| **Prod URL** | hoturl.me | admin.hoturl.me:8088 |
| **Location** | apps/web | apps/admin |
| **Access** | Public | Admin only (MFA) |
| **Deployment** | Vercel/Server | Vercel/Server |

---

## Quick Start Commands

```bash
# Initial setup
npx create-turbo@latest cool-urls-monorepo
cd cool-urls-monorepo

# Development
pnpm dev:both              # Start both apps
pnpm dev:web               # Main app only
pnpm dev:admin             # Admin only

# Production build
pnpm build                 # Build both
pnpm build:web             # Main app only
pnpm build:admin           # Admin only

# Deployment
vercel --prod              # Deploy both
```

---

**Ready to start? I can help you:**
1. Set up the monorepo structure
2. Create the admin app scaffold
3. Configure the deployment pipeline
4. Set up the reverse proxy

Which would you like to tackle first?

