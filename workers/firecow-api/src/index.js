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
 *   PUT  /api/bookings/:id       - update booking status
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
          const { status, notes } = body;
          const validStatuses = ['pending', 'confirmed', 'refunded', 'cancelled'];
          if (status && !validStatuses.includes(status)) return err('Invalid status');
          const fields = [];
          const values = [];
          if (status) { fields.push('status = ?'); values.push(status); }
          if (notes !== undefined) { fields.push('notes = ?'); values.push(notes); }
          if (!fields.length) return err('No fields to update');
          await DB.prepare(`UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`)
            .bind(...values, id).run();
          const updated = await DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first();
          return json(updated);
        }
      }

      return err('Not found', 404);
    } catch (e) {
      console.error(e);
      return err('Internal server error: ' + e.message, 500);
    }
  },
};
