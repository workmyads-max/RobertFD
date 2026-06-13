/**
 * useSupabaseQuery — thin wrapper that uses direct Supabase queries
 * instead of base44.entities.* which requires a platform token
 * that doesn't exist on mobile (direct URL access).
 *
 * Supabase auth session is already present on both desktop and mobile
 * since we use Supabase Auth natively. This bypasses the Base44
 * entity middleware entirely and queries the database directly.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseAuth } from '@/lib/SupabaseAuthContext';

// ─── Challenge Accounts ───────────────────────────────────────────────────────
export function useChallengeAccounts(options = {}) {
  const { user } = useSupabaseAuth();
  const email = user?.email;

  return useQuery({
    queryKey: ['challenge-accounts-sb', email],
    queryFn: async () => {
      // Try direct filter by user_email first
      const { data, error } = await supabase
        .from('challenge_accounts')
        .select('*')
        .eq('user_email', email)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useChallengeAccounts] Supabase error:', error);
        throw error;
      }

      console.log('[useChallengeAccounts] email:', email, 'count:', data?.length, 'error:', error);
      return data || [];
    },
    enabled: !!email,
    refetchInterval: 60000,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    ...options,
  });
}

// ─── Single account ───────────────────────────────────────────────────────────
export function useChallengeAccount(accountId) {
  return useQuery({
    queryKey: ['challenge-account-sb', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_accounts')
        .select('*')
        .eq('account_id', accountId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!accountId,
    refetchInterval: 5000,
    staleTime: 3000,
  });
}

// ─── Trade Records ────────────────────────────────────────────────────────────
export function useTradeRecords(accountId, options = {}) {
  return useQuery({
    queryKey: ['trade-records-sb', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trade_records')
        .select('*')
        .eq('account_id', accountId)
        .order('open_time', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!accountId,
    refetchInterval: 5000,
    staleTime: 3000,
    ...options,
  });
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export function useOrders(options = {}) {
  const { user } = useSupabaseAuth();
  const email = user?.email;

  return useQuery({
    queryKey: ['orders-sb', email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!email,
    ...options,
  });
}

// ─── KYC ─────────────────────────────────────────────────────────────────────
export function useKYC(options = {}) {
  const { user } = useSupabaseAuth();
  const email = user?.email;

  return useQuery({
    queryKey: ['kyc-sb', email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_verifications')
        .select('*')
        .eq('user_email', email)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
    enabled: !!email,
    ...options,
  });
}

// ─── Certificates ─────────────────────────────────────────────────────────────
export function useCertificates(options = {}) {
  const { user } = useSupabaseAuth();
  const email = user?.email;

  return useQuery({
    queryKey: ['certificates-sb', email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_email', email)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!email,
    ...options,
  });
}

// ─── Withdrawals ──────────────────────────────────────────────────────────────
export function useWithdrawals(options = {}) {
  const { user } = useSupabaseAuth();
  const email = user?.email;

  return useQuery({
    queryKey: ['withdrawals-sb', email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_email', email)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!email,
    ...options,
  });
}

// ─── Affiliate Profile ────────────────────────────────────────────────────────
export function useAffiliateProfile(options = {}) {
  const { user } = useSupabaseAuth();
  const email = user?.email;

  return useQuery({
    queryKey: ['affiliate-profile-sb', email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliate_profiles')
        .select('*')
        .eq('user_email', email)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
    enabled: !!email,
    ...options,
  });
}

// ─── Affiliate Commissions ────────────────────────────────────────────────────
export function useAffiliateCommissions(options = {}) {
  const { user } = useSupabaseAuth();
  const email = user?.email;

  return useQuery({
    queryKey: ['affiliate-commissions-sb', email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliate_commissions')
        .select('*')
        .eq('affiliate_email', email)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!email,
    ...options,
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────
export function useNotifications(options = {}) {
  return useQuery({
    queryKey: ['notifications-sb'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
    ...options,
  });
}