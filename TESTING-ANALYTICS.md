# Testing Analytics - Step by Step

Follow these steps to test the analytics feature:

## 1. Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## 2. Create a New Short Link

1. Go to http://localhost:3000
2. Sign in if not already signed in
3. Enter a URL (e.g., https://google.com)
4. Add a custom prefix if you want
5. Click "Shorten URL"
6. Copy the generated short link

## 3. Click the Short Link

**IMPORTANT:** Open the short link in a NEW BROWSER TAB or window

- Example: http://localhost:3000/your-code-here
- This will trigger the redirect AND save analytics

## 4. Check Server Console Logs

You should see logs like:
```
[Geolocation] Using mock data for local IP: 127.0.0.1
[Analytics] Geolocation data: { country: 'United States', city: 'San Francisco', ... }
[Analytics] Saving analytics: { urlId: '...', latitude: 37.7749, longitude: -122.4194, ... }
[Analytics] Click analytics saved successfully for: your-code
```

## 5. View Analytics in Dashboard

1. Go to http://localhost:3000/dashboard
2. Find your link in the table
3. Click the chart icon (📊) or chevron button next to the link
4. The analytics panel should expand below

## 6. Check Browser Console

Open DevTools (F12) and look at the Console tab. You should see:
```
[Dashboard] Query data: { urls: [...], clickAnalytics: [...] }
[Dashboard] ClickAnalytics: [{ urlId: '...', latitude: 37.7749, ... }]
[Dashboard] All analytics: [...]
[Dashboard] Filtered analytics: [...]
[ClickMap] Total clicks received: 1
[ClickMap] Clicks data: [{ latitude: 37.7749, longitude: -122.4194, ... }]
[ClickMap] Processing click: { latitude: 37.7749, ... }
[ClickMap] Click has location: 37.7749 -122.4194
```

## Troubleshooting

### If you see "No location data available":

1. **Check if clickAnalytics is empty:**
   - Look for `[Dashboard] ClickAnalytics: []` in console
   - If empty, the analytics aren't being saved

2. **Check InstantDB schema:**
   - Make sure the `clickAnalytics` entity exists in your InstantDB dashboard
   - Go to https://instantdb.com and check your app's schema

3. **Verify the redirect worked:**
   - Make sure you were redirected to the original URL
   - Check server logs for analytics save confirmation

4. **Clear browser cache and try again:**
   - Sometimes cached redirects don't trigger the API

### If clickAnalytics has data but map shows nothing:

1. **Check if latitude/longitude exist:**
   - Look at the analytics object in console
   - Make sure `latitude` and `longitude` fields have values

2. **Check data types:**
   - Latitude and longitude should be numbers, not strings

## Expected Result

When working correctly, you should see:

- ✅ A map with a marker in San Francisco
- ✅ Device stats showing your OS and browser
- ✅ A sparkline graph showing click trends
- ✅ Pie chart with device distribution
