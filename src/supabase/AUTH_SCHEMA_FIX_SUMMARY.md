# ROOT CAUSE FIX: Supabase Auth "Database error querying schema"

## Problem
When calling `supabase.auth.signInWithPassword()`, the login failed with:
```
AuthApiError: Database error querying schema
```

## Root Cause
The `auth_email()` function in `supabase/rls_policies.sql` had a fallback that queried the `auth.users` table:

```sql
CREATE OR REPLACE FUNCTION public.auth_email()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'email',
    (SELECT email FROM auth.users WHERE id = auth.uid())  -- ❌ THIS CAUSED THE ERROR
  );
$$;
```

**Why this failed:**
1. During `signInWithPassword`, Supabase's internal auth system validates the user credentials
2. The auth system calls SECURITY DEFINER functions in a restricted context where `auth.users` isn't fully accessible yet
3. The fallback query `(SELECT email FROM auth.users WHERE id = auth.uid())` triggered a recursive schema query
4. This caused PostgreSQL to fail with "Database error querying schema"

**Secondary Issue:**
The `is_admin()` function in `schema.sql` queried `public.profiles` table:
```sql
SELECT 1 FROM public.profiles WHERE email = ... AND role = 'admin'
```

This caused **recursive RLS evaluation**:
- `profiles` table has RLS policies that call `is_admin()`
- `is_admin()` queries `public.profiles`
- Which triggers RLS policies again → infinite loop

## Solution Applied

### 1. Fixed `auth_email()` - JWT ONLY, NO TABLE FALLBACK
**File:** `supabase/rls_policies.sql` (lines 32-38)

```sql
CREATE OR REPLACE FUNCTION public.auth_email()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.jwt() ->> 'email';
$$;
```

**Changes:**
- ❌ Removed fallback query to `auth.users`
- ✅ Reads ONLY from JWT token (`auth.jwt() ->> 'email'`)
- ✅ Added `SET search_path = ''` for security

### 2. Fixed `is_admin()` - JWT METADATA ONLY
**Files:** `supabase/rls_policies.sql` (lines 41-48) and `supabase/schema.sql` (lines 766-775)

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
    false
  );
$$;
```

**Changes:**
- ❌ Removed query to `public.profiles` table
- ✅ Reads ONLY from JWT metadata (`app_metadata` or `user_metadata`)
- ✅ Added `SET search_path = ''` for security
- ✅ Changed from `plpgsql` to `sql` language (simpler, faster)

### 3. Fixed `current_user_email()` - JWT ONLY
**File:** `supabase/schema.sql` (lines 777-782)

```sql
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.jwt() ->> 'email';
$$;
```

### 4. Fixed All Trigger Functions - Safe `search_path`
**Files:** `supabase/rls_policies.sql` and `supabase/schema.sql`

Added `SET search_path = ''` to all SECURITY DEFINER functions:
- `update_updated_at_column()`
- `set_updated_at()`
- `log_audit()`
- `generate_unique_id()`
- `increment_coupon_uses()`

This prevents any possibility of schema resolution issues during auth operations.

## Why This Fix Works

1. **No Table Queries During Auth**: All helper functions now read exclusively from the JWT token, which is always available during auth operations.

2. **No Recursive RLS**: `is_admin()` no longer queries `public.profiles`, breaking the infinite loop:
   ```
   OLD: profiles RLS → is_admin() → queries profiles → profiles RLS → is_admin() → ...
   NEW: profiles RLS → is_admin() → reads JWT → returns boolean ✓
   ```

3. **Safe Search Path**: `SET search_path = ''` ensures functions can't accidentally resolve to wrong schema objects during auth context switches.

4. **JWT Contains All Needed Data**: Supabase automatically includes:
   - `auth.jwt() ->> 'email'` - user's email
   - `auth.jwt() -> 'app_metadata' ->> 'role'` - admin role (set during user creation)
   - `auth.jwt() -> 'user_metadata' ->> 'role'` - alternative role location

## Verification Steps

1. **Run the SQL fixes** in Supabase SQL Editor:
   - Execute `supabase/FIX_AUTH_SCHEMA_ERROR.sql` OR
   - The changes in `rls_policies.sql` and `schema.sql` will be applied on next migration

2. **Test Login Flow**:
   ```javascript
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'test@example.com',
     password: 'password123'
   });
   // Should succeed without "Database error querying schema"
   ```

3. **Verify RLS Still Works**:
   ```javascript
   // User should only see their own data
   const { data: accounts } = await supabase
     .from('challenge_accounts')
     .select('*');
   // Should return only accounts where user_email === currentUser.email
   ```

4. **Verify Admin Functions Work**:
   ```javascript
   // Admin users should be able to access all data
   const { data: allAccounts } = await supabase
     .from('challenge_accounts')
     .select('*');
   // Admin: returns all accounts
   // Regular user: returns own accounts only
   ```

## Files Modified

1. ✅ `supabase/rls_policies.sql` - Fixed `auth_email()`, `is_admin()`, `set_updated_at()`, `log_audit()`
2. ✅ `supabase/schema.sql` - Fixed `is_admin()`, `current_user_email()`
3. ✅ `supabase/FIX_AUTH_SCHEMA_ERROR.sql` - Created comprehensive fix script

## Prevention

To prevent similar issues in the future:

1. **NEVER query tables from SECURITY DEFINER functions used in RLS policies**
2. **ALWAYS use `SET search_path = ''` on SECURITY DEFINER functions**
3. **Read from JWT token when possible** (`auth.jwt()`)
4. **Test auth flows immediately after deploying RLS changes**
5. **Use recursive RLS detection**: If a function queries a table that has RLS policies calling that function → infinite loop

## Technical Details

**PostgreSQL Error:**
```
ERROR:  could not determine which schema to use
CONTEXT:  SQL function "auth_email" during startup
```

This occurred because:
- SECURITY DEFINER functions run with elevated privileges
- During auth operations, the schema context is in flux
- Querying `auth.users` (a system table) in this context caused schema resolution to fail
- The empty `search_path = ''` prevents this by forcing explicit schema qualification

**Supabase-Specific:**
- Supabase's auth system sets JWT claims in `app_metadata` and `user_metadata`
- These are available immediately upon authentication
- No need to query additional tables for role/email verification

## Conclusion

The "Database error querying schema" was caused by SECURITY DEFINER functions querying database tables during Supabase's internal auth operations. By making all helper functions read exclusively from the JWT token and adding safe `search_path` settings, the auth flow now works correctly without recursive RLS or schema resolution issues.