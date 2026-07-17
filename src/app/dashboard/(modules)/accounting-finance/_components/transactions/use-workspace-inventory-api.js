'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { MOCK_INVENTORY_ENTRIES } from './mock-data';

// ── Enrichment ──────────────────────────────────────────────────────────────

export function enrichInventoryEntry(item) {
  return {
    ...item,
    number: item.number || item.entry_number || `INVJ-${item.id}`,
    quantity: Number(item.quantity || 0),
    unitCost: Number(item.unit_cost || 0),
    amount: Number(item.amount || 0),
    // frontend camelCase aliases
    movementType: item.movement_type || '',
    itemReference: item.item_reference || '',
    unitcost: Number(item.unit_cost || 0),
    procurementReference: item.procurement_reference || '',
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useWorkspaceInventoryApi() {
  const listUrl = `${endpoints.accounting.workspace_inventory_entries}?ordering=-created_at,-id`;

  const { data: rawData, isLoading, isValidating, error } = useSWR(listUrl, fetcher);

  const inventoryEntries = useMemo(() => {
    const list = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.results)
        ? rawData.results
        : [];
    if (list.length > 0) return list.map(enrichInventoryEntry);
    return MOCK_INVENTORY_ENTRIES;
  }, [rawData]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createEntry = async (formData) => {
    const res = await axiosInstance.post(
      endpoints.accounting.workspace_inventory_entry_create,
      formData
    );
    await mutate(listUrl);
    return enrichInventoryEntry(res.data);
  };

  const postEntry = async (id) => {
    const res = await axiosInstance.post(endpoints.accounting.workspace_inventory_entry_post(id));
    await mutate(listUrl);
    return enrichInventoryEntry(res.data);
  };

  const updateEntry = async (id, formData) => {
    const res = await axiosInstance.patch(
      endpoints.accounting.workspace_inventory_entry_by_id(id),
      formData
    );
    await mutate(listUrl);
    return enrichInventoryEntry(res.data);
  };

  const deleteEntry = async (id) => {
    await axiosInstance.delete(endpoints.accounting.workspace_inventory_entry_by_id(id));
    await mutate(listUrl);
  };

  return {
    inventoryEntries,
    isLoading,
    isValidating,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    postEntry,
  };
}
