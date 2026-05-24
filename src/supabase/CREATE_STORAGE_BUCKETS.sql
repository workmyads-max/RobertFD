-- ============================================================
-- CREATE ALL 6 STORAGE BUCKETS + POLICIES
-- Run this in Supabase SQL Editor (once)
-- ============================================================

-- ── 1. profile-pictures (public) ─────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;

-- ── 2. kyc-documents (private) ───────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false,
  20971520, -- 20MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 20971520;

-- ── 3. certificates (public) ─────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates',
  'certificates',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- ── 4. invoices (private) ────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760;

-- ── 5. support-attachments (private) ─────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support-attachments',
  'support-attachments',
  false,
  20971520, -- 20MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain', 'video/mp4']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 20971520;

-- ── 6. trading-screenshots (private) ─────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trading-screenshots',
  'trading-screenshots',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760;

-- ============================================================
-- STORAGE RLS POLICIES
-- ============================================================

-- ── profile-pictures (public read, auth upload) ───────────────
DROP POLICY IF EXISTS "Public read profile-pictures" ON storage.objects;
CREATE POLICY "Public read profile-pictures"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-pictures');

DROP POLICY IF EXISTS "Auth upload profile-pictures" ON storage.objects;
CREATE POLICY "Auth upload profile-pictures"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth update profile-pictures" ON storage.objects;
CREATE POLICY "Auth update profile-pictures"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile-pictures' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth delete own profile-pictures" ON storage.objects;
CREATE POLICY "Auth delete own profile-pictures"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-pictures' AND auth.uid() IS NOT NULL);

-- ── kyc-documents (private: owner + admin) ───────────────────
DROP POLICY IF EXISTS "Users manage own kyc-documents" ON storage.objects;
CREATE POLICY "Users manage own kyc-documents"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'kyc-documents' AND (
      (storage.foldername(name))[1] = (auth.jwt() ->> 'email')
      OR public.is_admin()
    )
  );

-- ── certificates (public read, admin write) ───────────────────
DROP POLICY IF EXISTS "Public read certificates" ON storage.objects;
CREATE POLICY "Public read certificates"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificates');

DROP POLICY IF EXISTS "Admin manage certificates" ON storage.objects;
CREATE POLICY "Admin manage certificates"
  ON storage.objects FOR ALL
  USING (bucket_id = 'certificates' AND public.is_admin());

-- ── invoices (owner + admin) ──────────────────────────────────
DROP POLICY IF EXISTS "Users manage own invoices" ON storage.objects;
CREATE POLICY "Users manage own invoices"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'invoices' AND (
      (storage.foldername(name))[1] = (auth.jwt() ->> 'email')
      OR public.is_admin()
    )
  );

-- ── support-attachments (owner + admin) ──────────────────────
DROP POLICY IF EXISTS "Users manage own support-attachments" ON storage.objects;
CREATE POLICY "Users manage own support-attachments"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'support-attachments' AND (
      (storage.foldername(name))[1] = (auth.jwt() ->> 'email')
      OR public.is_admin()
    )
  );

-- ── trading-screenshots (owner + admin) ──────────────────────
DROP POLICY IF EXISTS "Users manage own trading-screenshots" ON storage.objects;
CREATE POLICY "Users manage own trading-screenshots"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'trading-screenshots' AND (
      (storage.foldername(name))[1] = (auth.jwt() ->> 'email')
      OR public.is_admin()
    )
  );

-- ============================================================
-- VERIFY — run this SELECT after to confirm all 6 exist
-- ============================================================
-- SELECT id, name, public, file_size_limit FROM storage.buckets ORDER BY name;