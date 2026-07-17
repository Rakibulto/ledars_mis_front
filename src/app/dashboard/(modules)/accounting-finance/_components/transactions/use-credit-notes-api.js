'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { MOCK_CREDIT_NOTES } from './mock-data';

// ── Enrichment ────────────────────────────────────────────────────────────────

export function enrichCreditNote(raw) {
  return {
    ...raw,
    // Frontend aliases
    number: raw.number || raw.credit_note_number || '',
    customer_id: raw.customer_id ?? raw.customer,
    amount: Number(raw.amount ?? raw.total_amount ?? 0),
    invoice_ref: raw.invoice_ref ?? '',
    applicationStatus: raw.application_status ?? (raw.status === 'applied' ? 'applied' : 'pending'),
    adjustmentType: raw.adjustment_type ?? '',
    approvalRoute: raw.approval_route ?? '',
    refundReference: raw.refund_reference ?? '',
    notes: raw.application_notes ?? raw.notes ?? '',
    // Alias for display
    date: raw.date ?? '',
    reason: raw.reason ?? '',
    status: raw.status ?? 'draft',
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCreditNotesApi() {
  const notesUrl = `${endpoints.accounting.credit_notes}?ordering=-created_at,-id`;
  const customersUrl = '/api/donors/';
  const invoicesUrl = `${endpoints.accounting.customer_invoices}?ordering=-created_at,-id`;

  const {
    data: rawNotes,
    isLoading: notesLoading,
    isValidating: notesValidating,
    error: notesError,
  } = useSWR(notesUrl, fetcher);

  const { data: rawCustomers } = useSWR(customersUrl, fetcher);
  const customersLoading = !rawCustomers;
  const { data: rawInvoices } = useSWR(invoicesUrl, fetcher);

  // ── Credit notes ─────────────────────────────────────────────────────────────

  const notes = useMemo(() => {
    const list = Array.isArray(rawNotes)
      ? rawNotes
      : Array.isArray(rawNotes?.results)
        ? rawNotes.results
        : [];
    if (list.length > 0) return list.map(enrichCreditNote);
    return MOCK_CREDIT_NOTES;
  }, [rawNotes]);

  // ── Customers ─────────────────────────────────────────────────────────────────

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

  // ── Invoices (for adjustment panel) ──────────────────────────────────────────

  const invoices = useMemo(() => {
    const list = Array.isArray(rawInvoices)
      ? rawInvoices
      : Array.isArray(rawInvoices?.results)
        ? rawInvoices.results
        : [];
    return list.map((inv) => ({
      ...inv,
      // Frontend aliases matching the credit note dialog expectations
      number: inv.number || inv.invoice_number || '',
      customer_id: inv.customer_id ?? inv.customer,
      balance_due: Number(inv.balance_due ?? inv.amount_due ?? 0),
      creditWarning: inv.credit_warning ?? false,
      dunningStage: inv.dunning_stage ?? 'none',
      promiseToPay: inv.promise_to_pay ?? null,
    }));
  }, [rawInvoices]);

  // ── Utilities ──────────────────────────────────────────────────────────────────

  function getCustomerById(id) {
    return customersById[id] ?? customers.find((c) => String(c.id) === String(id)) ?? null;
  }

  // ── Actions ────────────────────────────────────────────────────────────────────

  async function createCreditNote(payload) {
    const body = {
      customer: payload.customer_id,
      date: payload.date,
      reason: payload.reason || 'Credit adjustment',
      amount: Number(payload.amount || 0),
      invoice_ref: payload.invoice_ref ?? '',
      adjustment_type: payload.adjustmentType ?? '',
      approval_route: payload.approvalRoute ?? '',
      refund_reference: payload.refundReference ?? '',
      notes: payload.notes ?? '',
    };
    const { data } = await axiosInstance.post(endpoints.accounting.credit_note_create_draft, body);
    await mutate(notesUrl);
    return enrichCreditNote(data);
  }

  async function applyCreditNote(id) {
    const { data } = await axiosInstance.post(endpoints.accounting.credit_note_apply(id));
    await mutate(notesUrl);
    return enrichCreditNote(data);
  }

  async function updateCreditNote(id, payload) {
    const body = {
      customer: payload.customer_id,
      date: payload.date,
      reason: payload.reason || 'Credit adjustment',
      amount: Number(payload.amount || 0),
      invoice_ref: payload.invoice_ref ?? '',
      adjustment_type: payload.adjustmentType ?? '',
      approval_route: payload.approvalRoute ?? '',
      refund_reference: payload.refundReference ?? '',
      notes: payload.notes ?? '',
    };
    const { data } = await axiosInstance.patch(endpoints.accounting.credit_note_by_id(id), body);
    await mutate(notesUrl);
    return enrichCreditNote(data);
  }

  async function deleteCreditNote(id) {
    await axiosInstance.delete(endpoints.accounting.credit_note_by_id(id));
    await mutate(notesUrl);
  }

  // ── Return ─────────────────────────────────────────────────────────────────────

  return {
    notes,
    customers,
    customersLoading,
    invoices,
    getCustomerById,
    isLoading: notesLoading,
    isValidating: notesValidating,
    error: notesError,
    actions: {
      createCreditNote,
      applyCreditNote,
      updateCreditNote,
      deleteCreditNote,
    },
  };
}
