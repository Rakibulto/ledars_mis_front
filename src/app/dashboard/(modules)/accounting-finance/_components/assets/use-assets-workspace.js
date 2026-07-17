'use client';

import useSWR, { mutate } from 'swr';
import { useMemo, useEffect, useCallback } from 'react';

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
const asArray = (data) => (Array.isArray(data) ? data : data?.results || []);

const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100;

const formatMonthLabel = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

export const formatAssetStatus = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

// ── Status mapping ────────────────────────────────────────────────────────────
// Backend: draft | running | fully_depreciated | disposed | closed
// Frontend: draft | active | fully_depreciated | disposed
const mapStatus = (s) => (s === 'running' ? 'active' : s || 'draft');

// ── Data transformers ─────────────────────────────────────────────────────────

const buildScheduleFromLines = (lines, purchaseCost) => {
  const sorted = [...lines].sort((a, b) => a.period - b.period);
  let openingValue = round2(purchaseCost);
  const firstPendingIdx = sorted.findIndex((l) => l.status !== 'posted');

  return sorted.map((line, i) => {
    const amount = round2(line.depreciation_amount);
    const closing = round2(line.remaining_value);
    const periodDate = line.date;
    const rowStatus =
      line.status === 'posted'
        ? 'posted'
        : i === firstPendingIdx
          ? 'pending'
          : i <= firstPendingIdx + 2
            ? 'scheduled'
            : 'forecast';
    const row = {
      id: `${line.asset}-${line.period}`,
      sequence: line.period,
      period: formatMonthLabel(periodDate),
      periodDate,
      openingValue,
      depreciationAmount: amount,
      closingValue: closing,
      status: rowStatus,
      journalEntry: line.status === 'posted' ? `DEP-${periodDate.slice(0, 7)}-${line.id}` : '',
    };
    openingValue = closing;
    return row;
  });
};

const buildTimeline = (asset, impairments, transfers) => {
  const events = [
    {
      id: 1,
      date: asset.purchase_date,
      label: 'Capitalized',
      status: 'posted',
      description: `${asset.name} was capitalized under ${asset.category_name || 'Fixed Assets'}.`,
    },
  ];
  (impairments || []).forEach((imp, idx) => {
    events.push({
      id: 100 + idx,
      date: imp.date,
      label: 'Impairment booked',
      status: 'warning',
      description: imp.reason,
    });
  });
  (transfers || []).forEach((trn, idx) => {
    events.push({
      id: 200 + idx,
      date: trn.date,
      label: 'Internal transfer',
      status: 'info',
      description: `${trn.from_location} to ${trn.to_location} for ${trn.assignee}.`,
    });
  });
  return events.sort((a, b) => new Date(b.date) - new Date(a.date));
};

const buildJournalEntries = (asset, impairments) => {
  const assetAccount = '1500 - Fixed Assets';
  const entries = [
    {
      id: 1,
      number: `CAP-${asset.code}`,
      date: asset.purchase_date,
      type: 'Capitalization',
      status: 'posted',
      memo: `${asset.name} recognized in fixed assets register.`,
      lines: [
        {
          account: assetAccount,
          debit: round2(asset.purchase_cost),
          credit: 0,
          description: `Capitalize ${asset.code}`,
        },
        {
          account: '2105 - Asset Clearing',
          debit: 0,
          credit: round2(asset.purchase_cost),
          description: `Vendor capitalization for ${asset.code}`,
        },
      ],
    },
  ];
  (impairments || []).forEach((imp, idx) => {
    entries.push({
      id: 100 + idx,
      number: `IMP-${asset.code}-${idx + 1}`,
      date: imp.date,
      type: 'Impairment',
      status: 'posted',
      memo: imp.reason,
      lines: [
        {
          account: '6705 - Asset Impairment Loss',
          debit: round2(imp.amount),
          credit: 0,
          description: `${asset.code} impairment charge`,
        },
        {
          account: assetAccount,
          debit: 0,
          credit: round2(imp.amount),
          description: `${asset.code} carrying value reduction`,
        },
      ],
    });
  });
  return entries.sort((a, b) => new Date(b.date) - new Date(a.date));
};

const transformAsset = (raw) => {
  const purchaseCost = round2(raw.purchase_cost);
  const currentValue = round2(raw.current_value);
  const salvageValue = round2(raw.salvage_value || 0);
  const accumulatedDepreciation = round2(purchaseCost - currentValue);
  const depreciationProgress =
    purchaseCost > 0 ? round2((accumulatedDepreciation / purchaseCost) * 100) : 0;

  const impairments = (raw.impairments || []).map((imp) => ({
    id: imp.id,
    date: imp.date,
    amount: round2(imp.amount),
    reason: imp.reason,
    reviewer: imp.reviewer || 'Finance Controller',
  }));

  const transfers = (raw.transfers || []).map((trn) => ({
    id: trn.id,
    date: trn.date,
    fromLocation: trn.from_location,
    toLocation: trn.to_location,
    assignee: trn.assignee,
    reason: trn.reason || '',
  }));

  const depLines = raw.depreciation_lines || [];
  const schedule = buildScheduleFromLines(depLines, purchaseCost);
  const nextLine =
    schedule.find((r) => r.status === 'pending') || schedule.find((r) => r.status === 'scheduled');

  const postedCount = depLines.filter((l) => l.status === 'posted').length;
  const remainingPeriods = Math.max((raw.useful_life || 1) - postedCount, 1);
  const monthlyDepreciation = round2(Math.max(currentValue - salvageValue, 0) / remainingPeriods);

  return {
    id: raw.id,
    name: raw.name,
    code: raw.code,
    categoryId: raw.category,
    categoryName: raw.category_name || 'Unassigned',
    purchaseCost,
    currentValue,
    salvageValue,
    purchaseDate: raw.purchase_date,
    placedInServiceDate: raw.purchase_date,
    status: mapStatus(raw.status),
    depreciationMethod: raw.depreciation_method || 'straight_line',
    usefulLifeMonths: raw.useful_life || 60,
    vendorId: raw.vendor,
    vendorName: raw.vendor_name || 'Unassigned',
    costCenterId: raw.cost_center,
    costCenterName: raw.cost_center_name || 'Unassigned',
    location: raw.location || '',
    custodian: raw.custodian || '',
    serialNumber: raw.serial_number || '',
    projectName: raw.project_name || '',
    condition: raw.condition || 'good',
    scheduleRevision: raw.schedule_revision || 1,
    accumulatedDepreciation,
    depreciationProgress,
    monthlyDepreciation,
    nextDepreciationPeriod: nextLine?.period || 'Schedule complete',
    postedDepreciationPeriods: postedCount,
    allowDisposal: raw.status !== 'disposed',
    impairments,
    transfers,
    schedule,
    timeline: buildTimeline(raw, impairments, transfers),
    journalEntries: buildJournalEntries(raw, impairments),
    attachments: [
      { id: 1, name: `${raw.code.toLowerCase()}-invoice.pdf` },
      { id: 2, name: `${raw.code.toLowerCase()}-handover-note.pdf` },
    ],
  };
};

const transformCategory = (raw) => ({
  id: raw.id,
  code: raw.code || '',
  name: raw.name,
  depreciation_method: raw.depreciation_method,
  useful_life: raw.useful_life,
  salvage_percent: raw.salvage_percent,
  asset_account: raw.asset_account_name || '1500 - Fixed Assets',
  assets_count: raw.assets_count || 0,
});

const transformVendor = (raw) => ({ id: raw.id, name: raw.name });

const transformCostCenter = (raw) => ({ id: raw.id, name: raw.name, code: raw.code || '' });

const transformDisposal = (raw, assets) => {
  const asset = assets.find((a) => a.id === raw.asset);
  return {
    id: raw.id,
    assetId: raw.asset,
    assetName: asset?.name || 'Unknown',
    assetCode: asset?.code || '',
    disposalDate: raw.disposal_date,
    method: raw.disposal_method,
    methodLabel: formatAssetStatus(raw.disposal_method),
    saleAmount: round2(raw.sale_amount),
    costOfRemoval: 0,
    bookValue: asset?.currentValue || 0,
    gainLoss: round2(raw.gain_loss),
    gainOrLoss: round2(raw.gain_loss),
    proceeds: round2(raw.sale_amount),
    status: 'completed',
    notes: raw.notes || '',
    proceedsHandling: 'Bank receipt into treasury clearing account',
    journalPreview: [
      {
        account: '1010 - Main Operating Bank',
        debit: round2(raw.sale_amount),
        credit: 0,
        description: 'Sale proceeds received',
      },
      {
        account: '1501 - Fixed Assets',
        debit: 0,
        credit: asset ? round2(asset.purchaseCost) : 0,
        description: 'Asset written off at disposal',
      },
      {
        account: '6801 - Loss on Disposal',
        debit: Math.abs(Math.min(0, round2(raw.gain_loss))),
        credit: 0,
        description: 'Recognized disposal loss',
      },
    ],
  };
};

// ── Derived computations ──────────────────────────────────────────────────────

const computeOverview = (assets, disposals) => {
  const activeAssets = assets.filter((a) => ['active', 'fully_depreciated'].includes(a.status));
  return {
    totalCost: round2(assets.reduce((s, a) => s + a.purchaseCost, 0)),
    bookValue: round2(assets.reduce((s, a) => s + a.currentValue, 0)),
    accumulatedDepreciation: round2(assets.reduce((s, a) => s + a.accumulatedDepreciation, 0)),
    activeCount: activeAssets.length,
    disposedCount: assets.filter((a) => a.status === 'disposed').length,
    fullyDepreciatedCount: assets.filter((a) => a.status === 'fully_depreciated').length,
    draftAcquisitions: 0,
    pendingDepreciationValue: round2(activeAssets.reduce((s, a) => s + a.monthlyDepreciation, 0)),
    impairmentExposure: round2(
      activeAssets.reduce((s, a) => s + a.impairments.reduce((si, imp) => si + imp.amount, 0), 0)
    ),
    netDisposalGainLoss: round2(disposals.reduce((s, d) => s + d.gainLoss, 0)),
  };
};

const computeAlerts = (overview, assets) => {
  const alerts = [];
  const pendingAssets = assets.filter(
    (a) => ['active', 'fully_depreciated'].includes(a.status) && a.monthlyDepreciation > 0
  );
  const impairmentAssets = assets.filter((a) => a.impairments.length > 0);

  if (pendingAssets.length) {
    alerts.push({
      id: 'pending-batch',
      severity: 'warning',
      title: `${pendingAssets.length} assets due for next depreciation run`,
      description:
        'Run the monthly depreciation batch to keep book values and asset reports aligned.',
    });
  }
  if (impairmentAssets.length > 0) {
    alerts.push({
      id: 'impairment-review',
      severity: 'error',
      title: `${impairmentAssets.length} assets carry impairment adjustments`,
      description:
        'Validate whether further impairment, repair capitalization, or disposal is required.',
    });
  }
  if (!alerts.length) {
    alerts.push({
      id: 'all-clear',
      severity: 'success',
      title: 'Asset controls are balanced',
      description: 'No immediate exceptions remain open across the fixed asset register.',
    });
  }
  return alerts;
};

const computeDepreciationQueue = (assets) =>
  assets
    .filter((a) => ['active', 'fully_depreciated'].includes(a.status))
    .map((a) => ({
      id: a.id,
      assetId: a.id,
      assetCode: a.code,
      assetName: a.name,
      code: a.code,
      name: a.name,
      categoryName: a.categoryName,
      status: a.status,
      bookValue: a.currentValue,
      monthlyDepreciation: a.monthlyDepreciation,
      amount: a.monthlyDepreciation,
      nextDepreciationPeriod: a.nextDepreciationPeriod,
      period: a.nextDepreciationPeriod,
      methodLabel: formatAssetStatus(a.depreciationMethod),
      postedPeriods: a.postedDepreciationPeriods,
      usefulLifeMonths: a.usefulLifeMonths,
      scheduleRevision: a.scheduleRevision,
    }))
    .sort((a, b) => b.monthlyDepreciation - a.monthlyDepreciation);

const computeRecentActivity = (assets, disposals) =>
  [
    ...assets.flatMap((a) =>
      a.timeline.map((ev) => ({ ...ev, assetCode: a.code, assetName: a.name }))
    ),
    ...disposals.map((d) => ({
      id: `disposal-${d.id}`,
      date: d.disposalDate,
      label: 'Disposal completed',
      status: 'error',
      description: `${d.assetCode} closed through ${d.method}.`,
      assetCode: d.assetCode,
      assetName: d.assetName,
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

const computeReporting = (assets, categories, disposals) => ({
  categoryPerformance: categories.map((cat) => {
    const catAssets = assets.filter((a) => a.categoryId === cat.id);
    return {
      id: cat.id,
      category: cat.name,
      count: catAssets.length,
      cost: round2(catAssets.reduce((s, a) => s + a.purchaseCost, 0)),
      bookValue: round2(catAssets.reduce((s, a) => s + a.currentValue, 0)),
      depreciation: round2(catAssets.reduce((s, a) => s + a.accumulatedDepreciation, 0)),
    };
  }),
  depreciationMovement: [],
  disposalAnalysis: disposals,
  topBookValueAssets: [...assets].sort((a, b) => b.currentValue - a.currentValue).slice(0, 5),
});

// ── Exported action functions ─────────────────────────────────────────────────

const revalidateAssets = () => mutate(endpoints.accounting.assets);

export async function createAssetAcquisition(payload) {
  const mode = payload.mode || 'capitalized';
  const { data } = await axios.post(endpoints.accounting.assets, {
    name: payload.name,
    code: payload.code || '',
    category: payload.categoryId,
    purchase_date: payload.purchaseDate,
    purchase_cost: payload.purchaseCost,
    salvage_value: payload.salvageValue || 0,
    useful_life: payload.usefulLifeMonths || Number(payload.usefulLifeYears || 0) * 12 || 60,
    depreciation_method: payload.depreciationMethod || 'straight_line',
    serial_number: payload.serialNumber || '',
    location: payload.location || '',
    custodian: payload.custodian || '',
    condition: payload.condition || 'good',
    project_name: payload.projectName || '',
    description: payload.description || '',
    vendor: payload.vendorId || null,
    cost_center: payload.costCenterId || null,
    status: mode === 'draft' ? 'draft' : 'running',
  });
  await revalidateAssets();
  return data;
}

export async function updateAssetRecord(assetId, payload) {
  const body = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.code !== undefined) body.code = payload.code;
  if (payload.status !== undefined)
    body.status = payload.status === 'active' ? 'running' : payload.status;
  if (payload.location !== undefined) body.location = payload.location;
  if (payload.custodian !== undefined) body.custodian = payload.custodian;
  const { data } = await axios.patch(endpoints.accounting.asset_by_id(assetId), body);
  await revalidateAssets();
  return data;
}

export async function deleteAssetRecord(assetId) {
  await axios.delete(endpoints.accounting.asset_by_id(assetId));
  await revalidateAssets();
}

export async function recordAssetImpairment(assetId, payload) {
  const { data } = await axios.post(endpoints.accounting.asset_record_impairment(assetId), {
    date: payload.date,
    amount: payload.amount,
    reason: payload.reason,
    reviewer: payload.reviewer || 'Finance Controller',
  });
  await revalidateAssets();
  return data;
}

export async function transferAsset(assetId, payload) {
  const { data } = await axios.post(endpoints.accounting.asset_transfer(assetId), {
    date: payload.date,
    to_location: payload.toLocation,
    assignee: payload.assignee,
    reason: payload.reason || '',
    cost_center_id: payload.costCenterId || null,
  });
  await revalidateAssets();
  return data;
}

export async function recalculateAssetSchedule(assetId) {
  const { data } = await axios.post(endpoints.accounting.asset_recalculate(assetId));
  await revalidateAssets();
  return data;
}

export async function runMonthlyDepreciationBatch(payload) {
  const assetIds = payload.assetIds || [];
  await Promise.all(
    assetIds.map((id) => axios.post(endpoints.accounting.asset_run_depreciation(id)))
  );
  await revalidateAssets();
  return { assetCount: assetIds.length };
}

export async function disposeAsset(assetId, payload) {
  const { data } = await axios.post(endpoints.accounting.asset_dispose(assetId), {
    disposal_date: payload.disposalDate,
    disposal_method: payload.method,
    sale_amount: payload.saleAmount || 0,
    notes: payload.notes || '',
    buyer: payload.buyer || '',
  });
  await revalidateAssets();
  return data;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAssetsWorkspace() {
  const {
    data: rawAssets,
    isLoading: assetsLoading,
    mutate: mutateAssets,
  } = useSWR(endpoints.accounting.assets, fetcher, SWR_OPTIONS);
  // ADD THIS — remove after debugging
  useEffect(() => {
    console.log('[Assets] rawAssets:', rawAssets);
  }, [rawAssets]);
  const { data: rawCategories, isLoading: categoriesLoading } = useSWR(
    endpoints.accounting.asset_categories,
    fetcher,
    SWR_OPTIONS
  );
  const { data: rawVendors, isLoading: vendorsLoading } = useSWR(
    endpoints.accounting.vendors,
    fetcher,
    SWR_OPTIONS
  );
  const { data: rawCostCenters, isLoading: costCentersLoading } = useSWR(
    endpoints.accounting.cost_centers,
    fetcher,
    SWR_OPTIONS
  );
  const { data: rawDisposals, isLoading: disposalsLoading } = useSWR(
    endpoints.accounting.asset_disposals,
    fetcher,
    SWR_OPTIONS
  );

  const isLoading =
    assetsLoading || categoriesLoading || vendorsLoading || costCentersLoading || disposalsLoading;

  const categories = useMemo(() => asArray(rawCategories).map(transformCategory), [rawCategories]);
  const vendors = useMemo(() => asArray(rawVendors).map(transformVendor), [rawVendors]);
  const costCenters = useMemo(
    () => asArray(rawCostCenters).map(transformCostCenter),
    [rawCostCenters]
  );
  const assets = useMemo(() => asArray(rawAssets).map((raw) => transformAsset(raw)), [rawAssets]);
  const disposals = useMemo(
    () => asArray(rawDisposals).map((d) => transformDisposal(d, assets)),
    [rawDisposals, assets]
  );
  const overview = useMemo(() => computeOverview(assets, disposals), [assets, disposals]);
  const alerts = useMemo(() => computeAlerts(overview, assets), [overview, assets]);
  const depreciationQueue = useMemo(() => computeDepreciationQueue(assets), [assets]);
  const recentActivity = useMemo(
    () => computeRecentActivity(assets, disposals),
    [assets, disposals]
  );
  const reporting = useMemo(
    () => computeReporting(assets, categories, disposals),
    [assets, categories, disposals]
  );

  const revalidate = useCallback(() => mutateAssets(), [mutateAssets]);

  return useMemo(
    () => ({
      isLoading,
      overview,
      alerts,
      categories,
      vendors,
      costCenters,
      assets,
      acquisitionQueue: [],
      depreciationQueue,
      depreciationRuns: [],
      disposals,
      reporting,
      recentActivity,
      formatAssetStatus,
      actions: {
        createAssetAcquisition: async (payload) => {
          const result = await createAssetAcquisition(payload);
          await revalidate();
          return result;
        },
        recordAssetImpairment: async (assetId, payload) => {
          const result = await recordAssetImpairment(assetId, payload);
          await revalidate();
          return result;
        },
        transferAsset: async (assetId, payload) => {
          const result = await transferAsset(assetId, payload);
          await revalidate();
          return result;
        },
        updateAssetRecord: async (assetId, payload) => {
          const result = await updateAssetRecord(assetId, payload);
          await revalidate();
          return result;
        },
        deleteAssetRecord: async (assetId) => {
          await deleteAssetRecord(assetId);
          await revalidate();
        },
        recalculateAssetSchedule: async (assetId) => {
          const result = await recalculateAssetSchedule(assetId);
          await revalidate();
          return result;
        },
        runMonthlyDepreciationBatch: async (payload) => {
          const result = await runMonthlyDepreciationBatch(payload);
          await revalidate();
          return result;
        },
        disposeAsset: async (assetId, payload) => {
          const result = await disposeAsset(assetId, payload);
          await revalidate();
          return result;
        },
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLoading, assets, categories, vendors, costCenters, disposals, overview, alerts]
  );
}
