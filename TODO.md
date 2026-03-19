# FireCow Bookings — TODO & Setup Guide

## Key Technical Details
- **Cloudflare account:** `firecowbooking@gmail.com` (Account ID: `de37049df0384c9ae759a247ab16f81f`)
- **D1 database:** `firecow-db` (ID: `161ece68-0170-4deb-b72d-f55be878670f`)
- **Worker:** `workers/firecow-api/` → `https://firecow-api.firecowbooking.workers.dev`
- **R2 bucket:** `firecow-media` — bound as `BUCKET`, served via `GET /api/files/:key`
- **Repo:** `https://github.com/carronch/firecow` — root is `firecow-bookings/`
- **Stack:** Cloudflare D1 + R2 + Workers + Pages + Stripe + Resend + Crisp

---

## Step-by-Step Setup Guide

Follow this guide in order when setting up a new dev environment or deploying from scratch.

### Step 1 — Prerequisites

Install the following tools:
```bash
node --version        # Need 18+
npm install -g pnpm   # Package manager
npm install -g wrangler  # Cloudflare CLI
```
You also need accounts on:
- **Cloudflare** (`firecowbooking@gmail.com`)
- **Stripe** (for payment keys + webhook secret)
- **Resend** (for transactional email)
- **Crisp** (for live chat widget — free tier)

---

### Step 2 — Clone and Install

```bash
git clone https://github.com/carronch/firecow firecow-bookings
cd firecow-bookings
pnpm install
```

---

### Step 3 — Authenticate Cloudflare

```bash
wrangler login
# Opens browser — log in as firecowbooking@gmail.com
wrangler whoami   # Verify you're logged in
```

---

### Step 4 — Set Up D1 Database

The D1 database already exists in production. For a fresh setup:

```bash
# (Skip if database already exists — check with:)
wrangler d1 list

# If starting fresh, create it:
wrangler d1 create firecow-db

# Apply the schema migration:
cd workers/firecow-api
wrangler d1 execute firecow-db --remote --file=migrations/0001_schema.sql

# Seed with initial data (if needed):
wrangler d1 execute firecow-db --remote --file=migrations/seed.sql
```

---

### Step 5 — Set Up R2 Bucket ⚠️ MANUAL STEP REQUIRED

R2 object storage is used for tour hero images and gallery uploads.

**This must be done in the Cloudflare dashboard — it cannot be done via Wrangler alone:**

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **R2 Object Storage**
2. Click **Create bucket**
3. Name it exactly: `firecow-media`
4. Leave region as default (automatic)
5. Click **Create bucket**

After creating the bucket, redeploy the Worker so the R2 binding activates:
```bash
cd workers/firecow-api
npx wrangler deploy
```

> **Note:** The Worker was deployed without R2 temporarily (the binding was removed to work around a CF error). File upload/serve will return 503 until the bucket is created and Worker is redeployed with the R2 binding restored in `wrangler.toml`.

---

### Step 6 — Configure Stripe

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) → **Developers → API keys**
2. Copy your **Publishable key** (`pk_test_...`) and **Secret key** (`sk_test_...`)
3. Go to **Developers → Webhooks → Add endpoint**
4. Endpoint URL: `https://isla-tortuga-costa-rica.pages.dev/api/webhooks/stripe`
5. Events to listen for:
   - `checkout.session.completed`
   - `charge.refunded`
   - `payment_intent.payment_failed`
6. Copy the **Signing secret** (`whsec_...`)

> For local testing: `stripe listen --forward-to localhost:4321/api/webhooks/stripe`

---

### Step 7 — Configure Resend (Email Confirmations)

1. Go to [resend.com](https://resend.com) → **API Keys → Create API Key**
2. Copy the key (`re_...`)
3. Add your sending domain (or use the Resend test domain for testing)
4. The `from` address in `success.astro` is `bookings@firecowbooking.com` — verify this domain in Resend

---

### Step 8 — Configure Crisp (Live Chat)

1. Go to [app.crisp.chat](https://app.crisp.chat) → Create account / log in
2. Create a new website in Crisp
3. Copy the **Website ID** (UUID format)
4. This becomes `PUBLIC_CRISP_WEBSITE_ID` in the tour site env vars
5. The widget only loads in production (`import.meta.env.PROD = true`)

> Crisp free tier supports 2 agents. Upgrade to $25/mo for WhatsApp + Telegram channel integration from the Crisp dashboard.

---

### Step 9 — Set Environment Variables

#### Tour Site (`apps/isla-tortuga-costa-rica/.env`)

```env
PUBLIC_STRIPE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FIRECOW_API_URL=https://firecow-api.firecowbooking.workers.dev
RESEND_API_KEY=re_...
PUBLIC_CRISP_WEBSITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Set the same vars in **CF Pages dashboard → isla-tortuga-costa-rica → Settings → Environment variables** (for production).

#### Admin (`apps/admin/.env`)

```env
FIRECOW_API_URL=https://firecow-api.firecowbooking.workers.dev
STRIPE_SECRET_KEY=sk_test_...
```

Set the same vars in **CF Pages dashboard → firecow-admin → Settings → Environment variables**.

---

### Step 10 — Deploy the Worker

```bash
cd workers/firecow-api
npx wrangler deploy
```

Verify it's live: `curl https://firecow-api.firecowbooking.workers.dev/api/tours`

---

### Step 11 — Deploy the Tour Site

The tour site deploys automatically via GitHub Actions when you push to `main`.

Manual deploy:
```bash
cd apps/isla-tortuga-costa-rica
pnpm build
# Then push to GitHub — CF Pages picks it up automatically
```

Or trigger a deploy via the Admin dashboard → Sites → Deploy button (uses `cf_deploy_hook` stored per site).

---

### Step 12 — Deploy the Admin Dashboard

```bash
cd apps/admin
pnpm build
# Push to GitHub — CF Pages (firecow-admin) deploys automatically
```

---

### Step 13 — Protect the Admin with Cloudflare Access

The admin dashboard must be protected so only authorized users can access it:

1. CF Dashboard → **Zero Trust → Access → Applications**
2. Click **Add an application** → **Self-hosted**
3. Application name: `FireCow Admin`
4. Session duration: `24 hours`
5. Application domain: `firecow-admin.pages.dev`
6. Create a policy: **Email → is** → add authorized email addresses
7. Save

> In local dev, `middleware.ts` falls back to `dev@local` — no CF Access required.

---

### Step 14 — Verify Everything

Run these checks after setup:

- [ ] `curl https://firecow-api.firecowbooking.workers.dev/api/tours` returns tour list
- [ ] Tour site homepage loads tour data
- [ ] Booking widget opens Stripe Embedded Checkout
- [ ] After test payment, success page shows confirmation + upsell tours
- [ ] Confirmation email arrives in inbox (check Resend dashboard)
- [ ] Admin `/bookings` shows new booking
- [ ] Admin `/analytics` shows revenue totals
- [ ] Admin `/calendar` shows booking on correct date
- [ ] Availability calendar in widget shows correct open/full dates
- [ ] Crisp chat widget appears on live site (not localhost)

---

## Phase Status

### Phase 1 — D1 Setup & Data Migration ✅ COMPLETE
- [x] Create D1 database via Wrangler CLI
- [x] Write SQL schema (suppliers, tours, sites, bookings tables)
- [x] Apply schema migration to D1 (remote)
- [x] Seed D1 with all 8 sites + tours from sites-content.csv
- [x] Write Cloudflare Worker API (full CRUD REST: suppliers, tours, sites, bookings)
- [x] Write wrangler.toml with D1 binding
- [x] Deploy Worker
- [x] Add `packages/api-client` shared TS client
- [x] Update `isla-tortuga-costa-rica` to fetch from D1 at request time
- [x] Push Phase 1 to GitHub (commit dbbe802)

### Phase 2 — Stripe Checkout ✅ COMPLETE
- [x] Create `api/create-checkout-session.ts` — Stripe Checkout Session (embedded), returns `clientSecret`
- [x] Wire BookingWidget → CheckoutForm via `clientSecret`; key from `PUBLIC_STRIPE_KEY` env var
- [x] `success.astro` — verify session server-side, idempotent POST to Worker `/api/bookings`, confirmation card
- [x] Stripe webhook — `checkout.session.completed`, `charge.refunded`, `payment_intent.canceled` sync to D1
- [x] Remove all Zoho references (deleted `zoho-crm.ts`, replaced iframe with `<BookingWidget />`)
- [x] Worker: `GET /api/bookings?payment_intent_id=` (idempotency lookup)
- [x] Worker: `DELETE /api/suppliers/:id`, `DELETE /api/tours/:id`
- [x] Worker: `POST /api/upload?key=` + `GET /api/files/:key` (R2)
- [x] Worker `wrangler.toml`: R2 bucket binding

### Phase 3 — Admin Dashboard ✅ COMPLETE
- [x] Scaffold `apps/admin` — Astro SSR, Cloudflare adapter, React, Tailwind, Stripe
- [x] Middleware extracts CF Access email → `locals.userEmail`
- [x] Dark sidebar layout, nav (Bookings / Calendar / Analytics / Suppliers / Tours / Sites)
- [x] `/bookings` — view all bookings, status badges, Stripe refund button, inline edit mode
- [x] `/suppliers` — inline add / edit / delete rows
- [x] `/tours` — full CRUD, R2 image upload, supplier dropdown, toggle active
- [x] `/sites` — card layout, create/edit, CF Pages deploy button, toggle live, duplicate button, pending-deploy badge
- [x] `api/refund.ts` — Stripe refund via PI charge, PUTs booking status to `refunded`
- [x] Cloudflare Access protection (configure in CF dashboard — email allowlist)

### Phase 4 — Features ✅ COMPLETE
- [x] Semi-auto deploy badge — amber pulse after save, clears on deploy
- [x] Duplicate site button — copies site with `-copy` slug, opens edit immediately
- [x] Booking inline edit — date, party size, status, notes editable in admin
- [x] Admin Calendar View (`/calendar`) — monthly grid, colored booking pills, click to view/edit
- [x] Analytics Dashboard (`/analytics`) — revenue, bookings, trend chart, by-site, UTM sources
- [x] Availability calendar in BookingWidget — color-coded (green/amber/red), fetches live from Worker
- [x] UTM param capture — read from URL, passed to Stripe metadata, stored in booking notes
- [x] Upsell tours on success page — shows sibling tours after booking confirmed
- [x] Resend email confirmation — booking details + upsell tours, sent server-side on success
- [x] Crisp live chat embed — loads in production only via `PUBLIC_CRISP_WEBSITE_ID`

---

## Backlog / Future Phases

### Phase 5 — Multi-language (ES/EN)
- [ ] `src/i18n/en.ts` and `src/i18n/es.ts` translation objects
- [ ] URL-prefix routing (`/es/*` vs `/en/*`) or toggle approach
- [ ] `Header.astro` language toggle → preference in `localStorage`
- [ ] All page text refactored to use `t('key')` helper
- [ ] SEO `<link rel="alternate" hreflang>` tags

### Phase 6 — Google Ads API / ROAS Dashboard
- [ ] OAuth2 flow for Google Ads API access (developer token, MCC setup)
- [ ] Fetch campaign spend by UTM source/campaign
- [ ] Populate Ad Spend column in Analytics → UTM sources table (column is pre-built, shows `—` until connected)
- [ ] ROAS calculation: revenue attributed / ad spend

### Other Backlog
- [ ] Enable R2 in CF dashboard, create `firecow-media` bucket, redeploy Worker (⚠️ MANUAL STEP)
- [ ] Bulk tour assignment to multiple sites
- [ ] SMS confirmation via Twilio
- [ ] Admin notification email on new booking

---

## Guide: How to Provision a 100% Ready Client

To take a new client from zero to fully operational online without triggering algorithmic bans, follow this exact sequence:

### 1. Human Input via Admin Dashboard (`firecow-admin`)
- **Add Supplier:** Go to the Suppliers tab and create their profile. You must input their precise FareHarbor/Checkfront Calendar URL so the background Cron system can begin syncing availability instantly.
- **Add Tours:** Attach the required tours to the supplier. Set pricing and securely upload optimized Hero Images to Cloudflare R2 via the dashboard.
- **Create the Site Database Entry:** Finally, create the Site. Link the tours, give it an exact `slug` (e.g. `papagayo-charters`), and define the `cf_deploy_hook` from Cloudflare Pages.

### 2. Compile the Astro SSR Template
- Click the **Deploy** button on the specific Site card within the dashboard.
- This triggers the Cloudflare Pages deploy hook, which immediately clones our Astro Monorepo and dynamically queries the D1 Edge SQL database for exactly that site's parameters.
- *Cloudflare automatically generates the JSON-LD SEO Schema strictly for Google during this build.*

### 3. Domain Handling (Spaceship.com)
- Manually purchase the target Domain on **Spaceship.com**.
- Strip Spaceship's default DNS settings and point the **Nameservers** to Cloudflare.
- Inside Cloudflare Pages, go to the deployed project > "Custom Domains", and enter the URL.
- *Cloudflare absorbs the DNS resolution globally and instantly provisions Full Strict HTTPS SSL certificates.*

### 4. Email Provisioning (Resend)
- In the **Resend Dashboard**, click "Add Domain" and input the client's new Spaceship URL (e.g., `papagayo-charters.com`).
- Copy the DKIM/SPF DNS records provided by Resend and paste them into your **Cloudflare DNS dashboard** for that URL.
- This creates an official `info@papagayo-charters.com` inbox. This email *must* be used to register the Google Business Profile, proving to Google that you own the authorized domain infrastructure.

### 5. Phone & Unified Inbox Setup (Twilio + Crisp)
- In **Twilio**, purchase a local virtual phone number for the client's specific geographic region.
- Go to the **Crisp Dashboard** > Plugins > Twilio SMS/WhatsApp, and bind the newly purchased phone number to the client's unified inbox routing rules.
- You now have a verifiable local phone number ready for the GBP application, and all incoming customer texts/WhatsApp messages instantly route to your human agents in Crisp.

### 6. Google Business Profile (GBP) - The 2025 Verification Protocol
Google's 2025 algorithm relies almost entirely on **Live Video Verification** for Service Area Businesses (tours/charters) to prevent spam. NEVER use APIs to auto-create profiles. Follow this exact manual execution playbook:

**A. Preparation (The Human Launch Kit):**
- System generates the exact NAP schema, the newly provisioned Twilio Phone Number, and the official Resend email (`info@client.com`).
- *Warning:* Ensure the client has their Business Registration, Utility Bills, and Licenses ready.

**B. Profile Creation:**
- A team member manually creates the profile using the exact data.
- **Set as Service Area Business (SAB):** You MUST clear/hide the physical street address and only define service areas (up to 20 zip codes/cities). Listing a home address publicly for a tour op guarantees an algorithmic suspension.

**C. The Video Verification Execution:**
- The client must use a mobile phone to record a **continuous, unedited video (30s - 5m)**.
- **What to film:** They must show street signs/landmarks of their operational base (even if a home driveway), physically unlock a branded company vehicle or show branded equipment (boats/ATVs), and show marketing materials or business licenses on hand.
- Do not edit the video or show faces excessively.

**D. The 14-Day Freeze Rule:**
- Once approved, **DO NOT MAKE ANY EDITS FOR 14 DAYS.** Changing the business name, categories, or address immediately after verification will trigger an instant "Suspicious Activity" suspension lock-out. Let the data burn into Google's local graph first.
