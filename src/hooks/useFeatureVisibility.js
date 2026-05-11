import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useFeatureVisibility() {
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => base44.entities.PlatformSettings.list('-created_date', 100),
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const isEnabled = (featureKey) => {
    const setting = settings.find(s => s.setting_key === featureKey);
    return setting ? setting.is_enabled : true;
  };

  return {
    isLoading,
    isEnabled,
    settings,
  };
}