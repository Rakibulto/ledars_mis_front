'use client';

import { z } from 'zod';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Edit, Plus, Search, Trash2 } from 'lucide-react';

import {
  Grid,
  Stack,
  Dialog,
  Select,
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

const ACCOUNT_CATEGORY_URL = endpoints.procurement_management.account_categories;
const ACCOUNT_CATEGORY_BY_ID = (id) => `${ACCOUNT_CATEGORY_URL}${id}/`;

const accountCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  parent: z.union([z.number(), z.string(), z.null()]).optional(),
  is_active: z.boolean().default(true),
});

const defaultValues = {
  name: '',
  parent: null,
  is_active: true,
};

export function AccountCategorySetup() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const listUrl = `${ACCOUNT_CATEGORY_URL}?pagination=false`;
  const { data: rawData, loading } = useGetRequest(listUrl);

  const categories = useMemo(
    () => (Array.isArray(rawData) ? rawData : rawData?.results || []),
    [rawData]
  );

  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    return categories.filter((category) =>
      String(category.name || '')
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    );
  }, [categories, search]);

  const pageCount = Math.ceil(filteredCategories.length / rowsPerPage);
  const paginatedCategories = useMemo(
    () => filteredCategories.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredCategories, page, rowsPerPage]
  );

  const parentOptions = useMemo(
    () => categories.filter((category) => category.id !== editingCategory?.id),
    [categories, editingCategory]
  );

  const parentMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories]
  );

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(accountCategorySchema),
    defaultValues,
  });

  const handleOpenCreate = () => {
    setEditingCategory(null);
    reset(defaultValues);
    setOpenDialog(true);
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    reset({
      name: category.name || '',
      parent: category.parent || null,
      is_active: category.is_active ?? true,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    if (isSubmitting) return;
    setOpenDialog(false);
    setEditingCategory(null);
    reset(defaultValues);
  };

  const handleSubmitForm = async (values) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: values.name,
        parent: values.parent || null,
        is_active: values.is_active,
      };

      if (editingCategory) {
        await axios.patch(ACCOUNT_CATEGORY_BY_ID(editingCategory.id), payload);
        toast.success('Account category updated successfully');
      } else {
        await axios.post(ACCOUNT_CATEGORY_URL, payload);
        toast.success('Account category created successfully');
      }

      await mutate(listUrl);
      handleCloseDialog();
    } catch (error) {
      const detail = error?.response?.data;
      const message =
        typeof detail === 'string'
          ? detail
          : Object.values(detail || {})
              .flat()
              .join(', ') || 'Unable to save account category';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(ACCOUNT_CATEGORY_BY_ID(deleteConfirm.id));
      toast.success('Account category deleted successfully');
      await mutate(listUrl);
      setDeleteConfirm({ open: false, id: null, name: '' });
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Failed to delete account category');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteConfirm = (category) => {
    setDeleteConfirm({ open: true, id: category.id, name: category.name });
  };

  const onSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number(event.target.value));
    setPage(0);
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Account Category Setup</h1>
          <p className="text-muted-foreground">
            Create and manage GL account categories and subcategories.
          </p>
        </div>
        <Button variant="primary" onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Account Category
        </Button>
      </div>

      <Card>
        <CardHeader
          title={`Account Categories (${filteredCategories.length})`}
          description="Manage categories used by account codes"
        />
        <CardBody>
          <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by category name..."
                value={search}
                onChange={onSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-border">
                <tr className="text-left">
                  <th className="pb-3 text-sm font-semibold text-foreground">Name</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Parent</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Subcategories</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Status</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      <CircularProgress size={24} />
                    </td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No account categories found.
                    </td>
                  </tr>
                ) : (
                  paginatedCategories.map((category) => (
                    <tr
                      key={category.id}
                      className="border-b border-border hover:bg-muted/50 transition"
                    >
                      <td className="py-4 text-sm text-foreground">{category.name}</td>
                      <td className="py-4 text-sm text-muted-foreground">
                        {parentMap.get(category.parent) || '-'}
                      </td>
                      <td className="py-4 text-sm text-foreground">
                        {Array.isArray(category.subcategories) ? category.subcategories.length : 0}
                      </td>
                      <td className="py-4">
                        <Badge variant={category.is_active ? 'success' : 'default'}>
                          {category.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="p-2 hover:bg-muted rounded transition-colors"
                            onClick={() => handleOpenEdit(category)}
                          >
                            <Edit className="w-4 h-4 text-primary" />
                          </button>
                          <button
                            type="button"
                            className="p-2 hover:bg-muted rounded transition-colors"
                            onClick={() => openDeleteConfirm(category)}
                          >
                            <Trash2 className="w-4 h-4 text-error" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            component="div"
            count={filteredCategories.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 1 }}
          />
        </CardBody>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(handleSubmitForm)}>
          <DialogTitle
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            {editingCategory ? 'Edit Account Category' : 'Add Account Category'}
            <IconButton onClick={handleCloseDialog} size="small" disabled={isSubmitting}>
              <X size={16} />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Category Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    size="small"
                  />
                )}
              />

              <Controller
                name="parent"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small" error={!!errors.parent}>
                    <InputLabel>Parent Category</InputLabel>
                    <Select
                      {...field}
                      label="Parent Category"
                      value={field.value ?? ''}
                      onChange={(event) => field.onChange(event.target.value || null)}
                    >
                      <MenuItem value="">None</MenuItem>
                      {parentOptions.map((parent) => (
                        <MenuItem key={parent.id} value={parent.id}>
                          {parent.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.parent && <FormHelperText>{errors.parent.message}</FormHelperText>}
                  </FormControl>
                )}
              />

              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      {...field}
                      label="Status"
                      value={field.value ? 'active' : 'inactive'}
                      onChange={(event) => field.onChange(event.target.value === 'active')}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
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
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, name: '' })}
        title="Delete Account Category"
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
