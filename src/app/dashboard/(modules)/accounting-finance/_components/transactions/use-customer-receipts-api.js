'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { MOCK_CUSTOMER_RECEIPTS } from './mock-data';

// ── Enrichment ────────────────────────────────────────────────────────────────

export function enrichReceipt(raw) {
  return {
    ...raw,
    // Frontend aliases
    number: raw.number || raw.receipt_number || '',
    customer_id: raw.customer_id ?? raw.customer,
    amount: Number(raw.amount ?? 0),
    unappliedAmount: Number(raw.unapplied_amount ?? raw.amount ?? 0),
    allocationStatus: raw.allocation_status ?? 'unallocated',
    bankAccount: raw.bank_account_name ?? '',
    collectionOwner: raw.collection_owner ?? '',
    remittanceAdvice: raw.remittance_advice ?? '',
    allocations: (raw.allocations ?? []).map((a) => ({
      id: a.id,
      invoice_number: a.invoice_number ?? '',
      amount: Number(a.amount ?? 0),
    })),
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCustomerReceiptsApi() {
  const receiptsUrl = `${endpoints.accounting.customer_receipts}?ordering=-created_at,-id`;
  const customersUrl = '/api/donors/';

  const {
    data: rawReceipts,
    isLoading: receiptsLoading,
    isValidating: receiptsValidating,
    error: receiptsError,
  } = useSWR(receiptsUrl, fetcher);

  const { data: rawCustomers } = useSWR(customersUrl, fetcher);
  const customersLoading = !rawCustomers;

  // ── Receipts ───────────────────────────────────────────────────────────────

  const receipts = useMemo(() => {
    const list = Array.isArray(rawReceipts)
      ? rawReceipts
      : Array.isArray(rawReceipts?.results)
        ? rawReceipts.results
        : [];
    if (list.length > 0) return list.map(enrichReceipt);
    return MOCK_CUSTOMER_RECEIPTS;
  }, [rawReceipts]);

  // ── Customers ──────────────────────────────────────────────────────────────

  const customers = useMemo(() => {
    const list = Array.isArray(rawCustomers)
      ? rawCustomers
      : Array.isArray(rawCustomers?.results)
        ? rawCustomers.results
        : [];
    return list;
  }, [rawCustomers]);

  const customersById = useMemo(() => {
    const map = {};
    for (const c of customers) map[c.id] = c;
    return map;
  }, [customers]);

  function getCustomerById(id) {
    return customersById[id] ?? customers.find((c) => String(c.id) === String(id)) ?? null;
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async function createReceipt(payload) {
    const body = {
      customer: payload.customer_id,
      date: payload.date,
      method: payload.method,
      bank_account_name: payload.bankAccount ?? payload.bank_account_name ?? '',
      amount: Number(payload.amount || 0),
      reference: payload.reference ?? '',
      collection_owner: payload.collectionOwner ?? '',
      remittance_advice: payload.remittanceAdvice ?? '',
      notes: payload.notes ?? '',
    };
    const { data } = await axiosInstance.post(endpoints.accounting.customer_receipts, body);
    await mutate(receiptsUrl);
    return enrichReceipt(data);
  }

  async function allocate(id, { invoice_number, amount }) {
    const { data } = await axiosInstance.post(endpoints.accounting.customer_receipt_allocate(id), {
      invoice_number,
      amount,
    });
    await mutate(receiptsUrl);
    return enrichReceipt(data);
  }

  async function autoAllocate(id) {
    const { data } = await axiosInstance.post(
      endpoints.accounting.customer_receipt_auto_allocate(id)
    );
    await mutate(receiptsUrl);
    return enrichReceipt(data);
  }

  async function holdAsAdvance(id) {
    const { data } = await axiosInstance.post(endpoints.accounting.customer_receipt_hold(id));
    await mutate(receiptsUrl);
    return enrichReceipt(data);
  }

  async function writeOffResidual(id, { amount, reason }) {
    const { data } = await axiosInstance.post(endpoints.accounting.customer_receipt_write_off(id), {
      amount,
      reason,
    });
    await mutate(receiptsUrl);
    return enrichReceipt(data);
  }

  async function updateReceipt(id, payload) {
    const body = {
      customer: payload.customer_id,
      date: payload.date,
      method: payload.method,
      bank_account_name: payload.bankAccount ?? payload.bank_account_name ?? '',
      amount: Number(payload.amount || 0),
      reference: payload.reference ?? '',
      collection_owner: payload.collectionOwner ?? '',
      remittance_advice: payload.remittanceAdvice ?? '',
      notes: payload.notes ?? '',
    };
    const { data } = await axiosInstance.patch(
      endpoints.accounting.customer_receipt_by_id(id),
      body
    );
    await mutate(receiptsUrl);
    return enrichReceipt(data);
  }

  async function deleteReceipt(id) {
    await axiosInstance.delete(endpoints.accounting.customer_receipt_by_id(id));
    await mutate(receiptsUrl);
  }

  return {
    receipts,
    customers,
    customersLoading,
    getCustomerById,
    isLoading: receiptsLoading,
    isValidating: receiptsValidating,
    error: receiptsError,
    actions: {
      createReceipt,
      updateReceipt,
      deleteReceipt,
      allocate,
      autoAllocate,
      holdAsAdvance,
      writeOffResidual,
    },
  };
}
