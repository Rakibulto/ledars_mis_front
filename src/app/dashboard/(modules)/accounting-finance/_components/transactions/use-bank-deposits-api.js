'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { MOCK_BANK_DEPOSITS } from './mock-data';

// ── Enrichment ────────────────────────────────────────────────────────────────

export function enrichDeposit(raw) {
  return {
    ...raw,
    number: raw.number || raw.deposit_number || '',
    amount: Number(raw.amount ?? 0),
    reconciliationStatus: raw.reconciliation_status ?? 'pending',
    depositSlipRef: raw.deposit_slip_ref ?? '',
    depositMethod: raw.deposit_method ?? '',
    preparedBy: raw.prepared_by ?? '',
    bankAccount: raw.bank_account_name ?? '',
    status: raw.status ?? 'draft',
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useBankDepositsApi() {
  const depositsUrl = `${endpoints.accounting.bank_deposits}?ordering=-created_at,-id`;

  const { data: rawDeposits, isLoading, isValidating, error } = useSWR(depositsUrl, fetcher);

  // ── Deposits ───────────────────────────────────────────────────────────────

  const deposits = useMemo(() => {
    const list = Array.isArray(rawDeposits)
      ? rawDeposits
      : Array.isArray(rawDeposits?.results)
        ? rawDeposits.results
        : [];
    if (list.length > 0) return list.map(enrichDeposit);
    return MOCK_BANK_DEPOSITS;
  }, [rawDeposits]);

  // ── Actions ───────────────────────────────────────────────────────────────

  async function createDeposit(payload) {
    const body = {
      date: payload.date,
      bank_account_name: payload.bankAccount ?? payload.bank_account_name ?? '',
      source: payload.source ?? '',
      deposit_method: payload.depositMethod ?? payload.deposit_method ?? '',
      deposit_slip_ref: payload.depositSlipRef ?? payload.deposit_slip_ref ?? '',
      prepared_by: payload.preparedBy ?? payload.prepared_by ?? '',
      amount: Number(payload.amount || 0),
      description: payload.description ?? '',
    };
    const { data } = await axiosInstance.post(endpoints.accounting.bank_deposits, body);
    await mutate(depositsUrl);
    return enrichDeposit(data);
  }

  async function reconcile(id) {
    const { data } = await axiosInstance.post(endpoints.accounting.bank_deposit_reconcile(id));
    await mutate(depositsUrl);
    return enrichDeposit(data);
  }

  async function updateDeposit(id, payload) {
    const body = {
      date: payload.date,
      bank_account_name: payload.bankAccount ?? payload.bank_account_name ?? '',
      source: payload.source ?? '',
      deposit_method: payload.depositMethod ?? payload.deposit_method ?? '',
      deposit_slip_ref: payload.depositSlipRef ?? payload.deposit_slip_ref ?? '',
      prepared_by: payload.preparedBy ?? payload.prepared_by ?? '',
      amount: Number(payload.amount || 0),
      description: payload.description ?? '',
    };
    const { data } = await axiosInstance.patch(endpoints.accounting.bank_deposit_by_id(id), body);
    await mutate(depositsUrl);
    return enrichDeposit(data);
  }

  async function deleteDeposit(id) {
    await axiosInstance.delete(endpoints.accounting.bank_deposit_by_id(id));
    await mutate(depositsUrl);
  }

  // ── Return ─────────────────────────────────────────────────────

  return {
    deposits,
    isLoading,
    isValidating,
    error,
    actions: {
      createDeposit,
      updateDeposit,
      deleteDeposit,
      reconcile,
    },
  };
}
