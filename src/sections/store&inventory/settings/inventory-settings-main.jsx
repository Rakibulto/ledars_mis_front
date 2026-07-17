'use client';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import InventoryCrudDeskPage from '../shared/inventory-crud-desk-page';

const EP = endpoints.storeInventory;
const DEFAULT_FORM = { setting: '', value: '', category: '' };

export default function InventorySettingsMain() {
  const { data: rawSettings } = useGetRequest(EP.inventory_settings);
  const rows = Array.isArray(rawSettings) ? rawSettings : rawSettings?.results || [];

  return (
    <InventoryCrudDeskPage
      title="Inventory Settings"
      dialogTitle="Setting"
      description="Maintain the configuration values that govern inventory behavior, valuation handling, and operating defaults across the module."
      icon="solar:settings-bold-duotone"
      rows={rows}
      columns={[
        { key: 'setting', label: 'Setting' },
        { key: 'value', label: 'Value' },
        { key: 'category', label: 'Category' },
      ]}
      summaryCards={[
        {
          label: 'Total settings',
          value: rows.length,
          icon: 'solar:settings-bold-duotone',
          helper: 'Module-level settings currently configured.',
        },
      ]}
      queueItems={(allRows) => [
        {
          label: 'Uncategorized settings',
          value: allRows.filter((row) => !row.category).length,
          color: 'default',
          helper: 'These settings should be grouped for easier governance.',
        },
        {
          label: 'Blank values',
          value: allRows.filter((row) => !row.value).length,
          color: 'warning',
          helper: 'Empty values may create inconsistent module behavior.',
        },
      ]}
      reviewFields={[
        { label: 'Setting', render: (row) => row.setting || 'Unnamed setting' },
        { label: 'Value', render: (row) => row.value || 'No value set' },
        { label: 'Category', render: (row) => row.category || 'Uncategorized' },
      ]}
      defaultForm={DEFAULT_FORM}
      fields={[
        { key: 'setting', label: 'Setting' },
        { key: 'value', label: 'Value' },
        { key: 'category', label: 'Category' },
      ]}
      createEndpoint={EP.inventory_settings}
      updateEndpoint={(id) => `${EP.inventory_settings}${id}/`}
      deleteEndpoint={(id) => `${EP.inventory_settings}${id}/`}
      mutateKey={EP.inventory_settings}
      getRowTitle={(row) => row.setting || 'Unnamed setting'}
      getRowSubtitle={(row) => `${row.category || 'Uncategorized'} configuration value`}
    />
  );
}
