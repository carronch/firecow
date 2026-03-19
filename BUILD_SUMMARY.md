# FireCow Bookings — Build Summary

## Architecture Overview

Multi-site tour booking platform built on Cloudflare's infrastructure with Stripe payments, transactional email, and live chat.

**Stack:** Astro SSR + React + Tailwind CSS + Cloudflare (D1, R2, Workers, Pages) + Stripe + Resend + Crisp

---

## Monorepo Structure

```
firecow-bookings/
├── apps/
│   ├── isla-tortuga-costa-rica/   # Live tour site (Astro SSR, CF Pages)
│   └── admin/                     # Admin dashboard (Astro SSR, CF Pages)
├── packages/
│   └── api-client/                # Shared TypeScript API client + type definitions
├── workers/
│   └── firecow-api/               # Cloudflare Worker REST API
├── turbo.json
└── pnpm-workspace.yaml
```

---

## Cloudflare Resources

| Resource | Name / ID |
|---|---|
| Account | `firecowbooking@gmail.com` (ID: `de37049df0384c9ae759a247ab16f81f`) |
| D1 Database | `firecow-db` (ID: `161ece68-0170-4deb-b72d-f55be878670f`) |
| Worker | `firecow-api` → `https://firecow-api.firecowbooking.workers.dev` |
| R2 Bucket | `firecow-media` ⚠️ Must be created manually in CF dashboard |
| Pages (site) | `isla-tortuga-costa-rica` |
| Pages (admin) | `firecow-admin` |

---

## Database Schema (D1)

### `suppliers`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | UUID |
| name | TEXT | |
| contact_email | TEXT | |
| contact_whatsapp | TEXT | |
| location | TEXT | |

### `tours`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | UUID |
| supplier_id | TEXT FK | |
| name | TEXT | |
| slug | TEXT | URL-safe identifier |
| type | TEXT | catamaran / fishing / snorkeling / etc. |
| description | TEXT | |
| duration | TEXT | e.g. "Full day" |
| max_capacity | INTEGER | Max guests |
| base_price | INTEGER | Cents |
| high_season_price | INTEGER | Cents (optional) |
| hero_image_url | TEXT | R2 file URL |
| gallery_images | TEXT | JSON array of R2 URLs |
| is_active | INTEGER | 0 or 1 |

### `sites`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | UUID |
| slug | TEXT | Unique site identifier |
| domain | TEXT | Custom domain if set |
| cf_project_name | TEXT | CF Pages project name |
| cf_deploy_hook | TEXT | CF Pages deploy hook URL |
| supplier_id | TEXT FK | |
| tour_ids | TEXT | JSON array of tour IDs |
| tagline | TEXT | |
| primary_color | TEXT | |
| meta_title | TEXT | |
| meta_description | TEXT | |
| whatsapp_number | TEXT | |
| is_live | INTEGER | 0 or 1 |

### `bookings`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | UUID |
| tour_id | TEXT FK | |
| site_id | TEXT | e.g. `isla-tortuga-costa-rica` |
| stripe_payment_intent_id | TEXT | Stripe PI ID (idempotency key) |
| customer_email | TEXT | |
| customer_name | TEXT | |
| booking_date | TEXT | YYYY-MM-DD |
| party_size | INTEGER | Adults + children |
| total_amount | INTEGER | Cents |
| status | TEXT | pending / confirmed / refunded / cancelled |
| notes | TEXT | JSON — stores UTM attribution: `{"utm_source":"google","utm_campaign":"..."}` |
| created_at | TEXT | ISO timestamp |

### `reviewers`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | UUID |
| name | TEXT | Name of local gig worker |
| whatsapp_number | TEXT | |
| sinpe_number | TEXT | Payment destination |
| status | TEXT | `active` / `banned` |
| total_gigs_completed | INTEGER | Auto-increments |
| created_at | DATETIME | |

### `review_campaigns`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | UUID |
| site_id | TEXT FK | Connects to Sites table |
| budget | INTEGER | Total budget allocated |
| bounty_per_review | INTEGER | ₡ payout per review |
| status | TEXT | `active` / `completed` |

### `review_dispatch_log`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | UUID |
| campaign_id | TEXT FK | |
| reviewer_id | TEXT FK | Maps reviewer to gig |
| payout_status | TEXT | `pending` / `paid` / `failed` |

---

## Worker API (`workers/firecow-api/`)

**Base URL:** `https://firecow-api.firecowbooking.workers.dev`

### Suppliers

| Method | Path | Description |
|---|---|---|
| GET | `/api/suppliers` | List all suppliers |
| POST | `/api/suppliers` | Create supplier |
| PUT | `/api/suppliers/:id` | Update supplier |
| DELETE | `/api/suppliers/:id` | Delete supplier |

### Tours

| Method | Path | Description |
|---|---|---|
| GET | `/api/tours` | List all tours |
| GET | `/api/tours/:id` | Get tour by ID or slug (`?slug=true`) |
| POST | `/api/tours` | Create tour |
| PUT | `/api/tours/:id` | Update tour |
| DELETE | `/api/tours/:id` | Delete tour |
| GET | `/api/tours/:id/availability?month=YYYY-MM` | Availability for a month — returns `[{ date, booked, capacity, available }]` |

### Sites

| Method | Path | Description |
|---|---|---|
| GET | `/api/sites` | List all sites |
| POST | `/api/sites` | Create site |
| PUT | `/api/sites/:id` | Update site |

### Bookings

| Method | Path | Description |
|---|---|---|
| GET | `/api/bookings` | List all bookings (supports `?payment_intent_id=` for idempotency lookup) |
| POST | `/api/bookings` | Create booking |
| PUT | `/api/bookings/:id` | Update booking — accepts `booking_date`, `party_size`, `total_amount`, `notes`, `status` |

### Review Pool & Twilio

| Method | Path | Description |
|---|---|---|
| GET | `/api/reviewers` | Lists the gig-worker pool |
| POST | `/api/reviewers` | Add a new gig-worker |
| PUT | `/api/reviewers/:id` | Update gig-worker stats / BAN state |
| GET | `/api/campaigns` | Lists all WhatsApp Blast Campaigns and their dispatch counts |
| POST | `/api/campaigns/blast` | Targets a client site, randomly selects active reviewers, saves logs, and shoots Twilio payload |
| POST | `/api/twilio/provision` | Proxies `countryCode` parameter to dynamically purchase and mount a Twilio Virtual Number to a `site_id` |

### Files (R2)

| Method | Path | Description |
|---|---|---|
| POST | `/api/upload?key=` | Upload file to R2 (raw binary body) — returns `{ url }` |
| GET | `/api/files/:key` | Serve file from R2 with correct Content-Type |

### Analytics

| Method | Path | Description |
|---|---|---|
| GET | `/api/analytics/summary?period=30d` | Summary stats: total bookings, revenue, confirmed/refunded/cancelled counts |
| GET | `/api/analytics/by-site?period=30d` | Per-site breakdown: bookings, revenue, confirmed count, refund count |
| GET | `/api/analytics/trends?period=30d` | Daily trend data: `[{ date, booking_count, revenue_cents }]` |
| GET | `/api/analytics/by-source?period=30d` | UTM source breakdown: `[{ utm_source, booking_count, revenue_cents }]` |

**Period values:** `7d` | `30d` | `90d` | `360d` | `all`

---

## Tour Site: `apps/isla-tortuga-costa-rica/`

**Deployed at:** `https://isla-tortuga-costa-rica.pages.dev` (or custom domain)

### Pages

| Route | Description |
|---|---|
| `/` | Homepage — fetches tour + site data from Worker at request time |
| `/reservation` | Booking widget (availability calendar + Stripe Embedded Checkout) |
| `/success?session_id=` | Payment confirmation, creates booking record, sends email |
| `/api/create-checkout-session` | Server route: creates Stripe Checkout Session |
| `/api/webhooks/stripe` | Stripe webhook: syncs payment/refund/cancel events to D1 |

### Booking Flow

1. User opens `BookingWidget` — availability calendar fetches open/full slots per day from Worker
2. User selects date (color-coded: green = open, amber = few left, red = full/disabled)
3. User enters guest counts → widget calculates total price (supports adult/child rates + seasonal pricing)
4. UTM params captured from URL (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`) on mount
5. `BookingWidget` POSTs to `/api/create-checkout-session` → gets `clientSecret` (UTMs included in Stripe metadata)
6. `CheckoutForm` renders Stripe Embedded Checkout modal
7. On payment success, Stripe redirects to `/success?session_id=xxx`
8. `success.astro` server-side:
   - Verifies Stripe session and checks `payment_status === 'paid'`
   - Idempotency: checks if booking exists via `GET /api/bookings?payment_intent_id=`
   - Creates booking via `POST /api/bookings` (includes UTM notes as JSON)
   - Fetches sibling tours for upsell (all active tours except current)
   - Sends Resend confirmation email (booking details + upsell section)
   - Renders confirmation card + upsell tour cards
9. Stripe webhook (`checkout.session.completed`) creates booking as fallback if success page fails

### Key Components

| File | Description |
|---|---|
| `BookingWidget.jsx` | Multi-step booking form with `AvailabilityCalendar` sub-component, UTM capture, Stripe integration |
| `CheckoutForm.jsx` | Stripe `EmbeddedCheckout` wrapper with close button |
| `AvailabilityCalendar` | Mini monthly calendar grid (inside `BookingWidget.jsx`) — color-coded availability |

### Environment Variables

```env
PUBLIC_STRIPE_KEY=pk_live_...           # Stripe publishable key
STRIPE_SECRET_KEY=sk_live_...           # Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...         # From Stripe webhook settings
FIRECOW_API_URL=https://firecow-api.firecowbooking.workers.dev
RESEND_API_KEY=re_...                   # Resend API key (email confirmations)
PUBLIC_CRISP_WEBSITE_ID=xxxx-xxxx-...  # Crisp website ID (live chat widget)
```

---

## Admin Dashboard: `apps/admin/`

**Deployed at:** `https://firecow-admin.pages.dev`
**Protected by:** Cloudflare Access (email allowlist — configure in CF dashboard → Zero Trust)

### Pages

| Route | Component | Features |
|---|---|---|
| `/bookings` | `BookingsTable.tsx` | View all bookings, status badges, Stripe refund, inline edit (date/guests/status/notes), UTM source shown in notes column |
| `/calendar` | `CalendarView.tsx` | Monthly grid calendar, colored booking pills per day, click to view/edit booking detail panel, filter by site |
| `/analytics` | `AnalyticsDashboard.tsx` | Revenue/booking stat cards, daily trend bar chart, per-site table, UTM sources table with pre-wired Ad Spend column |
| `/suppliers` | `SuppliersTable.tsx` | Inline add/edit/delete rows |
| `/tours` | `ToursTable.tsx` | Full CRUD, R2 image upload, supplier dropdown, toggle active |
| `/sites` | `SitesTable.tsx` | Card layout, create/edit, Twilio Provisioning, GBP Launch Kit generation, toggle live, duplicate button |
| `/reviewers` | `ReviewersTable.tsx` | Manages the standalone local Gig-Worker table. Launch Twilio blasts to coordinate real 5-star reviews on Google |

### Admin Architecture

- Astro SSR (`output: 'server'`) with Cloudflare adapter
- Pages fetch initial data server-side → pass as props to React components
- React components handle all subsequent CRUD via Worker API
- `src/middleware.ts` extracts CF Access email from `cf-access-authenticated-user-email` header → `locals.userEmail`
- Stripe refund flow: `POST /api/refund` → retrieve PI charge → `stripe.refunds.create()` → PUT booking status

### Pending Deploy State (SitesTable)

- After `saveEdit()` resolves → site ID added to `pendingDeploy: Set<string>` state
- After `triggerDeploy()` resolves → site ID removed from `pendingDeploy`
- Site card shows amber "Deploy needed" badge with pulsing dot while pending
- Deploy button turns amber + pulsing animation to draw attention

### Environment Variables

```env
FIRECOW_API_URL=https://firecow-api.firecowbooking.workers.dev
STRIPE_SECRET_KEY=sk_live_...
```

---

## Third-Party Services

### Stripe
- **Embedded Checkout** — renders inside a modal, no redirect
- **Webhooks**: `checkout.session.completed`, `charge.refunded`, `payment_intent.payment_failed`
- **Metadata** stored in session: `tourId`, `tourName`, `date`, `adults`, `children`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`

### Resend (Email)
- **Free tier**: 3,000 emails/month, 100/day
- **Edge-compatible**: plain HTTP API, no Node SDK needed
- **From address**: `bookings@firecowbooking.com`
- **Content**: booking confirmation + upsell tour cards

### Crisp (Live Chat)
- **Free tier**: 2 agents, unlimited conversations
- **Paid ($25/mo)**: adds WhatsApp + Telegram channel integration in one inbox
- **Widget**: embedded via `<script>` snippet in `BaseLayout.astro`, only loads in production
- **Admin inbox**: managed entirely at `app.crisp.chat` — no code in our admin

### UTM Attribution
- Params captured: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`
- Flow: URL params → Stripe session metadata → `success.astro` → `booking.notes` (JSON)
- Analytics: `GET /api/analytics/by-source` parses `notes` JSON and groups by `utm_source`
- **Ad Spend column** pre-built in analytics table — shows `—` until Google Ads API connected (Phase 6)

---

## Phases Completed

| Phase | Status | Summary |
|---|---|---|
| Phase 1 — D1 Setup & Data Migration | ✅ Complete | Schema, seed data, Worker REST API, packages |
| Phase 2 — Stripe Checkout | ✅ Complete | Embedded Checkout, success page, webhooks, Zoho removed |
| Phase 3 — Admin Dashboard | ✅ Complete | Full CRUD admin with Stripe refunds and R2 image uploads |
| Phase 4 — Feature Expansion | ✅ Complete | Analytics, calendar, availability, UTM, email, upsell, Crisp, deploy UX |
| Phase 7 — Comms & Gig Pool | ✅ Complete | Twilio APIs, Reviewer Database, GBP Verification Strategy UI |

## Upcoming Phases

| Phase | Status | Summary |
|---|---|---|
| Phase 5 — Multi-language (ES/EN) | Deferred | i18n routing, translation objects, language toggle |
| Phase 6 — Google Ads API / ROAS | Deferred | OAuth2, campaign spend fetch, ROAS per UTM campaign |

---

**Repository:** `https://github.com/carronch/firecow` (root = `firecow-bookings/`)
**Last updated:** March 2026
