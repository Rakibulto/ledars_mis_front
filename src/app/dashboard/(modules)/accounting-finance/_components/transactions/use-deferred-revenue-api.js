'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { MOCK_DEFERRED_REVENUE } from './mock-data';

// ── Enrichment ──────────────────────────────────────────────────────────────

/**
 * Maps backend status vocab → frontend vocab:
 *   running            → in_progress
 *   fully_recognized   → done
 *   draft              → in_progress  (not yet active, treat as in_progress)
 *   cancelled          → done
 */
function mapStatus(backendStatus) {
  if (backendStatus === 'fully_recognized' || backendStatus === 'cancelled') return 'done';
  return 'in_progress';
}

export function enrichDeferredRevenue(record) {
  const totalAmount = Number(record.total_amount || 0);
  const periods = Number(record.periods || 1);
  return {
    ...record,
    total_amount: totalAmount,
    recognized_amount: Number(record.recognized_amount || 0),
    remaining_amount: Number(record.remaining_amount || 0),
    // monthlyRecognition already returned by backend serializer; keep as fallback
    monthlyRecognition: Number(
      record.monthly_recognition ?? (periods > 0 ? totalAmount / periods : 0)
    ),
    // Map status for frontend badge logic
    status: mapStatus(record.status),
    _rawStatus: record.status, // preserve original for API calls
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useDeferredRevenueApi() {
  const listUrl = `${endpoints.accounting.deferred_revenue}?ordering=-created_at,-id`;

  const { data: rawData, isLoading, isValidating, error } = useSWR(listUrl, fetcher);

  const records = useMemo(() => {
    const list = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.results)
        ? rawData.results
        : [];
    if (list.length > 0) return list.map(enrichDeferredRevenue);
    return MOCK_DEFERRED_REVENUE;
  }, [rawData]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createRecord = async (formData) => {
    const res = await axiosInstance.post(
      endpoints.accounting.deferred_revenue_create_draft,
      formData
    );
    await mutate(listUrl);
    return enrichDeferredRevenue(res.data);
  };

  const recognizeRecord = async (id) => {
    const res = await axiosInstance.post(endpoints.accounting.deferred_revenue_recognize(id));
    await mutate(listUrl);
    return enrichDeferredRevenue(res.data);
  };

  const updateRecord = async (id, formData) => {
    const res = await axiosInstance.patch(
      endpoints.accounting.deferred_revenue_by_id(id),
      formData
    );
    await mutate(listUrl);
    return enrichDeferredRevenue(res.data);
  };

  const deleteRecord = async (id) => {
    await axiosInstance.delete(endpoints.accounting.deferred_revenue_by_id(id));
    await mutate(listUrl);
  };

  return {
    records,
    isLoading,
    isValidating,
    error,
    createRecord,
    updateRecord,
    deleteRecord,
    recognizeRecord,
  };
}
