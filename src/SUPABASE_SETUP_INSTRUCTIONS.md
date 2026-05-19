# ✅ SUPABASE INFRASTRUCTURE - SETUP INSTRUCTIONS

## Step 1: Run This SQL in Supabase SQL Editor

Go to **Supabase Dashboard → SQL Editor** and run:
```
supabase/ADD_MISSING_TABLES_AND_FIXES.sql
```

This will:
- ✅ Create `challenge_plans` table
- ✅ Add unique constraint on `trade_records.trade_id`  
- ✅ Drop FK constraints that block syncing (trade_records, certificates)
- ✅ Make `certificates.account_id` nullable
- ✅ Add `instant_light` to challenge_type enum
- ✅ Make `withdrawal_id` and `ticket_id` nullable

## Step 2: Run Full Sync

After SQL migration, trigger a full sync by calling the backend function:
- Go to Dashboard → Admin → any admin section
- Or call `syncAllEntitiesToSupabase` from the function dashboard

## Current Sync Status (Before SQL Migration)

| Entity | Status | Notes |
|--------|--------|-------|
| profiles | ✅ 24/24 | Working |
| orders | ✅ 22/22 | Working |
| notifications | ✅ 20/20 | Working |
| coupons | ✅ 3/3 | Working |
| payment_gateways | ✅ 2/2 | Working |
| platform_settings | ✅ 7/7 | Working |
| social_media_settings | ✅ 1/1 | Working |
| affiliate_settings | ✅ 1/1 | Working |
| affiliate_profiles | ✅ 5/5 | Working |
| challenge_accounts | ⚠️ 12/22 | 10 test accounts missing user_email |
| challenge_plans | ❌ 0/32 | Needs SQL migration (table missing) |
| trade_records | ❌ 0/85 | Needs FK constraint drop (SQL migration) |
| certificates | ❌ 0/4 | Needs FK constraint drop (SQL migration) |
| withdrawals | ⚠️ 0/1 | Old record missing withdrawal_id field |

## Frontend Fixes Applied

### User Data Isolation (Critical Security Fix)
All user-facing pages now filter by `user_email` (previously showed ALL users' data):

- ✅ `MyAccounts` — filters `ChallengeAccount` by `user_email`
- ✅ `FundedDashboard` — filters `ChallengeAccount` by `user_email`  
- ✅ `Withdrawals` — filters `WithdrawalRequest` by `user_email`
- ✅ `Billing` — filters `Order` by `email`, no more demo data fallback
- ✅ `Certificates` — filters `Certificate` by `user_email`

### Data Quality Fixes
- ✅ `Withdrawals` — now auto-generates `withdrawal_id` on creation (required for Supabase sync)
- ✅ `Billing` — proper status icons (✅ confirmed, ⚠️ pending, ❌ failed)
- ✅ `Billing` — proper empty state when no orders

## Expected Sync After SQL Migration

```
profiles:           24/24  ✅
challenge_plans:    32/32  ✅ (after SQL)
challenge_accounts: 22/22  ✅ (after SQL)
orders:             22/22  ✅
trade_records:      85/85  ✅ (after SQL)
certificates:        4/4   ✅ (after SQL)
notifications:      20/20  ✅
coupons:             3/3   ✅
payment_gateways:    2/2   ✅
affiliate_profiles:  5/5   ✅
platform_settings:   7/7   ✅

TOTAL: ~230/232 records synced (99%+)
``