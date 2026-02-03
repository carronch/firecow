# ✅ Zoho Tours API Integration Setup

The code integration is complete! Your sites are now capable of fetching tours dynamically from Zoho Bookings.

## 🚀 How it works
1. **Frontend:** The "Experiences" section attempts to fetch real-time tour data from `/api/tours`.
2. **Backend:** The `/api/tours` endpoint connects to Zoho API using OAuth logic.
3. **Fallback:** If credentials are missing or the API fails, the site automatically displays the original static tour content.

## 🔑 Required Credentials
To enable the dynamic data, you must add the following **Environment Variables** to your Cloudflare Pages projects:

| Variable Name | Value Description |
|---------------|-------------------|
| `ZOHO_CLIENT_ID` | Your Zoho Client ID |
| `ZOHO_CLIENT_SECRET` | Your Zoho Client Secret |
| `ZOHO_REFRESH_TOKEN` | Your Zoho Refresh Token |
| `ZOHO_PORTAL_NAME` | (Optional) Helper name, e.g. `firecowbookings` |

### How to add them in Cloudflare:
1. Go to **Cloudflare Dashboard** > **Workers & Pages**.
2. Select your project (e.g., `isla-tortuga-costa-rica`).
3. Go to **Settings** > **Environment Variables**.
4. Click **Add variable** and enter the keys above.
5. **Redeploy** the site (or create a new deployment) for changes to take effect.

## 🧪 Testing Locally
To test locally, create a file named `.dev.vars` in the app directory (e.g., `apps/isla-tortuga-costa-rica/.dev.vars`) with the content:
```
ZOHO_CLIENT_ID=your_id
ZOHO_CLIENT_SECRET=your_secret
ZOHO_REFRESH_TOKEN=your_token
```
Then run `pnpm dev`.

---
**Current Status:** The code handles the "Missing Configuration" gracefully by showing static content. You can deploy safely now.
