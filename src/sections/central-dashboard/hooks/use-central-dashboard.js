'use client';

import useSWR from 'swr';

import { fetcher } from 'src/utils/axios';

const SWR_CONFIG = {
  revalidateOnFocus: false,
  dedupingInterval: 60000,
  errorRetryCount: 2,
  errorRetryInterval: 10000,
};

export function useCentralDashboard() {
  const { data, isLoading, error, isValidating } = useSWR(
    '/api/central-dashboard/',
    fetcher,
    SWR_CONFIG
  );

  return {
    data: data || null,
    isLoading,
    error,
    isValidating,
  };
}

export function useModuleFallback(primaryData, fallbackUrl, transform) {
  const { data: fallbackData, isLoading } = useSWR(
    primaryData ? null : fallbackUrl,
    fetcher,
    SWR_CONFIG
  );

  return {
    data: primaryData || (fallbackData ? transform(fallbackData) : null),
    isLoading: !primaryData && isLoading,
  };
}
