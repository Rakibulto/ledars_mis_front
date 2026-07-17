'use client';

import {
  exportReportCsv,
  printReportPack,
  exportReportJson,
  exportReportExcel,
} from '../reports/reports-export';

export function buildPlanningConfigExportConfig(workspace) {
  return {
    title: 'Configuration Planning Controls',
    subtitle: 'Chart of accounts, cost centers, and budget setup',
    alerts: workspace.alerts,
    summary: [
      { label: 'Active accounts', value: workspace.overview.activeAccounts },
      { label: 'Reconcilable accounts', value: workspace.overview.reconcilableAccounts },
      { label: 'Active cost centers', value: workspace.overview.activeCostCenters },
      { label: 'Tracked budget', value: workspace.overview.trackedBudget },
    ],
    tables: [
      {
        title: 'Chart Of Accounts',
        columns: [
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Name' },
          { key: 'typeName', label: 'Type' },
          { key: 'controlBand', label: 'Control Band' },
          { key: 'balance', label: 'Balance' },
        ],
        rows: workspace.accounts,
      },
      {
        title: 'Cost Centers',
        columns: [
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Name' },
          { key: 'manager', label: 'Manager' },
          { key: 'budget', label: 'Budget' },
          { key: 'utilization', label: 'Utilization' },
        ],
        rows: workspace.costCenters,
      },
      {
        title: 'Budget Settings',
        columns: [
          { key: 'key', label: 'Setting' },
          { key: 'value', label: 'Value' },
        ],
        rows: Object.entries(workspace.budgetSettings).map(([key, value]) => ({
          key,
          value: String(value),
        })),
      },
    ],
    payload: workspace,
  };
}

export function exportPlanningConfigCsv(fileName, config) {
  return exportReportCsv(fileName, config);
}

export function exportPlanningConfigExcel(fileName, config) {
  return exportReportExcel(fileName, config);
}

export function exportPlanningConfigJson(fileName, config) {
  return exportReportJson(fileName, config);
}

export function printPlanningConfigPack(config) {
  return printReportPack(config);
}
