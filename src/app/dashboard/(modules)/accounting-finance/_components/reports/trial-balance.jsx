'use client';

import { toast } from 'sonner';
import NextLink from 'next/link';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { formatCurrency } from '../utils';
import { ReportExportActions } from './report-export-actions';
import { getReportFiscalYears, getTrialBalanceReport } from './mock-data';
import { exportReportCsv, exportReportJson, exportReportExcel } from './reports-export';

function MetricCard({ label, value, helper }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {helper}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function TrialBalance() {
  const fiscalYears = useMemo(() => getReportFiscalYears(), []);
  const [fiscalYearId, setFiscalYearId] = useState(fiscalYears[1]?.id || fiscalYears[0]?.id || '');
  const [asOfDate, setAsOfDate] = useState('2026-03-29');
  const [search, setSearch] = useState('');
  const [exportProfile, setExportProfile] = useState('comparative');
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  const baseReport = useMemo(
    () => getTrialBalanceReport({ fiscalYearId, asOfDate, search }),
    [asOfDate, fiscalYearId, search]
  );

  const comparisonFactor =
    exportProfile === 'audit' ? 0.88 : exportProfile === 'comparative' ? 0.92 : 1;

  const rows = useMemo(
    () =>
      baseReport.rows.map((row) => {
        const currentClosing = Math.abs(Number(row.balance || 0));
        const currentMovement = Number(row.debit || 0) + Number(row.credit || 0);
        const openingBalance = Math.max(currentClosing - currentMovement * 0.72, 0);
        const comparativeClosing = currentClosing * comparisonFactor;
        const variance = currentClosing - comparativeClosing;

        return {
          ...row,
          openingBalance,
          closingBalance: currentClosing,
          comparativeClosing,
          variance,
          varianceStatus: Math.abs(variance) > currentClosing * 0.12 ? 'watch' : 'stable',
        };
      }),
    [baseReport.rows, comparisonFactor]
  );

  const totals = useMemo(
    () => ({
      opening: rows.reduce((sum, row) => sum + row.openingBalance, 0),
      debit: rows.reduce((sum, row) => sum + Number(row.debit || 0), 0),
      credit: rows.reduce((sum, row) => sum + Number(row.credit || 0), 0),
      closing: rows.reduce((sum, row) => sum + row.closingBalance, 0),
      comparative: rows.reduce((sum, row) => sum + row.comparativeClosing, 0),
    }),
    [rows]
  );

  const exportConfig = useMemo(
    () => ({
      title: 'Trial Balance',
      subtitle: `${fiscalYears.find((year) => String(year.id) === String(fiscalYearId))?.name || fiscalYearId} | ${asOfDate} | ${exportProfile} profile`,
      summary: [
        { label: 'Opening balances', value: formatCurrency(totals.opening) },
        { label: 'Debit', value: formatCurrency(totals.debit) },
        { label: 'Credit', value: formatCurrency(totals.credit) },
        { label: 'Comparative closing', value: formatCurrency(totals.comparative) },
      ],
      controlChecks: [
        {
          label: 'Balance control',
          value:
            baseReport.controlStatus === 'balanced'
              ? 'Trial balance is in balance'
              : `Difference ${formatCurrency(baseReport.totals.difference)}`,
          status: baseReport.controlStatus === 'balanced' ? 'success' : 'warning',
        },
        {
          label: 'Variance watchlist',
          value: `${rows.filter((row) => row.varianceStatus === 'watch').length} accounts above tolerance`,
          status: rows.some((row) => row.varianceStatus === 'watch') ? 'warning' : 'success',
        },
      ],
      tables: [
        {
          title: 'Trial Balance Detail',
          columns: [
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Account' },
            { key: 'typeName', label: 'Type' },
            { key: 'openingBalance', label: 'Opening' },
            { key: 'debit', label: 'Debit' },
            { key: 'credit', label: 'Credit' },
            { key: 'closingBalance', label: 'Closing' },
            { key: 'comparativeClosing', label: 'Comparative' },
            { key: 'variance', label: 'Variance' },
          ],
          rows,
        },
      ],
      payload: { rows, totals, filters: { fiscalYearId, asOfDate, search, exportProfile } },
    }),
    [
      asOfDate,
      baseReport.controlStatus,
      baseReport.totals.difference,
      exportProfile,
      fiscalYearId,
      fiscalYears,
      rows,
      totals,
    ]
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
            Trial Balance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comparative trial balance with opening posture, closing movement, and audit export
            profiles.
          </Typography>
        </Box>
        <ReportExportActions
          actions={[
            {
              key: 'csv',
              onClick: () =>
                runAction(
                  'Export Trial Balance CSV',
                  () => exportReportCsv('trial-balance', exportConfig),
                  'Trial balance CSV exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'excel',
              onClick: () =>
                runAction(
                  'Export Trial Balance Excel',
                  () => exportReportExcel('trial-balance', exportConfig),
                  'Trial balance workbook exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'json',
              onClick: () =>
                runAction(
                  'Export Trial Balance JSON',
                  () => exportReportJson('trial-balance', exportConfig),
                  'Trial balance JSON exported'
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
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                label="Fiscal Year"
                value={fiscalYearId}
                onChange={(event) => setFiscalYearId(event.target.value)}
              >
                {fiscalYears.map((year) => (
                  <MenuItem key={year.id} value={year.id}>
                    {year.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                type="date"
                label="As of"
                value={asOfDate}
                onChange={(event) => setAsOfDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                label="Export Profile"
                value={exportProfile}
                onChange={(event) => setExportProfile(event.target.value)}
              >
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="comparative">Comparative</MenuItem>
                <MenuItem value="audit">Audit Pack</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Search account"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Code, name, or type"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Opening balance"
            value={formatCurrency(totals.opening)}
            helper="Opening posture before current period movement"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Debit"
            value={formatCurrency(totals.debit)}
            helper="Total debit movement in scope"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Credit"
            value={formatCurrency(totals.credit)}
            helper="Total credit movement in scope"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Comparative gap"
            value={formatCurrency(totals.closing - totals.comparative)}
            helper="Closing versus comparative period"
          />
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Account</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Opening</TableCell>
                <TableCell align="right">Debit</TableCell>
                <TableCell align="right">Credit</TableCell>
                <TableCell align="right">Closing</TableCell>
                <TableCell align="right">Comparative</TableCell>
                <TableCell align="right">Variance</TableCell>
                <TableCell align="right">Drilldown</TableCell>
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
                      <Chip
                        label={row.varianceStatus === 'watch' ? 'Variance watch' : 'Stable'}
                        size="small"
                        color={row.varianceStatus === 'watch' ? 'warning' : 'default'}
                        variant="outlined"
                        sx={{ width: 'fit-content' }}
                      />
                    </Stack>
                  </TableCell>
                  <TableCell>{row.typeName}</TableCell>
                  <TableCell align="right">{formatCurrency(row.openingBalance)}</TableCell>
                  <TableCell align="right">{formatCurrency(row.debit)}</TableCell>
                  <TableCell align="right">{formatCurrency(row.credit)}</TableCell>
                  <TableCell align="right">{formatCurrency(row.closingBalance)}</TableCell>
                  <TableCell align="right">{formatCurrency(row.comparativeClosing)}</TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: row.variance >= 0 ? 'success.main' : 'error.main',
                      fontWeight: 700,
                    }}
                  >
                    {formatCurrency(row.variance)}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      component={NextLink}
                      href={paths.dashboard.accountingFinance.reports.accountLedger}
                      size="small"
                      variant="text"
                    >
                      Account Ledger
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell colSpan={2}>
                  <Typography fontWeight={700}>Totals</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700}>{formatCurrency(totals.opening)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700}>{formatCurrency(totals.debit)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700}>{formatCurrency(totals.credit)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700}>{formatCurrency(totals.closing)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700}>{formatCurrency(totals.comparative)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700}>
                    {formatCurrency(totals.closing - totals.comparative)}
                  </Typography>
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {printOpen && (
        <PdfPrintLayout title="Trial Balance" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
