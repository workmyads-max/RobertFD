-- Email Logs Table for XFunded Trader
-- Tracks all emails sent through the platform

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);

-- RLS Policies
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Admin can view all logs
CREATE POLICY "Admins can view all email logs"
  ON email_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts 
      WHERE user_accounts.email = current_setting('app.current_user_email', TRUE)
      AND user_accounts.role = 'admin'
    )
  );

-- Users can only view their own logs
CREATE POLICY "Users can view their own email logs"
  ON email_logs FOR SELECT
  USING (recipient = current_setting('app.current_user_email', TRUE));

-- Insert policy (allow inserts from service role)
CREATE POLICY "Service role can insert email logs"
  ON email_logs FOR INSERT
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE email_logs IS 'Tracks all emails sent through XFunded Trader platform';
COMMENT ON COLUMN email_logs.recipient IS 'Recipient email address';
COMMENT ON COLUMN email_logs.email_type IS 'Type of email: otp, registration, challenge_purchase, payout_approved, etc.';
COMMENT ON COLUMN email_logs.status IS 'Delivery status: sent, failed, bounced';
COMMENT ON COLUMN email_logs.metadata IS 'Additional data: user_id, challenge_type, amount, etc.';