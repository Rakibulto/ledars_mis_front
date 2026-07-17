import { formatCurrency } from '../utils';
import {
  exportReportCsv,
  printReportPack,
  exportReportJson,
  exportReportExcel,
} from '../reports/reports-export';

function normalizeConfig(config) {
  return {
    title: config.title,
    subtitle: config.subtitle || '',
    documentNumber: config.documentNumber || config.title,
    alerts: config.alerts || [],
    summary: config.summary || [],
    sections: config.sections || [],
    tables: config.tables || [],
    controlChecks: config.controlChecks || [],
    payload: config.payload || {},
  };
}

export function buildBudgetsExportConfig(workspace) {
  return normalizeConfig({
    title: 'Budgets Workspace',
    subtitle: 'Planning, encumbrance, and variance control pack',
    documentNumber: 'BUDGETS-WORKSPACE',
    alerts: workspace.alerts,
    summary: [
      { label: 'Total budget', value: formatCurrency(workspace.overview.totalBudget) },
      { label: 'Actual', value: formatCurrency(workspace.overview.totalActual) },
      { label: 'Commitments', value: formatCurrency(workspace.overview.totalCommitments) },
      { label: 'Encumbrance', value: formatCurrency(workspace.overview.totalEncumbrance) },
    ],
    sections: [
      {
        title: 'Control Snapshot',
        items: [
          { label: 'Warning plans', value: workspace.overview.warningPlans },
          { label: 'Critical plans', value: workspace.overview.criticalPlans },
          { label: 'Available envelope', value: formatCurrency(workspace.overview.totalAvailable) },
          { label: 'Comparison periods', value: workspace.comparisonPeriods.length },
        ],
      },
    ],
    tables: [
      {
        title: 'Budget Plans',
        columns: [
          { key: 'name', label: 'Plan' },
          { key: 'department', label: 'Department' },
          { key: 'status', label: 'Status' },
          { key: 'budget', label: 'Budget' },
          { key: 'actual', label: 'Actual' },
          { key: 'commitments', label: 'Commitments' },
          { key: 'encumbrance', label: 'Encumbrance' },
        ],
        rows: workspace.budgets.map((budget) => ({
          name: budget.name,
          department: budget.department,
          status: budget.status,
          budget: formatCurrency(budget.totalAmount),
          actual: formatCurrency(budget.spentAmount),
          commitments: formatCurrency(budget.commitments),
          encumbrance: formatCurrency(budget.encumbrance),
        })),
      },
      {
        title: 'Tracking',
        columns: [
          { key: 'name', label: 'Plan' },
          { key: 'owner', label: 'Owner' },
          { key: 'pressure', label: 'Pressure' },
          { key: 'available', label: 'Available' },
          { key: 'threshold', label: 'Threshold Status' },
        ],
        rows: workspace.trackingRows.map((row) => ({
          name: row.name,
          owner: row.owner,
          pressure: `${row.pressure.toFixed(1)}%`,
          available: formatCurrency(row.available),
          threshold: row.thresholdStatus,
        })),
      },
    ],
    controlChecks: [
      {
        label: 'Plans with pending amendment approval',
        value: workspace.budgets.filter((budget) =>
          budget.amendments.some((item) => item.status === 'pending_approval')
        ).length,
        description: 'These plans have version changes still moving through approval chain.',
      },
    ],
    payload: workspace,
  });
}

export function printBudgetsPack(config) {
  printReportPack(normalizeConfig(config));
}

export function exportBudgetsCsv(fileName, config) {
  exportReportCsv(fileName, normalizeConfig(config));
}

export function exportBudgetsExcel(fileName, config) {
  exportReportExcel(fileName, normalizeConfig(config));
}

export function exportBudgetsJson(fileName, config) {
  exportReportJson(fileName, normalizeConfig(config));
}
