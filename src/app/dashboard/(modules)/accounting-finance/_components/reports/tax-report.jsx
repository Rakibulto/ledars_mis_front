'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import useSWR from 'swr';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { Iconify } from 'src/components/iconify';
import { fetcher, endpoints } from 'src/utils/axios';

import { formatCurrency } from '../utils';
import { ReportExportActions } from './report-export-actions';
import { exportReportCsv, exportReportJson, exportReportExcel } from './reports-export';

const PERIODS = [
  { id: 'mar_2026', label: 'Mar 2026', from: '2026-03-01', to: '2026-03-31' },
  { id: 'q1_2026', label: 'Q1 2026', from: '2026-01-01', to: '2026-03-31' },
  { id: 'fy_2026', label: 'FY 2026', from: '2026-01-01', to: '2026-12-31' },
];

function withinRange(date, from, to) {
  return (!from || date >= from) && (!to || date <= to);
}

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

export default function TaxReport() {
  const [periodId, setPeriodId] = useState('q1_2026');
  const [taxTypeFilter, setTaxTypeFilter] = useState('all');
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  const period = PERIODS.find((item) => item.id === periodId) || PERIODS[1];

  // Fetch real data from APIs
  const { data: rawBills } = useSWR(endpoints.accounting.bills, fetcher);
  const { data: rawInvoices } = useSWR(endpoints.accounting.customer_invoices, fetcher);

  const allBills = useMemo(() => {
    const list = Array.isArray(rawBills) ? rawBills : Array.isArray(rawBills?.results) ? rawBills.results : [];
    return list;
  }, [rawBills]);

  const allInvoices = useMemo(() => {
    const list = Array.isArray(rawInvoices) ? rawInvoices : Array.isArray(rawInvoices?.results) ? rawInvoices.results : [];
    return list;
  }, [rawInvoices]);

  const billRows = useMemo(() => {
    let list = allBills.filter((bill) => withinRange(bill.bill_date, period.from, period.to));
    if (taxTypeFilter === 'sales') return [];
    return list;
  }, [allBills, period.from, period.to, taxTypeFilter]);
  const invoiceRows = useMemo(() => {
    let list = allInvoices.filter((inv) => withinRange(inv.invoice_date || inv.bill_date, period.from, period.to));
    if (taxTypeFilter === 'purchase') return [];
    return list;
  }, [allInvoices, period.from, period.to, taxTypeFilter]);

  // Calculate tax from actual bill/invoice tax_amount fields (not from tax definitions)
  const inputTax = useMemo(
    () => billRows.reduce((sum, bill) => sum + Number(bill.tax_amount || 0), 0),
    [billRows]
  );
  const outputTax = useMemo(
    () => invoiceRows.reduce((sum, inv) => sum + Number(inv.tax_amount || 0), 0),
    [invoiceRows]
  );
  const netTax = outputTax - inputTax;

  // Build document rows with actual tax amounts from bills and invoices
  const documentRows = useMemo(() => {
    const billDocs = billRows.map((bill) => ({
      id: `bill-${bill.id}`,
      type: 'Vendor Bill',
      number: bill.bill_number || bill.number || `BILL-${bill.id}`,
      partner: bill.vendor_name || bill.vendor_detail?.name || '',
      date: bill.bill_date || '',
      base: Number(bill.subtotal || bill.total_amount || 0),
      tax: Number(bill.tax_amount || 0),
      status: bill.status,
      taxType: 'purchase',
    }));
    const invoiceDocs = invoiceRows.map((inv) => ({
      id: `inv-${inv.id}`,
      type: 'Customer Invoice',
      number: inv.invoice_number || inv.number || `INV-${inv.id}`,
      partner: inv.customer_name || inv.customer_detail?.name || '',
      date: inv.invoice_date || inv.bill_date || '',
      base: Number(inv.subtotal || inv.total_amount || 0),
      tax: Number(inv.tax_amount || 0),
      status: inv.status,
      taxType: 'sales',
    }));
    return [...billDocs, ...invoiceDocs].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [billRows, invoiceRows]);

  // Summary metrics
  const totalTaxableBase = useMemo(
    () => documentRows.reduce((sum, row) => sum + row.base, 0),
    [documentRows]
  );
  const totalTax = useMemo(
    () => documentRows.reduce((sum, row) => sum + row.tax, 0),
    [documentRows]
  );

  const exportConfig = useMemo(
    () => ({
      title: 'Tax Report',
      subtitle: `${period.label} tax filing preview`,
      summary: [
        { label: 'Output tax (from invoices)', value: formatCurrency(outputTax) },
        { label: 'Input tax (from bills)', value: formatCurrency(inputTax) },
        {
          label: netTax >= 0 ? 'Tax payable' : 'Tax refundable',
          value: formatCurrency(Math.abs(netTax)),
        },
      ],
      tables: [
        {
          title: 'Documents',
          columns: [
            { key: 'type', label: 'Type' },
            { key: 'number', label: 'Number' },
            { key: 'partner', label: 'Partner' },
            { key: 'date', label: 'Date' },
            { key: 'base', label: 'Taxable Base' },
            { key: 'tax', label: 'Tax Amount' },
            { key: 'status', label: 'Status' },
          ],
          rows: documentRows.map((row) => ({
            ...row,
            base: formatCurrency(row.base),
            tax: formatCurrency(row.tax),
          })),
        },
      ],
    }),
    [period.label, outputTax, inputTax, netTax, documentRows]
  );

  const handleExport = (type) => {
    if (type === 'csv') exportReportCsv(exportConfig);
    else if (type === 'json') exportReportJson(exportConfig);
    else if (type === 'excel') exportReportExcel(exportConfig);
  };

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
                        /balance|amount|debit|credit|net|cost|budget|actual|available|variance|opening|closing|total|value|tax|base|rate/i.test(
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
            Tax Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tax grid mapping, filing preview, and source-document totals for the selected return
            period.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <ReportExportActions
            actions={[
              {
                key: 'csv',
                onClick: () =>
                  runAction(
                    'Export Tax Report CSV',
                    () => exportReportCsv('tax-report', exportConfig),
                    'Tax report CSV exported'
                  ),
                disabled: pendingAction !== null,
              },
              {
                key: 'excel',
                onClick: () =>
                  runAction(
                    'Export Tax Report Excel',
                    () => exportReportExcel('tax-report', exportConfig),
                    'Tax report workbook exported'
                  ),
                disabled: pendingAction !== null,
              },
              {
                key: 'json',
                onClick: () =>
                  runAction(
                    'Export Tax Report JSON',
                    () => exportReportJson('tax-report', exportConfig),
                    'Tax report JSON exported'
                  ),
                disabled: pendingAction !== null,
              },
              { key: 'print', onClick: () => setPrintOpen(true), disabled: pendingAction !== null },
            ]}
          />
          <Button
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="solar:upload-bold" />}
            onClick={() => toast.info('Tax return submission remains mock-only in this workspace')}
          >
            Submit Return
          </Button>
        </Stack>
      </Stack>

      <Alert severity={netTax >= 0 ? 'warning' : 'success'} sx={{ mb: 3, borderRadius: 2 }}>
        {netTax >= 0
          ? `Based on actual bill and invoice tax amounts: ${formatCurrency(netTax)} payable (output tax exceeds input tax).`
          : `Based on actual bill and invoice tax amounts: ${formatCurrency(Math.abs(netTax))} refundable (input tax exceeds output tax).`}
      </Alert>

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Filing period"
                value={periodId}
                onChange={(event) => setPeriodId(event.target.value)}
              >
                {PERIODS.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Document type"
                value={taxTypeFilter}
                onChange={(event) => setTaxTypeFilter(event.target.value)}
              >
                <MenuItem value="all">All documents</MenuItem>
                <MenuItem value="purchase">Vendor Bills (Input Tax)</MenuItem>
                <MenuItem value="sales">Customer Invoices (Output Tax)</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Output tax (from invoices)"
            value={formatCurrency(outputTax)}
            helper="Tax collected on customer-side transactions"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Input tax (from bills)"
            value={formatCurrency(inputTax)}
            helper="Recoverable purchase-side tax for the selected period"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Total taxable base"
            value={formatCurrency(totalTaxableBase)}
            helper="Sum of all document amounts before tax"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label={netTax >= 0 ? 'Tax payable' : 'Tax refundable'}
            value={formatCurrency(Math.abs(netTax))}
            helper={`${documentRows.length} source documents in filing scope`}
          />
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Source Documents
          </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th align="left">Type</th>
                      <th align="left">Document</th>
                      <th align="left">Partner</th>
                      <th align="left">Date</th>
                      <th align="right">Base</th>
                      <th align="right">Tax</th>
                      <th align="left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentRows.map((row) => (
                      <tr key={row.id}>
                        <td style={{ padding: '12px 8px' }}>{row.type}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <Typography variant="body2" fontWeight={700}>
                            {row.number}
                          </Typography>
                        </td>
                        <td style={{ padding: '12px 8px' }}>{row.partner}</td>
                        <td style={{ padding: '12px 8px' }}>{row.date}</td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(row.base)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px', fontWeight: 700 }}>
                          {formatCurrency(row.tax)}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <Chip
                            label={row.status}
                            size="small"
                            color={row.status === 'paid' ? 'success' : 'warning'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Return Preview
              </Typography>
              <Stack spacing={1.25}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Output VAT</Typography>
                  <Typography fontWeight={700}>{formatCurrency(outputTax)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Less input VAT</Typography>
                  <Typography fontWeight={700}>{formatCurrency(inputTax)}</Typography>
                </Stack>
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" justifyContent="space-between">
                  <Typography fontWeight={700}>Net filing</Typography>
                  <Typography fontWeight={700}>{formatCurrency(netTax)}</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

      {printOpen && (
        <PdfPrintLayout title="Tax Report" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
