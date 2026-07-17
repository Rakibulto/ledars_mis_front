'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useRouteFilters } from './use-route-filters';
import { useReceivablesWorkspace } from './use-receivables-workspace';
import { useReceivablesApiActions } from './use-receivables-api-actions';
import { exportReceivablesCsv, exportReceivablesExcel } from './receivables-export';

const PRIORITY_COLORS = {
  routine: 'info',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

export default function DueInvoices() {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [planDraft, setPlanDraft] = useState({ installments: 3, startDate: '2026-04-10' });
  const [pendingAction, setPendingAction] = useState(null);
  const { hasLiveInvoices, sendMockInvoices } = useReceivablesApiActions();
  const { filters, updateFilter, buildHref } = useRouteFilters([
    {
      key: 'priority',
      defaultValue: 'all',
      allowedValues: ['all', 'routine', 'medium', 'high', 'critical'],
    },
    {
      key: 'sort',
      defaultValue: 'overdue',
      allowedValues: ['overdue', 'balance', 'customer'],
    },
  ]);
  const { dueInvoices, actions } = useReceivablesWorkspace();

  const rows = useMemo(() => {
    const filtered = dueInvoices.filter((invoice) =>
      filters.priority === 'all' ? true : invoice.priority === filters.priority
    );

    return [...filtered].sort((left, right) => {
      if (filters.sort === 'balance') return right.balanceDue - left.balanceDue;
      if (filters.sort === 'customer')
        return left.customer?.name.localeCompare(right.customer?.name);
      return right.overdueDays - left.overdueDays;
    });
  }, [dueInvoices, filters.priority, filters.sort]);

  const totalDue = rows.reduce((sum, invoice) => sum + invoice.balanceDue, 0);
  const exportConfig = {
    title: 'Due Invoices Register',
    subtitle: 'Open receivable invoices',
    summary: [
      { label: 'Invoice count', value: rows.length },
      { label: 'Outstanding balance', value: formatCurrency(totalDue) },
    ],
    tables: [
      {
        title: 'Due Invoices',
        columns: [
          { key: 'number', label: 'Invoice' },
          { key: 'customer', label: 'Customer' },
          { key: 'priority', label: 'Priority' },
          { key: 'stage', label: 'Stage' },
          { key: 'balance', label: 'Balance' },
        ],
        rows: rows.map((invoice) => ({
          number: invoice.number,
          customer: invoice.customer?.name,
          priority: invoice.priority,
          stage: invoice.followUpStage,
          balance: formatCurrency(invoice.balanceDue),
        })),
      },
    ],
    payload: { invoices: rows, priority: filters.priority },
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

  const sendReminders = async () => {
    const liveSync = hasLiveInvoices ? await sendMockInvoices(rows) : null;

    if (liveSync?.failed && !liveSync.synced && !liveSync.skipped) {
      throw new Error(liveSync.errorMessage || 'Unable to sync live reminders.');
    }

    actions.applyReminderBatch(
      rows.map((invoice) => invoice.id),
      {
        subject: 'Automated due invoice reminder',
        note: 'Reminder automation triggered from due invoice queue.',
      }
    );

    if (liveSync?.synced) {
      toast.info(`Synced ${liveSync.synced} live invoice reminders.`);
    }

    toast.success('Reminder automation applied to current due invoice queue');
  };

  const createPlan = () => {
    if (!selectedInvoice) return;

    actions.createPaymentPlan(selectedInvoice.id, planDraft);
    setSelectedInvoice(null);
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
            Due Invoices
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {rows.length} open invoices with total outstanding of {formatCurrency(totalDue)}.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            onClick={() =>
              runAction(
                'Export Due Excel',
                () => exportReceivablesExcel('due-invoices', exportConfig),
                'Due invoice workbook exported'
              )
            }
            disabled={pendingAction !== null}
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            onClick={() =>
              runAction(
                'Export Due CSV',
                () => exportReceivablesCsv('due-invoices', exportConfig),
                'Due invoice CSV exported'
              )
            }
            disabled={pendingAction !== null}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:letter-bold" />}
            onClick={() =>
              runAction('Send Reminder Batch', sendReminders, 'Reminder automation completed')
            }
            disabled={pendingAction !== null}
          >
            Send Reminders
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ borderBottom: 'none', width: 260 }}>
                  <TextField
                    select
                    size="small"
                    label="Priority"
                    value={filters.priority}
                    onChange={(event) => updateFilter('priority', event.target.value)}
                    fullWidth
                  >
                    <MenuItem value="all">All priorities</MenuItem>
                    <MenuItem value="routine">Routine</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </TextField>
                </TableCell>
                <TableCell sx={{ borderBottom: 'none', width: 220 }}>
                  <TextField
                    select
                    size="small"
                    label="Sort by"
                    value={filters.sort}
                    onChange={(event) => updateFilter('sort', event.target.value)}
                    fullWidth
                  >
                    <MenuItem value="overdue">Overdue days</MenuItem>
                    <MenuItem value="balance">Balance due</MenuItem>
                    <MenuItem value="customer">Customer</MenuItem>
                  </TextField>
                </TableCell>
                <TableCell sx={{ borderBottom: 'none' }}>
                  <Typography variant="body2" color="text.secondary">
                    Filter selection is persisted in the route so the queue can be shared or
                    refreshed without losing context.
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Follow-Up</TableCell>
                <TableCell>Promise / Automation</TableCell>
                <TableCell align="right">Balance Due</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {invoice.number}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {invoice.description}
                    </Typography>
                  </TableCell>
                  <TableCell>{invoice.customer?.name}</TableCell>
                  <TableCell>{invoice.dueDate}</TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.priority}
                      size="small"
                      color={PRIORITY_COLORS[invoice.priority]}
                    />
                  </TableCell>
                  <TableCell>{invoice.followUpStage}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {invoice.promiseToPay || 'Automation pending'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {invoice.reminderTemplate}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(invoice.balanceDue)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setSelectedInvoice(invoice)}
                        disabled={!invoice.paymentPlanEligible}
                      >
                        Plan
                      </Button>
                      <Button
                        component={RouterLink}
                        href={buildHref(
                          paths.dashboard.accountingFinance.receivables.dueInvoiceDetail(invoice.id)
                        )}
                        size="small"
                        variant="outlined"
                        color="inherit"
                      >
                        Detail
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          onClick={() =>
            runAction(
              'Export Due Excel',
              () => exportReceivablesExcel('due-invoices', exportConfig),
              'Due invoice workbook exported'
            )
          }
          disabled={pendingAction !== null}
        >
          Export Excel
        </Button>
        <Button
          variant="outlined"
          onClick={() =>
            runAction(
              'Export Due CSV',
              () => exportReceivablesCsv('due-invoices', exportConfig),
              'Due invoice CSV exported'
            )
          }
          disabled={pendingAction !== null}
        >
          Export CSV
        </Button>
      </Stack> */}

      <Dialog
        open={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Payment Plan</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Prepare an installment proposal for {selectedInvoice?.number}.
            </Typography>
            <TextField
              type="number"
              label="Installments"
              value={planDraft.installments}
              onChange={(event) =>
                setPlanDraft((current) => ({ ...current, installments: event.target.value }))
              }
            />
            <TextField
              type="date"
              label="First installment date"
              value={planDraft.startDate}
              onChange={(event) =>
                setPlanDraft((current) => ({ ...current, startDate: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedInvoice(null)}>Cancel</Button>
          <Button variant="contained" onClick={createPlan}>
            Save Plan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
