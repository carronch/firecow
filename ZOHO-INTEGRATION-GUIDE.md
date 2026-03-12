# Zoho Bookings API Integration Guide

This guide explains how to integrate your landing page with Zoho Bookings to dynamically fetch tour information.

## Overview

The tours section now fetches data dynamically from Zoho Bookings API, including:
- Tour name
- Description
- Price
- Duration
- Images

If the API is unavailable, it falls back to static tours.

## Setup Instructions

### 1. Get Zoho API Credentials

1. Go to [Zoho API Console](https://api-console.zoho.com/)
2. Click "Add Client"
3. Choose "Self Client"
4. Note down your **Client ID** and **Client Secret**

### 2. Generate Refresh Token

Run this command to generate a refresh token (you'll need to do this once):

```bash
# Step 1: Get authorization code
# Visit this URL in your browser (replace CLIENT_ID):
https://accounts.zoho.com/oauth/v2/auth?scope=ZohoBookings.fullaccess.all&client_id=YOUR_CLIENT_ID&response_type=code&access_type=offline&redirect_uri=http://localhost

# Step 2: After authorization, you'll get a code in the URL
# Use that code to get refresh token:
curl -X POST https://accounts.zoho.com/oauth/v2/token \
  -d "code=YOUR_AUTH_CODE" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "grant_type=authorization_code" \
  -d "redirect_uri=http://localhost"
```

Save the `refresh_token` from the response.

### 3. Deploy the API Endpoint

You have several options:

#### Option A: Cloudflare Workers (Recommended)

1. Create a new Cloudflare Worker
2. Copy the contents of `api-tours.js`
3. Set environment variables:
   ```
   ZOHO_CLIENT_ID=your_client_id
   ZOHO_CLIENT_SECRET=your_client_secret
   ZOHO_REFRESH_TOKEN=your_refresh_token
   ZOHO_PORTAL_NAME=firecowbookings
   ```
4. Deploy the worker
5. Update the frontend to use your worker URL: `/api/tours`

#### Option B: Vercel Serverless Function

1. Create `api/tours.js` in your Vercel project
2. Copy the contents of `api-tours.js`
3. Add environment variables in Vercel dashboard
4. Deploy

#### Option C: Your Own Backend

1. Add the endpoint to your Express/Node backend
2. Set environment variables
3. Make sure CORS is enabled

### 4. Configure Environment Variables

Set these environment variables wherever you deploy:

```bash
ZOHO_CLIENT_ID=1000.xxxxxxxxxxxxx
ZOHO_CLIENT_SECRET=xxxxxxxxxxxxx
ZOHO_REFRESH_TOKEN=1000.xxxxxxxxxxxxx.xxxxxxxxxxxxx
ZOHO_PORTAL_NAME=firecowbookings
```

### 5. Update Frontend Configuration

In the HTML file, update the API endpoint:

```javascript
const response = await fetch('https://your-worker.workers.dev/api/tours', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    }
});
```

## Data Format

The API returns tours in this format:

```json
{
  "success": true,
  "tours": [
    {
      "serviceId": "123456789",
      "name": "Island Paradise Cruise",
      "description": "A luxury yacht...",
      "price": 3245,
      "duration": "5-9 days",
      "image": "https://example.com/image.jpg",
      "category": "Luxury Cruise",
      "availability": {}
    }
  ],
  "count": 3
}
```

## Customizing Tour Display

To customize how tours are displayed, edit the `createTourCard()` function in the HTML:

```javascript
function createTourCard(tour) {
    // Customize the HTML template here
    return `
        <div class="tour-card">
            <img src="${tour.image}" alt="${tour.name}">
            <h3>${tour.name}</h3>
            <p>${tour.description}</p>
            <span>$${tour.price}</span>
        </div>
    `;
}
```

## Adding Custom Fields

To add custom fields to Zoho Bookings services:

1. Go to Zoho Bookings > Settings > Services
2. Add custom fields (e.g., "Hero Image URL", "Featured", "Category")
3. Update the `transformService()` function in `api-tours.js`:

```javascript
function transformService(service) {
    return {
        serviceId: service.service_id,
        name: service.service_name,
        description: service.description,
        price: service.price,
        image: service.custom_fields?.hero_image || 'default.jpg',
        featured: service.custom_fields?.featured || false,
        // Add more custom fields here
    };
}
```

## Fallback Tours

If the API fails, the page displays fallback tours defined in the HTML. To update them:

```javascript
const FALLBACK_TOURS = [
    {
        name: "Your Tour Name",
        description: "Description here",
        price: 1000,
        image: "image-url.jpg",
        serviceId: "1"
    },
    // Add more fallback tours
];
```

## Caching

The API response is cached for 5 minutes to reduce API calls:

```javascript
'Cache-Control': 'public, max-age=300'
```

To adjust caching, change the `max-age` value (in seconds).

## Testing

### Test the API endpoint:

```bash
curl https://your-worker.workers.dev/api/tours
```

### Test fallback mode:

1. Temporarily break the API endpoint
2. Reload the page
3. You should see the fallback tours

## Troubleshooting

### Tours not loading?

1. Check browser console for errors
2. Verify API endpoint is accessible
3. Check that environment variables are set correctly
4. Verify refresh token hasn't expired

### Wrong data showing?

1. Check Zoho Bookings service data
2. Verify the `transformService()` function maps fields correctly
3. Clear browser cache

### API rate limits?

Zoho has API rate limits. Consider:
1. Increasing cache duration
2. Implementing server-side caching
3. Only fetching on-demand

## Security Notes

- Never expose API credentials in frontend code
- Always use environment variables for secrets
- Use HTTPS for all API calls
- Implement rate limiting on your API endpoint
- Validate and sanitize all data from Zoho API

## Support

For Zoho Bookings API documentation:
- [Zoho Bookings API Docs](https://www.zoho.com/bookings/api/)
- [OAuth 2.0 Guide](https://www.zoho.com/accounts/protocol/oauth.html)

## Next Steps

1. Set up Zoho API credentials
2. Deploy the API endpoint
3. Configure environment variables
4. Test the integration
5. Customize tour cards as needed
