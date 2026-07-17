'use client';

import {
  ACCOUNTING_MOCK_INCOTERMS,
  ACCOUNTING_MOCK_LOCK_DATES,
  ACCOUNTING_MOCK_FISCAL_POSITIONS,
} from '../demo-data';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createState() {
  return {
    lockDates: clone(ACCOUNTING_MOCK_LOCK_DATES).map((item, index) => ({
      ...item,
      scopeLabel: item.scope || 'Accounting period',
      enforcementLevel:
        item.type === 'hard' ? 'Hard close' : item.type === 'tax' ? 'Tax close' : 'Soft close',
      auditOwner: index % 2 === 0 ? 'Finance Controller' : 'Head of Accounts',
      escalationRule:
        item.type === 'soft'
          ? 'Escalate to tax lock 3 days before close'
          : item.type === 'tax'
            ? 'Escalate to hard lock at statutory cutoff'
            : 'Controller-only reopen path',
      impactSummary:
        index % 2 === 0
          ? 'Affects journals, invoices, and bills'
          : 'Affects tax reports and filing adjustments',
      history: [
        {
          id: `${item.id}-hist-1`,
          date: item.lock_date,
          action: 'Configured',
          actor: 'Finance Controller',
        },
      ],
    })),
    incoterms: clone(ACCOUNTING_MOCK_INCOTERMS).map((item, index) => ({
      ...item,
      usageScope:
        index % 2 === 0 ? 'Vendor bills and import logistics' : 'Customer invoice delivery terms',
      allocationRule:
        index % 2 === 0 ? 'Freight cost capture required' : 'Delivery confirmation required',
      adoptionRate: 32 + index * 14,
      billFlowUsage:
        index % 2 === 0
          ? 'Used on landed-cost vendor bills'
          : 'Used on service or export vendor bills',
      invoiceFlowUsage:
        index % 2 === 0
          ? 'Mirrors shipping cost pass-through on invoices'
          : 'Used on donor and export invoices',
    })),
    fiscalPositions: clone(ACCOUNTING_MOCK_FISCAL_POSITIONS).map((item, index) => ({
      ...item,
      jurisdictionCluster: index % 2 === 0 ? 'Domestic' : 'Cross-border',
      mappingCoverage: (item.tax_mappings?.length || 0) + (item.account_mappings?.length || 0),
      documentScope:
        index % 2 === 0 ? 'Sales and procurement' : 'Grant billing and donor receivables',
      previewScenario:
        index % 2 === 0
          ? 'Preview domestic invoice and purchase bill mapping'
          : 'Preview export or donor invoice mapping',
      autoApplyReason: item.auto_apply
        ? 'Applies automatically when partner country and tax profile match'
        : 'Manual analyst confirmation required',
    })),
  };
}

let state = createState();
const listeners = new Set();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getOverview() {
  const activeIncoterms = state.incoterms.filter((item) => item.active !== false).length;
  const activeFiscalPositions = state.fiscalPositions.filter(
    (item) => item.active !== false
  ).length;
  const hardLocks = state.lockDates.filter((item) => item.type === 'hard').length;

  return {
    lockDateCount: state.lockDates.length,
    hardLocks,
    activeIncoterms,
    activeFiscalPositions,
    policyCoverage: activeIncoterms + activeFiscalPositions + state.lockDates.length,
  };
}

function getAlerts() {
  const alerts = [];

  if (!state.lockDates.some((item) => item.type === 'hard')) {
    alerts.push({
      id: 'hard-lock',
      severity: 'warning',
      title: 'No hard lock configured',
      description:
        'A hard close date should exist to prevent period reopening without controller approval.',
    });
  }

  if (state.fiscalPositions.some((item) => !item.auto_apply)) {
    alerts.push({
      id: 'auto-apply',
      severity: 'info',
      title: 'Manual fiscal mapping remains',
      description: 'At least one fiscal position still requires manual operator selection.',
    });
  }

  if (!state.incoterms.some((item) => item.active !== false)) {
    alerts.push({
      id: 'incoterms',
      severity: 'warning',
      title: 'No active incoterms',
      description: 'Trade and delivery condition coverage is currently disabled.',
    });
  }

  if (!alerts.length) {
    alerts.push({
      id: 'stable',
      severity: 'success',
      title: 'Policy controls are in place',
      description:
        'Lock governance, fiscal mapping, and incoterm coverage look healthy for demo operations.',
    });
  }

  return alerts;
}

function addLockDate(payload) {
  const nextId = Math.max(0, ...state.lockDates.map((item) => Number(item.id) || 0)) + 1;
  const nextItem = {
    id: nextId,
    name: payload.name,
    description: payload.description,
    type: payload.type,
    lock_date: payload.lock_date,
    scope: payload.scope,
    applies_to: payload.applies_to,
    scopeLabel: payload.scope,
    enforcementLevel:
      payload.type === 'hard' ? 'Hard close' : payload.type === 'tax' ? 'Tax close' : 'Soft close',
    auditOwner: payload.auditOwner || 'Finance Controller',
    escalationRule: payload.escalationRule || 'Escalate under controller close calendar',
    impactSummary:
      payload.impactSummary || 'Affects accounting transactions and period-end controls',
    history: [
      {
        id: `${nextId}-hist-1`,
        date: payload.lock_date,
        action: 'Created',
        actor: 'Finance Controller',
      },
    ],
  };

  state = { ...state, lockDates: [nextItem, ...state.lockDates] };
  emitChange();
  return nextItem;
}

function updateLockDate(payload) {
  state = {
    ...state,
    lockDates: state.lockDates.map((item) => {
      if (item.id !== payload.id) {
        return item;
      }

      return {
        ...item,
        ...payload,
        history: [
          {
            id: `${item.id}-hist-${item.history.length + 1}`,
            date: payload.lock_date || item.lock_date,
            action: 'Updated',
            actor: 'Finance Controller',
          },
          ...item.history,
        ],
      };
    }),
  };
  emitChange();
}

function createIncoterm(payload) {
  const nextId = Math.max(0, ...state.incoterms.map((item) => Number(item.id) || 0)) + 1;
  const nextItem = {
    id: nextId,
    active: true,
    adoptionRate: 18,
    usageScope: payload.usageScope || 'Vendor bills and delivery documents',
    allocationRule: payload.allocationRule || 'Manual logistics review',
    billFlowUsage: payload.billFlowUsage || 'Used in vendor bill landed-cost review',
    invoiceFlowUsage: payload.invoiceFlowUsage || 'Used in customer invoice delivery validation',
    ...payload,
  };

  state = { ...state, incoterms: [nextItem, ...state.incoterms] };
  emitChange();
  return nextItem;
}

function toggleIncotermStatus(id) {
  state = {
    ...state,
    incoterms: state.incoterms.map((item) =>
      item.id === id ? { ...item, active: !item.active } : item
    ),
  };
  emitChange();
}

function createFiscalPosition(payload) {
  const nextId = Math.max(0, ...state.fiscalPositions.map((item) => Number(item.id) || 0)) + 1;
  const nextItem = {
    id: nextId,
    active: true,
    auto_apply: Boolean(payload.auto_apply),
    mappingCoverage: (payload.tax_mappings?.length || 0) + (payload.account_mappings?.length || 0),
    jurisdictionCluster: payload.country === 'Bangladesh' ? 'Domestic' : 'Cross-border',
    documentScope: payload.documentScope || 'Sales and procurement',
    previewScenario: payload.previewScenario || 'Preview invoice and bill mapping before posting',
    autoApplyReason: payload.auto_apply
      ? 'Applies automatically based on mapped fiscal profile'
      : 'Manual analyst confirmation required',
    ...payload,
  };

  state = { ...state, fiscalPositions: [nextItem, ...state.fiscalPositions] };
  emitChange();
  return nextItem;
}

function toggleFiscalPositionStatus(id) {
  state = {
    ...state,
    fiscalPositions: state.fiscalPositions.map((item) =>
      item.id === id ? { ...item, active: !item.active } : item
    ),
  };
  emitChange();
}

const actions = {
  addLockDate,
  updateLockDate,
  createIncoterm,
  toggleIncotermStatus,
  createFiscalPosition,
  toggleFiscalPositionStatus,
};

let lastSnapshot = null;
let lastStateRef = null;

function getSnapshot() {
  // return cached snapshot if state hasn't changed
  if (lastStateRef === state && lastSnapshot) {
    return lastSnapshot;
  }

  lastStateRef = state;

  lastSnapshot = {
    lockDates: state.lockDates,
    incoterms: state.incoterms,
    fiscalPositions: state.fiscalPositions,
    overview: getOverview(),
    alerts: getAlerts(),
    actions,
  };

  return lastSnapshot;
}

export const policyConfigStore = {
  subscribe,
  getSnapshot,
};
