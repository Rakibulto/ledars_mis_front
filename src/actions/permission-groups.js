import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshWhenOffline: false,
  dedupingInterval: 10000,
  focusThrottleInterval: 10000,
  errorRetryCount: 2,
  errorRetryInterval: 10000,
};

// ----------------------------------------------------------------------

export function useGetPermissionGroups(moduleKey) {
  const url = moduleKey
    ? `${endpoints.permissionGroup.list}?module_key=${moduleKey}`
    : endpoints.permissionGroup.list;

  const { data, isLoading, error, isValidating, mutate: revalidate } = useSWR(
    url,
    fetcher,
    swrOptions
  );

  return useMemo(
    () => ({
      permissionGroups: Array.isArray(data) ? data : [],
      permissionGroupsLoading: isLoading,
      permissionGroupsError: error,
      permissionGroupsValidating: isValidating,
      mutatePermissionGroups: revalidate,
    }),
    [data, error, isLoading, isValidating, revalidate]
  );
}

export async function createPermissionGroup(payload) {
  const res = await axios.post(endpoints.permissionGroup.list, payload);
  await mutate(endpoints.permissionGroup.list);
  return res.data;
}

export async function updatePermissionGroup(id, payload) {
  const res = await axios.put(endpoints.permissionGroup.byId(id), payload);
  await mutate(endpoints.permissionGroup.list);
  await mutate(endpoints.permissionGroup.byId(id));
  return res.data;
}

export async function deletePermissionGroup(id) {
  const res = await axios.delete(endpoints.permissionGroup.byId(id));
  await mutate(endpoints.permissionGroup.list);
  return res.data;
}
