# XFunded Trader - Email Service Setup Guide

## ✅ What's Been Configured

### Backend Services Created:
1. **`functions/emailService`** - Centralized email service with Supabase logging
2. **`supabase/email_logs_table.sql`** - Database table for tracking all emails
3. **Updated `functions/customAuth`** - Now uses emailService for all notifications

### Email Templates (Modern Dark Theme):
- ✅ OTP verification codes
- ✅ Registration welcome emails
- ✅ Login security alerts
- ✅ Challenge purchase confirmations
- ✅ Payout approved notifications
- ✅ Phase passed certificates
- ✅ Funded account approvals

All templates feature:
- XFunded Trader branding (XF logo)
- Dark theme with orange gradients
- Professional statistics cards
- Mobile-responsive design
- Security notices and info boxes

## 🔧 Setup Steps

### Step 1: Run Supabase Migration

Execute the SQL migration to create the email logs table:

```bash
# In Supabase Dashboard → SQL Editor
# Run the contents of: supabase/email_logs_table.sql
```

Or manually create the table:
```sql
CREATE TABLE email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 2: Configure Email Sender

In **Base44 Dashboard** → **Integrations** → **Email Settings**:

1. Set **From Address**: `support@xfundedtrader.com`
2. Set **Sender Name**: `XFunded Trader`
3. Verify domain if required (add DNS records)

### Step 3: Test Email Service

Test the email service with this payload:

```javascript
// Test OTP email
await base44.functions.invoke('emailService', {
  action: 'send_otp',
  to: 'test@example.com',
  code: '123456',
  name: 'Test User',
  purpose: 'registration'
});

// Test notification email
await base44.functions.invoke('emailService', {
  action: 'send_notification',
  to: 'test@example.com',
  type: 'registration',
  data: {
    name: 'John Doe',
    email: 'test@example.com',
    role: 'Trader'
  }
});
```

## 📧 Email Types Available

### Authentication Emails:
- `otp` - Verification codes (registration, login, withdrawal)
- `registration` - Welcome email after verification
- `login_alert` - Security notification for new logins

### Transactional Emails:
- `challenge_purchase` - Order confirmation
- `payout_approved` - Withdrawal processing
- `phase_passed` - Challenge completion
- `funded_approval` - Funded account activation

## 🔍 Viewing Email Logs

### Via Supabase Dashboard:
```sql
-- View all emails
SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 50;

-- View emails for specific user
SELECT * FROM email_logs WHERE recipient = 'user@example.com' ORDER BY sent_at DESC;

-- View failed emails
SELECT * FROM email_logs WHERE status = 'failed' ORDER BY sent_at DESC;
```

### Via Backend Function:
```javascript
// Get email logs (admin only)
const logs = await base44.functions.invoke('emailService', {
  action: 'get_email_logs',
  limit: 50
});
```

## 🎨 Template Customization

All email templates are defined in `functions/emailService` in the `getEmailTemplate()` function.

To customize:
1. Edit the template HTML in the function
2. Modify colors, fonts, or layout
3. Add new template types as needed

### Color Scheme:
- Primary: `#FF5C00` (Orange)
- Secondary: `#CCFF00` (Lime)
- Success: `#10b981` (Emerald)
- Warning: `#f59e0b` (Amber)
- Error: `#ef4444` (Red)

## 📊 Email Tracking Features

### Automatic Logging:
Every email sent is automatically logged to Supabase with:
- ✅ Recipient email address
- ✅ Subject line
- ✅ Email type (otp, registration, etc.)
- ✅ Delivery status (sent/failed)
- ✅ Timestamp
- ✅ Metadata (user ID, challenge details, etc.)

### Benefits:
- Track delivery success rates
- Debug email issues
- Audit trail for compliance
- User support (verify emails sent)

## 🔐 Security Features

### RLS Policies:
- **Admins**: Can view all email logs
- **Users**: Can only view their own email logs
- **Service Role**: Can insert new logs

### Data Protection:
- Email content NOT stored (only metadata)
- OTP codes never logged
- GDPR-compliant minimal data retention

## 🛠️ Usage Examples

### Send OTP during Registration:
```javascript
await base44.functions.invoke('emailService', {
  action: 'send_otp',
  to: 'trader@example.com',
  code: '654321',
  name: 'John Smith',
  purpose: 'registration',
  userId: 'user-123'
});
```

### Send Welcome Email:
```javascript
await base44.functions.invoke('emailService', {
  action: 'send_notification',
  to: 'trader@example.com',
  type: 'registration',
  data: {
    name: 'John Smith',
    email: 'trader@example.com',
    role: 'Trader'
  },
  userId: 'user-123'
});
```

### Send Challenge Purchase Confirmation:
```javascript
await base44.functions.invoke('emailService', {
  action: 'send_notification',
  to: 'trader@example.com',
  type: 'challenge_purchase',
  data: {
    challenge_type: 'Two-Step',
    account_size: 100000,
    platform: 'xTrading'
  },
  userId: 'user-123'
});
```

### Send Payout Approved:
```javascript
await base44.functions.invoke('emailService', {
  action: 'send_notification',
  to: 'trader@example.com',
  type: 'payout_approved',
  data: {
    amount: 5000,
    trader_share: 4000,
    wallet: '0x1234...abcd'
  },
  userId: 'user-123'
});
```

## 📈 Monitoring & Analytics

### Email Delivery Rate:
```sql
SELECT 
  email_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(COUNT(*) FILTER (WHERE status = 'sent') * 100.0 / COUNT(*), 2) as success_rate
FROM email_logs
GROUP BY email_type
ORDER BY total DESC;
```

### Daily Email Volume:
```sql
SELECT 
  DATE(sent_at) as date,
  COUNT(*) as emails_sent
FROM email_logs
WHERE sent_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(sent_at)
ORDER BY date DESC;
```

## 🚨 Troubleshooting

### Emails Not Sending:
1. Check Base44 email integration is configured
2. Verify `support@xfundedtrader.com` is set as sender
3. Check spam/junk folders
4. Review function logs for errors

### Emails Going to Spam:
1. Verify domain DNS records (SPF, DKIM)
2. Check sender reputation
3. Avoid spam trigger words
4. Use consistent from address

### Supabase Logging Issues:
1. Verify `email_logs` table exists
2. Check RLS policies allow inserts
3. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
4. Review Supabase logs for errors

## 📞 Support

For email delivery issues:
- Check Base44 integration status
- Verify DNS records for domain
- Review email logs in Supabase
- Contact Base44 support if needed

---

**Setup Date:** 2026-05-19  
**Platform:** XFunded Trader  
**Email Service:** Base44 + Supabase Logging  
**Sender:** support@xfundedtrader.com