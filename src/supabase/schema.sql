-- ==================================================
-- FUNDED FIRMS CRM - SUPABASE PRODUCTION SCHEMA
-- ==================================================
-- Institutional-grade proprietary trading firm database
-- PostgreSQL with Row Level Security (RLS)
-- ==================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==================================================
-- ENUMS
-- ==================================================

CREATE TYPE user_role AS ENUM ('admin', 'user', 'support');
CREATE TYPE challenge_type AS ENUM ('two-step', 'instant', 'instant_light');
CREATE TYPE account_type AS ENUM ('swing', 'standard');
CREATE TYPE account_status AS ENUM ('pending', 'active', 'passed', 'failed', 'funded', 'provisioning_failed');
CREATE TYPE phase AS ENUM ('phase1', 'phase2', 'funded');
CREATE TYPE payment_status AS ENUM ('pending', 'awaiting_confirmation', 'authorized', 'confirming', 'confirmed', 'paid', 'failed', 'expired', 'cancelled', 'refunded', 'chargeback');
CREATE TYPE payment_gateway AS ENUM ('checkout_com', 'confirmo', 'manual');
CREATE TYPE payment_method AS ENUM ('usdt_trc20', 'bitcoin', 'checkout_com_card', 'checkout_com_apple_pay', 'checkout_com_google_pay', 'confirmo_crypto', 'nowpayments', 'coinpayments');
CREATE TYPE kyc_status AS ENUM ('not_submitted', 'pending', 'approved', 'rejected');
CREATE TYPE withdrawal_status AS ENUM ('pending', 'approved', 'processing', 'paid', 'rejected');
CREATE TYPE commission_type AS ENUM ('challenge_purchase', 'payout_reward', 'account_upgrade');
CREATE TYPE commission_status AS ENUM ('pending', 'approved', 'paid', 'rejected');
CREATE TYPE notification_type AS ENUM ('announcement', 'maintenance', 'rule_update', 'promotion', 'payout', 'market_alert', 'system');
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE support_ticket_status AS ENUM ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed');
CREATE TYPE certificate_type AS ENUM ('phase1_passed', 'phase2_passed', 'funded', 'first_payout', 'consistency', 'special');
CREATE TYPE platform_name AS ENUM ('xtrading', 'match_trader', 'mt5', 'tradelocker');
CREATE TYPE violation_type AS ENUM ('hft_detection', 'arbitrage_detection', 'ip_kyc_conflict', 'hedge_detection', 'other');
CREATE TYPE affiliate_tier AS ENUM ('standard', 'silver', 'gold', 'platinum', 'custom');

-- ==================================================
-- CORE TABLES
-- ==================================================

-- Users (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  username TEXT UNIQUE,
  role user_role DEFAULT 'user',
  avatar_url TEXT,
  profile_photo_url TEXT,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT false,
  country TEXT,
  city TEXT,
  address TEXT,
  postal_code TEXT,
  payout_wallet_type TEXT,
  payout_wallet_address TEXT,
  usdt_trc20 TEXT,
  bitcoin TEXT,
  usdt_bep20 TEXT,
  ethereum TEXT,
  google_linked BOOLEAN DEFAULT false,
  google_id TEXT,
  two_factor_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate Profiles
CREATE TABLE public.affiliate_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT UNIQUE NOT NULL REFERENCES public.profiles(email) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by_code TEXT REFERENCES public.affiliate_profiles(referral_code),
  referred_by_email TEXT REFERENCES public.profiles(email),
  tier affiliate_tier DEFAULT 'standard',
  custom_l1_rate DECIMAL(5,2),
  custom_l2_rate DECIMAL(5,2),
  custom_l3_rate DECIMAL(5,2),
  custom_payout_rate DECIMAL(5,2),
  total_earned DECIMAL(12,2) DEFAULT 0,
  total_pending DECIMAL(12,2) DEFAULT 0,
  total_paid DECIMAL(12,2) DEFAULT 0,
  total_purchase_commissions DECIMAL(12,2) DEFAULT 0,
  total_payout_commissions DECIMAL(12,2) DEFAULT 0,
  referral_clicks INTEGER DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  active_funded_traders INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_frozen BOOLEAN DEFAULT false,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- KYC Verifications
CREATE TABLE public.kyc_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL REFERENCES public.profiles(email) ON DELETE CASCADE,
  status kyc_status DEFAULT 'not_submitted',
  full_name TEXT,
  date_of_birth DATE,
  nationality TEXT,
  id_type TEXT,
  id_number TEXT,
  id_front_url TEXT,
  id_back_url TEXT,
  selfie_url TEXT,
  proof_of_address_url TEXT,
  rejection_reason TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge Accounts
CREATE TABLE public.challenge_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT UNIQUE NOT NULL,
  user_email TEXT NOT NULL REFERENCES public.profiles(email) ON DELETE CASCADE,
  challenge_type challenge_type NOT NULL,
  account_type account_type DEFAULT 'standard',
  account_size DECIMAL(15,2) NOT NULL,
  platform platform_name DEFAULT 'xtrading',
  leverage TEXT DEFAULT '1:100',
  status account_status DEFAULT 'pending',
  phase phase DEFAULT 'phase1',
  balance DECIMAL(15,2) DEFAULT 0,
  equity DECIMAL(15,2) DEFAULT 0,
  pnl DECIMAL(15,2) DEFAULT 0,
  daily_pnl DECIMAL(15,2) DEFAULT 0,
  daily_drawdown_used DECIMAL(5,2) DEFAULT 0,
  max_drawdown_used DECIMAL(5,2) DEFAULT 0,
  high_water_mark DECIMAL(15,2) DEFAULT 0,
  profit_target_progress DECIMAL(5,2) DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  trading_days INTEGER DEFAULT 0,
  daily_reset_at TIMESTAMPTZ,
  phase_passed_at TIMESTAMPTZ,
  login_credentials TEXT,
  server TEXT,
  mt_login TEXT,
  mt_password TEXT,
  mt_server TEXT,
  mt_group TEXT,
  provisioned_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders (Challenge Purchases)
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT UNIQUE NOT NULL,
  user_email TEXT REFERENCES public.profiles(email),
  challenge_type challenge_type NOT NULL,
  account_type account_type DEFAULT 'standard',
  account_size DECIMAL(15,2) NOT NULL,
  platform TEXT,
  leverage TEXT,
  price DECIMAL(10,2) NOT NULL,
  payment_method payment_method,
  payment_gateway payment_gateway DEFAULT 'manual',
  payment_address TEXT,
  payment_status payment_status DEFAULT 'pending',
  full_name TEXT,
  username TEXT,
  email TEXT,
  phone TEXT,
  country TEXT,
  city TEXT,
  address TEXT,
  postal_code TEXT,
  transaction_id TEXT,
  account_id TEXT REFERENCES public.challenge_accounts(account_id),
  coupon_code TEXT,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  affiliate_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Withdrawal Requests
CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL REFERENCES public.profiles(email) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  method TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  status withdrawal_status DEFAULT 'pending',
  profit_split_pct DECIMAL(5,2) DEFAULT 80,
  company_share DECIMAL(12,2),
  trader_share DECIMAL(12,2),
  affiliate_reward DECIMAL(12,2),
  withdrawal_fee DECIMAL(10,2) DEFAULT 25,
  final_amount DECIMAL(12,2),
  admin_notes TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate Commissions
CREATE TABLE public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_email TEXT NOT NULL REFERENCES public.profiles(email) ON DELETE CASCADE,
  referred_email TEXT NOT NULL REFERENCES public.profiles(email),
  commission_type commission_type NOT NULL,
  level INTEGER DEFAULT 1,
  source_amount DECIMAL(12,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(12,2) NOT NULL,
  order_id TEXT REFERENCES public.orders(order_id),
  withdrawal_id TEXT REFERENCES public.withdrawal_requests(id),
  account_id TEXT,
  status commission_status DEFAULT 'pending',
  notes TEXT,
  paid_at TIMESTAMPTZ,
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupons
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  max_uses INTEGER DEFAULT 0,
  uses_count INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  expires_at TIMESTAMPTZ,
  applicable_challenge_types TEXT[],
  applicable_account_sizes DECIMAL(15,2)[],
  applicable_platforms TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificates
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certificate_id TEXT UNIQUE NOT NULL,
  user_email TEXT NOT NULL REFERENCES public.profiles(email) ON DELETE CASCADE,
  trader_name TEXT NOT NULL,
  type certificate_type NOT NULL,
  title TEXT NOT NULL,
  account_id TEXT NOT NULL,
  account_size DECIMAL(15,2) NOT NULL,
  challenge_type TEXT NOT NULL,
  issue_date DATE NOT NULL,
  is_verified BOOLEAN DEFAULT true,
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type DEFAULT 'announcement',
  priority notification_priority DEFAULT 'medium',
  display_mode TEXT DEFAULT 'sidebar',
  is_active BOOLEAN DEFAULT true,
  cta_label TEXT,
  cta_link TEXT,
  target TEXT DEFAULT 'all',
  scheduled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Tickets
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL REFERENCES public.profiles(email) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status support_ticket_status DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  assigned_to TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Support Messages
CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_email TEXT NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  attachments TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trading Journal Entries
CREATE TABLE public.trading_journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL REFERENCES public.profiles(email) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  trade_id TEXT,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL,
  entry_price DECIMAL(15,5) NOT NULL,
  exit_price DECIMAL(15,5),
  lots DECIMAL(10,2) NOT NULL,
  pnl DECIMAL(12,2),
  setup_notes TEXT,
  emotional_state TEXT,
  lessons_learned TEXT,
  screenshot_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trade Records
CREATE TABLE public.trade_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL REFERENCES public.challenge_accounts(account_id) ON DELETE CASCADE,
  user_email TEXT NOT NULL REFERENCES public.profiles(email),
  trade_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
  order_type TEXT,
  lots DECIMAL(10,2) NOT NULL,
  entry DECIMAL(15,5) NOT NULL,
  close DECIMAL(15,5),
  sl DECIMAL(15,5),
  tp DECIMAL(15,5),
  margin DECIMAL(15,2),
  pnl DECIMAL(12,2),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'closed')),
  close_reason TEXT,
  open_time TIMESTAMPTZ,
  close_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Gateways Configuration
CREATE TABLE public.payment_gateways (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sandbox_mode BOOLEAN DEFAULT false,
  api_key TEXT,
  secret_key TEXT,
  webhook_secret TEXT,
  webhook_url TEXT,
  supported_cards TEXT[],
  supported_crypto TEXT[],
  networks TEXT[],
  wallets JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Logs
CREATE TABLE public.payment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gateway TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  order_id TEXT REFERENCES public.orders(order_id),
  transaction_id TEXT,
  status payment_status DEFAULT 'pending',
  amount DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  crypto_currency TEXT,
  network TEXT,
  confirmations INTEGER DEFAULT 0,
  customer_email TEXT,
  error_message TEXT,
  processed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform Settings
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  category TEXT DEFAULT 'system',
  description TEXT,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trading Platform Providers
CREATE TABLE public.trading_platform_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform_name platform_name NOT NULL,
  api_key TEXT NOT NULL,
  api_secret TEXT,
  server_url TEXT,
  is_active BOOLEAN DEFAULT true,
  demo_api_key TEXT,
  demo_api_secret TEXT,
  demo_server_url TEXT,
  created_by_admin TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Violation Appeals
CREATE TABLE public.violation_appeals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL REFERENCES public.profiles(email) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  violation_type violation_type NOT NULL,
  description TEXT NOT NULL,
  evidence_urls TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk Flags
CREATE TABLE public.risk_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL REFERENCES public.profiles(email) ON DELETE CASCADE,
  account_id TEXT,
  flag_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'reviewed', 'resolved')),
  admin_notes TEXT,
  triggered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Device Logs
CREATE TABLE public.device_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL REFERENCES public.profiles(email) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  device_name TEXT,
  browser TEXT,
  os TEXT,
  last_login TIMESTAMPTZ DEFAULT NOW(),
  is_trusted BOOLEAN DEFAULT false,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OTP Codes
CREATE TABLE public.otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT,
  phone TEXT,
  type TEXT NOT NULL CHECK (type IN ('registration', 'withdrawal', 'security', 'phone_verification')),
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social Media Settings
CREATE TABLE public.social_media_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  discord_url TEXT,
  discord_enabled BOOLEAN DEFAULT true,
  instagram_url TEXT,
  instagram_enabled BOOLEAN DEFAULT true,
  twitter_url TEXT,
  twitter_enabled BOOLEAN DEFAULT true,
  youtube_url TEXT,
  youtube_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate Settings
CREATE TABLE public.affiliate_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  l1_rate DECIMAL(5,2) DEFAULT 8,
  l2_rate DECIMAL(5,2) DEFAULT 2,
  l3_rate DECIMAL(5,2) DEFAULT 1,
  payout_tier_0_rate DECIMAL(5,2) DEFAULT 7,
  payout_tier_10_rate DECIMAL(5,2) DEFAULT 11,
  payout_tier_25_rate DECIMAL(5,2) DEFAULT 17,
  payout_tier_50_rate DECIMAL(5,2) DEFAULT 25,
  min_withdrawal DECIMAL(10,2) DEFAULT 50,
  withdrawal_fee DECIMAL(10,2) DEFAULT 0,
  is_program_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Feature Settings
CREATE TABLE public.user_feature_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT UNIQUE NOT NULL REFERENCES public.profiles(email) ON DELETE CASCADE,
  can_trade BOOLEAN DEFAULT true,
  can_withdraw BOOLEAN DEFAULT true,
  can_access_terminal BOOLEAN DEFAULT true,
  can_access_analytics BOOLEAN DEFAULT true,
  can_access_journal BOOLEAN DEFAULT true,
  can_purchase_challenge BOOLEAN DEFAULT true,
  require_kyc BOOLEAN DEFAULT false,
  require_2fa BOOLEAN DEFAULT false,
  ip_whitelist TEXT[],
  blocked_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================================
-- INDEXES
-- ==================================================

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_affiliate_profiles_user_email ON public.affiliate_profiles(user_email);
CREATE INDEX idx_affiliate_profiles_referral_code ON public.affiliate_profiles(referral_code);
CREATE INDEX idx_challenge_accounts_user_email ON public.challenge_accounts(user_email);
CREATE INDEX idx_challenge_accounts_status ON public.challenge_accounts(status);
CREATE INDEX idx_challenge_accounts_account_id ON public.challenge_accounts(account_id);
CREATE INDEX idx_orders_user_email ON public.orders(user_email);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_order_id ON public.orders(order_id);
CREATE INDEX idx_withdrawal_requests_user_email ON public.withdrawal_requests(user_email);
CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests(status);
CREATE INDEX idx_affiliate_commissions_affiliate_email ON public.affiliate_commissions(affiliate_email);
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_certificates_user_email ON public.certificates(user_email);
CREATE INDEX idx_notifications_is_active ON public.notifications(is_active);
CREATE INDEX idx_trade_records_account_id ON public.trade_records(account_id);
CREATE INDEX idx_trade_records_user_email ON public.trade_records(user_email);
CREATE INDEX idx_audit_logs_user_email ON public.audit_logs(user_email);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ==================================================
-- ENABLE REALTIME
-- ==================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawal_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_commissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.certificates;

-- ==================================================
-- INITIAL DATA
-- ==================================================

-- Default affiliate settings
INSERT INTO public.affiliate_settings (setting_key) VALUES ('global_config');

-- Default social media settings
INSERT INTO public.social_media_settings (setting_key) VALUES ('global');

-- Default platform settings
INSERT INTO public.platform_settings (setting_key, label, category) VALUES 
  ('trading', 'Trading Platform', 'trading'),
  ('analytics', 'Analytics Dashboard', 'analytics'),
  ('support', 'Support System', 'support');