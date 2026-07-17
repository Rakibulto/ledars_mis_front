'use client';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { formatCurrency } from '../shared/inventory-desk-page';
import InventoryCrudDeskPage from '../shared/inventory-crud-desk-page';

const DEFAULT_FORM = {
  warehouse_name: '',
  items_count: '',
  total_value: '',
  authorization_level: '',
  last_review: '',
  next_review: '',
};

const FIELDS = [
  { key: 'warehouse_name', label: 'Warehouse Name' },
  { key: 'items_count', label: 'Items Count', type: 'number' },
  { key: 'total_value', label: 'Total Value', type: 'number' },
  { key: 'authorization_level' },
  { key: 'last_review', type: 'date' },
  { key: 'next_review', type: 'date' },
];

export default function EmergencyReservesMain() {
  const EP = endpoints.storeInventory;
  const { data: rawData } = useGetRequest(EP.emergency_reserves);
  const baseRows = Array.isArray(rawData) ? rawData : rawData?.results || [];
  const rows = baseRows.map((row) => ({
    ...row,
    items_count: row.items_count ?? row.items?.length ?? 0,
  }));

  return (
    <InventoryCrudDeskPage
      title="Emergency Reserves"
      description="Track pre-positioned stock locations, authorization levels, and review dates so contingency inventory stays deployable."
      icon="solar:shield-bold-duotone"
      rows={rows}
      columns={[
        { key: 'warehouse_name', label: 'Warehouse' },
        { key: 'items_count', label: 'Items Reserved' },
        {
          key: 'total_value',
          label: 'Reserve Value',
          render: (row) => formatCurrency(row.total_value),
        },
        { key: 'authorization_level', label: 'Authorization' },
        { key: 'last_review', label: 'Last Review' },
        { key: 'next_review', label: 'Next Review' },
      ]}
      summaryCards={[
        { label: 'Reserve Locations', value: rows.length, icon: 'solar:shield-bold-duotone' },
        {
          label: 'Items Reserved',
          value: rows.reduce((sum, row) => sum + Number(row.items_count || 0), 0),
          icon: 'solar:box-bold-duotone',
        },
        {
          label: 'Protected Value',
          value: formatCurrency(rows.reduce((sum, row) => sum + Number(row.total_value || 0), 0)),
          icon: 'solar:wallet-money-bold-duotone',
          color: 'success',
        },
      ]}
      queueItems={(allRows, selectedRow) => [
        {
          label: 'Next Reviews Due',
          value: allRows.filter((row) => row.next_review).length,
          helper: 'Reserve locations with a scheduled upcoming review.',
        },
        {
          label: 'Selected Warehouse',
          value: selectedRow?.warehouse_name || 'None',
          helper:
            selectedRow?.authorization_level || 'Choose a reserve location to inspect approvals.',
        },
        {
          label: 'Reserve Exposure',
          value: selectedRow ? formatCurrency(selectedRow.total_value) : formatCurrency(0),
          color: 'warning',
          helper: 'Estimated stock value held at the selected emergency reserve.',
        },
      ]}
      reviewFields={[
        { key: 'items_count', label: 'Items Reserved' },
        {
          key: 'total_value',
          label: 'Reserve Value',
          render: (row) => formatCurrency(row.total_value),
        },
        { key: 'authorization_level', label: 'Authorization Level' },
        { key: 'last_review', label: 'Last Review' },
        { key: 'next_review', label: 'Next Review' },
      ]}
      defaultForm={DEFAULT_FORM}
      fields={FIELDS}
      createEndpoint={EP.emergency_reserves}
      updateEndpoint={EP.emergency_reserve_by_id}
      deleteEndpoint={EP.emergency_reserve_by_id}
      mutateKey={EP.emergency_reserves}
      getRowTitle={(row) => row.warehouse_name || 'Reserve location'}
      getRowSubtitle={(row) => `${row.items_count || 0} items on standby`}
      dialogTitle="Reserve"
      createLabel="Add Reserve"
      emptyMessage="No emergency reserve locations have been configured."
    />
  );
}
