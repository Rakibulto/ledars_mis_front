'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
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

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useRouteFilters } from './use-route-filters';
import { useSupplierLedgerApi } from './use-supplier-ledger-api';
import { exportPayablesCsv, exportPayablesExcel } from './payables-export';

const RISK_COLORS = {
  low: 'success',
  medium: 'warning',
  high: 'error',
};

export default function SupplierLedger() {
  const [pendingAction, setPendingAction] = useState(null);
  const { filters, updateFilter, buildHref } = useRouteFilters([
    { key: 'category', defaultValue: 'all' },
    { key: 'risk', defaultValue: 'all', allowedValues: ['all', 'low', 'medium', 'high'] },
    {
      key: 'bucket',
      defaultValue: 'all',
      allowedValues: ['all', 'current', '1-30', '31-60', '61-90', '90-plus'],
    },
    { key: 'search', defaultValue: '' },
  ]);
  const { rows: allRows } = useSupplierLedgerApi();
  const rows = useMemo(
    () =>
      allRows.filter((supplier) => {
        if (filters.category !== 'all' && supplier.category !== filters.category) return false;
        if (filters.risk !== 'all' && supplier.riskLevel !== filters.risk) return false;
        if (filters.bucket !== 'all') {
          const hasBucket = supplier.bills.some((bill) => {
            if (filters.bucket === 'current') return bill.balanceDue > 0 && bill.overdueDays === 0;
            return bill.balanceDue > 0 && bill.bucketId === filters.bucket;
          });

          if (!hasBucket) return false;
        }
        if (filters.search) {
          const query = filters.search.toLowerCase();
          const haystack = [supplier.name, supplier.code, supplier.owner, supplier.email]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      }),
    [allRows, filters.bucket, filters.category, filters.risk, filters.search]
  );

  const outstanding = rows.reduce((sum, supplier) => sum + supplier.outstanding, 0);
  const overdueBills = rows.reduce((sum, supplier) => sum + supplier.overdueBills, 0);
  const approvals = rows.reduce((sum, supplier) => sum + supplier.pendingApprovals, 0);
  const disputed = rows.reduce((sum, supplier) => sum + supplier.disputedBills, 0);

  const exportConfig = {
    title: 'Supplier Ledger',
    subtitle: 'Supplier liability register',
    summary: [
      { label: 'Suppliers in view', value: rows.length },
      { label: 'Outstanding payables', value: formatCurrency(outstanding) },
      { label: 'Overdue bills', value: overdueBills },
      { label: 'Pending approvals', value: approvals },
      { label: 'Disputed bills', value: disputed },
    ],
    tables: [
      {
        title: 'Supplier Exposure',
        columns: [
          { key: 'name', label: 'Supplier' },
          { key: 'owner', label: 'Owner' },
          { key: 'risk', label: 'Risk' },
          { key: 'openBills', label: 'Open Bills' },
          { key: 'riskFlags', label: 'Risk Flags' },
          { key: 'outstanding', label: 'Outstanding' },
        ],
        rows: rows.map((supplier) => ({
          name: supplier.name,
          owner: supplier.owner,
          risk: supplier.riskLevel,
          openBills: supplier.billCount,
          riskFlags: supplier.riskFlags.join(', '),
          outstanding: formatCurrency(supplier.outstanding),
        })),
      },
    ],
    payload: { rows, filters },
  };

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
            Supplier Ledger
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supplier exposure, hold posture, payment ownership, and payable aging visibility.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:download-minimalistic-bold" />}
            onClick={() =>
              runAction(
                'Export Supplier Ledger Excel',
                () => exportPayablesExcel('supplier-ledger', exportConfig),
                'Supplier ledger workbook exported'
              )
            }
            disabled={pendingAction !== null}
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            onClick={() =>
              runAction(
                'Export Supplier Ledger CSV',
                () => exportPayablesCsv('supplier-ledger', exportConfig),
                'Supplier ledger CSV exported'
              )
            }
            disabled={pendingAction !== null}
          >
            Export CSV
          </Button>
        </Stack>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        The supplier ledger is now aligned with the payables mock workspace, including deep links
        into supplier detail packs and schedule queues.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Outstanding payables', value: formatCurrency(outstanding) },
          { label: 'Overdue bills', value: overdueBills },
          { label: 'Pending approvals', value: approvals },
          { label: 'Disputed bills', value: disputed },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, md: 3 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  {card.label}
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                  {card.value}
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
              size="small"
              label="Search supplier"
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
              sx={{ minWidth: 220 }}
            />
            <TextField
              select
              size="small"
              label="Category"
              value={filters.category}
              onChange={(event) => updateFilter('category', event.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="all">All categories</MenuItem>
              {[...new Set(allRows.map((supplier) => supplier.category))].map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Risk"
              value={filters.risk}
              onChange={(event) => updateFilter('risk', event.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="all">All risk levels</MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              label="Aging focus"
              value={filters.bucket}
              onChange={(event) => updateFilter('bucket', event.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="all">All aging buckets</MenuItem>
              <MenuItem value="current">Current</MenuItem>
              <MenuItem value="1-30">1-30 Days</MenuItem>
              <MenuItem value="31-60">31-60 Days</MenuItem>
              <MenuItem value="61-90">61-90 Days</MenuItem>
              <MenuItem value="90-plus">90+ Days</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Supplier</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Risk</TableCell>
                <TableCell>Open Bills</TableCell>
                <TableCell>Risk Flags</TableCell>
                <TableCell>Oldest Aging</TableCell>
                <TableCell>Payment History</TableCell>
                <TableCell>Latest Payment</TableCell>
                <TableCell align="right">Outstanding</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((supplier) => (
                <TableRow key={supplier.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {supplier.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {supplier.email} • {supplier.category} • {supplier.holdFlags} hold flags
                    </Typography>
                  </TableCell>
                  <TableCell>{supplier.owner}</TableCell>
                  <TableCell>
                    <Chip
                      label={supplier.riskLevel}
                      size="small"
                      color={RISK_COLORS[supplier.riskLevel]}
                    />
                  </TableCell>
                  <TableCell>{supplier.billCount}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      {supplier.riskFlags.map((flag) => (
                        <Chip
                          key={`${supplier.id}-${flag}`}
                          label={flag}
                          size="small"
                          color={
                            flag.includes('Dispute') || flag.includes('hold') ? 'warning' : 'info'
                          }
                        />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {supplier.oldestDays ? `${supplier.oldestDays} days` : 'Current'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">Last pay {supplier.lastPaymentDate}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {supplier.paymentHistoryCount} settled bills • next {supplier.nextPaymentDate}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {supplier.latestPaymentId ? (
                      <Stack spacing={0.25}>
                        <Typography
                          component={RouterLink}
                          href={paths.dashboard.accountingFinance.transactions.supplierPaymentDetail(
                            supplier.latestPaymentId
                          )}
                          variant="body2"
                          fontWeight={700}
                          sx={{
                            color: 'primary.main',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          {supplier.latestPaymentReference}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {supplier.paymentHistoryCount} payment
                          {supplier.paymentHistoryCount !== 1 ? 's' : ''} ·{' '}
                          {supplier.latestPaymentReleaseStatus}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No payments
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color={supplier.outstanding ? 'error.main' : 'success.main'}
                    >
                      {formatCurrency(supplier.outstanding)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {supplier.latestPaymentId ? (
                      <Button
                        component={RouterLink}
                        href={paths.dashboard.accountingFinance.transactions.supplierPaymentDetail(
                          supplier.latestPaymentId
                        )}
                        variant="outlined"
                        color="primary"
                      >
                        View Payment
                      </Button>
                    ) : (
                      <Button variant="outlined" color="inherit" disabled>
                        No Payment
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
