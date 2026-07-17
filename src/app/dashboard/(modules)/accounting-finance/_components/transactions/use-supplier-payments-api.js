'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { MOCK_SUPPLIER_PAYMENTS } from './mock-data';

// ── Enrichment ────────────────────────────────────────────────────────────────

export function enrichSupplierPayment(raw) {
  return {
    ...raw,
    number: raw.number || raw.payment_number || '',
    supplier_id: raw.supplier_id ?? raw.vendor,
    amount: Number(raw.amount ?? 0),
    releaseStatus: raw.release_status ?? 'queued',
    paymentRun: raw.payment_run ?? '',
    bankAccount: raw.bank_account_name ?? '',
    billRefs: Array.isArray(raw.bill_refs) ? raw.bill_refs : raw.bill_refs ? [raw.bill_refs] : [],
    approvalRoute: raw.approval_route ?? '',
    settlementReference: raw.settlement_reference ?? '',
    status: raw.status ?? 'draft',
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSupplierPaymentsApi() {
  const paymentsUrl = `${endpoints.accounting.supplier_payments}?ordering=-created_at,-id`;
  const vendorsUrl = `${endpoints.procurement_management.vendors_management}?ordering=name`;
  const rfqsUrl = `${endpoints.procurement_management.rfqs}?pagination=false`;

  const { data: rawPayments, isLoading, isValidating, error } = useSWR(paymentsUrl, fetcher);

  const { data: rawVendors } = useSWR(vendorsUrl, fetcher);
  const vendorsLoading = !rawVendors;
  const { data: rawRfqs } = useSWR(rfqsUrl, fetcher);

  // ── Payments ───────────────────────────────────────────────────────────────

  const payments = useMemo(() => {
    const list = Array.isArray(rawPayments)
      ? rawPayments
      : Array.isArray(rawPayments?.results)
        ? rawPayments.results
        : [];
    if (list.length > 0) return list.map(enrichSupplierPayment);
    return MOCK_SUPPLIER_PAYMENTS;
  }, [rawPayments]);

  // ── Vendors ────────────────────────────────────────────────────────────────

  const vendors = useMemo(() => {
    const list = Array.isArray(rawVendors)
      ? rawVendors
      : Array.isArray(rawVendors?.results)
        ? rawVendors.results
        : [];
    return list;
  }, [rawVendors]);

  const vendorsById = useMemo(() => {
    const map = {};
    for (const v of vendors) map[v.id] = v;
    return map;
  }, [vendors]);

  function getVendorById(id) {
    return vendorsById[id] ?? vendors.find((v) => String(v.id) === String(id)) ?? null;
  }

  // ── RFQs ──────────────────────────────────────────────────────────────────

  const rfqs = useMemo(() => {
    const list = Array.isArray(rawRfqs)
      ? rawRfqs
      : Array.isArray(rawRfqs?.results)
        ? rawRfqs.results
        : [];
    return list;
  }, [rawRfqs]);

  function getRfqsByVendor(vendorId) {
    if (!vendorId) return [];
    return rfqs.filter((rfq) => {
      const invitedVendors = rfq.invited_vendors || rfq.vendors || [];
      return invitedVendors.some((v) => String((v.vendor || v).id) === String(vendorId));
    });
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async function createPayment(payload) {
    const body = {
      vendor: payload.supplier_id,
      date: payload.date,
      method: payload.method,
      bank_account_name: payload.bankAccount ?? payload.bank_account_name ?? '',
      amount: Number(payload.amount || 0),
      payment_run: payload.paymentRun ?? '',
      bill_refs: Array.isArray(payload.billRefs) ? payload.billRefs : [],
      approval_route: payload.approvalRoute ?? '',
      settlement_reference: payload.settlementReference ?? '',
      notes: payload.notes ?? '',
    };
    const { data } = await axiosInstance.post(endpoints.accounting.supplier_payments, body);
    await mutate(paymentsUrl);
    return enrichSupplierPayment(data);
  }

  async function release(id) {
    const { data } = await axiosInstance.post(endpoints.accounting.supplier_payment_release(id));
    await mutate(paymentsUrl);
    return enrichSupplierPayment(data);
  }

  async function unblock(id) {
    const { data } = await axiosInstance.post(endpoints.accounting.supplier_payment_unblock(id));
    await mutate(paymentsUrl);
    return enrichSupplierPayment(data);
  }

  async function updatePayment(id, payload) {
    const body = {
      vendor: payload.supplier_id,
      date: payload.date,
      method: payload.method,
      bank_account_name: payload.bankAccount ?? payload.bank_account_name ?? '',
      amount: Number(payload.amount || 0),
      payment_run: payload.paymentRun ?? '',
      bill_refs: Array.isArray(payload.billRefs) ? payload.billRefs : [],
      approval_route: payload.approvalRoute ?? '',
      settlement_reference: payload.settlementReference ?? '',
      notes: payload.notes ?? '',
    };
    const { data } = await axiosInstance.patch(
      endpoints.accounting.supplier_payment_by_id(id),
      body
    );
    await mutate(paymentsUrl);
    return enrichSupplierPayment(data);
  }

  async function deletePayment(id) {
    await axiosInstance.delete(endpoints.accounting.supplier_payment_by_id(id));
    await mutate(paymentsUrl);
  }

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    payments,
    vendors,
    vendorsLoading,
    getVendorById,
    rfqs,
    getRfqsByVendor,
    isLoading,
    isValidating,
    error,
    actions: {
      createPayment,
      updatePayment,
      deletePayment,
      release,
      unblock,
    },
  };
}
