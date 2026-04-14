import { TwilioService } from './services/twilio.js';
import { GoogleAdsService } from './services/google_ads.js';

/**
 * FireCow API — Cloudflare Worker
 * REST API layer over D1 database
 *
 * Routes:
 *   GET  /api/suppliers          - list all suppliers
 *   GET  /api/suppliers/:id      - get supplier + their tours
 *   POST /api/suppliers          - create supplier
 *   PUT  /api/suppliers/:id      - update supplier
 *
 *   GET  /api/tours              - list all tours (optional ?type=fishing)
 *   GET  /api/tours/:id          - get single tour
 *   GET  /api/tours/slug/:slug   - get tour by slug
 *   POST /api/tours              - create tour
 *   PUT  /api/tours/:id          - update tour
 *
 *   GET  /api/sites              - list all sites
 *   GET  /api/sites/:id          - get single site
 *   GET  /api/sites/slug/:slug   - get site + its tours by slug
 *   POST /api/sites              - create site
 *   PUT  /api/sites/:id          - update site
 *
 *   GET  /api/bookings           - list bookings (optional ?status=confirmed)
 *   GET  /api/bookings/:id       - get single booking
 *   POST /api/bookings           - create booking
 *   PUT  /api/bookings/:id       - update booking (status, booking_date, party_size, total_amount, notes)
 *
 *   GET  /api/tours/:id/availability?month=YYYY-MM  - date availability for a tour
 *
 *   GET  /api/analytics/summary        - totals across all bookings
 *   GET  /api/analytics/by-site        - per-site breakdown
 *   GET  /api/analytics/trends?period= - daily trend (7d/30d/90d/360d)
 *
 *   GET  /api/supplier-checks?supplier_id=&season= - list checks for a supplier
 *   POST /api/supplier-checks                      - upsert a check record
 *   PUT  /api/supplier-checks/:id                  - update status/notes
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function err(message, status = 400) {
  return json({ error: message }, status);
}

function periodToClause(period) {
  if (period === '7d') return "WHERE created_at >= DATE('now', '-7 days')";
  if (period === '30d') return "WHERE created_at >= DATE('now', '-30 days')";
  if (period === '90d') return "WHERE created_at >= DATE('now', '-90 days')";
  if (period === '360d') return "WHERE created_at >= DATE('now', '-360 days')";
  return ''; // all time
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '');
    const segments = path.split('/').filter(Boolean); // ['api', 'tours', ...]
    const method = request.method;
    const DB = env.DB;

    // ─── ADMIN AUTH ────────────────────────────────────────────────────────────
    // All write operations require a valid admin token except POST /api/bookings
    // (tour sites create bookings without admin credentials).
    const isWrite = method === 'POST' || method === 'PUT' || method === 'DELETE';
    const isPublicBookingCreate = method === 'POST' && segments[1] === 'bookings';
    if (isWrite && !isPublicBookingCreate && env.ADMIN_SECRET) {
      const auth = request.headers.get('Authorization');
      if (auth !== `Bearer ${env.ADMIN_SECRET}`) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }
    }

    try {
      // ─── SUPPLIERS ─────────────────────────────────────────────────────────
      if (segments[1] === 'suppliers') {
        const id = segments[2];

        if (method === 'GET' && !id) {
          const { results } = await DB.prepare('SELECT * FROM suppliers ORDER BY name').all();
          return json(results);
        }

        if (method === 'GET' && id) {
          const supplier = await DB.prepare('SELECT * FROM suppliers WHERE id = ?').bind(id).first();
          if (!supplier) return err('Supplier not found', 404);
          const { results: tours } = await DB.prepare('SELECT * FROM tours WHERE supplier_id = ? AND is_active = 1').bind(id).all();
          return json({ ...supplier, tours });
        }

        if (method === 'POST') {
          const body = await request.json();
          const { name, contact_email, contact_whatsapp, location } = body;
          if (!name) return err('name is required');
          const id = crypto.randomUUID();
          await DB.prepare(
            'INSERT INTO suppliers (id, name, contact_email, contact_whatsapp, location) VALUES (?, ?, ?, ?, ?)'
          ).bind(id, name, contact_email, contact_whatsapp, location).run();
          const created = await DB.prepare('SELECT * FROM suppliers WHERE id = ?').bind(id).first();
          return json(created, 201);
        }

        if (method === 'PUT' && id) {
          const body = await request.json();
          const fields = ['name', 'contact_email', 'contact_whatsapp', 'location', 'calendar_url'];
          const updates = fields.filter(f => body[f] !== undefined).map(f => `${f} = ?`).join(', ');
          const values = fields.filter(f => body[f] !== undefined).map(f => body[f]);
          if (!updates) return err('No fields to update');
          await DB.prepare(`UPDATE suppliers SET ${updates} WHERE id = ?`).bind(...values, id).run();
          const updated = await DB.prepare('SELECT * FROM suppliers WHERE id = ?').bind(id).first();
          return json(updated);
        }

        if (method === 'DELETE' && id) {
          await DB.prepare('DELETE FROM suppliers WHERE id = ?').bind(id).run();
          return json({ deleted: true });
        }
      }

      // ─── SUPPLIER CHECKS ───────────────────────────────────────────────────
      if (segments[1] === 'supplier-checks') {
        const id = segments[2];

        if (method === 'GET' && !id) {
          const supplierId = url.searchParams.get('supplier_id');
          const season = url.searchParams.get('season');
          let query = 'SELECT * FROM supplier_season_checks WHERE 1=1';
          const binds = [];
          if (supplierId) { query += ' AND supplier_id = ?'; binds.push(supplierId); }
          if (season) { query += ' AND season_name = ?'; binds.push(season); }
          query += ' ORDER BY check_date ASC';
          const { results } = await DB.prepare(query).bind(...binds).all();
          return json({ checks: results });
        }

        if (method === 'POST') {
          const body = await request.json();
          const { supplier_id, check_date, season_name, status, notes, checked_by } = body;
          if (!supplier_id || !check_date) return err('supplier_id and check_date are required');
          const validStatuses = ['available', 'unverified', 'full'];
          if (status && !validStatuses.includes(status)) return err('Invalid status');
          const checkId = crypto.randomUUID();
          await DB.prepare(`
            INSERT INTO supplier_season_checks (id, supplier_id, check_date, season_name, status, notes, checked_by, checked_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(supplier_id, check_date) DO UPDATE SET
              season_name = excluded.season_name,
              status = excluded.status,
              notes = excluded.notes,
              checked_by = excluded.checked_by,
              checked_at = datetime('now')
          `).bind(checkId, supplier_id, check_date, season_name ?? null, status ?? 'unverified', notes ?? null, checked_by ?? null).run();
          const saved = await DB.prepare(
            'SELECT * FROM supplier_season_checks WHERE supplier_id = ? AND check_date = ?'
          ).bind(supplier_id, check_date).first();
          return json(saved, 201);
        }

        if (method === 'PUT' && id) {
          const body = await request.json();
          const fields = ['status', 'notes'];
          const validStatuses = ['available', 'unverified', 'full'];
          if (body.status && !validStatuses.includes(body.status)) return err('Invalid status');
          const updates = fields.filter(f => body[f] !== undefined).map(f => `${f} = ?`).join(', ');
          const values = fields.filter(f => body[f] !== undefined).map(f => body[f]);
          if (!updates) return err('No fields to update');
          await DB.prepare(`UPDATE supplier_season_checks SET ${updates}, checked_at = datetime('now') WHERE id = ?`)
            .bind(...values, id).run();
          const updated = await DB.prepare('SELECT * FROM supplier_season_checks WHERE id = ?').bind(id).first();
          return json(updated);
        }
      }

      // ─── TOURS ─────────────────────────────────────────────────────────────
      if (segments[1] === 'tours') {
        const id = segments[2];
        const bySlug = id === 'slug';
        const slug = bySlug ? segments[3] : null;

        if (method === 'GET' && !id) {
          const type = url.searchParams.get('type');
          const query = type
            ? 'SELECT * FROM tours WHERE is_active = 1 AND type = ? ORDER BY name'
            : 'SELECT * FROM tours WHERE is_active = 1 ORDER BY name';
          const { results } = type
            ? await DB.prepare(query).bind(type).all()
            : await DB.prepare(query).all();
          return json(results);
        }

        if (method === 'GET' && bySlug && slug) {
          const tour = await DB.prepare('SELECT * FROM tours WHERE slug = ?').bind(slug).first();
          if (!tour) return err('Tour not found', 404);
          return json(tour);
        }

        if (method === 'GET' && id && !bySlug && segments[3] === 'availability') {
          const tour = await DB.prepare('SELECT id, max_capacity FROM tours WHERE id = ?').bind(id).first();
          if (!tour) return err('Tour not found', 404);
          const month = url.searchParams.get('month'); // YYYY-MM
          if (!month || !/^\d{4}-\d{2}$/.test(month)) return err('month param required (YYYY-MM)');
          const { results } = await DB.prepare(
            `SELECT booking_date, SUM(party_size) as booked
             FROM bookings
             WHERE tour_id = ? AND booking_date LIKE ? AND status = 'confirmed'
             GROUP BY booking_date`
          ).bind(id, `${month}-%`).all();
          const availability = results.map(r => ({
            date: r.booking_date,
            booked: r.booked,
            capacity: tour.max_capacity,
            available: Math.max(0, tour.max_capacity - r.booked),
          }));
          return json(availability);
        }

        if (method === 'GET' && id && !bySlug) {
          const tour = await DB.prepare('SELECT * FROM tours WHERE id = ?').bind(id).first();
          if (!tour) return err('Tour not found', 404);
          return json(tour);
        }

        if (method === 'POST') {
          const body = await request.json();
          const { supplier_id, name, slug, type, description, duration, max_capacity,
                  base_price, high_season_price, hero_image_url, gallery_images,
                  name_es, description_es, duration_es } = body;
          if (!supplier_id || !name || !slug || !type) return err('supplier_id, name, slug, and type are required');
          const id = crypto.randomUUID();
          await DB.prepare(`
            INSERT INTO tours (id, supplier_id, name, slug, type, description, duration, max_capacity,
              base_price, high_season_price, hero_image_url, gallery_images,
              name_es, description_es, duration_es)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(id, supplier_id, name, slug, type, description, duration, max_capacity ?? 12,
              base_price ?? 0, high_season_price, hero_image_url,
              JSON.stringify(gallery_images ?? []), name_es, description_es, duration_es).run();
          const created = await DB.prepare('SELECT * FROM tours WHERE id = ?').bind(id).first();
          return json(created, 201);
        }

        if (method === 'PUT' && id && !bySlug) {
          const body = await request.json();
          const fields = ['name', 'slug', 'type', 'description', 'duration', 'max_capacity',
                          'base_price', 'high_season_price', 'stripe_product_id',
                          'hero_image_url', 'gallery_images', 'is_active',
                          'name_es', 'description_es', 'duration_es'];
          const updates = fields.filter(f => body[f] !== undefined).map(f => `${f} = ?`).join(', ');
          const values = fields.filter(f => body[f] !== undefined).map(f =>
            f === 'gallery_images' ? JSON.stringify(body[f]) : body[f]
          );
          if (!updates) return err('No fields to update');
          await DB.prepare(`UPDATE tours SET ${updates} WHERE id = ?`).bind(...values, id).run();
          const updated = await DB.prepare('SELECT * FROM tours WHERE id = ?').bind(id).first();
          return json(updated);
        }

        if (method === 'DELETE' && id && !bySlug) {
          await DB.prepare('DELETE FROM tours WHERE id = ?').bind(id).run();
          return json({ deleted: true });
        }
      }

      // ─── SITES ─────────────────────────────────────────────────────────────
      if (segments[1] === 'sites') {
        const id = segments[2];
        const bySlug = id === 'slug';
        const slug = bySlug ? segments[3] : null;

        if (method === 'GET' && !id) {
          const { results } = await DB.prepare('SELECT * FROM sites ORDER BY slug').all();
          return json(results);
        }

        if (method === 'GET' && bySlug && slug) {
          const site = await DB.prepare('SELECT * FROM sites WHERE slug = ?').bind(slug).first();
          if (!site) return err('Site not found', 404);
          // Parse tour_ids and fetch associated tours
          const tourIds = JSON.parse(site.tour_ids || '[]');
          let tours = [];
          if (tourIds.length > 0) {
            const placeholders = tourIds.map(() => '?').join(',');
            const { results } = await DB.prepare(
              `SELECT * FROM tours WHERE id IN (${placeholders})`
            ).bind(...tourIds).all();
            tours = results;
          }
          return json({ ...site, tours });
        }

        if (method === 'GET' && id && !bySlug) {
          const site = await DB.prepare('SELECT * FROM sites WHERE id = ?').bind(id).first();
          if (!site) return err('Site not found', 404);
          return json(site);
        }

        if (method === 'POST') {
          const body = await request.json();
          const { slug, supplier_id, tour_ids, tagline, domain, cf_project_name,
                  primary_color, meta_title, meta_description, whatsapp_number,
                  tagline_es, meta_title_es, meta_description_es } = body;
          if (!slug) return err('slug is required');
          const id = crypto.randomUUID();
          await DB.prepare(`
            INSERT INTO sites (id, slug, domain, cf_project_name, supplier_id, tour_ids,
              tagline, primary_color, meta_title, meta_description, whatsapp_number,
              tagline_es, meta_title_es, meta_description_es)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(id, slug, domain, cf_project_name, supplier_id,
              JSON.stringify(tour_ids ?? []), tagline, primary_color ?? '#0ea5e9',
              meta_title, meta_description, whatsapp_number,
              tagline_es, meta_title_es, meta_description_es).run();
          const created = await DB.prepare('SELECT * FROM sites WHERE id = ?').bind(id).first();
          return json(created, 201);
        }

        if (method === 'PUT' && id && !bySlug) {
          const body = await request.json();
          const fields = ['slug', 'domain', 'cf_project_name', 'cf_deploy_hook', 'supplier_id',
                          'tour_ids', 'tagline', 'primary_color', 'meta_title',
                          'meta_description', 'whatsapp_number', 'is_live', 'twilio_number',
                          'tagline_es', 'meta_title_es', 'meta_description_es'];
          const updates = fields.filter(f => body[f] !== undefined).map(f => `${f} = ?`).join(', ');
          const values = fields.filter(f => body[f] !== undefined).map(f =>
            f === 'tour_ids' ? JSON.stringify(body[f]) : body[f]
          );
          if (!updates) return err('No fields to update');
          await DB.prepare(`UPDATE sites SET ${updates} WHERE id = ?`).bind(...values, id).run();
          const updated = await DB.prepare('SELECT * FROM sites WHERE id = ?').bind(id).first();
          return json(updated);
        }
      }

      // ─── BOOKINGS ──────────────────────────────────────────────────────────
      if (segments[1] === 'bookings') {
        const id = segments[2];

        if (method === 'GET' && !id) {
          const status = url.searchParams.get('status');
          const paymentIntentId = url.searchParams.get('payment_intent_id');

          if (paymentIntentId) {
            const booking = await DB.prepare(
              'SELECT * FROM bookings WHERE stripe_payment_intent_id = ?'
            ).bind(paymentIntentId).first();
            if (!booking) return err('Booking not found', 404);
            return json(booking);
          }

          const query = status
            ? 'SELECT * FROM bookings WHERE status = ? ORDER BY created_at DESC'
            : 'SELECT * FROM bookings ORDER BY created_at DESC';
          const { results } = status
            ? await DB.prepare(query).bind(status).all()
            : await DB.prepare(query).all();
          return json(results);
        }

        if (method === 'GET' && id) {
          const booking = await DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first();
          if (!booking) return err('Booking not found', 404);
          return json(booking);
        }

        if (method === 'POST') {
          const body = await request.json();
          const { tour_id, site_id, stripe_payment_intent_id, customer_email,
                  customer_name, booking_date, party_size, total_amount } = body;
          if (!tour_id || !customer_email || !total_amount) {
            return err('tour_id, customer_email, and total_amount are required');
          }
          const id = crypto.randomUUID();
          await DB.prepare(`
            INSERT INTO bookings (id, tour_id, site_id, stripe_payment_intent_id,
              customer_email, customer_name, booking_date, party_size, total_amount, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
          `).bind(id, tour_id, site_id, stripe_payment_intent_id, customer_email,
              customer_name, booking_date, party_size ?? 1, total_amount).run();
          const created = await DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first();
          return json(created, 201);
        }

        if (method === 'PUT' && id) {
          const body = await request.json();
          const { status, notes, booking_date, party_size, total_amount } = body;
          const validStatuses = ['pending', 'confirmed', 'refunded', 'cancelled'];
          if (status && !validStatuses.includes(status)) return err('Invalid status');
          const fields = [];
          const values = [];
          if (status !== undefined) { fields.push('status = ?'); values.push(status); }
          if (notes !== undefined) { fields.push('notes = ?'); values.push(notes); }
          if (booking_date !== undefined) { fields.push('booking_date = ?'); values.push(booking_date); }
          if (party_size !== undefined) { fields.push('party_size = ?'); values.push(party_size); }
          if (total_amount !== undefined) { fields.push('total_amount = ?'); values.push(total_amount); }
          if (!fields.length) return err('No fields to update');
          await DB.prepare(`UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`)
            .bind(...values, id).run();
          const updated = await DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first();
          return json(updated);
        }
      }

      // ─── ANALYTICS ─────────────────────────────────────────────────────────
      if (segments[1] === 'analytics') {
        const sub = segments[2]; // summary | by-site | trends

        if (method === 'GET' && sub === 'summary') {
          const period = url.searchParams.get('period') || 'all';
          const dateClause = periodToClause(period);
          const row = await DB.prepare(`
            SELECT
              COUNT(*) as total_bookings,
              COALESCE(SUM(total_amount), 0) as total_revenue_cents,
              COALESCE(SUM(CASE WHEN status = 'confirmed' THEN total_amount ELSE 0 END), 0) as confirmed_revenue_cents,
              COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
              COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_count,
              COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
              COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
            FROM bookings ${dateClause}
          `).first();
          return json(row);
        }

        if (method === 'GET' && sub === 'by-site') {
          const period = url.searchParams.get('period') || 'all';
          const dateClause = periodToClause(period);
          const { results } = await DB.prepare(`
            SELECT
              b.site_id,
              s.slug as site_slug,
              COUNT(*) as booking_count,
              COALESCE(SUM(b.total_amount), 0) as revenue_cents,
              COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_count,
              COUNT(CASE WHEN b.status = 'refunded' THEN 1 END) as refunded_count
            FROM bookings b
            LEFT JOIN sites s ON b.site_id = s.id
            ${dateClause}
            GROUP BY b.site_id
            ORDER BY revenue_cents DESC
          `).all();
          return json(results);
        }

        if (method === 'GET' && sub === 'trends') {
          const period = url.searchParams.get('period') || '30d';
          const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : period === '360d' ? 360 : 3650;
          const { results } = await DB.prepare(`
            SELECT
              DATE(created_at) as date,
              COUNT(*) as booking_count,
              COALESCE(SUM(total_amount), 0) as revenue_cents
            FROM bookings
            WHERE created_at >= DATE('now', '-${days} days')
            GROUP BY DATE(created_at)
            ORDER BY date ASC
          `).all();
          return json(results);
        }

        if (method === 'GET' && sub === 'by-source') {
          const period = url.searchParams.get('period') || 'all';
          const dateClause = periodToClause(period);
          const { results } = await DB.prepare(`
            SELECT notes, COUNT(*) as booking_count,
              COALESCE(SUM(total_amount), 0) as revenue_cents
            FROM bookings
            ${dateClause}
            GROUP BY notes
          `).all();
          // Parse UTM source/campaign from notes JSON
          const parsed = results.map(r => {
            let utm_source = 'direct';
            let utm_campaign = 'organic';
            try {
              const n = JSON.parse(r.notes || '{}');
              utm_source = n.utm_source || 'direct';
              utm_campaign = n.utm_campaign || 'organic';
            } catch (_) {}
            return { utm_source, utm_campaign, booking_count: r.booking_count, revenue_cents: r.revenue_cents };
          });
          
          // Aggregate by utm_source and utm_campaign
          const agg = {};
          for (const row of parsed) {
            const key = `${row.utm_source}|${row.utm_campaign}`;
            if (!agg[key]) agg[key] = { utm_source: row.utm_source, utm_campaign: row.utm_campaign, booking_count: 0, revenue_cents: 0 };
            agg[key].booking_count += row.booking_count;
            agg[key].revenue_cents += row.revenue_cents;
          }
          
          // Merge with Mock Google Ads API spend
          const gaService = new GoogleAdsService(env);
          const adSpends = await gaService.getCampaignSpend();
          
          const finalRows = Object.values(agg).map(row => {
             const spend_cents = adSpends[row.utm_campaign] || 0;
             const roas = spend_cents > 0 ? Math.round((row.revenue_cents / spend_cents) * 100) : null;
             return { ...row, spend_cents, roas };
          });

          return json(finalRows.sort((a, b) => b.revenue_cents - a.revenue_cents));
        }
      }

      // ─── R2 UPLOAD ─────────────────────────────────────────────────────────
      if (segments[1] === 'upload') {
        const R2 = env.BUCKET;
        if (!R2) return err('R2 not configured', 503);

        if (method === 'POST') {
          const key = url.searchParams.get('key') || `uploads/${crypto.randomUUID()}`;
          const contentType = request.headers.get('content-type') || 'application/octet-stream';
          await R2.put(key, request.body, { httpMetadata: { contentType } });
          const fileUrl = `${url.origin}/api/files/${key}`;
          return json({ url: fileUrl, key });
        }
      }

      // ─── R2 FILES (serve) ──────────────────────────────────────────────────
      if (segments[1] === 'files' && segments.length > 2) {
        const R2 = env.BUCKET;
        if (!R2) return err('R2 not configured', 503);

        const key = segments.slice(2).join('/');

        if (method === 'GET') {
          const obj = await R2.get(key);
          if (!obj) return err('File not found', 404);
          return new Response(obj.body, {
            headers: {
              'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
              'Cache-Control': 'public, max-age=31536000',
              ...CORS,
            },
          });
        }
      }

      // ─── REVIEWER POOL (Epic 2) ────────────────────────────────────────────
      if (segments[1] === 'reviewers') {
        const id = segments[2];
        if (method === 'GET') {
          const { results } = await DB.prepare('SELECT * FROM reviewers ORDER BY created_at DESC').all();
          return json(results);
        }
        if (method === 'POST') {
          const body = await request.json();
          const { name, whatsapp_number, sinpe_number } = body;
          if (!name || !whatsapp_number) return err('name and whatsapp_number required', 400);
          const newId = crypto.randomUUID();
          await DB.prepare('INSERT INTO reviewers (id, name, whatsapp_number, sinpe_number) VALUES (?, ?, ?, ?)')
            .bind(newId, name, whatsapp_number, sinpe_number ?? null).run();
          const created = await DB.prepare('SELECT * FROM reviewers WHERE id = ?').bind(newId).first();
          return json(created, 201);
        }
        if (method === 'PUT' && id) {
          const body = await request.json();
          const fields = ['name', 'whatsapp_number', 'sinpe_number', 'status', 'total_gigs_completed'];
          const updates = fields.filter(f => body[f] !== undefined).map(f => `${f} = ?`).join(', ');
          const values = fields.filter(f => body[f] !== undefined).map(f => body[f]);
          if (!updates) return err('no fields', 400);
          await DB.prepare(`UPDATE reviewers SET ${updates} WHERE id = ?`).bind(...values, id).run();
          return json(await DB.prepare('SELECT * FROM reviewers WHERE id = ?').bind(id).first());
        }
        if (method === 'DELETE' && id) {
          await DB.prepare('DELETE FROM reviewers WHERE id = ?').bind(id).run();
          return json({ deleted: true });
        }
      }

      if (segments[1] === 'campaigns') {
        if (method === 'GET') {
          // get campaigns and their dispatched logs
          const { results } = await DB.prepare(`
            SELECT c.*, s.slug as site_slug,
                   (SELECT COUNT(*) FROM review_dispatch_log WHERE campaign_id = c.id) as dispatched_count
            FROM review_campaigns c
            LEFT JOIN sites s ON c.site_id = s.id
            ORDER BY c.created_at DESC
          `).all();
          return json(results);
        }
        if (method === 'POST' && segments[2] === 'blast') {
          // Launch a Campaign!
          const body = await request.json();
          const { site_id, requested_reviews, bounty } = body;
          
          if (!site_id || !requested_reviews || !bounty) return err('site_id, requested_reviews, bounty required', 400);

          const site = await DB.prepare('SELECT * FROM sites WHERE id = ?').bind(site_id).first();
          if (!site) return err('Site not found', 404);

          // Find available active reviewers safely
          const { results: pool } = await DB.prepare('SELECT * FROM reviewers WHERE status = "active"').all();
          if (pool.length < requested_reviews) {
            return err(`Only ${pool.length} active reviewers available, but ${requested_reviews} requested.`, 400);
          }

          // Shuffle and pick
          const selected = pool.sort(() => 0.5 - Math.random()).slice(0, requested_reviews);
          
          const campaignId = crypto.randomUUID();
          await DB.prepare('INSERT INTO review_campaigns (id, site_id, budget, bounty_per_review) VALUES (?, ?, ?, ?)')
            .bind(campaignId, site_id, requested_reviews * bounty, bounty).run();

          const twilio = new TwilioService(env);
          const reviewLink = `https://g.page/r/fake-link-for-${site.slug}/review`; // Stub link
          
          let successCount = 0;
          for (const reviewer of selected) {
            try {
               const msg = `Hey ${reviewer.name}! 🔥 New gig available. Leave a 5-star review for ${site.slug} here: ${reviewLink} and reply with a screenshot to get paid ₡${bounty} via SINPE!`;
               // In production, you would send WhatsApp via Twilio here, but since this is a demo,
               // we'll just log it. (Otherwise it crashes without real numbers/templates).
               console.log(`[Twilio Blast] To: ${reviewer.whatsapp_number} -> ${msg}`);
               
               const logId = crypto.randomUUID();
               await DB.prepare('INSERT INTO review_dispatch_log (id, campaign_id, reviewer_id) VALUES (?, ?, ?)')
                 .bind(logId, campaignId, reviewer.id).run();
               
               successCount++;
            } catch (e) {
               console.error('Failed to dispatch to reviewer', reviewer.id, e);
            }
          }

          return json({ success: true, campaign_id: campaignId, dispatched: successCount });
        }
      }

      // ─── TWILIO API (Epic 1) ───────────────────────────────────────────────
      if (segments[1] === 'twilio') {
        if (segments[2] === 'provision' && method === 'POST') {
          const body = await request.json();
          const { countryCode, site_id } = body;

          // Note: you may want to parse a specific region from body later
          if (!countryCode || !site_id) {
            return err('countryCode (e.g. CR, US) and site_id are required');
          }

          const site = await DB.prepare('SELECT * FROM sites WHERE id = ?').bind(site_id).first();
          if (!site) return err('Site not found', 404);
          if (site.twilio_number) return err('Site already has a Twilio number', 400);

          try {
            const twilio = new TwilioService(env);
            const rawNumber = await twilio.searchAvailableNumber(countryCode);
            const purchased = await twilio.purchaseNumber(rawNumber);

            const finalNumber = purchased.phone_number;
            await DB.prepare('UPDATE sites SET twilio_number = ? WHERE id = ?').bind(finalNumber, site_id).run();

            return json({ success: true, twilio_number: finalNumber }, 201);
          } catch (e) {
            console.error('Twilio Provision Error:', e);
            return err('Failed to provision: ' + e.message, 500);
          }
        }
      }

      return err('Not found', 404);
    } catch (e) {
      console.error(e);
      return err('Internal server error: ' + e.message, 500);
    }
  },

  async scheduled(event, env, ctx) {
    console.log(`Cron triggered at ${new Date().toISOString()}`);
    const DB = env.DB;
    try {
      // 1. Fetch all suppliers with a calendar_url
      const { results: suppliers } = await DB.prepare('SELECT id, calendar_url FROM suppliers WHERE calendar_url IS NOT NULL').all();
      
      for (const supplier of suppliers) {
        if (!supplier.calendar_url) continue;
        console.log(`Syncing calendar for supplier: ${supplier.id}`);
        // 2. Integration point for external calendar APIs (FareHarbor, iCal, etc.)
        // Example flow:
        // const response = await fetch(supplier.calendar_url);
        // const calendarData = await response.text();
        // -> parse data -> verify newly blocked slots
        // -> insert dummy 'confirmed' bookings into D1 with notes: '{"source":"external_cron_sync"}'
      }
    } catch (e) {
      console.error('Cron Error:', e);
    }
  },
};
