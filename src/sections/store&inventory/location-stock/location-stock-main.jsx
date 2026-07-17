'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import React, { useMemo, useState } from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Table,
  Alert,
  Button,
  Dialog,
  MenuItem,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  DialogTitle,
  Autocomplete,
  DialogContent,
  DialogActions,
  TableContainer,
  InputAdornment,
  LinearProgress,
  CircularProgress,
} from '@mui/material';

import { useDebounce } from 'src/hooks/use-debounce';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  usePatchRequest as patchRequest,
  useDeleteRequest as deleteRequest,
  useCreateRequest as createRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ─── endpoints ────────────────────────────────────────────────────────────────

const EP = endpoints.storeInventory;
const PM = endpoints.procurement_management;

// ─── helpers ──────────────────────────────────────────────────────────────────

function normalizeCollection(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function fmtQty(v) {
  const n = Number(v ?? 0);
  return n.toLocaleString('en-BD', { maximumFractionDigits: 2 });
}

function fmtDate(v) {
  if (!v) return '—';
  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(v)
  );
}

function buildListUrl({ search, office, hasStock, page }) {
  const base = EP.location_stocks;
  const params = new URLSearchParams();
  params.set('pagination', 'true');
  params.set('page', String((page || 0) + 1));
  if (search) params.set('search', search);
  if (office) params.set('office_location', String(office));
  if (hasStock) params.set('has_stock', 'true');
  return `${base}?${params.toString()}`;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ title, value, icon, color }) {
  const theme = useTheme();
  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: `1px solid ${alpha(color, 0.25)}`,
        background: `linear-gradient(135deg, ${alpha(color, 0.12)}, ${alpha(color, 0.04)})`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(color, 0.15),
          }}
        >
          <Iconify icon={icon} width={24} sx={{ color }} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800} color={color}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {title}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

// ─── Edit / Create dialog ─────────────────────────────────────────────────────

function LocationStockDialog({ open, onClose, row, officeOptions, productOptions, onSaved }) {
  const isEdit = Boolean(row?.id);
  const [submitting, setSubmitting] = useState(false);

  // form state
  const [product, setProduct] = useState(null);
  const [office, setOffice] = useState(null);
  const [quantity, setQuantity] = useState('');

  // populate on open
  React.useEffect(() => {
    if (!open) return;
    if (isEdit) {
      const matchedProduct =
        productOptions.find((p) => String(p.id) === String(row.product)) ?? null;
      const matchedOffice =
        officeOptions.find((o) => String(o.id) === String(row.office_location)) ?? null;
      setProduct(matchedProduct);
      setOffice(matchedOffice);
      setQuantity(String(row.quantity ?? ''));
    } else {
      setProduct(null);
      setOffice(null);
      setQuantity('');
    }
  }, [open, isEdit, row, productOptions, officeOptions]);

  const handleSubmit = async () => {
    if (!isEdit && (!product || !office)) {
      toast.error('Product and Office / Warehouse are required.');
      return;
    }
    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty < 0) {
      toast.error('Quantity must be a non-negative number.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await patchRequest(EP.location_stock_by_id(row.id), { quantity: qty });
        toast.success('Stock quantity updated.');
      } else {
        await createRequest(EP.location_stocks, {
          product: product.id,
          office_location: office.id,
          quantity: qty,
        });
        toast.success('Location stock entry created.');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err) || 'Save failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isEdit ? 'Edit Stock Quantity' : 'Add Location Stock Entry'}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          {isEdit ? (
            <>
              <TextField
                label="Product"
                value={`${row?.product_name ?? ''} (${row?.product_code ?? ''})`}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Office / Warehouse"
                value={row?.office_location_name ?? ''}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
              />
            </>
          ) : (
            <>
              <Autocomplete
                options={productOptions}
                value={product}
                onChange={(_, v) => setProduct(v)}
                getOptionLabel={(o) =>
                  `${o.item_name ?? o.name ?? ''} (${o.item_code ?? o.code ?? ''})`
                }
                isOptionEqualToValue={(o, v) => String(o.id) === String(v?.id)}
                renderInput={(params) => (
                  <TextField {...params} label="Product" size="small" required />
                )}
              />
              <Autocomplete
                options={officeOptions}
                value={office}
                onChange={(_, v) => setOffice(v)}
                getOptionLabel={(o) => o.name ?? ''}
                isOptionEqualToValue={(o, v) => String(o.id) === String(v?.id)}
                renderInput={(params) => (
                  <TextField {...params} label="Office / Warehouse" size="small" required />
                )}
              />
            </>
          )}

          <TextField
            label="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            fullWidth
            size="small"
            required
            helperText={
              isEdit
                ? "Updating this adjusts only this location's stock. Product on_hand recalculates automatically."
                : 'Initial stock quantity at this location.'
            }
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} /> : null}
        >
          {isEdit ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function LocationStockMain() {
  const theme = useTheme();

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [officeFilter, setOfficeFilter] = useState('');
  const [hasStockOnly, setHasStockOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRow, setEditRow] = useState(null); // null = create mode
  const [deleteId, setDeleteId] = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  const listUrl = useMemo(
    () =>
      buildListUrl({ search: debouncedSearch, office: officeFilter, hasStock: hasStockOnly, page }),
    [debouncedSearch, officeFilter, hasStockOnly, page]
  );

  const { data: rawList, loading, error } = useGetRequest(listUrl);
  const { data: rawOffices } = useGetRequest(PM.office_management);
  const { data: rawProducts } = useGetRequest(EP.items);

  const rows = useMemo(() => normalizeCollection(rawList), [rawList]);
  const totalPages = Math.max(1, Number(rawList?.total_pages || 1));
  const totalCount = Number(rawList?.count || rows.length);

  const officeOptions = useMemo(() => normalizeCollection(rawOffices), [rawOffices]);
  const productOptions = useMemo(() => normalizeCollection(rawProducts), [rawProducts]);

  // Summary metrics from the current filtered list
  const metrics = useMemo(() => {
    const withStock = rows.filter((r) => Number(r.quantity) > 0).length;
    const totalQty = rows.reduce((s, r) => s + Number(r.quantity ?? 0), 0);
    return { total: totalCount, withStock, totalQty };
  }, [rows, totalCount]);

  const canResetFilters = Boolean(search || officeFilter || hasStockOnly || page !== 0);

  const handleResetFilters = () => {
    setSearch('');
    setOfficeFilter('');
    setHasStockOnly(false);
    setPage(0);
  };

  const handleSaved = async () => {
    await mutate((key) => typeof key === 'string' && key.startsWith(EP.location_stocks));
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteRequest(EP.location_stock_by_id(deleteId));
      toast.success('Location stock entry deleted. Product on_hand recalculated.');
      await handleSaved();
      setDeleteId(null);
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err) || 'Delete failed.');
    }
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Stack spacing={3}>
        {/* ── Header ───────────────────────────────────────────────── */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ md: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" fontWeight={700} color="#0f172a" gutterBottom>
              Location Stock Ledger
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Per-location stock quantities — the source of truth for all stock deductions.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
            onClick={() => {
              setEditRow(null);
              setDialogOpen(true);
            }}
          >
            Add Entry
          </Button>
        </Stack>

        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Each row represents a product&apos;s quantity at a specific office/warehouse.
          <strong> Product on_hand</strong> is always the SUM of all its location rows and is
          recalculated automatically on every save/delete.
        </Alert>

        {/* ── Summary cards ─────────────────────────────────────────── */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <SummaryCard
              title="Total Entries"
              value={metrics.total}
              icon="solar:database-bold-duotone"
              color={theme.palette.primary.main}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <SummaryCard
              title="Locations with Stock"
              value={metrics.withStock}
              icon="solar:buildings-bold-duotone"
              color={theme.palette.success.main}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <SummaryCard
              title="Total Units (this page)"
              value={fmtQty(metrics.totalQty)}
              icon="solar:box-bold-duotone"
              color={theme.palette.info.main}
            />
          </Grid>
        </Grid>

        {/* ── Filters ───────────────────────────────────────────────── */}
        <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb' }}>
          <Stack spacing={2}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search product name, code, or office…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="solar:magnifer-bold-duotone" width={18} />
                      </InputAdornment>
                    ),
                    endAdornment:
                      search !== debouncedSearch ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : null,
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Office / Warehouse"
                  value={officeFilter}
                  onChange={(e) => {
                    setOfficeFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All offices</MenuItem>
                  {officeOptions.map((o) => (
                    <MenuItem key={o.id} value={String(o.id)}>
                      {o.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    variant={hasStockOnly ? 'contained' : 'outlined'}
                    color={hasStockOnly ? 'success' : 'inherit'}
                    size="small"
                    onClick={() => {
                      setHasStockOnly((v) => !v);
                      setPage(0);
                    }}
                    startIcon={<Iconify icon="solar:filter-bold-duotone" width={16} />}
                  >
                    {hasStockOnly ? 'In-Stock Only' : 'All Records'}
                  </Button>
                  {canResetFilters && (
                    <Button
                      variant="outlined"
                      color="inherit"
                      size="small"
                      onClick={handleResetFilters}
                    >
                      Reset
                    </Button>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </Card>

        {/* ── Table ─────────────────────────────────────────────────── */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {loading && <LinearProgress />}

          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              Failed to load location stock data.
            </Alert>
          )}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.06) }}>
                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>UoM</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Office / Warehouse</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Location Qty
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Total on_hand
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Updated</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} />
                </TableRow>
              </TableHead>

              <TableBody>
                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                      <Stack spacing={1} alignItems="center">
                        <Iconify
                          icon="solar:database-bold-duotone"
                          width={40}
                          sx={{ color: 'text.disabled' }}
                        />
                        <Typography color="text.secondary" variant="body2">
                          No location stock entries found.
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}

                {rows.map((row, idx) => {
                  const locQty = Number(row.quantity ?? 0);
                  const totalQty = Number(row.product_on_hand ?? 0);
                  const isLow = locQty === 0;

                  return (
                    <TableRow key={row.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>
                        {page * 20 + idx + 1}
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {row.product_name ?? '—'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={row.product_code ?? '—'}
                          size="small"
                          variant="soft"
                          color="default"
                          sx={{ fontFamily: 'monospace', fontSize: 11 }}
                        />
                      </TableCell>

                      <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>
                        {row.product_uom ?? '—'}
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {row.office_location_name ?? '—'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={row.office_location_type ?? '—'}
                          size="small"
                          variant="outlined"
                          color="info"
                          sx={{ fontSize: 11 }}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color={isLow ? 'error.main' : 'success.dark'}
                        >
                          {fmtQty(locQty)}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {fmtQty(totalQty)}
                        </Typography>
                      </TableCell>

                      <TableCell
                        sx={{ fontSize: 11, color: 'text.secondary', whiteSpace: 'nowrap' }}
                      >
                        {fmtDate(row.updated_at)}
                      </TableCell>

                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ minWidth: 0, px: 1 }}
                            onClick={() => {
                              setEditRow(row);
                              setDialogOpen(true);
                            }}
                          >
                            <Iconify icon="solar:pen-bold" width={15} />
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            sx={{ minWidth: 0, px: 1 }}
                            onClick={() => setDeleteId(row.id)}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" width={15} />
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ px: 2, py: 1.5, borderTop: '1px solid #f1f5f9' }}
            >
              <Typography variant="caption" color="text.secondary">
                Page {page + 1} of {totalPages}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  ‹ Prev
                </Button>
                <Button
                  size="small"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next ›
                </Button>
              </Stack>
            </Stack>
          )}
        </Card>
      </Stack>

      {/* ── Edit / Create dialog ───────────────────────────────────── */}
      <LocationStockDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        row={editRow}
        officeOptions={officeOptions}
        productOptions={productOptions}
        onSaved={handleSaved}
      />

      {/* ── Delete confirm ─────────────────────────────────────────── */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete Location Stock Entry"
        content="This will remove the stock record for this product at this location. Product on_hand will be recalculated automatically. Continue?"
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
