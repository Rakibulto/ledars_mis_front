'use client';

import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useReceivablesWorkspace } from './use-receivables-workspace';
import {
  exportReceivablesCsv,
  printReceivablesPack,
  exportReceivablesJson,
  exportReceivablesExcel,
} from './receivables-export';

const NAV_ITEMS = [
  {
    title: 'Customer Ledger',
    description: 'Customer balances, dispute posture, and ledger drill-down.',
    href: paths.dashboard.accountingFinance.receivables.customerLedger,
    icon: 'solar:user-id-bold-duotone',
  },
  {
    title: 'Aging Report',
    description: 'Bucket exposure, approval queue, and batch follow-up actions.',
    href: paths.dashboard.accountingFinance.receivables.agingReport,
    icon: 'solar:chart-square-bold-duotone',
  },
  {
    title: 'Collection Follow-Up',
    description: 'Promise-to-pay tracking, reminders, and escalation workflow.',
    href: paths.dashboard.accountingFinance.receivables.collectionFollowUp,
    icon: 'solar:mailbox-bold-duotone',
  },
  {
    title: 'Due Invoices',
    description: 'Priority due items, payment plans, and reminder automation.',
    href: paths.dashboard.accountingFinance.receivables.dueInvoices,
    icon: 'solar:bill-list-bold-duotone',
  },
  {
    title: 'Customer Statements',
    description: 'Statement periods, send pipeline, and dispute-aware customer packs.',
    href: paths.dashboard.accountingFinance.receivables.customerStatements,
    icon: 'solar:file-text-bold-duotone',
  },
];

export default function ReceivablesHome() {
  const [pendingAction, setPendingAction] = useState(null);
  const { alerts, collectionQueue, customerLedgerRows, overview } = useReceivablesWorkspace();
  const customers = customerLedgerRows
    .sort((left, right) => right.outstanding - left.outstanding)
    .slice(0, 4);
  const followUps = collectionQueue.slice(0, 5);

  const exportConfig = {
    title: 'Receivables Workspace',
    subtitle: 'Receivables command center snapshot',
    alerts,
    summary: [
      { label: 'Outstanding', value: formatCurrency(overview.outstanding) },
      { label: 'Overdue', value: formatCurrency(overview.overdue) },
      { label: 'Disputed', value: formatCurrency(overview.disputed) },
      { label: 'Approvals waiting', value: overview.approvalsWaiting },
    ],
    tables: [
      {
        title: 'Top Exposure Accounts',
        columns: [
          { key: 'name', label: 'Customer' },
          { key: 'collector', label: 'Collector' },
          { key: 'outstanding', label: 'Outstanding' },
          { key: 'overdueInvoices', label: 'Overdue' },
        ],
        rows: customers.map((customer) => ({
          name: customer.name,
          collector: customer.collector,
          outstanding: formatCurrency(customer.outstanding),
          overdueInvoices: customer.overdueInvoices,
        })),
      },
      {
        title: 'Immediate Follow-Up Queue',
        columns: [
          { key: 'number', label: 'Invoice' },
          { key: 'customer', label: 'Customer' },
          { key: 'stage', label: 'Stage' },
          { key: 'balance', label: 'Balance' },
        ],
        rows: followUps.map((invoice) => ({
          number: invoice.number,
          customer: invoice.customer?.name,
          stage: invoice.followUpStage,
          balance: formatCurrency(invoice.balanceDue),
        })),
      },
    ],
    payload: { overview, customers, followUps },
  };

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
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Receivables Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mock-driven receivables command center with collections, aging, approvals, and customer
            statement control.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:download-minimalistic-bold" />}
            onClick={() =>
              runAction(
                'Export Excel',
                () => exportReceivablesExcel('receivables-workspace', exportConfig),
                'Receivables workbook exported'
              )
            }
            disabled={pendingAction !== null}
          >
            Export Queue
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:letter-bold" />}
            onClick={() =>
              runAction(
                'Launch Follow-Up Batch',
                () => printReceivablesPack(exportConfig),
                'Receivables follow-up pack opened'
              )
            }
            disabled={pendingAction !== null}
          >
            Launch Follow-Up Batch
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: 'Outstanding receivables',
            value: formatCurrency(overview.outstanding),
            icon: 'solar:wallet-money-bold-duotone',
          },
          {
            label: 'Overdue exposure',
            value: formatCurrency(overview.overdue),
            icon: 'solar:danger-triangle-bold-duotone',
          },
          {
            label: 'Disputed balance',
            value: formatCurrency(overview.disputed),
            icon: 'solar:shield-warning-bold-duotone',
          },
          {
            label: 'Approvals waiting',
            value: overview.approvalsWaiting,
            icon: 'solar:checklist-minimalistic-bold-duotone',
          },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, xl: 3 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                      {item.value}
                    </Typography>
                  </Box>
                  <Iconify icon={item.icon} width={28} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          onClick={() =>
            runAction(
              'Export CSV',
              () => exportReceivablesCsv('receivables-workspace', exportConfig),
              'Receivables CSV exported'
            )
          }
          disabled={pendingAction !== null}
        >
          Export CSV
        </Button>
        <Button
          variant="outlined"
          onClick={() =>
            runAction(
              'Export JSON',
              () => exportReceivablesJson('receivables-workspace', exportConfig),
              'Receivables JSON exported'
            )
          }
          disabled={pendingAction !== null}
        >
          Export JSON
        </Button>
      </Stack>

      <Stack spacing={2} sx={{ mb: 3 }}>
        {alerts.map((alert) => (
          <Alert key={alert.id} severity={alert.severity} sx={{ borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={700}>
              {alert.title}
            </Typography>
            <Typography variant="caption">{alert.description}</Typography>
          </Alert>
        ))}
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {NAV_ITEMS.map((item) => (
          <Grid key={item.title} size={{ xs: 12, md: 6, xl: 4 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.200' }}>
                    <Iconify icon={item.icon} width={24} />
                  </Box>
                </Stack>
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
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Top Exposure Accounts
              </Typography>
              <Stack divider={<Divider flexItem />}>
                {customers.map((customer) => (
                  <Stack
                    key={customer.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ py: 1.25 }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {customer.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {customer.collector} • {customer.overdueInvoices} overdue •{' '}
                        {customer.disputeFlags} disputes
                      </Typography>
                    </Box>
                    <Button
                      component={RouterLink}
                      href={paths.dashboard.accountingFinance.receivables.customerLedgerDetail(
                        customer.id
                      )}
                      variant="outlined"
                      color="inherit"
                    >
                      {formatCurrency(customer.outstanding)}
                    </Button>
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
                Immediate Follow-Up Queue
              </Typography>
              <Stack divider={<Divider flexItem />}>
                {followUps.map((invoice) => (
                  <Stack
                    key={invoice.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ py: 1.25 }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {invoice.number} • {invoice.customer?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {invoice.followUpStage} • {invoice.overdueDays} overdue days •{' '}
                        {invoice.reminderTemplate}
                      </Typography>
                    </Box>
                    <Button
                      component={RouterLink}
                      href={paths.dashboard.accountingFinance.receivables.collectionFollowUpDetail(
                        invoice.id
                      )}
                      variant="outlined"
                      color="inherit"
                    >
                      View
                    </Button>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
