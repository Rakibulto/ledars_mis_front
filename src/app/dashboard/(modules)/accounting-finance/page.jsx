'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

const KPI_CARDS = [
  {
    label: 'Close readiness',
    value: '86%',
    helper: 'Year-end controls, opening balances, and lock posture in progress',
    icon: 'solar:checklist-minimalistic-bold-duotone',
  },
  {
    label: 'Reconciliation inbox',
    value: '14',
    helper: 'Banking and ledger exceptions waiting for finance review',
    icon: 'solar:inbox-archive-bold-duotone',
  },
  {
    label: 'Receivable risk',
    value: '8 overdue',
    helper: 'Collection follow-up cases with escalation or promise-to-pay exposure',
    icon: 'solar:danger-circle-bold-duotone',
  },
  {
    label: 'Payables due this week',
    value: '21 bills',
    helper: 'Supplier payment proposals awaiting prioritization and approval',
    icon: 'solar:card-transfer-bold-duotone',
  },
];

const WORKSPACES = [
  {
    title: 'Transactions',
    description:
      'Journal entries, invoices, bills, receipts, payments, deposits, and posting queues.',
    href: paths.dashboard.accountingFinance.transactions.root,
    icon: 'solar:document-text-bold-duotone',
  },
  {
    title: 'Receivables',
    description: 'Customer ledger, aging, follow-up, statements, and due invoice operations.',
    href: paths.dashboard.accountingFinance.receivables.root,
    icon: 'solar:wallet-bold-duotone',
  },
  {
    title: 'Payables',
    description:
      'Supplier ledger, payment schedule, aging, unpaid bills, and statement reconciliation.',
    href: paths.dashboard.accountingFinance.payables.root,
    icon: 'solar:bill-list-bold-duotone',
  },
  {
    title: 'Banking',
    description:
      'Bank accounts, statement import, reconciliation, check management, and transfers.',
    href: paths.dashboard.accountingFinance.banking.root,
    icon: 'solar:card-bold-duotone',
  },
  {
    title: 'Configuration',
    description:
      'Chart of accounts, journals, periods, taxes, currencies, and close-control setup.',
    href: paths.dashboard.accountingFinance.configuration.root,
    icon: 'solar:settings-bold-duotone',
  },
  {
    title: 'Settings',
    description:
      'Approval workflow, posting rules, integration rules, number series, and audit control.',
    href: paths.dashboard.accountingFinance.settings.root,
    icon: 'solar:shield-keyhole-bold-duotone',
  },
  {
    title: 'Reports',
    description:
      'Trial balance, financial statements, tax, asset, budget, and executive reporting.',
    href: paths.dashboard.accountingFinance.reports.root,
    icon: 'solar:chart-bold-duotone',
  },
  {
    title: 'Year End',
    description:
      'Closing validation, opening entries, period lock, audit trail, and reopen management.',
    href: paths.dashboard.accountingFinance.yearEnd.root,
    icon: 'solar:calendar-mark-bold-duotone',
  },
];

const QUICK_ACTIONS = [
  {
    label: 'Open accounting dashboard',
    href: paths.dashboard.accountingFinance.dashboard,
  },
  {
    label: 'Go to year-end close',
    href: paths.dashboard.accountingFinance.yearEnd.yearEndClosing,
  },
  {
    label: 'Review receivables aging',
    href: paths.dashboard.accountingFinance.receivables.agingReport,
  },
  {
    label: 'Review payables schedule',
    href: paths.dashboard.accountingFinance.payables.paymentSchedule,
  },
];

export default function Page() {
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
            Accounting Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Operational home for accounting control, transaction processing, close management,
            reporting, and configuration.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          {QUICK_ACTIONS.slice(0, 2).map((action) => (
            <Button
              key={action.label}
              component={RouterLink}
              href={action.href}
              variant="contained"
            >
              {action.label}
            </Button>
          ))}
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {KPI_CARDS.map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, xl: 3 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                      {item.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                      {item.helper}
                    </Typography>
                  </Box>
                  <Iconify icon={item.icon} width={28} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Grid container spacing={2}>
            {WORKSPACES.map((item) => (
              <Grid key={item.title} size={{ xs: 12, md: 6 }}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'grey.200',
                        width: 'fit-content',
                        mb: 2,
                      }}
                    >
                      <Iconify icon={item.icon} width={24} />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 2 }}>
                      {item.description}
                    </Typography>
                    <Button
                      component={RouterLink}
                      href={item.href}
                      variant="outlined"
                      fullWidth
                      color="inherit"
                    >
                      Open Workspace
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Finance Desk
                </Typography>
                <Stack spacing={1}>
                  {QUICK_ACTIONS.map((action) => (
                    <Button
                      key={action.label}
                      component={RouterLink}
                      href={action.href}
                      variant="outlined"
                      color="inherit"
                      fullWidth
                    >
                      {action.label}
                    </Button>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Priority Queue
                </Typography>
                <Stack spacing={1.5}>
                  {[
                    'Validate year-end close pack and retained earnings transfer.',
                    'Clear unreconciled bank items before next period lock.',
                    'Review overdue customer balances and follow-up actions.',
                    'Finalize supplier payment run and approval routing.',
                  ].map((item) => (
                    <Typography key={item} variant="body2" color="text.secondary">
                      {item}
                    </Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
