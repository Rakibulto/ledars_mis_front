'use client';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import InventoryDeskPage from '../shared/inventory-desk-page';

export default function StockAgingReportMain() {
  const { data: rawData } = useGetRequest(endpoints.storeInventory.stock_aging);
  const rows = Array.isArray(rawData) ? rawData : rawData?.results || [];

  return (
    <InventoryDeskPage
      title="Stock Aging Report"
      description="Review how much stock is sitting in each aging bucket so finance and warehouse teams can isolate slow-moving and obsolete inventory quickly."
      icon="solar:calendar-bold-duotone"
      rows={rows}
      columns={[
        { key: 'product_name', label: 'Product' },
        { key: 'total_qty', label: 'Total Qty' },
        { key: 'age_0_30', label: '0-30 days' },
        { key: 'age_31_60', label: '31-60 days' },
        { key: 'age_61_90', label: '61-90 days' },
        { key: 'age_91_180', label: '91-180 days' },
        { key: 'age_over_180', label: '>180 days' },
        { key: 'oldest_lot_date', label: 'Oldest Date' },
      ]}
      summaryCards={[
        {
          label: 'Products tracked',
          value: rows.length,
          icon: 'solar:calendar-bold-duotone',
          helper: 'Inventory lines currently represented in the aging feed.',
        },
        {
          label: 'Exposure >180 days',
          value: rows.reduce((total, row) => total + Number(row.age_over_180 || 0), 0),
          icon: 'solar:hourglass-bold-duotone',
          color: 'warning',
          helper: 'Units sitting beyond six months and likely needing action.',
        },
      ]}
      queueItems={(allRows) => [
        {
          label: 'Oldest-stock items',
          value: allRows.filter((row) => Number(row.age_over_180 || 0) > 0).length,
          color: 'warning',
          helper: 'Products with quantities already sitting over 180 days.',
        },
        {
          label: 'Near-obsolete lines',
          value: allRows.filter((row) => Number(row.age_91_180 || 0) > 0).length,
          color: 'info',
          helper: 'These lines should be checked before they move into the oldest bucket.',
        },
      ]}
      reviewFields={[
        { label: 'Total quantity', render: (row) => row.total_qty || 0 },
        { label: '0-30 days', render: (row) => row.age_0_30 || 0 },
        { label: '31-60 days', render: (row) => row.age_31_60 || 0 },
        { label: '61-90 days', render: (row) => row.age_61_90 || 0 },
        { label: '91-180 days', render: (row) => row.age_91_180 || 0 },
        { label: '>180 days', render: (row) => row.age_over_180 || 0 },
        { label: 'Oldest lot date', render: (row) => row.oldest_lot_date || 'Unknown' },
      ]}
      getRowTitle={(row) => row.product_name || 'Unknown product'}
      getRowSubtitle={(row) =>
        `${row.total_qty || 0} units currently distributed across aging buckets.`
      }
    />
  );
}
