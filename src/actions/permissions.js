import useSWR from 'swr';
import { useMemo } from 'react';

import axios, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

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

// ----------------------------------------------------------------------

export function useGetPermissions() {
  const url = endpoints.permission.list;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      permissions: data || [],
      permissionsLoading: isLoading,
      permissionsError: error,
      permissionsValidating: isValidating,
      permissionsEmpty: !isLoading && !data?.length,
      mutatePermissions: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export async function updateUserPermissions(userId, permissionIds) {
  try {
    const url = endpoints.permission.setById(userId);
    const res = await axios.post(url, { permission_ids: permissionIds });
    return res.data;
  } catch (error) {
    console.error('Error updating user permissions:', error);
    throw error;
  }
}
