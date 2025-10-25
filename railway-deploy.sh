#!/bin/bash

echo "🚂 Railway Deployment Script"
echo "=============================="
echo ""

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install it with:"
    echo "npm i -g @railway/cli"
    exit 1
fi

echo "✅ Railway CLI found"
echo ""

# Login check
echo "Checking authentication..."
railway whoami || {
    echo "❌ Not logged in. Run: railway login"
    exit 1
}

echo "✅ Logged in to Railway"
echo ""

# Initialize project
echo "🔧 Initializing Railway project..."
echo "   Please select your workspace when prompted"
railway init

# Link to project (if already exists)
echo ""
echo "📦 If you already have a Railway project, link it:"
echo "   railway link"
echo ""

# Set environment variables
echo "🔐 Setting environment variables..."
echo "   Make sure to set these in Railway dashboard:"
echo "   - NEXT_PUBLIC_INSTANT_APP_ID"
echo "   - INSTANT_ADMIN_TOKEN"
echo ""

# Deploy
echo "🚀 Ready to deploy!"
echo "   Run: railway up"
echo ""
echo "   Or deploy via GitHub:"
echo "   1. Push to GitHub: git push origin dev"
echo "   2. Railway will auto-deploy from GitHub"
