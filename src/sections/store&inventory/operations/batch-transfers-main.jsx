'use client';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import InventoryDeskPage, { renderStatusChip } from '../shared/inventory-desk-page';

export default function BatchTransfersMain() {
  const { data: rawData } = useGetRequest(endpoints.storeInventory.stock_transfers);
  const rows = Array.isArray(rawData) ? rawData : rawData?.results || [];

  return (
    <InventoryDeskPage
      title="Batch Transfers"
      description="Supervise warehouse-to-warehouse transfer flow so stock rebalancing stays visible, controlled, and traceable across locations."
      icon="solar:transfer-horizontal-bold-duotone"
      rows={rows}
      columns={[
        { key: 'reference', label: 'Reference' },
        { key: 'date', label: 'Date' },
        { key: 'source_warehouse', label: 'Source WH' },
        { key: 'destination_warehouse', label: 'Dest WH' },
        { key: 'status', label: 'Status', render: (row) => renderStatusChip(row.status) },
        { key: 'requested_by', label: 'Requested By' },
      ]}
      summaryCards={[
        {
          label: 'Total transfers',
          value: rows.length,
          icon: 'solar:transfer-horizontal-bold-duotone',
          helper: 'All stock transfer records currently loaded.',
        },
        {
          label: 'In progress',
          value: rows.filter((row) => row.status === 'In Progress').length,
          icon: 'solar:clock-circle-bold-duotone',
          color: 'warning',
          helper: 'Transfers still moving between warehouses.',
        },
      ]}
      queueItems={(allRows) => [
        {
          label: 'Ready to receive',
          value: allRows.filter((row) => row.status === 'Ready').length,
          color: 'info',
          helper: 'Destination warehouse should confirm receipt and booking.',
        },
        {
          label: 'Missing requestor',
          value: allRows.filter((row) => !row.requested_by).length,
          color: 'default',
          helper: 'Transfers without a requestor should be validated before execution.',
        },
      ]}
      reviewFields={[
        { label: 'Reference', render: (row) => row.reference },
        { label: 'Transfer date', render: (row) => row.date || 'Not recorded' },
        { label: 'Source warehouse', render: (row) => row.source_warehouse || 'Unknown' },
        { label: 'Destination warehouse', render: (row) => row.destination_warehouse || 'Unknown' },
        { label: 'Status', render: (row) => renderStatusChip(row.status) },
        { label: 'Requested by', render: (row) => row.requested_by || 'Unassigned' },
      ]}
      getRowTitle={(row) => row.reference || 'Unnumbered transfer'}
      getRowSubtitle={(row) =>
        `${row.source_warehouse || 'Unknown'} to ${row.destination_warehouse || 'Unknown'}`
      }
    />
  );
}
