import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

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
    await mutate(endpoints.permission.byId(userId));
    return res.data;
  } catch (error) {
    console.error('Error updating user permissions:', error);
    throw error;
  }
}

export function useGetUserPermissions(userId) {
  const url = userId ? endpoints.permission.byId(userId) : null;

  const { data, isLoading, error } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      userPermissions: Array.isArray(data) ? data : [],
      userPermissionsLoading: isLoading,
      userPermissionsError: error,
    }),
    [data, isLoading, error]
  );
}
