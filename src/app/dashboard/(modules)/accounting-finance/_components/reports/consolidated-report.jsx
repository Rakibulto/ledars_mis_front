'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { formatCurrency } from '../utils';
import { ReportExportActions } from './report-export-actions';
import { useAssetsWorkspace } from '../assets/use-assets-workspace';
import { useBudgetsWorkspace } from '../budgets/use-budgets-workspace';
import { exportReportCsv, exportReportJson, exportReportExcel } from './reports-export';
import { getProfitLossReport, getBalanceSheetReport, getExecutiveSummaryReport } from './mock-data';

function MetricCard({ label, value, helper }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {helper}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function ConsolidatedReport() {
  const assetsWorkspace = useAssetsWorkspace();
  const budgetsWorkspace = useBudgetsWorkspace();
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  const balanceSheet = useMemo(() => getBalanceSheetReport(), []);
  const profitLoss = useMemo(() => getProfitLossReport(), []);
  const executiveSummary = useMemo(() => getExecutiveSummaryReport(), []);

  const entityRows = useMemo(
    () => [
      {
        id: 'finance-ledger',
        name: 'Core Ledger',
        assets: balanceSheet.totalAssets,
        liabilities: balanceSheet.totalLiabilities,
        equity: balanceSheet.totalEquity,
        netResult: profitLoss.netProfit,
      },
      {
        id: 'budget-control',
        name: 'Budget Control',
        assets: budgetsWorkspace.overview.totalAvailable,
        liabilities:
          budgetsWorkspace.overview.totalCommitments + budgetsWorkspace.overview.totalEncumbrance,
        equity: budgetsWorkspace.overview.totalBudget,
        netResult: budgetsWorkspace.overview.totalBudget - budgetsWorkspace.overview.totalActual,
      },
      {
        id: 'asset-register',
        name: 'Fixed Assets',
        assets: assetsWorkspace.overview.bookValue,
        liabilities: 0,
        equity: assetsWorkspace.overview.totalCost,
        netResult: assetsWorkspace.overview.netDisposalGainLoss,
      },
    ],
    [assetsWorkspace.overview, balanceSheet, budgetsWorkspace.overview, profitLoss.netProfit]
  );

  const eliminationRows = [
    {
      id: 'elim-1',
      label: 'Budget commitments represented in expense accrual planning',
      amount: budgetsWorkspace.overview.totalCommitments,
    },
    {
      id: 'elim-2',
      label: 'Fixed asset capitalization already included in ledger assets',
      amount: assetsWorkspace.overview.totalCost,
    },
  ];

  const exportConfig = useMemo(
    () => ({
      title: 'Consolidated Financial Report',
      subtitle: 'Ledger, budget, liquidity, and fixed-asset consolidation view',
      summary: [
        { label: 'Total assets', value: formatCurrency(balanceSheet.totalAssets) },
        { label: 'Total liabilities', value: formatCurrency(balanceSheet.totalLiabilities) },
        { label: 'Net profit', value: formatCurrency(profitLoss.netProfit) },
        { label: 'Working capital', value: formatCurrency(executiveSummary.workingCapital) },
      ],
      tables: [
        {
          title: 'Entity Consolidation',
          columns: [
            { key: 'name', label: 'Entity' },
            { key: 'assets', label: 'Assets' },
            { key: 'liabilities', label: 'Liabilities' },
            { key: 'equity', label: 'Equity / Envelope' },
            { key: 'result', label: 'Net Result' },
          ],
          rows: entityRows.map((row) => ({
            name: row.name,
            assets: formatCurrency(row.assets),
            liabilities: formatCurrency(row.liabilities),
            equity: formatCurrency(row.equity),
            result: formatCurrency(row.netResult),
          })),
        },
        {
          title: 'Elimination Entries',
          columns: [
            { key: 'label', label: 'Elimination' },
            { key: 'amount', label: 'Amount' },
          ],
          rows: eliminationRows.map((row) => ({
            label: row.label,
            amount: formatCurrency(row.amount),
          })),
        },
      ],
      controlChecks: [
        {
          label: 'Balance sheet control',
          value: formatCurrency(balanceSheet.balancingGap),
          description: 'Gap between assets and liabilities plus equity.',
        },
        {
          label: 'Budget threshold breaches',
          value: budgetsWorkspace.overview.warningPlans + budgetsWorkspace.overview.criticalPlans,
          description: 'Warning and critical budget plans included in group review.',
        },
      ],
      payload: { balanceSheet, profitLoss, executiveSummary, entityRows, eliminationRows },
    }),
    [
      balanceSheet,
      budgetsWorkspace.overview,
      entityRows,
      eliminationRows,
      executiveSummary,
      profitLoss,
    ]
  );

  const printContent = (
    <div>
      {exportConfig.tables.map((table) => (
        <div key={table.title} style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, margin: '16px 0 8px' }}>{table.title}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {table.columns.map((column) => (
                  <th
                    key={column.key}
                    style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, index) => (
                <tr key={row.id || index}>
                  {table.columns.map((column) => {
                    const value = row[column.key];
                    return (
                      <td key={column.key} style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                        {typeof value === 'number' &&
                        /balance|amount|debit|credit|net|cost|budget|actual|available|variance|opening|closing|total|value|assets|liabilities|equity/i.test(
                          column.key
                        )
                          ? formatCurrency(value)
                          : value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );

  const runAction = async (label, action, successMessage) => {
    const loadingId = toast.loading(`${label}...`);
    setPendingAction(label);

    try {
      await action();
      toast.dismiss(loadingId);
      toast.success(successMessage);
    } catch (error) {
      toast.dismiss(loadingId);
      toast.error(error?.message || `${label} failed`);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Consolidated Financial Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Multi-entity style consolidation across ledger, budgets, assets, and cash posture with
            elimination review.
          </Typography>
        </Box>
        <ReportExportActions
          actions={[
            {
              key: 'csv',
              onClick: () =>
                runAction(
                  'Export Consolidated CSV',
                  () => exportReportCsv('consolidated-report', exportConfig),
                  'Consolidated CSV exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'excel',
              onClick: () =>
                runAction(
                  'Export Consolidated Excel',
                  () => exportReportExcel('consolidated-report', exportConfig),
                  'Consolidated workbook exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'json',
              onClick: () =>
                runAction(
                  'Export Consolidated JSON',
                  () => exportReportJson('consolidated-report', exportConfig),
                  'Consolidated JSON exported'
                ),
              disabled: pendingAction !== null,
            },
            { key: 'print', onClick: () => setPrintOpen(true), disabled: pendingAction !== null },
          ]}
        />
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Total assets"
            value={formatCurrency(balanceSheet.totalAssets)}
            helper="Statement of financial position assets"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Total liabilities"
            value={formatCurrency(balanceSheet.totalLiabilities)}
            helper="Outstanding obligations across the group view"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Net profit"
            value={formatCurrency(profitLoss.netProfit)}
            helper="Consolidated income statement result"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Working capital"
            value={formatCurrency(executiveSummary.workingCapital)}
            helper="Receivables plus cash less payables"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 7 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Consolidation Matrix
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th align="left">Entity</th>
                      <th align="right">Assets</th>
                      <th align="right">Liabilities</th>
                      <th align="right">Equity / Envelope</th>
                      <th align="right">Net result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entityRows.map((row) => (
                      <tr key={row.id}>
                        <td style={{ padding: '12px 8px' }}>
                          <Typography variant="body2" fontWeight={700}>
                            {row.name}
                          </Typography>
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(row.assets)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(row.liabilities)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(row.equity)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px', fontWeight: 700 }}>
                          {formatCurrency(row.netResult)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Elimination Review
              </Typography>
              <Stack spacing={1.25}>
                {eliminationRows.map((row) => (
                  <Stack
                    key={row.id}
                    direction="row"
                    justifyContent="space-between"
                    sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                  >
                    <Typography variant="body2">{row.label}</Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {formatCurrency(row.amount)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 5 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Control Snapshot
                </Typography>
                <Stack spacing={1.25}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Balance sheet gap</Typography>
                    <Typography fontWeight={700}>
                      {formatCurrency(balanceSheet.balancingGap)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Operating margin</Typography>
                    <Typography fontWeight={700}>
                      {profitLoss.operatingMargin.toFixed(1)}%
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Liquidity coverage</Typography>
                    <Typography fontWeight={700}>
                      {executiveSummary.liquidityCoverage.toFixed(1)}%
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Budget breaches</Typography>
                    <Typography fontWeight={700}>
                      {budgetsWorkspace.overview.warningPlans +
                        budgetsWorkspace.overview.criticalPlans}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Component Signals
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    label={`${assetsWorkspace.overview.activeCount} active assets`}
                    size="small"
                  />
                  <Chip label={`${executiveSummary.openInvoices} open invoices`} size="small" />
                  <Chip label={`${executiveSummary.openBills} open bills`} size="small" />
                  <Chip label={`${budgetsWorkspace.budgets.length} budget plans`} size="small" />
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {printOpen && (
        <PdfPrintLayout title="Consolidated Financial Report" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
