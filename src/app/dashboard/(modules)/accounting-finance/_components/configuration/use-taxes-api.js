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
function enrichTax(tax) {
  const scope = tax.scope || 'both';
  const taxTypeDisplay = scopeToTaxType(scope);
  const rate = Number(tax.rate ?? 0);

  return {
    ...tax,
    active: tax.is_active !== false,
    // Map backend `scope` → UI `type` column (was 'sale'/'purchase' in mock)
    type: scope,
    // Map to output/input for the colour-coded chip column
    tax_type: taxTypeDisplay,
    rate,
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

  const taxes = useMemo(() => {
    const list = Array.isArray(rawTaxes)
      ? rawTaxes
      : Array.isArray(rawTaxes?.results)
        ? rawTaxes.results
        : [];
    return list.map(enrichTax);
  }, [rawTaxes]);

  const overview = useMemo(
    () => ({
      activeTaxes: taxes.filter((t) => t.active).length,
      withholdingTaxes: taxes.filter((t) => t.tax_type === 'withholding').length,
      averageTaxRate: taxes.length
        ? Number((taxes.reduce((sum, t) => sum + Number(t.rate || 0), 0) / taxes.length).toFixed(2))
        : 0,
    }),
    [taxes]
  );

  // ── Mutations ──────────────────────────────────────────────

  const createTax = async (payload) => {
    await axiosInstance.post(taxesUrl, {
      name: payload.name,
      code: payload.code,
      rate: Number(payload.rate || 0),
      scope: payload.scope, // sales / purchase / both
      tax_type: payload.tax_type, // percentage / fixed
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
