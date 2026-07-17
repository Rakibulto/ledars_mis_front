'use client';

import useSWR from 'swr';
import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fetcher, endpoints } from 'src/utils/axios';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100;

function formatStatus(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Data hook ─────────────────────────────────────────────────────────────────

function useBudgetTrackingDetail(budgetId) {
  const { data: rawBudget, isLoading: budgetLoading } = useSWR(
    budgetId ? endpoints.accounting.budget_by_id(budgetId) : null,
    fetcher
  );
  const { data: rawLines, isLoading: linesLoading } = useSWR(
    budgetId ? `${endpoints.accounting.budget_lines}?budget=${budgetId}` : null,
    fetcher
  );
  const { data: rawAmendments } = useSWR(
    budgetId ? `${endpoints.accounting.budget_amendments}?budget=${budgetId}` : null,
    fetcher
  );

  const isLoading = budgetLoading || linesLoading;

  const data = useMemo(() => {
    if (!rawBudget) return null;

    const linesList = Array.isArray(rawLines) ? rawLines : (rawLines?.results ?? []);
    const amendmentsList = Array.isArray(rawAmendments)
      ? rawAmendments
      : (rawAmendments?.results ?? []);

    const planned = round2(rawBudget.total_planned);
    const actual = round2(rawBudget.total_actual);
    const committed = round2(rawBudget.total_committed);
    const encumbrance = round2(rawBudget.total_encumbrance);
    const available = round2(planned - actual - committed - encumbrance);
    const pressure = planned > 0 ? ((actual + committed + encumbrance) / planned) * 100 : 0;
    const warningThreshold = round2(rawBudget.warning_threshold ?? 85);
    const criticalThreshold = round2(rawBudget.critical_threshold ?? 95);
    const thresholdStatus =
      pressure >= criticalThreshold
        ? 'critical'
        : pressure >= warningThreshold
          ? 'warning'
          : 'healthy';

    const lines = linesList.map((line) => {
      const lPlanned = round2(line.planned_amount);
      const lActual = round2(line.actual_amount);
      const lCommitted = round2(line.committed_amount);
      const lEncumbrance = round2(line.encumbrance_amount);
      const lPressure = lPlanned > 0 ? ((lActual + lCommitted + lEncumbrance) / lPlanned) * 100 : 0;
      return {
        id: line.id,
        accountCode: line.account_code || '',
        accountName: line.account_name || '',
        owner: line.owner || 'Budget Controller',
        planned: lPlanned,
        actual: lActual,
        commitments: lCommitted,
        encumbrance: lEncumbrance,
        available: round2(line.available_amount),
        pressure: lPressure,
        status:
          lPressure >= criticalThreshold
            ? 'critical'
            : lPressure >= warningThreshold
              ? 'warning'
              : 'healthy',
      };
    });

    const periodLabels = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026'];
    const actualsByPeriod = periodLabels.map((label) => ({
      label,
      planned: round2(planned / 4),
      actual: round2(actual / 4),
      commitments: round2(committed / 4),
      encumbrance: round2(encumbrance / 4),
    }));

    const openAmendment = amendmentsList.find((a) => a.status === 'pending_approval') || null;
    const coveredOwners = new Set(lines.map((l) => l.owner)).size;
    const linesSortedByPressure = [...lines].sort((a, b) => b.pressure - a.pressure);
    const periodsSortedByPressure = [...actualsByPeriod]
      .map((p) => {
        const pPressure =
          p.planned > 0 ? ((p.actual + p.commitments + p.encumbrance) / p.planned) * 100 : 0;
        return {
          ...p,
          pressure: pPressure,
          status:
            pPressure >= criticalThreshold
              ? 'critical'
              : pPressure >= warningThreshold
                ? 'warning'
                : 'healthy',
        };
      })
      .sort((a, b) => b.pressure - a.pressure);

    const unhealthyLines = lines.filter((l) => l.status !== 'healthy').length;

    return {
      id: rawBudget.id,
      name: rawBudget.name,
      department: rawBudget.department_name || rawBudget.department_label || '',
      costCenterName: rawBudget.cost_center_name || '',
      owner: rawBudget.owner || '',
      status: rawBudget.status,
      warningThreshold,
      criticalThreshold,
      thresholdStatus,
      totalBudget: planned,
      totalActual: actual,
      commitments: committed,
      encumbrance,
      available,
      pressure,
      lines,
      actualsByPeriod,
      periodsSortedByPressure,
      linesSortedByPressure: linesSortedByPressure.slice(0, 8),
      openAmendment: openAmendment
        ? {
            amount: round2(openAmendment.amount),
            effectivePeriod: openAmendment.effective_period || '',
          }
        : null,
      coveredOwners,
      unhealthyLines,
      hottestPeriod: periodsSortedByPressure[0] || null,
    };
  }, [rawBudget, rawLines, rawAmendments]);

  return { data, isLoading };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({ label, value, helper, color }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75, color }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {helper}
        </Typography>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width={300} height={48} sx={{ mb: 1 }} />
      <Skeleton variant="text" width={500} height={24} sx={{ mb: 3 }} />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[1, 2, 3, 4].map((i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, xl: 3 }}>
            <Skeleton variant="rounded" height={100} />
          </Grid>
        ))}
      </Grid>
      <Skeleton variant="rounded" height={300} />
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BudgetTrackingDetail({ budgetId }) {
  const { data, isLoading } = useBudgetTrackingDetail(budgetId);

  if (isLoading) return <LoadingSkeleton />;

  if (!data) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Budget tracking data not found.
        </Typography>
        <Button
          component={RouterLink}
          href={paths.dashboard.accountingFinance.budgets.tracking}
          sx={{ mt: 2 }}
          startIcon={<Iconify icon="solar:arrow-left-bold" />}
        >
          Back to Tracking
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Button
            component={RouterLink}
            href={paths.dashboard.accountingFinance.budgets.tracking}
            size="small"
            startIcon={<Iconify icon="solar:arrow-left-bold" />}
            sx={{ mb: 1.5, color: 'text.secondary' }}
          >
            Back to Tracking
          </Button>
          <Typography variant="h4" fontWeight={800}>
            {data.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.owner} • {data.costCenterName} • {data.department}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="flex-start">
          <Button
            component={RouterLink}
            href={`${paths.dashboard.accountingFinance.budgets.vsActual}?budget=${data.id}`}
            variant="outlined"
            startIcon={<Iconify icon="solar:chart-square-bold" />}
          >
            Review Variance
          </Button>
          <Button
            component={RouterLink}
            href={`${paths.dashboard.accountingFinance.budgets.lines}?budget=${data.id}`}
            variant="contained"
            startIcon={<Iconify icon="solar:list-check-bold" />}
          >
            Open Lines
          </Button>
        </Stack>
      </Stack>

      <Alert
        severity={
          data.thresholdStatus === 'critical'
            ? 'error'
            : data.thresholdStatus === 'warning'
              ? 'warning'
              : 'success'
        }
        sx={{ mb: 3, borderRadius: 2 }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          {data.thresholdStatus === 'critical'
            ? `${data.name} is above the critical pressure threshold`
            : data.thresholdStatus === 'warning'
              ? `${data.name} is approaching its control ceiling`
              : `${data.name} remains inside the configured budget tolerance`}
        </Typography>
        {data.hottestPeriod
          ? `${data.hottestPeriod.label} is the hottest period at ${data.hottestPeriod.pressure.toFixed(1)}% pressure. ${data.unhealthyLines} line items are outside healthy tolerance.`
          : 'No period pressure data is available for this budget.'}
      </Alert>

      {data.openAmendment && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            Pending amendment requires release control
          </Typography>
          {`${formatCurrency(data.openAmendment.amount)} for ${data.openAmendment.effectivePeriod} is waiting on approval before the revised envelope should be treated as available.`}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Total Budget"
            value={formatCurrency(data.totalBudget)}
            helper={`${data.department} • ${data.costCenterName}`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Current Pressure"
            value={`${data.pressure.toFixed(1)}%`}
            helper={`Warn ${data.warningThreshold}% • Critical ${data.criticalThreshold}%`}
            color={
              data.thresholdStatus === 'critical'
                ? '#b91c1c'
                : data.thresholdStatus === 'warning'
                  ? '#d97706'
                  : '#15803d'
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Owner Coverage"
            value={`${data.coveredOwners}`}
            helper="Distinct line owners carrying this budget"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="At-Risk Lines"
            value={`${data.unhealthyLines}`}
            helper="Lines at warning or critical utilization"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 8 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ pb: 1 }}>
              <Typography variant="h6" fontWeight={700}>
                Actuals By Period
              </Typography>
            </CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell align="right">Planned</TableCell>
                    <TableCell align="right">Actual</TableCell>
                    <TableCell align="right">Commitments</TableCell>
                    <TableCell align="right">Encumbrance</TableCell>
                    <TableCell align="right">Available</TableCell>
                    <TableCell>Pressure</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.actualsByPeriod.map((period) => {
                    const pPressure =
                      period.planned > 0
                        ? ((period.actual + period.commitments + period.encumbrance) /
                            period.planned) *
                          100
                        : 0;
                    const pStatus =
                      pPressure >= data.criticalThreshold
                        ? 'critical'
                        : pPressure >= data.warningThreshold
                          ? 'warning'
                          : 'healthy';
                    return (
                      <TableRow key={period.label} hover>
                        <TableCell>{period.label}</TableCell>
                        <TableCell align="right">{formatCurrency(period.planned)}</TableCell>
                        <TableCell align="right">{formatCurrency(period.actual)}</TableCell>
                        <TableCell align="right">{formatCurrency(period.commitments)}</TableCell>
                        <TableCell align="right">{formatCurrency(period.encumbrance)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {formatCurrency(
                            period.planned - period.actual - period.commitments - period.encumbrance
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${pPressure.toFixed(0)}%`}
                            size="small"
                            color={
                              pStatus === 'critical'
                                ? 'error'
                                : pStatus === 'warning'
                                  ? 'warning'
                                  : 'success'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ pb: 1 }}>
              <Typography variant="h6" fontWeight={700}>
                Line Pressure Queue
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Highest-pressure lines that should drive reforecasting, owner follow-up, or
                amendment review.
              </Typography>
            </CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Budget Line</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell align="right">Available</TableCell>
                    <TableCell align="right">Pressure</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.linesSortedByPressure.map((line) => (
                    <TableRow key={line.id} hover>
                      <TableCell>
                        <Stack spacing={0.4}>
                          <Typography variant="body2" fontWeight={700}>
                            {line.accountCode} • {line.accountName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Actual {formatCurrency(line.actual)} • Commitments{' '}
                            {formatCurrency(line.commitments)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{line.owner}</TableCell>
                      <TableCell align="right">{formatCurrency(line.available)}</TableCell>
                      <TableCell align="right">{line.pressure.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Chip
                          label={formatStatus(line.status)}
                          size="small"
                          color={
                            line.status === 'critical'
                              ? 'error'
                              : line.status === 'warning'
                                ? 'warning'
                                : 'success'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          component={RouterLink}
                          href={`${paths.dashboard.accountingFinance.budgets.lines}?budget=${data.id}&account=${encodeURIComponent(line.accountCode)}`}
                          size="small"
                          variant="outlined"
                          color="inherit"
                        >
                          Review Line
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Control Posture
                </Typography>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      Amendment posture
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {data.openAmendment
                        ? `${formatCurrency(data.openAmendment.amount)} pending for ${data.openAmendment.effectivePeriod}.`
                        : 'No amendment is currently waiting for approval.'}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      Hottest period
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {data.hottestPeriod
                        ? `${data.hottestPeriod.label} at ${data.hottestPeriod.pressure.toFixed(1)}% pressure.`
                        : 'No period pressure trend is available.'}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      At-risk lines
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {data.unhealthyLines > 0
                        ? `${data.unhealthyLines} line(s) are at warning or critical utilization.`
                        : 'All lines are within healthy tolerance.'}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Period Hotspots
                </Typography>
                <Stack spacing={1.25}>
                  {data.periodsSortedByPressure.slice(0, 5).map((period) => (
                    <Stack
                      key={period.label}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {period.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Available{' '}
                          {formatCurrency(
                            period.planned - period.actual - period.commitments - period.encumbrance
                          )}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${period.pressure.toFixed(0)}%`}
                        size="small"
                        color={
                          period.status === 'critical'
                            ? 'error'
                            : period.status === 'warning'
                              ? 'warning'
                              : 'success'
                        }
                      />
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
                  Budget Summary
                </Typography>
                <Stack spacing={1.25}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Total Planned
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {formatCurrency(data.totalBudget)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Actuals Booked
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {formatCurrency(data.totalActual)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Commitments
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {formatCurrency(data.commitments)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Encumbrance
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {formatCurrency(data.encumbrance)}
                    </Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Available
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color={data.available < 0 ? 'error.main' : 'success.main'}
                    >
                      {formatCurrency(data.available)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
