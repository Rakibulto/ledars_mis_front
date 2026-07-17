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
import { fetcher, endpoints } from 'src/utils/axios';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { Iconify } from 'src/components/iconify';

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

export default function SupplierLedgerReport() {
  const today = new Date();
  const lastDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
  const [asOfDate, setAsOfDate] = useState(lastDay);
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  const { data: rawBills, isLoading } = useSWR(endpoints.accounting.bills, fetcher);

  const allBills = useMemo(() => {
    const list = Array.isArray(rawBills) ? rawBills : Array.isArray(rawBills?.results) ? rawBills.results : [];
    return list;
  }, [rawBills]);

  // Group bills by vendor
  const supplierData = useMemo(() => {
    const supplierMap = {};

    allBills.forEach((bill) => {
      const vendorId = bill.vendor || bill.supplier_id;
      const vendorName = bill.vendor_name || bill.vendor_detail?.name || `Vendor ${vendorId}`;
      const vendorCode = bill.vendor_detail?.code || `V-${vendorId}`;

      if (!supplierMap[vendorId]) {
        supplierMap[vendorId] = {
          id: vendorId,
          code: vendorCode,
          name: vendorName,
          bills: [],
        };
      }

      const billDate = new Date(bill.bill_date);
      const dueDate = new Date(bill.due_date);
      const asOf = new Date(asOfDate);
      const diffTime = asOf.getTime() - dueDate.getTime();
      const overdueDays = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
      const totalAmount = Number(bill.total_amount || 0);
      const amountPaid = Number(bill.amount_paid || 0);
      const amountDue = Number(bill.amount_due || 0);

      let paymentStatus = 'scheduled';
      if (amountDue <= 0) paymentStatus = 'cleared';
      else if (overdueDays > 0) paymentStatus = 'overdue';

      supplierMap[vendorId].bills.push({
        id: bill.id,
        number: bill.bill_number || bill.number || `BILL-${bill.id}`,
        issue_date: bill.bill_date,
        due_date: bill.due_date,
        credit: totalAmount,
        debit: amountPaid,
        balance: amountDue,
        overdueDays,
        paymentStatus,
      });
    });

    // Compute totals per supplier
    return Object.values(supplierMap).map((supplier) => {
      const totals = {
        billed: supplier.bills.reduce((s, b) => s + b.credit, 0),
        paid: supplier.bills.reduce((s, b) => s + b.debit, 0),
        outstanding: supplier.bills.reduce((s, b) => s + b.balance, 0),
        overdue: supplier.bills.filter((b) => b.overdueDays > 0).reduce((s, b) => s + b.balance, 0),
      };
      const paymentStatus = totals.overdue > 0 ? 'escalation' : 'clear';
      return { ...supplier, totals, paymentStatus };
    }).sort((a, b) => b.totals.outstanding - a.totals.outstanding);
  }, [allBills, asOfDate]);

  // Apply filters
  const filteredSuppliers = useMemo(() => {
    let list = supplierData;

    if (supplierFilter !== 'all') {
      list = list.filter((s) => String(s.id) === String(supplierFilter));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        String(s.code).toLowerCase().includes(q) ||
        String(s.name).toLowerCase().includes(q)
      );
    }
    if (paymentFilter !== 'all') {
      list = list.filter((s) => {
        if (paymentFilter === 'overdue') return s.totals.overdue > 0;
        if (paymentFilter === 'scheduled') return s.paymentStatus === 'clear' && s.totals.outstanding > 0;
        if (paymentFilter === 'cleared') return s.totals.outstanding <= 0;
        return true;
      });
    }
    return list;
  }, [supplierData, supplierFilter, search, paymentFilter]);

  const globalTotals = useMemo(() => ({
    outstanding: filteredSuppliers.reduce((s, sup) => s + sup.totals.outstanding, 0),
    overdue: filteredSuppliers.reduce((s, sup) => s + sup.totals.overdue, 0),
    paid: filteredSuppliers.reduce((s, sup) => s + sup.totals.paid, 0),
  }), [filteredSuppliers]);

  const exportConfig = useMemo(() => ({
    title: 'Supplier Ledger Report',
    subtitle: `Vendor exposure as of ${asOfDate}`,
    summary: [
      { label: 'Suppliers', value: filteredSuppliers.length },
      { label: 'Outstanding', value: formatCurrency(globalTotals.outstanding) },
      { label: 'Overdue', value: formatCurrency(globalTotals.overdue) },
      { label: 'Paid', value: formatCurrency(globalTotals.paid) },
    ],
  }), [asOfDate, filteredSuppliers, globalTotals]);

  const printContent = (
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Supplier Ledger — {asOfDate}</div>
      {filteredSuppliers.map((supplier) => (
        <div key={supplier.id} style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{supplier.code} - {supplier.name}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead><tr style={{ background: '#f5f5f5' }}>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px' }}>Bill</th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px' }}>Date</th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px' }}>Due</th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>Credit</th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>Paid</th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>Outstanding</th>
            </tr></thead>
            <tbody>
              {supplier.bills.map((bill) => (
                <tr key={bill.id}>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{bill.number}</td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{bill.issue_date}</td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{bill.due_date}</td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(bill.credit)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(bill.debit)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(bill.balance)}</td>
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
          <Typography variant="h4" fontWeight={800}>Supplier Ledger Report</Typography>
          <Typography variant="body2" color="text.secondary">
            Vendor ledger showing bills, payments, and outstanding balances.
          </Typography>
        </Box>
        <ReportExportActions
          actions={[
            { key: 'csv', onClick: () => exportReportCsv('supplier-ledger', exportConfig), disabled: pendingAction !== null },
            { key: 'excel', onClick: () => exportReportExcel('supplier-ledger', exportConfig), disabled: pendingAction !== null },
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
              <TextField select fullWidth label="Supplier" value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
                <MenuItem value="all">All Suppliers</MenuItem>
                {supplierData.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.code} - {s.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField select fullWidth label="Payment Filter" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
                <MenuItem value="cleared">Cleared</MenuItem>
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
          <MetricCard label="Suppliers" value={filteredSuppliers.length} helper="Suppliers in current scope" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard label="Outstanding" value={formatCurrency(globalTotals.outstanding)} helper="Unpaid vendor balance" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard label="Overdue" value={formatCurrency(globalTotals.overdue)} helper="Bills needing escalation" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard label="Paid" value={formatCurrency(globalTotals.paid)} helper="Settlements matched" />
        </Grid>
      </Grid>

      {isLoading ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Loading...</Typography>
      ) : (
        <Stack spacing={3}>
          {filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ pb: 1 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: '#d9770620', color: '#d97706' }}>
                      {supplier.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>{supplier.code} - {supplier.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Billed {formatCurrency(supplier.totals.billed)} • Paid {formatCurrency(supplier.totals.paid)} • Outstanding {formatCurrency(supplier.totals.outstanding)}
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    label={supplier.paymentStatus === 'escalation' ? 'Payment risk' : 'Clear'}
                    color={supplier.paymentStatus === 'escalation' ? 'warning' : 'success'}
                  />
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
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {supplier.bills.map((bill) => (
                      <TableRow key={bill.id} hover>
                        <TableCell><Chip label={bill.number} size="small" variant="outlined" /></TableCell>
                        <TableCell>{bill.issue_date}</TableCell>
                        <TableCell>{bill.due_date}</TableCell>
                        <TableCell align="right">{formatCurrency(bill.credit)}</TableCell>
                        <TableCell align="right">{formatCurrency(bill.debit)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(bill.balance)}</TableCell>
                        <TableCell align="right">{bill.overdueDays}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell colSpan={3}>
                        <Typography fontWeight={700}>Total</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(supplier.totals.billed)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(supplier.totals.paid)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(supplier.totals.outstanding)}</TableCell>
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
        <PdfPrintLayout title="Supplier Ledger Report" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
