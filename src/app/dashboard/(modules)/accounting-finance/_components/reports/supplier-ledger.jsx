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
import { getSupplierLedgerReport } from './mock-data';
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

export default function SupplierLedgerReport() {
  const [supplierId, setSupplierId] = useState('all');
  const [asOfDate, setAsOfDate] = useState('2026-03-29');
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  const report = useMemo(
    () => getSupplierLedgerReport({ supplierId, asOfDate, search }),
    [asOfDate, search, supplierId]
  );

  const suppliers = useMemo(
    () =>
      report.suppliers
        .map((supplier) => ({
          ...supplier,
          ledgerRows: supplier.ledgerRows
            .filter((row) => {
              if (paymentFilter === 'all') return true;
              if (paymentFilter === 'overdue') return row.overdueDays > 0;
              if (paymentFilter === 'scheduled') return row.paymentStatus === 'scheduled';
              return row.paymentStatus === 'cleared';
            })
            .map((row) => ({
              ...row,
              paymentLinkage:
                row.paymentStatus === 'cleared'
                  ? 'Matched payment'
                  : row.overdueDays > 0
                    ? 'Urgent payment proposal'
                    : 'Payment schedule candidate',
            })),
        }))
        .filter((supplier) => supplier.ledgerRows.length > 0 || paymentFilter === 'all'),
    [paymentFilter, report.suppliers]
  );

  const exportConfig = useMemo(
    () => ({
      title: 'Supplier Ledger Report',
      subtitle: `Vendor exposure as of ${asOfDate}`,
      summary: [
        { label: 'Suppliers', value: suppliers.length },
        { label: 'Billed', value: formatCurrency(report.totals.billed) },
        { label: 'Paid', value: formatCurrency(report.totals.paid) },
        { label: 'Outstanding', value: formatCurrency(report.totals.outstanding) },
      ],
      tables: suppliers.flatMap((supplier) => [
        {
          title: `${supplier.code} - ${supplier.name}`,
          columns: [
            { key: 'number', label: 'Bill' },
            { key: 'issue_date', label: 'Date' },
            { key: 'due_date', label: 'Due' },
            { key: 'credit', label: 'Credit' },
            { key: 'debit', label: 'Paid' },
            { key: 'balance', label: 'Outstanding' },
            { key: 'paymentLinkage', label: 'Payment Linkage' },
          ],
          rows: supplier.ledgerRows,
        },
      ]),
      controlChecks: suppliers.map((supplier) => ({
        label: supplier.name,
        value: `${formatCurrency(supplier.totals.overdue)} overdue`,
        status: supplier.paymentStatus === 'escalation' ? 'warning' : 'success',
      })),
      payload: { report, suppliers, filters: { supplierId, asOfDate, search, paymentFilter } },
    }),
    [asOfDate, paymentFilter, report, search, supplierId, suppliers]
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
                        /balance|amount|debit|credit|net|cost|budget|actual|available|variance|opening|closing|total|value|overdue|billed|paid|outstanding/i.test(
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
            Supplier Ledger Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vendor ledger with payment linkage, overdue focus, and statement-style drill-down by
            supplier.
          </Typography>
        </Box>
        <ReportExportActions
          actions={[
            {
              key: 'csv',
              onClick: () =>
                runAction(
                  'Export Supplier Ledger CSV',
                  () => exportReportCsv('supplier-ledger-report', exportConfig),
                  'Supplier ledger CSV exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'excel',
              onClick: () =>
                runAction(
                  'Export Supplier Ledger Excel',
                  () => exportReportExcel('supplier-ledger-report', exportConfig),
                  'Supplier ledger workbook exported'
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
                label="Supplier"
                value={supplierId}
                onChange={(event) => setSupplierId(event.target.value)}
              >
                <MenuItem value="all">All Suppliers</MenuItem>
                {report.suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.code} - {supplier.name}
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
                label="Payment Filter"
                value={paymentFilter}
                onChange={(event) => setPaymentFilter(event.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
                <MenuItem value="cleared">Cleared</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Search supplier"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Code, name, category, or owner"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Suppliers"
            value={suppliers.length}
            helper="Suppliers in current statement scope"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Outstanding"
            value={formatCurrency(report.totals.outstanding)}
            helper="Unpaid vendor balance"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Overdue"
            value={formatCurrency(report.totals.overdue)}
            helper="Bills needing payment escalation"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Paid"
            value={formatCurrency(report.totals.paid)}
            helper="Settlements already matched"
          />
        </Grid>
      </Grid>

      <Stack spacing={3}>
        {suppliers.map((supplier) => (
          <Card key={supplier.id} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ pb: 1 }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                spacing={2}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: '#d9770620', color: '#d97706' }}>
                    {supplier.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      {supplier.code} - {supplier.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Billed {formatCurrency(supplier.totals.billed)} • Paid{' '}
                      {formatCurrency(supplier.totals.paid)} • Outstanding{' '}
                      {formatCurrency(supplier.totals.outstanding)}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={supplier.paymentStatus === 'escalation' ? 'Payment risk' : 'Clear'}
                    color={supplier.paymentStatus === 'escalation' ? 'warning' : 'success'}
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
                    <TableCell>Bill</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell align="right">Credit</TableCell>
                    <TableCell align="right">Paid</TableCell>
                    <TableCell align="right">Outstanding</TableCell>
                    <TableCell align="right">Overdue Days</TableCell>
                    <TableCell>Payment Linkage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {supplier.ledgerRows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Chip label={row.number} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{row.issue_date}</TableCell>
                      <TableCell>{row.due_date}</TableCell>
                      <TableCell align="right">{formatCurrency(row.credit)}</TableCell>
                      <TableCell align="right">{formatCurrency(row.debit)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {formatCurrency(row.balance)}
                      </TableCell>
                      <TableCell align="right">{row.overdueDays}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.paymentLinkage}
                          size="small"
                          color={
                            row.paymentStatus === 'cleared'
                              ? 'success'
                              : row.overdueDays > 0
                                ? 'warning'
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
        <PdfPrintLayout title="Supplier Ledger Report" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
