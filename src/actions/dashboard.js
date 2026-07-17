import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshWhenOffline: false,
  dedupingInterval: 10000, // Prevent duplicate requests within 10 seconds
  focusThrottleInterval: 10000, // Throttle focus revalidations to 10 seconds
  errorRetryCount: 2, // Retry failed requests up to 2 times
  errorRetryInterval: 10000, // Wait 10 seconds before retrying
};

export function useGetDashboard(startDate, endDate) {
  const { user } = useAuthContext();

  const url =
    !startDate || !endDate
      ? null
      : user?.role === 'Admin'
        ? endpoints.dashboard.all(startDate, endDate)
        : endpoints.dashboard.bySupervisor(user?.employee_id, startDate, endDate);

  const { data, error, isLoading, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      dashboard: data || [],
      dashboardLoading: isLoading,
      dashboardError: error,
      dashboardValidating: isValidating,
      dashboardEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export function useGetEmployeeDashboard(employeeId, startDate, endDate) {
  const url =
    !startDate && !endDate ? null : endpoints.dashboard.byEmployee(employeeId, startDate, endDate);

  const { data, error, isLoading, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      dashboard: data || [],
      dashboardLoading: isLoading,
      dashboardError: error,
      dashboardValidating: isValidating,
      dashboardEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}
