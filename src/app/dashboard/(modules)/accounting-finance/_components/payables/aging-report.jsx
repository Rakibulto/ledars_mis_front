'use client';

import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
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
import { useRouteFilters } from './use-route-filters';
import { usePayablesWorkspace } from './use-payables-workspace';
import { exportPayablesCsv, exportPayablesExcel } from './payables-export';

export default function PayableAgingReport() {
  const [cutoffDate, setCutoffDate] = useState('2026-03-29');
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);
  const { filters, updateFilter } = useRouteFilters([{ key: 'focus', defaultValue: 'all' }]);
  const { agingBuckets } = usePayablesWorkspace(cutoffDate);

  const buckets = agingBuckets;
  const rows = buckets.filter((bucket) =>
    filters.focus === 'all' ? true : bucket.id === filters.focus
  );
  const total = buckets.reduce((sum, bucket) => sum + bucket.amount, 0);
  const criticalBucket = buckets.find((bucket) => bucket.id === '90-plus');
  const discountOpportunities = buckets.reduce((sum, bucket) => sum + bucket.discountEligible, 0);
  const blockedSuppliers = buckets.reduce((sum, bucket) => sum + bucket.blockedSuppliers, 0);

  const exportConfig = {
    title: 'Payable Aging Report',
    subtitle: `Cutoff ${cutoffDate}`,
    summary: rows.map((bucket) => ({
      label: bucket.label,
      value: formatCurrency(bucket.amount),
      helper: `${bucket.count} bills`,
    })),
    tables: [
      {
        title: 'Aging Buckets',
        columns: [
          { key: 'bucket', label: 'Bucket' },
          { key: 'amount', label: 'Amount' },
          { key: 'count', label: 'Bills' },
          { key: 'approvals', label: 'Approvals' },
          { key: 'holds', label: 'Holds' },
          { key: 'priority', label: 'Priority Mix' },
          { key: 'discounts', label: 'Discounts' },
        ],
        rows: rows.map((bucket) => ({
          bucket: bucket.label,
          amount: formatCurrency(bucket.amount),
          count: bucket.count,
          approvals: bucket.approvals,
          holds: bucket.holds,
          priority: `${bucket.priorityMix.critical} critical / ${bucket.priorityMix.high} high / ${bucket.priorityMix.urgent} urgent`,
          discounts: bucket.discountEligible,
        })),
      },
    ],
    payload: { cutoffDate, rows },
  };

  const printContent = (
    <div>
      {/* Summary Cards */}
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Summary</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <tbody>
          <tr>
            <td
              style={{
                border: '1px solid #ddd',
                padding: '6px 8px',
                fontWeight: 600,
                width: '40%',
              }}
            >
              Discount Opportunities
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {discountOpportunities}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 600 }}>
              Blocked Suppliers
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{blockedSuppliers}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 600 }}>
              Critical Bucket Amount (90+)
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {formatCurrency(criticalBucket?.amount || 0)}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 600 }}>
              Total Payables
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {formatCurrency(total)}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 600 }}>
              Cutoff Date
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{cutoffDate}</td>
          </tr>
        </tbody>
      </table>

      {/* Aging Buckets Table */}
      <div style={{ fontWeight: 700, fontSize: 14, marginTop: 20, marginBottom: 8 }}>
        Aging Buckets
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Bucket
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              Amount
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              Bills
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              Approvals
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              Holds
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              Priority Mix
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              Discounts
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              Share
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((bucket, idx) => (
            <tr key={bucket.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 600 }}>
                {bucket.label}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {formatCurrency(bucket.amount)}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {bucket.count}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {bucket.approvals}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {bucket.holds}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {bucket.priorityMix.critical} critical / {bucket.priorityMix.high} high /{' '}
                {bucket.priorityMix.urgent} urgent
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {bucket.discountEligible}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {total ? `${((bucket.amount / total) * 100).toFixed(1)}%` : '0%'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Payable Aging Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Liability bucket analysis with hold counts, approvals waiting, and escalation routing.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            onClick={() =>
              runAction(
                'Export Payable Aging CSV',
                () => exportPayablesCsv('payable-aging-report', exportConfig),
                'Payable aging CSV exported'
              )
            }
            disabled={pendingAction !== null}
          >
            Export CSV
          </Button>
          <Button
            component={RouterLink}
            href={paths.dashboard.accountingFinance.payables.paymentSchedule}
            variant="outlined"
            color="inherit"
          >
            Open Payment Schedule
          </Button>
          <Button
            component={RouterLink}
            href={paths.dashboard.accountingFinance.payables.unpaidBills}
            variant="outlined"
            color="inherit"
          >
            Open Unpaid Bills
          </Button>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:download-minimalistic-bold" />}
            onClick={() =>
              runAction(
                'Export Payable Aging Excel',
                () => exportPayablesExcel('payable-aging-report', exportConfig),
                'Payable aging workbook exported'
              )
            }
            disabled={pendingAction !== null}
          >
            Export Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:printer-bold" />}
            onClick={() => setPrintOpen(true)}
            disabled={pendingAction !== null}
          >
            Open Review Pack
          </Button>
        </Stack>
      </Stack>

      <Alert severity={criticalBucket?.amount ? 'warning' : 'info'} sx={{ mb: 3, borderRadius: 2 }}>
        {criticalBucket?.amount
          ? `${criticalBucket.count} bills remain in the 90+ bucket with ${criticalBucket.holds} active holds requiring controller follow-up.`
          : 'No 90+ day liabilities remain open in the current mock dataset.'}
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Discount opportunities', value: discountOpportunities },
          { label: 'Blocked suppliers', value: blockedSuppliers },
          { label: 'Critical bucket amount', value: formatCurrency(criticalBucket?.amount || 0) },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, md: 4 }}>
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

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              type="date"
              size="small"
              label="Cutoff date"
              value={cutoffDate}
              onChange={(event) => setCutoffDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 220 }}
            />
            <TextField
              select
              size="small"
              label="Bucket focus"
              value={filters.focus}
              onChange={(event) => updateFilter('focus', event.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="all">All buckets</MenuItem>
              {buckets.map((bucket) => (
                <MenuItem key={bucket.id} value={bucket.id}>
                  {bucket.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {buckets.map((bucket) => (
          <Grid key={bucket.id} size={{ xs: 12, sm: 6, lg: 2.4 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  {bucket.label}
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ mt: 0.75 }}>
                  {formatCurrency(bucket.amount)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {bucket.count} bills • {bucket.approvals} approvals • {bucket.holds} holds
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Bucket</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Bills</TableCell>
                <TableCell align="right">Approvals</TableCell>
                <TableCell align="right">Holds</TableCell>
                <TableCell align="right">Priority</TableCell>
                <TableCell align="right">Discounts</TableCell>
                <TableCell align="right">Share</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((bucket) => (
                <TableRow key={bucket.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {bucket.label}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(bucket.amount)}</TableCell>
                  <TableCell align="right">{bucket.count}</TableCell>
                  <TableCell align="right">{bucket.approvals}</TableCell>
                  <TableCell align="right">{bucket.holds}</TableCell>
                  <TableCell align="right">
                    {bucket.priorityMix.critical +
                      bucket.priorityMix.high +
                      bucket.priorityMix.urgent}
                  </TableCell>
                  <TableCell align="right">{bucket.discountEligible}</TableCell>
                  <TableCell align="right">
                    {total ? `${((bucket.amount / total) * 100).toFixed(1)}%` : '0%'}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      component={RouterLink}
                      href={paths.dashboard.accountingFinance.payables.agingBucketDetail(bucket.id)}
                      variant="outlined"
                      color="inherit"
                    >
                      View Bucket
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {printOpen && (
        <PdfPrintLayout title="Payable Aging Report" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
