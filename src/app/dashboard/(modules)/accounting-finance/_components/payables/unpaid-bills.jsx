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
import { exportPayablesCsv, printPayablesPack, exportPayablesExcel } from './payables-export';

const PRIORITY_COLORS = {
  scheduled: 'info',
  urgent: 'warning',
  high: 'error',
  critical: 'error',
};

export default function UnpaidBills() {
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [scheduleDraft, setScheduleDraft] = useState({
    date: '2026-04-03',
    method: 'Bank transfer',
  });
  const [pendingAction, setPendingAction] = useState(null);
  const { filters, updateFilter, buildHref } = useRouteFilters([
    {
      key: 'priority',
      defaultValue: 'all',
      allowedValues: ['all', 'scheduled', 'urgent', 'high', 'critical'],
    },
    {
      key: 'approval',
      defaultValue: 'all',
      allowedValues: ['all', 'approved', 'review', 'pending', 'escalated'],
    },
    { key: 'stage', defaultValue: 'all' },
  ]);
  const { unpaidBills, actions } = usePayablesWorkspace();

  const rows = useMemo(
    () =>
      unpaidBills.filter((bill) => {
        if (filters.priority !== 'all' && bill.priority !== filters.priority) return false;
        if (filters.approval !== 'all' && bill.approvalState !== filters.approval) return false;
        if (filters.stage !== 'all' && bill.paymentStage !== filters.stage) return false;
        return true;
      }),
    [filters.approval, filters.priority, filters.stage, unpaidBills]
  );
  const stageOptions = useMemo(
    () => ['all', ...new Set(unpaidBills.map((bill) => bill.paymentStage))],
    [unpaidBills]
  );

  const totalDue = rows.reduce((sum, bill) => sum + bill.balanceDue, 0);
  const heldBills = rows.filter((bill) => bill.holdReason).length;
  const criticalBills = rows.filter((bill) => bill.priority === 'critical').length;
  const exportConfig = {
    title: 'Unpaid Bills Register',
    subtitle: 'Operational payables queue',
    summary: [
      { label: 'Bills in view', value: rows.length },
      { label: 'Outstanding balance', value: formatCurrency(totalDue) },
      { label: 'Held bills', value: heldBills },
      { label: 'Critical bills', value: criticalBills },
    ],
    tables: [
      {
        title: 'Unpaid Bills',
        columns: [
          { key: 'number', label: 'Bill' },
          { key: 'supplier', label: 'Supplier' },
          { key: 'priority', label: 'Priority' },
          { key: 'stage', label: 'Stage' },
          { key: 'balance', label: 'Balance' },
        ],
        rows: rows.map((bill) => ({
          number: bill.number,
          supplier: bill.supplier?.name,
          priority: bill.priority,
          stage: bill.paymentStage,
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

  const saveSchedule = () => {
    if (!selectedBill) return;

    actions.scheduleBill(selectedBill.id, {
      date: scheduleDraft.date,
      method: scheduleDraft.method,
      stage: 'Scheduled',
      note: `Bill moved into scheduled payment run using ${scheduleDraft.method}.`,
    });
    setSelectedBill(null);
  };

  const toggleSelected = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const scheduleBatch = () => {
    actions.scheduleBatch(selectedIds, {
      date: scheduleDraft.date,
      method: scheduleDraft.method,
      stage: 'Batch scheduled',
      proposal: 'Urgent payment run',
      note: 'Selected from unpaid bills batch payment run.',
    });
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
            Unpaid Bills
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {rows.length} open bills with total payable exposure of {formatCurrency(totalDue)}.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            onClick={() =>
              runAction(
                'Export Unpaid Bills CSV',
                () => exportPayablesCsv('unpaid-bills', exportConfig),
                'Unpaid bills CSV exported'
              )
            }
            disabled={pendingAction !== null}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:layers-bold" />}
            onClick={scheduleBatch}
            disabled={!selectedIds.length || pendingAction !== null}
          >
            Batch Run
          </Button>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:download-minimalistic-bold" />}
            onClick={() =>
              runAction(
                'Export Unpaid Bills Excel',
                () => exportPayablesExcel('unpaid-bills', exportConfig),
                'Unpaid bills workbook exported'
              )
            }
            disabled={pendingAction !== null}
          >
            Export Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:card-send-bold" />}
            onClick={() =>
              runAction(
                'Open Payment Run',
                () => printPayablesPack(exportConfig),
                'Payment run pack opened'
              )
            }
            disabled={pendingAction !== null}
          >
            Open Payment Run
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              select
              size="small"
              label="Priority"
              value={filters.priority}
              onChange={(event) => updateFilter('priority', event.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="all">All priorities</MenuItem>
              <MenuItem value="scheduled">Scheduled</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              label="Approval"
              value={filters.approval}
              onChange={(event) => updateFilter('approval', event.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="all">All approvals</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="review">Review</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="escalated">Escalated</MenuItem>
            </TextField>
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
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
              Queue prioritization is based on aging, disputes, holds, and treasury readiness from
              the payables mock layer.
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
                <TableCell>Bill</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Approval</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Payment Stage</TableCell>
                <TableCell>Aging</TableCell>
                <TableCell align="right">Balance Due</TableCell>
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
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {bill.number}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {bill.description} {bill.holdReason ? `• Hold: ${bill.holdReason}` : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>{bill.supplier?.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={bill.approvalState}
                      size="small"
                      color={bill.approvalState === 'approved' ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={bill.priority}
                      size="small"
                      color={PRIORITY_COLORS[bill.priority] || 'default'}
                    />
                  </TableCell>
                  <TableCell>{bill.paymentStage}</TableCell>
                  <TableCell>
                    {bill.overdueDays > 0
                      ? `${bill.overdueDays} overdue days`
                      : `${bill.dueInDays} days to due`}
                  </TableCell>
                  <TableCell align="right">{formatCurrency(bill.balanceDue)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="outlined"
                        color={bill.holdReason ? 'success' : 'warning'}
                        onClick={() =>
                          actions.toggleBillHold(
                            bill.id,
                            bill.holdReason
                              ? { note: 'Released from unpaid bill queue review.' }
                              : { reason: 'Placed on hold pending document review.' }
                          )
                        }
                      >
                        {bill.holdReason ? 'Unhold' : 'Hold'}
                      </Button>
                      <Button size="small" variant="outlined" onClick={() => setSelectedBill(bill)}>
                        Schedule
                      </Button>
                      <Button
                        component={RouterLink}
                        href={buildHref(
                          paths.dashboard.accountingFinance.payables.unpaidBillDetail(bill.id)
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
        <DialogTitle>Schedule Bill Payment</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Schedule treasury release for {selectedBill?.number}.
            </Typography>
            <TextField
              type="date"
              label="Payment date"
              value={scheduleDraft.date}
              onChange={(event) =>
                setScheduleDraft((current) => ({ ...current, date: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Payment method"
              value={scheduleDraft.method}
              onChange={(event) =>
                setScheduleDraft((current) => ({ ...current, method: event.target.value }))
              }
            >
              <MenuItem value="Bank transfer">Bank transfer</MenuItem>
              <MenuItem value="Wire">Wire</MenuItem>
              <MenuItem value="Cheque">Cheque</MenuItem>
              <MenuItem value="Mobile banking">Mobile banking</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedBill(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveSchedule}>
            Save Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
