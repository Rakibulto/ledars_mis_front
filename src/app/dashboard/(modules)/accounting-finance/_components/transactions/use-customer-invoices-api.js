'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ── Field enrichment ────────────────────────────────────────────────────────
// Normalise backend snake_case → frontend camelCase where the UI expects it.

function enrichCustomer(c) {
  const creditLimit = Number(c.credit_limit_amount ?? c.credit_limit ?? 0);
  // `risk` is computed by CustomerInvoiceCustomerSerializer; derive locally as fallback
  const risk =
    c.risk ?? (creditLimit >= 300000 ? 'low' : creditLimit >= 200000 ? 'medium' : 'high');
  return { ...c, creditLimit, risk };
}

function enrichInvoice(inv, customersById) {
  const customer = customersById[inv.customer] ?? null;
  return {
    ...inv,
    // camelCase aliases used throughout customer-invoices.jsx
    customer_id: inv.customer, // integer PK — used for lookup
    customerName: inv.customer_name ?? customer?.name ?? '',
    dunningStage: inv.dunning_stage,
    paymentTerms: inv.payment_terms,
    servicePeriod: inv.service_period,
    billingOwner: inv.billing_owner,
    billingReference: inv.billing_reference,
    recurringLabel: inv.recurring_label,
    promiseToPay: inv.promise_to_pay,
    creditWarning: inv.credit_warning,
    linkedJournals: inv.linked_journals ?? [],
    // numeric coercions (backend returns strings from DecimalField)
    subtotal: Number(inv.subtotal ?? 0),
    tax_amount: Number(inv.tax_amount ?? 0),
    total: Number(inv.total ?? 0),
    paid_amount: Number(inv.paid_amount ?? 0),
    balance_due: Number(inv.balance_due ?? 0),
    // nested arrays — present on detail, empty on list
    lines: (inv.lines ?? []).map((l) => ({
      ...l,
      quantity: Number(l.quantity ?? 1),
      unit_price: Number(l.unit_price ?? 0),
      amount: Number(l.amount ?? 0),
    })),
    allocations: inv.allocations ?? [],
    attachments: inv.attachments ?? [],
    chatter: (inv.chatter ?? []).map((c) => ({
      ...c,
      time: c.time ?? c.time_label ?? '',
    })),
  };
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useCustomerInvoicesApi() {
  const invoicesUrl = `${endpoints.accounting.customer_invoices}?ordering=-created_at,-id`;
  const customersUrl = '/api/donors/';

  const {
    data: rawInvoices,
    isLoading: invoicesLoading,
    isValidating: invoicesValidating,
    error: invoicesError,
  } = useSWR(invoicesUrl, fetcher);

  const { data: rawCustomers, isLoading: customersLoading } = useSWR(customersUrl, fetcher);

  // ── Customers ────────────────────────────────────────────────────────────

  const customers = useMemo(() => {
    const list = Array.isArray(rawCustomers)
      ? rawCustomers
      : Array.isArray(rawCustomers?.results)
        ? rawCustomers.results
        : [];
    return list.map(enrichCustomer);
  }, [rawCustomers]);

  const customersById = useMemo(() => {
    const map = {};
    for (const c of customers) map[c.id] = c;
    return map;
  }, [customers]);

  // ── Invoices ─────────────────────────────────────────────────────────────

  const invoices = useMemo(() => {
    const list = Array.isArray(rawInvoices)
      ? rawInvoices
      : Array.isArray(rawInvoices?.results)
        ? rawInvoices.results
        : [];
    return list.map((inv) => enrichInvoice(inv, customersById));
  }, [rawInvoices, customersById]);

  // ── Utilities ─────────────────────────────────────────────────────────────

  function getCustomerById(id) {
    // `id` may be an integer (from backend) or a string like 'cust-1' (legacy mock)
    return customersById[id] ?? customers.find((c) => String(c.id) === String(id)) ?? null;
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async function createInvoice(payload) {
    const body = {
      customer: payload.customer_id,
      date: payload.date,
      due_date: payload.due_date,
      payment_terms: payload.paymentTerms ?? '',
      service_period: payload.servicePeriod ?? '',
      billing_owner: payload.billingOwner ?? '',
      billing_reference: payload.billingReference ?? '',
      promise_to_pay: payload.promiseToPay || null,
      recurring: Boolean(payload.recurring),
      recurring_label: payload.recurringLabel ?? '',
      dunning_stage: 'none',
      credit_warning: false,
      tax_rate: Number(payload.taxRate ?? 0),
      journal: payload.journal ? Number(payload.journal) : undefined,
      project: payload.project ? Number(payload.project) : undefined,
      cost_center: payload.cost_center ? Number(payload.cost_center) : undefined,
      currency: payload.currency ? Number(payload.currency) : undefined,
      fiscal_period: payload.fiscal_period ? Number(payload.fiscal_period) : undefined,
      lines: (payload.lines ?? []).map((l) => ({
        description: l.description,
        quantity: Number(l.quantity) || 1,
        unit_price: Number(l.unit_price) || 0,
        analytic: l.analytic ?? '',
        account: l.account ? Number(l.account) : undefined,
        analytic_account: l.analytic_account ? Number(l.analytic_account) : undefined,
        cost_center: l.cost_center ? Number(l.cost_center) : undefined,
      })),
    };
    let data;
    try {
      const response = await axiosInstance.post(endpoints.accounting.customer_invoices, body);
      data = response.data;
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        (err?.response?.data
          ? typeof err.response.data === 'string'
            ? err.response.data
            : JSON.stringify(err.response.data)
          : err?.message);
      throw new Error(detail || 'Invoice creation failed');
    }
    await mutate(invoicesUrl);
    return data;
  }

  async function sendInvoice(id) {
    const { data } = await axiosInstance.post(endpoints.accounting.customer_invoice_send(id));
    await mutate(invoicesUrl);
    return data;
  }

  async function registerPayment(id, payload) {
    // payload: { amount, date, method, reference }
    const { data } = await axiosInstance.post(
      endpoints.accounting.customer_invoice_register_payment(id),
      payload
    );
    await mutate(invoicesUrl);
    return data;
  }

  async function refreshInvoice(id) {
    await mutate(invoicesUrl);
    // Also re-fetch the detail URL if it was cached
    await mutate(endpoints.accounting.customer_invoice_by_id(id));
  }

  async function updateInvoice(id, payload) {
    const body = {
      customer: payload.customer_id,
      date: payload.date,
      due_date: payload.due_date,
      payment_terms: payload.paymentTerms ?? '',
      service_period: payload.servicePeriod ?? '',
      billing_owner: payload.billingOwner ?? '',
      billing_reference: payload.billingReference ?? '',
      promise_to_pay: payload.promiseToPay || null,
      recurring: Boolean(payload.recurring),
      recurring_label: payload.recurringLabel ?? '',
      tax_rate: Number(payload.taxRate ?? 0),
    };
    const { data } = await axiosInstance.patch(
      endpoints.accounting.customer_invoice_by_id(id),
      body
    );
    await mutate(invoicesUrl);
    return data;
  }

  async function deleteInvoice(id) {
    await axiosInstance.delete(endpoints.accounting.customer_invoice_by_id(id));
    await mutate(invoicesUrl);
  }

  // ── Return ────────────────────────────────────────────────────────────────

  return {
    invoices,
    customers,
    getCustomerById,
    isLoading: invoicesLoading || customersLoading,
    isValidating: invoicesValidating,
    error: invoicesError,
    actions: {
      createInvoice,
      updateInvoice,
      deleteInvoice,
      sendInvoice,
      registerPayment,
      refreshInvoice,
    },
  };
}
