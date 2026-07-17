'use client';

import { mutate } from 'swr';
import Link from 'next/link';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { useMemo, useState } from 'react';

// MUI imports
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
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
import { Table, Container, TextField, Typography, FormControl } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, useDeleteRequest } from 'src/actions/ledars-hook';

import { ConfirmDialog } from 'src/components/custom-dialog';
import TableRowSkeleton from 'src/components/table/tableRowSkeleton';
import MuiAutocomplete from 'src/components/hook-form/mui-autocomplete';

import SummaryCard from 'src/sections/_components/summary-card';

// Star Rating Component
const StarRating = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const stars = [];

  for (let i = 0; i < 5; i += 1) {
    stars.push(
      <Icon
        key={i}
        icon={i < fullStars ? 'solar:star-bold' : 'solar:star-outline'}
        width={18}
        style={{
          color: i < fullStars ? '#FBBF24' : '#D1D5DB',
          marginRight: 2,
        }}
      />
    );
  }

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>{stars}</Box>
      <Typography variant="body2" color="text.secondary">
        {rating.toFixed(1)}
      </Typography>
    </Stack>
  );
};

// Reusable Supplier Table Row Component
function SupplierTableRow({ supplier, onDelete }) {
  // console.log('Rendering SupplierTableRow for supplier:', supplier); // Debug log to check supplier data
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'Inactive':
        return { bg: '#f5f5f5', color: '#616161' };
      case 'Blacklisted':
        return { bg: '#ffebee', color: '#c62828' };
      default:
        return { bg: '#f5f5f5', color: '#616161' };
    }
  };

  const statusColor = getStatusColor(supplier?.status);

  return (
    <TableRow
      sx={{
        '&:hover': { bgcolor: '#f9fafb' },
        transition: 'background-color 0.2s',
      }}
    >
      <TableCell>
        <Box>
          <Typography variant="subtitle2" fontWeight="bold">
            {supplier?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Code: {supplier?.code}
          </Typography>
          <br />
          <Typography variant="caption" color="text.secondary">
            {supplier?.category}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Stack spacing={0.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Icon icon="solar:phone-bold" width={14} style={{ color: '#64748b' }} />
            <Typography variant="body2" color="text.secondary">
              {supplier?.phone}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Icon icon="solar:letter-bold" width={14} style={{ color: '#64748b' }} />
            <Typography variant="body2" color="text.secondary">
              {supplier?.email}
            </Typography>
          </Stack>
        </Stack>
      </TableCell>
      <TableCell>
        <StarRating rating={parseFloat(supplier?.rating)} />
      </TableCell>
      <TableCell align="center">
        <Typography variant="body2">{supplier?.total_orders}</Typography>
      </TableCell>
      <TableCell align="center">
        <Typography variant="body2">{supplier?.active_contracts}</Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={supplier?.status}
          size="small"
          sx={{
            bgcolor: statusColor.bg,
            color: statusColor.color,
            fontWeight: 600,
            borderRadius: '16px',
          }}
        />
      </TableCell>
      <TableCell align="center">
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <Link
            href={`/dashboard/procurement/supplier-management/add-supplier/?edit_supplier=${supplier?.id}`}
            passHref
          >
            <IconButton
              size="small"
              sx={{
                color: '#2563eb',
                '&:hover': { bgcolor: '#eff6ff' },
              }}
            >
              <Icon icon="solar:pen-bold" width={18} />
            </IconButton>
          </Link>
          <IconButton
            size="small"
            onClick={() => onDelete(supplier?.id)}
            sx={{
              color: '#dc2626',
              '&:hover': { bgcolor: '#fef2f2' },
            }}
          >
            <Icon icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

// Main Component
export default function SupplierManagementPage() {
  // real implementation started
  const [page, setPage] = useState(0);
  const confirm = useBoolean();
  const [dense, setDense] = useState(false); // State for table density
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');

  // console.log('searchQuery', searchQuery);
  // console.log('categoryFilter', categoryFilter);

  // Rows per page is fixed at 36 based on the user's hardcoded value in TablePagination.
  // The API is assumed to also use this value.

  // API call uses 1-based page index: page + 1
  const {
    data: supplierData,
    loading: supplierDataLoading,
    error: supplierDataError,
  } = useGetRequest(`${endpoints.procurement.suppliers}?page=${page + 1}&pagination=true`);
  // console.log('API response for supplierData:', supplierData);
  // /api/supplier/?category=Dicta+aliqua+Offici&status=Active&rating=2.00&search=&page=1&pagination=true
  const {
    data: filteredItems,
    loading: filteredItemsLoading,
    error: filteredItemsError,
  } = useGetRequest(
    `${endpoints.procurement.suppliers}?category=${categoryFilter}&status=${statusFilter}&rating=${stockStatusFilter}&search=${searchQuery}&page=${page + 1}&pagination=true`
  );

  // console.log('API response for filteredItems:', filteredItems);
  // console.log('API response for items:', data);
  // console.log('filtered datai item:', filteredItems);
  const {
    data: summary,
    loading: summaryLoading,
    error: summaryError,
  } = useGetRequest(endpoints.procurement.supplier_summary);
  const { data: allCategories, loading: allCategoriesLoading } = useGetRequest(
    `${endpoints.storeInventory.item_category}` // Assuming this endpoint exists, or adjust as needed
  );

  const ALL_CATEGORY_OPTION = {
    id: 'all',
    name: 'All Categories',
  };
  const categoryOptions = [ALL_CATEGORY_OPTION, ...(allCategories || [])];
  const [deleteId, setDeleteId] = useState(null);
  const handleSupplierDelete = async () => {
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      await useDeleteRequest(endpoints.procurement.supplier_by_id(deleteId));
      await mutate(
        `${endpoints.procurement.suppliers}?category=${categoryFilter}&status=${statusFilter}&rating=${stockStatusFilter}&search=${searchQuery}&page=${page + 1}&pagination=true`
      );
      await mutate(`${endpoints.procurement.suppliers}?page=${page + 1}&pagination=true`); // Revalidate current page after deletion
      await mutate(endpoints.procurement.supplier_summary); // Revalidate summary data after deletion
      toast.success('Supplier deleted successfully');
    } catch (error) {
      toast.error('Failed to delete supplier?. Please try again.');
    } finally {
      confirm.onFalse();
    }
  };

  const ROWS_PER_PAGE = supplierData?.page_size || 10; // Fallback to 10 if API doesn't provide page_size

  // Calculate total pages based on API response
  const totalPages = useMemo(() => {
    const total = filteredItems?.total ?? supplierData?.total ?? 0;

    return Math.ceil(total / ROWS_PER_PAGE);
  }, [filteredItems?.total, supplierData?.total, ROWS_PER_PAGE]);

  const handleChangeDense = (event) => {
    setDense(event.target.checked);
  };

  // Suppliers to display are simply the paginated results from the API
  const suppliersToDisplay = useMemo(() => {
    console.log('API supplierData:'); // Debug log to check API response structure
    return filteredItems?.results ? filteredItems?.results : supplierData?.results || [];
  }, [supplierData, filteredItems]);

  // real implementation ended

  return (
    <Container maxWidth="2xl" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          px: { xs: 2, md: 3 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Supplier Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage suppliers, vendors, and service providers
          </Typography>
        </Box>
        <Link href="/dashboard/procurement/supplier-management/add-supplier" passHref>
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
            Add Supplier
          </Button>
        </Link>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Suppliers"
            value={summary?.total_suppliers ?? 0}
            icon="solar:buildings-2-bold-duotone"
            bgcolor="#2563eb90"
            boxShadow="0 4px 20px rgba(37, 99, 235, 0.3)"
            loading={summaryLoading}
            error={summaryError}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Active Suppliers"
            value={summary?.active_suppliers ?? 0}
            icon="solar:chart-bold-duotone"
            bgcolor="#10b98190"
            boxShadow="0 4px 20px rgba(16, 185, 129, 0.3)"
            loading={summaryLoading}
            error={summaryError}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Active Contracts"
            value={summary?.active_contracts ?? 0}
            icon="solar:document-text-bold-duotone"
            bgcolor="#8b5cf690"
            boxShadow="0 4px 20px rgba(139, 92, 246, 0.3)"
            loading={summaryLoading}
            error={summaryError}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Avg. Rating"
            value={summary?.avg_rating ?? 0}
            icon="solar:medal-star-bold-duotone"
            bgcolor="#f9731690"
            boxShadow="0 4px 20px rgba(249, 115, 22, 0.3)"
            loading={summaryLoading}
            error={summaryError}
          />
        </Grid>
      </Grid>
      {/* <Grid container spacing={3} mb={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <SummaryCard
                  title="Total Items"
                  value={summary?.total_items ?? 0}
                  icon="solar:box-bold-duotone"
                  bgcolor="#2563eb90"
                  boxShadow="0 4px 20px rgba(37, 99, 235, 0.3)"
                  loading={summaryLoading}
                  error={summaryError}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <SummaryCard
                  title="Active Items"
                  value={summary?.total_active_items ?? 0}
                  icon="solar:tag-bold-duotone"
                  bgcolor="#10b98190"
                  boxShadow="0 4px 20px rgba(16, 185, 129, 0.3)"
                  loading={summaryLoading}
                  error={summaryError}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <SummaryCard
                  title="Low Stock Items"
                  value={summary?.total_low_stock_items ?? 0}
                  icon="solar:danger-circle-bold-duotone"
                  bgcolor="#ef444490"
                  boxShadow="0 4px 20px rgba(239, 68, 68, 0.3)"
                  loading={summaryLoading}
                  error={summaryError}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <SummaryCard
                  title="Categories"
                  value={summary?.total_categories ?? 0}
                  icon="solar:tag-horizontal-bold-duotone"
                  bgcolor="#8b5cf690"
                  boxShadow="0 4px 20px rgba(139, 92, 246, 0.3)"
                  loading={summaryLoading}
                  error={summaryError}
                />
              </Grid>
            </Grid> */}

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
            <Grid size={{ xs: 12, md: 10 }} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {/* Search */}
              <TextField
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon icon="eva:search-fill" sx={{ color: '#9ca3af' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minHeight: 40,
                  flexGrow: 1,
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
                      borderColor: '#d1d5db',
                    },
                  },
                }}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              {/* Category Filter */}
              <FormControl sx={{ width: '100%' }}>
                <MuiAutocomplete
                  label="Category"
                  value={categoryFilter}
                  options={categoryOptions}
                  loading={allCategoriesLoading}
                  onChange={(id, item) =>
                    setCategoryFilter(item?.name === 'All Categories' ? '' : item?.name || '')
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
              </FormControl>
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
            {/* Apply dense padding */}
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                  Supplier Details
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                  Contact
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                  Rating
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}
                >
                  Orders
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}
                >
                  Contracts
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
              {supplierDataLoading || filteredItemsLoading
                ? Array.from({ length: 5 }, (_, i) => (
                    <TableRowSkeleton
                      key={i}
                      columns={[
                        { type: 'text', lines: 3, width: 120 },
                        { type: 'text', lines: 2, width: 100 },
                        { type: 'text', width: 50, align: 'center' },
                        { type: 'text', width: 60, align: 'center' },
                        { type: 'rect', width: 80, height: 24, align: 'center' },
                        { type: 'rect', width: 60, height: 24, align: 'center' },
                        { type: 'circle', count: 2, size: 32, align: 'center' },
                      ]}
                    />
                  ))
                : suppliersToDisplay.map((supplier) => (
                    <SupplierTableRow
                      key={supplier?.id}
                      supplier={supplier}
                      onDelete={() => {
                        setDeleteId(supplier?.id);
                        confirm.onTrue();
                      }}
                    />
                  ))}

              {suppliersToDisplay.length === 0 && !supplierDataLoading && !filteredItemsLoading && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Stack alignItems="center" spacing={2}>
                      <Icon
                        icon="solar:box-minimalistic-bold-duotone"
                        width={64}
                        sx={{ color: '#d1d5db' }}
                      />
                      <Typography variant="h6" color="text.secondary">
                        No suppliers found
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 3, px: 1 }}>
            {/* Table Pagination - Server Controlled */}
            {/* Dense Padding Control */}
            <FormControlLabel
              control={<Switch checked={dense} onChange={handleChangeDense} />}
              label="Dense"
            />
            <Pagination
              count={totalPages}
              variant="outlined"
              shape="rounded"
              onChange={(event, pageNumber) => {
                setPage(pageNumber - 1);
              }}
            />
          </Box>
        </TableContainer>
      </Card>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content="Are you sure you want to delete this Supplier record?"
        action={
          <Button variant="contained" color="error" onClick={handleSupplierDelete}>
            Delete
          </Button>
        }
      />

      {/* Add Supplier Modal */}
      {/* <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold" fontSize="1.25rem">
            Add New Supplier
          </Typography>
          <IconButton onClick={() => setShowAddModal(false)} size="small">
            <Icon icon="solar:close-circle-bold" width={24} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Supplier Name *
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Enter supplier name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Category *
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={formData.category}
                onChange={(e) => handleFormChange('category', e.target.value)}
              >
                {CATEGORIES.filter((c) => c !== 'All Categories').map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Contact Person *
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Enter contact person name"
                value={formData.contactPerson}
                onChange={(e) => handleFormChange('contactPerson', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Phone *
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="+256 700 000000"
                value={formData.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Email *
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Tax ID *
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="TIN-1234567890"
                value={formData.taxId}
                onChange={(e) => handleFormChange('taxId', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Address *
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Enter full address"
                value={formData.address}
                onChange={(e) => handleFormChange('address', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Payment Terms *
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={formData.paymentTerms}
                onChange={(e) => handleFormChange('paymentTerms', e.target.value)}
              >
                {PAYMENT_TERMS.map((term) => (
                  <MenuItem key={term} value={term}>
                    {term}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Status *
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={formData.status}
                onChange={(e) => handleFormChange('status', e.target.value)}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setShowAddModal(false)}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddSupplier}
            sx={{
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' },
              textTransform: 'none',
            }}
          >
            Add Supplier
          </Button>
        </DialogActions>
      </Dialog> */}
    </Container>
  );
}
