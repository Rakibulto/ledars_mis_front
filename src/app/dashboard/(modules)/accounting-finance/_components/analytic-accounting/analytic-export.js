import {
  exportCsvFile,
  formatCurrency,
  exportJsonFile,
  exportExcelWorkbook,
  printTransactionPack,
  buildTransactionCsvRows,
  buildTransactionWorkbookData,
} from '../utils';

const normalizeConfig = (config) => ({
  title: config.title,
  subtitle: config.subtitle || '',
  documentNumber: config.documentNumber || config.title,
  alerts: config.alerts || [],
  summary: config.summary || [],
  sections: config.sections || [],
  tables: config.tables || [],
  controlChecks: config.controlChecks || [],
  referenceLinks: config.referenceLinks || [],
  timeline: config.timeline || [],
  auditTrail: config.auditTrail || [],
  payload: config.payload || {},
});

export function buildAnalyticExportConfig({
  overview,
  plans,
  accounts,
  items,
  rules,
  recentActivity,
}) {
  return normalizeConfig({
    title: 'Analytic Accounting Workspace',
    subtitle: 'Odoo-style analytic governance and allocation pack',
    documentNumber: 'ANALYTIC-WORKSPACE',
    summary: [
      { label: 'Plans', value: overview.planCount },
      { label: 'Analytic accounts', value: overview.accountCount },
      { label: 'Analytic items', value: overview.itemCount },
      { label: 'Total balance', value: formatCurrency(overview.totalBalance) },
    ],
    sections: [
      {
        title: 'Governance',
        items: [
          { label: 'Mandatory rules', value: overview.mandatoryRuleCount },
          { label: 'Distribution exceptions', value: overview.exceptionCount },
          { label: 'Debit total', value: formatCurrency(overview.debitTotal) },
          { label: 'Credit total', value: formatCurrency(overview.creditTotal) },
        ],
      },
    ],
    tables: [
      {
        title: 'Analytic Plans',
        columns: [
          { key: 'name', label: 'Plan' },
          { key: 'level', label: 'Level' },
          { key: 'mandatory', label: 'Mandatory Dimensions' },
          { key: 'applicability', label: 'Applicability' },
          { key: 'accounts', label: 'Accounts' },
        ],
        rows: plans.map((plan) => ({
          name: plan.name,
          level: plan.level,
          mandatory: plan.mandatoryDimensions.join(', '),
          applicability: plan.applicability.join(', '),
          accounts: plan.accountCount,
        })),
      },
      {
        title: 'Analytic Accounts',
        columns: [
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Account' },
          { key: 'plan', label: 'Plan' },
          { key: 'balance', label: 'Balance' },
          { key: 'distribution', label: 'Distribution Method' },
          { key: 'status', label: 'Status' },
        ],
        rows: accounts.map((account) => ({
          code: account.code,
          name: account.name,
          plan: account.planName,
          balance: formatCurrency(account.balance),
          distribution: account.distributionMethod,
          status: account.entryStatus,
        })),
      },
      {
        title: 'Analytic Items',
        columns: [
          { key: 'date', label: 'Date' },
          { key: 'reference', label: 'Reference' },
          { key: 'account', label: 'Analytic Account' },
          { key: 'source', label: 'Source Type' },
          { key: 'amount', label: 'Amount' },
          { key: 'distribution', label: 'Distribution Status' },
        ],
        rows: (items || []).map((item) => ({
          date: item.date,
          reference: item.reference,
          account: item.accountName,
          source: item.sourceType,
          amount: formatCurrency(item.amount),
          distribution: item.distributionStatus,
        })),
      },
    ],
    controlChecks: rules.map((rule) => ({
      label: rule.planName,
      value: `${rule.exceptionCount} exceptions`,
      description: `${rule.mandatoryDimensions.join(', ') || 'No mandatory dimensions'} | ${rule.appliesTo.join(', ')}`,
    })),
    timeline: recentActivity.map((item) => ({
      label: item.title,
      status: item.status,
      description: item.actor,
      time: item.date,
    })),
    payload: { overview, plans, accounts, items, rules, recentActivity },
  });
}

export function printAnalyticPack(config) {
  printTransactionPack(normalizeConfig(config));
}

export function exportAnalyticCsv(fileName, config) {
  exportCsvFile(fileName, buildTransactionCsvRows(normalizeConfig(config)));
}

export function exportAnalyticExcel(fileName, config) {
  exportExcelWorkbook(fileName, buildTransactionWorkbookData(normalizeConfig(config)));
}

export function exportAnalyticJson(fileName, config) {
  exportJsonFile(fileName, {
    title: config.title,
    subtitle: config.subtitle,
    generatedAt: new Date().toISOString(),
    ...config.payload,
  });
}
