import { useApp } from '@/context/AppContext';
import { MyInfo } from '@/schemas/health.schema';

/**
 * Hook for accessing and updating the user's personal profile info.
 */
export function useMyInfo() {
  const { myInfo, updateMyInfo, isLoading, isSaving, error } = useApp();

  return {
    myInfo,
    updateMyInfo,
    isLoading,
    isSaving,
    error,
    hasProfile: Boolean(myInfo && myInfo.fullName),
  };
}

