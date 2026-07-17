'use client';

import useSWR, { mutate } from 'swr';
import { useRef, useMemo, useState, useCallback } from 'react';

import axiosInstance, { fetcher } from 'src/utils/axios';

import {
  getAccountingMockResponse,
  applyAccountingMockMutation,
} from 'src/app/dashboard/(modules)/accounting-finance/_components/demo-data';

// Extract a human-readable error message from backend responses
export function extractErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;

  // Axios error — unwrap the backend response body first
  const data = error.response?.data ?? error;

  // DRF non-field error: { detail: "..." }
  if (data.detail) {
    if (typeof data.detail === 'string') return data.detail;
    if (typeof data.detail === 'object') {
      const messages = Object.entries(data.detail)
        .map(([key, val]) => {
          const msg = Array.isArray(val) ? val.join(', ') : val;
          return `${key}: ${msg}`;
        })
        .join(' | ');
      return messages || fallback;
    }
  }

  // DRF field-level validation errors: { field: ["msg"], ... }
  if (typeof data === 'object' && !Array.isArray(data)) {
    const entries = Object.entries(data).filter(([, v]) => v);
    if (entries.length) {
      return entries
        .map(([key, val]) => {
          const msg = Array.isArray(val) ? val.join(', ') : String(val);
          return `${key}: ${msg}`;
        })
        .join(' | ');
    }
  }

  if (error.message) return error.message;
  return fallback;
}

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

export function useGetRequest(url, options = {}) {
  const { mockKey, suppressErrorLog = false, ...swrConfig } = options;
  const mockData = getAccountingMockResponse(url, mockKey);

  const { data, isLoading, error, isValidating } = useSWR(
    url,
    (requestUrl) => fetcher([requestUrl, { suppressErrorLog }]),
    {
      ...swrOptions,
      ...swrConfig,
      fallbackData: swrConfig.fallbackData ?? mockData,
    }
  );

  const resolvedData = useMemo(() => {
    if (mockKey && mockData !== undefined) {
      return mockData;
    }

    const hasArrayData = Array.isArray(data) && data.length > 0;
    const hasResultsData = Array.isArray(data?.results) && data.results.length > 0;
    const hasObjectData =
      data && !Array.isArray(data) && !Array.isArray(data?.results) && Object.keys(data).length > 0;

    if (hasArrayData || hasResultsData || hasObjectData) {
      return data;
    }

    return mockData ?? data ?? [];
  }, [data, mockData, mockKey]);

  const isResolvedEmpty = useMemo(() => {
    if (Array.isArray(resolvedData)) {
      return resolvedData.length === 0;
    }

    if (Array.isArray(resolvedData?.results)) {
      return resolvedData.results.length === 0;
    }

    return !resolvedData || Object.keys(resolvedData).length === 0;
  }, [resolvedData]);

  return useMemo(
    () => ({
      data: resolvedData,
      loading: mockData !== undefined ? false : isLoading,
      error: mockData !== undefined ? undefined : error,
      validating: isValidating,
      empty: !(mockData !== undefined ? false : isLoading) && isResolvedEmpty,
    }),
    [error, isLoading, isResolvedEmpty, isValidating, mockData, resolvedData]
  );
}

async function runAccountingMutation(method, url, data, mockKey) {
  const mockResult = applyAccountingMockMutation(method, url, data, mockKey);

  if (!mockResult?.handled) {
    return null;
  }

  const mutationTargets = [];

  if (url) {
    mutationTargets.push([url, mockResult.data]);
  }

  if (mockResult.collection) {
    const baseCollectionUrl = mockResult.collectionUrl || url?.replace(/[^/]+\/$/, '');

    if (baseCollectionUrl && baseCollectionUrl !== url) {
      mutationTargets.push([baseCollectionUrl, mockResult.collection]);
    }
  }

  Object.entries(mockResult.extraCollections || {}).forEach(([collectionUrl, collectionData]) => {
    mutationTargets.push([collectionUrl, collectionData]);
  });

  await Promise.all(
    mutationTargets
      .filter(([targetUrl]) => targetUrl)
      .map(([targetUrl, targetData]) => mutate(targetUrl, targetData, false))
  );

  return mockResult.data;
}

// export function useCreateRequest(urlc, options = {}) {
//   const { trigger, data, error, isMutating } = useSWRMutation(
//     urlc,
//     async (url, { arg }) => {
//       const res = await axiosInstance.post(url, arg);
//       return res.data;
//     },
//     options
//   );

//   return { create: trigger, data, loading: isMutating, error };
// }
export async function useCreateRequest(url, data, options = {}) {
  const mockResult = await runAccountingMutation('post', url, data, options.mockKey);

  if (mockResult !== null) {
    return mockResult;
  }

  try {
    const res = await axiosInstance.post(url, data);

    return res.data;
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
}

export async function usePatchRequest(url, data, options = {}) {
  const mockResult = await runAccountingMutation('patch', url, data, options.mockKey);

  console.log('Patch request mock result:', { url, data, mockResult });

  if (mockResult !== null) {
    return mockResult;
  }

  try {
    const res = await axiosInstance.patch(url, data);

    return res.data;
  } catch (error) {
    console.error('Error updating item:', error.response?.data ?? error.message ?? error);
    throw error;
  }
}
export async function usePutRequest(url, data, options = {}) {
  const mockResult = await runAccountingMutation('put', url, data, options.mockKey);

  if (mockResult !== null) {
    return mockResult;
  }

  try {
    const res = await axiosInstance.put(url, data);

    return res.data;
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
}

export async function useDeleteRequest(url, options = {}) {
  const mockResult = await runAccountingMutation('delete', url, undefined, options.mockKey);

  if (mockResult !== null) {
    return mockResult;
  }

  try {
    const res = await axiosInstance.delete(url);
    return res.data;
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
}

// --------------- React hook wrappers (return { trigger, isMutating }) ---------------

export function useCreateMutation(url, initialData, options = {}) {
  const [isMutating, setIsMutating] = useState(false);
  const urlRef = useRef(url);
  const dataRef = useRef(initialData);
  const optionsRef = useRef(options);
  urlRef.current = url;
  dataRef.current = initialData;
  optionsRef.current = options;

  const trigger = useCallback(async (data) => {
    const reqUrl = urlRef.current;
    if (!reqUrl) return undefined;
    setIsMutating(true);
    try {
      const reqData = data !== undefined ? data : dataRef.current;
      const mockResult = await runAccountingMutation(
        'post',
        reqUrl,
        reqData,
        optionsRef.current.mockKey
      );

      if (mockResult !== null) {
        return mockResult;
      }

      const res = await axiosInstance.post(reqUrl, reqData);
      return res.data;
    } catch (error) {
      console.error('Error creating item:', error.response?.data ?? error.message ?? error);
      throw error;
    } finally {
      setIsMutating(false);
    }
  }, []);

  return { trigger, isMutating };
}

export function usePatchMutation(url, initialData, options = {}) {
  const [isMutating, setIsMutating] = useState(false);
  const urlRef = useRef(url);
  const dataRef = useRef(initialData);
  const optionsRef = useRef(options);
  urlRef.current = url;
  dataRef.current = initialData;
  optionsRef.current = options;

  const trigger = useCallback(async (data) => {
    const reqUrl = urlRef.current;
    if (!reqUrl) return undefined;
    setIsMutating(true);
    try {
      const reqData = data !== undefined ? data : dataRef.current;
      const mockResult = await runAccountingMutation(
        'patch',
        reqUrl,
        reqData,
        optionsRef.current.mockKey
      );

      if (mockResult !== null) {
        return mockResult;
      }

      const res = await axiosInstance.patch(reqUrl, reqData);
      return res.data;
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    } finally {
      setIsMutating(false);
    }
  }, []);

  return { trigger, isMutating };
}

export function useDeleteMutation(url, options = {}) {
  const [isMutating, setIsMutating] = useState(false);
  const urlRef = useRef(url);
  const optionsRef = useRef(options);
  urlRef.current = url;
  optionsRef.current = options;

  const trigger = useCallback(async () => {
    const reqUrl = urlRef.current;
    if (!reqUrl) return undefined;
    setIsMutating(true);
    try {
      const mockResult = await runAccountingMutation(
        'delete',
        reqUrl,
        undefined,
        optionsRef.current.mockKey
      );

      if (mockResult !== null) {
        return mockResult;
      }

      const res = await axiosInstance.delete(reqUrl);
      return res.data;
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    } finally {
      setIsMutating(false);
    }
  }, []);

  return { trigger, isMutating };
}

export function usePutMutation(url, initialData, options = {}) {
  const [isMutating, setIsMutating] = useState(false);
  const urlRef = useRef(url);
  const dataRef = useRef(initialData);
  const optionsRef = useRef(options);
  urlRef.current = url;
  dataRef.current = initialData;
  optionsRef.current = options;

  const trigger = useCallback(async (data) => {
    const reqUrl = urlRef.current;
    if (!reqUrl) return undefined;
    setIsMutating(true);
    try {
      const reqData = data !== undefined ? data : dataRef.current;
      const mockResult = await runAccountingMutation(
        'put',
        reqUrl,
        reqData,
        optionsRef.current.mockKey
      );

      if (mockResult !== null) {
        return mockResult;
      }

      const res = await axiosInstance.put(reqUrl, reqData);
      return res.data;
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    } finally {
      setIsMutating(false);
    }
  }, []);

  return { trigger, isMutating };
}
