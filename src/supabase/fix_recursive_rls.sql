-- ============================================================
-- FIX: Recursive RLS + SECURITY DEFINER search_path issue
-- ROOT CAUSE: is_admin() queried public.profiles which itself
--             has RLS policies calling is_admin() → infinite loop
--             causing "Database error querying schema" on signInWithPassword
--
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================

-- ── Fix 1: auth_email() — pure JWT, no table query, safe search_path ──
CREATE OR REPLACE FUNCTION public.auth_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'email',
    (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())
  );
$$;

-- ── Fix 2: is_admin() — read ONLY from JWT metadata, NEVER from public.profiles ──
-- Reading from public.profiles caused recursive RLS evaluation:
--   profiles RLS → is_admin() → reads profiles → profiles RLS → is_admin() → ...
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

-- ── Fix 3: Also fix the old is_admin() in schema.sql if it still exists ──
-- The schema.sql version queried public.profiles — replace it safely
-- (this is a no-op if already replaced above, but ensures the plpgsql version is gone)
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

-- ── Fix 4: Fix current_user_email() from schema.sql ──
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.jwt() ->> 'email';
$$;

-- ── Fix 5: Fix update_updated_at_column() — add safe search_path ──
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

-- ── Fix 6: Fix set_updated_at() — add safe search_path ──
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

-- ── Fix 7: Fix log_audit() — safe search_path ──
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

-- ── Verification: confirm functions no longer reference public.profiles ──
SELECT
  p.proname AS function_name,
  p.prosecdef AS security_definer,
  p.proconfig AS search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('is_admin', 'auth_email', 'current_user_email', 'update_updated_at_column', 'set_updated_at');