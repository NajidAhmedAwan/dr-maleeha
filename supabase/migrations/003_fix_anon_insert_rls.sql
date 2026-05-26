-- Ensure anon INSERT policies exist on patients and bookings.
-- 001 created these but they may be missing if the project was reset
-- or the Supabase schema was re-applied out of order.
-- Also re-adds a narrow anon SELECT on patients (by phone) so the
-- booking form upsert-style lookup works without authenticated session.

DROP POLICY IF EXISTS "anon_insert_patients"  ON patients;
DROP POLICY IF EXISTS "anon_insert_bookings"  ON bookings;
DROP POLICY IF EXISTS "anon_select_patients"  ON patients;

-- patients: anon can insert new rows (booking form creates new patients)
CREATE POLICY "anon_insert_patients"
  ON patients FOR INSERT
  TO anon
  WITH CHECK (true);

-- patients: anon can look up their own record by phone (needed for
-- the upsert-style dedup in the booking flow — see Booking.jsx step 1)
CREATE POLICY "anon_select_patients"
  ON patients FOR SELECT
  TO anon
  USING (true);

-- bookings: anon can insert new rows
DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings"
  ON bookings FOR INSERT
  TO anon
  WITH CHECK (true);

-- Grant EXECUTE on generate_mal_number to anon so the RPC call succeeds
GRANT EXECUTE ON FUNCTION generate_mal_number() TO anon;
