import type { Env } from '../types';

export async function getTourCatalog(env: Env): Promise<string> {
  const result = await env.DB
    .prepare(`
      SELECT t.id, t.name, t.slug, t.type, t.description, t.duration,
             t.max_capacity, t.base_price, t.what_is_included,
             s.name as supplier_name, s.location as supplier_location
      FROM tours t
      JOIN suppliers s ON s.id = t.supplier_id
      WHERE t.is_active = 1
      ORDER BY s.location, t.name
    `)
    .all<{
      id: string; name: string; slug: string; type: string;
      description: string; duration: string; max_capacity: number;
      base_price: number; what_is_included: string | null;
      supplier_name: string; supplier_location: string;
    }>();

  const tours = (result.results ?? []).map(t => ({
    id: t.id,
    name: t.name,
    type: t.type,
    duration: t.duration,
    description: t.description,
    max_capacity: t.max_capacity,
    base_price_display: `$${Math.round(t.base_price / 100)} per person`,
    what_is_included: t.what_is_included ? JSON.parse(t.what_is_included) : [],
    supplier: { name: t.supplier_name, location: t.supplier_location },
  }));

  return JSON.stringify({ tours, total: tours.length, updated_at: new Date().toISOString() }, null, 2);
}
