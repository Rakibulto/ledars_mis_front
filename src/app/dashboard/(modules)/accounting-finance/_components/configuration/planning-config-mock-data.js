import {
  ACCOUNTING_MOCK_BUDGETS,
  ACCOUNTING_MOCK_ACCOUNTS,
  ACCOUNTING_MOCK_COST_CENTERS,
  ACCOUNTING_MOCK_FISCAL_YEARS,
  ACCOUNTING_MOCK_ACCOUNT_TYPES,
} from '../demo-data';

const listeners = new Set();

let workspaceVersion = 0;
let sequence = 1800;

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

const nextId = () => {
  sequence += 1;
  return sequence;
};

const enrichAccounts = (accounts, accountTypes) =>
  accounts.map((account) => {
    const type = accountTypes.find(
      (item) => Number(item.id) === Number(account.type_id || account.account_type)
    );
    const balance = Number(account.balance || 0);
    const code = String(account.code || '');
    const hierarchyLevel = code.length <= 1 ? 0 : Math.max(0, Math.floor((code.length - 1) / 2));
    const parentCode = hierarchyLevel > 0 ? code.slice(0, Math.max(1, code.length - 2)) : 'ROOT';

    return {
      ...account,
      typeName: type?.name || 'Unassigned',
      category: type?.category || 'unclassified',
      reconcile: account.reconcile ?? ['1101', '1200', '2100'].includes(account.code),
      controlBand:
        Math.abs(balance) > 150000
          ? 'High exposure'
          : Math.abs(balance) > 50000
            ? 'Monitored'
            : 'Routine',
      reportingRole:
        type?.category === 'balance_sheet'
          ? 'Statement of financial position'
          : 'Profit and loss reporting',
      active: account.is_active !== false,
      archived: account.archived === true,
      hierarchyLevel,
      parentCode,
      numberingScheme:
        type?.nature === 'asset'
          ? '1xxx assets band'
          : type?.nature === 'liability'
            ? '2xxx liabilities band'
            : type?.nature === 'equity'
              ? '3xxx equity band'
              : type?.nature === 'income'
                ? '4xxx income band'
                : '5xxx expense band',
      defaultMappings:
        type?.category === 'balance_sheet'
          ? 'Mapped to statement of financial position and close carry-forward'
          : 'Mapped to P&L close and retained earnings transfer',
      postingRestriction:
        type?.nature === 'asset' || type?.nature === 'liability'
          ? 'Operational journals plus controller override'
          : 'All operational journals',
      usageAnalytics:
        Math.abs(balance) > 150000
          ? 'High-usage ledger with frequent month-end review'
          : Math.abs(balance) > 50000
            ? 'Moderate posting volume and periodic reconciliation'
            : 'Low-volume account monitored by exception',
      archiveCandidate: Math.abs(balance) < 1 && !(account.is_active === false),
    };
  });

const enrichCostCenters = (centers, budgets) =>
  centers.map((center) => {
    const mappedBudgets = budgets.filter(
      (budget) => Number(budget.cost_center_id) === Number(center.id)
    );
    const budget =
      mappedBudgets.reduce((sum, item) => sum + Number(item.total_amount || 0), 0) ||
      Number(center.budget || 0);
    const spent =
      mappedBudgets.reduce((sum, item) => sum + Number(item.spent_amount || 0), 0) ||
      Number(center.spent || 0);
    const utilization = budget ? Math.round((spent / budget) * 100) : 0;

    return {
      ...center,
      budget,
      spent,
      utilization,
      reviewState: utilization >= 90 ? 'critical' : utilization >= 70 ? 'watch' : 'healthy',
      driver: mappedBudgets.length
        ? `${mappedBudgets.length} active plans`
        : 'No linked budget plans',
      active: center.active !== false,
      parentName:
        centers.find((item) => Number(item.id) === Number(center.parent_id))?.name || 'Top level',
      hierarchyLabel: center.parent_id ? 'Child center' : 'Top-level center',
      managerOwnership: center.manager
        ? `${center.manager} owns approvals and reforecast sign-off`
        : 'Assign owner for approvals',
      budgetLinkage: mappedBudgets.length
        ? `Linked to ${mappedBudgets.length} budget lines with actual tracking`
        : 'Awaiting linked budget lines',
      transferWindow:
        utilization >= 85
          ? 'Transfer review required before further spend'
          : 'Transfer available within threshold policy',
    };
  });

const buildBudgetSettings = (fiscalYears) => ({
  defaultFiscalYear:
    fiscalYears.find((year) => year.status === 'active')?.id || fiscalYears[0]?.id || '',
  budgetPeriod: 'monthly',
  enforceBudgetLimits: true,
  allowBudgetTransfers: true,
  autoCloseExceededBudgets: false,
  warningThreshold: 70,
  criticalThreshold: 90,
  emailAlerts: true,
  dashboardWarnings: true,
  blockOverBudgetTransactions: false,
  approvalPolicy: 'Department owner -> Budget controller -> Finance director',
  transferWindow: 'Monthly transfer board every 5th business day',
  reforecastCadence: 'Quarterly rolling reforecast',
  budgetReleaseMode: 'Monthly release with quarterly hard review',
});

let state = {
  accounts: cloneValue(ACCOUNTING_MOCK_ACCOUNTS),
  costCenters: cloneValue(ACCOUNTING_MOCK_COST_CENTERS),
  budgetSettings: buildBudgetSettings(ACCOUNTING_MOCK_FISCAL_YEARS),
  activity: [
    {
      id: 'planning-1',
      date: '2026-03-30',
      title: 'Budget threshold posture reviewed for operational overspend alerts',
      actor: 'Budget Controller',
    },
    {
      id: 'planning-2',
      date: '2026-03-29',
      title: 'Cost center utilization aligned with analytic and budget tracking',
      actor: 'Finance Business Partner',
    },
    {
      id: 'planning-3',
      date: '2026-03-29',
      title: 'High-exposure ledger accounts reviewed for reporting classification',
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
  const accounts = enrichAccounts(currentState.accounts, ACCOUNTING_MOCK_ACCOUNT_TYPES);
  const costCenters = enrichCostCenters(currentState.costCenters, ACCOUNTING_MOCK_BUDGETS);
  const fiscalYears = cloneValue(ACCOUNTING_MOCK_FISCAL_YEARS);

  const overview = {
    activeAccounts: accounts.filter((account) => account.active).length,
    reconcilableAccounts: accounts.filter((account) => account.reconcile).length,
    highExposureAccounts: accounts.filter((account) => account.controlBand === 'High exposure')
      .length,
    archiveCandidates: accounts.filter((account) => account.archiveCandidate).length,
    activeCostCenters: costCenters.filter((center) => center.active).length,
    criticalCostCenters: costCenters.filter((center) => center.reviewState === 'critical').length,
    linkedBudgetCenters: costCenters.filter((center) => center.driver !== 'No linked budget plans')
      .length,
    trackedBudget: costCenters.reduce((sum, center) => sum + Number(center.budget || 0), 0),
    warningThreshold: Number(currentState.budgetSettings.warningThreshold || 0),
    criticalThreshold: Number(currentState.budgetSettings.criticalThreshold || 0),
  };

  const accountHierarchy = accounts
    .sort((left, right) => String(left.code).localeCompare(String(right.code)))
    .map((account) => ({
      id: account.id,
      code: account.code,
      name: account.name,
      hierarchyLevel: account.hierarchyLevel,
      parentCode: account.parentCode,
      archiveCandidate: account.archiveCandidate,
      defaultMappings: account.defaultMappings,
    }));

  const budgetPolicy = {
    approvalPolicy: currentState.budgetSettings.approvalPolicy,
    transferWindow: currentState.budgetSettings.transferWindow,
    reforecastCadence: currentState.budgetSettings.reforecastCadence,
    budgetReleaseMode: currentState.budgetSettings.budgetReleaseMode,
  };

  const alerts = [];

  if (overview.criticalCostCenters) {
    alerts.push({
      id: 'cost-center-pressure',
      severity: 'warning',
      title: `${overview.criticalCostCenters} cost centers are near or over threshold`,
      description:
        'Review budget transfer and overrun controls before approving further spend against pressured centers.',
    });
  }

  if (!currentState.budgetSettings.enforceBudgetLimits) {
    alerts.push({
      id: 'budget-limit-off',
      severity: 'info',
      title: 'Budget limits are not enforced',
      description:
        'Budget setup currently allows spending beyond configured limits without hard enforcement.',
    });
  }

  if (!alerts.length) {
    alerts.push({
      id: 'planning-steady',
      severity: 'success',
      title: 'Planning and structure controls are in a workable state',
      description:
        'Chart structure, cost-center visibility, and budget thresholds are ready for demo operations.',
    });
  }

  return {
    overview,
    alerts,
    accounts,
    accountHierarchy,
    costCenters,
    budgetSettings: cloneValue(currentState.budgetSettings),
    budgetPolicy,
    fiscalYears,
    activity: cloneValue(currentState.activity),
  };
}

export function subscribePlanningConfigWorkspace(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPlanningConfigWorkspaceVersion() {
  return workspaceVersion;
}

export function getPlanningConfigWorkspaceSnapshot() {
  return buildSnapshot(state);
}

export function createAccount(payload) {
  return updateState((draft) => {
    const id = nextId();
    draft.accounts.unshift({
      id,
      code: payload.code,
      name: payload.name,
      type_id: Number(payload.type_id),
      balance: Number(payload.balance || 0),
      is_active: true,
      reconcile: Boolean(payload.reconcile),
      parent_id: payload.parent_id ? Number(payload.parent_id) : null,
      archived: false,
    });
    draft.activity.unshift({
      id: `account-${id}`,
      date: '2026-03-30',
      title: `${payload.code} account added to chart of accounts`,
      actor: 'GL Accountant',
    });
    return { id };
  });
}

export function archiveAccount(accountId) {
  return updateState((draft) => {
    draft.accounts = draft.accounts.map((account) =>
      String(account.id) === String(accountId)
        ? { ...account, archived: true, is_active: false }
        : account
    );
    draft.activity.unshift({
      id: `archive-account-${accountId}`,
      date: '2026-03-30',
      title: `Account ${accountId} archived from active chart usage`,
      actor: 'GL Accountant',
    });
    return { id: accountId };
  });
}

export function toggleAccountStatus(accountId) {
  return updateState((draft) => {
    draft.accounts = draft.accounts.map((account) =>
      String(account.id) === String(accountId)
        ? { ...account, is_active: !(account.is_active !== false) }
        : account
    );
    return { id: accountId };
  });
}

export function createCostCenter(payload) {
  return updateState((draft) => {
    const id = nextId();
    draft.costCenters.unshift({
      id,
      code: payload.code,
      name: payload.name,
      manager: payload.manager,
      parent_id: payload.parent_id ? Number(payload.parent_id) : null,
      active: true,
      budget: Number(payload.budget || 0),
      spent: Number(payload.spent || 0),
    });
    draft.activity.unshift({
      id: `cost-center-${id}`,
      date: '2026-03-30',
      title: `${payload.code} cost center added for planning control`,
      actor: 'Finance Business Partner',
    });
    return { id };
  });
}

export function toggleCostCenterStatus(centerId) {
  return updateState((draft) => {
    draft.costCenters = draft.costCenters.map((center) =>
      String(center.id) === String(centerId)
        ? { ...center, active: !(center.active !== false) }
        : center
    );
    return { id: centerId };
  });
}

export function updateBudgetSettings(payload) {
  return updateState((draft) => {
    draft.budgetSettings = {
      ...draft.budgetSettings,
      ...payload,
    };
    draft.activity.unshift({
      id: `budget-settings-${Date.now()}`,
      date: '2026-03-30',
      title: 'Budget control settings updated',
      actor: 'Budget Controller',
    });
    return { updated: true };
  });
}
