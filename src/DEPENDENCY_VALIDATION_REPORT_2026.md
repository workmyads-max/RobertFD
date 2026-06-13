# XFUNDED PLATFORM — PHASE 2 DEPENDENCY VALIDATION REPORT
**Date:** 2026-06-13
**Type:** Runtime Dependency Verification (Read-Only — No changes made)
**Purpose:** Prove which items are active vs removable before cleanup

---

## AUTOMATION INVENTORY (from live runtime)

Two automations are currently ACTIVE and running in production:

| Automation | Function | Interval | Last Status |
|---|---|---|---|
| "Match Trader Account Sync" | `scheduledMTSync` | Every 5 min | ✅ success |
| "Automated DD Breach Monitor" | `automatedDDBreach` | Every 5 min | ✅ success |

One automation is ARCHIVED (disabled, 73 consecutive failures):

| Automation | Function | Status |
|---|---|---|
| "Auto-Generate Challenge Certificates" | `generateChallengeCertificate` | ❌ archived/failed |

**There is NO active automation for:**
- `phaseProgressionEngine` — NOT scheduled
- `syncUserAccountOnLogin` — NOT scheduled
- `syncAllEntitiesToSupabase` — NOT scheduled
- `syncOrdersToSupabase` — NOT scheduled
- `customAuth` — NOT scheduled

---

## ITEM-BY-ITEM DEPENDENCY ANALYSIS

---

### 1. `supabaseAuthBridge` (backend function)

**Is it currently executed?** YES — ACTIVELY CALLED in production

**What calls it:**
- `components/auth/ForgotPassword.jsx` → via `callAuth('forgot_password', ...)` → via `lib/customAuth.js`
- `components/auth/ForgotPassword.jsx` → via `callAuth('reset_password_otp', ...)` → via `lib/customAuth.js`
- `components/auth/ForgotPassword.jsx` → via `callAuth('resend_otp', ...)` → via `lib/customAuth.js`

**Active dependency chain:**
```
ForgotPassword.jsx
  → callAuth() in lib/customAuth.js
    → base44.functions.invoke('supabaseAuthBridge', { action: 'forgot_password' })
    → base44.functions.invoke('supabaseAuthBridge', { action: 'reset_password_otp' })
    → base44.functions.invoke('supabaseAuthBridge', { action: 'resend_otp' })
```

**What it does that nothing else does:**
- Stores OTP code in `UserAccount.otp_code` for password reset
- Validates OTP against `UserAccount.otp_code` for password reset
- Resets `UserAccount.password_hash` after successful OTP reset
- ALSO creates Supabase JWT sessions on login (UNUSED by frontend — dangerous side effect)

**What breaks if removed:**
- ❌ Password Reset flow breaks completely (ForgotPassword component stops working)
- ❌ `resetPassword` backend function also breaks (reads/writes `UserAccount.password_hash`)

**Note on `login` and `register` actions:** These actions exist in `supabaseAuthBridge` but are NOT called by any current frontend component. `Login.jsx` uses `base44.auth.loginViaEmailPassword()`. `Register.jsx` uses `base44.auth.register()`. Both actions are dead paths.

**Can it be archived safely?** NO — password reset depends on it. The `forgot_password`, `reset_password_otp`, and `resend_otp` actions must be preserved OR migrated.

---

### 2. `UserAccount` entity

**Is it currently executed?** YES — ACTIVELY USED in production

**What reads/writes it:**
- `functions/customAuth` → ALL actions read/write `UserAccount`
- `functions/supabaseAuthBridge` → ALL actions read/write `UserAccount`
- `functions/resetPassword` → reads/writes `UserAccount.password_hash`
- `functions/fixAdminAuth` → reads/writes `UserAccount`
- `functions/fixUserAuthIds` → reads/writes `UserAccount`
- `functions/syncUserAccountOnLogin` → does NOT use `UserAccount` (uses `ChallengeAccount`)

**Active dependency chain:**
```
ForgotPassword.jsx
  → callAuth() in lib/customAuth.js
    → supabaseAuthBridge (forgot_password/reset_password_otp)
      → UserAccount.filter({ email })
      → UserAccount.update({ otp_code, password_hash })

resetPassword function (admin tool)
  → UserAccount.filter({ email })
  → UserAccount.update({ password_hash })
```

**What it stores that exists nowhere else:**
- `password_hash` — custom SHA-256 hash of user password (NOT in Base44 Auth)
- `otp_code` / `otp_expires_at` / `otp_type` — OTP storage for password reset
- `login_attempts` / `locked_until` — brute-force protection
- `auth_user_id` — cross-reference to Supabase auth UUID
- `username` — NOT stored in Base44 native User entity

**What breaks if removed:**
- ❌ Password Reset breaks (OTP stored here)
- ❌ `resetPassword` admin function breaks
- ❌ `customAuth` function breaks entirely (it's built on top of `UserAccount`)
- ⚠️ Username field is lost (Base44 native User entity has no `username` field)

**Can it be archived safely?** NO — active production dependency for password reset.

---

### 3. `lib/customAuth.js` (frontend utility)

**Is it currently executed?** YES — ACTIVELY USED in production

**What calls it:**
- `components/auth/ForgotPassword.jsx` → imports `callAuth` from `lib/customAuth.js`

**Active dependency chain:**
```
ForgotPassword.jsx
  → import { callAuth } from '@/lib/customAuth'
    → callAuth('forgot_password', { email })     → supabaseAuthBridge
    → callAuth('reset_password_otp', { ... })    → supabaseAuthBridge
    → callAuth('resend_otp', { userId })          → supabaseAuthBridge
```

**What else is in `lib/customAuth.js` (unused):**
- `saveSession()` / `loadSession()` / `clearSession()` — manual localStorage sessions (legacy, not called anywhere currently)
- `signInToSupabase()` — calls `supabase.auth.signInWithPassword()` directly (dangerous, not called anywhere currently)

**What breaks if removed:**
- ❌ `ForgotPassword.jsx` breaks immediately (it imports `callAuth` directly)

**Can it be archived safely?** NO — `ForgotPassword` uses it. The `callAuth` function must be preserved. The dangerous `signInToSupabase` and session helpers are safe to strip, but `callAuth` itself is required.

---

### 4. `lib/AuthContext.jsx` (frontend)

**Is it currently executed?** NO — NOT USED anywhere in production

**What calls it:**
- No component imports from `lib/AuthContext.jsx`
- NOT mounted in `App.jsx`
- Checked: no import found in any component in the audit

**Active dependency chain:** NONE

**What breaks if removed:** NOTHING. This is a completely orphaned file.

**Can it be archived safely?** YES — Safe to delete immediately. Zero impact.

---

### 5. `syncUserAccountOnLogin` (backend function)

**Is it currently executed?** YES — CALLED EVERY 30 SECONDS from the dashboard

**What calls it:**
- `hooks/useSyncOnLogin.js` → `base44.functions.invoke('syncUserAccountOnLogin', {})`
- `components/dashboard/DashboardOverview.jsx` → imports and uses `useSyncOnLogin` hook

**Active dependency chain:**
```
Dashboard.jsx renders DashboardOverview
  → DashboardOverview imports useSyncOnLogin hook
    → useSyncOnLogin calls syncUserAccountOnLogin every 30s
      → Fetches MT5 balance for current user's accounts
      → Writes ChallengeAccount (balance, equity, DD, breach flags)
      → Writes TradeRecord entities (new closed deals)
```

**What it does vs scheduledMTSync:**
- Does EXACTLY the same thing as `scheduledMTSync` but:
  - Runs per-user (only current user's accounts)
  - Runs every 30 seconds (vs every 5 min for scheduled)
  - Uses user session (vs service role + scheduler token)
  - Has slightly different lot size divisor (÷100000 vs ÷10000) — **DATA INCONSISTENCY**

**Lot size bug found:**
- `syncUserAccountOnLogin` divides volume by `100000` (line 227): `const lots = rawVol / 100000;`
- `scheduledMTSync` divides volume by `10000` (line 487): `const lots = rawVol / 10000;`
- This means TradeRecords written by the login sync have 10x smaller lot sizes than those written by the scheduled sync.

**What breaks if removed:**
- Dashboard `DashboardOverview` shows "Syncing…" indefinitely (cosmetic only — the `useSyncOnLogin` hook shows a sync indicator)
- `lastSync` timestamp in the header would not update
- MT5 data would lag by up to 5 minutes instead of 30 seconds
- The lot size bug would be eliminated (positive side effect)

**Can it be archived safely?** YES — `scheduledMTSync` handles the same job every 5 minutes. Removing it eliminates the race condition and the lot size bug. The 5-minute lag is acceptable for a funded trading dashboard.

---

### 6. `useSyncOnLogin` hook (frontend)

**Is it currently executed?** YES — RUNS EVERY 30 SECONDS while DashboardOverview is mounted

**What calls it:**
- `components/dashboard/DashboardOverview.jsx` → `const { syncing, lastSync, syncError } = useSyncOnLogin();`

**Active dependency chain:**
```
DashboardOverview.jsx
  → const { syncing, lastSync, syncError } = useSyncOnLogin()
    → calls syncUserAccountOnLogin every 30s
    → exposes: syncing (bool), lastSync (timestamp), syncError (string)
```

**What it renders:**
- "Syncing…" text in the header (cosmetic)
- "Synced 12:34:56" timestamp in the header (cosmetic)
- "Sync error" text in the header (cosmetic)

**What breaks if removed:**
- These three cosmetic indicators disappear from the `DashboardOverview` header
- `syncUserAccountOnLogin` is no longer called (which is the goal)
- No functional data loss — `scheduledMTSync` continues running every 5 min

**Can it be archived safely?** YES — purely cosmetic dependency. Safe to remove after removing `syncUserAccountOnLogin`.

---

### 7. `automatedDDBreach` (backend function)

**Is it currently executed?** YES — ACTIVE AUTOMATION running every 5 minutes

**Automation:** "Automated DD Breach Monitor" — `is_active: true`, `last_run_status: success`

**What calls it:**
- Scheduled automation every 5 minutes (EventBridge ARN confirmed active)

**What it does:**
- **Role 1 (Safety net):** Catches accounts where `scheduledMTSync` wrote `dd_breach_detected=true` but failed to update `status=failed`. Sets `status=failed`.
- **Role 2 (Redundant breach):** Detects breach from stored DD values (same data `scheduledMTSync` already processed)
- **Role 3 (UNIQUE — Daily Reset):** At 23:00 UTC — resets `daily_drawdown_used=0` and sets `daily_start_balance = current balance`. **THIS IS THE ONLY PLACE THAT DOES THE DAILY RESET.**
- **Role 4:** Creates `RiskFlag` entity on breach
- **Role 5:** Creates `Notification` entity on breach
- **Role 6:** Sends breach email to user
- **Role 7:** Calls MT5 `move-disabled` to disable account at broker

**What breaks if removed:**
- ❌ Daily DD reset at 23:00 UTC breaks completely — `daily_start_balance` would never update, rendering the daily DD formula incorrect forever
- ❌ Breach emails stop being sent
- ❌ `RiskFlag` audit trail stops being created
- ❌ `Notification` entity for breaches stops being created
- ❌ MT5 account disable at broker stops (though `scheduledMTSync` also does this)

**Can it be archived safely?** NO — the 23:00 UTC daily reset is CRITICAL and exists ONLY here. Removing this breaks the drawdown engine permanently.

**Note:** The breach detection portion (Roles 1 and 2) IS redundant with `scheduledMTSync`. But the daily reset (Role 3) and email/notification/risk flag (Roles 4-6) are unique.

---

### 8. `phaseProgressionEngine` (backend function)

**Is it currently executed?** YES — CALLED BY ADMIN in production (NOT scheduled)

**What calls it:**
- `components/admin/AdminFundedReview.jsx` → `base44.functions.invoke('phaseProgressionEngine', { action: 'approve_funded', review_id })`
- `components/admin/AdminFundedReview.jsx` → `base44.functions.invoke('phaseProgressionEngine', { action: 'reject_funded', ... })`
- `components/admin/AdminFundedReview.jsx` → `base44.functions.invoke('phaseProgressionEngine', { action: 'suspend_account', ... })`
- `components/admin/AdminAccounts.jsx` → `base44.functions.invoke('phaseProgressionEngine', { action: 'approve_phase1', ... })`
- `components/admin/AdminAccounts.jsx` → `base44.functions.invoke('phaseProgressionEngine', { action: 'mark_phase2_passed', ... })` (manual override)
- `components/admin/AdminAccounts.jsx` → `base44.functions.invoke('phaseProgressionEngine', { action: 'compute_risk_score', ... })`

**Active dependency chain:**
```
AdminFundedReview.jsx
  → invoke('phaseProgressionEngine', { action: 'approve_funded', review_id })
    → FundedAccountReview.update({ status: 'approved' })
    → ChallengeAccount.update({ status: 'funded', mt_login, mt_password, ... })
    → Sends funded_approved email
    → Creates Notification
    → Optionally provisions new MT5 account via Tritech API

AdminAccounts.jsx
  → invoke('phaseProgressionEngine', { action: 'approve_phase1', account_id })
    → ChallengeAccount.update({ phase: 'phase2', status: 'active' })
    → Provisions Phase 2 MT5 account via Tritech API
    → Sends phase1_passed email
```

**What it does that nothing else does:**
- **approve_phase1:** The ONLY way to provision a Phase 2 MT5 account from admin approval
- **approve_funded:** The ONLY way to mark an account as `funded` and provision a funded MT5 account
- **reject_funded / suspend_account:** The ONLY way to reject a funded review from admin panel
- **compute_risk_score:** Risk scoring for admin review (also in `advancedRiskScoring`)
- **disableMT5AccountAtBroker on reject:** Disables MT5 at broker when funded is rejected

**What breaks if removed:**
- ❌ Admin cannot approve Phase 1 → Phase 2 (no more funded traders)
- ❌ Admin cannot approve funded accounts (no more payouts)
- ❌ Admin cannot reject funded applications
- ❌ Phase 2 MT5 account provisioning breaks completely
- ❌ Funded MT5 account provisioning breaks completely

**Can it be archived safely?** ABSOLUTELY NOT. This is a core business function called in active admin workflows. It is NOT redundant with `scheduledMTSync`. `scheduledMTSync` only AUTO-DETECTS phase pass (sets `pending_review`). `phaseProgressionEngine` is what the admin calls to actually provision the new MT5 account after reviewing.

---

### 9. `syncAllEntitiesToSupabase` (backend function)

**Is it currently executed?** ONLY ON DEMAND — admin must manually trigger

**What calls it:**
- No automation scheduled
- Only manually called by an admin via dashboard (if they find and run it)
- Last execution: unknown

**What it reads:**
- ALL Base44 entities (Order, ChallengeAccount, TradeRecord, Certificate, etc.)

**What it writes:**
- Supabase tables: `orders`, `challenge_accounts`, `trade_records`, `certificates`, `withdrawal_requests`, `kyc_verifications`, `affiliate_profiles`, `affiliate_commissions`, `notifications`, `coupons`, `payment_gateways`, `challenge_plans`, `platform_settings`, etc.

**What reads from Supabase that this writes to:**
- `lib/supabaseService.js` exports functions that read ALL of these tables — BUT:
  - No current frontend component imports from `lib/supabaseService.js`
  - Confirmed by audit: zero import traces in any active component

**What breaks if removed:**
- Nothing in current production code breaks
- The Supabase tables become permanently stale (they already are)
- If a future developer imports from `lib/supabaseService.js`, their feature would silently fail

**Can it be archived safely?** YES — safe to archive. No active consumer of the Supabase copy.

---

### 10. `syncOrdersToSupabase` (backend function)

**Is it currently executed?** ONLY ON DEMAND — admin must manually trigger

**What calls it:**
- No automation scheduled
- Only manually called by admin

**What it does:**
- Narrower version of `syncAllEntitiesToSupabase` — only syncs `Order` entities to Supabase `orders` table

**What reads from the Supabase `orders` table:**
- `lib/supabaseService.js` has `getAllOrders()` which reads Supabase `orders` — but NOT imported anywhere

**What breaks if removed:** Nothing in current production code breaks.

**Can it be archived safely?** YES — completely safe to archive.

---

## DEPENDENCY GRAPH

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPENDENCY GRAPH                               │
│                    (only active paths shown)                                 │
└─────────────────────────────────────────────────────────────────────────────┘

FRONTEND COMPONENTS
│
├── Login.jsx
│     └──→ base44.auth.loginViaEmailPassword() ──→ Base44 Auth ✅
│
├── Register.jsx
│     └──→ base44.auth.register() ──→ Base44 Auth ✅
│     └──→ base44.auth.verifyOtp() ──→ Base44 Auth ✅
│
├── components/auth/ForgotPassword.jsx ← LIVE DEPENDENCY
│     └──→ callAuth() in lib/customAuth.js
│           └──→ base44.functions.invoke('supabaseAuthBridge', action: forgot_password)
│                 └──→ UserAccount.filter/update (OTP storage)
│                 └──→ emailService (sends OTP email)
│           └──→ base44.functions.invoke('supabaseAuthBridge', action: reset_password_otp)
│                 └──→ UserAccount.update (password_hash reset)
│           └──→ base44.functions.invoke('supabaseAuthBridge', action: resend_otp)
│                 └──→ UserAccount.update (new OTP)
│
├── components/dashboard/DashboardSettings.jsx ← LIVE DEPENDENCY (DANGER)
│     └──→ import { supabase } from '@/lib/supabaseClient'
│           └──→ supabase.auth.updateUser({ password: newPassword })  ← SUPABASE AUTH CALL
│                 [This is the password change flow in the Settings panel]
│                 [It calls Supabase Auth to update password — completely different from
│                  the ForgotPassword flow which uses supabaseAuthBridge + UserAccount]
│                 [These two password systems ARE DIVERGED and BOTH ACTIVE]
│
├── components/dashboard/DashboardOverview.jsx ← LIVE DEPENDENCY
│     └──→ useSyncOnLogin hook
│           └──→ base44.functions.invoke('syncUserAccountOnLogin') every 30s
│                 └──→ MT5 API (balance, equity, deals)
│                 └──→ ChallengeAccount.update (balance, equity, DD)
│                 └──→ TradeRecord.create (new closed deals)
│
├── components/admin/AdminAccounts.jsx ← LIVE DEPENDENCY
│     └──→ base44.functions.invoke('phaseProgressionEngine', approve_phase1)
│           └──→ MT5 API (provision Phase 2 account)
│           └──→ ChallengeAccount.update (mt_login, status=active, phase=phase2)
│     └──→ base44.functions.invoke('phaseProgressionEngine', compute_risk_score)
│           └──→ TradeRecord.filter + RiskFlag.filter
│
└── components/admin/AdminFundedReview.jsx ← LIVE DEPENDENCY
      └──→ base44.functions.invoke('phaseProgressionEngine', approve_funded)
            └──→ MT5 API (provision Funded account)
            └──→ ChallengeAccount.update (status=funded)
            └──→ FundedAccountReview.update (status=approved)
      └──→ base44.functions.invoke('phaseProgressionEngine', reject_funded)
      └──→ base44.functions.invoke('phaseProgressionEngine', suspend_account)

SCHEDULED AUTOMATIONS
│
├── scheduledMTSync (every 5 min) ← LIVE, CRITICAL
│     └──→ MT5 API (balance, equity, deals for ALL accounts)
│     └──→ ChallengeAccount.update (balance, equity, DD, breach flags, phase pass)
│     └──→ TradeRecord.create (new closed deals)
│     └──→ MT5 disable API (on breach)
│     └──→ Notification.create (on phase pass)
│     └──→ FundedAccountReview.create (on phase2 pass)
│
└── automatedDDBreach (every 5 min) ← LIVE, CRITICAL (daily reset is UNIQUE)
      ├── [Safety net] ChallengeAccount.update (status=failed for missed breaches)
      ├── [UNIQUE] At 23:00 UTC: daily_start_balance reset for ALL accounts
      ├── RiskFlag.create (audit trail on breach)
      ├── Notification.create (breach notification)
      ├── emailService (breach email)
      └── MT5 disable API (on breach)

NOT CALLED BY ANYTHING ACTIVE:
│
├── syncAllEntitiesToSupabase — admin-only, on-demand
├── syncOrdersToSupabase — admin-only, on-demand
├── lib/AuthContext.jsx — orphaned, no imports
└── customAuth function — NOT called by any frontend (Login.jsx uses Base44 auth directly)
    [NOTE: customAuth function (backend) is DIFFERENT from lib/customAuth.js (frontend)]
    [The backend customAuth function is a LEGACY auth system — NOT used by current Login/Register]
```

---

## CRITICAL HIDDEN DEPENDENCY DISCOVERED

**`DashboardSettings.jsx` calls `supabase.auth.updateUser()` for password changes.**

This is a SEPARATE password change path that:
1. Uses **Supabase Auth** to update the password
2. Does NOT update `UserAccount.password_hash`
3. Does NOT update Base44 Auth internal password

**Result:** A user who changes their password via Settings → Security → "Update Password":
- Their **Supabase Auth** password is updated ✅
- Their **Base44 Auth** password is NOT updated ❌
- Their **UserAccount.password_hash** is NOT updated ❌

This means:
- They can login via Google or Supabase session (if active)
- Their Base44 `loginViaEmailPassword` may fail (if Base44 password diverges)
- The `supabaseAuthBridge` login flow would REJECT them (password_hash is stale)

**This is an ACTIVE production bug in the current code.** The Settings password change calls a completely different system than the Login password check.

---

## MINIMUM VIABLE ARCHITECTURE FOR PRODUCTION

The minimum set of components required to keep all features working:

```
REQUIRED — CANNOT REMOVE
─────────────────────────
Base44 Auth                    ← Login, Register, OTP verification, session management
Base44 Entities                ← All data storage (ChallengeAccount, Order, TradeRecord, etc.)
scheduledMTSync (automation)   ← MT5 sync, DD enforcement, phase pass detection
automatedDDBreach (automation) ← Daily DD reset at 23:00 UTC (UNIQUE), safety net, emails
phaseProgressionEngine (fn)    ← Admin Phase 1 approval, funded approval, MT5 provisioning
supabaseAuthBridge (fn)        ← Password reset OTP (forgot_password, reset_password_otp, resend_otp)
UserAccount entity             ← OTP storage + password hash for password reset
lib/customAuth.js (callAuth)   ← ForgotPassword component depends on it
MT5 Tritech API                ← Balance sync, account creation, account disable

OPTIONAL — CAN REMOVE WITHOUT BREAKING PRODUCTION
───────────────────────────────────────────────────
lib/AuthContext.jsx            ← Orphaned, zero imports
syncUserAccountOnLogin (fn)    ← Duplicate of scheduledMTSync, race condition source
useSyncOnLogin hook            ← Only cosmetic — "Syncing…" header text
syncAllEntitiesToSupabase      ← Writes to Supabase tables nobody reads
syncOrdersToSupabase           ← Subset of above, same situation
supabaseAuthBridge: login action  ← Dead path, Login.jsx uses Base44 auth directly
supabaseAuthBridge: register action ← Dead path, Register.jsx uses Base44 auth directly

DANGEROUS — MUST FIX BEFORE REMOVING
───────────────────────────────────────
lib/supabaseClient.js          ← DashboardSettings uses supabase.auth.updateUser() for passwords
                                  Cannot remove until Settings password change is migrated
lib/customAuth.js saveSession/signInToSupabase ← Safe to STRIP from the file, just remove those functions
                                                  Keep the file because callAuth() is still needed
```

---

## REMOVAL IMPACT REPORT

### Impact Matrix: What survives removal of each item

| Item | Login | Register | Forgot Password | OTP | MT5 Provisioning | Dashboard | Challenge Rules | Drawdown Engine | Phase Progression | Withdrawals | Certificates |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `lib/AuthContext.jsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `syncUserAccountOnLogin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (5min lag) | ✅ | ✅ | ✅ | ✅ | ✅ |
| `useSyncOnLogin` hook | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (no sync badge) | ✅ | ✅ | ✅ | ✅ | ✅ |
| `syncAllEntitiesToSupabase` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `syncOrdersToSupabase` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `supabaseAuthBridge login/register actions` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `supabaseAuthBridge forgot_password actions` | ✅ | ✅ | ❌ BREAKS | ❌ BREAKS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `UserAccount entity` | ✅ | ✅ | ❌ BREAKS | ❌ BREAKS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `lib/customAuth.js` (entire) | ✅ | ✅ | ❌ BREAKS | ❌ BREAKS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `automatedDDBreach` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ DAILY RESET BREAKS | ✅ | ✅ | ✅ |
| `phaseProgressionEngine` | ✅ | ✅ | ✅ | ✅ | ❌ BREAKS | ✅ | ✅ | ✅ | ❌ BREAKS | ✅ | ✅ |
| `scheduledMTSync` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ NO DATA | ✅ | ❌ BREAKS | ❌ BREAKS | ✅ | ✅ |

---

## FEATURE DEPENDENCY MAP

For each feature, what is the EXACT minimum required:

### Login
**Requires:** `base44.auth.loginViaEmailPassword()` → Base44 Auth only
**Does NOT require:** `supabaseAuthBridge`, `UserAccount`, `customAuth`

### Registration
**Requires:** `base44.auth.register()` + `base44.auth.verifyOtp()` → Base44 Auth only
**Does NOT require:** `supabaseAuthBridge register action`, `UserAccount`, `customAuth`

### Password Reset (Forgot Password)
**Requires:** `supabaseAuthBridge` (forgot_password, reset_password_otp, resend_otp) + `UserAccount` entity + `callAuth()` in `lib/customAuth.js`
**Current path:** ForgotPassword.jsx → callAuth → supabaseAuthBridge → UserAccount
**Note:** This is the ONLY path requiring `supabaseAuthBridge` and `UserAccount` to stay

### Password Change (Settings)
**Current broken state:** `DashboardSettings.jsx` → `supabase.auth.updateUser()` → Supabase Auth
**This is broken** because it updates Supabase Auth but NOT Base44 Auth or UserAccount.password_hash
**Requires fix** before any cleanup

### OTP (Registration)
**Requires:** Base44 native `base44.auth.verifyOtp()` — handled entirely by Base44 platform
**Does NOT require:** `supabaseAuthBridge`, `UserAccount`

### OTP (Password Reset)
**Requires:** `UserAccount.otp_code` + `supabaseAuthBridge` reset flow
**Note:** This is a separate OTP system from the registration OTP

### MT5 Provisioning (New account)
**Requires:** `provisionMT5Account` function + `TradingPlatformProvider` entity + MT5 Tritech API
**Called by:** `manualCryptoReview` (on payment), `phaseProgressionEngine` (on admin approval)

### Dashboard
**Requires:** `scheduledMTSync` (5-min sync) + Base44 entities + `getLivePositions`
**Does NOT require:** `syncUserAccountOnLogin`, `useSyncOnLogin`

### Challenge Rules
**Requires:** `ChallengePlan` entity + `rule_snapshot` on `ChallengeAccount` (written at provisioning)
**Does NOT require:** Any Supabase tables

### Drawdown Engine (Daily DD Reset)
**Requires:** `automatedDDBreach` at 23:00 UTC — CRITICAL, CANNOT REMOVE
**Requires:** `scheduledMTSync` for live DD calculation

### Phase Progression (Phase1 → Phase2 → Funded)
**Auto-detection:** `scheduledMTSync` detects pass, sets `pending_review`
**Admin approval + MT5 provisioning:** `phaseProgressionEngine` (`approve_phase1`, `approve_funded`)
**BOTH are required** — they serve different roles in the flow

### Withdrawals
**Requires:** `requestTraderWithdrawal` + `adminApproveWithdrawal` + `WithdrawalRequest` entity
**Does NOT require:** Any legacy/Supabase systems

### Certificates
**Requires:** `Certificate` entity + `generateChallengeCertificate` function (currently archived automation, but function can be called manually)
**Does NOT require:** Any legacy/Supabase systems

---

## SUMMARY TABLE: REMOVE VS KEEP

| Item | Decision | Reason |
|---|---|---|
| `lib/AuthContext.jsx` | ✅ SAFE TO DELETE | Zero imports, zero dependencies, pure landmine |
| `syncUserAccountOnLogin` fn | ✅ SAFE TO ARCHIVE | Exact duplicate of scheduledMTSync + has lot size bug |
| `useSyncOnLogin` hook | ✅ SAFE TO REMOVE | Cosmetic only, calls the above |
| `syncAllEntitiesToSupabase` fn | ✅ SAFE TO ARCHIVE | No active consumers |
| `syncOrdersToSupabase` fn | ✅ SAFE TO ARCHIVE | No active consumers |
| `supabaseAuthBridge` login/register actions | ✅ SAFE TO STRIP | Dead paths — frontend never calls these |
| `lib/customAuth.js` `signInToSupabase()` | ✅ SAFE TO STRIP | Never called, creates Supabase sessions |
| `lib/customAuth.js` `saveSession/loadSession/clearSession` | ✅ SAFE TO STRIP | Never called, manual localStorage sessions |
| `lib/customAuth.js` `callAuth()` | ❌ KEEP | ForgotPassword depends on it |
| `supabaseAuthBridge` forgot/reset/resend actions | ❌ KEEP | Password reset depends on it |
| `UserAccount` entity | ❌ KEEP | Password reset OTP storage |
| `automatedDDBreach` fn + automation | ❌ KEEP | Daily reset at 23:00 UTC is irreplaceable |
| `phaseProgressionEngine` fn | ❌ KEEP | Admin Phase 1/Funded approval + MT5 provisioning |
| `scheduledMTSync` fn + automation | ❌ KEEP | Core MT5 sync + DD enforcement + phase detection |
| `lib/supabaseClient.js` | ⚠️ FIX FIRST | DashboardSettings uses `supabase.auth.updateUser()` — must migrate before removing |
| `lib/supabaseService.js` | ✅ SAFE TO DELETE | No component imports it |
| `functions/fixAdminAuth` | ✅ SAFE TO DELETE | One-time migration script |
| `functions/fixUserAuthIds` | ✅ SAFE TO DELETE | One-time migration script |
| `functions/customAuth` (backend fn) | ✅ SAFE TO ARCHIVE | Not called by any current frontend |
| `functions/createManualOrderInSupabase` | ✅ SAFE TO ARCHIVE | Writes to unused Supabase tables |

---

## RECOMMENDED CLEANUP ORDER

**Phase A (Zero risk — no functional changes):**
1. Delete `lib/AuthContext.jsx`
2. Delete `lib/supabaseService.js`
3. Strip `signInToSupabase()`, `saveSession()`, `loadSession()`, `clearSession()` from `lib/customAuth.js`
4. Strip the `login` and `register` actions from `supabaseAuthBridge` (dead code inside the function)
5. Archive `functions/fixAdminAuth`, `functions/fixUserAuthIds`
6. Archive `functions/createManualOrderInSupabase`

**Phase B (Requires DashboardSettings password fix first):**
7. Fix `DashboardSettings.jsx` password change to use `supabaseAuthBridge` reset flow OR Base44 native password change — do NOT use `supabase.auth.updateUser()` anymore
8. After that fix: disable `persistSession` in `lib/supabaseClient.js`

**Phase C (Eliminates race conditions):**
9. Remove `useSyncOnLogin` import from `DashboardOverview.jsx`
10. Archive `functions/syncUserAccountOnLogin`
11. Archive `hooks/useSyncOnLogin.js`

**Phase D (Eliminates Supabase data copies):**
12. Archive `functions/syncAllEntitiesToSupabase`
13. Archive `functions/syncOrdersToSupabase`
14. Archive `functions/customAuth` (backend legacy auth function)

---

*Report generated: 2026-06-13 | XFUNDED Platform Dependency Validation*