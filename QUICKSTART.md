# Quick Start Guide

Get Cool URLs up and running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Get InstantDB Credentials

1. Visit [https://instantdb.com](https://instantdb.com)
2. Sign up for a free account
3. Click "Create App"
4. Give your app a name (e.g., "cool-urls")
5. Copy your **App ID** (it looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
6. Go to the "Settings" tab and copy your **Admin Token**

## Step 3: Create Environment File

Create a file named `.env.local` in the root directory:

```bash
cp .env.local.example .env.local
```

Then open `.env.local` and paste your credentials:

```env
NEXT_PUBLIC_INSTANT_APP_ID=paste-your-app-id-here
INSTANT_ADMIN_TOKEN=paste-your-admin-token-here
```

## Step 4: Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 5: Test It Out!

1. **Create a short link**: Enter a URL and click "Shorten URL"
2. **Sign in**: Click "Sign In" in the header, enter your email, and check your inbox for the magic code
3. **View your dashboard**: After signing in, click "Dashboard" to see your links and stats

## That's it! 🎉

Your URL shortener is now running with:
- ✅ User authentication (magic link email)
- ✅ Personal dashboard
- ✅ Link analytics
- ✅ Click tracking
- ✅ Custom prefixes

## Troubleshooting

**App won't start or shows InstantDB errors?**
- Make sure you created the `.env.local` file
- Check that your credentials are correctly pasted (no extra spaces)
- Restart the dev server after adding environment variables

**Magic link not arriving?**
- Check your spam folder
- Wait a minute and try again
- Make sure you entered the correct email address

**Need more help?**
See the full [SETUP.md](SETUP.md) for detailed instructions.
