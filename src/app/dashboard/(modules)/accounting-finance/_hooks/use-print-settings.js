'use client';

import useSWR from 'swr';

import { fetcher, endpoints } from 'src/utils/axios';

export function usePrintSettings() {
  const { data, error, isLoading } = useSWR(endpoints.accounting.settings, fetcher);
  const printSettings =
    data && (Array.isArray(data) ? data[0] : data) ? (Array.isArray(data) ? data[0] : data) : null;
  return { printSettings, loading: isLoading, error };
}
