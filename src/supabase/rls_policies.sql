-- ============================================================
-- PRODUCTION RLS POLICIES — Supabase-Native Auth
-- Uses auth.uid() and auth.jwt() from real Supabase sessions
-- All frontend queries now carry valid JWTs → RLS works
-- ============================================================

-- ── Enable RLS on all tables ──────────────────────────────────
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_accounts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_verifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_records         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_gateways      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_flags            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violation_appeals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs            ENABLE ROW LEVEL SECURITY;

-- ── Helper functions ──────────────────────────────────────────

-- Returns the email of the currently authenticated Supabase user
CREATE OR REPLACE FUNCTION public.auth_email()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'email',
    (SELECT email FROM auth.users WHERE id = auth.uid())
  );
$$;

-- Returns true if the current user has admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- ── DROP all old policies to avoid conflicts ──────────────────
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (email = public.auth_email() OR public.is_admin());

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (email = public.auth_email() OR public.is_admin());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (email = public.auth_email() OR public.is_admin());

CREATE POLICY "profiles_delete_admin" ON public.profiles
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- CHALLENGE ACCOUNTS
-- ============================================================
CREATE POLICY "accounts_select_own" ON public.challenge_accounts
  FOR SELECT USING (user_email = public.auth_email() OR public.is_admin());

CREATE POLICY "accounts_insert_admin" ON public.challenge_accounts
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "accounts_update_admin" ON public.challenge_accounts
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "accounts_delete_admin" ON public.challenge_accounts
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- ORDERS
-- ============================================================
CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT USING (email = public.auth_email() OR public.is_admin());

CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT WITH CHECK (email = public.auth_email() OR public.is_admin());

CREATE POLICY "orders_update_admin" ON public.orders
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "orders_delete_admin" ON public.orders
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- WITHDRAWAL REQUESTS
-- ============================================================
CREATE POLICY "withdrawals_select_own" ON public.withdrawal_requests
  FOR SELECT USING (user_email = public.auth_email() OR public.is_admin());

CREATE POLICY "withdrawals_insert_own" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (user_email = public.auth_email() OR public.is_admin());

CREATE POLICY "withdrawals_update_admin" ON public.withdrawal_requests
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "withdrawals_delete_admin" ON public.withdrawal_requests
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- AFFILIATE PROFILES
-- ============================================================
CREATE POLICY "affiliates_select_own" ON public.affiliate_profiles
  FOR SELECT USING (user_email = public.auth_email() OR public.is_admin());

CREATE POLICY "affiliates_insert_own" ON public.affiliate_profiles
  FOR INSERT WITH CHECK (user_email = public.auth_email() OR public.is_admin());

CREATE POLICY "affiliates_update_own" ON public.affiliate_profiles
  FOR UPDATE USING (user_email = public.auth_email() OR public.is_admin());

CREATE POLICY "affiliates_delete_admin" ON public.affiliate_profiles
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- AFFILIATE COMMISSIONS
-- ============================================================
CREATE POLICY "commissions_select_own" ON public.affiliate_commissions
  FOR SELECT USING (affiliate_email = public.auth_email() OR public.is_admin());

CREATE POLICY "commissions_insert_admin" ON public.affiliate_commissions
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "commissions_update_admin" ON public.affiliate_commissions
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "commissions_delete_admin" ON public.affiliate_commissions
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- KYC VERIFICATIONS
-- ============================================================
CREATE POLICY "kyc_select_own" ON public.kyc_verifications
  FOR SELECT USING (user_email = public.auth_email() OR public.is_admin());

CREATE POLICY "kyc_insert_own" ON public.kyc_verifications
  FOR INSERT WITH CHECK (user_email = public.auth_email() OR public.is_admin());

CREATE POLICY "kyc_update_own" ON public.kyc_verifications
  FOR UPDATE USING (user_email = public.auth_email() OR public.is_admin());

CREATE POLICY "kyc_delete_admin" ON public.kyc_verifications
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- SUPPORT TICKETS
-- ============================================================
CREATE POLICY "tickets_select_own" ON public.support_tickets
  FOR SELECT USING (user_email = public.auth_email() OR public.is_admin());

CREATE POLICY "tickets_insert_own" ON public.support_tickets
  FOR INSERT WITH CHECK (user_email = public.auth_email() OR public.is_admin());

CREATE POLICY "tickets_update_own" ON public.support_tickets
  FOR UPDATE USING (user_email = public.auth_email() OR public.is_admin());

CREATE POLICY "tickets_delete_admin" ON public.support_tickets
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- SUPPORT MESSAGES
-- ============================================================
CREATE POLICY "messages_select" ON public.support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id
      AND (t.user_email = public.auth_email() OR public.is_admin())
    )
  );

CREATE POLICY "messages_insert" ON public.support_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id
      AND (t.user_email = public.auth_email() OR public.is_admin())
    )
  );

-- ============================================================
-- CERTIFICATES
-- ============================================================
CREATE POLICY "certs_select_own" ON public.certificates
  FOR SELECT USING (user_email = public.auth_email() OR public.is_admin());

CREATE POLICY "certs_insert_admin" ON public.certificates
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "certs_update_admin" ON public.certificates
  FOR UPDATE USING (public.is_admin());

-- ============================================================
-- TRADE RECORDS
-- ============================================================
CREATE POLICY "trades_select_own" ON public.trade_records
  FOR SELECT USING (user_email = public.auth_email() OR public.is_admin());

CREATE POLICY "trades_insert_admin" ON public.trade_records
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "trades_update_admin" ON public.trade_records
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "trades_delete_admin" ON public.trade_records
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- PAYMENT LOGS (admin only)
-- ============================================================
CREATE POLICY "payment_logs_admin" ON public.payment_logs
  FOR ALL USING (public.is_admin());

-- ============================================================
-- COUPONS (read for all authenticated, write admin only)
-- ============================================================
CREATE POLICY "coupons_select_auth" ON public.coupons
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "coupons_write_admin" ON public.coupons
  FOR ALL USING (public.is_admin());

-- ============================================================
-- NOTIFICATIONS (read for authenticated users, write admin)
-- ============================================================
CREATE POLICY "notifications_select_auth" ON public.notifications
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "notifications_write_admin" ON public.notifications
  FOR ALL USING (public.is_admin());

-- ============================================================
-- PLATFORM SETTINGS (read all auth, write admin)
-- ============================================================
CREATE POLICY "settings_select_auth" ON public.platform_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "settings_write_admin" ON public.platform_settings
  FOR ALL USING (public.is_admin());

-- ============================================================
-- PAYMENT GATEWAYS (admin only — contains API keys)
-- ============================================================
CREATE POLICY "gateways_admin" ON public.payment_gateways
  FOR ALL USING (public.is_admin());

-- ============================================================
-- RISK FLAGS (admin only)
-- ============================================================
CREATE POLICY "risk_flags_select_own" ON public.risk_flags
  FOR SELECT USING (user_email = public.auth_email() OR public.is_admin());

CREATE POLICY "risk_flags_write_admin" ON public.risk_flags
  FOR ALL USING (public.is_admin());

-- ============================================================
-- VIOLATION APPEALS
-- ============================================================
CREATE POLICY "appeals_select_own" ON public.violation_appeals
  FOR SELECT USING (user_email = public.auth_email() OR public.is_admin());

CREATE POLICY "appeals_insert_own" ON public.violation_appeals
  FOR INSERT WITH CHECK (user_email = public.auth_email() OR public.is_admin());

CREATE POLICY "appeals_update_admin" ON public.violation_appeals
  FOR UPDATE USING (public.is_admin());

-- ============================================================
-- DEVICE LOGS
-- ============================================================
CREATE POLICY "device_logs_select_own" ON public.device_logs
  FOR SELECT USING (user_email = public.auth_email() OR public.is_admin());

CREATE POLICY "device_logs_insert" ON public.device_logs
  FOR INSERT WITH CHECK (user_email = public.auth_email() OR public.is_admin());

CREATE POLICY "device_logs_admin" ON public.device_logs
  FOR UPDATE USING (public.is_admin());

-- ============================================================
-- AUDIT LOGS (admin read only)
-- ============================================================
CREATE POLICY "audit_logs_admin" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (true); -- inserted by triggers/backend only

-- ============================================================
-- AUDIT LOG FUNCTION (fixed — no duplicate ip_address column)
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_audit(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_email, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent
  ) VALUES (
    public.auth_email(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_data,
    p_new_data,
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$$;

-- ============================================================
-- REALTIME — enable for key tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawal_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_commissions;

-- ============================================================
-- UPDATED_AT auto-trigger (idempotent)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','challenge_accounts','orders','withdrawal_requests',
    'affiliate_profiles','kyc_verifications','support_tickets','certificates'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%I;
       CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      t, t, t, t
    );
  END LOOP;
END $$;