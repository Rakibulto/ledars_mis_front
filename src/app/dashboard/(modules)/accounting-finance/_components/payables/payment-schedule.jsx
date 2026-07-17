'use client';

import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import CardContent from '@mui/material/CardContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useRouteFilters } from './use-route-filters';
import { usePayablesWorkspace } from './use-payables-workspace';
import { exportPayablesCsv, exportPayablesExcel } from './payables-export';

const PRIORITY_COLORS = {
  scheduled: 'info',
  urgent: 'warning',
  high: 'error',
  critical: 'error',
};

export default function PaymentSchedule() {
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchOpen, setBatchOpen] = useState(false);
  const [draftDate, setDraftDate] = useState('2026-04-08');
  const [batchDraft, setBatchDraft] = useState({
    proposal: 'Weekly treasury batch',
    date: '2026-04-08',
    method: 'Bank transfer',
  });
  const [pendingAction, setPendingAction] = useState(null);
  const { filters, updateFilter, buildHref } = useRouteFilters([
    { key: 'stage', defaultValue: 'all' },
    { key: 'sort', defaultValue: 'due-date', allowedValues: ['due-date', 'balance', 'supplier'] },
  ]);
  const { paymentSchedule, actions } = usePayablesWorkspace();

  const stageOptions = ['all', ...new Set(paymentSchedule.map((bill) => bill.paymentStage))];
  const rows = [...paymentSchedule]
    .filter((bill) => (filters.stage === 'all' ? true : bill.paymentStage === filters.stage))
    .sort((left, right) => {
      if (filters.sort === 'balance') return right.balanceDue - left.balanceDue;
      if (filters.sort === 'supplier')
        return (left.supplier?.name || '').localeCompare(right.supplier?.name || '');
      return new Date(left.dueDate) - new Date(right.dueDate);
    });

  const totalDue = rows.reduce((sum, bill) => sum + bill.balanceDue, 0);
  const discounts = rows.filter((bill) => bill.discountEligible).length;
  const nearTerm = rows
    .filter((bill) => bill.cashForecastBucket === 'Near-term liquidity')
    .reduce((sum, bill) => sum + bill.balanceDue, 0);
  const exportConfig = {
    title: 'Payment Schedule',
    subtitle: 'Treasury due calendar',
    summary: [
      { label: 'Bills in queue', value: rows.length },
      { label: 'Amount due', value: formatCurrency(totalDue) },
      { label: 'Prompt-pay opportunities', value: discounts },
      { label: 'Near-term cash need', value: formatCurrency(nearTerm) },
    ],
    tables: [
      {
        title: 'Payment Schedule',
        columns: [
          { key: 'bill', label: 'Bill' },
          { key: 'supplier', label: 'Supplier' },
          { key: 'group', label: 'Due Group' },
          { key: 'proposal', label: 'Proposal' },
          { key: 'dueDate', label: 'Due Date' },
          { key: 'scheduled', label: 'Scheduled' },
          { key: 'balance', label: 'Balance' },
        ],
        rows: rows.map((bill) => ({
          bill: bill.number,
          supplier: bill.supplier?.name,
          group: bill.dueGroup,
          proposal: bill.paymentProposal || 'Standard treasury proposal',
          dueDate: bill.dueDate,
          scheduled: bill.scheduledPaymentDate || 'Not set',
          balance: formatCurrency(bill.balanceDue),
        })),
      },
    ],
    payload: { rows, filters },
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

  const saveReschedule = () => {
    if (!selectedBill) return;

    actions.scheduleBill(selectedBill.id, {
      date: draftDate,
      method: selectedBill.paymentMethod,
      stage: 'Scheduled',
      note: `Treasury release moved to ${draftDate}.`,
    });
    setSelectedBill(null);
  };

  const toggleSelected = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const saveBatch = () => {
    actions.scheduleBatch(selectedIds, {
      date: batchDraft.date,
      method: batchDraft.method,
      stage: 'Batch scheduled',
      proposal: batchDraft.proposal,
      note: `Scheduled from ${batchDraft.proposal}.`,
    });
    setBatchOpen(false);
    setSelectedIds([]);
  };

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
            Payment Schedule
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Treasury calendar with prompt-pay timing, reschedule actions, and due-date pressure.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:layers-bold" />}
            onClick={() => setBatchOpen(true)}
            disabled={!selectedIds.length}
          >
            Build Batch
          </Button>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:download-minimalistic-bold" />}
            onClick={() =>
              runAction(
                'Export Payment Schedule Excel',
                () => exportPayablesExcel('payment-schedule', exportConfig),
                'Payment schedule workbook exported'
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
                'Export Payment Schedule CSV',
                () => exportPayablesCsv('payment-schedule', exportConfig),
                'Payment schedule CSV exported'
              )
            }
            disabled={pendingAction !== null}
          >
            Export CSV
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              select
              size="small"
              label="Stage"
              value={filters.stage}
              onChange={(event) => updateFilter('stage', event.target.value)}
              sx={{ minWidth: 240 }}
            >
              {stageOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option === 'all' ? 'All stages' : option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Sort"
              value={filters.sort}
              onChange={(event) => updateFilter('sort', event.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="due-date">Due date</MenuItem>
              <MenuItem value="balance">Balance due</MenuItem>
              <MenuItem value="supplier">Supplier</MenuItem>
            </TextField>
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
              {discounts} bills qualify for prompt-pay handling and {formatCurrency(nearTerm)} is
              needed for near-term liquidity.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={rows.length > 0 && selectedIds.length === rows.length}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < rows.length}
                    onChange={() =>
                      setSelectedIds(
                        selectedIds.length === rows.length ? [] : rows.map((bill) => bill.id)
                      )
                    }
                  />
                </TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Bill</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Due Group</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Stage</TableCell>
                <TableCell>Cash Forecast</TableCell>
                <TableCell>Scheduled</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((bill) => (
                <TableRow key={bill.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedIds.includes(bill.id)}
                      onChange={() => toggleSelected(bill.id)}
                    />
                  </TableCell>
                  <TableCell>{bill.dueDate}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {bill.number}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {bill.discountEligible ? 'Prompt-pay eligible' : 'Standard settlement'}
                    </Typography>
                  </TableCell>
                  <TableCell>{bill.supplier?.name}</TableCell>
                  <TableCell>{bill.dueGroup}</TableCell>
                  <TableCell>
                    <Chip
                      label={bill.priority}
                      size="small"
                      color={PRIORITY_COLORS[bill.priority] || 'default'}
                    />
                  </TableCell>
                  <TableCell>{bill.paymentStage}</TableCell>
                  <TableCell>{bill.cashForecastBucket}</TableCell>
                  <TableCell>{bill.scheduledPaymentDate || 'Not scheduled'}</TableCell>
                  <TableCell align="right">{formatCurrency(bill.balanceDue)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedBill(bill);
                          setDraftDate(bill.scheduledPaymentDate || draftDate);
                        }}
                      >
                        Reschedule
                      </Button>
                      <Button
                        component={RouterLink}
                        href={buildHref(
                          paths.dashboard.accountingFinance.payables.paymentScheduleDetail(bill.id)
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

      <Dialog
        open={Boolean(selectedBill)}
        onClose={() => setSelectedBill(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reschedule Treasury Release</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Update the treasury release date for {selectedBill?.number}.
            </Typography>
            <TextField
              type="date"
              label="Scheduled payment date"
              value={draftDate}
              onChange={(event) => setDraftDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedBill(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveReschedule}>
            Save Date
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={batchOpen} onClose={() => setBatchOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Build Payment Proposal</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Build a payment proposal for {selectedIds.length} selected bills.
            </Typography>
            <TextField
              label="Proposal name"
              value={batchDraft.proposal}
              onChange={(event) =>
                setBatchDraft((current) => ({ ...current, proposal: event.target.value }))
              }
            />
            <TextField
              type="date"
              label="Settlement date"
              value={batchDraft.date}
              onChange={(event) =>
                setBatchDraft((current) => ({ ...current, date: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Method"
              value={batchDraft.method}
              onChange={(event) =>
                setBatchDraft((current) => ({ ...current, method: event.target.value }))
              }
            >
              <MenuItem value="Bank transfer">Bank transfer</MenuItem>
              <MenuItem value="Wire">Wire</MenuItem>
              <MenuItem value="Cheque">Cheque</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatchOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveBatch}>
            Create Batch
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
