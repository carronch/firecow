# Getting Started — FireCow Bookings

## Prerequisites

- **Node.js** 18+
- **PNPM** (`npm install -g pnpm`)
- **Wrangler CLI** (`npm install -g wrangler`) — for Worker + D1 + R2
- **Git**
- Cloudflare account (`firecowbooking@gmail.com`)
- Stripe account (test keys available in dashboard)

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

```
PUBLIC_STRIPE_KEY=pk_test_...        # Stripe dashboard → Developers → API keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...      # From Stripe webhook settings
FIRECOW_API_URL=https://firecow-api.firecowbooking.workers.dev
```

> For local Stripe webhook testing, use the [Stripe CLI](https://stripe.com/docs/stripe-cli):
> ```bash
> stripe listen --forward-to localhost:4321/api/webhooks/stripe
> ```
> The CLI will print a `whsec_...` secret to use as `STRIPE_WEBHOOK_SECRET`.

---

## 4. Run the Admin Dashboard Locally

```bash
cd apps/admin
# create .env:
echo 'FIRECOW_API_URL=https://firecow-api.firecowbooking.workers.dev' > .env
echo 'STRIPE_SECRET_KEY=sk_test_...' >> .env
pnpm dev
# → http://localhost:4322
```

In local dev, `middleware.ts` falls back to `dev@local` for the user email (no CF Access required).

---

## 5. Run the Worker Locally

```bash
cd workers/firecow-api
wrangler dev
# → http://localhost:8787
```

When running the Worker locally, update `FIRECOW_API_URL=http://localhost:8787` in site/admin `.env` files to point at the local Worker.

---

## 6. Deploy

### Worker

```bash
cd workers/firecow-api
wrangler deploy
```

### Tour Site

```bash
cd apps/isla-tortuga-costa-rica
pnpm build
# Deploy via CF Pages — connected to GitHub, auto-deploys on push to main
```

Set env vars in CF Pages dashboard → Settings → Environment variables.

### Admin Dashboard

```bash
cd apps/admin
pnpm build
# Deploy via CF Pages — set project name to "firecow-admin"
```

Set env vars in CF Pages dashboard. Then configure Cloudflare Access:
- CF Dashboard → Zero Trust → Access → Applications → Add application
- Add the admin Pages URL, set email allowlist

---

## Development Commands

| Command | Description |
|---|---|
| `pnpm --filter @firecow/isla-tortuga-costa-rica dev` | Start tour site dev server |
| `pnpm --filter @firecow/admin dev` | Start admin dev server |
| `wrangler dev` (in `workers/firecow-api/`) | Start Worker locally |
| `wrangler d1 execute firecow-db --remote --file=migrations/0001_schema.sql` | Apply DB migration |
| `pnpm build` (in any app) | Build for production |

---

## Project Structure

```
firecow-bookings/
├── apps/
│   ├── isla-tortuga-costa-rica/   # Tour site
│   │   ├── src/pages/
│   │   │   ├── index.astro            # Homepage (fetches from Worker)
│   │   │   ├── reservation.astro      # Booking widget
│   │   │   ├── success.astro          # Payment confirmation
│   │   │   └── api/
│   │   │       ├── create-checkout-session.ts
│   │   │       └── webhooks/stripe.ts
│   │   └── src/components/
│   │       ├── BookingWidget.jsx
│   │       └── CheckoutForm.jsx
│   └── admin/
│       ├── src/pages/
│       │   ├── bookings.astro
│       │   ├── suppliers.astro
│       │   ├── tours.astro
│       │   └── sites.astro
│       ├── src/components/
│       │   ├── BookingsTable.tsx
│       │   ├── SuppliersTable.tsx
│       │   ├── ToursTable.tsx
│       │   └── SitesTable.tsx
│       └── src/pages/api/refund.ts
├── workers/
│   └── firecow-api/
│       ├── src/index.js               # All REST endpoints
│       ├── migrations/
│       └── wrangler.toml
└── packages/
    └── api-client/                    # Shared TS types + fetch helpers
```

---

## Common Issues

### Wrangler not authenticated
```bash
wrangler whoami
wrangler login
```

### D1 queries failing locally
Local D1 is a SQLite file — run `wrangler dev --local` to use it, or point at the remote DB with `wrangler dev --remote`.

### Stripe webhook signature mismatch
Make sure `STRIPE_WEBHOOK_SECRET` matches the secret shown in Stripe CLI output (`stripe listen`) or the webhook endpoint in Stripe dashboard.

### Build fails — missing env vars
Astro will throw at build time if `PUBLIC_*` vars are missing. Check `.env` in the app directory.
