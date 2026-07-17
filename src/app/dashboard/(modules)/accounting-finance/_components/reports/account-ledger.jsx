'use client';

import { toast } from 'sonner';
import NextLink from 'next/link';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { formatCurrency } from '../utils';
import { ReportExportActions } from './report-export-actions';
import { getReportAccountTypes, getAccountLedgerReport } from './mock-data';
import { exportReportCsv, exportReportJson, exportReportExcel } from './reports-export';

export default function AccountLedger() {
  const accountTypes = useMemo(() => getReportAccountTypes(), []);
  const [typeFilter, setTypeFilter] = useState('all');
  const [asOfDate, setAsOfDate] = useState('2026-03-29');
  const [search, setSearch] = useState('');
  const [reconciliationFilter, setReconciliationFilter] = useState('all');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  const rawRows = useMemo(
    () => getAccountLedgerReport({ typeFilter, asOfDate, search }),
    [asOfDate, search, typeFilter]
  );
  const rows = useMemo(
    () =>
      rawRows.filter((row) =>
        reconciliationFilter === 'all' ? true : row.reconciliationState === reconciliationFilter
      ),
    [rawRows, reconciliationFilter]
  );
  const selectedAccount =
    rows.find((row) => String(row.id) === String(selectedAccountId)) || rows[0] || null;
  const totals = useMemo(
    () => ({
      balance: rows.reduce((sum, row) => sum + Number(row.balance || 0), 0),
      debit: rows.reduce((sum, row) => sum + Number(row.debitTotal || 0), 0),
      credit: rows.reduce((sum, row) => sum + Number(row.creditTotal || 0), 0),
      reviews: rows.filter((row) => row.reconciliationState === 'review').length,
    }),
    [rows]
  );

  const exportConfig = useMemo(
    () => ({
      title: 'Account Ledger',
      subtitle: `As of ${asOfDate}`,
      summary: [
        { label: 'Accounts', value: rows.length },
        { label: 'Balance', value: formatCurrency(totals.balance) },
        { label: 'Debit movement', value: formatCurrency(totals.debit) },
        { label: 'Credit movement', value: formatCurrency(totals.credit) },
      ],
      tables: [
        {
          title: 'Account exposure',
          columns: [
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Name' },
            { key: 'typeName', label: 'Type' },
            { key: 'movementCount', label: 'Movements' },
            { key: 'partnerLabel', label: 'Partners' },
            { key: 'reconciliationState', label: 'Reconciliation' },
            { key: 'balance', label: 'Balance' },
          ],
          rows: rows.map((row) => ({
            ...row,
            partnerLabel: row.partnerFocus.join(', ') || 'Internal',
          })),
        },
      ],
      controlChecks: [
        {
          label: 'Accounts in review',
          value: totals.reviews,
          status: totals.reviews ? 'warning' : 'success',
        },
      ],
      payload: {
        rows,
        totals,
        selectedAccount,
        filters: { typeFilter, asOfDate, search, reconciliationFilter },
      },
    }),
    [asOfDate, reconciliationFilter, rows, search, selectedAccount, totals, typeFilter]
  );

  const printContent = (
    <div>
      {exportConfig.tables.map((table) => (
        <div key={table.title} style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, margin: '16px 0 8px' }}>{table.title}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {table.columns.map((column) => (
                  <th
                    key={column.key}
                    style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, index) => (
                <tr key={row.id || index}>
                  {table.columns.map((column) => {
                    const value = row[column.key];
                    return (
                      <td key={column.key} style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                        {typeof value === 'number' &&
                        /balance|amount|debit|credit|net|cost|budget|actual|available|variance|opening|closing|total|value/i.test(
                          column.key
                        )
                          ? formatCurrency(value)
                          : value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );

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

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Account Ledger
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Account-by-account review with movement counts, balance posture, and reconciliation
            focus.
          </Typography>
        </Box>
        <ReportExportActions
          actions={[
            {
              key: 'csv',
              onClick: () =>
                runAction(
                  'Export Account Ledger CSV',
                  () => exportReportCsv('account-ledger', exportConfig),
                  'Account ledger CSV exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'excel',
              onClick: () =>
                runAction(
                  'Export Account Ledger Excel',
                  () => exportReportExcel('account-ledger', exportConfig),
                  'Account ledger workbook exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'json',
              onClick: () =>
                runAction(
                  'Export Account Ledger JSON',
                  () => exportReportJson('account-ledger', exportConfig),
                  'Account ledger JSON exported'
                ),
              disabled: pendingAction !== null,
            },
            { key: 'print', onClick: () => setPrintOpen(true), disabled: pendingAction !== null },
          ]}
        />
      </Stack>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Account type"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                <MenuItem value="all">All types</MenuItem>
                {accountTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="date"
                label="As of"
                value={asOfDate}
                onChange={(event) => setAsOfDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Code, name, or type"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Reconciliation"
                value={reconciliationFilter}
                onChange={(event) => setReconciliationFilter(event.target.value)}
              >
                <MenuItem value="all">All states</MenuItem>
                <MenuItem value="review">Review</MenuItem>
                <MenuItem value="clear">Clear</MenuItem>
                <MenuItem value="not-applicable">Not applicable</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Accounts', value: rows.length },
          { label: 'Balance', value: formatCurrency(totals.balance) },
          { label: 'Debit movement', value: formatCurrency(totals.debit) },
          { label: 'Accounts in review', value: totals.reviews },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, xl: 3 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th align="left">Code</th>
                      <th align="left">Name</th>
                      <th align="left">Type</th>
                      <th align="right">Movements</th>
                      <th align="left">Partners</th>
                      <th align="left">Reconciliation</th>
                      <th align="right">Balance</th>
                      <th align="right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td style={{ padding: '12px 8px' }}>{row.code}</td>
                        <td style={{ padding: '12px 8px' }}>{row.name}</td>
                        <td style={{ padding: '12px 8px' }}>{row.typeName}</td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {row.movementCount}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          {row.partnerFocus.join(', ') || 'Internal'}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <Chip
                            label={row.reconciliationState}
                            size="small"
                            color={row.reconciliationState === 'review' ? 'warning' : 'default'}
                            variant={row.reconciliationState === 'review' ? 'filled' : 'outlined'}
                          />
                        </td>
                        <td align="right" style={{ padding: '12px 8px', fontWeight: 700 }}>
                          {formatCurrency(row.balance)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          <Button size="small" onClick={() => setSelectedAccountId(row.id)}>
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700}>
                {selectedAccount
                  ? `${selectedAccount.code} - ${selectedAccount.name}`
                  : 'Select an account'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Deep ledger review with recent movements, partner focus, and open-item posture.
              </Typography>
              {selectedAccount ? (
                <>
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
                    <Chip label={`${selectedAccount.movementCount} movements`} size="small" />
                    <Chip
                      label={`${selectedAccount.openItemCount} open items`}
                      size="small"
                      color={selectedAccount.openItemCount ? 'warning' : 'default'}
                    />
                    <Chip
                      label={selectedAccount.reconciliationState}
                      size="small"
                      color={
                        selectedAccount.reconciliationState === 'review' ? 'warning' : 'default'
                      }
                    />
                  </Stack>
                  <Divider sx={{ my: 2 }} />
                  <Stack spacing={1.25}>
                    {selectedAccount.recentLines.map((line) => (
                      <Card key={line.id} variant="outlined">
                        <CardContent sx={{ py: 1.5 }}>
                          <Stack direction="row" justifyContent="space-between" spacing={2}>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={700}>
                                {line.journal_entry_number}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {line.date} • {line.partnerLabel}
                              </Typography>
                            </Box>
                            <Typography variant="body2" fontWeight={700}>
                              {formatCurrency(Number(line.debit || 0) - Number(line.credit || 0))}
                            </Typography>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                  <Divider sx={{ my: 2 }} />
                  <Button
                    component={NextLink}
                    href={paths.dashboard.accountingFinance.reports.generalLedger}
                    variant="contained"
                    fullWidth
                  >
                    Open General Ledger
                  </Button>
                </>
              ) : null}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {printOpen && (
        <PdfPrintLayout title="Account Ledger" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
