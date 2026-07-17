'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import useSWR from 'swr';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { fetcher, endpoints } from 'src/utils/axios';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { formatCurrency } from '../utils';
import { ReportExportActions } from './report-export-actions';
import { exportReportJson, exportReportExcel } from './reports-export';

function SectionTable({ title, rows, total, tone }) {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>{title}</Typography>
          <Chip label={formatCurrency(total)} color={tone} variant="outlined" />
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Account</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{row.code} - {row.name}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={700}>{formatCurrency(Math.abs(row.balance))}</Typography>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} align="center">
                    <Typography variant="body2" color="text.secondary">No accounts</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

export default function ProfitLoss() {
  const today = new Date();
  const firstDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
  const [dateFrom, setDateFrom] = useState(firstDay);
  const [dateTo, setDateTo] = useState(lastDay);
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  const trialBalanceUrl = useMemo(() => {
    const base = endpoints.accounting.account_trial_balance;
    return `${base}?date_from=${dateFrom}&date_to=${dateTo}`;
  }, [dateFrom, dateTo]);

  const { data: rawResponse, isLoading } = useSWR(trialBalanceUrl, fetcher);

  const allAccounts = useMemo(() => {
    if (!rawResponse) return [];
    if (Array.isArray(rawResponse)) return rawResponse;
    return rawResponse.accounts || [];
  }, [rawResponse]);

  // For P&L, we use period activity (not closing balance)
  // Income: period_cr (revenue earned) minus period_dr (returns/discounts)
  // Expense: period_dr (expenses incurred) minus period_cr (reversals)
  const accountsWithActivity = useMemo(() => {
    return allAccounts.map((acc) => {
      const periodDr = Number(acc.period_dr || 0);
      const periodCr = Number(acc.period_cr || 0);
      // Net activity for the period
      const balance = periodDr - periodCr;
      return { ...acc, balance, periodDr, periodCr };
    });
  }, [allAccounts]);

  const income = useMemo(
    () => accountsWithActivity.filter((a) => a.classification === 'income' && Math.abs(a.balance) > 0.01),
    [accountsWithActivity]
  );
  const expenses = useMemo(
    () => accountsWithActivity.filter((a) => a.classification === 'expense' && Math.abs(a.balance) > 0.01),
    [accountsWithActivity]
  );

  // Income is credit-natured: positive balance = revenue (show as positive)
  // Expense is debit-natured: positive balance = expense (show as positive)
  const totalIncome = useMemo(() => income.reduce((s, a) => s + Math.abs(a.balance), 0), [income]);
  const totalExpenses = useMemo(() => expenses.reduce((s, a) => s + Math.abs(a.balance), 0), [expenses]);
  const netProfit = totalIncome - totalExpenses;

  const exportConfig = useMemo(() => ({
    title: 'Profit & Loss',
    subtitle: `${dateFrom} to ${dateTo}`,
    summary: [
      { label: 'Income', value: formatCurrency(totalIncome) },
      { label: 'Expenses', value: formatCurrency(totalExpenses) },
      { label: 'Net result', value: formatCurrency(netProfit) },
    ],
    tables: [
      {
        title: 'Income',
        columns: [{ key: 'code', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'balance', label: 'Amount' }],
        rows: income.map((a) => ({ code: a.code, name: a.name, balance: formatCurrency(Math.abs(a.balance)) })),
      },
      {
        title: 'Expenses',
        columns: [{ key: 'code', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'balance', label: 'Amount' }],
        rows: expenses.map((a) => ({ code: a.code, name: a.name, balance: formatCurrency(Math.abs(a.balance)) })),
      },
    ],
  }), [dateFrom, dateTo, totalIncome, totalExpenses, netProfit, income, expenses]);

  const printContent = (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Profit & Loss — {dateFrom} to {dateTo}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead><tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Account</th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>Amount</th>
          </tr></thead>
          <tbody>
            {income.map((a) => (
              <tr key={a.id}>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{a.code} - {a.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(Math.abs(a.balance))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Expenses</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead><tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Account</th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>Amount</th>
          </tr></thead>
          <tbody>
            {expenses.map((a) => (
              <tr key={a.id}>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{a.code} - {a.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(Math.abs(a.balance))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Profit & Loss</Typography>
          <Typography variant="body2" color="text.secondary">
            Income and expenses calculated from your chart of accounts for the selected period.
          </Typography>
        </Box>
        <ReportExportActions
          actions={[
            { key: 'json', onClick: () => exportReportJson('profit-loss', exportConfig), disabled: pendingAction !== null },
            { key: 'excel', onClick: () => exportReportExcel('profit-loss', exportConfig), disabled: pendingAction !== null },
            { key: 'print', onClick: () => setPrintOpen(true), disabled: pendingAction !== null },
          ]}
        />
      </Stack>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label="Date From" type="date" size="small" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />
            <TextField label="Date To" type="date" size="small" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Total Income</Typography>
              <Typography variant="h5" fontWeight={800} color="success.main" sx={{ mt: 0.5 }}>{formatCurrency(totalIncome)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Total Expenses</Typography>
              <Typography variant="h5" fontWeight={800} color="error.main" sx={{ mt: 0.5 }}>{formatCurrency(totalExpenses)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Net Profit</Typography>
              <Typography variant="h5" fontWeight={800} color={netProfit >= 0 ? 'success.main' : 'error.main'} sx={{ mt: 0.5 }}>{formatCurrency(netProfit)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {isLoading ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Loading...</Typography>
      ) : (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <SectionTable title="Income" rows={income} total={totalIncome} tone="success" />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <SectionTable title="Expenses" rows={expenses} total={totalExpenses} tone="error" />
          </Grid>
        </Grid>
      )}

      <Card sx={{ mt: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={700}>Net Result</Typography>
            <Chip
              label={`${formatCurrency(netProfit)} (${netProfit >= 0 ? 'Profit' : 'Loss'})`}
              color={netProfit >= 0 ? 'success' : 'error'}
              sx={{ fontWeight: 700 }}
            />
          </Stack>
        </CardContent>
      </Card>

      {printOpen && (
        <PdfPrintLayout title="Profit & Loss" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
