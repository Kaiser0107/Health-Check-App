import { useApp } from '../context/AppContext';
import { HealthRecord } from '../schemas/health.schema';
import { getOverallHealthStatus } from '../constants/thresholds';
import { useMemo } from 'react';

/**
 * Hook for managing health records, latest vitals, and overall health status.
 */
export function useHealthData() {
  const { records, latestRecord, addNewRecord, removeRecord, isLoading, isSaving, error, refreshData } = useApp();

  const overallStatus = useMemo(() => {
    return getOverallHealthStatus(latestRecord);
  }, [latestRecord]);

  return {
    records,
    latestRecord,
    overallStatus,
    addNewRecord,
    removeRecord,
    isLoading,
    isSaving,
    error,
    refreshData,
    hasRecords: records.length > 0,
  };
}

