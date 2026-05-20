-- Run this in Supabase SQL Editor to fix the admin auth user issue
-- This deletes any orphaned auth.users entry and allows recreation

BEGIN;

-- First, find the conflicting user
SELECT id, email, created_at FROM auth.users WHERE email = 'workmyads@gmail.com';

-- Delete from auth.users (this will cascade to related tables)
DELETE FROM auth.users WHERE email = 'workmyads@gmail.com';

-- Also delete from public.profiles if exists
DELETE FROM public.profiles WHERE email = 'workmyads@gmail.com';

-- Verify deletion
SELECT COUNT(*) as remaining FROM auth.users WHERE email = 'workmyads@gmail.com';

COMMIT;

-- After running this, the fixAdminAuth function should work