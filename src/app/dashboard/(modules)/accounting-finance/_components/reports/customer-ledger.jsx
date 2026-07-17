'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
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
import { RouterLink } from 'src/routes/components';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { getCustomerLedgerReport } from './mock-data';
import { ReportExportActions } from './report-export-actions';
import { exportReportCsv, exportReportExcel } from './reports-export';

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

export default function CustomerLedgerReport() {
  const [customerId, setCustomerId] = useState('all');
  const [asOfDate, setAsOfDate] = useState('2026-03-29');
  const [search, setSearch] = useState('');
  const [residualFilter, setResidualFilter] = useState('all');
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  const report = useMemo(
    () => getCustomerLedgerReport({ customerId, asOfDate, search }),
    [asOfDate, customerId, search]
  );

  const customers = useMemo(
    () =>
      report.customers
        .map((customer) => ({
          ...customer,
          ledgerRows: customer.ledgerRows.filter((row) => {
            if (residualFilter === 'all') return true;
            if (residualFilter === 'overdue') return row.overdueDays > 0;
            if (residualFilter === 'open') return row.balance > 0;
            return row.balance <= 0;
          }),
        }))
        .filter((customer) => customer.ledgerRows.length > 0 || residualFilter === 'all'),
    [report.customers, residualFilter]
  );

  const exportConfig = useMemo(
    () => ({
      title: 'Customer Ledger Report',
      subtitle: `Residual posture as of ${asOfDate}`,
      summary: [
        { label: 'Customers', value: customers.length },
        { label: 'Invoiced', value: formatCurrency(report.totals.invoiced) },
        { label: 'Collected', value: formatCurrency(report.totals.collected) },
        { label: 'Outstanding', value: formatCurrency(report.totals.outstanding) },
      ],
      tables: customers.flatMap((customer) => [
        {
          title: `${customer.code} - ${customer.name}`,
          columns: [
            { key: 'number', label: 'Invoice' },
            { key: 'invoice_date', label: 'Date' },
            { key: 'due_date', label: 'Due' },
            { key: 'debit', label: 'Debit' },
            { key: 'credit', label: 'Credit' },
            { key: 'balance', label: 'Residual' },
            { key: 'overdueDays', label: 'Overdue Days' },
            { key: 'collectionStatus', label: 'Status' },
          ],
          rows: customer.ledgerRows,
        },
      ]),
      controlChecks: customers.map((customer) => ({
        label: customer.name,
        value: `${formatCurrency(customer.totals.overdue)} overdue`,
        status: customer.collectionStatus === 'follow-up' ? 'warning' : 'success',
      })),
      payload: { report, customers, filters: { customerId, asOfDate, search, residualFilter } },
    }),
    [asOfDate, customerId, customers, report, residualFilter, search]
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
                        /balance|amount|debit|credit|net|cost|budget|actual|available|variance|opening|closing|total|value|overdue|invoiced|collected|outstanding/i.test(
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
            Customer Ledger Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Statement-style customer drill-down with residual filters, overdue posture, and export
            support.
          </Typography>
        </Box>
        <ReportExportActions
          actions={[
            {
              key: 'csv',
              onClick: () =>
                runAction(
                  'Export Customer Ledger CSV',
                  () => exportReportCsv('customer-ledger-report', exportConfig),
                  'Customer ledger CSV exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'excel',
              onClick: () =>
                runAction(
                  'Export Customer Ledger Excel',
                  () => exportReportExcel('customer-ledger-report', exportConfig),
                  'Customer ledger workbook exported'
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
                label="Customer"
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
              >
                <MenuItem value="all">All Customers</MenuItem>
                {report.customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.code} - {customer.name}
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
                label="Residual Filter"
                value={residualFilter}
                onChange={(event) => setResidualFilter(event.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Search customer"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Code, name, segment, or collector"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Customers"
            value={customers.length}
            helper="Customers included in statement scope"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Outstanding"
            value={formatCurrency(report.totals.outstanding)}
            helper="Residual balance still collectible"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Overdue"
            value={formatCurrency(report.totals.overdue)}
            helper="Past due amount needing follow-up"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Collected"
            value={formatCurrency(report.totals.collected)}
            helper="Collections already received"
          />
        </Grid>
      </Grid>

      <Stack spacing={3}>
        {customers.map((customer) => (
          <Card key={customer.id} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ pb: 1 }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                spacing={2}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: '#2563eb20', color: '#2563eb' }}>
                    {customer.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      {customer.code} - {customer.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Invoiced {formatCurrency(customer.totals.invoiced)} • Collected{' '}
                      {formatCurrency(customer.totals.collected)} • Outstanding{' '}
                      {formatCurrency(customer.totals.outstanding)}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={
                      customer.collectionStatus === 'follow-up' ? 'Follow-up required' : 'Clear'
                    }
                    color={customer.collectionStatus === 'follow-up' ? 'warning' : 'success'}
                  />
                  <Button
                    component={RouterLink}
                    href={paths.dashboard.accountingFinance.reports.accountLedger}
                    size="small"
                    variant="outlined"
                    startIcon={<Iconify icon="solar:book-bold" />}
                  >
                    View Ledger
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell align="right">Debit</TableCell>
                    <TableCell align="right">Credit</TableCell>
                    <TableCell align="right">Residual</TableCell>
                    <TableCell align="right">Overdue Days</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customer.ledgerRows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Chip label={row.number} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{row.invoice_date}</TableCell>
                      <TableCell>{row.due_date}</TableCell>
                      <TableCell align="right">{formatCurrency(row.debit)}</TableCell>
                      <TableCell align="right">{formatCurrency(row.credit)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {formatCurrency(row.balance)}
                      </TableCell>
                      <TableCell align="right">{row.overdueDays}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.collectionStatus}
                          size="small"
                          color={
                            row.collectionStatus === 'follow-up'
                              ? 'warning'
                              : row.collectionStatus === 'closed'
                                ? 'success'
                                : 'default'
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        ))}
      </Stack>

      {printOpen && (
        <PdfPrintLayout title="Customer Ledger Report" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
