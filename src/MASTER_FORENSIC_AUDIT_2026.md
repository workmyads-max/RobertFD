# XFUNDED PLATFORM — MASTER FORENSIC DEPENDENCY AUDIT
**Date:** 2026-06-14  
**Type:** Complete Platform Audit (Read-Only — No Code Changes)  
**Evidence-Based — No Assumptions**

---

## SECTION 1 — AUTHENTICATION

### 1.1 Login Flow

**Path:** `Login.jsx` → `base44.auth.loginViaEmailPassword(email, password)`

| Layer | Action | Status |
|---|---|---|
| Base44 Auth | Validates password, creates session token | ✅ Active |
| Supabase Auth | Nothing called by Login.jsx directly | ✅ Silent |
| UserAccount entity | NOT read during login | ❌ Bypassed |
| OTP | NOT required for login (Base44 native login has no 2FA gate) | ✅ |

**Session created:** Base44 platform token, stored internally by Base44 SDK.  
**Supabase side-effect:** If `localStorage['xf_supabase_session']` contains a stale Supabase JWT from a previous session, `supabaseClient.js` (persistSession: true) auto-refreshes it silently in the background. The user now has TWO active sessions in the same browser.

---

### 1.2 Register Flow

**Path:** `Register.jsx` → `base44.auth.register({ email, password, full_name })` → OTP → `base44.auth.verifyOtp(otp)`

| Layer | Action | Status |
|---|---|---|
| Base44 Auth | Creates user, issues OTP, activates on verify | ✅ Active |
| Supabase Auth | NOT called | ✅ Clean |
| UserAccount entity | NOT created | ❌ Not created |
| OTP entity | NOT used — Base44 handles OTP internally | ✅ |

**Post-registration:** `Register.jsx` calls `base44.entities.AffiliateProfile.create(...)` to auto-create an affiliate profile for the new user.  
**Gap:** If a user registers via Base44 native but later tries password reset via ForgotPassword, the reset path looks up `UserAccount.filter({ email })` — which **returns empty** because no UserAccount was created. Password reset silently fails for all users who registered via Base44 native.

---

### 1.3 OTP Verification

**Three independent OTP systems coexist:**

| System | Storage | Used By | Status |
|---|---|---|---|
| Base44 native OTP | Base44 internal | Registration (`base44.auth.verifyOtp()`) | ✅ Active |
| supabaseAuthBridge OTP | `UserAccount.otp_code` | ForgotPassword (password reset) | ✅ Active |
| `OTP` entity (`functions/sendOTP` + `functions/verifyOTP`) | `OTP` entity | NO active caller | ❌ Dead |

---

### 1.4 Forgot Password Flow

**Path:** `Login.jsx` renders `ForgotPassword.jsx` → `callAuth()` in `lib/customAuth.js` → `supabaseAuthBridge`

```
Step 1: User enters email
  → callAuth('forgot_password', { email })
    → supabaseAuthBridge: UserAccount.filter({ email })
    → UserAccount.update({ otp_code, otp_expires_at })
    → emailService: sends OTP email

Step 2: User enters OTP
  → callAuth('reset_password_otp', { userId, otp, newPassword })
    → supabaseAuthBridge: validates otp === UserAccount.otp_code
    → UserAccount.update({ password_hash: newHash })
    → ✅ UserAccount.password_hash updated
    → ❌ Base44 Auth password NOT updated
    → ❌ Supabase Auth password NOT updated

RESULT: Password reset updates only UserAccount.password_hash.
Since Login.jsx uses base44.auth.loginViaEmailPassword() (NOT UserAccount),
the password change has ZERO effect on the user's actual login.
The ForgotPassword flow is functionally a NO-OP for all Base44-registered users.
```

**CRITICAL BUG:** ForgotPassword is broken by design for all users registered via `base44.auth.register()`. The flow resets a password in a system (`UserAccount`) that is never used for login authentication.

---

### 1.5 Reset Password (Admin Tool)

**Path:** `functions/resetPassword` (admin-only)

```
admin calls resetPassword({ email, newPassword })
  → UserAccount.filter({ email })
  → hashPassword(newPassword) using legacy SHA-256 (static salt 'ff_salt_2026_')
  → UserAccount.update({ password_hash })
  → ❌ Base44 Auth NOT updated
  → ❌ Supabase Auth NOT updated
```

**Same bug as ForgotPassword.** The admin reset also only writes to `UserAccount.password_hash` which is unused by the active login path. Admin password resets are also no-ops.

---

### 1.6 Settings Password Change

**Path:** `DashboardSettings.jsx` → `supabase.auth.updateUser({ password: newPassword })`

```
User enters new password → clicks Update Password
  → supabase.auth.updateUser({ password: newPassword })
    → ✅ Supabase Auth password updated
    → ❌ Base44 Auth password NOT updated
    → ❌ UserAccount.password_hash NOT updated
```

**Bug:** Updates a different auth system than the one Login.jsx uses. After changing password via Settings:
- Old password still works for `base44.auth.loginViaEmailPassword()` ← what the app uses
- New password works only for Supabase auth flows ← not used anywhere

**Three password change mechanisms, zero of them update all three systems. None of them update Base44 Auth, which is the actual login system.**

---

### 1.7 Google Login

**Path:** `Login.jsx` → Google OAuth button → `functions/googleAuth`

| Layer | Action | Status |
|---|---|---|
| googleAuth function | Exists, handles redirect | Unknown — not audited in detail |
| Base44 Auth | May or may not receive session | Unknown |
| Supabase Auth | May create Supabase session | Unknown |

**Status:** Not fully traceable without reading `functions/googleAuth`. Marked as ⚠️ UNKNOWN.

---

### 1.8 Session Creation Map

| Location | Session Created | Stored | Active |
|---|---|---|---|
| `base44.auth.loginViaEmailPassword()` | Base44 token | Base44 SDK internal | ✅ |
| `base44.auth.register()` + `verifyOtp()` | Base44 token | Base44 SDK internal | ✅ |
| `supabaseClient.js` (`persistSession: true`) | Supabase JWT (auto-restore) | `localStorage['xf_supabase_session']` | ⚠️ Runs silently |
| `lib/customAuth.js` `signInToSupabase()` | Supabase JWT | `localStorage['xf_supabase_session']` | ❌ Never called |
| `lib/customAuth.js` `saveSession()` | Custom token | `localStorage['ff_session']` | ❌ Never called |
| `functions/customAuth` `verify_login` | Custom token | Returned to frontend, ignored | ❌ Dead |

**Up to 3 session types can coexist in localStorage simultaneously. Only Base44 token is used by the app.**

---

### 1.9 Authentication Source of Truth Summary

| Feature | Works | Auth System Used | Broken? |
|---|---|---|---|
| Login | ✅ | Base44 Auth | No |
| Register | ✅ | Base44 Auth | No |
| Registration OTP | ✅ | Base44 native | No |
| Forgot Password | ❌ BROKEN | UserAccount entity | YES — writes unused system |
| Settings Password Change | ❌ BROKEN | Supabase Auth | YES — writes unused system |
| Admin Password Reset | ❌ BROKEN | UserAccount entity | YES — writes unused system |
| Google Login | ⚠️ UNKNOWN | Unknown | Unknown |

---

## SECTION 2 — MT5 ARCHITECTURE

### 2.1 scheduledMTSync (every 5 min, service role)

**Reads:** All active/funded/passed/pending ChallengeAccount records (service role — ALL users)  
**MT5 Endpoints:** `/api/v1/user/userget`, `/api/v1/deal/get-deal-history` (3 variants), `/api/v1/order/get-order-history`  
**Writes to DB:**

| Entity | Fields Written |
|---|---|
| ChallengeAccount | balance, equity, pnl, win_rate, total_trades, max_drawdown_used, daily_drawdown_used, profit_target_progress, high_water_mark, last_synced_at, dd_breach_detected, dd_breach_type, dd_breach_time, dd_breach_value, status (→failed on breach) |
| TradeRecord | Creates new closed deals — lots = rawVol ÷ 10000 |
| ChallengeAccount (phase pass) | status=passed, phase_review_status=pending_review, phase_passed_at |
| FundedAccountReview | Created on phase2 pass detection |
| Notification | Created on phase1/phase2 pass |

**Calculates DD:** Yes — using `rule_snapshot.daily_dd_limit`, `rule_snapshot.max_dd_limit`, `rule_snapshot.trailing_dd`  
**Creates notifications:** Yes — phase pass only  
**Triggers MT5 disable:** Yes — on breach via `move-disabled`  
**Lot size divisor:** `rawVol / 10000` ← declared "Tritech volume is in centi-lots (÷10000)"

---

### 2.2 syncUserAccountOnLogin (every 30 sec, user session)

**Reads:** Current user's active/funded/passed ChallengeAccount records only (user scope)  
**MT5 Endpoints:** Same as scheduledMTSync  
**Writes to DB:**

| Entity | Fields Written |
|---|---|
| ChallengeAccount | balance, equity, pnl, win_rate, total_trades, max_drawdown_used, daily_drawdown_used, profit_target_progress, high_water_mark, last_synced_at, dd_breach_detected, status (→failed on breach) |
| TradeRecord | Creates new closed deals — lots = rawVol ÷ 100000 |

**Differences from scheduledMTSync:**
- Missing: `pending` status in filter (scheduledMTSync includes pending accounts)
- Missing: paid order whitelist check (can auto-breach unfunded paid accounts)
- Missing: corrupted DD guard (can't reset DB if API was previously corrupted)
- Missing: phase pass detection
- Missing: MT5 broker-side disable on breach
- Missing: notifications on any event
- Lot divisor is **10x smaller** — `rawVol / 100000` vs `rawVol / 10000`

---

### 2.3 automatedDDBreach (every 5 min, scheduler token)

**Reads:** All active/passed/funded ChallengeAccount records from DB (no MT5 API call)  
**MT5 Endpoints:** Only `move-disabled` on breach (not userget/deal-history)  
**Writes to DB:**

| Entity | Fields Written |
|---|---|
| ChallengeAccount | status=failed, dd_breach_detected, dd_breach_type, dd_breach_time, dd_breach_value |
| ChallengeAccount (23:00 reset) | daily_pnl=0, daily_drawdown_used=0, daily_start_balance=balance, daily_reset_at=now |
| RiskFlag | Creates on breach |
| Notification | Creates on breach |

**Unique role:** ONLY function that resets `daily_start_balance` at 23:00 UTC. Without this, the daily DD formula uses the original account_size forever, making daily DD monitoring inaccurate from day 2 onward.

---

### 2.4 LiveDDGuard (every 15 sec, frontend component)

**Reads:** ChallengeAccount from TanStack cache (email-scoped, real-time reactive)  
**MT5 Endpoints:** Calls `syncMatchTraderAccount` function (which calls MT5 userget)  
**Writes to DB:** NONE — only updates TanStack cache  
**Calculates DD:** Yes — same formula as others  
**Triggers:** onBreach callback → DDBreachModal in Dashboard  
**Unique role:** Only system that shows a real-time breach modal to the user before the 5-min scheduled sync catches it

**Critical note:** LiveDDGuard calls `syncMatchTraderAccount` — a function named for MatchTrader but appears to be an MT5 single-account sync. This is a **THIRD concurrent MT5 reader** alongside scheduledMTSync and syncUserAccountOnLogin.

---

### 2.5 getLivePositions (called every 5 sec from AccountOverview)

**Reads:** MT5 `getpositions` or equivalent for one account  
**Writes to DB:** NONE  
**Purpose:** Display live open positions with PnL in the dashboard  
**Data:** Returns positions array, equity, balance for live display only

---

### 2.6 MT5 Concurrent Writers Summary

| Writer | Frequency | Scope | Lot Formula | DB Write |
|---|---|---|---|---|
| scheduledMTSync | Every 5 min | ALL accounts | ÷10000 | ✅ Yes |
| syncUserAccountOnLogin | Every 30 sec | Current user only | ÷100000 ← WRONG | ✅ Yes |
| LiveDDGuard | Every 15 sec | Current user only | N/A (cache only) | ❌ No |
| getLivePositions | Every 5 sec | One account | N/A (no storage) | ❌ No |
| automatedDDBreach | Every 5 min | ALL accounts | N/A (reads DB only) | ✅ Yes (daily reset + breach) |

**Race condition window:** At any given second with the dashboard open, up to 3 functions can be reading and writing the same ChallengeAccount records. The `last_synced_at` field will show whichever writer ran last — not necessarily the most accurate data.

---

## SECTION 3 — ACCOUNT OVERVIEW AUDIT

All data sourced from `AccountOverview.jsx` component.

| Metric | UI Component | Entity | Function | MT5 Endpoint | Refresh |
|---|---|---|---|---|---|
| **Balance** | ActiveAccountCard | ChallengeAccount.balance | scheduledMTSync | /api/v1/user/userget | 5 min + 30 sec + 15 sec |
| **Live Equity** | ActiveAccountCard.liveEquity | ChallengeAccount.equity + live positions | getLivePositions | /api/v1/user/getpositions | 5 sec |
| **Unrealized PnL** | ActiveAccountCard.liveUnrealizedPnl | Computed: equity - balance | getLivePositions | — | 5 sec |
| **Today's P&L** | DisciplinePanel.todayPnl | TradeRecord (filter by today) | scheduledMTSync | /api/v1/deal/get-deal-history | 5 min |
| **Win Rate** | StatisticsPanel | ChallengeAccount.win_rate | scheduledMTSync | derived from closed deals | 5 min |
| **Total Trades** | StatisticsPanel | ChallengeAccount.total_trades | scheduledMTSync | derived from closed deals | 5 min |
| **Avg Win** | StatisticsPanel | Computed from TradeRecord | TradeRecord entity | — | 5 sec |
| **Avg Loss** | StatisticsPanel | Computed from TradeRecord | TradeRecord entity | — | 5 sec |
| **Profit Factor** | StatisticsPanel | Computed: (avgWin × wins) / (avgLoss × losses) | TradeRecord entity | — | 5 sec |
| **Expectancy** | StatisticsPanel | Computed: (winRate × avgWin) - (lossRate × avgLoss) | TradeRecord entity | — | 5 sec |
| **Avg RRR** | StatisticsPanel | Computed: avgWin / avgLoss | TradeRecord entity | — | 5 sec |
| **Total Lots** | StatisticsPanel | Computed: sum(TradeRecord.lots) | TradeRecord entity | — | 5 sec |
| **Winning Trades** | StatisticsPanel | Computed: TradeRecord where pnl > 0 | TradeRecord entity | — | 5 sec |
| **Losing Trades** | StatisticsPanel | Computed: TradeRecord where pnl < 0 | TradeRecord entity | — | 5 sec |
| **Daily DD Used** | DisciplinePanel | ChallengeAccount.daily_drawdown_used | scheduledMTSync | — | 5 min |
| **Max DD Used** | DisciplinePanel | ChallengeAccount.max_drawdown_used | scheduledMTSync | — | 5 min |
| **Profit Target %** | ActiveAccountCard progress bar | ChallengeAccount.profit_target_progress | scheduledMTSync | — | 5 min |
| **Trading Days** | DisciplinePanel | Computed from TradeRecord.close_time (unique days) | TradeRecord entity | — | 5 sec |
| **Discipline Score** | DisciplineGauge | Computed from all objectives | ChallengeAccount + TradeRecord | — | 5 sec |
| **Open Positions** | OpenTradesPanel | getLivePositions response | getLivePositions | — | 5 sec |
| **Closed Trades** | OpenTradesPanel (toggle) | TradeRecord (status=closed) | TradeRecord entity | — | 5 sec |
| **Daily Summary** | DailySummaryPanel | TradeRecord grouped by close_time date | TradeRecord entity | — | 5 sec |
| **Account History** | AccountHistorySection | ChallengeAccount.list (all statuses) | ChallengeAccount entity | — | 5 sec |

**Lot size issue in displayed values:** Since both scheduledMTSync (÷10000) and syncUserAccountOnLogin (÷100000) write TradeRecords, and idempotency is based on `trade_id` (first writer wins), the displayed lot sizes in:
- StatisticsPanel (Total Lots)
- DailySummaryPanel (Lots column)
- OpenTradesPanel trade rows

...may be 10x too small or correct depending on which sync function first wrote each trade.

---

## SECTION 4 — CHALLENGE RULES ENGINE

### 4.1 ChallengePlan → rule_snapshot Chain

```
CREATION:
Admin creates ChallengePlan via AdminChallenges
  → ChallengePlan entity stores: daily_dd, max_dd, phase1_target, phase2_target,
    min_trading_days, profit_split, leverage, max_lots, etc.

PURCHASE:
User purchases → manualCryptoReview or payment webhook calls provisionMT5Account
  → provisionMT5Account reads ChallengePlan matching challenge_type + account_size
  → Writes rule_snapshot to ChallengeAccount:
    {
      daily_dd_limit: plan.daily_dd,
      max_dd_limit: plan.max_dd,
      trailing_dd: plan.challenge_type === 'instant_light',
      phase1_target: plan.phase1_target,
      phase2_target: plan.phase2_target,
      min_trading_days: plan.min_trading_days,
      leverage: plan.leverage,
      max_lots: plan.max_lots,
      weekend_holding: plan.weekend_holding,
      overnight_holding: plan.overnight_holding,
      news_trading: plan.news_trading,
      hedging: plan.hedging,
      profit_split: plan.profit_split,
    }

ENFORCEMENT:
scheduledMTSync reads ChallengeAccount.rule_snapshot (never reads ChallengePlan directly)
automatedDDBreach reads ChallengeAccount.rule_snapshot
LiveDDGuard reads ChallengeAccount.rule_snapshot
DisciplinePanel reads ChallengeAccount.rule_snapshot
```

### 4.2 Exact Rule Formulas

**Profit Target:**
```
profit_target_progress = max(0, (balance - account_size) / account_size × 100)
Pass condition: profit_target_progress >= rule_snapshot.phase1_target (or phase2_target)
```

**Daily DD (Institutional formula):**
```
base = ChallengeAccount.daily_start_balance || account_size
daily_dd = max(0, (base - equity) / base × 100)
Persistent: max(stored_daily_drawdown_used, current_daily_dd)
Breach: persistent_daily_dd >= rule_snapshot.daily_dd_limit
Reset: At 23:00 UTC → daily_start_balance = current_balance, daily_drawdown_used = 0
```

**Overall DD (standard accounts):**
```
overall_dd = max(0, (account_size - equity) / account_size × 100)
Persistent: max(stored_max_drawdown_used, current_overall_dd)
Breach: persistent_overall_dd >= rule_snapshot.max_dd_limit
```

**Trailing DD (instant_light only):**
```
hwm = max(stored_high_water_mark, current_balance)
trailing_dd = max(0, (hwm - equity) / hwm × 100)
Persistent: max(stored_max_drawdown_used, current_trailing_dd)
Breach: persistent_trailing_dd >= rule_snapshot.max_dd_limit
```

**Min Trading Days:**
```
trading_days = count of unique calendar dates (Bangkok UTC+7) with at least one closed trade
Pass condition: trading_days >= rule_snapshot.min_trading_days
```

**Note:** Min trading days is displayed in DisciplinePanel but is NOT enforced in the automated phase pass detection in scheduledMTSync. The phase pass check only looks at `profit_target_progress >= target`. A trader could pass Phase 1 with just 1 trading day if they hit the profit target.

---

## SECTION 5 — DRAWDOWN ENGINE

### 5.1 DD Calculation Locations and Formulas

| System | Daily DD Formula | Overall DD Formula | Inputs | Realtime? |
|---|---|---|---|---|
| scheduledMTSync | `(daily_start_balance - equity) / daily_start_balance × 100` | `(account_size - equity) / account_size × 100` | equity from MT5 userget | ⚠️ 5 min lag |
| syncUserAccountOnLogin | Identical to scheduledMTSync | Identical | equity from MT5 userget | ⚠️ 30 sec lag |
| automatedDDBreach | Reads `daily_drawdown_used` from DB | Reads `max_drawdown_used` from DB | Stored DB values only | ❌ DB values only |
| LiveDDGuard | `(daily_start_balance - equity) / daily_start_balance × 100` | `(account_size - equity) / account_size × 100` | equity from syncMatchTraderAccount | ⚠️ 15 sec lag |
| DisciplinePanel (frontend) | Same formula, reads from ChallengeAccount entity | Same | ChallengeAccount.daily_drawdown_used | ⚠️ Shows cached DB value |

### 5.2 What Is Realtime vs Persisted

| Value | Realtime Source | Persistence | Update Frequency |
|---|---|---|---|
| `equity` | MT5 userget | ChallengeAccount.equity | Every 5 min (scheduled) or 30 sec (login sync) |
| `balance` | MT5 userget | ChallengeAccount.balance | Every 5 min (scheduled) or 30 sec (login sync) |
| `daily_drawdown_used` | Computed on each sync | ChallengeAccount.daily_drawdown_used | Every 5 min — NEVER decreases (max rule) |
| `max_drawdown_used` | Computed on each sync | ChallengeAccount.max_drawdown_used | Every 5 min — NEVER decreases (max rule) |
| `daily_start_balance` | ChallengeAccount.balance at 23:00 UTC | ChallengeAccount.daily_start_balance | Once per trading day (automatedDDBreach) |
| `high_water_mark` | max(hwm, balance) | ChallengeAccount.high_water_mark | Every 5 min — NEVER decreases |
| Live floating PnL | getLivePositions (no storage) | NOT stored | Every 5 sec (display only) |

### 5.3 FTMO-Level Realtime DD

**Current capability:** No.

FTMO processes DD checks against live equity from open positions in real time. The current architecture:
1. Syncs equity every 5 minutes via `scheduledMTSync`
2. Checks locally-cached equity via `LiveDDGuard` every 15 seconds (calls `syncMatchTraderAccount`)
3. Shows live floating PnL via `getLivePositions` every 5 seconds (display only, no DD enforcement)

**Gap:** Between getLivePositions (display) and LiveDDGuard (DD check) there is a 15-second window where a trader can open a position, breach DD, and close before the next LiveDDGuard check. For FTMO-level enforcement, the DD check needs to run with every equity change, not on a polling interval.

**Verdict:** Current architecture is polling-based, not event-driven. True FTMO-level enforcement requires a WebSocket or equity push webhook from the MT5 broker directly.

---

## SECTION 6 — TRADE RECORD SYSTEM

### 6.1 Creation

Two functions create TradeRecord entities. **The lot size formula is different in each.**

| Function | Lot Formula | Comment in Code |
|---|---|---|
| `scheduledMTSync` | `rawVol / 10000` | "10000=1.00 lot, 1000=0.10 lot" |
| `syncUserAccountOnLogin` | `rawVol / 100000` | "100=0.001 lots, 60000=0.60 lots" |

**Both cannot be correct.** Only one interpretation of the Tritech raw volume field can be accurate. Based on typical MT5 broker conventions (volume = lots × 10000 for standard 100k accounts), the scheduled sync formula (`÷10000`) is more likely correct.

**Race condition:** Both functions use this idempotency check:
```
existingIds = Set of existing TradeRecord.trade_id for this account
new deals = closedTrades where trade_id NOT in existingIds
```
If `syncUserAccountOnLogin` writes a trade first (÷100000 = 0.006 lots), `scheduledMTSync` will see the trade_id already exists and skip it, leaving the 10x-wrong lot value permanently in the database.

**Impact on displayed metrics:**
- `Total Lots` in StatisticsPanel will be 10x too small for affected trades
- Lot sizes in DailySummaryPanel rows will be wrong
- Risk calculations based on lots (if any) will be affected

### 6.2 Trade Record Fields

From the `scheduledMTSync` mapping (the authoritative writer):

| TradeRecord Field | Source |
|---|---|
| account_id | ChallengeAccount.account_id |
| user_email | ChallengeAccount.user_email |
| trade_id | d.deal_id or d.Ticket or d.PositionID |
| symbol | d.symbol or d.Symbol |
| type | BUY or SELL (d.action: 0=BUY, 1=SELL) |
| lots | rawVol / 10000 |
| entry | d.openPrice |
| close | d.closePrice |
| pnl | d.profit |
| status | 'closed' (all Tritech deal history records are closed) |
| open_time | d.openTime (ISO or unix timestamp) |
| close_time | d.closeTime or d.TimeMsc |

---

## SECTION 7 — PHASE PROGRESSION

### 7.1 Phase 1 Pass Detection (Automatic)

```
scheduledMTSync (every 5 min):
  For each active account in phase1 where phase_review_status is 'none':
    if profit_target_progress >= rule_snapshot.phase1_target:
      ChallengeAccount.update({ status: 'passed', phase_review_status: 'pending_review', phase_passed_at })
      Notification.create('Phase 1 Passed — Under Review')
      [NOTE: Min trading days NOT checked here — gap in enforcement]
```

### 7.2 Phase 1 Admin Approval → Phase 2 Provisioning

```
Admin sees pending_review in AdminAccounts panel
Admin clicks "Approve Phase 1"
  → invoke('phaseProgressionEngine', { action: 'approve_phase1', account_id })
    → Checks: phase_review_status !== 'approved' (idempotency guard)
    → ChallengeAccount.update({ phase: 'phase2', phase_review_status: 'approved', profit_target_progress: 0 })
    → loadMT5Creds(sr) → TradingPlatformProvider entity
    → Constructs group: FF_2STEP_{size}K_{model}_P2
    → MT5: /api/v1/user/useradd (new Phase 2 account)
    → MT5: /api/v1/user/depositwithbal (initial balance)
    → ChallengeAccount.update({ status: 'active', phase: 'phase2', mt_login, mt_password, mt_server })
    → emailService: sends phase1_passed email
    → Notification.create('Phase 2 Activated')
```

### 7.3 Phase 2 Pass Detection (Automatic)

```
scheduledMTSync (every 5 min):
  For each active account in phase2 where funded_review_status is 'none':
    if profit_target_progress >= rule_snapshot.phase2_target:
      ChallengeAccount.update({ status: 'passed', funded_review_status: 'pending_review', phase_passed_at })
      FundedAccountReview.create({ ... account stats ... }) [idempotent: skips if exists]
      Notification.create('Phase 2 Passed — Under Review')
```

### 7.4 Funded Approval → Funded MT5 Provisioning

```
Admin sees pending_review in AdminFundedReview panel
Admin clicks "Approve Funded"
  → invoke('phaseProgressionEngine', { action: 'approve_funded', review_id })
    → Checks: account.status !== 'funded' (idempotency guard)
    → loadMT5Creds(sr) → TradingPlatformProvider entity
    → Constructs group: FF_FUNDED_{size}K_{model}_LIVE
    → MT5: /api/v1/user/useradd (new funded account)
    → MT5: /api/v1/user/depositwithbal (initial balance)
    → ChallengeAccount.update({ status: 'funded', funded_review_status: 'approved', mt_login, mt_password, ... })
    → FundedAccountReview.update({ status: 'approved', funded_mt5_login, ... })
    → emailService: sends funded_approved email
    → Notification.create('Funded Account Approved')
```

### 7.5 Phase Progression Dependency Chain

```
provisionMT5Account (initial purchase)
  ↓
ChallengeAccount.phase = 'phase1', status = 'active'
  ↓
scheduledMTSync (auto-detection, every 5 min)
  ↓
phase_review_status = 'pending_review'
  ↓
Admin approval via phaseProgressionEngine.approve_phase1
  ↓
ChallengeAccount.phase = 'phase2', new MT5 account provisioned
  ↓
scheduledMTSync (auto-detection, every 5 min)
  ↓
funded_review_status = 'pending_review' + FundedAccountReview created
  ↓
Admin approval via phaseProgressionEngine.approve_funded
  ↓
ChallengeAccount.status = 'funded', funded MT5 account provisioned
```

---

## SECTION 8 — WITHDRAWALS

### 8.1 Lifecycle

```
USER REQUESTS:
Withdrawals.jsx:
  1. KYC check: KYCVerification.filter({ user_email }) → must be 'approved'
  2. Funded accounts check: ChallengeAccount.list → filter status='funded'
  3. User submits form → requestTraderWithdrawal({ account_id, amount, method, wallet_address })
     → Backend: validates funded status, calculates profit split, creates WithdrawalRequest
     → WithdrawalRequest entity created (status='pending')

NOTE: Withdrawals.jsx fetches accounts with:
  base44.entities.ChallengeAccount.list('-created_date', 20)
  ← Missing user_email filter! This fetches ALL accounts without email scoping.
  ← DATA ISOLATION BUG: User could potentially see other users' funded accounts
  ← However, RLS on ChallengeAccount (read: owner) should prevent this at entity level.

ADMIN PROCESSES:
AdminWithdrawals panel:
  Admin reviews request
  Admin approves → adminApproveWithdrawal({ withdrawal_id })
    → WithdrawalRequest.update({ status: 'paid', processed_at })
    → AffiliateCommission.create (if affiliate involved) via createAffiliateCommissions

PAYOUT CALC (display only in frontend):
  gross_amount × 0.80 = trader_share
  trader_share × 0.09 = affiliate_reward (estimate)
  trader_share - $25 = net (estimate)
  [Backend recalculates authoritatively via requestTraderWithdrawal]
```

### 8.2 KYC Gate

Withdrawals are blocked at UI level if `KYCVerification.status !== 'approved'`. This is a frontend-only gate — not enforced server-side in `requestTraderWithdrawal`.

---

## SECTION 9 — CERTIFICATES

### 9.1 Lifecycle

```
CREATION:
  generateChallengeCertificate function — called by:
    1. Entity automation (ARCHIVED — was triggered on ChallengeAccount update, has 73 consecutive failures)
    2. Admin manual call

  Creates Certificate entity with:
    { user_email, trader_name, type, title, account_id, account_size, challenge_type, issue_date, certificate_id, is_verified: true }

DISPLAY:
  Certificates.jsx:
    Certificate.filter({ user_email: user.email })
    → Renders as downloadable PDF via html2canvas + jsPDF
    → Verifiable at xtrading.com/verify (hardcoded — not actually implemented)

ISSUE: The automation that auto-creates certificates on ChallengeAccount update is archived and has 73 consecutive failures.
Certificates must currently be created manually by admin.
Users who passed phases will NOT automatically receive certificates.
```

---

## SECTION 10 — AFFILIATE SYSTEM

### 10.1 Lifecycle

```
ENROLLMENT (AUTO):
Register.jsx: After successful registration:
  → AffiliateProfile.create({ user_email, referral_code: 'RF' + random, tier: 'standard', ... })
  [Also happens lazily in Affiliate.jsx if no profile exists]

REFERRAL TRACKING:
  → URL parameter ?ref=CODE captures referral code at registration
  → Register.jsx reads ref param, stores in AffiliateProfile.referred_by_code

COMMISSION CREATION:
  createAffiliateCommissions function:
    Called by: manualCryptoReview (on payment approval), payment webhooks
    → Looks up AffiliateProfile by referred_email match
    → Calculates L1/L2/L3 commission rates from AffiliateSettings entity
    → Creates AffiliateCommission records (status='pending')

COMMISSION APPROVAL:
  AdminAffiliate panel → adminApproveCommission({ commission_id })
    → AffiliateCommission.update({ status: 'approved' })
    → AffiliateProfile.update({ total_earned, total_paid })

AFFILIATE WITHDRAWAL:
  requestAffiliateWithdrawal function:
    → Validates commission balance
    → Creates WithdrawalRequest({ account_id: 'affiliate', ... })

DISPLAY:
  Affiliate.jsx → AffiliateProfile.filter({ user_email }) + AffiliateCommission.filter({ affiliate_email })

ISSUE: Affiliate.jsx also fetches:
  base44.entities.ChallengeAccount.list('-created_date', 100)  ← No user_email filter
  Used to show referral tree / account data
  ← Potential data isolation issue (same as Withdrawals.jsx)
```

---

## SECTION 11 — KYC SYSTEM

### 11.1 Lifecycle

```
SUBMISSION:
  KYC.jsx:
    1. User fills personal info (full_name, date_of_birth, nationality, id_type)
    2. User uploads documents → base44.integrations.Core.UploadFile (public URLs)
       → Files stored: id_front_url, id_back_url, selfie_url, proof_of_address_url
    3. Submit → KYCVerification.create or update({ status: 'pending', submitted_at })

REVIEW:
  AdminKYC panel:
    Admin reviews uploaded documents
    Admin approves → KYCVerification.update({ status: 'approved', reviewed_at })
    Admin rejects → KYCVerification.update({ status: 'rejected', rejection_reason })

GATES:
  Withdrawals.jsx: checks KYCVerification.status === 'approved' before showing "Request Payout" button
  requestTraderWithdrawal backend: unknown — may or may not re-check
  
NOTE: KYC documents are uploaded to BASE44 PUBLIC storage (not private storage).
Document URLs are public and accessible to anyone with the URL.
This is a GDPR/compliance concern for identity documents.
```

---

## SECTION 12 — NOTIFICATION SYSTEM

### 12.1 All Notification Creators

| Creator | Trigger | Type | Priority | Display Mode |
|---|---|---|---|---|
| `scheduledMTSync` | Phase 1 pass detected | payout | high | popup |
| `scheduledMTSync` | Phase 2 pass detected | payout | high | popup |
| `automatedDDBreach` | DD breach detected | market_alert | critical | popup |
| `phaseProgressionEngine` | Phase 1 admin approved | payout | high | popup |
| `phaseProgressionEngine` | Phase 2 manual mark passed | system | high | popup |
| `phaseProgressionEngine` | Funded approved | payout | critical | popup |
| Admin (AdminNotifications panel) | Manual creation | any | any | any |

**Display in frontend:**
```
Dashboard.jsx:
  → Notification.filter({ is_active: true }) every 30 seconds
  → bannerNotification: first with display_mode='banner' or 'all'
  → NotificationBanner renders at top
  → NotificationCenter renders all in sidebar
```

**Gap:** Notifications created by `scheduledMTSync` and `automatedDDBreach` have `target: 'challenge'` or `target: 'funded'` but the frontend filters only by `is_active: true`. All notifications go to ALL users regardless of `target` field. The `target` field is stored but not enforced on the read side.

---

## SECTION 13 — DATABASE SOURCE OF TRUTH

| Entity | Base44 Truth | Supabase Copy | Active Readers | Active Writers | Supabase Used? |
|---|---|---|---|---|---|
| **User** | ✅ Base44 Auth | profiles table (stale) | base44.auth.me() everywhere | Base44 platform | ❌ No |
| **UserAccount** | ✅ Base44 Entity | NOT in Supabase | supabaseAuthBridge, customAuth, resetPassword | Same | ❌ No Supabase |
| **Order** | ✅ Base44 Order | orders table (stale) | Billing, AdminOrders, DashboardCheckout, manualCryptoReview | manualCryptoReview, webhooks | ❌ No |
| **ChallengeAccount** | ✅ Base44 Entity | challenge_accounts (stale) | Dashboard, MyAccounts, AccountOverview, LiveDDGuard | scheduledMTSync, syncUserAccountOnLogin, phaseProgressionEngine, manualCryptoReview, provisionMT5Account | ❌ No |
| **TradeRecord** | ✅ Base44 Entity | trade_records (stale) | AccountOverview, Analytics | scheduledMTSync (÷10000), syncUserAccountOnLogin (÷100000) | ❌ No |
| **Certificate** | ✅ Base44 Entity | certificates (stale) | Certificates.jsx | generateChallengeCertificate (manual), Admin | ❌ No |
| **WithdrawalRequest** | ✅ Base44 Entity | withdrawal_requests (stale) | Withdrawals.jsx, AdminWithdrawals | requestTraderWithdrawal, adminApproveWithdrawal | ❌ No |
| **KYCVerification** | ✅ Base44 Entity | kyc_verifications (stale) | KYC.jsx, AdminKYC, Withdrawals (gate) | KYC.jsx submit, AdminKYC review | ❌ No |
| **AffiliateProfile** | ✅ Base44 Entity | affiliate_profiles (stale) | Affiliate.jsx, Register.jsx | Register.jsx, Affiliate.jsx (lazy create), adminApproveCommission | ❌ No |
| **AffiliateCommission** | ✅ Base44 Entity | affiliate_commissions (stale) | Affiliate.jsx, AdminAffiliate | createAffiliateCommissions, adminApproveCommission | ❌ No |
| **ChallengePlan** | ✅ Base44 Entity | challenge_plans (stale) | ChallengeSelect, getChallengePlans, provisionMT5Account | AdminChallenges | ❌ No |
| **RuleSnapshot** | ✅ ChallengeAccount.rule_snapshot | N/A | scheduledMTSync, automatedDDBreach, LiveDDGuard, DisciplinePanel | provisionMT5Account (at purchase) | N/A |
| **Notification** | ✅ Base44 Entity | notifications (stale) | Dashboard (30s poll) | scheduledMTSync, automatedDDBreach, phaseProgressionEngine, Admin | ❌ No |
| **PaymentGateway** | ✅ Base44 Entity | payment_gateways (stale) | AdminPaymentControl, DashboardCheckout | Admin | ❌ No |
| **PlatformSettings** | ✅ Base44 Entity | platform_settings (stale) | useFeatureVisibility hook | AdminPlatformSettings | ❌ No |
| **AffiliateSettings** | ✅ Base44 Entity | N/A | createAffiliateCommissions | Admin | N/A |
| **RiskFlag** | ✅ Base44 Entity | N/A | AdminRiskCenter, AdminRiskDetection | automatedDDBreach, advancedRiskScoring | N/A |
| **FundedAccountReview** | ✅ Base44 Entity | N/A | AdminFundedReview | scheduledMTSync (create), phaseProgressionEngine (update) | N/A |
| **TradingPlatformProvider** | ✅ Base44 Entity | N/A | scheduledMTSync, phaseProgressionEngine, syncUserAccountOnLogin | AdminPlatformSettings | N/A |
| **OTP** | ✅ Base44 Entity | N/A | sendOTP, verifyOTP functions | sendOTP function | N/A (but dead system) |
| **Coupon** | ✅ Base44 Entity | coupons (stale) | DashboardCheckout (coupon validation) | AdminCoupons | ❌ No |
| **StaffMember/Role** | ✅ Base44 Entity | N/A | staffManagement, useStaffPermissions | AdminStaffManagement | N/A |
| **SupportTicket** | ✅ Base44 Entity | support_tickets (stale) | Support.jsx, AdminSupport | Support.jsx | ❌ No |
| **DeviceLog** | ✅ Base44 Entity | N/A | AdminUsers | Login flow (if implemented) | N/A |

**Verdict: Every active production reader uses Base44 entities exclusively. lib/supabaseService.js is the only file that reads Supabase tables — and it has zero imports in any component.**

---

## SECTION 14 — SAFE REMOVAL ANALYSIS

### SAFE TO DELETE NOW (zero impact)

| Item | Evidence |
|---|---|
| `lib/AuthContext.jsx` | Zero imports in any file. Not mounted in App.jsx. |
| `lib/supabaseService.js` | Zero imports in any component. Reads Supabase tables that nobody uses. |
| `functions/fixAdminAuth` | One-time migration script. No callers. |
| `functions/fixUserAuthIds` | One-time migration script. No callers. |

### SAFE TO ARCHIVE (disable but keep)

| Item | Evidence | Risk If Removed |
|---|---|---|
| `functions/syncUserAccountOnLogin` | Duplicate of scheduledMTSync. Has lot size bug. Race condition source. | 5-min lag on balance (acceptable) |
| `hooks/useSyncOnLogin.js` | Only calls syncUserAccountOnLogin. Cosmetic header only. | "Syncing…" badge disappears |
| `functions/syncAllEntitiesToSupabase` | No active consumer reads Supabase. Admin-triggered only. | Admin manual Supabase sync unavailable |
| `functions/syncOrdersToSupabase` | Subset of above. No active consumer. | Same |
| `functions/createManualOrderInSupabase` | Writes to Supabase orders table nobody reads. | Nothing |
| `functions/customAuth` (backend) | Full parallel auth system. Zero callers from any current frontend. | Nothing |
| `supabaseAuthBridge` `login` action | Login.jsx uses base44.auth.loginViaEmailPassword(). Dead path. | Nothing |
| `supabaseAuthBridge` `register` action | Register.jsx uses base44.auth.register(). Dead path. | Nothing |
| `lib/customAuth.js` `signInToSupabase()` | Never called. Creates Supabase sessions if called. | Removes latent session contamination risk |
| `lib/customAuth.js` `saveSession/loadSession/clearSession()` | Never called. Writes to localStorage['ff_session']. | Removes ghost session risk |
| `functions/automatedDDBreach` (breach detection portion) | scheduledMTSync handles breach inline. Redundant path. | BUT: keep function — daily reset is irreplaceable |

### REQUIRES MIGRATION BEFORE REMOVAL

| Item | What Must Happen First |
|---|---|
| `lib/supabaseClient.js` | Fix `DashboardSettings.jsx` password change. Currently calls `supabase.auth.updateUser()`. Migrate to Base44 auth. Then remove Supabase import from DashboardSettings. |
| `DashboardSettings.jsx` password section | Decide: route through supabaseAuthBridge `change_password` action OR use Base44 native password update. Implement and test. |
| `functions/automatedDDBreach` (entire function) | Absorb the 23:00 UTC daily DD reset logic into `scheduledMTSync` first. Then decommission. |
| `functions/resetPassword` | Either fix to update Base44 Auth, or remove (admin can use Base44 dashboard to reset). |
| `UserAccount` entity | After migrating ForgotPassword to Base44 native password reset, UserAccount can be archived. |
| `functions/supabaseAuthBridge` (forgot/reset/resend actions) | After migrating ForgotPassword to Base44 native OTP flow. |
| `lib/customAuth.js` (entire file) | After migrating ForgotPassword off callAuth(). |

### DO NOT TOUCH

| Item | Reason |
|---|---|
| `scheduledMTSync` | Core MT5 sync. Powers the entire dashboard. |
| `automatedDDBreach` | 23:00 UTC daily reset is irreplaceable. |
| `phaseProgressionEngine` | Admin Phase 1 approval + Funded approval. Phase 2 MT5 provisioning. |
| `provisionMT5Account` | Called by manualCryptoReview and phaseProgressionEngine. Initial account creation. |
| `manualCryptoReview` | Core payment approval and account provisioning trigger. |
| `requestTraderWithdrawal` | Withdrawal creation and validation. |
| `adminApproveWithdrawal` | Withdrawal processing. |
| `emailService` | Used by multiple functions for all transactional emails. |
| `getLivePositions` | Live position display in dashboard. |
| `ChallengeAccount` entity | Core trading account data. |
| `SupabaseAuthContext.jsx` | Primary auth context for entire app. |
| `lib/customAuth.js` `callAuth()` | ForgotPassword depends on it — until migration. |
| `supabaseAuthBridge` forgot/reset/resend actions | ForgotPassword depends on them — until migration. |

---

## FINAL OUTPUT

### 1. Current Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           XFUNDED (CURRENT — 2026-06-14)                          │
│                      ⚠️  Production Readiness: 34 / 100                           │
└──────────────────────────────────────────────────────────────────────────────────┘

BROWSER
  ├── localStorage['xf_supabase_session'] ← Supabase JWT (auto-restored, UNUSED)
  ├── localStorage['ff_session']           ← Legacy manual session (NEVER written, DEAD)
  └── sessionStorage['xf_last_sync']       ← 30-second cooldown timer

AUTHENTICATION (3 systems)
  ├── [A] Base44 Auth (active)
  │       Login.jsx → loginViaEmailPassword()
  │       Register.jsx → register() + verifyOtp()
  │       Session: Base44 platform token
  │
  ├── [B] Supabase Auth (partially active)
  │       DashboardSettings.jsx → supabase.auth.updateUser() [password change]
  │       persistSession: true → auto-restores old Supabase sessions
  │       supabaseClient.js initialized with full auth config
  │
  └── [C] UserAccount Entity (active for password ops)
          ForgotPassword → supabaseAuthBridge → UserAccount.otp_code + password_hash
          [BUT: password_hash is NEVER checked during login → ForgotPassword is broken]

DATABASE
  ├── [1] Base44 Entities (SOURCE OF TRUTH — all 20+ entities)
  └── [2] Supabase Tables (STALE COPIES — 14+ tables, ZERO active readers)

MT5 SYNC (4 concurrent systems)
  ├── scheduledMTSync     (5 min, ALL accounts, lots ÷10000) ← AUTHORITATIVE
  ├── syncUserAccountOnLogin (30 sec, current user, lots ÷100000) ← RACE + BUG
  ├── LiveDDGuard         (15 sec, current user, cache only) ← READ ONLY
  └── getLivePositions    (5 sec, one account, display only) ← READ ONLY
```

---

### 2. Recommended Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                      XFUNDED (TARGET — FTMO-GRADE)                                │
│                     ✅ Single Source of Truth                                     │
└──────────────────────────────────────────────────────────────────────────────────┘

AUTHENTICATION (1 system)
  └── Base44 Auth ONLY
      Login / Register / OTP / Session: Base44 native
      Password Reset: Base44 native (migrate ForgotPassword)
      Password Change: Base44 native (migrate DashboardSettings)
      No Supabase sessions. No UserAccount for auth.

DATABASE (1 system)
  └── Base44 Entities ONLY
      All entities are sole source of truth
      Supabase = retired (historical archive only)

MT5 SYNC (2 paths — no overlap, no race)
  ├── getLivePositions (5 sec, display only, no DB writes)
  └── scheduledMTSync (5 min, all accounts)
      Absorbs: 23:00 UTC daily reset from automatedDDBreach
      Keep automatedDDBreach for: safety net + RiskFlag + email + notifications
```

---

### 3. Critical Bugs List

| # | Bug | Component | Severity | Evidence |
|---|---|---|---|---|
| B-01 | ForgotPassword resets UserAccount.password_hash but login uses Base44 Auth — password reset is a no-op | ForgotPassword.jsx + supabaseAuthBridge | 🔴 CRITICAL | Confirmed by code trace |
| B-02 | DashboardSettings password change calls supabase.auth.updateUser() — does not update Base44 login password | DashboardSettings.jsx | 🔴 CRITICAL | Line 214 confirmed |
| B-03 | Lot size bug: syncUserAccountOnLogin uses rawVol÷100000, scheduledMTSync uses rawVol÷10000; first writer wins | syncUserAccountOnLogin:227, scheduledMTSync:487 | 🔴 CRITICAL | Confirmed by code diff |
| B-04 | Admin resetPassword function also writes only UserAccount.password_hash — same broken path as ForgotPassword | functions/resetPassword | 🔴 CRITICAL | Confirmed |
| B-05 | All new users registered via base44.auth.register() have NO UserAccount — ForgotPassword will return 404 for them | Register.jsx + supabaseAuthBridge | 🔴 CRITICAL | Logic confirmed |
| B-06 | Withdrawals.jsx fetches ChallengeAccount without user_email filter — relies on RLS alone | Withdrawals.jsx:147 | 🟠 HIGH | Code confirmed |
| B-07 | Affiliate.jsx fetches ChallengeAccount.list() without user filter | Affiliate.jsx:51 | 🟠 HIGH | Code confirmed |
| B-08 | Min trading days NOT enforced in auto phase-pass detection in scheduledMTSync | scheduledMTSync phase pass block | 🟠 HIGH | Logic confirmed |
| B-09 | KYC documents uploaded to public storage — identity documents are publicly accessible URLs | KYC.jsx:74 | 🟠 HIGH | Confirmed |
| B-10 | Notification target field ('challenge', 'funded', 'all') not enforced on read — all users see all notifications | Dashboard.jsx notification filter | 🟡 MEDIUM | Confirmed |
| B-11 | Certificate auto-generation automation is archived with 73 consecutive failures — no certificates auto-created | list_automations result | 🟡 MEDIUM | Confirmed |

---

### 4. Race Conditions List

| # | Race Condition | Functions Involved | Risk |
|---|---|---|---|
| R-01 | ChallengeAccount balance/equity written by scheduledMTSync and syncUserAccountOnLogin simultaneously | scheduledMTSync + syncUserAccountOnLogin | 🟠 HIGH |
| R-02 | TradeRecord lot size: first writer sets permanent value; winner depends on execution timing | scheduledMTSync + syncUserAccountOnLogin | 🔴 CRITICAL (data corruption) |
| R-03 | dd_breach_detected flag written by scheduledMTSync, syncUserAccountOnLogin, and automatedDDBreach concurrently | All three | 🟠 HIGH |
| R-04 | status=failed written by scheduledMTSync AND automatedDDBreach both detecting same breach | scheduledMTSync + automatedDDBreach | 🟡 MEDIUM (idempotent result) |
| R-05 | MT5 move-disabled API called twice (scheduledMTSync + automatedDDBreach both call on breach) | scheduledMTSync + automatedDDBreach | 🟡 MEDIUM (MT5 error log spam) |
| R-06 | FundedAccountReview created twice if scheduledMTSync detects phase2 pass during phaseProgressionEngine execution | scheduledMTSync + phaseProgressionEngine | 🟡 MEDIUM (idempotent guard helps) |

---

### 5. Dead Code List

| Item | Type | Evidence |
|---|---|---|
| `lib/AuthContext.jsx` | Frontend file | Zero imports found anywhere |
| `lib/supabaseService.js` | Frontend file | Zero imports found anywhere |
| `lib/customAuth.js` `signInToSupabase()` | Function | Never called |
| `lib/customAuth.js` `saveSession/loadSession/clearSession()` | Functions | Never called |
| `functions/customAuth` (entire backend fn) | Backend fn | No frontend component invokes it |
| `supabaseAuthBridge` `login` action | Action in backend fn | Login.jsx uses base44 auth directly |
| `supabaseAuthBridge` `register` action | Action in backend fn | Register.jsx uses base44 auth directly |
| `functions/fixAdminAuth` | Backend fn | One-time migration script |
| `functions/fixUserAuthIds` | Backend fn | One-time migration script |
| `functions/syncAllEntitiesToSupabase` | Backend fn | No scheduled automation, no active consumer |
| `functions/syncOrdersToSupabase` | Backend fn | No scheduled automation, no active consumer |
| `functions/createManualOrderInSupabase` | Backend fn | No callers, writes unused Supabase table |
| `functions/sendOTP` + `functions/verifyOTP` | Backend fns | OTP entity unused; no frontend calls these |
| OTP entity | Entity | Backed by dead sendOTP/verifyOTP system |
| `generateChallengeCertificate` automation | Automation | Archived, 73 consecutive failures |
| All Supabase database tables | Database | Zero reads by any active frontend component |

---

### 6. Single Source of Truth Plan

| Domain | Current SOT | Target SOT | Migration Steps |
|---|---|---|---|
| User Identity | Base44 Auth (login) + UserAccount entity (password reset) + Supabase Auth (settings) | Base44 Auth only | 1. Migrate ForgotPassword to Base44 native 2. Migrate Settings password change to Base44 native 3. Decommission UserAccount as auth layer |
| Account Data | Base44 entities (active) + Supabase tables (stale) | Base44 entities only | 1. Archive all sync-to-Supabase functions 2. Document Supabase tables as frozen archive |
| MT5 Sync | scheduledMTSync + syncUserAccountOnLogin (duplicate, buggy) | scheduledMTSync only | 1. Remove useSyncOnLogin from DashboardOverview 2. Archive syncUserAccountOnLogin |
| DD Reset | automatedDDBreach (23:00 UTC) | scheduledMTSync (absorb logic) | 1. Add daily reset logic to scheduledMTSync 2. Test at 23:00 UTC 3. Disable automatedDDBreach automation |
| Password Storage | UserAccount.password_hash + Base44 Auth internal + Supabase Auth | Base44 Auth internal only | After ForgotPassword and Settings migration |
| OTP | Base44 native (registration) + UserAccount.otp_code (password reset) + OTP entity (dead) | Base44 native only | After ForgotPassword migration |

---

### 7. FTMO-Level Architecture Plan

FTMO requires:
1. **Real-time DD enforcement** (equity change → immediate check, not polling)
2. **Single auth** (one session, one password, one identity)
3. **Deterministic trade records** (no race conditions on lot sizes)
4. **Atomic breach detection** (one system, written once, no duplicate flags)
5. **Min trading days enforcement** (in phase pass detection, not just display)

**Current vs Required:**

| Requirement | Current | Required |
|---|---|---|
| DD enforcement latency | 15 sec (LiveDDGuard) / 5 min (scheduled) | <1 sec (webhook from broker) |
| Breach atomicity | 3 systems can detect | 1 system writes |
| Trade record consistency | Race condition, 2 formulas | 1 writer, 1 formula |
| Auth systems | 3 parallel | 1 |
| Password stores | 3 out-of-sync stores | 1 |
| Daily DD reset | automatedDDBreach 23:00 UTC | scheduledMTSync built-in |
| Min trading days in pass check | Not enforced | Enforce before passing |

**The single most impactful improvement is eliminating `syncUserAccountOnLogin`** — it resolves the lot size bug, eliminates the race condition on breach flags, and removes 30-second parallel writes to all accounts.

---

### 8. Cleanup Order

```
PHASE A — Zero Risk (1-2 hours, no testing required)
──────────────────────────────────────────────────────
1.  Delete lib/AuthContext.jsx
2.  Delete lib/supabaseService.js
3.  Strip lib/customAuth.js: remove signInToSupabase, saveSession, loadSession, clearSession
4.  Strip supabaseAuthBridge: remove 'login' and 'register' dead actions
5.  Archive functions/fixAdminAuth
6.  Archive functions/fixUserAuthIds
7.  Archive functions/createManualOrderInSupabase
8.  Archive functions/syncAllEntitiesToSupabase
9.  Archive functions/syncOrdersToSupabase
10. Archive functions/customAuth (backend)

PHASE B — Low Risk (2-4 hours + dashboard testing)
────────────────────────────────────────────────────
11. Remove useSyncOnLogin import and cosmetic display from DashboardOverview.jsx
12. Archive hooks/useSyncOnLogin.js
13. Archive functions/syncUserAccountOnLogin
    → Eliminates lot size bug for future trades
    → Eliminates ChallengeAccount race condition
    → Test: Dashboard shows balance after 5 minutes

PHASE C — Medium Risk (4-8 hours + full auth testing)
───────────────────────────────────────────────────────
14. Fix DashboardSettings password change: route through Base44 native or supabaseAuthBridge change_password action
15. Remove supabase import from DashboardSettings.jsx
16. Set persistSession: false in supabaseClient.js (stop ghost sessions immediately)
    → Test: Login → change password → logout → login with new password

PHASE D — Medium Risk (4-6 hours + 23:00 UTC verification)
─────────────────────────────────────────────────────────────
17. Add 23:00 UTC daily reset logic to scheduledMTSync (isDailyResetWindow check)
18. Test at 23:00 UTC: verify daily_start_balance resets correctly
19. Disable automatedDDBreach automation (keep function for fallback)

PHASE E — High Risk (8-12 hours + regression testing)
───────────────────────────────────────────────────────
20. Migrate ForgotPassword to Base44 native password reset flow
21. Archive supabaseAuthBridge forgot/reset/resend actions
22. Archive lib/customAuth.js callAuth (after migration complete)
23. Archive UserAccount entity as auth layer (keep data, stop using for auth)

PHASE F — Enforcement (2-4 hours)
───────────────────────────────────
24. Add min_trading_days check to scheduledMTSync phase pass detection
25. Fix notification target enforcement on read (filter by user account status)
26. Fix KYC document uploads to use private storage
```

---

### 9. Risk Assessment

| Phase | Risk | Break if Fails | Rollback |
|---|---|---|---|
| A — Dead code deletion | None | Nothing | Restore files |
| B — Remove duplicate sync | Low | Cosmetic sync badge gone, 5-min data lag | Restore hook + function |
| C — Fix Settings password | High | Settings password change broken for users | Revert DashboardSettings |
| D — Daily reset migration | Medium | Daily DD formula breaks if not executed at 23:00 | Re-enable automatedDDBreach automation |
| E — ForgotPassword migration | High | Password reset broken during migration | Revert ForgotPassword, restore supabaseAuthBridge actions |
| F — Enforcement rules | Low | Phase pass slightly delayed, no data loss | Revert scheduledMTSync |

---

### 10. Production Readiness Score: 34 / 100

| Category | Score | Max | Key Issues |
|---|---|---|---|
| Authentication integrity | 3 | 20 | 3 auth systems, password changes broken, ForgotPassword is a no-op |
| Data integrity | 6 | 20 | Lot size race condition, 14 stale Supabase duplicates |
| Security | 8 | 20 | Ghost Supabase sessions, KYC docs in public storage, unfiltered list queries |
| Reliability | 9 | 20 | Race conditions on breach detection, parallel sync writers |
| Code cleanliness | 8 | 20 | Dead code landmines, orphaned auth contexts, duplicate auth systems |

**After Phase A+B cleanup only:** ~50 / 100  
**After Phase C (password fix):** ~65 / 100  
**After Phase D (daily reset):** ~73 / 100  
**After Phase E (ForgotPassword):** ~83 / 100  
**After Phase F (enforcement):** ~90 / 100  
**With FTMO-level WebSocket DD:** ~96 / 100

---

*Audit completed: 2026-06-14 | Evidence-based only | No code modified | 14 files read*