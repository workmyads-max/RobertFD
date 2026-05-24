-- ============================================================
-- PHASE PROGRESSION & FUNDED REVIEW SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add is_visible to challenge_plans (for admin visibility control)
ALTER TABLE public.challenge_plans
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Update existing plans to visible by default
UPDATE public.challenge_plans SET is_visible = true WHERE is_visible IS NULL;

-- ============================================================
-- FUNDED ACCOUNT REVIEW TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.funded_account_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL REFERENCES public.challenge_accounts(account_id) ON DELETE CASCADE,
  user_email TEXT NOT NULL REFERENCES public.profiles(email) ON DELETE CASCADE,
  trader_name TEXT,
  phase_passed TEXT CHECK (phase_passed IN ('phase1', 'phase2')),
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'under_review', 'approved', 'rejected', 'suspended')),
  risk_score DECIMAL(5,2) DEFAULT 0,
  red_flags_count INTEGER DEFAULT 0,
  consistency_score DECIMAL(5,2) DEFAULT 0,
  account_size DECIMAL(12,2),
  challenge_type TEXT,
  total_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  max_dd_used DECIMAL(5,2) DEFAULT 0,
  trading_days INTEGER DEFAULT 0,
  gross_pnl DECIMAL(12,2) DEFAULT 0,
  admin_notes TEXT,
  internal_risk_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  escalated BOOLEAN DEFAULT false,
  escalation_reason TEXT,
  funded_account_id TEXT,
  funded_mt5_login TEXT,
  funded_mt5_password TEXT,
  funded_mt5_server TEXT,
  funded_provisioned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_funded_reviews_account_id ON public.funded_account_reviews(account_id);
CREATE INDEX IF NOT EXISTS idx_funded_reviews_user_email ON public.funded_account_reviews(user_email);
CREATE INDEX IF NOT EXISTS idx_funded_reviews_status ON public.funded_account_reviews(status);

-- Updated_at trigger
DO $$
BEGIN
  DROP TRIGGER IF EXISTS trg_funded_reviews_updated_at ON public.funded_account_reviews;
  CREATE TRIGGER trg_funded_reviews_updated_at
    BEFORE UPDATE ON public.funded_account_reviews
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
END $$;

-- ============================================================
-- RLS for funded_account_reviews
-- ============================================================

ALTER TABLE public.funded_account_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "funded_reviews_select_own" ON public.funded_account_reviews;
DROP POLICY IF EXISTS "funded_reviews_admin" ON public.funded_account_reviews;

CREATE POLICY "funded_reviews_select_own" ON public.funded_account_reviews
  FOR SELECT USING (user_email = public.auth_email() OR public.is_admin());

CREATE POLICY "funded_reviews_admin" ON public.funded_account_reviews
  FOR ALL USING (public.is_admin());

-- Enable realtime on new table
ALTER PUBLICATION supabase_realtime ADD TABLE public.funded_account_reviews;

-- ============================================================
-- Add challenge_plans visibility to RLS
-- Anyone can view visible+active plans; admins see all
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view active challenge plans" ON public.challenge_plans;

CREATE POLICY "Users can view visible active plans" ON public.challenge_plans
  FOR SELECT USING (is_active = true AND is_visible = true);

CREATE POLICY "Admins can view all challenge plans" ON public.challenge_plans
  FOR SELECT USING (public.is_admin());

-- ============================================================
-- Add phase_progression_log table (audit trail)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.phase_progression_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  from_phase TEXT,
  to_phase TEXT,
  action TEXT NOT NULL,
  performed_by TEXT,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phase_logs_account_id ON public.phase_progression_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_phase_logs_user_email ON public.phase_progression_logs(user_email);

ALTER TABLE public.phase_progression_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "phase_logs_admin" ON public.phase_progression_logs
  FOR ALL USING (public.is_admin());

CREATE POLICY "phase_logs_own_select" ON public.phase_progression_logs
  FOR SELECT USING (user_email = public.auth_email());