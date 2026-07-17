'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ── Field enrichment ──────────────────────────────────────────────────────────
// Normalise backend snake_case → frontend camelCase used throughout the UI.

export function enrichBill(raw) {
  return {
    ...raw,
    total: Number(raw.total_amount) || Number(raw.total) || 0,
    balance_due: Number(raw.amount_due) || Number(raw.balance_due) || 0,
    paid_amount:
      Number(raw.paid_amount_alias) || Number(raw.amount_paid) || Number(raw.paid_amount) || 0,
    subtotal: Number(raw.subtotal) || 0,
    tax_amount: Number(raw.tax_amount) || 0,
    supplier_id: raw.supplier_id ?? raw.vendor,
    disputeFlag: raw.dispute_flag ?? false,
    matchStatus: raw.match_status ?? 'Awaiting receipt',
    paymentProposal: raw.payment_proposal ?? '',
    approvalRoute: raw.approval_route ?? '',
    supplierInvoiceRef: raw.supplier_invoice_ref || raw.vendor_reference || '',
    goodsReceiptRef: raw.goods_receipt_ref ?? '',
  };
}

export function enrichBillDetail(raw) {
  if (!raw) return null;

  // Subtotal: prefer direct field, fall back to summing lines.
  const mappedSubtotal = Number(raw.subtotal) || 0;
  const linesSubtotal = (raw.lines ?? []).reduce(
    (sum, l) => sum + (Number(l.subtotal) || Number(l.total) || 0),
    0
  );

  const resolvedPaid =
    Number(raw.paid_amount_alias) || Number(raw.amount_paid) || Number(raw.paid_amount) || 0;

  // Build chatter from bill notes and payment history so the
  // Payables Chatter section shows real backend data.
  const chatter = [];
  if (raw.notes) {
    chatter.push({
      id: 'notes',
      author: 'Bill Notes',
      message: raw.notes,
      time: raw.bill_date ?? raw.created_at ?? '',
    });
  }
  (raw.bill_payments ?? []).forEach((p) => {
    chatter.push({
      id: p.id,
      author: p.payment_reference || `PMT-${p.id}`,
      message: `Payment of ${p.amount} applied`,
      time: p.date ?? p.created_at ?? '',
    });
  });

  const total = Number(raw.total_amount) || Number(raw.total) || linesSubtotal;
  const balanceRaw = Number(raw.amount_due) ?? Number(raw.balance_due) ?? (linesSubtotal - resolvedPaid);
  // Cap balance_due to 0 — never show negative (overpayment case)
  const balanceDue = raw.status === 'paid' ? 0 : Math.max(0, balanceRaw);

  return {
    ...enrichBill(raw),
    // Explicit overrides after the spread so the correct API field names
    // take priority over whatever enrichBill already calculated.
    total,
    balance_due: balanceDue,
    paid_amount: resolvedPaid,
    subtotal: mappedSubtotal || linesSubtotal,
    tax_amount: Number(raw.tax_amount) || 0,
    date: raw.bill_date ?? raw.date ?? '',
    due_date: raw.due_date ?? '',
    lines: (raw.lines ?? []).map((l) => ({
      id: l.id,
      description: l.description ?? '',
      quantity: Number(l.quantity ?? 1),
      unit_price: Number(l.unit_price ?? 0),
      // BillLine.subtotal = qty × unit_price; BillLine.total = subtotal + tax
      amount: Number(l.subtotal) || Number(l.total) || Number(l.amount) || 0,
      tax_amount: Number(l.tax_amount) || 0,
      matched: Boolean(l.matched),
      analytic: l.analytic_account ?? '',
    })),
    // Map journal entry items to "attachments" so the bill detail Attachments
    // section shows the double-entry lines (debit + credit sides)
    attachments: (raw.journal_entry_items ?? []).map((item) => ({
      id: item.id,
      name: item.label || item.description || '',
      type: item.debit > 0 ? 'Debit' : 'Credit',
      account_code: item.account_code || '',
      account_name: item.account_name || '',
      debit: Number(item.debit) || 0,
      credit: Number(item.credit) || 0,
    })),
    linkedJournals: raw.journal_entry ? [`JE-${raw.journal_entry}`] : [],
    chatter,
    vendor_detail: raw.vendor_detail ?? null,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useVendorBillsApi() {
  const billsUrl = `${endpoints.accounting.bills}?ordering=-bill_date,-id`;
  const vendorsUrl = `${endpoints.procurement_management.vendors_management}?ordering=name`;

  const {
    data: rawBills,
    isLoading: billsLoading,
    isValidating: billsValidating,
    error: billsError,
  } = useSWR(billsUrl, fetcher);

  const { data: rawVendors } = useSWR(vendorsUrl, fetcher);
  const vendorsLoading = !rawVendors;

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

  // ── Bills ─────────────────────────────────────────────────────────────────────

  const bills = useMemo(() => {
    const list = Array.isArray(rawBills)
      ? rawBills
      : Array.isArray(rawBills?.results)
        ? rawBills.results
        : [];
    return list.map((raw) => {
      const enriched = enrichBill(raw);
      // ── Fix supplier_id ID-space mismatch ──────────────────────────────
      // BillListSerializer returns supplier_id = accounting_vendor.id, which
      // is the accounting module's own auto-increment PK. The vendors dropdown
      // and vendorsById map are keyed by VendorProfile.id from /api/vendors/ —
      // a completely separate table whose PKs do NOT align.
      // Re-resolve to the correct VendorProfile.id using vendor_name, which is
      // the same string in both tables (accounting_vendor.name is set from
      // VendorProfile.name when the VP-{id} sentinel row is created).
      if (raw.vendor_name) {
        const matchedVP = vendors.find((v) => v.name === raw.vendor_name);
        if (matchedVP) {
          enriched.supplier_id = matchedVP.id;
        }
      }
      return enriched;
    });
  }, [rawBills, vendors]);

  // ── Utilities ──────────────────────────────────────────────────────────────────

  function getVendorById(id) {
    return vendorsById[id] ?? vendors.find((v) => String(v.id) === String(id)) ?? null;
  }

  // ── Actions ───────────────────────────────────────────────────────────────────

  async function createBill(payload) {
    const lines = payload.lines ?? [];
    const subtotal = lines.reduce(
      (sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0),
      0
    );
    const taxRate = Number(payload.taxRate || 0);
    const total = subtotal + (subtotal * taxRate) / 100;
    const firstDesc = lines.find((l) => l.description.trim())?.description || 'Draft bill line';
    const body = {
      vendor: payload.supplier_id,
      bill_date: payload.date,
      due_date: payload.due_date,
      vendor_reference: payload.supplierInvoiceRef ?? '',
      goods_receipt_ref: payload.goodsReceiptRef ?? '',
      approval_route: payload.approvalRoute ?? '',
      payment_proposal: payload.paymentProposal ?? '',
      notes: firstDesc,
      total_amount: total,
      description: firstDesc,
      journal: payload.journal ? Number(payload.journal) : undefined,
      project: payload.project ? Number(payload.project) : undefined,
      cost_center: payload.cost_center ? Number(payload.cost_center) : undefined,
      currency: payload.currency ? Number(payload.currency) : undefined,
      fiscal_period: payload.fiscal_period ? Number(payload.fiscal_period) : undefined,
      lines: (payload.lines ?? []).map((l) => {
        const lineSubtotal = (Number(l.quantity) || 1) * (Number(l.unit_price) || 0);
        const lineTaxAmount = (lineSubtotal * taxRate) / 100;
        return {
          description: l.description,
          quantity: Number(l.quantity) || 1,
          unit_price: Number(l.unit_price) || 0,
          account: l.account ? Number(l.account) : undefined,
          analytic_account: l.analytic_account ? Number(l.analytic_account) : undefined,
          cost_center: l.cost_center ? Number(l.cost_center) : undefined,
          tax_amount: lineTaxAmount || 0,
        };
      }),
    };
    const { data } = await axiosInstance.post(endpoints.accounting.bill_create_draft, body);
    await mutate(billsUrl);
    return data;
  }

  async function approveBill(id) {
    const { data } = await axiosInstance.post(endpoints.accounting.bill_approve(id));
    await mutate(billsUrl);
    return data;
  }

  async function patchBill(id, fields) {
    const { data } = await axiosInstance.patch(endpoints.accounting.bill_by_id(id), fields);
    await mutate(billsUrl);
    return data;
  }

  async function registerPayment(id, payload) {
    const { data } = await axiosInstance.post(
      endpoints.accounting.bill_register_payment(id),
      payload
    );
    await mutate(billsUrl);
    await mutate(endpoints.accounting.bill_by_id(id));
    return data;
  }

  async function resolveDispute(id) {
    return patchBill(id, { dispute_flag: false, match_status: '3-way matched' });
  }

  async function deleteBill(id) {
    await axiosInstance.delete(endpoints.accounting.bill_by_id(id));
    await mutate(billsUrl);
  }

  // ── Revalidation helper ─────────────────────────────────────────────────────

  function revalidate() {
    mutate(billsUrl);
    mutate(vendorsUrl);
  }

  // ── Return ────────────────────────────────────────────────────────────────────

  return {
    bills,
    vendors,
    getVendorById,
    isLoading: billsLoading || vendorsLoading,
    isValidating: billsValidating,
    error: billsError,
    revalidate,
    actions: {
      createBill,
      approveBill,
      patchBill,
      deleteBill,
      registerPayment,
      resolveDispute,
    },
  };
}
