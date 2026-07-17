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

export function useGetSalaries(employeeId = null, enabled = true) {
  const url = enabled
    ? employeeId
      ? `${endpoints.salary.byId(employeeId)}`
      : endpoints.salary.list
    : null;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      salaries: data || [],
      salariesLoading: isLoading,
      salariesError: error,
      salariesEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading]
  );
}

export async function createSalary(data) {
  try {
    const res = await axios.post(endpoints.salary.list, data);

    await mutate(endpoints.salary.list);
    if (data?.employee) {
      await mutate(endpoints.salary.byId(data.employee));
    }

    return res.data;
  } catch (error) {
    console.error('Error creating salary:', error);
    throw error?.response?.data || error;
  }
}

export async function updateSalary(id, data) {
  try {
    const res = await axios.patch(endpoints.salary.update(id), data);

    await mutate(endpoints.salary.list);
    await mutate(endpoints.salary.byId(id));
    if (data?.employee) {
      await mutate(endpoints.salary.byId(data.employee));
    }

    return res.data;
  } catch (error) {
    console.error('Error updating salary:', error);
    throw error?.response?.data || error;
  }
}
