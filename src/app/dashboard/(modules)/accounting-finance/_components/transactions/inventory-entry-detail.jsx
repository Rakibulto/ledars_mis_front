'use client';

import useSWR from 'swr';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Chip from '@mui/material/Chip';

import { paths } from 'src/routes/paths';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { formatCurrency } from '../utils';
import { getInventoryEntryById } from './mock-data';
import { enrichInventoryEntry } from './use-workspace-inventory-api';
import TransactionDetailShell, {
  formatDetailDate,
  TransactionRecordNotFound,
} from './transaction-detail-shell';

const STATUS_COLORS = {
  draft: 'default',
  posted: 'success',
};

export default function InventoryEntryDetail({ entryId }) {
  const isNumeric = !Number.isNaN(Number(entryId));
  const { data: rawEntry } = useSWR(
    isNumeric ? endpoints.accounting.workspace_inventory_entry_by_id(entryId) : null,
    fetcher
  );
  const [entry, setEntry] = useState(isNumeric ? null : (getInventoryEntryById(entryId) ?? null));
  useEffect(() => {
    if (rawEntry) setEntry(enrichInventoryEntry(rawEntry));
  }, [rawEntry]);

  if (!entry) {
    return (
      <TransactionRecordNotFound
        title="Inventory Entry"
        backHref={paths.dashboard.accountingFinance.transactions.inventoryEntries}
      />
    );
  }

  return (
    <TransactionDetailShell
      title="Inventory Entry Detail"
      subtitle="Stock accounting entry review for warehouse movements and valuation postings."
      documentNumber={entry.number}
      backHref={paths.dashboard.accountingFinance.transactions.inventoryEntries}
      chips={[
        <Chip
          key="status"
          label={entry.status}
          size="small"
          color={STATUS_COLORS[entry.status]}
          sx={{ textTransform: 'capitalize' }}
        />,
      ]}
      actions={[
        {
          label: 'Post inventory entry',
          icon: 'solar:box-bold',
          variant: 'contained',
          disabled: entry.status === 'posted',
          onClick: async () => {
            try {
              const { data } = await axiosInstance.post(
                endpoints.accounting.workspace_inventory_entry_post(entryId)
              );
              setEntry(enrichInventoryEntry(data));
              toast.success('Inventory entry posted successfully');
            } catch (error) {
              toast.error(
                error?.response?.data?.error ||
                  error?.response?.data?.detail ||
                  error?.message ||
                  'Action failed'
              );
            }
          },
        },
      ]}
      summary={[
        { label: 'Inventory value', value: formatCurrency(entry.amount) },
        { label: 'Warehouse', value: entry.warehouse },
        { label: 'Category', value: entry.category },
        { label: 'Movement type', value: entry.movementType },
      ]}
      sections={[
        {
          title: 'Inventory Posting Overview',
          items: [
            { label: 'Posting date', value: formatDetailDate(entry.date) },
            { label: 'Warehouse', value: entry.warehouse },
            { label: 'Category', value: entry.category },
            { label: 'Movement type', value: entry.movementType },
            { label: 'Item reference', value: entry.itemReference },
            { label: 'Quantity', value: entry.quantity },
            { label: 'Unit cost', value: entry.unitCost ? formatCurrency(entry.unitCost) : '—' },
            { label: 'Procurement reference', value: entry.procurementReference },
            { label: 'Description', value: entry.description, fullWidth: true },
          ],
        },
      ]}
      sidebar={[
        {
          title: 'Stock Control',
          items: [
            { primary: 'Posting state', secondary: 'Inventory journal status', meta: entry.status },
            { primary: 'Warehouse', secondary: 'Affected storage location', meta: entry.warehouse },
            {
              primary: 'Movement type',
              secondary: 'Stock transaction class',
              meta: entry.movementType,
            },
          ],
        },
      ]}
      controlChecks={[
        {
          label: 'Inventory posting',
          description: 'Warehouse valuation entry posting state',
          status: entry.status === 'posted' ? 'success' : 'warning',
          value: entry.status,
        },
        {
          label: 'Warehouse classification',
          description: 'Movement tagged to a warehouse and stock category',
          status: entry.warehouse && entry.category ? 'success' : 'error',
          value: entry.category,
        },
        {
          label: 'Valuation inputs',
          description: 'Item reference, quantity, and unit cost should be available',
          status: entry.itemReference && entry.quantity && entry.unitCost ? 'success' : 'warning',
          value: entry.itemReference || 'pending',
        },
      ]}
      timeline={[
        {
          label: 'Inventory entry prepared',
          description: entry.description,
          status: entry.warehouse,
          tone: 'info',
          time: formatDetailDate(entry.date),
          icon: 'solar:box-bold',
        },
      ]}
    />
  );
}
