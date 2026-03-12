export const API_BASE =
    (import.meta.env.FIRECOW_API_URL as string | undefined) ??
    'https://firecow-api.firecowbooking.workers.dev';

export const AGENT_API_BASE =
    (import.meta.env.AGENT_API_URL as string | undefined) ??
    'https://firecow-agent-api.firecowbooking.workers.dev';

export const AGENT_ADMIN_KEY =
    (import.meta.env.AGENT_ADMIN_KEY as string | undefined) ?? '';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, init);
    if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
    return res.json() as Promise<T>;
}

export interface Supplier {
    id: string;
    name: string;
    contact_email: string;
    contact_whatsapp: string;
    location: string;
}

export interface Tour {
    id: string;
    supplier_id: string;
    name: string;
    slug: string;
    type: string;
    description: string;
    duration: string;
    max_capacity: number;
    base_price: number;
    high_season_price: number;
    hero_image_url: string;
    gallery_images: string;
    is_active: number;
}

export interface Site {
    id: string;
    slug: string;
    domain: string;
    cf_project_name: string;
    cf_deploy_hook: string;
    supplier_id: string;
    tour_ids: string;
    tagline: string;
    primary_color: string;
    meta_title: string;
    meta_description: string;
    whatsapp_number: string;
    is_live: number;
}

export interface Booking {
    id: string;
    tour_id: string;
    site_id: string;
    stripe_payment_intent_id: string;
    customer_email: string;
    customer_name: string;
    booking_date: string;
    party_size: number;
    total_amount: number;
    status: 'confirmed' | 'refunded' | 'cancelled' | 'pending';
    notes: string;
    created_at: string;
}

export interface AnalyticsSummary {
    total_bookings: number;
    total_revenue_cents: number;
    confirmed_revenue_cents: number;
    confirmed_count: number;
    refunded_count: number;
    cancelled_count: number;
    pending_count: number;
}

export interface AnalyticsBySite {
    site_id: string;
    site_slug: string;
    booking_count: number;
    revenue_cents: number;
    confirmed_count: number;
    refunded_count: number;
}

export interface AnalyticsTrend {
    date: string;
    booking_count: number;
    revenue_cents: number;
}

export interface AnalyticsBySource {
    utm_source: string;
    booking_count: number;
    revenue_cents: number;
}

export type Period = '7d' | '30d' | '90d' | '360d' | 'all';

export const getSuppliers = () => apiFetch<Supplier[]>('/api/suppliers');
export const getTours = () => apiFetch<Tour[]>('/api/tours');
export const getSites = () => apiFetch<Site[]>('/api/sites');
export const getBookings = () => apiFetch<Booking[]>('/api/bookings');
export const getAnalyticsSummary = (period: Period = 'all') => apiFetch<AnalyticsSummary>(`/api/analytics/summary?period=${period}`);
export const getAnalyticsBySite = (period: Period = 'all') => apiFetch<AnalyticsBySite[]>(`/api/analytics/by-site?period=${period}`);
export const getAnalyticsTrends = (period: Period = '30d') => apiFetch<AnalyticsTrend[]>(`/api/analytics/trends?period=${period}`);
export const getAnalyticsBySource = (period: Period = 'all') => apiFetch<AnalyticsBySource[]>(`/api/analytics/by-source?period=${period}`);

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

export interface AgentApiKey {
    id: string;
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
