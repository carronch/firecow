# FireCow Bookings — TODO

## Key Technical Details
- **Cloudflare account:** `firecowbooking@gmail.com` (Account ID: `de37049df0384c9ae759a247ab16f81f`)
- **D1 database:** `firecow-db` (ID: `161ece68-0170-4deb-b72d-f55be878670f`)
- **Worker:** `workers/firecow-api/` → `https://firecow-api.firecowbooking.workers.dev`
- **R2 bucket:** `firecow-media` — bound as `BUCKET`, served via `GET /api/files/:key`
- **Repo:** `https://github.com/carronch/firecow` — root is `firecow-bookings/`
- **Stack:** Cloudflare D1 + R2 + Workers + Pages + Stripe

---

## Phase 1 — D1 Setup & Data Migration ✅ COMPLETE
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

---

## Phase 2 — Stripe Checkout ✅ COMPLETE
- [x] Create `api/create-checkout-session.ts` — Stripe Checkout Session (embedded), returns `clientSecret`
- [x] Wire BookingWidget → CheckoutForm via `clientSecret`; key from `PUBLIC_STRIPE_KEY` env var
- [x] `success.astro` — verify session server-side, idempotent POST to Worker `/api/bookings`, confirmation card
- [x] Stripe webhook — `checkout.session.completed`, `charge.refunded`, `payment_intent.canceled` sync to D1
- [x] Remove all Zoho references (deleted `zoho-crm.ts`, replaced iframe with `<BookingWidget />`)
- [x] Worker: `GET /api/bookings?payment_intent_id=` (idempotency lookup)
- [x] Worker: `DELETE /api/suppliers/:id`, `DELETE /api/tours/:id`
- [x] Worker: `POST /api/upload?key=` + `GET /api/files/:key` (R2)
- [x] Worker `wrangler.toml`: R2 bucket binding

---

## Phase 3 — Admin Dashboard ✅ COMPLETE
- [x] Scaffold `apps/admin` — Astro SSR, Cloudflare adapter, React, Tailwind, Stripe
- [x] Middleware extracts CF Access email → `locals.userEmail`
- [x] Dark sidebar layout, 4-item nav (Bookings / Suppliers / Tours / Sites)
- [x] `/bookings` — view all bookings, status badges, Stripe refund button
- [x] `/suppliers` — inline add / edit / delete rows
- [x] `/tours` — full CRUD, R2 image upload, supplier dropdown, toggle active
- [x] `/sites` — card layout, create/edit, CF Pages deploy button, toggle live
- [x] `api/refund.ts` — Stripe refund via PI charge, PUTs booking status to `refunded`
- [x] Cloudflare Access protection (configure in CF dashboard — email allowlist)

---

## Phase 4 — Auto-Rebuild on Save ← NEXT
- [x] `cf_deploy_hook` stored per site in D1 `sites` table
- [x] Admin deploy button POSTs to hook manually
- [ ] Auto-trigger deploy after saving site or tour changes (optional)

---

## Backlog / Ideas
- [ ] Multi-language support (ES/EN toggle)
- [ ] Booking calendar UI (date picker with availability)
- [ ] Upsell modal after checkout
- [ ] Email confirmation to customer on booking
- [ ] Analytics dashboard (booking counts, revenue by site)
- [ ] Duplicate site button in admin
- [ ] Bulk tour assignment to sites
