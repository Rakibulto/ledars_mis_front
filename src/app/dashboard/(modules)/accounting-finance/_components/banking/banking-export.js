import {
  exportCsvFile,
  formatCurrency,
  exportJsonFile,
  exportExcelWorkbook,
  printTransactionPack,
  buildTransactionCsvRows,
  buildTransactionWorkbookData,
} from '../utils';

function normalizeConfig(config) {
  return {
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
  };
}

export function buildBankingExportConfig({
  overview,
  alerts,
  accounts,
  statements,
  reconciliations,
  checks,
  transfers,
}) {
  const healthyFeedCount = accounts.filter((account) => account.feedStatus === 'healthy').length;
  const openStatementCount = statements.filter((statement) => statement.unmatchedCount > 0).length;
  const outstandingChecks = checks.filter((check) =>
    ['prepared', 'issued', 'bounced'].includes(check.status)
  );
  const openTransfers = transfers.filter((transfer) =>
    ['pending_approval', 'approved', 'in_transit'].includes(transfer.status)
  );

  return normalizeConfig({
    title: 'Banking Workspace',
    subtitle: 'Treasury banking control pack',
    documentNumber: 'BANKING-WORKSPACE',
    alerts,
    summary: [
      { label: 'Total balance', value: formatCurrency(overview.totalBalance) },
      { label: 'Available balance', value: formatCurrency(overview.availableBalance) },
      { label: 'Unreconciled value', value: formatCurrency(overview.unreconciledValue) },
      { label: 'Outstanding checks', value: formatCurrency(overview.outstandingCheckValue) },
    ],
    sections: [
      {
        title: 'Treasury Controls',
        items: [
          {
            label: 'Healthy feeds',
            value: `${healthyFeedCount}/${accounts.filter((account) => account.allowReconciliation).length || accounts.length}`,
          },
          { label: 'Imported statements', value: statements.length },
          { label: 'Statements with exceptions', value: openStatementCount },
          { label: 'Transfers awaiting approval', value: overview.transfersAwaitingApproval },
          { label: 'Transfers in transit', value: overview.transfersInTransit },
          { label: 'Outstanding check count', value: overview.outstandingCheckCount },
        ],
      },
    ],
    tables: [
      {
        title: 'Bank Accounts',
        columns: [
          { key: 'name', label: 'Account' },
          { key: 'bankName', label: 'Bank' },
          { key: 'balance', label: 'Balance' },
          { key: 'available', label: 'Available' },
          { key: 'feed', label: 'Feed' },
          { key: 'exceptions', label: 'Open Lines' },
        ],
        rows: accounts.map((account) => ({
          name: account.name,
          bankName: account.bankName,
          balance: formatCurrency(account.balance, account.currency),
          available: formatCurrency(account.availableBalance, account.currency),
          feed: account.feedStatus,
          exceptions: account.unmatchedLines,
        })),
      },
      {
        title: 'Latest Statements',
        columns: [
          { key: 'account', label: 'Account' },
          { key: 'period', label: 'Period' },
          { key: 'status', label: 'Status' },
          { key: 'closing', label: 'Closing Balance' },
          { key: 'exceptions', label: 'Open Lines' },
        ],
        rows: statements.slice(0, 8).map((statement) => ({
          account: statement.bankAccountName,
          period: statement.period,
          status: statement.status,
          closing: formatCurrency(statement.closingBalance),
          exceptions: statement.unmatchedCount,
        })),
      },
      {
        title: 'Outstanding Checks',
        columns: [
          { key: 'number', label: 'Check #' },
          { key: 'payee', label: 'Payee' },
          { key: 'status', label: 'Status' },
          { key: 'bank', label: 'Bank' },
          { key: 'amount', label: 'Amount' },
        ],
        rows: outstandingChecks.map((check) => ({
          number: check.checkNumber,
          payee: check.payee,
          status: check.status,
          bank: check.bankName,
          amount: formatCurrency(check.amount),
        })),
      },
      {
        title: 'Open Transfers',
        columns: [
          { key: 'reference', label: 'Reference' },
          { key: 'route', label: 'Route' },
          { key: 'status', label: 'Status' },
          { key: 'owner', label: 'Owner' },
          { key: 'amount', label: 'Amount' },
        ],
        rows: openTransfers.map((transfer) => ({
          reference: transfer.reference,
          route: `${accounts.find((account) => account.id === transfer.fromAccountId)?.name || 'Unknown'} -> ${accounts.find((account) => account.id === transfer.toAccountId)?.name || 'Unknown'}`,
          status: transfer.status,
          owner: transfer.owner,
          amount: formatCurrency(transfer.amount),
        })),
      },
    ],
    controlChecks: [
      {
        label: 'Reconciliation records',
        value: reconciliations.length,
        description: 'Total open and completed reconciliation batches in workspace.',
      },
      {
        label: 'Feed health exceptions',
        value: accounts.filter((account) => account.feedStatus !== 'healthy').length,
        description: 'Accounts that still need sync or manual intervention.',
      },
    ],
    payload: { overview, alerts, accounts, statements, reconciliations, checks, transfers },
  });
}

export function printBankingPack(config) {
  printTransactionPack(normalizeConfig(config));
}

export function exportBankingCsv(fileName, config) {
  exportCsvFile(fileName, buildTransactionCsvRows(normalizeConfig(config)));
}

export function exportBankingExcel(fileName, config) {
  exportExcelWorkbook(fileName, buildTransactionWorkbookData(normalizeConfig(config)));
}

export function exportBankingJson(fileName, config) {
  exportJsonFile(fileName, {
    title: config.title,
    subtitle: config.subtitle,
    generatedAt: new Date().toISOString(),
    ...config.payload,
  });
}
