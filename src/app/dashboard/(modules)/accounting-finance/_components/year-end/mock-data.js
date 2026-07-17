import {
  ACCOUNTING_MOCK_ACCOUNTS,
  ACCOUNTING_MOCK_FISCAL_YEARS,
  ACCOUNTING_MOCK_ACCOUNT_TYPES,
  ACCOUNTING_MOCK_FISCAL_PERIODS,
  ACCOUNTING_MOCK_YEAR_END_CLOSINGS,
} from '../demo-data';

const REPORT_DATE = '2026-03-29';

const yearEndWorkspaceListeners = new Set();

let yearEndWorkspaceVersion = 0;
let selectedFiscalYearId =
  ACCOUNTING_MOCK_FISCAL_YEARS.find((year) => year.status === 'active')?.id ||
  ACCOUNTING_MOCK_FISCAL_YEARS[0]?.id ||
  null;
const closingStepOverrides = new Map();
const fiscalYearOverrides = new Map();
const fiscalPeriodOverrides = new Map();
const openingEntryBatches = new Map();
let yearEndClosingOverrides = [...ACCOUNTING_MOCK_YEAR_END_CLOSINGS];
const closingValidationOverrides = new Map();
const closingEntryOverrides = new Map();
const reopenRequestOverrides = new Map();
const exceptionPermissionOverrides = new Map();
let lockHistoryOverrides = [];
let yearEndAuditTrailOverrides = [];

function emitYearEndWorkspaceChange() {
  yearEndWorkspaceVersion += 1;
  yearEndWorkspaceListeners.forEach((listener) => listener());
}

function getAccountType(typeId) {
  return ACCOUNTING_MOCK_ACCOUNT_TYPES.find((type) => type.id === typeId) || null;
}

function getFiscalYearById(yearId) {
  return getYearEndFiscalYears().find((year) => year.id === yearId) || null;
}

function getYearPeriods(yearId) {
  return ACCOUNTING_MOCK_FISCAL_PERIODS.map((period) => ({
    ...period,
    ...(fiscalPeriodOverrides.get(period.id) || {}),
  })).filter((period) => period.fiscal_year_id === yearId);
}

function getAuditTrailForYear(yearId) {
  const fiscalYear = getFiscalYearById(yearId);
  const closeRecord = getClosingHistoryRecord(yearId);

  const derivedEvents = [
    {
      id: `audit-seed-review-${yearId}`,
      fiscal_year_id: yearId,
      timestamp: `${yearId}-12-29 17:45`,
      actor: 'Finance Controller',
      action: 'Controller review prepared',
      detail: `Pre-close review compiled for ${fiscalYear?.name || 'selected year'}.`,
      status: 'complete',
    },
  ];

  if (closeRecord) {
    derivedEvents.push({
      id: `audit-close-${yearId}`,
      fiscal_year_id: yearId,
      timestamp: `${closeRecord.closing_date} 18:00`,
      actor: closeRecord.closed_by,
      action: 'Year-end close published',
      detail: `Close certificate published for ${closeRecord.fiscal_year}.`,
      status: 'complete',
    });
  }

  return [
    ...yearEndAuditTrailOverrides.filter((event) => event.fiscal_year_id === yearId),
    ...derivedEvents,
  ].sort((left, right) => right.timestamp.localeCompare(left.timestamp));
}

function getDefaultExceptionPermissions(yearId) {
  const fiscalYear = getFiscalYearById(yearId);

  return [
    {
      id: `exception-${yearId}-1`,
      role: 'Finance Controller',
      scope: 'soft-lock override',
      reason: `Adjusting entries during ${fiscalYear?.name || 'current year'} close review`,
      active: true,
    },
    {
      id: `exception-${yearId}-2`,
      role: 'CFO',
      scope: 'hard-close reopen approval',
      reason: 'Approves reopen only when audit evidence is complete',
      active: true,
    },
  ];
}

function getExceptionPermissionsForYear(yearId) {
  return exceptionPermissionOverrides.get(yearId) || getDefaultExceptionPermissions(yearId);
}

function getClosingEntriesForYear(yearId) {
  const existingEntries = closingEntryOverrides.get(yearId);
  if (existingEntries) return existingEntries;

  const overview = getYearEndOverview(yearId);
  const fiscalYear = getFiscalYearById(yearId);
  const retainedAmount = Math.abs(overview.retainedEarnings);

  return [
    {
      id: `close-income-${yearId}`,
      journal: 'Year-End Closing Journal',
      account_code: '499900',
      account_name: 'Income Summary',
      reference: `CLOSE-${yearId}-REV`,
      debit: overview.totalIncome,
      credit: 0,
      status: 'draft',
      note: `Close revenue accounts for ${fiscalYear?.name || yearId}`,
    },
    {
      id: `close-expense-${yearId}`,
      journal: 'Year-End Closing Journal',
      account_code: '599900',
      account_name: 'Expense Summary',
      reference: `CLOSE-${yearId}-EXP`,
      debit: 0,
      credit: overview.totalExpenses,
      status: 'draft',
      note: `Close expense accounts for ${fiscalYear?.name || yearId}`,
    },
    {
      id: `close-equity-${yearId}`,
      journal: 'Year-End Closing Journal',
      account_code: '320000',
      account_name: 'Retained Earnings',
      reference: `CLOSE-${yearId}-RE`,
      debit: overview.retainedEarnings < 0 ? retainedAmount : 0,
      credit: overview.retainedEarnings >= 0 ? retainedAmount : 0,
      status: 'draft',
      note: 'Auto-generated equity transfer from fiscal year result',
    },
  ];
}

function getClosingValidationForYear(yearId) {
  const periods = getYearPeriods(yearId);
  const openPeriods = periods.filter((period) => period.status !== 'closed');
  const openingBatch = buildOpeningEntryBatch(yearId);
  const closeRecord = getClosingHistoryRecord(yearId);
  const overrides = closingValidationOverrides.get(yearId) || {};

  const checks = [
    {
      id: 'period-posture',
      label: 'Period posture',
      status: openPeriods.length === 0 ? 'pass' : 'warning',
      detail:
        openPeriods.length === 0
          ? 'All fiscal periods are locked for the selected year.'
          : `${openPeriods.length} periods still allow postings before publish.`,
    },
    {
      id: 'opening-batch',
      label: 'Opening batch generation',
      status:
        openingBatch.batchStatus === 'posted'
          ? 'pass'
          : openingBatch.batchStatus === 'generated'
            ? 'warning'
            : 'fail',
      detail: `Opening batch status is ${openingBatch.batchStatus}.`,
    },
    {
      id: 'exception-rights',
      label: 'Exception permissions',
      status: getExceptionPermissionsForYear(yearId).some((item) => item.active)
        ? 'pass'
        : 'warning',
      detail: `${getExceptionPermissionsForYear(yearId).filter((item) => item.active).length} exception roles remain active for controlled close intervention.`,
    },
    {
      id: 'close-publish',
      label: 'Close certificate',
      status: closeRecord ? 'pass' : 'warning',
      detail: closeRecord
        ? `Published on ${closeRecord.closing_date}.`
        : 'Close certificate has not been published yet.',
    },
  ];

  return {
    validatedAt: overrides.validatedAt || '',
    validatedBy: overrides.validatedBy || '',
    checks,
  };
}

function deriveOpeningEntries(yearId) {
  const nextYear = yearId + 1;

  return ACCOUNTING_MOCK_ACCOUNTS.filter((account) => {
    const type = getAccountType(account.type_id);
    return type?.category === 'balance_sheet' && Math.abs(account.balance || 0) > 0;
  }).map((account) => ({
    id: `opening-${yearId}-${account.id}`,
    fiscal_year_id: yearId,
    target_fiscal_year_id: nextYear,
    account_id: account.id,
    account_code: account.code,
    account_name: account.name,
    date: `${nextYear}-01-01`,
    reference: `OPEN-${nextYear}-${account.code}`,
    debit: account.balance > 0 ? Math.abs(account.balance) : 0,
    credit: account.balance < 0 ? Math.abs(account.balance) : 0,
    status: 'draft',
    source: 'Year-end carry forward',
  }));
}

function buildOpeningEntryBatch(yearId) {
  const existingBatch = openingEntryBatches.get(yearId);
  if (existingBatch) return existingBatch;

  return {
    fiscalYearId: yearId,
    generatedAt: '',
    generatedBy: 'Pending',
    batchStatus: 'draft',
    entries: deriveOpeningEntries(yearId),
  };
}

function getClosingHistoryRecord(yearId) {
  const fiscalYear = getFiscalYearById(yearId);
  return yearEndClosingOverrides.find(
    (record) => record.fiscal_year_id === yearId || record.fiscal_year === fiscalYear?.name
  );
}

export function getYearEndFiscalYears() {
  return ACCOUNTING_MOCK_FISCAL_YEARS.map((year) => ({
    ...year,
    ...(fiscalYearOverrides.get(year.id) || {}),
  }));
}

export function getSelectedFiscalYearId() {
  return selectedFiscalYearId;
}

export function getYearEndOverview(yearId = selectedFiscalYearId) {
  const incomeAccounts = ACCOUNTING_MOCK_ACCOUNTS.filter(
    (account) => getAccountType(account.type_id)?.nature === 'income'
  );
  const expenseAccounts = ACCOUNTING_MOCK_ACCOUNTS.filter(
    (account) => getAccountType(account.type_id)?.nature === 'expense'
  );
  const periods = getYearPeriods(yearId);
  const openingBatch = buildOpeningEntryBatch(yearId);

  const totalIncome = incomeAccounts.reduce(
    (sum, account) => sum + Math.abs(account.balance || 0),
    0
  );
  const totalExpenses = expenseAccounts.reduce(
    (sum, account) => sum + Math.abs(account.balance || 0),
    0
  );
  const retainedEarnings = totalIncome - totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    retainedEarnings,
    closedPeriods: periods.filter((period) => period.status === 'closed').length,
    totalPeriods: periods.length,
    openingEntries: openingBatch.entries.length,
    batchStatus: openingBatch.batchStatus,
  };
}

export function getYearEndClosingSteps(yearId = selectedFiscalYearId) {
  const overview = getYearEndOverview(yearId);
  const currentStep = closingStepOverrides.get(yearId) || 0;
  const closingRecord = getClosingHistoryRecord(yearId);

  return [
    {
      id: 'review',
      label: 'Review Period',
      description: 'Verify reconciliations, open exceptions, and posted journals before close.',
      helper: `${overview.closedPeriods}/${overview.totalPeriods} periods already locked`,
      status: currentStep > 0 || overview.closedPeriods >= 2 ? 'complete' : 'current',
    },
    {
      id: 'adjustments',
      label: 'Post Adjustments',
      description: 'Confirm accruals, deferrals, depreciation, and manual close notes.',
      helper: 'Mock close pack assumes adjustments are documented in controller review.',
      status: currentStep > 1 ? 'complete' : currentStep === 1 ? 'current' : 'upcoming',
    },
    {
      id: 'close-pnl',
      label: 'Close Income and Expense',
      description: 'Transfer current-year P&L movement into retained earnings.',
      helper: `Net transfer ${overview.retainedEarnings >= 0 ? 'gain' : 'loss'} ${Math.abs(overview.retainedEarnings).toLocaleString('en-US')}`,
      status: currentStep > 2 ? 'complete' : currentStep === 2 ? 'current' : 'upcoming',
    },
    {
      id: 'opening',
      label: 'Generate Opening Entries',
      description: 'Carry forward balance-sheet accounts into the next fiscal year.',
      helper: `${overview.openingEntries} opening balances prepared`,
      status:
        openingBatchReady(yearId) || currentStep > 3
          ? 'complete'
          : currentStep === 3
            ? 'current'
            : 'upcoming',
    },
    {
      id: 'lock',
      label: 'Lock Periods and Publish',
      description: 'Freeze the fiscal year and publish the close certificate.',
      helper: closingRecord
        ? `Closed on ${closingRecord.closing_date}`
        : 'Close certificate not published yet',
      status: closingRecord ? 'complete' : currentStep >= 4 ? 'current' : 'upcoming',
    },
  ];
}

function openingBatchReady(yearId) {
  return buildOpeningEntryBatch(yearId).batchStatus !== 'draft';
}

export function getYearEndAlerts(yearId = selectedFiscalYearId) {
  const overview = getYearEndOverview(yearId);
  const openPeriods = getYearPeriods(yearId).filter((period) => period.status !== 'closed');

  return [
    {
      id: 'close-alert-1',
      severity: openPeriods.length ? 'warning' : 'success',
      title: openPeriods.length
        ? `${openPeriods.length} periods still allow postings`
        : 'All periods in scope are locked',
      description: openPeriods.length
        ? 'Complete treasury, reconciliation, and controller review before publishing the year-end close.'
        : 'Period posture is ready for year-end certification.',
    },
    {
      id: 'close-alert-2',
      severity: overview.retainedEarnings >= 0 ? 'info' : 'warning',
      title:
        overview.retainedEarnings >= 0
          ? 'Fiscal year closes with net surplus'
          : 'Fiscal year closes with net deficit',
      description: `Retained earnings movement is ${overview.retainedEarnings >= 0 ? 'positive' : 'negative'} based on seeded income and expense balances.`,
    },
    {
      id: 'close-alert-3',
      severity: openingBatchReady(yearId) ? 'success' : 'info',
      title: openingBatchReady(yearId)
        ? 'Opening entry pack is prepared'
        : 'Opening balances still need generation',
      description: openingBatchReady(yearId)
        ? 'Opening entries are available for finance review and export.'
        : 'Generate the next-year opening pack once close review is complete.',
    },
  ];
}

export function getYearEndClosingHistory() {
  return [...yearEndClosingOverrides].sort((left, right) =>
    right.closing_date.localeCompare(left.closing_date)
  );
}

export function getYearEndOpeningEntries(yearId = selectedFiscalYearId) {
  return buildOpeningEntryBatch(yearId);
}

export function getYearEndPeriods(yearId = selectedFiscalYearId) {
  return getYearPeriods(yearId).map((period) => ({
    ...period,
    lockType: period.status === 'closed' ? 'hard' : 'soft',
    canLock: period.status !== 'closed',
  }));
}

export function getYearEndLockSummary(yearId = selectedFiscalYearId) {
  const periods = getYearPeriods(yearId);
  const closedPeriods = periods.filter((period) => period.status === 'closed');
  const latestClosedPeriod = closedPeriods[closedPeriods.length - 1];

  return [
    {
      id: 'soft-lock',
      name: 'Soft lock',
      type: 'soft',
      lock_date: latestClosedPeriod?.end_date || REPORT_DATE,
      description: 'Stops standard posting while allowing controller intervention.',
    },
    {
      id: 'hard-lock',
      name: 'Hard close',
      type: 'hard',
      lock_date: periods.every((period) => period.status === 'closed')
        ? periods[periods.length - 1]?.end_date || REPORT_DATE
        : 'Pending final close',
      description: 'Final year-end freeze after certificate publication.',
    },
  ];
}

export function getYearEndValidationChecks(yearId = selectedFiscalYearId) {
  return getClosingValidationForYear(yearId);
}

export function getYearEndClosingEntries(yearId = selectedFiscalYearId) {
  return getClosingEntriesForYear(yearId);
}

export function getYearEndAuditTrail(yearId = selectedFiscalYearId) {
  return getAuditTrailForYear(yearId);
}

export function getYearEndReopenStatus(yearId = selectedFiscalYearId) {
  return reopenRequestOverrides.get(yearId) || null;
}

export function getYearEndExceptionPermissions(yearId = selectedFiscalYearId) {
  return getExceptionPermissionsForYear(yearId);
}

export function getYearEndLockHistory(yearId = selectedFiscalYearId) {
  return lockHistoryOverrides
    .filter((entry) => entry.fiscal_year_id === yearId)
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp));
}

export function getYearEndCloseCalendar(yearId = selectedFiscalYearId) {
  return getYearPeriods(yearId).map((period, index) => ({
    id: `calendar-${period.id}`,
    period_id: period.id,
    name: period.name,
    close_window: `${period.end_date} 17:00`,
    review_owner:
      index % 3 === 0 ? 'Treasury Lead' : index % 3 === 1 ? 'GL Controller' : 'Reporting Manager',
    checklist:
      period.status === 'closed'
        ? 'Certified and locked'
        : 'Pending review, lock, and evidence pack',
    status: period.status,
  }));
}

export function subscribeYearEndWorkspace(listener) {
  yearEndWorkspaceListeners.add(listener);

  return () => {
    yearEndWorkspaceListeners.delete(listener);
  };
}

export function getYearEndWorkspaceVersion() {
  return yearEndWorkspaceVersion;
}

export function selectYearEndFiscalYear(yearId) {
  selectedFiscalYearId = yearId;
  emitYearEndWorkspaceChange();
}

export function advanceYearEndStep(yearId = selectedFiscalYearId) {
  const currentStep = closingStepOverrides.get(yearId) || 0;
  closingStepOverrides.set(yearId, Math.min(currentStep + 1, 4));
  yearEndAuditTrailOverrides = [
    {
      id: `audit-step-${yearId}-${currentStep + 1}`,
      fiscal_year_id: yearId,
      timestamp: `${REPORT_DATE} 12:${String(currentStep + 1).padStart(2, '0')}`,
      actor: 'Finance Controller',
      action: 'Close step reviewed',
      detail: `Workflow advanced to step ${Math.min(currentStep + 1, 4)}.`,
      status: 'complete',
    },
    ...yearEndAuditTrailOverrides,
  ];
  emitYearEndWorkspaceChange();
}

export function validateYearEndClosing(yearId = selectedFiscalYearId) {
  closingValidationOverrides.set(yearId, {
    validatedAt: `${REPORT_DATE} 16:30`,
    validatedBy: 'Finance Controller',
  });

  closingEntryOverrides.set(
    yearId,
    getClosingEntriesForYear(yearId).map((entry) => ({
      ...entry,
      status: 'validated',
    }))
  );

  yearEndAuditTrailOverrides = [
    {
      id: `audit-validate-${yearId}`,
      fiscal_year_id: yearId,
      timestamp: `${REPORT_DATE} 16:30`,
      actor: 'Finance Controller',
      action: 'Close validation completed',
      detail: 'Validation checks passed and auto-generated closing entries were prepared.',
      status: 'complete',
    },
    ...yearEndAuditTrailOverrides,
  ];

  emitYearEndWorkspaceChange();
}

export function generateYearEndOpeningEntries(yearId = selectedFiscalYearId) {
  const draftEntries = deriveOpeningEntries(yearId).map((entry) => ({
    ...entry,
    status: 'generated',
  }));

  openingEntryBatches.set(yearId, {
    fiscalYearId: yearId,
    generatedAt: REPORT_DATE,
    generatedBy: 'Finance Controller',
    batchStatus: 'generated',
    entries: draftEntries,
  });

  closingStepOverrides.set(yearId, Math.max(closingStepOverrides.get(yearId) || 0, 4));
  yearEndAuditTrailOverrides = [
    {
      id: `audit-opening-${yearId}`,
      fiscal_year_id: yearId,
      timestamp: `${REPORT_DATE} 17:00`,
      actor: 'Finance Controller',
      action: 'Opening entries generated',
      detail: `${draftEntries.length} opening balances prepared for next fiscal year.`,
      status: 'complete',
    },
    ...yearEndAuditTrailOverrides,
  ];
  emitYearEndWorkspaceChange();
}

export function publishYearEndOpeningEntries(yearId = selectedFiscalYearId) {
  const batch = buildOpeningEntryBatch(yearId);

  openingEntryBatches.set(yearId, {
    ...batch,
    batchStatus: 'posted',
    generatedAt: batch.generatedAt || REPORT_DATE,
    generatedBy: batch.generatedBy || 'Finance Controller',
    entries: batch.entries.map((entry) => ({
      ...entry,
      status: 'posted',
    })),
  });

  yearEndAuditTrailOverrides = [
    {
      id: `audit-opening-post-${yearId}`,
      fiscal_year_id: yearId,
      timestamp: `${REPORT_DATE} 17:20`,
      actor: 'Finance Controller',
      action: 'Opening entries published',
      detail: 'Carry-forward balances posted to the next fiscal year.',
      status: 'complete',
    },
    ...yearEndAuditTrailOverrides,
  ];

  emitYearEndWorkspaceChange();
}

export function lockYearEndPeriod(periodId) {
  const period = ACCOUNTING_MOCK_FISCAL_PERIODS.find((item) => item.id === periodId);
  if (!period) return;

  fiscalPeriodOverrides.set(periodId, {
    ...fiscalPeriodOverrides.get(periodId),
    status: 'closed',
  });

  lockHistoryOverrides = [
    {
      id: `lock-${periodId}`,
      fiscal_year_id: period.fiscal_year_id,
      period_name: period.name,
      action: 'Locked period',
      actor: 'Finance Controller',
      timestamp: `${REPORT_DATE} 18:10`,
      lock_type: 'soft',
    },
    ...lockHistoryOverrides,
  ];

  yearEndAuditTrailOverrides = [
    {
      id: `audit-lock-${periodId}`,
      fiscal_year_id: period.fiscal_year_id,
      timestamp: `${REPORT_DATE} 18:10`,
      actor: 'Finance Controller',
      action: 'Fiscal period locked',
      detail: `${period.name} was locked as part of year-end close posture.`,
      status: 'complete',
    },
    ...yearEndAuditTrailOverrides,
  ];

  emitYearEndWorkspaceChange();
}

export function lockAllYearEndPeriods(yearId = selectedFiscalYearId) {
  getYearPeriods(yearId).forEach((period) => {
    fiscalPeriodOverrides.set(period.id, {
      ...fiscalPeriodOverrides.get(period.id),
      status: 'closed',
    });
  });

  lockHistoryOverrides = [
    {
      id: `lock-all-${yearId}`,
      fiscal_year_id: yearId,
      period_name: 'All fiscal periods',
      action: 'Bulk lock',
      actor: 'Finance Controller',
      timestamp: `${REPORT_DATE} 18:20`,
      lock_type: 'hard',
    },
    ...lockHistoryOverrides,
  ];

  emitYearEndWorkspaceChange();
}

export function updateYearEndExceptionPermission(
  yearId = selectedFiscalYearId,
  permissionId,
  active
) {
  const nextPermissions = getExceptionPermissionsForYear(yearId).map((permission) =>
    permission.id === permissionId ? { ...permission, active } : permission
  );

  exceptionPermissionOverrides.set(yearId, nextPermissions);
  yearEndAuditTrailOverrides = [
    {
      id: `audit-exception-${yearId}-${permissionId}-${active ? 'on' : 'off'}`,
      fiscal_year_id: yearId,
      timestamp: `${REPORT_DATE} 18:30`,
      actor: 'Finance Controller',
      action: active ? 'Exception permission enabled' : 'Exception permission revoked',
      detail: `Permission ${permissionId} set to ${active ? 'active' : 'inactive'}.`,
      status: 'complete',
    },
    ...yearEndAuditTrailOverrides,
  ];

  emitYearEndWorkspaceChange();
}

export function reopenYearEndClosing(
  yearId = selectedFiscalYearId,
  reason = 'Adjustment required'
) {
  const fiscalYear = getFiscalYearById(yearId);
  if (!fiscalYear) return;

  reopenRequestOverrides.set(yearId, {
    requestedAt: `${REPORT_DATE} 18:45`,
    requestedBy: 'CFO',
    reason,
    status: 'approved',
  });

  fiscalYearOverrides.set(yearId, {
    ...fiscalYearOverrides.get(yearId),
    status: 'active',
    closed_by: '',
  });

  const latestPeriod = getYearPeriods(yearId)[getYearPeriods(yearId).length - 1];
  if (latestPeriod) {
    fiscalPeriodOverrides.set(latestPeriod.id, {
      ...fiscalPeriodOverrides.get(latestPeriod.id),
      status: 'active',
    });
  }

  yearEndClosingOverrides = yearEndClosingOverrides.filter(
    (record) => record.fiscal_year_id !== yearId && record.fiscal_year !== fiscalYear.name
  );

  yearEndAuditTrailOverrides = [
    {
      id: `audit-reopen-${yearId}`,
      fiscal_year_id: yearId,
      timestamp: `${REPORT_DATE} 18:45`,
      actor: 'CFO',
      action: 'Year-end close reopened',
      detail: reason,
      status: 'warning',
    },
    ...yearEndAuditTrailOverrides,
  ];

  emitYearEndWorkspaceChange();
}

export function completeYearEndClosing(yearId = selectedFiscalYearId) {
  const fiscalYear = getFiscalYearById(yearId);
  if (!fiscalYear) return;

  validateYearEndClosing(yearId);
  generateYearEndOpeningEntries(yearId);
  publishYearEndOpeningEntries(yearId);
  lockAllYearEndPeriods(yearId);

  closingEntryOverrides.set(
    yearId,
    getClosingEntriesForYear(yearId).map((entry) => ({
      ...entry,
      status: 'posted',
    }))
  );

  fiscalYearOverrides.set(yearId, {
    ...fiscalYearOverrides.get(yearId),
    status: 'closed',
    closed_by: 'Finance Controller',
  });

  yearEndClosingOverrides = [
    {
      id: `closing-${yearId}`,
      fiscal_year_id: yearId,
      fiscal_year: fiscalYear.name,
      status: 'closed',
      closing_date: `${yearId}-12-31`,
      closed_by: 'Finance Controller',
      retained_earnings: getYearEndOverview(yearId).retainedEarnings,
    },
    ...yearEndClosingOverrides.filter(
      (record) => record.fiscal_year_id !== yearId && record.fiscal_year !== fiscalYear.name
    ),
  ];

  closingStepOverrides.set(yearId, 4);
  emitYearEndWorkspaceChange();
}
