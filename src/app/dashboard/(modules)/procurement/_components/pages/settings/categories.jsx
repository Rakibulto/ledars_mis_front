'use client';

import { z } from 'zod';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Edit, Plus, Search, Trash2, Grid as GridIcon } from 'lucide-react';

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
const CAT_URL = endpoints.storeInventory.item_category; // /api/categories/
const CAT_BY_ID = (id) => endpoints.storeInventory.item_category_by_id(id);

// ── Zod Schema ────────────────────────────────────────────────────────────────
const categorySchema = z
  .object({
    name: z.string().min(1, 'Category name is required'),
    level: z.enum(['Main', 'Sub'], { required_error: 'Level is required' }),
    parent: z.union([z.number(), z.string(), z.null()]).optional(),
    description: z.string().optional().or(z.literal('')),
    costing_method: z.enum(['standard', 'fifo', 'average']).default('average'),
    status: z.enum(['Active', 'Inactive']).default('Active'),
  })
  .superRefine((data, ctx) => {
    if (data.level === 'Sub' && !data.parent) {
      ctx.addIssue({
        path: ['parent'],
        code: 'custom',
        message: 'Parent is required for Sub category',
      });
    }
  });

// ── Default values ────────────────────────────────────────────────────────────
const defaultValues = {
  name: '',
  level: 'Main',
  parent: null,
  description: '',
  costing_method: 'average',
  status: 'Active',
};

// ── Build query URL ───────────────────────────────────────────────────────────
const buildUrl = (search, levelFilter, statusFilter, page, rowsPerPage) => {
  const params = new URLSearchParams();
  params.set('pagination', 'true');
  params.set('page', String(page + 1)); // MUI is 0-indexed, Django is 1-indexed
  params.set('page_size', String(rowsPerPage));
  if (search) params.set('search', search);
  if (levelFilter) params.set('level', levelFilter);
  if (statusFilter) params.set('status', statusFilter);
  return `${CAT_URL}?${params.toString()}`;
};

// ── Main categories URL (all, no pagination) for parent dropdown ──────────────
const MAIN_CAT_URL = `${CAT_URL}?pagination=false&level=Main`;

// ── Component ─────────────────────────────────────────────────────────────────
export function CategorySetup() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Server-side filter/pagination state ──────────────────────────────────────
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const listUrl = buildUrl(search, levelFilter, statusFilter, page, rowsPerPage);

  // ── Fetch paginated categories ───────────────────────────────────────────────
  const { data: categoryRaw, loading: categoriesLoading } = useGetRequest(listUrl);

  const categories = useMemo(
    () => (Array.isArray(categoryRaw?.results) ? categoryRaw.results : []),
    [categoryRaw]
  );
  const totalCount = categoryRaw?.count ?? 0;

  // ── Fetch all Main categories for parent dropdown ────────────────────────────
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

  const hasActiveFilters = search || levelFilter || statusFilter;

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleLevelFilterChange = (e) => {
    setLevelFilter(e.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(0);
  };

  const handleClearAll = () => {
    setSearch('');
    setLevelFilter('');
    setStatusFilter('');
    setPage(0);
  };

  const handleChangePage = (_, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // ── React Hook Form ──────────────────────────────────────────────────────────
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues,
  });

  const watchedLevel = watch('level');

  // ── Open create dialog ───────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingCategory(null);
    reset(defaultValues);
    setOpenDialog(true);
  };

  // ── Open edit dialog ─────────────────────────────────────────────────────────
  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    reset({
      name: cat.name || '',
      level: cat.level || 'Main',
      parent: cat.parent || null,
      description: cat.description || '',
      costing_method: cat.costing_method || 'average',
      status: cat.status || 'Active',
    });
    setOpenDialog(true);
  };

  // ── Close dialog ─────────────────────────────────────────────────────────────
  const handleCloseDialog = () => {
    if (isSubmitting) return;
    setOpenDialog(false);
    setEditingCategory(null);
    reset(defaultValues);
  };

  // ── Submit (create or update) ────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        level: data.level,
        description: data.description || '',
        costing_method: data.costing_method,
        status: data.status,
        parent: data.level === 'Sub' ? (data.parent ? Number(data.parent) : null) : null,
      };

      if (editingCategory) {
        await axios.patch(CAT_BY_ID(editingCategory.id), payload);
        toast.success('Category updated successfully');
      } else {
        await axios.post(CAT_URL, payload);
        toast.success('Category created successfully');
      }

      await mutate(listUrl);
      handleCloseDialog();
    } catch (error) {
      const detail = error?.response?.data;
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

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(CAT_BY_ID(deleteConfirm.id));
      toast.success('Category deleted successfully');
      await mutate(listUrl);
      setDeleteConfirm({ open: false, id: null, name: '' });
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Category Setup</h1>
          <p className="text-muted-foreground">Manage procurement categories and classifications</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader
          title={`Categories (${totalCount})`}
          description="Item and procurement categories"
        />
        <CardBody>
          {/* ── Filters ── */}
          <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
            {/* Search */}
            <Grid size={{ xs: 12, sm: 6, md: 5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name or code..."
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

            {/* Level filter */}
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Level</InputLabel>
                <Select
                  value={levelFilter}
                  label="Level"
                  onChange={handleLevelFilterChange}
                  endAdornment={
                    levelFilter ? (
                      <InputAdornment position="end" sx={{ mr: 1 }}>
                        <Tooltip title="Clear level">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setLevelFilter('');
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
                  <MenuItem value="">All Levels</MenuItem>
                  <MenuItem value="Main">Main</MenuItem>
                  <MenuItem value="Sub">Sub</MenuItem>
                </Select>
              </FormControl>
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

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-border">
                <tr className="text-left">
                  <th className="pb-3 text-sm font-semibold text-foreground">Category Code</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Category Name</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Parent Category</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Items</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Status</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categoriesLoading && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      <CircularProgress size={24} />
                    </td>
                  </tr>
                )}
                {!categoriesLoading && categories.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No categories found.
                    </td>
                  </tr>
                )}
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-b border-border">
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        {cat.level === 'Main' && <GridIcon className="w-4 h-4 text-primary" />}
                        {cat.level === 'Sub' && (
                          <div className="w-4 h-4 ml-4 border-l-2 border-b-2 border-border rounded-bl" />
                        )}
                        <span
                          className={`font-mono ${cat.level === 'Sub' ? 'text-sm text-muted-foreground' : 'font-semibold text-foreground'}`}
                        >
                          {cat.code}
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span
                        className={
                          cat.level === 'Sub'
                            ? 'text-sm text-foreground'
                            : 'font-medium text-foreground'
                        }
                      >
                        {cat.name}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">{cat.parent_name || '-'}</td>
                    <td className="py-4">
                      <Badge variant="default">{cat.item_count ?? 0} items</Badge>
                    </td>
                    <td className="py-4">
                      <Badge variant={cat.status === 'Active' ? 'success' : 'default'}>
                        {cat.status}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="p-2 hover:bg-muted rounded transition-colors"
                          onClick={() => handleOpenEdit(cat)}
                        >
                          <Edit className="w-4 h-4 text-primary" />
                        </button>
                        <button
                          type="button"
                          className="p-2 hover:bg-muted rounded transition-colors"
                          onClick={() =>
                            setDeleteConfirm({ open: true, id: cat.id, name: cat.name })
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

          {/* ── MUI Table Pagination ── */}
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
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            {editingCategory ? 'Edit Category' : 'Add Category'}
            <IconButton onClick={handleCloseDialog} size="small" disabled={isSubmitting}>
              <X size={16} />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              {/* Category Name */}
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Category Name *"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    size="small"
                  />
                )}
              />

              {/* Level */}
              <Controller
                name="level"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small" error={!!errors.level}>
                    <InputLabel>Level *</InputLabel>
                    <Select {...field} label="Level *">
                      <MenuItem value="Main">Main Category</MenuItem>
                      <MenuItem value="Sub">Sub Category</MenuItem>
                    </Select>
                    {errors.level && <FormHelperText>{errors.level.message}</FormHelperText>}
                  </FormControl>
                )}
              />

              {/* Parent Category — only shown when level = Sub */}
              {watchedLevel === 'Sub' && (
                <Controller
                  name="parent"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small" error={!!errors.parent}>
                      <InputLabel>Parent Category *</InputLabel>
                      <Select
                        {...field}
                        value={field.value ?? ''}
                        label="Parent Category *"
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? null : e.target.value)
                        }
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {mainCategories.map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.name} ({c.code})
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.parent && <FormHelperText>{errors.parent.message}</FormHelperText>}
                    </FormControl>
                  )}
                />
              )}

              {/* Costing Method */}
              <Controller
                name="costing_method"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small" error={!!errors.costing_method}>
                    <InputLabel>Costing Method</InputLabel>
                    <Select {...field} label="Costing Method">
                      <MenuItem value="average">Average Cost</MenuItem>
                      <MenuItem value="fifo">First In First Out (FIFO)</MenuItem>
                      <MenuItem value="standard">Standard Price</MenuItem>
                    </Select>
                    {errors.costing_method && (
                      <FormHelperText>{errors.costing_method.message}</FormHelperText>
                    )}
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
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    size="small"
                  />
                )}
              />

              {/* Status */}
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
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Delete Confirm Dialog ────────────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, name: '' })}
        title="Delete Category"
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
