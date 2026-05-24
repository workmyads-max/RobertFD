-- ============================================================
-- WEBHOOK RACE CONDITION FIX
-- Adds UNIQUE constraint on payment_logs.transaction_id
-- Prevents duplicate provisioning from concurrent webhook deliveries
-- Run in Supabase SQL Editor
-- ============================================================

-- First, clean up any existing duplicate transaction IDs (keep most recent)
DELETE FROM public.payment_logs a
USING public.payment_logs b
WHERE a.created_at < b.created_at
  AND a.transaction_id = b.transaction_id
  AND a.transaction_id IS NOT NULL;

-- Add partial unique constraint: only enforce uniqueness for non-null, processed events
-- This allows multiple "pending" logs but only one "processed" entry per transaction
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_logs_unique_processed_txn
ON public.payment_logs(transaction_id)
WHERE processed = true AND transaction_id IS NOT NULL;

-- This means: INSERT INTO payment_logs ... ON CONFLICT (transaction_id) WHERE processed = true DO NOTHING
-- will atomically prevent race conditions at the database level