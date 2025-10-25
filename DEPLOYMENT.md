# Deployment Guide - Railway

This guide will help you deploy Cool URLs to Railway.

## 🚂 Quick Deploy (Recommended)

### Method 1: Deploy via Railway Dashboard (Easiest)

1. **Go to Railway**
   - Visit: [https://railway.app/new](https://railway.app/new)
   - Sign in with your GitHub account

2. **Deploy from GitHub**
   - Click "Deploy from GitHub repo"
   - Select: `alsulaihim/cool-urls`
   - Choose branch: `dev` (for development) or `main` (for production)

3. **Configure Environment Variables**
   - Railway will auto-detect your Next.js app
   - Add these environment variables in Railway dashboard:
     ```
     NEXT_PUBLIC_INSTANT_APP_ID=your_instant_app_id_here
     INSTANT_ADMIN_TOKEN=your_admin_token_here
     ```
   - Get these from your InstantDB dashboard: [https://instantdb.com/dash](https://instantdb.com/dash)

4. **Deploy**
   - Railway will automatically build and deploy
   - Wait for deployment to complete (usually 2-3 minutes)
   - You'll get a URL like: `https://cool-urls-production.up.railway.app`

5. **Set Up Custom Domain (Optional)**
   - In Railway settings, go to "Domains"
   - Click "Generate Domain" for a custom railway.app subdomain
   - Or connect your own domain

### Method 2: Deploy via Railway CLI

If you prefer using the command line:

1. **Login to Railway**
   ```bash
   railway login
   ```

2. **Initialize Project**
   ```bash
   railway init
   ```
   - Select your workspace when prompted
   - Choose "Create new project" or link to existing

3. **Link to GitHub (Recommended)**
   ```bash
   railway link
   ```
   - Select your project
   - This enables automatic deployments from GitHub

4. **Set Environment Variables**
   ```bash
   railway variables set NEXT_PUBLIC_INSTANT_APP_ID="your_app_id"
   railway variables set INSTANT_ADMIN_TOKEN="your_token"
   ```

5. **Deploy**
   ```bash
   railway up
   ```

   Or push to GitHub (if linked):
   ```bash
   git push origin dev
   ```
   Railway will auto-deploy!

## 🔧 Configuration

### Build Settings
Railway automatically detects Next.js apps. Default settings:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Node Version**: Detected from package.json

### Environment Variables Required
- `NEXT_PUBLIC_INSTANT_APP_ID` - Your InstantDB App ID
- `INSTANT_ADMIN_TOKEN` - Your InstantDB Admin Token

### Health Checks
Railway will automatically monitor your app's health at the root URL (`/`).

## 🌍 Multiple Environments

Deploy different branches to different Railway projects:

### Development Environment
- Branch: `dev`
- Railway Project: cool-urls-dev
- URL: `https://cool-urls-dev.up.railway.app`

### Staging Environment
- Branch: `staging`
- Railway Project: cool-urls-staging
- URL: `https://cool-urls-staging.up.railway.app`

### Production Environment
- Branch: `live` or `main`
- Railway Project: cool-urls-production
- URL: `https://cool-urls-production.up.railway.app`

To create multiple environments:
1. Create a new Railway project for each environment
2. Connect each to the corresponding GitHub branch
3. Set the same environment variables for each
4. Enable automatic deployments

## 📊 Monitoring

Once deployed, you can monitor your app in Railway dashboard:
- **Deployments**: View build logs and deployment history
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs
- **Analytics**: Request metrics and errors

## 🔄 Automatic Deployments

Railway automatically deploys when you push to the connected branch:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin dev

# Railway automatically deploys! 🚀
```

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Railway dashboard
- Verify all dependencies in package.json
- Ensure environment variables are set

### App Not Starting
- Check that `npm start` works locally
- Verify environment variables are correct
- Review application logs in Railway

### 404 Errors
- Make sure you're using Next.js 16 (App Router)
- Check that all routes are properly defined
- Clear Railway cache and redeploy

## 💰 Pricing

Railway offers:
- **Hobby Plan**: Free $5 credit per month
- **Pro Plan**: $20/month + usage

Your app should fit comfortably in the free tier for development and small-scale production use.

## 📚 Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway Next.js Guide](https://docs.railway.app/guides/nextjs)
- [InstantDB Documentation](https://instantdb.com/docs)

## ✅ Deployment Checklist

- [ ] Create Railway account
- [ ] Connect GitHub repository
- [ ] Add environment variables
- [ ] Deploy from dashboard or CLI
- [ ] Test the deployed URL
- [ ] Set up custom domain (optional)
- [ ] Configure automatic deployments
- [ ] Set up monitoring and alerts

---

Ready to deploy? Start here: [https://railway.app/new](https://railway.app/new) 🚀
