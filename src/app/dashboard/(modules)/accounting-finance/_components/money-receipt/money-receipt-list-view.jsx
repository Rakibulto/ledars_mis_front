'use client';

import useSWR from 'swr';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';

import { RouterLink } from 'src/routes/components';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

function SummaryCard({ title, value, icon, color, bg }) {
  return (
    <Card sx={{ p: 2.5, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2,
            bgcolor: bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Iconify icon={icon} width={26} sx={{ color }} />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={700} lineHeight={1.2}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

export default function MoneyReceiptListView() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterAmountRange, setFilterAmountRange] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading, mutate } = useSWR(endpoints.accounting.supplier_payments, fetcher);
  const receipts = Array.isArray(data) ? data : data?.results || [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const amountRanges = {
      all: null,
      lt5k: (v) => v < 5000,
      '5k-20k': (v) => v >= 5000 && v < 20000,
      '20k-50k': (v) => v >= 20000 && v < 50000,
      gt50k: (v) => v >= 50000,
    };
    const amountTest = amountRanges[filterAmountRange];

    return receipts.filter((r) => {
      if (q) {
        const matchesSearch =
          (r.vendor_name || '').toLowerCase().includes(q) ||
          (r.number || '').toLowerCase().includes(q) ||
          (r.payment_number || '').toLowerCase().includes(q) ||
          (r.bill_refs || []).join(' ').toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      if (filterMethod !== 'all' && r.method !== filterMethod) return false;
      const isAuto = r.bill_refs?.length > 0;
      if (filterType === 'auto' && !isAuto) return false;
      if (filterType === 'manual' && isAuto) return false;
      if (filterDateFrom && r.date < filterDateFrom) return false;
      if (filterDateTo && r.date > filterDateTo) return false;
      if (amountTest) {
        const amt = parseFloat(r.amount || 0);
        if (!amountTest(amt)) return false;
      }
      return true;
    });
  }, [receipts, search, filterMethod, filterType, filterDateFrom, filterDateTo, filterAmountRange]);

  const hasActiveFilters =
    filterMethod !== 'all' ||
    filterType !== 'all' ||
    filterDateFrom ||
    filterDateTo ||
    filterAmountRange !== 'all';

  const clearFilters = () => {
    setFilterMethod('all');
    setFilterType('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterAmountRange('all');
  };

  const totalAmount = receipts.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
  const autoCount = receipts.filter((r) => r.bill_refs?.length > 0).length;
  const manualCount = receipts.filter((r) => !r.bill_refs?.length).length;

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleCreate = () => {
    window.open('/dashboard/accounting-finance/payables/money-receipt/create', '_blank');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(endpoints.accounting.supplier_payment_by_id(deleteTarget.id));
      toast.success('Receipt deleted');
      setDeleteTarget(null);
      mutate();
    } catch {
      toast.error('Failed to delete receipt');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="h4" fontWeight={700}>
          Money Receipts
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        All supplier payment receipts — auto-generated on bill payment or created manually
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Receipts"
            value={receipts.length}
            icon="solar:receipt-bold-duotone"
            color="#3b82f6"
            bg="#eff6ff"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Amount"
            value={`৳${totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            icon="solar:dollar-minimalistic-bold-duotone"
            color="#10b981"
            bg="#f0fdf4"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Auto Generated"
            value={autoCount}
            icon="solar:magic-stick-bold-duotone"
            color="#f59e0b"
            bg="#fffbeb"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Manual"
            value={manualCount}
            icon="solar:pen-bold-duotone"
            color="#6366f1"
            bg="#f5f3ff"
          />
        </Grid>
      </Grid>

      <Card
        sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: 3, overflow: 'hidden' }}
      >
        <Box sx={{ p: 2.5, borderBottom: '1px solid #e5e7eb' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            spacing={2}
          >
            <Box>
              <Typography variant="h6" fontWeight={600}>
                All Receipts
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {filtered.length} record{filtered.length !== 1 ? 's' : ''} found
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleCreate}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Create Receipt
            </Button>
          </Stack>
          <Box sx={{ mt: 2 }}>
            <TextField
              size="small"
              placeholder="Search by vendor, receipt no., bill ref..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                size="small"
                select
                label="Method"
                fullWidth
                value={filterMethod}
                onChange={(e) => {
                  setFilterMethod(e.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="all">All Methods</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="cheque">Cheque</MenuItem>
                <MenuItem value="mobile_banking">Mobile Banking</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                size="small"
                select
                label="Type"
                fullWidth
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="auto">Auto Generated</MenuItem>
                <MenuItem value="manual">Manual</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                size="small"
                type="date"
                label="From Date"
                fullWidth
                value={filterDateFrom}
                onChange={(e) => {
                  setFilterDateFrom(e.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                size="small"
                type="date"
                label="To Date"
                fullWidth
                value={filterDateTo}
                onChange={(e) => {
                  setFilterDateTo(e.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                size="small"
                select
                label="Amount"
                fullWidth
                value={filterAmountRange}
                onChange={(e) => {
                  setFilterAmountRange(e.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="all">All Amounts</MenuItem>
                <MenuItem value="lt5k">Under ৳5,000</MenuItem>
                <MenuItem value="5k-20k">৳5,000 – ৳20,000</MenuItem>
                <MenuItem value="20k-50k">৳20,000 – ৳50,000</MenuItem>
                <MenuItem value="gt50k">Above ৳50,000</MenuItem>
              </TextField>
            </Grid>
            {hasActiveFilters && (
              <Grid size={{ xs: 12, sm: 6, md: 2 }} sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip
                  label="Clear filters"
                  onClick={clearFilters}
                  onDelete={clearFilters}
                  deleteIcon={<Iconify icon="solar:close-circle-bold" />}
                  size="small"
                  sx={{ borderRadius: 999 }}
                />
              </Grid>
            )}
          </Grid>
        </Box>

        <TableContainer>
          <Table size="medium" sx={{ minWidth: 820 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Receipt No.</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Vendor</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Bill Refs</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Amount (৳)
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Loading receipts...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Iconify
                      icon="solar:receipt-bold-duotone"
                      width={48}
                      sx={{ color: 'text.disabled', display: 'block', mx: 'auto', mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      No receipts found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((row, idx) => {
                  const isAuto = row.bill_refs?.length > 0;
                  return (
                    <TableRow key={row.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {page * rowsPerPage + idx + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {row.number || row.payment_number}
                        </Typography>
                      </TableCell>
                      <TableCell>{row.vendor_name || '—'}</TableCell>
                      <TableCell>{row.date || '—'}</TableCell>
                      <TableCell>{row.method || '—'}</TableCell>
                      <TableCell>
                        {isAuto
                          ? row.bill_refs.map((b) => (
                              <Chip
                                key={b}
                                label={b}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 0.5 }}
                              />
                            ))
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={isAuto ? 'Auto' : 'Manual'}
                          color={isAuto ? 'info' : 'default'}
                          variant="soft"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          ৳
                          {parseFloat(row.amount || 0).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              component={RouterLink}
                              href={`/dashboard/accounting-finance/payables/money-receipt/${row.id}`}
                              sx={{
                                color: 'primary.main',
                                '&:hover': { bgcolor: 'primary.lighter' },
                              }}
                            >
                              <Iconify icon="solar:eye-bold" width={18} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              component={RouterLink}
                              href={`/dashboard/accounting-finance/payables/money-receipt/${row.id}`}
                              sx={{
                                color: 'warning.main',
                                '&:hover': { bgcolor: 'warning.lighter' },
                              }}
                            >
                              <Iconify icon="solar:pen-bold" width={18} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteTarget(row)}
                              sx={{ '&:hover': { bgcolor: 'error.lighter' } }}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Receipt"
        content={`Are you sure you want to delete receipt "${deleteTarget?.number || deleteTarget?.payment_number || ''}"? This action cannot be undone.`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        }
      />
    </Box>
  );
}
