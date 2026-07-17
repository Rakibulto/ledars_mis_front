'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import AlertTitle from '@mui/material/AlertTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import CardContent from '@mui/material/CardContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useVendorBillsApi } from './use-vendor-bills-api';

const STATUS_COLORS = {
  draft: 'default',
  pending: 'warning',
  received: 'info',
  approved: 'info',
  partial: 'warning',
  paid: 'success',
  overdue: 'error',
  posted: 'success',
};

export default function VendorBills() {
  const api = useVendorBillsApi();
  const { bills, vendors, getVendorById, revalidate } = api;

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [disputeFilter, setDisputeFilter] = useState('all');
  const [supplierId, setSupplierId] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const onVisibility = () => { if (document.visibilityState === 'visible') revalidate(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [revalidate]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.actions.deleteBill(deleteTarget.id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredBills = useMemo(
    () =>
      bills
        .filter((bill) => {
          const vendor = getVendorById(bill.supplier_id);
          const haystack = `${bill.number} ${vendor?.name || ''}`.toLowerCase();
          if (search && !haystack.includes(search.toLowerCase())) return false;
          if (status !== 'all' && bill.status !== status) return false;
          if (supplierId !== 'all' && String(bill.supplier_id) !== String(supplierId)) return false;
          if (disputeFilter === 'disputed' && !bill.disputeFlag) return false;
          if (disputeFilter === 'clean' && bill.disputeFlag) return false;
          return true;
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [bills, disputeFilter, search, status, supplierId]
  );

  const overdueCount = bills.filter((bill) => bill.status === 'overdue').length;
  const disputeCount = bills.filter((bill) => bill.disputeFlag).length;
  const unmatchedCount = bills.filter((bill) => bill.matchStatus !== '3-way matched').length;
  const payableExposure = bills.reduce((sum, bill) => sum + Number(bill.balance_due || 0), 0);

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Vendor Bills
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mock-driven payables workspace with dispute control, match-status tracking, and payment
            proposal visibility.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
          <Button
            component={Link}
            href={paths.dashboard.accountingFinance.transactions.supplierPayments}
            variant="outlined"
            startIcon={<Iconify icon="solar:card-send-bold" />}
          >
            Payment runs
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() =>
              window.open('/accounting-finance/transactions/vendor-bills/new', '_blank')
            }
          >
            Create Bill
          </Button>
        </Stack>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        <AlertTitle>Payables controls active</AlertTitle>
        Three-way match status, dispute flags, payment proposals, and blocked bills are now driven
        from mock accounting records.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: 'Overdue bills',
            value: overdueCount,
            icon: 'solar:danger-circle-bold-duotone',
            color: '#dc2626',
          },
          {
            label: 'Disputed bills',
            value: disputeCount,
            icon: 'solar:shield-warning-bold-duotone',
            color: '#f59e0b',
          },
          {
            label: 'Unmatched bills',
            value: unmatchedCount,
            icon: 'solar:clipboard-remove-bold-duotone',
            color: '#8b5cf6',
          },
          {
            label: 'Payable exposure',
            value: formatCurrency(payableExposure),
            icon: 'solar:wallet-money-bold-duotone',
            color: '#16a34a',
          },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {card.label}
                    </Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color }}>
                    <Iconify icon={card.icon} width={28} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
            <TextField
              size="small"
              placeholder="Search bill number or supplier"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ flex: 1, minWidth: 220 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:magnifer-linear" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All status</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="posted">Posted</MenuItem>
              <MenuItem value="received">Received</MenuItem>
              <MenuItem value="partial">Partial</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              value={disputeFilter}
              onChange={(event) => setDisputeFilter(event.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="all">All disputes</MenuItem>
              <MenuItem value="clean">No dispute</MenuItem>
              <MenuItem value="disputed">Disputed</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
              sx={{ minWidth: 210 }}
            >
              <MenuItem value="all">All suppliers</MenuItem>
              {vendors.map((vendor) => (
                <MenuItem key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Bill #</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Match</TableCell>
                <TableCell>Payment Proposal</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Due</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBills.map((bill) => {
                const supplier = getVendorById(bill.supplier_id);

                return (
                  <TableRow key={bill.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                        {bill.number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        component={Link}
                        href={paths.dashboard.procurement_new.vendors.detail(bill.supplier_id)}
                        variant="body1"
                        fontWeight={700}
                        sx={{
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        {supplier?.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.25 }}
                      >
                        Rating {supplier?.rating || 'n/a'}
                        {bill.disputeFlag ? ' · Dispute open' : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>{new Date(bill.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Chip label={bill.matchStatus} size="small" variant="outlined" />
                        {bill.disputeFlag && <Chip label="Blocked" size="small" color="error" />}
                      </Stack>
                    </TableCell>
                    <TableCell>{bill.paymentProposal}</TableCell>
                    <TableCell align="right">{formatCurrency(bill.total)}</TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color={bill.balance_due > 0 ? 'error.main' : 'success.main'}
                      >
                        {formatCurrency(bill.balance_due)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={bill.status}
                        size="small"
                        color={STATUS_COLORS[bill.status]}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end" spacing={1}>
                        <Tooltip title="Delete bill">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(bill);
                            }}
                            disabled={bill.status === 'posted' || bill.status === 'paid'}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                          </IconButton>
                        </Tooltip>
                        <Button
                          component={Link}
                          href={paths.dashboard.accountingFinance.transactions.vendorBillDetail(
                            bill.id
                          )}
                          size="small"
                        >
                          Open
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Vendor Bill?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete bill <strong>{deleteTarget?.number}</strong>? This
            action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
