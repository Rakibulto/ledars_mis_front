'use client';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { formatCurrency } from '../shared/inventory-desk-page';
import InventoryCrudDeskPage from '../shared/inventory-crud-desk-page';

const DEFAULT_FORM = {
  reference: '',
  date: '',
  product_name: '',
  quantity: '',
  lot: '',
  reason: '',
  method: '',
  value_disposed: '',
  authorized_by: '',
};

const FIELDS = [
  { key: 'reference' },
  { key: 'date', type: 'date' },
  { key: 'product_name', label: 'Product Name' },
  { key: 'quantity', type: 'number' },
  { key: 'lot' },
  { key: 'reason' },
  { key: 'method' },
  { key: 'value_disposed', label: 'Value Disposed', type: 'number' },
  { key: 'authorized_by', label: 'Authorized By' },
];

export default function DisposalManagementMain() {
  const EP = endpoints.storeInventory;
  const { data: rawData } = useGetRequest(EP.disposal_records);
  const rows = Array.isArray(rawData) ? rawData : rawData?.results || [];

  return (
    <InventoryCrudDeskPage
      title="Disposal Management"
      description="Record controlled disposals, document write-off reasons, and keep authorization visibility on discarded stock."
      icon="solar:trash-bin-trash-bold-duotone"
      rows={rows}
      columns={[
        { key: 'reference', label: 'Reference' },
        { key: 'date', label: 'Date' },
        { key: 'product_name', label: 'Product' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'reason', label: 'Reason' },
        { key: 'method', label: 'Method' },
        {
          key: 'value_disposed',
          label: 'Disposed Value',
          render: (row) => formatCurrency(row.value_disposed),
        },
      ]}
      summaryCards={[
        {
          label: 'Disposal Records',
          value: rows.length,
          icon: 'solar:trash-bin-trash-bold-duotone',
        },
        {
          label: 'Units Disposed',
          value: rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0),
          icon: 'solar:box-bold-duotone',
        },
        {
          label: 'Write-off Value',
          value: formatCurrency(
            rows.reduce((sum, row) => sum + Number(row.value_disposed || 0), 0)
          ),
          icon: 'solar:wallet-money-bold-duotone',
          color: 'error',
        },
      ]}
      queueItems={(allRows, selectedRow) => [
        {
          label: 'Authorized Records',
          value: allRows.filter((row) => row.authorized_by).length,
          helper: 'Disposal records that already include an approving authority.',
        },
        {
          label: 'Selected Method',
          value: selectedRow?.method || 'None',
          helper: selectedRow?.reason || 'Select a disposal record to inspect its cause.',
        },
        {
          label: 'Selected Value',
          value: selectedRow ? formatCurrency(selectedRow.value_disposed) : formatCurrency(0),
          color: 'warning',
          helper: selectedRow?.authorized_by || 'Authorizer will appear for the selected record.',
        },
      ]}
      reviewFields={[
        { key: 'product_name', label: 'Product' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'lot', label: 'Lot' },
        { key: 'reason', label: 'Reason' },
        { key: 'method', label: 'Method' },
        {
          key: 'value_disposed',
          label: 'Disposed Value',
          render: (row) => formatCurrency(row.value_disposed),
        },
        { key: 'authorized_by', label: 'Authorized By' },
      ]}
      defaultForm={DEFAULT_FORM}
      fields={FIELDS}
      createEndpoint={EP.disposal_records}
      updateEndpoint={EP.disposal_record_by_id}
      deleteEndpoint={EP.disposal_record_by_id}
      mutateKey={EP.disposal_records}
      getRowTitle={(row) => row.reference || row.product_name || 'Disposal record'}
      getRowSubtitle={(row) => row.product_name || 'Disposed stock item'}
      dialogTitle="Disposal"
      createLabel="Add Disposal"
      emptyMessage="No disposal records are available."
    />
  );
}
