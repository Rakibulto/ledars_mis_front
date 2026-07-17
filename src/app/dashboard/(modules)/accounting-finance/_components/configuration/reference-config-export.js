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

export function buildReferenceConfigExportConfig({
  overview,
  currencies,
  exchangeRates,
  paymentMethods,
  bankCashAccounts,
  reconciliationModels,
  activity,
}) {
  return normalizeConfig({
    title: 'Configuration Reference Workspace',
    subtitle: 'Treasury and reference master controls pack',
    documentNumber: 'CONFIG-REFERENCE-WORKSPACE',
    summary: [
      { label: 'Active currencies', value: overview.activeCurrencies },
      { label: 'Payment methods', value: overview.paymentMethodCount },
      { label: 'Liquidity', value: formatCurrency(overview.totalLiquidity) },
      { label: 'Reconciliation models', value: overview.activeReconciliationModels },
    ],
    sections: [
      {
        title: 'Control Coverage',
        items: [
          { label: 'Live rate sources', value: overview.liveRateSources },
          { label: 'Pending liquidity', value: formatCurrency(overview.pendingLiquidity) },
          { label: 'Bank accounts', value: overview.bankAccountCount },
          { label: 'Cash accounts', value: overview.cashAccountCount },
        ],
      },
    ],
    tables: [
      {
        title: 'Currencies',
        columns: [
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Currency' },
          { key: 'base', label: 'Base' },
          { key: 'rate', label: 'Latest Rate' },
          { key: 'source', label: 'Source' },
        ],
        rows: currencies.map((currency) => ({
          code: currency.code,
          name: currency.name,
          base: currency.is_base ? 'Yes' : 'No',
          rate: currency.exchange_rate,
          source: currency.source,
        })),
      },
      {
        title: 'Exchange Rates',
        columns: [
          { key: 'pair', label: 'Pair' },
          { key: 'rate', label: 'Rate' },
          { key: 'effective', label: 'Effective Date' },
          { key: 'source', label: 'Source' },
        ],
        rows: exchangeRates.map((rate) => ({
          pair: `${rate.from_currency}/${rate.to_currency}`,
          rate: rate.rate,
          effective: rate.effective_date,
          source: rate.source,
        })),
      },
      {
        title: 'Payment Methods',
        columns: [
          { key: 'name', label: 'Method' },
          { key: 'type', label: 'Type' },
          { key: 'flow', label: 'Payment Flow' },
          { key: 'journal', label: 'Journal' },
          { key: 'status', label: 'Status' },
        ],
        rows: paymentMethods.map((method) => ({
          name: method.name,
          type: method.type,
          flow: method.payment_flow,
          journal: method.journal,
          status: method.active ? 'Active' : 'Inactive',
        })),
      },
      {
        title: 'Bank And Cash Accounts',
        columns: [
          { key: 'name', label: 'Account' },
          { key: 'type', label: 'Type' },
          { key: 'balance', label: 'Balance' },
          { key: 'pending', label: 'Pending' },
          { key: 'state', label: 'Reconciliation State' },
        ],
        rows: bankCashAccounts.map((account) => ({
          name: account.name,
          type: account.type,
          balance: formatCurrency(account.balance, account.currency),
          pending: formatCurrency(account.pendingBalance, account.currency),
          state: account.reconciliationState,
        })),
      },
      {
        title: 'Reconciliation Models',
        columns: [
          { key: 'name', label: 'Model' },
          { key: 'type', label: 'Type' },
          { key: 'journal', label: 'Journal' },
          { key: 'account', label: 'Counterpart' },
          { key: 'status', label: 'Status' },
        ],
        rows: reconciliationModels.map((model) => ({
          name: model.name,
          type: model.type,
          journal: model.match_journal,
          account: model.account,
          status: model.active ? 'Active' : 'Inactive',
        })),
      },
    ],
    timeline: activity.map((item) => ({
      label: item.title,
      status: 'Info',
      description: item.actor,
      time: item.date,
    })),
    payload: {
      overview,
      currencies,
      exchangeRates,
      paymentMethods,
      bankCashAccounts,
      reconciliationModels,
      activity,
    },
  });
}

export function printReferenceConfigPack(config) {
  printTransactionPack(normalizeConfig(config));
}

export function exportReferenceConfigCsv(fileName, config) {
  exportCsvFile(fileName, buildTransactionCsvRows(normalizeConfig(config)));
}

export function exportReferenceConfigExcel(fileName, config) {
  exportExcelWorkbook(fileName, buildTransactionWorkbookData(normalizeConfig(config)));
}

export function exportReferenceConfigJson(fileName, config) {
  exportJsonFile(fileName, {
    title: config.title,
    subtitle: config.subtitle,
    generatedAt: new Date().toISOString(),
    ...config.payload,
  });
}
