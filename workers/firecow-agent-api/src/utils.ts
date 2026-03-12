import type { CommissionResult } from './types';

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

export function err(message: string, status = 400): Response {
  return json({ error: message }, status);
}

export function formatPrice(cents: number): string {
  return '$' + (cents / 100).toFixed(0);
}

export async function hashKey(key: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(key));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Calculate agent commission on a booking.
 * markup_pct and markup_fixed_cents are both optional.
 * When both are set, takes the higher of the two.
 */
export function calcCommission(
  base_price_cents: number,
  party_size: number,
  markup_pct: number | null,
  markup_fixed_cents: number | null
): CommissionResult {
  const pct_amount = markup_pct ? Math.round(base_price_cents * markup_pct) : 0;
  const fixed_amount = markup_fixed_cents ?? 0;
  const markup_per_person = Math.max(pct_amount, fixed_amount);

  const price_per_person = base_price_cents + markup_per_person;
  const total_amount = price_per_person * party_size;
  const supplier_amount = base_price_cents * party_size;
  const agent_commission = total_amount - supplier_amount;

  let markup_applied = 'none';
  if (pct_amount > 0 && pct_amount >= fixed_amount) {
    markup_applied = `${((markup_pct ?? 0) * 100).toFixed(0)}%`;
  } else if (fixed_amount > 0) {
    markup_applied = `${formatPrice(fixed_amount)} flat`;
  }

  return { price_per_person, total_amount, supplier_amount, agent_commission, markup_applied };
}

export function generateApiKey(): { raw: string; prefix: string } {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = 'fc_live_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const prefix = raw.slice(0, 16);
  return { raw, prefix };
}
