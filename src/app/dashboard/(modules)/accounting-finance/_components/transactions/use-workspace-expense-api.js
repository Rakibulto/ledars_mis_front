'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { MOCK_EXPENSE_ENTRIES } from './mock-data';

// ── Enrichment ──────────────────────────────────────────────────────────────

export function enrichExpenseEntry(item) {
  return {
    ...item,
    number: item.number || item.entry_number || `EXP-${item.id}`,
    amount: Number(item.amount || 0),
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useWorkspaceExpenseApi() {
  const listUrl = `${endpoints.accounting.workspace_expense_entries}?ordering=-created_at,-id`;

  const { data: rawData, isLoading, isValidating, error } = useSWR(listUrl, fetcher);

  const expenseEntries = useMemo(() => {
    const list = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.results)
        ? rawData.results
        : [];
    if (list.length > 0) return list.map(enrichExpenseEntry);
    return MOCK_EXPENSE_ENTRIES;
  }, [rawData]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createEntry = async (formData) => {
    const res = await axiosInstance.post(
      endpoints.accounting.workspace_expense_entry_create,
      formData
    );
    await mutate(listUrl);
    return enrichExpenseEntry(res.data);
  };

  const postEntry = async (id) => {
    const res = await axiosInstance.post(endpoints.accounting.workspace_expense_entry_post(id));
    await mutate(listUrl);
    return enrichExpenseEntry(res.data);
  };

  const updateEntry = async (id, formData) => {
    const res = await axiosInstance.patch(
      endpoints.accounting.workspace_expense_entry_by_id(id),
      formData
    );
    await mutate(listUrl);
    return enrichExpenseEntry(res.data);
  };

  const deleteEntry = async (id) => {
    await axiosInstance.delete(endpoints.accounting.workspace_expense_entry_by_id(id));
    await mutate(listUrl);
  };

  return {
    expenseEntries,
    isLoading,
    isValidating,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    postEntry,
  };
}
