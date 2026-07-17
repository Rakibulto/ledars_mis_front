'use client';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useCurrency } from '../currency-context';
import { useBudgetsWorkspace } from './use-budgets-workspace';
import { BudgetsWorkspaceToolbar } from './budgets-workspace-toolbar';

const NAV_ITEMS = [
  {
    title: 'Budget Plans',
    description: 'Portfolio-level budgets by department and fiscal year with utilization control.',
    href: paths.dashboard.accountingFinance.budgets.plans,
    icon: 'solar:wallet-money-bold-duotone',
  },
  {
    title: 'Budget Lines',
    description: 'Line-by-line account allocation, planned versus actual, and variance watch.',
    href: paths.dashboard.accountingFinance.budgets.lines,
    icon: 'solar:list-check-bold-duotone',
  },
  {
    title: 'Budget vs Actual',
    description: 'Variance analysis by budget with overrun and utilization visibility.',
    href: paths.dashboard.accountingFinance.budgets.vsActual,
    icon: 'solar:chart-square-bold-duotone',
  },
  {
    title: 'Tracking',
    description: 'Department and project budget consumption with health indicators.',
    href: paths.dashboard.accountingFinance.budgets.tracking,
    icon: 'solar:radar-2-bold-duotone',
  },
];

function SummaryCard({ label, value, helper, icon, color }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              {helper}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}15`, color, width: 48, height: 48 }}>
            <Iconify icon={icon} width={24} />
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function BudgetsHome() {
  useCurrency();
  const workspace = useBudgetsWorkspace();

  const { budgets } = workspace;
  const { totalBudget } = workspace.overview;
  const totalSpent = workspace.overview.totalActual;
  const remainingBudget = workspace.overview.totalAvailable;
  const utilization =
    totalBudget > 0
      ? ((totalSpent + workspace.overview.totalCommitments + workspace.overview.totalEncumbrance) /
          totalBudget) *
        100
      : 0;

  const overBudgetPlans = budgets.filter((budget) => budget.thresholdStatus === 'critical');
  const cautionPlans = budgets.filter((budget) => budget.thresholdStatus === 'warning');

  const priorityBudgets = useMemo(
    () =>
      [...budgets]
        .sort((left, right) => {
          const leftRatio = Number(left.totalAmount || 0)
            ? (Number(left.spentAmount || 0) +
                Number(left.commitments || 0) +
                Number(left.encumbrance || 0)) /
              Number(left.totalAmount || 1)
            : 0;
          const rightRatio = Number(right.totalAmount || 0)
            ? (Number(right.spentAmount || 0) +
                Number(right.commitments || 0) +
                Number(right.encumbrance || 0)) /
              Number(right.totalAmount || 1)
            : 0;
          return rightRatio - leftRatio;
        })
        .slice(0, 5),
    [budgets]
  );

  const costCenterTracking = useMemo(
    () =>
      workspace.trackingRows
        .map((row) => ({
          id: row.id,
          name: row.costCenterName,
          type: row.department,
          amount: row.totalAmount,
          spent: row.totalActual + row.commitments + row.encumbrance,
        }))
        .sort((left, right) => right.spent / right.amount - left.spent / left.amount)
        .slice(0, 5),
    [workspace.trackingRows]
  );

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Plan</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Department
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Fiscal Year
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Total</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Spent</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Available
          </th>
        </tr>
      </thead>
      <tbody>
        {budgets.map((b) => (
          <tr key={b.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{b.name}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{b.department}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{b.fiscalYear}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{b.totalAmount}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{b.spentAmount}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{b.available}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const alerts = [];
  if (overBudgetPlans.length) {
    alerts.push({
      id: 'budget-overrun',
      severity: 'error',
      title: `${overBudgetPlans.length} budgets are overrun`,
      description:
        'Immediate variance review is needed for plans already spending beyond approved limits.',
    });
  }
  if (cautionPlans.length) {
    alerts.push({
      id: 'budget-caution',
      severity: 'warning',
      title: `${cautionPlans.length} budgets are above 80% utilization`,
      description:
        'These plans should be monitored for reforecasting, control escalation, or consumption throttling.',
    });
  }
  if (!alerts.length) {
    alerts.push({
      id: 'budget-steady',
      severity: 'success',
      title: 'Budget portfolio is within current thresholds',
      description:
        'No overrun or late-stage utilization hotspots were detected in the current mock workspace.',
    });
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
          <Typography variant="h4" fontWeight={800}>
            Budgets Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Budget planning and control cockpit for plan setup, line allocation, variance review,
            and department tracking.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            component={RouterLink}
            href={paths.dashboard.accountingFinance.budgets.plans}
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
          >
            Open Plans
          </Button>
          <Button
            component={RouterLink}
            href={paths.dashboard.accountingFinance.budgets.vsActual}
            variant="contained"
            startIcon={<Iconify icon="solar:chart-square-bold" />}
          >
            Review Variance
          </Button>
        </Stack>
      </Stack>

      <BudgetsWorkspaceToolbar printTitle="Budgets Workspace" printContent={printContent} />

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {alerts.map((alert) => (
          <Alert key={alert.id} severity={alert.severity} sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {alert.title}
            </Typography>
            {alert.description}
          </Alert>
        ))}
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Approved budget"
            value={formatCurrency(totalBudget)}
            helper="Total approved spending envelope across all plans"
            icon="solar:wallet-money-bold-duotone"
            color="#2563eb"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Actual spend"
            value={formatCurrency(totalSpent)}
            helper="Current realized consumption against budget portfolio"
            icon="solar:card-send-bold-duotone"
            color="#d97706"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Remaining"
            value={formatCurrency(remainingBudget)}
            helper="Budget still available for the tracked plans"
            icon="solar:safe-circle-bold-duotone"
            color="#059669"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Utilization"
            value={`${utilization.toFixed(1)}%`}
            helper={`${overBudgetPlans.length} overrun • ${cautionPlans.length} caution plans`}
            icon="solar:pie-chart-2-bold-duotone"
            color="#7c3aed"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {NAV_ITEMS.map((item) => (
          <Grid key={item.title} size={{ xs: 12, md: 6, xl: 3 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Box
                  sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.200', width: 'fit-content', mb: 2 }}
                >
                  <Iconify icon={item.icon} width={24} />
                </Box>
                <Typography variant="h6" fontWeight={700}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 2 }}>
                  {item.description}
                </Typography>
                <Button component={RouterLink} href={item.href} variant="contained" fullWidth>
                  Open Page
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Priority Budget Plans
              </Typography>
              <Stack divider={<Divider flexItem />}>
                {priorityBudgets.map((budget) => {
                  const ratio = budget.totalAmount
                    ? ((budget.spentAmount + budget.commitments + budget.encumbrance) /
                        budget.totalAmount) *
                      100
                    : 0;
                  return (
                    <Stack
                      key={budget.id}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ py: 1.25 }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {budget.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {budget.department} • {budget.fiscalYear} • {ratio.toFixed(1)}% used
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={ratio > 100 ? 'Overrun' : ratio > 80 ? 'Caution' : 'On Track'}
                          size="small"
                          color={ratio > 100 ? 'error' : ratio > 80 ? 'warning' : 'success'}
                        />
                        <Button
                          component={RouterLink}
                          href={paths.dashboard.accountingFinance.budgets.vsActual}
                          variant="outlined"
                          color="inherit"
                        >
                          {formatCurrency(budget.available)}
                        </Button>
                      </Stack>
                    </Stack>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Cost Center Pressure
              </Typography>
              <Stack spacing={1.25}>
                {costCenterTracking.map((item) => {
                  const ratio = item.amount > 0 ? (item.spent / item.amount) * 100 : 0;
                  return (
                    <Stack
                      key={item.id}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box>
                        <Typography variant="body2">{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.type}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${ratio.toFixed(0)}%`}
                        size="small"
                        color={ratio > 90 ? 'error' : ratio > 70 ? 'warning' : 'success'}
                      />
                    </Stack>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Portfolio Snapshot
              </Typography>
              <Stack spacing={1.25}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Configured plans</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {budgets.length}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Overrun plans</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {overBudgetPlans.length}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Caution plans</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {cautionPlans.length}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Tracked cost centers</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {costCenterTracking.length}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
