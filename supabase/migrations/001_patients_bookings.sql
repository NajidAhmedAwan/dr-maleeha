-- KNOWN GAP: anon SELECT on all rows. Closed in Batch 7b when dashboard auth is added.

-- ── MAL number sequence ──────────────────────────────────────────────────────
-- Using a Postgres sequence (not SELECT MAX) for concurrency safety.
-- A sequence guarantees each concurrent INSERT gets a unique increment with
-- no TOCTOU window. Advisory locks would work too but sequences are simpler.
CREATE SEQUENCE IF NOT EXISTS mal_number_seq START 1;

-- ── Patients ─────────────────────────────────────────────────────────────────
CREATE TABLE patients (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  mal_number  text        NOT NULL UNIQUE,
  name        text        NOT NULL,
  phone       text        NOT NULL UNIQUE, -- Pakistan format +92XXXXXXXXXX
  email       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_patients_phone      ON patients (phone);
CREATE INDEX idx_patients_mal_number ON patients (mal_number);

-- ── Bookings ─────────────────────────────────────────────────────────────────
CREATE TABLE bookings (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          uuid        NOT NULL REFERENCES patients (id),
  city                text        NOT NULL,   -- 'karachi' | 'islamabad' | 'online'
  procedure           text        NOT NULL,   -- slug e.g. 'botox', 'consultation'
  booking_datetime    timestamptz NOT NULL,
  status              text        NOT NULL DEFAULT 'pending',
                        -- 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled'
  deposit_amount_pkr  integer,               -- null until Batch 7c
  notes               text,                  -- patient's concern
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_patient_id       ON bookings (patient_id);
CREATE INDEX idx_bookings_booking_datetime ON bookings (booking_datetime);
CREATE INDEX idx_bookings_status           ON bookings (status);

-- ── MAL number generation ─────────────────────────────────────────────────────
-- Called via supabase.rpc('generate_mal_number').
-- Uses mal_number_seq for safe concurrent increments; pads to 4 digits.
CREATE OR REPLACE FUNCTION generate_mal_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_val bigint;
BEGIN
  next_val := nextval('mal_number_seq');
  RETURN 'MAL-' || lpad(next_val::text, 4, '0');
END;
$$;

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- patients: anon can insert new rows
CREATE POLICY "anon_insert_patients"
  ON patients FOR INSERT
  TO anon
  WITH CHECK (true);

-- patients: anon can read all rows (KNOWN GAP — closed in Batch 7b)
CREATE POLICY "anon_select_patients"
  ON patients FOR SELECT
  TO anon
  USING (true);

-- bookings: anon can insert new rows
CREATE POLICY "anon_insert_bookings"
  ON bookings FOR INSERT
  TO anon
  WITH CHECK (true);

-- bookings: anon can read all rows (KNOWN GAP — closed in Batch 7b)
CREATE POLICY "anon_select_bookings"
  ON bookings FOR SELECT
  TO anon
  USING (true);
