-- ==================================================
-- SUPABASE STORAGE POLICIES
-- Execute AFTER creating storage buckets in Dashboard
-- ==================================================
-- STEP 1: Create these 6 buckets manually in Supabase Dashboard:
--   Storage → Create bucket
--   1. profile-pictures (Public bucket)
--   2. kyc-documents (Private bucket)
--   3. certificates (Public bucket)
--   4. invoices (Private bucket)
--   5. support-attachments (Private bucket)
--   6. trading-screenshots (Private bucket)
-- ==================================================

-- ==================================================
-- PROFILE PICTURES (Public bucket)
-- ==================================================

-- Anyone can view profile pictures
CREATE POLICY "Public Read Profile Pics" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'profile-pictures');

-- Users can upload their own profile pictures
CREATE POLICY "User Upload Profile Pics" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'profile-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own profile pictures
CREATE POLICY "User Update Profile Pics" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'profile-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own profile pictures
CREATE POLICY "User Delete Profile Pics" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'profile-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ==================================================
-- KYC DOCUMENTS (Private bucket)
-- ==================================================

-- Users can view their own KYC documents
CREATE POLICY "User View Own KYC" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'kyc-documents' 
    AND auth.jwt() ->> 'email' = (storage.foldername(name))[1]
);

-- Admins can view all KYC documents
CREATE POLICY "Admin Read KYC" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'kyc-documents' 
    AND public.is_admin()
);

-- Users can upload their own KYC documents
CREATE POLICY "User Upload KYC" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'kyc-documents' 
    AND auth.jwt() ->> 'email' = (storage.foldername(name))[1]
);

-- Users can update their own KYC documents
CREATE POLICY "User Update KYC" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'kyc-documents' 
    AND auth.jwt() ->> 'email' = (storage.foldername(name))[1]
);

-- Users can delete their own KYC documents
CREATE POLICY "User Delete KYC" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'kyc-documents' 
    AND auth.jwt() ->> 'email' = (storage.foldername(name))[1]
);

-- ==================================================
-- CERTIFICATES (Public bucket)
-- ==================================================

-- Anyone can view certificates
CREATE POLICY "Public Read Certificates" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'certificates');

-- Admins can upload certificates
CREATE POLICY "Admin Upload Certificates" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'certificates' 
    AND public.is_admin()
);

-- Admins can update certificates
CREATE POLICY "Admin Update Certificates" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'certificates' 
    AND public.is_admin()
);

-- Admins can delete certificates
CREATE POLICY "Admin Delete Certificates" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'certificates' 
    AND public.is_admin()
);

-- ==================================================
-- INVOICES (Private bucket)
-- ==================================================

-- Users can view their own invoices
CREATE POLICY "User View Own Invoices" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'invoices' 
    AND auth.jwt() ->> 'email' = (storage.foldername(name))[1]
);

-- Admins can view all invoices
CREATE POLICY "Admin Read Invoices" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'invoices' 
    AND public.is_admin()
);

-- Admins can upload invoices
CREATE POLICY "Admin Upload Invoices" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'invoices' 
    AND public.is_admin()
);

-- ==================================================
-- SUPPORT ATTACHMENTS (Private bucket)
-- ==================================================

-- Users can view attachments on their own tickets
CREATE POLICY "User View Support Attachments" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'support-attachments' 
    AND EXISTS (
        SELECT 1 FROM public.support_tickets 
        WHERE support_tickets.user_email = auth.jwt() ->> 'email'
        AND (storage.foldername(name))[1] = support_tickets.ticket_id
    )
);

-- Admins can view all support attachments
CREATE POLICY "Admin View Support Attachments" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'support-attachments' 
    AND public.is_admin()
);

-- Users can upload attachments to their tickets
CREATE POLICY "User Upload Support Attachments" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'support-attachments' 
    AND EXISTS (
        SELECT 1 FROM public.support_tickets 
        WHERE support_tickets.user_email = auth.jwt() ->> 'email'
        AND (storage.foldername(name))[1] = support_tickets.ticket_id
    )
);

-- Admins can upload support attachments
CREATE POLICY "Admin Upload Support Attachments" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'support-attachments' 
    AND public.is_admin()
);

-- ==================================================
-- TRADING SCREENSHOTS (Private bucket)
-- ==================================================

-- Users can view their own trading screenshots
CREATE POLICY "User View Trading Screenshots" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'trading-screenshots' 
    AND auth.jwt() ->> 'email' = (storage.foldername(name))[1]
);

-- Users can upload their own trading screenshots
CREATE POLICY "User Upload Trading Screenshots" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'trading-screenshots' 
    AND auth.jwt() ->> 'email' = (storage.foldername(name))[1]
);

-- Users can delete their own trading screenshots
CREATE POLICY "User Delete Trading Screenshots" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'trading-screenshots' 
    AND auth.jwt() ->> 'email' = (storage.foldername(name))[1]
);

-- ==================================================
-- VERIFICATION QUERIES
-- ==================================================
-- Run these to verify your database setup
-- ==================================================

-- 1. Count all tables (should be 28)
SELECT COUNT(*) AS total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 2. List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 3. Count all RLS policies (should be 60+)
SELECT COUNT(*) AS total_policies 
FROM pg_policies 
WHERE schemaname = 'public';

-- 4. List RLS policies by table
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- 5. Count all indexes (should be 40+)
SELECT COUNT(*) AS total_indexes 
FROM pg_indexes 
WHERE schemaname = 'public';

-- 6. List all indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 7. Count all triggers (should be 12+)
SELECT COUNT(*) AS total_triggers 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- 8. List all triggers
SELECT trigger_name, event_object_table, action_timing, event_manipulation 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- 9. List all functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';

-- 10. List all enums
SELECT t.typname AS enum_name, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;

-- 11. Check realtime publication tables (should be 5)
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- 12. Verify RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 13. Check storage buckets (after creating them)
SELECT name, owner, public 
FROM storage.buckets 
ORDER BY name;

-- 14. Count storage policies (should be 20+)
SELECT COUNT(*) AS total_storage_policies 
FROM pg_policies 
WHERE schemaname = 'storage';

-- 15. Verify seed data
SELECT * FROM public.affiliate_settings WHERE setting_key = 'global_config';
SELECT * FROM public.social_media_settings WHERE setting_key = 'global';
SELECT * FROM public.platform_settings ORDER BY setting_key;

-- ==================================================
-- QUICK HEALTH CHECK
-- ==================================================
-- Run this for a quick summary
-- ==================================================

SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') AS tables,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') AS rls_policies,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') AS indexes,
    (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') AS triggers,
    (SELECT COUNT(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND prokind = 'f') AS functions,
    (SELECT COUNT(*) FROM pg_type WHERE typtype = 'e' AND typnamespace = 'public'::regnamespace) AS enums,
    (SELECT COUNT(*) FROM pg_publication_tables WHERE pubname = 'supabase_realtime') AS realtime_tables;

-- Expected results:
-- tables: 28
-- rls_policies: 60+
-- indexes: 40+
-- triggers: 12+
-- functions: 5+
-- enums: 20+
-- realtime_tables: 5