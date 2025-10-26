# Local Testing Guide for Social Previews

## Quick Answer
- **Preview tools**: ✅ Work with localhost immediately
- **WhatsApp/Social media**: ❌ Need public URL (use tunnel)

## Method 1: Preview Tools (Easiest)

### 1. Start your dev server
```bash
npm run dev
```

### 2. Test with online tools
Visit these sites and paste `http://localhost:3000`:

- **Metatags.io**: https://metatags.io/
- **OpenGraph.xyz**: https://www.opengraph.xyz/
- **Social Share Preview**: https://socialsharepreview.com/

These tools will show you exactly how your link will look on:
- Facebook
- Twitter
- LinkedIn
- WhatsApp
- iMessage

## Method 2: Tunnel for Real Testing (Recommended)

Use **ngrok** or **localtunnel** to make localhost accessible to WhatsApp:

### Using ngrok (Most reliable)

1. **Install ngrok**
   ```bash
   brew install ngrok
   # or download from https://ngrok.com/
   ```

2. **Start your app**
   ```bash
   npm run dev
   ```

3. **Create tunnel** (in another terminal)
   ```bash
   ngrok http 3000
   ```

4. **Copy the https URL** (looks like: `https://abc123.ngrok.io`)

5. **Test on WhatsApp**
   - Share the ngrok URL in WhatsApp
   - Wait 2-3 seconds
   - See your preview appear!

### Using localtunnel (Free, no signup)

1. **Install**
   ```bash
   npm install -g localtunnel
   ```

2. **Start your app**
   ```bash
   npm run dev
   ```

3. **Create tunnel**
   ```bash
   lt --port 3000
   ```

4. **Use the provided URL** to test on WhatsApp

## Method 3: View Page Source (Debug)

1. Open `http://localhost:3000` in your browser
2. Right-click → View Page Source
3. Search for `og:image` in the source
4. You should see:
   ```html
   <meta property="og:image" content="http://localhost:3000/og-image.jpg">
   <meta property="og:title" content="Cool URLs - URL Shortener">
   <meta property="og:description" content="Create beautiful short links...">
   ```

This confirms your meta tags are working!

## Method 4: Browser DevTools

1. Open `http://localhost:3000`
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to **Elements** tab
4. Look in `<head>` for meta tags
5. Verify all `og:` and `twitter:` tags are present

## Quick Test Script

Here's a quick way to verify your meta tags are working:

```bash
# Start your dev server
npm run dev

# In another terminal, check the HTML head
curl -s http://localhost:3000 | grep -i "og:" | head -10
```

You should see output like:
```html
<meta property="og:title" content="Cool URLs - URL Shortener">
<meta property="og:description" content="Create beautiful short links with custom prefixes">
<meta property="og:image" content="http://localhost:3000/og-image.jpg">
```

## Recommended Testing Workflow

### Before pushing to production:

1. ✅ Add your image as `public/og-image.jpg`
2. ✅ Start dev server: `npm run dev`
3. ✅ Test with metatags.io
4. ✅ Use ngrok for WhatsApp test (optional)
5. ✅ Verify image loads: `http://localhost:3000/og-image.jpg`
6. ✅ Check meta tags in browser DevTools
7. 🚀 Push to production
8. ✅ Test with real WhatsApp/social media

## Common Issues

### Image not showing in preview tools?
- Make sure `public/og-image.jpg` exists
- Check the file is exactly 1200x630 pixels
- Verify it's not too large (under 8MB)
- Clear browser cache and retry

### Meta tags not appearing?
- Restart your dev server
- Check for build errors: `npm run build`
- Verify `.env.local` has `NEXT_PUBLIC_APP_URL`

### ngrok URL not working?
- Make sure both dev server AND ngrok are running
- Use the `https://` URL (not http)
- Try clearing WhatsApp cache or use a different chat

## Pro Tip: Test Without Tunnel

If you just want to see the preview **appearance** without actually sharing:

1. Go to https://metatags.io/
2. Paste any URL (even a fake one)
3. Manually fill in the fields with your values
4. See exactly how it will look

This lets you experiment with different titles/descriptions before coding!
