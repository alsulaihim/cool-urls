# Social Preview Setup Guide

Your Cool URLs app is now configured to display beautiful preview images when shared on WhatsApp, Twitter, Facebook, LinkedIn, and other social platforms!

## How to Add Your Preview Image

1. **Save your image** to the `public` directory with the name `og-image.jpg`
   ```bash
   # The image should be at:
   public/og-image.jpg
   ```

2. **Recommended image specifications:**
   - **Size**: 1200 x 630 pixels (optimal for all platforms)
   - **Format**: JPG or PNG (JPG is smaller file size)
   - **Max file size**: Under 8MB (WhatsApp limit)
   - **Aspect ratio**: 1.91:1

3. **Your image** (the Japanese-style artwork with the person and laptop) should be resized to 1200x630px before saving.

## What's Been Configured

### ✅ Open Graph Tags (Facebook, WhatsApp, LinkedIn)
- Title: "Cool URLs - URL Shortener"
- Description: "Create beautiful short links with custom prefixes"
- Image: `/og-image.jpg`
- Site name: "Cool URLs"

### ✅ Twitter Card Tags
- Card type: `summary_large_image`
- Uses the same image and metadata

### ✅ Dynamic Meta Tags for Short URLs
- Each short URL (e.g., `/abc123`) will show:
  - Title: "abc123 - Cool URLs"
  - Description: The destination URL
  - Same preview image

## Environment Variable

Make sure to set your production URL in `.env.local`:

```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

This ensures the correct base URL is used for meta tags.

## Testing Your Preview

### Option 1: Online Tools
- **Facebook**: https://developers.facebook.com/tools/debug/
- **Twitter**: https://cards-dev.twitter.com/validator
- **LinkedIn**: https://www.linkedin.com/post-inspector/

### Option 2: WhatsApp
1. Deploy your app or use a tunnel like ngrok
2. Share a link in WhatsApp
3. Wait a few seconds for the preview to load

### Option 3: Local Testing
Use the [Metatags.io](https://metatags.io/) preview generator to test locally.

## Image Processing with ImageMagick

If you need to resize your image to 1200x630:

```bash
# Install ImageMagick (if not already installed)
brew install imagemagick

# Resize and crop to exact dimensions
convert your-image.jpg -resize 1200x630^ -gravity center -extent 1200x630 public/og-image.jpg
```

## Cache Busting

Social platforms cache preview images aggressively. If you update your image:

1. Clear the cache using the platform's debug tools
2. Or rename the file and update the code (e.g., `og-image-v2.jpg`)

## Next Steps

1. Save your Japanese-style artwork as `public/og-image.jpg`
2. Rebuild your app: `npm run build`
3. Deploy and test with the validators above
4. Share your short URLs and enjoy the beautiful previews!
