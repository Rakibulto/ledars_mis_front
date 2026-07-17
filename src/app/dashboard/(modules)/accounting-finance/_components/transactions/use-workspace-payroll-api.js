'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { MOCK_PAYROLL_ENTRIES } from './mock-data';

// ── Enrichment ──────────────────────────────────────────────────────────────

export function enrichPayrollEntry(item) {
  return {
    ...item,
    number: item.number || item.entry_number || `PAYROLL-${item.id}`,
    grossAmount: Number(item.gross_amount || 0),
    netAmount: Number(item.net_amount || 0),
    liabilityAmount: Number(item.liability_amount || 0),
    employeeCount: Number(item.employee_count || 0),
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useWorkspacePayrollApi() {
  const listUrl = `${endpoints.accounting.workspace_payroll_entries}?ordering=-created_at,-id`;

  const { data: rawData, isLoading, isValidating, error } = useSWR(listUrl, fetcher);

  const payrollEntries = useMemo(() => {
    const list = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.results)
        ? rawData.results
        : [];
    if (list.length > 0) return list.map(enrichPayrollEntry);
    return MOCK_PAYROLL_ENTRIES;
  }, [rawData]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createEntry = async (formData) => {
    const res = await axiosInstance.post(
      endpoints.accounting.workspace_payroll_entry_create,
      formData
    );
    await mutate(listUrl);
    return enrichPayrollEntry(res.data);
  };

  const postEntry = async (id) => {
    const res = await axiosInstance.post(endpoints.accounting.workspace_payroll_entry_post(id));
    await mutate(listUrl);
    return enrichPayrollEntry(res.data);
  };

  const updateEntry = async (id, formData) => {
    const res = await axiosInstance.patch(
      endpoints.accounting.workspace_payroll_entry_by_id(id),
      formData
    );
    await mutate(listUrl);
    return enrichPayrollEntry(res.data);
  };

  const deleteEntry = async (id) => {
    await axiosInstance.delete(endpoints.accounting.workspace_payroll_entry_by_id(id));
    await mutate(listUrl);
  };

  return {
    payrollEntries,
    isLoading,
    isValidating,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    postEntry,
  };
}
