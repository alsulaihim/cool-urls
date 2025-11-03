# Apple Sign In Setup - Simple Guide

## What You Need to Configure

### 1. InstantDB Dashboard (Already Done?)
✅ Go to: https://instantdb.com/dash
✅ Select your app: cool-urls-0
✅ Click on: Auth tab
✅ Look for: "Add Apple Client" or "Setup Apple"
✅ Fill in:
   - **Client Name**: `apple-web`
   - **Services ID**: `com.coolurls.web`

That's all InstantDB needs!

### 2. Apple Developer Portal Configuration

You need to configure Apple's side to allow the authentication:

#### Step 1: Create Services ID
1. Go to: https://developer.apple.com/account/resources/identifiers/list/serviceId
2. Click the "+" button to create a new Services ID
3. Fill in:
   - **Description**: Cool URLs Web
   - **Identifier**: `com.coolurls.web` (must match what's in InstantDB)
4. Enable "Sign In with Apple"
5. Click "Configure"

#### Step 2: Configure Services ID
In the "Sign In with Apple" configuration:

1. **Primary App ID**: Select or create an App ID (if you don't have one, create it first)
2. **Domains and Subdomains**: Add:
   - For development: `localhost`
   - For production: `yourdomain.com`
3. **Return URLs**: Add these EXACT URLs:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

**IMPORTANT**: The return URLs must match exactly where your app is hosted.

#### Step 3: Save Everything
1. Click "Continue"
2. Click "Save"
3. Click "Done"

### 3. Environment Variables (Already Configured)
Your `.env.local` already has:
```bash
NEXT_PUBLIC_APPLE_CLIENT_NAME=apple-web
NEXT_PUBLIC_APPLE_SERVICE_ID=com.coolurls.web
```

## Testing Apple Sign In

1. Make sure your InstantDB dashboard has the Apple client configured
2. Make sure Apple Developer Portal has the Services ID configured with correct return URLs
3. Go to your app: http://localhost:3000
4. Click "Sign In / Sign Up" in the "Want to track your links?" card
5. Click "Continue with Apple"
6. Apple popup should appear
7. Sign in with your Apple ID

## Common Issues

### Issue: "Invalid Client"
**Cause**: Services ID mismatch
**Fix**: Make sure `com.coolurls.web` is exactly the same in:
- InstantDB dashboard (Client configuration)
- Apple Developer Portal (Services ID Identifier)
- `.env.local` file (NEXT_PUBLIC_APPLE_SERVICE_ID)

### Issue: "Redirect URI mismatch"
**Cause**: Return URL not configured in Apple Developer Portal
**Fix**: Add `http://localhost:3000` to the Return URLs in Apple Developer Portal → Services ID configuration

### Issue: Apple popup doesn't open
**Cause**: Apple SDK not loaded or blocked
**Fix**:
- Check browser console for errors
- Make sure popups are not blocked
- Try a different browser

### Issue: "Sign Up Not Completed"
**Cause**: Apple Developer Portal configuration incomplete
**Fix**:
- Make sure Services ID is enabled for "Sign In with Apple"
- Make sure you clicked "Configure" and added the return URLs
- Make sure you saved all changes

## Important Notes

- This uses the web-based Apple Sign In flow (simpler than native apps)
- No need for Team ID, Key ID, or Private Key with InstantDB's approach
- Return URLs must match your actual domain exactly
- For production, update the return URLs to your production domain
