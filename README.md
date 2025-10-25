# Cool URLs - Modern URL Shortener

A beautiful, feature-rich URL shortener with user authentication and analytics, built with Next.js 16 and InstantDB.

![Cool URLs](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![InstantDB](https://img.shields.io/badge/InstantDB-Powered-purple?style=flat-square)

## ✨ Features

- 🔐 **Passwordless Authentication** - Magic link email authentication powered by InstantDB
- 🎨 **Custom Prefixes** - Create branded short links with custom prefixes
- 📊 **Analytics Dashboard** - Track clicks and view statistics for all your links
- ⚡ **Real-time Updates** - Instant synchronization across all devices
- 👤 **User-specific Links** - Each user manages their own collection of links
- 🗑️ **Link Management** - Edit, copy, and delete links from your dashboard
- 📱 **Responsive Design** - Beautiful UI that works on all devices
- 🎭 **Smooth Animations** - Powered by Framer Motion

## 🚀 Quick Start

See [QUICKSTART.md](QUICKSTART.md) for a 5-minute setup guide!

### Prerequisites

- Node.js 18+ installed
- An InstantDB account (free at [instantdb.com](https://instantdb.com))

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd cool-urls-0
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.local.example .env.local
```

4. Add your InstantDB credentials to `.env.local`

5. Start the development server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## 📖 Documentation

- [QUICKSTART.md](QUICKSTART.md) - Get started in 5 minutes
- [SETUP.md](SETUP.md) - Detailed setup and configuration guide

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router and Turbopack
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon set

### Backend
- **InstantDB** - Real-time database with built-in authentication
- **Next.js API Routes** - Serverless API endpoints

## 📁 Project Structure

```
cool-urls-0/
├── app/
│   ├── [shortCode]/          # Dynamic route for URL redirects
│   ├── api/
│   │   └── redirect/         # API endpoint for click tracking
│   ├── dashboard/            # User dashboard page
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/
│   ├── auth/                 # Authentication components
│   │   ├── auth-header.tsx   # Header with sign in/out
│   │   └── auth-modal.tsx    # Sign in modal
│   ├── ui/                   # Reusable UI components
│   └── setup-banner.tsx      # Setup instructions banner
├── lib/
│   ├── instant.ts            # InstantDB configuration
│   └── utils.ts              # Utility functions
├── .env.local.example        # Environment variables template
├── QUICKSTART.md             # Quick start guide
├── SETUP.md                  # Detailed setup guide
└── README.md                 # This file
```

## 🎯 Usage

### Creating Short Links

1. Enter your long URL in the input field
2. (Optional) Add a custom prefix to brand your link
3. Click "Shorten URL"
4. Copy and share your new short link!

### Managing Links

1. Sign in using the magic link authentication
2. Navigate to your Dashboard
3. View all your links with click statistics
4. Copy links or delete them as needed

### Tracking Analytics

Your dashboard shows:
- Total number of links created
- Total clicks across all links
- Individual click counts per link
- Creation dates for all links

## 🔒 Security

- All authentication is handled by InstantDB's secure magic link system
- No passwords to manage or store
- User data is isolated - users can only access their own links
- Environment variables keep sensitive credentials secure

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

### Other Platforms

Works with any platform that supports Next.js:
- Netlify
- Railway
- Render
- AWS Amplify

**Important:** Always add your environment variables in your deployment platform's settings.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database and Auth by [InstantDB](https://instantdb.com)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)

## 📮 Support

If you have questions or run into issues:
1. Check the [SETUP.md](SETUP.md) guide
2. Review the [QUICKSTART.md](QUICKSTART.md) for common issues
3. Open an issue on GitHub

---

Made with ❤️ using Next.js and InstantDB
