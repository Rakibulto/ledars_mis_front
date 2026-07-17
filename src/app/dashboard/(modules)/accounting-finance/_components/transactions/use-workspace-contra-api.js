'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { MOCK_CONTRA_ENTRIES } from './mock-data';

// ── Enrichment ──────────────────────────────────────────────────────────────

export function enrichContraEntry(item) {
  return {
    ...item,
    number: item.number || item.entry_number || `CONTRA-${item.id}`,
    amount: Number(item.amount || 0),
    fromAccount: item.from_account ?? item.fromAccount ?? '',
    toAccount: item.to_account ?? item.toAccount ?? '',
    fromAccountName: item.from_account_name ?? item.fromAccountName ?? '',
    toAccountName: item.to_account_name ?? item.toAccountName ?? '',
    transferChannel: item.transfer_channel ?? item.transferChannel ?? '',
    treasuryOwner: item.treasury_owner ?? item.treasuryOwner ?? '',
    reference: item.reference ?? '',
    description: item.description ?? item.notes ?? '',
    date: item.date ?? item.entry_date ?? '',
    status: item.status ?? 'draft',
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useWorkspaceContraApi() {
  const listUrl = `${endpoints.accounting.workspace_contra_entries}?ordering=-created_at,-id`;

  const { data: rawData, isLoading, isValidating, error } = useSWR(listUrl, fetcher);

  const contraEntries = useMemo(() => {
    const list = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.results)
        ? rawData.results
        : [];
    if (list.length > 0) return list.map(enrichContraEntry);
    return MOCK_CONTRA_ENTRIES;
  }, [rawData]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createDraft = async (formData) => {
    const res = await axiosInstance.post(
      endpoints.accounting.workspace_contra_entry_create,
      formData
    );
    await mutate(listUrl);
    return enrichContraEntry(res.data);
  };

  const postEntry = async (id) => {
    const res = await axiosInstance.post(endpoints.accounting.workspace_contra_entry_post(id));
    await mutate(listUrl);
    return enrichContraEntry(res.data);
  };

  const updateEntry = async (id, formData) => {
    const res = await axiosInstance.patch(
      endpoints.accounting.workspace_contra_entry_by_id(id),
      formData
    );
    await mutate(listUrl);
    return enrichContraEntry(res.data);
  };

  const deleteEntry = async (id) => {
    await axiosInstance.delete(endpoints.accounting.workspace_contra_entry_by_id(id));
    await mutate(listUrl);
  };

  return {
    contraEntries,
    isLoading,
    isValidating,
    error,
    createDraft,
    updateEntry,
    deleteEntry,
    postEntry,
  };
}
