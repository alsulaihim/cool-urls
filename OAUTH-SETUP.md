# OAuth Authentication Setup Guide

This guide explains how to set up Google OAuth and Apple Sign In for your Cool URLs application.

## Current Status

- ✅ **Magic Link (Email)**: Fully configured and working
- ✅ **Google OAuth**: Fully configured and working
- ✅ **Apple Sign In**: Fully configured and working
- ❌ **Email/Password**: Not supported by InstantDB (use magic link instead)

## Google OAuth Setup

### 1. Create Google OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Select **Web application**
6. Configure:
   - **Name**: `Cool URLs - Web`
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**:
     - `https://api.instantdb.com/runtime/oauth/callback`
7. Save and copy the **Client ID** and **Client Secret**

### 2. Configure InstantDB Dashboard

1. Go to [InstantDB Dashboard](https://instantdb.com/dash)
2. Select your app: `cool-urls-0`
3. Navigate to **Auth** tab
4. Click **Set up Google**
5. Enter:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
   - **Client Name**: `google-web`
6. Add redirect origins:
   - `http://localhost:3000`
   - Your production domain
7. Save the configuration

### 3. Update Environment Variables

Add to your `.env.local` file:

```bash
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
NEXT_PUBLIC_GOOGLE_CLIENT_NAME=google-web
```

### 4. Restart Dev Server

```bash
npm run dev
```

### 5. Test Google Sign In

1. Open your app at `http://localhost:3000`
2. Click **Sign In**
3. You should see the **Continue with Google** button
4. Click it to test the OAuth flow

## Apple Sign In Setup

Apple Sign In is now fully configured! ✅

### Prerequisites

- ✅ Apple Developer Account ($99/year)
- ✅ Registered App ID with "Sign In with Apple" enabled
- ✅ Service ID for Sign In with Apple

### Configuration Steps

1. **Apple Developer Portal Setup**:
   - Create an App ID with "Sign In with Apple" capability enabled
   - Create a Services ID (e.g., `com.coolurls.web`)
   - Configure Services ID with:
     - Primary App ID
     - Domains: `api.instantdb.com`
     - Return URLs: `https://api.instantdb.com/runtime/oauth/callback`

2. **InstantDB Dashboard Configuration**:
   - Navigate to Auth tab
   - Click "Add Apple Client"
   - Enter:
     - Client Name: `apple-web`
     - Service ID: Your Services ID from step 1
   - Add `http://localhost:3000` to Redirect Origins

3. **Environment Variables** (Already Added):
   ```bash
   NEXT_PUBLIC_APPLE_CLIENT_NAME=apple-web
   ```

4. **Code Updates** (Already Completed):
   - ✅ Apple Sign In button enabled in `auth-modal.tsx`
   - ✅ Apple JS SDK loaded in `layout.tsx`
   - ✅ Sign in handler implemented with nonce validation

## Email/Password Authentication

**Note**: InstantDB does not support traditional email/password authentication. Instead, use:

1. **Magic Link** (Current implementation): Passwordless email authentication
2. **OAuth Providers**: Google, Apple, GitHub, LinkedIn
3. **Custom Auth**: Using InstantDB Admin SDK

The magic link approach provides better security and UX without password management.

## Troubleshooting

### Google OAuth Not Working

1. **Check Environment Variables**:
   ```bash
   echo $NEXT_PUBLIC_GOOGLE_CLIENT_ID
   ```
   Should output your client ID.

2. **Verify InstantDB Configuration**:
   - Client Name in dashboard must match `NEXT_PUBLIC_GOOGLE_CLIENT_NAME`
   - Redirect URI must be exactly: `https://api.instantdb.com/runtime/oauth/callback`

3. **Check Console Errors**:
   - Open browser DevTools → Console
   - Look for authentication errors
   - Common issues: CORS, wrong client ID, mismatched nonce

### Common Errors

**Error**: "Google sign-in failed"
- **Fix**: Check that Google OAuth client is properly configured
- Verify redirect URIs include InstantDB's callback URL

**Error**: "Invalid client ID"
- **Fix**: Ensure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is correctly set
- Restart dev server after adding environment variables

**Error**: "Unauthorized origin"
- **Fix**: Add your domain to Google Cloud Console authorized origins

## Security Notes

1. **Never commit** `.env.local` to version control
2. **Client IDs** are public but should still be kept in env variables
3. **Client Secrets** must NEVER be exposed to frontend code
4. **Nonce** is automatically generated for each OAuth flow to prevent replay attacks
5. **InstantDB** handles token validation server-side

## Architecture

```
User clicks "Continue with Google"
    ↓
Google OAuth popup opens
    ↓
User authenticates with Google
    ↓
Google returns ID token + nonce
    ↓
Frontend calls db.auth.signInWithIdToken()
    ↓
InstantDB validates token server-side
    ↓
User authenticated ✓
```

## Additional Resources

- [InstantDB Auth Docs](https://www.instantdb.com/docs/auth)
- [Google OAuth Setup](https://www.instantdb.com/docs/auth/google-oauth)
- [Apple Sign In Docs](https://developer.apple.com/sign-in-with-apple/)
- [@react-oauth/google](https://www.npmjs.com/package/@react-oauth/google)

## Next Steps

1. ✅ Set up Google OAuth client in Google Cloud Console
2. ✅ Configure InstantDB dashboard with OAuth credentials
3. ✅ Add environment variables
4. ✅ Test Google sign-in flow
5. ⬜ Set up Apple Sign In (requires Apple Developer account)
6. ⬜ Test on production domain
