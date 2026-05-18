# 🚀 SUPABASE MIGRATION GUIDE - FUNDED FIRMS CRM

## OVERVIEW

This guide migrates the entire Funded Firms CRM from Base44's built-in database to **Supabase PostgreSQL** with realtime capabilities, RLS security, and production-grade infrastructure.

---

## ✅ COMPLETED STEPS

### 1. **Supabase Client Setup** ✅
- **File:** `lib/supabaseClient.js`
- **Features:**
  - Supabase JS client v2.49.1 installed
  - Authentication helpers (signIn, signUp, Google OAuth, signOut)
  - Session management
  - Realtime configuration

### 2. **Database Schema** ✅
- **File:** `supabase/schema.sql`
- **Tables Created:** 28 production tables
  - profiles, affiliate_profiles, kyc_verifications
  - challenge_accounts, orders, withdrawal_requests
  - affiliate_commissions, coupons, certificates
  - notifications, support_tickets, support_messages
  - trading_journal_entries, trade_records
  - payment_gateways, payment_logs
  - platform_settings, trading_platform_providers
  - violation_appeals, risk_flags, device_logs, otps
  - social_media_settings, affiliate_settings
  - user_feature_settings, audit_logs

### 3. **Security (RLS Policies)** ✅
- **File:** `supabase/rls_policies.sql`
- **Security Features:**
  - Row Level Security enabled on all tables
  - User-specific access (users see only their data)
  - Admin-only access for sensitive tables
  - Helper functions (is_admin, current_user_email, log_audit)
  - Auto-triggers for profile creation on signup

### 4. **Service Layer** ✅
- **File:** `lib/supabaseService.js`
- **Operations:**
  - CRUD for all entities
  - Realtime subscriptions
  - File storage (KYC, certificates, profile pics)
  - Authentication
  - Admin functions

---

## 🔧 MIGRATION STEPS

### STEP 1: Apply Database Schema

**Action Required:** Run the SQL files in Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Run `supabase/schema.sql` first
3. Run `supabase/rls_policies.sql` second

**Alternative (CLI):**
```bash
supabase db push --db-url "postgresql://postgres:[PASSWORD]@wpzgwvimupbbuflsbkvc.supabase.co:5432/postgres"
```

### STEP 2: Configure Environment Variables

**Action Required:** Set secrets in Base44 dashboard

```
SUPABASE_URL=https://wpzgwvimupbbuflsbkvc.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_WtyPv8akefzovYvz9hacAg__hvfbUOg
SUPABASE_SECRET_KEY=sb_secret_zM4ogfaG2eKKyzqEZLivQ_f076rROb
MATCH_TRADER_API_KEY=[Your Match Trader API Key]
```

### STEP 3: Migrate Existing Data

**Action Required:** Export from Base44, import to Supabase

```sql
-- Example: Migrate users
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, full_name, role FROM base44_users;

-- Example: Migrate challenge accounts
INSERT INTO public.challenge_accounts (...)
SELECT ... FROM base44_challenge_accounts;
```

### STEP 4: Update Frontend Components

**Action Required:** Replace Base44 entity calls with Supabase service

**Before (Base44):**
```javascript
import { base44 } from '@/api/base44Client';
const accounts = await base44.entities.ChallengeAccount.filter({ user_email: email });
```

**After (Supabase):**
```javascript
import { getChallengeAccounts } from '@/lib/supabaseService';
const accounts = await getChallengeAccounts(email);
```

### STEP 5: Enable Realtime Subscriptions

**Action Required:** Add realtime listeners to components

**Example - Live Account Updates:**
```javascript
import { subscribeToAccountChanges } from '@/lib/supabaseService';

useEffect(() => {
  const unsubscribe = subscribeToAccountChanges(accountId, (payload) => {
    setAccount(payload.new);
  });
  
  return () => unsubscribe();
}, [accountId]);
```

### STEP 6: Migrate Authentication

**Action Required:** Switch from Base44 auth to Supabase auth

**Before:**
```javascript
import { base44 } from '@/api/base44Client';
const user = await base44.auth.me();
```

**After:**
```javascript
import { getCurrentUser } from '@/lib/supabaseService';
const user = await getCurrentUser();
```

### STEP 7: Storage Buckets Setup

**Action Required:** Create buckets in Supabase Dashboard

1. Go to Storage → Create bucket
2. Create these buckets:
   - `profile-pictures` (public)
   - `kyc-documents` (private)
   - `certificates` (public)
   - `invoices` (private)
   - `support-attachments` (private)

**Bucket Policies:**
```sql
-- Profile pictures (public read, user write)
CREATE POLICY "Public Read" ON storage.objects FOR SELECT USING (bucket_id = 'profile-pictures');
CREATE POLICY "User Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- KYC documents (private, admin read)
CREATE POLICY "Admin Read" ON storage.objects FOR SELECT USING (bucket_id = 'kyc-documents' AND auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "User Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 📊 COMPONENT MIGRATION CHECKLIST

### USER DASHBOARD MODULES

- [ ] **Overview** - Migrate to Supabase (getChallengeAccounts, getOrders)
- [ ] **My Accounts** - Migrate to Supabase (getChallengeAccounts, subscribeToAccountChanges)
- [ ] **My Performance** - Migrate to Supabase (getTradeRecords, getWithdrawals)
- [ ] **New Challenge** - Migrate to Supabase (createOrder, getCoupon)
- [ ] **Analytics** - Migrate to Supabase (getTradeRecords, getOrders)
- [ ] **Market & News** - No migration needed (external API)
- [ ] **Leaderboard** - Migrate to Supabase (getChallengeAccounts with filtering)
- [ ] **Trading Journal** - Migrate to Supabase (trading_journal_entries CRUD)
- [ ] **Billing** - Migrate to Supabase (getOrders, getWithdrawals)
- [ ] **Withdrawals** - Migrate to Supabase (getWithdrawals, createWithdrawal, subscribeToWithdrawals)
- [ ] **Certificates** - Migrate to Supabase (getCertificates, createCertificate)
- [ ] **Affiliate** - Migrate to Supabase (getAffiliateProfile, getAffiliateCommissions)
- [ ] **KYC Verification** - Migrate to Supabase (getKYC, createKYC, updateKYC, storage upload)
- [ ] **Trash Accounts** - Migrate to Supabase (getChallengeAccounts with status filter)
- [ ] **Support** - Migrate to Supabase (getSupportTickets, createSupportTicket, subscribeToTicket)
- [ ] **Settings** - Migrate to Supabase (getProfile, updateProfile)
- [ ] **Notifications** - Migrate to Supabase (getActiveNotifications, subscribeToNotifications)

### ADMIN DASHBOARD MODULES

- [ ] **Admin Overview** - Migrate to Supabase (getAllUsers, getAllOrders, getAllAccounts)
- [ ] **Users** - Migrate to Supabase (getAllUsers, updateProfile)
- [ ] **Challenges** - Migrate to Supabase (getAllAccounts, updateChallengeAccount)
- [ ] **Orders** - Migrate to Supabase (getAllOrders, updateOrder)
- [ ] **Withdrawals** - Migrate to Supabase (getAllWithdrawals, updateWithdrawal)
- [ ] **Affiliate** - Migrate to Supabase (getAllAffiliateProfiles, getAllCommissions, updateAffiliateProfile)
- [ ] **Coupons** - Migrate to Supabase (coupons CRUD)
- [ ] **KYC** - Migrate to Supabase (getAll KYC, updateKYC)
- [ ] **Certificates** - Migrate to Supabase (getAllCertificates, createCertificate)
- [ ] **Notifications** - Migrate to Supabase (notifications CRUD)
- [ ] **Support** - Migrate to Supabase (getAllTickets, createSupportMessage)
- [ ] **Payment Gateways** - Migrate to Supabase (payment_gateways CRUD)
- [ ] **Platform Settings** - Migrate to Supabase (platform_settings CRUD)
- [ ] **Risk Management** - Migrate to Supabase (risk_flags CRUD)
- [ ] **Match Trader** - Keep existing backend function, store results in Supabase

---

## 🔄 REALTIME INTEGRATION POINTS

### Live P&L Updates
```javascript
subscribeToAccountChanges(accountId, (payload) => {
  setAccount(payload.new);
  // Recalculate P&L, equity, drawdown
});
```

### Challenge Progress
```javascript
subscribeToAccountChanges(accountId, (payload) => {
  // Update profit target progress, trading days, phase transitions
});
```

### Withdrawal Updates
```javascript
subscribeToWithdrawals(email, (payload) => {
  // Show notification when status changes to 'approved' or 'paid'
});
```

### Support Chat
```javascript
subscribeToTicket(ticketId, (payload) => {
  // Append new message to chat
});
```

### Notifications
```javascript
subscribeToNotifications((payload) => {
  // Show toast with new notification
});
```

### Leaderboard
```javascript
// Query top performers every 60s with Supabase
const { data } = await supabase
  .from('challenge_accounts')
  .select('user_email, pnl, win_rate')
  .eq('status', 'funded')
  .order('pnl', { ascending: false })
  .limit(50);
```

---

## 🔐 SECURITY CHECKLIST

- [ ] RLS policies applied to all tables
- [ ] Admin-only tables protected (payment_gateways, audit_logs)
- [ ] User data isolated by email
- [ ] Storage buckets have proper policies
- [ ] Supabase secret key stored in environment variables only
- [ ] No secret keys exposed in frontend code
- [ ] Audit logging enabled for sensitive operations
- [ ] Rate limiting configured (optional, via Supabase)

---

## 📦 STORAGE INTEGRATION

### Upload Profile Picture
```javascript
import { uploadFile, getFileUrl } from '@/lib/supabaseService';

const file = fileInput.files[0];
await uploadFile('profile-pictures', `${user.email}/avatar.png`, file);
const url = await getFileUrl('profile-pictures', `${user.email}/avatar.png`);
await updateProfile(user.email, { avatar_url: url });
```

### Upload KYC Documents
```javascript
await uploadFile('kyc-documents', `${user.email}/id-front.jpg`, idFrontFile);
await uploadFile('kyc-documents', `${user.email}/id-back.jpg`, idBackFile);
await uploadFile('kyc-documents', `${user.email}/selfie.jpg`, selfieFile);

await createKYC({
  user_email: user.email,
  id_front_url: 'kyc-documents/user@email.com/id-front.jpg',
  id_back_url: 'kyc-documents/user@email.com/id-back.jpg',
  selfie_url: 'kyc-documents/user@email.com/selfie.jpg',
});
```

---

## 🎯 TESTING CHECKLIST

### Authentication Flow
- [ ] Sign up with email/password
- [ ] Sign in with email/password
- [ ] Google OAuth login
- [ ] Session persistence on refresh
- [ ] Logout and redirect

### Challenge Purchase
- [ ] Select challenge type and size
- [ ] Apply coupon code
- [ ] Create order
- [ ] Payment webhook processing
- [ ] Account provisioning

### Trading Terminal
- [ ] Load challenge accounts
- [ ] Create trade records
- [ ] Update P&L in real-time
- [ ] Drawdown monitoring
- [ ] Phase transitions

### Withdrawals
- [ ] Submit withdrawal request
- [ ] Admin approval
- [ ] Affiliate commission distribution
- [ ] Certificate generation

### Affiliate System
- [ ] Referral code generation
- [ ] Commission tracking
- [ ] Multi-level distribution
- [ ] Withdrawal requests

### Admin Dashboard
- [ ] View all users
- [ ] Update account status
- [ ] Approve/reject KYC
- [ ] Manage coupons
- [ ] Process withdrawals

---

## 🚨 ROLLBACK PLAN

If migration issues occur:

1. **Keep Base44 database active** during transition
2. **Dual-write** to both databases temporarily
3. **Feature flags** to switch between Supabase/Base44
4. **Backup** all Supabase data before major changes

---

## 📞 SUPPORT

**Supabase Dashboard:** https://wpzgwvimupbbuflsbkvc.supabase.co  
**Documentation:** https://supabase.com/docs  
**PostgreSQL Docs:** https://www.postgresql.org/docs/

---

**Migration Status:** 🟡 IN PROGRESS  
**Next Step:** Run schema.sql in Supabase Dashboard