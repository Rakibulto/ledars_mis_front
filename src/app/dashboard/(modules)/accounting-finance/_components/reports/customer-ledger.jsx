'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import useSWR from 'swr';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
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

import { fetcher, endpoints } from 'src/utils/axios';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { formatCurrency } from '../utils';
import { ReportExportActions } from './report-export-actions';
import { exportReportCsv, exportReportExcel } from './reports-export';

function MetricCard({ label, value, helper }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>{value}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>{helper}</Typography>
      </CardContent>
    </Card>
  );
}

export default function CustomerLedgerReport() {
  const today = new Date();
  const lastDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
  const [asOfDate, setAsOfDate] = useState(lastDay);
  const [customerFilter, setCustomerFilter] = useState('all');
  const [residualFilter, setResidualFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  const { data: rawInvoices, isLoading } = useSWR(endpoints.accounting.customer_invoices, fetcher);

  const allInvoices = useMemo(() => {
    const list = Array.isArray(rawInvoices) ? rawInvoices : Array.isArray(rawInvoices?.results) ? rawInvoices.results : [];
    return list;
  }, [rawInvoices]);

  // Group invoices by customer
  const customerData = useMemo(() => {
    const customerMap = {};

    allInvoices.forEach((inv) => {
      const custId = inv.customer;
      const custName = inv.customer_name || inv.customer_detail?.name || `Customer ${custId}`;
      const custCode = inv.customer_detail?.code || `C-${custId}`;

      if (!customerMap[custId]) {
        customerMap[custId] = { id: custId, code: custCode, name: custName, invoices: [] };
      }

      const invoiceDate = new Date(inv.date || inv.invoice_date);
      const dueDate = new Date(inv.due_date);
      const asOf = new Date(asOfDate);
      const diffTime = asOf.getTime() - dueDate.getTime();
      const overdueDays = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
      const totalAmount = Number(inv.total || inv.total_amount) || 0;
      const amountPaid = Number(inv.paid_amount) || 0;
      const amountDue = Number(inv.balance_due) || 0;

      customerMap[custId].invoices.push({
        id: inv.id,
        number: inv.number || inv.invoice_number || `INV-${inv.id}`,
        invoice_date: inv.date || inv.invoice_date,
        due_date: inv.due_date,
        debit: totalAmount,
        credit: amountPaid,
        balance: amountDue,
        overdueDays,
        status: inv.status,
      });
    });

    return Object.values(customerMap).map((customer) => {
      const totals = {
        invoiced: customer.invoices.reduce((s, i) => s + i.debit, 0),
        collected: customer.invoices.reduce((s, i) => s + i.credit, 0),
        outstanding: customer.invoices.reduce((s, i) => s + i.balance, 0),
        overdue: customer.invoices.filter((i) => i.overdueDays > 0).reduce((s, i) => s + i.balance, 0),
      };
      return { ...customer, totals, collectionStatus: totals.overdue > 0 ? 'follow-up' : 'clear' };
    }).sort((a, b) => b.totals.outstanding - a.totals.outstanding);
  }, [allInvoices, asOfDate]);

  // Apply filters
  const filteredCustomers = useMemo(() => {
    let list = customerData;
    if (customerFilter !== 'all') list = list.filter((c) => String(c.id) === String(customerFilter));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => String(c.code).toLowerCase().includes(q) || String(c.name).toLowerCase().includes(q));
    }
    if (residualFilter !== 'all') {
      list = list.filter((c) => {
        if (residualFilter === 'overdue') return c.totals.overdue > 0;
        if (residualFilter === 'open') return c.totals.outstanding > 0;
        return c.totals.outstanding <= 0;
      });
    }
    return list;
  }, [customerData, customerFilter, search, residualFilter]);

  const globalTotals = useMemo(() => ({
    invoiced: filteredCustomers.reduce((s, c) => s + c.totals.invoiced, 0),
    collected: filteredCustomers.reduce((s, c) => s + c.totals.collected, 0),
    outstanding: filteredCustomers.reduce((s, c) => s + c.totals.outstanding, 0),
    overdue: filteredCustomers.reduce((s, c) => s + c.totals.overdue, 0),
  }), [filteredCustomers]);

  const exportConfig = useMemo(() => ({
    title: 'Customer Ledger Report',
    subtitle: `Customer exposure as of ${asOfDate}`,
    summary: [
      { label: 'Customers', value: filteredCustomers.length },
      { label: 'Invoiced', value: formatCurrency(globalTotals.invoiced) },
      { label: 'Outstanding', value: formatCurrency(globalTotals.outstanding) },
      { label: 'Overdue', value: formatCurrency(globalTotals.overdue) },
    ],
  }), [asOfDate, filteredCustomers, globalTotals]);

  const printContent = (
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Customer Ledger — {asOfDate}</div>
      {filteredCustomers.map((customer) => (
        <div key={customer.id} style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{customer.code} - {customer.name}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead><tr style={{ background: '#f5f5f5' }}>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px' }}>Invoice</th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px' }}>Date</th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px' }}>Due</th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>Debit</th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>Credit</th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>Outstanding</th>
            </tr></thead>
            <tbody>
              {customer.invoices.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{inv.number}</td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{inv.invoice_date}</td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{inv.due_date}</td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(inv.debit)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(inv.credit)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(inv.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );

  return (
    <Box>
      <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Customer Ledger Report</Typography>
          <Typography variant="body2" color="text.secondary">
            Customer invoice history with outstanding balances and collection status.
          </Typography>
        </Box>
        <ReportExportActions
          actions={[
            { key: 'csv', onClick: () => exportReportCsv('customer-ledger', exportConfig), disabled: pendingAction !== null },
            { key: 'excel', onClick: () => exportReportExcel('customer-ledger', exportConfig), disabled: pendingAction !== null },
            { key: 'print', onClick: () => setPrintOpen(true), disabled: pendingAction !== null },
          ]}
        />
      </Stack>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField fullWidth type="date" label="As of" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField select fullWidth label="Customer" value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}>
                <MenuItem value="all">All Customers</MenuItem>
                {customerData.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.code} - {c.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField select fullWidth label="Status" value={residualFilter} onChange={(e) => setResidualFilter(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField fullWidth label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Code or name" />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard label="Customers" value={filteredCustomers.length} helper="Customers in scope" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard label="Invoiced" value={formatCurrency(globalTotals.invoiced)} helper="Total billed" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard label="Outstanding" value={formatCurrency(globalTotals.outstanding)} helper="Unpaid balance" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard label="Overdue" value={formatCurrency(globalTotals.overdue)} helper="Past due" />
        </Grid>
      </Grid>

      {isLoading ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Loading...</Typography>
      ) : (
        <Stack spacing={3}>
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ pb: 1 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: '#2563eb20', color: '#2563eb' }}>
                      {customer.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>{customer.code} - {customer.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Invoiced {formatCurrency(customer.totals.invoiced)} • Collected {formatCurrency(customer.totals.collected)} • Outstanding {formatCurrency(customer.totals.outstanding)}
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    label={customer.collectionStatus === 'follow-up' ? 'Follow-up needed' : 'Clear'}
                    color={customer.collectionStatus === 'follow-up' ? 'warning' : 'success'}
                  />
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
                      <TableCell align="right">Outstanding</TableCell>
                      <TableCell align="right">Overdue Days</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customer.invoices.map((inv) => (
                      <TableRow key={inv.id} hover>
                        <TableCell><Chip label={inv.number} size="small" variant="outlined" /></TableCell>
                        <TableCell>{inv.invoice_date}</TableCell>
                        <TableCell>{inv.due_date}</TableCell>
                        <TableCell align="right">{formatCurrency(inv.debit)}</TableCell>
                        <TableCell align="right">{formatCurrency(inv.credit)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(inv.balance)}</TableCell>
                        <TableCell align="right">{inv.overdueDays}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell colSpan={3}>
                        <Typography fontWeight={700}>Total</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(customer.totals.invoiced)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(customer.totals.collected)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(customer.totals.outstanding)}</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          ))}
        </Stack>
      )}

      {printOpen && (
        <PdfPrintLayout title="Customer Ledger Report" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
