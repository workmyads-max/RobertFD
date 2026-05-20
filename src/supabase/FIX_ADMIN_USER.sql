-- ============================================================
-- FIX ADMIN USER IN SUPABASE
-- Execute this in Supabase SQL Editor
-- ============================================================

-- 1. Check if admin profile exists
SELECT email, role, created_at FROM public.profiles 
WHERE email = 'workmyads@gmail.com';

-- 2. Update or create admin profile with correct role
INSERT INTO public.profiles (email, full_name, role, created_at, updated_at)
VALUES (
  'workmyads@gmail.com',
  'Admin User',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  full_name = 'Admin User',
  updated_at = NOW();

-- 3. Verify the update
SELECT email, role, full_name, updated_at FROM public.profiles 
WHERE email = 'workmyads@gmail.com';

-- 4. Check auth.users metadata (requires service role)
-- This will show if the auth user has admin role in metadata
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'role' as role_in_metadata,
  raw_user_meta_data->>'full_name' as full_name_in_metadata
FROM auth.users 
WHERE email = 'workmyads@gmail.com';

-- 5. Update auth user metadata to ensure admin role is set
UPDATE auth.users
SET 
  raw_user_meta_data = raw_user_meta_data || '{"role": "admin", "full_name": "Admin User"}'::jsonb,
  email_confirmed_at = NOW()
WHERE email = 'workmyads@gmail.com';

-- 6. Final verification
SELECT 
  u.email,
  u.raw_user_meta_data->>'role' as role,
  p.role as profile_role,
  u.email_confirmed_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.email = u.email
WHERE u.email = 'workmyads@gmail.com';