import {
  ACCOUNTING_MOCK_BUDGETS,
  ACCOUNTING_MOCK_VENDORS,
  ACCOUNTING_MOCK_CUSTOMERS,
  ACCOUNTING_MOCK_COST_CENTERS,
  ACCOUNTING_MOCK_ANALYTIC_ITEMS,
  ACCOUNTING_MOCK_ANALYTIC_PLANS,
  ACCOUNTING_MOCK_JOURNAL_ENTRIES,
  ACCOUNTING_MOCK_ANALYTIC_ACCOUNTS,
} from '../demo-data';

const listeners = new Set();

let workspaceVersion = 0;

const TODAY = '2026-03-30';

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

const parseListField = (value, fallback = []) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return fallback;
};

export const formatAnalyticStatus = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

const planPresetById = {
  1: {
    level: 1,
    hierarchyLabel: 'Program dimension',
    mandatoryDimensions: ['Project', 'Partner'],
    applicability: ['Journal items', 'Customer invoices', 'Vendor bills'],
    governanceOwner: 'Program Finance Controller',
    approvalMode: 'Mandatory before posting',
    defaultPolicy: 'Revenue and direct cost split required',
    parentPlanId: null,
  },
  2: {
    level: 1,
    hierarchyLabel: 'Support dimension',
    mandatoryDimensions: ['Cost center'],
    applicability: ['Expense claims', 'Payroll journals', 'Accruals'],
    governanceOwner: 'Shared Services Finance Lead',
    approvalMode: 'Review on exceptions',
    defaultPolicy: 'Shared-service allocations required for overhead journals',
    parentPlanId: null,
  },
  3: {
    level: 1,
    hierarchyLabel: 'Funding dimension',
    mandatoryDimensions: ['Funding source', 'Partner'],
    applicability: ['Grant revenue', 'Donor billing', 'Restricted expenses'],
    governanceOwner: 'Donor Compliance Manager',
    approvalMode: 'Always enforce',
    defaultPolicy: 'Restricted funds cannot post without source and partner mapping',
    parentPlanId: null,
  },
  4: {
    level: 2,
    hierarchyLabel: 'Field dimension',
    mandatoryDimensions: ['Location', 'Project'],
    applicability: ['Field expenses', 'Fleet journals', 'Relief distributions'],
    governanceOwner: 'Field Operations Accountant',
    approvalMode: 'Mandatory for field transactions',
    defaultPolicy: 'Field postings require both location and beneficiary program tag',
    parentPlanId: 1,
  },
};

const additionalPlans = [
  {
    id: 4,
    name: 'Field Operations',
    description: 'Operational geography and field-office allocation dimension.',
    color: '#0f766e',
    active: true,
  },
];

const buildInitialPlans = () => {
  const plans = [...ACCOUNTING_MOCK_ANALYTIC_PLANS, ...additionalPlans].map((plan) => ({
    ...cloneValue(plan),
    ...(planPresetById[plan.id] || {
      level: 1,
      hierarchyLabel: 'General analytic dimension',
      mandatoryDimensions: ['Project'],
      applicability: ['Journal items'],
      governanceOwner: 'Finance Manager',
      approvalMode: 'Review on exceptions',
      defaultPolicy: 'Standard allocation policy',
      parentPlanId: null,
    }),
    active: plan.active !== false,
  }));

  return plans;
};

const additionalAccounts = [
  {
    id: 5,
    code: 'ANA-FLD',
    name: 'Field Operations Coxs Bazar',
    plan_id: 4,
    partner: 'Emergency Relief Alliance',
    debit: 68000,
    credit: 12000,
    balance: 56000,
    active: true,
  },
];

const additionalItems = [
  {
    id: 6,
    analytic_account_id: 5,
    date: '2026-03-26',
    reference: 'JE-2026-034',
    description: 'Field fleet fuel allocation',
    general_account: '6201 - Fuel Expense',
    amount: 18000,
  },
  {
    id: 7,
    analytic_account_id: 5,
    date: '2026-03-28',
    reference: 'BILL-AP-003',
    description: 'Warehouse handling support cost',
    general_account: '5205 - Logistics Support Expense',
    amount: 9500,
  },
];

const buildJournalIndex = () => {
  const index = new Map();

  ACCOUNTING_MOCK_JOURNAL_ENTRIES.forEach((entry) => {
    index.set(entry.number, entry);
  });

  return index;
};

const journalIndex = buildJournalIndex();

const buildInitialAccounts = () => {
  const plans = buildInitialPlans();
  const budgetsByPlan = {
    1: ACCOUNTING_MOCK_BUDGETS[1],
    2: ACCOUNTING_MOCK_BUDGETS[2],
    3: ACCOUNTING_MOCK_BUDGETS[0],
    4: ACCOUNTING_MOCK_BUDGETS[0],
  };

  return [...ACCOUNTING_MOCK_ANALYTIC_ACCOUNTS, ...additionalAccounts].map((account, index) => {
    const plan = plans.find((item) => item.id === account.plan_id);
    const customer = ACCOUNTING_MOCK_CUSTOMERS[index % ACCOUNTING_MOCK_CUSTOMERS.length];
    const vendor = ACCOUNTING_MOCK_VENDORS[index % ACCOUNTING_MOCK_VENDORS.length];
    const costCenter = ACCOUNTING_MOCK_COST_CENTERS[index % ACCOUNTING_MOCK_COST_CENTERS.length];
    const budget = budgetsByPlan[account.plan_id] || ACCOUNTING_MOCK_BUDGETS[0];
    const totalAbs = Math.max(
      Math.abs(Number(account.debit || 0)) + Math.abs(Number(account.credit || 0)),
      1
    );
    const partnerSplit = [
      { id: 1, name: customer?.name || account.partner || 'Partner A', percent: 60 },
      { id: 2, name: vendor?.name || 'Shared Vendor Pool', percent: 40 },
    ];
    const projectSplit = [
      { id: 1, name: budget?.name || 'Program Budget', percent: 70 },
      { id: 2, name: `${costCenter?.name || 'Operations'} Support`, percent: 30 },
    ];

    return {
      ...cloneValue(account),
      planName: plan?.name || 'Unassigned Plan',
      planColor: plan?.color || '#64748b',
      level: plan?.level || 1,
      hierarchyLabel: plan?.hierarchyLabel || 'General analytic dimension',
      mandatoryDimensions: cloneValue(plan?.mandatoryDimensions || []),
      requiresPartner: (plan?.mandatoryDimensions || []).includes('Partner'),
      requiresProject: (plan?.mandatoryDimensions || []).includes('Project'),
      distributionMethod: index % 2 === 0 ? 'fixed_ratio' : 'manual_split',
      enforcementStatus: (plan?.mandatoryDimensions || []).length > 1 ? 'strict' : 'advisory',
      applicableSources: cloneValue(plan?.applicability || []),
      governanceOwner: plan?.governanceOwner || 'Finance Manager',
      costCenterName: costCenter?.name || 'Shared Services',
      owner: customer?.collector || 'Finance Business Partner',
      partnerDistribution: partnerSplit,
      projectDistribution: projectSplit,
      mandatoryCompletion: Math.round(((plan?.mandatoryDimensions || []).length / 3) * 100),
      lineCount: 0,
      utilizationRate: Math.round((Math.abs(Number(account.balance || 0)) / totalAbs) * 100),
    };
  });
};

const buildInitialItems = () =>
  [...ACCOUNTING_MOCK_ANALYTIC_ITEMS, ...additionalItems].map((item, index) => {
    const sourceReference = String(item.reference || '');
    const journal = journalIndex.get(sourceReference);
    const customer = ACCOUNTING_MOCK_CUSTOMERS[index % ACCOUNTING_MOCK_CUSTOMERS.length];
    const budget = ACCOUNTING_MOCK_BUDGETS[index % ACCOUNTING_MOCK_BUDGETS.length];
    const costCenter = ACCOUNTING_MOCK_COST_CENTERS[index % ACCOUNTING_MOCK_COST_CENTERS.length];

    return {
      ...cloneValue(item),
      journalNumber: sourceReference.startsWith('JE-')
        ? sourceReference
        : journal?.number || `JE-LINK-${index + 1}`,
      journalName: sourceReference.startsWith('INV-')
        ? 'Customer Invoices'
        : sourceReference.startsWith('BILL-')
          ? 'Vendor Bills'
          : 'General Journal',
      journalLineCode: `JL-${String(index + 1).padStart(3, '0')}`,
      sourceType: sourceReference.startsWith('INV-')
        ? 'invoice'
        : sourceReference.startsWith('BILL-')
          ? 'bill'
          : sourceReference.startsWith('BUD-')
            ? 'budget'
            : 'journal',
      partnerName: customer?.name || 'Internal',
      projectName: budget?.name || 'Program Budget',
      costCenterName: costCenter?.name || 'Shared Services',
      distributionStatus: index % 3 === 0 ? 'validated' : index % 3 === 1 ? 'warning' : 'draft',
      postedBy: ['Finance Manager', 'AR Lead', 'AP Lead'][index % 3],
      tags: [budget?.department || 'Program', costCenter?.code || 'CC'],
    };
  });

const buildInitialState = () => ({
  plans: buildInitialPlans(),
  accounts: buildInitialAccounts(),
  items: buildInitialItems(),
  recentActivity: [
    {
      id: 'act-1',
      date: '2026-03-30',
      title: 'Mandatory partner dimension flagged on restricted fund postings',
      actor: 'Donor Compliance Manager',
      status: 'warning',
    },
    {
      id: 'act-2',
      date: '2026-03-29',
      title: 'Field Operations plan opened for emergency cost allocation',
      actor: 'Field Operations Accountant',
      status: 'posted',
    },
    {
      id: 'act-3',
      date: '2026-03-28',
      title: 'Project distribution rebalanced for Health Outreach',
      actor: 'Program Finance Controller',
      status: 'info',
    },
  ],
});

const workspaceState = buildInitialState();

const emitChange = () => {
  workspaceVersion += 1;
  listeners.forEach((listener) => listener());
};

const buildRules = (plans, accounts, items) => {
  const draftItems = items.filter((item) => item.distributionStatus === 'draft').length;

  return plans.map((plan) => {
    const planAccounts = accounts.filter((account) => account.plan_id === plan.id);
    const planItems = items.filter((item) =>
      planAccounts.some((account) => account.id === item.analytic_account_id)
    );

    return {
      id: `rule-${plan.id}`,
      planId: plan.id,
      planName: plan.name,
      mandatoryDimensions: plan.mandatoryDimensions,
      enforcementStatus: plan.mandatoryDimensions.length > 1 ? 'strict' : 'advisory',
      appliesTo: plan.applicability,
      accountCount: planAccounts.length,
      itemCount: planItems.length,
      exceptionCount: planItems.filter((item) => item.distributionStatus !== 'validated').length,
      draftItems,
      owner: plan.governanceOwner,
    };
  });
};

const buildPlanHierarchy = (plans, accounts) =>
  plans.map((plan) => ({
    ...plan,
    childPlans: plans.filter((candidate) => candidate.parentPlanId === plan.id),
    accountCount: accounts.filter((account) => account.plan_id === plan.id).length,
    mandatoryCount: plan.mandatoryDimensions.length,
    applicabilityCount: plan.applicability.length,
  }));

const buildAccounts = (plans, accounts, items) =>
  accounts.map((account) => {
    const plan = plans.find((item) => item.id === account.plan_id);
    const accountItems = items.filter((item) => item.analytic_account_id === account.id);

    return {
      ...account,
      planName: plan?.name || account.planName,
      planColor: plan?.color || account.planColor,
      lineCount: accountItems.length,
      lastEntryDate: accountItems[0]?.date || TODAY,
      entryStatus: accountItems.some((item) => item.distributionStatus !== 'validated')
        ? 'review'
        : 'validated',
    };
  });

const buildItems = (plans, accounts, items) =>
  items
    .map((item) => {
      const account = accounts.find((entry) => entry.id === item.analytic_account_id);
      const plan = plans.find((entry) => entry.id === account?.plan_id);

      return {
        ...item,
        accountCode: account?.code || 'N/A',
        accountName: account?.name || 'Unassigned account',
        planId: plan?.id || null,
        planName: plan?.name || 'Unassigned plan',
        planColor: plan?.color || '#64748b',
      };
    })
    .sort((left, right) => new Date(right.date) - new Date(left.date));

const buildOverview = (plans, accounts, items, rules) => ({
  planCount: plans.length,
  accountCount: accounts.length,
  activeAccountCount: accounts.filter((account) => account.active).length,
  itemCount: items.length,
  totalBalance: accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0),
  debitTotal: accounts.reduce((sum, account) => sum + Number(account.debit || 0), 0),
  creditTotal: accounts.reduce((sum, account) => sum + Number(account.credit || 0), 0),
  mandatoryRuleCount: rules.filter((rule) => rule.mandatoryDimensions.length > 0).length,
  exceptionCount: items.filter((item) => item.distributionStatus !== 'validated').length,
});

export const getAnalyticWorkspaceSnapshot = () => {
  const plans = buildPlanHierarchy(workspaceState.plans, workspaceState.accounts);
  const accounts = buildAccounts(plans, workspaceState.accounts, workspaceState.items);
  const items = buildItems(plans, accounts, workspaceState.items);
  const rules = buildRules(plans, accounts, items);
  const overview = buildOverview(plans, accounts, items, rules);

  return {
    overview,
    plans,
    accounts,
    items,
    rules,
    recentActivity: cloneValue(workspaceState.recentActivity),
  };
};

export const getAnalyticWorkspaceVersion = () => workspaceVersion;

export const subscribeAnalyticWorkspace = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const createAnalyticPlan = (payload) => {
  const nextId = Math.max(0, ...workspaceState.plans.map((plan) => plan.id)) + 1;
  const mandatoryDimensions = parseListField(payload.mandatoryDimensions, []);
  const applicability = parseListField(payload.applicability, ['Journal items']);

  workspaceState.plans = [
    {
      id: nextId,
      name: payload.name,
      description: payload.description,
      color: payload.color || '#2563eb',
      active: true,
      level: Number(payload.level || 1),
      hierarchyLabel: payload.hierarchyLabel || 'Custom analytic dimension',
      mandatoryDimensions,
      applicability,
      governanceOwner: payload.governanceOwner || 'Finance Manager',
      approvalMode: payload.approvalMode || 'Review on exceptions',
      defaultPolicy: payload.defaultPolicy || 'Custom policy',
      parentPlanId: payload.parentPlanId ? Number(payload.parentPlanId) : null,
    },
    ...workspaceState.plans,
  ];

  workspaceState.recentActivity = [
    {
      id: `activity-plan-${nextId}`,
      date: TODAY,
      title: `${payload.name} analytic plan created`,
      actor: payload.governanceOwner || 'Finance Manager',
      status: 'posted',
    },
    ...workspaceState.recentActivity,
  ];

  emitChange();
  return nextId;
};

export const createAnalyticAccount = (payload) => {
  const nextId = Math.max(0, ...workspaceState.accounts.map((account) => account.id)) + 1;
  const plan = workspaceState.plans.find((item) => item.id === Number(payload.planId));
  const fallbackDimensions = cloneValue(plan?.mandatoryDimensions || []);
  const explicitDimensions = parseListField(payload.mandatoryDimensions, fallbackDimensions);
  const mandatoryDimensions = explicitDimensions.length
    ? explicitDimensions
    : [
        ...(payload.requiresPartner ? ['Partner'] : []),
        ...(payload.requiresProject ? ['Project'] : []),
      ];

  workspaceState.accounts = [
    {
      id: nextId,
      code: payload.code,
      name: payload.name,
      plan_id: Number(payload.planId),
      partner: payload.partner,
      debit: Number(payload.openingDebit || 0),
      credit: Number(payload.openingCredit || 0),
      balance: Number(payload.openingDebit || 0) - Number(payload.openingCredit || 0),
      active: true,
      projectName: payload.projectName,
      distributionMethod: payload.distributionMethod || 'fixed_ratio',
      mandatoryDimensions,
      requiresPartner: mandatoryDimensions.includes('Partner'),
      requiresProject: mandatoryDimensions.includes('Project'),
      partnerDistribution: payload.partnerDistribution || [
        { id: 1, name: payload.partner || 'Primary partner', percent: 100 },
      ],
      projectDistribution: payload.projectDistribution || [
        { id: 1, name: payload.projectName || 'Primary project', percent: 100 },
      ],
      costCenterName: payload.costCenterName || 'Shared Services',
      governanceOwner: plan?.governanceOwner || 'Finance Manager',
      applicableSources: cloneValue(plan?.applicability || ['Journal items']),
    },
    ...workspaceState.accounts,
  ];

  workspaceState.recentActivity = [
    {
      id: `activity-account-${nextId}`,
      date: TODAY,
      title: `${payload.code} analytic account opened`,
      actor: plan?.governanceOwner || 'Finance Manager',
      status: 'posted',
    },
    ...workspaceState.recentActivity,
  ];

  emitChange();
  return nextId;
};

export const togglePlanMandatoryEnforcement = (planId) => {
  workspaceState.plans = workspaceState.plans.map((plan) => {
    if (plan.id !== Number(planId)) return plan;

    return {
      ...plan,
      mandatoryDimensions: plan.mandatoryDimensions.length ? [] : ['Project', 'Partner'],
      approvalMode: plan.mandatoryDimensions.length ? 'Review on exceptions' : 'Always enforce',
    };
  });

  workspaceState.recentActivity = [
    {
      id: `activity-rule-${planId}-${Date.now()}`,
      date: TODAY,
      title: 'Mandatory dimension policy updated',
      actor: 'Finance Manager',
      status: 'info',
    },
    ...workspaceState.recentActivity,
  ];

  emitChange();
};
