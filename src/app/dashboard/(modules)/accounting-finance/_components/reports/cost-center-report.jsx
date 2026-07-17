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
import { useAnalyticWorkspace } from '../analytic-accounting/use-analytic-workspace';
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

function aggregateCenterPeriods(budgets) {
  const periodMap = new Map();

  budgets.forEach((budget) => {
    budget.actualsByPeriod.forEach((period) => {
      const current = periodMap.get(period.label) || {
        label: period.label,
        planned: 0,
        actual: 0,
        commitments: 0,
        encumbrance: 0,
      };

      periodMap.set(period.label, {
        label: period.label,
        planned: current.planned + Number(period.planned || 0),
        actual: current.actual + Number(period.actual || 0),
        commitments: current.commitments + Number(period.commitments || 0),
        encumbrance: current.encumbrance + Number(period.encumbrance || 0),
      });
    });
  });

  return [...periodMap.values()];
}

export default function CostCenterReport() {
  const budgetsWorkspace = useBudgetsWorkspace();
  const analyticWorkspace = useAnalyticWorkspace();
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedCenterId, setSelectedCenterId] = useState(
    budgetsWorkspace.costCenters[0]?.id || ''
  );
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  const rows = useMemo(
    () =>
      budgetsWorkspace.costCenters
        .map((center) => {
          const centerBudgets = budgetsWorkspace.budgets.filter(
            (budget) => String(budget.costCenterId) === String(center.id)
          );
          const centerItems = analyticWorkspace.items.filter(
            (item) => item.costCenterName === center.name
          );
          const periods = aggregateCenterPeriods(centerBudgets);
          const budgetTotal = centerBudgets.reduce(
            (sum, item) => sum + Number(item.totalAmount || 0),
            0
          );
          const actualTotal = centerBudgets.reduce(
            (sum, item) => sum + Number(item.spentAmount || 0),
            0
          );
          const commitments = centerBudgets.reduce(
            (sum, item) => sum + Number(item.commitments || 0),
            0
          );
          const encumbrance = centerBudgets.reduce(
            (sum, item) => sum + Number(item.encumbrance || 0),
            0
          );
          const available = centerBudgets.reduce(
            (sum, item) => sum + Number(item.available || 0),
            0
          );
          const pressure =
            budgetTotal > 0 ? ((actualTotal + commitments + encumbrance) / budgetTotal) * 100 : 0;
          const analyticAmount = centerItems.reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0
          );
          const exceptionCount = centerItems.filter(
            (item) => item.distributionStatus !== 'validated'
          ).length;
          const topProjectTotals = centerItems.reduce((accumulator, item) => {
            const current = accumulator.get(item.projectName) || 0;
            accumulator.set(item.projectName, current + Number(item.amount || 0));
            return accumulator;
          }, new Map());
          const topProject =
            [...topProjectTotals.entries()].sort(
              (left, right) => Math.abs(right[1]) - Math.abs(left[1])
            )[0]?.[0] || 'No project split';

          return {
            ...center,
            periods,
            budgetTotal,
            actualTotal,
            commitments,
            encumbrance,
            available,
            pressure,
            analyticAmount,
            exceptionCount,
            topProject,
            budgetCount: centerBudgets.length,
            thresholdStatus: pressure >= 95 ? 'critical' : pressure >= 85 ? 'warning' : 'healthy',
          };
        })
        .filter((row) => {
          if (typeFilter !== 'all' && row.type !== typeFilter) return false;
          if (!search) return true;

          return [row.name, row.code, row.type, row.topProject]
            .join(' ')
            .toLowerCase()
            .includes(search.toLowerCase());
        }),
    [
      analyticWorkspace.items,
      budgetsWorkspace.budgets,
      budgetsWorkspace.costCenters,
      search,
      typeFilter,
    ]
  );

  const selectedCenter =
    rows.find((row) => String(row.id) === String(selectedCenterId)) || rows[0] || null;

  const totalBudget = rows.reduce((sum, row) => sum + row.budgetTotal, 0);
  const totalActual = rows.reduce((sum, row) => sum + row.actualTotal, 0);
  const totalAnalytic = rows.reduce((sum, row) => sum + row.analyticAmount, 0);
  const breachCount = rows.filter((row) => row.thresholdStatus !== 'healthy').length;

  const exportConfig = useMemo(
    () => ({
      title: 'Cost Center Report',
      subtitle: 'Performance, trend, and budget linkage by cost center',
      summary: [
        { label: 'Budget envelope', value: formatCurrency(totalBudget) },
        { label: 'Actual spend', value: formatCurrency(totalActual) },
        { label: 'Analytic allocation', value: formatCurrency(totalAnalytic) },
        { label: 'Centers in scope', value: rows.length },
      ],
      tables: [
        {
          title: 'Cost Center Summary',
          columns: [
            { key: 'center', label: 'Cost Center' },
            { key: 'budget', label: 'Budget' },
            { key: 'actual', label: 'Actual' },
            { key: 'available', label: 'Available' },
            { key: 'pressure', label: 'Pressure' },
            { key: 'project', label: 'Top Project' },
          ],
          rows: rows.map((row) => ({
            center: `${row.code} - ${row.name}`,
            budget: formatCurrency(row.budgetTotal),
            actual: formatCurrency(row.actualTotal),
            available: formatCurrency(row.available),
            pressure: `${row.pressure.toFixed(1)}%`,
            project: row.topProject,
          })),
        },
        {
          title: 'Period Trend',
          columns: [
            { key: 'label', label: 'Period' },
            { key: 'planned', label: 'Planned' },
            { key: 'actual', label: 'Actual' },
            { key: 'commitments', label: 'Commitments' },
            { key: 'encumbrance', label: 'Encumbrance' },
          ],
          rows: selectedCenter?.periods || [],
        },
      ],
      controlChecks: rows.map((row) => ({
        label: row.name,
        value: `${row.exceptionCount} analytic exceptions`,
        description: `${row.budgetCount} budgets linked | ${row.pressure.toFixed(1)}% pressure`,
      })),
      payload: { rows, selectedCenter },
    }),
    [rows, selectedCenter, totalActual, totalAnalytic, totalBudget]
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
            Cost Center Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cost center performance with budget pressure, analytic allocation exposure, and period
            trend linkage.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <ReportExportActions
            actions={[
              {
                key: 'csv',
                onClick: () =>
                  runAction(
                    'Export Cost Center CSV',
                    () => exportReportCsv('cost-center-report', exportConfig),
                    'Cost center CSV exported'
                  ),
                disabled: pendingAction !== null,
              },
              {
                key: 'excel',
                onClick: () =>
                  runAction(
                    'Export Cost Center Excel',
                    () => exportReportExcel('cost-center-report', exportConfig),
                    'Cost center workbook exported'
                  ),
                disabled: pendingAction !== null,
              },
              {
                key: 'json',
                onClick: () =>
                  runAction(
                    'Export Cost Center JSON',
                    () => exportReportJson('cost-center-report', exportConfig),
                    'Cost center JSON exported'
                  ),
                disabled: pendingAction !== null,
              },
              { key: 'print', onClick: () => setPrintOpen(true), disabled: pendingAction !== null },
            ]}
          />
        </Stack>
      </Stack>

      <Alert severity={breachCount ? 'warning' : 'success'} sx={{ mb: 3, borderRadius: 2 }}>
        {breachCount
          ? `${breachCount} cost centers are operating above warning pressure thresholds.`
          : 'All visible cost centers are within configured budget pressure thresholds.'}
      </Alert>

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                label="Type"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                <MenuItem value="all">All types</MenuItem>
                {[...new Set(budgetsWorkspace.costCenters.map((center) => center.type))].map(
                  (type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  )
                )}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                label="Search cost center"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Center, code, project"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Inspect center"
                value={selectedCenter?.id || ''}
                onChange={(event) => setSelectedCenterId(event.target.value)}
              >
                {rows.map((row) => (
                  <MenuItem key={row.id} value={row.id}>
                    {row.name}
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
            value={formatCurrency(totalBudget)}
            helper="Approved and draft envelopes across visible centers"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Actual spend"
            value={formatCurrency(totalActual)}
            helper="Recognized budget consumption linked to these centers"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Analytic allocation"
            value={formatCurrency(totalAnalytic)}
            helper="Analytic move-line value tagged to the same centers"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Threshold breaches"
            value={breachCount}
            helper="Centers above warning or critical budget pressure"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 8 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Center Summary
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th align="left">Cost center</th>
                      <th align="right">Budget</th>
                      <th align="right">Actual</th>
                      <th align="right">Available</th>
                      <th align="right">Pressure</th>
                      <th align="left">Top project</th>
                      <th align="right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedCenterId(row.id)}
                        style={{
                          cursor: 'pointer',
                          background:
                            String(selectedCenter?.id) === String(row.id)
                              ? 'rgba(37,99,235,0.06)'
                              : 'transparent',
                        }}
                      >
                        <td style={{ padding: '12px 8px' }}>
                          <Stack spacing={0.25}>
                            <Typography variant="body2" fontWeight={700}>
                              {row.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {row.code} • {row.type} • {row.budgetCount} budgets linked
                            </Typography>
                          </Stack>
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(row.budgetTotal)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(row.actualTotal)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px', fontWeight: 700 }}>
                          {formatCurrency(row.available)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          <Chip
                            label={`${row.pressure.toFixed(1)}%`}
                            size="small"
                            color={
                              row.thresholdStatus === 'critical'
                                ? 'error'
                                : row.thresholdStatus === 'warning'
                                  ? 'warning'
                                  : 'success'
                            }
                          />
                        </td>
                        <td style={{ padding: '12px 8px' }}>{row.topProject}</td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          <Button
                            component={RouterLink}
                            href={paths.dashboard.accountingFinance.budgets.lines}
                            size="small"
                            variant="outlined"
                            color="inherit"
                            onClick={(event) => event.stopPropagation()}
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

          {selectedCenter && (
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Period Trend
                </Typography>
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th align="left">Period</th>
                        <th align="right">Planned</th>
                        <th align="right">Actual</th>
                        <th align="right">Commitments</th>
                        <th align="right">Encumbrance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCenter.periods.map((period) => (
                        <tr key={period.label}>
                          <td style={{ padding: '12px 8px' }}>{period.label}</td>
                          <td align="right" style={{ padding: '12px 8px' }}>
                            {formatCurrency(period.planned)}
                          </td>
                          <td align="right" style={{ padding: '12px 8px' }}>
                            {formatCurrency(period.actual)}
                          </td>
                          <td align="right" style={{ padding: '12px 8px' }}>
                            {formatCurrency(period.commitments)}
                          </td>
                          <td align="right" style={{ padding: '12px 8px' }}>
                            {formatCurrency(period.encumbrance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          {selectedCenter && (
            <Stack spacing={3}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Selected Center
                  </Typography>
                  <Stack spacing={1.25}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Analytic value</Typography>
                      <Typography fontWeight={700}>
                        {formatCurrency(selectedCenter.analyticAmount)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Exceptions</Typography>
                      <Typography fontWeight={700}>{selectedCenter.exceptionCount}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Commitments</Typography>
                      <Typography fontWeight={700}>
                        {formatCurrency(selectedCenter.commitments)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Encumbrance</Typography>
                      <Typography fontWeight={700}>
                        {formatCurrency(selectedCenter.encumbrance)}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Governance Link
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cost center performance is now tied to both the budget workspace and analytic
                    distribution workspace, so the report shows pressure, allocations, and exception
                    posture in one place.
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          )}
        </Grid>
      </Grid>

      {printOpen && (
        <PdfPrintLayout title="Cost Center Report" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
