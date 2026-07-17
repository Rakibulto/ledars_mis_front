'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { useMemo, useState, useCallback } from 'react';

// MUI imports
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Pagination from '@mui/material/Pagination';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import FormControlLabel from '@mui/material/FormControlLabel';
import { Table, Container, TextField, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { ConfirmDialog } from 'src/components/custom-dialog';
import TableRowSkeleton from 'src/components/table/tableRowSkeleton';
import MuiAutocomplete from 'src/components/hook-form/mui-autocomplete';

import SummaryCard from 'src/sections/_components/summary-card';

import PurchaseOrderDownload from './po-pdf-button';

// Purchase Order Table Row Component
function PurchaseOrderTableRow({ order, onDelete, onPdf }) {
  const getStatusColor = (status) => {
    const statusMap = {
      Draft: {
        bg: '#f3f4f6', // neutral gray
        color: '#4b5563',
      },

      'Pending Approval': {
        bg: '#fef3c7', // warning / waiting
        color: '#92400e',
      },

      Approved: {
        bg: '#d1fae5', // success
        color: '#065f46',
      },

      'Sent to Supplier': {
        bg: '#dbeafe', // info / in progress
        color: '#1e40af',
      },

      'Partially Received': {
        bg: '#fce7f3', // partial / attention
        color: '#9f1239',
      },

      Completed: {
        bg: '#dcfce7', // completed / success strong
        color: '#166534',
      },

      Cancelled: {
        bg: '#fee2e2', // error / cancelled
        color: '#991b1b',
      },
    };

    return statusMap[status] || { bg: '#f3f4f6', color: '#4b5563' };
  };

  const statusColor = getStatusColor(order?.approval_status);

  return (
    <TableRow
      sx={{
        '&:hover': { bgcolor: '#f9fafb' },
        transition: 'background-color 0.2s',
      }}
    >
      <TableCell>
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" color="primary">
            {order?.po_number}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {order?.approval_status}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{order?.supplier_name}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{fDate(order?.created_at?.split('T')[0])}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{fDate(order?.delivery_date)}</Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="subtitle2" fontWeight={600}>
          {fCurrency(order?.total_amount)}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Typography variant="body2">{order?.item_count}</Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={order?.approval_status}
          size="small"
          sx={{
            bgcolor: statusColor.bg,
            color: statusColor.color,
            '&:hover': { bgcolor: statusColor.bg },
            fontWeight: 600,
            borderRadius: '16px',
            fontSize: '0.75rem',
          }}
        />
      </TableCell>
      <TableCell align="center">
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <Link href={`${paths.dashboard.procurement.purchase_orders}/details/?po_id=${order?.id}`}>
            <IconButton
              size="small"
              sx={{
                color: 'primary.main',
                '&:hover': { bgcolor: 'primary.lighter' },
              }}
            >
              <Icon icon="eva:eye-fill" width={18} />
            </IconButton>
          </Link>
          {/* <IconButton
            size="small"
            onClick={onPdf}
            sx={{
              color: 'success.main',
              '&:hover': { bgcolor: 'success.lighter' },
            }}
          >fdgdfg
          </IconButton> */}
          <PurchaseOrderDownload data={order} />
        </Stack>
      </TableCell>
    </TableRow>
  );
}

// Main Component
export default function PurchaseOrdersMain() {
  // pdf
  const downloadPDF = async () => {
    const response = await fetch('/api/po_pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders: ordersToDisplay }),
    });

    if (!response.ok) {
      throw new Error('PDF generation failed');
    }

    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'purchase_orders.pdf';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // pdf
  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  // console.log('Status Filter:', statusFilter);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const editModal = useBoolean();
  const confirm = useBoolean();

  // API calls
  const {
    data: poData,
    loading: poDataLoading,
    error: poDataError,
  } = useGetRequest(`${endpoints.procurement.purchase_orders}?page=${page + 1}&pagination=true`);

  const {
    data: filteredPoData,
    loading: filteredPoDataLoading,
    error: filteredPoDataError,
  } = useGetRequest(
    `${endpoints.procurement.purchase_orders}?search=${searchQuery}&approval_status=${statusFilter}&page=${page + 1}&pagination=true`
  );

  const {
    data: summary,
    loading: summaryLoading,
    error: summaryError,
  } = useGetRequest(endpoints.procurement.purchase_order_summary);
  // {
  //     "total_pos": 15,
  //     "pending_pos": 5,
  //     "approved_pos": 3
  // }

  const ROWS_PER_PAGE = poData?.page_size || 10;

  // Calculate total pages
  const totalPages = useMemo(() => {
    const total = filteredPoData?.total ?? poData?.total ?? 0;
    return Math.ceil(total / ROWS_PER_PAGE);
  }, [filteredPoData?.total, poData?.total, ROWS_PER_PAGE]);

  const ordersToDisplay = useMemo(
    () => filteredPoData?.results ?? poData?.results ?? [],
    [poData, filteredPoData]
  );

  // console.log('Orders to Display:', ordersToDisplay);
  const handleChangeDense = (event) => {
    setDense(event.target.checked);
  };

  const [deleteId, setDeleteId] = useState(null);

  const handleDelete = useCallback(
    (id) => {
      setDeleteId(id);
      confirm.onTrue();
    },
    [confirm]
  );

  const handleConfirmDelete = useCallback(async () => {
    try {
      await axiosInstance.delete(`${endpoints.procurement.purchase_orders}${deleteId}/`);
      mutate(`${endpoints.procurement.purchase_orders}?page=${page + 1}&pagination=true`);
      mutate(endpoints.procurement.purchase_order_summary);
      toast.success('Purchase order deleted');
      confirm.onFalse();
      setDeleteId(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  }, [deleteId, page, confirm]);

  const statusOptions = [
    { id: '', name: 'All Status' },
    { id: 'Draft', name: 'Draft' },
    { id: 'Pending Approval', name: 'Pending Approval' },
    { id: 'Approved', name: 'Approved' },
    { id: 'Sent to Supplier', name: 'Sent to Supplier' },
    { id: 'Partially Received', name: 'Partially Received' },
    { id: 'Completed', name: 'Completed' },
    { id: 'Cancelled', name: 'Cancelled' },
  ];
  return (
    <Container maxWidth="2xl" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Purchase Orders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage purchase orders and track deliveries
          </Typography>
        </Box>
        <Link href={paths.dashboard.procurement.add_purchase_order} passHref>
          <Button
            variant="outlined"
            startIcon={<Icon icon="solar:add-circle-bold" width={20} />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              borderColor: 'primary.main',
              color: 'primary.main',
              fontWeight: 600,
              px: 3,
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: (theme) => `rgba(${theme.palette.primary.main}, 0.04)`,
              },
            }}
          >
            Create PO
          </Button>
        </Link>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total POs"
            value={summary?.total_pos ?? 0}
            icon="solar:document-text-bold-duotone"
            bgcolor="#2563eb90"
            boxShadow="0 4px 20px rgba(37, 99, 235, 0.3)"
            loading={summaryLoading}
            error={summaryError}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Pending"
            value={summary?.pending_pos ?? 0}
            icon="solar:clock-circle-bold-duotone"
            bgcolor="#f59e0b90"
            boxShadow="0 4px 20px rgba(245, 158, 11, 0.3)"
            loading={summaryLoading}
            error={summaryError}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Approved"
            value={summary?.approved_pos ?? 0}
            icon="solar:check-circle-bold-duotone"
            bgcolor="#10b98190"
            boxShadow="0 4px 20px rgba(16, 185, 129, 0.3)"
            loading={summaryLoading}
            error={summaryError}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Value"
            value={`UGX ${fCurrency(summary?.total_value ?? 0)}`}
            icon="solar:wallet-money-bold-duotone"
            bgcolor="#8b5cf690"
            boxShadow="0 4px 20px rgba(139, 92, 246, 0.3)"
            loading={summaryLoading}
            error={summaryError}
          />
        </Grid>
      </Grid>

      {/* Search and Filter Bar */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 10 }}>
              <TextField
                fullWidth
                placeholder="Search purchase orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon icon="eva:search-fill" width={20} style={{ color: '#9ca3af' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f9fafb',
                    '& fieldset': {
                      borderColor: '#e5e7eb',
                    },
                    '&:hover fieldset': {
                      borderColor: '#d1d5db',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2563eb',
                    },
                  },
                }}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <MuiAutocomplete
                label="Status"
                value={statusFilter}
                options={statusOptions}
                loading={false}
                onChange={(id, item) =>
                  setStatusFilter(item?.name === 'All Status' ? '' : item?.name || '')
                }
                sx={{
                  borderRadius: 2,
                  bgcolor: '#f9fafb',
                  '& fieldset': {
                    borderColor: '#e5e7eb',
                  },
                  '&:hover fieldset': {
                    borderColor: '#d1d5db',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#d1d5db',
                  },
                }}
              />
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Table */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
        <TableContainer>
          <Table size={dense ? 'small' : 'medium'}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                  PO Number
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                  Supplier
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                  Date
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                  Delivery Date
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}
                >
                  Amount
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}
                >
                  Items
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                  Status
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {poDataLoading || filteredPoDataLoading
                ? Array.from({ length: 5 }, (_, i) => (
                    <TableRowSkeleton
                      key={i}
                      columns={[
                        { type: 'text', lines: 2, width: 120 },
                        { type: 'text', width: 150 },
                        { type: 'text', width: 100 },
                        { type: 'text', width: 100 },
                        { type: 'text', width: 100, align: 'right' },
                        { type: 'text', width: 50, align: 'center' },
                        { type: 'rect', width: 100, height: 24 },
                        { type: 'circle', count: 2, size: 32, align: 'center' },
                      ]}
                    />
                  ))
                : ordersToDisplay.map((order) => (
                    <PurchaseOrderTableRow
                      key={order?.id}
                      order={order}
                      onDelete={() => handleDelete(order?.id)}
                      onPdf={downloadPDF}
                    />
                  ))}

              {ordersToDisplay.length === 0 && !poDataLoading && !filteredPoDataLoading && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Stack alignItems="center" spacing={2}>
                      <Icon
                        icon="solar:document-text-bold-duotone"
                        width={64}
                        style={{ color: '#d1d5db' }}
                      />
                      <Typography variant="h6" color="text.secondary">
                        No purchase orders found
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        Try adjusting your search or filter
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 2,
              px: 2,
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <FormControlLabel
              control={<Switch checked={dense} onChange={handleChangeDense} />}
              label="Dense"
            />
            <Pagination
              count={totalPages}
              page={page + 1}
              variant="outlined"
              shape="rounded"
              onChange={(event, pageNumber) => {
                setPage(pageNumber - 1);
              }}
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: 2,
                },
                '& .Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                },
              }}
            />
          </Box>
        </TableContainer>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Purchase Order"
        content="Are you sure you want to delete this purchase order? This action cannot be undone."
        action={
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Delete
          </Button>
        }
      />
    </Container>
  );
}
