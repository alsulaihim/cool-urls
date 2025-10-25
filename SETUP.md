# Cool URLs - Setup Guide

A modern URL shortener with user authentication and analytics, powered by InstantDB.

## Features

- **User Authentication**: Magic link email authentication (no passwords needed!)
- **Custom Prefixes**: Create branded short links with custom prefixes
- **Analytics Dashboard**: Track clicks and manage all your links
- **Real-time Updates**: Powered by InstantDB for instant synchronization
- **User-specific Links**: Each user sees only their own links

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up InstantDB

1. Go to [https://instantdb.com](https://instantdb.com) and create an account
2. Create a new app in the InstantDB dashboard
3. Copy your App ID and Admin Token

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and add your InstantDB credentials:

```env
NEXT_PUBLIC_INSTANT_APP_ID=your_app_id_here
INSTANT_ADMIN_TOKEN=your_admin_token_here
```

### 4. Schema is Pre-configured!

Good news! The schema is already defined in the code at `lib/instant.ts` using InstantDB's schema builder. When you first run the app and create data, InstantDB will automatically set up the schema based on our code definition.

The schema includes:
- **urls** entity with fields:
  - `originalUrl` (string)
  - `shortCode` (string, unique & indexed)
  - `prefix` (string, optional)
  - `createdAt` (number)
  - `clicks` (number)
  - `userId` (string)

**Users** are automatically managed by InstantDB's authentication system - no manual setup needed!

### 5. Set up Permissions (Optional but Recommended)

In InstantDB dashboard, configure permissions to ensure:
- Users can only read and write their own URLs
- Anonymous users can create URLs but with limited access

Example permission rules:
```javascript
// Users can only read their own URLs
urls.read: auth.id == data.userId

// Users can only create URLs for themselves
urls.create: auth.id == data.userId || data.userId == 'anonymous'

// Users can only update their own URLs
urls.update: auth.id == data.userId

// Users can only delete their own URLs
urls.delete: auth.id == data.userId
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating Short Links

1. Enter a long URL in the input field
2. (Optional) Add a custom prefix to make your link branded
3. Click "Shorten URL"
4. Copy your new short link!

### Viewing Your Dashboard

1. Click "Sign In" in the header
2. Enter your email address
3. Check your email for the magic link code
4. Enter the code to sign in
5. Click "Dashboard" to view all your links and statistics

### Managing Links

In your dashboard, you can:
- View all your shortened links
- See click statistics for each link
- Copy links to clipboard
- Delete links you no longer need
- Track total links and total clicks

## Tech Stack

- **Next.js 16** - React framework with App Router
- **InstantDB** - Real-time database with built-in authentication
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Radix UI** - Accessible components
- **Lucide React** - Icons

## Project Structure

```
cool-urls-0/
├── app/
│   ├── [shortCode]/       # Dynamic redirect page
│   ├── api/
│   │   └── redirect/      # API route for redirects with click tracking
│   ├── dashboard/         # User dashboard page
│   └── page.tsx           # Home page
├── components/
│   ├── auth/              # Authentication components
│   │   ├── auth-header.tsx
│   │   └── auth-modal.tsx
│   └── ui/                # Reusable UI components
├── lib/
│   ├── instant.ts         # InstantDB configuration
│   └── utils.ts
└── .env.local             # Environment variables (create this!)
```

## Development Notes

- The old in-memory store (`lib/store.ts`) has been replaced with InstantDB
- Users can create links anonymously, but must sign in to view their dashboard
- All links are now associated with a user ID (or 'anonymous' for non-authenticated users)
- Click tracking happens in the API route to ensure accurate counting

## Troubleshooting

### "Invalid App ID" Error
- Make sure you've created a `.env.local` file with the correct credentials
- Verify your App ID in the InstantDB dashboard
- Restart the development server after adding environment variables

### Magic Link Not Received
- Check your spam folder
- Verify the email address is correct
- Try again in a few minutes (rate limiting may apply)

### Links Not Appearing in Dashboard
- Make sure you're signed in
- Verify that links were created while authenticated
- Check the browser console for any errors

## Production Deployment

When deploying to production (Vercel, Netlify, etc.):

1. Add the environment variables in your deployment platform's settings
2. Make sure to use the same InstantDB app or create a production app
3. Configure proper permissions in InstantDB for production use
4. Consider setting up custom domains for your short links

## License

MIT
