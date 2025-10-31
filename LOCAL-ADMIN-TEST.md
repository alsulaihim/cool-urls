# Local Admin Panel Testing Guide

## Prerequisites Check

Before we start, make sure you have:
- ✅ InstantDB account and app created
- ✅ Environment variables set in `.env.local`:
  - `NEXT_PUBLIC_INSTANT_APP_ID`
  - `INSTANT_ADMIN_TOKEN`
- ✅ Signed up at least once at http://localhost:3000

---

## Step-by-Step Testing Process

### Step 1: Push Schema (First Time Only)

This creates the admin tables in InstantDB.

```bash
npm run push-schema
```

**Expected Output:**
```
✓ Schema pushed successfully
✓ Tables created: adminUsers, auditLogs, userStatus
```

**Troubleshooting:**
- If error: Check `INSTANT_ADMIN_TOKEN` is set correctly
- If command not found: Run `npm install` first

---

### Step 2: Sign Up/Sign In (If Not Already)

Before granting admin access, you must have a user account.

```bash
# Start server
npm run dev
```

Then:
1. Open http://localhost:3000
2. Click "Sign In"
3. Enter: `nasser@majesticsolutions.co`
4. Check email for magic code
5. Enter code and complete sign in
6. You should see the dashboard

**Stop the server** (Ctrl+C) after signing in.

---

### Step 3: Grant Admin Access

Now grant super admin to your account:

```bash
npm run setup-admin
```

**Expected Output:**
```
🔐 Setting up super admin for: nasser@majesticsolutions.co

🔍 Looking up user...
✅ Found user: nasser@majesticsolutions.co
   User ID: abc123...

🎯 Creating super admin...
✅ Super admin access granted!

📋 Summary:
   Email: nasser@majesticsolutions.co
   Role: super_admin
   Permissions: 13 permissions granted

🎉 Done! You can now access the admin panel.
```

**Troubleshooting:**
- **"User not found"**: You need to sign up first (Step 2)
- **Database error**: Check `INSTANT_ADMIN_TOKEN` is correct
- **Schema error**: Run `npm run push-schema` first

---

### Step 4: Start Development Server

```bash
npm run dev
```

**Expected Output:**
```
▲ Next.js 16.0.0
- Local:        http://localhost:3000
- ready started server on 0.0.0.0:3000
```

Keep this terminal open!

---

### Step 5: Access Admin Panel

Open your browser:

**Option A: Direct URL**
```
http://localhost:3000/admin
```

**Option B: Test Subdomain (if you have it configured)**
```
http://admin.localhost:3000
```

**What You Should See:**
1. Brief "Verifying admin access..." message
2. Then: Admin Dashboard with sidebar

**If You See:**
- ❌ Redirected to `/` → Not signed in
- ❌ Redirected to `/dashboard` → Signed in but not admin
- ✅ Admin Dashboard → Success! 🎉

---

### Step 6: Test Features

#### Test 1: Dashboard Metrics

**Check:**
- [ ] Total Users count (should be at least 1 - you!)
- [ ] Total URLs count
- [ ] Total Clicks count
- [ ] Recent Activity section

**Action:** Create a test URL
1. Go to main app (http://localhost:3000)
2. Create a short URL
3. Go back to admin dashboard
4. Metrics should update (refresh if needed)

---

#### Test 2: Sidebar Navigation

**Click each menu item:**
- [ ] Dashboard - Shows metrics
- [ ] Users - Shows user list
- [ ] URLs - (not implemented yet, should show empty)
- [ ] Analytics - (not implemented yet)
- [ ] Audit - (not implemented yet)
- [ ] Settings - (not implemented yet)

**Mobile Test:**
- [ ] Resize browser to mobile width
- [ ] Click hamburger menu (☰)
- [ ] Sidebar should slide in
- [ ] Click outside to close

---

#### Test 3: User Management

**Navigate to Users:**
1. Click "Users" in sidebar
2. You should see yourself listed

**Test Search:**
1. Type your name in search box
2. User list should filter
3. Clear search

**Test Status Filter:**
1. Click "Active" button
2. Should show only active users
3. Click "All" to reset

**View User Detail:**
1. Click "View Details" on your user
2. Should see:
   - Your name
   - User ID
   - Stats (URLs, Clicks)
   - Action buttons

---

#### Test 4: User Actions (Be Careful!)

**Test Suspend:**
1. On user detail page, click "Suspend User"
2. Enter a reason (e.g., "Test suspension")
3. Click OK
4. User status should change to "Suspended"
5. Check dashboard → Recent Activity should show the action

**Test Unsuspend:**
1. Click "Unsuspend User"
2. Status should change back to "Active"
3. Check Recent Activity again

**Note:** Don't suspend your own account without creating another admin first!

---

#### Test 5: Security (Important!)

**Test Non-Admin Access:**

1. Open an **incognito/private window**
2. Go to http://localhost:3000
3. Sign in with a DIFFERENT email (not nasser@majesticsolutions.co)
4. Try to access http://localhost:3000/admin
5. **Expected:** Should redirect to `/dashboard`
6. ✅ Pass: Non-admins can't access admin panel

**Test Unauthenticated Access:**

1. Open incognito window (or sign out)
2. Go to http://localhost:3000/admin
3. **Expected:** Should redirect to `/`
4. ✅ Pass: Unauthenticated users can't access

---

#### Test 6: Audit Logs

**Check Audit Trail:**

Every admin action should be logged. Let's verify:

1. Suspend a user (or unsuspend)
2. Go to Dashboard
3. Check "Recent Admin Activity" section
4. **Expected:** Should show your action with:
   - Your email
   - Action type (e.g., "Suspended a user")
   - Time ago

---

### Step 7: Check Database

**Verify in InstantDB Dashboard:**

1. Go to https://instantdb.com/dash
2. Select your app
3. Go to "Explorer" tab
4. Check tables:
   - **adminUsers**: Should have 1 entry (you)
   - **auditLogs**: Should have your actions
   - **userStatus**: Should have status changes

---

## 🎯 Testing Checklist

### Core Functionality
- [ ] Schema pushed successfully
- [ ] Admin access granted
- [ ] Can access /admin when signed in
- [ ] Dashboard shows correct metrics
- [ ] Sidebar navigation works
- [ ] Mobile menu works

### User Management
- [ ] User list loads
- [ ] Search works
- [ ] Filters work (Active/All/etc.)
- [ ] User detail page loads
- [ ] Can suspend user
- [ ] Can unsuspend user
- [ ] Status badge updates

### Security
- [ ] Non-admins can't access /admin
- [ ] Unauthenticated users redirected
- [ ] Admin check works correctly

### Audit Logging
- [ ] Actions logged to database
- [ ] Recent activity shows on dashboard
- [ ] Logs include admin email, action, timestamp

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module '@instantdb/admin'"

**Solution:**
```bash
npm install
```

### Issue: "Schema push failed"

**Solution:**
Check `.env.local`:
```bash
cat .env.local | grep INSTANT
```

Should show both:
- NEXT_PUBLIC_INSTANT_APP_ID=...
- INSTANT_ADMIN_TOKEN=...

### Issue: "User not found" when granting admin

**Solution:**
1. Start server: `npm run dev`
2. Sign in at http://localhost:3000
3. Stop server: Ctrl+C
4. Run: `npm run setup-admin`

### Issue: Admin panel shows "Verifying..." forever

**Solution:**
1. Check browser console for errors
2. Verify schema pushed: Check InstantDB dashboard
3. Verify admin user exists: Check `adminUsers` table
4. Clear browser cache and reload

### Issue: Redirected to /dashboard instead of /admin

**Solution:**
Your user is not in the `adminUsers` table.
```bash
npm run setup-admin
```

---

## ✅ Success Criteria

You've successfully tested the admin panel when:

1. ✅ You can access http://localhost:3000/admin
2. ✅ Dashboard shows your user/URL metrics
3. ✅ You can navigate between pages
4. ✅ You can view user list and details
5. ✅ You can suspend/unsuspend users
6. ✅ Actions appear in Recent Activity
7. ✅ Non-admins can't access /admin
8. ✅ Audit logs are being created

---

## 🎉 Next Steps After Testing

Once local testing is complete:

1. **Fix any issues** found during testing
2. **Create more admin users** (optional)
3. **Deploy to Railway** (RAILWAY-ADMIN-SETUP.md)
4. **Configure domain** (admin.hoturl.me)
5. **Test in production**

---

## 📸 Screenshots Expected

### Dashboard
```
┌─────────────────────────────────────────┐
│ Dashboard                                │
│ Overview of your Cool URLs instance     │
│                                          │
│ ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐│
│ │  1   │  │  3   │  │  15  │  │  1   ││
│ │Users │  │ URLs │  │Clicks│  │Active││
│ └──────┘  └──────┘  └──────┘  └──────┘│
│                                          │
│ Recent Admin Activity                    │
│ • nasser@... suspended a user (2m ago)  │
│ • nasser@... unsuspended a user (3m ago)│
└─────────────────────────────────────────┘
```

### User Management
```
┌─────────────────────────────────────────┐
│ User Management                          │
│ Search: [____________] [Active] [All]   │
│                                          │
│ Name         Status    URLs    Joined   │
│ ─────────────────────────────────────── │
│ Nasser       Active    3       Today    │
│ John Doe     Active    1       Yesterday│
└─────────────────────────────────────────┘
```

---

**Ready to start testing?** Run the first command:

```bash
npm run push-schema
```

Then follow the steps above! Let me know if you hit any issues.

