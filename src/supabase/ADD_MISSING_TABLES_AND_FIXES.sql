-- ==================================================
-- SUPABASE FIXES - Challenge Plans & Trade Records
-- Execute this in Supabase SQL Editor
-- ==================================================

-- 1. Add challenge_plans table if not exists
CREATE TABLE IF NOT EXISTS public.challenge_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type challenge_type NOT NULL,
    account_type account_type DEFAULT 'standard',
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

-- 2. Add unique constraint to trade_records on trade_id
-- First drop existing constraint if any
ALTER TABLE public.trade_records DROP CONSTRAINT IF EXISTS trade_records_trade_id_key;
ALTER TABLE public.trade_records ADD CONSTRAINT trade_records_trade_id_key UNIQUE (trade_id);

-- 3. Make account_id nullable in certificates (already should be, but ensuring)
ALTER TABLE public.certificates ALTER COLUMN account_id DROP NOT NULL;

-- 4. Create indexes for challenge_plans
CREATE INDEX IF NOT EXISTS idx_challenge_plans_type ON public.challenge_plans(type);
CREATE INDEX IF NOT EXISTS idx_challenge_plans_account_type ON public.challenge_plans(account_type);
CREATE INDEX IF NOT EXISTS idx_challenge_plans_is_active ON public.challenge_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_challenge_plans_sort_order ON public.challenge_plans(sort_order);

-- 5. Enable RLS on challenge_plans
ALTER TABLE public.challenge_plans ENABLE ROW LEVEL SECURITY;

-- 6. Add RLS policies for challenge_plans
DROP POLICY IF EXISTS "Anyone can view active challenge plans" ON public.challenge_plans;
CREATE POLICY "Anyone can view active challenge plans" ON public.challenge_plans 
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage challenge plans" ON public.challenge_plans;
CREATE POLICY "Admins can manage challenge plans" ON public.challenge_plans 
    FOR ALL USING (public.is_admin());

-- 7. Add updated_at trigger for challenge_plans
DROP TRIGGER IF EXISTS update_challenge_plans_updated_at ON public.challenge_plans;
CREATE TRIGGER update_challenge_plans_updated_at 
    BEFORE UPDATE ON public.challenge_plans 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==================================================
-- VERIFICATION QUERIES
-- ==================================================

-- Check if challenge_plans exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'challenge_plans';

-- Check unique constraint on trade_records
SELECT constraint_name, table_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'trade_records' AND constraint_type = 'UNIQUE';

-- Count records in each table
SELECT 'challenge_plans' as table_name, COUNT(*) as row_count FROM public.challenge_plans
UNION ALL
SELECT 'trade_records', COUNT(*) FROM public.trade_records
UNION ALL
SELECT 'certificates', COUNT(*) FROM public.certificates;

-- ==================================================
-- COMPLETION MESSAGE
-- ==================================================
-- ✅ All fixes applied successfully!
-- - challenge_plans table created
-- - trade_records unique constraint added
-- - certificates account_id made nullable
-- - RLS policies configured
-- - Indexes created for performance
-- ==================================================