'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { MOCK_DEBIT_NOTES } from './mock-data';
import { enrichBill } from './use-vendor-bills-api';

// ── Enrichment ────────────────────────────────────────────────────────────────

export function enrichDebitNote(raw) {
  return {
    ...raw,
    number: raw.number || raw.debit_note_number || '',
    supplier_id: raw.supplier_id ?? raw.vendor,
    amount: Number(raw.amount ?? raw.total_amount ?? 0),
    bill_ref: raw.bill_ref ?? '',
    applicationStatus: raw.application_status ?? (raw.status === 'applied' ? 'applied' : 'pending'),
    adjustmentType: raw.adjustment_type ?? '',
    approvalRoute: raw.approval_route ?? '',
    disputeReference: raw.dispute_reference ?? '',
    notes: raw.application_notes ?? raw.notes ?? '',
    date: raw.date ?? '',
    reason: raw.reason ?? '',
    status: raw.status ?? 'draft',
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDebitNotesApi() {
  const notesUrl = `${endpoints.accounting.debit_notes}?ordering=-created_at,-id`;
  const vendorsUrl = endpoints.procurement_management.vendors_management;
  const billsUrl = `${endpoints.accounting.bills}?ordering=-bill_date,-id`;
  const rfqsUrl = `${endpoints.procurement_management.rfqs}?pagination=false`;

  const { data: rawNotes, isLoading, isValidating, error } = useSWR(notesUrl, fetcher);

  const { data: rawVendors } = useSWR(vendorsUrl, fetcher);
  const vendorsLoading = !rawVendors;
  const { data: rawBills } = useSWR(billsUrl, fetcher);
  const { data: rawRfqs } = useSWR(rfqsUrl, fetcher);

  // ── Debit notes ───────────────────────────────────────────────────────────

  const notes = useMemo(() => {
    const list = Array.isArray(rawNotes)
      ? rawNotes
      : Array.isArray(rawNotes?.results)
        ? rawNotes.results
        : [];
    if (list.length > 0) return list.map(enrichDebitNote);
    return MOCK_DEBIT_NOTES;
  }, [rawNotes]);

  // ── Vendors ───────────────────────────────────────────────────────────────

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

  // ── Applied amounts by bill (for adjustment exposure) ────────────────────

  const appliedAmountByBill = useMemo(() => {
    const totals = {};
    notes.forEach((note) => {
      if (note.status !== 'applied' || !note.bill_ref) return;
      totals[note.bill_ref] = (totals[note.bill_ref] || 0) + Number(note.amount || 0);
    });
    return totals;
  }, [notes]);

  // ── Adjustment bills (enriched vendor bills with debit note context) ──────

  const adjustmentBills = useMemo(() => {
    const list = Array.isArray(rawBills)
      ? rawBills
      : Array.isArray(rawBills?.results)
        ? rawBills.results
        : [];
    return list
      .map(enrichBill)
      .filter((bill) => bill.status !== 'paid' && bill.balance_due > 0)
      .map((bill) => {
        // Fix supplier_id ID-space mismatch: accounting Vendor PK vs VendorProfile PK
        const vendorName = bill.vendor_name || bill.vendor_detail?.name || '';
        if (vendorName) {
          const matchedVP = vendors.find((v) => v.name === vendorName);
          if (matchedVP) {
            bill.supplier_id = matchedVP.id;
          }
        }
        const appliedAdjustmentAmount = Number(appliedAmountByBill[bill.number] || 0);
        const remainingAdjustmentExposure = Math.max(
          Number(bill.balance_due || 0) - appliedAdjustmentAmount,
          0
        );
        const eligibleForAdjustment = bill.disputeFlag || bill.matchStatus !== '3-way matched';
        return {
          ...bill,
          appliedAdjustmentAmount,
          remainingAdjustmentExposure,
          eligibleForAdjustment,
          adjustmentState: eligibleForAdjustment
            ? remainingAdjustmentExposure > 0
              ? 'open'
              : 'covered'
            : 'clear',
        };
      })
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  }, [rawBills, appliedAmountByBill, vendors]);

  // ── Actions ───────────────────────────────────────────────────────────────

  async function createDebitNote(payload) {
    const body = {
      vendor: payload.supplier_id,
      date: payload.date,
      reason: payload.reason || 'Debit adjustment',
      amount: Number(payload.amount || 0),
      bill_ref: payload.bill_ref || payload.billRef || '',
      adjustment_type: payload.adjustmentType ?? '',
      approval_route: payload.approvalRoute ?? '',
      dispute_reference: payload.disputeReference ?? '',
      notes: payload.notes ?? '',
    };
    const { data } = await axiosInstance.post(endpoints.accounting.debit_note_create_draft, body);
    await mutate(notesUrl);
    return enrichDebitNote(data);
  }

  async function applyDebitNote(id) {
    const { data } = await axiosInstance.post(endpoints.accounting.debit_note_apply(id));
    await mutate(notesUrl);
    await mutate(billsUrl);
    await mutate(`${endpoints.accounting.bills}unpaid/`);
    return enrichDebitNote(data);
  }

  async function updateDebitNote(id, payload) {
    const body = {
      vendor: payload.supplier_id,
      date: payload.date,
      reason: payload.reason || 'Debit adjustment',
      amount: Number(payload.amount || 0),
      bill_ref: payload.bill_ref || payload.billRef || '',
      adjustment_type: payload.adjustmentType ?? '',
      approval_route: payload.approvalRoute ?? '',
      dispute_reference: payload.disputeReference ?? '',
      notes: payload.notes ?? '',
    };
    const { data } = await axiosInstance.patch(endpoints.accounting.debit_note_by_id(id), body);
    await mutate(notesUrl);
    return enrichDebitNote(data);
  }

  async function deleteDebitNote(id) {
    await axiosInstance.delete(endpoints.accounting.debit_note_by_id(id));
    await mutate(notesUrl);
  }

  // ── Return ─────────────────────────────────────────────────────

  return {
    notes,
    vendors,
    vendorsLoading,
    adjustmentBills,
    getVendorById,
    rfqs,
    getRfqsByVendor,
    isLoading,
    isValidating,
    error,
    actions: {
      createDebitNote,
      updateDebitNote,
      deleteDebitNote,
      applyDebitNote,
    },
  };
}
