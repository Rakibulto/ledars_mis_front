import {
  ACCOUNTING_MOCK_ASSETS,
  ACCOUNTING_MOCK_VENDORS,
  ACCOUNTING_MOCK_COST_CENTERS,
  ACCOUNTING_MOCK_ASSET_DISPOSALS,
  ACCOUNTING_MOCK_ASSET_CATEGORIES,
} from '../demo-data';

const TODAY = new Date('2026-03-29T09:00:00');

const listeners = new Set();

let workspaceVersion = 0;

const roundAmount = (value) => Number(Number(value || 0).toFixed(2));

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

const formatMonthLabel = (value) =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

const formatDate = (value) => new Date(value).toISOString().slice(0, 10);

const addMonths = (value, count) => {
  const date = new Date(value);
  date.setMonth(date.getMonth() + count);
  return formatDate(date);
};

const diffMonths = (fromDate, toDate = TODAY) => {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  return Math.max(
    0,
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  );
};

const endOfMonth = (value) => {
  const date = new Date(value);
  date.setMonth(date.getMonth() + 1, 0);
  return formatDate(date);
};

export const formatAssetStatus = (status) =>
  String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

export const formatLabel = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

const createJournalLine = (account, debit, credit, description) => ({
  account,
  debit: roundAmount(debit),
  credit: roundAmount(credit),
  description,
});

const categoryMap = new Map(
  ACCOUNTING_MOCK_ASSET_CATEGORIES.map((category) => [category.id, category])
);
const vendorMap = new Map(ACCOUNTING_MOCK_VENDORS.map((vendor) => [vendor.id, vendor]));
const costCenterMap = new Map(ACCOUNTING_MOCK_COST_CENTERS.map((center) => [center.id, center]));

const buildCapitalizationJournal = (asset, category) => {
  const assetAccount = category?.asset_account || '1500 - Fixed Assets';

  return [
    createJournalLine(assetAccount, asset.purchaseCost, 0, `Capitalize ${asset.code}`),
    createJournalLine(
      '2105 - Asset Clearing',
      0,
      asset.purchaseCost,
      `Vendor capitalization for ${asset.code}`
    ),
  ];
};

const buildTransferMemoLines = (asset, payload) => [
  createJournalLine('Memo only', 0, 0, `${asset.code} transferred to ${payload.toLocation}`),
];

const buildInitialAssets = () => {
  const enriched = ACCOUNTING_MOCK_ASSETS.map((asset, index) => {
    const category = categoryMap.get(asset.category);
    const purchaseCost = Number(asset.purchase_cost || 0);
    const usefulLifeMonths =
      Number(category?.useful_life || category?.depreciation_years || 5) * 12;
    const salvageValue = roundAmount((purchaseCost * Number(category?.salvage_percent || 5)) / 100);
    const vendorId = ACCOUNTING_MOCK_VENDORS[index % ACCOUNTING_MOCK_VENDORS.length]?.id || 1;
    const costCenterId =
      ACCOUNTING_MOCK_COST_CENTERS[index % ACCOUNTING_MOCK_COST_CENTERS.length]?.id || 1;
    const postedDepreciationPeriods = Math.min(
      diffMonths(asset.purchase_date),
      usefulLifeMonths - 1
    );
    const location =
      ['Dhaka HQ Garage', 'ICT Lab Floor 2', 'Jessore Clinic', 'Warehouse Yard'][index] ||
      'Operations Hub';
    const custodian =
      ['Logistics Lead', 'IT Coordinator', 'Clinic Operations', 'Warehouse Officer'][index] ||
      'Operations Lead';
    const attachments = [
      `${asset.code.toLowerCase()}-invoice.pdf`,
      `${asset.code.toLowerCase()}-handover-note.pdf`,
    ];
    const capitalizationJournal = buildCapitalizationJournal(
      { code: asset.code, purchaseCost },
      category
    );

    return {
      id: asset.id,
      name: asset.name,
      code: asset.code,
      categoryId: asset.category,
      purchaseCost,
      currentValue: Number(asset.current_value || 0),
      purchaseDate: asset.purchase_date,
      placedInServiceDate: asset.purchase_date,
      status: asset.status === 'active' ? 'active' : asset.status,
      depreciationMethod: category?.depreciation_method || 'straight_line',
      usefulLifeMonths,
      salvageValue,
      vendorId,
      costCenterId,
      location,
      custodian,
      serialNumber: `${asset.code}-SN-${1000 + asset.id}`,
      projectName:
        ['Fleet Management', 'Digital Education', 'Cold Chain', 'Power Backup'][index] ||
        'General Fund',
      condition: index === 0 ? 'good' : index === 1 ? 'good' : index === 2 ? 'fair' : 'retired',
      postedDepreciationPeriods,
      scheduleRevision: 1,
      allowDisposal: asset.status !== 'disposed',
      attachments,
      impairments:
        asset.id === 3
          ? [
              {
                id: 1,
                date: '2026-02-14',
                amount: 8000,
                reason: 'Cooling capacity downgraded after power fluctuations.',
                reviewer: 'Finance Controller',
              },
            ]
          : [],
      transfers:
        asset.id === 1
          ? [
              {
                id: 1,
                date: '2025-11-09',
                fromLocation: 'Dhaka HQ Garage',
                toLocation: "Cox's Bazar Field Office",
                assignee: 'Field Logistics Officer',
                reason: 'Vehicle redeployed to emergency response program.',
              },
            ]
          : [],
      journalEntries: [
        {
          id: 1,
          number: `CAP-${asset.code}`,
          date: asset.purchase_date,
          type: 'Capitalization',
          status: 'posted',
          memo: `${asset.name} recognized in fixed assets register.`,
          lines: capitalizationJournal,
        },
      ],
      timeline: [
        {
          id: 1,
          date: asset.purchase_date,
          label: 'Capitalized',
          status: 'posted',
          description: `${asset.name} was capitalized under ${category?.name || 'Fixed Assets'}.`,
        },
      ],
    };
  });

  enriched.forEach((asset) => {
    asset.impairments.forEach((impairment, index) => {
      asset.timeline.push({
        id: 100 + index,
        date: impairment.date,
        label: 'Impairment booked',
        status: 'warning',
        description: impairment.reason,
      });
      asset.journalEntries.push({
        id: 100 + index,
        number: `IMP-${asset.code}-${index + 1}`,
        date: impairment.date,
        type: 'Impairment',
        status: 'posted',
        memo: impairment.reason,
        lines: [
          createJournalLine(
            '6705 - Asset Impairment Loss',
            impairment.amount,
            0,
            `${asset.code} impairment`
          ),
          createJournalLine(
            categoryMap.get(asset.categoryId)?.asset_account || '1500 - Fixed Assets',
            0,
            impairment.amount,
            `${asset.code} impairment reserve`
          ),
        ],
      });
    });

    asset.transfers.forEach((transfer, index) => {
      asset.timeline.push({
        id: 200 + index,
        date: transfer.date,
        label: 'Internal transfer',
        status: 'info',
        description: `${transfer.fromLocation} to ${transfer.toLocation} for ${transfer.assignee}.`,
      });
    });
  });

  return enriched;
};

const buildInitialAcquisitionQueue = () => [
  {
    id: 1,
    code: 'CAP-REQ-001',
    name: 'Solar Inverter Backup',
    status: 'draft',
    purchaseDate: '2026-03-20',
    vendorId: ACCOUNTING_MOCK_VENDORS[0]?.id || 1,
    costCenterId: 3,
    categoryId: 2,
    purchaseCost: 125000,
    attachmentNames: ['vendor-quotation.pdf', 'board-approval.pdf'],
    reviewer: 'Procurement Lead',
  },
  {
    id: 2,
    code: 'CAP-REQ-002',
    name: 'Maternity Ward UPS',
    status: 'capitalized',
    purchaseDate: '2026-03-12',
    vendorId: ACCOUNTING_MOCK_VENDORS[1]?.id || 2,
    costCenterId: 2,
    categoryId: 3,
    purchaseCost: 88000,
    attachmentNames: ['delivery-challan.pdf', 'commissioning-note.pdf'],
    reviewer: 'Finance Controller',
    assetCode: 'AST-002A',
  },
];

const buildInitialDepreciationRuns = () => [
  {
    id: 1,
    period: 'Mar 2026',
    status: 'posted',
    postedOn: '2026-03-31',
    journalEntry: 'DEP-2026-03',
    owner: 'Fixed Asset Accountant',
    totalAmount: 13979,
    assetCount: 3,
  },
  {
    id: 2,
    period: 'Apr 2026',
    status: 'draft',
    postedOn: '',
    journalEntry: 'DEP-2026-04',
    owner: 'Fixed Asset Accountant',
    totalAmount: 14620,
    assetCount: 4,
  },
];

const buildInitialState = () => ({
  categories: cloneValue(ACCOUNTING_MOCK_ASSET_CATEGORIES),
  vendors: cloneValue(ACCOUNTING_MOCK_VENDORS),
  costCenters: cloneValue(ACCOUNTING_MOCK_COST_CENTERS),
  assets: buildInitialAssets(),
  acquisitionQueue: buildInitialAcquisitionQueue(),
  depreciationRuns: buildInitialDepreciationRuns(),
  disposals: ACCOUNTING_MOCK_ASSET_DISPOSALS.map((disposal) => ({
    id: disposal.id,
    assetId: disposal.asset_id,
    disposalDate: disposal.disposal_date,
    method: 'sale',
    saleAmount: Number(disposal.sale_amount || 0),
    costOfRemoval: 500,
    bookValue: 9000,
    gainLoss: Number(disposal.gain_loss || 0),
    status: disposal.status,
    proceedsHandling: 'Bank receipt into treasury clearing account',
    notes: 'Disposed after repeated generator failure and replacement approval.',
    journalPreview: [
      createJournalLine(
        '1010 - Main Operating Bank',
        Number(disposal.sale_amount || 0),
        0,
        'Sale proceeds received'
      ),
      createJournalLine('1501 - Vehicles', 0, 9000, 'Generator written off at disposal'),
      createJournalLine('6801 - Loss on Disposal', 4500, 0, 'Recognized disposal loss'),
    ],
  })),
});

const workspaceState = buildInitialState();

const emitChange = () => {
  workspaceVersion += 1;
  listeners.forEach((listener) => listener());
};

const getCategory = (categoryId) =>
  categoryMap.get(categoryId) ||
  workspaceState.categories.find((category) => category.id === categoryId);
const getVendor = (vendorId) =>
  vendorMap.get(vendorId) || workspaceState.vendors.find((vendor) => vendor.id === vendorId);
const getCostCenter = (costCenterId) =>
  costCenterMap.get(costCenterId) ||
  workspaceState.costCenters.find((center) => center.id === costCenterId);

const getDepreciationAmount = (asset) => {
  if (asset.status === 'disposed') return 0;
  const remainingPeriods = Math.max(
    asset.usefulLifeMonths - Number(asset.postedDepreciationPeriods || 0),
    1
  );
  const remainingValue = Math.max(
    Number(asset.currentValue || 0) - Number(asset.salvageValue || 0),
    0
  );
  return roundAmount(remainingValue / remainingPeriods);
};

const buildScheduleRows = (asset) => {
  const usefulLifeMonths = Number(asset.usefulLifeMonths || 0);
  const maxPeriods =
    asset.status === 'disposed' && asset.disposalDate
      ? Math.min(usefulLifeMonths, diffMonths(asset.placedInServiceDate, asset.disposalDate) + 1)
      : usefulLifeMonths;
  const postedPeriods = Math.min(Number(asset.postedDepreciationPeriods || 0), maxPeriods);
  const depreciableBase = Math.max(
    Number(asset.purchaseCost || 0) - Number(asset.salvageValue || 0),
    0
  );
  const straightLineAmount = roundAmount(depreciableBase / Math.max(usefulLifeMonths, 1));
  let openingValue = Number(asset.purchaseCost || 0);

  return Array.from({ length: maxPeriods }, (_, index) => {
    const periodDate = addMonths(asset.placedInServiceDate, index);
    const amount = Math.min(
      straightLineAmount,
      Math.max(openingValue - Number(asset.salvageValue || 0), 0)
    );
    const status =
      index < postedPeriods
        ? 'posted'
        : index === postedPeriods
          ? 'pending'
          : index <= postedPeriods + 2
            ? 'scheduled'
            : 'forecast';
    const closingValue = roundAmount(
      Math.max(openingValue - amount, Number(asset.salvageValue || 0))
    );
    const row = {
      id: `${asset.id}-${index + 1}`,
      sequence: index + 1,
      period: formatMonthLabel(periodDate),
      periodDate,
      openingValue: roundAmount(openingValue),
      depreciationAmount: roundAmount(amount),
      closingValue,
      status,
      journalEntry: status === 'posted' ? `DEP-${periodDate.slice(0, 7)}-${asset.code}` : '',
    };

    openingValue = closingValue;
    return row;
  });
};

const buildAssetDetail = (asset) => {
  const category = getCategory(asset.categoryId);
  const vendor = getVendor(asset.vendorId);
  const costCenter = getCostCenter(asset.costCenterId);
  const schedule = buildScheduleRows(asset);
  const accumulatedDepreciation = roundAmount(
    Number(asset.purchaseCost || 0) - Number(asset.currentValue || 0)
  );
  const nextRun =
    schedule.find((row) => row.status === 'pending') ||
    schedule.find((row) => row.status === 'scheduled');

  return {
    ...asset,
    categoryName: category?.name || 'Unassigned',
    assetAccount: category?.asset_account || '1500 - Fixed Assets',
    vendorName: vendor?.name || 'Unassigned vendor',
    costCenterName: costCenter?.name || 'Unassigned cost center',
    accumulatedDepreciation,
    depreciationProgress: roundAmount(
      (accumulatedDepreciation / Math.max(Number(asset.purchaseCost || 0), 1)) * 100
    ),
    monthlyDepreciation: getDepreciationAmount(asset),
    nextDepreciationPeriod: nextRun?.period || 'Schedule complete',
    schedule,
    timeline: [...asset.timeline].sort((left, right) => new Date(right.date) - new Date(left.date)),
    journalEntries: [...asset.journalEntries].sort(
      (left, right) => new Date(right.date) - new Date(left.date)
    ),
    attachments: asset.attachments.map((name, index) => ({ id: index + 1, name })),
  };
};

const buildOverview = (assets, disposals) => {
  const activeAssets = assets.filter((asset) =>
    ['active', 'fully_depreciated'].includes(asset.status)
  );
  const draftQueue = workspaceState.acquisitionQueue.filter(
    (item) => item.status === 'draft'
  ).length;
  const impairmentExposure = activeAssets.reduce(
    (sum, asset) =>
      sum +
      asset.impairments.reduce(
        (impairmentSum, impairment) => impairmentSum + Number(impairment.amount || 0),
        0
      ),
    0
  );
  const pendingDepreciationValue = activeAssets.reduce(
    (sum, asset) => sum + getDepreciationAmount(asset),
    0
  );

  return {
    totalCost: assets.reduce((sum, asset) => sum + Number(asset.purchaseCost || 0), 0),
    bookValue: assets.reduce((sum, asset) => sum + Number(asset.currentValue || 0), 0),
    accumulatedDepreciation: assets.reduce(
      (sum, asset) => sum + (Number(asset.purchaseCost || 0) - Number(asset.currentValue || 0)),
      0
    ),
    activeCount: activeAssets.length,
    disposedCount: assets.filter((asset) => asset.status === 'disposed').length,
    fullyDepreciatedCount: assets.filter((asset) => asset.status === 'fully_depreciated').length,
    draftAcquisitions: draftQueue,
    pendingDepreciationValue,
    impairmentExposure,
    netDisposalGainLoss: disposals.reduce(
      (sum, disposal) => sum + Number(disposal.gainLoss || 0),
      0
    ),
  };
};

const buildAlerts = (overview, assets) => {
  const alerts = [];
  const pendingAssets = assets.filter(
    (asset) =>
      ['active', 'fully_depreciated'].includes(asset.status) && getDepreciationAmount(asset) > 0
  );
  const assetsWithImpairment = assets.filter((asset) => asset.impairments.length > 0);
  const transferedAssets = assets.filter((asset) => asset.transfers.length > 0);

  if (pendingAssets.length) {
    alerts.push({
      id: 'pending-batch',
      severity: 'warning',
      title: `${pendingAssets.length} assets due for next depreciation run`,
      description:
        'Run the monthly depreciation batch to keep book values and asset reports aligned.',
    });
  }

  if (overview.draftAcquisitions > 0) {
    alerts.push({
      id: 'draft-acquisitions',
      severity: 'info',
      title: `${overview.draftAcquisitions} acquisition requests waiting for capitalization`,
      description:
        'Review draft asset requests and attach capitalization evidence before posting into the register.',
    });
  }

  if (assetsWithImpairment.length > 0) {
    alerts.push({
      id: 'impairment-review',
      severity: 'error',
      title: `${assetsWithImpairment.length} assets carry impairment adjustments`,
      description:
        'Validate whether further impairment, repair capitalization, or disposal is required.',
    });
  }

  if (!alerts.length) {
    alerts.push({
      id: 'all-clear',
      severity: 'success',
      title: 'Asset controls are balanced',
      description: `Transfer activity recorded for ${transferedAssets.length} assets and no immediate exceptions remain open.`,
    });
  }

  return alerts;
};

const buildDisposals = (assets) =>
  workspaceState.disposals.map((disposal) => {
    const asset = assets.find((item) => item.id === disposal.assetId);
    return {
      ...disposal,
      assetName: asset?.name || 'Unknown asset',
      assetCode: asset?.code || 'N/A',
      bookValue: disposal.bookValue || asset?.currentValue || 0,
      proceeds: roundAmount(disposal.saleAmount || 0),
      gainOrLoss: roundAmount(disposal.gainLoss || 0),
      methodLabel: formatLabel(disposal.method),
    };
  });

const buildRecentActivity = (assets, disposals) =>
  [
    ...assets.flatMap((asset) =>
      asset.timeline.map((event) => ({ ...event, assetCode: asset.code, assetName: asset.name }))
    ),
    ...disposals.map((disposal) => ({
      id: `disposal-${disposal.id}`,
      date: disposal.disposalDate,
      label: 'Disposal completed',
      status: 'error',
      description: `${disposal.assetCode} closed through ${disposal.method}.`,
      assetCode: disposal.assetCode,
      assetName: disposal.assetName,
    })),
  ]
    .sort((left, right) => new Date(right.date) - new Date(left.date))
    .slice(0, 10);

const buildReporting = (assets, disposals) => {
  const categoryPerformance = workspaceState.categories.map((category) => {
    const categoryAssets = assets.filter((asset) => asset.categoryId === category.id);
    return {
      id: category.id,
      category: category.name,
      count: categoryAssets.length,
      cost: roundAmount(
        categoryAssets.reduce((sum, asset) => sum + Number(asset.purchaseCost || 0), 0)
      ),
      bookValue: roundAmount(
        categoryAssets.reduce((sum, asset) => sum + Number(asset.currentValue || 0), 0)
      ),
      depreciation: roundAmount(
        categoryAssets.reduce(
          (sum, asset) => sum + (Number(asset.purchaseCost || 0) - Number(asset.currentValue || 0)),
          0
        )
      ),
    };
  });

  const depreciationMovement = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026'].map(
    (period, index) => ({
      id: period,
      period,
      postedAmount: index < 3 ? [11840, 12660, 13979][index] : 0,
      pendingAmount: index >= 3 ? [14620, 14975][index - 3] : 0,
      assetCount: index < 3 ? 3 : 4,
      status: index < 3 ? 'posted' : 'forecast',
    })
  );

  return {
    categoryPerformance,
    depreciationMovement,
    disposalAnalysis: disposals,
    topBookValueAssets: [...assets]
      .sort((left, right) => Number(right.currentValue || 0) - Number(left.currentValue || 0))
      .slice(0, 5),
  };
};

export const getAssetsWorkspaceSnapshot = () => {
  const assets = workspaceState.assets.map((asset) => buildAssetDetail(asset));
  const disposals = buildDisposals(assets);
  const overview = buildOverview(assets, disposals);
  const alerts = buildAlerts(overview, assets);
  const depreciationQueue = assets
    .filter((asset) => ['active', 'fully_depreciated'].includes(asset.status))
    .map((asset) => ({
      id: asset.id,
      assetId: asset.id,
      assetCode: asset.code,
      assetName: asset.name,
      code: asset.code,
      name: asset.name,
      categoryName: asset.categoryName,
      status: asset.status,
      bookValue: asset.currentValue,
      monthlyDepreciation: asset.monthlyDepreciation,
      amount: asset.monthlyDepreciation,
      nextDepreciationPeriod: asset.nextDepreciationPeriod,
      period: asset.nextDepreciationPeriod,
      methodLabel: formatLabel(asset.depreciationMethod),
      postedPeriods: asset.postedDepreciationPeriods,
      usefulLifeMonths: asset.usefulLifeMonths,
      scheduleRevision: asset.scheduleRevision,
    }))
    .sort((left, right) => right.monthlyDepreciation - left.monthlyDepreciation);

  return {
    overview,
    alerts,
    categories: cloneValue(workspaceState.categories),
    vendors: cloneValue(workspaceState.vendors),
    costCenters: cloneValue(workspaceState.costCenters),
    assets,
    acquisitionQueue: cloneValue(workspaceState.acquisitionQueue).map((item) => ({
      ...item,
      vendorName: getVendor(item.vendorId)?.name || 'Unassigned vendor',
      costCenterName: getCostCenter(item.costCenterId)?.name || 'Unassigned cost center',
      categoryName: getCategory(item.categoryId)?.name || 'Unassigned category',
      statusLabel: formatLabel(item.status),
    })),
    depreciationQueue,
    depreciationRuns: cloneValue(workspaceState.depreciationRuns),
    disposals,
    reporting: buildReporting(assets, disposals),
    recentActivity: buildRecentActivity(assets, disposals),
  };
};

export const getAssetsWorkspaceVersion = () => workspaceVersion;

export const subscribeAssetsWorkspace = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const createAssetAcquisition = (payload) => {
  const mode = payload.mode || 'capitalized';
  const category = getCategory(Number(payload.categoryId));
  const vendor = getVendor(Number(payload.vendorId));
  const costCenter = getCostCenter(Number(payload.costCenterId));
  const purchaseCost = Number(payload.purchaseCost || 0);
  const usefulLifeMonths = Number(
    payload.usefulLifeMonths ||
      (Number(payload.usefulLifeYears || 0) > 0 ? Number(payload.usefulLifeYears) * 12 : 0) ||
      Number(category?.useful_life || 5) * 12
  );
  const salvageValue = roundAmount(
    payload.salvageValue !== undefined && payload.salvageValue !== ''
      ? payload.salvageValue
      : (purchaseCost * Number(category?.salvage_percent || 5)) / 100
  );
  const attachmentNames = (payload.attachmentNames || []).filter(Boolean);
  const nextAcquisitionId =
    Math.max(0, ...workspaceState.acquisitionQueue.map((item) => item.id)) + 1;
  const queueEntry = {
    id: nextAcquisitionId,
    code: `CAP-REQ-${String(nextAcquisitionId).padStart(3, '0')}`,
    name: payload.name,
    status: mode,
    purchaseDate: payload.purchaseDate,
    vendorId: Number(payload.vendorId) || null,
    costCenterId: Number(payload.costCenterId) || null,
    categoryId: Number(payload.categoryId) || null,
    purchaseCost,
    attachmentNames,
    reviewer:
      mode === 'draft' ? 'Awaiting capitalization approval' : 'Posted to fixed assets register',
  };

  workspaceState.acquisitionQueue = [queueEntry, ...workspaceState.acquisitionQueue];

  if (mode === 'capitalized') {
    const nextAssetId = Math.max(0, ...workspaceState.assets.map((item) => item.id)) + 1;
    const assetCode = payload.code || `AST-${String(nextAssetId).padStart(3, '0')}`;
    const asset = {
      id: nextAssetId,
      name: payload.name,
      code: assetCode,
      categoryId: Number(payload.categoryId),
      purchaseCost,
      currentValue: purchaseCost,
      purchaseDate: payload.purchaseDate,
      placedInServiceDate: payload.purchaseDate,
      status: 'active',
      depreciationMethod:
        payload.depreciationMethod || category?.depreciation_method || 'straight_line',
      usefulLifeMonths,
      salvageValue,
      vendorId: Number(payload.vendorId) || null,
      costCenterId: Number(payload.costCenterId) || null,
      location: payload.location || 'Pending deployment',
      custodian: payload.custodian || 'To be assigned',
      serialNumber: payload.serialNumber || `${assetCode}-SN-${2000 + nextAssetId}`,
      projectName: payload.projectName || 'New acquisition',
      condition: 'new',
      postedDepreciationPeriods: 0,
      scheduleRevision: 1,
      allowDisposal: true,
      attachments: attachmentNames,
      impairments: [],
      transfers: [],
      journalEntries: [
        {
          id: 1,
          number: `CAP-${assetCode}`,
          date: payload.purchaseDate,
          type: 'Capitalization',
          status: 'posted',
          memo: `${payload.name} capitalized from ${vendor?.name || 'vendor'} into ${costCenter?.name || 'asset portfolio'}.`,
          lines: buildCapitalizationJournal({ code: assetCode, purchaseCost }, category),
        },
      ],
      timeline: [
        {
          id: 1,
          date: payload.purchaseDate,
          label: 'Capitalized',
          status: 'posted',
          description: `${payload.name} posted with automatic vendor and cost center tagging.`,
        },
      ],
    };

    workspaceState.assets = [asset, ...workspaceState.assets];
    workspaceState.acquisitionQueue[0].assetCode = assetCode;
  }

  emitChange();
  return queueEntry;
};

export const updateAssetRecord = (assetId, payload) => {
  workspaceState.assets = workspaceState.assets.map((asset) => {
    if (asset.id !== Number(assetId)) return asset;

    return {
      ...asset,
      name: payload.name ?? asset.name,
      code: payload.code ?? asset.code,
      status: payload.status ?? asset.status,
      location: payload.location ?? asset.location,
      custodian: payload.custodian ?? asset.custodian,
      timeline: [
        {
          id: Date.now(),
          date: formatDate(TODAY),
          label: 'Register updated',
          status: 'info',
          description: 'Asset master data updated from the register workspace.',
        },
        ...asset.timeline,
      ],
    };
  });

  emitChange();
  return true;
};

export const deleteAssetRecord = (assetId) => {
  workspaceState.assets = workspaceState.assets.filter((asset) => asset.id !== Number(assetId));
  workspaceState.disposals = workspaceState.disposals.filter(
    (disposal) => disposal.assetId !== Number(assetId)
  );
  emitChange();
  return true;
};

export const recordAssetImpairment = (assetId, payload) => {
  workspaceState.assets = workspaceState.assets.map((asset) => {
    if (asset.id !== assetId) return asset;

    const amount = roundAmount(payload.amount);
    const nextId = Math.max(0, ...asset.impairments.map((item) => item.id || 0)) + 1;
    const category = getCategory(asset.categoryId);

    return {
      ...asset,
      currentValue: roundAmount(
        Math.max(Number(asset.salvageValue || 0), Number(asset.currentValue || 0) - amount)
      ),
      impairments: [
        {
          id: nextId,
          date: payload.date,
          amount,
          reason: payload.reason,
          reviewer: payload.reviewer || 'Finance Controller',
        },
        ...asset.impairments,
      ],
      scheduleRevision: Number(asset.scheduleRevision || 1) + 1,
      timeline: [
        {
          id: Date.now(),
          date: payload.date,
          label: 'Impairment booked',
          status: 'warning',
          description: payload.reason,
        },
        ...asset.timeline,
      ],
      journalEntries: [
        {
          id: Date.now(),
          number: `IMP-${asset.code}-${nextId}`,
          date: payload.date,
          type: 'Impairment',
          status: 'posted',
          memo: payload.reason,
          lines: [
            createJournalLine(
              '6705 - Asset Impairment Loss',
              amount,
              0,
              `${asset.code} impairment charge`
            ),
            createJournalLine(
              category?.asset_account || '1500 - Fixed Assets',
              0,
              amount,
              `${asset.code} carrying value reduction`
            ),
          ],
        },
        ...asset.journalEntries,
      ],
    };
  });

  emitChange();
};

export const transferAsset = (assetId, payload) => {
  workspaceState.assets = workspaceState.assets.map((asset) => {
    if (asset.id !== assetId) return asset;

    const nextId = Math.max(0, ...asset.transfers.map((item) => item.id || 0)) + 1;
    const nextCostCenterId = Number(payload.costCenterId) || asset.costCenterId;

    return {
      ...asset,
      location: payload.toLocation,
      custodian: payload.assignee,
      costCenterId: nextCostCenterId,
      transfers: [
        {
          id: nextId,
          date: payload.date,
          fromLocation: asset.location,
          toLocation: payload.toLocation,
          assignee: payload.assignee,
          reason: payload.reason,
        },
        ...asset.transfers,
      ],
      timeline: [
        {
          id: Date.now(),
          date: payload.date,
          label: 'Internal transfer',
          status: 'info',
          description: `${asset.location} to ${payload.toLocation} for ${payload.assignee}.`,
        },
        ...asset.timeline,
      ],
      journalEntries: [
        {
          id: Date.now(),
          number: `TRN-${asset.code}-${nextId}`,
          date: payload.date,
          type: 'Transfer memo',
          status: 'memo',
          memo: payload.reason,
          lines: buildTransferMemoLines(asset, payload),
        },
        ...asset.journalEntries,
      ],
    };
  });

  emitChange();
};

export const recalculateAssetSchedule = (assetId) => {
  workspaceState.assets = workspaceState.assets.map((asset) =>
    asset.id === assetId
      ? {
          ...asset,
          scheduleRevision: Number(asset.scheduleRevision || 1) + 1,
          timeline: [
            {
              id: Date.now(),
              date: formatDate(TODAY),
              label: 'Schedule recalculated',
              status: 'info',
              description:
                'Depreciation schedule recalculated after configuration or valuation changes.',
            },
            ...asset.timeline,
          ],
        }
      : asset
  );

  emitChange();
};

export const runMonthlyDepreciationBatch = (payload) => {
  const assetIds = payload.assetIds?.length
    ? payload.assetIds
    : workspaceState.assets
        .filter((asset) => ['active', 'fully_depreciated'].includes(asset.status))
        .map((asset) => asset.id);
  let totalAmount = 0;
  let affectedAssets = 0;

  workspaceState.assets = workspaceState.assets.map((asset) => {
    if (!assetIds.includes(asset.id) || asset.status === 'disposed') return asset;

    const amount = getDepreciationAmount(asset);
    if (amount <= 0) return asset;

    const nextPostedPeriods = Number(asset.postedDepreciationPeriods || 0) + 1;
    const nextCurrentValue = roundAmount(
      Math.max(Number(asset.salvageValue || 0), Number(asset.currentValue || 0) - amount)
    );
    const nextStatus =
      nextCurrentValue <= Number(asset.salvageValue || 0) ? 'fully_depreciated' : 'active';

    totalAmount += amount;
    affectedAssets += 1;

    return {
      ...asset,
      currentValue: nextCurrentValue,
      postedDepreciationPeriods: nextPostedPeriods,
      status: nextStatus,
      journalEntries: [
        {
          id: Date.now() + asset.id,
          number: `DEP-${payload.period.replace(/\s/g, '-')}-${asset.code}`,
          date: endOfMonth(payload.postDate || formatDate(TODAY)),
          type: 'Depreciation',
          status: 'posted',
          memo: `Monthly depreciation posted for ${payload.period}.`,
          lines: [
            createJournalLine(
              '6401 - Depreciation Expense',
              amount,
              0,
              `${asset.code} depreciation charge`
            ),
            createJournalLine(
              '1599 - Accumulated Depreciation',
              0,
              amount,
              `${asset.code} accumulated depreciation`
            ),
          ],
        },
        ...asset.journalEntries,
      ],
      timeline: [
        {
          id: Date.now() + asset.id,
          date: endOfMonth(payload.postDate || formatDate(TODAY)),
          label: 'Depreciation posted',
          status: 'posted',
          description: `${payload.period} depreciation of ${amount.toLocaleString('en-US')} posted.`,
        },
        ...asset.timeline,
      ],
    };
  });

  const nextId = Math.max(0, ...workspaceState.depreciationRuns.map((item) => item.id)) + 1;
  workspaceState.depreciationRuns = [
    {
      id: nextId,
      period: payload.period,
      status: 'posted',
      postedOn: endOfMonth(payload.postDate || formatDate(TODAY)),
      journalEntry: `DEP-${payload.period.replace(/\s/g, '-')}`,
      owner: payload.owner || 'Fixed Asset Accountant',
      totalAmount: roundAmount(totalAmount),
      assetCount: affectedAssets,
    },
    ...workspaceState.depreciationRuns,
  ];

  emitChange();
  return { totalAmount: roundAmount(totalAmount), assetCount: affectedAssets };
};

const buildDisposalJournal = (asset, payload, bookValue, gainLoss) => {
  const proceeds = roundAmount(payload.saleAmount || 0);
  const removalCost = roundAmount(payload.costOfRemoval || 0);
  const lines = [
    createJournalLine(
      '1599 - Accumulated Depreciation',
      Number(asset.purchaseCost || 0) - bookValue,
      0,
      `${asset.code} accumulated depreciation release`
    ),
    createJournalLine(
      getCategory(asset.categoryId)?.asset_account || '1500 - Fixed Assets',
      0,
      Number(asset.purchaseCost || 0),
      `${asset.code} asset disposal`
    ),
  ];

  if (proceeds > 0) {
    lines.unshift(
      createJournalLine('1010 - Main Operating Bank', proceeds, 0, 'Sale proceeds received')
    );
  }

  if (removalCost > 0) {
    lines.push(
      createJournalLine('6205 - Disposal Handling Cost', removalCost, 0, 'Disposal cost accrued')
    );
  }

  if (gainLoss > 0) {
    lines.push(
      createJournalLine('7801 - Gain on Disposal', 0, gainLoss, 'Recognized gain on disposal')
    );
  } else if (gainLoss < 0) {
    lines.push(
      createJournalLine(
        '6801 - Loss on Disposal',
        Math.abs(gainLoss),
        0,
        'Recognized loss on disposal'
      )
    );
  }

  return lines;
};

export const disposeAsset = (assetId, payload) => {
  const asset = workspaceState.assets.find((item) => item.id === assetId);
  if (!asset) return null;

  const bookValue = roundAmount(Number(asset.currentValue || 0));
  const gainLoss = roundAmount(
    Number(payload.saleAmount || 0) - Number(payload.costOfRemoval || 0) - bookValue
  );
  const nextDisposalId = Math.max(0, ...workspaceState.disposals.map((item) => item.id)) + 1;
  const journalPreview = buildDisposalJournal(asset, payload, bookValue, gainLoss);

  workspaceState.disposals = [
    {
      id: nextDisposalId,
      assetId,
      disposalDate: payload.disposalDate,
      method: payload.method,
      saleAmount: roundAmount(payload.saleAmount || 0),
      costOfRemoval: roundAmount(payload.costOfRemoval || 0),
      bookValue,
      gainLoss,
      status: 'completed',
      proceedsHandling: payload.proceedsHandling,
      notes: payload.notes,
      journalPreview,
    },
    ...workspaceState.disposals,
  ];

  workspaceState.assets = workspaceState.assets.map((item) =>
    item.id === assetId
      ? {
          ...item,
          status: 'disposed',
          currentValue: 0,
          disposalDate: payload.disposalDate,
          allowDisposal: false,
          timeline: [
            {
              id: Date.now(),
              date: payload.disposalDate,
              label: 'Disposed',
              status: 'error',
              description: `${payload.method} disposal completed with ${gainLoss >= 0 ? 'gain' : 'loss'} recognition.`,
            },
            ...item.timeline,
          ],
          journalEntries: [
            {
              id: Date.now(),
              number: `DSP-${item.code}-${nextDisposalId}`,
              date: payload.disposalDate,
              type: 'Disposal',
              status: 'posted',
              memo: payload.notes,
              lines: journalPreview,
            },
            ...item.journalEntries,
          ],
        }
      : item
  );

  emitChange();
  return { gainLoss, bookValue };
};
