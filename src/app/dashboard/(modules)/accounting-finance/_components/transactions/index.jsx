'use client';

import Link from 'next/link';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import AlertTitle from '@mui/material/AlertTitle';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import {
  sumLines,
  MOCK_INVOICES,
  MOCK_VENDOR_BILLS,
  MOCK_JOURNAL_ENTRIES,
  MOCK_TRANSACTION_ALERTS,
} from './mock-data';

const WORKSPACE_LINKS = [
  {
    title: 'Journal entries',
    subtitle: 'Draft, approve, and post accounting moves.',
    icon: 'solar:document-text-bold-duotone',
    color: '#2563eb',
    route: paths.dashboard.accountingFinance.transactions.journalEntries,
  },
  {
    title: 'Customer invoices',
    subtitle: 'Recurring invoices, collection workflow, and send queue.',
    icon: 'solar:bill-list-bold-duotone',
    color: '#16a34a',
    route: paths.dashboard.accountingFinance.transactions.customerInvoices,
  },
  {
    title: 'Vendor bills',
    subtitle: 'Validation, three-way match, and payment handoff.',
    icon: 'solar:clipboard-check-bold-duotone',
    color: '#8b5cf6',
    route: paths.dashboard.accountingFinance.transactions.vendorBills,
  },
  {
    title: 'Customer receipts',
    subtitle: 'Allocate payments, overpayments, and write-offs.',
    icon: 'solar:card-recive-bold-duotone',
    color: '#f59e0b',
    route: paths.dashboard.accountingFinance.transactions.customerReceipts,
  },
  {
    title: 'Supplier payments',
    subtitle: 'Prepare payment runs and release files to bank.',
    icon: 'solar:card-send-bold-duotone',
    color: '#dc2626',
    route: paths.dashboard.accountingFinance.transactions.supplierPayments,
  },
  {
    title: 'Vouchers and adjustments',
    subtitle: 'Manual vouchers, deferred items, notes, and settlements.',
    icon: 'solar:notes-bold-duotone',
    color: '#0891b2',
    route: paths.dashboard.accountingFinance.transactions.vouchers,
  },
];

export default function TransactionsWorkspace() {
  const draftJournals = MOCK_JOURNAL_ENTRIES.filter((entry) => entry.status === 'draft').length;
  const pendingApprovals = MOCK_JOURNAL_ENTRIES.filter(
    (entry) => entry.approvalState !== 'approved'
  ).length;
  const overdueInvoices = MOCK_INVOICES.filter((invoice) => invoice.status === 'overdue').length;
  const blockedBills = MOCK_VENDOR_BILLS.filter((bill) => bill.disputeFlag).length;
  const unpostedValue = MOCK_JOURNAL_ENTRIES.filter((entry) => entry.status !== 'posted').reduce(
    (sum, entry) => sum + sumLines(entry.lines, 'debit'),
    0
  );

  const queue = [
    {
      title: 'Draft journals awaiting review',
      count: draftJournals,
      label: 'Review drafts',
      route: paths.dashboard.accountingFinance.transactions.journalEntries,
      color: 'warning',
    },
    {
      title: 'Pending transaction approvals',
      count: pendingApprovals,
      label: 'Open approvals',
      route: paths.dashboard.accountingFinance.transactions.journalEntries,
      color: 'info',
    },
    {
      title: 'Overdue customer invoices',
      count: overdueInvoices,
      label: 'Start follow-up',
      route: paths.dashboard.accountingFinance.transactions.customerInvoices,
      color: 'error',
    },
    {
      title: 'Blocked or disputed vendor bills',
      count: blockedBills,
      label: 'Resolve disputes',
      route: paths.dashboard.accountingFinance.transactions.vendorBills,
      color: 'error',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Transactions Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Mock-driven accounting transaction center for journals, invoices, bills, receipts, and
            settlements.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
          <Button
            component={Link}
            href={paths.dashboard.accountingFinance.transactions.journalEntries}
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
          >
            New journal
          </Button>
          <Button
            component={Link}
            href={paths.dashboard.accountingFinance.transactions.customerInvoices}
            variant="outlined"
            startIcon={<Iconify icon="solar:bill-list-bold" />}
          >
            Invoice queue
          </Button>
        </Stack>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        <AlertTitle>Mock transaction dataset active</AlertTitle>
        Transactions now run from a shared mock workflow dataset so each page can be upgraded
        without backend dependency gaps.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: 'Draft or pending journals',
            value: draftJournals + pendingApprovals,
            icon: 'solar:document-add-bold-duotone',
            color: '#2563eb',
          },
          {
            label: 'Overdue receivables',
            value: overdueInvoices,
            icon: 'solar:card-recive-bold-duotone',
            color: '#dc2626',
          },
          {
            label: 'Blocked bills',
            value: blockedBills,
            icon: 'solar:danger-circle-bold-duotone',
            color: '#f59e0b',
          },
          {
            label: 'Unposted value',
            value: formatCurrency(unpostedValue),
            icon: 'solar:wallet-money-bold-duotone',
            color: '#16a34a',
          },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {card.label}
                    </Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha(card.color, 0.12), color: card.color }}>
                    <Iconify icon={card.icon} width={22} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Execution Queue
              </Typography>
              <Stack spacing={1.5}>
                {queue.map((item) => (
                  <Box
                    key={item.title}
                    sx={{ p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0' }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      spacing={1.5}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {item.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.count} items currently in queue.
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label={`${item.count} open`} size="small" color={item.color} />
                        <Button component={Link} href={item.route} size="small" variant="contained">
                          {item.label}
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Control Warnings
              </Typography>
              <Stack spacing={1.25}>
                {MOCK_TRANSACTION_ALERTS.map((item) => (
                  <Alert key={item.id} severity={item.severity} variant="outlined">
                    <AlertTitle>{item.title}</AlertTitle>
                    {item.detail}
                  </Alert>
                ))}
              </Stack>
              <Box sx={{ mt: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Posting readiness
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={62}
                  sx={{ mt: 0.75, height: 8, borderRadius: 4 }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.75, display: 'block' }}
                >
                  62% of current transaction queue is ready for post or payment release.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {WORKSPACE_LINKS.map((item) => (
          <Grid key={item.title} size={{ xs: 12, md: 6, xl: 4 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: alpha(item.color, 0.12), color: item.color }}>
                    <Iconify icon={item.icon} width={22} />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.subtitle}
                    </Typography>
                  </Box>
                </Stack>
                <Button
                  component={Link}
                  href={item.route}
                  size="small"
                  endIcon={<Iconify icon="solar:arrow-right-up-linear" />}
                >
                  Open workspace
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
