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

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { ReportExportActions } from './report-export-actions';
import { exportReportCsv, exportReportJson, exportReportExcel } from './reports-export';
import {
  ACCOUNTING_MOCK_BILLS,
  ACCOUNTING_MOCK_TAXES,
  ACCOUNTING_MOCK_INVOICES,
} from '../demo-data';

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

  const invoiceRows = useMemo(
    () =>
      ACCOUNTING_MOCK_INVOICES.filter((invoice) =>
        withinRange(invoice.invoice_date, period.from, period.to)
      ),
    [period.from, period.to]
  );
  const billRows = useMemo(
    () =>
      ACCOUNTING_MOCK_BILLS.filter((bill) => withinRange(bill.issue_date, period.from, period.to)),
    [period.from, period.to]
  );

  const taxRows = useMemo(
    () =>
      ACCOUNTING_MOCK_TAXES.filter((tax) =>
        taxTypeFilter === 'all' ? true : tax.type === taxTypeFilter
      ).map((tax) => {
        const saleBase =
          tax.type === 'sale'
            ? invoiceRows.reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0)
            : 0;
        const purchaseBase =
          tax.type === 'purchase'
            ? billRows.reduce((sum, bill) => sum + Number(bill.total_amount || 0), 0)
            : 0;
        const withholdingBase =
          tax.type === 'withholding'
            ? billRows
                .filter((bill) => bill.status !== 'paid')
                .reduce((sum, bill) => sum + Number(bill.total_amount || 0), 0)
            : 0;
        const taxableBase = saleBase || purchaseBase || withholdingBase;
        const taxAmount = taxableBase * (Number(tax.rate || 0) / 100);

        return {
          ...tax,
          taxableBase,
          taxAmount,
          filingBox:
            tax.type === 'sale'
              ? 'Output VAT'
              : tax.type === 'purchase'
                ? 'Input VAT'
                : 'Withholding Tax',
        };
      }),
    [billRows, invoiceRows, taxTypeFilter]
  );

  const outputTax = taxRows
    .filter((tax) => tax.type === 'sale')
    .reduce((sum, tax) => sum + tax.taxAmount, 0);
  const inputTax = taxRows
    .filter((tax) => tax.type === 'purchase')
    .reduce((sum, tax) => sum + tax.taxAmount, 0);
  const withholdingTax = taxRows
    .filter((tax) => tax.type === 'withholding')
    .reduce((sum, tax) => sum + tax.taxAmount, 0);
  const netTax = outputTax - inputTax - withholdingTax;

  const documentRows = useMemo(() => {
    const invoiceDocs = invoiceRows.map((invoice) => ({
      id: `inv-${invoice.id}`,
      type: 'Invoice',
      number: invoice.number,
      partner: invoice.customer_name,
      date: invoice.invoice_date,
      base: Number(invoice.total_amount || 0),
      tax: Number(invoice.total_amount || 0) * 0.05,
      status: invoice.status,
    }));
    const billDocs = billRows.map((bill) => ({
      id: `bill-${bill.id}`,
      type: 'Vendor Bill',
      number: bill.number,
      partner: bill.vendor_name,
      date: bill.issue_date,
      base: Number(bill.total_amount || 0),
      tax: Number(bill.total_amount || 0) * 0.075,
      status: bill.status,
    }));

    return [...invoiceDocs, ...billDocs].sort((left, right) => right.date.localeCompare(left.date));
  }, [billRows, invoiceRows]);

  const exportConfig = useMemo(
    () => ({
      title: 'Tax Report',
      subtitle: `${period.label} tax filing preview`,
      summary: [
        { label: 'Output tax', value: formatCurrency(outputTax) },
        { label: 'Input tax', value: formatCurrency(inputTax) },
        { label: 'Withholding', value: formatCurrency(withholdingTax) },
        {
          label: netTax >= 0 ? 'Tax payable' : 'Tax refundable',
          value: formatCurrency(Math.abs(netTax)),
        },
      ],
      tables: [
        {
          title: 'Tax Grid',
          columns: [
            { key: 'name', label: 'Tax' },
            { key: 'rate', label: 'Rate' },
            { key: 'type', label: 'Type' },
            { key: 'base', label: 'Taxable Base' },
            { key: 'amount', label: 'Tax Amount' },
            { key: 'box', label: 'Filing Box' },
          ],
          rows: taxRows.map((tax) => ({
            name: tax.name,
            rate: `${tax.rate}%`,
            type: tax.type,
            base: formatCurrency(tax.taxableBase),
            amount: formatCurrency(tax.taxAmount),
            box: tax.filingBox,
          })),
        },
        {
          title: 'Tax Source Documents',
          columns: [
            { key: 'type', label: 'Type' },
            { key: 'number', label: 'Document' },
            { key: 'partner', label: 'Partner' },
            { key: 'date', label: 'Date' },
            { key: 'base', label: 'Base' },
            { key: 'tax', label: 'Tax' },
          ],
          rows: documentRows.map((row) => ({
            type: row.type,
            number: row.number,
            partner: row.partner,
            date: row.date,
            base: formatCurrency(row.base),
            tax: formatCurrency(row.tax),
          })),
        },
      ],
      controlChecks: [
        {
          label: 'Open source documents',
          value: documentRows.filter((row) => row.status !== 'paid').length,
          description: 'Documents still open when preparing the filing pack.',
        },
      ],
      payload: { period, taxRows, documentRows, outputTax, inputTax, withholdingTax, netTax },
    }),
    [documentRows, inputTax, netTax, outputTax, period, taxRows, withholdingTax]
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
          ? `Current filing preview shows ${formatCurrency(netTax)} payable after input and withholding offsets.`
          : `Current filing preview shows ${formatCurrency(Math.abs(netTax))} refundable after offsets.`}
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
                label="Tax type"
                value={taxTypeFilter}
                onChange={(event) => setTaxTypeFilter(event.target.value)}
              >
                <MenuItem value="all">All tax types</MenuItem>
                <MenuItem value="sale">Sale</MenuItem>
                <MenuItem value="purchase">Purchase</MenuItem>
                <MenuItem value="withholding">Withholding</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Output tax"
            value={formatCurrency(outputTax)}
            helper="Tax collected on customer-side transactions"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Input tax"
            value={formatCurrency(inputTax)}
            helper="Recoverable purchase-side tax for the selected period"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Withholding"
            value={formatCurrency(withholdingTax)}
            helper="Retention offset on unpaid vendor-side documents"
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

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 7 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Tax Grid Mapping
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th align="left">Tax</th>
                      <th align="left">Type</th>
                      <th align="right">Rate</th>
                      <th align="right">Taxable base</th>
                      <th align="right">Tax amount</th>
                      <th align="left">Filing box</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxRows.map((tax) => (
                      <tr key={tax.id}>
                        <td style={{ padding: '12px 8px' }}>
                          <Typography variant="body2" fontWeight={700}>
                            {tax.name}
                          </Typography>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <Chip label={tax.type} size="small" variant="outlined" />
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {tax.rate}%
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(tax.taxableBase)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px', fontWeight: 700 }}>
                          {formatCurrency(tax.taxAmount)}
                        </td>
                        <td style={{ padding: '12px 8px' }}>{tax.filingBox}</td>
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
        </Grid>

        <Grid size={{ xs: 12, xl: 5 }}>
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
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Less withholding</Typography>
                  <Typography fontWeight={700}>{formatCurrency(withholdingTax)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Net filing</Typography>
                  <Typography fontWeight={700}>{formatCurrency(netTax)}</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {printOpen && (
        <PdfPrintLayout title="Tax Report" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
