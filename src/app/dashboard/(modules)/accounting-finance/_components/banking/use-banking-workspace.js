'use client';

import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';

import axios, { fetcher, endpoints } from 'src/utils/axios';

// ── SWR config ────────────────────────────────────────────────────────────────
const SWR_OPTIONS = {
  revalidateIfStale: true,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 10000,
  errorRetryCount: 2,
  errorRetryInterval: 5000,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const toIsoDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

const startCase = (value) =>
  String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const asArray = (data) => (Array.isArray(data) ? data : data?.results || []);

const isResolvedLine = (lineStatus) =>
  ['matched', 'writeoff', 'counterpart_created'].includes(lineStatus);

// ── Data transformers ─────────────────────────────────────────────────────────
const transformAccount = (account) => ({
  id: account.id,
  code: account.account_code || `BANK-${String(account.id).padStart(3, '0')}`,
  name: account.name,
  bankName: account.bank_name,
  currency: account.currency_code || 'BDT',
  accountNumber: account.account_number,
  maskedNumber: `****${String(account.account_number || '').slice(-4) || '0000'}`,
  balance: parseFloat(account.current_balance || 0),
  overdraftLimit: parseFloat(account.overdraft_limit || 0),
  feedStatus: account.feed_status || 'manual',
  lastSyncAt: account.last_sync_at || null,
  owner: account.owner || 'Treasury',
  journal: account.journal_name || 'Bank Journal',
  type: account.account_type || 'bank',
  allowReconciliation: (account.account_type || 'bank') !== 'cash',
  feedProvider: account.feed_provider || 'Manual Upload',
  statementFrequency: account.statement_frequency || 'Daily',
  // Derived fields — filled in enrichAccounts()
  pendingBalance: 0,
  availableBalance: parseFloat(account.current_balance || 0),
  latestStatementId: null,
  latestStatementDate: null,
  statementBalance: parseFloat(account.current_balance || 0),
  unmatchedLines: 0,
  outstandingChecks: 0,
  outstandingCheckValue: 0,
});

const transformLine = (line) => ({
  id: line.id,
  date: line.date,
  description: line.description,
  reference: line.reference || '',
  amount: parseFloat(line.amount || 0),
  type: line.line_type || (parseFloat(line.amount || 0) >= 0 ? 'credit' : 'debit'),
  status: line.line_status || 'unmatched',
  recommendation: line.recommendation || '',
  recommendationType: line.recommendation_type || 'manual',
  confidence: line.confidence || 0,
  ruleId: line.rule_id || null,
  counterpartLabel: line.counterpart_label || '',
  note: line.note || '',
  matchReference: line.match_reference || '',
});

const transformStatement = (statement) => {
  const lines = asArray(statement.lines).map(transformLine);
  const duplicateCount = lines.filter((l) => l.status === 'duplicate').length;
  const unmatchedCount = lines.filter((l) => !isResolvedLine(l.status)).length;

  // Normalise status to frontend vocabulary
  const STATUS_MAP = { draft: 'imported', confirmed: 'in_progress', reconciled: 'completed' };
  const rawStatus = statement.status || 'imported';
  const mappedStatus = STATUS_MAP[rawStatus] || rawStatus;

  return {
    id: statement.id,
    bankAccountId: statement.bank_account,
    bankAccountName: statement.bank_account_name || '',
    period:
      statement.period ||
      new Date(statement.date).toLocaleString('default', { month: 'short', year: 'numeric' }),
    startDate: statement.period_start,
    endDate: statement.period_end,
    statementDate: statement.date,
    openingBalance: parseFloat(statement.opening_balance || 0),
    closingBalance: parseFloat(statement.closing_balance || 0),
    importedLines: lines.length,
    status: mappedStatus,
    source: statement.source || 'Manual import',
    parser: statement.parser || 'CSV mapping',
    mappingProfile: statement.mapping_profile || 'Default',
    feedBatch: statement.feed_batch || '',
    lastImportAt: statement.last_import_at || statement.created_at || '',
    duplicateCount,
    unmatchedCount,
    lines,
  };
};

const transformCheck = (check) => ({
  id: check.id,
  checkNumber: check.check_number,
  payee: check.payee,
  amount: parseFloat(check.amount || 0),
  issueDate: check.date,
  dueDate: check.due_date || check.date,
  // 'draft' on backend → 'prepared' on frontend
  status: check.status === 'draft' ? 'prepared' : check.status,
  bankAccountId: check.bank_account,
  bankName: check.bank_account_name || '',
  memo: check.memo || '',
  owner: check.owner || '',
  printStatus: check.print_status || 'pending',
  printCount: check.print_count || 0,
  lastActionAt: check.last_action_at || check.updated_at || '',
  paymentReference: check.payment_reference || '',
});

const transformTransfer = (transfer) => {
  const STATUS_MAP = { draft: 'pending_approval', confirmed: 'approved', posted: 'in_transit' };
  const rawStatus = transfer.status || 'pending_approval';
  const mappedStatus = STATUS_MAP[rawStatus] || rawStatus;

  return {
    id: transfer.id,
    reference: transfer.reference || `TRF-${transfer.id}`,
    fromAccountId: transfer.from_account,
    toAccountId: transfer.to_account,
    amount: parseFloat(transfer.amount || 0),
    requestedDate: transfer.requested_date || transfer.date,
    scheduledDate: transfer.scheduled_date || transfer.date,
    postedDate: transfer.posted_date || '',
    status: mappedStatus,
    owner: transfer.owner_name || transfer.created_by_name || '',
    approver: transfer.approver_name || '',
    priority: transfer.priority || 'normal',
    purpose: transfer.purpose || transfer.description || '',
    traceCode: transfer.trace_code || `TRACE-${transfer.id}`,
    journalEntry: transfer.journal_entry_reference || '',
  };
};

const transformModel = (model) => ({
  id: model.id,
  name: model.name,
  type: model.model_type,
  matchLabel: model.match_label_value || '',
  matchJournal: model.journal_name || '',
  account: model.account_name || '',
  tax: '',
  autoValidate: Boolean(model.auto_validate),
  active: Boolean(model.is_active),
});

// ── Derived / computed values ─────────────────────────────────────────────────
const enrichAccounts = (accounts, statements, checks, transfers) =>
  accounts.map((account) => {
    const accountStatements = statements.filter((s) => s.bankAccountId === account.id);
    const latestStatement = accountStatements
      .slice()
      .sort((a, b) => (b.statementDate || '').localeCompare(a.statementDate || ''))[0];

    const outstandingCheckList = checks.filter(
      (c) => c.bankAccountId === account.id && ['prepared', 'issued', 'bounced'].includes(c.status)
    );

    const pendingOut = transfers
      .filter(
        (t) =>
          t.fromAccountId === account.id &&
          ['pending_approval', 'approved', 'in_transit'].includes(t.status)
      )
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const pendingIn = transfers
      .filter((t) => t.toAccountId === account.id && ['approved', 'in_transit'].includes(t.status))
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const pendingBalance = pendingIn - pendingOut;
    const availableBalance =
      parseFloat(account.balance || 0) +
      pendingBalance -
      outstandingCheckList.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);

    return {
      ...account,
      pendingBalance,
      availableBalance,
      latestStatementId: latestStatement?.id || null,
      latestStatementDate: latestStatement?.statementDate || null,
      statementBalance: latestStatement?.closingBalance ?? account.balance,
      unmatchedLines: accountStatements.reduce((sum, s) => sum + (s.unmatchedCount || 0), 0),
      outstandingChecks: outstandingCheckList.length,
      outstandingCheckValue: outstandingCheckList.reduce(
        (sum, c) => sum + parseFloat(c.amount || 0),
        0
      ),
    };
  });

const deriveReconciliations = (accounts, statements) =>
  statements.map((statement) => {
    const account = accounts.find((a) => a.id === statement.bankAccountId);
    const unresolvedAmount = statement.lines
      .filter((l) => !isResolvedLine(l.status))
      .reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);
    const matchedCount = statement.lines.filter((l) => l.status === 'matched').length;
    const autoMatchRate = statement.lines.length
      ? Math.round((matchedCount / statement.lines.length) * 100)
      : 0;

    return {
      id: statement.id,
      bankAccountId: statement.bankAccountId,
      bankAccountName: statement.bankAccountName,
      statementId: statement.id,
      period: statement.period,
      statementBalance: statement.closingBalance,
      bookBalance: parseFloat(account?.balance || 0),
      difference: unresolvedAmount,
      status: statement.status,
      autoMatchRate,
    };
  });

const computeOverview = (accounts, statements, checks, transfers) => {
  const outstandingChecks = checks.filter((c) =>
    ['prepared', 'issued', 'bounced'].includes(c.status)
  );
  const unreconciledValue = statements.reduce(
    (sum, s) =>
      sum +
      s.lines
        .filter((l) => !isResolvedLine(l.status))
        .reduce((acc, l) => acc + Math.abs(parseFloat(l.amount || 0)), 0),
    0
  );
  return {
    totalBalance: accounts.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0),
    availableBalance: accounts.reduce((sum, a) => sum + parseFloat(a.availableBalance || 0), 0),
    unreconciledValue,
    outstandingCheckValue: outstandingChecks.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0),
    outstandingCheckCount: outstandingChecks.length,
    transfersAwaitingApproval: transfers.filter((t) => t.status === 'pending_approval').length,
    transfersInTransit: transfers.filter((t) => t.status === 'in_transit').length,
    importedStatements: statements.length,
  };
};

const computeAlerts = (accounts, checks) => {
  const alerts = [];

  accounts.forEach((account) => {
    // Only alert on 'warning' — 'manual' is the normal default for accounts without automatic feeds
    if (account.feedStatus === 'warning' && account.allowReconciliation) {
      alerts.push({
        id: `feed-${account.id}`,
        severity: 'warning',
        title: `${account.name} feed requires attention`,
        description: `Last sync ${
          account.lastSyncAt ? new Date(account.lastSyncAt).toLocaleString() : 'not available'
        } via ${account.feedProvider}.`,
      });
    }
    if (account.availableBalance < 0) {
      alerts.push({
        id: `balance-${account.id}`,
        severity: 'error',
        title: `${account.name} projects below zero`,
        description: 'Outstanding checks and pending transfers exceed available funds.',
      });
    }
  });

  checks
    .filter((c) => c.status === 'bounced')
    .forEach((check) => {
      alerts.push({
        id: `check-${check.id}`,
        severity: 'error',
        title: `${check.checkNumber} requires follow-up`,
        description: `${check.payee} check bounced and should be reissued or voided.`,
      });
    });

  if (!alerts.length) {
    alerts.push({
      id: 'banking-steady',
      severity: 'success',
      title: 'Treasury operations stable',
      description: 'All connected bank workflows are within the current control thresholds.',
    });
  }

  return alerts;
};

// ── API action functions ──────────────────────────────────────────────────────
export const createBankAccount = (draft) => {
  axios
    .post(endpoints.accounting.bank_accounts, {
      name: draft.name,
      bank_name: draft.bankName,
      account_number: draft.accountNumber,
      opening_balance: parseFloat(draft.openingBalance || 0),
      current_balance: parseFloat(draft.openingBalance || 0),
      overdraft_limit: parseFloat(draft.overdraftLimit || 0),
      owner: draft.owner || '',
      journal_name: draft.journal || 'Bank Journal',
      account_type: draft.type || 'bank',
      feed_status: draft.feedEnabled ? 'healthy' : 'manual',
      feed_provider: draft.feedProvider || 'Manual Upload',
      statement_frequency: draft.statementFrequency || 'Daily',
      status: 'active',
    })
    .then(() => mutate(endpoints.accounting.bank_accounts))
    .catch((err) => console.error('createBankAccount error:', err));
};

export const syncBankFeed = (accountId) => {
  axios
    .post(endpoints.accounting.bank_account_sync(accountId))
    .then(() => mutate(endpoints.accounting.bank_accounts))
    .catch((err) => console.error('syncBankFeed error:', err));
};

export const importBankStatement = (draft) => {
  const rawLines = String(draft.itemsText || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [date, description, reference, amount] = l.split('|').map((p) => p.trim());
      const amt = parseFloat(amount || 0);
      return {
        date: toIsoDate(date) || new Date().toISOString().slice(0, 10),
        description: description || 'Imported transaction',
        reference: reference || '',
        amount: amt,
        line_type: amt >= 0 ? 'credit' : 'debit',
        line_status: 'unmatched',
        recommendation: 'Review manually',
        recommendation_type: 'manual',
        confidence: 38,
      };
    });

  const calculatedClosing =
    parseFloat(draft.openingBalance || 0) + rawLines.reduce((sum, l) => sum + (l.amount || 0), 0);

  axios
    .post(endpoints.accounting.bank_statements, {
      bank_account: parseInt(draft.bankAccountId, 10),
      period: draft.period || '',
      period_start: draft.startDate,
      period_end: draft.endDate,
      date: draft.statementDate || draft.endDate,
      opening_balance: parseFloat(draft.openingBalance || 0),
      closing_balance: parseFloat(draft.closingBalance || calculatedClosing),
      source: draft.source || 'Manual import',
      parser: draft.parser || 'CSV mapping',
      mapping_profile: draft.mappingProfile || 'Default',
      status: 'imported',
      lines_data: rawLines,
    })
    .then(() => mutate(endpoints.accounting.bank_statements))
    .catch((err) => console.error('importBankStatement error:', err));
};

export const runStatementAutoMatch = (statementId) => {
  axios
    .post(endpoints.accounting.statement_auto_match(statementId))
    .then(() => mutate(endpoints.accounting.bank_statements))
    .catch((err) => console.error('runStatementAutoMatch error:', err));
};

export const applyStatementAction = ({
  statementId,
  lineIds,
  action,
  modelId,
  counterpartLabel,
  note,
}) => {
  axios
    .post(endpoints.accounting.statement_apply_line_action(statementId), {
      line_ids: lineIds,
      action,
      model_id: modelId,
      counterpart_label: counterpartLabel,
      note,
    })
    .then(() => mutate(endpoints.accounting.bank_statements))
    .catch((err) => console.error('applyStatementAction error:', err));
};

export const createReconciliationModel = (draft) => {
  axios
    .post(endpoints.accounting.reconciliation_models, {
      name: draft.name,
      model_type: draft.type || 'writeoff',
      match_label: 'contains',
      match_label_value: draft.matchLabel || '',
      auto_validate: Boolean(draft.autoValidate),
      is_active: true,
    })
    .then(() => mutate(endpoints.accounting.reconciliation_models))
    .catch((err) => console.error('createReconciliationModel error:', err));
};

export const createCheck = (draft) => {
  const checkNumber = `CHK-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  axios
    .post(endpoints.accounting.checks, {
      check_number: checkNumber,
      direction: 'outgoing',
      bank_account: parseInt(draft.bankAccountId, 10),
      date: draft.issueDate,
      due_date: draft.dueDate || draft.issueDate,
      payee: draft.payee,
      amount: parseFloat(draft.amount || 0),
      memo: draft.memo || '',
      owner: draft.owner || '',
      payment_reference: draft.paymentReference || '',
      status: 'prepared',
      print_status: 'pending',
      print_count: 0,
    })
    .then(() => mutate(endpoints.accounting.checks))
    .catch((err) => console.error('createCheck error:', err));
};

export const updateCheckStatus = (checkId, nextStatus) => {
  axios
    .post(endpoints.accounting.check_update_status(checkId), { status: nextStatus })
    .then(() => mutate(endpoints.accounting.checks))
    .catch((err) => console.error('updateCheckStatus error:', err));
};

export const printCheck = (checkId) => {
  axios
    .post(endpoints.accounting.check_print(checkId))
    .then(() => mutate(endpoints.accounting.checks))
    .catch((err) => console.error('printCheck error:', err));
};

export const createTransfer = (draft) => {
  const today = new Date().toISOString().slice(0, 10);
  axios
    .post(endpoints.accounting.bank_transfers, {
      date: draft.requestedDate || today,
      requested_date: draft.requestedDate || today,
      scheduled_date: draft.scheduledDate || draft.requestedDate || today,
      from_account: parseInt(draft.fromAccountId, 10),
      to_account: parseInt(draft.toAccountId, 10),
      amount: parseFloat(draft.amount || 0),
      description: draft.purpose || '',
      purpose: draft.purpose || '',
      owner_name: draft.owner || '',
      approver_name: draft.approver || '',
      priority: draft.priority || 'normal',
      trace_code: `TRACE-${Date.now()}`,
      status: 'pending_approval',
    })
    .then(() => mutate(endpoints.accounting.bank_transfers))
    .catch((err) => console.error('createTransfer error:', err));
};

export const advanceTransferStatus = (transferId, nextStatus) => {
  const today = new Date().toISOString().slice(0, 10);
  const postedDate = ['in_transit', 'completed'].includes(nextStatus) ? today : null;
  axios
    .post(endpoints.accounting.transfer_advance_status(transferId), {
      status: nextStatus,
      ...(postedDate ? { posted_date: postedDate } : {}),
    })
    .then(() =>
      Promise.all([
        mutate(endpoints.accounting.bank_transfers),
        mutate(endpoints.accounting.bank_accounts),
      ])
    )
    .catch((err) => console.error('advanceTransferStatus error:', err));
};

export const formatBankingStatus = startCase;

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useBankingWorkspace() {
  const { data: rawAccounts, isLoading: loadingAccounts } = useSWR(
    endpoints.accounting.bank_accounts,
    fetcher,
    SWR_OPTIONS
  );
  const { data: rawStatements, isLoading: loadingStatements } = useSWR(
    endpoints.accounting.bank_statements,
    fetcher,
    SWR_OPTIONS
  );
  const { data: rawChecks, isLoading: loadingChecks } = useSWR(
    endpoints.accounting.checks,
    fetcher,
    SWR_OPTIONS
  );
  const { data: rawTransfers, isLoading: loadingTransfers } = useSWR(
    endpoints.accounting.bank_transfers,
    fetcher,
    SWR_OPTIONS
  );
  const { data: rawModels, isLoading: loadingModels } = useSWR(
    endpoints.accounting.reconciliation_models,
    fetcher,
    SWR_OPTIONS
  );

  const { data: rawBankReconciliations, isLoading: loadingBankReconciliations } = useSWR(
    endpoints.accounting.bank_reconciliations,
    fetcher,
    SWR_OPTIONS
  );

  const isLoading =
    loadingAccounts ||
    loadingStatements ||
    loadingChecks ||
    loadingTransfers ||
    loadingModels ||
    loadingBankReconciliations;

  // Build statements list early so finalizeReconciliation can inspect current lines
  const statementsForFinalize = useMemo(
    () =>
      asArray(rawStatements)
        .map(transformStatement)
        .sort((a, b) => (b.statementDate || '').localeCompare(a.statementDate || '')),
    [rawStatements]
  );

  // finalizeReconciliation must return a boolean synchronously (component checks it directly)
  const finalizeReconciliation = useCallback(
    (statementId) => {
      const statement = statementsForFinalize.find((s) => s.id === statementId);
      const unresolved = (statement?.lines || []).filter((l) => !isResolvedLine(l.status)).length;
      if (unresolved > 0) return false;
      axios
        .post(endpoints.accounting.statement_finalize(statementId))
        .then(() => mutate(endpoints.accounting.bank_statements))
        .catch((err) => console.error('finalizeReconciliation error:', err));
      return true;
    },
    [statementsForFinalize]
  );

  return useMemo(() => {
    const accounts = asArray(rawAccounts).map(transformAccount);
    const statements = asArray(rawStatements)
      .map(transformStatement)
      .sort((a, b) => (b.statementDate || '').localeCompare(a.statementDate || ''));
    const checks = asArray(rawChecks)
      .map(transformCheck)
      .sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || ''));
    const transfers = asArray(rawTransfers)
      .map(transformTransfer)
      .sort((a, b) => (b.requestedDate || '').localeCompare(a.requestedDate || ''));
    const models = asArray(rawModels).map(transformModel);

    const bankReconciliations = asArray(rawBankReconciliations).map((rec) => ({
      id: rec.id,
      bankAccountId: rec.bank_account,
      bankAccountName: rec.bank_account_detail?.name || '',
      statementDate: rec.statement_date,
      statementBalance: parseFloat(rec.statement_balance || 0),
      bookBalance: parseFloat(rec.book_balance || 0),
      difference: parseFloat(rec.difference || 0),
      status: rec.status,
      linesCount: asArray(rec.lines).length,
      matchedCount: asArray(rec.lines).filter((l) => l.is_matched).length,
    }));

    const enrichedAccounts = enrichAccounts(accounts, statements, checks, transfers);
    const reconciliations = deriveReconciliations(enrichedAccounts, statements);

    return {
      isLoading,
      accounts: enrichedAccounts,
      statements,
      checks,
      transfers,
      models,
      reconciliations,
      bankReconciliations,
      overview: computeOverview(enrichedAccounts, statements, checks, transfers),
      alerts: computeAlerts(enrichedAccounts, checks),
      formatBankingStatus,
      actions: {
        createBankAccount,
        syncBankFeed,
        importBankStatement,
        runStatementAutoMatch,
        applyStatementAction,
        createReconciliationModel,
        finalizeReconciliation,
        createCheck,
        updateCheckStatus,
        printCheck,
        createTransfer,
        advanceTransferStatus,
      },
    };
  }, [
    isLoading,
    rawAccounts,
    rawStatements,
    rawChecks,
    rawTransfers,
    rawModels,
    rawBankReconciliations,
    finalizeReconciliation,
  ]);
}
