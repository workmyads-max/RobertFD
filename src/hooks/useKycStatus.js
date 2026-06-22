/**
 * useKycStatus — Shared KYC status hook.
 *
 * Single source of truth for the current user's KYCVerification status.
 * Both the KYC page and the Withdrawals page use this so they never disagree.
 *
 * - Fetches fresh from the server on mount (no stale default).
 * - Exposes `isLoading` so callers can show a brief loading indicator instead
 *   of a default "pending" card before the real status arrives.
 * - Uses placeholderData to keep previous data while refetching (prevents flash).
 * - Invalidates on window focus so status changes propagate without manual refresh.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useEffect } from 'react';

export const KYC_QUERY_KEY = (email) => ['kyc-status', email];

export function useKycStatus(userEmail) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: KYC_QUERY_KEY(userEmail),
    queryFn: async () => {
      if (!userEmail) return null;
      const list = await base44.entities.KYCVerification.filter({ user_email: userEmail });
      return (list && list[0]) || null;
    },
    enabled: !!userEmail,
    staleTime: 60000, // 1 min stale time
    placeholderData: (prev) => prev, // keep previous data while refetching
  });

  // Invalidate on window focus so admin approvals reflect immediately
  useEffect(() => {
    const onFocus = () => {
      if (userEmail) qc.invalidateQueries({ queryKey: KYC_QUERY_KEY(userEmail) });
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [userEmail, qc]);

  const kyc = query.data || null;
  const status = kyc?.status || 'not_submitted';
  const isApproved = status === 'approved';
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';
  const isResubmit = status === 'resubmit_required';
  const isNotSubmitted = status === 'not_submitted';

  return {
    kyc,
    status,
    isApproved,
    isPending,
    isRejected,
    isResubmit,
    isNotSubmitted,
    isLoading: query.isLoading && !query.data, // true only on first load (no cached data)
    isFetching: query.isFetching,
    invalidate: () => qc.invalidateQueries({ queryKey: KYC_QUERY_KEY(userEmail) }),
  };
}