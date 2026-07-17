'use client';

import useSWR from 'swr';
import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
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
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fetcher, endpoints } from 'src/utils/axios';

import { Iconify } from 'src/components/iconify';

// ── Helpers ───────────────────────────────────────────────────────────────────

const parseCSV = (val) => {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (!val) return [];
  return String(val)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

function formatStatus(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Data hooks ────────────────────────────────────────────────────────────────

function useAnalyticPlanDetail(planId) {
  const { data: rawPlan, isLoading: planLoading } = useSWR(
    planId ? endpoints.accounting.analytic_plan_by_id(planId) : null,
    fetcher
  );
  const { data: rawAccounts, isLoading: accountsLoading } = useSWR(
    planId ? `${endpoints.accounting.analytic_accounts}?plan=${planId}` : null,
    fetcher
  );
  const { data: rawLines } = useSWR(
    planId ? `${endpoints.accounting.analytic_lines}?plan=${planId}` : null,
    fetcher
  );

  const isLoading = planLoading || accountsLoading;

  const data = useMemo(() => {
    if (!rawPlan) return null;

    const accountsList = Array.isArray(rawAccounts) ? rawAccounts : (rawAccounts?.results ?? []);
    const linesList = Array.isArray(rawLines) ? rawLines : (rawLines?.results ?? []);

    const plan = {
      id: rawPlan.id,
      name: rawPlan.name || '',
      description: rawPlan.description || '',
      color: rawPlan.color || '#64748b',
      active: rawPlan.is_active !== false,
      level: Number(rawPlan.level || 1),
      hierarchyLabel: rawPlan.hierarchy_label || 'General analytic dimension',
      mandatoryDimensions: parseCSV(rawPlan.mandatory_dimensions),
      applicability: parseCSV(rawPlan.applicability),
      governanceOwner: rawPlan.governance_owner || 'Finance Manager',
      approvalMode: rawPlan.approval_mode || 'Review on exceptions',
      defaultPolicy: rawPlan.default_policy || '',
      createdAt: rawPlan.created_at ? rawPlan.created_at.slice(0, 10) : '',
      updatedAt: rawPlan.updated_at ? rawPlan.updated_at.slice(0, 10) : '',
    };

    const accounts = accountsList.map((acc) => ({
      id: acc.id,
      code: acc.code || '',
      name: acc.name || '',
      balance: Number(acc.balance || 0),
      debit: Number(acc.debit || 0),
      credit: Number(acc.credit || 0),
      active: acc.is_active !== false,
      partner: acc.partner || '',
      distributionMethod: acc.distribution_method || 'fixed_ratio',
    }));

    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
    const totalDebit = accounts.reduce((sum, a) => sum + a.debit, 0);
    const totalCredit = accounts.reduce((sum, a) => sum + a.credit, 0);
    const activeCount = accounts.filter((a) => a.active).length;

    const recentLines = linesList.slice(0, 10).map((line) => ({
      id: line.id,
      date: line.date ? line.date.slice(0, 10) : '',
      name: line.name || '',
      accountName: line.account_name || line.analytic_account_name || '',
      amount: Number(line.amount || 0),
      partner: line.partner_name || '',
      reference: line.ref || line.move_name || '',
    }));

    return { plan, accounts, totalBalance, totalDebit, totalCredit, activeCount, recentLines };
  }, [rawPlan, rawAccounts, rawLines]);

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
        {helper && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {helper}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width={280} height={48} sx={{ mb: 1 }} />
      <Skeleton variant="text" width={460} height={24} sx={{ mb: 3 }} />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[1, 2, 3, 4].map((i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, xl: 3 }}>
            <Skeleton variant="rounded" height={100} />
          </Grid>
        ))}
      </Grid>
      <Skeleton variant="rounded" height={320} />
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AnalyticPlanDetail({ planId }) {
  const { data, isLoading } = useAnalyticPlanDetail(planId);

  if (isLoading) return <LoadingSkeleton />;

  if (!data) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Analytic plan not found.
        </Typography>
        <Button
          component={RouterLink}
          href={paths.dashboard.accountingFinance.analyticAccounting.analyticPlans}
          sx={{ mt: 2 }}
          startIcon={<Iconify icon="solar:arrow-left-bold" />}
        >
          Back to Plans
        </Button>
      </Box>
    );
  }

  const { plan, accounts, totalBalance, totalDebit, totalCredit, activeCount, recentLines } = data;
  const fmt = (n) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(n);

  return (
    <Box>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Button
            component={RouterLink}
            href={paths.dashboard.accountingFinance.analyticAccounting.analyticPlans}
            size="small"
            startIcon={<Iconify icon="solar:arrow-left-bold" />}
            sx={{ mb: 1.5, color: 'text.secondary' }}
          >
            Back to Plans
          </Button>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                bgcolor: plan.color,
                flexShrink: 0,
              }}
            />
            <Typography variant="h4" fontWeight={800}>
              {plan.name}
            </Typography>
            <Chip
              label={plan.active ? 'Active' : 'Inactive'}
              size="small"
              color={plan.active ? 'success' : 'error'}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {plan.hierarchyLabel} • Level {plan.level} • Owner: {plan.governanceOwner}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="flex-start">
          <Button
            component={RouterLink}
            href={paths.dashboard.accountingFinance.analyticAccounting.analyticAccounts}
            variant="outlined"
            startIcon={<Iconify icon="solar:list-bold" />}
          >
            All Accounts
          </Button>
          <Button
            component={RouterLink}
            href={paths.dashboard.accountingFinance.analyticAccounting.analyticItems}
            variant="contained"
            startIcon={<Iconify icon="solar:chart-square-bold" />}
          >
            Analytic Items
          </Button>
        </Stack>
      </Stack>

      {/* Metric cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard label="Accounts" value={accounts.length} helper={`${activeCount} active`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Total Balance"
            value={fmt(totalBalance)}
            helper="Sum across all analytic accounts"
            color={totalBalance < 0 ? '#b91c1c' : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Total Debit"
            value={fmt(totalDebit)}
            helper="Recognized debit postings"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Total Credit"
            value={fmt(totalCredit)}
            helper="Recognized credit postings"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Left: Accounts table + recent lines */}
        <Grid size={{ xs: 12, xl: 8 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ pb: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight={700}>
                  Analytic Accounts
                </Typography>
                <Button
                  component={RouterLink}
                  href={paths.dashboard.accountingFinance.analyticAccounting.analyticAccounts}
                  size="small"
                  variant="outlined"
                  endIcon={<Iconify icon="solar:arrow-right-bold" />}
                >
                  All Accounts
                </Button>
              </Stack>
            </CardContent>
            {accounts.length === 0 ? (
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  No analytic accounts are linked to this plan yet.
                </Typography>
              </CardContent>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Code</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Partner</TableCell>
                      <TableCell align="right">Debit</TableCell>
                      <TableCell align="right">Credit</TableCell>
                      <TableCell align="right">Balance</TableCell>
                      <TableCell>Distribution</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {accounts.map((acc) => (
                      <TableRow key={acc.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{acc.code}</TableCell>
                        <TableCell>{acc.name}</TableCell>
                        <TableCell>{acc.partner || '—'}</TableCell>
                        <TableCell align="right">{fmt(acc.debit)}</TableCell>
                        <TableCell align="right">{fmt(acc.credit)}</TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 700,
                            color: acc.balance < 0 ? 'error.main' : 'inherit',
                          }}
                        >
                          {fmt(acc.balance)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={formatStatus(acc.distributionMethod)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={acc.active ? 'Active' : 'Inactive'}
                            size="small"
                            color={acc.active ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>

          {recentLines.length > 0 && (
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ pb: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight={700}>
                    Recent Analytic Lines
                  </Typography>
                  <Button
                    component={RouterLink}
                    href={paths.dashboard.accountingFinance.analyticAccounting.analyticItems}
                    size="small"
                    variant="outlined"
                    endIcon={<Iconify icon="solar:arrow-right-bold" />}
                  >
                    View All
                  </Button>
                </Stack>
              </CardContent>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Account</TableCell>
                      <TableCell>Partner</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentLines.map((line) => (
                      <TableRow key={line.id} hover>
                        <TableCell>{line.date || '—'}</TableCell>
                        <TableCell>{line.name || '—'}</TableCell>
                        <TableCell>{line.accountName || '—'}</TableCell>
                        <TableCell>{line.partner || '—'}</TableCell>
                        <TableCell>{line.reference || '—'}</TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 700,
                            color: line.amount < 0 ? 'error.main' : 'inherit',
                          }}
                        >
                          {fmt(line.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
        </Grid>

        {/* Right: Plan config + governance */}
        <Grid size={{ xs: 12, xl: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Plan Configuration
                </Typography>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Hierarchy level
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {plan.level}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Hierarchy label
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {plan.hierarchyLabel}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Approval mode
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {plan.approvalMode}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {plan.createdAt || '—'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Last updated
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {plan.updatedAt || '—'}
                    </Typography>
                  </Stack>
                  <Divider />
                  {plan.description && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Description
                      </Typography>
                      <Typography variant="body2">{plan.description}</Typography>
                    </Box>
                  )}
                  {plan.defaultPolicy && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Default policy
                      </Typography>
                      <Typography variant="body2">{plan.defaultPolicy}</Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Mandatory Dimensions
                </Typography>
                {plan.mandatoryDimensions.length > 0 ? (
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    {plan.mandatoryDimensions.map((dim) => (
                      <Chip key={dim} label={dim} size="small" color="primary" variant="outlined" />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No mandatory dimensions — dimensions are optional for this plan.
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Applicability
                </Typography>
                {plan.applicability.length > 0 ? (
                  <Stack spacing={0.5}>
                    {plan.applicability.map((entry) => (
                      <Stack key={entry} direction="row" spacing={1} alignItems="center">
                        <Iconify icon="solar:check-circle-bold" width={16} color="success.main" />
                        <Typography variant="body2">{entry}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No applicability rules defined.
                  </Typography>
                )}
              </CardContent>
            </Card>

            {accounts.length > 0 && (
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Balance Distribution
                  </Typography>
                  <Stack spacing={1.5}>
                    {accounts.slice(0, 5).map((acc) => {
                      const pct =
                        totalDebit > 0 ? Math.min((acc.debit / totalDebit) * 100, 100) : 0;
                      return (
                        <Box key={acc.id}>
                          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                            <Typography variant="caption">
                              {acc.code} {acc.name}
                            </Typography>
                            <Typography variant="caption" fontWeight={700}>
                              {pct.toFixed(0)}%
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{ borderRadius: 1, height: 6 }}
                          />
                        </Box>
                      );
                    })}
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
