'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ── Enrichment ────────────────────────────────────────────────────────────────

const USAGE_SCOPES = [
  'Vendor bills and import logistics',
  'Customer invoice delivery terms',
  'Freight and logistics documentation',
  'Procurement and supplier contracts',
];

const ALLOCATION_RULES = [
  'Freight cost capture required',
  'Delivery confirmation required',
  'Insurance provision mandatory',
  'Loading port inspection required',
];

function enrichIncoterm(inc, index) {
  return {
    ...inc,
    // Map backend `is_active` → UI `active`
    active: inc.is_active !== false,
    // Frontend-only enrichment for UI display (backend has no these fields)
    risk_transfer: inc.risk_transfer || 'At delivery point',
    usageScope: USAGE_SCOPES[index % USAGE_SCOPES.length],
    allocationRule: ALLOCATION_RULES[index % ALLOCATION_RULES.length],
    adoptionRate: Math.min(98, 20 + ((index * 13) % 79)),
    billFlowUsage:
      index % 2 === 0
        ? 'Used on landed-cost vendor bills'
        : 'Used on service or export vendor bills',
    invoiceFlowUsage:
      index % 2 === 0
        ? 'Mirrors shipping cost pass-through on invoices'
        : 'Used on donor and export invoices',
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useIncotermApi() {
  const url = endpoints.accounting.incoterms;
  const { data: rawData, isLoading, error } = useSWR(url, fetcher);

  const incoterms = useMemo(() => {
    const list = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.results)
        ? rawData.results
        : [];
    return list.map(enrichIncoterm);
  }, [rawData]);

  const overview = useMemo(
    () => ({
      activeIncoterms: incoterms.filter((inc) => inc.active).length,
      policyCoverage: incoterms.filter((inc) => inc.active).length,
    }),
    [incoterms]
  );

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createIncoterm = async (payload) => {
    await axiosInstance.post(url, {
      code: payload.code,
      name: payload.name,
      description: payload.description || '',
      is_active: true,
    });
    await mutate(url);
  };

  const toggleIncotermStatus = async (id) => {
    const inc = incoterms.find((item) => item.id === id);
    if (!inc) return;
    await axiosInstance.patch(endpoints.accounting.incoterm_by_id(id), {
      is_active: !inc.is_active,
    });
    await mutate(url);
  };

  const updateIncoterm = async (id, payload) => {
    await axiosInstance.patch(endpoints.accounting.incoterm_by_id(id), {
      code: payload.code,
      name: payload.name,
      description: payload.description || '',
    });
    await mutate(url);
  };

  const deleteIncoterm = async (id) => {
    await axiosInstance.delete(endpoints.accounting.incoterm_by_id(id));
    await mutate(url);
  };

  return {
    incoterms,
    overview,
    loading: isLoading,
    error,
    actions: {
      createIncoterm,
      toggleIncotermStatus,
      updateIncoterm,
      deleteIncoterm,
    },
  };
}
