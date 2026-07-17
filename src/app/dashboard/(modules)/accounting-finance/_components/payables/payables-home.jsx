'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

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
import { usePayablesWorkspace } from './use-payables-workspace';
import {
  exportPayablesCsv,
  printPayablesPack,
  exportPayablesJson,
  exportPayablesExcel,
} from './payables-export';

const NAV_ITEMS = [
  {
    title: 'Supplier Ledger',
    description: 'Supplier liability exposure, hold posture, and owner accountability.',
    href: paths.dashboard.accountingFinance.payables.supplierLedger,
    icon: 'solar:users-group-two-rounded-bold-duotone',
  },
  {
    title: 'Aging Report',
    description: 'Liability bucket exposure, hold analysis, and escalation tracking.',
    href: paths.dashboard.accountingFinance.payables.agingReport,
    icon: 'solar:chart-square-bold-duotone',
  },
  {
    title: 'Unpaid Bills',
    description: 'Operational bill queue with approvals, holds, and payment batch prep.',
    href: paths.dashboard.accountingFinance.payables.unpaidBills,
    icon: 'solar:bill-list-bold-duotone',
  },
  {
    title: 'Payment Schedule',
    description: 'Treasury calendar, prompt-pay opportunities, and reschedule actions.',
    href: paths.dashboard.accountingFinance.payables.paymentSchedule,
    icon: 'solar:calendar-bold-duotone',
  },
  {
    title: 'Supplier Statements',
    description: 'Statement release pipeline with reconciliation notes and detail packs.',
    href: paths.dashboard.accountingFinance.payables.supplierStatements,
    icon: 'solar:file-text-bold-duotone',
  },
];

export default function PayablesHome() {
  const [pendingAction, setPendingAction] = useState(null);
  const { overview, alerts, supplierLedgerRows, paymentSchedule } = usePayablesWorkspace();
  const suppliers = useMemo(
    () =>
      [...supplierLedgerRows]
        .sort((left, right) => right.outstanding - left.outstanding)
        .slice(0, 4),
    [supplierLedgerRows]
  );
  const schedule = useMemo(() => paymentSchedule.slice(0, 5), [paymentSchedule]);

  const exportConfig = {
    title: 'Payables Workspace',
    subtitle: 'Payables command center snapshot',
    alerts,
    summary: [
      { label: 'Outstanding payables', value: formatCurrency(overview.outstanding) },
      { label: 'Overdue liabilities', value: formatCurrency(overview.overdue) },
      { label: 'Approvals waiting', value: overview.approvalsWaiting },
      { label: 'Hold flags', value: overview.holds },
    ],
    tables: [
      {
        title: 'Top Supplier Exposure',
        columns: [
          { key: 'name', label: 'Supplier' },
          { key: 'owner', label: 'Owner' },
          { key: 'outstanding', label: 'Outstanding' },
          { key: 'overdueBills', label: 'Overdue Bills' },
        ],
        rows: suppliers.map((supplier) => ({
          name: supplier.name,
          owner: supplier.owner,
          outstanding: formatCurrency(supplier.outstanding),
          overdueBills: supplier.overdueBills,
        })),
      },
      {
        title: 'Immediate Payment Queue',
        columns: [
          { key: 'number', label: 'Bill' },
          { key: 'supplier', label: 'Supplier' },
          { key: 'stage', label: 'Stage' },
          { key: 'balance', label: 'Balance' },
        ],
        rows: schedule.map((bill) => ({
          number: bill.number,
          supplier: bill.supplier?.name,
          stage: bill.paymentStage,
          balance: formatCurrency(bill.balanceDue),
        })),
      },
    ],
    payload: { overview, suppliers, schedule },
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
            Payables Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mock-driven payables command center with aging, approvals, treasury scheduling, and
            supplier statement control.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:download-minimalistic-bold" />}
            onClick={() =>
              runAction(
                'Export Payables Excel',
                () => exportPayablesExcel('payables-workspace', exportConfig),
                'Payables workbook exported'
              )
            }
            disabled={pendingAction !== null}
          >
            Export Queue
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:card-send-bold" />}
            onClick={() =>
              runAction(
                'Open Payment Pack',
                () => printPayablesPack(exportConfig),
                'Payment pack opened'
              )
            }
            disabled={pendingAction !== null}
          >
            Launch Payment Run
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: 'Outstanding payables',
            value: formatCurrency(overview.outstanding),
            icon: 'solar:wallet-money-bold-duotone',
          },
          {
            label: 'Overdue liabilities',
            value: formatCurrency(overview.overdue),
            icon: 'solar:danger-triangle-bold-duotone',
          },
          {
            label: 'Approvals waiting',
            value: overview.approvalsWaiting,
            icon: 'solar:checklist-minimalistic-bold-duotone',
          },
          { label: 'Hold flags', value: overview.holds, icon: 'solar:shield-warning-bold-duotone' },
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
              'Export Payables CSV',
              () => exportPayablesCsv('payables-workspace', exportConfig),
              'Payables CSV exported'
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
              'Export Payables JSON',
              () => exportPayablesJson('payables-workspace', exportConfig),
              'Payables JSON exported'
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
                Top Supplier Exposure
              </Typography>
              <Stack divider={<Divider flexItem />}>
                {suppliers.map((supplier) => (
                  <Stack
                    key={supplier.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ py: 1.25 }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {supplier.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {supplier.owner} • {supplier.overdueBills} overdue • {supplier.holdFlags}{' '}
                        hold flags
                      </Typography>
                    </Box>
                    <Button
                      component={RouterLink}
                      href={paths.dashboard.accountingFinance.payables.supplierLedgerDetail(
                        supplier.id
                      )}
                      variant="outlined"
                      color="inherit"
                    >
                      {formatCurrency(supplier.outstanding)}
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
                Immediate Payment Queue
              </Typography>
              <Stack divider={<Divider flexItem />}>
                {schedule.map((bill) => (
                  <Stack
                    key={bill.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ py: 1.25 }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {bill.number} • {bill.supplier?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {bill.paymentStage} • due {bill.dueDate} • {bill.priority}
                      </Typography>
                    </Box>
                    <Button
                      component={RouterLink}
                      href={paths.dashboard.accountingFinance.payables.paymentScheduleDetail(
                        bill.id
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
