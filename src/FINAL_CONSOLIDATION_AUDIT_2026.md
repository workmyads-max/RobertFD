# XFUNDED PLATFORM — FINAL ARCHITECTURE CONSOLIDATION AUDIT
**Date:** 2026-06-13
**Type:** Production-Grade Architecture Audit (Read-Only)
**Purpose:** Define exact migration plan before cleanup

---

## EXECUTIVE SUMMARY

**Production Readiness Score: 34 / 100**

The platform is functional but architecturally fragile. It is running three authentication systems simultaneously, has a live bug where password changes through the Settings UI do not update the login password, has a confirmed lot size calculation discrepancy between two concurrent sync functions writing to the same records, and has 14+ duplicate data stores across Supabase and Base44 that silently diverge over time.

---

## PHASE 1 — AUTHENTICATION FLOW DIAGRAM

### 1.1 Complete Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│               XFUNDED AUTHENTICATION — ALL ACTIVE PATHS                      │
└─────────────────────────────────────────────────────────────────────────────┘

USER ACTION: LOGIN
─────────────────
User fills email + password on Login.jsx
  │
  └──→ base44.auth.loginViaEmailPassword(email, password)
        │  Source: api/base44Client.js
        │
        ├── Base44 Auth validates password ✅
        ├── Base44 session token created ✅
        ├── base44.auth.me() returns user with Base44 ID ✅
        │
        └── [SIDE EFFECT — SILENT] supabaseAuthBridge
              NOTE: Login.jsx does NOT call supabaseAuthBridge.
              The Supabase SDK (supabaseClient.js) has persistSession: true.
              If a Supabase session exists in localStorage['xf_supabase_session']
              from a previous interaction, it AUTO-RESTORES silently.
              No code explicitly creates a new Supabase session on login.

USER ACTION: REGISTER
──────────────────────
User fills form on Register.jsx
  │
  ├──→ base44.auth.register({ email, password, full_name })
  │      │  Base44 Auth creates user ✅
  │      │  Sends OTP email for verification ✅
  │      │
  │      └── NO UserAccount entity created ← IMPORTANT
  │          NO Supabase auth.users entry created ← IMPORTANT
  │
  └──→ After OTP: base44.auth.verifyOtp(otp)
        │  Base44 session activated ✅
        └── Affiliate profile created (AffiliateProfile entity) ✅

USER ACTION: FORGOT PASSWORD
─────────────────────────────
User clicks Forgot Password on Login.jsx → ForgotPassword.jsx renders
  │
  └──→ callAuth('forgot_password', { email }) in lib/customAuth.js
        │
        └──→ base44.functions.invoke('supabaseAuthBridge', { action: 'forgot_password' })
              │
              ├── UserAccount.filter({ email }) ← reads UserAccount entity
              ├── UserAccount.update({ otp_code, otp_expires_at }) ← writes OTP to UserAccount
              └── emailService('otp') ← sends OTP email

  Then user enters OTP, clicks Reset:
  └──→ callAuth('reset_password_otp', { userId, otp, newPassword }) in lib/customAuth.js
        │
        └──→ base44.functions.invoke('supabaseAuthBridge', { action: 'reset_password_otp' })
              │
              ├── UserAccount.filter({ id: userId })
              ├── Validates otp === UserAccount.otp_code
              ├── UserAccount.update({ password_hash: new_hash }) ← writes new hash
              └── DOES NOT update Base44 Auth password ← GAP
                  DOES NOT update Supabase Auth password ← GAP

  Result:
  ├── Base44 Auth password: UNCHANGED ❌
  ├── Supabase Auth password: UNCHANGED ❌
  └── UserAccount.password_hash: UPDATED ✅ (but this system is UNUSED for login)

USER ACTION: CHANGE PASSWORD (Settings page)
─────────────────────────────────────────────
User enters new password in DashboardSettings.jsx → clicks "Update Password"
  │
  └──→ supabase.auth.updateUser({ password: newPassword })
        │  Source: import { supabase } from '@/lib/supabaseClient'
        │
        ├── Supabase Auth password: UPDATED ✅
        ├── Base44 Auth password: UNCHANGED ❌
        └── UserAccount.password_hash: UNCHANGED ❌

  Result:
  ├── User can login with NEW password via Supabase session (if active) ✅
  ├── User CANNOT login with new password via base44.auth.loginViaEmailPassword() ❌
  └── User CANNOT reset password via ForgotPassword (hash is stale) ❌
```

### 1.2 Password Update Consistency Matrix

| Action | Base44 Auth Updated | Supabase Auth Updated | UserAccount.password_hash Updated |
|---|---|---|---|
| Register (base44.auth.register) | ✅ Yes | ❌ No | ❌ No |
| Login (base44.auth.loginViaEmailPassword) | N/A | N/A | N/A |
| Forgot Password (supabaseAuthBridge) | ❌ No | ❌ No | ✅ Yes (but unused by login) |
| Settings Change Password (supabase.auth.updateUser) | ❌ No | ✅ Yes | ❌ No |
| resetPassword function (admin tool) | ❌ No | ❌ No | ✅ Yes (but unused by login) |

**CRITICAL FINDING:** Not a single password change path updates ALL THREE systems consistently. The active login path (Base44 Auth) is NEVER updated by any password change mechanism. A user who changes their password via Settings will find their next login via `loginViaEmailPassword()` uses the OLD password.

### 1.3 Session Creation Map

| Location | Session Type Created | Persisted Where | Used By |
|---|---|---|---|
| Login.jsx: `base44.auth.loginViaEmailPassword()` | Base44 token | Base44 platform | SupabaseAuthContext → entire app |
| supabaseClient.js: `persistSession: true` | Supabase JWT | localStorage['xf_supabase_session'] | DashboardSettings password change |
| lib/customAuth.js: `signInToSupabase()` | Supabase JWT | localStorage['xf_supabase_session'] | NEVER CALLED (dead code) |
| supabaseAuthBridge login action | Supabase JWT | Returned to frontend, ignored | DEAD PATH — Login.jsx doesn't call this |
| customAuth backend: `verify_login` | Custom token (returned) | frontend ignores it | DEAD PATH — no frontend calls customAuth backend |

**Three session types can coexist in the same browser simultaneously:**
1. Base44 platform token (used by the app)
2. Supabase JWT in `localStorage['xf_supabase_session']` (auto-restored by SDK)
3. Legacy `localStorage['ff_session']` (written by `lib/customAuth.js saveSession()` — dead code, never called but never cleared)

### 1.4 OTP System Map

| OTP System | Where OTP is stored | What it's used for | Status |
|---|---|---|---|
| Base44 native OTP | Base44 platform internal | Registration email verification | ✅ Active — Register.jsx uses base44.auth.verifyOtp() |
| supabaseAuthBridge OTP | UserAccount.otp_code | Password reset | ✅ Active — ForgotPassword.jsx uses this |
| OTP entity | Base44 OTP entity | sendOTP / verifyOTP functions | ⚠️ Functions exist but NOT called by any active frontend flow |

**Three OTP systems exist. One is active for registration. One is active for password reset. One has no active callers.**

---

## PHASE 2 — MT5 SYNC ARCHITECTURE

### 2.1 Function Comparison

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MT5 SYNC FUNCTIONS — SIDE-BY-SIDE                         │
└─────────────────────────────────────────────────────────────────────────────┘

                    scheduledMTSync          syncUserAccountOnLogin
                    ─────────────────        ──────────────────────
Trigger:            Every 5 min              Every 30 sec (dashboard open)
Auth:               SCHEDULER_SECRET_TOKEN   User session (base44.auth.me())
Scope:              ALL active accounts      Current user's accounts only
Account filter:     platform=mt5, status     platform=mt5, active/funded/passed
                    in [active,funded,        (MISSING: 'pending' from scheduledMTSync)
                    passed,pending]

MT5 Endpoints:      /api/v1/user/userget     /api/v1/user/userget
                    /api/v1/deal/get-deal-   /api/v1/deal/get-deal-history
                    history (3 variants)     /api/v1/order/get-order-history
                                             /api/v1/deal/get-deal-history (Login only)

Lot Size Formula:   rawVol / 10000           rawVol / 100000    ← DIFFERENT ❌
                    (÷10000)                 (÷100000)
                    Comment: "10000=1.00"    Comment: "100=0.001 lots"

Zero Balance Guard: Checks DB balance > 0,  Only checks isRecentlyProvisioned
                    isRecentlyProvisioned,   OR acc.balance > 0
                    paid order check        (MISSING: paid order whitelist check)

DD Calculation:     calcOverallDD()          calcOverallDD()     ← Same formula ✅
                    calcDailyDD()            calcDailyDD()       ← Same formula ✅

Corrupted DD guard: YES — resets if DB       NO — no corrupted DD detection ❌
                    shows >= 90% with
                    real balance data

Phase pass detect:  YES — auto-detects       NO ← only scheduled sync does this
                    phase1/phase2 pass

TradeRecord write:  YES (service role)       YES (user scope)    ← BOTH WRITE ❌

ChallengeAccount    YES (service role)       YES (user scope)    ← BOTH WRITE ❌
write:

Breach detection:   YES (with paid order     YES (without paid   ← INCONSISTENT ❌
                    whitelist, corrupted     order whitelist)
                    data guard)

MT5 disable on      YES                      NO                  ← scheduled is
breach:                                                          more complete

Notifications on    YES (phase pass)         NO
pass:

Status filter:      active, funded,          active, funded,
                    passed, PENDING          passed (no pending) ← Diverged ❌
```

### 2.2 Race Condition Analysis

**Scenario: User has dashboard open (30s sync active) when the 5-min scheduled sync fires**

```
T+00:00 — scheduledMTSync reads ChallengeAccount: DD=4.8%, balance=$102,000
T+00:03 — syncUserAccountOnLogin reads ChallengeAccount: DD=4.8%, balance=$102,000
T+00:05 — scheduledMTSync gets MT5 data: equity=$96,000 → DD=4.0%
T+00:07 — syncUserAccountOnLogin gets MT5 data: equity=$96,100 → DD=3.99%
T+00:09 — scheduledMTSync calculates persistentDD = max(4.8%, 4.0%) = 4.8%, writes to DB
T+00:11 — syncUserAccountOnLogin calculates persistentDD = max(4.8%, 3.99%) = 4.8%, writes to DB
         RESULT: Both writes have same value → safe (coincidence) ✅

Danger scenario: Equity drops to $90,000 between reads:
T+00:05 — scheduledMTSync gets equity=$90,000 → DD=10.0% → breach detected
T+00:07 — syncUserAccountOnLogin reads DB: dd_breach_detected=false (stale)
T+00:09 — scheduledMTSync writes: status=failed, dd_breach_detected=true
T+00:11 — syncUserAccountOnLogin writes: status=failed, dd_breach_detected=true
         MT5 disable API called TWICE for same login ← MT5 broker gets duplicate disable request
         RESULT: Two status=failed writes (idempotent result), two MT5 API disable calls
         syncUserAccountOnLogin does NOT have MT5 disable → only one disable call occurs
         but ChallengeAccount written twice with potentially different breach values ← RACE ❌

Lot size scenario: Same deal from both syncs:
T+00:09 — scheduledMTSync creates TradeRecord { lots: 0.60 } (÷10000)
T+00:11 — syncUserAccountOnLogin checks: existingIds already has trade_id → SKIPS
         RESULT: Only scheduled version is written. Lot = 0.60 ✅
         BUT if syncUserAccountOnLogin wins the race and writes first:
T+00:09 — syncUserAccountOnLogin creates TradeRecord { lots: 0.006 } (÷100000)
T+00:11 — scheduledMTSync checks: existingIds already has trade_id → SKIPS
         RESULT: Lot = 0.006 ← 100x too small ❌ CONFIRMED LOT SIZE BUG
```

**Lot size outcome is determined by whichever sync function writes the TradeRecord FIRST. There is no deterministic winner. This produces corrupted trade statistics in the dashboard.**

### 2.3 automatedDDBreach Specific Analysis

```
Runs every 5 minutes ALONGSIDE scheduledMTSync.
Does NOT fetch from MT5 API — reads DB values only.

CRITICAL UNIQUE FUNCTION: 23:00 UTC Daily Reset
────────────────────────────────────────────────
At 23:00-23:09 UTC:
  ├── Reads ChallengeAccount.balance
  ├── Writes daily_start_balance = current balance (THIS IS THE BASE FOR TOMORROW'S DAILY DD)
  ├── Writes daily_drawdown_used = 0
  ├── Writes daily_pnl = 0
  └── Writes daily_reset_at = now

This is performed by automatedDDBreach ONLY.
scheduledMTSync NEVER resets daily_start_balance.
syncUserAccountOnLogin NEVER resets daily_start_balance.
If automatedDDBreach is removed/stopped, daily_start_balance never updates.
All daily DD calculations use the original account_size forever → daily DD formula breaks.

OVERLAP WITH scheduledMTSync:
  ├── Both read dd_breach_detected, max_drawdown_used, daily_drawdown_used
  ├── Both write status='failed' on breach
  ├── Both call MT5 move-disabled (automatedDDBreach only if account is mt5 + has mt_login)
  └── Race condition: same account updated by both within same 5-min window

UNIQUE TO automatedDDBreach (safe net roles):
  ├── Creates RiskFlag entity on breach ← scheduledMTSync does NOT do this
  ├── Creates Notification entity on breach ← scheduledMTSync does NOT do this
  ├── Sends breach email via emailService ← scheduledMTSync does NOT do this
  └── Catches status≠failed when dd_breach_detected=true (safety net for failed scheduledMTSync writes)
```

### 2.4 Entity Write Summary

| Entity Field | scheduledMTSync | syncUserAccountOnLogin | automatedDDBreach | Winner |
|---|---|---|---|---|
| balance | ✅ | ✅ | ❌ | Race condition |
| equity | ✅ | ✅ | ❌ | Race condition |
| pnl | ✅ | ✅ | ❌ | Race condition |
| max_drawdown_used | ✅ | ✅ | ❌ | Race condition |
| daily_drawdown_used | ✅ | ✅ | ✅ (reset) | Race condition |
| daily_start_balance | ❌ | ❌ | ✅ | automatedDDBreach only |
| dd_breach_detected | ✅ | ✅ | ✅ | Race condition |
| status (failed) | ✅ | ✅ | ✅ | Race condition |
| phase_review_status | ✅ | ❌ | ❌ | scheduledMTSync only |
| TradeRecord (lots) | ✅ (÷10000) | ✅ (÷100000) | ❌ | First writer wins (BUGGY) |
| RiskFlag (breach) | ❌ | ❌ | ✅ | automatedDDBreach only |
| Notification (breach) | ❌ | ❌ | ✅ | automatedDDBreach only |

---

## PHASE 3 — DATABASE SOURCE OF TRUTH

### Users

| Layer | Store | Contents | Writer | Reader |
|---|---|---|---|---|
| **TRUTH** | Base44 Auth | id, email, full_name, role | Base44 platform | base44.auth.me() — entire app |
| Duplicate | UserAccount entity | password_hash, otp_code, login_attempts, username | supabaseAuthBridge, customAuth | ForgotPassword flow only |
| Duplicate | Supabase auth.users | Supabase UUID, email | supabaseAuthBridge (login action — DEAD PATH) | Nobody currently |
| Duplicate | Supabase profiles | email, full_name, phone | syncAllEntitiesToSupabase (manual) | lib/supabaseService.js (NOT imported anywhere) |

**Active production reader: Base44 Auth only.**
**Active production writer: Base44 Auth (registration/profile) + supabaseAuthBridge (password/OTP).**

### Orders

| Layer | Store | Writer | Reader | Truth |
|---|---|---|---|---|
| **TRUTH** | Base44 Order entity | Checkout flow, manualCryptoReview, webhooks | DashboardCheckout, Billing, AdminOrders, AdminPaymentReview | ✅ Base44 |
| Stale copy | Supabase orders table | syncOrdersToSupabase (admin-triggered) | lib/supabaseService.js (NOT imported anywhere) | ❌ Not used |

### ChallengeAccount

| Layer | Store | Writer | Reader | Truth |
|---|---|---|---|---|
| **TRUTH** | Base44 ChallengeAccount entity | provisionMT5Account, scheduledMTSync, syncUserAccountOnLogin, phaseProgressionEngine, manualCryptoReview | Dashboard, MyAccounts, AccountOverview, LiveDDGuard, AdminAccounts | ✅ Base44 |
| Stale copy | Supabase challenge_accounts | syncAllEntitiesToSupabase (admin-triggered) | lib/supabaseService.js (NOT imported anywhere) | ❌ Not used |

**Active writers: 5 different functions.** Race conditions on balance, equity, DD, status fields.

### TradeRecord

| Layer | Store | Writer | Reader | Truth |
|---|---|---|---|---|
| **TRUTH** | Base44 TradeRecord entity | scheduledMTSync (lots ÷10000), syncUserAccountOnLogin (lots ÷100000) | AccountOverview, Analytics, DailySummary, OpenTradesPanel | ✅ Base44 |
| Stale copy | Supabase trade_records | syncAllEntitiesToSupabase (admin-triggered) | lib/supabaseService.js (NOT imported anywhere) | ❌ Not used |

**Lot size bug:** First sync to write a given trade_id wins. Value depends on execution order.

### Certificates

| Layer | Store | Writer | Reader | Truth |
|---|---|---|---|---|
| **TRUTH** | Base44 Certificate entity | generateChallengeCertificate (automation archived), Admin manual | Certificates component | ✅ Base44 |
| Stale copy | Supabase certificates | syncAllEntitiesToSupabase | lib/supabaseService.js (NOT imported) | ❌ Not used |

### Withdrawals

| Layer | Store | Writer | Reader | Truth |
|---|---|---|---|---|
| **TRUTH** | Base44 WithdrawalRequest entity | requestTraderWithdrawal, adminApproveWithdrawal | Withdrawals component, AdminWithdrawals | ✅ Base44 |
| Stale copy | Supabase withdrawal_requests | syncAllEntitiesToSupabase | lib/supabaseService.js (NOT imported) | ❌ Not used |

### KYC

| Layer | Store | Writer | Reader | Truth |
|---|---|---|---|---|
| **TRUTH** | Base44 KYCVerification entity | KYC component (user submit), AdminKYC | KYC component, AdminKYC | ✅ Base44 |
| Stale copy | Supabase kyc_verifications | syncAllEntitiesToSupabase | lib/supabaseService.js (NOT imported) | ❌ Not used |

### Notifications

| Layer | Store | Writer | Reader | Truth |
|---|---|---|---|---|
| **TRUTH** | Base44 Notification entity | Admin, automatedDDBreach, scheduledMTSync, phaseProgressionEngine | Dashboard (react-query), NotificationBanner | ✅ Base44 |
| Stale copy | Supabase notifications | syncAllEntitiesToSupabase | lib/supabaseService.js (NOT imported) | ❌ Not used |

### Affiliate System

| Layer | Store | Writer | Reader | Truth |
|---|---|---|---|---|
| **TRUTH** | Base44 AffiliateProfile + AffiliateCommission entities | Register.jsx (creates profile), createAffiliateCommissions, adminApproveCommission | Affiliate component, AdminAffiliate | ✅ Base44 |
| Stale copy | Supabase affiliate_profiles + affiliate_commissions | syncAllEntitiesToSupabase | lib/supabaseService.js (NOT imported) | ❌ Not used |

### Challenge Rules

| Layer | Store | Writer | Reader | Truth |
|---|---|---|---|---|
| **TRUTH** | Base44 ChallengePlan entity | Admin (AdminChallenges) | ChallengeSelect, Checkout, getChallengePlans | ✅ Base44 |
| Immutable snapshot | ChallengeAccount.rule_snapshot | provisionMT5Account (at purchase) | scheduledMTSync, automatedDDBreach, LiveDDGuard, DisciplinePanel | ✅ Base44 |
| Stale copy | Supabase challenge_plans | syncAllEntitiesToSupabase | lib/supabaseService.js (NOT imported) | ❌ Not used |

### Platform Settings

| Layer | Store | Writer | Reader | Truth |
|---|---|---|---|---|
| **TRUTH** | Base44 PlatformSettings entity | Admin (AdminPlatformSettings) | useFeatureVisibility hook | ✅ Base44 |
| Stale copy | Supabase platform_settings | syncAllEntitiesToSupabase | lib/supabaseService.js (NOT imported) | ❌ Not used |

### Verdict on Supabase Database

**The Supabase database is 100% unused by any active frontend component. lib/supabaseService.js is the ONLY file that reads Supabase tables, and it is imported by ZERO components. All 14+ Supabase table copies are stale dead weight.**

---

## PHASE 4 — REMOVAL SAFETY ANALYSIS

### lib/AuthContext.jsx
**Verdict: SAFE TO DELETE**
- Zero imports in any component
- NOT mounted in App.jsx
- Contains a working auth context but it's completely orphaned
- Deleting it has zero functional impact
- Keeping it is a developer landmine

### lib/customAuth.js
**Verdict: MUST MIGRATE FIRST → then safe to delete the file, but must keep callAuth()**
- `callAuth()` function is ACTIVELY USED by `ForgotPassword.jsx`
- `signInToSupabase()` is dead code but dangerous (creates Supabase sessions)
- `saveSession()`/`loadSession()`/`clearSession()` are dead code (manual localStorage)
- **Migration required:** Move `callAuth()` inline into `ForgotPassword.jsx` or extract to a smaller utility, THEN delete the rest of the file

### lib/supabaseClient.js
**Verdict: MUST MIGRATE FIRST**
- `DashboardSettings.jsx` imports `supabase` and calls `supabase.auth.updateUser()` for password changes
- This is the Settings → Security → "Update Password" feature
- **Migration required:** Fix Settings password change to use Base44 auth or supabaseAuthBridge FIRST, then remove the import from DashboardSettings, then safe to remove `supabaseClient.js`
- Risk if removed before migration: Settings password change breaks silently

### lib/supabaseService.js
**Verdict: SAFE TO DELETE**
- No component imports this file
- All 30+ functions in it read from Supabase tables that nobody else uses
- Deleting it has zero functional impact

### UserAccount entity
**Verdict: MUST KEEP (for now)**
- Stores OTP codes for password reset flow
- Stores password_hash (unused by active login, but used by supabaseAuthBridge reset flow)
- `ForgotPassword.jsx` → `supabaseAuthBridge` → `UserAccount` is the password reset chain
- **Future migration:** Once password reset is migrated to Base44 native, UserAccount can be decommissioned
- **Keep until:** Password reset is migrated

### supabaseAuthBridge
**Verdict: MUST KEEP (partially — strip dead actions)**
- `forgot_password` action: KEEP — ForgotPassword.jsx depends on it
- `reset_password_otp` action: KEEP — ForgotPassword.jsx depends on it
- `resend_otp` action: KEEP — ForgotPassword.jsx depends on it
- `login` action: SAFE TO DELETE — Login.jsx never calls this
- `register` action: SAFE TO DELETE — Register.jsx never calls this
- Other dead actions: SAFE TO DELETE

### syncUserAccountOnLogin
**Verdict: SAFE TO ARCHIVE**
- scheduledMTSync does the same job every 5 minutes
- syncUserAccountOnLogin creates race conditions
- syncUserAccountOnLogin has the lot size bug (÷100000 instead of ÷10000)
- Removing it eliminates 30s parallel writes and the lot size bug
- The 5-minute lag from relying solely on scheduledMTSync is acceptable
- **Only loss:** "Syncing…" / "Synced HH:MM:SS" cosmetic header in DashboardOverview

### useSyncOnLogin
**Verdict: SAFE TO ARCHIVE (after syncUserAccountOnLogin is archived)**
- Pure hook — only drives cosmetic state (syncing, lastSync, syncError)
- Removing it removes the "Syncing…" header text from DashboardOverview
- No data logic depends on this hook

### syncAllEntitiesToSupabase
**Verdict: SAFE TO ARCHIVE**
- No active consumer reads from Supabase tables it writes to
- lib/supabaseService.js is the only reader and it's not imported anywhere
- Archiving it leaves Supabase tables as permanently stale historical snapshots
- No functional impact

### syncOrdersToSupabase
**Verdict: SAFE TO ARCHIVE**
- Subset of syncAllEntitiesToSupabase — same situation
- No active consumer reads from Supabase orders table

### createManualOrderInSupabase
**Verdict: SAFE TO ARCHIVE**
- Writes orders directly to Supabase
- No active component reads Supabase orders
- No dependency chain

### automatedDDBreach
**Verdict: MUST KEEP**
- **23:00 UTC daily reset is IRREPLACEABLE** — no other function sets daily_start_balance
- Removing it causes the daily DD formula to use account_size forever → wrong daily DD
- Also provides: breach safety net, RiskFlag creation, breach emails, breach notifications
- The breach detection portion overlaps with scheduledMTSync but the daily reset does not
- **Cannot archive without migrating the daily reset logic to scheduledMTSync**

### phaseProgressionEngine
**Verdict: MUST KEEP**
- `approve_phase1`: ONLY way to provision Phase 2 MT5 accounts from admin
- `approve_funded`: ONLY way to mark accounts as funded and provision funded MT5 accounts
- `reject_funded` / `suspend_account`: ONLY way to reject funded applications from admin panel
- `compute_risk_score`: Used by admin review flow
- Called actively from AdminAccounts.jsx and AdminFundedReview.jsx
- **CRITICAL BUSINESS FUNCTION — not redundant with scheduledMTSync**

### scheduledMTSync
**Verdict: MUST KEEP**
- Core MT5 sync engine
- Only scheduled job that syncs ALL accounts (service role, no user session required)
- Handles: balance/equity sync, DD enforcement, breach detection, phase pass detection, TradeRecord upsert
- Has the correct lot size formula (÷10000)
- **Removing this breaks the entire dashboard**

---

## PHASE 5 — TARGET PRODUCTION ARCHITECTURE

### 5.1 Target Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 XFUNDED — TARGET ARCHITECTURE (FTMO-LEVEL)                   │
│                       ✅ SINGLE SOURCE OF TRUTH                              │
└─────────────────────────────────────────────────────────────────────────────┘

AUTHENTICATION (1 system)
─────────────────────────
Base44 Auth ONLY
  ├── Login: base44.auth.loginViaEmailPassword() ✅
  ├── Register: base44.auth.register() ✅
  ├── OTP: base44.auth.verifyOtp() ✅
  ├── Password Reset: base44.auth.sendPasswordResetEmail() [if available]
  │     OR: Migrate ForgotPassword to use OTP entity + Base44 native
  ├── Password Change: base44.auth.updateMe({ password }) [needs platform support check]
  │     OR: Migrate DashboardSettings to use supabaseAuthBridge correctly
  └── Session: ONE context (SupabaseAuthContext.jsx — already using Base44)

DATABASE (1 system)
────────────────────
Base44 Entities ONLY
  ├── All entities = source of truth
  └── Supabase = decommissioned (no active readers)

MT5 SYNC (2 paths, no overlap)
────────────────────────────────
[Path 1] getLivePositions → live positions, reads only, no DB writes
[Path 2] scheduledMTSync (5 min) → batch sync all accounts
  ├── Balance + equity
  ├── TradeRecord upsert (lots ÷10000 — correct)
  ├── DD calculation + breach detection
  ├── Phase pass detection
  └── [ABSORB FROM automatedDDBreach] 23:00 UTC daily reset

[Keep automatedDDBreach for safety net + notifications + emails]
  ├── Safety net breach detection (reads DB, no MT5 API)
  ├── 23:00 UTC daily reset (UNIQUE — must keep until migrated to scheduledMTSync)
  ├── RiskFlag creation
  ├── Breach email
  └── Breach notification

ADMIN WORKFLOWS
────────────────
phaseProgressionEngine (keep — admin approval + MT5 provisioning)
  ├── approve_phase1 → Phase 2 MT5 provisioning
  └── approve_funded → Funded MT5 provisioning
```

### 5.2 Migration Order (Safest First)

```
STEP 1 — Zero Risk Deletions (No migration required)
──────────────────────────────────────────────────────
Risk: NONE | Break if fails: NOTHING | Rollback: restore file

A. Delete lib/AuthContext.jsx
B. Delete lib/supabaseService.js
C. Strip from lib/customAuth.js: saveSession(), loadSession(), clearSession(), signInToSupabase()
D. Strip dead actions from supabaseAuthBridge: login, register (keep forgot/reset/resend)
E. Archive functions/fixAdminAuth (one-time script)
F. Archive functions/fixUserAuthIds (one-time script)
G. Archive functions/createManualOrderInSupabase

STEP 2 — Remove Duplicate MT5 Sync (Medium risk)
──────────────────────────────────────────────────
Risk: LOW | Break if fails: cosmetic header missing | Rollback: restore hook + function

H. Remove useSyncOnLogin import from DashboardOverview.jsx
   Remove { syncing, lastSync, syncError } state and header display from DashboardOverview.jsx
I. Archive hooks/useSyncOnLogin.js
J. Archive functions/syncUserAccountOnLogin
   Effect: Eliminates race conditions. Eliminates lot size bug for future trades.
   Existing corrupted lot sizes in DB are not fixed retroactively.

STEP 3 — Remove Supabase Data Copies (Low risk)
──────────────────────────────────────────────────
Risk: LOW | Break if fails: manual admin sync unavailable | Rollback: restore functions

K. Archive functions/syncAllEntitiesToSupabase
L. Archive functions/syncOrdersToSupabase
   Effect: Supabase tables permanently stale. No active reader is affected.

STEP 4 — Fix Settings Password Change (HIGH RISK — test thoroughly)
──────────────────────────────────────────────────────────────────────
Risk: HIGH — touches active user-facing feature
Break if fails: Settings password change broken
Rollback: revert DashboardSettings.jsx to prior version

M. Decide on password change strategy:
   OPTION A: Route through Base44 native (requires Base44 to support in-session password update)
   OPTION B: Route through supabaseAuthBridge (add a 'change_password' action that validates
             current password via UserAccount.password_hash, then updates UserAccount.password_hash
             AND Base44 password if API supports it)
   OPTION C: Accept that password change in Settings only updates one system and clearly document it
N. Remove supabase import from DashboardSettings.jsx
O. If OPTION A or B: test Login → change password → re-login with new password

STEP 5 — Migrate supabase.auth from lib/supabaseClient.js (LOW-MEDIUM risk)
─────────────────────────────────────────────────────────────────────────────
Risk: LOW after Step 4 | Break if fails: nothing left that uses it | Rollback: restore supabaseClient.js

P. After Step 4, verify no component imports from lib/supabaseClient.js
Q. Archive lib/supabaseClient.js (or strip auth methods, keep for realtime if needed)
R. Change persistSession to false as immediate partial fix (stops ghost sessions)

STEP 6 — Future: Consolidate Daily Reset into scheduledMTSync (Optional)
──────────────────────────────────────────────────────────────────────────
Risk: MEDIUM | Break if fails: daily DD formula breaks | Rollback: re-enable automatedDDBreach

S. Add 23:00 UTC logic to scheduledMTSync (check utcHour === 23 and run reset if not done today)
T. Add RiskFlag + Notification + email creation to scheduledMTSync on breach
U. Disable automatedDDBreach automation (keep function archived, not deleted)
   Effect: One fewer 5-min scheduled job. No more parallel breach detection.
```

---

## FINAL OUTPUT

### 1. Current Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       XFUNDED (CURRENT STATE)                                │
│                    ⚠️ MULTIPLE SOURCES OF TRUTH                              │
│                    Production Readiness: 34/100                              │
└─────────────────────────────────────────────────────────────────────────────┘

                          ┌──────────────────────┐
                          │      BROWSER          │
                          │                       │
                          │ localStorage:          │
                          │  xf_supabase_session  │ ← Supabase JWT (auto-restore)
                          │  ff_session           │ ← Legacy manual session
                          │  sessionStorage:      │
                          │  xf_last_sync         │ ← 30s cooldown timer
                          └──────────┬────────────┘
                                     │
               ┌─────────────────────┼─────────────────────┐
               │                     │                     │
      ┌────────▼────────┐  ┌─────────▼─────────┐  ┌───────▼────────┐
      │   Base44 Auth   │  │   Supabase Auth   │  │  UserAccount   │
      │  (primary)      │  │  (silent, active) │  │  entity        │
      │                 │  │                   │  │  (password hash│
      │  Login ✅       │  │  persistSession   │  │  + OTP)        │
      │  Register ✅    │  │  = true ← DANGER  │  │                │
      │  Session ✅     │  │  Writes to:       │  │  Password reset│
      │                 │  │  DashboardSettings│  │  only ✅       │
      │  Password       │  │  "Update Password"│  │                │
      │  change: ❌     │  │  ✅ but isolated  │  │  Login: ❌     │
      └─────────────────┘  └───────────────────┘  └────────────────┘

                    ┌──────────────────────────────────────────┐
                    │            BASE44 ENTITIES               │
                    │         (source of truth ✅)             │
                    │  ChallengeAccount, Order, TradeRecord,   │
                    │  Certificate, Withdrawal, KYC,           │
                    │  Affiliate, Notification, etc.           │
                    └───────────────────┬──────────────────────┘
                                        │ ← 5 concurrent writers
                    ┌───────────────────▼──────────────────────┐
                    │           SUPABASE DATABASE              │
                    │           (stale mirror ❌)              │
                    │  Same tables, never read, days stale     │
                    └──────────────────────────────────────────┘

                    ┌──────────────────────────────────────────┐
                    │             MT5 SYNC ENGINES             │
                    │                                          │
                    │  scheduledMTSync (5 min)  ┐              │
                    │  syncUserAccountOnLogin   ├── RACE       │
                    │    (30 sec)               ┘  CONDITION   │
                    │                                          │
                    │  automatedDDBreach (5 min) ← daily reset │
                    └──────────────────────────────────────────┘
```

### 2. Recommended Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     XFUNDED (TARGET STATE)                                   │
│                     ✅ SINGLE SOURCE OF TRUTH                                │
│                     Target Readiness: 85/100                                 │
└─────────────────────────────────────────────────────────────────────────────┘

                          ┌──────────────────────┐
                          │      BROWSER          │
                          │                       │
                          │ localStorage: NONE    │ ← No manual sessions
                          │ (Base44 handles       │
                          │  session natively)    │
                          └──────────┬────────────┘
                                     │
                          ┌──────────▼────────────┐
                          │     Base44 Auth        │
                          │  (single system)       │
                          │                        │
                          │  Login ✅              │
                          │  Register ✅           │
                          │  OTP ✅                │
                          │  Password reset ✅     │
                          │  Password change ✅    │
                          │  Session ✅            │
                          └──────────┬────────────┘
                                     │
                    ┌────────────────▼─────────────────┐
                    │         BASE44 ENTITIES           │
                    │       (single source of truth)   │
                    │                                   │
                    │  ChallengeAccount ← 2 writers     │
                    │  Order ← 1 writer                 │
                    │  TradeRecord ← 1 writer (÷10000)  │
                    │  All others ← 1 writer each       │
                    └───────────────────────────────────┘

                    ┌──────────────────────────────────────────┐
                    │             MT5 SYNC (2 paths)           │
                    │                                          │
                    │  [Live] getLivePositions → read only     │
                    │  [Batch] scheduledMTSync (5 min)         │
                    │    + absorbs daily reset at 23:00 UTC    │
                    │                                          │
                    │  automatedDDBreach: KEEP                 │
                    │    (safety net + emails + notifications) │
                    └──────────────────────────────────────────┘
```

### 3. Critical Issues List

| # | Issue | Severity | Status |
|---|---|---|---|
| C-01 | Settings password change calls `supabase.auth.updateUser()` — does not update Base44 auth or UserAccount | 🔴 CRITICAL | Active production bug |
| C-02 | ForgotPassword resets `UserAccount.password_hash` — does not update Base44 auth password | 🔴 CRITICAL | Active production bug |
| C-03 | `supabaseClient.js` has `persistSession: true` — Supabase JWT auto-restores from localStorage silently | 🔴 CRITICAL | Active session contamination |
| C-04 | Lot size bug: `syncUserAccountOnLogin` divides volume by 100000, `scheduledMTSync` divides by 10000 | 🔴 CRITICAL | Data corruption (first writer wins) |
| C-05 | `syncUserAccountOnLogin` + `scheduledMTSync` run concurrently, both write `ChallengeAccount` | 🟠 HIGH | Active race condition |
| C-06 | `syncUserAccountOnLogin` missing paid order whitelist check — can auto-breach unfunded accounts | 🟠 HIGH | False breach risk |
| C-07 | `automatedDDBreach` runs concurrently with `scheduledMTSync` — both write `status=failed` and call MT5 disable | 🟠 HIGH | Duplicate API calls |
| C-08 | `lib/AuthContext.jsx` orphaned auth context — developer landmine | 🟠 HIGH | Silent breakage risk |
| C-09 | 14+ entities duplicated across Base44 + Supabase with no sync schedule | 🟡 MEDIUM | Silent data divergence |
| C-10 | `customAuth` backend function is a complete parallel auth system with no active callers | 🟡 MEDIUM | Dead code confusion |
| C-11 | `resetPassword` admin function updates `UserAccount.password_hash` — does not update Base44 auth | 🟡 MEDIUM | Admin password reset is ineffective |
| C-12 | `useSyncOnLogin` runs every 30 seconds, even when the account has no MT5 activity | 🟡 MEDIUM | Unnecessary API load |
| C-13 | 23:00 UTC daily reset lives only in `automatedDDBreach` — not atomic with `scheduledMTSync` | 🟡 MEDIUM | Architectural fragility |
| C-14 | `lib/customAuth.js` `signInToSupabase()` is dead code that creates Supabase sessions if ever called | 🟡 MEDIUM | Latent session contamination |

### 4. Migration Plan

**SAFE TO EXECUTE NOW (Steps 1-3 from Phase 5 above):**

```
Step 1: Zero-risk deletions (1 hour work)
  A. Delete lib/AuthContext.jsx
  B. Delete lib/supabaseService.js
  C. Strip lib/customAuth.js: remove saveSession, loadSession, clearSession, signInToSupabase
  D. Strip supabaseAuthBridge: remove login and register dead actions
  E-G. Archive fixAdminAuth, fixUserAuthIds, createManualOrderInSupabase

Step 2: Remove duplicate MT5 sync (2 hours work + test)
  H. Remove useSyncOnLogin from DashboardOverview.jsx
  I. Archive useSyncOnLogin.js
  J. Archive syncUserAccountOnLogin function
  TEST: Dashboard still shows updated balance after 5 minutes ✅

Step 3: Remove Supabase data copies (30 min)
  K. Archive syncAllEntitiesToSupabase
  L. Archive syncOrdersToSupabase
```

**REQUIRES CAREFUL PLANNING (Steps 4-6):**

```
Step 4: Fix Settings password change (design decision required)
  CHOSEN PATH: Add 'change_password' action to supabaseAuthBridge
    - Receives { current_password, new_password }
    - Validates current_password against UserAccount.password_hash
    - Updates UserAccount.password_hash to new hash
    - Attempts base44.auth.updateMe({ password }) if Base44 supports it
  ALTERNATIVE: Remove password change from Settings temporarily until
               a proper Base44-native flow is confirmed working.
  RISK: If migration fails, users cannot change passwords at all.

Step 5: Remove supabaseClient.js Supabase auth (after Step 4)
  - Change persistSession: false immediately as quick win (stops ghost sessions)
  - After Settings is fixed, remove supabase import from DashboardSettings
  - Archive or gut lib/supabaseClient.js

Step 6 (future): Absorb daily reset into scheduledMTSync
  - Add isDailyResetWindow logic to scheduledMTSync
  - Test at 23:00 UTC
  - Disable automatedDDBreach automation
```

### 5. Risk Assessment

| Step | Risk Level | What Breaks if Failed | Rollback |
|---|---|---|---|
| Delete AuthContext, supabaseService | None | Nothing | Restore from git |
| Strip customAuth dead code | None | Nothing | Restore from git |
| Strip dead supabaseAuthBridge actions | None | Nothing | Restore from git |
| Archive migration one-time scripts | None | Nothing | Restore from archive |
| Remove useSyncOnLogin from DashboardOverview | Low | Cosmetic sync badge gone; 5-min lag on balance | Restore hook import |
| Archive syncUserAccountOnLogin | Low | 5-min lag on balance (scheduled sync still runs) | Restore function |
| Archive syncAllEntitiesToSupabase | Low | Manual admin Supabase sync unavailable | Restore from archive |
| Fix Settings password change | High | Settings security tab broken; users cannot change passwords | Revert DashboardSettings.jsx |
| Set persistSession: false in supabaseClient | Medium | No ghost Supabase sessions (intended), but verify DashboardSettings is fully migrated first | Revert supabaseClient.js |
| Absorb daily reset into scheduledMTSync | Medium-High | Daily DD formula breaks if reset fails silently | Re-enable automatedDDBreach automation |

### 6. Estimated Cleanup Complexity

| Category | Effort | Files Affected |
|---|---|---|
| Phase A (safe deletions) | 1-2 hours | 7 files |
| Phase B (remove duplicate sync) | 2-4 hours | 3 files + testing |
| Phase C (remove Supabase data copies) | 1 hour | 2 functions |
| Phase D (fix password change) | 4-8 hours | 2 files + new supabaseAuthBridge action |
| Phase E (remove supabaseClient auth) | 2 hours | 1 file |
| Phase F (absorb daily reset) | 4-6 hours | 1 function + testing at 23:00 UTC |
| **Total** | **~16-25 hours** | |

### 7. Production Readiness Score: 34 / 100

**Breakdown:**

| Category | Score | Max | Notes |
|---|---|---|---|
| Authentication Integrity | 3 | 20 | 3 parallel systems, password changes broken |
| Data Source Consistency | 6 | 20 | 14 Supabase duplicates, no active readers |
| MT5 Sync Reliability | 8 | 20 | Race conditions, lot size bug, duplicate writes |
| Security | 10 | 20 | No cross-user data leak (email-scoped), but ghost Supabase sessions |
| Code Maintainability | 7 | 20 | Dead code landmines, orphaned contexts, legacy systems |

**After Phase A+B+C cleanup (zero-risk steps):** ~52 / 100
**After Phase D+E (password fix):** ~72 / 100
**After Phase F (daily reset absorbed):** ~85 / 100
**After full cleanup + audit:** ~92 / 100 (remaining 8 points: MT5 lag, no websocket, business logic docs)

---

*Audit completed: 2026-06-13 | Evidence-based only | No code modified*