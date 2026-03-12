# FireCow Bookings — Build Summary

## Architecture Overview

Multi-site tour booking platform built on Cloudflare's infrastructure with Stripe payments.

**Stack:** Astro SSR + React + Tailwind CSS + Cloudflare (D1, R2, Workers, Pages) + Stripe

---

## Monorepo Structure

```
firecow-bookings/
├── apps/
│   ├── isla-tortuga-costa-rica/   # Live tour site (Astro SSR, CF Pages)
│   └── admin/                     # Admin dashboard (Astro SSR, CF Pages)
├── packages/
│   └── api-client/                # Shared TypeScript API client
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
| R2 Bucket | `firecow-media` |
| Pages (site) | `isla-tortuga-costa-rica` |
| Pages (admin) | `firecow-admin` |

---

## Database Schema (D1)

### `suppliers`
| Column | Type |
|---|---|
| id | TEXT PK |
| name | TEXT |
| contact_email | TEXT |
| contact_whatsapp | TEXT |
| location | TEXT |

### `tours`
| Column | Type |
|---|---|
| id | TEXT PK |
| supplier_id | TEXT FK |
| name, slug | TEXT |
| type | TEXT (catamaran/fishing/snorkeling/…) |
| description, duration | TEXT |
| max_capacity | INTEGER |
| base_price, high_season_price | INTEGER (cents) |
| hero_image_url | TEXT |
| gallery_images | TEXT (JSON array) |
| is_active | INTEGER (0/1) |

### `sites`
| Column | Type |
|---|---|
| id | TEXT PK |
| slug, domain | TEXT |
| cf_project_name | TEXT |
| cf_deploy_hook | TEXT |
| supplier_id | TEXT FK |
| tour_ids | TEXT (JSON array) |
| tagline, primary_color | TEXT |
| meta_title, meta_description | TEXT |
| whatsapp_number | TEXT |
| is_live | INTEGER (0/1) |

### `bookings`
| Column | Type |
|---|---|
| id | TEXT PK |
| tour_id, site_id | TEXT FK |
| customer_name, customer_email, customer_phone | TEXT |
| tour_date | TEXT |
| num_guests | INTEGER |
| total_price | INTEGER (cents) |
| payment_intent_id | TEXT (Stripe PI ID) |
| status | TEXT (pending/confirmed/refunded/cancelled) |
| created_at | TEXT |

---

## Worker API (`workers/firecow-api/`)

**Base URL:** `https://firecow-api.firecowbooking.workers.dev`

### Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/suppliers` | List all suppliers |
| POST | `/api/suppliers` | Create supplier |
| PUT | `/api/suppliers/:id` | Update supplier |
| DELETE | `/api/suppliers/:id` | Delete supplier |
| GET | `/api/tours` | List all tours |
| POST | `/api/tours` | Create tour |
| PUT | `/api/tours/:id` | Update tour |
| DELETE | `/api/tours/:id` | Delete tour |
| GET | `/api/sites` | List all sites |
| POST | `/api/sites` | Create site |
| PUT | `/api/sites/:id` | Update site |
| GET | `/api/bookings` | List bookings (supports `?payment_intent_id=` lookup) |
| POST | `/api/bookings` | Create booking |
| PUT | `/api/bookings/:id` | Update booking status |
| POST | `/api/upload?key=` | Upload file to R2 (raw binary body) |
| GET | `/api/files/:key` | Serve file from R2 |

---

## Tour Site: `apps/isla-tortuga-costa-rica/`

**Deployed at:** `https://isla-tortuga-costa-rica.pages.dev` (or custom domain)

### Pages
- `/` — homepage, fetches tour + site data from Worker at request time
- `/reservation` — booking widget (Stripe Embedded Checkout)
- `/success?session_id=` — payment confirmation, creates booking record
- `/api/create-checkout-session` — server route: creates Stripe Checkout Session
- `/api/webhooks/stripe` — Stripe webhook: syncs payment/refund/cancel events to D1

### Booking Flow
1. User fills out `BookingWidget` form (tour date, guests, contact info)
2. `BookingWidget` POSTs to `/api/create-checkout-session` → gets `clientSecret`
3. `CheckoutForm` renders Stripe Embedded Checkout with `clientSecret`
4. On payment success, Stripe redirects to `/success?session_id=xxx`
5. `success.astro` verifies session server-side, idempotently POSTs to Worker `/api/bookings`
6. Webhook (`checkout.session.completed`) also creates booking as fallback
7. `charge.refunded` / `payment_intent.canceled` webhooks sync status to D1

### Environment Variables
```
PUBLIC_STRIPE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FIRECOW_API_URL=https://firecow-api.firecowbooking.workers.dev
```

---

## Admin Dashboard: `apps/admin/`

**Deployed at:** `https://firecow-admin.pages.dev`
**Protected by:** Cloudflare Access (email allowlist — configure in CF dashboard)

### Pages

| Route | Component | Features |
|---|---|---|
| `/bookings` | `BookingsTable.tsx` | View all bookings, status badges, Stripe refund button |
| `/suppliers` | `SuppliersTable.tsx` | Inline add/edit/delete rows |
| `/tours` | `ToursTable.tsx` | Full CRUD, R2 image upload, supplier linking, toggle active |
| `/sites` | `SitesTable.tsx` | Create/edit sites, CF Pages deploy trigger, toggle live |

### Architecture
- Astro SSR (`output: 'server'`) with Cloudflare adapter
- Pages fetch initial data server-side → pass as props to React components
- React components handle all subsequent CRUD via Worker API
- `src/middleware.ts` extracts CF Access email from `cf-access-authenticated-user-email` header
- Stripe refund flow: `POST /api/refund` → retrieve PI charge → `stripe.refunds.create()` → PUT booking status

### Environment Variables
```
FIRECOW_API_URL=https://firecow-api.firecowbooking.workers.dev
STRIPE_SECRET_KEY=sk_test_...
```

---

## Phases Completed

| Phase | Status | Summary |
|---|---|---|
| Phase 1 — D1 Setup & Data Migration | ✅ Complete | Schema, seed, Worker API, packages |
| Phase 2 — Stripe Checkout | ✅ Complete | Checkout Session, success page, webhooks, Zoho removed |
| Phase 3 — Admin Dashboard | ✅ Complete | Full CRUD admin with Stripe refunds and R2 uploads |
| Phase 4 — Auto-Rebuild on Save | Partial | Deploy button exists; auto-trigger on save optional |

---

**Repository:** `https://github.com/carronch/firecow` (root = `firecow-bookings/`)
**Updated:** March 2026
