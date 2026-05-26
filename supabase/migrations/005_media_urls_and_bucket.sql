-- Batch 9a.3 — media_urls column + booking-media storage bucket + RLS
-- Safe to re-run (all IF NOT EXISTS / ON CONFLICT DO NOTHING).

-- 1. Add media_urls column to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS media_urls TEXT;

-- 2. Create the booking-media storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('booking-media', 'booking-media', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Allow anon to upload files (needed for booking form without auth)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'anon can upload booking media'
  ) THEN
    CREATE POLICY "anon can upload booking media"
    ON storage.objects FOR INSERT
    TO anon
    WITH CHECK (bucket_id = 'booking-media');
  END IF;
END $$;

-- 4. Allow authenticated users (Dr. Maleeha) to view booking media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'auth can read booking media'
  ) THEN
    CREATE POLICY "auth can read booking media"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'booking-media');
  END IF;
END $$;
