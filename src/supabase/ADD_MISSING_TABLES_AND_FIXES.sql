-- ==================================================
-- SUPABASE FIXES v2 - Run this in Supabase SQL Editor
-- Fixes: challenge_plans table, trade_records constraint,
--        certificates nullable account_id, id-based upserts
-- ==================================================

-- 1. Add challenge_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.challenge_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    account_type TEXT DEFAULT 'standard',
    size DECIMAL(12,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    leverage_standard TEXT DEFAULT '1:100',
    leverage_swing TEXT DEFAULT '1:30',
    phase1_target DECIMAL(5,2) DEFAULT 10,
    phase2_target DECIMAL(5,2) DEFAULT 5,
    daily_dd DECIMAL(5,2) DEFAULT 5,
    max_dd DECIMAL(5,2) DEFAULT 10,
    profit_split DECIMAL(5,2) DEFAULT 80,
    max_lots DECIMAL(10,2) DEFAULT 20,
    news_trading BOOLEAN DEFAULT false,
    overnight_holding BOOLEAN DEFAULT false,
    weekend_holding BOOLEAN DEFAULT false,
    hedging BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add unique constraint to trade_records.trade_id if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'trade_records' 
        AND constraint_name = 'trade_records_trade_id_key'
    ) THEN
        ALTER TABLE public.trade_records ADD CONSTRAINT trade_records_trade_id_key UNIQUE (trade_id);
    END IF;
END $$;

-- 3. Make certificates.account_id nullable
ALTER TABLE public.certificates ALTER COLUMN account_id DROP NOT NULL;

-- 4. Make certificates.trader_name nullable (some records may not have it)
ALTER TABLE public.certificates ALTER COLUMN trader_name DROP NOT NULL;

-- 5. Create indexes for challenge_plans
CREATE INDEX IF NOT EXISTS idx_challenge_plans_type ON public.challenge_plans(type);
CREATE INDEX IF NOT EXISTS idx_challenge_plans_is_active ON public.challenge_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_challenge_plans_sort_order ON public.challenge_plans(sort_order);

-- 6. Enable RLS on challenge_plans
ALTER TABLE public.challenge_plans ENABLE ROW LEVEL SECURITY;

-- 7. RLS policies for challenge_plans
DROP POLICY IF EXISTS "Anyone can view active challenge plans" ON public.challenge_plans;
CREATE POLICY "Anyone can view active challenge plans" ON public.challenge_plans 
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage challenge plans" ON public.challenge_plans;
CREATE POLICY "Admins can manage challenge plans" ON public.challenge_plans 
    FOR ALL USING (public.is_admin());

-- 8. Drop enum type constraints that block text inserts (use TEXT instead)
-- The challenge_type enum may reject 'instant_light' if not added
-- Add instant_light to challenge_type enum if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = 'challenge_type'::regtype 
        AND enumlabel = 'instant_light'
    ) THEN
        ALTER TYPE challenge_type ADD VALUE IF NOT EXISTS 'instant_light';
    END IF;
END $$;

-- 9. Add updated_at trigger for challenge_plans
DROP TRIGGER IF EXISTS update_challenge_plans_updated_at ON public.challenge_plans;
CREATE TRIGGER update_challenge_plans_updated_at 
    BEFORE UPDATE ON public.challenge_plans 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Fix withdrawal_requests - make withdrawal_id nullable (some old records may not have it)
ALTER TABLE public.withdrawal_requests ALTER COLUMN withdrawal_id DROP NOT NULL;

-- 11. Fix support_tickets - make ticket_id nullable  
ALTER TABLE public.support_tickets ALTER COLUMN ticket_id DROP NOT NULL;

-- 12. Fix orders - make user_email nullable (some orders may have been created without it during checkout)
-- Actually keep NOT NULL but make sure profiles exist first

-- 13. Drop FK on trade_records.account_id (Base44 uses internal hex IDs, not the account_id text field)
--     This allows trade records to sync even when account_id is a Base44 internal id
ALTER TABLE public.trade_records DROP CONSTRAINT IF EXISTS trade_records_account_id_fkey;

-- 14. Drop FK on certificates.account_id for same reason
ALTER TABLE public.certificates DROP CONSTRAINT IF EXISTS certificates_account_id_fkey;

-- 15. Make challenge_plans.plan_id have a unique constraint 
ALTER TABLE public.challenge_plans ADD CONSTRAINT IF NOT EXISTS challenge_plans_plan_id_key UNIQUE (plan_id);

-- ==================================================
-- VERIFICATION
-- ==================================================

SELECT table_name, (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as col_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('challenge_plans', 'trade_records', 'certificates', 'orders', 'withdrawal_requests')
ORDER BY table_name;

-- ==================================================
-- DONE
-- challenge_plans: ✅ created
-- trade_records unique constraint: ✅ added
-- certificates account_id: ✅ nullable
-- challenge_type enum: ✅ instant_light added
-- withdrawal_id: ✅ nullable
-- ==================================================