-- Migration 0004b: Add calendar_url column to suppliers

ALTER TABLE suppliers ADD COLUMN calendar_url TEXT;
