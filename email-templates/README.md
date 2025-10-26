# Email Templates for Cool URLs

Enhanced email templates for magic link authentication with InstantDB.

## Files

- **magic-code.html** - HTML email template (modern, responsive design)
- **magic-code.txt** - Plain text fallback template

## Features

✅ Modern, clean design matching Cool URLs branding
✅ Black gradient header with Cool URLs logo
✅ Large, easy-to-read verification code
✅ Clear instructions and security notices
✅ Responsive design for all email clients
✅ Professional footer with copyright
✅ Plain text fallback for accessibility

## How to Use with InstantDB

InstantDB uses custom email templates for magic link authentication. Here's how to set them up:

### Option 1: Via InstantDB Dashboard (Recommended)

1. **Go to InstantDB Dashboard**
   - Visit: https://instantdb.com/dash
   - Select your Cool URLs app

2. **Navigate to Email Settings**
   - Click on "Settings" or "Email" tab
   - Look for "Email Templates" or "Magic Link Templates"

3. **Upload/Paste the Template**
   - Copy the content from `magic-code.html`
   - Paste it into the HTML template field
   - Make sure to keep the `{code}` and `{app_title}` placeholders

4. **Save Changes**

### Option 2: Via InstantDB Config (If Supported)

If InstantDB supports config files:

```javascript
// In your instant config
{
  email: {
    templates: {
      magicCode: {
        html: './email-templates/magic-code.html',
        text: './email-templates/magic-code.txt'
      }
    }
  }
}
```

## Template Variables

The templates use these variables that InstantDB will replace:

- `{code}` - The 6-digit verification code
- `{app_title}` - Your app name (Cool URLs)

## Customization

You can customize these templates:

### Change Colors

```html
<!-- Black header gradient -->
<div style="background: linear-gradient(135deg, #000000 0%, #1f1f1f 100%);">

<!-- Change to your brand color -->
<div style="background: linear-gradient(135deg, #YOUR_COLOR 0%, #YOUR_COLOR_DARK 100%);">
```

### Update Domain

Replace `https://your-domain.com` with your actual domain:

```html
<a href="https://your-domain.com/help">Help Center</a>
```

### Modify Footer

```html
<p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">
  © 2024 Cool URLs. All rights reserved.
</p>
```

## Preview

### Desktop View
- Clean, modern design with gradient header
- Large verification code in monospace font
- Clear instructions and security warnings
- Professional footer

### Mobile View
- Fully responsive (max-width: 600px)
- Touch-friendly code display
- Readable on all screen sizes

## Testing

Before deploying, test your email template:

1. **Email Testing Tools:**
   - [Litmus](https://www.litmus.com/) - Test across email clients
   - [Email on Acid](https://www.emailonacid.com/) - Comprehensive testing
   - [Mailtrap](https://mailtrap.io/) - Safe email testing

2. **Manual Testing:**
   - Send test emails to yourself
   - Check on different email clients (Gmail, Outlook, Apple Mail)
   - Test on mobile devices

## Best Practices

✅ **Keep it simple** - Email clients have limited CSS support
✅ **Use inline styles** - External CSS won't work in most email clients
✅ **Test thoroughly** - Different clients render emails differently
✅ **Include plain text** - Some users prefer or require plain text emails
✅ **Accessible design** - Good color contrast, readable fonts
✅ **Security info** - Always include expiration and security notices

## Troubleshooting

### Code not showing?
- Make sure the `{code}` placeholder is present
- Check that InstantDB is configured correctly

### Styling not working?
- All styles must be inline
- Avoid modern CSS features
- Test in multiple email clients

### Links not working?
- Use absolute URLs (https://your-domain.com)
- Make sure href attributes are properly formatted

## Support

For InstantDB-specific email configuration:
- Docs: https://www.instantdb.com/docs
- Discord: https://discord.gg/instantdb

For Cool URLs support:
- Create an issue in this repo
- Contact via email

---

**Note:** Remember to update the domain URL and copyright year before deploying to production!
