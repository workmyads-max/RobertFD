-- ==================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==================================================
-- Production-grade security for Funded Firms CRM
-- ==================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_platform_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violation_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feature_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- PROFILES
-- ==================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.jwt() ->> 'email' = email);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- ==================================================
-- CHALLENGE ACCOUNTS
-- ==================================================

-- Users can view their own accounts
CREATE POLICY "Users can view own accounts" ON public.challenge_accounts
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- Admins can view all accounts
CREATE POLICY "Admins can view all accounts" ON public.challenge_accounts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- Admins can update all accounts
CREATE POLICY "Admins can update all accounts" ON public.challenge_accounts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- ==================================================
-- ORDERS
-- ==================================================

-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- Admins can update all orders
CREATE POLICY "Admins can update all orders" ON public.orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- ==================================================
-- WITHDRAWAL REQUESTS
-- ==================================================

-- Users can view their own withdrawal requests
CREATE POLICY "Users can view own withdrawals" ON public.withdrawal_requests
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- Users can create withdrawal requests
CREATE POLICY "Users can create withdrawals" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Admins can view all withdrawals
CREATE POLICY "Admins can view all withdrawals" ON public.withdrawal_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- Admins can update all withdrawals
CREATE POLICY "Admins can update all withdrawals" ON public.withdrawal_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- ==================================================
-- AFFILIATE PROFILES
-- ==================================================

-- Users can view their own affiliate profile
CREATE POLICY "Users can view own affiliate profile" ON public.affiliate_profiles
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- Admins can view all affiliate profiles
CREATE POLICY "Admins can view all affiliate profiles" ON public.affiliate_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- Admins can update all affiliate profiles
CREATE POLICY "Admins can update all affiliate profiles" ON public.affiliate_profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- ==================================================
-- AFFILIATE COMMISSIONS
-- ==================================================

-- Users can view their own commissions
CREATE POLICY "Users can view own commissions" ON public.affiliate_commissions
  FOR SELECT USING (auth.jwt() ->> 'email' = affiliate_email);

-- Admins can view all commissions
CREATE POLICY "Admins can view all commissions" ON public.affiliate_commissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- Admins can update all commissions
CREATE POLICY "Admins can update all commissions" ON public.affiliate_commissions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- ==================================================
-- KYC VERIFICATIONS
-- ==================================================

-- Users can view their own KYC
CREATE POLICY "Users can view own KYC" ON public.kyc_verifications
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- Users can create/update their KYC
CREATE POLICY "Users can manage own KYC" ON public.kyc_verifications
  FOR ALL USING (auth.jwt() ->> 'email' = user_email);

-- Admins can view all KYC
CREATE POLICY "Admins can view all KYC" ON public.kyc_verifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- Admins can update all KYC
CREATE POLICY "Admins can update all KYC" ON public.kyc_verifications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- ==================================================
-- TRADE RECORDS
-- ==================================================

-- Users can view their own trades
CREATE POLICY "Users can view own trades" ON public.trade_records
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- Admins can view all trades
CREATE POLICY "Admins can view all trades" ON public.trade_records
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- ==================================================
-- COUPONS
-- ==================================================

-- Anyone can view active coupons
CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = true);

-- Admins can manage all coupons
CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- ==================================================
-- CERTIFICATES
-- ==================================================

-- Users can view their own certificates
CREATE POLICY "Users can view own certificates" ON public.certificates
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- Anyone can view verified certificates (for public verification)
CREATE POLICY "Anyone can view verified certificates" ON public.certificates
  FOR SELECT USING (is_verified = true);

-- Admins can manage all certificates
CREATE POLICY "Admins can manage certificates" ON public.certificates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- ==================================================
-- NOTIFICATIONS
-- ==================================================

-- Anyone can view active notifications
CREATE POLICY "Anyone can view active notifications" ON public.notifications
  FOR SELECT USING (is_active = true);

-- Admins can manage notifications
CREATE POLICY "Admins can manage notifications" ON public.notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- ==================================================
-- SUPPORT TICKETS
-- ==================================================

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- Users can create tickets
CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Users can update their own tickets
CREATE POLICY "Users can update own tickets" ON public.support_tickets
  FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets" ON public.support_tickets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- Admins can update all tickets
CREATE POLICY "Admins can update all tickets" ON public.support_tickets
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- ==================================================
-- SUPPORT MESSAGES
-- ==================================================

-- Users can view messages on their tickets
CREATE POLICY "Users can view own ticket messages" ON public.support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets 
      WHERE id = ticket_id AND user_email = auth.jwt() ->> 'email'
    )
  );

-- Users can create messages on their tickets
CREATE POLICY "Users can create ticket messages" ON public.support_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets 
      WHERE id = ticket_id AND user_email = auth.jwt() ->> 'email'
    )
  );

-- Admins can view all messages
CREATE POLICY "Admins can view all messages" ON public.support_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- Admins can create messages
CREATE POLICY "Admins can create messages" ON public.support_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- ==================================================
-- PAYMENT GATEWAYS (Admin Only)
-- ==================================================

-- Admins can view payment gateways
CREATE POLICY "Admins can view payment gateways" ON public.payment_gateways
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- Admins can manage payment gateways
CREATE POLICY "Admins can manage payment gateways" ON public.payment_gateways
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- ==================================================
-- TRADING PLATFORM PROVIDERS (Admin Only)
-- ==================================================

-- Admins can view providers
CREATE POLICY "Admins can view providers" ON public.trading_platform_providers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- Admins can manage providers
CREATE POLICY "Admins can manage providers" ON public.trading_platform_providers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- ==================================================
-- AUDIT LOGS (Admin Only)
-- ==================================================

-- Admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  );

-- ==================================================
-- HELPER FUNCTIONS
-- ==================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = auth.jwt() ->> 'email' AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user email
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT AS $$
BEGIN
  RETURN auth.jwt() ->> 'email';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION public.log_audit(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old_data JSONB,
  p_new_data JSONB
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_email, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent
  ) VALUES (
    auth.jwt() ->> 'email',
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_data,
    p_new_data,
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- TRIGGERS
-- ==================================================

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Auto-create affiliate profile
  INSERT INTO public.affiliate_profiles (user_email, referral_code)
  VALUES (
    NEW.email,
    'RF' || upper(substring(md5(random()::text) from 1 for 8))
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_affiliate_profiles_updated_at BEFORE UPDATE ON public.affiliate_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_kyc_verifications_updated_at BEFORE UPDATE ON public.kyc_verifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_challenge_accounts_updated_at BEFORE UPDATE ON public.challenge_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_withdrawal_requests_updated_at BEFORE UPDATE ON public.withdrawal_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_gateways_updated_at BEFORE UPDATE ON public.payment_gateways FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_social_media_settings_updated_at BEFORE UPDATE ON public.social_media_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_affiliate_settings_updated_at BEFORE UPDATE ON public.affiliate_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();