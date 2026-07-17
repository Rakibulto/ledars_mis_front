'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/utils/axios';

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
// REGULAR HOLIDAYS
// ----------------------------------------------------------------------

export function useGetHolidays() {
  const url = endpoints.holiday.list;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      datas: data || [],
      datasLoading: isLoading,
      datasError: error,
      datasValidating: isValidating,
      datasEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export function useGetHoliday(id) {
  const url = id ? endpoints.holiday.details(id) : null;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      data: data || {},
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      dataEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export async function createHoliday(data) {
  try {
    const res = await axios.post(endpoints.holiday.list, data);

    await mutate(endpoints.holiday.list);

    return res.data;
  } catch (error) {
    console.error('Error creating holiday:', error);
    throw error;
  }
}

export async function updateHoliday(id, data) {
  try {
    const res = await axios.patch(endpoints.holiday.details(id), data);

    await mutate(endpoints.holiday.details(id));
    await mutate(endpoints.holiday.list);

    return res.data;
  } catch (error) {
    console.error('Error updating holiday:', error);
    throw error;
  }
}

export async function deleteHoliday(id) {
  try {
    const res = await axios.delete(endpoints.holiday.details(id));

    await mutate(endpoints.holiday.list);

    return res.data;
  } catch (error) {
    console.error('Error deleting holiday:', error);
    throw error;
  }
}
