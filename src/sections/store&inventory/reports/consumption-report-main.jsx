'use client';

import { useMemo } from 'react';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import InventoryDeskPage from '../shared/inventory-desk-page';

const STATIC_CONSUMPTION = [
  {
    id: 1,
    product: 'Rice (50kg Bag)',
    department: 'Field Operations',
    jan: 100,
    feb: 120,
    mar: 150,
    total: 370,
    avg_monthly: 123,
  },
  {
    id: 2,
    product: 'Hygiene Kit (Family)',
    department: 'Field Operations',
    jan: 50,
    feb: 60,
    mar: 80,
    total: 190,
    avg_monthly: 63,
  },
  {
    id: 3,
    product: 'Water Purification Tablets',
    department: 'WASH Program',
    jan: 100,
    feb: 80,
    mar: 200,
    total: 380,
    avg_monthly: 127,
  },
  {
    id: 4,
    product: 'A4 Paper (80gsm)',
    department: 'Administration',
    jan: 8,
    feb: 10,
    mar: 10,
    total: 28,
    avg_monthly: 9,
  },
  {
    id: 5,
    product: 'Toner Cartridge HP 05A',
    department: 'Administration',
    jan: 2,
    feb: 3,
    mar: 3,
    total: 8,
    avg_monthly: 3,
  },
];

export default function ConsumptionReportMain() {
  const { data: rawData } = useGetRequest(endpoints.storeInventory.stock_moves);
  const stockMoves = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const rows = useMemo(() => STATIC_CONSUMPTION, []);

  return (
    <InventoryDeskPage
      title="Consumption Report"
      description="Use the consumption desk to compare monthly burn rates, confirm departmental demand patterns, and separate stable usage from emerging spikes."
      icon="solar:chart-bold-duotone"
      rows={rows}
      columns={[
        { key: 'product', label: 'Product' },
        { key: 'department', label: 'Department' },
        { key: 'jan', label: 'Jan' },
        { key: 'feb', label: 'Feb' },
        { key: 'mar', label: 'Mar' },
        { key: 'total', label: 'Total' },
        { key: 'avg_monthly', label: 'Avg Monthly' },
      ]}
      summaryCards={[
        {
          label: 'Products tracked',
          value: rows.length,
          icon: 'solar:chart-bold-duotone',
          helper: `Static planning set backed by ${stockMoves.length} stock moves available for future automation.`,
        },
        {
          label: 'Highest quarterly demand',
          value: Math.max(...rows.map((row) => row.total)),
          icon: 'solar:sort-by-time-bold-duotone',
          helper: 'Largest three-month consumption volume in the current sheet.',
        },
      ]}
      queueItems={(allRows) => [
        {
          label: 'High-burn SKUs',
          value: allRows.filter((row) => row.avg_monthly >= 100).length,
          color: 'warning',
          helper: 'These items should feed the replenishment forecast desk.',
        },
        {
          label: 'Admin overhead lines',
          value: allRows.filter((row) => row.department === 'Administration').length,
          color: 'default',
          helper: 'Office consumption lines that can be reviewed against support budgets.',
        },
      ]}
      reviewFields={[
        { label: 'Department', render: (row) => row.department },
        { label: 'January', render: (row) => row.jan },
        { label: 'February', render: (row) => row.feb },
        { label: 'March', render: (row) => row.mar },
        { label: 'Quarter total', render: (row) => row.total },
        { label: 'Average monthly', render: (row) => row.avg_monthly },
      ]}
      getRowTitle={(row) => row.product}
      getRowSubtitle={(row) => `${row.department} demand pattern across the last quarter.`}
    />
  );
}
