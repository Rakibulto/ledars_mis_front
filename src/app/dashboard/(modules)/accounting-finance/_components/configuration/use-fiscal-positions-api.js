'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ── Enrichment ────────────────────────────────────────────────────────────────

function enrichFiscalPosition(fp, index) {
  const taxMappings = (fp.tax_mappings || []).map((m) => ({
    ...m,
    from: m.source_tax_name || String(m.source_tax ?? ''),
    to: m.destination_tax_name || String(m.destination_tax ?? ''),
  }));

  const accountMappings = (fp.account_mappings || []).map((m) => ({
    ...m,
    from: m.source_account_name || String(m.source_account ?? ''),
    to: m.destination_account_name || String(m.destination_account ?? ''),
  }));

  const isDomestic = !fp.country || fp.country.toLowerCase() === 'bangladesh';

  return {
    ...fp,
    // Map backend `is_active` → UI `active`
    active: fp.is_active !== false,
    tax_mappings: taxMappings,
    account_mappings: accountMappings,
    // UI-only display enrichment
    jurisdictionCluster: isDomestic ? 'Domestic' : 'Cross-border',
    mappingCoverage: taxMappings.length + accountMappings.length,
    documentScope:
      index % 2 === 0 ? 'Sales and procurement' : 'Grant billing and donor receivables',
    previewScenario:
      index % 2 === 0
        ? 'Preview domestic invoice and purchase bill mapping'
        : 'Preview export or donor invoice mapping',
    autoApplyReason: fp.auto_apply
      ? 'Applies automatically when partner country and tax profile match'
      : 'Manual analyst confirmation required',
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useFiscalPositionsApi() {
  const url = endpoints.accounting.fiscal_positions;
  const { data: rawData, isLoading, error } = useSWR(url, fetcher);

  const fiscalPositions = useMemo(() => {
    const list = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.results)
        ? rawData.results
        : [];
    return list.map(enrichFiscalPosition).sort((a, b) => b.id - a.id);
  }, [rawData]);

  const overview = useMemo(
    () => ({
      activeFiscalPositions: fiscalPositions.filter((fp) => fp.active).length,
      policyCoverage: fiscalPositions.filter((fp) => fp.active).length,
    }),
    [fiscalPositions]
  );

  const alerts = useMemo(() => {
    const list = [];
    if (fiscalPositions.some((fp) => !fp.auto_apply)) {
      list.push({
        id: 'manual-apply',
        severity: 'info',
        title: 'Manual fiscal mapping remains',
        description:
          'At least one fiscal position still requires manual operator selection on documents.',
      });
    }
    if (!list.length) {
      list.push({
        id: 'stable',
        severity: 'success',
        title: 'Fiscal position controls are configured',
        description: 'All active positions have their tax and account mapping rules in place.',
      });
    }
    return list;
  }, [fiscalPositions]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createFiscalPosition = async (payload) => {
    // Build mappings payload using backend field names
    const tax_mappings = (payload.tax_mappings || []).map((m) => ({
      source_tax: m.source_tax ? Number(m.source_tax) : null,
      destination_tax: m.destination_tax ? Number(m.destination_tax) : null,
    }));
    const account_mappings = (payload.account_mappings || []).map((m) => ({
      source_account: m.source_account ? Number(m.source_account) : null,
      destination_account: m.destination_account ? Number(m.destination_account) : null,
    }));

    await axiosInstance.post(url, {
      name: payload.name,
      country: payload.country || '',
      auto_apply: Boolean(payload.auto_apply),
      notes: payload.previewScenario || '',
      is_active: true,
      tax_mappings,
      account_mappings,
    });
    await mutate(url);
  };

  const toggleFiscalPositionStatus = async (id) => {
    const fp = fiscalPositions.find((item) => item.id === id);
    if (!fp) return;
    await axiosInstance.patch(endpoints.accounting.fiscal_position_by_id(id), {
      is_active: !fp.is_active,
    });
    await mutate(url);
  };

  const updateFiscalPosition = async (id, payload) => {
    await axiosInstance.patch(endpoints.accounting.fiscal_position_by_id(id), {
      name: payload.name,
      country: payload.country || '',
      auto_apply: Boolean(payload.auto_apply),
      notes: payload.previewScenario || '',
    });
    await mutate(url);
  };

  const deleteFiscalPosition = async (id) => {
    await axiosInstance.delete(endpoints.accounting.fiscal_position_by_id(id));
    await mutate(url);
  };

  return {
    fiscalPositions,
    overview,
    alerts,
    loading: isLoading,
    error,
    actions: {
      createFiscalPosition,
      toggleFiscalPositionStatus,
      updateFiscalPosition,
      deleteFiscalPosition,
    },
  };
}
