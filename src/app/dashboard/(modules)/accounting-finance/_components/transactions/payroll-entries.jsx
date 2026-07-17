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
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
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
import { useWorkspacePayrollApi } from './use-workspace-payroll-api';

const STATUS_COLORS = {
  draft: 'default',
  posted: 'success',
};

const PAYROLL_APPROVAL_ROUTES = [
  'Finance Controller',
  'HR and Finance Review',
  'Executive Director Approval',
];

const FUNDING_SOURCES = ['General Fund', 'Education Grant', 'Health Grant', 'Shared Services'];

const today = new Date().toISOString().slice(0, 10);

const EMPTY_PAYROLL_FORM = {
  payrollCycle: '',
  date: today,
  periodStart: '',
  periodEnd: '',
  employeeCount: '',
  grossAmount: '',
  netAmount: '',
  approvalRoute: 'Finance Controller',
  fundingSource: 'General Fund',
  description: '',
};

export default function PayrollEntries() {
  const { activeCurrency } = useCurrency();
  const {
    payrollEntries: entries,
    isLoading,
    createEntry,
    updateEntry,
    deleteEntry,
    postEntry,
  } = useWorkspacePayrollApi();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftEntry, setDraftEntry] = useState(EMPTY_PAYROLL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(
    () =>
      entries.filter((entry) => {
        const haystack =
          `${entry.number} ${entry.payroll_cycle} ${entry.description}`.toLowerCase();
        if (search && !haystack.includes(search.toLowerCase())) return false;
        if (status !== 'all' && entry.status !== status) return false;
        return true;
      }),
    [entries, search, status]
  );

  const totalGross = filtered.reduce((sum, entry) => sum + entry.grossAmount, 0);
  const totalNet = filtered.reduce((sum, entry) => sum + entry.netAmount, 0);

  const handlePost = async (entryId) => {
    await postEntry(entryId);
  };

  const updateDraftEntry = (field, value) => {
    setDraftEntry((current) => ({ ...current, [field]: value }));
  };

  const handleOpenDialog = () => {
    setDraftEntry(EMPTY_PAYROLL_FORM);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditTarget(null);
    setDraftEntry(EMPTY_PAYROLL_FORM);
  };

  const liabilityAmount = Math.max(
    Number(draftEntry.grossAmount || 0) - Number(draftEntry.netAmount || 0),
    0
  );

  const handleCreateEntry = async () => {
    setSubmitting(true);
    const payload = {
      payroll_cycle: draftEntry.payrollCycle,
      date: draftEntry.date,
      period_start: draftEntry.periodStart || null,
      period_end: draftEntry.periodEnd || null,
      employee_count: draftEntry.employeeCount,
      gross_amount: draftEntry.grossAmount,
      net_amount: draftEntry.netAmount,
      approval_route: draftEntry.approvalRoute,
      funding_source: draftEntry.fundingSource,
      description: draftEntry.description,
    };
    try {
      if (editTarget) {
        await updateEntry(editTarget.id, payload);
      } else {
        await createEntry(payload);
      }
      handleCloseDialog();
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditDialog = (entry) => {
    setEditTarget(entry);
    setDraftEntry({
      payrollCycle: entry.payrollCycle ?? entry.payroll_cycle ?? '',
      date: entry.date || new Date().toISOString().slice(0, 10),
      periodStart: entry.periodStart ?? entry.period_start ?? '',
      periodEnd: entry.periodEnd ?? entry.period_end ?? '',
      employeeCount: String(entry.employeeCount ?? entry.employee_count ?? ''),
      grossAmount: String(entry.grossAmount ?? entry.gross_amount ?? ''),
      netAmount: String(entry.netAmount ?? entry.net_amount ?? ''),
      approvalRoute: entry.approvalRoute ?? entry.approval_route ?? '',
      fundingSource: entry.fundingSource ?? entry.funding_source ?? '',
      description: entry.description ?? '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEntry(deleteTarget.id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const canCreateEntry =
    draftEntry.description.trim() &&
    Number(draftEntry.employeeCount) > 0 &&
    Number(draftEntry.grossAmount) > 0 &&
    Number(draftEntry.netAmount) > 0 &&
    Number(draftEntry.netAmount) <= Number(draftEntry.grossAmount);

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
            Payroll Entries
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Payroll posting workspace for salary, tax, and liability journals.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={handleOpenDialog}
        >
          New Payroll Batch
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        <AlertTitle>Payroll posting control active</AlertTitle>
        Payroll entries use live operations data with direct posting and liability tracking.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Visible batches
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
                Gross payroll
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {formatCurrency(totalGross)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Net payroll
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {formatCurrency(totalNet)}
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
              placeholder="Search payroll cycle or description"
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
              <MenuItem value="all">All statuses</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="posted">Posted</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Number</TableCell>
                  <TableCell>Payroll Cycle</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Gross</TableCell>
                  <TableCell align="right">Net</TableCell>
                  <TableCell align="right">Liability</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                        {entry.number}
                      </Typography>
                    </TableCell>
                    <TableCell>{entry.payroll_cycle}</TableCell>
                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell align="right">{formatCurrency(entry.grossAmount)}</TableCell>
                    <TableCell align="right">{formatCurrency(entry.netAmount)}</TableCell>
                    <TableCell align="right">{formatCurrency(entry.liabilityAmount)}</TableCell>
                    <TableCell>
                      <Chip
                        label={entry.status}
                        size="small"
                        color={STATUS_COLORS[entry.status]}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end" spacing={1}>
                        <Tooltip title="Edit entry">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDialog(entry);
                            }}
                            disabled={entry.status === 'posted'}
                          >
                            <Iconify icon="solar:pen-bold" width={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete entry">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(entry);
                            }}
                            disabled={entry.status === 'posted'}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                          </IconButton>
                        </Tooltip>
                        <Button
                          size="small"
                          variant="text"
                          component={RouterLink}
                          href={paths.dashboard.accountingFinance.transactions.payrollEntryDetail(
                            entry.id
                          )}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={entry.status === 'posted'}
                          onClick={() => handlePost(entry.id)}
                        >
                          Post
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>New Payroll Batch</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Prepare the accrual with cycle coverage, employee volume, and liability reconciliation
              before posting.
            </Alert>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Payroll cycle"
                  value={draftEntry.payrollCycle}
                  onChange={(event) => updateDraftEntry('payrollCycle', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Posting date"
                  value={draftEntry.date}
                  onChange={(event) => updateDraftEntry('date', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Period start"
                  value={draftEntry.periodStart}
                  onChange={(event) => updateDraftEntry('periodStart', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Period end"
                  value={draftEntry.periodEnd}
                  onChange={(event) => updateDraftEntry('periodEnd', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Employee count"
                  value={draftEntry.employeeCount}
                  onChange={(event) => updateDraftEntry('employeeCount', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Gross amount"
                  value={draftEntry.grossAmount}
                  onChange={(event) => updateDraftEntry('grossAmount', event.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">{activeCurrency.symbol}</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Net amount"
                  value={draftEntry.netAmount}
                  onChange={(event) => updateDraftEntry('netAmount', event.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">{activeCurrency.symbol}</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Funding source"
                  value={draftEntry.fundingSource}
                  onChange={(event) => updateDraftEntry('fundingSource', event.target.value)}
                >
                  {FUNDING_SOURCES.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Approval route"
                  value={draftEntry.approvalRoute}
                  onChange={(event) => updateDraftEntry('approvalRoute', event.target.value)}
                >
                  {PAYROLL_APPROVAL_ROUTES.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Derived liabilities"
                  value={formatCurrency(liabilityAmount)}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Description"
                  placeholder="Summarize the payroll scope, departments covered, and posting notes"
                  value={draftEntry.description}
                  onChange={(event) => updateDraftEntry('description', event.target.value)}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateEntry}
            disabled={!canCreateEntry || submitting}
          >
            {submitting ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Batch'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Payroll Entry?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete payroll entry <strong>{deleteTarget?.number}</strong>?
            This action cannot be undone.
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
