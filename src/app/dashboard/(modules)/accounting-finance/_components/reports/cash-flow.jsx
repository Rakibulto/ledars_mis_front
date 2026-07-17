'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import useSWR from 'swr';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import { fetcher, endpoints } from 'src/utils/axios';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { formatCurrency } from '../utils';
import { ReportExportActions } from './report-export-actions';
import { exportReportJson, exportReportExcel } from './reports-export';

function SectionCard({ title, rows, total }) {
  return (
    <Card sx={{ height: '100%', borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} sx={{ textTransform: 'capitalize', mb: 2 }}>
          {title}
        </Typography>
        <Stack spacing={1.5}>
          {rows.map((item) => (
            <Stack key={item.name} direction="row" justifyContent="space-between" spacing={2}>
              <Typography variant="body2">{item.name}</Typography>
              <Typography variant="body2" fontWeight={700}>
                {formatCurrency(item.amount)}
              </Typography>
            </Stack>
          ))}
        </Stack>
        <Stack
          direction="row"
          justifyContent="space-between"
          sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}
        >
          <Typography variant="subtitle2">Total</Typography>
          <Typography variant="subtitle2" fontWeight={800}>
            {formatCurrency(total)}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function CashFlow() {
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

  // Cash flow is derived from bank/cash accounts
  // Opening = bank/cash account opening balances
  // Inflows = period debits to bank/cash (money received)
  // Outflows = period credits to bank/cash (money spent)
  const cashFlowData = useMemo(() => {
    // Find bank/cash accounts (asset classification, bank_cash liquidity or code 10/11)
    const bankAccounts = allAccounts.filter((acc) => {
      const isAsset = acc.classification === 'asset';
      const isBankCash = acc.code?.startsWith('10') || acc.code?.startsWith('11');
      return isAsset && isBankCash;
    });

    const openingBalance = bankAccounts.reduce(
      (sum, acc) => sum + (acc.opening_dr || 0) - (acc.opening_cr || 0), 0
    );

    const totalInflows = bankAccounts.reduce(
      (sum, acc) => sum + (acc.period_dr || 0), 0
    );

    const totalOutflows = bankAccounts.reduce(
      (sum, acc) => sum + (acc.period_cr || 0), 0
    );

    const netChange = totalInflows - totalOutflows;
    const closingBalance = openingBalance + netChange;

    // Breakdown by account
    const inflowRows = bankAccounts
      .filter((acc) => (acc.period_dr || 0) > 0)
      .map((acc) => ({ name: `${acc.code} - ${acc.name}`, amount: acc.period_dr }))
      .sort((a, b) => b.amount - a.amount);

    const outflowRows = bankAccounts
      .filter((acc) => (acc.period_cr || 0) > 0)
      .map((acc) => ({ name: `${acc.code} - ${acc.name}`, amount: acc.period_cr }))
      .sort((a, b) => b.amount - a.amount);

    return { openingBalance, totalInflows, totalOutflows, netChange, closingBalance, inflowRows, outflowRows };
  }, [allAccounts]);

  const exportConfig = useMemo(
    () => ({
      title: 'Cash Flow Statement',
      subtitle: `${dateFrom} to ${dateTo}`,
      summary: [
        { label: 'Opening balance', value: formatCurrency(cashFlowData.openingBalance) },
        { label: 'Net change', value: formatCurrency(cashFlowData.netChange) },
        { label: 'Closing balance', value: formatCurrency(cashFlowData.closingBalance) },
      ],
    }),
    [dateFrom, dateTo, cashFlowData]
  );

  const printContent = (
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Cash Flow — {dateFrom} to {dateTo}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead><tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Line</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>Amount</th>
        </tr></thead>
        <tbody>
          <tr><td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 600 }}>Opening Balance</td><td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(cashFlowData.openingBalance)}</td></tr>
          {cashFlowData.inflowRows.map((row) => (
            <tr key={row.name}><td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{row.name}</td><td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(row.amount)}</td></tr>
          ))}
          <tr><td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 600 }}>Total Inflows</td><td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(cashFlowData.totalInflows)}</td></tr>
          {cashFlowData.outflowRows.map((row) => (
            <tr key={row.name}><td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{row.name}</td><td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(row.amount)}</td></tr>
          ))}
          <tr><td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 600 }}>Total Outflows</td><td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(cashFlowData.totalOutflows)}</td></tr>
          <tr><td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 600 }}>Net Change</td><td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(cashFlowData.netChange)}</td></tr>
          <tr><td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 600 }}>Closing Balance</td><td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(cashFlowData.closingBalance)}</td></tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Cash Flow Statement</Typography>
          <Typography variant="body2" color="text.secondary">
            Cash inflows and outflows from your bank and cash accounts.
          </Typography>
        </Box>
        <ReportExportActions
          actions={[
            { key: 'json', onClick: () => exportReportJson('cash-flow', exportConfig), disabled: pendingAction !== null },
            { key: 'excel', onClick: () => exportReportExcel('cash-flow', exportConfig), disabled: pendingAction !== null },
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
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Opening Balance</Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>{formatCurrency(cashFlowData.openingBalance)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Cash Inflows</Typography>
              <Typography variant="h5" fontWeight={800} color="success.main" sx={{ mt: 0.5 }}>{formatCurrency(cashFlowData.totalInflows)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Cash Outflows</Typography>
              <Typography variant="h5" fontWeight={800} color="error.main" sx={{ mt: 0.5 }}>{formatCurrency(cashFlowData.totalOutflows)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Closing Balance</Typography>
              <Typography variant="h5" fontWeight={800} color={cashFlowData.netChange >= 0 ? 'success.main' : 'error.main'} sx={{ mt: 0.5 }}>{formatCurrency(cashFlowData.closingBalance)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {isLoading ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Loading...</Typography>
      ) : (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <SectionCard title="Cash Inflows" rows={cashFlowData.inflowRows} total={cashFlowData.totalInflows} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <SectionCard title="Cash Outflows" rows={cashFlowData.outflowRows} total={cashFlowData.totalOutflows} />
          </Grid>
        </Grid>
      )}

      <Card sx={{ mt: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={700}>Net Cash Flow</Typography>
            <Typography variant="h5" fontWeight={800} color={cashFlowData.netChange >= 0 ? 'success.main' : 'error.main'}>
              {formatCurrency(cashFlowData.netChange)}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {printOpen && (
        <PdfPrintLayout title="Cash Flow Statement" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
