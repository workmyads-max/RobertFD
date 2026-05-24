-- ==================================================
-- STAFF RBAC SCHEMA
-- Institutional-grade Role-Based Access Control
-- Run in Supabase SQL Editor
-- ==================================================

-- ── ENUMS ──────────────────────────────────────────
CREATE TYPE IF NOT EXISTS staff_role_type AS ENUM (
  'owner', 'super_admin', 'admin', 'risk_manager',
  'finance_team', 'support_team', 'kyc_team', 'affiliate_manager', 'custom'
);

-- ── STAFF USERS TABLE ──────────────────────────────
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

-- ── ROLES TABLE ────────────────────────────────────
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

-- ── STAFF ACTIVITY LOGS ────────────────────────────
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

-- ── INDEXES ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_staff_members_email ON public.staff_members(user_email);
CREATE INDEX IF NOT EXISTS idx_staff_members_role ON public.staff_members(role_name);
CREATE INDEX IF NOT EXISTS idx_staff_activity_email ON public.staff_activity_logs(staff_email);
CREATE INDEX IF NOT EXISTS idx_staff_activity_action ON public.staff_activity_logs(action_category);
CREATE INDEX IF NOT EXISTS idx_staff_activity_created ON public.staff_activity_logs(created_at DESC);

-- ── UPDATED_AT TRIGGERS ────────────────────────────
CREATE TRIGGER update_staff_members_updated_at
  BEFORE UPDATE ON public.staff_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_roles_updated_at
  BEFORE UPDATE ON public.staff_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── RLS POLICIES ───────────────────────────────────
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_activity_logs ENABLE ROW LEVEL SECURITY;

-- Staff can view their own record
CREATE POLICY "Staff can view own record" ON public.staff_members
  FOR SELECT USING ((auth.jwt() ->> 'email')::TEXT = user_email);

-- Admins/owners can view all staff
CREATE POLICY "Admins can view all staff" ON public.staff_members
  FOR SELECT USING (public.is_admin());

-- Only admins can modify staff
CREATE POLICY "Admins can manage staff" ON public.staff_members
  FOR ALL USING (public.is_admin());

-- Everyone (authenticated) can view roles
CREATE POLICY "Authenticated can view roles" ON public.staff_roles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can manage roles
CREATE POLICY "Admins can manage roles" ON public.staff_roles
  FOR ALL USING (public.is_admin());

-- Admins can view all activity logs
CREATE POLICY "Admins can view activity logs" ON public.staff_activity_logs
  FOR SELECT USING (public.is_admin());

-- Staff can view own logs
CREATE POLICY "Staff can view own logs" ON public.staff_activity_logs
  FOR SELECT USING ((auth.jwt() ->> 'email')::TEXT = staff_email);

-- System inserts logs via service role only
CREATE POLICY "Service role inserts logs" ON public.staff_activity_logs
  FOR INSERT WITH CHECK (public.is_admin());

-- ── REALTIME ───────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_activity_logs;

-- ── SEED: SYSTEM ROLES ─────────────────────────────
INSERT INTO public.staff_roles (role_key, role_name, description, permissions, is_system_role, color) VALUES
('owner', 'Owner', 'Full access to everything', ARRAY['manage_users','manage_challenges','manage_payouts','manage_kyc','manage_risk','manage_affiliates','manage_support','manage_notifications','manage_settings','manage_payments','manage_coupons','manage_staff','manage_audit_logs'], true, '#FF5C00'),
('super_admin', 'Super Admin', 'Full access including staff management', ARRAY['manage_users','manage_challenges','manage_payouts','manage_kyc','manage_risk','manage_affiliates','manage_support','manage_notifications','manage_settings','manage_payments','manage_coupons','manage_staff','manage_audit_logs'], true, '#ef4444'),
('admin', 'Admin', 'Full access except staff management', ARRAY['manage_users','manage_challenges','manage_payouts','manage_kyc','manage_risk','manage_affiliates','manage_support','manage_notifications','manage_settings','manage_payments','manage_coupons','manage_audit_logs'], true, '#f97316'),
('risk_manager', 'Risk Manager', 'Risk, funded reviews, trader monitoring', ARRAY['manage_risk','manage_users'], true, '#8b5cf6'),
('finance_team', 'Finance Team', 'Payouts and payment management', ARRAY['manage_payouts','manage_payments'], true, '#10b981'),
('support_team', 'Support Team', 'Customer support tickets and live chat', ARRAY['manage_support'], true, '#3b82f6'),
('kyc_team', 'KYC Team', 'Identity verification and compliance', ARRAY['manage_kyc'], true, '#06b6d4'),
('affiliate_manager', 'Affiliate Manager', 'Affiliate program and IB management', ARRAY['manage_affiliates','manage_coupons'], true, '#f59e0b')
ON CONFLICT (role_key) DO NOTHING;