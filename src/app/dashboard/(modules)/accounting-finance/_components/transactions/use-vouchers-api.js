'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { MOCK_VOUCHERS } from './mock-data';

// ── Enrichment ─────────────────────────────────────────────

/**
 * Backend status values: draft / pending / approved / posted / rejected / cancelled
 * UI status values:      draft / submitted / approved / posted / rejected / cancelled
 *
 * Map 'pending' → 'submitted' so existing UI chips, filters and action buttons work.
 */
function normalizeStatus(backendStatus) {
  if (backendStatus === 'pending') return 'submitted';
  return backendStatus || 'draft';
}

export function enrichVoucher(voucher) {
  return {
    ...voucher,
    // Field name aliases
    number: voucher.voucher_number || `VCH-${voucher.id}`,
    partner_name: voucher.payee || 'Internal Entry',
    amount: Number(voucher.total_amount || 0),
    journal_name: voucher.journal_name || 'General Journal',
    // Normalise status: backend 'pending' → UI 'submitted'
    status: normalizeStatus(voucher.status),
    approval_status: voucher.approval_status || 'pending',
    currency: voucher.currency_code || 'BDT',
    payment_method_name: voucher.payment_method_name || 'Internal Posting',
  };
}

function enrichApproval(approval) {
  return {
    ...approval,
    voucher_id: approval.voucher,
    approver_name: approval.approver_name || 'Finance Manager',
    status: approval.status || 'pending',
  };
}

// ── Hook ────────────────────────────────────────────────────

export function useVouchersApi() {
  const vouchersUrl = `${endpoints.accounting.vouchers}?ordering=-date,-id`;
  const approvalsUrl = endpoints.accounting.voucher_approvals;
  const journalsUrl = endpoints.accounting.journals;

  const { data: rawVouchers, isLoading: vouchersLoading, error } = useSWR(vouchersUrl, fetcher);
  const { data: rawApprovals, isLoading: approvalsLoading } = useSWR(approvalsUrl, fetcher);
  const { data: rawJournals, isLoading: journalsLoading } = useSWR(journalsUrl, fetcher);

  const vouchers = useMemo(() => {
    const list = Array.isArray(rawVouchers)
      ? rawVouchers
      : Array.isArray(rawVouchers?.results)
        ? rawVouchers.results
        : [];
    if (list.length > 0) return list.map(enrichVoucher);
    return MOCK_VOUCHERS;
  }, [rawVouchers]);

  const approvals = useMemo(() => {
    const list = Array.isArray(rawApprovals)
      ? rawApprovals
      : Array.isArray(rawApprovals?.results)
        ? rawApprovals.results
        : [];
    return list.map(enrichApproval);
  }, [rawApprovals]);

  const journals = useMemo(() => {
    if (Array.isArray(rawJournals)) return rawJournals;
    if (Array.isArray(rawJournals?.results)) return rawJournals.results;
    return [];
  }, [rawJournals]);

  // ── Mutations ──────────────────────────────────────────────

  const refetch = async () => {
    await Promise.all([mutate(vouchersUrl), mutate(approvalsUrl)]);
  };

  /** Submit a draft voucher for approval */
  const submitVoucher = async (voucherId) => {
    await axiosInstance.post(endpoints.accounting.voucher_submit(voucherId));
    await mutate(vouchersUrl);
  };

  /** Approve a submitted voucher */
  const approveVoucher = async (voucherId) => {
    await axiosInstance.post(endpoints.accounting.voucher_approve(voucherId));
    await mutate(vouchersUrl);
  };

  /** Reject a submitted voucher */
  const rejectVoucher = async (voucherId, remarks = '') => {
    await axiosInstance.post(endpoints.accounting.voucher_reject(voucherId), { remarks });
    await mutate(vouchersUrl);
  };

  /** Post an approved voucher to the GL */
  const postVoucher = async (voucherId) => {
    await axiosInstance.post(endpoints.accounting.voucher_post(voucherId));
    await mutate(vouchersUrl);
  };

  /**
   * Create a new voucher header on the backend.
   * Lines can be added later from the detail page (they require account FK IDs).
   * Returns the created voucher enriched for UI use.
   */
  const createVoucher = async (payload) => {
    const body = {
      voucher_type: payload.voucher_type || 'journal',
      journal: payload.journal_id,
      date: payload.date,
      payee: payload.partner_name || '',
      narration: payload.narration || '',
      total_amount: Number(payload.amount || 0),
    };
    if (payload.project) body.project = Number(payload.project);
    if (payload.cost_center) body.cost_center = Number(payload.cost_center);
    if (payload.lines && payload.lines.length > 0) {
      body.lines = payload.lines.map((l) => ({
        account: l.account ? Number(l.account) : undefined,
        description: l.description || '',
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
      }));
      const debitTotal = (payload.lines || []).reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
      if (debitTotal > 0) body.total_amount = debitTotal;
    }
    const { data } = await axiosInstance.post(endpoints.accounting.vouchers, body);
    await mutate(vouchersUrl);
    return enrichVoucher(data);
  };

  const updateVoucher = async (id, payload) => {
    const body = {
      voucher_type: payload.voucher_type || 'journal',
      journal: payload.journal_id,
      date: payload.date,
      payee: payload.partner_name || '',
      narration: payload.narration || '',
      total_amount: Number(payload.amount || 0),
    };
    if (payload.project) body.project = Number(payload.project);
    if (payload.cost_center) body.cost_center = Number(payload.cost_center);
    if (payload.lines && payload.lines.length > 0) {
      body.lines = payload.lines.map((l) => ({
        account: l.account ? Number(l.account) : undefined,
        description: l.description || '',
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
      }));
      const debitTotal = (payload.lines || []).reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
      if (debitTotal > 0) body.total_amount = debitTotal;
    }
    const { data } = await axiosInstance.patch(endpoints.accounting.voucher_by_id(id), body);
    await mutate(vouchersUrl);
    return enrichVoucher(data);
  };

  const deleteVoucher = async (id) => {
    await axiosInstance.delete(endpoints.accounting.voucher_by_id(id));
    await mutate(vouchersUrl);
  };

  return {
    vouchers,
    approvals,
    journals,
    loading: vouchersLoading || approvalsLoading || journalsLoading,
    error,
    actions: {
      submitVoucher,
      approveVoucher,
      rejectVoucher,
      postVoucher,
      createVoucher,
      updateVoucher,
      deleteVoucher,
      refetch,
    },
  };
}
