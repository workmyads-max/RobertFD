-- Set admin role in app_metadata for your admin user
-- Replace the UUID below with your actual user UID

UPDATE auth.users 
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE id = 'ca5a5bd3-9e1d-4be8-bd20-0cc3bf2b86e1';

-- Verify it was set correctly
SELECT id, email, raw_app_meta_data, raw_user_meta_data 
FROM auth.users 
WHERE id = 'ca5a5bd3-9e1d-4be8-bd20-0cc3bf2b86e1';