-- ============================================================
-- CRITICAL FIX: Supabase Auth "Database error querying schema"
-- ============================================================
-- ROOT CAUSE: The auth_email() function has a fallback that queries
-- auth.users table. During signInWithPassword, Supabase's internal
-- auth operations call this function BEFORE the auth session is fully
-- established, causing a recursive schema query failure.
--
-- The fix: Make auth_email() read ONLY from JWT (no table fallback)
-- and ensure all SECURITY DEFINER functions have search_path = ''
-- ============================================================

-- ── Fix 1: auth_email() — JWT ONLY, NO TABLE FALLBACK ──
CREATE OR REPLACE FUNCTION public.auth_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.jwt() ->> 'email';
$$;

-- ── Fix 2: is_admin() — JWT metadata ONLY ──
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- ── Fix 3: current_user_email() — JWT ONLY ──
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.jwt() ->> 'email';
$$;

-- ── Fix 4: All trigger functions with safe search_path ──
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ── Fix 5: log_audit() with safe search_path ──
CREATE OR REPLACE FUNCTION public.log_audit(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_email, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent
  ) VALUES (
    public.auth_email(),
    p_action,
    p_entity_type,
    p_entity_id::uuid,
    p_old_data,
    p_new_data,
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$$;

-- ── Fix 6: generate_unique_id() with safe search_path ──
CREATE OR REPLACE FUNCTION public.generate_unique_id(prefix TEXT, length INTEGER DEFAULT 8)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN prefix || '-' || upper(substring(md5(random()::text) from 1 for length));
END;
$$;

-- ── Fix 7: increment_coupon_uses() with safe search_path ──
CREATE OR REPLACE FUNCTION public.increment_coupon_uses(coupon_code TEXT, use_count INTEGER DEFAULT 1)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.coupons
  SET uses_count = uses_count + use_count
  WHERE code = coupon_code;
END;
$$;

-- ============================================================
-- VERIFICATION: Check all functions have safe search_path
-- ============================================================
SELECT
  p.proname AS function_name,
  p.prosecdef AS security_definer,
  p.proconfig AS search_path_config,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'is_admin', 'auth_email', 'current_user_email',
    'update_updated_at_column', 'set_updated_at', 'log_audit',
    'generate_unique_id', 'increment_coupon_uses'
  )
ORDER BY p.proname;

-- ============================================================
-- IMPORTANT NOTES:
-- ============================================================
-- 1. All SECURITY DEFINER functions MUST have search_path = ''
--    to prevent recursive schema queries during auth operations.
--
-- 2. auth_email() MUST NOT query auth.users table - only JWT.
--    The fallback caused the "Database error querying schema".
--
-- 3. is_admin() MUST read from JWT metadata only (app_metadata
--    or user_metadata), NOT from public.profiles table.
--
-- 4. After running this, test login with:
--    - Register a new user
--    - Verify OTP
--    - Call supabase.auth.signInWithPassword()
--    - Should succeed without "Database error querying schema"
-- ============================================================