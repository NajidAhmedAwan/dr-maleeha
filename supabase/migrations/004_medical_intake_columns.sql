-- Batch 9a.1 — Medical intake columns on bookings
-- Adds structured intake fields collected during the booking flow.
-- RLS unchanged from 003_fix_anon_insert_rls.sql.
-- Safe to re-run (all ADD COLUMN IF NOT EXISTS).

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS date_of_birth        DATE,
  ADD COLUMN IF NOT EXISTS country              TEXT,
  ADD COLUMN IF NOT EXISTS country_other        TEXT,
  ADD COLUMN IF NOT EXISTS timezone             TEXT,
  ADD COLUMN IF NOT EXISTS appointment_type     TEXT
    CHECK (appointment_type IN ('initial', 'followup')),
  ADD COLUMN IF NOT EXISTS skin_concern         TEXT,
  ADD COLUMN IF NOT EXISTS previous_treatments  TEXT,
  ADD COLUMN IF NOT EXISTS medical_history      TEXT,
  ADD COLUMN IF NOT EXISTS on_medication        BOOLEAN,
  ADD COLUMN IF NOT EXISTS medication_list      TEXT,
  ADD COLUMN IF NOT EXISTS additional_notes     TEXT;
