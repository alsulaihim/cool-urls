# Custom Short Domain Setup Guide

Your short URLs currently look like:
```
https://cool-urls-dev.up.railway.app/nasserk-FZhd4y
```

This guide will help you make them truly **short** like:
```
https://go.link/nasserk
https://urls.to/nasserk
https://short.ly/nasserk
```

## 🎯 Why You Need a Custom Short Domain

**Problem**: `cool-urls-dev.up.railway.app` is too long for a "URL shortener"
**Solution**: Get a short, memorable domain

**Benefits:**
- ✅ Actually short URLs
- ✅ Branded and professional
- ✅ Easy to remember and share
- ✅ Better user experience

---

## Option 1: Buy a Short Custom Domain (Recommended) ⭐

### Step 1: Find a Short Domain

**Where to buy:**
- [Porkbun](https://porkbun.com) - Very affordable, great for short domains
- [Namecheap](https://www.namecheap.com) - Popular and reliable
- [Dynadot](https://www.dynadot.com) - Good prices

**Domain ideas:**
- 2-letter domains: `go.to`, `ur.ls`, `cl.ik`
- Short words: `short.link`, `tiny.url`, `quick.to`
- Creative: `urls.to`, `shrt.link`, `clip.it`
- Your brand: `yourname.link`, `yourcompany.to`

**Cost:** $10-30/year for most domains

### Step 2: Configure DNS

Once you own a domain, point it to Railway:

1. **In your domain registrar (Porkbun, Namecheap, etc.):**
   - Go to DNS settings
   - Add an **A Record**:
     - Host: `@` (or leave blank for root domain)
     - Points to: Railway will give you an IP
   - Or add a **CNAME Record**:
     - Host: `@`
     - Points to: `cool-urls-dev.up.railway.app`

2. **In Railway Dashboard:**
   - Go to your project
   - Click "Settings" → "Domains"
   - Click "Custom Domain"
   - Enter your domain (e.g., `go.link`)
   - Railway will show you DNS records to add

### Step 3: Configure Your App

Add the custom domain to your environment variables in Railway:

```bash
NEXT_PUBLIC_SHORT_DOMAIN=https://go.link
```

**In Railway Dashboard:**
1. Go to Variables
2. Click "Add Variable"
3. Key: `NEXT_PUBLIC_SHORT_DOMAIN`
4. Value: `https://your-domain.com` (use YOUR domain)
5. Click "Add"

**Redeploy** (Railway will auto-redeploy when you add variables)

### Step 4: Test!

Create a new short link and you should see:
```
https://go.link/your-short-code
```

---

## Option 2: Free Subdomain Solutions

If you don't want to buy a domain yet:

### A. Use Railway's Custom Subdomain

Railway gives you a free subdomain:

1. Go to Railway Dashboard → Domains
2. Click "Generate Domain"
3. You might get something like: `cool-urls.up.railway.app`

Still not super short, but better than the dev URL.

### B. Use Cloudflare Pages/Workers

Set up a free Cloudflare domain:
1. Get a free Cloudflare account
2. Use Cloudflare Workers to redirect
3. Free `.workers.dev` subdomain

**Cost:** Free

---

## Option 3: Really Short Domains (Advanced)

### Emoji Domains 😎

Some registrars sell emoji domains:
- `🔗.to`
- `👉.ws`

### Single Letter + TLD

Rare but possible:
- `u.rl` (if available)
- `s.hort` (if available)

**Cost:** Usually expensive ($100+/year)

---

## 🛠️ Implementation in Your App

Your app now supports custom domains! Here's how it works:

### Code Changes Made:

1. **Created `lib/config.ts`:**
   ```typescript
   export function getShortUrlBase(): string {
     return process.env.NEXT_PUBLIC_SHORT_DOMAIN || window.location.origin;
   }
   ```

2. **Updated `app/page.tsx`:**
   - Uses `getShortUrlBase()` instead of `window.location.origin`
   - Shows preview with your custom domain

3. **Updated `.env.local.example`:**
   - Added `NEXT_PUBLIC_SHORT_DOMAIN` variable

### How to Use:

**Local Development:**
```bash
# In .env.local
NEXT_PUBLIC_SHORT_DOMAIN=http://localhost:3000
```

**Production (Railway):**
```bash
# In Railway Variables
NEXT_PUBLIC_SHORT_DOMAIN=https://your-domain.com
```

---

## 📋 Recommended Short Domains

Here are some actually available (as of writing) short domains:

### Budget-Friendly ($10-20/year):
- `.link` domains: `go.link`, `my.link`, `url.link`
- `.to` domains: `go.to`, `url.to`, `shrt.to`
- `.ly` domains: `short.ly`, `url.ly`
- `.io` domains: `shrt.io`, `link.io`

### Premium ($30-50/year):
- `.app` domains: `short.app`, `link.app`
- `.dev` domains: `url.dev`, `go.dev`

### Creative Options:
- Use your name: `john.link`, `sarah.to`
- Use your brand: `yourcompany.link`
- Fun words: `clip.link`, `snap.to`

---

## 🚀 Quick Setup Checklist

- [ ] Buy a short domain (or use free option)
- [ ] Point DNS to Railway
- [ ] Add custom domain in Railway dashboard
- [ ] Add `NEXT_PUBLIC_SHORT_DOMAIN` environment variable
- [ ] Wait for DNS propagation (5-60 minutes)
- [ ] Test creating a new short link
- [ ] Enjoy actually short URLs! 🎉

---

## 💡 Pro Tips

1. **Choose wisely**: Pick a domain that's:
   - Short (obviously!)
   - Easy to spell
   - Easy to say out loud
   - Memorable

2. **Security**: Always use HTTPS for your custom domain

3. **Testing**: Test your short links thoroughly after setup

4. **Analytics**: Consider using Cloudflare for additional analytics

---

## 🆘 Troubleshooting

### Links still show old domain
- Clear your browser cache
- Redeploy on Railway
- Check environment variable is set correctly

### Custom domain not working
- Wait 24-48 hours for DNS propagation
- Check DNS records are correct
- Verify domain is active in Railway

### SSL certificate issues
- Railway automatically provisions SSL
- May take a few minutes after adding domain
- Check Railway domain settings

---

## 📚 Resources

- [Porkbun Domain Search](https://porkbun.com)
- [Railway Custom Domains Guide](https://docs.railway.app/guides/public-networking#custom-domains)
- [Cloudflare Setup Guide](https://developers.cloudflare.com/fundamentals/get-started/)

---

**Ready to get a short domain?** Start here: [https://porkbun.com](https://porkbun.com)

Then come back and add it to Railway! 🚀
