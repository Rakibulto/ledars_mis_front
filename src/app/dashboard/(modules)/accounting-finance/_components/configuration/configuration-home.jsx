'use client';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
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

import { usePolicyConfigWorkspace } from './use-policy-config-workspace';
import { usePlanningConfigWorkspace } from './use-planning-config-workspace';
import { useReferenceConfigWorkspace } from './use-reference-config-workspace';
import { useCoreLedgerConfigWorkspace } from './use-core-ledger-config-workspace';
import { useFoundationalConfigWorkspace } from './use-foundational-config-workspace';

const GROUPS = [
  {
    title: 'Core Ledger Setup',
    description:
      'Foundational accounting structure for accounts, types, journals, and fiscal calendars.',
    items: [
      {
        label: 'Chart of Accounts',
        href: paths.dashboard.accountingFinance.configuration.chartOfAccounts,
      },
      {
        label: 'Account Types',
        href: paths.dashboard.accountingFinance.configuration.accountTypes,
      },
      { label: 'Journals', href: paths.dashboard.accountingFinance.configuration.journals },
      { label: 'Fiscal Year', href: paths.dashboard.accountingFinance.configuration.fiscalYear },
      {
        label: 'Fiscal Periods',
        href: paths.dashboard.accountingFinance.configuration.fiscalPeriods,
      },
    ],
    icon: 'solar:document-text-bold-duotone',
  },
  {
    title: 'Commercial Rules',
    description: 'Tax, partner, payment, and trading rules that shape transaction behavior.',
    items: [
      {
        label: 'Payment Terms',
        href: paths.dashboard.accountingFinance.configuration.paymentTerms,
      },
      { label: 'Taxes', href: paths.dashboard.accountingFinance.configuration.taxes },
      {
        label: 'Fiscal Positions',
        href: paths.dashboard.accountingFinance.configuration.fiscalPositions,
      },
      {
        label: 'Payment Methods',
        href: paths.dashboard.accountingFinance.configuration.paymentMethods,
      },
      { label: 'Incoterms', href: paths.dashboard.accountingFinance.configuration.incoterms },
    ],
    icon: 'solar:card-send-bold-duotone',
  },
  {
    title: 'Treasury And Budget Controls',
    description:
      'Liquidity structures, reconciliation models, planning drivers, and period close controls.',
    items: [
      {
        label: 'Bank/Cash Accounts',
        href: paths.dashboard.accountingFinance.configuration.bankCashAccounts,
      },
      {
        label: 'Reconciliation Models',
        href: paths.dashboard.accountingFinance.configuration.reconciliationModels,
      },
      { label: 'Budget Setup', href: paths.dashboard.accountingFinance.configuration.budgetSetup },
      { label: 'Lock Dates', href: paths.dashboard.accountingFinance.configuration.lockDates },
    ],
    icon: 'solar:safe-square-bold-duotone',
  },
  {
    title: 'Reference Master Data',
    description: 'Shared dimensions used across planning, valuation, FX, and asset operations.',
    items: [
      { label: 'Currencies', href: paths.dashboard.accountingFinance.configuration.currencies },
      {
        label: 'Exchange Rates',
        href: paths.dashboard.accountingFinance.configuration.currencyExchangeRates,
      },
      { label: 'Cost Centers', href: paths.dashboard.accountingFinance.configuration.costCenters },
      {
        label: 'Asset Categories',
        href: paths.dashboard.accountingFinance.configuration.assetCategories,
      },
    ],
    icon: 'solar:settings-bold-duotone',
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

export default function ConfigurationHome() {
  const planningWorkspace = usePlanningConfigWorkspace();
  const coreLedgerWorkspace = useCoreLedgerConfigWorkspace();
  const foundationalWorkspace = useFoundationalConfigWorkspace();
  const referenceWorkspace = useReferenceConfigWorkspace();
  const policyWorkspace = usePolicyConfigWorkspace();

  const { accounts } = planningWorkspace;
  const { journals } = coreLedgerWorkspace;
  const { reconciliationModels } = referenceWorkspace;
  const { taxes } = foundationalWorkspace;
  const { currencies } = referenceWorkspace;
  const { lockDates } = policyWorkspace;

  const activeAccounts = accounts.filter((account) => account.active);
  const inactiveAccounts = accounts.filter((account) => !account.active || account.archived);
  const activeModels = reconciliationModels.filter((model) => model.active !== false);
  const activeTaxes = taxes.filter((tax) => tax.active !== false);

  const journalMix = useMemo(() => {
    const counts = journals.reduce((accumulator, journal) => {
      const key = journal.type || 'general';
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(counts)
      .map(([type, count]) => ({ type, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 5);
  }, [journals]);

  const alerts = [];
  if (inactiveAccounts.length) {
    alerts.push({
      id: 'inactive-accounts',
      severity: 'warning',
      title: `${inactiveAccounts.length} accounts need lifecycle review`,
      description:
        'Review whether inactive accounts should remain blocked, be archived, or be reassigned to a parent hierarchy band.',
    });
  }
  if (!activeModels.length) {
    alerts.push({
      id: 'no-reconciliation-models',
      severity: 'error',
      title: 'No active reconciliation models detected',
      description:
        'Bank matching and auto-writeoff controls will remain manual until reconciliation models are enabled.',
    });
  }
  if (!lockDates.length) {
    alerts.push({
      id: 'no-lock-dates',
      severity: 'info',
      title: 'No lock dates configured',
      description: 'Period-close governance is weaker without lock-date controls on prior periods.',
    });
  }
  if (planningWorkspace.overview.criticalCostCenters) {
    alerts.push({
      id: 'critical-cost-centers',
      severity: 'warning',
      title: `${planningWorkspace.overview.criticalCostCenters} cost centers exceed the control threshold`,
      description:
        'Budget transfer policy and reforecast cadence should be reviewed before further commitments are approved.',
    });
  }
  if (!alerts.length) {
    alerts.push({
      id: 'config-steady',
      severity: 'success',
      title: 'Configuration controls look stable',
      description:
        'Ledger structure, rules, and reference data have enough seeded coverage for demo operations.',
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
            Configuration Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Accounting setup cockpit for ledger structure, commercial rules, treasury controls, and
            shared master data.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            component={RouterLink}
            href={paths.dashboard.accountingFinance.configuration.chartOfAccounts}
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:document-text-bold" />}
          >
            Open Ledger Setup
          </Button>
          <Button
            component={RouterLink}
            href={paths.dashboard.accountingFinance.configuration.reconciliationModels}
            variant="contained"
            startIcon={<Iconify icon="solar:check-circle-bold" />}
          >
            Review Controls
          </Button>
        </Stack>
      </Stack>

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
            label="Active accounts"
            value={activeAccounts.length}
            helper={`${inactiveAccounts.length} inactive in chart of accounts`}
            icon="solar:document-text-bold-duotone"
            color="#2563eb"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Journals"
            value={journals.length}
            helper={`${coreLedgerWorkspace.overview.sequencedJournals} sequenced with routing policy`}
            icon="solar:book-bookmark-bold-duotone"
            color="#059669"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Reconciliation models"
            value={activeModels.length}
            helper="Auto-match and writeoff logic currently enabled"
            icon="solar:safe-square-bold-duotone"
            color="#d97706"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Reference masters"
            value={`${activeTaxes.length}/${currencies.length}`}
            helper={`${policyWorkspace.overview.lockDateCount} lock controls and ${planningWorkspace.overview.linkedBudgetCenters} linked budget centers`}
            icon="solar:settings-bold-duotone"
            color="#7c3aed"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {GROUPS.map((group) => (
          <Grid key={group.title} size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.200' }}>
                    <Iconify icon={group.icon} width={24} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      {group.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {group.description}
                    </Typography>
                  </Box>
                </Stack>
                <Stack spacing={1.25}>
                  {group.items.map((item) => (
                    <Button
                      key={item.href}
                      component={RouterLink}
                      href={item.href}
                      variant="outlined"
                      color="inherit"
                      fullWidth
                      sx={{ justifyContent: 'space-between' }}
                      endIcon={<Iconify icon="solar:alt-arrow-right-linear" />}
                    >
                      {item.label}
                    </Button>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Journal Mix
              </Typography>
              <Stack divider={<Divider flexItem />}>
                {journalMix.map((item) => (
                  <Stack
                    key={item.type}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ py: 1.25 }}
                  >
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {item.type}
                    </Typography>
                    <Chip label={`${item.count} journals`} size="small" variant="outlined" />
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Control Snapshot
              </Typography>
              <Stack spacing={1.25}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Taxes configured</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {taxes.length}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Currencies configured</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {currencies.length}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Active reconciliation models</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {activeModels.length}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Lock date records</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {lockDates.length}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Budget approval policy</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {planningWorkspace.budgetPolicy.approvalPolicy}
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
