'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { MOCK_CASH_TRANSACTIONS } from './mock-data';

// ── Enrichment ──────────────────────────────────────────────────────────────

export function enrichCashTransaction(item) {
  return {
    ...item,
    number: item.number || item.transaction_number || `CASH-${item.id}`,
    amount: Number(item.amount || 0),
    // Normalise account: backend may send an object, an id, or a plain string name
    account:
      typeof item.account === 'object' && item.account !== null
        ? item.account.name || String(item.account.id)
        : item.account_name || item.account || '',
    // Counterparty
    counterparty:
      typeof item.counterparty === 'object' && item.counterparty !== null
        ? item.counterparty.name || String(item.counterparty.id)
        : item.counterparty_name || item.counterparty || '',
    // Snake → camelCase aliases expected by the detail component
    paymentMethod: item.paymentMethod || item.payment_method || '',
    reference: item.reference || '',
    description: item.description || '',
    direction: item.direction || '',
    date: item.date || '',
    status: item.status || 'draft',
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useWorkspaceCashApi() {
  const listUrl = `${endpoints.accounting.workspace_cash_transactions}?ordering=-created_at,-id`;

  const { data: rawData, isLoading, isValidating, error } = useSWR(listUrl, fetcher);

  const transactions = useMemo(() => {
    const list = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.results)
        ? rawData.results
        : [];
    if (list.length > 0) return list.map(enrichCashTransaction);
    return MOCK_CASH_TRANSACTIONS;
  }, [rawData]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createDraft = async (formData) => {
    const res = await axiosInstance.post(
      endpoints.accounting.workspace_cash_transaction_create,
      formData
    );
    await mutate(listUrl);
    return enrichCashTransaction(res.data);
  };

  const postTransaction = async (id) => {
    const res = await axiosInstance.post(endpoints.accounting.workspace_cash_transaction_post(id));
    await mutate(listUrl);
    return enrichCashTransaction(res.data);
  };

  const updateTransaction = async (id, formData) => {
    const res = await axiosInstance.patch(
      endpoints.accounting.workspace_cash_transaction_by_id(id),
      formData
    );
    await mutate(listUrl);
    return enrichCashTransaction(res.data);
  };

  const deleteTransaction = async (id) => {
    await axiosInstance.delete(endpoints.accounting.workspace_cash_transaction_by_id(id));
    await mutate(listUrl);
  };

  return {
    transactions,
    isLoading,
    isValidating,
    error,
    createDraft,
    updateTransaction,
    deleteTransaction,
    postTransaction,
  };
}
