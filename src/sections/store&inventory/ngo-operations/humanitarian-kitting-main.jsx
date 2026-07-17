'use client';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { formatCurrency } from '../shared/inventory-desk-page';
import InventoryCrudDeskPage from '../shared/inventory-crud-desk-page';

const DEFAULT_FORM = {
  code: '',
  name: '',
  target_group: '',
  approx_cost: '',
  stock_on_hand: '',
  pre_positioned: '',
  last_assembled: '',
};

const FIELDS = [
  { key: 'code' },
  { key: 'name' },
  { key: 'target_group' },
  { key: 'approx_cost', type: 'number' },
  { key: 'stock_on_hand', type: 'number' },
  { key: 'pre_positioned', type: 'number' },
  { key: 'last_assembled', type: 'date' },
];

export default function HumanitarianKittingMain() {
  const EP = endpoints.storeInventory;
  const { data: rawData } = useGetRequest(EP.humanitarian_kits);
  const rows = Array.isArray(rawData) ? rawData : rawData?.results || [];

  return (
    <InventoryCrudDeskPage
      title="Humanitarian Kitting"
      description="Manage prebuilt relief kits, monitor assembly cadence, and keep target-group stock levels visible for rapid response."
      icon="solar:box-bold-duotone"
      rows={rows}
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Kit Name' },
        { key: 'target_group', label: 'Target Group' },
        {
          key: 'approx_cost',
          label: 'Unit Cost',
          render: (row) => formatCurrency(row.approx_cost),
        },
        { key: 'stock_on_hand', label: 'Stock on Hand' },
        { key: 'pre_positioned', label: 'Pre-Positioned' },
        { key: 'last_assembled', label: 'Last Assembled' },
      ]}
      summaryCards={[
        { label: 'Kit Types', value: rows.length, icon: 'solar:box-bold-duotone' },
        {
          label: 'Stock on Hand',
          value: rows.reduce((sum, row) => sum + Number(row.stock_on_hand || 0), 0),
          icon: 'solar:layers-bold-duotone',
        },
        {
          label: 'Pre-Positioned',
          value: rows.reduce((sum, row) => sum + Number(row.pre_positioned || 0), 0),
          icon: 'solar:shield-check-bold-duotone',
          color: 'success',
        },
      ]}
      queueItems={(allRows, selectedRow) => [
        {
          label: 'Assembly Coverage',
          value: new Set(allRows.map((row) => row.target_group).filter(Boolean)).size,
          helper: 'Distinct target groups currently covered by kit designs.',
        },
        {
          label: 'Selected Kit',
          value: selectedRow?.code || 'None',
          helper: selectedRow?.name || 'Select a kit to review its cost and stock levels.',
        },
        {
          label: 'Estimated Stock Value',
          value: selectedRow
            ? formatCurrency(
                Number(selectedRow.stock_on_hand || 0) * Number(selectedRow.approx_cost || 0)
              )
            : formatCurrency(0),
          color: 'warning',
          helper: 'Approximate value of stock held for the selected kit.',
        },
      ]}
      reviewFields={[
        { key: 'target_group', label: 'Target Group' },
        {
          key: 'approx_cost',
          label: 'Approximate Cost',
          render: (row) => formatCurrency(row.approx_cost),
        },
        { key: 'stock_on_hand', label: 'Stock on Hand' },
        { key: 'pre_positioned', label: 'Pre-Positioned' },
        { key: 'last_assembled', label: 'Last Assembled' },
      ]}
      defaultForm={DEFAULT_FORM}
      fields={FIELDS}
      createEndpoint={EP.humanitarian_kits}
      updateEndpoint={EP.humanitarian_kit_by_id}
      deleteEndpoint={EP.humanitarian_kit_by_id}
      mutateKey={EP.humanitarian_kits}
      getRowTitle={(row) => row.name || row.code || 'Kit record'}
      getRowSubtitle={(row) => row.target_group || 'Target group not set'}
      dialogTitle="Kit"
      createLabel="Add Kit"
      emptyMessage="No humanitarian kits have been configured yet."
    />
  );
}
