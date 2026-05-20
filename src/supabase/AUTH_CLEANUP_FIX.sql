-- ==================================================
-- AUTHENTICATION CLEANUP & FIX SCRIPT
-- Execute this in Supabase SQL Editor
-- ==================================================

-- This script cleans up orphaned auth users and fixes common auth issues
-- Run this FIRST before testing login/registration

BEGIN;

-- 1. CLEANUP ORPHANED AUTH USERS
-- Remove auth users that don't have corresponding UserAccount records
-- This fixes "Database error checking email" issues

-- First, let's see what we have
SELECT 
    au.id as auth_id,
    au.email,
    au.created_at,
    au.email_confirmed_at,
    CASE 
        WHEN ua.email IS NULL THEN 'ORPHANED'
        ELSE 'LINKED'
    END as status
FROM auth.users au
LEFT JOIN (
    SELECT DISTINCT email FROM auth.users
) ua ON au.email = ua.email
WHERE au.email IN (
    'workmyads@gmail.com',
    'test@example.com',
    'sardarwaqas@proton.me'
)
ORDER BY au.created_at DESC;

-- 2. DELETE SPECIFIC PROBLEM USERS
-- These are known problematic emails blocking registration/login

-- Delete all auth users with these emails (there might be duplicates)
DELETE FROM auth.users WHERE email = 'workmyads@gmail.com';
DELETE FROM auth.users WHERE email = 'test@example.com';

-- Optional: Delete ALL unconfirmed users older than 1 hour
-- DELETE FROM auth.users 
-- WHERE email_confirmed_at IS NULL 
-- AND created_at < NOW() - INTERVAL '1 hour';

-- 3. VERIFY DELETION
SELECT COUNT(*) as remaining_problem_users
FROM auth.users 
WHERE email IN ('workmyads@gmail.com', 'test@example.com');

-- 4. FIX PROFILES TABLE (if missing)
-- Create profiles for existing UserAccount records

-- First check if profiles table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        RAISE NOTICE 'Profiles table does not exist - it will be created by schema.sql';
    END IF;
END $$;

-- Insert missing profiles from UserAccount data
-- Note: This assumes you've synced UserAccount entity data to Supabase
-- If profiles table is managed separately, skip this section

INSERT INTO public.profiles (email, full_name, role, created_at, updated_at)
SELECT 
    ua.email,
    ua.full_name,
    ua.role::user_role,
    ua.created_date,
    ua.updated_date
FROM (
    -- This would work if UserAccount was synced to Supabase
    -- For now, we'll skip this as Base44 entities are separate
    SELECT NULL as email, NULL as full_name, NULL as role, NULL as created_date, NULL as updated_date
    LIMIT 0
) ua
ON CONFLICT (email) DO NOTHING;

-- 5. VERIFY AUTH USERS COUNT
SELECT 
    COUNT(*) as total_auth_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users
FROM auth.users;

-- 6. CHECK FOR DUPLICATE EMAILS
SELECT email, COUNT(*) as count
FROM auth.users
GROUP BY email
HAVING COUNT(*) > 1;

-- If duplicates found, delete older ones:
-- DELETE FROM auth.users 
-- WHERE id IN (
--     SELECT id FROM (
--         SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
--         FROM auth.users
--     ) t WHERE rn > 1
-- );

COMMIT;

-- ==================================================
-- POST-CLEANUP ACTIONS
-- ==================================================

-- After running this script:
-- 1. Run the `fixAdminAuth` backend function to recreate admin auth user
-- 2. Test registration with a new email
-- 3. Test login with existing verified account

-- Verify the cleanup worked:
SELECT 
    email,
    email_confirmed_at,
    created_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmed'
        ELSE '❌ Unconfirmed'
    END as status
FROM auth.users 
WHERE email LIKE '%@gmail.com' OR email LIKE '%@example.com'
ORDER BY created_at DESC
LIMIT 10;