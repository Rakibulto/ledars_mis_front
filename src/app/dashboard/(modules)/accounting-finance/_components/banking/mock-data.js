'use client';

import {
  ACCOUNTING_MOCK_CHECKS,
  ACCOUNTING_MOCK_BANK_ACCOUNTS,
  ACCOUNTING_MOCK_BANK_TRANSFERS,
  ACCOUNTING_MOCK_BANK_STATEMENTS,
  ACCOUNTING_MOCK_BANK_RECONCILIATIONS,
  ACCOUNTING_MOCK_RECONCILIATION_MODELS,
} from '../demo-data';

const TODAY = '2026-03-29';

let listeners = [];
let workspaceVersion = 0;
let sequence = 500;

const clone = (value) => JSON.parse(JSON.stringify(value));

const nextId = (prefix) => {
  sequence += 1;
  return `${prefix}-${sequence}`;
};

const toIsoDate = (value) => {
  if (!value) return TODAY;
  return new Date(value).toISOString().slice(0, 10);
};

const startCase = (value) =>
  String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const accountNumberSuffix = (value) => String(value || '').slice(-4) || '0000';

const baseStatementsByAccount = {
  1: [
    {
      date: '2026-03-04',
      description: 'Donor installment received',
      reference: 'RCPT-2031',
      amount: 45000,
    },
    {
      date: '2026-03-12',
      description: 'Medical supplies vendor payment',
      reference: 'PAY-8841',
      amount: -18200,
    },
    {
      date: '2026-03-25',
      description: 'Field cash replenishment',
      reference: 'TRF-001',
      amount: -9800,
    },
    { date: '2026-03-27', description: 'Monthly bank fee', reference: 'FEE-0327', amount: -350 },
    {
      date: '2026-03-28',
      description: 'Cash deposit pending booking',
      reference: 'DEP-7781',
      amount: 2650,
    },
  ],
  2: [
    {
      date: '2026-03-08',
      description: 'Grant milestone collection',
      reference: 'INV-AR-004',
      amount: 12000,
    },
    {
      date: '2026-03-21',
      description: 'FX transfer to local account',
      reference: 'TRF-002',
      amount: -10000,
    },
    {
      date: '2026-03-26',
      description: 'Correspondent bank charge',
      reference: 'FEE-USD-11',
      amount: -45,
    },
    { date: '2026-03-26', description: 'Interest income', reference: 'INT-003', amount: 45 },
  ],
  3: [
    {
      date: '2026-03-09',
      description: 'Field advance settlement',
      reference: 'ADV-993',
      amount: 6500,
    },
    {
      date: '2026-03-17',
      description: 'Distribution petty cash',
      reference: 'PETTY-441',
      amount: -4200,
    },
    {
      date: '2026-03-24',
      description: 'Cash top-up from bank',
      reference: 'TRF-003',
      amount: 8200,
    },
  ],
};

const buildStatementLine = (line, statementId, index) => {
  const normalizedDescription = String(line.description || '').toLowerCase();
  const normalizedReference = String(line.reference || '').toLowerCase();

  let status = 'unmatched';
  let recommendation = 'Review manually';
  let recommendationType = 'manual';
  let confidence = 38;
  let ruleId = null;
  let counterpartLabel = 'Suspense account review';

  if (
    normalizedReference.includes('trf') ||
    normalizedReference.includes('rcpt') ||
    normalizedReference.includes('inv')
  ) {
    status = 'matched';
    recommendation = 'Matched to existing book entry';
    recommendationType = 'match';
    confidence = 96;
    counterpartLabel = 'Matched journal entry';
  }

  if (normalizedDescription.includes('vendor payment')) {
    status = 'suggested';
    recommendation = 'Proposed payable settlement';
    recommendationType = 'counterpart';
    confidence = 82;
    counterpartLabel = '2101 - Accounts Payable';
  }

  if (normalizedDescription.includes('bank fee') || normalizedDescription.includes('bank charge')) {
    status = 'suggested';
    recommendation = 'Apply bank charges write-off model';
    recommendationType = 'writeoff';
    confidence = 93;
    ruleId = 1;
    counterpartLabel = '6302 - Bank Charges';
  }

  if (normalizedDescription.includes('interest')) {
    status = 'matched';
    recommendation = 'Matched to finance income journal';
    recommendationType = 'match';
    confidence = 88;
    counterpartLabel = '4201 - Interest Income';
  }

  if (normalizedDescription.includes('pending booking')) {
    status = 'unmatched';
    recommendation = 'Create counterpart or wait for cash receipt posting';
    recommendationType = 'counterpart';
    confidence = 58;
    counterpartLabel = '1105 - Cash in Transit';
  }

  return {
    id: `${statementId}-line-${index + 1}`,
    date: toIsoDate(line.date),
    description: line.description,
    reference: line.reference,
    amount: Number(line.amount || 0),
    type: Number(line.amount || 0) >= 0 ? 'credit' : 'debit',
    status,
    recommendation,
    recommendationType,
    confidence,
    ruleId,
    counterpartLabel,
    note: '',
    matchReference: status === 'matched' ? line.reference : '',
  };
};

const seedAccounts = () =>
  ACCOUNTING_MOCK_BANK_ACCOUNTS.map((account, index) => ({
    id: account.id,
    code: account.code,
    name: account.name,
    bankName: account.bank_name,
    currency: account.currency,
    accountNumber: account.account_number,
    maskedNumber: `****${accountNumberSuffix(account.account_number)}`,
    balance: Number(account.balance || 0),
    pendingBalance: [7200, 1800, 3400][index] || 0,
    overdraftLimit: [15000, 8000, 0][index] || 0,
    feedStatus: ['healthy', 'warning', 'manual'][index] || 'healthy',
    lastSyncAt: ['2026-03-29T09:15:00', '2026-03-28T18:10:00', '2026-03-26T14:00:00'][index],
    owner: ['Treasury Desk', 'Donor Finance Cell', 'Field Finance'][index] || 'Treasury Desk',
    journal: ['Bank Journal', 'USD Bank Journal', 'Cash Journal'][index] || 'Bank Journal',
    type: account.bank_name === 'Cash Register' ? 'cash' : 'bank',
    allowReconciliation: account.bank_name !== 'Cash Register',
    feedProvider: ['MT940 Gateway', 'SWIFT MT940', 'Manual Upload'][index] || 'Manual Upload',
    statementFrequency: ['Daily', 'Daily', 'Weekly'][index] || 'Daily',
  }));

const seedStatements = () =>
  ACCOUNTING_MOCK_BANK_STATEMENTS.map((statement, index) => {
    const sourceLines = baseStatementsByAccount[statement.bank_account_id] || statement.lines || [];
    const statementId = statement.id;
    const lines = sourceLines.map((line, lineIndex) =>
      buildStatementLine(line, statementId, lineIndex)
    );
    const duplicateCount = lines.filter((line) => line.status === 'duplicate').length;
    const unmatchedCount = lines.filter(
      (line) => !['matched', 'writeoff', 'counterpart_created'].includes(line.status)
    ).length;

    return {
      id: statementId,
      bankAccountId: statement.bank_account_id,
      bankAccountName: statement.bank_account_name,
      period: statement.period,
      startDate: toIsoDate(statement.start_date),
      endDate: toIsoDate(statement.end_date),
      statementDate: toIsoDate(statement.statement_date),
      openingBalance: Number(statement.opening_balance || 0),
      closingBalance: Number(statement.closing_balance || 0),
      importedLines: Number(statement.imported_lines || lines.length),
      status: index === 1 ? 'completed' : 'in_progress',
      source: index === 0 ? 'Bank feed' : 'Manual import',
      parser: index === 0 ? 'MT940' : 'CSV mapping',
      mappingProfile: index === 0 ? 'BRAC standard map' : 'USD donor import map',
      duplicateCount,
      unmatchedCount,
      lastImportAt: index === 0 ? '2026-03-29T09:15:00' : '2026-03-28T17:20:00',
      feedBatch: index === 0 ? 'BGW-20260329-01' : 'MAN-20260328-04',
      lines,
    };
  });

const seedReconciliations = (statements) =>
  ACCOUNTING_MOCK_BANK_RECONCILIATIONS.map((reconciliation) => {
    const statement = statements.find((item) => item.bankAccountId === reconciliation.bank_account);
    const unresolvedAmount = (statement?.lines || [])
      .filter((line) => !['matched', 'writeoff', 'counterpart_created'].includes(line.status))
      .reduce((sum, line) => sum + Number(line.amount || 0), 0);

    return {
      id: reconciliation.id,
      bankAccountId: reconciliation.bank_account,
      bankAccountName: reconciliation.bank_account_name,
      statementId: statement?.id,
      period: reconciliation.period,
      statementBalance: Number(reconciliation.statement_balance || 0),
      bookBalance: Number(reconciliation.system_balance || 0),
      difference: statement?.id === 1 ? unresolvedAmount : Number(reconciliation.difference || 0),
      status: statement?.status || 'in_progress',
      autoMatchRate: statement
        ? Math.round(
            ((statement.lines.filter((line) => line.status === 'matched').length || 0) /
              Math.max(statement.lines.length, 1)) *
              100
          )
        : 0,
    };
  });

const seedModels = () =>
  ACCOUNTING_MOCK_RECONCILIATION_MODELS.map((model) => ({
    id: model.id,
    name: model.name,
    type: model.type,
    matchLabel: model.match_label,
    matchJournal: model.match_journal,
    account: model.account,
    tax: model.tax,
    autoValidate: Boolean(model.auto_validate),
    active: Boolean(model.active),
  }));

const seedChecks = () => [
  {
    id: 'check-1',
    checkNumber: 'CHK-2026-1012',
    payee: 'Community Print House',
    amount: 56000,
    issueDate: '2026-03-26',
    dueDate: '2026-03-30',
    status: 'issued',
    bankAccountId: 1,
    bankName: 'Operating Bank Account',
    memo: 'Quarterly awareness printing',
    owner: 'Accounts Payable',
    printStatus: 'printed',
    printCount: 1,
    lastActionAt: '2026-03-26T11:20:00',
    paymentReference: 'BILL-8841',
  },
  {
    id: 'check-2',
    checkNumber: 'CHK-2026-1013',
    payee: 'Green Harvest Catering',
    amount: 28500,
    issueDate: '2026-03-30',
    dueDate: '2026-04-02',
    status: 'prepared',
    bankAccountId: 1,
    bankName: 'Operating Bank Account',
    memo: 'Training catering advance',
    owner: 'Treasury Desk',
    printStatus: 'pending',
    printCount: 0,
    lastActionAt: '2026-03-29T15:30:00',
    paymentReference: 'ADV-4412',
  },
  {
    id: 'check-3',
    checkNumber: 'CHK-2026-1014',
    payee: 'Northern Supplies Ltd',
    amount: 12750,
    issueDate: '2026-03-18',
    dueDate: '2026-03-20',
    status: 'bounced',
    bankAccountId: 1,
    bankName: 'Operating Bank Account',
    memo: 'Returned due to signature mismatch',
    owner: 'Finance Controller',
    printStatus: 'printed',
    printCount: 1,
    lastActionAt: '2026-03-22T09:10:00',
    paymentReference: 'BILL-7601',
  },
  ...ACCOUNTING_MOCK_CHECKS.map((check, index) => ({
    id: `legacy-check-${index + 1}`,
    checkNumber: check.check_number,
    payee: check.payee,
    amount: Number(check.amount || 0),
    issueDate: toIsoDate(check.issue_date),
    dueDate: toIsoDate(check.issue_date),
    status: String(check.status || 'prepared').toLowerCase(),
    bankAccountId: 1,
    bankName: 'Operating Bank Account',
    memo: 'Imported legacy check instrument',
    owner: 'Treasury Desk',
    printStatus: 'pending',
    printCount: 0,
    lastActionAt: `${toIsoDate(check.issue_date)}T10:00:00`,
    paymentReference: '',
  })),
];

const seedTransfers = () => [
  {
    id: 'transfer-1',
    reference: 'TRF-2026-041',
    fromAccountId: 1,
    toAccountId: 3,
    amount: 22000,
    requestedDate: '2026-03-25',
    scheduledDate: '2026-03-25',
    postedDate: '2026-03-25',
    status: 'completed',
    owner: 'Treasury Desk',
    approver: 'Finance Manager',
    priority: 'normal',
    purpose: 'Field cash replenishment',
    traceCode: 'TRACE-94015',
    journalEntry: 'JE-TRF-4101',
  },
  {
    id: 'transfer-2',
    reference: 'TRF-2026-042',
    fromAccountId: 2,
    toAccountId: 1,
    amount: 48000,
    requestedDate: '2026-03-29',
    scheduledDate: '2026-03-30',
    postedDate: '',
    status: 'pending_approval',
    owner: 'Donor Finance Cell',
    approver: 'Finance Director',
    priority: 'high',
    purpose: 'Convert donor cash to operating liquidity',
    traceCode: 'TRACE-94016',
    journalEntry: '',
  },
  {
    id: 'transfer-3',
    reference: 'TRF-2026-043',
    fromAccountId: 1,
    toAccountId: 3,
    amount: 15000,
    requestedDate: '2026-03-30',
    scheduledDate: '2026-03-31',
    postedDate: '2026-03-30',
    status: 'in_transit',
    owner: 'Treasury Desk',
    approver: 'Finance Manager',
    priority: 'normal',
    purpose: 'Cash float top-up for field disbursement',
    traceCode: 'TRACE-94017',
    journalEntry: 'JE-TRF-4102',
  },
  ...ACCOUNTING_MOCK_BANK_TRANSFERS.map((transfer, index) => ({
    id: `legacy-transfer-${index + 1}`,
    reference: transfer.reference,
    fromAccountId: transfer.from_account.includes('Donor') ? 2 : 1,
    toAccountId: transfer.to_account.includes('Field') ? 3 : 1,
    amount: Number(transfer.amount || 0),
    requestedDate: toIsoDate(transfer.transfer_date),
    scheduledDate: toIsoDate(transfer.transfer_date),
    postedDate:
      String(transfer.status || '').toLowerCase() === 'completed'
        ? toIsoDate(transfer.transfer_date)
        : '',
    status:
      String(transfer.status || 'draft').toLowerCase() === 'completed' ? 'completed' : 'approved',
    owner: 'Treasury Desk',
    approver: 'Finance Manager',
    priority: 'normal',
    purpose: 'Imported legacy transfer',
    traceCode: `TRACE-LEGACY-${index + 1}`,
    journalEntry:
      String(transfer.status || '').toLowerCase() === 'completed' ? `JE-LEGACY-${index + 1}` : '',
  })),
];

const createInitialState = () => {
  const accounts = seedAccounts();
  const statements = seedStatements();
  const reconciliations = seedReconciliations(statements);

  return {
    accounts,
    statements,
    reconciliations,
    models: seedModels(),
    checks: seedChecks(),
    transfers: seedTransfers(),
  };
};

const bankingState = createInitialState();

const getAccountName = (accountId) =>
  bankingState.accounts.find((item) => item.id === accountId)?.name || 'Unknown account';

const isResolvedLine = (status) => ['matched', 'writeoff', 'counterpart_created'].includes(status);

const recomputeDerivedState = () => {
  bankingState.statements = bankingState.statements.map((statement) => {
    const unresolvedLines = statement.lines.filter((line) => !isResolvedLine(line.status));
    const matchedLines = statement.lines.filter((line) => line.status === 'matched');
    const status =
      unresolvedLines.length === 0
        ? 'completed'
        : matchedLines.length > 0 || unresolvedLines.length < statement.lines.length
          ? 'in_progress'
          : 'imported';

    return {
      ...statement,
      duplicateCount: statement.lines.filter((line) => line.status === 'duplicate').length,
      unmatchedCount: unresolvedLines.length,
      status,
    };
  });

  bankingState.reconciliations = bankingState.reconciliations.map((reconciliation) => {
    const statement = bankingState.statements.find(
      (item) => item.id === reconciliation.statementId
    );
    const unresolvedAmount = (statement?.lines || [])
      .filter((line) => !isResolvedLine(line.status))
      .reduce((sum, line) => sum + Number(line.amount || 0), 0);
    const matchedCount = statement?.lines.filter((line) => line.status === 'matched').length || 0;

    return {
      ...reconciliation,
      bankAccountName: getAccountName(reconciliation.bankAccountId),
      statementBalance: statement?.closingBalance ?? reconciliation.statementBalance,
      difference: unresolvedAmount,
      status: statement?.status || reconciliation.status,
      autoMatchRate: statement
        ? Math.round((matchedCount / Math.max(statement.lines.length, 1)) * 100)
        : reconciliation.autoMatchRate,
    };
  });

  bankingState.accounts = bankingState.accounts.map((account) => {
    const statements = bankingState.statements.filter(
      (statement) => statement.bankAccountId === account.id
    );
    const latestStatement = statements
      .slice()
      .sort((left, right) => right.statementDate.localeCompare(left.statementDate))[0];
    const outstandingChecks = bankingState.checks.filter(
      (check) =>
        check.bankAccountId === account.id &&
        ['prepared', 'issued', 'bounced'].includes(check.status)
    );
    const pendingOutgoingTransfers = bankingState.transfers
      .filter(
        (transfer) =>
          transfer.fromAccountId === account.id &&
          ['pending_approval', 'approved', 'in_transit'].includes(transfer.status)
      )
      .reduce((sum, transfer) => sum + Number(transfer.amount || 0), 0);
    const pendingIncomingTransfers = bankingState.transfers
      .filter(
        (transfer) =>
          transfer.toAccountId === account.id &&
          ['approved', 'in_transit'].includes(transfer.status)
      )
      .reduce((sum, transfer) => sum + Number(transfer.amount || 0), 0);

    const pendingBalance = pendingIncomingTransfers - pendingOutgoingTransfers;
    const availableBalance =
      Number(account.balance || 0) +
      pendingBalance -
      outstandingChecks.reduce((sum, check) => sum + Number(check.amount || 0), 0);

    return {
      ...account,
      pendingBalance,
      availableBalance,
      latestStatementId: latestStatement?.id || null,
      latestStatementDate: latestStatement?.statementDate || null,
      statementBalance: latestStatement?.closingBalance ?? account.balance,
      unmatchedLines: statements.reduce(
        (sum, statement) => sum + Number(statement.unmatchedCount || 0),
        0
      ),
      outstandingChecks: outstandingChecks.length,
      outstandingCheckValue: outstandingChecks.reduce(
        (sum, check) => sum + Number(check.amount || 0),
        0
      ),
    };
  });
};

recomputeDerivedState();

const publish = () => {
  workspaceVersion += 1;
  listeners.forEach((listener) => listener());
};

const updateState = (recipe) => {
  recipe(bankingState);
  recomputeDerivedState();
  publish();
};

export const subscribeBankingWorkspace = (listener) => {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((item) => item !== listener);
  };
};

export const getBankingWorkspaceVersion = () => workspaceVersion;

export const getBankingAccounts = () => clone(bankingState.accounts);

export const getBankingStatements = () =>
  clone(
    bankingState.statements
      .slice()
      .sort((left, right) => right.statementDate.localeCompare(left.statementDate))
  );

export const getBankingChecks = () =>
  clone(
    bankingState.checks.slice().sort((left, right) => right.issueDate.localeCompare(left.issueDate))
  );

export const getBankingTransfers = () =>
  clone(
    bankingState.transfers
      .slice()
      .sort((left, right) => right.requestedDate.localeCompare(left.requestedDate))
  );

export const getReconciliationModels = () => clone(bankingState.models);

export const getBankingReconciliations = () => clone(bankingState.reconciliations);

export const getBankingOverview = () => {
  const totalBalance = bankingState.accounts.reduce(
    (sum, account) => sum + Number(account.balance || 0),
    0
  );
  const availableBalance = bankingState.accounts.reduce(
    (sum, account) => sum + Number(account.availableBalance || 0),
    0
  );
  const unreconciledValue = bankingState.reconciliations.reduce(
    (sum, reconciliation) => sum + Math.abs(Number(reconciliation.difference || 0)),
    0
  );
  const outstandingChecks = bankingState.checks.filter((check) =>
    ['prepared', 'issued', 'bounced'].includes(check.status)
  );
  const transfersAwaitingApproval = bankingState.transfers.filter(
    (transfer) => transfer.status === 'pending_approval'
  );

  return {
    totalBalance,
    availableBalance,
    unreconciledValue,
    outstandingCheckValue: outstandingChecks.reduce(
      (sum, check) => sum + Number(check.amount || 0),
      0
    ),
    outstandingCheckCount: outstandingChecks.length,
    transfersAwaitingApproval: transfersAwaitingApproval.length,
    transfersInTransit: bankingState.transfers.filter(
      (transfer) => transfer.status === 'in_transit'
    ).length,
    importedStatements: bankingState.statements.length,
  };
};

export const getBankingAlerts = () => {
  const alerts = [];

  bankingState.accounts.forEach((account) => {
    if (account.feedStatus !== 'healthy' && account.allowReconciliation) {
      alerts.push({
        id: `feed-${account.id}`,
        severity: account.feedStatus === 'warning' ? 'warning' : 'info',
        title: `${account.name} feed requires attention`,
        description: `Last sync ${account.lastSyncAt ? new Date(account.lastSyncAt).toLocaleString() : 'not available'} via ${account.feedProvider}.`,
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

  bankingState.checks
    .filter((check) => check.status === 'bounced')
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

export const createBankAccount = (draft) => {
  updateState((state) => {
    const generatedCode =
      draft.code || `BANK-${String(state.accounts.length + 1).padStart(3, '0')}`;
    const generatedId =
      state.accounts.reduce((maxId, account) => Math.max(maxId, Number(account.id || 0)), 0) + 1;

    state.accounts.unshift({
      id: generatedId,
      code: generatedCode,
      name: draft.name,
      bankName: draft.bankName,
      currency: draft.currency || 'BDT',
      accountNumber: draft.accountNumber,
      maskedNumber: `****${accountNumberSuffix(draft.accountNumber)}`,
      balance: Number(draft.openingBalance || 0),
      pendingBalance: 0,
      overdraftLimit: Number(draft.overdraftLimit || 0),
      feedStatus: draft.feedEnabled ? 'healthy' : 'manual',
      lastSyncAt: draft.feedEnabled ? `${TODAY}T08:00:00` : '',
      owner: draft.owner || 'Treasury Desk',
      journal: draft.journal || 'Bank Journal',
      type: 'bank',
      allowReconciliation: true,
      feedProvider: draft.feedEnabled ? draft.feedProvider || 'Bank feed API' : 'Manual Upload',
      statementFrequency: draft.statementFrequency || 'Daily',
    });
  });
};

export const syncBankFeed = (accountId) => {
  updateState((state) => {
    state.accounts = state.accounts.map((account) =>
      account.id === accountId
        ? { ...account, feedStatus: 'healthy', lastSyncAt: `${TODAY}T17:45:00` }
        : account
    );
  });
};

const parseImportedLines = (rawValue, statementId) => {
  const entries = String(rawValue || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [date, description, reference, amount] = line.split('|').map((part) => part.trim());
      return {
        date: toIsoDate(date),
        description: description || 'Imported transaction',
        reference: reference || nextId('REF').toUpperCase(),
        amount: Number(amount || 0),
      };
    });

  const source = entries.length
    ? entries
    : [
        {
          date: TODAY,
          description: 'Imported cash collection',
          reference: nextId('COL').toUpperCase(),
          amount: 18000,
        },
        {
          date: TODAY,
          description: 'Imported bank charge',
          reference: nextId('FEE').toUpperCase(),
          amount: -180,
        },
        {
          date: TODAY,
          description: 'Imported supplier transfer',
          reference: nextId('SUP').toUpperCase(),
          amount: -7400,
        },
      ];

  return source.map((line, index) => buildStatementLine(line, statementId, index));
};

const detectDuplicateImportedLines = (lines, bankAccountId) => {
  const existingReferences = new Set(
    bankingState.statements
      .filter((statement) => statement.bankAccountId === Number(bankAccountId))
      .flatMap((statement) =>
        statement.lines.map((line) => String(line.reference || '').toLowerCase())
      )
  );
  const seenReferences = new Set();

  return lines.map((line) => {
    const referenceKey = String(line.reference || '').toLowerCase();
    const isDuplicate =
      referenceKey && (existingReferences.has(referenceKey) || seenReferences.has(referenceKey));

    if (referenceKey) {
      seenReferences.add(referenceKey);
    }

    if (!isDuplicate) return line;

    return {
      ...line,
      status: 'duplicate',
      recommendation: 'Potential duplicate detected during import',
      recommendationType: 'manual',
      confidence: 99,
      counterpartLabel: 'Review duplicate before reconciliation',
      note: 'Reference already exists in statement history for this account',
    };
  });
};

export const importBankStatement = (draft) => {
  const statementId = Number(String(nextId('statement')).replace(/\D/g, '').slice(-6));
  const lines = detectDuplicateImportedLines(
    parseImportedLines(draft.itemsText, statementId),
    draft.bankAccountId
  );
  const account = bankingState.accounts.find((item) => item.id === Number(draft.bankAccountId));
  const startingBalance = Number(draft.openingBalance || account?.balance || 0);
  const calculatedClosing =
    startingBalance + lines.reduce((sum, line) => sum + Number(line.amount || 0), 0);

  updateState((state) => {
    state.statements.unshift({
      id: statementId,
      bankAccountId: Number(draft.bankAccountId),
      bankAccountName: account?.name || 'Bank account',
      period: draft.period,
      startDate: toIsoDate(draft.startDate),
      endDate: toIsoDate(draft.endDate),
      statementDate: toIsoDate(draft.statementDate || draft.endDate),
      openingBalance: startingBalance,
      closingBalance: Number(draft.closingBalance || calculatedClosing),
      importedLines: lines.length,
      status: 'imported',
      source: draft.source,
      parser: draft.parser,
      mappingProfile: draft.mappingProfile,
      duplicateCount: lines.filter((line) => line.status === 'duplicate').length,
      unmatchedCount: lines.filter((line) => !isResolvedLine(line.status)).length,
      lastImportAt: `${TODAY}T12:15:00`,
      feedBatch: nextId('BATCH').toUpperCase(),
      lines,
    });

    state.reconciliations.unshift({
      id:
        state.reconciliations.reduce((maxId, item) => Math.max(maxId, Number(item.id || 0)), 0) + 1,
      bankAccountId: Number(draft.bankAccountId),
      bankAccountName: account?.name || 'Bank account',
      statementId,
      period: draft.period,
      statementBalance: Number(draft.closingBalance || calculatedClosing),
      bookBalance: Number(account?.balance || 0),
      difference: lines
        .filter((line) => !isResolvedLine(line.status))
        .reduce((sum, line) => sum + Number(line.amount || 0), 0),
      status: 'imported',
      autoMatchRate: 0,
    });
  });

  return statementId;
};

export const runStatementAutoMatch = (statementId) => {
  updateState((state) => {
    state.statements = state.statements.map((statement) => {
      if (statement.id !== statementId) return statement;

      return {
        ...statement,
        lines: statement.lines.map((line) => {
          if (line.status !== 'suggested') return line;
          if (line.recommendationType === 'writeoff' && line.confidence >= 90) {
            return {
              ...line,
              status: 'writeoff',
              note: 'Auto-applied bank charge model',
            };
          }

          if (line.recommendationType === 'counterpart' && line.confidence >= 80) {
            return {
              ...line,
              status: 'counterpart_created',
              note: `Auto-created ${line.counterpartLabel}`,
            };
          }

          return line;
        }),
      };
    });
  });
};

export const applyStatementAction = ({
  statementId,
  lineIds,
  action,
  modelId,
  counterpartLabel,
  note,
}) => {
  updateState((state) => {
    state.statements = state.statements.map((statement) => {
      if (statement.id !== statementId) return statement;

      return {
        ...statement,
        lines: statement.lines.map((line) => {
          if (!lineIds.includes(line.id)) return line;

          if (action === 'match') {
            return {
              ...line,
              status: 'matched',
              note: note || 'Matched to book item',
              matchReference: line.reference,
            };
          }

          if (action === 'writeoff') {
            const model = state.models.find((item) => item.id === Number(modelId));
            return {
              ...line,
              status: 'writeoff',
              ruleId: model?.id || line.ruleId,
              counterpartLabel: model?.account || line.counterpartLabel,
              note: note || model?.name || 'Write-off applied',
            };
          }

          if (action === 'counterpart') {
            return {
              ...line,
              status: 'counterpart_created',
              counterpartLabel: counterpartLabel || line.counterpartLabel,
              note: note || `Counterpart created in ${counterpartLabel || line.counterpartLabel}`,
            };
          }

          return line;
        }),
      };
    });
  });
};

export const createReconciliationModel = (draft) => {
  updateState((state) => {
    state.models.unshift({
      id: state.models.reduce((maxId, model) => Math.max(maxId, Number(model.id || 0)), 0) + 1,
      name: draft.name,
      type: draft.type,
      matchLabel: draft.matchLabel,
      matchJournal: draft.matchJournal,
      account: draft.account,
      tax: draft.tax || '',
      autoValidate: Boolean(draft.autoValidate),
      active: true,
    });
  });
};

export const finalizeReconciliation = (statementId) => {
  let completed = false;

  updateState((state) => {
    const statement = state.statements.find((item) => item.id === statementId);
    const unresolved = statement?.lines.filter((line) => !isResolvedLine(line.status)).length || 0;

    if (unresolved === 0) {
      state.statements = state.statements.map((item) =>
        item.id === statementId ? { ...item, status: 'completed' } : item
      );
      completed = true;
    }
  });

  return completed;
};

export const createCheck = (draft) => {
  updateState((state) => {
    const number = `CHK-2026-${String(state.checks.length + 1010).padStart(4, '0')}`;
    state.checks.unshift({
      id: nextId('check'),
      checkNumber: number,
      payee: draft.payee,
      amount: Number(draft.amount || 0),
      issueDate: toIsoDate(draft.issueDate),
      dueDate: toIsoDate(draft.dueDate || draft.issueDate),
      status: 'prepared',
      bankAccountId: Number(draft.bankAccountId),
      bankName: getAccountName(Number(draft.bankAccountId)),
      memo: draft.memo,
      owner: draft.owner,
      printStatus: 'pending',
      printCount: 0,
      lastActionAt: `${TODAY}T10:30:00`,
      paymentReference: draft.paymentReference,
    });
  });
};

export const updateCheckStatus = (checkId, nextStatus) => {
  updateState((state) => {
    state.checks = state.checks.map((check) =>
      check.id === checkId
        ? { ...check, status: nextStatus, lastActionAt: `${TODAY}T16:00:00` }
        : check
    );
  });
};

export const printCheck = (checkId) => {
  updateState((state) => {
    state.checks = state.checks.map((check) =>
      check.id === checkId
        ? {
            ...check,
            printStatus: 'printed',
            printCount: Number(check.printCount || 0) + 1,
            lastActionAt: `${TODAY}T14:45:00`,
          }
        : check
    );
  });
};

export const createTransfer = (draft) => {
  updateState((state) => {
    state.transfers.unshift({
      id: nextId('transfer'),
      reference: `TRF-2026-${String(state.transfers.length + 41).padStart(3, '0')}`,
      fromAccountId: Number(draft.fromAccountId),
      toAccountId: Number(draft.toAccountId),
      amount: Number(draft.amount || 0),
      requestedDate: toIsoDate(draft.requestedDate),
      scheduledDate: toIsoDate(draft.scheduledDate || draft.requestedDate),
      postedDate: '',
      status: 'pending_approval',
      owner: draft.owner,
      approver: draft.approver,
      priority: draft.priority,
      purpose: draft.purpose,
      traceCode: nextId('trace').toUpperCase(),
      journalEntry: '',
    });
  });
};

export const advanceTransferStatus = (transferId, nextStatus) => {
  updateState((state) => {
    state.transfers = state.transfers.map((transfer) => {
      if (transfer.id !== transferId) return transfer;

      const updates = {
        status: nextStatus,
        postedDate:
          nextStatus === 'approved'
            ? transfer.postedDate
            : ['in_transit', 'completed'].includes(nextStatus)
              ? TODAY
              : '',
        journalEntry:
          nextStatus === 'in_transit' || nextStatus === 'completed'
            ? transfer.journalEntry || `JE-${transfer.reference}`
            : transfer.journalEntry,
      };

      return {
        ...transfer,
        ...updates,
      };
    });
  });
};

export const getBankingWorkspaceSnapshot = () => ({
  overview: getBankingOverview(),
  alerts: getBankingAlerts(),
  accounts: getBankingAccounts(),
  statements: getBankingStatements(),
  reconciliations: getBankingReconciliations(),
  models: getReconciliationModels(),
  checks: getBankingChecks(),
  transfers: getBankingTransfers(),
});

export const formatBankingStatus = startCase;
