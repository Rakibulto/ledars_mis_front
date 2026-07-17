import {
  ACCOUNTING_MOCK_ACCOUNTS,
  ACCOUNTING_MOCK_JOURNALS,
  ACCOUNTING_MOCK_FISCAL_YEARS,
  ACCOUNTING_MOCK_FISCAL_PERIODS,
  ACCOUNTING_MOCK_JOURNAL_ENTRIES,
} from '../demo-data';

const listeners = new Set();

let workspaceVersion = 0;
let sequence = 1500;

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

const nextId = () => {
  sequence += 1;
  return sequence;
};

const buildFiscalYearBounds = (year) => {
  const numericYear = Number(String(year.name || year.id).match(/(\d{4})/)?.[1] || year.id || 2026);

  return {
    start_date: year.start_date || `${numericYear}-01-01`,
    end_date: year.end_date || `${numericYear}-12-31`,
  };
};

const enrichJournals = (journals, accounts, entries) =>
  journals.map((journal) => {
    const journalEntries = entries.filter(
      (entry) => Number(entry.journal_id) === Number(journal.id)
    );
    const defaultDebit = accounts.find(
      (account) => Number(account.id) === Number(journal.default_debit_account)
    );
    const defaultCredit = accounts.find(
      (account) => Number(account.id) === Number(journal.default_credit_account)
    );

    return {
      ...journal,
      active: journal.active !== false,
      defaultDebitName: defaultDebit?.name || 'Not assigned',
      defaultCreditName: defaultCredit?.name || 'Not assigned',
      postingQueue: journalEntries.length,
      lastEntryDate:
        journalEntries.sort((left, right) => new Date(right.date) - new Date(left.date))[0]?.date ||
        '—',
      reviewPolicy:
        journal.type === 'bank'
          ? 'Bank reconciliation review'
          : journal.type === 'sale'
            ? 'Revenue recognition review'
            : journal.type === 'purchase'
              ? 'AP approval review'
              : 'Controller posting review',
      sequencePolicy:
        journal.sequence_policy ||
        `${String(journal.code || 'JRN').toUpperCase()}/%(year)s/%(seq)s`,
      suspenseAccount:
        journal.suspense_account || defaultDebit?.name || 'Suspense clearing account',
      profitAccount: journal.profit_account || defaultCredit?.name || 'Current year earnings',
      periodAccess:
        journal.period_access ||
        (journal.type === 'bank'
          ? 'Open periods only with treasury approval'
          : 'Open periods for accounting team'),
    };
  });

const enrichFiscalYears = (years, periods) =>
  years.map((year) => {
    const bounds = buildFiscalYearBounds(year);
    const yearPeriods = periods.filter(
      (period) => Number(period.fiscal_year_id) === Number(year.id)
    );
    const closedPeriods = yearPeriods.filter((period) => period.status === 'closed').length;

    return {
      ...year,
      ...bounds,
      is_closed: year.status === 'closed' || year.is_closed === true,
      closedPeriods,
      totalPeriods: yearPeriods.length,
      closeReadiness: yearPeriods.length
        ? `${closedPeriods}/${yearPeriods.length} periods closed`
        : 'Periods not generated',
      nextAction: year.status === 'closed' ? 'Archive and carry forward' : 'Review close readiness',
      lifecycleState:
        year.status === 'closed'
          ? 'Closed and ready for carry-forward'
          : !yearPeriods.length
            ? 'Setup pending period generation'
            : closedPeriods === yearPeriods.length
              ? 'Ready to close year'
              : 'Period-by-period close in progress',
      reopenPolicy:
        year.status === 'closed'
          ? 'Reopen requires controller and audit justification'
          : 'Year remains operational',
    };
  });

const enrichFiscalPeriods = (periods, years) =>
  periods.map((period) => {
    const fiscalYear = years.find((year) => Number(year.id) === Number(period.fiscal_year_id));
    const normalizedStatus =
      period.status === 'active' ? 'open' : period.status === 'draft' ? 'future' : period.status;

    return {
      ...period,
      status: normalizedStatus,
      fiscalYearName: fiscalYear?.name || 'Fiscal year',
      lockState:
        normalizedStatus === 'closed'
          ? 'Hard lock'
          : normalizedStatus === 'open'
            ? 'Posting open'
            : 'Future period',
      controlNote:
        normalizedStatus === 'closed'
          ? 'Locked from new postings'
          : normalizedStatus === 'open'
            ? 'Operational posting window'
            : 'Pending period activation',
      stateMachine:
        normalizedStatus === 'closed'
          ? 'Draft -> Open -> Closed'
          : normalizedStatus === 'open'
            ? 'Open -> Closed'
            : 'Future -> Open -> Closed',
      reopenAllowed: normalizedStatus === 'closed',
    };
  });

let state = {
  journals: cloneValue(ACCOUNTING_MOCK_JOURNALS),
  fiscalYears: cloneValue(ACCOUNTING_MOCK_FISCAL_YEARS),
  fiscalPeriods: cloneValue(ACCOUNTING_MOCK_FISCAL_PERIODS),
  activity: [
    {
      id: 'core-ledger-1',
      date: '2026-03-30',
      title: 'Bank journal routing reviewed against reconciliation ownership',
      actor: 'Finance Controller',
    },
    {
      id: 'core-ledger-2',
      date: '2026-03-29',
      title: 'FY 2026 close readiness aligned with period lock posture',
      actor: 'Controller',
    },
    {
      id: 'core-ledger-3',
      date: '2026-03-29',
      title: 'Monthly period generation reviewed for accounting calendar continuity',
      actor: 'GL Accountant',
    },
  ],
};

function emitChange() {
  workspaceVersion += 1;
  listeners.forEach((listener) => listener());
}

function updateState(updater) {
  const draft = cloneValue(state);
  const result = updater(draft);
  state = draft;
  emitChange();
  return result;
}

function buildSnapshot(currentState) {
  const journals = enrichJournals(
    currentState.journals,
    ACCOUNTING_MOCK_ACCOUNTS,
    ACCOUNTING_MOCK_JOURNAL_ENTRIES
  );
  const fiscalYears = enrichFiscalYears(currentState.fiscalYears, currentState.fiscalPeriods);
  const fiscalPeriods = enrichFiscalPeriods(currentState.fiscalPeriods, currentState.fiscalYears);

  const overview = {
    activeJournals: journals.filter((journal) => journal.active).length,
    sequencedJournals: journals.filter((journal) => journal.sequencePolicy).length,
    postingQueue: journals.reduce((sum, journal) => sum + journal.postingQueue, 0),
    openFiscalYears: fiscalYears.filter((year) => !year.is_closed).length,
    closedFiscalYears: fiscalYears.filter((year) => year.is_closed).length,
    openPeriods: fiscalPeriods.filter((period) => period.status === 'open').length,
    futurePeriods: fiscalPeriods.filter((period) => period.status === 'future').length,
    closedPeriods: fiscalPeriods.filter((period) => period.status === 'closed').length,
  };

  const alerts = [];

  if (!overview.openPeriods) {
    alerts.push({
      id: 'no-open-periods',
      severity: 'warning',
      title: 'No fiscal periods are open',
      description:
        'Posting will stall until an operational period is available for journal entry and transaction workflows.',
    });
  }

  if (
    journals.some(
      (journal) =>
        journal.defaultDebitName === 'Not assigned' || journal.defaultCreditName === 'Not assigned'
    )
  ) {
    alerts.push({
      id: 'journal-defaults',
      severity: 'info',
      title: 'Some journals are missing default accounts',
      description: 'Default debit and credit routing should be assigned before operational use.',
    });
  }

  if (!alerts.length) {
    alerts.push({
      id: 'core-ledger-steady',
      severity: 'success',
      title: 'Core ledger controls are in a workable state',
      description:
        'Journal routing, fiscal year governance, and period availability are aligned for accounting operations.',
    });
  }

  return {
    overview,
    alerts,
    journals,
    fiscalYears,
    fiscalPeriods,
    activity: cloneValue(currentState.activity),
  };
}

export function subscribeCoreLedgerConfigWorkspace(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCoreLedgerConfigWorkspaceVersion() {
  return workspaceVersion;
}

export function getCoreLedgerConfigWorkspaceSnapshot() {
  return buildSnapshot(state);
}

export function createJournal(payload) {
  return updateState((draft) => {
    const id = nextId();
    draft.journals.unshift({
      id,
      code: payload.code,
      name: payload.name,
      type: payload.type,
      default_debit_account: payload.default_debit_account || null,
      default_credit_account: payload.default_credit_account || null,
      sequence_policy: payload.sequence_policy,
      suspense_account: payload.suspense_account,
      profit_account: payload.profit_account,
      period_access: payload.period_access,
      active: true,
    });
    draft.activity.unshift({
      id: `journal-${id}`,
      date: '2026-03-30',
      title: `${payload.code} journal configured for ${payload.type} workflow`,
      actor: 'GL Accountant',
    });
    return { id };
  });
}

export function toggleJournalStatus(journalId) {
  return updateState((draft) => {
    draft.journals = draft.journals.map((journal) =>
      String(journal.id) === String(journalId)
        ? { ...journal, active: !(journal.active !== false) }
        : journal
    );
    return { id: journalId };
  });
}

export function createFiscalYear(payload) {
  return updateState((draft) => {
    const id = Number(payload.name.match(/(\d{4})/)?.[1]) || nextId();
    draft.fiscalYears.unshift({
      id,
      name: payload.name,
      status: 'draft',
      closing_date: payload.end_date,
      closed_by: 'Pending',
      retained_earnings: 0,
      start_date: payload.start_date,
      end_date: payload.end_date,
      is_closed: false,
    });
    draft.activity.unshift({
      id: `fiscal-year-${id}`,
      date: '2026-03-30',
      title: `${payload.name} fiscal year created`,
      actor: 'Finance Controller',
    });
    return { id };
  });
}

export function closeFiscalYear(yearId) {
  return updateState((draft) => {
    draft.fiscalYears = draft.fiscalYears.map((year) =>
      String(year.id) === String(yearId)
        ? { ...year, status: 'closed', is_closed: true, closed_by: 'Finance Controller' }
        : year
    );
    draft.fiscalPeriods = draft.fiscalPeriods.map((period) =>
      String(period.fiscal_year_id) === String(yearId) ? { ...period, status: 'closed' } : period
    );
    return { id: yearId };
  });
}

export function generateFiscalPeriods(yearId) {
  return updateState((draft) => {
    const year = draft.fiscalYears.find((item) => String(item.id) === String(yearId));
    if (!year) return { id: yearId };

    const numericYear = Number(
      String(year.name || year.id).match(/(\d{4})/)?.[1] || year.id || 2026
    );
    const existingPeriods = draft.fiscalPeriods.filter(
      (period) => String(period.fiscal_year_id) === String(yearId)
    );

    if (!existingPeriods.length) {
      Array.from({ length: 12 }).forEach((_, index) => {
        const month = String(index + 1).padStart(2, '0');
        const lastDay = new Date(numericYear, index + 1, 0).getDate();

        draft.fiscalPeriods.push({
          id: nextId(),
          fiscal_year_id: yearId,
          name: `${new Date(numericYear, index).toLocaleString('en-US', { month: 'short' })} ${numericYear}`,
          start_date: `${numericYear}-${month}-01`,
          end_date: `${numericYear}-${month}-${String(lastDay).padStart(2, '0')}`,
          status: index === 0 ? 'open' : 'future',
        });
      });
    }

    draft.activity.unshift({
      id: `periods-${yearId}`,
      date: '2026-03-30',
      title: `Fiscal periods generated for ${year.name}`,
      actor: 'GL Accountant',
    });
    return { id: yearId };
  });
}

export function closeFiscalPeriod(periodId) {
  return updateState((draft) => {
    draft.fiscalPeriods = draft.fiscalPeriods.map((period) =>
      String(period.id) === String(periodId) ? { ...period, status: 'closed' } : period
    );
    return { id: periodId };
  });
}

export function reopenFiscalPeriod(periodId) {
  return updateState((draft) => {
    draft.fiscalPeriods = draft.fiscalPeriods.map((period) =>
      String(period.id) === String(periodId) ? { ...period, status: 'open' } : period
    );
    draft.activity.unshift({
      id: `reopen-period-${periodId}`,
      date: '2026-03-30',
      title: `Fiscal period ${periodId} reopened with controller approval`,
      actor: 'Finance Controller',
    });
    return { id: periodId };
  });
}
