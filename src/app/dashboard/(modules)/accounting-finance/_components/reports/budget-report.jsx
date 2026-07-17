'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { formatCurrency } from '../utils';
import { ReportExportActions } from './report-export-actions';
import { useBudgetsWorkspace } from '../budgets/use-budgets-workspace';
import { exportReportCsv, exportReportJson, exportReportExcel } from './reports-export';

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

export default function BudgetReport() {
  const workspace = useBudgetsWorkspace();
  const [selectedBudgetId, setSelectedBudgetId] = useState(workspace.budgets[0]?.id || '');
  const [comparisonPeriodId, setComparisonPeriodId] = useState(
    workspace.comparisonPeriods[2]?.id || workspace.comparisonPeriods[0]?.id || ''
  );
  const [statusFilter, setStatusFilter] = useState('all');
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  const budgets = useMemo(
    () =>
      workspace.budgets.filter((budget) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'breach') return budget.thresholdStatus !== 'healthy';
        return budget.status === statusFilter;
      }),
    [statusFilter, workspace.budgets]
  );

  const selectedBudget =
    budgets.find((budget) => String(budget.id) === String(selectedBudgetId)) || budgets[0] || null;
  const varianceRows = selectedBudget
    ? workspace.calculateBudgetVarianceRows(selectedBudget, comparisonPeriodId)
    : [];

  const hierarchyRows = useMemo(() => {
    const groupMap = new Map();

    budgets.forEach((budget) => {
      const key = `${budget.costCenterCode}-${budget.costCenterName}`;
      const current = groupMap.get(key) || {
        id: key,
        costCenterName: budget.costCenterName,
        costCenterCode: budget.costCenterCode,
        budgetCount: 0,
        totalBudget: 0,
        totalActual: 0,
        totalAvailable: 0,
      };

      groupMap.set(key, {
        ...current,
        budgetCount: current.budgetCount + 1,
        totalBudget: current.totalBudget + Number(budget.totalAmount || 0),
        totalActual: current.totalActual + Number(budget.spentAmount || 0),
        totalAvailable: current.totalAvailable + Number(budget.available || 0),
      });
    });

    return [...groupMap.values()].sort((left, right) => right.totalBudget - left.totalBudget);
  }, [budgets]);

  const exportConfig = useMemo(
    () => ({
      title: 'Budget Report',
      subtitle: `${selectedBudget?.name || 'Budget portfolio'} | ${comparisonPeriodId}`,
      alerts: workspace.alerts,
      summary: [
        { label: 'Total budget', value: formatCurrency(workspace.overview.totalBudget) },
        { label: 'Actual', value: formatCurrency(workspace.overview.totalActual) },
        { label: 'Commitments', value: formatCurrency(workspace.overview.totalCommitments) },
        { label: 'Available', value: formatCurrency(workspace.overview.totalAvailable) },
      ],
      tables: [
        {
          title: 'Budget Hierarchy',
          columns: [
            { key: 'center', label: 'Cost Center' },
            { key: 'plans', label: 'Plans' },
            { key: 'budget', label: 'Budget' },
            { key: 'actual', label: 'Actual' },
            { key: 'available', label: 'Available' },
          ],
          rows: hierarchyRows.map((row) => ({
            center: `${row.costCenterCode} - ${row.costCenterName}`,
            plans: row.budgetCount,
            budget: formatCurrency(row.totalBudget),
            actual: formatCurrency(row.totalActual),
            available: formatCurrency(row.totalAvailable),
          })),
        },
        {
          title: 'Variance Detail',
          columns: [
            { key: 'account', label: 'Account' },
            { key: 'planned', label: 'Planned' },
            { key: 'actual', label: 'Actual' },
            { key: 'variance', label: 'Variance' },
            { key: 'commitment', label: 'Commitment %' },
            { key: 'status', label: 'Status' },
          ],
          rows: varianceRows.map((row) => ({
            account: `${row.accountCode} - ${row.accountName}`,
            planned: formatCurrency(row.planned),
            actual: formatCurrency(row.actual),
            variance: formatCurrency(row.variance),
            commitment: `${row.commitmentPercent.toFixed(1)}%`,
            status: row.status,
          })),
        },
      ],
      controlChecks: budgets.map((budget) => ({
        label: budget.name,
        value: `${budget.pressure.toFixed(1)}% pressure`,
        description: `${budget.amendments.length} amendments | ${budget.versions.length} versions`,
      })),
      payload: { budgets, hierarchyRows, selectedBudget, varianceRows },
    }),
    [
      budgets,
      comparisonPeriodId,
      hierarchyRows,
      selectedBudget,
      varianceRows,
      workspace.alerts,
      workspace.overview,
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
                        /balance|amount|debit|credit|net|cost|budget|actual|available|variance|opening|closing|total|value|pressure/i.test(
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
            Budget Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Budget hierarchy, amendment posture, and comparison-period variance reporting from the
            shared budget workspace.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <ReportExportActions
            actions={[
              {
                key: 'csv',
                onClick: () =>
                  runAction(
                    'Export Budget Report CSV',
                    () => exportReportCsv('budget-report', exportConfig),
                    'Budget report CSV exported'
                  ),
                disabled: pendingAction !== null,
              },
              {
                key: 'excel',
                onClick: () =>
                  runAction(
                    'Export Budget Report Excel',
                    () => exportReportExcel('budget-report', exportConfig),
                    'Budget report workbook exported'
                  ),
                disabled: pendingAction !== null,
              },
              {
                key: 'json',
                onClick: () =>
                  runAction(
                    'Export Budget Report JSON',
                    () => exportReportJson('budget-report', exportConfig),
                    'Budget report JSON exported'
                  ),
                disabled: pendingAction !== null,
              },
              { key: 'print', onClick: () => setPrintOpen(true), disabled: pendingAction !== null },
            ]}
          />
        </Stack>
      </Stack>

      <Stack spacing={1.25} sx={{ mb: 3 }}>
        {workspace.alerts.map((alert) => (
          <Alert key={alert.id} severity={alert.severity} sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {alert.title}
            </Typography>
            {alert.description}
          </Alert>
        ))}
      </Stack>

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Budget status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <MenuItem value="all">All budgets</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="breach">Threshold breaches</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Comparison period"
                value={comparisonPeriodId}
                onChange={(event) => setComparisonPeriodId(event.target.value)}
              >
                {workspace.comparisonPeriods.map((period) => (
                  <MenuItem key={period.id} value={period.id}>
                    {period.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Inspect budget"
                value={selectedBudget?.id || ''}
                onChange={(event) => setSelectedBudgetId(event.target.value)}
              >
                {budgets.map((budget) => (
                  <MenuItem key={budget.id} value={budget.id}>
                    {budget.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Budget envelope"
            value={formatCurrency(workspace.overview.totalBudget)}
            helper="Approved and draft planning envelope"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Actuals booked"
            value={formatCurrency(workspace.overview.totalActual)}
            helper="Recognized spend across all budget plans"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Commitments + encumbrance"
            value={formatCurrency(
              workspace.overview.totalCommitments + workspace.overview.totalEncumbrance
            )}
            helper="Reserved and committed budget usage"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Threshold pressure"
            value={workspace.overview.warningPlans + workspace.overview.criticalPlans}
            helper="Plans above configured warning or critical thresholds"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 7 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Budget Hierarchy Rollup
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th align="left">Cost center</th>
                      <th align="right">Plans</th>
                      <th align="right">Budget</th>
                      <th align="right">Actual</th>
                      <th align="right">Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hierarchyRows.map((row) => (
                      <tr key={row.id}>
                        <td style={{ padding: '12px 8px' }}>
                          <Typography variant="body2" fontWeight={700}>
                            {row.costCenterCode} - {row.costCenterName}
                          </Typography>
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {row.budgetCount}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(row.totalBudget)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(row.totalActual)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px', fontWeight: 700 }}>
                          {formatCurrency(row.totalAvailable)}
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
                Variance Detail
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th align="left">Account</th>
                      <th align="right">Planned</th>
                      <th align="right">Actual</th>
                      <th align="right">Variance</th>
                      <th align="right">Commitment %</th>
                      <th align="left">Status</th>
                      <th align="right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {varianceRows.map((row) => (
                      <tr key={row.id}>
                        <td style={{ padding: '12px 8px' }}>
                          <Stack spacing={0.25}>
                            <Typography variant="body2" fontWeight={700}>
                              {row.accountCode} - {row.accountName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Owner: {row.owner}
                            </Typography>
                          </Stack>
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(row.planned)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(row.actual)}
                        </td>
                        <td
                          align="right"
                          style={{
                            padding: '12px 8px',
                            fontWeight: 700,
                            color: row.variance >= 0 ? '#15803d' : '#b91c1c',
                          }}
                        >
                          {formatCurrency(row.variance)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {row.commitmentPercent.toFixed(1)}%
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <Chip
                            label={workspace.formatBudgetStatus(row.status)}
                            size="small"
                            color={
                              row.status === 'critical'
                                ? 'error'
                                : row.status === 'warning'
                                  ? 'warning'
                                  : 'success'
                            }
                          />
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          <Button
                            component={RouterLink}
                            href={`${paths.dashboard.accountingFinance.budgets.lines}?budget=${selectedBudget?.id}&account=${encodeURIComponent(row.accountCode)}`}
                            size="small"
                            variant="outlined"
                            color="inherit"
                          >
                            View Lines
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 5 }}>
          {selectedBudget && (
            <Stack spacing={3}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Selected Budget
                  </Typography>
                  <Stack spacing={1.25}>
                    <Typography variant="body2" fontWeight={700}>
                      {selectedBudget.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedBudget.department} • {selectedBudget.costCenterName} •{' '}
                      {selectedBudget.fiscalYear}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip label={`${selectedBudget.versions.length} versions`} size="small" />
                      <Chip label={`${selectedBudget.amendments.length} amendments`} size="small" />
                      <Chip label={`${selectedBudget.lines.length} lines`} size="small" />
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Pressure</Typography>
                      <Typography fontWeight={700}>
                        {selectedBudget.pressure.toFixed(1)}%
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Available</Typography>
                      <Typography fontWeight={700}>
                        {formatCurrency(selectedBudget.available)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Thresholds</Typography>
                      <Typography fontWeight={700}>
                        {selectedBudget.warningThreshold}% / {selectedBudget.criticalThreshold}%
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Version And Amendment Log
                  </Typography>
                  <Stack spacing={1.25}>
                    {selectedBudget.versions.map((version) => (
                      <Box
                        key={version.id}
                        sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                      >
                        <Typography variant="body2" fontWeight={700}>
                          {version.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {version.type} • {version.createdAt} • {version.changedBy}
                        </Typography>
                      </Box>
                    ))}
                    {selectedBudget.amendments.map((amendment) => (
                      <Box
                        key={amendment.id}
                        sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                      >
                        <Typography variant="body2" fontWeight={700}>
                          {formatCurrency(amendment.amount)} • {amendment.reason}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {amendment.status} • {amendment.requestedAt} • {amendment.requestedBy}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          )}
        </Grid>
      </Grid>

      {printOpen && (
        <PdfPrintLayout title="Budget Report" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
