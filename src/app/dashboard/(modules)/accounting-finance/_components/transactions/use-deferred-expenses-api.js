'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { MOCK_DEFERRED_EXPENSES } from './mock-data';

// ── Enrichment ──────────────────────────────────────────────────────────────

function mapStatus(backendStatus) {
  if (backendStatus === 'fully_recognized' || backendStatus === 'cancelled') return 'done';
  return 'in_progress';
}

export function enrichDeferredExpense(record) {
  const totalAmount = Number(record.total_amount || 0);
  const periods = Number(record.periods || 1);
  return {
    ...record,
    total_amount: totalAmount,
    recognized_amount: Number(record.recognized_amount || 0),
    remaining_amount: Number(record.remaining_amount || 0),
    monthlyRecognition: Number(
      record.monthly_recognition ?? (periods > 0 ? totalAmount / periods : 0)
    ),
    status: mapStatus(record.status),
    _rawStatus: record.status,
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useDeferredExpensesApi() {
  const listUrl = `${endpoints.accounting.deferred_expenses}?ordering=-created_at,-id`;

  const { data: rawData, isLoading, isValidating, error } = useSWR(listUrl, fetcher);

  const records = useMemo(() => {
    const list = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.results)
        ? rawData.results
        : [];
    if (list.length > 0) return list.map(enrichDeferredExpense);
    return MOCK_DEFERRED_EXPENSES;
  }, [rawData]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createRecord = async (formData) => {
    const res = await axiosInstance.post(
      endpoints.accounting.deferred_expense_create_draft,
      formData
    );
    await mutate(listUrl);
    return enrichDeferredExpense(res.data);
  };

  const recognizeRecord = async (id) => {
    const res = await axiosInstance.post(endpoints.accounting.deferred_expense_recognize(id));
    await mutate(listUrl);
    return enrichDeferredExpense(res.data);
  };

  const updateRecord = async (id, formData) => {
    const res = await axiosInstance.patch(
      endpoints.accounting.deferred_expense_by_id(id),
      formData
    );
    await mutate(listUrl);
    return enrichDeferredExpense(res.data);
  };

  const deleteRecord = async (id) => {
    await axiosInstance.delete(endpoints.accounting.deferred_expense_by_id(id));
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
