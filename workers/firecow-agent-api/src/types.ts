export interface Env {
  DB: D1Database;
  ADMIN_KEY: string;
  ENVIRONMENT: string;
}

export interface AgentApiKey {
  id: string;
  key_hash: string;
  key_prefix: string;
  agent_name: string;
  agent_email: string | null;
  markup_pct: number | null;
  markup_fixed_cents: number | null;
  is_active: number;
  total_bookings: number;
  total_revenue: number;
  created_at: string;
  last_used_at: string | null;
}

export interface TourAvailability {
  id: string;
  tour_id: string;
  date: string;
  time_slot: string | null;
  slots_total: number;
  slots_booked: number;
  price_override: number | null;
  is_blocked: number;
  created_at: string;
}

export interface AvailableDate {
  availability_id: string;
  date: string;
  time_slot: string | null;
  slots_available: number;
  price_cents: number;
  price_display: string;
}

export interface TourWithAvailability {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  duration: string | null;
  max_capacity: number;
  base_price: number;
  high_season_price: number | null;
  hero_image_url: string | null;
  what_is_included: string;
  what_to_bring: string;
  is_active: number;
  supplier_id: string;
  supplier_name: string;
  supplier_location: string | null;
  available_dates: AvailableDate[];
}

export interface AgentBookingRequest {
  tour_id: string;
  availability_id: string;
  customer_email: string;
  customer_name: string;
  party_size: number;
  notes?: string;
}

export interface CommissionResult {
  price_per_person: number;
  total_amount: number;
  supplier_amount: number;
  agent_commission: number;
  markup_applied: string;
}
