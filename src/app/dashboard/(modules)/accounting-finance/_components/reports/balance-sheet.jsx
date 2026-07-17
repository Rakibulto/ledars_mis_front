'use client';

import { toast } from 'sonner';
import NextLink from 'next/link';
import { useMemo, useState } from 'react';
import useSWR from 'swr';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
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

function StatementSection({ title, rows, total, tone }) {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
          <Chip label={formatCurrency(total)} color={tone} variant="outlined" />
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Account</TableCell>
                <TableCell align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Stack spacing={0.35}>
                      <Typography variant="body2" fontWeight={700}>
                        {row.code} - {row.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.typeName}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(Math.abs(row.balance))}
                    </Typography>
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

export default function BalanceSheet() {
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

  // Compute closing balance for each account
  // For asset/expense: balance = closing_dr - closing_cr
  // For liability/equity/income: balance = closing_cr - closing_dr
  const accountsWithBalance = useMemo(() => {
    const DEBIT_CLASS = { asset: true, expense: true };
    return allAccounts.map((acc) => {
      const isDebit = DEBIT_CLASS[acc.classification];
      const balance = isDebit
        ? (acc.closing_dr || 0) - (acc.closing_cr || 0)
        : (acc.closing_cr || 0) - (acc.closing_dr || 0);
      return { ...acc, balance };
    }).filter((acc) => Math.abs(acc.balance) > 0.01);
  }, [allAccounts]);

  // Split into Assets, Liabilities, Equity
  const assets = useMemo(
    () => accountsWithBalance.filter((a) => a.classification === 'asset'),
    [accountsWithBalance]
  );
  const liabilities = useMemo(
    () => accountsWithBalance.filter((a) => a.classification === 'liability'),
    [accountsWithBalance]
  );
  const equity = useMemo(
    () => accountsWithBalance.filter((a) => a.classification === 'equity'),
    [accountsWithBalance]
  );

  const totalAssets = useMemo(() => assets.reduce((s, a) => s + a.balance, 0), [assets]);
  const totalLiabilities = useMemo(() => liabilities.reduce((s, a) => s + a.balance, 0), [liabilities]);
  const totalEquity = useMemo(() => equity.reduce((s, a) => s + a.balance, 0), [equity]);
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  const balancingGap = totalAssets - totalLiabilitiesAndEquity;
  const isBalanced = Math.abs(balancingGap) < 0.01;

  const exportConfig = useMemo(() => ({
    title: 'Balance Sheet',
    subtitle: `As of ${dateTo}`,
    summary: [
      { label: 'Total Assets', value: formatCurrency(totalAssets) },
      { label: 'Total Liabilities', value: formatCurrency(totalLiabilities) },
      { label: 'Total Equity', value: formatCurrency(totalEquity) },
      { label: 'Balance', value: isBalanced ? 'Balanced' : `Gap: ${formatCurrency(balancingGap)}` },
    ],
    tables: [
      {
        title: 'Assets',
        columns: [{ key: 'code', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'balance', label: 'Balance' }],
        rows: assets.map((a) => ({ code: a.code, name: a.name, balance: formatCurrency(a.balance) })),
      },
      {
        title: 'Liabilities',
        columns: [{ key: 'code', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'balance', label: 'Balance' }],
        rows: liabilities.map((a) => ({ code: a.code, name: a.name, balance: formatCurrency(a.balance) })),
      },
      {
        title: 'Equity',
        columns: [{ key: 'code', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'balance', label: 'Balance' }],
        rows: equity.map((a) => ({ code: a.code, name: a.name, balance: formatCurrency(a.balance) })),
      },
    ],
  }), [dateTo, totalAssets, totalLiabilities, totalEquity, balancingGap, isBalanced, assets, liabilities, equity]);

  const printContent = (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Balance Sheet — {dateTo}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Account</th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id}>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{a.code} - {a.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(a.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Liabilities</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Account</th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {liabilities.map((a) => (
              <tr key={a.id}>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{a.code} - {a.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(a.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Equity</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Account</th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {equity.map((a) => (
              <tr key={a.id}>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{a.code} - {a.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(a.balance)}</td>
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
          <Typography variant="h4" fontWeight={800}>Balance Sheet</Typography>
          <Typography variant="body2" color="text.secondary">
            Assets, liabilities, and equity calculated from your chart of accounts.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <ReportExportActions
            actions={[
              { key: 'json', onClick: () => exportReportJson('balance-sheet', exportConfig), disabled: pendingAction !== null },
              { key: 'excel', onClick: () => exportReportExcel('balance-sheet', exportConfig), disabled: pendingAction !== null },
              { key: 'print', onClick: () => setPrintOpen(true), disabled: pendingAction !== null },
            ]}
          />
        </Stack>
      </Stack>

      <Alert severity={isBalanced ? 'success' : 'warning'} sx={{ mb: 3, borderRadius: 2 }}>
        {isBalanced
          ? `Balance Sheet is balanced. Total Assets: ${formatCurrency(totalAssets)} = Liabilities + Equity: ${formatCurrency(totalLiabilitiesAndEquity)}`
          : `Balance Sheet has a gap of ${formatCurrency(balancingGap)}. Assets: ${formatCurrency(totalAssets)} vs Liabilities + Equity: ${formatCurrency(totalLiabilitiesAndEquity)}`}
      </Alert>

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
              <Typography variant="caption" color="text.secondary">Total Assets</Typography>
              <Typography variant="h5" fontWeight={800} color="success.main" sx={{ mt: 0.5 }}>
                {formatCurrency(totalAssets)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Total Liabilities</Typography>
              <Typography variant="h5" fontWeight={800} color="error.main" sx={{ mt: 0.5 }}>
                {formatCurrency(totalLiabilities)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Total Equity</Typography>
              <Typography variant="h5" fontWeight={800} color="info.main" sx={{ mt: 0.5 }}>
                {formatCurrency(totalEquity)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {isLoading ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Loading...</Typography>
      ) : (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <StatementSection title="Assets" rows={assets} total={totalAssets} tone="success" />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <StatementSection title="Liabilities" rows={liabilities} total={totalLiabilities} tone="error" />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <StatementSection title="Equity" rows={equity} total={totalEquity} tone="info" />
          </Grid>
        </Grid>
      )}

      {printOpen && (
        <PdfPrintLayout title="Balance Sheet" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
