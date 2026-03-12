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
          const fields = ['name', 'contact_email', 'contact_whatsapp', 'location'];
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
                  base_price, high_season_price, hero_image_url, gallery_images } = body;
          if (!supplier_id || !name || !slug || !type) return err('supplier_id, name, slug, and type are required');
          const id = crypto.randomUUID();
          await DB.prepare(`
            INSERT INTO tours (id, supplier_id, name, slug, type, description, duration, max_capacity,
              base_price, high_season_price, hero_image_url, gallery_images)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(id, supplier_id, name, slug, type, description, duration, max_capacity ?? 12,
              base_price ?? 0, high_season_price, hero_image_url,
              JSON.stringify(gallery_images ?? [])).run();
          const created = await DB.prepare('SELECT * FROM tours WHERE id = ?').bind(id).first();
          return json(created, 201);
        }

        if (method === 'PUT' && id && !bySlug) {
          const body = await request.json();
          const fields = ['name', 'slug', 'type', 'description', 'duration', 'max_capacity',
                          'base_price', 'high_season_price', 'stripe_product_id',
                          'hero_image_url', 'gallery_images', 'is_active'];
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
                  primary_color, meta_title, meta_description, whatsapp_number } = body;
          if (!slug) return err('slug is required');
          const id = crypto.randomUUID();
          await DB.prepare(`
            INSERT INTO sites (id, slug, domain, cf_project_name, supplier_id, tour_ids,
              tagline, primary_color, meta_title, meta_description, whatsapp_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(id, slug, domain, cf_project_name, supplier_id,
              JSON.stringify(tour_ids ?? []), tagline, primary_color ?? '#0ea5e9',
              meta_title, meta_description, whatsapp_number).run();
          const created = await DB.prepare('SELECT * FROM sites WHERE id = ?').bind(id).first();
          return json(created, 201);
        }

        if (method === 'PUT' && id && !bySlug) {
          const body = await request.json();
          const fields = ['slug', 'domain', 'cf_project_name', 'cf_deploy_hook', 'supplier_id',
                          'tour_ids', 'tagline', 'primary_color', 'meta_title',
                          'meta_description', 'whatsapp_number', 'is_live'];
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
          // Parse UTM source from notes JSON
          const parsed = results.map(r => {
            let utm_source = 'direct';
            try {
              const n = JSON.parse(r.notes || '{}');
              utm_source = n.utm_source || 'direct';
            } catch (_) {}
            return { utm_source, booking_count: r.booking_count, revenue_cents: r.revenue_cents };
          });
          // Aggregate by utm_source
          const agg = {};
          for (const row of parsed) {
            if (!agg[row.utm_source]) agg[row.utm_source] = { utm_source: row.utm_source, booking_count: 0, revenue_cents: 0 };
            agg[row.utm_source].booking_count += row.booking_count;
            agg[row.utm_source].revenue_cents += row.revenue_cents;
          }
          return json(Object.values(agg).sort((a, b) => b.revenue_cents - a.revenue_cents));
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

      return err('Not found', 404);
    } catch (e) {
      console.error(e);
      return err('Internal server error: ' + e.message, 500);
    }
  },
};
