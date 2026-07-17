'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { formatCurrency } from '../utils';
import { getJournalReport } from './mock-data';
import { ReportExportActions } from './report-export-actions';
import { exportReportCsv, exportReportJson, exportReportExcel } from './reports-export';

export default function JournalReport() {
  const [journalId, setJournalId] = useState('all');
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDateValue, setToDateValue] = useState('2026-03-29');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);
  const report = useMemo(
    () => getJournalReport({ journalId, fromDate, toDateValue, statusFilter, search }),
    [fromDate, journalId, search, statusFilter, toDateValue]
  );

  const exportConfig = useMemo(
    () => ({
      title: 'Journal Report',
      subtitle: `${fromDate} to ${toDateValue}`,
      summary: [
        { label: 'Entries', value: report.totals.entries },
        { label: 'Debit', value: formatCurrency(report.totals.debit) },
        { label: 'Credit', value: formatCurrency(report.totals.credit) },
        { label: 'Drafts', value: report.totals.drafts },
      ],
      tables: [
        {
          title: 'Journal entries',
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'number', label: 'Entry' },
            { key: 'journal_name', label: 'Journal' },
            { key: 'reference', label: 'Reference' },
            { key: 'partnerMix', label: 'Partners' },
            { key: 'lineCount', label: 'Lines' },
            { key: 'debitTotal', label: 'Debit' },
            { key: 'creditTotal', label: 'Credit' },
            { key: 'status', label: 'Status' },
          ],
          rows: report.rows,
        },
      ],
      controlChecks: [
        {
          label: 'Draft entries awaiting posting',
          value: report.totals.drafts,
          status: report.totals.drafts ? 'warning' : 'success',
        },
        {
          label: 'Posting history coverage',
          value: `${report.historyByJournal.length} journals with activity`,
          status: report.historyByJournal.length ? 'info' : 'warning',
        },
      ],
      payload: { report, filters: { journalId, fromDate, toDateValue, statusFilter, search } },
    }),
    [fromDate, journalId, report, search, statusFilter, toDateValue]
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
                        /balance|amount|debit|credit|net|cost|budget|actual|available|variance|opening|closing|total|value|entries/i.test(
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
            Journal Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Posting register by journal with line counts, references, and draft review exposure.
          </Typography>
        </Box>
        <ReportExportActions
          actions={[
            {
              key: 'csv',
              onClick: () =>
                runAction(
                  'Export Journal Report CSV',
                  () => exportReportCsv('journal-report', exportConfig),
                  'Journal report CSV exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'excel',
              onClick: () =>
                runAction(
                  'Export Journal Report Excel',
                  () => exportReportExcel('journal-report', exportConfig),
                  'Journal report workbook exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'json',
              onClick: () =>
                runAction(
                  'Export Journal Report JSON',
                  () => exportReportJson('journal-report', exportConfig),
                  'Journal report JSON exported'
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
                label="Journal"
                value={journalId}
                onChange={(event) => setJournalId(event.target.value)}
              >
                <MenuItem value="all">All journals</MenuItem>
                {report.journals.map((journal) => (
                  <MenuItem key={journal.id} value={journal.id}>
                    {journal.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 2.25 }}>
              <TextField
                fullWidth
                type="date"
                label="From"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2.25 }}>
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
                select
                fullWidth
                label="Status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="posted">Posted</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 2.5 }}>
              <TextField
                fullWidth
                label="Search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Entry, journal, or memo"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Entries', value: report.totals.entries },
          { label: 'Debit', value: formatCurrency(report.totals.debit) },
          { label: 'Credit', value: formatCurrency(report.totals.credit) },
          { label: 'Drafts', value: report.totals.drafts },
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
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th align="left">Date</th>
                      <th align="left">Entry</th>
                      <th align="left">Journal</th>
                      <th align="left">Reference</th>
                      <th align="left">Partners</th>
                      <th align="right">Lines</th>
                      <th align="right">Debit</th>
                      <th align="right">Credit</th>
                      <th align="left">Status</th>
                      <th align="right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((row) => (
                      <tr key={row.id}>
                        <td style={{ padding: '12px 8px' }}>{row.date}</td>
                        <td style={{ padding: '12px 8px', fontWeight: 700 }}>{row.number}</td>
                        <td style={{ padding: '12px 8px' }}>{row.journal_name}</td>
                        <td style={{ padding: '12px 8px' }}>{row.reference}</td>
                        <td style={{ padding: '12px 8px' }}>
                          {row.partnerMix.join(', ') || 'Internal'}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {row.lineCount}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(row.debitTotal)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(row.creditTotal)}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <Chip
                            label={row.reviewState}
                            size="small"
                            color={row.status === 'posted' ? 'success' : 'warning'}
                          />
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          <Button
                            size="small"
                            component={RouterLink}
                            href={paths.dashboard.accountingFinance.reports.journalReportEntryDetail(
                              row.id
                            )}
                          >
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
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700}>
                Journal Posting History
              </Typography>
              <Stack spacing={1.25} sx={{ mt: 2 }}>
                {report.historyByJournal.map((row) => (
                  <Card key={row.id} variant="outlined">
                    <CardContent sx={{ py: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between" spacing={2}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {row.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.entries} entries • {row.drafts} drafts
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={700}>
                          {formatCurrency(row.debit)}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {printOpen && (
        <PdfPrintLayout title="Journal Report" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
