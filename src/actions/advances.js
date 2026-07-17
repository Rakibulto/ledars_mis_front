import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/utils/axios';

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

export function useGetAdvances() {
  const url = endpoints.projectManagementAdvances.list;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      advances: Array.isArray(data) ? data : data?.results || [],
      advancesLoading: isLoading,
      advancesError: error,
      advancesValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}

export async function updateAdvance(id, formData) {
  try {
    const res = await axios.patch(endpoints.projectManagementAdvances.detail(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await mutate(endpoints.projectManagementAdvances.list);
    await mutate(endpoints.projectManagementAdvances.detail(id));
    return res.data;
  } catch (error) {
    console.error('Error updating advance:', error);
    throw error;
  }
}

export function useGetAdvance(id) {
  const url = id ? endpoints.projectManagementAdvances.detail(id) : null;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      advance: data || null,
      advanceLoading: isLoading,
      advanceError: error,
      advanceValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}

export async function createAdvance(formData) {
  try {
    const res = await axios.post(endpoints.projectManagementAdvances.list, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await mutate(endpoints.projectManagementAdvances.list);
    return res.data;
  } catch (error) {
    console.error('Error creating advance:', error);
    throw error;
  }
}

export async function deleteAdvance(id) {
  try {
    const res = await axios.delete(endpoints.projectManagementAdvances.detail(id));
    await mutate(endpoints.projectManagementAdvances.list);
    return res.data;
  } catch (error) {
    console.error('Error deleting advance:', error);
    throw error;
  }
}
