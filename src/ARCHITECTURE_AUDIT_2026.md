# XFUNDED PLATFORM — FULL ARCHITECTURE AUDIT
**Date:** 2026-06-13  
**Type:** Pre-Fix Architecture Audit (Read-Only — No fixes applied)  
**Purpose:** Identify all hidden conflicts, duplicate systems, and mixed data sources before further bug fixes

---

## VERDICT FIRST

**The platform is running: B) MULTIPLE SOURCES OF TRUTH**

Evidence:
- Users exist in: Base44 Auth + Supabase Auth + `UserAccount` entity (3 places)
- Every major entity is duplicated in Supabase via `syncAllEntitiesToSupabase`
- Authentication resolves differently depending on: call site, function, hook, context, and execution environment
- `supabaseAuthBridge` is still creating Supabase JWT sessions during login/register
- `lib/customAuth.js` still calls `supabase.auth.signInWithPassword` for password resets
- `lib/AuthContext.jsx` is a completely separate third auth context that exists in the codebase but is NOT used in `App.jsx` — but could be imported by any component accidentally

---

## PART 1: AUTHENTICATION AUDIT

### All auth-related files

| File | Purpose | Auth System Used | Status | Notes |
|---|---|---|---|---|
| `lib/SupabaseAuthContext.jsx` | Primary auth provider for entire app | **Base44 Auth** (base44.auth.me()) | ✅ Active | Renamed from Supabase but now uses Base44 auth |
| `lib/CustomAuthContext.jsx` | Re-export shim | **Base44 Auth** (via SupabaseAuthContext) | ✅ Active | Pure re-export — no logic |
| `lib/AuthContext.jsx` | **THIRD auth context** — completely different | **Base44 Auth** (base44.auth.me()) | ⚠️ ORPHANED | NOT used in App.jsx — but still importable by any component |
| `lib/customAuth.js` | Auth utility / session helpers | **MIXED: Base44 + Supabase** | 🔴 DANGER | Still calls `supabase.auth.signInWithPassword` for password resets |
| `lib/supabaseClient.js` | Supabase SDK instance | **Supabase Auth** (full SDK) | 🔴 ACTIVE | Still initializes Supabase auth with `persistSession: true`, `autoRefreshToken: true` |
| `api/base44Client.js` | Base44 SDK instance | **Base44 Auth** | ✅ Active | Clean — no mixed auth |
| `pages/Login.jsx` | Login page | **Base44 Auth** (base44.auth.loginViaEmailPassword) | ✅ Active | Uses Base44 auth directly |
| `pages/Register.jsx` | Register page | **Base44 Auth** (base44.auth.register, base44.auth.verifyOtp) | ✅ Active | Uses Base44 auth directly |
| `functions/supabaseAuthBridge` | Backend auth bridge | **BOTH: Base44 entities + Supabase Auth admin** | 🔴 CRITICAL | Creates Supabase JWT sessions during login + registration |
| `functions/customAuth` | Legacy custom auth function | **MIXED** | ⚠️ Legacy | Exists — likely called by something |
| `functions/resetPassword` | Password reset | Unknown | ⚠️ Unknown | Exists — may still call Supabase |
| `functions/googleAuth` | Google OAuth | Unknown | ⚠️ Unknown | Exists — may still call Supabase |
| `hooks/useStaffPermissions.js` | Staff permission checking | Unknown | ⚠️ Unknown | May use either auth |

### The Core Authentication Problem

The login flow has THREE parallel paths for the same user:

**Path 1 — Frontend login (what users see):**
```
User clicks Sign In
→ base44.auth.loginViaEmailPassword()   ← Base44 Auth
→ refreshUser() → base44.auth.me()      ← Base44 Auth
→ User object has Base44 ID
```

**Path 2 — Backend session created simultaneously (hidden):**
```
supabaseAuthBridge (action=login):
→ Validates against UserAccount entity   ← Base44 Entity
→ adminSupabase.auth.admin.updateUserById() ← Supabase Auth Admin
→ adminSupabase.auth.signInWithPassword() ← Supabase Auth
→ Returns Supabase JWT access_token/refresh_token
```

**Path 3 — Password reset path:**
```
lib/customAuth.js → signInToSupabase():
→ supabase.auth.signInWithPassword()    ← Supabase Auth
```

**Result:** On any given login, BOTH a Base44 session AND a Supabase session are created. The frontend uses the Base44 session. The `supabaseAuthBridge` creates and returns a Supabase JWT that the frontend currently **ignores** — but `supabaseClient.js` with `persistSession: true` may pick it up from localStorage automatically.

### Where User Identity Can Resolve Differently

| Scenario | Identity Source | Result |
|---|---|---|
| Frontend component using `useSupabaseAuth()` | Base44 `auth.me()` | Base44 user ID |
| Frontend component using `useCustomAuth()` | Base44 `auth.me()` (re-export) | Base44 user ID (same) |
| Frontend component importing `lib/AuthContext.jsx` directly | Base44 `auth.me()` | Base44 user ID (but different loading state logic) |
| Backend function using `createClientFromRequest(req)` | Base44 session token from request headers | Base44 user ID |
| Backend function using `supabase.auth.getUser()` | Supabase JWT | Supabase user ID (DIFFERENT from Base44 ID) |
| `lib/customAuth.js` `saveSession()` | localStorage `ff_session` | Manual legacy session |
| `lib/supabaseClient.js` SDK | Supabase localStorage session `xf_supabase_session` | Supabase user ID |

**CRITICAL:** Base44 user ID ≠ Supabase user ID. There are potentially 3 different "user ID" values for the same physical user:
1. `base44.auth.me().id` — Base44 platform ID
2. `supabase.auth.getUser().data.user.id` — Supabase UUID
3. `UserAccount.id` (Base44 entity) — yet another Base44 entity record ID

---

## PART 2: DATABASE AUDIT

### Feature-by-Feature Data Source Map

| Feature | Source of Truth | Read Source | Write Source | Update Source | Sync | Conflicts? |
|---|---|---|---|---|---|---|
| **Users** | Base44 Auth + `UserAccount` entity | Base44 `auth.me()` | `supabaseAuthBridge` (creates in BOTH) | `UserAccount.update()` | None | 🔴 TRIPLE STORE |
| **Orders** | Base44 `Order` entity | Base44 entities | `manualCryptoReview`, webhooks | Webhooks → Base44 entity | `syncOrdersToSupabase` → Supabase | 🔴 DUPLICATE |
| **ChallengeAccount** | Base44 `ChallengeAccount` entity | Base44 entities (user-scoped) | `provisionMT5Account` | `scheduledMTSync`, `syncUserAccountOnLogin` | `syncAllEntitiesToSupabase` → Supabase | 🔴 DUPLICATE |
| **TradeRecord** | Base44 `TradeRecord` entity | Base44 entities | `scheduledMTSync`, `syncUserAccountOnLogin` | Same | `syncAllEntitiesToSupabase` → Supabase | 🔴 DUPLICATE |
| **Certificates** | Base44 `Certificate` entity | Base44 entities | Admin / `generateChallengeCertificate` | Admin | `syncAllEntitiesToSupabase` → Supabase | DUPLICATE |
| **Withdrawals** | Base44 `WithdrawalRequest` entity | Base44 entities | User → `requestTraderWithdrawal` | Admin → `adminApproveWithdrawal` | `syncAllEntitiesToSupabase` → Supabase | DUPLICATE |
| **Notifications** | Base44 `Notification` entity | Base44 entities | Admin | Admin | `syncAllEntitiesToSupabase` → Supabase | DUPLICATE |
| **KYC** | Base44 `KYCVerification` entity | Base44 entities | User submission | Admin review | `syncAllEntitiesToSupabase` → Supabase | DUPLICATE |
| **Affiliate System** | Base44 `AffiliateProfile` + `AffiliateCommission` | Base44 entities | Registration, orders | Admin | `syncAllEntitiesToSupabase` → Supabase | DUPLICATE |
| **Challenge Rules** | Base44 `ChallengePlan` entity + `rule_snapshot` on account | Base44 entities | Admin `ChallengePlan` | Admin | `syncAllEntitiesToSupabase` → Supabase | DUPLICATE |
| **Live Trade Feed** | MT5 Tritech API (live) | `getLivePositions` function → MT5 API | Not stored | N/A | Not stored | ✅ CLEAN |
| **Dashboard Stats** | `ChallengeAccount` fields + `TradeRecord` | Base44 entities | `scheduledMTSync` | Same | N/A (computed) | ✅ CLEAN |
| **MT5 Balance/Equity** | MT5 Tritech API | `scheduledMTSync` polls every 5 min | MT5 API | Written to `ChallengeAccount` | 5 min lag | ⚠️ STALE |
| **Drawdown Engine** | `ChallengeAccount.rule_snapshot` | Base44 entity | Written at provisioning | Never | N/A | ✅ CLEAN |
| **Phase Progression** | `ChallengeAccount.phase` + `rule_snapshot` | Base44 entity | `scheduledMTSync` | Same | N/A | ✅ CLEAN |
| **Risk Engine** | `TradeRecord` + `ChallengeAccount` | Base44 entities | `scheduledMTSync` | Same | N/A | ✅ CLEAN |

---

## PART 3: DUPLICATE DATA DETECTION

### UserAccount Entity — MOST DANGEROUS DUPLICATE

**The `UserAccount` entity is a full duplicate of Base44's built-in `User` entity.**

| Where | What's stored | Who writes it |
|---|---|---|
| Base44 Auth (internal) | `id`, `email`, `full_name`, `role`, `created_date` | Base44 platform |
| `UserAccount` entity | `email`, `username`, `full_name`, `password_hash`, `is_verified`, `auth_user_id`, OTP fields, `login_attempts`, `locked_until` | `supabaseAuthBridge` |
| Supabase `auth.users` | Supabase UUID, email, password, `user_metadata`, `app_metadata` | `supabaseAuthBridge` admin API |
| Supabase `profiles` table | email, full_name, phone, country, etc. | `syncAllEntitiesToSupabase`, `syncOrdersToSupabase` |

**Authority:** Base44 Auth  
**Should be removed:** `UserAccount` entity (once `supabaseAuthBridge` is decommissioned)  
**Risk:** CRITICAL — `supabaseAuthBridge` manages password storage, login attempts, and account locking in `UserAccount`, but the frontend authenticates via Base44 Auth. These two systems can get out of sync, causing **silent auth failures where Base44 accepts a login but `supabaseAuthBridge` rejects it (or vice versa)**.

### ChallengeAccount — TRIPLE DUPLICATE

| Where | Authority | Freshness |
|---|---|---|
| Base44 `ChallengeAccount` entity | ✅ SOURCE OF TRUTH | Real-time |
| Supabase `challenge_accounts` table | ❌ STALE COPY | Updated by manual admin sync only |
| MT5 Tritech Manager | External source | Polled every 5 min |

**Risk:** HIGH — If `syncAllEntitiesToSupabase` has not been run recently, Supabase has stale account data. Any future component that accidentally reads from Supabase instead of Base44 will show wrong data.

### Orders — DUPLICATE

| Where | Authority | Freshness |
|---|---|---|
| Base44 `Order` entity | ✅ SOURCE OF TRUTH | Real-time |
| Supabase `orders` table | ❌ STALE COPY | Updated by `syncOrdersToSupabase` |

**Risk:** MEDIUM — Supabase `orders` table may have different payment_status than Base44 entity.

### TradeRecord — DUPLICATE

| Where | Authority | Freshness |
|---|---|---|
| Base44 `TradeRecord` entity | ✅ SOURCE OF TRUTH | Updated by scheduledMTSync |
| Supabase `trade_records` table | ❌ STALE COPY | Updated by `syncAllEntitiesToSupabase` only |

### All other entities (Certificates, KYC, Withdrawals, Affiliates, Notifications, Coupons, etc.)

All of these exist in BOTH Base44 entities AND Supabase tables.  
The Base44 entity is always authoritative. The Supabase copy is a manually-triggered stale copy.

---

## PART 4: CONFLICT DETECTION

| ID | Location | Description | Severity |
|---|---|---|---|
| C-01 | `lib/supabaseClient.js` | Supabase client initialized with `persistSession: true` + `autoRefreshToken: true`. A Supabase JWT session from a previous login may still be active in localStorage under key `xf_supabase_session`. This session is completely separate from the Base44 session. Any code that accidentally calls `supabase.auth.getUser()` will return a DIFFERENT user object than `base44.auth.me()`. | 🔴 CRITICAL |
| C-02 | `lib/customAuth.js` | `signInToSupabase()` function actively calls `supabase.auth.signInWithPassword()`. It is exported and importable. If any component calls this during password reset, it creates a Supabase session that persists in localStorage and may later be picked up by `supabaseClient.js` auto-refresh, causing identity split. | 🔴 CRITICAL |
| C-03 | `functions/supabaseAuthBridge` | During every login, `adminSupabase.auth.signInWithPassword()` is called and a Supabase JWT is returned to the frontend. The frontend (Login.jsx) ignores this token — but the Supabase SDK's `persistSession: true` may still write it to storage. This is the root cause of the previously experienced "mobile vs desktop" session inconsistency. | 🔴 CRITICAL |
| C-04 | `lib/AuthContext.jsx` | A THIRD auth context exists but is NOT mounted in `App.jsx`. If any developer imports `useAuth` from this file, they get a completely different auth state instance — unconnected to the primary `SupabaseAuthProvider`. This is a silent landmine for the future. | 🔴 HIGH |
| C-05 | `lib/customAuth.js` | `saveSession()` / `loadSession()` write to `localStorage['ff_session']`. This is a completely manual session persistence system that runs alongside both Base44 sessions and Supabase sessions. A user could have 3 concurrent session objects in localStorage. | 🔴 HIGH |
| C-06 | `functions/supabaseAuthBridge` login handler | `supabaseAuthBridge` validates passwords against `UserAccount.password_hash` (custom SHA-256 hash). Base44 Auth validates passwords against its own internal password store. If a user changes their password via Base44's native mechanism, the `UserAccount.password_hash` is NOT updated — causing login to fail the next time `supabaseAuthBridge` is invoked. | 🔴 HIGH |
| C-07 | `syncAllEntitiesToSupabase` | Runs entirely on demand (admin-triggered). If not run, Supabase tables are stale. There is no automated sync scheduled. Any future code that reads from Supabase will silently read outdated data. | 🔴 HIGH |
| C-08 | `functions/syncUserAccountOnLogin` | Duplicates almost all logic from `scheduledMTSync`. Both functions: fetch MT5 balance, calculate DD, write breach flags, upsert TradeRecords. If both run simultaneously (which they do — login sync + 5-min cron), race conditions on DD persistence are possible. Example: login sync calculates `persistentOverallDD=4.9%`, scheduled sync calculates `4.8%`, Math.max is supposed to be applied but with parallel writes, the lower value may win if the scheduled sync reads DB before the login sync writes. | 🟠 HIGH |
| C-09 | Dashboard's `useSyncOnLogin` hook | Calls `syncUserAccountOnLogin` every 30 seconds while dashboard is open. This runs alongside `scheduledMTSync` (every 5 min). Two separate functions fetching the same MT5 data, writing to the same `ChallengeAccount` records, creating the same `TradeRecord` entities. The `TradeRecord` upsert is idempotent but the `ChallengeAccount` update writes (balance, equity, DD) are not atomic — parallel writes can produce race conditions. | 🟠 HIGH |
| C-10 | `scheduledMTSync` vs `syncUserAccountOnLogin` | Both calculate `persistentOverallDD` using `Math.max(db_value, current_value)` but they READ the DB value at the start of execution. If both run simultaneously, both read the same original value, both compute the same result, and both write — this is safe but wasteful. If one reads AFTER the other has already written a higher value, Math.max still holds. This is safe but only by coincidence. | 🟡 MEDIUM |
| C-11 | `ChallengeAccount` RLS vs `syncAllEntitiesToSupabase` | The Base44 `ChallengeAccount` entity has `read: owner`. The Supabase `challenge_accounts` table has its own RLS. If a user queries Supabase directly for challenge accounts, RLS on the Supabase table applies — which may be different from Base44 RLS. Supabase RLS is in `supabase/rls_policies.sql` and may not match Base44 owner-only policy. | 🟡 MEDIUM |
| C-12 | `UserAccount` OTP fields vs `functions/sendOTP` + `functions/verifyOTP` | The `supabaseAuthBridge` stores OTP in `UserAccount.otp_code`. The separate `sendOTP` / `verifyOTP` functions store OTP in the `OTP` entity. Two different OTP systems for the same purpose. | 🟡 MEDIUM |
| C-13 | `functions/supabaseAuthBridge` register vs `base44.auth.register` | Registration in Register.jsx uses `base44.auth.register()` (Base44 native). But `supabaseAuthBridge` has its own `register` action that creates a `UserAccount` entity + Supabase auth user. These are two completely different registration paths. If a user registers via `base44.auth.register()`, NO `UserAccount` entity is created, and `supabaseAuthBridge` login will fail for them because it looks up users in `UserAccount`. | 🔴 CRITICAL |
| C-14 | MT5 balance vs stored balance | `scheduledMTSync` and `syncUserAccountOnLogin` both fetch from Tritech API every 5 min / 30 sec respectively. Between syncs, the dashboard shows stale balance data from the DB. Users see their equity 5+ minutes behind actual MT5 state. `getLivePositions` provides live equity via open positions, but this doesn't affect the stored `balance` field. | 🟡 MEDIUM |

---

## PART 5: LEGACY CODE AUDIT

### Files that are no longer needed or are dangerous

| File | Status | Reason | Action Required |
|---|---|---|---|
| `lib/AuthContext.jsx` | 🔴 ORPHANED LANDMINE | Not used in App.jsx. Third auth context. Will cause confusion for any developer who imports it. | DELETE — or it WILL cause a bug eventually |
| `lib/customAuth.js` | 🔴 DANGEROUS LEGACY | Exports `signInToSupabase()` which creates Supabase sessions. Also exports `saveSession()`/`loadSession()` for manual localStorage sessions. | STRIP Supabase auth calls — keep only as a shim if `callAuth` is still used |
| `functions/supabaseAuthBridge` | 🔴 MIXED — MUST AUDIT | Creates Supabase JWT sessions on every login. Currently the only system managing `UserAccount` entity, password hashing, login attempts, and account locking — none of which exist in Base44 native auth. | DECISION REQUIRED: Either migrate fully to Base44 native OR keep as sole auth backend |
| `functions/syncAllEntitiesToSupabase` | 🟠 LEGACY | Manually copies all Base44 entities to Supabase. Supabase tables are not read by any current frontend component. | ARCHIVE unless Supabase is being used for analytics/reporting |
| `functions/syncOrdersToSupabase` | 🟠 LEGACY | Narrower version of syncAllEntities. Only syncs orders. Redundant. | ARCHIVE |
| `functions/createManualOrderInSupabase` | 🟠 LEGACY | Creates orders in Supabase directly. | ARCHIVE |
| `functions/syncUserAccountOnLogin` | 🟠 DUPLICATE | Almost identical logic to `scheduledMTSync`. Creates race conditions. | MERGE into scheduledMTSync OR remove |
| `functions/fixAdminAuth` | ⚠️ ONE-TIME SCRIPT | Likely a migration utility. Should not exist as a callable function. | DELETE after verifying no longer needed |
| `functions/fixUserAuthIds` | ⚠️ ONE-TIME SCRIPT | Migration utility. | DELETE after verifying no longer needed |
| `functions/supabaseAuthBridge` `register` action | 🟡 DEAD PATH | Register.jsx uses `base44.auth.register()` not `supabaseAuthBridge register`. This action never gets called. | DELETE this action from supabaseAuthBridge |
| `lib/supabaseClient.js` `subscribeToTable()` | 🟡 UNUSED | Uses Supabase realtime. No component currently uses this. | Remove if Supabase realtime is not being used |
| `lib/supabaseClient.js` `signInWithEmail()`, `signUpWithEmail()`, `signInWithGoogle()` | 🟡 DEAD CODE | No component calls these. | Remove |
| `lib/supabaseService.js` | ⚠️ UNKNOWN | File exists. Content unknown. | Audit and likely delete |
| `functions/automatedDDBreach` | 🟡 SUPERSEDED | `scheduledMTSync` now handles breach detection inline. This function is likely a duplicate. | AUDIT and likely delete |
| `functions/phaseProgressionEngine` | 🟡 SUPERSEDED | `scheduledMTSync` now handles phase pass detection inline. | AUDIT — may be used by some automation |
| Multiple `supabase/*.sql` files | 🟠 LEGACY | 20+ SQL migration files that describe Supabase schema. These are not run automatically. | Archive or document clearly |

---

## PART 6: RISK ENGINE AUDIT

### LiveDDGuard
- **Source of truth:** `ChallengeAccount` entity from Base44 (email-scoped, now fixed)
- **Account source:** Base44 entity `filter({ user_email: currentUser.email })`
- **Rule source:** `account.rule_snapshot` (written at provisioning from `ChallengePlan`)
- **Ownership source:** `currentUser.email` from `base44.auth.me()`
- **Problem:** Polls `syncMatchTraderAccount` function every 15s. This is a THIRD sync path alongside `scheduledMTSync` (5 min) and `syncUserAccountOnLogin` (30 sec). Three systems writing to the same `ChallengeAccount.balance/equity` fields.
- **Risk:** 🟠 HIGH — Triple-write race condition

### DDBreachModal
- **Source of truth:** Breach data passed from LiveDDGuard via `onBreach` prop
- **Data source:** LiveDDGuard real-time check, not from DB
- **Problem:** None significant — display only
- **Risk:** ✅ LOW

### scheduledMTSync
- **Source of truth:** MT5 Tritech API → Base44 entities
- **Account source:** `base44.asServiceRole.entities.ChallengeAccount.list()` (ALL accounts, then filtered)
- **Rule source:** `account.rule_snapshot` (correct)
- **Ownership source:** `account.user_email` (correct, guards applied)
- **Problem:** Does NOT read from Supabase. Single source of truth for batch sync. CORRECT.
- **Risk:** ✅ LOW (after recent fixes)

### syncUserAccountOnLogin
- **Source of truth:** Same as scheduledMTSync — MT5 Tritech API → Base44
- **Problem:** Runs via `useSyncOnLogin` hook every 30 SECONDS from the dashboard. This means if a user has the dashboard open, their accounts are being synced every 30 seconds PLUS every 5 minutes from the scheduled job. That's up to 12 writes per minute on the same entity records. The breach detection logic reads DB values at the start — so concurrent writes to `dd_breach_detected` are possible.
- **Risk:** 🟠 HIGH — unnecessary duplication + race condition risk

### PhaseProgressionEngine (function)
- **Source of truth:** Base44 entities
- **Problem:** `scheduledMTSync` already does phase pass detection inline. The existence of a separate `phaseProgressionEngine` function means phase passes could be triggered TWICE for the same account — once by scheduled sync, once by whatever automation triggers `phaseProgressionEngine`.
- **Risk:** 🟠 HIGH — double phase pass possible, double `FundedAccountReview` creation

---

## PART 7: CURRENT ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           XFUNDED PLATFORM (CURRENT)                        │
│                         ⚠️ MULTIPLE SOURCES OF TRUTH ⚠️                     │
└─────────────────────────────────────────────────────────────────────────────┘

USER
 │
 ├──── AUTHENTICATION (3 parallel systems)
 │      │
 │      ├── [A] Base44 Auth (base44.auth.me())
 │      │       └── Frontend: Login.jsx, Register.jsx, SupabaseAuthContext
 │      │       └── Backend: all functions via createClientFromRequest
 │      │       └── Session: Base44 platform token
 │      │
 │      ├── [B] Supabase Auth (supabase.auth.*)
 │      │       └── Created by: supabaseAuthBridge backend function
 │      │       └── Stored in: localStorage['xf_supabase_session']
 │      │       └── Auto-refresh: YES (persistSession: true in supabaseClient.js)
 │      │       └── Used by frontend: NO (currently ignored by Login.jsx)
 │      │       └── ⚠️ Still running silently in the browser
 │      │
 │      └── [C] UserAccount Entity (custom auth layer)
 │              └── Managed by: supabaseAuthBridge
 │              └── Stores: password_hash, login_attempts, OTP codes
 │              └── ⚠️ Can diverge from Base44 Auth password store
 │
 ├──── DATABASE (2 parallel systems)
 │      │
 │      ├── [1] Base44 Entities (PRIMARY — SOURCE OF TRUTH)
 │      │       └── ChallengeAccount, Order, TradeRecord, Certificate,
 │      │           WithdrawalRequest, KYC, AffiliateProfile, Notification, etc.
 │      │       └── RLS enforced via Base44 platform
 │      │       └── Frontend reads ONLY from here
 │      │
 │      └── [2] Supabase PostgreSQL (STALE COPY)
 │              └── challenge_accounts, orders, trade_records, certificates,
 │                  withdrawal_requests, kyc_verifications, affiliate_profiles,
 │                  notifications, coupons, payment_gateways, etc.
 │              └── Written by: syncAllEntitiesToSupabase (manual, admin-only)
 │              └── Age: Unknown — may be days/weeks stale
 │              └── Frontend reads: NOTHING (currently)
 │              └── ⚠️ Will cause silent bugs if any component reads from Supabase
 │
 ├──── MT5 / TRADING DATA (3 sync paths)
 │      │
 │      ├── [X] getLivePositions (live, no storage)
 │      │       └── Called: every 5s from AccountOverview dashboard
 │      │       └── Returns: live open positions
 │      │       └── Writes to DB: NO
 │      │
 │      ├── [Y] syncUserAccountOnLogin / useSyncOnLogin hook
 │      │       └── Called: every 30s while dashboard is open
 │      │       └── Writes to: ChallengeAccount, TradeRecord (Base44)
 │      │       └── ⚠️ Parallel writes with scheduledMTSync
 │      │
 │      └── [Z] scheduledMTSync
 │              └── Called: every 5 minutes (scheduled automation)
 │              └── Writes to: ChallengeAccount, TradeRecord (Base44)
 │              └── ⚠️ Parallel writes with syncUserAccountOnLogin
 │
 └──── DASHBOARD
        └── Reads: Base44 entities (correct)
        └── Auth: Base44 auth via SupabaseAuthContext (correct)
        └── Real-time: base44.entities.ChallengeAccount.subscribe (correct)
        └── Cache: TanStack Query with email-scoped keys (correct after recent fixes)
```

---

## PART 8: RECOMMENDED ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      XFUNDED PLATFORM (TARGET ARCHITECTURE)                  │
│                            ✅ SINGLE SOURCE OF TRUTH                         │
└─────────────────────────────────────────────────────────────────────────────┘

USER
 │
 ├──── AUTHENTICATION (1 system)
 │      └── Base44 Auth ONLY
 │              └── base44.auth.register, loginViaEmailPassword, me(), logout()
 │              └── NO supabaseAuthBridge login/register actions
 │              └── NO Supabase JWT creation
 │              └── NO UserAccount entity for password storage
 │              └── NO localStorage manual sessions
 │              └── ONE context: SupabaseAuthContext.jsx (renamed to AuthContext.jsx)
 │
 ├──── DATABASE (1 system)
 │      └── Base44 Entities ONLY
 │              └── All entities are source of truth
 │              └── Supabase tables: DELETE or archive (read-only historical backup)
 │              └── syncAllEntitiesToSupabase: ARCHIVE (admin-only backup tool only)
 │
 ├──── MT5 / TRADING DATA (2 paths — no overlap)
 │      │
 │      ├── getLivePositions → live open trades, no DB writes
 │      │
 │      └── scheduledMTSync (every 5 min) → ChallengeAccount, TradeRecord
 │              └── REMOVE syncUserAccountOnLogin / useSyncOnLogin (duplicate)
 │              └── Keep LiveDDGuard but make it READ-ONLY (no writes)
 │
 └──── DASHBOARD
        └── Reads Base44 entities (unchanged)
        └── Auth via single AuthContext (unchanged)
        └── TanStack Query with email-scoped keys (unchanged — already fixed)
```

---

## PART 9: COMPLETE ISSUE SUMMARY

### Mixed Systems (Things using more than one system for the same job)

1. Authentication: Base44 Auth + Supabase Auth + UserAccount entity + localStorage sessions
2. User storage: Base44 Auth + Supabase `auth.users` + `UserAccount` entity + Supabase `profiles` table
3. MT5 sync: `scheduledMTSync` + `syncUserAccountOnLogin` + `LiveDDGuard` (all write to same records)
4. OTP system: `UserAccount.otp_code` + separate `OTP` entity
5. Password management: Base44 internal + `UserAccount.password_hash` (custom SHA-256)
6. Phase progression: `scheduledMTSync` inline + `phaseProgressionEngine` function (both exist)
7. Breach detection: `scheduledMTSync` + `automatedDDBreach` function + `LiveDDGuard` (all three)

### Duplicate Systems (Same data in multiple places)

1. `ChallengeAccount`: Base44 entity + Supabase `challenge_accounts` table
2. `Order`: Base44 entity + Supabase `orders` table
3. `TradeRecord`: Base44 entity + Supabase `trade_records` table
4. `Certificate`: Base44 entity + Supabase `certificates` table
5. `WithdrawalRequest`: Base44 entity + Supabase `withdrawal_requests` table
6. `KYCVerification`: Base44 entity + Supabase `kyc_verifications` table
7. `AffiliateProfile`: Base44 entity + Supabase `affiliate_profiles` table
8. `AffiliateCommission`: Base44 entity + Supabase `affiliate_commissions` table
9. `Notification`: Base44 entity + Supabase `notifications` table
10. `Coupon`: Base44 entity + Supabase `coupons` table
11. `PaymentGateway`: Base44 entity + Supabase `payment_gateways` table
12. `ChallengePlan`: Base44 entity + Supabase `challenge_plans` table
13. `PlatformSettings`: Base44 entity + Supabase `platform_settings` table
14. `User` identity: Base44 Auth + `UserAccount` entity + Supabase `auth.users` + Supabase `profiles`

### Hidden Dependencies

1. `supabaseAuthBridge` login secretly creates a Supabase JWT even though the frontend ignores it
2. `lib/supabaseClient.js` with `persistSession: true` will auto-restore any Supabase session from a previous login even if the user thinks they're using Base44 auth
3. `lib/AuthContext.jsx` is a landmine — not used but importable
4. `lib/customAuth.js` `saveSession()` writes to localStorage without any component cleaning it up
5. `useSyncOnLogin` hook in `DashboardOverview` triggers MT5 sync every 30s — not obvious from the dashboard code
6. `phaseProgressionEngine` may have its own automation — if so, it runs in addition to the phase detection inside `scheduledMTSync`
7. `automatedDDBreach` may have its own automation — if so, it runs in addition to breach detection inside `scheduledMTSync`

### Potential Future Bugs from Architecture Conflicts

| Bug | Trigger | Severity |
|---|---|---|
| User logs in on mobile, Base44 session created. Previous Supabase session from desktop auto-refreshes via `persistSession: true`. User has two conflicting auth identities in the same browser. | Any login + Supabase session still in localStorage | 🔴 CRITICAL |
| User changes password via Base44 native password reset. `UserAccount.password_hash` is not updated. User cannot log in on any device where `supabaseAuthBridge` is the auth path. | Password reset via Base44 | 🔴 CRITICAL |
| Developer imports `useAuth` from `lib/AuthContext.jsx` by mistake (it's a valid-looking hook). Gets a completely different loading state — no user data. Component appears to be always unauthenticated. | Code maintenance | 🔴 HIGH |
| `scheduledMTSync` runs at 12:00:00. `syncUserAccountOnLogin` runs at 12:00:03. Both read `dd_breach_detected=false`, both calculate DD=9.9% (below 10% limit). Neither breaches. Then at 12:00:10, sync runs again, reads DB, DD is still 9.9% — no issue. But if DD jumped to 10.1% between reads, both functions might BOTH try to set breach=true simultaneously. | Concurrent sync execution near DD limit | 🟠 HIGH |
| Admin runs `syncAllEntitiesToSupabase`. Future developer builds a new feature that reads from Supabase. Feature works in testing. In production, data is stale because sync hasn't run in a week. Feature shows wrong account states. | Any new Supabase-based feature | 🔴 HIGH |
| `phaseProgressionEngine` automation fires for an account. `scheduledMTSync` also fires for the same account in the same 5-minute window. Both detect phase pass. `FundedAccountReview` is created twice (idempotent check may fail under race condition). User gets two funded review records. Admin approves both. User gets two funded accounts. | Phase pass timing | 🟠 HIGH |
| `automatedDDBreach` function + `scheduledMTSync` both detect a breach simultaneously. Both set `status=failed`. Both call MT5 `move-disabled`. MT5 gets two disable calls for same login — may cause MT5 error log spam or unexpected state. | DD breach timing | 🟡 MEDIUM |

---

## PART 10: FINAL ANSWER — IS THE PLATFORM SINGLE OR MULTIPLE SOURCE OF TRUTH?

### **ANSWER: MULTIPLE SOURCES OF TRUTH**

**Evidence:**

1. **Authentication:** 3 systems store user identity simultaneously — Base44 Auth, Supabase Auth, `UserAccount` entity
2. **User passwords:** Stored in both Base44 Auth internal store AND `UserAccount.password_hash` (custom SHA-256). They can diverge.
3. **Account data:** Every `ChallengeAccount` record exists in both Base44 entities AND Supabase tables. They can have different values if sync hasn't run.
4. **Trade data:** Every `TradeRecord` exists in both Base44 entities AND Supabase tables.
5. **MT5 sync:** Three functions write to the same `ChallengeAccount` record — `scheduledMTSync`, `syncUserAccountOnLogin`, and (indirectly) `LiveDDGuard`.
6. **Phase progression:** Two systems detect phase pass — `scheduledMTSync` inline + `phaseProgressionEngine` function.
7. **Breach detection:** Three systems — `scheduledMTSync` inline + `automatedDDBreach` function + `LiveDDGuard` client.

**The previous "mobile responsive" bug that was actually an auth conflict is a perfect example** of how this architecture produces symptoms completely disconnected from root causes. The platform will continue to produce unpredictable bugs until the authentication system is reduced to a single source of truth.

---

## RECOMMENDED FIXES (PRIORITY ORDER)

Do NOT implement yet — this list is for planning only.

| Priority | Action | Risk Removed |
|---|---|---|
| P0 | Disable `persistSession: true` in `lib/supabaseClient.js` OR remove Supabase auth helpers | Prevents ghost Supabase sessions |
| P0 | Delete `lib/AuthContext.jsx` | Removes landmine auth context |
| P0 | Strip Supabase session creation from `supabaseAuthBridge` login/register actions | Stops dual-session creation |
| P1 | Remove `useSyncOnLogin` hook and `syncUserAccountOnLogin` function | Eliminates duplicate MT5 sync |
| P1 | Delete or archive `automatedDDBreach` function (after verifying it has no active automation) | Eliminates duplicate breach detection |
| P1 | Delete or archive `phaseProgressionEngine` function (after verifying it has no active automation) | Eliminates duplicate phase detection |
| P2 | Remove all Supabase write calls from `syncAllEntitiesToSupabase` entity types that are never read back | Simplifies infrastructure |
| P2 | Delete `lib/customAuth.js` `signInToSupabase()` and manual localStorage session helpers | Removes dead code + session leakage |
| P3 | Decision: keep `supabaseAuthBridge` ONLY for password management features (locking, OTP) that Base44 native auth doesn't support, OR migrate those features to Base44 native | Clarifies auth architecture |

---

*Report generated: 2026-06-13 | XFUNDED Platform Architecture Audit*