/**
 * FireCow API Client
 * Fetches site/tour data from the Cloudflare Worker at build time.
 * Import this in Astro pages: import { getSiteBySlug, getTour } from '@firecow/api-client';
 */


const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.FIRECOW_API_URL)
  ?? 'https://firecow-api.firecowbooking.workers.dev';


export interface Tour {
  id: string;
  supplier_id: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  duration: string;
  max_capacity: number;
  base_price: number;        // in cents
  high_season_price: number; // in cents
  stripe_product_id: string;
  hero_image_url: string;
  gallery_images: string;    // JSON string — parse with JSON.parse()
  what_is_included: string;  // JSON string
  is_active: number;
}

export interface Site {
  id: string;
  slug: string;
  domain: string;
  cf_project_name: string;
  cf_deploy_hook: string;
  supplier_id: string;
  tour_ids: string;          // JSON string — array of tour IDs
  tagline: string;
  primary_color: string;
  meta_title: string;
  meta_description: string;
  whatsapp_number: string;
  is_live: number;
  tours?: Tour[];            // populated by getSiteBySlug
}

export interface Supplier {
  id: string;
  name: string;
  contact_email: string;
  contact_whatsapp: string;
  location: string;
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`FireCow API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

/** Fetch a site + its tours by slug (e.g. "isla-tortuga-costa-rica") */
export async function getSiteBySlug(slug: string): Promise<Site> {
  return apiFetch<Site>(`/api/sites/slug/${slug}`);
}

/** Fetch a tour by its URL slug */
export async function getTourBySlug(slug: string): Promise<Tour> {
  return apiFetch<Tour>(`/api/tours/slug/${slug}`);
}

/** Fetch all active tours, optionally filtered by type */
export async function getTours(type?: string): Promise<Tour[]> {
  const query = type ? `?type=${type}` : '';
  return apiFetch<Tour[]>(`/api/tours${query}`);
}

/** Fetch all sites */
export async function getSites(): Promise<Site[]> {
  return apiFetch<Site[]>('/api/sites');
}

/** Fetch all suppliers */
export async function getSuppliers(): Promise<Supplier[]> {
  return apiFetch<Supplier[]>('/api/suppliers');
}

/** Helper: parse gallery images from JSON string */
export function parseGallery(tour: Tour): string[] {
  try { return JSON.parse(tour.gallery_images ?? '[]'); } catch { return []; }
}

/** Helper: format price from cents to display string (e.g. 12000 → "$120") */
export function formatPrice(cents: number): string {
  return `$${Math.round(cents / 100)}`;
}
