'use client';

import { toast } from 'sonner';
import { useState, useMemo } from 'react';
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

import { Iconify } from 'src/components/iconify';

import { fetcher, endpoints } from 'src/utils/axios';

import { formatCurrency } from '../utils';
import { useCurrency } from '../currency-context';
import { useCustomerInvoicesApi } from './use-customer-invoices-api';

const EMPTY_LINE = () => ({
  _key: Date.now() + Math.random(),
  description: '',
  quantity: '1',
  unit_price: '',
  account: '',
  analytic_account: '',
  cost_center: '',
  analytic: '',
});

const EMPTY_INVOICE = {
  customer_id: '',
  date: new Date().toISOString().slice(0, 10),
  due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  journal: '',
  project: '',
  cost_center: '',
  currency: '',
  fiscal_period: '',
  paymentTerms: 'Net 15',
  recurring: false,
  servicePeriod: '',
  billingOwner: '',
  billingReference: '',
  promiseToPay: '',
  taxRate: '5',
  lines: [EMPTY_LINE()],
};

export default function CustomerInvoiceNewForm() {
  const { customers, actions } = useCustomerInvoicesApi();
  const { activeCurrency } = useCurrency();

  const [draftInvoice, setDraftInvoice] = useState(EMPTY_INVOICE);
  const [submitting, setSubmitting] = useState(false);

  const { data: rawJournals } = useSWR(endpoints.accounting.journals, fetcher);
  const { data: rawProjects } = useSWR(endpoints.projectManagements.projects, fetcher);
  const { data: rawCostCenters } = useSWR(endpoints.accounting.cost_centers, fetcher);
  const { data: rawCurrencies } = useSWR(endpoints.accounting.currencies, fetcher);
  const { data: rawFiscalPeriods } = useSWR(endpoints.accounting.fiscal_periods, fetcher);
  const { data: rawAccounts } = useSWR(endpoints.accounting.accounts, fetcher);
  const { data: rawAnalyticAccounts } = useSWR(endpoints.accounting.analytic_accounts, fetcher);

  const journals = useMemo(() => {
    const list = Array.isArray(rawJournals) ? rawJournals : Array.isArray(rawJournals?.results) ? rawJournals.results : [];
    return list;
  }, [rawJournals]);

  const projects = useMemo(() => {
    const list = Array.isArray(rawProjects) ? rawProjects : Array.isArray(rawProjects?.results) ? rawProjects.results : [];
    return list;
  }, [rawProjects]);

  const costCenters = useMemo(() => {
    const list = Array.isArray(rawCostCenters) ? rawCostCenters : Array.isArray(rawCostCenters?.results) ? rawCostCenters.results : [];
    return list;
  }, [rawCostCenters]);

  const currencies = useMemo(() => {
    const list = Array.isArray(rawCurrencies) ? rawCurrencies : Array.isArray(rawCurrencies?.results) ? rawCurrencies.results : [];
    return list;
  }, [rawCurrencies]);

  const fiscalPeriods = useMemo(() => {
    const list = Array.isArray(rawFiscalPeriods) ? rawFiscalPeriods : Array.isArray(rawFiscalPeriods?.results) ? rawFiscalPeriods.results : [];
    return list;
  }, [rawFiscalPeriods]);

  const accounts = useMemo(() => {
    const list = Array.isArray(rawAccounts) ? rawAccounts : Array.isArray(rawAccounts?.results) ? rawAccounts.results : [];
    return list;
  }, [rawAccounts]);

  const analyticAccounts = useMemo(() => {
    const list = Array.isArray(rawAnalyticAccounts) ? rawAnalyticAccounts : Array.isArray(rawAnalyticAccounts?.results) ? rawAnalyticAccounts.results : [];
    return list;
  }, [rawAnalyticAccounts]);

  const updateDraft = (field, value) => {
    setDraftInvoice((current) => ({ ...current, [field]: value }));
  };

  const addLine = () => {
    setDraftInvoice((current) => ({ ...current, lines: [...current.lines, EMPTY_LINE()] }));
  };

  const removeLine = (index) => {
    setDraftInvoice((current) => ({
      ...current,
      lines: current.lines.filter((_, i) => i !== index),
    }));
  };

  const updateLine = (index, field, value) => {
    setDraftInvoice((current) => ({
      ...current,
      lines: current.lines.map((line, i) => (i === index ? { ...line, [field]: value } : line)),
    }));
  };

  const handleCreateInvoice = async () => {
    setSubmitting(true);
    try {
      await actions.createInvoice(draftInvoice);
      toast.success('Customer invoice created successfully.');
      window.close();
    } catch (err) {
      console.error('Failed to create invoice:', err);
      toast.error('Failed to create invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 960, mx: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Create Customer Invoice
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add service period, billing ownership, analytic allocation, and promise tracking so the
            invoice behaves more like an ERP receivables document.
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
              <AlertTitle>Collections workflow active</AlertTitle>
              Dunning stage, promise-to-pay, recurring templates, and credit-warning tracking are
              live from the backend transaction records.
            </Alert>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Customer"
                  value={draftInvoice.customer_id}
                  onChange={(event) => updateDraft('customer_id', event.target.value)}
                >
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Invoice date"
                  type="date"
                  value={draftInvoice.date}
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
                  value={draftInvoice.due_date}
                  onChange={(event) => updateDraft('due_date', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Payment terms"
                  value={draftInvoice.paymentTerms}
                  onChange={(event) => updateDraft('paymentTerms', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Recurring"
                  value={draftInvoice.recurring ? 'yes' : 'no'}
                  onChange={(event) => updateDraft('recurring', event.target.value === 'yes')}
                >
                  <MenuItem value="no">One time</MenuItem>
                  <MenuItem value="yes">Recurring</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Service period"
                  value={draftInvoice.servicePeriod}
                  onChange={(event) => updateDraft('servicePeriod', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Billing owner"
                  value={draftInvoice.billingOwner}
                  onChange={(event) => updateDraft('billingOwner', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Billing reference"
                  value={draftInvoice.billingReference}
                  onChange={(event) => updateDraft('billingReference', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Promise to pay"
                  type="date"
                  value={draftInvoice.promiseToPay}
                  onChange={(event) => updateDraft('promiseToPay', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Journal"
                  value={draftInvoice.journal}
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
                  value={draftInvoice.project}
                  onChange={(event) => updateDraft('project', event.target.value)}
                >
                  <MenuItem value="">Select project</MenuItem>
                  {projects.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
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
                  value={draftInvoice.cost_center}
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
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Currency"
                  value={draftInvoice.currency}
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
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Fiscal Period"
                  value={draftInvoice.fiscal_period}
                  onChange={(event) => updateDraft('fiscal_period', event.target.value)}
                >
                  <MenuItem value="">Select fiscal period</MenuItem>
                  {fiscalPeriods.map((fp) => (
                    <MenuItem key={fp.id} value={fp.id}>
                      {fp.name || fp.code || `Period ${fp.id}`}
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
                    Invoice Lines
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
                      {draftInvoice.lines.map((line, index) => {
                        const lineAmt =
                          (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
                        return (
                          <TableRow key={line._key ?? index}>
                            <TableCell sx={{ py: 0.75 }}>
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="Service description"
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
                                onChange={(e) => updateLine(index, 'analytic_account', e.target.value)}
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
                                disabled={draftInvoice.lines.length === 1}
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
                  const sub = draftInvoice.lines.reduce(
                    (s, l) => s + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0),
                    0
                  );
                  const taxAmt = (sub * (Number(draftInvoice.taxRate) || 0)) / 100;
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
                          value={draftInvoice.taxRate}
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
                            Tax ({draftInvoice.taxRate || 0}%)
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
          onClick={handleCreateInvoice}
          disabled={
            submitting ||
            !draftInvoice.customer_id ||
            !draftInvoice.billingOwner.trim() ||
            !draftInvoice.lines.some((l) => l.description.trim() && Number(l.unit_price) > 0)
          }
        >
          {submitting ? 'Saving…' : 'Save Draft'}
        </Button>
      </Stack>
    </Box>
  );
}
