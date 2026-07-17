'use client';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import AlertTitle from '@mui/material/AlertTitle';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useCurrency } from '../currency-context';
import { useDeferredExpensesApi } from './use-deferred-expenses-api';

const STATUS_COLORS = {
  in_progress: 'warning',
  done: 'success',
};

const EMPTY_DRAFT = {
  reference: '',
  description: '',
  start_date: '',
  end_date: '',
  total_amount: '',
  periods: '',
};

function getElapsedPeriods(record) {
  const today = new Date();
  const start = new Date(record.start_date);
  const end = new Date(record.end_date);
  const cappedDate = today > end ? end : today;

  if (cappedDate < start) return 0;

  const monthsElapsed =
    (cappedDate.getFullYear() - start.getFullYear()) * 12 +
    cappedDate.getMonth() -
    start.getMonth() +
    1;

  return Math.max(0, Math.min(Number(record.periods || 0), monthsElapsed));
}

export default function DeferredExpenses() {
  const { activeCurrency } = useCurrency();
  const { records, isLoading, createRecord, updateRecord, deleteRecord, recognizeRecord } =
    useDeferredExpensesApi();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draftRecord, setDraftRecord] = useState(EMPTY_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(
    () =>
      records.filter((record) => {
        const haystack =
          `${record.reference} ${record.description} ${record.start_date} ${record.end_date}`.toLowerCase();
        if (search && !haystack.includes(search.toLowerCase())) return false;
        if (status !== 'all' && record.status !== status) return false;
        return true;
      }),
    [records, search, status]
  );

  const totalDeferred = filtered.reduce((sum, record) => sum + Number(record.total_amount || 0), 0);
  const recognizedToDate = filtered.reduce(
    (sum, record) => sum + Number(record.recognized_amount || 0),
    0
  );

  const recordInsights = useMemo(
    () =>
      records.map((record) => {
        const totalAmount = Number(record.total_amount || 0);
        const recognizedAmount = Number(record.recognized_amount || 0);
        const monthlyRecognition = Number(record.monthlyRecognition || 0);
        const elapsedPeriods = getElapsedPeriods(record);
        const expectedRecognized = Math.min(totalAmount, elapsedPeriods * monthlyRecognition);
        const catchUpAmount = Math.max(0, expectedRecognized - recognizedAmount);
        const remainingBalance = Math.max(0, totalAmount - recognizedAmount);
        const progressPercent = totalAmount
          ? Math.round((recognizedAmount / totalAmount) * 100)
          : 0;

        return {
          ...record,
          elapsedPeriods,
          expectedRecognized,
          catchUpAmount,
          remainingBalance,
          progressPercent,
          scheduleHealth:
            catchUpAmount > 0 ? 'catch_up' : record.status === 'done' ? 'done' : 'on_track',
        };
      }),
    [records]
  );

  const filteredInsights = filtered.map(
    (record) => recordInsights.find((item) => item.id === record.id) || record
  );

  const selectedRecord =
    filteredInsights.find((record) => record.id === selectedRecordId) ||
    recordInsights.find((record) => record.id === selectedRecordId) ||
    filteredInsights[0] ||
    recordInsights[0] ||
    null;

  const readyThisMonth = recordInsights.filter(
    (record) => record.status !== 'done' && record.remainingBalance > 0
  ).length;
  const schedulesNeedingCatchUp = recordInsights.filter(
    (record) => record.catchUpAmount > 0
  ).length;

  const handleRecognize = async (recordId) => {
    try {
      await recognizeRecord(recordId);
    } catch (err) {
      console.error('Recognize failed:', err);
    }
  };

  const handleCreateRecord = async () => {
    setSubmitting(true);
    try {
      const payload = {
        reference: draftRecord.reference,
        description: draftRecord.description,
        start_date: draftRecord.start_date,
        end_date: draftRecord.end_date,
        total_amount: Number(draftRecord.total_amount || 0),
        periods: Number(draftRecord.periods || 0),
      };
      if (editTarget) {
        await updateRecord(editTarget.id, payload);
      } else {
        const created = await createRecord(payload);
        setSelectedRecordId(created.id);
      }
      setDraftRecord(EMPTY_DRAFT);
      setEditTarget(null);
      setCreateOpen(false);
    } catch (err) {
      console.error('Save draft failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditDialog = (record) => {
    setEditTarget(record);
    setDraftRecord({
      reference: record.reference ?? '',
      description: record.description ?? '',
      start_date: record.start_date ?? '',
      end_date: record.end_date ?? '',
      total_amount: String(record.total_amount || ''),
      periods: String(record.periods || ''),
    });
    setCreateOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRecord(deleteTarget.id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h4" fontWeight={800}>
            Deferred Expenses
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Amortization workspace for prepaid insurance, rent, and software schedules.
          </Typography>
        </Stack>
        <Button variant="contained" onClick={() => setCreateOpen(true)}>
          New Schedule
        </Button>
      </Stack>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        <AlertTitle>Expense amortization control active</AlertTitle>
        Deferred expense schedules track prepaid spending with period-based amortization schedules.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Visible schedules
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {filtered.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Deferred value
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {formatCurrency(totalDeferred)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Recognized to date
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {formatCurrency(recognizedToDate)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Ready this month
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {readyThisMonth}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Catch-up required
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {schedulesNeedingCatchUp}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search schedule, description, or coverage dates"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:magnifer-linear" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="all">All schedules</MenuItem>
              <MenuItem value="in_progress">In progress</MenuItem>
              <MenuItem value="done">Done</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          {/* Amortization Queue commented out */}
          {/* <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Amortization Queue
              </Typography>
              <Stack spacing={1.5}>
                {filteredInsights.slice(0, 3).map((record) => (
                  <Box key={record.id}>
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {record.reference}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {record.description}
                        </Typography>
                      </Box>
                      <Chip
                        label={
                          record.scheduleHealth === 'catch_up'
                            ? 'Catch up'
                            : record.status === 'done'
                              ? 'Done'
                              : 'On track'
                        }
                        size="small"
                        color={
                          record.scheduleHealth === 'catch_up'
                            ? 'error'
                            : record.status === 'done'
                              ? 'success'
                              : 'success'
                        }
                      />
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={record.progressPercent}
                      sx={{ mt: 1.25, height: 8, borderRadius: 999 }}
                    />
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.75 }}>
                      <Typography variant="caption" color="text.secondary">
                        Recognized {formatCurrency(record.recognized_amount)} of{' '}
                        {formatCurrency(record.total_amount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {record.catchUpAmount > 0
                          ? `Behind by ${formatCurrency(record.catchUpAmount)}`
                          : `Monthly ${formatCurrency(record.monthlyRecognition)}`}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card> */}

          <Card sx={{ borderRadius: 3, overflowX: 'auto' }}>
            <TableContainer>
              <Table sx={{ minWidth: 1100 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Reference</TableCell>
                    <TableCell>Health</TableCell>
                    <TableCell>Coverage</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Deferred</TableCell>
                    <TableCell align="right">Recognized</TableCell>
                    <TableCell align="right">Monthly</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInsights.map((record) => (
                    <TableRow
                      key={record.id}
                      hover
                      selected={selectedRecord?.id === record.id}
                      onClick={() => setSelectedRecordId(record.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{ fontFamily: 'monospace' }}
                        >
                          {record.reference}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            record.scheduleHealth === 'catch_up'
                              ? 'Catch up'
                              : record.status === 'done'
                                ? 'Done'
                                : 'On track'
                          }
                          size="small"
                          color={
                            record.scheduleHealth === 'catch_up'
                              ? 'error'
                              : record.status === 'done'
                                ? 'success'
                                : 'success'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(record.start_date).toLocaleDateString()} -{' '}
                        {new Date(record.end_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{record.description}</TableCell>
                      <TableCell align="right">{formatCurrency(record.total_amount)}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(record.recognized_amount)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(record.monthlyRecognition)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={record.status.replace(/_/g, ' ')}
                          size="small"
                          color={STATUS_COLORS[record.status]}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" justifyContent="flex-end" spacing={1}>
                          <Tooltip title="Edit schedule">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditDialog(record);
                              }}
                              disabled={record.status === 'done'}
                            >
                              <Iconify icon="solar:pen-bold" width={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete schedule">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(record);
                              }}
                              disabled={record.status === 'done'}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                            </IconButton>
                          </Tooltip>
                          <Button
                            size="small"
                            variant="text"
                            component={RouterLink}
                            href={paths.dashboard.accountingFinance.transactions.deferredExpenseDetail(
                              record.id
                            )}
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={record.status === 'done'}
                            onClick={() => handleRecognize(record.id)}
                          >
                            Recognize
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filteredInsights.length && (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            No deferred expense schedules match the current filters.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Selected Schedule sidebar commented out */}
        {/* <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Selected Schedule
              </Typography>
              {selectedRecord ? (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h6" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                      {selectedRecord.reference}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedRecord.description}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={selectedRecord.progressPercent}
                    sx={{ height: 10, borderRadius: 999 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Progress {selectedRecord.progressPercent}%
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary">
                        Remaining
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(selectedRecord.remainingBalance)}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary">
                        Expected by now
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(selectedRecord.expectedRecognized)}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Alert severity={selectedRecord.catchUpAmount > 0 ? 'warning' : 'success'}>
                    {selectedRecord.catchUpAmount > 0
                      ? `Amortization is behind plan by ${formatCurrency(selectedRecord.catchUpAmount)}.`
                      : 'Amortization is aligned with the current schedule.'}
                  </Alert>
                  <Divider />
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Control Review
                    </Typography>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Elapsed periods</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedRecord.elapsedPeriods} / {selectedRecord.periods}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Monthly recognition</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(selectedRecord.monthlyRecognition)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Status</Typography>
                      <Chip
                        label={selectedRecord.status.replace(/_/g, ' ')}
                        size="small"
                        color={STATUS_COLORS[selectedRecord.status]}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Stack>
                  </Stack>
                  <Button
                    variant="contained"
                    disabled={selectedRecord.status === 'done'}
                    onClick={() => handleRecognize(selectedRecord.id)}
                  >
                    Recognize Current Period
                  </Button>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Select a schedule to review amortization readiness and catch-up needs.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Odoo-Style Controls
              </Typography>
              <Stack spacing={1.25}>
                <Typography variant="body2">
                  Expense releases are tracked against elapsed schedule periods.
                </Typography>
                <Typography variant="body2">
                  Catch-up gaps stay visible before month-end amortization runs.
                </Typography>
                <Typography variant="body2">
                  Draft schedules can be staged directly from new prepaid spend.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid> */}
      </Grid>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editTarget ? 'Edit Deferred Expense Schedule' : 'New Deferred Expense Schedule'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Create a draft amortization schedule for prepaid insurance, rent, software, or similar
              spend.
            </Alert>
            <TextField
              fullWidth
              label="Reference"
              value={draftRecord.reference}
              onChange={(event) =>
                setDraftRecord((current) => ({ ...current, reference: event.target.value }))
              }
            />
            <TextField
              fullWidth
              label="Description"
              value={draftRecord.description}
              onChange={(event) =>
                setDraftRecord((current) => ({ ...current, description: event.target.value }))
              }
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={draftRecord.start_date}
                  onChange={(event) =>
                    setDraftRecord((current) => ({ ...current, start_date: event.target.value }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={draftRecord.end_date}
                  onChange={(event) =>
                    setDraftRecord((current) => ({ ...current, end_date: event.target.value }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Total Amount"
                  value={draftRecord.total_amount}
                  onChange={(event) =>
                    setDraftRecord((current) => ({ ...current, total_amount: event.target.value }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">{activeCurrency.symbol}</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Recognition Periods"
                  value={draftRecord.periods}
                  onChange={(event) =>
                    setDraftRecord((current) => ({ ...current, periods: event.target.value }))
                  }
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCreateOpen(false);
              setEditTarget(null);
              setDraftRecord(EMPTY_DRAFT);
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateRecord} disabled={submitting}>
            {submitting ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Draft'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Schedule?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete schedule{' '}
            <strong>{deleteTarget?.reference || deleteTarget?.number}</strong>? This action cannot
            be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
