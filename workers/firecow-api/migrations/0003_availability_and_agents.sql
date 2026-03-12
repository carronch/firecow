-- FireCow D1 Schema
-- Migration 0003: Tour availability slots + agent API keys + agent tracking on bookings

-- ── TOUR AVAILABILITY ─────────────────────────────────────────────────────────
-- Supplier-controlled slot inventory.
-- A row represents an openable date/time on a specific tour.
-- slots_booked is incremented atomically on each confirmed booking.

CREATE TABLE IF NOT EXISTS tour_availability (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tour_id      TEXT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  date         TEXT NOT NULL,         -- ISO date: "2025-12-20"
  time_slot    TEXT,                  -- e.g. "09:00", "14:00"; NULL = all-day
  slots_total  INTEGER NOT NULL DEFAULT 12,
  slots_booked INTEGER NOT NULL DEFAULT 0,
  price_override INTEGER,             -- in cents; NULL = use tour.base_price
  is_blocked   INTEGER NOT NULL DEFAULT 0, -- 1 = manually blocked by supplier
  created_at   TEXT DEFAULT (datetime('now'))
);

-- Unique constraint: one row per tour+date+timeslot combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_availability_unique
  ON tour_availability(tour_id, date, COALESCE(time_slot, ''));

CREATE INDEX IF NOT EXISTS idx_availability_tour_date
  ON tour_availability(tour_id, date);

CREATE INDEX IF NOT EXISTS idx_availability_date
  ON tour_availability(date);

-- ── AGENT API KEYS ────────────────────────────────────────────────────────────
-- One row per external agent / partner platform.
-- markup_pct and markup_fixed_cents are both optional (nullable).
-- Commission = MAX(base_price * markup_pct, markup_fixed_cents), or sum if both set.

CREATE TABLE IF NOT EXISTS agent_api_keys (
  id                   TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  key_hash             TEXT NOT NULL UNIQUE, -- SHA-256 of the raw key
  key_prefix           TEXT NOT NULL,        -- first 8 chars for display
  agent_name           TEXT NOT NULL,
  agent_email          TEXT,
  markup_pct           REAL,                 -- e.g. 0.15 for 15%
  markup_fixed_cents   INTEGER,              -- e.g. 2500 for $25 flat fee
  is_active            INTEGER NOT NULL DEFAULT 1,
  total_bookings       INTEGER NOT NULL DEFAULT 0,
  total_revenue        INTEGER NOT NULL DEFAULT 0, -- cumulative gross cents
  created_at           TEXT DEFAULT (datetime('now')),
  last_used_at         TEXT
);

CREATE INDEX IF NOT EXISTS idx_agent_keys_hash ON agent_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_agent_keys_prefix ON agent_api_keys(key_prefix);

-- ── EXTEND BOOKINGS TABLE ─────────────────────────────────────────────────────
-- Add agent tracking columns to the existing bookings table.
-- source distinguishes direct site bookings from agent/MCP bookings.
-- Amounts: total_amount = supplier_amount + agent_commission

ALTER TABLE bookings ADD COLUMN source TEXT DEFAULT 'direct';
  -- 'direct' | 'agent' | 'mcp'

ALTER TABLE bookings ADD COLUMN agent_api_key_id TEXT REFERENCES agent_api_keys(id);
ALTER TABLE bookings ADD COLUMN agent_markup_pct REAL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN agent_markup_fixed_cents INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN supplier_amount INTEGER DEFAULT 0;
  -- amount owed to supplier = base_price * party_size (cents)
ALTER TABLE bookings ADD COLUMN agent_commission INTEGER DEFAULT 0;
  -- FireCow's revenue = total_amount - supplier_amount (cents)
ALTER TABLE bookings ADD COLUMN availability_id TEXT REFERENCES tour_availability(id);
ALTER TABLE bookings ADD COLUMN payment_deferred INTEGER DEFAULT 0;
  -- 1 = agent booking where payment is collected by agent; 0 = Stripe collected upfront

CREATE INDEX IF NOT EXISTS idx_bookings_agent
  ON bookings(agent_api_key_id);

CREATE INDEX IF NOT EXISTS idx_bookings_availability
  ON bookings(availability_id);

CREATE INDEX IF NOT EXISTS idx_bookings_source
  ON bookings(source);
