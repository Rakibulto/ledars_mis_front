'use client';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import InventoryCrudDeskPage from '../shared/inventory-crud-desk-page';
import { formatCurrency, renderBooleanChip } from '../shared/inventory-desk-page';

const EP = endpoints.storeInventory;
const DEFAULT_FORM = {
  name: '',
  carrier: '',
  transit_time: '',
  cost_per_kg: '',
  cost_per_km: '',
  is_active: true,
};

export default function ShippingMethodsMain() {
  const { data: rawData } = useGetRequest(EP.shipping_methods);
  const rows = Array.isArray(rawData) ? rawData : rawData?.results || [];

  return (
    <InventoryCrudDeskPage
      title="Shipping Methods"
      dialogTitle="Shipping Method"
      description="Manage the transport methods used by operations so carrier choice, transit assumptions, and freight costing stay visible."
      icon="solar:delivery-bold-duotone"
      rows={rows}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Method' },
        { key: 'carrier', label: 'Carrier' },
        { key: 'transit_time', label: 'Transit Time' },
        { key: 'cost_per_kg', label: 'Cost/kg', render: (row) => formatCurrency(row.cost_per_kg) },
        { key: 'cost_per_km', label: 'Cost/km', render: (row) => formatCurrency(row.cost_per_km) },
        {
          key: 'is_active',
          label: 'Active',
          render: (row) => renderBooleanChip(row.is_active, 'Active', 'Inactive'),
        },
      ]}
      summaryCards={[
        {
          label: 'Total methods',
          value: rows.length,
          icon: 'solar:delivery-bold-duotone',
          helper: 'Transport methods available to operations and procurement.',
        },
        {
          label: 'Active',
          value: rows.filter((row) => row.is_active).length,
          icon: 'solar:check-circle-bold-duotone',
          color: 'success',
          helper: 'Methods currently usable in planning and dispatch.',
        },
      ]}
      queueItems={(allRows) => [
        {
          label: 'Inactive methods',
          value: allRows.filter((row) => !row.is_active).length,
          color: 'default',
          helper: 'Inactive transport methods should be reviewed before reuse.',
        },
        {
          label: 'High freight profiles',
          value: allRows.filter((row) => Number(row.cost_per_kg || 0) > 100).length,
          color: 'warning',
          helper: 'These methods carry higher weight-based freight cost.',
        },
      ]}
      reviewFields={[
        { label: 'Carrier', render: (row) => row.carrier || 'Unassigned carrier' },
        { label: 'Transit time', render: (row) => row.transit_time || 'Not set' },
        { label: 'Cost per kg', render: (row) => formatCurrency(row.cost_per_kg) },
        { label: 'Cost per km', render: (row) => formatCurrency(row.cost_per_km) },
        {
          label: 'Status',
          render: (row) => renderBooleanChip(row.is_active, 'Active', 'Inactive'),
        },
      ]}
      defaultForm={DEFAULT_FORM}
      fields={[
        { key: 'name', label: 'Name' },
        { key: 'carrier', label: 'Carrier' },
        { key: 'transit_time', label: 'Transit Time' },
        { key: 'cost_per_kg', label: 'Cost per kg', type: 'number' },
        { key: 'cost_per_km', label: 'Cost per km', type: 'number' },
        {
          key: 'is_active',
          label: 'Active',
          options: [
            { label: 'Active', value: true },
            { label: 'Inactive', value: false },
          ],
        },
      ]}
      createEndpoint={EP.shipping_methods}
      updateEndpoint={(id) => EP.shipping_method_by_id(id)}
      deleteEndpoint={(id) => EP.shipping_method_by_id(id)}
      mutateKey={EP.shipping_methods}
      getRowTitle={(row) => row.name || 'Unnamed shipping method'}
      getRowSubtitle={(row) => `${row.carrier || 'Unassigned carrier'} transport profile`}
    />
  );
}
