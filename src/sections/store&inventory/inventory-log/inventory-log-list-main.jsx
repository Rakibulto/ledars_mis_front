'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Stack,
  Table,
  Button,
  Switch,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Pagination,
  Typography,
  InputAdornment,
  TableContainer,
  CircularProgress,
  FormControlLabel,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useDebounce } from 'src/hooks/use-debounce';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import TableRowSkeleton from 'src/components/table/tableRowSkeleton';

import SummaryCard from 'src/sections/_components/summary-card';

import { formatDateTime, formatQuantity, normalizeCollection } from './inventory-log-utils';

const EP = endpoints.storeInventory;
const PAGE_SIZE = 10;
const ASSET_TYPE_OPTIONS = [
  { value: '', label: 'All Asset Types' },
  { value: 'Fixed Asset', label: 'Fixed Asset' },
  { value: 'Consumable Asset', label: 'Consumable Asset' },
];

function buildInventoryItemQuery({ assetType, search, page, pagination }) {
  const params = new URLSearchParams();

  params.set('ordering', 'name');

  if (assetType) {
    params.set('asset_type', assetType);
  }

  if (search?.trim()) {
    params.set('search', search.trim());
  }

  if (pagination) {
    params.set('pagination', 'true');
    params.set('page', String(page + 1));
    params.set('page_size', String(PAGE_SIZE));
  }

  return `${EP.items}?${params.toString()}`;
}

function getStockStatusChipProps(stockStatus) {
  switch (
    String(stockStatus || '')
      .trim()
      .toLowerCase()
  ) {
    case 'in stock':
      return { color: 'success', label: 'In Stock' };
    case 'low stock':
      return { color: 'warning', label: 'Low Stock' };
    case 'out of stock':
      return { color: 'error', label: 'Out of Stock' };
    case 'overstock':
      return { color: 'info', label: 'Overstock' };
    default:
      return { color: 'default', label: stockStatus || 'Unknown' };
  }
}

function getLifecycleStatusChipProps(status) {
  switch (
    String(status || '')
      .trim()
      .toLowerCase()
  ) {
    case 'active':
      return { color: 'success', label: 'Active' };
    case 'inactive':
      return { color: 'default', label: 'Inactive' };
    default:
      return { color: 'default', label: status || 'Unknown' };
  }
}

function InventoryItemRow({ item, serialNumber }) {
  const stockStatusChip = getStockStatusChipProps(item.stock_status);
  const lifecycleStatusChip = getLifecycleStatusChipProps(item.status);
  const categoryLabel = [item.category, item.subcategory].filter(Boolean).join(' / ');

  return (
    <TableRow
      hover
      sx={{
        '&:hover': {
          bgcolor: '#f8fafc',
        },
      }}
    >
      <TableCell align="center" sx={{ width: 56 }}>
        <Typography variant="body2" fontWeight={700} color="#64748b">
          {serialNumber}
        </Typography>
      </TableCell>
      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="body2" fontWeight={700} color="#0f172a">
            {item.item_name || 'Unnamed item'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {item.item_code || 'No item code'}
            {item.unit ? ` • ${item.unit}` : ''}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Stack spacing={0.4}>
          <Typography variant="body2" color="#0f172a">
            {categoryLabel || 'Uncategorized'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {item.asset_type || 'No asset type'}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="#0f172a">
          {item.location || 'No location assigned'}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontWeight={700} color="#0f172a">
          {formatQuantity(item.current_stock, item.unit)}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Chip
          size="small"
          color={stockStatusChip.color}
          label={stockStatusChip.label}
          variant="soft"
        />
      </TableCell>
      <TableCell align="center">
        <Chip
          size="small"
          color={lifecycleStatusChip.color}
          label={lifecycleStatusChip.label}
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="#0f172a">
          {formatDateTime(item.updated_at || item.created_at)}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

export default function InventoryLogListMain() {
  const [assetTypeFilter, setAssetTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const debouncedSearch = useDebounce(searchQuery, 400);

  const listUrl = useMemo(
    () =>
      buildInventoryItemQuery({
        assetType: assetTypeFilter,
        search: debouncedSearch,
        page,
        pagination: true,
      }),
    [assetTypeFilter, debouncedSearch, page]
  );

  const summaryUrl = useMemo(
    () =>
      buildInventoryItemQuery({
        assetType: assetTypeFilter,
        search: debouncedSearch,
        page: 0,
        pagination: false,
      }),
    [assetTypeFilter, debouncedSearch]
  );

  const { data: rawList, loading: listLoading, error: listError } = useGetRequest(listUrl);
  const { data: rawSummary } = useGetRequest(summaryUrl);

  const rows = useMemo(() => normalizeCollection(rawList), [rawList]);
  const summaryRows = useMemo(() => normalizeCollection(rawSummary), [rawSummary]);

  const totalPages = Math.max(1, Number(rawList?.total_pages || 1));
  const totalCount = Number(rawList?.count || summaryRows.length || 0);

  const summaryMetrics = useMemo(
    () => ({
      total: totalCount,
      inStock: summaryRows.filter((row) => row.stock_status === 'In Stock').length,
      lowStock: summaryRows.filter((row) => row.stock_status === 'Low Stock').length,
      currentQuantity: formatQuantity(
        summaryRows.reduce((total, row) => total + Number(row.current_stock || 0), 0)
      ),
    }),
    [summaryRows, totalCount]
  );

  const canResetFilters = Boolean(assetTypeFilter || searchQuery.trim() || page !== 0);

  const handleResetFilters = () => {
    setAssetTypeFilter('');
    setSearchQuery('');
    setPage(0);
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Stack spacing={3}>
        <Card
          sx={{
            p: 3.5,
            borderRadius: 4,
            color: 'common.white',
            background: 'linear-gradient(135deg, #082f49 0%, #0f766e 44%, #f59e0b 100%)',
            boxShadow: '0 24px 48px rgba(15, 23, 42, 0.18)',
          }}
        >
          <Stack spacing={2.5}>
            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              justifyContent="space-between"
              spacing={2}
              alignItems={{ lg: 'center' }}
            >
              <Box>
                <Typography variant="overline" sx={{ opacity: 0.82 }}>
                  Store and inventory stock position
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ mt: 0.25 }}>
                  Inventory Log
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 760, mt: 1 }}>
                  This list now reads directly from the item inventory catalog. Use it to review
                  current quantity, stock health, and recent item updates while keeping movement
                  history and analytics on their dedicated screens.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
                <Button
                  variant="outlined"
                  onClick={handleResetFilters}
                  disabled={!canResetFilters}
                  startIcon={<Iconify icon="solar:restart-bold-duotone" />}
                  sx={{ borderColor: 'rgba(255,255,255,0.36)', color: 'common.white' }}
                >
                  Reset Filters
                </Button>
                <Button
                  component={Link}
                  href={paths.dashboard.storeInventory.inventoryLogHistory}
                  variant="outlined"
                  startIcon={<Iconify icon="solar:history-bold-duotone" />}
                  sx={{ borderColor: 'rgba(255,255,255,0.36)', color: 'common.white' }}
                >
                  History View
                </Button>
                <Button
                  component={Link}
                  href={paths.dashboard.storeInventory.inventoryLogAnalytics}
                  variant="outlined"
                  startIcon={<Iconify icon="solar:graph-up-bold-duotone" />}
                  sx={{ borderColor: 'rgba(255,255,255,0.36)', color: 'common.white' }}
                >
                  Analytics
                </Button>
              </Stack>
            </Stack>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ p: 2.25, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.12)' }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Filtered Items
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {summaryMetrics.total}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ p: 2.25, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.12)' }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    In Stock
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {summaryMetrics.inStock}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ p: 2.25, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.12)' }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Low Stock
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {summaryMetrics.lowStock}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ p: 2.25, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.12)' }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Current Quantity
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {summaryMetrics.currentQuantity}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Stack>
        </Card>

        <Alert severity="info" sx={{ borderRadius: 2 }}>
          This page now loads item inventory rows from /api/items/. Search and asset type filters
          are applied on the server, and create, edit, and delete stock-movement actions remain
          removed from this list.
        </Alert>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Items"
              value={summaryMetrics.total}
              icon="solar:box-bold-duotone"
              bgcolor="#0f766e"
              boxShadow="0 4px 20px rgba(15, 118, 110, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="In Stock"
              value={summaryMetrics.inStock}
              icon="solar:check-circle-bold-duotone"
              bgcolor="#15803d"
              boxShadow="0 4px 20px rgba(21, 128, 61, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Low Stock"
              value={summaryMetrics.lowStock}
              icon="solar:danger-triangle-bold-duotone"
              bgcolor="#d97706"
              boxShadow="0 4px 20px rgba(217, 119, 6, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Current Qty"
              value={summaryMetrics.currentQuantity}
              icon="solar:calculator-bold-duotone"
              bgcolor="#1d4ed8"
              boxShadow="0 4px 20px rgba(29, 78, 216, 0.28)"
            />
          </Grid>
        </Grid>

        <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 7 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search item, code, category, or subcategory..."
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:magnifer-bold-duotone" width={18} />
                    </InputAdornment>
                  ),
                  endAdornment:
                    searchQuery !== debouncedSearch ? (
                      <CircularProgress color="inherit" size={16} />
                    ) : null,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Asset Type"
                value={assetTypeFilter}
                onChange={(event) => {
                  setAssetTypeFilter(event.target.value);
                  setPage(0);
                }}
              >
                {ASSET_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Card>

        {listError && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Inventory items could not be loaded from the backend.
          </Alert>
        )}

        <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <TableContainer>
            <Table size={dense ? 'small' : 'medium'}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell align="center" sx={{ width: 56 }}>
                    #
                  </TableCell>
                  <TableCell>Item</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell align="right">Current Quantity</TableCell>
                  <TableCell align="center">Stock Status</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell>Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {listLoading
                  ? Array.from({ length: 5 }, (_, index) => (
                      <TableRowSkeleton
                        key={index}
                        columns={[
                          { type: 'text', width: 24, align: 'center' },
                          { type: 'text', lines: 2, width: 170 },
                          { type: 'text', lines: 2, width: 180 },
                          { type: 'text', width: 150 },
                          { type: 'text', width: 100, align: 'right' },
                          { type: 'rect', width: 110, height: 28, align: 'center' },
                          { type: 'rect', width: 90, height: 28, align: 'center' },
                          { type: 'text', width: 140 },
                        ]}
                      />
                    ))
                  : rows.map((item, index) => (
                      <InventoryItemRow
                        key={item.id}
                        item={item}
                        serialNumber={page * PAGE_SIZE + index + 1}
                      />
                    ))}

                {!listLoading && !rows.length && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Stack spacing={2} alignItems="center">
                        <Iconify
                          icon="solar:clipboard-list-line-duotone"
                          width={56}
                          sx={{ color: '#cbd5e1' }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          No inventory items found
                        </Typography>
                        <Typography variant="body2" color="text.disabled">
                          Adjust the search to widen the server result set.
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ sm: 'center' }}
            sx={{ px: 2.5, py: 2 }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <FormControlLabel
                control={
                  <Switch checked={dense} onChange={(event) => setDense(event.target.checked)} />
                }
                label="Dense"
              />
              <Typography variant="body2" color="text.secondary">
                {totalCount} item{totalCount === 1 ? '' : 's'} matched
              </Typography>
            </Stack>

            <Pagination
              color="primary"
              shape="rounded"
              count={totalPages}
              page={page + 1}
              onChange={(event, value) => setPage(value - 1)}
            />
          </Stack>
        </Card>
      </Stack>
    </Box>
  );
}
