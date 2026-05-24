-- ============================================================
-- PRODUCTION BLOCKERS FIX
-- Run in Supabase SQL Editor
-- Fixes: risk_flag_type enum, payment_gateways UNIQUE constraint,
--        storage bucket policies, staff RBAC tables
-- ============================================================

-- ── 1. FIX payment_gateways UNIQUE constraint (fixes 42P10 ON CONFLICT error) ─
ALTER TABLE public.payment_gateways
  ADD CONSTRAINT IF NOT EXISTS payment_gateways_name_key UNIQUE(name);

-- ── 2. EXTEND risk_flag_type enum with all institutional risk types ────────────
-- Safe: ALTER TYPE ADD VALUE is idempotent in Postgres 14+ via IF NOT EXISTS
DO $$
BEGIN
  -- These are the types written by advancedRiskScoring and detectHFTAndArbitrage
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'martingale_grid' AND enumtypid = 'public.risk_flag_type'::regtype) THEN
    ALTER TYPE public.risk_flag_type ADD VALUE 'martingale_grid';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'hedge_abuse' AND enumtypid = 'public.risk_flag_type'::regtype) THEN
    ALTER TYPE public.risk_flag_type ADD VALUE 'hedge_abuse';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ultra_fast_scalping' AND enumtypid = 'public.risk_flag_type'::regtype) THEN
    ALTER TYPE public.risk_flag_type ADD VALUE 'ultra_fast_scalping';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'hft_detection' AND enumtypid = 'public.risk_flag_type'::regtype) THEN
    ALTER TYPE public.risk_flag_type ADD VALUE 'hft_detection';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'consistency_manipulation' AND enumtypid = 'public.risk_flag_type'::regtype) THEN
    ALTER TYPE public.risk_flag_type ADD VALUE 'consistency_manipulation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'overnight_violation' AND enumtypid = 'public.risk_flag_type'::regtype) THEN
    ALTER TYPE public.risk_flag_type ADD VALUE 'overnight_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'copy_trading_signal' AND enumtypid = 'public.risk_flag_type'::regtype) THEN
    ALTER TYPE public.risk_flag_type ADD VALUE 'copy_trading_signal';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'toxic_flow' AND enumtypid = 'public.risk_flag_type'::regtype) THEN
    ALTER TYPE public.risk_flag_type ADD VALUE 'toxic_flow';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'unusual_dd_behavior' AND enumtypid = 'public.risk_flag_type'::regtype) THEN
    ALTER TYPE public.risk_flag_type ADD VALUE 'unusual_dd_behavior';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'synthetic_arbitrage' AND enumtypid = 'public.risk_flag_type'::regtype) THEN
    ALTER TYPE public.risk_flag_type ADD VALUE 'synthetic_arbitrage';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'suspicious_lot_sizing' AND enumtypid = 'public.risk_flag_type'::regtype) THEN
    ALTER TYPE public.risk_flag_type ADD VALUE 'suspicious_lot_sizing';
  END IF;
END $$;

-- ── 3. EXTEND risk_flag_type to be text (fallback if enum approach fails) ──────
-- Alternative: if the enum approach is too restrictive, convert to TEXT
-- UNCOMMENT ONLY if the DO block above fails:
-- ALTER TABLE public.risk_flags ALTER COLUMN flag_type TYPE TEXT;

-- ── 4. ADD transaction_id index on payment_logs for idempotency checks ─────────
CREATE INDEX IF NOT EXISTS idx_payment_logs_transaction_id ON public.payment_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_processed ON public.payment_logs(processed);
CREATE INDEX IF NOT EXISTS idx_orders_transaction_id ON public.orders(transaction_id);

-- ── 5. ADD notes column to orders if not present (for manual crypto proof) ─────
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS proof_txid TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS proof_screenshot_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS proof_network TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS proof_submitted_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

-- ── 6. STORAGE BUCKET POLICIES ─────────────────────────────────────────────────
-- NOTE: Buckets must be created via Supabase Dashboard UI first (Storage tab)
-- Then run these policies:

-- profile-pictures (public bucket)
CREATE POLICY IF NOT EXISTS "Public read profile pictures"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-pictures');

CREATE POLICY IF NOT EXISTS "Authenticated users upload own profile picture"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Users update own profile picture"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile-pictures' AND auth.uid() IS NOT NULL);

-- kyc-documents (private)
CREATE POLICY IF NOT EXISTS "Users upload own KYC documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'kyc-documents' AND (auth.jwt() ->> 'email') IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Users view own KYC documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kyc-documents' AND (
    (storage.foldername(name))[1] = (auth.jwt() ->> 'email')
    OR public.is_admin()
  ));

CREATE POLICY IF NOT EXISTS "Admins manage KYC documents"
  ON storage.objects FOR ALL
  USING (bucket_id = 'kyc-documents' AND public.is_admin());

-- certificates (public)
CREATE POLICY IF NOT EXISTS "Public read certificates"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificates');

CREATE POLICY IF NOT EXISTS "Admin upload certificates"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'certificates' AND public.is_admin());

-- invoices (private)
CREATE POLICY IF NOT EXISTS "Users view own invoices"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'invoices' AND (
    (storage.foldername(name))[1] = (auth.jwt() ->> 'email')
    OR public.is_admin()
  ));

CREATE POLICY IF NOT EXISTS "Admin manage invoices"
  ON storage.objects FOR ALL
  USING (bucket_id = 'invoices' AND public.is_admin());

-- support-attachments (private)
CREATE POLICY IF NOT EXISTS "Users manage own support attachments"
  ON storage.objects FOR ALL
  USING (bucket_id = 'support-attachments' AND (
    (storage.foldername(name))[1] = (auth.jwt() ->> 'email')
    OR public.is_admin()
  ));

-- trading-screenshots (private)
CREATE POLICY IF NOT EXISTS "Users manage own trading screenshots"
  ON storage.objects FOR ALL
  USING (bucket_id = 'trading-screenshots' AND (
    (storage.foldername(name))[1] = (auth.jwt() ->> 'email')
    OR public.is_admin()
  ));

-- ── 7. REALTIME: add payment_logs to realtime publication ──────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'payment_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_logs;
  END IF;
END $$;

-- ── 8. STAFF RBAC: ensure tables exist (idempotent) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.staff_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role_name TEXT NOT NULL DEFAULT 'support_team',
  custom_role_id UUID,
  permissions TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_suspended BOOLEAN DEFAULT false,
  suspended_reason TEXT,
  suspended_at TIMESTAMPTZ,
  invited_by TEXT,
  last_login_at TIMESTAMPTZ,
  last_ip TEXT,
  last_device TEXT,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.staff_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_key TEXT UNIQUE NOT NULL,
  role_name TEXT NOT NULL,
  description TEXT,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  is_system_role BOOLEAN DEFAULT false,
  color TEXT DEFAULT '#8b5cf6',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.staff_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_email TEXT NOT NULL,
  staff_name TEXT,
  role_name TEXT,
  action TEXT NOT NULL,
  action_category TEXT,
  target_entity TEXT,
  target_id TEXT,
  target_user_email TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed system roles (idempotent)
INSERT INTO public.staff_roles (role_key, role_name, description, permissions, is_system_role, color) VALUES
('owner', 'Owner', 'Full access to everything', ARRAY['manage_users','manage_challenges','manage_payouts','manage_kyc','manage_risk','manage_affiliates','manage_support','manage_notifications','manage_settings','manage_payments','manage_coupons','manage_staff','manage_audit_logs'], true, '#FF5C00'),
('super_admin', 'Super Admin', 'Full access including staff management', ARRAY['manage_users','manage_challenges','manage_payouts','manage_kyc','manage_risk','manage_affiliates','manage_support','manage_notifications','manage_settings','manage_payments','manage_coupons','manage_staff','manage_audit_logs'], true, '#ef4444'),
('admin', 'Admin', 'Full access except staff management', ARRAY['manage_users','manage_challenges','manage_payouts','manage_kyc','manage_risk','manage_affiliates','manage_support','manage_notifications','manage_settings','manage_payments','manage_coupons','manage_audit_logs'], true, '#f97316'),
('risk_manager', 'Risk Manager', 'Risk, funded reviews, trader monitoring', ARRAY['manage_risk','manage_users'], true, '#8b5cf6'),
('finance_team', 'Finance Team', 'Payouts and payment management', ARRAY['manage_payouts','manage_payments'], true, '#10b981'),
('support_team', 'Support Team', 'Customer support tickets and live chat', ARRAY['manage_support'], true, '#3b82f6'),
('kyc_team', 'KYC Team', 'Identity verification and compliance', ARRAY['manage_kyc'], true, '#06b6d4'),
('affiliate_manager', 'Affiliate Manager', 'Affiliate program and IB management', ARRAY['manage_affiliates','manage_coupons'], true, '#f59e0b')
ON CONFLICT (role_key) DO UPDATE SET
  permissions = EXCLUDED.permissions,
  is_system_role = true,
  updated_at = NOW();

-- ── 9. VERIFICATION QUERIES (run separately to confirm fixes) ─────────────────
-- SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'payment_gateways';
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'public.risk_flag_type'::regtype ORDER BY enumsortorder;
-- SELECT COUNT(*) FROM public.staff_roles;