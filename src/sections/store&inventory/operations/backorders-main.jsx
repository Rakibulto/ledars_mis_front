'use client';

import { useMemo } from 'react';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import InventoryDeskPage, { renderStatusChip } from '../shared/inventory-desk-page';

export default function BackordersMain() {
  const { data: rawData } = useGetRequest(endpoints.storeInventory.grn);
  const goodsReceiptNotes = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const rows = useMemo(
    () =>
      goodsReceiptNotes
        .filter((note) => note.status === 'In Progress')
        .map((note) => ({
          ...note,
          pending_qty:
            note.items?.reduce(
              (total, item) =>
                total + (Number(item.qty_ordered || 0) - Number(item.qty_received || 0)),
              0
            ) || 0,
        })),
    [goodsReceiptNotes]
  );

  return (
    <InventoryDeskPage
      title="Backorders"
      description="Track inbound receipts still waiting on supplier fulfillment so logistics, procurement, and projects can prioritize delayed material flow."
      icon="solar:clipboard-list-bold-duotone"
      rows={rows}
      columns={[
        { key: 'reference', label: 'Reference' },
        { key: 'date', label: 'Date' },
        { key: 'supplier', label: 'Supplier' },
        { key: 'status', label: 'Status', render: (row) => renderStatusChip(row.status) },
        { key: 'pending_qty', label: 'Pending Qty' },
      ]}
      summaryCards={[
        {
          label: 'Active backorders',
          value: rows.length,
          icon: 'solar:clipboard-list-bold-duotone',
          color: 'warning',
          helper: 'Open GRNs with material still outstanding from suppliers.',
        },
      ]}
      queueItems={(allRows) => [
        {
          label: 'High-pending receipts',
          value: allRows.filter((row) => Number(row.pending_qty || 0) > 50).length,
          color: 'warning',
          helper: 'Backorders carrying more than 50 units of unreceived stock.',
        },
        {
          label: 'Supplier escalation',
          value: allRows.filter((row) => !row.supplier).length,
          color: 'default',
          helper: 'Receipts missing a supplier identifier still need ownership.',
        },
      ]}
      reviewFields={[
        { label: 'Reference', render: (row) => row.reference },
        { label: 'Supplier', render: (row) => row.supplier || 'Unknown supplier' },
        { label: 'Pending quantity', render: (row) => row.pending_qty },
        { label: 'Receipt date', render: (row) => row.date || 'Not recorded' },
        { label: 'Current status', render: (row) => renderStatusChip(row.status) },
      ]}
      getRowTitle={(row) => row.reference || 'Unnumbered backorder'}
      getRowSubtitle={(row) =>
        `${row.supplier || 'Unknown supplier'} still has material outstanding.`
      }
    />
  );
}
