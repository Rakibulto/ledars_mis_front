import {
  exportCsvFile,
  formatCurrency,
  exportJsonFile,
  exportExcelWorkbook,
  printTransactionPack,
  buildTransactionCsvRows,
  buildTransactionWorkbookData,
} from '../utils';

const normalizeConfig = (config) => ({
  title: config.title,
  subtitle: config.subtitle || '',
  documentNumber: config.documentNumber || config.title,
  alerts: config.alerts || [],
  summary: config.summary || [],
  sections: config.sections || [],
  tables: config.tables || [],
  controlChecks: config.controlChecks || [],
  referenceLinks: config.referenceLinks || [],
  timeline: config.timeline || [],
  auditTrail: config.auditTrail || [],
  payload: config.payload || {},
});

export function buildAssetExportConfig({
  overview,
  alerts,
  assets,
  acquisitionQueue,
  depreciationRuns,
  disposals,
  reporting,
  recentActivity,
}) {
  return normalizeConfig({
    title: 'Assets Workspace',
    subtitle: 'Fixed asset accounting control pack',
    documentNumber: 'ASSET-WORKSPACE',
    alerts,
    summary: [
      { label: 'Portfolio cost', value: formatCurrency(overview.totalCost) },
      { label: 'Book value', value: formatCurrency(overview.bookValue) },
      {
        label: 'Accumulated depreciation',
        value: formatCurrency(overview.accumulatedDepreciation),
      },
      { label: 'Pending depreciation', value: formatCurrency(overview.pendingDepreciationValue) },
    ],
    sections: [
      {
        title: 'Asset Controls',
        items: [
          { label: 'Active assets', value: overview.activeCount },
          { label: 'Disposed assets', value: overview.disposedCount },
          { label: 'Fully depreciated', value: overview.fullyDepreciatedCount },
          { label: 'Draft acquisitions', value: overview.draftAcquisitions },
          { label: 'Impairment exposure', value: formatCurrency(overview.impairmentExposure) },
          { label: 'Net disposal gain/loss', value: formatCurrency(overview.netDisposalGainLoss) },
        ],
      },
    ],
    tables: [
      {
        title: 'Asset Register',
        columns: [
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Asset' },
          { key: 'category', label: 'Category' },
          { key: 'status', label: 'Status' },
          { key: 'bookValue', label: 'Book Value' },
          { key: 'depreciation', label: 'Accumulated Depreciation' },
        ],
        rows: assets.map((asset) => ({
          code: asset.code,
          name: asset.name,
          category: asset.categoryName,
          status: asset.status,
          bookValue: formatCurrency(asset.currentValue),
          depreciation: formatCurrency(asset.accumulatedDepreciation),
        })),
      },
      {
        title: 'Depreciation Movement',
        columns: [
          { key: 'period', label: 'Period' },
          { key: 'postedAmount', label: 'Posted Amount' },
          { key: 'pendingAmount', label: 'Pending Amount' },
          { key: 'assetCount', label: 'Assets' },
          { key: 'status', label: 'Status' },
        ],
        rows: reporting.depreciationMovement.map((row) => ({
          period: row.period,
          postedAmount: formatCurrency(row.postedAmount),
          pendingAmount: formatCurrency(row.pendingAmount),
          assetCount: row.assetCount,
          status: row.status,
        })),
      },
      {
        title: 'Disposal Analysis',
        columns: [
          { key: 'assetCode', label: 'Code' },
          { key: 'assetName', label: 'Asset' },
          { key: 'method', label: 'Method' },
          { key: 'bookValue', label: 'Book Value' },
          { key: 'saleAmount', label: 'Sale Amount' },
          { key: 'gainLoss', label: 'Gain / Loss' },
        ],
        rows: disposals.map((disposal) => ({
          assetCode: disposal.assetCode,
          assetName: disposal.assetName,
          method: disposal.method,
          bookValue: formatCurrency(disposal.bookValue),
          saleAmount: formatCurrency(disposal.saleAmount),
          gainLoss: formatCurrency(disposal.gainLoss),
        })),
      },
    ],
    controlChecks: [
      {
        label: 'Capitalization queue',
        value: acquisitionQueue.length,
        description: 'All acquisition requests including draft and posted capitalization items.',
      },
      {
        label: 'Depreciation runs',
        value: depreciationRuns.length,
        description: 'Monthly depreciation batches tracked in the mock workspace.',
      },
    ],
    timeline: recentActivity.slice(0, 8).map((event) => ({
      label: `${event.assetCode} • ${event.label}`,
      status: event.status,
      description: event.description,
      time: event.date,
    })),
    payload: {
      overview,
      alerts,
      assets,
      acquisitionQueue,
      depreciationRuns,
      disposals,
      reporting,
      recentActivity,
    },
  });
}

export function printAssetPack(config) {
  printTransactionPack(normalizeConfig(config));
}

export function exportAssetCsv(fileName, config) {
  exportCsvFile(fileName, buildTransactionCsvRows(normalizeConfig(config)));
}

export function exportAssetExcel(fileName, config) {
  exportExcelWorkbook(fileName, buildTransactionWorkbookData(normalizeConfig(config)));
}

export function exportAssetJson(fileName, config) {
  exportJsonFile(fileName, {
    title: config.title,
    subtitle: config.subtitle,
    generatedAt: new Date().toISOString(),
    ...config.payload,
  });
}
