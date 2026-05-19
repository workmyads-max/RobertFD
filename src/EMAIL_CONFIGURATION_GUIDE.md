# Email Configuration Guide - XFunded Trader

## ✅ What's Been Updated

All email templates have been updated with the new **XFunded Trader** branding:
- Logo changed from "FC" to "XF"
- Company name changed from "Funded Firms" to "XFunded Trader"
- Modern, professional dark-themed templates with gradient effects
- Improved UI/UX with better visual hierarchy

## 📧 Email Types Covered

### 1. **OTP Emails** (functions/sendOTP)
- Registration verification
- Login verification  
- Password reset
- Phone verification

### 2. **Notification Emails** (functions/sendBrandedEmail)
- Welcome/Registration confirmation
- Challenge purchase confirmation
- Payout approved/processing
- Phase passed certificates
- Funded account approval
- Login security alerts
- KYC status updates
- Account credentials
- Affiliate commissions
- Breach alerts

## 🔧 Configuration Steps

### Step 1: Configure Sender Email in Base44

The Base44 SendEmail integration uses the platform's default sender. To use `support@xfundedtrader.com`:

1. Go to **Base44 Dashboard** → **Integrations** → **Email Settings**
2. Look for **Custom Sender Email** or **From Address** setting
3. Enter: `support@xfundedtrader.com`
4. Enter sender name: `XFunded Trader`
5. Save changes

### Step 2: Domain Verification (If Required)

Base44 may require domain verification for custom sender emails:

1. Add DNS records to your domain:
   ```
   Type: TXT
   Name: _base44-verification.xfundedtrader.com
   Value: [provided by Base44]
   ```

2. Add SPF record (if not already present):
   ```
   Type: TXT
   Name: xfundedtrader.com
   Value: v=spf1 include:base44.com ~all
   ```

3. Add DKIM record (if provided by Base44)

### Step 3: Test Email Sending

After configuration, test by:
1. Creating a test account on your platform
2. Triggering an OTP email
3. Checking the email arrives from `support@xfundedtrader.com`

## 🎨 Template Features

### Modern Design Elements:
- **Dark theme** matching your platform branding
- **Gradient backgrounds** (orange to violet)
- **Animated OTP code display** with glow effects
- **Responsive layout** for mobile/desktop
- **Professional statistics cards** for account data
- **Call-to-action buttons** with gradient backgrounds
- **Security notices** and info boxes
- **Branded footer** with Dubai location

### Color Scheme:
- Primary: `#FF5C00` (Orange)
- Secondary: `#CCFF00` (Lime)
- Accent: `#8b5cf6` (Violet)
- Success: `#10b981` (Emerald)
- Warning: `#f59e0b` (Amber)
- Error: `#ef4444` (Red)

## 📝 Usage Examples

### Send OTP:
```javascript
await base44.functions.invoke('sendOTP', {
  email: 'trader@example.com',
  type: 'registration' // or 'login', 'password_reset', 'withdrawal'
});
```

### Send Branded Email:
```javascript
await base44.functions.invoke('sendBrandedEmail', {
  to: 'trader@example.com',
  type: 'registration', // see available types below
  data: {
    name: 'John Doe',
    email: 'trader@example.com',
    account_size: 100000,
    // other template-specific data
  }
});
```

### Available Email Types:
- `registration` - Welcome email
- `otp` - Verification code
- `challenge_purchase` - Order confirmation
- `payout_approved` - Withdrawal approved
- `payout_request` - Withdrawal received
- `phase_passed` - Challenge phase completed
- `funded_approval` - Account funded
- `certificate_issued` - Certificate available
- `login_alert` - Security notification
- `welcome` - Account activated

## 🔍 Testing Checklist

- [ ] OTP emails arrive from `support@xfundedtrader.com`
- [ ] Email templates render correctly on mobile
- [ ] Email templates render correctly on desktop
- [ ] Links in emails work correctly
- [ ] OTP codes are valid and expire after 10 minutes
- [ ] All email types trigger correctly

## 📞 Support

If emails are not sending or branding is not updated:
1. Check Base44 integration settings
2. Verify domain DNS records
3. Check spam/junk folders
4. Contact Base44 support for email delivery issues

---

**Last Updated:** 2026-05-19  
**Brand:** XFunded Trader, Dubai