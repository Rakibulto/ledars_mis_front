'use client';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/utils/axios';

// ── Constants ─────────────────────────────────────────────────────────────────

const OWNER_OPTIONS = [
  'Budget Controller',
  'Program Manager',
  'Finance Analyst',
  'Cost Center Lead',
  'Grant Accountant',
  'Procurement Finance',
];

const COMPARISON_PERIODS = [
  { id: 'mar_2026', label: 'Mar 2026', periodLabels: ['Mar 2026'] },
  { id: 'q1_2026', label: 'Q1 2026', periodLabels: ['Jan 2026', 'Feb 2026', 'Mar 2026'] },
  {
    id: 'fy_2026',
    label: 'FY 2026',
    periodLabels: ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026'],
  },
  { id: 'apr_2026', label: 'Apr 2026 Forecast', periodLabels: ['Apr 2026'] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export const formatBudgetStatus = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

// ── Transformer: raw API budget → workspace shape ─────────────────────────────

function transformBudget(raw, accountsMap, costCentersMap, fiscalYearsMap) {
  const planned = round2(raw.total_planned);
  const actual = round2(raw.total_actual);
  const committed = round2(raw.total_committed);
  const encumbrance = round2(raw.total_encumbrance);
  const available = round2(planned - actual - committed - encumbrance);
  const pressure = planned > 0 ? ((actual + committed + encumbrance) / planned) * 100 : 0;
  const warningThreshold = round2(raw.warning_threshold ?? 85);
  const criticalThreshold = round2(raw.critical_threshold ?? 95);

  // Build lines (backend returns nested lines in detail view)
  const lines = (raw.lines || []).map((line) => ({
    id: line.id,
    accountId: line.account,
    accountCode: line.account_code || '',
    accountName: line.account_name || '',
    owner: line.owner || 'Budget Controller',
    planned: round2(line.planned_amount),
    actual: round2(line.actual_amount),
    commitments: round2(line.committed_amount),
    encumbrance: round2(line.encumbrance_amount),
    available: round2(line.available_amount),
    note: line.notes || '',
    // Build period spread evenly from totals for display
    periods: COMPARISON_PERIODS[2].periodLabels.map((label) => ({
      label,
      planned: round2(round2(line.planned_amount) / 4),
      actual: round2(round2(line.actual_amount) / 4),
      commitments: round2(round2(line.committed_amount) / 4),
      encumbrance: round2(round2(line.encumbrance_amount) / 4),
    })),
  }));

  // Build amendments (newest first — backend orders by -created_at)
  const amendments = (raw.amendments || []).map((amd) => ({
    id: amd.id,
    amount: round2(amd.amount),
    reason: amd.reason || '',
    requestedBy: amd.requested_by || 'Budget Controller',
    requestedAt: amd.created_at ? amd.created_at.slice(0, 10) : '',
    status: amd.status || 'pending_approval',
    targetLineId: amd.target_line || '',
    effectivePeriod: amd.effective_period || '',
    approvedBy: amd.approved_by || '',
  }));

  // Synthetic versions list derived from amendments
  const versions = [
    {
      id: `${raw.id}-v1`,
      label: 'Version 1.0',
      type: 'baseline',
      status:
        amendments.length === 0 ? (raw.status === 'draft' ? 'draft' : 'approved') : 'approved',
      changedBy: raw.owner || 'Budget Controller',
      createdAt: raw.created_at ? raw.created_at.slice(0, 10) : '',
      note: 'Initial approved budget envelope',
    },
    ...amendments.map((amd, idx) => ({
      id: `${raw.id}-v${idx + 2}`,
      label: `Version ${idx + 2}.0`,
      type: 'amendment',
      status: amd.status,
      changedBy: amd.requestedBy,
      createdAt: amd.requestedAt,
      note: amd.reason,
    })),
  ].reverse(); // newest version first

  // Synthetic approval chain
  const approvalChain = [
    {
      id: `${raw.id}-approval-1`,
      role: 'Budget Owner',
      assignee: raw.owner || 'Budget Controller',
      status: 'approved',
      actedAt: raw.created_at ? raw.created_at.slice(0, 10) : '',
      note: 'Initial budget prepared and justified.',
    },
    {
      id: `${raw.id}-approval-2`,
      role: 'Finance Controller',
      assignee: 'Finance Controller',
      status: raw.status === 'draft' ? 'in_review' : 'approved',
      actedAt: raw.status === 'draft' ? '' : raw.updated_at ? raw.updated_at.slice(0, 10) : '',
      note: 'Control review and funding alignment.',
    },
    {
      id: `${raw.id}-approval-3`,
      role: 'Executive Director',
      assignee: 'Executive Director',
      status: raw.status === 'draft' || raw.status === 'pending_approval' ? 'pending' : 'approved',
      actedAt:
        raw.status === 'draft' || raw.status === 'pending_approval'
          ? ''
          : raw.updated_at
            ? raw.updated_at.slice(0, 10)
            : '',
      note: 'Final sign-off for budget release.',
    },
  ];

  // Actuals by period (evenly divided — no period data from backend)
  const actualsByPeriod = COMPARISON_PERIODS[2].periodLabels.map((label) => ({
    label,
    planned: round2(planned / 4),
    actual: round2(actual / 4),
    commitments: round2(committed / 4),
    encumbrance: round2(encumbrance / 4),
  }));

  const costCenterName =
    raw.cost_center_name || costCentersMap[raw.cost_center]?.name || raw.department_label || '';
  const costCenterCode = raw.cost_center_code || costCentersMap[raw.cost_center]?.code || '';
  const fiscalYearName = raw.fiscal_year_name || fiscalYearsMap[raw.fiscal_year]?.name || 'FY 2026';

  return {
    id: raw.id,
    name: raw.name,
    department: raw.department_name || raw.department_label || costCenterName,
    fiscalYear: fiscalYearName,
    fiscalYearId: raw.fiscal_year,
    fiscalYearStatus: fiscalYearsMap[raw.fiscal_year]?.status || 'open',
    costCenterId: raw.cost_center,
    costCenterName,
    costCenterCode,
    owner: raw.owner || 'Budget Controller',
    status: raw.status,
    warningThreshold,
    criticalThreshold,
    totalAmount: planned,
    spentAmount: actual,
    commitments: committed,
    encumbrance,
    available,
    utilization: planned > 0 ? (actual / planned) * 100 : 0,
    pressure,
    thresholdStatus:
      pressure >= criticalThreshold
        ? 'critical'
        : pressure >= warningThreshold
          ? 'warning'
          : 'healthy',
    lines,
    amendments,
    versions,
    approvalChain,
    actualsByPeriod,
  };
}

// ── Variance row calculator (same logic as mock-data.js) ──────────────────────

export function calculateBudgetVarianceRows(budget, comparisonPeriodId) {
  if (!budget) return [];

  const period =
    COMPARISON_PERIODS.find((item) => item.id === comparisonPeriodId) || COMPARISON_PERIODS[2];

  return budget.lines.map((line) => {
    const includedPeriods = line.periods.filter((item) => period.periodLabels.includes(item.label));
    const planned = round2(includedPeriods.reduce((sum, item) => sum + item.planned, 0));
    const actual = round2(includedPeriods.reduce((sum, item) => sum + item.actual, 0));
    const commitments = round2(includedPeriods.reduce((sum, item) => sum + item.commitments, 0));
    const encumbrance = round2(includedPeriods.reduce((sum, item) => sum + item.encumbrance, 0));
    const available = round2(planned - actual - commitments - encumbrance);
    const variance = round2(planned - actual);
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

// ── Action functions ───────────────────────────────────────────────────────────

async function revalidate() {
  await mutate(endpoints.accounting.budgets);
}

export async function createBudgetPlan(payload) {
  const body = {
    name: payload.name,
    owner: payload.owner || 'Budget Controller',
    department_label: payload.department || '',
    fiscal_year: payload.fiscalYearId,
    cost_center: payload.costCenterId || null,
    status: 'draft',
    warning_threshold: payload.warningThreshold || 85,
    critical_threshold: payload.criticalThreshold || 95,
  };
  const res = await axios.post(endpoints.accounting.budgets, body);
  // Seed initial line if account provided
  if (payload.accountId && payload.totalAmount > 0) {
    await axios.post(endpoints.accounting.budget_add_line(res.data.id), {
      account_id: payload.accountId,
      owner: payload.owner || 'Budget Controller',
      planned: payload.totalAmount,
      actual: 0,
      commitments: 0,
      encumbrance: 0,
    });
  }
  await revalidate();
  return { budgetId: res.data.id };
}

export async function createBudgetAmendment(budgetId, payload) {
  await axios.post(endpoints.accounting.budget_amend(budgetId), {
    target_line_id: payload.targetLineId || null,
    amount: payload.amount,
    reason: payload.reason,
    effective_period: payload.effectivePeriod || '',
    requested_by: payload.requestedBy || 'Budget Controller',
  });
  await revalidate();
}

export async function approveBudgetPlan(budgetId) {
  await axios.post(endpoints.accounting.budget_approve(budgetId));
  await revalidate();
}

export async function addBudgetLine(budgetId, payload) {
  await axios.post(endpoints.accounting.budget_add_line(budgetId), {
    account_id: payload.accountId,
    owner: payload.owner || 'Budget Controller',
    planned: payload.planned || 0,
    actual: payload.actual || 0,
    commitments: payload.commitments || 0,
    encumbrance: payload.encumbrance || 0,
    note: payload.note || '',
  });
  await revalidate();
}

export async function updateBudgetLine(budgetId, lineId, payload) {
  const body = {};
  if (payload.owner !== undefined) body.owner = payload.owner;
  if (payload.planned !== undefined) body.planned_amount = payload.planned;
  if (payload.actual !== undefined) body.actual_amount = payload.actual;
  if (payload.commitments !== undefined) body.committed_amount = payload.commitments;
  if (payload.encumbrance !== undefined) body.encumbrance_amount = payload.encumbrance;
  if (payload.note !== undefined) body.notes = payload.note;
  await axios.patch(endpoints.accounting.budget_line_by_id(lineId), body);
  await revalidate();
}

export async function assignBudgetLineOwner(budgetId, lineId, owner) {
  await updateBudgetLine(budgetId, lineId, { owner });
}

export async function updateBudgetThresholds(budgetId, payload) {
  await axios.patch(endpoints.accounting.budget_by_id(budgetId), {
    warning_threshold: payload.warningThreshold,
    critical_threshold: payload.criticalThreshold,
  });
  await revalidate();
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useBudgetsWorkspace() {
  const { data: rawBudgets, isLoading: budgetsLoading } = useSWR(
    endpoints.accounting.budgets,
    fetcher,
    { revalidateOnFocus: false }
  );
  const { data: rawAccounts, isLoading: accountsLoading } = useSWR(
    endpoints.accounting.accounts,
    fetcher,
    { revalidateOnFocus: false }
  );
  const { data: rawCostCenters, isLoading: costCentersLoading } = useSWR(
    endpoints.accounting.cost_centers,
    fetcher,
    { revalidateOnFocus: false }
  );
  const { data: rawFiscalYears, isLoading: fiscalYearsLoading } = useSWR(
    endpoints.accounting.fiscal_years,
    fetcher,
    { revalidateOnFocus: false }
  );

  const isLoading = budgetsLoading || accountsLoading || costCentersLoading || fiscalYearsLoading;

  return useMemo(() => {
    const rawList = Array.isArray(rawBudgets) ? rawBudgets : (rawBudgets?.results ?? []);

    const accountsList = Array.isArray(rawAccounts) ? rawAccounts : (rawAccounts?.results ?? []);

    const costCentersList = Array.isArray(rawCostCenters)
      ? rawCostCenters
      : (rawCostCenters?.results ?? []);

    const fiscalYearsList = Array.isArray(rawFiscalYears)
      ? rawFiscalYears
      : (rawFiscalYears?.results ?? []);

    // Build lookup maps
    const accountsMap = Object.fromEntries(accountsList.map((a) => [a.id, a]));
    const costCentersMap = Object.fromEntries(costCentersList.map((c) => [c.id, c]));
    const fiscalYearsMap = Object.fromEntries(fiscalYearsList.map((f) => [f.id, f]));

    // Transform budgets — newest first (backend orders by -created_at)
    const budgets = rawList.map((raw) =>
      transformBudget(raw, accountsMap, costCentersMap, fiscalYearsMap)
    );

    // Overview
    const overview = {
      totalBudget: round2(budgets.reduce((sum, b) => sum + b.totalAmount, 0)),
      totalActual: round2(budgets.reduce((sum, b) => sum + b.spentAmount, 0)),
      totalCommitments: round2(budgets.reduce((sum, b) => sum + b.commitments, 0)),
      totalEncumbrance: round2(budgets.reduce((sum, b) => sum + b.encumbrance, 0)),
      totalAvailable: round2(budgets.reduce((sum, b) => sum + b.available, 0)),
      warningPlans: budgets.filter((b) => b.thresholdStatus === 'warning').length,
      criticalPlans: budgets.filter((b) => b.thresholdStatus === 'critical').length,
    };

    // Alerts
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
    if (budgets.some((b) => b.amendments.some((a) => a.status === 'pending_approval'))) {
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

    // Tracking rows
    const trackingRows = budgets.map((b) => ({
      id: b.id,
      name: b.name,
      department: b.department,
      costCenterName: b.costCenterName,
      owner: b.owner,
      thresholdStatus: b.thresholdStatus,
      warningThreshold: b.warningThreshold,
      criticalThreshold: b.criticalThreshold,
      totalBudget: b.totalAmount,
      totalActual: b.spentAmount,
      commitments: b.commitments,
      encumbrance: b.encumbrance,
      available: b.available,
      pressure: b.pressure,
      actualsByPeriod: b.actualsByPeriod,
    }));

    // Account options for selects
    const accountOptions = accountsList.map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
    }));

    // Cost center options for selects
    const costCenters = costCentersList.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
    }));

    // Fiscal year options for selects
    const fiscalYears = fiscalYearsList.map((f) => ({
      id: f.id,
      name: f.name,
      status: f.status,
    }));

    return {
      isLoading,
      budgets,
      overview,
      alerts,
      trackingRows,
      comparisonPeriods: COMPARISON_PERIODS,
      ownerOptions: OWNER_OPTIONS,
      accountOptions,
      costCenters,
      fiscalYears,
      formatBudgetStatus,
      calculateBudgetVarianceRows,
      actions: {
        createBudgetPlan,
        createBudgetAmendment,
        approveBudgetPlan,
        addBudgetLine,
        updateBudgetLine,
        assignBudgetLineOwner,
        updateBudgetThresholds,
        deleteBudget: async (id) => {
          await axios.delete(endpoints.accounting.budget_by_id(id));
          await mutate(endpoints.accounting.budgets);
        },
        deleteBudgetLine: async (id) => {
          await axios.delete(endpoints.accounting.budget_line_by_id(id));
          await mutate(endpoints.accounting.budget_lines);
        },
      },
    };
  }, [isLoading, rawBudgets, rawAccounts, rawCostCenters, rawFiscalYears]);
}
