'use client';

import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';

import axios, { fetcher, endpoints } from 'src/utils/axios';

const asArray = (data) => (Array.isArray(data) ? data : (data?.results ?? []));

// ── Helpers ───────────────────────────────────────────────────────────────────
const parseCSV = (val) => {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (!val) return [];
  return String(val)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

export const formatAnalyticStatus = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

// ── Data transformers ─────────────────────────────────────────────────────────
const transformPlan = (raw) => ({
  id: raw.id,
  name: raw.name || '',
  description: raw.description || '',
  color: raw.color || '#64748b',
  active: raw.is_active !== false,
  level: Number(raw.level || 1),
  hierarchyLabel: raw.hierarchy_label || 'General analytic dimension',
  mandatoryDimensions: parseCSV(raw.mandatory_dimensions),
  applicability: parseCSV(raw.applicability),
  governanceOwner: raw.governance_owner || 'Finance Manager',
  approvalMode: raw.approval_mode || 'Review on exceptions',
  defaultPolicy: raw.default_policy || '',
  parentPlanId: raw.parent_plan || null,
  accountCount: raw.account_count || 0,
  // childPlans populated in buildPlanHierarchy
  childPlans: [],
});

const transformAccount = (raw, plans) => {
  const plan = plans.find((p) => p.id === (raw.plan || null)) || null;
  const partner = raw.partner || '';
  const projectName = raw.project_name || '';
  return {
    id: raw.id,
    code: raw.code || '',
    name: raw.name || '',
    plan_id: raw.plan || null,
    planName: plan?.name || raw.plan_name || 'Unassigned Plan',
    planColor: plan?.color || raw.plan_color || '#64748b',
    partner,
    projectName,
    balance: Number(raw.balance || 0),
    debit: Number(raw.debit || 0),
    credit: Number(raw.credit || 0),
    active: raw.is_active !== false,
    mandatoryDimensions: plan ? [...plan.mandatoryDimensions] : [],
    requiresPartner: plan ? plan.mandatoryDimensions.includes('Partner') : false,
    requiresProject: plan ? plan.mandatoryDimensions.includes('Project') : false,
    lineCount: 0,
    entryStatus: 'validated',
    governanceOwner: plan?.governanceOwner || 'Finance Manager',
    distributionMethod: raw.distribution_method || 'fixed_ratio',
    costCenterName: '',
    partnerDistribution: [{ id: 1, name: partner || 'Primary partner', percent: 100 }],
    projectDistribution: [{ id: 1, name: projectName || 'Primary project', percent: 100 }],
  };
};

// ── Derived data builders ─────────────────────────────────────────────────────
const buildPlanHierarchy = (plans, accounts) =>
  plans.map((plan) => ({
    ...plan,
    childPlans: plans.filter((p) => p.parentPlanId === plan.id),
    accountCount: accounts.filter((a) => a.plan_id === plan.id).length,
  }));

const buildRules = (plans, accounts) =>
  plans.map((plan) => {
    const planAccounts = accounts.filter((a) => a.plan_id === plan.id);
    return {
      id: `rule-${plan.id}`,
      planId: plan.id,
      planName: plan.name,
      mandatoryDimensions: plan.mandatoryDimensions,
      enforcementStatus: plan.mandatoryDimensions.length > 1 ? 'strict' : 'advisory',
      appliesTo: plan.applicability,
      accountCount: planAccounts.length,
      exceptionCount: 0,
    };
  });

const buildOverview = (plans, accounts, rules) => ({
  planCount: plans.length,
  accountCount: accounts.length,
  activeAccountCount: accounts.filter((a) => a.active).length,
  totalBalance: accounts.reduce((sum, a) => sum + a.balance, 0),
  debitTotal: accounts.reduce((sum, a) => sum + a.debit, 0),
  creditTotal: accounts.reduce((sum, a) => sum + a.credit, 0),
  itemCount: 0,
  mandatoryRuleCount: rules.filter((r) => r.mandatoryDimensions.length > 0).length,
  exceptionCount: 0,
});

// ── Module-level revalidators (used by exported action fns) ───────────────────
const revalidatePlans = () => mutate(endpoints.accounting.analytic_plans);
const revalidateAccounts = () => mutate(endpoints.accounting.analytic_accounts);
const revalidateAll = async () => {
  await revalidatePlans();
  await revalidateAccounts();
};

// ── Exported action functions ─────────────────────────────────────────────────
export async function createAnalyticPlan(payload) {
  // Clamp color to a valid 7-char hex (#rrggbb); fall back to brand default.
  const rawColor = String(payload.color || '#2563eb').trim();
  const color = /^#[0-9a-fA-F]{6}$/.test(rawColor) ? rawColor : '#2563eb';

  const { data } = await axios.post(endpoints.accounting.analytic_plans, {
    name: payload.name,
    description: payload.description || '',
    color,
    // parseInt guards against float strings ("1.5") that IntegerField rejects
    level: parseInt(String(payload.level ?? 1), 10) || 1,
    hierarchy_label: payload.hierarchyLabel || '',
    mandatory_dimensions: Array.isArray(payload.mandatoryDimensions)
      ? payload.mandatoryDimensions.join(', ')
      : payload.mandatoryDimensions || '',
    applicability: Array.isArray(payload.applicability)
      ? payload.applicability.join(', ')
      : payload.applicability || 'Journal items',
    governance_owner: payload.governanceOwner || '',
    approval_mode: payload.approvalMode || 'Review on exceptions',
    default_policy: payload.defaultPolicy || '',
    parent_plan: payload.parentPlanId ? Number(payload.parentPlanId) : null,
  });
  await revalidateAll();
  return data;
}

export async function createAnalyticAccount(payload) {
  const { data } = await axios.post(endpoints.accounting.analytic_accounts, {
    code: payload.code,
    name: payload.name,
    plan: payload.planId ? Number(payload.planId) : null,
    partner: payload.partner || '',
    balance: Number(payload.openingDebit || 0) - Number(payload.openingCredit || 0),
    debit: Number(payload.openingDebit || 0),
    credit: Number(payload.openingCredit || 0),
    distribution_method: payload.distributionMethod || 'fixed_ratio',
    is_active: true,
  });
  await revalidateAll();
  return data;
}

export async function togglePlanMandatoryEnforcement(planId) {
  const { data: current } = await axios.get(endpoints.accounting.analytic_plan_by_id(planId));
  const hasDimensions = parseCSV(current.mandatory_dimensions).length > 0;
  const { data } = await axios.patch(endpoints.accounting.analytic_plan_by_id(planId), {
    mandatory_dimensions: hasDimensions ? '' : 'Project, Partner',
    approval_mode: hasDimensions ? 'Review on exceptions' : 'Always enforce',
  });
  await revalidateAll();
  return data;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAnalyticWorkspace() {
  const {
    data: rawPlans,
    isLoading: plansLoading,
    mutate: mutatePlans,
  } = useSWR(endpoints.accounting.analytic_plans, fetcher);
  const {
    data: rawAccounts,
    isLoading: accountsLoading,
    mutate: mutateAccounts,
  } = useSWR(endpoints.accounting.analytic_accounts, fetcher);

  const isLoading = plansLoading || accountsLoading;

  const revalidate = useCallback(async () => {
    await mutatePlans();
    await mutateAccounts();
  }, [mutatePlans, mutateAccounts]);

  return useMemo(() => {
    const rawPlanList = asArray(rawPlans).map(transformPlan);
    const rawAccountList = asArray(rawAccounts).map((raw) => transformAccount(raw, rawPlanList));
    const plans = buildPlanHierarchy(rawPlanList, rawAccountList);
    const rules = buildRules(plans, rawAccountList);
    const overview = buildOverview(plans, rawAccountList, rules);

    return {
      isLoading,
      plans,
      accounts: rawAccountList,
      items: [],
      rules,
      overview,
      recentActivity: [],
      formatAnalyticStatus,
      actions: {
        createAnalyticPlan: async (payload) => {
          const result = await createAnalyticPlan(payload);
          await revalidate();
          return result;
        },
        createAnalyticAccount: async (payload) => {
          const result = await createAnalyticAccount(payload);
          await revalidate();
          return result;
        },
        togglePlanMandatoryEnforcement: async (planId) => {
          const result = await togglePlanMandatoryEnforcement(planId);
          await revalidate();
          return result;
        },
        deleteAnalyticPlan: async (id) => {
          await axios.delete(endpoints.accounting.analytic_plan_by_id(id));
          await revalidate();
        },
        deleteAnalyticAccount: async (id) => {
          await axios.delete(endpoints.accounting.analytic_account_by_id(id));
          await revalidate();
        },
        updateAnalyticPlan: async (id, payload) => {
          const { data } = await axios.patch(endpoints.accounting.analytic_plan_by_id(id), payload);
          await revalidate();
          return data;
        },
        updateAnalyticAccount: async (id, payload) => {
          const { data } = await axios.patch(
            endpoints.accounting.analytic_account_by_id(id),
            payload
          );
          await revalidate();
          return data;
        },
      },
    };
  }, [isLoading, rawPlans, rawAccounts, revalidate]);
}
