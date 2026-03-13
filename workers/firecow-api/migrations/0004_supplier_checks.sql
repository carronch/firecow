-- Migration 0004: Supplier season availability checks

CREATE TABLE IF NOT EXISTS supplier_season_checks (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  check_date  TEXT NOT NULL,     -- ISO date: "2025-12-24"
  season_name TEXT,              -- "Christmas", NULL = generic date check
  status      TEXT NOT NULL DEFAULT 'unverified', -- available | unverified | full
  notes       TEXT,
  checked_at  TEXT DEFAULT (datetime('now')),
  checked_by  TEXT               -- admin email
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_supplier_checks_uniq
  ON supplier_season_checks(supplier_id, check_date);
