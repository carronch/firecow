# 🚀 FireCow Bookings — Go-Live Checklist

This document details the exact steps required to transition the FireCow Bookings platform from a development state to a fully production-ready live environment.

---

## 1. Cloudflare Domain & Pages Routing
- [ ] **Buy/Connect Domain:** Purchase the official `.com` through Cloudflare Registrar or connect an external domain to your Cloudflare zone.
- [ ] **Pages Custom Domain:** In the Cloudflare UI, navigate to `Workers & Pages` > `isla-tortuga-costa-rica` > `Custom Domains` and add your newly acquired domain.
- [ ] **Admin Domain:** Connect a secure subdomain (e.g., `admin.firecowbooking.com`) to the `firecow-admin` Pages project.
- [ ] **Zero Trust Authorization:** In Cloudflare Zero Trust, secure the Admin subdomain so only `firecowbooking@gmail.com` can pass the HTTP perimeter.

## 2. Twilio (WhatsApp & Local Numbers)
- [ ] **Upgrade Account:** Ensure the Twilio account is upgraded from a Trial account to a funded production account.
- [ ] **A2P 10DLC Registration (If US/Canada):** If sending SMS/WhatsApp to North American customers, register a Brand and Campaign registry to prevent carrier filtering.
- [ ] **WhatsApp Business Profile:** Submit your Twilio number for WhatsApp Business API approval.
- [ ] **Meta Business Verification:** Complete the Meta Business Manager verification process requiring a tax document or utility bill.

## 3. Resend (Transactional Email)
- [ ] **Verify Domain:** In the Resend dashboard, add your official domain and configure the provided DNS `TXT`/`MX` records in Cloudflare to verify ownership.
- [ ] **Sender Identity:** Once verified, update the Cloudflare Worker environment variable `RESEND_FROM_EMAIL` (or hardcoded string) to send from `bookings@yourdomain.com` instead of a testing address.

## 4. Google services (Ads, Analytics, GBP)
- [ ] **Google Workspace (Optional):** Setup your professional email inbox via Google Workspace.
- [ ] **Google Ads Account:** Create a production MCC/Ads account and generate the `Developer Token`, `Client ID`, `Client Secret`, and `Refresh Token` for Phase 6.
- [ ] **Google Business Profiles:** For every new client site launched, use the Admin GBP Launch kit UI to generate the required localized content and physically mail the verification postcard if required by Google.

## 5. Stripe (Payments)
- [ ] **Activate Live Mode:** In the Stripe Dashboard, complete your business identity verification to disable Test Mode.
- [ ] **Swap API Keys:** 
  - Update `apps/isla-tortuga-costa-rica/.env.production` with your **Live Publishable Key** (`pk_live_...`).
  - Update Cloudflare Worker secrets with the **Live Secret Key** (`sk_live_...`).
- [ ] **Live Webhooks:** Re-create the Stripe Webhook pointing to `https://isla-tortuga-costa-rica.yourdomain.com/api/webhooks/stripe` and store the new live secret (`whsec_...`) in the Worker environment variables.

## 6. Worker Secrets & Production Deployment
Run the following commands locally to push Live credentials securely to Cloudflare:
```bash
# Push production keys via Wrangler
npx wrangler secret put STRIPE_SECRET_KEY --env production
npx wrangler secret put STRIPE_WEBHOOK_SECRET --env production
npx wrangler secret put RESEND_API_KEY --env production
```
