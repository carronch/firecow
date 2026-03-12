import { z } from 'zod';
import type { Env } from '../types';

export const searchToursSchema = z.object({
  type: z.string().optional().describe("Tour type filter: catamaran, fishing, snorkeling, diving, kayaking, adventure, other"),
  location: z.string().optional().describe("Location keyword (e.g. 'Jacó', 'Manuel Antonio')"),
  date_from: z.string().optional().describe("Start date ISO format YYYY-MM-DD (default: tomorrow)"),
  date_to: z.string().optional().describe("End date ISO format YYYY-MM-DD (default: 60 days out)"),
  party_size: z.number().int().min(1).optional().describe("Number of people — filters out fully booked slots"),
});

export type SearchToursInput = z.infer<typeof searchToursSchema>;

interface TourRow {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  duration: string;
  max_capacity: number;
  base_price: number;
  what_is_included: string | null;
  supplier_name: string;
  supplier_location: string;
}

interface AvailRow {
  avail_id: string;
  tour_id: string;
  date: string;
  time_slot: string | null;
  slots_total: number;
  slots_booked: number;
  price_override: number | null;
}

export async function searchTours(
  input: SearchToursInput,
  env: Env,
  markupPct: number | null,
  markupFixedCents: number | null
): Promise<object> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateFrom = input.date_from ?? tomorrow.toISOString().slice(0, 10);

  const dateTo60 = new Date(tomorrow);
  dateTo60.setDate(dateTo60.getDate() + 60);
  const dateTo = input.date_to ?? dateTo60.toISOString().slice(0, 10);

  // Build tour query
  let tourSql = `
    SELECT t.id, t.name, t.slug, t.type, t.description, t.duration,
           t.max_capacity, t.base_price, t.what_is_included,
           s.name as supplier_name, s.location as supplier_location
    FROM tours t
    JOIN suppliers s ON s.id = t.supplier_id
    WHERE t.is_active = 1
  `;
  const tourBinds: (string | number)[] = [];

  if (input.type) {
    tourSql += ' AND t.type = ?';
    tourBinds.push(input.type);
  }
  if (input.location) {
    tourSql += ' AND (s.location LIKE ? OR t.name LIKE ?)';
    tourBinds.push(`%${input.location}%`, `%${input.location}%`);
  }

  const toursResult = await env.DB.prepare(tourSql).bind(...tourBinds).all<TourRow>();
  const tours = toursResult.results ?? [];

  if (tours.length === 0) return { tours: [] };

  // Fetch availability for matching tours in date range
  const tourIds = tours.map(t => t.id);
  const placeholders = tourIds.map(() => '?').join(',');

  let availSql = `
    SELECT id as avail_id, tour_id, date, time_slot, slots_total, slots_booked, price_override
    FROM tour_availability
    WHERE tour_id IN (${placeholders})
      AND date >= ? AND date <= ?
      AND is_blocked = 0
  `;
  const availBinds: (string | number)[] = [...tourIds, dateFrom, dateTo];

  if (input.party_size) {
    availSql += ' AND (slots_total - slots_booked) >= ?';
    availBinds.push(input.party_size);
  }

  availSql += ' ORDER BY date, time_slot';

  const availResult = await env.DB.prepare(availSql).bind(...availBinds).all<AvailRow>();
  const availRows = availResult.results ?? [];

  // Group availability by tour_id
  const availByTour = new Map<string, AvailRow[]>();
  for (const row of availRows) {
    if (!availByTour.has(row.tour_id)) availByTour.set(row.tour_id, []);
    availByTour.get(row.tour_id)!.push(row);
  }

  // Build response with markup applied
  const result = tours.map(t => {
    const basePerPerson = t.base_price;
    const pctFee = markupPct ? Math.round(basePerPerson * markupPct) : 0;
    const fixedFee = markupFixedCents ?? 0;
    const commission = Math.max(pctFee, fixedFee);
    const priceWithMarkup = basePerPerson + commission;

    const availDates = (availByTour.get(t.id) ?? []).map(a => {
      const slotBase = a.price_override ?? basePerPerson;
      const slotPct = markupPct ? Math.round(slotBase * markupPct) : 0;
      const slotFixed = markupFixedCents ?? 0;
      const slotCommission = Math.max(slotPct, slotFixed);
      const slotTotal = slotBase + slotCommission;

      return {
        availability_id: a.avail_id,
        date: a.date,
        time_slot: a.time_slot,
        slots_available: a.slots_total - a.slots_booked,
        price_per_person_cents: slotTotal,
        price_display: `$${Math.round(slotTotal / 100)} per person`,
      };
    });

    return {
      id: t.id,
      name: t.name,
      type: t.type,
      duration: t.duration,
      description: t.description,
      max_capacity: t.max_capacity,
      base_price_cents: priceWithMarkup,
      base_price_display: `$${Math.round(priceWithMarkup / 100)} per person`,
      what_is_included: t.what_is_included ? JSON.parse(t.what_is_included) : [],
      supplier: {
        name: t.supplier_name,
        location: t.supplier_location,
      },
      available_dates: availDates,
    };
  });

  return { tours: result };
}
