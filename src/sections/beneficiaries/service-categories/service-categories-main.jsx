'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';

import {
  Box,
  Card,
  Grid,
  Stack,
  Table,
  Button,
  Dialog,
  Switch,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  IconButton,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import SummaryCard from '../../_components/summary-card';

const INITIAL_FORM = { name: '', description: '', status: true };

export default function ServiceCategoriesMain() {
  const { data: rawData, loading } = useGetRequest(endpoints.beneficiaries.service_categories);
  const categories = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const formDialog = useBoolean();
  const confirmDelete = useBoolean();
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [deleteId, setDeleteId] = useState(null);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    formDialog.onTrue();
  }, [formDialog]);

  const handleOpenEdit = useCallback(
    (row) => {
      setEditingItem(row);
      setFormData({
        name: row.name || '',
        description: row.description || '',
        status: row.status ?? true,
      });
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleSubmit = useCallback(async () => {
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }
    try {
      if (editingItem) {
        await axiosInstance.patch(
          `${endpoints.beneficiaries.service_categories}${editingItem.id}/`,
          formData
        );
        toast.success('Category updated successfully');
      } else {
        await axiosInstance.post(endpoints.beneficiaries.service_categories, formData);
        toast.success('Category added successfully');
      }
      mutate(endpoints.beneficiaries.service_categories);
      formDialog.onFalse();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  }, [formData, editingItem, formDialog]);

  const handleToggleStatus = useCallback(async (row) => {
    try {
      await axiosInstance.patch(`${endpoints.beneficiaries.service_categories}${row.id}/`, {
        status: !row.status,
      });
      mutate(endpoints.beneficiaries.service_categories);
      toast.success('Category status updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  }, []);

  const handleOpenDelete = useCallback(
    (id) => {
      setDeleteId(id);
      confirmDelete.onTrue();
    },
    [confirmDelete]
  );

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await axiosInstance.delete(`${endpoints.beneficiaries.service_categories}${deleteId}/`);
      mutate(endpoints.beneficiaries.service_categories);
      toast.success('Category deleted');
      confirmDelete.onFalse();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  }, [deleteId, confirmDelete]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Service Categories
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage categories of services provided to beneficiaries
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleOpenCreate}
          startIcon={<Iconify icon="solar:add-circle-bold" />}
        >
          Add Category
        </Button>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Total Categories"
            value={categories.length}
            icon="solar:widget-bold"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Active"
            value={categories.filter((c) => c.status).length}
            icon="solar:check-circle-bold"
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Inactive"
            value={categories.filter((c) => !c.status).length}
            icon="solar:close-circle-bold"
            color="error"
          />
        </Grid>
      </Grid>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Category Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((row, idx) => (
                <TableRow key={row.id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    <Typography fontWeight="bold">{row.name}</Typography>
                  </TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell align="center">
                    <Switch checked={row.status} onChange={() => handleToggleStatus(row)} />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <IconButton size="small" color="primary" onClick={() => handleOpenEdit(row)}>
                        <Iconify icon="solar:pen-bold" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDelete(row.id)}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={formDialog.value} onClose={formDialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Category' : 'Add Service Category'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Category Name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              fullWidth
              required
            />
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={formDialog.onFalse}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingItem ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Delete Category"
        content="Are you sure you want to delete this category?"
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
