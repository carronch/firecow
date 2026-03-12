import type { Env, AgentApiKey, TourWithAvailability, AvailableDate } from './types';
import { json, err, formatPrice, calcCommission } from './utils';

interface ToursQuery {
  type?: string;
  date_from?: string;
  date_to?: string;
  party_size?: number;
  location?: string;
}

export async function handleGetTours(
  url: URL,
  env: Env,
  agent: AgentApiKey
): Promise<Response> {
  const query: ToursQuery = {
    type: url.searchParams.get('type') ?? undefined,
    date_from: url.searchParams.get('date_from') ?? undefined,
    date_to: url.searchParams.get('date_to') ?? undefined,
    party_size: url.searchParams.has('party_size')
      ? parseInt(url.searchParams.get('party_size')!)
      : undefined,
    location: url.searchParams.get('location') ?? undefined,
  };

  // Default date range: tomorrow to +60 days
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const future = new Date(now);
  future.setDate(future.getDate() + 60);

  const dateFrom = query.date_from ?? tomorrow.toISOString().slice(0, 10);
  const dateTo = query.date_to ?? future.toISOString().slice(0, 10);

  // Build tour filter
  let tourWhere = 'WHERE t.is_active = 1';
  const tourParams: unknown[] = [];

  if (query.type && query.type !== 'any') {
    tourWhere += ' AND t.type = ?';
    tourParams.push(query.type);
  }

  if (query.location) {
    tourWhere += ' AND (s.location LIKE ? OR t.name LIKE ?)';
    tourParams.push(`%${query.location}%`, `%${query.location}%`);
  }

  const toursResult = await env.DB
    .prepare(`
      SELECT t.*, s.name as supplier_name, s.location as supplier_location
      FROM tours t
      JOIN suppliers s ON t.supplier_id = s.id
      ${tourWhere}
      ORDER BY t.name
    `)
    .bind(...tourParams)
    .all<TourWithAvailability & { supplier_name: string; supplier_location: string }>();

  if (!toursResult.results.length) {
    return json({ tours: [], total: 0, currency: 'USD', agent: agent.agent_name });
  }

  // Fetch availability for all tours in date range
  const tourIds = toursResult.results.map(t => t.id);
  const placeholders = tourIds.map(() => '?').join(', ');

  let availParams: unknown[] = [...tourIds, dateFrom, dateTo];
  if (query.party_size) {
    availParams = [...tourIds, dateFrom, dateTo, query.party_size];
  }

  const availQuery = `
    SELECT id, tour_id, date, time_slot, slots_total, slots_booked, price_override
    FROM tour_availability
    WHERE tour_id IN (${placeholders})
      AND date >= ?
      AND date <= ?
      AND is_blocked = 0
      ${query.party_size ? 'AND (slots_total - slots_booked) >= ?' : ''}
    ORDER BY date, time_slot
  `;

  const availResult = await env.DB
    .prepare(availQuery)
    .bind(...availParams)
    .all<{
      id: string;
      tour_id: string;
      date: string;
      time_slot: string | null;
      slots_total: number;
      slots_booked: number;
      price_override: number | null;
    }>();

  // Group availability by tour_id
  const availByTour = new Map<string, AvailableDate[]>();
  for (const row of availResult.results) {
    const base = row.price_override ?? toursResult.results.find(t => t.id === row.tour_id)?.base_price ?? 0;
    const { price_per_person } = calcCommission(base, 1, agent.markup_pct, agent.markup_fixed_cents);
    const slots_available = row.slots_total - row.slots_booked;

    const dateEntry: AvailableDate = {
      availability_id: row.id,
      date: row.date,
      time_slot: row.time_slot,
      slots_available,
      price_cents: price_per_person,
      price_display: `${formatPrice(price_per_person)} per person`,
    };

    if (!availByTour.has(row.tour_id)) {
      availByTour.set(row.tour_id, []);
    }
    availByTour.get(row.tour_id)!.push(dateEntry);
  }

  // Build response
  const tours = toursResult.results.map(t => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    type: t.type,
    description: t.description,
    duration: t.duration,
    max_capacity: t.max_capacity,
    base_price_display: formatPrice(t.base_price),
    hero_image_url: t.hero_image_url,
    what_is_included: parseJson(t.what_is_included as unknown as string, []),
    what_to_bring: parseJson(t.what_to_bring as unknown as string, []),
    supplier: {
      name: t.supplier_name,
      location: t.supplier_location,
    },
    available_dates: availByTour.get(t.id) ?? [],
  }));

  return json({
    tours,
    total: tours.length,
    currency: 'USD',
    agent: agent.agent_name,
    markup_applied_pct: agent.markup_pct ? `${(agent.markup_pct * 100).toFixed(0)}%` : null,
    date_range: { from: dateFrom, to: dateTo },
  });
}

export async function handleGetTourAvailability(
  tourId: string,
  url: URL,
  env: Env,
  agent: AgentApiKey
): Promise<Response> {
  const tour = await env.DB
    .prepare('SELECT id, name, base_price, max_capacity FROM tours WHERE id = ? AND is_active = 1')
    .bind(tourId)
    .first<{ id: string; name: string; base_price: number; max_capacity: number }>();

  if (!tour) return err('Tour not found', 404);

  const dateFrom = url.searchParams.get('date_from');
  const dateTo = url.searchParams.get('date_to');

  if (!dateFrom || !dateTo) {
    return err('date_from and date_to are required (YYYY-MM-DD)');
  }

  const { results } = await env.DB
    .prepare(`
      SELECT id, date, time_slot, slots_total, slots_booked, price_override, is_blocked
      FROM tour_availability
      WHERE tour_id = ? AND date >= ? AND date <= ?
      ORDER BY date, time_slot
    `)
    .bind(tourId, dateFrom, dateTo)
    .all<{
      id: string;
      date: string;
      time_slot: string | null;
      slots_total: number;
      slots_booked: number;
      price_override: number | null;
      is_blocked: number;
    }>();

  const availability = results.map(row => {
    const base = row.price_override ?? tour.base_price;
    const { price_per_person } = calcCommission(base, 1, agent.markup_pct, agent.markup_fixed_cents);
    return {
      availability_id: row.id,
      date: row.date,
      time_slot: row.time_slot,
      slots_total: row.slots_total,
      slots_booked: row.slots_booked,
      slots_available: row.slots_total - row.slots_booked,
      is_blocked: row.is_blocked === 1,
      price_cents: price_per_person,
      price_display: `${formatPrice(price_per_person)} per person`,
    };
  });

  return json({
    tour: { id: tour.id, name: tour.name },
    availability,
    date_range: { from: dateFrom, to: dateTo },
  });
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}
