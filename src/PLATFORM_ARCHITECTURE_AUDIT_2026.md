# PLATFORM ARCHITECTURE AUDIT REPORT
**Date:** 2026-06-09
**Status:** COMPLETE
**Author:** Base44 AI Agent

---

## SECTION 1 — COMPLETE FEATURE MAP

This section details the architecture of every user-facing dashboard feature.

### 1.1. Overview
- **Frontend Components**: `pages/Dashboard.jsx`, `components/overview/FundedDashboard.jsx`, `components/dashboard/DashboardOverview.jsx`, `components/overview/StatsGrid.jsx`, `components/overview/TradingObjectives.jsx`
- **Backend Functions**: `syncUserAccountOnLogin` (triggered on load), `scheduledMTSync` (background data refresh).
- **Database Entities**: `ChallengeAccount` (read), `Order` (read), `Notification` (read), `User` (read), `Promotion` (read).
- **Automations / Schedulers**: `scheduledMTSync` runs every 5 minutes to update account metrics.
- **Admin Dependencies**: `AdminDashboard` provides a high-level view. `AdminPromotions` manages promotional content displayed.
- **Security Controls**:
    - **Authentication**: `useSupabaseAuth` hook in `Dashboard.jsx` enforces user login.
    - **Authorization**: No admin-specific logic on the primary overview. Data is scoped to the authenticated user via `base44.entities.ChallengeAccount.filter({ user_email: user.email })`.
    - **Backend Security**: `syncUserAccountOnLogin` requires an authenticated user session.
- **User Permissions**: Authenticated users can view their own overview data.
- **Data Flow**:
    1. User logs in, `Dashboard.jsx` mounts.
    2. `DashboardOverview.jsx` fetches `ChallengeAccount` and `Order` entities filtered by the user's email.
    3. `useSyncOnLogin` hook triggers `syncUserAccountOnLogin` function for a real-time data refresh from the broker API.
    4. Data is displayed in KPI panels and objective trackers.
- **Production Readiness**: **SAFE FOR PRODUCTION**

### 1.2. My Accounts
- **Frontend Components**: `components/dashboard/MyAccounts.jsx`, `components/dashboard/ChallengeCard.jsx`.
- **Backend Functions**: `getPlatformCredentials` (to get trading terminal login details).
- **Database Entities**: `ChallengeAccount` (read), `Order` (read).
- **Automations / Schedulers**: Relies on `scheduledMTSync` for up-to-date account status.
- **Admin Dependencies**: `AdminAccounts` for CRUD operations on `ChallengeAccount` records.
- **Security Controls**:
    - **Authentication**: Enforced by the parent `Dashboard.jsx`.
    - **Data Scoping**: Queries are filtered by `user.email`.
    - **Backend Security**: `getPlatformCredentials` is a secured function requiring admin or internal service role access. The frontend call is proxied securely.
- **User Permissions**: Authenticated users can view and manage their own accounts.
- **Data Flow**:
    1. User navigates to the "My Accounts" tab.
    2. `MyAccounts.jsx` queries `ChallengeAccount` and `Order` entities for the logged-in user.
    3. Account cards are rendered, showing status, P&L, and progress.
    4. Clicking "Credentials" triggers a call to `getPlatformCredentials` to securely fetch and display login details in a modal.
- **Production Readiness**: **SAFE FOR PRODUCTION**

### 1.3. Account Overview (Advanced)
- **Frontend Components**: `components/dashboard/AccountOverview.jsx`, `components/dashboard/DashboardOverviewAdvanced.jsx`
- **Backend Functions**: None directly. Relies on data synced by `scheduledMTSync`.
- **Database Entities**: `ChallengeAccount` (read), `TradeRecord` (read), `TradingJournalEntry` (read).
- **Automations / Schedulers**: Data is populated by `scheduledMTSync`.
- **Admin Dependencies**: None.
- **Security Controls**: User-scoped queries via `user.email`.
- **User Permissions**: Authenticated users.
- **Data Flow**: A more detailed version of the main overview, combining trading metrics, objectives, and account rules into a single dashboard view per selected account.
- **Production Readiness**: **SAFE FOR PRODUCTION**

### 1.4. Analytics
- **Frontend Components**: `components/dashboard/Analytics.jsx`.
- **Backend Functions**: None. All calculations are performed on the client side based on fetched entity data.
- **Database Entities**: `ChallengeAccount` (read), `TradeRecord` (read), `TradingJournalEntry` (read).
- **Automations / Schedulers**: Data is dependent on `scheduledMTSync`.
- **Admin Dependencies**: None.
- **Security Controls**: User-scoped queries via `user.email` and `account_id` filters.
- **User Permissions**: Authenticated users with active accounts.
- **Data Flow**: Fetches all `TradeRecord` entities for a selected account and calculates performance metrics (equity curve, P&L, win rate, etc.) in the browser.
- **Production Readiness**: **NEEDS WORK**. Client-side calculation of extensive analytics can be slow and resource-intensive. For large trade histories, this should be moved to a backend function.

### 1.5. Buy Challenge
- **Frontend Components**: `components/dashboard/ChallengeMarketplace.jsx`, `components/dashboard/DashboardCheckout.jsx`.
- **Backend Functions**: `getChallengePlans` (read-only), `createCheckoutPayment` (for Stripe), `createConfirmoInvoice` (for crypto), `manualCryptoReview` (for manual crypto proof).
- **Database Entities**: `ChallengePlan` (read), `Order` (create), `Coupon` (read).
- **Automations / Schedulers**: None directly, but successful payment triggers webhook-based automations.
- **Admin Dependencies**: `AdminChallenges` to create and manage plans. `AdminCoupons` to manage discounts. `AdminPaymentReview` for manual crypto.
- **Security Controls**:
    - **Authentication**: Authenticated users only.
    - **Backend Security**: Payment creation functions (`createCheckoutPayment`) require an authenticated user session. Webhook handlers (`checkoutWebhook`, etc.) use signature validation.
- **User Permissions**: Authenticated users.
- **Data Flow**:
    1. User selects a plan from `ChallengeMarketplace.jsx`, which reads from the `ChallengePlan` entity.
    2. User proceeds to `DashboardCheckout.jsx`, enters personal/payment info.
    3. Submitting the checkout form calls a payment creation function (`createCheckoutPayment`).
    4. An `Order` entity is created with `status: 'pending'`.
    5. Successful payment triggers a webhook which confirms the order and initiates account provisioning.
- **Production Readiness**: **SAFE FOR PRODUCTION**

### 1.6. Calendar & News
- **Frontend Components**: `components/dashboard/EconomicCalendar.jsx`, `components/dashboard/MarketNews.jsx`, `components/dashboard/MarketsHub.jsx`.
- **Backend Functions**: Utilizes the `Core.InvokeLLM` integration.
- **Database Entities**: None. Data is fetched on-demand and not stored.
- **Automations / Schedulers**: None.
- **Admin Dependencies**: None.
- **Security Controls**: `Core.InvokeLLM` is an authenticated endpoint.
- **User Permissions**: Authenticated users.
- **Data Flow**: The components call `base44.integrations.Core.InvokeLLM` with a prompt to fetch real-time economic data and news from the internet. The LLM returns structured JSON which is then rendered.
- **Production Readiness**: **AI GENERATED**. The feature is functional but relies on the quality and availability of the LLM and its web search capabilities. It is not a direct feed from a financial data provider.

### 1.7. Journal
- **Frontend Components**: `components/dashboard/TradingJournal.jsx`, `components/dashboard/JournalEntryForm.jsx`, `components/dashboard/JournalAnalytics.jsx`.
- **Backend Functions**: `Core.InvokeLLM` for AI-generated entries.
- **Database Entities**: `TradingJournalEntry` (CRUD), `TradeRecord` (read for AI context), `ChallengeAccount` (read for AI context).
- **Automations / Schedulers**: None.
- **Admin Dependencies**: None.
- **Security Controls**: All database operations are scoped by `user_email`.
- **User Permissions**: Authenticated users.
- **Data Flow**: Users can create manual journal entries or trigger the `generateAIJournalEntry` function which uses `InvokeLLM` to analyze recent trades and generate a summary. Entries are stored in the `TradingJournalEntry` entity.
- **Production Readiness**: **SAFE FOR PRODUCTION**

### 1.8. Leaderboard
- **Frontend Components**: `components/dashboard/Leaderboard.jsx`.
- **Backend Functions**: None.
- **Database Entities**: `ChallengeAccount` (read), `WithdrawalRequest` (read).
- **Automations / Schedulers**: Data is populated by `scheduledMTSync`.
- **Admin Dependencies**: None.
- **Security Controls**: Reads public-safe, anonymized data. Trader names are masked (`maskTraderName` function).
- **User Permissions**: Authenticated users.
- **Data Flow**: Fetches all `active` and `funded` `ChallengeAccount` records, calculates profit ratio, joins with paid `WithdrawalRequest` data, sorts, and displays the top 50 traders.
- **Production Readiness**: **SAFE FOR PRODUCTION**

### 1.9. Affiliate
- **Frontend Components**: `components/dashboard/Affiliate.jsx`, `components/affiliate/AffiliateOverview.jsx`, `components/affiliate/ReferralLink.jsx`, `components/affiliate/CommissionHistory.jsx`, `components/affiliate/ReferralTree.jsx`, `components/affiliate/AffiliateWithdrawal.jsx`.
- **Backend Functions**: `requestAffiliateWithdrawal`, `createAffiliateCommissions` (called by payment webhooks), `adminApproveCommission`.
- **Database Entities**: `AffiliateProfile` (CRUD), `AffiliateCommission` (CRUD), `WithdrawalRequest` (create), `AffiliateSettings` (read).
- **Automations / Schedulers**: None.
- **Admin Dependencies**: `AdminAffiliate` to manage profiles and settings. `AdminWithdrawals` to approve payouts.
- **Security Controls**: All operations are scoped by `user_email`. `requestAffiliateWithdrawal` performs server-side validation of KYC status and available balance.
- **User Permissions**: Authenticated users.
- **Data Flow**: Users share their referral code. New signups with the code link their `AffiliateProfile`. Purchases by referrals trigger `createAffiliateCommissions`. Commissions are approved by admins. Affiliates can then request a withdrawal via `requestAffiliateWithdrawal`.
- **Production Readiness**: **SAFE FOR PRODUCTION**

### 1.10. Certificates
- **Frontend Components**: `components/dashboard/Certificates.jsx`.
- **Backend Functions**: `generateChallengeCertificate` (automation).
- **Database Entities**: `Certificate` (read).
- **Automations / Schedulers**: `generateChallengeCertificate` is designed to run via an Entity Automation on `ChallengeAccount` updates (when `status` becomes `passed` or `funded`). *Note: This automation is currently disabled but the function exists.*
- **Admin Dependencies**: Admins can manually create `Certificate` records.
- **Security Controls**: Queries are filtered by `user_email`.
- **User Permissions**: Authenticated users.
- **Data Flow**: When an account passes a phase, the automation triggers `generateChallengeCertificate`, creating a `Certificate` record. The frontend component reads and displays these records, allowing PDF download.
- **Production Readiness**: **PARTIAL**. The core logic is present but the automation to trigger certificate generation is disabled.

### 1.11. Withdrawals
- **Frontend Components**: `components/dashboard/Withdrawals.jsx`.
- **Backend Functions**: `requestTraderWithdrawal`, `adminApproveWithdrawal`.
- **Database Entities**: `WithdrawalRequest` (create, read), `ChallengeAccount` (read), `KYCVerification` (read), `AffiliateSettings` (read).
- **Automations / Schedulers**: None.
- **Admin Dependencies**: `AdminWithdrawals` for approving/rejecting requests.
- **Security Controls**:
    - **Authentication**: Authenticated users only.
    - **Backend Security**: `requestTraderWithdrawal` is the source of truth. It performs all critical server-side validations: account ownership, `funded` status, available profit, KYC status, and min withdrawal amount.
- **User Permissions**: Authenticated users with funded accounts.
- **Data Flow**: User submits a withdrawal request from the dashboard. This calls `requestTraderWithdrawal`, which validates the request and creates a `WithdrawalRequest` record with `status: 'pending'`. Admins then use `AdminWithdrawals` to approve or reject the request.
- **Production Readiness**: **SAFE FOR PRODUCTION**

### 1.12. Billing
- **Frontend Components**: `components/dashboard/Billing.jsx`.
- **Backend Functions**: None directly. PDF generation (`jsPDF`) is client-side.
- **Database Entities**: `Order` (read).
- **Automations / Schedulers**: None.
- **Admin Dependencies**: `AdminOrders` for viewing all orders.
- **Security Controls**: Queries are filtered by `user.email`.
- **User Permissions**: Authenticated users.
- **Data Flow**: The component fetches all `Order` records associated with the user's email and displays them in a table. Users can generate a PDF invoice for each order on the client side.
- **Production Readiness**: **SAFE FOR PRODUCTION**

### 1.13. KYC
- **Frontend Components**: `components/dashboard/KYC.jsx`.
- **Backend Functions**: `Core.UploadFile` integration.
- **Database Entities**: `KYCVerification` (CRUD).
- **Automations / Schedulers**: None.
- **Admin Dependencies**: `AdminKYC` for reviewing and approving submissions.
- **Security Controls**: All database operations are scoped by `user_email`. File uploads are handled by a secure core integration.
- **User Permissions**: Authenticated users.
- **Data Flow**: User fills out the form and uploads documents. `handleUpload` calls `Core.UploadFile` and stores the returned URL. `handleSubmit` creates or updates a `KYCVerification` record with `status: 'pending'`.
- **Production Readiness**: **SAFE FOR PRODUCTION**

### 1.14. Support
- **Frontend Components**: `components/dashboard/Support.jsx`.
- **Backend Functions**: None.
- **Database Entities**: `SupportTicket` (create, read).
- **Automations / Schedulers**: None.
- **Admin Dependencies**: `AdminSupport` for viewing and replying to tickets.
- **Security Controls**: Entity permissions are not defined for `SupportTicket`, which is a security risk. Should be owner-only for read/create.
- **User Permissions**: Authenticated users.
- **Data Flow**: User submits the "New Ticket" form, which creates a `SupportTicket` entity. Admins can view these tickets in their dashboard. *There is no backend logic for sending emails or notifications upon ticket creation or reply.*
- **Production Readiness**: **MOCK**. The system only creates a database record. There is no notification system for admins, no email integration for replies, and no conversation history view for users.

### 1.15. Settings
- **Frontend Components**: `components/dashboard/DashboardSettings.jsx`.
- **Backend Functions**: `customAuth` (legacy, deprecated), `supabaseAuthBridge` (for password changes, social auth linking), `Core.UploadFile` (for profile photo).
- **Database Entities**: `User` (read/update via `base44.auth.updateMe`), `UserAccount` (indirectly via auth functions), `UserSession`.
- **Automations / Schedulers**: None.
- **Admin Dependencies**: None.
- **Security Controls**: All actions are scoped to the authenticated user via `base44.auth.updateMe()`.
- **User Permissions**: Authenticated users.
- **Data Flow**:
    - **Profile**: Updates user metadata on the `User` entity.
    - **Security**: Password changes and social linking are handled by `supabaseAuthBridge`.
    - **Wallets**: Saves crypto wallet addresses directly to custom fields on the `User` entity.
- **Production Readiness**: **PARTIAL**. Core profile and wallet settings work. Password change and social auth are complex and rely on a mix of Supabase and custom logic which can be fragile.

### 1.16. Notifications
- **Frontend Components**: `components/dashboard/NotificationCenter.jsx`, `components/dashboard/NotificationBanner.jsx`, `components/dashboard/DashboardPopupNotification.jsx`.
- **Backend Functions**: None directly. Various functions create notifications (e.g., `manualCryptoReview`, `phaseProgressionEngine`).
- **Database Entities**: `Notification` (read).
- **Automations / Schedulers**: None.
- **Admin Dependencies**: `AdminNotifications` to create global announcements.
- **Security Controls**: Queries are filtered for notifications where `target` is `'all'` or matches the user's context (e.g., `target: 'challenge'`).
- **User Permissions**: Authenticated users.
- **Data Flow**: Backend functions or admin actions create `Notification` entities. The `Dashboard.jsx` component queries for active notifications and displays them in banners or a dedicated center.
- **Production Readiness**: **SAFE FOR PRODUCTION**

---

## SECTION 2 — FEATURE CONNECTION MAP

This map illustrates the high-level dependencies between major platform features.

- **`Home` / `ChallengeMarketplace`** (Plan Selection)
    - **Reads from**: `ChallengePlan`
    - **Leads to**: `DashboardCheckout`

- **`DashboardCheckout`** (Purchase Flow)
    - **Reads from**: `ChallengePlan`, `Coupon`
    - **Writes to**: `Order`
    - **Calls**: `createCheckoutPayment` / `createConfirmoInvoice` / `manualCryptoReview`
    - **Leads to**: Payment Gateway (External)

- **Payment Gateway** (External: Stripe, Confirmo, etc.)
    - **Triggers**: `checkoutWebhook` / `confirmoWebhook` / etc.

- **Payment Webhooks** (`checkoutWebhook`, etc.)
    - **Updates**: `Order` (sets `payment_status: 'confirmed'`)
    - **Calls**:
        - `provisionMatchTraderAccount` (to create the trading account)
        - `createAffiliateCommissions` (to reward referrers)
        - `sendBrandedEmail` (to notify the user)
    - **Creates**: `Notification`

- **`provisionMatchTraderAccount`** (Account Creation)
    - **Calls**: Broker API (External)
    - **Creates/Updates**: `ChallengeAccount` (sets `status: 'active'`, adds credentials)

- **`ChallengeAccount`** (The Core User Asset)
    - **Is updated by**:
        - `provisionMatchTraderAccount` (on creation)
        - `scheduledMTSync` (every 5 mins for P&L, DD)
        - `automatedDDBreach` (every 5 mins for secondary DD check)
        - `phaseProgressionEngine` (on phase pass/fail)
    - **Is read by**: `DashboardOverview`, `MyAccounts`, `Analytics`, `Leaderboard`, `Withdrawals`

- **`scheduledMTSync` & `automatedDDBreach`** (Account Monitoring)
    - **Reads from**: `ChallengeAccount`, `TradingPlatformProvider` (via `getPlatformCredentials`)
    - **Writes to**: `ChallengeAccount` (updates metrics, status), `RiskFlag`, `Notification`
    - **Calls**: Broker API (External)

- **`phaseProgressionEngine`** (Admin-Triggered Phase/Funded Approval)
    - **Reads from**: `FundedAccountReview`, `ChallengeAccount`
    - **Updates**: `ChallengeAccount` (sets `phase`, `status`), `FundedAccountReview`
    - **Calls**: `provisionMatchTraderAccount` (for new funded accounts)

- **`Withdrawals`** (User-Facing Payout Request)
    - **Reads from**: `ChallengeAccount` (for `funded` status, `pnl`), `KYCVerification`
    - **Calls**: `requestTraderWithdrawal`
    - **Creates**: `WithdrawalRequest` (`status: 'pending'`)

- **`AdminWithdrawals`** (Admin-Facing Payout Approval)
    - **Reads from**: `WithdrawalRequest`
    - **Calls**: `adminApproveWithdrawal`

- **`adminApproveWithdrawal`**
    - **Updates**: `WithdrawalRequest` (`status: 'approved'`), `AffiliateCommission` (creates payout reward)
    - **Creates**: `Certificate` (on first payout)

- **`Affiliate`** (User-Facing Affiliate Dashboard)
    - **Reads from**: `AffiliateProfile`, `AffiliateCommission`
    - **Calls**: `requestAffiliateWithdrawal`

- **`requestAffiliateWithdrawal`**
    - **Validates against**: `AffiliateCommission` (approved balance), `KYCVerification`
    - **Creates**: `WithdrawalRequest` (`account_id: 'affiliate'`)

---

## SECTION 3 — BUY CHALLENGE SYSTEM

1.  **Challenge Selection**
    - **Component**: `components/dashboard/ChallengeMarketplace.jsx`
    - **Action**: User selects challenge type, size, and account model.
    - **Data Source**: Fetches plans via `useQuery` calling `base44.entities.ChallengePlan.list()`. The backend function `getChallengePlans` is a simple wrapper for this.
    - **Code Evidence**:
        ```jsx
        // ChallengeMarketplace.jsx
        const { data: plans = [], isLoading: loadingPlans } = useQuery({
          queryKey: ['challenge-plans'],
          queryFn: () => base44.functions.invoke('getChallengePlans').then(r => r.data.plans),
        });
        ```

2.  **Pricing & Checkout Transition**
    - **Action**: User clicks "Buy Challenge". `onProceedToCheckout` is called.
    - **Data**: An `orderData` object is created containing `plan_id`, `price`, `size`, etc.
    - **Code Evidence**:
        ```jsx
        // ChallengeMarketplace.jsx
        const handlePurchase = () => {
          // ...
          onProceedToCheckout(orderData);
        };
        ```
    - **Component**: `components/dashboard/DashboardCheckout.jsx` receives `initialOrder`.

3.  **Checkout & Payment**
    - **Components**: `CheckoutStep1` (Personal Info), `CheckoutStep2` (Payment Method), `CheckoutStep3` (Payment Execution), `CouponInput`.
    - **Action**: User fills in details and selects a payment method.
    - **Coupon Logic**: `CouponInput.jsx` validates coupon codes against the `Coupon` entity.
    - **Payment Execution**: `CheckoutStep3.jsx` calls a backend function based on the selected method.
    - **Code Evidence**:
        ```jsx
        // CheckoutStep3.jsx
        if (paymentMethod === 'checkout_com_card') {
          await base44.functions.invoke('createCheckoutPayment', { ... });
        } else if (paymentMethod.startsWith('manual_')) {
          await base44.functions.invoke('manualCryptoReview', { ... });
        }
        ```

4.  **Order & Payment Log Creation**
    - **Action**: The payment function (`createCheckoutPayment`, etc.) creates an `Order` entity with `payment_status: 'pending'`.
    - **Database**: A record is inserted into the `Order` entity.
    - **Code Evidence**:
        ```javascript
        // createManualOrderInSupabase.js (called by checkout functions)
        const { error } = await supabase.from('orders').insert({
          order_id,
          user_email: email,
          payment_status: 'awaiting_confirmation',
          // ... other order details
        });
        ```

5.  **Webhook Processing**
    - **Trigger**: Payment provider sends a webhook to a dedicated backend function (e.g., `checkoutWebhook.js`).
    - **Security**: The webhook handler first verifies the request signature.
        - **Code Evidence** (`checkoutWebhook.js`):
            ```javascript
            const isValid = await verifyCheckoutSignature(body, signature, webhookSecret);
            if (!isValid) {
              return Response.json({ error: 'Invalid signature' }, { status: 401 });
            }
            ```
    - **Action**:
        1. Updates the corresponding `Order` entity's `payment_status` to `'confirmed'`.
        2. **Asynchronously** calls `provisionMatchTraderAccount`.
        3. **Asynchronously** calls `createAffiliateCommissions`.
        - **Code Evidence** (`checkoutWebhook.js`):
            ```javascript
            await base44.asServiceRole.entities.Order.update(order.id, { payment_status: 'confirmed' });
            base44.asServiceRole.functions.invoke('provisionMatchTraderAccount', { ... });
            base44.asServiceRole.functions.invoke('createAffiliateCommissions', { ... });
            ```

6.  **MT5/Broker Provisioning**
    - **Function**: `provisionMatchTraderAccount.js`
    - **Security**: Secured with scheduler token/admin auth, preventing anonymous execution.
    - **Action**:
        1. Calls the broker's API (MT5, Match Trader) to create a new trading account.
        2. Retrieves the real login credentials from the broker's response.
    - **Code Evidence**:
        ```javascript
        // provisionMatchTraderAccount.js
        const createRes = await fetch(`${apiBase}/accounts`, { /* ... */ });
        const mtAccount = await createRes.json();
        const mtLogin = mtAccount?.login;
        ```

7.  **Account Activation**
    - **Action**: `provisionMatchTraderAccount` updates the `ChallengeAccount` entity.
    - **Data Written**: Sets `status: 'active'`, and stores the `mt_login`, `mt_password`, `mt_server`, and `rule_snapshot`.
    - **Code Evidence**:
        ```javascript
        // provisionMatchTraderAccount.js
        await base44.asServiceRole.entities.ChallengeAccount.update(accounts[0].id, {
          status: 'active',
          mt_login: String(mtLogin),
          mt_password: password,
          mt_server: mtServer,
          rule_snapshot: rule_snapshot,
        });
        ```

---

## SECTION 4 — ACCOUNT LIFE CYCLE

1.  **Purchase & Initial State**
    - An `Order` is created and payment confirmed via webhook.
    - `provisionMatchTraderAccount` is called.
    - A `ChallengeAccount` entity is created with `status: 'active'` and `phase: 'phase1'`. The `rule_snapshot` field is populated with the rules from the `ChallengePlan` at the time of purchase.

2.  **Phase 1 Trading & Monitoring**
    - **Function**: `scheduledMTSync.js`
    - **Trigger**: Runs every 5 minutes via a "Scheduled" automation.
    - **Action**:
        1. Fetches all `active`, `funded`, and `passed` accounts.
        2. For each account, it calls the broker API to get live equity and balance.
        3. It calculates `daily_drawdown_used` and `max_drawdown_used` based on institutional formulas (daily DD from start-of-day balance).
            - **Code Evidence** (`scheduledMTSync.js`):
                ```javascript
                // Daily DD from daily_start_balance, not account_size
                function calcDailyDD(acc, equity) {
                  const base = acc.daily_start_balance || acc.account_size;
                  return base > 0 ? Math.max(0, ((base - equity) / base) * 100) : 0;
                }
                ```
        4. It updates the `ChallengeAccount` entity with the new metrics.

3.  **Drawdown Breach Detection**
    - **Functions**: `scheduledMTSync.js` and `automatedDDBreach.js`.
    - **Action**:
        - `scheduledMTSync` performs the primary, real-time breach detection. If `persistentOverallDD >= overallLimit` or `persistentDailyDD >= dailyLimit`, it immediately writes `status: 'failed'` and sets the `dd_breach_detected` flags in the same database update.
        - **Code Evidence** (`scheduledMTSync.js`):
            ```javascript
            if (!breachDetected) {
              if (persistentOverallDD >= overallLimit) { /* ... set breach flags ... */ }
              else if (persistentDailyDD >= dailyLimit) { /* ... set breach flags ... */ }
            }
            if (breachDetected && acc.status !== 'failed') {
              updates.status = 'failed'; // Atomic update
            }
            await base44.asServiceRole.entities.ChallengeAccount.update(acc.id, updates);
            ```
        - `automatedDDBreach` acts as a secondary safety net, scanning the database for accounts flagged with `dd_breach_detected: true` but not yet set to `status: 'failed'`.

4.  **Phase 1 Pass Detection**
    - **Function**: `scheduledMTSync.js`
    - **Action**: During its sync cycle, if an account's `profit_target_progress` meets or exceeds its `phase1_target` (from `rule_snapshot`), it updates the account:
        - `status: 'passed'`
        - `phase_review_status: 'pending_review'`
    - **Code Evidence**:
        ```javascript
        // scheduledMTSync.js
        if (currentProgress >= phase1Target) {
          await base44.asServiceRole.entities.ChallengeAccount.update(acc.id, {
            status: 'passed',
            phase_review_status: 'pending_review',
          });
        }
        ```

5.  **Phase 1 Review & Phase 2 Provisioning**
    - **Function**: `phaseProgressionEngine.js`
    - **Trigger**: Manually by an admin via the `AdminFundedReview` component.
    - **Action**: When an admin approves a Phase 1 pass:
        1. Calls the broker API to create a *new* Phase 2 account.
        2. Updates the original `ChallengeAccount` record with `phase: 'phase2'`, `status: 'active'`, and the new MT5 credentials.
    - **Code Evidence** (`phaseProgressionEngine.js`):
        ```javascript
        // Case: approve_phase1
        const newPassword = genPassword();
        // ... API call to create MT5 account ...
        await sr.entities.ChallengeAccount.update(review.account_id, {
          status: 'active', // Re-activate for next phase
          phase: 'phase2',
          mt_login: String(mtAccount.login), // New credentials
          mt_password: newPassword,
        });
        ```

6.  **Phase 2 Pass & Funded Review**
    - **Function**: `scheduledMTSync.js`
    - **Action**: Similar to Phase 1, if `profit_target_progress` meets the `phase2_target`:
        1. Updates `ChallengeAccount` to `status: 'passed'` and `funded_review_status: 'pending_review'`.
        2. **Crucially, it also creates a `FundedAccountReview` entity record**, which populates the admin's review queue.
    - **Code Evidence** (`scheduledMTSync.js`):
        ```javascript
        // ... Phase 2 pass detection ...
        await base44.asServiceRole.entities.FundedAccountReview.create({
          account_id: acc.account_id,
          // ... other review details ...
        });
        ```

7.  **Funded Account Approval & Provisioning**
    - **Function**: `phaseProgressionEngine.js`
    - **Trigger**: Manually by an admin via `AdminFundedReview`.
    - **Action**: When an admin approves a `FundedAccountReview`:
        1. The function is called with `action: 'approve_funded'`.
        2. It creates a final, live-funded MT5 account via the broker API.
        3. It updates the `ChallengeAccount` with `status: 'funded'`, `phase: 'funded'`, and the new live credentials.
        4. It sends a "You're Funded!" email notification.
    - **Code Evidence** (`phaseProgressionEngine.js`):
        ```javascript
        // Case: approve_funded
        // ... API call to create MT5 account ...
        await sr.entities.ChallengeAccount.update(originalAccount.id, {
          status: 'funded',
          phase: 'funded',
          // ... new MT5 credentials ...
        });
        await sendEmail(sr, user.email, 'funded_approval', { ... });
        ```

---

## SECTION 5 — AFFILIATE SYSTEM

1.  **Referral Link & Registration**
    - **Component**: `components/affiliate/ReferralLink.jsx`
    - **Action**: An affiliate copies their unique referral link (e.g., `/?ref=RFXXXXXX`).
    - **Registration**: When a new user signs up via this link, the `Register.jsx` component reads the `ref` code from the URL.
    - **Code Evidence** (`Register.jsx`):
        ```jsx
        const refCode = new URLSearchParams(window.location.search).get('ref') || '';
        // ... after successful supabase.auth.signUp ...
        if (refCode) {
          // ... find referrer by refCode ...
          await base44.entities.AffiliateProfile.create({
            user_email: formData.email,
            referred_by_code: refCode,
            referred_by_email: referrer.user_email,
            // ... other profile fields
          });
        }
        ```
    - **Database**: A new `AffiliateProfile` is created for the new user, linking them to their sponsor.

2.  **Purchase & Commission Creation**
    - **Trigger**: A referred user makes a successful purchase. Any payment webhook (e.g., `checkoutWebhook`) is triggered.
    - **Function**: `createAffiliateCommissions.js` is called by the payment webhook.
    - **Security**: The function is secured and can only be called internally or by an admin.
    - **Logic**:
        1. It receives the buyer's `user_email` and `order_price`.
        2. It fetches the buyer's `AffiliateProfile` to find their sponsor (`referred_by_email`).
        3. It traverses up to 3 levels of the referral chain (L1, L2, L3).
        4. It reads commission rates from the `AffiliateSettings` entity (falling back to hardcoded defaults of 8%/2%/1% if not set).
        5. For each valid sponsor in the chain, it creates an `AffiliateCommission` record with `status: 'pending'`.
    - **Code Evidence** (`createAffiliateCommissions.js`):
        ```javascript
        const buyerProfiles = await sr.entities.AffiliateProfile.filter({ user_email });
        // ...
        const L1_RATE = settings?.l1_rate ?? 8;
        // ... traverse chain ...
        await sr.entities.AffiliateCommission.create({
          affiliate_email: email, // sponsor's email
          referred_email: user_email, // buyer's email
          commission_type: 'challenge_purchase',
          level,
          commission_amount: parseFloat(((order_price * rate) / 100).toFixed(2)),
          status: 'pending',
        });
        ```

3.  **Commission Approval & Balance Update**
    - **Component**: `components/admin/AdminAffiliate.jsx` (Implicit, as there is no dedicated commission approval UI). Admins would manage status directly on the entity.
    - **Function**: `adminApproveCommission.js`
    - **Action**: An admin changes the status of an `AffiliateCommission` record from `'pending'` to `'approved'`.
    - **Database**: The `AffiliateCommission` status is updated. The corresponding `AffiliateProfile`'s `total_earned` and `total_pending` fields are updated.

4.  **Affiliate Withdrawal Request**
    - **Component**: `components/affiliate/AffiliateWithdrawal.jsx`
    - **Function**: `requestAffiliateWithdrawal.js`
    - **Logic**:
        1. User enters amount and wallet details.
        2. `requestAffiliateWithdrawal` is called.
        3. **Server-side validation**:
            - Checks if affiliate's KYC is approved.
            - Checks if amount is >= `min_withdrawal` from `AffiliateSettings`.
            - Calculates the total `approved` (but not yet paid) commission balance from `AffiliateCommission` entities.
            - Verifies that `amount <= approvedBalance`.
        4. Creates a `WithdrawalRequest` record with `account_id: 'affiliate'` and `status: 'pending'`.
    - **Code Evidence** (`requestAffiliateWithdrawal.js`):
        ```javascript
        const approvedBalance = commissions
          .filter(c => c.status === 'approved')
          .reduce((s, c) => s + (c.commission_amount || 0), 0);
        if (requestedAmount > approvedBalance) {
          return Response.json({ error: `Requested amount ... exceeds approved balance ...` });
        }
        ```

5.  **Affiliate Payout**
    - **Component**: `AdminWithdrawals.jsx`
    - **Action**: Admin approves the affiliate's withdrawal request.
    - **Function**: `adminApproveWithdrawal.js` handles this, updating the `WithdrawalRequest` status to `'approved'` and eventually `'paid'`.

---

## SECTION 6 — WITHDRAWAL SYSTEM

1.  **Withdrawal Request (Trader)**
    - **Component**: `components/dashboard/Withdrawals.jsx`
    - **Action**: A funded trader requests a payout.
    - **Function**: `requestTraderWithdrawal.js`
    - **Server-Side Validation**:
        - **Account Ownership**: `if (account.user_email !== user.email)`
        - **Funded Status**: `if (account.status !== 'funded')`
        - **KYC Approval**: `if (!kyc || kyc.status !== 'approved')`
        - **No Pending Requests**: Checks for existing pending `WithdrawalRequest` for the same account.
        - **Sufficient Profit**: `if (gross > availableProfit)` where `availableProfit` is from `account.pnl`.
        - **Profit Split**: `const profitSplitPct = account.rule_snapshot?.profit_split ?? 80;` (reads from the immutable snapshot).
        - **Fees**: Reads `withdrawal_fee` from `AffiliateSettings`.
    - **Output**: Creates a `WithdrawalRequest` record with `status: 'pending'`.

2.  **Admin Review & Approval**
    - **Component**: `components/admin/AdminWithdrawals.jsx`
    - **Action**: Admin reviews the pending request, can override fees/split, and approves.
    - **Function**: `adminApproveWithdrawal.js`
    - **Logic**:
        - **Duplicate Protection**: `if (w.status === 'approved' || w.status === 'paid')`
        - Recalculates final payout amount.
        - Updates `WithdrawalRequest` status to `'approved'`.
        - **Creates Affiliate Payout Reward**: If the trader was referred, it creates a `payout_reward` type `AffiliateCommission` for the sponsor. This is idempotent and checks if a commission for this `withdrawal_id` already exists.
        - **Creates Certificate**: On first payout, it creates a `'first_payout'` type `Certificate`.
    - **Code Evidence** (`adminApproveWithdrawal.js`):
        ```javascript
        // ... Recalculate with overrides ...
        await sr.entities.WithdrawalRequest.update(w.id, { status: 'approved', ... });
        // ... Create payout_reward commission (idempotent check) ...
        // ... Create first_payout certificate (idempotent check) ...
        ```

3.  **Payout**
    - The system currently transitions the status to `'approved'`. The actual off-platform transfer (e.g., sending crypto) is a manual process to be completed by the finance team.
    - After the transfer, the admin would manually update the status to `'paid'` and enter the transaction ID in `AdminWithdrawals`.

---

## SECTION 7 — KYC SYSTEM

1.  **User Document Upload**
    - **Component**: `components/dashboard/KYC.jsx`
    - **Action**: User fills in personal details and uploads documents (ID, selfie, proof of address).
    - **Backend**: `handleUpload` function calls `base44.integrations.Core.UploadFile({ file })`. This is a secure built-in function that stores the file and returns a URL. The URL is then saved in the `KYCVerification` entity. Files are stored in secure, private storage.
    - **Database**: A `KYCVerification` record is created with `status: 'pending'`.

2.  **Admin Review Process**
    - **Component**: `components/admin/AdminKYC.jsx`
    - **Action**: Admin views pending submissions, inspects the uploaded document URLs, and makes a decision.
    - **Document Security**: Document URLs should be signed URLs for secure, time-limited access. The current implementation uses direct URLs from `UploadFile`, which may be a security risk if storage buckets are not properly configured. *Recommendation: Use `create_file_signed_url` tool to generate temporary links for admins.*

3.  **Approval / Rejection**
    - **Action**: Admin approves, rejects, or requests resubmission.
    - **Database**: The `updateMutation` in `AdminKYC.jsx` updates the status of the `KYCVerification` record. If rejected, the `rejection_reason` field is populated.

4.  **Integration with Withdrawals**
    - The `requestTraderWithdrawal` and `requestAffiliateWithdrawal` functions check the user's KYC status before creating a withdrawal request.
    - **Code Evidence** (`requestTraderWithdrawal.js`):
        ```javascript
        const kycList = await base44.asServiceRole.entities.KYCVerification.filter({ user_email: user.email });
        const kyc = kycList[0];
        if (!kyc || kyc.status !== 'approved') {
          return Response.json({ error: 'KYC verification required before withdrawal' });
        }
        ```
- **Production Readiness**: **NEEDS WORK**. The core flow is functional, but document viewing security needs improvement (use signed URLs).

---

## SECTION 8 — SUPPORT SYSTEM

- **Frontend Component**: `components/dashboard/Support.jsx`
- **Admin Component**: `components/admin/AdminSupport.jsx`
- **Database Entity**: `SupportTicket`
- **Data Flow**:
    1.  User submits "New Ticket" form in `Support.jsx`.
    2.  `createMutation` creates a `SupportTicket` entity record.
    3.  Admins view these tickets in `AdminSupport.jsx`.
    4.  Admin can write a reply, which updates the `admin_reply` field on the `SupportTicket` entity.
- **Verification**:
    - **Creates Tickets?**: Yes, as records in the `SupportTicket` entity.
    - **Sends Emails?**: **No.** There is no integration with `emailService` to notify admins of new tickets or users of replies.
    - **Notifies Admins?**: **No.** No `Notification` entities are created.
    - **Ticket Status Tracking?**: Yes, the `status` field can be updated by admins.
    - **Conversation History?**: **No.** The system only stores the initial user message and a single admin reply. There is no threading.
- **Classification**: **MOCK**. This is a "message board" system, not a functional support ticket system. It lacks the essential notification and communication loops.

---

## SECTION 9 — SETTINGS MODULE

- **Frontend Component**: `components/dashboard/DashboardSettings.jsx`
- **Backend Functions**: `supabaseAuthBridge` (for password changes), `Core.UploadFile` (for profile photo).
- **Database Entities**: `User` (via `base44.auth.updateMe`), `UserAccount`, `UserSession`.
- **Functionality**:
    - **Profile**: Updates `full_name`, `username`, `phone`, `country`, etc. on the user's metadata. **WORKING**.
    - **Security**:
        - **Password Change**: Relies on a custom auth flow which is not fully implemented in `supabaseAuthBridge`. **PARTIAL/BROKEN**.
        - **2FA**: A toggle UI exists but has no backend logic to enable/enforce TOTP. **DISPLAY ONLY**.
        - **Google Auth**: UI exists, but the backend `googleAuth` function is not a standard Supabase OAuth flow and is likely **BROKEN**.
    - **Payout Wallets**: Saves crypto wallet addresses to the user's metadata. **WORKING**.
    - **Notifications**: Toggles for email preferences exist but are not connected to any backend logic in `emailService`. **DISPLAY ONLY**.
- **Classification**: **PARTIAL**. Basic profile updates work, but critical security features (password change, 2FA) and notification settings are non-functional.

---

## SECTION 10 — NOTIFICATIONS SYSTEM

- **Frontend Components**: `NotificationCenter.jsx`, `NotificationBanner.jsx`, `DashboardPopupNotification.jsx`.
- **Database Entity**: `Notification`.
- **Data Flow**:
    1.  **Trigger**: An event occurs (e.g., payment approved, account breached, admin sends announcement).
    2.  **Creation**: The relevant backend function (e.g., `checkoutWebhook`, `scheduledMTSync`, `AdminNotifications.jsx`) creates a `Notification` entity record.
        - **Code Evidence** (`checkoutWebhook.js`):
            ```javascript
            await base44.asServiceRole.entities.Notification.create({
              title: '✅ Payment Confirmed',
              message: `Your ... payment was approved.`,
              type: 'payout', priority: 'high', display_mode: 'popup',
            });
            ```
    3.  **Storage**: The notification is stored in the `Notification` database table.
    4.  **Delivery**: The main `Dashboard.jsx` component queries the `Notification` entity every 30 seconds and displays them based on their `display_mode` (`banner` or `popup`). The `NotificationCenter` page displays a full history.
- **Verification**:
    - **Real Notifications**: Yes, the system creates and displays real, event-driven notifications.
    - **Push Notifications**: **No.** There is no implementation for browser/mobile push notifications.
    - **Email Notifications**: **Yes**, but this is a separate system handled by the `emailService` function, not directly by the `Notification` entity.
    - **In-app Notifications**: Yes, this is the primary function of the system.
- **Classification**: **PRODUCTION READY** for in-app notifications.

---

## SECTION 11 — CALENDAR & NEWS

- **Frontend Components**: `EconomicCalendar.jsx`, `MarketNews.jsx`.
- **Backend**: `base44.integrations.Core.InvokeLLM`
- **Data Flow**:
    1.  Component mounts and calls a fetch function (e.g., `fetchRealCalendar`).
    2.  The fetch function calls `base44.integrations.Core.InvokeLLM` with a detailed prompt asking for financial data from specific web sources (e.g., Forex Factory, Bloomberg). The `add_context_from_internet: true` parameter is used.
    3.  A `response_json_schema` is provided to ensure the LLM returns data in the expected format.
    4.  The component state is updated with the returned JSON data and rendered.
- **Verification**:
    - **Data Provider**: An AI Large Language Model (LLM).
    - **API Source**: The LLM performs a live web search of public financial news sites.
    - **Refresh Interval**: Data is fetched on component load and can be manually refreshed by the user. There is no automatic background refresh.
    - **Storage**: Data is not stored in the database; it is ephemeral.
    - **Real-time Status**: It is "live" in the sense that it's generated on-demand, but it is not a real-time websocket/streaming feed from a market data provider.
- **Classification**: **AI GENERATED**. Functional but accuracy and availability depend entirely on the LLM.

---

## SECTION 12 — ANALYTICS & LEADERBOARD

- **Frontend Components**: `Analytics.jsx`, `Leaderboard.jsx`.
- **Data Source**:
    - **Analytics**: Reads `TradeRecord` and `ChallengeAccount` entities for the *selected user account only*. All calculations (equity curve, stats) are done on the client.
    - **Leaderboard**: Reads *all* `active` and `funded` `ChallengeAccount` records and all `paid` `WithdrawalRequest` records. It calculates profit ratios and joins payout data to rank users.
- **Calculation Source**: All calculations are performed in the frontend within the components themselves using JavaScript.
- **Ranking Logic**: `Leaderboard.jsx` sorts traders by `profitRatio` (P&L / account size).
- **Data Type**: Uses **real trade and account data** from the platform's database.
- **Classification**:
    - **Analytics**: **PARTIAL**. Functional for small datasets, but client-side processing is not scalable for traders with extensive history.
    - **Leaderboard**: **SAFE FOR PRODUCTION**, but may become slow if the number of accounts grows significantly, as it fetches all accounts to perform the ranking.

---

## SECTION 13 — SECURITY AUDIT PER FEATURE

| Feature | Authentication | Authorization | Entity Security | Backend Security | Data Isolation | Risk Level |
|---|---|---|---|---|---|---|
| **Overview** | ✅ Enforced | ✅ User-scoped | `ChallengeAccount`: owner | N/A | ✅ Scoped by email | **LOW** |
| **My Accounts** | ✅ Enforced | ✅ User-scoped | `ChallengeAccount`: owner | ✅ `getPlatformCredentials` secured | ✅ Scoped by email | **LOW** |
| **Analytics** | ✅ Enforced | ✅ User-scoped | `TradeRecord`: owner | N/A (client-side) | ✅ Scoped by email | **LOW** |
| **Buy Challenge** | ✅ Enforced | Authenticated | `Order`: create (auth), read (owner) | ✅ Payment fns require auth | ✅ User creates own order | **LOW** |
| **Calendar/News** | ✅ Enforced | Authenticated | N/A | ✅ `InvokeLLM` requires auth | N/A | **LOW** |
| **Journal** | ✅ Enforced | ✅ User-scoped | `TradingJournalEntry`: CRUD (owner) | ✅ `InvokeLLM` requires auth | ✅ Scoped by email | **LOW** |
| **Leaderboard** | ✅ Enforced | Authenticated | Reads public-safe data | N/A | ✅ Anonymized | **LOW** |
| **Affiliate** | ✅ Enforced | ✅ User-scoped | `AffiliateProfile`/`Commission`: owner | ✅ `requestAffiliateWithdrawal` secured | ✅ Scoped by email | **LOW** |
| **Withdrawals** | ✅ Enforced | ✅ User-scoped | `WithdrawalRequest`: create (auth), read (owner) | ✅ `requestTraderWithdrawal` secured | ✅ Scoped by email | **LOW** |
| **KYC** | ✅ Enforced | ✅ User-scoped | `KYCVerification`: create (auth), read (owner) | ✅ `UploadFile` is secure | ✅ Scoped by email | **MEDIUM** (Doc URLs) |
| **Support** | ✅ Enforced | Authenticated | ⚠️ `SupportTicket`: **NO RLS** | N/A | ⚠️ **NO ISOLATION** | **CRITICAL** |
| **Settings** | ✅ Enforced | ✅ User-scoped | `User`: (via `updateMe`) | ✅ `supabaseAuthBridge` | ✅ Scoped by session | **MEDIUM** (Auth logic) |

---

## SECTION 14 — FINAL PLATFORM ARCHITECTURE REPORT

| Feature | Frontend Component(s) | Backend Function(s) | Database Entities | Automations | Admin Dependency | Security Level | Production Readiness |
|---|---|---|---|---|---|---|---|
| **Overview** | `DashboardOverview` | `syncUserAccountOnLogin` | `ChallengeAccount`, `Order` | `scheduledMTSync` | Yes | ✅ Secure | **SAFE** |
| **My Accounts** | `MyAccounts` | `getPlatformCredentials` | `ChallengeAccount` | `scheduledMTSync` | Yes | ✅ Secure | **SAFE** |
| **Analytics** | `Analytics` | None (Client-side) | `TradeRecord`, `ChallengeAccount` | N/A | No | ✅ Secure | **PARTIAL** |
| **Buy Challenge** | `ChallengeMarketplace` | `create...Payment`... | `ChallengePlan`, `Order`, `Coupon` | Payment Webhooks | Yes | ✅ Secure | **SAFE** |
| **Calendar/News**| `EconomicCalendar`, `MarketNews` | `Core.InvokeLLM` | N/A | N/A | No | ✅ Secure | **AI GENERATED** |
| **Journal** | `TradingJournal` | `Core.InvokeLLM` | `TradingJournalEntry` | N/A | No | ✅ Secure | **SAFE** |
| **Leaderboard** | `Leaderboard` | None | `ChallengeAccount`, `WithdrawalRequest` | N/A | No | ✅ Secure (Anon) | **SAFE** |
| **Affiliate** | `Affiliate` | `requestAffiliateWithdrawal` | `AffiliateProfile`, `Commission` | N/A | Yes | ✅ Secure | **SAFE** |
| **Certificates** | `Certificates` | `generateChallengeCertificate` | `Certificate` | Yes (disabled) | Yes | ✅ Secure | **PARTIAL** |
| **Withdrawals** | `Withdrawals` | `requestTraderWithdrawal` | `WithdrawalRequest`, `KYC` | N/A | Yes | ✅ Secure | **SAFE** |
| **Billing** | `Billing` | None (jsPDF client-side) | `Order` | N/A | Yes | ✅ Secure | **SAFE** |
| **KYC** | `KYC` | `Core.UploadFile` | `KYCVerification` | N/A | Yes | ⚠️ Needs Improvement | **NEEDS WORK** |
| **Support** | `Support` | None | `SupportTicket` | N/A | Yes | ❌ **CRITICAL** | **MOCK** |
| **Settings** | `DashboardSettings` | `supabaseAuthBridge` | `User`, `UserAccount`, `UserSession`| N/A | No | ⚠️ Needs Improvement | **PARTIAL** |

### Final Classification

- **SAFE FOR PRODUCTION**: Overview, My Accounts, Buy Challenge, Journal, Leaderboard, Affiliate, Withdrawals, Billing, Notifications.
- **NEEDS WORK**: KYC (document URL security).
- **PARTIAL / DISPLAY-ONLY**: Analytics (scalability), Certificates (automation disabled), Settings (broken security features).
- **CRITICAL / MOCK**: Support (not functional, major security flaw).