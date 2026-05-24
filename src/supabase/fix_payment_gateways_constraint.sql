-- Fix: Add UNIQUE constraint on payment_gateways.name
-- Run in Supabase SQL Editor → New Query → Run

ALTER TABLE public.payment_gateways 
ADD CONSTRAINT IF NOT EXISTS payment_gateways_name_key UNIQUE (name);