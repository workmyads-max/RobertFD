-- ============================================================
-- CRITICAL: Expand risk_flag_type ENUM to match backend engine
-- The risk engine creates 11 flag types not in original ENUM
-- Run in Supabase SQL Editor
-- ============================================================

-- Add all missing risk engine flag types to the ENUM
ALTER TYPE risk_flag_type ADD VALUE IF NOT EXISTS 'martingale_grid';
ALTER TYPE risk_flag_type ADD VALUE IF NOT EXISTS 'consistency_manipulation';
ALTER TYPE risk_flag_type ADD VALUE IF NOT EXISTS 'suspicious_lot_sizing';
ALTER TYPE risk_flag_type ADD VALUE IF NOT EXISTS 'hedge_abuse';
ALTER TYPE risk_flag_type ADD VALUE IF NOT EXISTS 'ultra_fast_scalping';
ALTER TYPE risk_flag_type ADD VALUE IF NOT EXISTS 'copy_trading_signal';
ALTER TYPE risk_flag_type ADD VALUE IF NOT EXISTS 'toxic_flow';
ALTER TYPE risk_flag_type ADD VALUE IF NOT EXISTS 'unusual_dd_behavior';
ALTER TYPE risk_flag_type ADD VALUE IF NOT EXISTS 'overnight_violation';
ALTER TYPE risk_flag_type ADD VALUE IF NOT EXISTS 'synthetic_arbitrage';
ALTER TYPE risk_flag_type ADD VALUE IF NOT EXISTS 'hft_detection';
ALTER TYPE risk_flag_type ADD VALUE IF NOT EXISTS 'arbitrage_detection';
ALTER TYPE risk_flag_type ADD VALUE IF NOT EXISTS 'high_frequency_trading';
ALTER TYPE risk_flag_type ADD VALUE IF NOT EXISTS 'repetitive_pattern';

-- Verify final ENUM values
SELECT enumlabel FROM pg_enum 
JOIN pg_type ON pg_type.oid = pg_enum.enumtypid 
WHERE pg_type.typname = 'risk_flag_type'
ORDER BY enumsortorder;