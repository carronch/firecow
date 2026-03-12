import { z } from 'zod';
import type { Env } from '../types';

export const getAvailabilitySchema = z.object({
  tour_id: z.string().describe("Tour ID to fetch availability for"),
  date_from: z.string().optional().describe("Start date YYYY-MM-DD (default: today)"),
  date_to: z.string().optional().describe("End date YYYY-MM-DD (default: 90 days out)"),
});

export type GetAvailabilityInput = z.infer<typeof getAvailabilitySchema>;

export async function getAvailability(
  input: GetAvailabilityInput,
  env: Env,
  markupPct: number | null,
  markupFixedCents: number | null
): Promise<object> {
  const today = new Date().toISOString().slice(0, 10);
  const date90 = new Date();
  date90.setDate(date90.getDate() + 90);
  const dateFrom = input.date_from ?? today;
  const dateTo = input.date_to ?? date90.toISOString().slice(0, 10);

  // Fetch tour
  const tour = await env.DB
    .prepare('SELECT id, name, base_price FROM tours WHERE id = ? AND is_active = 1')
    .bind(input.tour_id)
    .first<{ id: string; name: string; base_price: number }>();

  if (!tour) return { error: 'Tour not found or not active', tour_id: input.tour_id };

  const result = await env.DB
    .prepare(`
      SELECT id, date, time_slot, slots_total, slots_booked, price_override, is_blocked
      FROM tour_availability
      WHERE tour_id = ? AND date >= ? AND date <= ?
      ORDER BY date, time_slot
    `)
    .bind(input.tour_id, dateFrom, dateTo)
    .all<{
      id: string; date: string; time_slot: string | null;
      slots_total: number; slots_booked: number;
      price_override: number | null; is_blocked: number;
    }>();

  const slots = (result.results ?? []).map(row => {
    const base = row.price_override ?? tour.base_price;
    const pctFee = markupPct ? Math.round(base * markupPct) : 0;
    const fixedFee = markupFixedCents ?? 0;
    const commission = Math.max(pctFee, fixedFee);
    const total = base + commission;

    return {
      availability_id: row.id,
      date: row.date,
      time_slot: row.time_slot,
      slots_available: row.is_blocked ? 0 : Math.max(0, row.slots_total - row.slots_booked),
      slots_total: row.slots_total,
      is_blocked: row.is_blocked === 1,
      price_per_person_cents: total,
      price_display: `$${Math.round(total / 100)} per person`,
    };
  });

  return {
    tour_id: tour.id,
    tour_name: tour.name,
    date_from: dateFrom,
    date_to: dateTo,
    slots,
  };
}
