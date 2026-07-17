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

// GET /api/payrolls/ — returns an array of payroll records
export function useGetPayrolls(filters = {}, enabled = true) {
  let url = null;
  if (enabled) {
    const params = new URLSearchParams();
    if (filters.employee) params.append('employee', filters.employee);
    if (filters.payroll_month) params.append('payroll_month', filters.payroll_month);
    if (filters.payroll_year) params.append('payroll_year', filters.payroll_year);
    url = `${endpoints.payroll.list}${params.toString() ? `?${params.toString()}` : ''}`;
  }

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  const payrolls = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  return useMemo(
    () => ({
      payrolls,
      payrollsLoading: isLoading,
      payrollsError: error,
      payrollsEmpty: !isLoading && payrolls.length === 0,
    }),
    [error, isLoading, payrolls]
  );
}

// GET /api/payrolls/:id/ — returns a single payroll record by ID
export function useGetPayrollById(id) {
  const url = id ? endpoints.payroll.details(id) : null;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      payroll: data || null,
      payrollLoading: isLoading,
      payrollError: error,
    }),
    [data, error, isLoading]
  );
}

// POST /api/payrolls/generate/ — generate (or update) payroll for given month/year
export async function generatePayroll(payload) {
  try {
    const res = await axios.post(endpoints.payroll.generate, payload);

    await mutate(endpoints.payroll.list);

    return res.data;
  } catch (error) {
    console.error('Error generating payroll:', error);
    throw error?.response?.data || error;
  }
}

// POST /api/payrolls/lock/ — lock or unlock payrolls for a given month/year
export async function lockPayroll(month, year, is_lock = true) {
  try {
    const payload = { month, year, is_lock };
    const res = await axios.post(endpoints.payroll.lock, payload);

    // refresh list data
    await mutate(endpoints.payroll.list);
    return res.data;
  } catch (error) {
    console.error('Error locking payroll:', error);
    throw error?.response?.data || error;
  }
}
