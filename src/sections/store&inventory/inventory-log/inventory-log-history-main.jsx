'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Box,
  Card,
  Grid,
  Chip,
  Alert,
  Stack,
  Table,
  Button,
  Switch,
  Tooltip,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
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

import {
  formatDateTime,
  formatQuantity,
  DIRECTION_OPTIONS,
  MOVE_TYPE_OPTIONS,
  normalizeCollection,
  buildInventoryLogQuery,
  getHistoryStatusChipProps,
  getInventoryDocumentLabel,
} from './inventory-log-utils';

const EP = endpoints.storeInventory;
const PAGE_SIZE = 10;
const HISTORY_MOVE_TYPE_OPTIONS = MOVE_TYPE_OPTIONS.filter(
  (option) => option.value !== 'Status Change'
);

function sortByLabel(rows, selector) {
  return [...rows].sort((left, right) =>
    selector(left).localeCompare(selector(right), undefined, { sensitivity: 'base' })
  );
}

function HistoryRow({ record, onOpenDetails }) {
  const statusChip = getHistoryStatusChipProps(record.history_status);
  const actorLabel = [record.done_by_name, record.done_by_email].filter(Boolean).join(' • ');
  const referenceMeta = record.document_type
    ? getInventoryDocumentLabel(record.document_type)
    : record.move_type || 'Inventory movement';

  return (
    <TableRow hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
      <TableCell>
        <Stack spacing={0.35}>
          <Typography variant="body2" fontWeight={700} color="#0f172a">
            {formatDateTime(record.date)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Logged {formatDateTime(record.created_at)}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="body2" fontWeight={700} color="#0f172a">
            {record.reference || 'Unnumbered history'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {referenceMeta}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="body2" fontWeight={700} color="#0f172a">
            {record.product_name || 'Product not linked'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {actorLabel || 'System / Unassigned'}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell align="center">
        <Stack spacing={0.75} alignItems="center">
          <Chip size="small" color={statusChip.color} label={statusChip.label} variant="soft" />
          {record.move_type === 'Transfer' && (
            <Box sx={{ textAlign: 'left' }}>
              {record.source_location && (
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.3 }}>
                  <Iconify
                    icon="solar:arrow-right-up-bold"
                    width={13}
                    sx={{ color: 'warning.main', flexShrink: 0 }}
                  />
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    noWrap
                    sx={{ color: 'warning.dark', maxWidth: 130 }}
                  >
                    {record.source_location}
                  </Typography>
                </Stack>
              )}
              {record.destination_location && (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Iconify
                    icon="solar:arrow-left-down-bold"
                    width={13}
                    sx={{ color: 'success.main', flexShrink: 0 }}
                  />
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    noWrap
                    sx={{ color: 'success.dark', maxWidth: 130 }}
                  >
                    {record.destination_location}
                  </Typography>
                </Stack>
              )}
            </Box>
          )}
        </Stack>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontWeight={700} color="#0f172a">
          {formatQuantity(record.quantity, record.uom)}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Tooltip title="View history details">
          <IconButton color="primary" onClick={() => onOpenDetails(record.id)}>
            <Iconify icon="solar:eye-bold" width={18} />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

export default function InventoryLogHistoryMain({
  title = 'Inventory Log History',
  description = 'Track stock-in and stock-out records from real inventory documents. GIN history rows now appear only after issue confirmation and each row can open its linked source details.',
}) {
  const router = useRouter();

  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [moveTypeFilter, setMoveTypeFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [doneByFilter, setDoneByFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const debouncedSearch = useDebounce(searchQuery, 400);

  const listUrl = useMemo(
    () =>
      buildInventoryLogQuery({
        baseUrl: EP.inventory_log_history,
        search: debouncedSearch,
        moveType: moveTypeFilter,
        direction: directionFilter,
        product: productFilter,
        doneBy: doneByFilter,
        dateFrom,
        dateTo,
        page,
        pageSize: PAGE_SIZE,
        pagination: true,
      }),
    [
      debouncedSearch,
      moveTypeFilter,
      directionFilter,
      productFilter,
      doneByFilter,
      dateFrom,
      dateTo,
      page,
    ]
  );

  const summaryUrl = useMemo(
    () =>
      buildInventoryLogQuery({
        baseUrl: EP.inventory_log_history,
        search: debouncedSearch,
        moveType: moveTypeFilter,
        direction: directionFilter,
        product: productFilter,
        doneBy: doneByFilter,
        dateFrom,
        dateTo,
        page: 0,
        pageSize: PAGE_SIZE,
        pagination: false,
      }),
    [
      debouncedSearch,
      moveTypeFilter,
      directionFilter,
      productFilter,
      doneByFilter,
      dateFrom,
      dateTo,
    ]
  );

  const { data: rawList, loading: listLoading, error: listError } = useGetRequest(listUrl);
  const { data: rawSummary } = useGetRequest(summaryUrl);
  const { data: rawProducts, loading: productsLoading } = useGetRequest(
    `${EP.products}?ordering=name`
  );
  const { data: rawUsers, loading: usersLoading } = useGetRequest(
    `${endpoints.auth.simpleUsers}?ordering=username`
  );

  const rows = useMemo(() => normalizeCollection(rawList), [rawList]);
  const summaryRows = useMemo(() => normalizeCollection(rawSummary), [rawSummary]);
  const productOptions = useMemo(
    () => sortByLabel(normalizeCollection(rawProducts), (product) => `${product?.name || ''}`),
    [rawProducts]
  );
  const userOptions = useMemo(
    () => sortByLabel(normalizeCollection(rawUsers), (user) => `${user?.username || ''}`),
    [rawUsers]
  );

  const totalPages = Math.max(1, Number(rawList?.total_pages || 1));
  const totalCount = Number(rawList?.count || summaryRows.length || 0);

  const summaryMetrics = useMemo(
    () => ({
      total: totalCount,
      stockIn: summaryRows.filter((row) => row.history_status === 'Stock_in').length,
      stockOut: summaryRows.filter((row) => row.history_status === 'Stock_out').length,
      transfers: summaryRows.filter((row) => row.history_status === 'Stock_transfer').length,
      linkedDocuments: summaryRows.filter((row) => row.document_id).length,
    }),
    [summaryRows, totalCount]
  );

  const canResetFilters = Boolean(
    searchQuery.trim() ||
    moveTypeFilter ||
    directionFilter ||
    productFilter ||
    doneByFilter ||
    dateFrom ||
    dateTo ||
    page !== 0
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setMoveTypeFilter('');
    setDirectionFilter('');
    setProductFilter('');
    setDoneByFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(0);
  };

  const openDetails = (logId) => {
    router.push(paths.dashboard.storeInventory.inventoryLogHistory_detail(logId));
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Stack spacing={3}>
        <Card
          sx={{
            p: 3.5,
            borderRadius: 4,
            color: 'common.white',
            background: 'linear-gradient(145deg, #1f2937 0%, #0f766e 46%, #84cc16 100%)',
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
                  Stock movement lineage
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ mt: 0.25 }}>
                  {title}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 780, mt: 1 }}>
                  {description}
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
                  href={paths.dashboard.storeInventory.inventoryLogList}
                  variant="outlined"
                  startIcon={<Iconify icon="solar:list-bold-duotone" />}
                  sx={{ borderColor: 'rgba(255,255,255,0.36)', color: 'common.white' }}
                >
                  Inventory Log
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
                    Filtered History Rows
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {summaryMetrics.total}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ p: 2.25, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.12)' }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Stock Out Records
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {summaryMetrics.stockOut}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ p: 2.25, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.12)' }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Stock In Records
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {summaryMetrics.stockIn}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ p: 2.25, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.12)' }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Linked Source Docs
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {summaryMetrics.linkedDocuments}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Stack>
        </Card>

        <Alert severity="info" sx={{ borderRadius: 2 }}>
          This history view is now document-driven. Goods Issue Note stock-out rows are created only
          after the issue action is confirmed, and the view icon opens the linked document details.
        </Alert>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="History Rows"
              value={summaryMetrics.total}
              icon="solar:history-bold-duotone"
              bgcolor="#0f766e"
              boxShadow="0 4px 20px rgba(15, 118, 110, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Stock In"
              value={summaryMetrics.stockIn}
              icon="solar:inbox-in-bold-duotone"
              bgcolor="#15803d"
              boxShadow="0 4px 20px rgba(21, 128, 61, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Stock Out"
              value={summaryMetrics.stockOut}
              icon="solar:logout-2-bold-duotone"
              bgcolor="#d97706"
              boxShadow="0 4px 20px rgba(217, 119, 6, 0.28)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Transfers"
              value={summaryMetrics.transfers}
              icon="solar:transfer-horizontal-bold-duotone"
              bgcolor="#2563eb"
              boxShadow="0 4px 20px rgba(37, 99, 235, 0.28)"
            />
          </Grid>
        </Grid>

        <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search reference, product, actor, or route..."
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

            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Move Type"
                value={moveTypeFilter}
                onChange={(event) => {
                  setMoveTypeFilter(event.target.value);
                  setPage(0);
                }}
              >
                {HISTORY_MOVE_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={directionFilter}
                onChange={(event) => {
                  setDirectionFilter(event.target.value);
                  setPage(0);
                }}
              >
                {DIRECTION_OPTIONS.map((option) => (
                  <MenuItem key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Product"
                value={productFilter}
                disabled={productsLoading}
                onChange={(event) => {
                  setProductFilter(event.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Products</MenuItem>
                {productOptions.map((product) => (
                  <MenuItem key={product.id} value={String(product.id)}>
                    {product.code ? `${product.code} • ` : ''}
                    {product.name || 'Unnamed product'}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Actor"
                value={doneByFilter}
                disabled={usersLoading}
                onChange={(event) => {
                  setDoneByFilter(event.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Actors</MenuItem>
                {userOptions.map((user) => (
                  <MenuItem key={user.id} value={String(user.id)}>
                    {user.username}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Date From"
                value={dateFrom}
                onChange={(event) => {
                  setDateFrom(event.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Date To"
                value={dateTo}
                onChange={(event) => {
                  setDateTo(event.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Card>

        {listError && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Inventory history could not be loaded from the backend.
          </Alert>
        )}

        <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <TableContainer>
            <Table size={dense ? 'small' : 'medium'}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell>Recorded At</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Product / Actor</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {listLoading
                  ? Array.from({ length: 5 }, (_, index) => (
                      <TableRowSkeleton
                        key={index}
                        columns={[
                          { type: 'text', lines: 2, width: 170 },
                          { type: 'text', lines: 2, width: 160 },
                          { type: 'text', lines: 2, width: 190 },
                          { type: 'rect', width: 100, height: 28, align: 'center' },
                          { type: 'text', width: 90, align: 'right' },
                          { type: 'circle', count: 1, size: 28, align: 'center' },
                        ]}
                      />
                    ))
                  : rows.map((record) => (
                      <HistoryRow key={record.id} record={record} onOpenDetails={openDetails} />
                    ))}

                {!listLoading && !rows.length && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Stack spacing={2} alignItems="center">
                        <Iconify
                          icon="solar:history-line-duotone"
                          width={56}
                          sx={{ color: '#cbd5e1' }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          No stock movement history found
                        </Typography>
                        <Typography variant="body2" color="text.disabled">
                          Adjust the server-side filters to widen the timeline.
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
              <Typography variant="body2" color="text.secondary">
                Showing {rows.length} of {totalCount} history rows
              </Typography>
              <FormControlLabel
                control={
                  <Switch checked={dense} onChange={(event) => setDense(event.target.checked)} />
                }
                label="Dense"
              />
            </Stack>

            <Pagination
              page={page + 1}
              count={totalPages}
              onChange={(_event, value) => setPage(value - 1)}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
            />
          </Stack>
        </Card>
      </Stack>
    </Box>
  );
}
