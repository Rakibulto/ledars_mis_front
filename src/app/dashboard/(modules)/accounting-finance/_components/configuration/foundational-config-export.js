'use client';

import {
  exportReportCsv,
  printReportPack,
  exportReportJson,
  exportReportExcel,
} from '../reports/reports-export';

export function buildFoundationalConfigExportConfig(workspace) {
  return {
    title: 'Configuration Foundational Controls',
    subtitle: 'Account types, payment terms, and tax rules',
    alerts: workspace.alerts,
    summary: [
      { label: 'Active account types', value: workspace.overview.activeAccountTypes },
      { label: 'Mapped accounts', value: workspace.overview.mappedAccounts },
      { label: 'Active payment terms', value: workspace.overview.activePaymentTerms },
      { label: 'Active taxes', value: workspace.overview.activeTaxes },
    ],
    tables: [
      {
        title: 'Account Types',
        columns: [
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Name' },
          { key: 'nature', label: 'Nature' },
          { key: 'category', label: 'Category' },
          { key: 'mappedAccountCount', label: 'Mapped Accounts' },
        ],
        rows: workspace.accountTypes,
      },
      {
        title: 'Payment Terms',
        columns: [
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Name' },
          { key: 'dueDays', label: 'Due Days' },
          { key: 'discountDays', label: 'Discount Days' },
          { key: 'discountPercent', label: 'Discount %' },
        ],
        rows: workspace.paymentTerms,
      },
      {
        title: 'Taxes',
        columns: [
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Name' },
          { key: 'rate', label: 'Rate' },
          { key: 'tax_type', label: 'Tax Type' },
          { key: 'reportingBox', label: 'Reporting Box' },
        ],
        rows: workspace.taxes,
      },
    ],
    payload: workspace,
  };
}

export function exportFoundationalConfigCsv(fileName, config) {
  return exportReportCsv(fileName, config);
}

export function exportFoundationalConfigExcel(fileName, config) {
  return exportReportExcel(fileName, config);
}

export function exportFoundationalConfigJson(fileName, config) {
  return exportReportJson(fileName, config);
}

export function printFoundationalConfigPack(config) {
  return printReportPack(config);
}
