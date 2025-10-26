# InstantDB Setup - Run These Commands

## The Issue
You're getting "Mutation failed {}" because InstantDB schema and permissions need to be pushed to the server.

## Solution: Run These 2 Commands

I've detected your schema is ready to push. You just need to confirm the changes.

### Step 1: Push Schema

Run this command and **select "Push"** when prompted:

```bash
npx instant-cli@latest push schema
```

**What you'll see:**
```
Found NEXT_PUBLIC_INSTANT_APP_ID: aba22924-dcfd-4836-b475-9135b8036c08
┌──────────────────────────────────────────┐
│  + MAKE REQUIRED  urls.clicks            │
│  + MAKE REQUIRED  urls.createdAt         │
│  + MAKE REQUIRED  urls.originalUrl       │
│  + MAKE REQUIRED  urls.shortCode         │
│  + MAKE REQUIRED  urls.userId            │
│  + MAKE REQUIRED  userProfiles.createdAt │
│  + MAKE REQUIRED  userProfiles.name      │
│  + MAKE REQUIRED  userProfiles.userId    │
│                                          │
│ Push these changes?                      │
│   > Push      Cancel                     │
└──────────────────────────────────────────┘
```

**Action:** Press Enter or click "Push"

### Step 2: Push Permissions

Run this command and **select "Push"** when prompted:

```bash
npx instant-cli@latest push perms
```

**Action:** Press Enter or click "Push" when prompted

### Step 3: Test

Refresh your app and try creating a short URL. The error should be gone!

## Quick Copy-Paste Commands

```bash
# Run these one by one and confirm each
npx instant-cli@latest push schema
npx instant-cli@latest push perms
```

## What These Do

- **push schema**: Creates the `urls` and `userProfiles` tables in your InstantDB database
- **push perms**: Sets up security rules so users can create/read/update URLs

## If You Get Stuck

The commands are interactive (they wait for you to confirm). This is by design to prevent accidental changes.

Just press Enter or Tab to "Push" when you see the confirmation dialog.
