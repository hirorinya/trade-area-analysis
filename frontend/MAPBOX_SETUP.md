# Mapbox Setup Guide

## Quick Start

The map is not displaying because you need to configure your Mapbox access token. Follow these steps:

### 1. Get a Free Mapbox Token

1. Go to [https://account.mapbox.com/auth/signup/](https://account.mapbox.com/auth/signup/)
2. Create a free account (no credit card required)
3. After signup, go to your [account tokens page](https://account.mapbox.com/access-tokens/)
4. Copy your default public token (starts with `pk.`)

### 2. Configure Your Environment

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and replace the placeholder token:
   ```
   VITE_MAPBOX_TOKEN=pk.your_actual_token_here
   ```

3. Restart your development server:
   ```bash
   npm run dev
   ```

### 3. Verify Setup

After restarting, the map should display properly. If you still see errors:

1. Check browser console for any token-related errors
2. Ensure your token starts with `pk.`
3. Make sure there are no extra spaces or quotes around the token

## Troubleshooting

### "setSprite" Error on Windows Chrome/Edge

If you see "Unable to perform style diff: Unimplemented: setSprite" in the console:
- This is a known issue with Mapbox GL JS on some Windows browsers
- The map should still work despite this warning
- The MapboxMap component already handles this error gracefully

### Map Not Loading

If the map still doesn't load after setting the token:

1. **Clear browser cache**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Check network tab**: Ensure Mapbox API calls are successful (200 status)
3. **Verify token**: Log into Mapbox and check if your token is active
4. **Browser compatibility**: Try Firefox or Safari as alternatives

### Token Security

- Never commit your actual token to version control
- Use `.env.local` (which is gitignored) for local development
- For production, set environment variables in your hosting platform

## Alternative: Use Leaflet

If you continue to have issues with Mapbox, you can use the Leaflet map option:
- Click "Switch to Leaflet" button in the UI
- Leaflet doesn't require an API token
- Works reliably across all browsers

## Need Help?

If you're still having issues:
1. Check the browser console for specific error messages
2. Verify your token at: https://account.mapbox.com/access-tokens/
3. Try the example token from Mapbox docs to test: `pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`