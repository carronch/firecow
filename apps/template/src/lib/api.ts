/**
 * FireCow API helper — used in Astro SSR pages at request time.
 * Falls back gracefully so existing sites keep working during transition.
 */

const API_BASE = import.meta.env.FIRECOW_API_URL ?? 'https://firecow-api.firecowbooking.workers.dev';

export interface SiteData {
  id: string;
  slug: string;
  tagline: string;
  meta_title: string;
  meta_description: string;
  whatsapp_number: string;
  primary_color: string;
  is_live: number;
  tours: TourData[];
}

export interface TourData {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  duration: string;
  base_price: number;
  high_season_price: number;
  hero_image_url: string;
  gallery_images: string; // JSON string
  what_is_included: string;
}

export async function fetchSite(slug: string): Promise<SiteData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/sites/slug/${slug}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function getGallery(tour: TourData | null | undefined): string[] {
  try { return JSON.parse(tour?.gallery_images ?? '[]'); } catch { return []; }
}

export function displayPrice(cents: number): string {
  return `$${Math.round(cents / 100)}`;
}
