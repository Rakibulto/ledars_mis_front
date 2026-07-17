'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { toast } from 'sonner';
import { useMemo, useState, useCallback } from 'react';

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

import { paths } from 'src/routes/paths';

import { fetcher, endpoints } from 'src/utils/axios';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useCurrency } from '../currency-context';
import { useVendorBillsApi } from './use-vendor-bills-api';

const EMPTY_LINE = () => ({
  _key: Date.now() + Math.random(),
  description: '',
  quantity: '1',
  unit_price: '',
  account: '',
  analytic_account: '',
  cost_center: '',
});

const EMPTY_BILL = () => ({
  supplier_id: '',
  date: new Date().toISOString().slice(0, 10),
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  journal: '',
  project: '',
  cost_center: '',
  currency: '',
  fiscal_period: '',
  approvalRoute: '',
  supplierInvoiceRef: '',
  goodsReceiptRef: '',
  paymentProposal: 'Hold until validation',
  taxRate: '5',
  lines: [EMPTY_LINE()],
});

export default function VendorBillNewForm() {
  const api = useVendorBillsApi();
  const { vendors } = api;
  const { activeCurrency } = useCurrency();

  const [draftBill, setDraftBill] = useState(EMPTY_BILL());
  const [saving, setSaving] = useState(false);

  const { data: rawJournals } = useSWR(endpoints.accounting.journals, fetcher);
  const { data: rawProjects } = useSWR(endpoints.projectManagements.projects, fetcher);
  const { data: rawCostCenters } = useSWR(endpoints.accounting.cost_centers, fetcher);
  const { data: rawCurrencies } = useSWR(endpoints.accounting.currencies, fetcher);
  const { data: rawFiscalPeriods } = useSWR(endpoints.accounting.fiscal_periods, fetcher);
  const { data: rawAccounts } = useSWR(endpoints.accounting.accounts, fetcher);
  const { data: rawAnalyticAccounts } = useSWR(endpoints.accounting.analytic_accounts, fetcher);

  const journals = useMemo(() => {
    const list = Array.isArray(rawJournals)
      ? rawJournals
      : Array.isArray(rawJournals?.results)
        ? rawJournals.results
        : [];
    // Only show purchase journals for vendor bills
    return list.filter((j) => j.journal_type === 'purchase');
  }, [rawJournals]);

  const projects = useMemo(() => {
    const list = Array.isArray(rawProjects)
      ? rawProjects
      : Array.isArray(rawProjects?.results)
        ? rawProjects.results
        : [];
    return list;
  }, [rawProjects]);

  const costCenters = useMemo(() => {
    const list = Array.isArray(rawCostCenters)
      ? rawCostCenters
      : Array.isArray(rawCostCenters?.results)
        ? rawCostCenters.results
        : [];
    return list;
  }, [rawCostCenters]);

  const currencies = useMemo(() => {
    const list = Array.isArray(rawCurrencies)
      ? rawCurrencies
      : Array.isArray(rawCurrencies?.results)
        ? rawCurrencies.results
        : [];
    return list;
  }, [rawCurrencies]);

  const fiscalPeriods = useMemo(() => {
    const list = Array.isArray(rawFiscalPeriods)
      ? rawFiscalPeriods
      : Array.isArray(rawFiscalPeriods?.results)
        ? rawFiscalPeriods.results
        : [];
    return list;
  }, [rawFiscalPeriods]);

  const accounts = useMemo(() => {
    const list = Array.isArray(rawAccounts)
      ? rawAccounts
      : Array.isArray(rawAccounts?.results)
        ? rawAccounts.results
        : [];
    return list.filter((a) => a.is_active !== false);
  }, [rawAccounts]);

  const analyticAccounts = useMemo(() => {
    const list = Array.isArray(rawAnalyticAccounts)
      ? rawAnalyticAccounts
      : Array.isArray(rawAnalyticAccounts?.results)
        ? rawAnalyticAccounts.results
        : [];
    return list;
  }, [rawAnalyticAccounts]);

  const updateDraft = (field, value) => {
    setDraftBill((current) => ({ ...current, [field]: value }));
  };

  const addLine = useCallback(() => {
    setDraftBill((current) => ({ ...current, lines: [...current.lines, EMPTY_LINE()] }));
  }, []);

  const removeLine = useCallback((index) => {
    setDraftBill((current) => ({
      ...current,
      lines: current.lines.filter((_, i) => i !== index),
    }));
  }, []);

  const updateLine = useCallback((index, field, value) => {
    setDraftBill((current) => {
      const lines = current.lines.map((l, i) => (i === index ? { ...l, [field]: value } : l));
      return { ...current, lines };
    });
  }, []);

  const handleCreateBill = async () => {
    const hasValidLine = draftBill.lines.some(
      (l) => l.description.trim() && Number(l.unit_price) > 0
    );
    if (!hasValidLine) return;
    setSaving(true);
    try {
      await api.actions.createBill(draftBill);
      toast.success('Vendor bill draft created successfully.');
      window.close();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to create bill.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 960, mx: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Create Vendor Bill
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Capture supplier references, receipt matching, analytic allocation, and approval routing
            before the bill enters the payable queue.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            component={Link}
            href={paths.dashboard.accountingFinance.transactions.supplierPayments}
            variant="outlined"
            startIcon={<Iconify icon="solar:card-send-bold" />}
          >
            Payment runs
          </Button>
          <Button variant="outlined" color="inherit" onClick={() => window.close()}>
            Cancel
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={2.5}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <AlertTitle>Payables controls active</AlertTitle>
              Three-way match status, dispute flags, payment proposals, and blocked bills are driven
              from mock accounting records.
            </Alert>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Supplier"
                  value={draftBill.supplier_id}
                  onChange={(event) => updateDraft('supplier_id', event.target.value)}
                >
                  {vendors.map((vendor) => (
                    <MenuItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Bill date"
                  type="date"
                  value={draftBill.date}
                  onChange={(event) => updateDraft('date', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Due date"
                  type="date"
                  value={draftBill.due_date}
                  onChange={(event) => updateDraft('due_date', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Supplier invoice reference"
                  value={draftBill.supplierInvoiceRef}
                  onChange={(event) => updateDraft('supplierInvoiceRef', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Goods receipt reference"
                  value={draftBill.goodsReceiptRef}
                  onChange={(event) => updateDraft('goodsReceiptRef', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Approval route"
                  value={draftBill.approvalRoute}
                  onChange={(event) => updateDraft('approvalRoute', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Payment proposal"
                  value={draftBill.paymentProposal}
                  onChange={(event) => updateDraft('paymentProposal', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Journal"
                  value={draftBill.journal}
                  onChange={(event) => updateDraft('journal', event.target.value)}
                >
                  <MenuItem value="">Select journal</MenuItem>
                  {journals.map((j) => (
                    <MenuItem key={j.id} value={j.id}>
                      {j.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Project"
                  value={draftBill.project}
                  onChange={(event) => updateDraft('project', event.target.value)}
                >
                  <MenuItem value="">Select project</MenuItem>
                  {projects.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.title}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Cost Center"
                  value={draftBill.cost_center}
                  onChange={(event) => updateDraft('cost_center', event.target.value)}
                >
                  <MenuItem value="">Select cost center</MenuItem>
                  {costCenters.map((cc) => (
                    <MenuItem key={cc.id} value={cc.id}>
                      {cc.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              {/* Currency field hidden - not needed for vendor bills */}
              {false && (
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Currency"
                  value={draftBill.currency}
                  onChange={(event) => updateDraft('currency', event.target.value)}
                >
                  <MenuItem value="">Select currency</MenuItem>
                  {currencies.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              )}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Fiscal Period"
                  value={draftBill.fiscal_period}
                  onChange={(event) => updateDraft('fiscal_period', event.target.value)}
                >
                  <MenuItem value="">Select fiscal period</MenuItem>
                  {fiscalPeriods.map((fp) => (
                    <MenuItem key={fp.id} value={fp.id}>
                      {fp.name}
                    </MenuItem>
                  ))}
                </TextField>
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
                    Bill Lines
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
                        <TableCell sx={{ fontWeight: 700, width: 56 }}>Qty</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 100 }}>Unit Price</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 140 }}>Account</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 130 }}>Analytic Acct</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 130 }}>Cost Center</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, width: 110 }}>
                          Amount
                        </TableCell>
                        <TableCell sx={{ width: 40 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {draftBill.lines.map((line, index) => {
                        const lineAmt =
                          (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
                        return (
                          <TableRow key={line._key ?? index}>
                            <TableCell sx={{ py: 0.75 }}>
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="Item description"
                                value={line.description}
                                onChange={(e) => updateLine(index, 'description', e.target.value)}
                                variant="standard"
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
                                sx={{ width: 48 }}
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
                                sx={{ width: 88 }}
                              />
                            </TableCell>
                            <TableCell sx={{ py: 0.75 }}>
                              <TextField
                                select
                                size="small"
                                value={line.account}
                                onChange={(e) => updateLine(index, 'account', e.target.value)}
                                variant="standard"
                                sx={{ width: 130 }}
                              >
                                <MenuItem value="">Select</MenuItem>
                                {accounts.map((a) => (
                                  <MenuItem key={a.id} value={a.id}>
                                    {a.code} — {a.name}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </TableCell>
                            <TableCell sx={{ py: 0.75 }}>
                              <TextField
                                select
                                size="small"
                                value={line.analytic_account}
                                onChange={(e) =>
                                  updateLine(index, 'analytic_account', e.target.value)
                                }
                                variant="standard"
                                sx={{ width: 120 }}
                              >
                                <MenuItem value="">Select</MenuItem>
                                {analyticAccounts.map((aa) => (
                                  <MenuItem key={aa.id} value={aa.id}>
                                    {aa.code} — {aa.name}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </TableCell>
                            <TableCell sx={{ py: 0.75 }}>
                              <TextField
                                select
                                size="small"
                                value={line.cost_center}
                                onChange={(e) => updateLine(index, 'cost_center', e.target.value)}
                                variant="standard"
                                sx={{ width: 120 }}
                              >
                                <MenuItem value="">Select</MenuItem>
                                {costCenters.map((cc) => (
                                  <MenuItem key={cc.id} value={cc.id}>
                                    {cc.name}
                                  </MenuItem>
                                ))}
                              </TextField>
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
                                disabled={draftBill.lines.length === 1}
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

                {(() => {
                  const sub = draftBill.lines.reduce(
                    (s, l) => s + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0),
                    0
                  );
                  const taxAmt = (sub * (Number(draftBill.taxRate) || 0)) / 100;
                  return (
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
                          value={draftBill.taxRate}
                          onChange={(e) => updateDraft('taxRate', e.target.value)}
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
                            Tax ({draftBill.taxRate || 0}%)
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
                  );
                })()}
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
        <Button onClick={() => window.close()}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleCreateBill}
          disabled={
            saving ||
            !draftBill.supplier_id ||
            !draftBill.lines.some((l) => l.description.trim() && Number(l.unit_price) > 0)
          }
        >
          {saving ? 'Saving...' : 'Save Draft'}
        </Button>
      </Stack>
    </Box>
  );
}
