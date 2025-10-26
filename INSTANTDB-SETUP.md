# InstantDB Setup - Fix Mutation Error

## Problem
You're seeing "Mutation failed {}" error because InstantDB needs schema and permissions to be configured.

## Quick Fix (5 minutes)

### Step 1: Go to InstantDB Dashboard
1. Visit: https://instantdb.com/dash
2. Select your app (or the app ID from your `.env.local`)
3. You should see your app dashboard

### Step 2: Set Up Schema
1. In the dashboard, click on **"Schema"** tab
2. Click **"Code Editor"** or **"Schema Builder"**
3. Copy and paste this schema:

```typescript
{
  "urls": {
    "fields": {
      "originalUrl": "string",
      "shortCode": "string",
      "prefix": "string?",
      "createdAt": "number",
      "clicks": "number",
      "userId": "string",
      "analyticsData": "string?"
    },
    "indexes": [
      ["shortCode"]
    ],
    "unique": [
      ["shortCode"]
    ]
  },
  "userProfiles": {
    "fields": {
      "userId": "string",
      "name": "string",
      "createdAt": "number"
    },
    "indexes": [
      ["userId"]
    ],
    "unique": [
      ["userId"]
    ]
  }
}
```

4. Click **"Save Schema"** or **"Deploy"**

### Step 3: Set Up Permissions
1. Click on **"Permissions"** or **"Rules"** tab
2. Add these permission rules:

**For `urls` table:**
```javascript
// Create: Anyone can create (logged in or anonymous)
create: true

// View: Anyone can view
view: true

// Update: Users can update their own URLs or anonymous URLs
update: data.userId == auth.id || data.userId == 'anonymous'

// Delete: Users can delete their own URLs
delete: data.userId == auth.id
```

**For `userProfiles` table:**
```javascript
// Create: Only authenticated users
create: auth.id != null

// View: Anyone can view
view: true

// Update: Users can update their own profile
update: data.userId == auth.id

// Delete: Users can delete their own profile
delete: data.userId == auth.id
```

3. Click **"Save"** or **"Deploy"**

### Step 4: Test
1. Refresh your app: http://localhost:3000
2. Try creating a short URL
3. The mutation error should be gone!

## Alternative: Using InstantDB Explorer

If the dashboard has an "Explorer" or "Data" tab:

1. Go to **Explorer** tab
2. You might see an option to **"Initialize Schema"** or **"Create Tables"**
3. Create the `urls` and `userProfiles` tables manually with the fields above

## Common Issues

### Issue: "Schema is not defined"
- Make sure you clicked "Save" or "Deploy" in the schema editor
- Wait 10-20 seconds for changes to propagate
- Refresh your app

### Issue: "Permission denied"
- Check that permissions are set up correctly
- For testing, you can temporarily set all permissions to `true`
- Don't forget to make them more restrictive later for security

### Issue: Still getting mutation errors
- Check browser console for detailed error messages
- Verify your `NEXT_PUBLIC_INSTANT_APP_ID` in `.env.local` matches the dashboard
- Make sure you're using the correct app in the dashboard

## Quick Test Permissions

For quick testing, you can use these relaxed permissions (NOT for production):

```javascript
urls: {
  create: true,
  view: true,
  update: true,
  delete: true
}

userProfiles: {
  create: true,
  view: true,
  update: true,
  delete: true
}
```

Once everything works, switch back to the secure permissions above.

## Need Help?

1. Check the InstantDB docs: https://www.instantdb.com/docs
2. Join their Discord: https://discord.gg/instantdb
3. Check your browser console for detailed error messages

## Files Created

I've created these files for reference:
- `instant.schema.ts` - Schema definition
- `instant.perms.ts` - Permission rules

These are for reference only. You need to apply them through the web dashboard as shown above.
