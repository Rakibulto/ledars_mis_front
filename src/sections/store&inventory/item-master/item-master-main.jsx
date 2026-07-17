'use client';

import { mutate } from 'swr';
import Link from 'next/link';
import { toast } from 'sonner';
import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import Alert from '@mui/material/Alert';
import {
  Box,
  Card,
  Grid,
  Table,
  Stack,
  Button,
  Switch,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Typography,
  Pagination,
  FormControl,
  TableContainer,
  InputAdornment,
  FormControlLabel,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest, useDeleteRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import TableRowSkeleton from 'src/components/table/tableRowSkeleton';
// NOTE: These are external dependencies from the user's original code
import MuiAutocomplete from 'src/components/hook-form/mui-autocomplete';

import SummaryCard from '../../_components/summary-card';

const normalizeText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();
const STATUS_OPTIONS = [
  { id: '', name: 'All Status' },
  { id: 'Active', name: 'Active' },
  { id: 'Inactive', name: 'Inactive' },
];
const STOCK_STATUS_OPTIONS = [
  { id: '', name: 'All Stock Status' },
  { id: 'In Stock', name: 'In Stock' },
  { id: 'Low Stock', name: 'Low Stock' },
  { id: 'Out of Stock', name: 'Out of Stock' },
  { id: 'Overstock', name: 'Overstock' },
];

// Reusable Item Table Row Component
function ItemTableRow({ item, setDeleteItemId, confirm, onOpenDetails }) {
  const router = useRouter();

  const handleEdit = (event) => {
    event.stopPropagation();
    router.push(`/dashboard/store&inventory/item-master/create-item/?edit_item=${item?.id}`);
  };

  const handleDelete = (event) => {
    event.stopPropagation();
    setDeleteItemId(item?.id);
    confirm.onTrue();
  };

  return (
    <TableRow
      onClick={() => onOpenDetails(item?.id)}
      sx={{
        cursor: 'pointer',
        '&:hover': {
          bgcolor: '#f9fafb',
        },
        borderBottom: '1px solid #f3f4f6',
      }}
    >
      {/* Item Details */}
      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight={600} color="#1a1a1a" sx={{ mb: 0.5 }}>
            {item?.item_name}
          </Typography>
          <Typography variant="caption" color="#6b7280" display="block">
            Code: {item?.item_code}
          </Typography>
          <Typography variant="caption" color="#9ca3af">
            {item?.office_location_name || item?.location}
          </Typography>
        </Box>
      </TableCell>

      {/* Category */}
      <TableCell>
        <Box>
          <Typography variant="body2" color="#1a1a1a" fontWeight={500}>
            {item?.category}
          </Typography>
          <Typography variant="caption" color="#6b7280">
            {item?.subcategory}
          </Typography>
        </Box>
      </TableCell>

      {/* Asset Type */}
      <TableCell align="center">
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 1.5,
            py: 0.5,
            borderRadius: 1.5,
            bgcolor: item?.asset_type === 'Consumable Asset' ? '#eef2ff' : '#ecfdf5',
            color: item?.asset_type === 'Consumable Asset' ? '#3730a3' : '#065f46',
          }}
        >
          <Typography variant="body2" fontWeight={600} fontSize="0.8125rem">
            {item?.asset_type || 'Fixed Asset'}
          </Typography>
        </Box>
      </TableCell>

      {/* Current Stock */}
      <TableCell align="center">
        <Box>
          <Typography variant="h6" fontWeight={700} color="#1a1a1a">
            {item?.current_stock}
          </Typography>
          <Typography variant="caption" color="#6b7280">
            {item?.unit}
          </Typography>
        </Box>
      </TableCell>

      {/* Reorder Level */}
      <TableCell align="center">
        <Typography variant="body2" color="#6b7280">
          {item?.reorder_level} {item?.unit}
        </Typography>
      </TableCell>

      {/* Stock Status */}
      <TableCell align="center">
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 2,
            py: 0.5,
            borderRadius: 1.5,
            bgcolor:
              item?.stock_status === 'In Stock' || item?.stock_status === 'Good'
                ? '#d1fae5'
                : item?.stock_status === 'Low Stock'
                  ? '#fef3c7'
                  : '#fee2e2',
            color:
              item?.stock_status === 'In Stock' || item?.stock_status === 'Good'
                ? '#065f46'
                : item?.stock_status === 'Low Stock'
                  ? '#92400e'
                  : '#991b1b',
          }}
        >
          <Typography variant="body2" fontWeight={600} fontSize="0.8125rem">
            {item?.stock_status || 'Good'}
          </Typography>
        </Box>
      </TableCell>

      {/* Unit Price */}
      <TableCell align="right">
        <Typography variant="body2" fontWeight={600} color="#1a1a1a">
          ৳
          {Number(item?.unit_price || 0).toLocaleString('en-BD', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </Typography>
      </TableCell>

      {/* Old Price */}
      <TableCell align="right">
        <Typography variant="body2" fontWeight={500} color="#6b7280">
          {item?.old_unit_price != null
            ? `৳${Number(item.old_unit_price).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
            : '—'}
        </Typography>
      </TableCell>

      {/* Status */}
      <TableCell align="center">
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 2,
            py: 0.5,
            borderRadius: 1.5,
            bgcolor: item?.status === 'Active' ? '#d1fae5' : '#f3f4f6',
            color: item?.status === 'Active' ? '#065f46' : '#6b7280',
          }}
        >
          <Typography variant="body2" fontWeight={600} fontSize="0.8125rem">
            {item?.status}
          </Typography>
        </Box>
      </TableCell>

      {/* Actions */}
      <TableCell align="center">
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <Button
            onClick={handleEdit}
            size="small"
            variant="outlined"
            startIcon={<Iconify icon="solar:pen-bold" width={16} />}
            sx={{
              minWidth: 'auto',
              px: 1.5,
              py: 0.25,
              color: '#2563eb',
              borderColor: '#bfdbfe',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#93c5fd',
                bgcolor: '#eff6ff',
              },
            }}
          >
            Edit
          </Button>
          <IconButton
            onClick={handleDelete}
            size="small"
            sx={{
              color: '#ef4444',
              '&:hover': {
                bgcolor: (theme) => `rgba(${theme.palette.error.main}, 0.08)`,
              },
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default function ItemMasterMain() {
  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');
  const confirm = useBoolean();
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  const routeAssetTypeFilter =
    typeParam === 'asset' ? 'Fixed Asset' : typeParam === 'consumable' ? 'Consumable Asset' : '';

  const itemsQueryUrl = `${endpoints.storeInventory.items}?status=${statusFilter}&stock_status=${stockStatusFilter}&asset_type=${routeAssetTypeFilter}&category=${categoryFilter}&subcategory=&search=${searchQuery}&page=${page + 1}&pagination=true`;

  const {
    data: itemList,
    loading: itemListLoading,
    error: itemListError,
  } = useGetRequest(itemsQueryUrl);

  const {
    data: summary,
    loading: summaryLoading,
    error: summaryError,
  } = useGetRequest(endpoints.storeInventory.item_summary);
  const { data: allCategories, loading: allCategoriesLoading } = useGetRequest(
    `${endpoints.storeInventory.item_category}`
  );

  const ALL_CATEGORY_OPTION = {
    id: 'all',
    name: 'All Categories',
  };
  const categoryOptions = [ALL_CATEGORY_OPTION, ...(allCategories || [])];
  const deleteItem = useDeleteRequest;
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [exportingExcel, setExportingExcel] = useState(false);

  const handleItemDelete = async () => {
    try {
      await deleteItem(endpoints.storeInventory.item_by_id(deleteItemId));
      await mutate(itemsQueryUrl);
      await mutate(endpoints.storeInventory.item_summary);
      toast.success('Item deleted successfully');
    } catch (errord) {
      toast.error('Failed to delete item?. Please try again.');
    } finally {
      confirm.onFalse();
    }
  };

  const ROWS_PER_PAGE = itemList?.page_size || 10;

  const totalPages = useMemo(() => {
    const total = itemList?.total ?? 0;

    return Math.ceil(total / ROWS_PER_PAGE);
  }, [itemList?.total, ROWS_PER_PAGE]);

  const handleChangeDense = (event) => {
    setDense(event.target.checked);
  };

  const itemsToDisplay = useMemo(
    () => (Array.isArray(itemList?.results) ? itemList.results : []),
    [itemList]
  );

  const itemControls = useMemo(
    () => ({
      lowStock: itemsToDisplay.filter((item) => normalizeText(item?.stock_status) === 'low stock')
        .length,
      inactive: itemsToDisplay.filter((item) => normalizeText(item?.status) !== 'active').length,
      active: itemsToDisplay.filter((item) => normalizeText(item?.status) === 'active').length,
      outOfStock: itemsToDisplay.filter((item) => Number(item?.current_stock || 0) <= 0).length,
    }),
    [itemsToDisplay]
  );

  const handleOpenDetails = (itemId) => {
    router.push(`/dashboard/store&inventory/item-master/${itemId}`);
  };

  const hasActiveFilters =
    searchQuery !== '' || categoryFilter !== '' || statusFilter !== '' || stockStatusFilter !== '';

  const handleReset = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setStatusFilter('');
    setStockStatusFilter('');
    setPage(0);
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const exportUrl = `${endpoints.storeInventory.items}?status=${statusFilter}&stock_status=${stockStatusFilter}&asset_type=${routeAssetTypeFilter}&category=${categoryFilter}&search=${searchQuery}&pagination=false`;
      const response = await axiosInstance.get(exportUrl);
      const allItems = Array.isArray(response.data)
        ? response.data
        : (response.data?.results ?? []);

      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Ledars MIS';
      workbook.created = new Date();

      const ws = workbook.addWorksheet('Item Master');

      ws.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Item Name', key: 'item_name', width: 32 },
        { header: 'Item Code', key: 'item_code', width: 16 },
        { header: 'Barcode', key: 'barcode', width: 16 },
        { header: 'Category', key: 'category', width: 18 },
        { header: 'Subcategory', key: 'subcategory', width: 18 },
        { header: 'Asset Type', key: 'asset_type', width: 18 },
        { header: 'Unit', key: 'unit', width: 10 },
        { header: 'Current Stock', key: 'current_stock', width: 14 },
        { header: 'Reorder Level', key: 'reorder_level', width: 14 },
        { header: 'Stock Status', key: 'stock_status', width: 14 },
        { header: 'Unit Price', key: 'unit_price', width: 14 },
        { header: 'Old Price', key: 'old_unit_price', width: 14 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Location', key: 'location', width: 20 },
        { header: 'Description', key: 'description', width: 36 },
        { header: 'Created At', key: 'created_at', width: 20 },
        { header: 'Updated At', key: 'updated_at', width: 20 },
      ];

      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E40AF' },
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 22;

      allItems.forEach((item) => {
        const row = ws.addRow({
          id: item.id,
          item_name: item.item_name || '',
          item_code: item.item_code || '',
          barcode: item.barcode || '',
          category: item.category || '',
          subcategory: item.subcategory || '',
          asset_type: item.asset_type || '',
          unit: item.unit || '',
          current_stock: Number(item.current_stock ?? 0),
          reorder_level: Number(item.reorder_level ?? 0),
          stock_status: item.stock_status || '',
          unit_price: parseFloat(item.unit_price ?? 0),
          old_unit_price: item.old_unit_price != null ? parseFloat(item.old_unit_price) : null,
          status: item.status || '',
          location: item.location || '',
          description: item.description || '',
          created_at: item.created_at ? new Date(item.created_at).toLocaleString('en-BD') : '',
          updated_at: item.updated_at ? new Date(item.updated_at).toLocaleString('en-BD') : '',
        });
        row.alignment = { vertical: 'middle' };
      });

      ws.getColumn('unit_price').numFmt = '#,##0.00';
      ws.getColumn('old_unit_price').numFmt = '#,##0.00';
      ws.getColumn('current_stock').numFmt = '#,##0';
      ws.getColumn('reorder_level').numFmt = '#,##0';

      ws.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: allItems.length + 1, column: ws.columns.length },
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Item-Master-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${allItems.length} items to Excel.`);
    } catch (err) {
      toast.error('Failed to export Excel. Please try again.');
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      {/* Header */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="#1a1a1a" gutterBottom>
            Item Master
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage inventory items, categories, and specifications
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            disabled={exportingExcel}
            startIcon={
              exportingExcel ? null : <Iconify icon="solar:export-bold-duotone" width={18} />
            }
            onClick={handleExportExcel}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
          >
            {exportingExcel ? 'Exporting…' : 'Export Excel'}
          </Button>
          {/* <Link href="/dashboard/store&inventory/item-master/category-list" passHref>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="mingcute:add-line" />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                borderColor: '#2563eb',
                color: '#2563eb',
                fontWeight: 600,
                px: 3,
                '&:hover': {
                  borderColor: '#1d4ed8',
                  bgcolor: (theme) => `rgba(${theme.palette.primary.main}, 0.04)`,
                },
              }}
            >
              Add Category
            </Button>
          </Link> */}
          <Link href="/dashboard/store&inventory/item-master/create-item" passHref>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="mingcute:add-line" />}
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
              Add Item
            </Button>
          </Link>
        </Stack>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        The item master desk should show which catalog items are healthy, which are at risk of
        stockout, and which master records need cleanup before downstream warehouse transactions use
        them.
      </Alert>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
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
            <Grid size={{ xs: 12, md: 8 }} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {/* Search */}
              <TextField
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" sx={{ color: '#9ca3af' }} />
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
            <Grid size={{ xs: 12, md: 4 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl sx={{ width: '100%' }}>
                    <MuiAutocomplete
                      label="Category"
                      value={categoryFilter}
                      options={categoryOptions}
                      loading={allCategoriesLoading}
                      onChange={(id, item) => {
                        setPage(0);
                        setCategoryFilter(item?.name === 'All Categories' ? '' : item?.name || '');
                      }}
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
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl sx={{ width: '100%' }}>
                    <MuiAutocomplete
                      label="Status"
                      value={statusFilter}
                      options={STATUS_OPTIONS}
                      onChange={(id, item) => {
                        setPage(0);
                        setStatusFilter(item?.id || '');
                      }}
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
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl sx={{ width: '100%' }}>
                    <MuiAutocomplete
                      label="Stock"
                      value={stockStatusFilter}
                      options={STOCK_STATUS_OPTIONS}
                      onChange={(id, item) => {
                        setPage(0);
                        setStockStatusFilter(item?.id || '');
                      }}
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
                <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button
                    fullWidth
                    variant={hasActiveFilters ? 'contained' : 'outlined'}
                    color={hasActiveFilters ? 'error' : 'inherit'}
                    onClick={handleReset}
                    disabled={!hasActiveFilters}
                    startIcon={<Iconify icon="solar:restart-bold" width={16} />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      height: 40,
                    }}
                  >
                    Reset
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 12 }}>
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
                      Item Details
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                      Category
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}
                    >
                      Asset Type
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}
                    >
                      Current Stock
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}
                    >
                      Reorder Level
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}
                    >
                      Stock Status
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}
                    >
                      Unit Price
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}
                    >
                      Old Price
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}
                    >
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
                  {itemListLoading
                    ? Array.from({ length: 5 }, (_, i) => (
                        <TableRowSkeleton
                          key={i}
                          columns={[
                            { type: 'text', lines: 3, width: 120 },
                            { type: 'text', lines: 2, width: 100 },
                            { type: 'rect', width: 110, height: 24, align: 'center' },
                            { type: 'text', width: 50, align: 'center' },
                            { type: 'text', width: 60, align: 'center' },
                            { type: 'rect', width: 80, height: 24, align: 'center' },
                            { type: 'text', width: 70, align: 'right' },
                            { type: 'text', width: 70, align: 'right' },
                            { type: 'rect', width: 60, height: 24, align: 'center' },
                            { type: 'circle', count: 2, size: 32, align: 'center' },
                          ]}
                        />
                      ))
                    : itemsToDisplay.map((item) => (
                        <ItemTableRow
                          key={item?.id}
                          item={item}
                          setDeleteItemId={setDeleteItemId}
                          confirm={confirm}
                          onOpenDetails={handleOpenDetails}
                        />
                      ))}

                  {itemsToDisplay.length === 0 && !itemListLoading && !itemListError && (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                        <Stack alignItems="center" spacing={2}>
                          <Iconify
                            icon="solar:box-minimalistic-bold-duotone"
                            width={64}
                            sx={{ color: '#d1d5db' }}
                          />
                          <Typography variant="h6" color="text.secondary">
                            No items found
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
                <FormControlLabel
                  control={<Switch checked={dense} onChange={handleChangeDense} />}
                  label="Dense"
                />

                <Pagination
                  count={totalPages}
                  variant="outlined"
                  shape="rounded"
                  page={page + 1}
                  onChange={(event, pageNumber) => {
                    setPage(pageNumber - 1);
                  }}
                />
              </Box>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
      <Card sx={{ mt: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Item Control Queue
          </Typography>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#ecfdf5' }}>
                <Typography variant="body2" fontWeight={700}>
                  Active items
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {itemControls.active} items on this page are active and usable in operations.
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fff7ed' }}>
                <Typography variant="body2" fontWeight={700}>
                  Low stock
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {itemControls.lowStock} items need replenishment attention soon.
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fef2f2' }}>
                <Typography variant="body2" fontWeight={700}>
                  Out of stock
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {itemControls.outOfStock} items have no available stock and can block requests.
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                <Typography variant="body2" fontWeight={700}>
                  Inactive records
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {itemControls.inactive} items need master-data review before reuse.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Card>
      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content="Are you sure you want to delete this Item record?"
        action={
          <Button variant="contained" color="error" onClick={handleItemDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
