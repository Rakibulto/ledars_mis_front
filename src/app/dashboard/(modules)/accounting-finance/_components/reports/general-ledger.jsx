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
import { getGeneralLedgerReport, getGeneralLedgerAccounts } from './mock-data';
import { exportReportCsv, exportReportJson, exportReportExcel } from './reports-export';

export default function GeneralLedgerReport() {
  const accounts = useMemo(() => getGeneralLedgerAccounts(), []);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDateValue, setToDateValue] = useState('2026-03-29');
  const [search, setSearch] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [showNarratives, setShowNarratives] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  const baseReport = useMemo(
    () => getGeneralLedgerReport({ accountId, fromDate, toDateValue, search }),
    [accountId, fromDate, search, toDateValue]
  );

  const report = useMemo(
    () => ({
      ...baseReport,
      lines: baseReport.lines.filter((line) =>
        partnerFilter === 'all' ? true : line.partnerLabel === partnerFilter
      ),
    }),
    [baseReport, partnerFilter]
  );

  const controlCounts = useMemo(
    () => ({
      partners: new Set(report.lines.map((line) => line.partnerLabel)).size,
      reviewLines: report.lines.filter((line) => line.reconciliationState === 'review').length,
      openLines: report.lines.filter((line) => line.reconciliationState === 'open').length,
    }),
    [report.lines]
  );

  const exportConfig = useMemo(
    () => ({
      title: `General Ledger - ${report.account?.code || 'Account'}`,
      subtitle: `${report.account?.name || 'Account'} | ${fromDate} to ${toDateValue} | ${partnerFilter === 'all' ? 'all partners' : partnerFilter}`,
      summary: [
        { label: 'Opening balance', value: formatCurrency(report.openingBalance) },
        { label: 'Debit total', value: formatCurrency(report.debitTotal) },
        { label: 'Credit total', value: formatCurrency(report.creditTotal) },
        { label: 'Closing balance', value: formatCurrency(report.closingBalance) },
      ],
      tables: [
        {
          title: 'Ledger lines',
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'reference', label: 'Reference' },
            { key: 'journalName', label: 'Journal' },
            { key: 'description', label: 'Description' },
            { key: 'partnerLabel', label: 'Partner' },
            { key: 'debit', label: 'Debit' },
            { key: 'credit', label: 'Credit' },
            { key: 'runningBalance', label: 'Running Balance' },
            { key: 'reconciliationState', label: 'Reconciliation' },
          ],
          rows: report.lines,
        },
      ],
      controlChecks: [
        {
          label: 'Posting span',
          value: report.lines.length
            ? `${report.lines[0].date} to ${report.lines.at(-1).date}`
            : 'No movement in range',
          status: report.lines.length ? 'info' : 'warning',
        },
        {
          label: 'Lines needing review',
          value: `${controlCounts.reviewLines} review and ${controlCounts.openLines} open lines`,
          status: controlCounts.reviewLines || controlCounts.openLines ? 'warning' : 'success',
        },
      ],
      payload: {
        report,
        filters: { accountId, fromDate, toDateValue, search, partnerFilter, showNarratives },
      },
    }),
    [
      accountId,
      controlCounts.openLines,
      controlCounts.reviewLines,
      fromDate,
      partnerFilter,
      report,
      search,
      showNarratives,
      toDateValue,
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
            General Ledger
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Drill into journal lines with running balance, posting references, and exportable audit
            support.
          </Typography>
        </Box>
        <ReportExportActions
          actions={[
            {
              key: 'csv',
              onClick: () =>
                runAction(
                  'Export General Ledger CSV',
                  () => exportReportCsv('general-ledger', exportConfig),
                  'General ledger CSV exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'excel',
              onClick: () =>
                runAction(
                  'Export General Ledger Excel',
                  () => exportReportExcel('general-ledger', exportConfig),
                  'General ledger workbook exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'json',
              onClick: () =>
                runAction(
                  'Export General Ledger JSON',
                  () => exportReportJson('general-ledger', exportConfig),
                  'General ledger JSON exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'print',
              onClick: () => setPrintOpen(true),
              disabled: pendingAction !== null,
            },
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
                label="Account"
                value={accountId}
                onChange={(event) => setAccountId(event.target.value)}
              >
                {accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                type="date"
                label="From"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                type="date"
                label="To"
                value={toDateValue}
                onChange={(event) => setToDateValue(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                label="Search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Reference or memo"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Partner"
                value={partnerFilter}
                onChange={(event) => setPartnerFilter(event.target.value)}
              >
                <MenuItem value="all">All partners</MenuItem>
                {baseReport.partnerOptions.map((partner) => (
                  <MenuItem key={partner} value={partner}>
                    {partner}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                fullWidth
                variant={showNarratives ? 'contained' : 'outlined'}
                onClick={() => setShowNarratives((current) => !current)}
              >
                {showNarratives ? 'Fold Lines' : 'Unfold Lines'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Opening balance', value: formatCurrency(report.openingBalance) },
          { label: 'Debit total', value: formatCurrency(report.debitTotal) },
          { label: 'Credit total', value: formatCurrency(report.creditTotal) },
          { label: 'Partner focus', value: controlCounts.partners },
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

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {report.account?.code} - {report.account?.name}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip label={report.account?.typeName || 'Unclassified'} size="small" />
                <Chip label={`${report.lines.length} lines`} size="small" variant="outlined" />
                <Chip
                  label={`${controlCounts.reviewLines} review`}
                  size="small"
                  color={controlCounts.reviewLines ? 'warning' : 'default'}
                  variant="outlined"
                />
              </Stack>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Running balance shows the cumulative posting effect inside the selected range, now
              with partner focus and reconciliation posture.
            </Typography>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th align="left">Date</th>
                  <th align="left">Reference</th>
                  <th align="left">Journal</th>
                  <th align="left">Partner</th>
                  <th align="left">Description</th>
                  <th align="right">Debit</th>
                  <th align="right">Credit</th>
                  <th align="right">Running Balance</th>
                  <th align="left">Reconciliation</th>
                  <th align="right">Action</th>
                </tr>
              </thead>
              <tbody>
                {report.lines.map((row) => (
                  <tr key={row.id}>
                    <td style={{ padding: '12px 8px' }}>{row.date}</td>
                    <td style={{ padding: '12px 8px' }}>{row.reference}</td>
                    <td style={{ padding: '12px 8px' }}>{row.journalName}</td>
                    <td style={{ padding: '12px 8px' }}>{row.partnerLabel}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <Stack spacing={0.5}>
                        <span>{row.description}</span>
                        {showNarratives ? (
                          <Typography variant="caption" color="text.secondary">
                            Move line {row.id} | Account {row.account_code}
                          </Typography>
                        ) : null}
                      </Stack>
                    </td>
                    <td align="right" style={{ padding: '12px 8px' }}>
                      {formatCurrency(row.debit)}
                    </td>
                    <td align="right" style={{ padding: '12px 8px' }}>
                      {formatCurrency(row.credit)}
                    </td>
                    <td align="right" style={{ padding: '12px 8px', fontWeight: 700 }}>
                      {formatCurrency(row.runningBalance)}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <Chip
                        label={row.reconciliationState}
                        size="small"
                        color={
                          row.reconciliationState === 'review'
                            ? 'warning'
                            : row.reconciliationState === 'matched'
                              ? 'success'
                              : 'default'
                        }
                      />
                    </td>
                    <td align="right" style={{ padding: '12px 8px' }}>
                      <Button
                        component={NextLink}
                        href={paths.dashboard.accountingFinance.transactions.generalLedgerPostingDetail(
                          row.journal_entry_id
                        )}
                        size="small"
                      >
                        View Move
                      </Button>
                    </td>
                  </tr>
                ))}
                {!report.lines.length ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '24px 8px', textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No ledger lines found for the selected period.
                      </Typography>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </Box>
        </CardContent>
      </Card>

      {printOpen && (
        <PdfPrintLayout title="General Ledger" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
