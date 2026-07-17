'use client';

import { useMemo } from 'react';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';
import useSWR from 'swr';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
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
import TableContainer from '@mui/material/TableContainer';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useCurrency } from '../currency-context';
import { useWorkspaceExpenseApi } from './use-workspace-expense-api';

const EXPENSE_CATEGORIES = [
  'Travel and Logistics',
  'Program Expenses',
  'Office Operations',
  'Training and Workshops',
  'Maintenance and Utilities',
];

const EXPENSE_TEAMS = [
  'Program Team',
  'Training Unit',
  'Field Operations',
  'Finance Department',
  'Administration',
];

const COST_CENTERS = ['Education', 'Health', 'Livelihood', 'Head Office', 'Field Support'];

const today = new Date().toISOString().slice(0, 10);

const EMPTY_LINE = () => ({
  _key: Date.now() + Math.random(),
  description: '',
  analytic: '',
  quantity: '1',
  unit_price: '',
});

const EMPTY_EXPENSE_FORM = {
  date: today,
  category: 'Travel and Logistics',
  employee: 'Program Team',
  costCenter: 'Education',
  approvalRoute: 'Finance Manager',
  reference: '',
  description: '',
  amount: '',
  taxRate: '5',
  lines: [EMPTY_LINE()],
};

export default function ExpenseEntryNewForm() {
  const { activeCurrency } = useCurrency();
  const { createEntry } = useWorkspaceExpenseApi();

  const { data: rawAccounts } = useSWR(endpoints.accounting.accounts, fetcher);
  const accounts = useMemo(() => {
    const list = Array.isArray(rawAccounts) ? rawAccounts : rawAccounts?.results ?? [];
    return list.filter((a) => a.is_active !== false);
  }, [rawAccounts]);

  const [draftEntry, setDraftEntry] = useState(EMPTY_EXPENSE_FORM);
  const [submitting, setSubmitting] = useState(false);

  const updateDraftEntry = (field, value) => {
    setDraftEntry((current) => ({ ...current, [field]: value }));
  };

  const handleTaxRateChange = (value) => {
    setDraftEntry((current) => {
      const sub = current.lines.reduce(
        (s, l) => s + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0),
        0
      );
      const taxAmt = (sub * (Number(value) || 0)) / 100;
      return { ...current, taxRate: value, amount: String(sub + taxAmt) };
    });
  };

  const addLine = useCallback(() => {
    setDraftEntry((current) => ({ ...current, lines: [...current.lines, EMPTY_LINE()] }));
  }, []);

  const removeLine = useCallback((index) => {
    setDraftEntry((current) => {
      const lines = current.lines.filter((_, i) => i !== index);
      const sub = lines.reduce(
        (s, l) => s + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0),
        0
      );
      const taxAmt = (sub * (Number(current.taxRate) || 0)) / 100;
      return { ...current, lines, amount: String(sub + taxAmt) };
    });
  }, []);

  const updateLine = useCallback((index, field, value) => {
    setDraftEntry((current) => {
      const lines = current.lines.map((l, i) => (i === index ? { ...l, [field]: value } : l));
      const sub = lines.reduce(
        (s, l) => s + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0),
        0
      );
      const taxAmt = (sub * (Number(current.taxRate) || 0)) / 100;
      return { ...current, lines, amount: String(sub + taxAmt) };
    });
  }, []);

  const canCreateEntry =
    draftEntry.description.trim() && Number(draftEntry.amount) > 0 && draftEntry.employee;

  const handleCreateEntry = async () => {
    setSubmitting(true);
    try {
      await createEntry({
        date: draftEntry.date,
        category: draftEntry.category,
        employee: draftEntry.employee,
        cost_center: draftEntry.costCenter,
        approval_route: draftEntry.approvalRoute,
        reference: draftEntry.reference,
        amount: draftEntry.amount,
        description: draftEntry.description,
      });
      toast.success('Expense entry created successfully.');
      window.close();
    } finally {
      setSubmitting(false);
    }
  };

  const sub = draftEntry.lines.reduce(
    (s, l) => s + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0),
    0
  );
  const taxAmt = (sub * (Number(draftEntry.taxRate) || 0)) / 100;

  return (
    <Box sx={{ p: 3, maxWidth: 960, mx: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            New Expense Entry
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Capture category, cost center, and approval routing before the batch is submitted for
            posting.
          </Typography>
        </Box>
        <Button variant="outlined" color="inherit" onClick={() => window.close()}>
          Cancel
        </Button>
      </Stack>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={2.5}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <AlertTitle>Expense workflow active</AlertTitle>
              Expense entries use operations data with direct posting from submitted batches.
            </Alert>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Entry date"
                  value={draftEntry.date}
                  onChange={(event) => updateDraftEntry('date', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Expense category"
                  value={draftEntry.category}
                  onChange={(event) => updateDraftEntry('category', event.target.value)}
                >
                  {accounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Submitting team"
                  value={draftEntry.employee}
                  onChange={(event) => updateDraftEntry('employee', event.target.value)}
                >
                  {EXPENSE_TEAMS.map((option) => (
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
                  label="Cost center"
                  value={draftEntry.costCenter}
                  onChange={(event) => updateDraftEntry('costCenter', event.target.value)}
                >
                  {COST_CENTERS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Approval route"
                  value={draftEntry.approvalRoute}
                  onChange={(event) => updateDraftEntry('approvalRoute', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Reference"
                  placeholder="Claim batch or request ref"
                  value={draftEntry.reference}
                  onChange={(event) => updateDraftEntry('reference', event.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ mt: 0.5, mb: 1.5 }} />
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="subtitle2" fontWeight={700}>
                    Expense Lines
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Iconify icon="solar:add-circle-bold" />}
                    onClick={addLine}
                  >
                    Add Line
                  </Button>
                </Stack>

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'background.neutral' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 130 }}>Analytic</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 72 }}>Qty</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 120 }}>Unit Price</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, width: 110 }}>
                          Amount
                        </TableCell>
                        <TableCell sx={{ width: 40 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {draftEntry.lines.map((line, index) => {
                        const lineAmt =
                          (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
                        return (
                          <TableRow key={line._key ?? index}>
                            <TableCell sx={{ py: 0.75 }}>
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="Expense item description"
                                value={line.description}
                                onChange={(e) => updateLine(index, 'description', e.target.value)}
                                variant="standard"
                              />
                            </TableCell>
                            <TableCell sx={{ py: 0.75 }}>
                              <TextField
                                size="small"
                                placeholder="e.g. Shared"
                                value={line.analytic}
                                onChange={(e) => updateLine(index, 'analytic', e.target.value)}
                                variant="standard"
                                sx={{ width: 114 }}
                              />
                            </TableCell>
                            <TableCell sx={{ py: 0.75 }}>
                              <TextField
                                size="small"
                                type="number"
                                value={line.quantity}
                                onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                                variant="standard"
                                inputProps={{ min: 0, style: { textAlign: 'right' } }}
                                sx={{ width: 56 }}
                              />
                            </TableCell>
                            <TableCell sx={{ py: 0.75 }}>
                              <TextField
                                size="small"
                                type="number"
                                placeholder="0.00"
                                value={line.unit_price}
                                onChange={(e) => updateLine(index, 'unit_price', e.target.value)}
                                variant="standard"
                                inputProps={{ min: 0, style: { textAlign: 'right' } }}
                                sx={{ width: 104 }}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ py: 0.75 }}>
                              <Typography variant="body2" fontWeight={600}>
                                {lineAmt > 0
                                  ? `${activeCurrency.symbol}${lineAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 0.75, pl: 0 }}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => removeLine(index)}
                                disabled={draftEntry.lines.length === 1}
                              >
                                <Iconify icon="solar:trash-bin-minimalistic-bold" width={15} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ mt: 1.5 }}>
                  <Stack
                    direction="row"
                    justifyContent="flex-end"
                    alignItems="center"
                    spacing={2}
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Tax rate %
                    </Typography>
                    <TextField
                      size="small"
                      type="number"
                      value={draftEntry.taxRate}
                      onChange={(e) => handleTaxRateChange(e.target.value)}
                      sx={{ width: 88 }}
                      inputProps={{ min: 0 }}
                    />
                  </Stack>
                  <Box sx={{ bgcolor: 'background.neutral', borderRadius: 2, p: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Subtotal
                      </Typography>
                      <Typography variant="body2">{formatCurrency(sub)}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Tax ({draftEntry.taxRate || 0}%)
                      </Typography>
                      <Typography variant="body2">{formatCurrency(taxAmt)}</Typography>
                    </Stack>
                    <Divider sx={{ my: 0.75 }} />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="subtitle2" fontWeight={700}>
                        Total
                      </Typography>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {formatCurrency(sub + taxAmt)}
                      </Typography>
                    </Stack>
                  </Box>
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Description"
                  placeholder="Describe the operational expense batch, support documents, or posting purpose"
                  value={draftEntry.description}
                  onChange={(event) => updateDraftEntry('description', event.target.value)}
                />
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
        <Button onClick={() => window.close()}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleCreateEntry}
          disabled={!canCreateEntry || submitting}
        >
          {submitting ? 'Saving…' : 'Submit Draft'}
        </Button>
      </Stack>
    </Box>
  );
}
