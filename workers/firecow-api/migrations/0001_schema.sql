-- FireCow D1 Schema
-- Migration 0001: Initial schema

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_whatsapp TEXT,
  location TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tours (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- fishing | catamaran | diving | snorkeling | surfing | etc
  description TEXT,
  duration TEXT,
  max_capacity INTEGER DEFAULT 12,
  base_price INTEGER NOT NULL DEFAULT 0, -- in cents USD
  high_season_price INTEGER,
  stripe_product_id TEXT,
  hero_image_url TEXT,
  gallery_images TEXT DEFAULT '[]', -- JSON array of image URLs
  what_is_included TEXT DEFAULT '[]', -- JSON array of strings
  what_to_bring TEXT DEFAULT '[]',   -- JSON array
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  slug TEXT NOT NULL UNIQUE, -- e.g. isla-tortuga-costa-rica
  domain TEXT,              -- custom domain if set
  cf_project_name TEXT,     -- Cloudflare Pages project name
  cf_deploy_hook TEXT,      -- Cloudflare Pages deploy hook URL
  supplier_id TEXT REFERENCES suppliers(id),
  tour_ids TEXT DEFAULT '[]', -- JSON array of tour UUIDs featured on this site
  tagline TEXT,
  primary_color TEXT DEFAULT '#0ea5e9',
  meta_title TEXT,
  meta_description TEXT,
  whatsapp_number TEXT,
  is_live INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tour_id TEXT NOT NULL REFERENCES tours(id),
  site_id TEXT REFERENCES sites(id),
  stripe_payment_intent_id TEXT UNIQUE,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  booking_date TEXT,
  party_size INTEGER DEFAULT 1,
  total_amount INTEGER NOT NULL, -- in cents
  status TEXT DEFAULT 'pending', -- pending | confirmed | refunded | cancelled
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tours_supplier ON tours(supplier_id);
CREATE INDEX IF NOT EXISTS idx_tours_slug ON tours(slug);
CREATE INDEX IF NOT EXISTS idx_sites_slug ON sites(slug);
CREATE INDEX IF NOT EXISTS idx_bookings_tour ON bookings(tour_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe ON bookings(stripe_payment_intent_id);
