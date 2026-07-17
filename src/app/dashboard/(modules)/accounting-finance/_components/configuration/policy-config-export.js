'use client';

import {
  exportReportCsv,
  printReportPack,
  exportReportJson,
  exportReportExcel,
} from '../reports/reports-export';

export function buildPolicyConfigExportConfig(workspace) {
  return {
    title: 'Configuration Policy Controls',
    subtitle: 'Lock dates, fiscal positions, and incoterms',
    alerts: workspace.alerts,
    summary: [
      { label: 'Lock dates', value: workspace.overview.lockDateCount },
      { label: 'Hard locks', value: workspace.overview.hardLocks },
      { label: 'Active incoterms', value: workspace.overview.activeIncoterms },
      { label: 'Active fiscal positions', value: workspace.overview.activeFiscalPositions },
    ],
    tables: [
      {
        title: 'Lock Dates',
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'type', label: 'Type' },
          { key: 'lock_date', label: 'Date' },
          { key: 'scope', label: 'Scope' },
        ],
        rows: workspace.lockDates,
      },
      {
        title: 'Incoterms',
        columns: [
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Name' },
          { key: 'risk_transfer', label: 'Risk Transfer' },
          { key: 'usageScope', label: 'Usage Scope' },
        ],
        rows: workspace.incoterms,
      },
      {
        title: 'Fiscal Positions',
        columns: [
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Name' },
          { key: 'country', label: 'Country' },
          { key: 'mappingCoverage', label: 'Coverage' },
        ],
        rows: workspace.fiscalPositions,
      },
    ],
    payload: workspace,
  };
}

export function exportPolicyConfigCsv(fileName, config) {
  return exportReportCsv(fileName, config);
}

export function exportPolicyConfigExcel(fileName, config) {
  return exportReportExcel(fileName, config);
}

export function exportPolicyConfigJson(fileName, config) {
  return exportReportJson(fileName, config);
}

export function printPolicyConfigPack(config) {
  return printReportPack(config);
}
