'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { useForm, Controller } from 'react-hook-form';
import React, { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Chip,
  Card,
  Grid,
  Paper,
  Table,
  Stack,
  Button,
  Dialog,
  Switch,
  Tooltip,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Pagination,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  InputAdornment,
  CircularProgress,
  FormControlLabel,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  usePatchRequest,
  useCreateRequest,
  useDeleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import MuiAutocomplete from 'src/components/hook-form/mui-autocomplete';

// Level Options
const levelOptions = [
  { id: 'Main', name: 'Main' },
  { id: 'Sub', name: 'Sub' },
];

// Status Options
const statusOptions = [
  { id: 'Active', name: 'Active' },
  { id: 'Inactive', name: 'Inactive' },
];

export default function ItemCategoryList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const [selectedParentId, setSelectedParentId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState('');

  // Fetch categories with pagination
  const {
    data: filteredCategoryData,
    loading: filteredCategoryLoading,
    error: filteredCategoryError,
  } = useGetRequest(
    `${endpoints.storeInventory.item_category}?level=${selectedLevel}&status=${selectedStatus}&parent=${selectedParentId}&search=${searchQuery}&category_id=${selectedCategoryName}&page=${page + 1}&pagination=true`
  );
  // console.log('Filtered Category Data:', filteredCategoryData);

  // Fetch categories with pagination

  const {
    data: categoryData,
    loading: categoryLoading,
    error: categoryError,
  } = useGetRequest(`${endpoints.storeInventory.item_category}?page=${page + 1}&pagination=true`);

  const renderCategoryList = filteredCategoryData?.results || categoryData?.results || [];

  // Fetch main categories for parent dropdown

  const { data: mainCategoryData, loading: mainCategoryLoading } = useGetRequest(
    `${endpoints.storeInventory.item_category}?level=main`
  );
  const { data: allCategories, loading: allCategoriesLoading } = useGetRequest(
    `${endpoints.storeInventory.item_category}`
  );

  const filterAllCategories = [{ id: '', name: 'All Categories' }, ...allCategories];
  // Calculate total pages based on API response
  const ROWS_PER_PAGE = categoryData?.page_size || 10; // Fallback to 10 if API doesn't provide page_size
  const totalPages = useMemo(() => {
    const total = filteredCategoryData?.total ?? categoryData?.total ?? 0;

    return Math.ceil(total / ROWS_PER_PAGE);
  }, [filteredCategoryData?.total, categoryData?.total, ROWS_PER_PAGE]);

  // Form handling
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      level: null,
      parent: null,
      status: null,
    },
  });

  const watchedLevel = watch('level');

  // Reset form when modal opens/closes or edit mode changes
  useEffect(() => {
    if (openModal && editCategory) {
      reset({
        name: editCategory?.name || '',
        description: editCategory?.description || '',
        level: editCategory?.level || null,
        parent: editCategory?.parent || null,
        status: editCategory?.status || null,
      });
    } else if (openModal && !editCategory) {
      reset({
        name: '',
        description: '',
        level: null,
        parent: null,
        status: null,
      });
    }
  }, [openModal, editCategory, reset]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [selectedLevel, selectedStatus, selectedParentId, selectedCategoryName, searchQuery]);

  // Handle modal open for create
  const handleOpenCreate = () => {
    setEditCategory(null);
    setOpenModal(true);
  };

  // Handle modal open for edit
  const handleOpenEdit = (category) => {
    setEditCategory(category);
    setOpenModal(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setOpenModal(false);
    setEditCategory(null);
    reset();
  };

  // Handle delete confirmation open
  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setDeleteConfirmOpen(true);
  };

  // Handle delete confirmation close
  const handleDeleteClose = () => {
    setDeleteConfirmOpen(false);
    setCategoryToDelete(null);
  };

  const deleteCategory = useDeleteRequest;
  const patchCategory = usePatchRequest;
  const createCategory = useCreateRequest;
  // Handle delete
  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory(endpoints.storeInventory.item_category_by_id(categoryToDelete.id));
      toast.success('Category deleted successfully!');
      mutate(
        (key) => typeof key === 'string' && key.startsWith(endpoints.storeInventory.item_category)
      );
      handleDeleteClose();
    } catch (error) {
      toast.error('Error deleting category?. Please try again.');
    }
  };

  // Handle form submit
  const onSubmit = async (data) => {
    const payload = {
      name: data.name,
      description: data.description,
      level: data.level,
      parent: data.level === 'Main' ? null : data.parent,
      status: data.status,
    };

    // console.log('Form Data:', payload);

    try {
      if (editCategory) {
        await patchCategory(
          endpoints.storeInventory.item_category_by_id(editCategory?.id),
          payload
        );
        toast.success('Category updated successfully!');
      } else {
        await createCategory(endpoints.storeInventory.item_category, payload);
        toast.success('Category created successfully!');
      }
      mutate(
        (key) => typeof key === 'string' && key.startsWith(endpoints.storeInventory.item_category)
      );
      handleCloseModal();
    } catch (error) {
      toast.error(`Error ${editCategory ? 'updating' : 'creating'} category?. Please try again.`);
    }
  };

  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Item Categories
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Icon icon="mdi:plus" />}
          onClick={handleOpenCreate}
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
          Add Category
        </Button>
      </Stack>
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
            {/* Search */}
            <Grid size={{ xs: 12, md: 10 }}>
              <TextField
                fullWidth
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" sx={{ color: '#9ca3af' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minHeight: 40,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f9fafb',
                    '& fieldset': { borderColor: '#e5e7eb' },
                    '&:hover fieldset': { borderColor: '#d1d5db' },
                    '&.Mui-focused fieldset': { borderColor: '#d1d5db' },
                  },
                }}
                size="small"
              />
            </Grid>

            {/* Filter */}
            <Grid size={{ xs: 12, md: 2 }}>
              <MuiAutocomplete
                label="Filter by name..."
                value={selectedCategoryName}
                options={filterAllCategories || []}
                loading={allCategoriesLoading}
                onChange={(value) => setSelectedCategoryName(value)}
                optionLabel="name"
                optionValue="id"
              />
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 3 }}>
        <TableContainer>
          <Table size={dense ? 'small' : 'medium'}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Level</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Parent</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categoryLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : renderCategoryList?.length > 0 ? (
                renderCategoryList?.map((category) => (
                  <TableRow key={category?.id} hover>
                    <TableCell>{category?.code}</TableCell>
                    <TableCell>{category?.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={category?.level}
                        size="small"
                        color={category?.level === 'Main' ? 'primary' : 'secondary'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{category?.parent_name || '---'}</TableCell>
                    <TableCell>{category?.item_count || 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={category?.status}
                        size="small"
                        color={getStatusColor(category?.status)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenEdit(category)}
                          >
                            <Icon icon="mdi:pencil" width={20} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(category)}
                          >
                            <Icon icon="mdi:delete" width={20} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No categories found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            py: 3,
            pr: { xs: 2, sm: 3, md: 12 },
            pl: 2,
          }}
        >
          {/* Table Pagination - Server Controlled */}
          {/* Dense Padding Control */}

          <FormControlLabel
            control={<Switch checked={dense} onChange={() => setDense(!dense)} />}
            label="Dense"
          />

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'start', py: 2 }}>
              <Pagination
                count={totalPages}
                page={page + 1}
                variant="outlined"
                shape="rounded"
                onChange={(event, pageNumber) => setPage(pageNumber - 1)}
              />
            </Box>
          )}
        </Box>
      </Paper>

      {/* Create/Edit Modal */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={700}>
              {editCategory ? 'Edit Category' : 'Add New Category'}
            </Typography>
            <IconButton onClick={handleCloseModal} size="small">
              <Icon icon="mdi:close" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={3}>
              {/* Name */}
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Category Name"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />

              {/* Description */}
              <Controller
                name="description"
                control={control}
                rules={{ required: 'Description is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />

              {/* Level */}
              <Controller
                name="level"
                control={control}
                rules={{ required: 'Level is required' }}
                render={({ field }) => (
                  <MuiAutocomplete
                    label="Level"
                    value={field.value}
                    options={levelOptions}
                    onChange={(value) => field.onChange(value)}
                    optionLabel="name"
                    optionValue="id"
                    error={!!errors.level}
                    helperText={errors.level?.message}
                  />
                )}
              />

              {/* Parent - Only show when level is Sub */}
              {watchedLevel === 'Sub' && (
                <Controller
                  name="parent"
                  control={control}
                  rules={{
                    required: watchedLevel === 'Sub' ? 'Parent category is required' : false,
                  }}
                  render={({ field }) => (
                    <MuiAutocomplete
                      label="Parent Category"
                      value={field.value}
                      options={mainCategoryData || []}
                      loading={mainCategoryLoading}
                      onChange={(value) => field.onChange(value)}
                      optionLabel="name"
                      optionValue="id"
                      error={!!errors.parent}
                      helperText={errors.parent?.message}
                    />
                  )}
                />
              )}

              {/* Status */}
              <Controller
                name="status"
                control={control}
                rules={{ required: 'Status is required' }}
                render={({ field }) => (
                  <MuiAutocomplete
                    label="Status"
                    value={field.value}
                    options={statusOptions}
                    onChange={(value) => field.onChange(value)}
                    optionLabel="name"
                    optionValue="id"
                    error={!!errors.status}
                    helperText={errors.status?.message}
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              variant="outlined"
              onClick={handleCloseModal}
              disabled={isSubmitting}
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{ borderRadius: 2 }}
              startIcon={
                isSubmitting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : null
              }
            >
              {isSubmitting ? 'Saving...' : editCategory ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Icon icon="mdi:alert-circle" color="#d32f2f" width={24} />
            <Typography variant="h6" fontWeight={700}>
              Delete Category
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{categoryToDelete?.name}</strong>? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={handleDeleteClose} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete} sx={{ borderRadius: 2 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
