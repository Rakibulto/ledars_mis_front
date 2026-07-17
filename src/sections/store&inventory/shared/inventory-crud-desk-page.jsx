'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import {
  Grid,
  Stack,
  Button,
  Dialog,
  MenuItem,
  TextField,
  IconButton,
  DialogTitle,
  DialogActions,
  DialogContent,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import {
  usePutRequest as putRequest,
  useCreateRequest as createRequest,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import InventoryDeskPage from './inventory-desk-page';

function resolveEndpoint(endpoint, value) {
  return typeof endpoint === 'function' ? endpoint(value) : endpoint;
}

function resolveFieldLabel(fieldKey) {
  return fieldKey
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function InventoryCrudDeskPage({
  title,
  description,
  icon,
  rows,
  columns,
  summaryCards,
  queueItems,
  reviewFields,
  defaultForm,
  fields,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  mutateKey,
  getRowId,
  getRowTitle,
  getRowSubtitle,
  dialogTitle,
  createLabel = 'Add New',
  emptyMessage,
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteItem, setDeleteItem] = useState(null);
  const confirm = useBoolean();

  const openCreate = () => {
    setEditingItem(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm(
      Object.keys(defaultForm).reduce((accumulator, key) => {
        accumulator[key] = item?.[key] ?? defaultForm[key];
        return accumulator;
      }, {})
    );
    setDialogOpen(true);
  };

  const actionColumns = useMemo(
    () => [
      ...columns,
      {
        label: 'Actions',
        align: 'center',
        render: (row) => (
          <Stack direction="row" spacing={0.5} justifyContent="center">
            <IconButton
              size="small"
              color="primary"
              onClick={(event) => {
                event.stopPropagation();
                openEdit(row);
              }}
            >
              <Iconify icon="solar:pen-bold" width={18} />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={(event) => {
                event.stopPropagation();
                setDeleteItem(row);
                confirm.onTrue();
              }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" width={18} />
            </IconButton>
          </Stack>
        ),
      },
    ],
    [columns, confirm]
  );

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        await putRequest(resolveEndpoint(updateEndpoint, editingItem.id), form);
        toast.success('Updated successfully');
      } else {
        await createRequest(resolveEndpoint(createEndpoint), form);
        toast.success('Created successfully');
      }

      setDialogOpen(false);
      setEditingItem(null);
      setForm(defaultForm);
      mutate(mutateKey);
    } catch (error) {
      toast.error(editingItem ? 'Failed to update' : 'Failed to create');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRequest(resolveEndpoint(deleteEndpoint, deleteItem?.id));
      toast.success('Deleted successfully');
      mutate(mutateKey);
    } catch (error) {
      toast.error('Failed to delete');
    } finally {
      confirm.onFalse();
      setDeleteItem(null);
    }
  };

  return (
    <>
      <InventoryDeskPage
        title={title}
        description={description}
        icon={icon}
        rows={rows}
        columns={actionColumns}
        summaryCards={summaryCards}
        queueItems={queueItems}
        reviewFields={reviewFields}
        getRowId={getRowId}
        getRowTitle={getRowTitle}
        getRowSubtitle={getRowSubtitle}
        emptyMessage={emptyMessage}
        headerAction={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={openCreate}
          >
            {createLabel}
          </Button>
        }
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingItem ? `Edit ${dialogTitle || title}` : `Add ${dialogTitle || title}`}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {fields.map((field) => (
              <Grid item xs={12} sm={field.sm || 6} key={field.key}>
                <TextField
                  fullWidth
                  size="small"
                  select={Boolean(field.options)}
                  type={field.type || 'text'}
                  label={field.label || resolveFieldLabel(field.key)}
                  value={form[field.key] ?? ''}
                  onChange={(event) => {
                    const nextValue =
                      field.type === 'checkbox' ? event.target.checked : event.target.value;
                    setForm({ ...form, [field.key]: nextValue });
                  }}
                  InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                  multiline={field.multiline}
                  rows={field.rows}
                >
                  {field.options?.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content="Are you sure you want to delete this record?"
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </>
  );
}
