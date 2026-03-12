import type { Env } from './types';
import { json, err } from './utils';

interface SlotInput {
  tour_id: string;
  date: string;
  time_slot?: string | null;
  slots_total: number;
  price_override?: number | null;
  is_blocked?: number;
}

// GET /admin/availability?tour_id=...&month=YYYY-MM
export async function handleListAvailability(
  url: URL,
  env: Env
): Promise<Response> {
  const tourId = url.searchParams.get('tour_id');
  const month = url.searchParams.get('month'); // YYYY-MM

  if (!tourId) return err('tour_id is required');

  let query = 'SELECT * FROM tour_availability WHERE tour_id = ?';
  const binds: (string | number)[] = [tourId];

  if (month) {
    query += ' AND date LIKE ?';
    binds.push(`${month}%`);
  }

  query += ' ORDER BY date, time_slot';

  const result = await env.DB.prepare(query).bind(...binds).all();
  return json({ availability: result.results ?? [] });
}

// POST /admin/availability/bulk
// Body: { slots: [{ tour_id, date, time_slot?, slots_total, price_override?, is_blocked? }] }
export async function handleBulkUpsertAvailability(
  request: Request,
  env: Env
): Promise<Response> {
  let body: { slots: SlotInput[] };
  try {
    body = await request.json() as typeof body;
  } catch {
    return err('Invalid JSON body');
  }

  const slots = body.slots;
  if (!Array.isArray(slots) || slots.length === 0) return err('slots array is required');

  // Validate all slots have required fields
  for (const s of slots) {
    if (!s.tour_id) return err('Each slot must have tour_id');
    if (!s.date) return err('Each slot must have date');
    if (!s.slots_total || s.slots_total < 1) return err('slots_total must be >= 1');
  }

  const stmt = env.DB.prepare(`
    INSERT INTO tour_availability (tour_id, date, time_slot, slots_total, price_override, is_blocked)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT (tour_id, date, COALESCE(time_slot, ''))
    DO UPDATE SET
      slots_total = excluded.slots_total,
      price_override = excluded.price_override,
      is_blocked = excluded.is_blocked
  `);

  const batch = slots.map(s =>
    stmt.bind(
      s.tour_id,
      s.date,
      s.time_slot ?? null,
      s.slots_total,
      s.price_override ?? null,
      s.is_blocked ?? 0
    )
  );

  await env.DB.batch(batch);

  return json({ upserted: slots.length });
}

// PUT /admin/availability/:id
export async function handleUpdateAvailability(
  availId: string,
  request: Request,
  env: Env
): Promise<Response> {
  let body: Partial<{ slots_total: number; price_override: number | null; is_blocked: number }>;
  try {
    body = await request.json() as typeof body;
  } catch {
    return err('Invalid JSON body');
  }

  const avail = await env.DB
    .prepare('SELECT * FROM tour_availability WHERE id = ?')
    .bind(availId)
    .first<{ id: string; slots_total: number; price_override: number | null; is_blocked: number }>();

  if (!avail) return err('Availability slot not found', 404);

  const updated = {
    slots_total: body.slots_total ?? avail.slots_total,
    price_override: body.price_override !== undefined ? body.price_override : avail.price_override,
    is_blocked: body.is_blocked !== undefined ? body.is_blocked : avail.is_blocked,
  };

  await env.DB
    .prepare('UPDATE tour_availability SET slots_total = ?, price_override = ?, is_blocked = ? WHERE id = ?')
    .bind(updated.slots_total, updated.price_override, updated.is_blocked, availId)
    .run();

  return json({ id: availId, ...updated });
}

// GET /admin/api-keys
export async function handleListAgentKeys(env: Env): Promise<Response> {
  const result = await env.DB
    .prepare(`
      SELECT id, key_prefix, agent_name, agent_email,
             markup_pct, markup_fixed_cents, is_active,
             total_bookings, total_revenue, created_at, last_used_at
      FROM agent_api_keys
      ORDER BY created_at DESC
    `)
    .all();
  return json({ keys: result.results ?? [] });
}

// POST /admin/api-keys
export async function handleGenerateApiKey(
  request: Request,
  env: Env
): Promise<Response> {
  let body: {
    agent_name: string;
    agent_email?: string;
    markup_pct?: number;
    markup_fixed_cents?: number;
  };
  try {
    body = await request.json() as typeof body;
  } catch {
    return err('Invalid JSON body');
  }

  if (!body.agent_name) return err('agent_name is required');

  const { generateApiKey, hashKey } = await import('./utils');
  const { raw, prefix } = generateApiKey();
  const hash = await hashKey(raw);

  await env.DB
    .prepare(`
      INSERT INTO agent_api_keys (key_hash, key_prefix, agent_name, agent_email, markup_pct, markup_fixed_cents)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .bind(
      hash,
      prefix,
      body.agent_name,
      body.agent_email ?? null,
      body.markup_pct ?? null,
      body.markup_fixed_cents ?? null
    )
    .run();

  return json({
    api_key: raw,
    prefix,
    agent_name: body.agent_name,
    warning: 'Store this key securely — it cannot be retrieved again.',
  }, 201);
}

// PUT /admin/api-keys/:id
export async function handleUpdateAgentKey(
  keyId: string,
  request: Request,
  env: Env
): Promise<Response> {
  let body: Partial<{
    is_active: number;
    markup_pct: number | null;
    markup_fixed_cents: number | null;
    agent_name: string;
    agent_email: string | null;
  }>;
  try {
    body = await request.json() as typeof body;
  } catch {
    return err('Invalid JSON body');
  }

  const key = await env.DB
    .prepare('SELECT * FROM agent_api_keys WHERE id = ?')
    .bind(keyId)
    .first<{ id: string; is_active: number; markup_pct: number | null; markup_fixed_cents: number | null; agent_name: string; agent_email: string | null }>();

  if (!key) return err('API key not found', 404);

  const updated = {
    is_active: body.is_active !== undefined ? body.is_active : key.is_active,
    markup_pct: body.markup_pct !== undefined ? body.markup_pct : key.markup_pct,
    markup_fixed_cents: body.markup_fixed_cents !== undefined ? body.markup_fixed_cents : key.markup_fixed_cents,
    agent_name: body.agent_name ?? key.agent_name,
    agent_email: body.agent_email !== undefined ? body.agent_email : key.agent_email,
  };

  await env.DB
    .prepare(`
      UPDATE agent_api_keys
      SET is_active = ?, markup_pct = ?, markup_fixed_cents = ?, agent_name = ?, agent_email = ?
      WHERE id = ?
    `)
    .bind(updated.is_active, updated.markup_pct, updated.markup_fixed_cents, updated.agent_name, updated.agent_email, keyId)
    .run();

  return json({ id: keyId, ...updated });
}

// DELETE /admin/api-keys/:id
export async function handleDeleteApiKey(
  keyId: string,
  env: Env
): Promise<Response> {
  const key = await env.DB
    .prepare('SELECT id FROM agent_api_keys WHERE id = ?')
    .bind(keyId)
    .first<{ id: string }>();

  if (!key) return err('API key not found', 404);

  await env.DB
    .prepare('UPDATE agent_api_keys SET is_active = 0 WHERE id = ?')
    .bind(keyId)
    .run();

  return json({ id: keyId, status: 'deactivated' });
}
