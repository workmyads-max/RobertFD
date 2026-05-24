-- ============================================================
-- MISSING PERFORMANCE INDEXES — Institutional Audit Fix
-- Run in Supabase SQL Editor
-- ============================================================

-- payment_logs: idempotency check runs on every webhook
CREATE INDEX IF NOT EXISTS idx_payment_logs_transaction_id ON public.payment_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON public.payment_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_processed ON public.payment_logs(processed);
CREATE INDEX IF NOT EXISTS idx_payment_logs_gateway_processed ON public.payment_logs(gateway, processed);

-- risk_flags: scanned heavily by risk engine
CREATE INDEX IF NOT EXISTS idx_risk_flags_account_id_status ON public.risk_flags(account_id, status);
CREATE INDEX IF NOT EXISTS idx_risk_flags_user_email_status ON public.risk_flags(user_email, status);
CREATE INDEX IF NOT EXISTS idx_risk_flags_flag_type ON public.risk_flags(flag_type);

-- challenge_accounts: MT sync lookup by mt_login
CREATE INDEX IF NOT EXISTS idx_challenge_accounts_mt_login ON public.challenge_accounts(mt_login);
CREATE INDEX IF NOT EXISTS idx_challenge_accounts_platform_status ON public.challenge_accounts(platform, status);

-- otps: OTP verification flow
CREATE INDEX IF NOT EXISTS idx_otps_email_verified ON public.otps(email, verified);
CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON public.otps(expires_at);

-- affiliate_commissions: commission management filtering
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON public.affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_order_id ON public.affiliate_commissions(order_id);

-- staff activity logs: pagination
CREATE INDEX IF NOT EXISTS idx_staff_activity_logs_created_at ON public.staff_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_activity_logs_staff_email ON public.staff_activity_logs(staff_email);

-- orders: compound query for admin dashboard
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_gateway ON public.orders(payment_gateway);

-- trade_records: compound query for risk engine batch
CREATE INDEX IF NOT EXISTS idx_trade_records_account_status ON public.trade_records(account_id, status);
CREATE INDEX IF NOT EXISTS idx_trade_records_symbol ON public.trade_records(symbol);

-- withdrawal_requests: finance team queries
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON public.withdrawal_requests(created_at DESC);