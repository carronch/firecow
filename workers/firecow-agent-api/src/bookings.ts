import type { Env, AgentApiKey, AgentBookingRequest } from './types';
import { json, err, formatPrice, calcCommission } from './utils';

export async function handleCreateBooking(
  request: Request,
  env: Env,
  agent: AgentApiKey
): Promise<Response> {
  let body: AgentBookingRequest;
  try {
    body = await request.json() as AgentBookingRequest;
  } catch {
    return err('Invalid JSON body');
  }

  const { tour_id, availability_id, customer_email, customer_name, party_size, notes } = body;

  if (!tour_id) return err('tour_id is required');
  if (!availability_id) return err('availability_id is required');
  if (!customer_email) return err('customer_email is required');
  if (!customer_name) return err('customer_name is required');
  if (!party_size || party_size < 1) return err('party_size must be >= 1');

  // Fetch tour + availability in parallel
  const [tour, avail] = await Promise.all([
    env.DB
      .prepare('SELECT id, name, base_price, site_id FROM tours WHERE id = ? AND is_active = 1')
      .bind(tour_id)
      .first<{ id: string; name: string; base_price: number; site_id: string | null }>(),
    env.DB
      .prepare('SELECT * FROM tour_availability WHERE id = ? AND tour_id = ? AND is_blocked = 0')
      .bind(availability_id, tour_id)
      .first<{
        id: string;
        tour_id: string;
        date: string;
        time_slot: string | null;
        slots_total: number;
        slots_booked: number;
        price_override: number | null;
      }>(),
  ]);

  if (!tour) return err('Tour not found or inactive', 404);
  if (!avail) return err('Availability slot not found or blocked', 404);

  // Check slots before attempting the atomic update
  const slots_available = avail.slots_total - avail.slots_booked;
  if (slots_available < party_size) {
    return err(
      `Only ${slots_available} slot(s) available for this date. Requested ${party_size}.`,
      409
    );
  }

  // Calculate pricing
  const base_price = avail.price_override ?? tour.base_price;
  const { price_per_person, total_amount, supplier_amount, agent_commission, markup_applied } =
    calcCommission(base_price, party_size, agent.markup_pct, agent.markup_fixed_cents);

  const booking_id = crypto.randomUUID();

  // Atomic slot decrement — if 0 rows updated, another booking beat us to it
  const updateResult = await env.DB
    .prepare(`
      UPDATE tour_availability
      SET slots_booked = slots_booked + ?
      WHERE id = ? AND (slots_total - slots_booked) >= ?
    `)
    .bind(party_size, availability_id, party_size)
    .run();

  if (!updateResult.meta.changes || updateResult.meta.changes === 0) {
    return err('No slots available for this date — another booking took the last spot.', 409);
  }

  // Create booking
  await env.DB
    .prepare(`
      INSERT INTO bookings (
        id, tour_id, site_id, customer_email, customer_name,
        booking_date, party_size, total_amount, status, notes,
        source, agent_api_key_id, agent_markup_pct, agent_markup_fixed_cents,
        supplier_amount, agent_commission, availability_id, payment_deferred
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, 'agent', ?, ?, ?, ?, ?, ?, 1)
    `)
    .bind(
      booking_id,
      tour_id,
      tour.site_id ?? null,
      customer_email,
      customer_name,
      avail.date,
      party_size,
      total_amount,
      notes ?? null,
      agent.id,
      agent.markup_pct ?? null,
      agent.markup_fixed_cents ?? null,
      supplier_amount,
      agent_commission,
      availability_id
    )
    .run();

  // Update agent stats non-blocking
  env.DB
    .prepare(`
      UPDATE agent_api_keys
      SET total_bookings = total_bookings + 1,
          total_revenue = total_revenue + ?
      WHERE id = ?
    `)
    .bind(total_amount, agent.id)
    .run();

  return json({
    booking_id,
    status: 'confirmed',
    tour: { id: tour.id, name: tour.name },
    booking_date: avail.date,
    time_slot: avail.time_slot,
    party_size,
    pricing: {
      price_per_person_display: formatPrice(price_per_person),
      total_display: formatPrice(total_amount),
      total_cents: total_amount,
      markup_applied,
    },
    customer: { name: customer_name, email: customer_email },
    payment: 'deferred — collect payment from your client',
  }, 201);
}

export async function handleGetBooking(
  bookingId: string,
  env: Env,
  agent: AgentApiKey
): Promise<Response> {
  const booking = await env.DB
    .prepare(`
      SELECT b.*, t.name as tour_name
      FROM bookings b
      LEFT JOIN tours t ON b.tour_id = t.id
      WHERE b.id = ? AND b.agent_api_key_id = ?
    `)
    .bind(bookingId, agent.id)
    .first<Record<string, unknown>>();

  if (!booking) return err('Booking not found', 404);

  return json(formatBooking(booking));
}

export async function handleListBookings(
  url: URL,
  env: Env,
  agent: AgentApiKey
): Promise<Response> {
  const status = url.searchParams.get('status');
  let query = `
    SELECT b.*, t.name as tour_name
    FROM bookings b
    LEFT JOIN tours t ON b.tour_id = t.id
    WHERE b.agent_api_key_id = ?
  `;
  const params: unknown[] = [agent.id];

  if (status) {
    query += ' AND b.status = ?';
    params.push(status);
  }

  query += ' ORDER BY b.created_at DESC LIMIT 100';

  const { results } = await env.DB.prepare(query).bind(...params).all<Record<string, unknown>>();

  return json({
    bookings: results.map(formatBooking),
    total: results.length,
  });
}

export async function handleCancelBooking(
  bookingId: string,
  env: Env,
  agent: AgentApiKey
): Promise<Response> {
  const booking = await env.DB
    .prepare('SELECT id, status, availability_id, party_size FROM bookings WHERE id = ? AND agent_api_key_id = ?')
    .bind(bookingId, agent.id)
    .first<{ id: string; status: string; availability_id: string | null; party_size: number }>();

  if (!booking) return err('Booking not found', 404);
  if (booking.status !== 'pending' && booking.status !== 'confirmed') {
    return err(`Cannot cancel booking with status "${booking.status}"`, 409);
  }

  // Update status
  await env.DB
    .prepare('UPDATE bookings SET status = ? WHERE id = ?')
    .bind('cancelled', bookingId)
    .run();

  // Release slots if availability_id is set
  if (booking.availability_id) {
    env.DB
      .prepare('UPDATE tour_availability SET slots_booked = MAX(0, slots_booked - ?) WHERE id = ?')
      .bind(booking.party_size, booking.availability_id)
      .run();
  }

  return json({ booking_id: bookingId, status: 'cancelled' });
}

function formatBooking(b: Record<string, unknown>) {
  return {
    id: b.id,
    status: b.status,
    tour: { id: b.tour_id, name: b.tour_name },
    booking_date: b.booking_date,
    party_size: b.party_size,
    customer: { name: b.customer_name, email: b.customer_email },
    pricing: {
      total_display: formatPrice(b.total_amount as number),
      total_cents: b.total_amount,
      agent_commission_cents: b.agent_commission,
      supplier_amount_cents: b.supplier_amount,
    },
    source: b.source,
    notes: b.notes,
    created_at: b.created_at,
  };
}
