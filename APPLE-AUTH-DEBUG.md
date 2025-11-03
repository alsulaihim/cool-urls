# Apple Sign In Debugging Guide

## Current Issue
Getting "Sign Up Not Completed" error when trying to authenticate with Apple ID.

## Environment Variables (Current)
```bash
NEXT_PUBLIC_APPLE_CLIENT_NAME=apple-web
NEXT_PUBLIC_APPLE_SERVICE_ID=com.coolurls.web
```

## Apple Developer Portal Configuration Checklist

### 1. App ID Setup
- [ ] Go to [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list)
- [ ] Navigate to Identifiers → App IDs
- [ ] Find or create your App ID
- [ ] Enable "Sign In with Apple" capability
- [ ] Configure Sign In with Apple settings

### 2. Services ID Setup (Most Important)
- [ ] Go to Identifiers → Services IDs
- [ ] Find or create your Services ID: `com.coolurls.web`
- [ ] Enable "Sign In with Apple"
- [ ] Click "Configure" button next to "Sign In with Apple"

**Critical Configuration:**
```
Primary App ID: [Select your App ID from step 1]

Website URLs:
- Domains and Subdomains:
  Development: localhost (or your domain)
  Production: yourdomain.com

- Return URLs:
  Development: https://api.instantdb.com/runtime/oauth/callback
  Production: https://api.instantdb.com/runtime/oauth/callback
```

### 3. InstantDB Dashboard Configuration
- [ ] Go to [InstantDB Dashboard](https://instantdb.com/dash)
- [ ] Select your app: cool-urls-0
- [ ] Navigate to Settings → Auth → Add Client → Apple
- [ ] Fill in the Apple OAuth configuration:
  ```
  Client Name: apple-web (must match NEXT_PUBLIC_APPLE_CLIENT_NAME)
  Services ID: com.coolurls.web
  Team ID: [Your 10-character Apple Team ID from Developer Portal → Membership]
  Key ID: [10-character Key ID from the authentication key you created]
  Private Key: [Contents of the .p8 file you downloaded - paste the entire content including headers]
  ```

**Important Notes:**
- The Client Name MUST match the value in your `.env.local` file (`NEXT_PUBLIC_APPLE_CLIENT_NAME=apple-web`)
- Services ID MUST match what you configured in Apple Developer Portal
- You can only download the .p8 private key file ONCE when creating the key - save it securely
- The private key should look like:
  ```
  -----BEGIN PRIVATE KEY-----
  [key content]
  -----END PRIVATE KEY-----
  ```

### 4. Creating Apple Sign In Key
- [ ] Go to Apple Developer Portal → Keys
- [ ] Click "+" to create a new key
- [ ] Give it a name (e.g., "Cool URLs Apple Sign In")
- [ ] Enable "Sign In with Apple"
- [ ] Configure the key with your Services ID
- [ ] Download the `.p8` file (you can only download this ONCE!)
- [ ] Note the Key ID (you'll need this for InstantDB)

### 5. Finding Your Team ID
- [ ] Go to Apple Developer Portal
- [ ] Click on your name/organization in the top right
- [ ] Select "Membership"
- [ ] Your Team ID is displayed there

## Common Issues and Solutions

### Issue: "Sign Up Not Completed" Error
**Causes:**
1. Return URL mismatch between Apple Developer Portal and your implementation
2. Services ID not properly configured
3. Missing Team ID, Key ID, or Private Key in InstantDB
4. Domain not properly verified in Apple Developer Portal

**Solution:**
- Double-check that Return URL in Apple Developer Portal exactly matches:
  `https://api.instantdb.com/runtime/oauth/callback`
- Ensure the Services ID matches exactly: `com.coolurls.web`
- Verify all credentials are entered correctly in InstantDB dashboard

### Issue: "Invalid Client" Error
**Causes:**
1. Services ID doesn't match
2. Services ID not enabled for Sign In with Apple

**Solution:**
- Verify Services ID is enabled for Sign In with Apple
- Check that Services ID in code matches Apple Developer Portal

### Issue: "Unauthorized" Error
**Causes:**
1. Domain not added to allowed domains in Apple Developer Portal
2. Redirect URI not in allowed list

**Solution:**
- Add all domains (including localhost for development) to Apple Developer Portal
- Ensure redirect URI is in the Return URLs list

## Testing Steps

1. **Enable Apple Sign In Button:**
   - In `components/auth/auth-modal.tsx`, change the disabled button to enabled
   - Remove the opacity and cursor classes
   - Make `onClick` call `handleAppleSignIn`

2. **Test Flow:**
   - Click "Sign In" to open inline auth form
   - Click "Continue with Apple" button
   - Apple popup should open
   - Sign in with Apple ID
   - Should redirect back and authenticate successfully

3. **Check Browser Console:**
   - Open DevTools → Console
   - Look for any error messages
   - Check Network tab for failed requests

## Next Steps After Configuration

Once you've completed all the configuration steps above:

1. Update the Apple Sign In button in `components/auth/auth-modal.tsx`:
```typescript
<Button
  type="button"
  variant="outline"
  onClick={handleAppleSignIn}
  disabled={isLoading}
  className="w-full h-11 border-gray-300 flex items-center justify-center gap-2"
>
  <Apple className="w-5 h-5" />
  <span>Continue with Apple</span>
</Button>
```

2. Test the authentication flow
3. Monitor console for any errors
4. If errors persist, check InstantDB logs

## Resources

- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [InstantDB OAuth Documentation](https://instantdb.com/docs/auth)
- [Apple Developer Portal](https://developer.apple.com/account/resources/)
