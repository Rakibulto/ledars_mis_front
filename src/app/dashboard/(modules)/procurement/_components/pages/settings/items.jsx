'use client';

import { z } from 'zod';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Edit, Plus, Search, Trash2, Package } from 'lucide-react';

import {
  Grid,
  Stack,
  Dialog,
  Select,
  Tooltip,
  MenuItem,
  TextField,
  IconButton,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogActions,
  DialogContent,
  FormHelperText,
  InputAdornment,
  TablePagination,
  CircularProgress,
} from '@mui/material';

import axios, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { ConfirmDialog } from 'src/components/custom-dialog';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

// ── Endpoints ─────────────────────────────────────────────────────────────────
const ITEM_URL = endpoints.storeInventory.items;
const ITEM_BY_ID = (id) => endpoints.storeInventory.item_by_id(id);
const MAIN_CAT_URL = `${endpoints.storeInventory.item_category}?pagination=false&level=Main`;
const UOM_URL = `${endpoints.storeInventory.uom}`;
const SUPPLIER_URL = `${endpoints.procurement.suppliers}?pagination=false`;

// ── Zod Schema ────────────────────────────────────────────────────────────────
const itemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  asset_type: z.enum(['Fixed Asset', 'Consumable Asset']).default('Fixed Asset'),
  description: z.string().optional().or(z.literal('')),
  category: z.union([z.number(), z.string(), z.null()]).optional(),
  subcategory: z.union([z.number(), z.string(), z.null()]).optional(),
  uom: z.union([z.number(), z.string(), z.null()]).optional(),
  cost: z.coerce.number().min(0, 'Cost must be 0 or more').default(0),
  sale_price: z.coerce.number().min(0).default(0),
  on_hand: z.coerce.number().min(0).default(0),
  reorder_level: z.coerce.number().min(0).default(0),
  max_stock: z.coerce.number().min(0).default(0),
  location: z.string().optional().or(z.literal('')),
  supplier: z.union([z.number(), z.string(), z.null()]).optional(),
  specifications: z.string().optional().or(z.literal('')),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

// ── Default values ────────────────────────────────────────────────────────────
const defaultValues = {
  name: '',
  asset_type: 'Fixed Asset',
  description: '',
  category: null,
  subcategory: null,
  uom: null,
  cost: 0,
  sale_price: 0,
  on_hand: 0,
  reorder_level: 0,
  max_stock: 0,
  location: '',
  supplier: null,
  specifications: '',
  status: 'Active',
};

// ── Build query URL ───────────────────────────────────────────────────────────
const buildUrl = (search, statusFilter, stockStatusFilter, assetTypeFilter, page, rowsPerPage) => {
  const params = new URLSearchParams();
  params.set('pagination', 'true');
  params.set('page', String(page + 1));
  params.set('page_size', String(rowsPerPage));
  if (search) params.set('search', search);
  if (statusFilter) params.set('status', statusFilter);
  if (stockStatusFilter) params.set('stock_status', stockStatusFilter);
  if (assetTypeFilter) params.set('asset_type', assetTypeFilter);
  return `${ITEM_URL}?${params.toString()}`;
};

// ── Stock status badge variant ────────────────────────────────────────────────
const stockBadgeVariant = (s) => {
  if (s === 'In Stock') return 'success';
  if (s === 'Low Stock') return 'warning';
  if (s === 'Out of Stock') return 'error';
  return 'default';
};

export function ItemMaster() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  const routeAssetTypeFilter =
    typeParam === 'asset' ? 'Fixed Asset' : typeParam === 'consumable' ? 'Consumable Asset' : '';

  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Server-side filter/pagination state ───────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState(routeAssetTypeFilter);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setAssetTypeFilter(routeAssetTypeFilter);
    setPage(0);
  }, [routeAssetTypeFilter]);

  const listUrl = buildUrl(
    search,
    statusFilter,
    stockStatusFilter,
    assetTypeFilter,
    page,
    rowsPerPage
  );

  // ── Fetch paginated items ─────────────────────────────────────────────────
  const { data: itemsRaw, loading: itemsLoading } = useGetRequest(listUrl);
  const items = useMemo(
    () => (Array.isArray(itemsRaw?.results) ? itemsRaw.results : []),
    [itemsRaw]
  );
  const totalCount = itemsRaw?.count ?? 0;

  // ── Fetch lookup data for dropdowns ──────────────────────────────────────
  const { data: mainCatRaw } = useGetRequest(MAIN_CAT_URL);
  const mainCategories = useMemo(
    () =>
      Array.isArray(mainCatRaw)
        ? mainCatRaw
        : Array.isArray(mainCatRaw?.results)
          ? mainCatRaw.results
          : [],
    [mainCatRaw]
  );

  const { data: uomRaw } = useGetRequest(endpoints.storeInventory.uom);

  console.log('uom raw', uomRaw);
  const uomList = useMemo(
    () =>
      Array.isArray(uomRaw)
        ? uomRaw
        : Array.isArray(uomRaw?.results)
          ? uomRaw.results
          : uomRaw || [],
    [uomRaw]
  );

  console.log('upm row', uomRaw, uomList);

  const { data: supplierRaw } = useGetRequest(SUPPLIER_URL);
  const supplierList = useMemo(
    () =>
      Array.isArray(supplierRaw)
        ? supplierRaw
        : Array.isArray(supplierRaw?.results)
          ? supplierRaw.results
          : [],
    [supplierRaw]
  );

  const hasActiveFilters = search || statusFilter || stockStatusFilter || assetTypeFilter;

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(0);
  };

  const handleStockStatusFilterChange = (e) => {
    setStockStatusFilter(e.target.value);
    setPage(0);
  };

  const handleAssetTypeFilterChange = (e) => {
    setAssetTypeFilter(e.target.value);
    setPage(0);
  };

  const handleClearAll = () => {
    setSearch('');
    setStatusFilter('');
    setStockStatusFilter('');
    setAssetTypeFilter(routeAssetTypeFilter);
    setPage(0);
  };

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // ── React Hook Form ───────────────────────────────────────────────────────
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(itemSchema), defaultValues });

  const watchedCategory = watch('category');

  // ── Subcategories filtered by selected category ───────────────────────────
  const subCatUrl = watchedCategory
    ? `${endpoints.storeInventory.item_category}?pagination=false&level=Sub&parent=${watchedCategory}`
    : null;
  const { data: subCatRaw } = useGetRequest(subCatUrl);
  const subCategories = useMemo(
    () =>
      Array.isArray(subCatRaw)
        ? subCatRaw
        : Array.isArray(subCatRaw?.results)
          ? subCatRaw.results
          : [],
    [subCatRaw]
  );

  // ── Dialog handlers ───────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingItem(null);
    reset(defaultValues);
    setOpenDialog(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    reset({
      name: item.item_name || '',
      asset_type: item.asset_type || 'Fixed Asset',
      description: item.description || '',
      category: item.category_id || null,
      subcategory: item.subcategory_id || null,
      uom: item.uom_id || null,
      cost: Number(item.unit_price) || 0,
      sale_price: Number(item.sale_price) || 0,
      on_hand: Number(item.current_stock) || 0,
      reorder_level: Number(item.minimum_stock) || 0,
      max_stock: Number(item.maximum_stock) || 0,
      location: item.location || '',
      supplier: item.supplier_id || null,
      specifications: item.specifications || '',
      status: item.status || 'Active',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    if (isSubmitting) return;
    setOpenDialog(false);
    setEditingItem(null);
    reset(defaultValues);
  };

  // ── Submit (create or update) ─────────────────────────────────────────────
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        asset_type: data.asset_type,
        description: data.description || '',
        category: data.category ? Number(data.category) : null,
        subcategory: data.subcategory ? Number(data.subcategory) : null,
        uom: data.uom ? Number(data.uom) : null,
        cost: Number(data.cost),
        sale_price: Number(data.sale_price),
        on_hand: Number(data.on_hand),
        reorder_level: Number(data.reorder_level),
        max_stock: Number(data.max_stock),
        location: data.location || '',
        supplier: data.supplier ? Number(data.supplier) : null,
        specifications: data.specifications || '',
        status: data.status,
      };

      if (editingItem) {
        await axios.patch(ITEM_BY_ID(editingItem.id), payload);
        toast.success('Item updated successfully');
      } else {
        await axios.post(ITEM_URL, payload);
        toast.success('Item created successfully');
      }

      await mutate(listUrl);
      handleCloseDialog();
    } catch (error) {
      const detail = error?.response?.data || error;
      const msg =
        typeof detail === 'string'
          ? detail
          : Object.values(detail || {})
              .flat()
              .join(', ') || 'Something went wrong';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(ITEM_BY_ID(deleteConfirm.id));
      toast.success('Item deleted successfully');
      await mutate(listUrl);
      setDeleteConfirm({ open: false, id: null, name: '' });
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Failed to delete item');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Item Master</h1>
          <p className="text-muted-foreground">Manage master item database</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader title={`Item Master (${totalCount})`} description="Complete item catalog" />
        <CardBody>
          {/* ── Filters ── */}
          <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
            {/* Search */}
            <Grid size={{ xs: 12, sm: 6, md: 5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by code, name, or category..."
                value={search}
                onChange={handleSearchChange}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={16} />
                      </InputAdornment>
                    ),
                    endAdornment: search && (
                      <InputAdornment position="end">
                        <Tooltip title="Clear search">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSearch('');
                              setPage(0);
                            }}
                          >
                            <X size={14} />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>

            {/* Status filter */}
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={handleStatusFilterChange}
                  endAdornment={
                    statusFilter ? (
                      <InputAdornment position="end" sx={{ mr: 1 }}>
                        <Tooltip title="Clear status">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setStatusFilter('');
                              setPage(0);
                            }}
                          >
                            <X size={13} />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ) : null
                  }
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Stock Status filter */}
            <Grid size={{ xs: 6, sm: 3, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Stock Status</InputLabel>
                <Select
                  value={stockStatusFilter}
                  label="Stock Status"
                  onChange={handleStockStatusFilterChange}
                  endAdornment={
                    stockStatusFilter ? (
                      <InputAdornment position="end" sx={{ mr: 1 }}>
                        <Tooltip title="Clear stock status">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setStockStatusFilter('');
                              setPage(0);
                            }}
                          >
                            <X size={13} />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ) : null
                  }
                >
                  <MenuItem value="">All Stock</MenuItem>
                  <MenuItem value="In Stock">In Stock</MenuItem>
                  <MenuItem value="Low Stock">Low Stock</MenuItem>
                  <MenuItem value="Out of Stock">Out of Stock</MenuItem>
                  <MenuItem value="Overstock">Overstock</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Asset Type filter */}
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Asset Type</InputLabel>
                <Select
                  value={assetTypeFilter}
                  label="Asset Type"
                  onChange={handleAssetTypeFilterChange}
                  endAdornment={
                    assetTypeFilter ? (
                      <InputAdornment position="end" sx={{ mr: 1 }}>
                        <Tooltip title="Clear asset type">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setAssetTypeFilter(routeAssetTypeFilter);
                              setPage(0);
                            }}
                          >
                            <X size={13} />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ) : null
                  }
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="Fixed Asset">Fixed Asset</MenuItem>
                  <MenuItem value="Consumable Asset">Consumable Asset</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Clear All */}
            {hasActiveFilters && (
              <Grid size={{ xs: 12, sm: 'auto' }}>
                <Button variant="outline" onClick={handleClearAll}>
                  <X size={14} className="mr-1" />
                  Clear All
                </Button>
              </Grid>
            )}
          </Grid>

          {/* ── Table ── */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-border">
                <tr className="text-left">
                  <th className="pb-3 text-sm font-semibold text-foreground">Item Code</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Item Name</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Asset Type</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Category</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Unit</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Unit Price</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Stock</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Stock Status</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Status</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {itemsLoading && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-muted-foreground">
                      <CircularProgress size={24} />
                    </td>
                  </tr>
                )}
                {!itemsLoading && items.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-muted-foreground">
                      No items found.
                    </td>
                  </tr>
                )}
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border">
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary" />
                        <span className="font-mono font-semibold text-foreground">
                          {item.item_code}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-foreground">{item.item_name}</td>
                    <td className="py-4 text-sm text-foreground">
                      {item.asset_type || 'Fixed Asset'}
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground">{item.category || '-'}</span>
                        {item.subcategory && (
                          <span className="text-xs text-muted-foreground">{item.subcategory}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">{item.unit || '-'}</td>
                    <td className="py-4 text-sm font-semibold text-foreground">
                      ${Number(item.unit_price || 0).toLocaleString()}
                    </td>
                    <td className="py-4 text-sm text-foreground">{item.current_stock ?? 0}</td>
                    <td className="py-4">
                      <Badge variant={stockBadgeVariant(item.stock_status)}>
                        {item.stock_status || '-'}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <Badge variant={item.status === 'Active' ? 'success' : 'default'}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="p-2 hover:bg-muted rounded transition-colors"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <Edit className="w-4 h-4 text-primary" />
                        </button>
                        <button
                          type="button"
                          className="p-2 hover:bg-muted rounded transition-colors"
                          onClick={() =>
                            setDeleteConfirm({ open: true, id: item.id, name: item.item_name })
                          }
                        >
                          <Trash2 className="w-4 h-4 text-error" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 1 }}
          />
        </CardBody>
      </Card>

      {/* ── Create / Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            {editingItem ? 'Edit Item' : 'Add Item'}
            <IconButton onClick={handleCloseDialog} size="small" disabled={isSubmitting}>
              <X size={16} />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              {/* Item Name */}
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Item Name *"
                    fullWidth
                    size="small"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />

              {/* Category + Subcategory */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small" error={!!errors.category}>
                        <InputLabel>Category</InputLabel>
                        <Select
                          {...field}
                          value={field.value ?? ''}
                          label="Category"
                          onChange={(e) => {
                            field.onChange(e.target.value === '' ? null : e.target.value);
                            setValue('subcategory', null);
                          }}
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {mainCategories.map((c) => (
                            <MenuItem key={c.id} value={c.id}>
                              {c.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.category && (
                          <FormHelperText>{errors.category.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="subcategory"
                    control={control}
                    render={({ field }) => (
                      <FormControl
                        fullWidth
                        size="small"
                        error={!!errors.subcategory}
                        disabled={!watchedCategory}
                      >
                        <InputLabel>Sub Category</InputLabel>
                        <Select
                          {...field}
                          value={field.value ?? ''}
                          label="Sub Category"
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? null : e.target.value)
                          }
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {subCategories.map((c) => (
                            <MenuItem key={c.id} value={c.id}>
                              {c.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.subcategory && (
                          <FormHelperText>{errors.subcategory.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
              </Grid>

              {/* UOM + Asset Type + Status */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Controller
                    name="uom"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small" error={!!errors.uom}>
                        <InputLabel>Unit of Measure</InputLabel>
                        <Select
                          {...field}
                          value={field.value ?? ''}
                          label="Unit of Measure"
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? null : e.target.value)
                          }
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {uomList.map((u) => (
                            <MenuItem key={u.id} value={u.id}>
                              {u.name} ({u.code})
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.uom && <FormHelperText>{errors.uom.message}</FormHelperText>}
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Controller
                    name="asset_type"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small" error={!!errors.asset_type}>
                        <InputLabel>Asset Type</InputLabel>
                        <Select {...field} label="Asset Type">
                          <MenuItem value="Fixed Asset">Fixed Asset</MenuItem>
                          <MenuItem value="Consumable Asset">Consumable Asset</MenuItem>
                        </Select>
                        {errors.asset_type && (
                          <FormHelperText>{errors.asset_type.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small" error={!!errors.status}>
                        <InputLabel>Status</InputLabel>
                        <Select {...field} label="Status">
                          <MenuItem value="Active">Active</MenuItem>
                          <MenuItem value="Inactive">Inactive</MenuItem>
                        </Select>
                        {errors.status && <FormHelperText>{errors.status.message}</FormHelperText>}
                      </FormControl>
                    )}
                  />
                </Grid>
              </Grid>

              {/* Cost + Sale Price + On Hand */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Controller
                    name="cost"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Cost ($)"
                        type="number"
                        fullWidth
                        size="small"
                        inputProps={{ min: 0, step: '0.01' }}
                        error={!!errors.cost}
                        helperText={errors.cost?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Controller
                    name="sale_price"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Sale Price ($)"
                        type="number"
                        fullWidth
                        size="small"
                        inputProps={{ min: 0, step: '0.01' }}
                        error={!!errors.sale_price}
                        helperText={errors.sale_price?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Controller
                    name="on_hand"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="On Hand (Qty)"
                        type="number"
                        fullWidth
                        size="small"
                        inputProps={{ min: 0 }}
                        error={!!errors.on_hand}
                        helperText={errors.on_hand?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Reorder Level + Max Stock + Location */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Controller
                    name="reorder_level"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Reorder Level"
                        type="number"
                        fullWidth
                        size="small"
                        inputProps={{ min: 0 }}
                        error={!!errors.reorder_level}
                        helperText={errors.reorder_level?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Controller
                    name="max_stock"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Max Stock"
                        type="number"
                        fullWidth
                        size="small"
                        inputProps={{ min: 0 }}
                        error={!!errors.max_stock}
                        helperText={errors.max_stock?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Controller
                    name="location"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Storage Location"
                        fullWidth
                        size="small"
                        error={!!errors.location}
                        helperText={errors.location?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Supplier */}
              <Controller
                name="supplier"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small" error={!!errors.supplier}>
                    <InputLabel>Supplier</InputLabel>
                    <Select
                      {...field}
                      value={field.value ?? ''}
                      label="Supplier"
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? null : e.target.value)
                      }
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {supplierList.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.supplier && <FormHelperText>{errors.supplier.message}</FormHelperText>}
                  </FormControl>
                )}
              />

              {/* Description */}
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />

              {/* Specifications */}
              <Controller
                name="specifications"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Specifications"
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    error={!!errors.specifications}
                    helperText={errors.specifications?.message}
                  />
                )}
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button
              variant="outline"
              type="button"
              onClick={handleCloseDialog}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : null}
              {editingItem ? 'Save Changes' : 'Create Item'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Delete Confirm Dialog ────────────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, name: '' })}
        title="Delete Item"
        content={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
        action={
          <Button variant="primary" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : null}
            Delete
          </Button>
        }
      />
    </div>
  );
}
