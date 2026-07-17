'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// Backend `scope` values: sales / purchase / both
// UI `tax_type` chip shows: output / input / (output for both)
function scopeToTaxType(scope) {
  if (scope === 'purchase') return 'input';
  return 'output';
}

// ------------------------------------------------------------
// Enrich a raw backend Tax into the display shape the table expects
// ------------------------------------------------------------
function enrichTax(tax, aggregatedData) {
  const scope = tax.scope || 'both';
  const taxTypeDisplay = scopeToTaxType(scope);
  const rate = Number(tax.rate ?? 0);
  const agg = aggregatedData[tax.id] || { totalTaxAmount: 0, totalBase: 0, documentCount: 0 };

  return {
    ...tax,
    active: tax.is_active !== false,
    type: scope,
    tax_type: taxTypeDisplay,
    rate,
    totalTaxAmount: agg.totalTaxAmount,
    totalBase: agg.totalBase,
    documentCount: agg.documentCount,
    reportingBox: taxTypeDisplay === 'input' ? 'Input VAT recovery' : 'Output VAT declaration',
    usageScope:
      scope === 'purchase'
        ? 'Purchase bills and expense capture'
        : scope === 'both'
          ? 'Customer invoicing, sales and purchase journals'
          : 'Customer invoicing and sales journals',
    settlementAccount: taxTypeDisplay === 'input' ? 'Input tax recoverable' : 'Output tax payable',
    reportingTags: taxTypeDisplay === 'input' ? 'Input VAT, reclaim' : 'Output VAT, sales tax',
    rateModel:
      tax.tax_type === 'fixed'
        ? 'Fixed amount per transaction'
        : 'Inclusive or exclusive by document setting',
    multiRateLogic: rate > 10 ? 'Standard + surcharge grid' : 'Single rate grid',
  };
}

// ------------------------------------------------------------
// Hook — drop-in for the taxes slice
// ------------------------------------------------------------
export function useTaxesApi() {
  const taxesUrl = endpoints.accounting.taxes;

  const { data: rawTaxes, isLoading, error } = useSWR(taxesUrl, fetcher);
  const { data: rawBills } = useSWR(endpoints.accounting.bills, fetcher);
  const { data: rawInvoices } = useSWR(endpoints.accounting.customer_invoices, fetcher);

  const allBills = useMemo(() => {
    const list = Array.isArray(rawBills) ? rawBills : Array.isArray(rawBills?.results) ? rawBills.results : [];
    return list;
  }, [rawBills]);

  const allInvoices = useMemo(() => {
    const list = Array.isArray(rawInvoices) ? rawInvoices : Array.isArray(rawInvoices?.results) ? rawInvoices.results : [];
    return list;
  }, [rawInvoices]);

  // Compute tax records from bills and invoices grouped by effective rate
  const computedTaxRecords = useMemo(() => {
    const rateGroups = {};

    // Process bills (input/purchase taxes)
    allBills.forEach((bill) => {
      const taxAmount = Number(bill.tax_amount || 0);
      if (taxAmount <= 0) return;
      const subtotal = Number(bill.subtotal || bill.total_amount || 0);
      if (subtotal <= 0) return;
      const effectiveRate = Math.round((taxAmount / subtotal) * 100 * 100) / 100;
      const key = `input-${effectiveRate}`;
      if (!rateGroups[key]) rateGroups[key] = { rate: effectiveRate, type: 'input', totalBase: 0, totalTax: 0, docCount: 0 };
      rateGroups[key].totalBase += subtotal;
      rateGroups[key].totalTax += taxAmount;
      rateGroups[key].docCount += 1;
    });

    // Process invoices (output/sales taxes)
    allInvoices.forEach((inv) => {
      const taxAmount = Number(inv.tax_amount || 0);
      if (taxAmount <= 0) return;
      const subtotal = Number(inv.subtotal || inv.total_amount || 0);
      if (subtotal <= 0) return;
      const effectiveRate = Math.round((taxAmount / subtotal) * 100 * 100) / 100;
      const key = `output-${effectiveRate}`;
      if (!rateGroups[key]) rateGroups[key] = { rate: effectiveRate, type: 'output', totalBase: 0, totalTax: 0, docCount: 0 };
      rateGroups[key].totalBase += subtotal;
      rateGroups[key].totalTax += taxAmount;
      rateGroups[key].docCount += 1;
    });

    // Convert to sorted array
    return Object.values(rateGroups)
      .sort((a, b) => b.totalTax - a.totalTax);
  }, [allBills, allInvoices]);

  // Combine manually created taxes with computed records
  const allTaxesList = useMemo(() => {
    const list = Array.isArray(rawTaxes)
      ? rawTaxes
      : Array.isArray(rawTaxes?.results)
        ? rawTaxes.results
        : [];
    return list;
  }, [rawTaxes]);

  const taxes = useMemo(() => {
    // Start with manually created tax definitions
    const manualTaxes = allTaxesList.map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      rate: Number(t.rate || 0),
      type: t.scope === 'purchase' ? 'input' : t.scope === 'sales' ? 'output' : 'both',
      source: 'definition',
      totalBase: 0,
      totalTax: 0,
      docCount: 0,
      active: t.is_active !== false,
    }));

    // Add computed records from bills/invoices
    const computedRecords = computedTaxRecords.map((rec, idx) => ({
      id: `computed-${idx}`,
      code: rec.type === 'input' ? 'INP' : 'OUT',
      name: rec.type === 'input' ? `Input VAT ${rec.rate}%` : `Output VAT ${rec.rate}%`,
      rate: rec.rate,
      type: rec.type,
      source: 'computed',
      totalBase: rec.totalBase,
      totalTax: rec.totalTax,
      docCount: rec.docCount,
      active: true,
    }));

    // Merge: if a manual definition matches a computed rate, enrich it
    // Otherwise, show computed records as standalone
    return [...manualTaxes, ...computedRecords];
  }, [allTaxesList, computedTaxRecords]);

  const overview = useMemo(() => {
    const totalInputTax = computedTaxRecords
      .filter((r) => r.type === 'input')
      .reduce((sum, r) => sum + r.totalTax, 0);
    const totalOutputTax = computedTaxRecords
      .filter((r) => r.type === 'output')
      .reduce((sum, r) => sum + r.totalTax, 0);
    const totalDocs = computedTaxRecords.reduce((sum, r) => sum + r.docCount, 0);

    return {
      activeTaxes: taxes.filter((t) => t.active).length,
      totalTaxCollected: totalInputTax + totalOutputTax,
      totalInputTax,
      totalOutputTax,
      totalDocuments: totalDocs,
      averageTaxRate: computedTaxRecords.length
        ? Number((computedTaxRecords.reduce((sum, r) => sum + r.rate, 0) / computedTaxRecords.length).toFixed(2))
        : 0,
    };
  }, [computedTaxRecords, taxes]);

  // ── Mutations ──────────────────────────────────────────────

  const createTax = async (payload) => {
    await axiosInstance.post(taxesUrl, {
      name: payload.name,
      code: payload.code,
      rate: Number(payload.rate || 0),
      scope: payload.scope,
      tax_type: payload.tax_type,
      is_active: true,
    });
    await mutate(taxesUrl);
  };

  const toggleTaxStatus = async (taxId) => {
    const tax = taxes.find((t) => String(t.id) === String(taxId));
    if (!tax) return;
    await axiosInstance.patch(endpoints.accounting.tax_by_id(taxId), {
      is_active: !tax.active,
    });
    await mutate(taxesUrl);
  };

  const updateTax = async (id, payload) => {
    await axiosInstance.patch(endpoints.accounting.tax_by_id(id), {
      name: payload.name,
      code: payload.code,
      rate: Number(payload.rate || 0),
      scope: payload.scope,
      tax_type: payload.tax_type,
    });
    await mutate(taxesUrl);
  };

  const deleteTax = async (id) => {
    await axiosInstance.delete(endpoints.accounting.tax_by_id(id));
    await mutate(taxesUrl);
  };

  return {
    taxes,
    overview,
    loading: isLoading,
    error,
    actions: { createTax, toggleTaxStatus, updateTax, deleteTax },
  };
}
