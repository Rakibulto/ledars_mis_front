'use client';

import { mutate } from 'swr';
import { useState, useCallback } from 'react';

import axiosInstance from 'src/utils/axios';

export function useTransactionStatusApi({ statusEndpoint, mutateKeys = [] }) {
  const [loadingKey, setLoadingKey] = useState(null);

  const transitionStatus = useCallback(
    async ({ id, status }) => {
      const key = `${id}:${status}`;
      setLoadingKey(key);

      try {
        const { data } = await axiosInstance.patch(statusEndpoint(id), { status });
        await Promise.all(mutateKeys.map((cacheKey) => mutate(cacheKey)));
        return data;
      } finally {
        setLoadingKey(null);
      }
    },
    [mutateKeys, statusEndpoint]
  );

  return {
    transitionStatus,
    loadingKey,
    loading: loadingKey !== null,
  };
}
