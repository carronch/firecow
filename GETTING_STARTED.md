# Getting Started — FireCow Bookings

## Prerequisites

- **Node.js** 18+
- **PNPM** (`npm install -g pnpm`)
- **Wrangler CLI** (`npm install -g wrangler`) — for Worker + D1 + R2
- **Git**
- Cloudflare account (`firecowbooking@gmail.com`)
- Stripe account (test keys available in dashboard)
- Resend account (for email confirmations)
- Crisp account (for live chat — free tier)

---

## 1. Clone and Install

```bash
git clone https://github.com/carronch/firecow firecow-bookings
cd firecow-bookings
pnpm install
```

---

## 2. Cloudflare Auth

```bash
wrangler login
# Authenticate as firecowbooking@gmail.com
wrangler whoami   # Verify authentication
```

---

## 3. Run the Tour Site Locally

```bash
cd apps/isla-tortuga-costa-rica
cp .env.example .env   # then fill in values below
pnpm dev
# → http://localhost:4321
```

**.env values needed:**

```env
PUBLIC_STRIPE_KEY=pk_test_...        # Stripe dashboard → Developers → API keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...      # From Stripe webhook settings (or Stripe CLI)
FIRECOW_API_URL=https://firecow-api.firecowbooking.workers.dev
RESEND_API_KEY=re_...                # Resend dashboard → API Keys
PUBLIC_CRISP_WEBSITE_ID=xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx   # Crisp dashboard → Website ID
```

> **Crisp note:** The chat widget only loads in production (`import.meta.env.PROD`). It won't appear on localhost — this is intentional.

> **Stripe webhook testing locally:**
> ```bash
> stripe listen --forward-to localhost:4321/api/webhooks/stripe
> ```
> The CLI will print a `whsec_...` secret to use as `STRIPE_WEBHOOK_SECRET`.

---

## 4. Run the Admin Dashboard Locally

```bash
cd apps/admin
# Create .env:
cat > .env << 'EOF'
FIRECOW_API_URL=https://firecow-api.firecowbooking.workers.dev
STRIPE_SECRET_KEY=sk_test_...
EOF
pnpm dev
# → http://localhost:4322
```

In local dev, `middleware.ts` falls back to `dev@local` for the user email (no CF Access required).

---

## 5. Run the Worker Locally

```bash
cd workers/firecow-api
npx wrangler dev
# → http://localhost:8787
```

When running the Worker locally, update `FIRECOW_API_URL=http://localhost:8787` in site/admin `.env` files to point at the local Worker.

---

## 6. Deploy

### Worker

```bash
cd workers/firecow-api
npx wrangler deploy
```

> **R2 Note:** The Worker's `wrangler.toml` includes an `[[r2_buckets]]` binding for `firecow-media`. If R2 is not yet enabled in your CF account, this deploy will fail. See the R2 Setup section below.

### Tour Site

```bash
cd apps/isla-tortuga-costa-rica
pnpm build
# The CF Pages project (isla-tortuga-costa-rica) auto-deploys on push to main
```

Set env vars in CF Pages dashboard → Settings → Environment variables.

### Admin Dashboard

```bash
cd apps/admin
pnpm build
# The CF Pages project (firecow-admin) auto-deploys on push to main
```

Set env vars in CF Pages dashboard. Then configure Cloudflare Access:
- CF Dashboard → Zero Trust → Access → Applications → Add application
- Set the admin Pages URL, create a policy with your email allowlist

---

## 7. R2 Bucket Setup (⚠️ Manual Step)

R2 is used to store tour hero images and gallery uploads. It must be created manually:

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **R2 Object Storage**
2. Click **Create bucket** → Name: `firecow-media`
3. After creating, redeploy the Worker: `cd workers/firecow-api && npx wrangler deploy`

Until R2 is set up, file uploads will return 503 but bookings, tours, and everything else works fine.

---

## 8. Stripe Webhook Setup

In [Stripe dashboard](https://dashboard.stripe.com) → Developers → Webhooks → Add endpoint:

- **URL:** `https://isla-tortuga-costa-rica.pages.dev/api/webhooks/stripe`
- **Events:**
  - `checkout.session.completed`
  - `charge.refunded`
  - `payment_intent.payment_failed`
- Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET` in CF Pages env vars

---

## Development Commands

| Command | Description |
|---|---|
| `pnpm --filter @firecow/isla-tortuga-costa-rica dev` | Start tour site dev server (port 4321) |
| `pnpm --filter @firecow/admin dev` | Start admin dev server (port 4322) |
| `npx wrangler dev` (in `workers/firecow-api/`) | Start Worker locally (port 8787) |
| `npx wrangler d1 execute firecow-db --remote --file=migrations/0001_schema.sql` | Apply DB migration |
| `npx wrangler deploy` (in `workers/firecow-api/`) | Deploy Worker to production |
| `pnpm build` (in any app) | Build for production |

---

## Project Structure

```
firecow-bookings/
├── apps/
│   ├── isla-tortuga-costa-rica/      # Tour site
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── index.astro             # Homepage (fetches from Worker)
│   │   │   │   ├── reservation.astro       # Booking widget page
│   │   │   │   ├── success.astro           # Payment confirmation + email + upsell
│   │   │   │   └── api/
│   │   │   │       ├── create-checkout-session.ts   # Stripe session creation
│   │   │   │       └── webhooks/stripe.ts           # Stripe webhook handler
│   │   │   ├── components/
│   │   │   │   ├── BookingWidget.jsx       # Booking form + AvailabilityCalendar
│   │   │   │   └── CheckoutForm.jsx        # Stripe EmbeddedCheckout wrapper
│   │   │   ├── layouts/
│   │   │   │   └── BaseLayout.astro        # Includes Crisp chat embed (production only)
│   │   │   └── utils/
│   │   │       └── stripe.ts               # Stripe client init
│   │   └── .env                            # Local env vars (not committed)
│   └── admin/
│       ├── src/
│       │   ├── pages/
│       │   │   ├── bookings.astro          # Bookings list page
│       │   │   ├── calendar.astro          # Calendar view page
│       │   │   ├── analytics.astro         # Analytics dashboard page
│       │   │   ├── suppliers.astro
│       │   │   ├── tours.astro
│       │   │   ├── sites.astro
│       │   │   └── api/refund.ts           # Stripe refund endpoint
│       │   ├── components/
│       │   │   ├── BookingsTable.tsx       # Bookings list + inline edit
│       │   │   ├── CalendarView.tsx        # Monthly booking calendar
│       │   │   ├── AnalyticsDashboard.tsx  # Analytics + UTM tracking
│       │   │   ├── SuppliersTable.tsx
│       │   │   ├── ToursTable.tsx
│       │   │   └── SitesTable.tsx          # Sites + pending-deploy badge + duplicate
│       │   ├── layouts/
│       │   │   └── AdminLayout.astro       # 6-item nav sidebar
│       │   ├── lib/
│       │   │   └── api.ts                  # Type definitions + fetch helpers
│       │   └── middleware.ts               # CF Access email extraction
│       └── .env                            # Local env vars (not committed)
├── workers/
│   └── firecow-api/
│       ├── src/index.js                    # All REST endpoints (single file)
│       ├── migrations/
│       │   ├── 0001_schema.sql             # DB schema
│       │   └── seed.sql                    # Initial data
│       └── wrangler.toml                   # D1 + R2 bindings
└── packages/
    └── api-client/                         # Shared TypeScript types + fetch helpers
```

---

## Common Issues

### `wrangler` command not found
Use `npx wrangler` instead of `wrangler` if not installed globally:
```bash
npx wrangler deploy
npx wrangler dev
```

### Wrangler not authenticated
```bash
npx wrangler whoami
npx wrangler login
```

### Worker deploy fails with R2 error (code 10042)
R2 is not enabled in your CF account. Either:
1. Enable R2 in CF dashboard and create the `firecow-media` bucket (see Step 7 above), or
2. Temporarily remove the `[[r2_buckets]]` section from `wrangler.toml`, deploy, then re-add it after enabling R2

### D1 queries failing locally
Local D1 is a SQLite file — run `npx wrangler dev --local` to use it, or point at the remote DB:
```bash
npx wrangler dev --remote
```

### Stripe webhook signature mismatch
Make sure `STRIPE_WEBHOOK_SECRET` matches the secret shown in Stripe CLI output (`stripe listen`) or the webhook endpoint in Stripe dashboard. These are different secrets — CLI and dashboard each have their own.

### Build fails — missing env vars
Astro will throw at build time if `PUBLIC_*` vars are missing. Check `.env` in the app directory and ensure all variables are set in CF Pages → Environment variables.

### Resend email not sending
- Verify `RESEND_API_KEY` is set in CF Pages env vars (not just local `.env`)
- Check that the `from` domain (`firecowbooking.com`) is verified in Resend dashboard
- Check Resend logs at [resend.com/emails](https://resend.com/emails)

### Crisp widget not showing
- The widget only loads when `import.meta.env.PROD === true` — it won't appear in local dev
- Verify `PUBLIC_CRISP_WEBSITE_ID` is set in CF Pages env vars for the tour site
- Check the Crisp dashboard at [app.crisp.chat](https://app.crisp.chat)

### Availability calendar not loading
- The `apiBase` prop must be passed to `BookingWidget` — check the `reservation.astro` page
- Verify the Worker endpoint: `GET /api/tours/:id/availability?month=YYYY-MM`
- Check the browser network tab for 4xx/5xx responses from the Worker
