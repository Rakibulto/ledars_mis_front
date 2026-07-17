'use client';

import {
  exportReportCsv,
  printReportPack,
  exportReportJson,
  exportReportExcel,
} from '../reports/reports-export';

export function buildCoreLedgerConfigExportConfig(workspace) {
  return {
    title: 'Configuration Core Ledger Controls',
    subtitle: 'Journals, fiscal years, and fiscal periods',
    alerts: workspace.alerts,
    summary: [
      { label: 'Active journals', value: workspace.overview.activeJournals },
      { label: 'Posting queue', value: workspace.overview.postingQueue },
      { label: 'Open fiscal years', value: workspace.overview.openFiscalYears },
      { label: 'Open periods', value: workspace.overview.openPeriods },
    ],
    tables: [
      {
        title: 'Journals',
        columns: [
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Name' },
          { key: 'type', label: 'Type' },
          { key: 'postingQueue', label: 'Queue' },
          { key: 'lastEntryDate', label: 'Last Entry' },
        ],
        rows: workspace.journals,
      },
      {
        title: 'Fiscal Years',
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'start_date', label: 'Start Date' },
          { key: 'end_date', label: 'End Date' },
          { key: 'status', label: 'Status' },
          { key: 'closeReadiness', label: 'Readiness' },
        ],
        rows: workspace.fiscalYears,
      },
      {
        title: 'Fiscal Periods',
        columns: [
          { key: 'name', label: 'Period' },
          { key: 'fiscalYearName', label: 'Fiscal Year' },
          { key: 'start_date', label: 'Start Date' },
          { key: 'end_date', label: 'End Date' },
          { key: 'status', label: 'Status' },
        ],
        rows: workspace.fiscalPeriods,
      },
    ],
    payload: workspace,
  };
}

export function exportCoreLedgerConfigCsv(fileName, config) {
  return exportReportCsv(fileName, config);
}

export function exportCoreLedgerConfigExcel(fileName, config) {
  return exportReportExcel(fileName, config);
}

export function exportCoreLedgerConfigJson(fileName, config) {
  return exportReportJson(fileName, config);
}

export function printCoreLedgerConfigPack(config) {
  return printReportPack(config);
}
