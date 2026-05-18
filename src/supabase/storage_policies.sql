-- ==================================================
-- SUPABASE STORAGE POLICIES
-- ==================================================
-- Execute this AFTER creating the storage buckets in Supabase Dashboard
-- Go to Storage → Create bucket for each bucket below

-- ==================================================
-- 1. PROFILE PICTURES (public bucket)
-- ==================================================

-- Allow public read access to profile pictures
CREATE POLICY "Public Read Profile Pics" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-pictures');

-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "User Upload Profile Pics" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'email')
);

-- Allow users to update their own profile pictures
CREATE POLICY "User Update Profile Pics" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'email')
);

-- Allow users to delete their own profile pictures
CREATE POLICY "User Delete Profile Pics" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'email')
);

-- ==================================================
-- 2. KYC DOCUMENTS (private bucket)
-- ==================================================

-- Allow users to view their own KYC documents
CREATE POLICY "User View Own KYC" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'kyc-documents' 
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'email')
);

-- Allow users to upload their own KYC documents
CREATE POLICY "User Upload KYC" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'kyc-documents' 
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'email')
);

-- Allow admins to view all KYC documents
CREATE POLICY "Admin View All KYC" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'kyc-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = (auth.jwt() ->> 'email')::TEXT 
    AND role = 'admin'
  )
);

-- ==================================================
-- 3. CERTIFICATES (public bucket)
-- ==================================================

-- Allow public read access to certificates
CREATE POLICY "Public Read Certificates" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'certificates');

-- Allow admins to upload certificates
CREATE POLICY "Admin Upload Certificates" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'certificates' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = (auth.jwt() ->> 'email')::TEXT 
    AND role = 'admin'
  )
);

-- Allow admins to update/delete certificates
CREATE POLICY "Admin Manage Certificates" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'certificates' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = (auth.jwt() ->> 'email')::TEXT 
    AND role = 'admin'
  )
);

-- ==================================================
-- 4. INVOICES (private bucket)
-- ==================================================

-- Allow users to view their own invoices
CREATE POLICY "User View Own Invoices" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'invoices' 
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'email')
);

-- Allow admins to upload invoices
CREATE POLICY "Admin Upload Invoices" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'invoices' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = (auth.jwt() ->> 'email')::TEXT 
    AND role = 'admin'
  )
);

-- Allow admins to view all invoices
CREATE POLICY "Admin View All Invoices" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'invoices' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = (auth.jwt() ->> 'email')::TEXT 
    AND role = 'admin'
  )
);

-- ==================================================
-- 5. SUPPORT ATTACHMENTS (private bucket)
-- ==================================================

-- Allow users to view attachments for their own support tickets
CREATE POLICY "User View Support Attachments" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'support-attachments' 
  AND EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE id = (storage.foldername(name))[1]::UUID
    AND user_email = (auth.jwt() ->> 'email')::TEXT
  )
);

-- Allow users to upload attachments to their own support tickets
CREATE POLICY "User Upload Support Attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'support-attachments' 
  AND EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE id = (storage.foldername(name))[1]::UUID
    AND user_email = (auth.jwt() ->> 'email')::TEXT
  )
);

-- Allow admins to view all support attachments
CREATE POLICY "Admin View Support Attachments" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'support-attachments' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = (auth.jwt() ->> 'email')::TEXT 
    AND role = 'admin'
  )
);

-- Allow admins to upload support attachments
CREATE POLICY "Admin Upload Support Attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'support-attachments' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = (auth.jwt() ->> 'email')::TEXT 
    AND role = 'admin'
  )
);

-- ==================================================
-- 6. TRADING SCREENSHOTS (private bucket)
-- ==================================================

-- Allow users to view their own trading screenshots
CREATE POLICY "User View Trading Screenshots" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'trading-screenshots' 
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'email')
);

-- Allow users to upload their own trading screenshots
CREATE POLICY "User Upload Trading Screenshots" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'trading-screenshots' 
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'email')
);

-- Allow admins to view all trading screenshots
CREATE POLICY "Admin View Trading Screenshots" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'trading-screenshots' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = (auth.jwt() ->> 'email')::TEXT 
    AND role = 'admin'
  )
);

-- ==================================================
-- COMPLETION MESSAGE
-- ==================================================
-- Storage policies are now configured for all buckets
-- Users can only access their own files, admins have full access