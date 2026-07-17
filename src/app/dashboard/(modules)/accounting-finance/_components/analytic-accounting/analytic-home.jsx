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
import { useAnalyticWorkspace } from './use-analytic-workspace';
import { AnalyticWorkspaceToolbar } from './analytic-workspace-toolbar';

const NAV_ITEMS = [
  {
    title: 'Analytic Accounts',
    description:
      'Manage governed analytic dimensions with partner, project, and cost-center distribution rules.',
    href: paths.dashboard.accountingFinance.analyticAccounting.analyticAccounts,
    icon: 'solar:database-bold-duotone',
  },
  {
    title: 'Analytic Plans',
    description:
      'Control hierarchy, plan applicability, and mandatory-dimension policies across posting sources.',
    href: paths.dashboard.accountingFinance.analyticAccounting.analyticPlans,
    icon: 'solar:settings-bold-duotone',
  },
  {
    title: 'Analytic Items',
    description:
      'Review journal-linked analytic move lines, distributions, and exception drill-downs.',
    href: paths.dashboard.accountingFinance.analyticAccounting.analyticItems,
    icon: 'solar:bill-list-bold-duotone',
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

export default function AnalyticHome() {
  useCurrency();
  const workspace = useAnalyticWorkspace();

  const criticalRules = workspace.rules.filter((rule) => rule.exceptionCount > 0);
  const topAccounts = useMemo(
    () =>
      [...workspace.accounts]
        .sort((left, right) => Math.abs(right.balance) - Math.abs(left.balance))
        .slice(0, 5),
    [workspace.accounts]
  );

  const sourceMix = useMemo(
    () =>
      ['journal', 'invoice', 'bill', 'budget'].map((source) => ({
        source,
        count: workspace.items.filter((item) => item.sourceType === source).length,
      })),
    [workspace.items]
  );

  const alerts = [];
  if (criticalRules.length) {
    alerts.push({
      id: 'analytic-exceptions',
      severity: 'warning',
      title: `${criticalRules.length} analytic plans have enforcement exceptions`,
      description:
        'Mandatory-dimension policies need follow-up before all analytic postings can be treated as fully validated.',
    });
  }
  if (workspace.items.some((item) => item.distributionStatus === 'draft')) {
    alerts.push({
      id: 'analytic-drafts',
      severity: 'info',
      title: 'Draft analytic distributions are still pending review',
      description:
        'Use analytic items to review journal-linked move lines and complete missing dimension allocation.',
    });
  }
  if (!alerts.length) {
    alerts.push({
      id: 'analytic-balanced',
      severity: 'success',
      title: 'Analytic governance is currently balanced',
      description:
        'Plans, accounts, and move lines are aligned without open policy exceptions in the current mock workspace.',
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
            Analytic Accounting Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Governance cockpit for analytic dimensions, journal-linked allocations, and mandatory
            policy enforcement.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            component={RouterLink}
            href={paths.dashboard.accountingFinance.analyticAccounting.analyticAccounts}
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
          >
            Open Accounts
          </Button>
          <Button
            component={RouterLink}
            href={paths.dashboard.accountingFinance.analyticAccounting.analyticItems}
            variant="contained"
            startIcon={<Iconify icon="solar:clipboard-list-bold" />}
          >
            Review Items
          </Button>
        </Stack>
      </Stack>

      <AnalyticWorkspaceToolbar
        printTitle="Analytic Accounting"
        printContent={
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                  Account
                </th>
                <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                  Plan
                </th>
                <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                  Balance
                </th>
                <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {topAccounts.map((account) => (
                <tr key={account.id}>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                    {account.code} • {account.name}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                    {account.planName}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                    {formatCurrency(account.balance)}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                    {account.entryStatus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      />

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
            label="Plans"
            value={workspace.overview.planCount}
            helper="Governed analytic dimensions currently active"
            icon="solar:layers-bold-duotone"
            color="#2563eb"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Analytic accounts"
            value={workspace.overview.accountCount}
            helper={`${workspace.overview.activeAccountCount} active accounts ready for posting`}
            icon="solar:database-bold-duotone"
            color="#7c3aed"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Analytic balance"
            value={formatCurrency(workspace.overview.totalBalance)}
            helper="Net balance across governed analytic dimensions"
            icon="solar:wallet-money-bold-duotone"
            color="#059669"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Exceptions"
            value={workspace.overview.exceptionCount}
            helper={`${workspace.overview.mandatoryRuleCount} mandatory rules currently enforced`}
            icon="solar:danger-triangle-bold-duotone"
            color="#d97706"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {NAV_ITEMS.map((item) => (
          <Grid key={item.title} size={{ xs: 12, md: 6, xl: 4 }}>
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
                Top Analytic Accounts
              </Typography>
              <Stack divider={<Divider flexItem />}>
                {topAccounts.map((account) => (
                  <Stack
                    key={account.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ py: 1.25 }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {account.code} • {account.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {account.planName} • {account.partnerDistribution[0]?.name || 'No partner'}{' '}
                        • {account.projectDistribution[0]?.name || 'No project'}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={workspace.formatAnalyticStatus(account.entryStatus)}
                        size="small"
                        color={account.entryStatus === 'validated' ? 'success' : 'warning'}
                      />
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(account.balance)}
                      </Typography>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Source Mix
              </Typography>
              <Stack spacing={1.25}>
                {sourceMix.map((entry) => (
                  <Stack key={entry.source} direction="row" justifyContent="space-between">
                    <Typography variant="body2">
                      {workspace.formatAnalyticStatus(entry.source)}
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {entry.count}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Governance Watchlist
              </Typography>
              <Stack spacing={1.25}>
                {workspace.rules.map((rule) => (
                  <Box key={rule.id}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" fontWeight={700}>
                        {rule.planName}
                      </Typography>
                      <Chip
                        label={`${rule.exceptionCount} exceptions`}
                        size="small"
                        color={rule.exceptionCount ? 'warning' : 'success'}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {rule.mandatoryDimensions.join(', ') || 'No mandatory dimensions'} •{' '}
                      {rule.appliesTo.join(', ')}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
