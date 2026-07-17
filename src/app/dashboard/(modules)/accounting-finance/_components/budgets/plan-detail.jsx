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

// ── Single-budget data hook ───────────────────────────────────────────────────

function useBudgetDetail(budgetId) {
  const { data: rawBudget, isLoading: budgetLoading } = useSWR(
    budgetId ? endpoints.accounting.budget_by_id(budgetId) : null,
    fetcher
  );
  const { data: rawLines, isLoading: linesLoading } = useSWR(
    budgetId ? `${endpoints.accounting.budget_lines}?budget=${budgetId}` : null,
    fetcher
  );
  const { data: rawAmendments, isLoading: amendmentsLoading } = useSWR(
    budgetId ? `${endpoints.accounting.budget_amendments}?budget=${budgetId}` : null,
    fetcher
  );

  const isLoading = budgetLoading || linesLoading || amendmentsLoading;

  const budget = useMemo(() => {
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

    const lines = linesList.map((line) => ({
      id: line.id,
      accountCode: line.account_code || '',
      accountName: line.account_name || '',
      owner: line.owner || 'Budget Controller',
      planned: round2(line.planned_amount),
      actual: round2(line.actual_amount),
      commitments: round2(line.committed_amount),
      encumbrance: round2(line.encumbrance_amount),
      available: round2(line.available_amount),
    }));

    const amendments = amendmentsList.map((amd) => ({
      id: amd.id,
      amount: round2(amd.amount),
      reason: amd.reason || '',
      requestedBy: amd.requested_by || '',
      requestedAt: amd.created_at ? amd.created_at.slice(0, 10) : '',
      status: amd.status || 'pending_approval',
      effectivePeriod: amd.effective_period || '',
    }));

    const versions = [
      {
        id: `${rawBudget.id}-v1`,
        label: 'Version 1.0',
        type: 'baseline',
        status:
          amendments.length === 0
            ? rawBudget.status === 'draft'
              ? 'draft'
              : 'approved'
            : 'approved',
        changedBy: rawBudget.owner || '',
        createdAt: rawBudget.created_at ? rawBudget.created_at.slice(0, 10) : '',
        note: 'Initial approved budget envelope',
      },
      ...amendments.map((amd, idx) => ({
        id: `${rawBudget.id}-v${idx + 2}`,
        label: `Version ${idx + 2}.0`,
        type: 'amendment',
        status: amd.status,
        changedBy: amd.requestedBy,
        createdAt: amd.requestedAt,
        note: amd.reason,
      })),
    ].reverse();

    const approvalChain = [
      {
        id: `${rawBudget.id}-a1`,
        role: 'Budget Owner',
        assignee: rawBudget.owner || '',
        status: 'approved',
        actedAt: rawBudget.created_at ? rawBudget.created_at.slice(0, 10) : '',
      },
      {
        id: `${rawBudget.id}-a2`,
        role: 'Finance Controller',
        assignee: 'Finance Controller',
        status: rawBudget.status === 'draft' ? 'in_review' : 'approved',
        actedAt: '',
      },
      {
        id: `${rawBudget.id}-a3`,
        role: 'Executive Director',
        assignee: 'Executive Director',
        status:
          rawBudget.status === 'draft' || rawBudget.status === 'pending_approval'
            ? 'pending'
            : 'approved',
        actedAt: '',
      },
    ];

    const periodLabels = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026'];
    const actualsByPeriod = periodLabels.map((label) => ({
      label,
      planned: round2(planned / 4),
      actual: round2(actual / 4),
      commitments: round2(committed / 4),
      encumbrance: round2(encumbrance / 4),
    }));

    return {
      id: rawBudget.id,
      name: rawBudget.name,
      department: rawBudget.department_name || rawBudget.department_label || '',
      fiscalYear: rawBudget.fiscal_year_name || 'FY 2026',
      costCenterName: rawBudget.cost_center_name || '',
      costCenterCode: rawBudget.cost_center_code || '',
      owner: rawBudget.owner || '',
      status: rawBudget.status,
      warningThreshold,
      criticalThreshold,
      totalAmount: planned,
      spentAmount: actual,
      commitments: committed,
      encumbrance,
      available,
      pressure,
      thresholdStatus:
        pressure >= criticalThreshold
          ? 'critical'
          : pressure >= warningThreshold
            ? 'warning'
            : 'healthy',
      lines,
      amendments,
      versions,
      approvalChain,
      actualsByPeriod,
    };
  }, [rawBudget, rawLines, rawAmendments]);

  return { budget, isLoading };
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

export default function BudgetPlanDetail({ budgetId }) {
  const { budget, isLoading } = useBudgetDetail(budgetId);

  if (isLoading) return <LoadingSkeleton />;

  if (!budget) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Budget plan not found.
        </Typography>
        <Button
          component={RouterLink}
          href={paths.dashboard.accountingFinance.budgets.plans}
          sx={{ mt: 2 }}
          startIcon={<Iconify icon="solar:arrow-left-bold" />}
        >
          Back to Plans
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
            href={paths.dashboard.accountingFinance.budgets.plans}
            size="small"
            startIcon={<Iconify icon="solar:arrow-left-bold" />}
            sx={{ mb: 1.5, color: 'text.secondary' }}
          >
            Back to Plans
          </Button>
          <Typography variant="h4" fontWeight={800}>
            {budget.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {budget.department} • {budget.fiscalYear} • {budget.costCenterName} • Owner:{' '}
            {budget.owner}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="flex-start">
          <Button
            component={RouterLink}
            href={`${paths.dashboard.accountingFinance.budgets.lines}?budget=${budget.id}`}
            variant="outlined"
            startIcon={<Iconify icon="solar:list-check-bold" />}
          >
            Line Manager
          </Button>
          <Button
            component={RouterLink}
            href={`${paths.dashboard.accountingFinance.budgets.vsActual}?budget=${budget.id}`}
            variant="contained"
            startIcon={<Iconify icon="solar:chart-square-bold" />}
          >
            View Variance
          </Button>
        </Stack>
      </Stack>

      {budget.thresholdStatus !== 'healthy' && (
        <Alert
          severity={budget.thresholdStatus === 'critical' ? 'error' : 'warning'}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            {budget.thresholdStatus === 'critical'
              ? `${budget.name} has exceeded the critical pressure threshold`
              : `${budget.name} is approaching its warning threshold`}
          </Typography>
          Current pressure at {budget.pressure.toFixed(1)}% — warning at {budget.warningThreshold}%,
          critical at {budget.criticalThreshold}%.
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Total Budget"
            value={formatCurrency(budget.totalAmount)}
            helper="Approved planning envelope"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Actuals Booked"
            value={formatCurrency(budget.spentAmount)}
            helper="Recognized expenditure"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Available"
            value={formatCurrency(budget.available)}
            helper="Remaining unreserved budget"
            color={budget.available < 0 ? '#b91c1c' : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Pressure"
            value={`${budget.pressure.toFixed(1)}%`}
            helper={`Warn ${budget.warningThreshold}% • Critical ${budget.criticalThreshold}%`}
            color={
              budget.thresholdStatus === 'critical'
                ? '#b91c1c'
                : budget.thresholdStatus === 'warning'
                  ? '#d97706'
                  : '#15803d'
            }
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 8 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ pb: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight={700}>
                  Budget Lines
                </Typography>
                <Button
                  component={RouterLink}
                  href={`${paths.dashboard.accountingFinance.budgets.lines}?budget=${budget.id}`}
                  size="small"
                  variant="outlined"
                  endIcon={<Iconify icon="solar:arrow-right-bold" />}
                >
                  Open Line Manager
                </Button>
              </Stack>
            </CardContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Account</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell align="right">Planned</TableCell>
                    <TableCell align="right">Actual</TableCell>
                    <TableCell align="right">Commitments</TableCell>
                    <TableCell align="right">Available</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {budget.lines.map((line) => {
                    const pressure =
                      line.planned > 0
                        ? ((line.actual + line.commitments + line.encumbrance) / line.planned) * 100
                        : 0;
                    const status =
                      pressure >= budget.criticalThreshold
                        ? 'critical'
                        : pressure >= budget.warningThreshold
                          ? 'warning'
                          : 'healthy';
                    return (
                      <TableRow key={line.id} hover>
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography variant="body2" fontWeight={700}>
                              {line.accountCode}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {line.accountName}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{line.owner}</TableCell>
                        <TableCell align="right">{formatCurrency(line.planned)}</TableCell>
                        <TableCell align="right">{formatCurrency(line.actual)}</TableCell>
                        <TableCell align="right">{formatCurrency(line.commitments)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {formatCurrency(line.available)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={formatStatus(status)}
                            size="small"
                            color={
                              status === 'critical'
                                ? 'error'
                                : status === 'warning'
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
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Period Actuals
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Period</TableCell>
                      <TableCell align="right">Planned</TableCell>
                      <TableCell align="right">Actual</TableCell>
                      <TableCell align="right">Commitments</TableCell>
                      <TableCell align="right">Encumbrance</TableCell>
                      <TableCell align="right">Available</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(budget.actualsByPeriod || []).map((period) => (
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Plan Overview
                </Typography>
                <Stack spacing={1.25}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Fiscal Year
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {budget.fiscalYear}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Cost Center
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {budget.costCenterName}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Department
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {budget.department}
                    </Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip label={`${budget.lines.length} lines`} size="small" />
                    <Chip label={`${budget.versions.length} versions`} size="small" />
                    <Chip label={`${budget.amendments.length} amendments`} size="small" />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Commitments
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {formatCurrency(budget.commitments)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Encumbrance
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {formatCurrency(budget.encumbrance)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Approval Chain
                </Typography>
                <Stack spacing={1.25}>
                  {(budget.approvalChain || []).map((step) => (
                    <Stack
                      key={step.id}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {step.role}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {step.assignee}
                        </Typography>
                      </Box>
                      <Chip
                        label={formatStatus(step.status)}
                        size="small"
                        color={
                          step.status === 'approved'
                            ? 'success'
                            : step.status === 'in_review'
                              ? 'warning'
                              : 'default'
                        }
                      />
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Version History
                </Typography>
                <Stack spacing={1.25}>
                  {(budget.versions || []).map((version) => (
                    <Box
                      key={version.id}
                      sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" fontWeight={700}>
                          {version.label}
                        </Typography>
                        <Chip
                          label={formatStatus(version.status)}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {version.type} • {version.changedBy} • {version.createdAt}
                      </Typography>
                      {version.note && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {version.note}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {budget.amendments.length > 0 && (
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Amendment Log
                  </Typography>
                  <Stack spacing={1.25}>
                    {(budget.amendments || []).map((amendment) => (
                      <Box
                        key={amendment.id}
                        sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" fontWeight={700}>
                            {formatCurrency(amendment.amount)}
                          </Typography>
                          <Chip
                            label={formatStatus(amendment.status)}
                            size="small"
                            color={amendment.status === 'approved' ? 'success' : 'warning'}
                          />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {amendment.reason}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          {amendment.requestedBy} • {amendment.requestedAt} •{' '}
                          {amendment.effectivePeriod}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
