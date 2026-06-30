import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useRiskCenterData(scanOnly = false) {
  return useQuery({
    queryKey: ['risk-center-data', scanOnly],
    queryFn: async () => {
      const res = await base44.functions.invoke('riskCenterScan', { scan_only: scanOnly });
      return res?.data || { success: false, accounts: [], device_logs: [], econ_events: [], summary: {} };
    },
    refetchInterval: 60000,
    staleTime: 30000,
    placeholderData: (prev) => prev,
  });
}