'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
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
import { getPartnerLedgerReport } from './mock-data';
import { ReportExportActions } from './report-export-actions';
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

export default function PartnerLedger() {
  const [partnerType, setPartnerType] = useState('all');
  const [asOfDate, setAsOfDate] = useState('2026-03-29');
  const [search, setSearch] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);
  const report = useMemo(
    () => getPartnerLedgerReport({ partnerType, asOfDate, search }),
    [asOfDate, partnerType, search]
  );

  const selectedPartner = useMemo(
    () => report.rows.find((row) => row.id === selectedPartnerId) || report.rows[0] || null,
    [report.rows, selectedPartnerId]
  );

  const exportConfig = useMemo(
    () => ({
      title: 'Partner Ledger',
      subtitle: `${partnerType} partners as of ${asOfDate}`,
      summary: [
        { label: 'Partners', value: report.rows.length },
        { label: 'Debit', value: formatCurrency(report.totals.debit) },
        { label: 'Credit', value: formatCurrency(report.totals.credit) },
        { label: 'Overdue', value: formatCurrency(report.totals.overdue) },
      ],
      tables: [
        {
          title: 'Partner balances',
          columns: [
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Partner' },
            { key: 'type', label: 'Type' },
            { key: 'riskLevel', label: 'Risk' },
            { key: 'reviewBucket', label: 'Review Bucket' },
            { key: 'transactionCount', label: 'Transactions' },
            { key: 'debit', label: 'Debit' },
            { key: 'credit', label: 'Credit' },
            { key: 'overdueAmount', label: 'Overdue' },
            { key: 'balance', label: 'Balance' },
          ],
          rows: report.rows,
        },
      ],
      controlChecks: [
        {
          label: 'Collection and payment exposure',
          value: `${report.rows.filter((row) => row.exposureStatus !== 'clear').length} partners need follow-up`,
          status: report.rows.some((row) => row.exposureStatus !== 'clear') ? 'warning' : 'success',
        },
      ],
      payload: { report, selectedPartner, filters: { partnerType, asOfDate, search } },
    }),
    [asOfDate, partnerType, report, search, selectedPartner]
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
                        /balance|amount|debit|credit|net|cost|budget|actual|available|variance|opening|closing|total|value|overdue/i.test(
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
            Partner Ledger
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Unified customer and supplier balances with overdue exposure and transaction posture.
          </Typography>
        </Box>
        <ReportExportActions
          actions={[
            {
              key: 'csv',
              onClick: () =>
                runAction(
                  'Export Partner Ledger CSV',
                  () => exportReportCsv('partner-ledger', exportConfig),
                  'Partner ledger CSV exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'excel',
              onClick: () =>
                runAction(
                  'Export Partner Ledger Excel',
                  () => exportReportExcel('partner-ledger', exportConfig),
                  'Partner ledger workbook exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'json',
              onClick: () =>
                runAction(
                  'Export Partner Ledger JSON',
                  () => exportReportJson('partner-ledger', exportConfig),
                  'Partner ledger JSON exported'
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
                label="Partner type"
                value={partnerType}
                onChange={(event) => setPartnerType(event.target.value)}
              >
                <MenuItem value="all">All partners</MenuItem>
                <MenuItem value="customer">Customers</MenuItem>
                <MenuItem value="supplier">Suppliers</MenuItem>
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
                label="Search partner"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Code, name, or risk"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Inspection partner"
                value={selectedPartnerId}
                onChange={(event) => setSelectedPartnerId(event.target.value)}
              >
                <MenuItem value="">Top exposure</MenuItem>
                {report.rows.map((row) => (
                  <MenuItem key={row.id} value={row.id}>
                    {row.code} - {row.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Partners', value: report.rows.length },
          { label: 'Customers', value: report.totals.customers },
          { label: 'Suppliers', value: report.totals.suppliers },
          { label: 'High risk', value: report.totals.highRisk },
          { label: 'Active exposure', value: report.totals.activeExposure },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, xl: 3 }}>
            <MetricCard
              label={item.label}
              value={item.value}
              helper="Current filtered partner ledger scope"
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 8 }}>
          <Alert
            severity={report.totals.activeExposure > 0 ? 'warning' : 'success'}
            sx={{ borderRadius: 2, mb: 3 }}
          >
            {report.totals.activeExposure > 0
              ? `${report.totals.activeExposure} partners require follow-up across receivable collection or payable settlement review.`
              : 'No active exposure flags in the current partner selection.'}
          </Alert>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Partner Balance Matrix
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th align="left">Partner</th>
                      <th align="left">Type</th>
                      <th align="left">Risk</th>
                      <th align="left">Review Bucket</th>
                      <th align="right">Transactions</th>
                      <th align="right">Debit</th>
                      <th align="right">Credit</th>
                      <th align="right">Overdue</th>
                      <th align="right">Balance</th>
                      <th align="right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedPartnerId(row.id)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor:
                            selectedPartner?.id === row.id ? 'rgba(37,99,235,0.06)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '12px 8px' }}>
                          <Stack spacing={0.5}>
                            <Typography variant="body2" fontWeight={700}>
                              {row.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {row.code}
                            </Typography>
                          </Stack>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <Chip
                            label={row.type}
                            size="small"
                            color={row.type === 'customer' ? 'primary' : 'warning'}
                          />
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <Chip label={row.riskLevel} size="small" variant="outlined" />
                        </td>
                        <td style={{ padding: '12px 8px' }}>{row.reviewBucket}</td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {row.transactionCount}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(row.debit)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(row.credit)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(row.overdueAmount)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px', fontWeight: 700 }}>
                          {formatCurrency(row.balance)}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <Button
                            component={RouterLink}
                            href={
                              row.type === 'customer'
                                ? paths.dashboard.accountingFinance.reports.customerLedger
                                : paths.dashboard.accountingFinance.reports.supplierLedger
                            }
                            size="small"
                            variant="outlined"
                            color="inherit"
                          >
                            View Ledger
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
        <Grid size={{ xs: 12, xl: 4 }}>
          <Stack spacing={2}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Partner Inspection
                </Typography>
                {selectedPartner ? (
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {selectedPartner.code} - {selectedPartner.name}
                    </Typography>
                    <Chip
                      label={selectedPartner.reviewBucket}
                      size="small"
                      color={selectedPartner.exposureStatus === 'clear' ? 'success' : 'warning'}
                      sx={{ width: 'fit-content' }}
                    />
                    <Typography variant="body2">
                      Type: <strong>{selectedPartner.type}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Last document:{' '}
                      <strong>{selectedPartner.lastDocumentDate || 'No activity'}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Overdue: <strong>{formatCurrency(selectedPartner.overdueAmount)}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Balance: <strong>{formatCurrency(selectedPartner.balance)}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedPartner.recommendedAction}
                    </Typography>
                    <Button
                      component={RouterLink}
                      href={
                        selectedPartner.type === 'customer'
                          ? paths.dashboard.accountingFinance.reports.customerLedger
                          : paths.dashboard.accountingFinance.reports.supplierLedger
                      }
                      variant="contained"
                      fullWidth
                    >
                      Open {selectedPartner.type === 'customer' ? 'Customer' : 'Supplier'} Ledger
                    </Button>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No partners in current scope.
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Exposure Mix
                </Typography>
                <Stack spacing={1.25}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Customer outstanding</Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {formatCurrency(report.mix.customerOutstanding)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Supplier outstanding</Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {formatCurrency(report.mix.supplierOutstanding)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Top exposure</Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {report.mix.topExposure ? report.mix.topExposure.code : 'None'}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {printOpen && (
        <PdfPrintLayout title="Partner Ledger" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
