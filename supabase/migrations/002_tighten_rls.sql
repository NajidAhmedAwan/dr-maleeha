DROP POLICY IF EXISTS "anon_select_patients" ON patients;
DROP POLICY IF EXISTS "anon_select_bookings" ON bookings;

CREATE POLICY "auth_select_patients"
  ON patients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "auth_select_bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (true);
