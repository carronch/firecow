import { z } from 'zod';
import type { Env, AgentSession } from '../types';

export const createBookingSchema = z.object({
  tour_id: z.string().describe("Tour ID to book"),
  availability_id: z.string().describe("Availability slot ID from search_tours or get_availability"),
  customer_name: z.string().describe("Full name of the customer"),
  customer_email: z.string().email().describe("Customer email address"),
  party_size: z.number().int().min(1).describe("Number of people"),
  notes: z.string().optional().describe("Special requests or notes"),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export async function createBooking(
  input: CreateBookingInput,
  env: Env,
  session: AgentSession
): Promise<object> {
  // Fetch tour and availability in parallel
  const [tour, avail] = await Promise.all([
    env.DB.prepare('SELECT id, name, base_price FROM tours WHERE id = ? AND is_active = 1')
      .bind(input.tour_id)
      .first<{ id: string; name: string; base_price: number }>(),
    env.DB.prepare('SELECT * FROM tour_availability WHERE id = ? AND is_blocked = 0')
      .bind(input.availability_id)
      .first<{
        id: string; tour_id: string; date: string; time_slot: string | null;
        slots_total: number; slots_booked: number; price_override: number | null;
      }>(),
  ]);

  if (!tour) return { error: 'Tour not found or not active' };
  if (!avail) return { error: 'Availability slot not found or is blocked' };
  if (avail.tour_id !== input.tour_id) return { error: 'Availability slot does not belong to this tour' };
  if (avail.slots_total - avail.slots_booked < input.party_size) {
    return { error: `Not enough slots available. Available: ${avail.slots_total - avail.slots_booked}, requested: ${input.party_size}` };
  }

  // Calculate commission
  const basePrice = avail.price_override ?? tour.base_price;
  const pctFee = session.markup_pct ? Math.round(basePrice * session.markup_pct) : 0;
  const fixedFee = session.markup_fixed_cents ?? 0;
  const commissionPerPerson = Math.max(pctFee, fixedFee);
  const supplierAmount = basePrice * input.party_size;
  const totalAmount = (basePrice + commissionPerPerson) * input.party_size;
  const agentCommission = totalAmount - supplierAmount;

  // Atomic slot decrement — returns 0 rows if slot was just taken
  const updateResult = await env.DB
    .prepare(`
      UPDATE tour_availability
      SET slots_booked = slots_booked + ?
      WHERE id = ? AND (slots_total - slots_booked) >= ?
    `)
    .bind(input.party_size, input.availability_id, input.party_size)
    .run();

  if (!updateResult.meta.changes || updateResult.meta.changes === 0) {
    return { error: 'No slots available for this date — another booking just claimed the last spot.' };
  }

  // Insert booking
  const bookingId = crypto.randomUUID();
  await env.DB
    .prepare(`
      INSERT INTO bookings (
        id, tour_id, availability_id, customer_name, customer_email,
        party_size, total_amount, supplier_amount, agent_commission,
        agent_markup_pct, agent_markup_fixed_cents,
        booking_date, source, agent_api_key_id, payment_deferred, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'mcp', ?, 1, 'confirmed', ?)
    `)
    .bind(
      bookingId,
      input.tour_id,
      input.availability_id,
      input.customer_name,
      input.customer_email,
      input.party_size,
      totalAmount,
      supplierAmount,
      agentCommission,
      session.markup_pct ?? null,
      session.markup_fixed_cents ?? null,
      avail.date,
      session.agent_key_id,
      input.notes ?? null
    )
    .run();

  // Update agent stats non-blocking
  env.DB
    .prepare('UPDATE agent_api_keys SET total_bookings = total_bookings + 1, total_revenue = total_revenue + ? WHERE id = ?')
    .bind(totalAmount, session.agent_key_id)
    .run();

  return {
    booking_id: bookingId,
    status: 'confirmed',
    tour_name: tour.name,
    date: avail.date,
    time_slot: avail.time_slot,
    customer_name: input.customer_name,
    customer_email: input.customer_email,
    party_size: input.party_size,
    total_amount_display: `$${Math.round(totalAmount / 100)}`,
    payment_note: 'Payment deferred — collect from customer directly.',
  };
}
