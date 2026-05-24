-- Fix: Add UNIQUE constraint on payment_gateways.name
-- Run in Supabase SQL Editor → New Query → Run

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_gateways_name_key'
  ) THEN
    ALTER TABLE public.payment_gateways ADD CONSTRAINT payment_gateways_name_key UNIQUE (name);
  END IF;
END $$;