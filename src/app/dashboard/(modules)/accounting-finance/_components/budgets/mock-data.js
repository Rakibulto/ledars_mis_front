import {
  ACCOUNTING_MOCK_BUDGETS,
  ACCOUNTING_MOCK_ACCOUNTS,
  ACCOUNTING_MOCK_COST_CENTERS,
  ACCOUNTING_MOCK_FISCAL_YEARS,
} from '../demo-data';

const listeners = new Set();

let workspaceVersion = 0;
let sequence = 700;

const PERIOD_LABELS = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026'];

const OWNER_OPTIONS = [
  'Budget Controller',
  'Program Manager',
  'Finance Analyst',
  'Cost Center Lead',
  'Grant Accountant',
  'Procurement Finance',
];

const clone = (value) => JSON.parse(JSON.stringify(value));

const nextId = (prefix) => {
  sequence += 1;
  return `${prefix}-${sequence}`;
};

export const formatBudgetStatus = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

const roundAmount = (value) => Number(Number(value || 0).toFixed(2));

const accountMap = new Map(ACCOUNTING_MOCK_ACCOUNTS.map((account) => [account.id, account]));
const costCenterMap = new Map(ACCOUNTING_MOCK_COST_CENTERS.map((center) => [center.id, center]));
const fiscalYearMap = new Map(ACCOUNTING_MOCK_FISCAL_YEARS.map((year) => [year.id, year]));

const LINE_SEEDS = {
  1: [
    {
      accountId: 11,
      owner: 'Procurement Finance',
      planned: 90000,
      actual: 72000,
      commitments: 8000,
      encumbrance: 5000,
      periods: [
        { label: 'Jan 2026', planned: 18000, actual: 16000, commitments: 1000, encumbrance: 500 },
        { label: 'Feb 2026', planned: 22000, actual: 18000, commitments: 2000, encumbrance: 1500 },
        { label: 'Mar 2026', planned: 26000, actual: 22000, commitments: 2500, encumbrance: 2000 },
        { label: 'Apr 2026', planned: 24000, actual: 16000, commitments: 2500, encumbrance: 1000 },
      ],
      notes: 'Medical supplies and outreach consumables',
    },
    {
      accountId: 12,
      owner: 'Program Manager',
      planned: 60000,
      actual: 43000,
      commitments: 6000,
      encumbrance: 3000,
      periods: [
        { label: 'Jan 2026', planned: 15000, actual: 11000, commitments: 1200, encumbrance: 800 },
        { label: 'Feb 2026', planned: 15000, actual: 11000, commitments: 1500, encumbrance: 700 },
        { label: 'Mar 2026', planned: 15000, actual: 11000, commitments: 1700, encumbrance: 900 },
        { label: 'Apr 2026', planned: 15000, actual: 10000, commitments: 1600, encumbrance: 600 },
      ],
      notes: 'Outreach staff and temporary support payroll',
    },
    {
      accountId: 13,
      owner: 'Budget Controller',
      planned: 40000,
      actual: 18000,
      commitments: 2000,
      encumbrance: 0,
      periods: [
        { label: 'Jan 2026', planned: 10000, actual: 3000, commitments: 0, encumbrance: 0 },
        { label: 'Feb 2026', planned: 10000, actual: 5000, commitments: 500, encumbrance: 0 },
        { label: 'Mar 2026', planned: 10000, actual: 5000, commitments: 800, encumbrance: 0 },
        { label: 'Apr 2026', planned: 10000, actual: 5000, commitments: 700, encumbrance: 0 },
      ],
      notes: 'Transport and field banking support',
    },
    {
      accountId: 10,
      owner: 'Grant Accountant',
      planned: 50000,
      actual: 35000,
      commitments: 7000,
      encumbrance: 4000,
      periods: [
        { label: 'Jan 2026', planned: 12000, actual: 9000, commitments: 1200, encumbrance: 1000 },
        { label: 'Feb 2026', planned: 12000, actual: 9000, commitments: 1800, encumbrance: 1000 },
        { label: 'Mar 2026', planned: 13000, actual: 9000, commitments: 2000, encumbrance: 1200 },
        { label: 'Apr 2026', planned: 13000, actual: 8000, commitments: 2000, encumbrance: 800 },
      ],
      notes: 'Community event delivery and specialist vendors',
    },
  ],
  2: [
    {
      accountId: 12,
      owner: 'Program Manager',
      planned: 140000,
      actual: 102000,
      commitments: 15000,
      encumbrance: 9000,
      periods: [
        { label: 'Jan 2026', planned: 34000, actual: 26000, commitments: 3500, encumbrance: 1800 },
        { label: 'Feb 2026', planned: 34000, actual: 25000, commitments: 4000, encumbrance: 2200 },
        { label: 'Mar 2026', planned: 36000, actual: 26000, commitments: 4000, encumbrance: 2500 },
        { label: 'Apr 2026', planned: 36000, actual: 25000, commitments: 3500, encumbrance: 2500 },
      ],
      notes: 'Teachers, facilitators, and project coordinators',
    },
    {
      accountId: 11,
      owner: 'Procurement Finance',
      planned: 60000,
      actual: 39500,
      commitments: 6000,
      encumbrance: 3500,
      periods: [
        { label: 'Jan 2026', planned: 15000, actual: 9500, commitments: 1200, encumbrance: 500 },
        { label: 'Feb 2026', planned: 15000, actual: 10000, commitments: 1400, encumbrance: 900 },
        { label: 'Mar 2026', planned: 15000, actual: 10000, commitments: 1700, encumbrance: 1100 },
        { label: 'Apr 2026', planned: 15000, actual: 10000, commitments: 1700, encumbrance: 1000 },
      ],
      notes: 'Learning kits, digital content, and training material',
    },
    {
      accountId: 13,
      owner: 'Cost Center Lead',
      planned: 50000,
      actual: 24000,
      commitments: 5500,
      encumbrance: 2000,
      periods: [
        { label: 'Jan 2026', planned: 12000, actual: 5000, commitments: 1000, encumbrance: 500 },
        { label: 'Feb 2026', planned: 12000, actual: 6000, commitments: 1500, encumbrance: 500 },
        { label: 'Mar 2026', planned: 13000, actual: 7000, commitments: 1500, encumbrance: 500 },
        { label: 'Apr 2026', planned: 13000, actual: 6000, commitments: 1500, encumbrance: 500 },
      ],
      notes: 'Internet, transport, and support services',
    },
    {
      accountId: 10,
      owner: 'Grant Accountant',
      planned: 60000,
      actual: 39000,
      commitments: 9000,
      encumbrance: 4500,
      periods: [
        { label: 'Jan 2026', planned: 14000, actual: 9000, commitments: 1800, encumbrance: 900 },
        { label: 'Feb 2026', planned: 15000, actual: 10000, commitments: 2200, encumbrance: 1200 },
        { label: 'Mar 2026', planned: 15000, actual: 10000, commitments: 2400, encumbrance: 1300 },
        { label: 'Apr 2026', planned: 16000, actual: 10000, commitments: 2600, encumbrance: 1100 },
      ],
      notes: 'Implementing partner services and venue support',
    },
  ],
  3: [
    {
      accountId: 12,
      owner: 'Controller',
      planned: 50000,
      actual: 36000,
      commitments: 5000,
      encumbrance: 2000,
      periods: [
        { label: 'Jan 2026', planned: 12000, actual: 9000, commitments: 1100, encumbrance: 500 },
        { label: 'Feb 2026', planned: 12000, actual: 9000, commitments: 1300, encumbrance: 500 },
        { label: 'Mar 2026', planned: 13000, actual: 9000, commitments: 1300, encumbrance: 500 },
        { label: 'Apr 2026', planned: 13000, actual: 9000, commitments: 1300, encumbrance: 500 },
      ],
      notes: 'Shared services payroll and finance operations',
    },
    {
      accountId: 13,
      owner: 'Budget Controller',
      planned: 25000,
      actual: 18000,
      commitments: 2500,
      encumbrance: 1200,
      periods: [
        { label: 'Jan 2026', planned: 6000, actual: 4000, commitments: 500, encumbrance: 300 },
        { label: 'Feb 2026', planned: 6000, actual: 4500, commitments: 700, encumbrance: 300 },
        { label: 'Mar 2026', planned: 6500, actual: 4500, commitments: 650, encumbrance: 300 },
        { label: 'Apr 2026', planned: 6500, actual: 5000, commitments: 650, encumbrance: 300 },
      ],
      notes: 'Utilities, connectivity, and support services',
    },
    {
      accountId: 5,
      owner: 'Procurement Finance',
      planned: 20000,
      actual: 10500,
      commitments: 2800,
      encumbrance: 800,
      periods: [
        { label: 'Jan 2026', planned: 5000, actual: 2500, commitments: 700, encumbrance: 200 },
        { label: 'Feb 2026', planned: 5000, actual: 2500, commitments: 700, encumbrance: 200 },
        { label: 'Mar 2026', planned: 5000, actual: 2500, commitments: 700, encumbrance: 200 },
        { label: 'Apr 2026', planned: 5000, actual: 3000, commitments: 700, encumbrance: 200 },
      ],
      notes: 'Office accruals and maintenance pre-commitments',
    },
    {
      accountId: 1,
      owner: 'Finance Analyst',
      planned: 25000,
      actual: 19000,
      commitments: 2200,
      encumbrance: 1000,
      periods: [
        { label: 'Jan 2026', planned: 6000, actual: 4500, commitments: 500, encumbrance: 200 },
        { label: 'Feb 2026', planned: 6000, actual: 4500, commitments: 600, encumbrance: 300 },
        { label: 'Mar 2026', planned: 6500, actual: 5000, commitments: 550, encumbrance: 250 },
        { label: 'Apr 2026', planned: 6500, actual: 5000, commitments: 550, encumbrance: 250 },
      ],
      notes: 'Admin banking, insurance, and platform costs',
    },
  ],
};

function buildBudgetLines(budgetId) {
  return (LINE_SEEDS[budgetId] || []).map((seed, index) => {
    const account = accountMap.get(seed.accountId);
    const planned = roundAmount(seed.planned);
    const actual = roundAmount(seed.actual);
    const commitments = roundAmount(seed.commitments);
    const encumbrance = roundAmount(seed.encumbrance);

    return {
      id: `${budgetId}-line-${index + 1}`,
      sequence: index + 1,
      accountId: seed.accountId,
      accountCode: account?.code || '0000',
      accountName: account?.name || 'Account',
      owner: seed.owner,
      planned,
      actual,
      commitments,
      encumbrance,
      available: roundAmount(planned - actual - commitments - encumbrance),
      note: seed.notes,
      periods: seed.periods.map((period) => ({
        label: period.label,
        planned: roundAmount(period.planned),
        actual: roundAmount(period.actual),
        commitments: roundAmount(period.commitments),
        encumbrance: roundAmount(period.encumbrance),
      })),
    };
  });
}

function summarizeBudget(budget) {
  const totalAmount = roundAmount(budget.lines.reduce((sum, line) => sum + line.planned, 0));
  const spentAmount = roundAmount(budget.lines.reduce((sum, line) => sum + line.actual, 0));
  const commitments = roundAmount(budget.lines.reduce((sum, line) => sum + line.commitments, 0));
  const encumbrance = roundAmount(budget.lines.reduce((sum, line) => sum + line.encumbrance, 0));
  const available = roundAmount(totalAmount - spentAmount - commitments - encumbrance);
  const utilization = totalAmount > 0 ? (spentAmount / totalAmount) * 100 : 0;
  const pressure =
    totalAmount > 0 ? ((spentAmount + commitments + encumbrance) / totalAmount) * 100 : 0;

  return {
    ...budget,
    totalAmount,
    spentAmount,
    commitments,
    encumbrance,
    available,
    utilization,
    pressure,
    thresholdStatus:
      pressure >= budget.criticalThreshold
        ? 'critical'
        : pressure >= budget.warningThreshold
          ? 'warning'
          : 'healthy',
  };
}

function buildActualsByPeriod(lines) {
  return PERIOD_LABELS.map((label) => {
    const matches = lines.flatMap((line) =>
      line.periods.filter((period) => period.label === label)
    );

    return {
      label,
      planned: roundAmount(matches.reduce((sum, period) => sum + period.planned, 0)),
      actual: roundAmount(matches.reduce((sum, period) => sum + period.actual, 0)),
      commitments: roundAmount(matches.reduce((sum, period) => sum + period.commitments, 0)),
      encumbrance: roundAmount(matches.reduce((sum, period) => sum + period.encumbrance, 0)),
    };
  });
}

function buildInitialBudgets() {
  return ACCOUNTING_MOCK_BUDGETS.map((budget, index) => {
    const lines = buildBudgetLines(budget.id);
    const costCenter = costCenterMap.get(budget.cost_center_id);
    const fiscalYear = fiscalYearMap.get(budget.fiscal_year_id);
    const baselineVersion = {
      id: `${budget.id}-v1`,
      label: 'Version 1.0',
      type: 'baseline',
      status: budget.status === 'draft' ? 'draft' : 'approved',
      changedBy: OWNER_OPTIONS[index] || 'Budget Controller',
      createdAt: `2026-01-0${index + 3}`,
      note: 'Initial approved budget envelope',
    };
    const amendment =
      budget.id === 1
        ? {
            id: `${budget.id}-amd-1`,
            amount: 12000,
            reason: 'Expanded mobile-clinic medicines and field travel cover',
            requestedBy: 'Program Manager',
            requestedAt: '2026-03-14',
            status: 'approved',
            targetLineId: `${budget.id}-line-1`,
            effectivePeriod: 'Apr 2026',
            approvedBy: 'Finance Director',
          }
        : budget.id === 3
          ? {
              id: `${budget.id}-amd-1`,
              amount: 8000,
              reason: 'Admin platform renewal and compliance cost update',
              requestedBy: 'Controller',
              requestedAt: '2026-03-26',
              status: 'pending_approval',
              targetLineId: `${budget.id}-line-4`,
              effectivePeriod: 'Apr 2026',
              approvedBy: '',
            }
          : null;

    const approvalChain = [
      {
        id: `${budget.id}-approval-1`,
        role: 'Budget Owner',
        assignee: OWNER_OPTIONS[index] || 'Budget Controller',
        status: 'approved',
        actedAt: '2026-01-05',
        note: 'Initial budget prepared and justified.',
      },
      {
        id: `${budget.id}-approval-2`,
        role: 'Finance Controller',
        assignee: 'Finance Controller',
        status: budget.status === 'draft' ? 'in_review' : 'approved',
        actedAt: budget.status === 'draft' ? '' : '2026-01-09',
        note: 'Control review and funding alignment.',
      },
      {
        id: `${budget.id}-approval-3`,
        role: 'Executive Director',
        assignee: 'Executive Director',
        status: budget.status === 'draft' ? 'pending' : 'approved',
        actedAt: budget.status === 'draft' ? '' : '2026-01-12',
        note: 'Final sign-off for budget release.',
      },
    ];

    const versions = [baselineVersion];
    if (amendment) {
      versions.unshift({
        id: `${budget.id}-v2`,
        label: 'Version 2.0',
        type: 'amendment',
        status: amendment.status,
        changedBy: amendment.requestedBy,
        createdAt: amendment.requestedAt,
        note: amendment.reason,
      });
    }

    return summarizeBudget({
      id: budget.id,
      name: budget.name,
      department: budget.department,
      fiscalYear: budget.fiscal_year,
      fiscalYearId: budget.fiscal_year_id,
      fiscalYearStatus: fiscalYear?.status || 'active',
      costCenterId: budget.cost_center_id,
      costCenterName: costCenter?.name || budget.department,
      costCenterCode: costCenter?.code || `CC-${budget.id}`,
      owner: OWNER_OPTIONS[index] || 'Budget Controller',
      status: budget.status,
      warningThreshold: 85,
      criticalThreshold: 95,
      versions,
      amendments: amendment ? [amendment] : [],
      approvalChain,
      lines,
      actualsByPeriod: buildActualsByPeriod(lines),
    });
  });
}

const COMPARISON_PERIODS = [
  { id: 'mar_2026', label: 'Mar 2026', periodLabels: ['Mar 2026'] },
  { id: 'q1_2026', label: 'Q1 2026', periodLabels: ['Jan 2026', 'Feb 2026', 'Mar 2026'] },
  { id: 'fy_2026', label: 'FY 2026', periodLabels: PERIOD_LABELS },
  { id: 'apr_2026', label: 'Apr 2026 Forecast', periodLabels: ['Apr 2026'] },
];

let state = {
  budgets: buildInitialBudgets(),
};

function emitChange() {
  workspaceVersion += 1;
  listeners.forEach((listener) => listener());
}

function updateState(updater) {
  const draft = clone(state);
  const result = updater(draft);
  state = draft;
  emitChange();
  return result;
}

function enrichStateSnapshot(currentState) {
  const budgets = currentState.budgets.map((budget) => summarizeBudget(budget));
  const overview = {
    totalBudget: roundAmount(budgets.reduce((sum, budget) => sum + budget.totalAmount, 0)),
    totalActual: roundAmount(budgets.reduce((sum, budget) => sum + budget.spentAmount, 0)),
    totalCommitments: roundAmount(budgets.reduce((sum, budget) => sum + budget.commitments, 0)),
    totalEncumbrance: roundAmount(budgets.reduce((sum, budget) => sum + budget.encumbrance, 0)),
    totalAvailable: roundAmount(budgets.reduce((sum, budget) => sum + budget.available, 0)),
    warningPlans: budgets.filter((budget) => budget.thresholdStatus === 'warning').length,
    criticalPlans: budgets.filter((budget) => budget.thresholdStatus === 'critical').length,
  };

  const alerts = [];
  if (overview.criticalPlans) {
    alerts.push({
      id: 'critical-plans',
      severity: 'error',
      title: `${overview.criticalPlans} budgets are above critical threshold`,
      description:
        'These plans have actuals, commitments, and encumbrances consuming nearly the full envelope.',
    });
  }
  if (
    budgets.some((budget) => budget.amendments.some((item) => item.status === 'pending_approval'))
  ) {
    alerts.push({
      id: 'pending-amendments',
      severity: 'warning',
      title: 'Budget amendments are waiting for approval',
      description:
        'Version release should remain controlled until finance and leadership approvals are completed.',
    });
  }
  if (!alerts.length) {
    alerts.push({
      id: 'budgets-steady',
      severity: 'success',
      title: 'Budget control workspace is balanced',
      description:
        'Amendments, encumbrances, and approval routing are present without immediate threshold breaches.',
    });
  }

  const trackingRows = budgets.map((budget) => ({
    id: budget.id,
    name: budget.name,
    department: budget.department,
    costCenterName: budget.costCenterName,
    owner: budget.owner,
    thresholdStatus: budget.thresholdStatus,
    warningThreshold: budget.warningThreshold,
    criticalThreshold: budget.criticalThreshold,
    totalBudget: budget.totalAmount,
    totalActual: budget.spentAmount,
    commitments: budget.commitments,
    encumbrance: budget.encumbrance,
    available: budget.available,
    pressure: budget.pressure,
    actualsByPeriod: budget.actualsByPeriod,
  }));

  return {
    budgets,
    overview,
    alerts,
    trackingRows,
    comparisonPeriods: COMPARISON_PERIODS,
    ownerOptions: OWNER_OPTIONS,
    accountOptions: ACCOUNTING_MOCK_ACCOUNTS,
    costCenters: ACCOUNTING_MOCK_COST_CENTERS,
    fiscalYears: ACCOUNTING_MOCK_FISCAL_YEARS,
  };
}

export function calculateBudgetVarianceRows(budget, comparisonPeriodId) {
  if (!budget) return [];

  const period =
    COMPARISON_PERIODS.find((item) => item.id === comparisonPeriodId) || COMPARISON_PERIODS[2];

  return budget.lines.map((line) => {
    const includedPeriods = line.periods.filter((item) => period.periodLabels.includes(item.label));
    const planned = roundAmount(includedPeriods.reduce((sum, item) => sum + item.planned, 0));
    const actual = roundAmount(includedPeriods.reduce((sum, item) => sum + item.actual, 0));
    const commitments = roundAmount(
      includedPeriods.reduce((sum, item) => sum + item.commitments, 0)
    );
    const encumbrance = roundAmount(
      includedPeriods.reduce((sum, item) => sum + item.encumbrance, 0)
    );
    const available = roundAmount(planned - actual - commitments - encumbrance);
    const variance = roundAmount(planned - actual);
    const variancePercent = planned > 0 ? (variance / planned) * 100 : 0;
    const commitmentPercent =
      planned > 0 ? ((actual + commitments + encumbrance) / planned) * 100 : 0;

    return {
      id: line.id,
      accountCode: line.accountCode,
      accountName: line.accountName,
      owner: line.owner,
      planned,
      actual,
      commitments,
      encumbrance,
      available,
      variance,
      variancePercent,
      commitmentPercent,
      status:
        commitmentPercent >= budget.criticalThreshold
          ? 'critical'
          : commitmentPercent >= budget.warningThreshold
            ? 'warning'
            : 'healthy',
    };
  });
}

export function subscribeBudgetsWorkspace(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getBudgetsWorkspaceVersion() {
  return workspaceVersion;
}

export function getBudgetsWorkspaceSnapshot() {
  return enrichStateSnapshot(state);
}

export function createBudgetPlan(payload) {
  return updateState((draft) => {
    const costCenter = costCenterMap.get(Number(payload.costCenterId));
    const fiscalYear = fiscalYearMap.get(Number(payload.fiscalYearId));
    const lineId = nextId('budget-line');
    const budgetId = nextId('budget');

    draft.budgets.unshift({
      id: budgetId,
      name: payload.name,
      department: payload.department || costCenter?.name || 'New Program',
      fiscalYear: fiscalYear?.name || 'FY 2026',
      fiscalYearId: Number(payload.fiscalYearId || 2026),
      fiscalYearStatus: fiscalYear?.status || 'active',
      costCenterId: Number(payload.costCenterId || 1),
      costCenterName: costCenter?.name || 'Education Program',
      costCenterCode: costCenter?.code || 'CC-NEW',
      owner: payload.owner || 'Budget Controller',
      status: 'draft',
      warningThreshold: Number(payload.warningThreshold || 85),
      criticalThreshold: Number(payload.criticalThreshold || 95),
      lines: [
        {
          id: lineId,
          sequence: 1,
          accountId: Number(payload.accountId || 12),
          accountCode: accountMap.get(Number(payload.accountId || 12))?.code || '6101',
          accountName: accountMap.get(Number(payload.accountId || 12))?.name || 'Salary Expense',
          owner: payload.owner || 'Budget Controller',
          planned: roundAmount(payload.totalAmount),
          actual: 0,
          commitments: roundAmount(Number(payload.seedCommitments || 0)),
          encumbrance: 0,
          available: roundAmount(payload.totalAmount),
          note: 'Initial budget line created from plan wizard',
          periods: PERIOD_LABELS.map((label) => ({
            label,
            planned: roundAmount(Number(payload.totalAmount || 0) / PERIOD_LABELS.length),
            actual: 0,
            commitments: 0,
            encumbrance: 0,
          })),
        },
      ],
      versions: [
        {
          id: nextId('budget-version'),
          label: 'Version 1.0',
          type: 'baseline',
          status: 'draft',
          changedBy: payload.owner || 'Budget Controller',
          createdAt: '2026-03-30',
          note: 'Budget initialized from planning wizard',
        },
      ],
      amendments: [],
      approvalChain: [
        {
          id: nextId('approval'),
          role: 'Budget Owner',
          assignee: payload.owner || 'Budget Controller',
          status: 'approved',
          actedAt: '2026-03-30',
          note: 'Draft prepared.',
        },
        {
          id: nextId('approval'),
          role: 'Finance Controller',
          assignee: 'Finance Controller',
          status: 'pending',
          actedAt: '',
          note: 'Awaiting control review.',
        },
        {
          id: nextId('approval'),
          role: 'Executive Director',
          assignee: 'Executive Director',
          status: 'pending',
          actedAt: '',
          note: 'Pending final approval.',
        },
      ],
      actualsByPeriod: PERIOD_LABELS.map((label) => ({
        label,
        planned: roundAmount(Number(payload.totalAmount || 0) / PERIOD_LABELS.length),
        actual: 0,
        commitments: 0,
        encumbrance: 0,
      })),
    });

    return { budgetId, lineId };
  });
}

export function createBudgetAmendment(budgetId, payload) {
  return updateState((draft) => {
    const budget = draft.budgets.find((item) => String(item.id) === String(budgetId));
    if (!budget) return null;

    const line = budget.lines.find((item) => item.id === payload.targetLineId) || budget.lines[0];
    const amount = Number(payload.amount || 0);
    line.planned = roundAmount(line.planned + amount);
    line.available = roundAmount(line.planned - line.actual - line.commitments - line.encumbrance);

    const periodTarget =
      line.periods.find((item) => item.label === payload.effectivePeriod) ||
      line.periods[line.periods.length - 1];
    if (periodTarget) {
      periodTarget.planned = roundAmount(periodTarget.planned + amount);
    }

    const amendmentId = nextId('amd');

    budget.amendments.unshift({
      id: amendmentId,
      amount,
      reason: payload.reason,
      requestedBy: payload.requestedBy,
      requestedAt: '2026-03-30',
      status: 'pending_approval',
      targetLineId: line.id,
      effectivePeriod: payload.effectivePeriod,
      approvedBy: '',
    });
    budget.versions.unshift({
      id: nextId('budget-version'),
      label: `Version ${budget.versions.length + 1}.0`,
      type: 'amendment',
      status: 'pending_approval',
      changedBy: payload.requestedBy,
      createdAt: '2026-03-30',
      note: payload.reason,
    });
    budget.status = 'pending_approval';
    budget.approvalChain = budget.approvalChain.map((step, index) => ({
      ...step,
      status: index === 0 ? 'approved' : index === 1 ? 'in_review' : 'pending',
      actedAt: index === 0 ? '2026-03-30' : '',
    }));
    budget.actualsByPeriod = buildActualsByPeriod(budget.lines);

    return { amendmentId, budgetId: budget.id };
  });
}

export function approveBudgetPlan(budgetId) {
  return updateState((draft) => {
    const budget = draft.budgets.find((item) => String(item.id) === String(budgetId));
    if (!budget) return null;

    const pendingAmendment = budget.amendments.find((item) => item.status === 'pending_approval');
    if (pendingAmendment) {
      pendingAmendment.status = 'approved';
      pendingAmendment.approvedBy = 'Finance Director';
    }

    const pendingVersion = budget.versions.find((item) => item.status === 'pending_approval');
    if (pendingVersion) {
      pendingVersion.status = 'approved';
    }

    budget.status = 'active';
    budget.approvalChain = budget.approvalChain.map((step, index) => ({
      ...step,
      status: 'approved',
      actedAt: step.actedAt || `2026-03-${28 + index}`,
    }));

    return { budgetId: budget.id };
  });
}

export function updateBudgetLine(budgetId, lineId, payload) {
  return updateState((draft) => {
    const budget = draft.budgets.find((item) => String(item.id) === String(budgetId));
    if (!budget) return null;

    const line = budget.lines.find((item) => String(item.id) === String(lineId));
    if (!line) return null;

    Object.assign(line, payload);
    line.planned = roundAmount(line.planned);
    line.actual = roundAmount(line.actual);
    line.commitments = roundAmount(line.commitments);
    line.encumbrance = roundAmount(line.encumbrance);
    line.available = roundAmount(line.planned - line.actual - line.commitments - line.encumbrance);
    budget.actualsByPeriod = buildActualsByPeriod(budget.lines);

    return { budgetId: budget.id, lineId: line.id };
  });
}

export function addBudgetLine(budgetId, payload) {
  return updateState((draft) => {
    const budget = draft.budgets.find((item) => String(item.id) === String(budgetId));
    if (!budget) return null;

    const account = accountMap.get(Number(payload.accountId || 12));
    const planned = roundAmount(payload.planned || 0);
    const actual = roundAmount(payload.actual || 0);
    const commitments = roundAmount(payload.commitments || 0);
    const encumbrance = roundAmount(payload.encumbrance || 0);
    const lineId = nextId('budget-line');

    budget.lines.push({
      id: lineId,
      sequence: budget.lines.length + 1,
      accountId: Number(payload.accountId || 12),
      accountCode: account?.code || '6101',
      accountName: account?.name || 'Salary Expense',
      owner: payload.owner || budget.owner,
      planned,
      actual,
      commitments,
      encumbrance,
      available: roundAmount(planned - actual - commitments - encumbrance),
      note: payload.note || 'Added from budget line manager',
      periods: PERIOD_LABELS.map((label) => ({
        label,
        planned: roundAmount(planned / PERIOD_LABELS.length),
        actual: roundAmount(actual / PERIOD_LABELS.length),
        commitments: roundAmount(commitments / PERIOD_LABELS.length),
        encumbrance: roundAmount(encumbrance / PERIOD_LABELS.length),
      })),
    });
    budget.actualsByPeriod = buildActualsByPeriod(budget.lines);

    return { budgetId: budget.id, lineId };
  });
}

export function assignBudgetLineOwner(budgetId, lineId, owner) {
  updateBudgetLine(budgetId, lineId, { owner });
}

export function updateBudgetThresholds(budgetId, payload) {
  return updateState((draft) => {
    const budget = draft.budgets.find((item) => String(item.id) === String(budgetId));
    if (!budget) return null;

    budget.warningThreshold = Number(payload.warningThreshold || budget.warningThreshold);
    budget.criticalThreshold = Number(payload.criticalThreshold || budget.criticalThreshold);

    return { budgetId: budget.id };
  });
}
