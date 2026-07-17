'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';

import {
  Box,
  Card,
  Chip,
  Table,
  Button,
  Dialog,
  Switch,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  IconButton,
  CardContent,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  FormControlLabel,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

const FIELD_ICONS = {
  text: 'solar:text-field-bold',
  number: 'solar:hashtag-bold',
  dropdown: 'solar:list-down-bold',
  checkbox: 'solar:check-square-bold',
  date: 'solar:calendar-bold',
  email: 'solar:letter-bold',
  url: 'solar:link-bold',
  currency: 'solar:dollar-minimalistic-bold',
  phone: 'solar:phone-bold',
  rating: 'solar:star-bold',
  formula: 'solar:calculator-bold',
  relationship: 'solar:link-circle-bold',
  file: 'solar:file-bold',
  progress: 'solar:pie-chart-2-bold',
  people: 'solar:user-bold',
  location: 'solar:map-point-bold',
};

const FIELD_TYPES = [
  'text',
  'number',
  'dropdown',
  'checkbox',
  'date',
  'email',
  'url',
  'currency',
  'phone',
  'rating',
  'formula',
  'relationship',
  'file',
  'progress',
  'people',
  'location',
];

export function SettingsCustomFields() {
  const { data: rawFields } = useGetRequest(EP.custom_fields);
  const CUSTOM_FIELDS = Array.isArray(rawFields) ? rawFields : rawFields?.results || [];
  const { data: rawSpaces } = useGetRequest(EP.spaces);
  const SPACES = Array.isArray(rawSpaces) ? rawSpaces : rawSpaces?.results || [];
  const { data: rawOptions } = useGetRequest(EP.custom_field_options);
  const ALL_OPTIONS = Array.isArray(rawOptions) ? rawOptions : rawOptions?.results || [];

  // Create state
  const [createOpen, setCreateOpen] = useState(false);
  const [newField, setNewField] = useState({
    name: '',
    field_type: 'text',
    description: '',
    is_required: false,
    space: '',
  });
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editField, setEditField] = useState({
    id: null,
    name: '',
    field_type: 'text',
    description: '',
    is_required: false,
  });
  const [editing, setEditing] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Option management for dropdown fields
  const [optionOpen, setOptionOpen] = useState(false);
  const [optionField, setOptionField] = useState(null);
  const [newOption, setNewOption] = useState('');
  const [optionSaving, setOptionSaving] = useState(false);
  const [editOptionId, setEditOptionId] = useState(null);
  const [editOptionName, setEditOptionName] = useState('');
  const [optionEditing, setOptionEditing] = useState(false);
  const [deleteOptionId, setDeleteOptionId] = useState(null);
  const [optionDeleting, setOptionDeleting] = useState(false);

  const getSpaceById = (sid) => SPACES.find((s) => s.id === sid);

  const refreshAll = () => {
    mutate(EP.custom_fields);
    mutate(EP.custom_field_options);
  };

  const handleCreate = async () => {
    if (!newField.name) {
      toast.error('Field name is required');
      return;
    }
    setCreating(true);
    try {
      const payload = { ...newField };
      if (!payload.space) delete payload.space;
      await axiosInstance.post(EP.custom_fields, payload);
      toast.success(`Field "${newField.name}" created`);
      setCreateOpen(false);
      setNewField({ name: '', field_type: 'text', description: '', is_required: false, space: '' });
      refreshAll();
    } catch (err) {
      toast.error(err?.message || 'Failed to create field');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async () => {
    if (!editField.name) {
      toast.error('Field name is required');
      return;
    }
    setEditing(true);
    try {
      await axiosInstance.patch(EP.custom_field_by_id(editField.id), {
        name: editField.name,
        field_type: editField.field_type,
        description: editField.description,
        is_required: editField.is_required,
      });
      toast.success(`Field "${editField.name}" updated`);
      setEditOpen(false);
      refreshAll();
    } catch (err) {
      toast.error(err?.message || 'Failed to update field');
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(EP.custom_field_by_id(deleteTarget.id));
      toast.success(`Field "${deleteTarget.name}" deleted`);
      setDeleteOpen(false);
      setDeleteTarget(null);
      refreshAll();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete field');
    } finally {
      setDeleting(false);
    }
  };

  // --- Option CRUD ---
  const fieldOptions = optionField
    ? ALL_OPTIONS.filter((o) => o.custom_field === optionField.id)
    : [];

  const handleCreateOption = async () => {
    if (!newOption || !optionField) return;
    setOptionSaving(true);
    try {
      await axiosInstance.post(EP.custom_field_options, {
        custom_field: optionField.id,
        name: newOption,
      });
      toast.success(`Option "${newOption}" added`);
      setNewOption('');
      refreshAll();
    } catch (err) {
      toast.error(err?.message || 'Failed to add option');
    } finally {
      setOptionSaving(false);
    }
  };

  const handleEditOption = async () => {
    if (!editOptionId || !editOptionName) return;
    setOptionEditing(true);
    try {
      await axiosInstance.patch(EP.custom_field_option_by_id(editOptionId), {
        name: editOptionName,
      });
      toast.success('Option updated');
      setEditOptionId(null);
      setEditOptionName('');
      refreshAll();
    } catch (err) {
      toast.error(err?.message || 'Failed to update option');
    } finally {
      setOptionEditing(false);
    }
  };

  const handleDeleteOption = async () => {
    if (!deleteOptionId) return;
    setOptionDeleting(true);
    try {
      await axiosInstance.delete(EP.custom_field_option_by_id(deleteOptionId));
      toast.success('Option deleted');
      setDeleteOptionId(null);
      refreshAll();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete option');
    } finally {
      setOptionDeleting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Custom Fields
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create custom fields for your tasks — text, numbers, dropdowns, dates, and more
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="solar:add-circle-bold" />}
          onClick={() => setCreateOpen(true)}
        >
          Create Field
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Field</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Required</TableCell>
                <TableCell>Space</TableCell>
                <TableCell>Options</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {CUSTOM_FIELDS.map((f) => {
                const space = getSpaceById(f.space || f.space_id);
                const options = ALL_OPTIONS.filter((o) => o.custom_field === f.id);
                return (
                  <TableRow key={f.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon
                          icon={FIELD_ICONS[f.field_type] || 'solar:text-field-bold'}
                          width={20}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {f.name}
                          </Typography>
                          {f.description && (
                            <Typography variant="caption" color="text.secondary">
                              {f.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={f.field_type}
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      {f.is_required ? (
                        <Chip label="Required" size="small" color="warning" />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Optional
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{space?.name || 'All'}</TableCell>
                    <TableCell>
                      {f.field_type === 'dropdown' ? (
                        <Box
                          sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}
                        >
                          {options.map((o) => (
                            <Chip key={o.id} label={o.name} size="small" />
                          ))}
                          <IconButton
                            size="small"
                            title="Manage options"
                            onClick={() => {
                              setOptionField(f);
                              setOptionOpen(true);
                            }}
                          >
                            <Icon icon="solar:settings-bold" width={16} />
                          </IconButton>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          &mdash;
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        title="Edit"
                        onClick={() => {
                          setEditField({
                            id: f.id,
                            name: f.name,
                            field_type: f.field_type,
                            description: f.description || '',
                            is_required: !!f.is_required,
                          });
                          setEditOpen(true);
                        }}
                      >
                        <Icon icon="solar:pen-bold" width={18} />
                      </IconButton>
                      <IconButton
                        size="small"
                        title="Delete"
                        color="error"
                        onClick={() => {
                          setDeleteTarget(f);
                          setDeleteOpen(true);
                        }}
                      >
                        <Icon icon="solar:trash-bin-trash-bold" width={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Available Field Types */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Available Field Types
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {FIELD_TYPES.map((type) => (
              <Chip
                key={type}
                label={type}
                icon={<Icon icon={FIELD_ICONS[type]} width={16} />}
                variant="outlined"
                sx={{ textTransform: 'capitalize' }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Create Field Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Custom Field</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Field Name"
            fullWidth
            value={newField.name}
            onChange={(e) => setNewField({ ...newField, name: e.target.value })}
          />
          <TextField
            select
            label="Field Type"
            value={newField.field_type}
            fullWidth
            onChange={(e) => setNewField({ ...newField, field_type: e.target.value })}
          >
            {FIELD_TYPES.map((t) => (
              <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>
                {t}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={newField.description}
            onChange={(e) => setNewField({ ...newField, description: e.target.value })}
          />
          <TextField
            select
            label="Space"
            value={newField.space}
            fullWidth
            onChange={(e) => setNewField({ ...newField, space: e.target.value })}
          >
            <MenuItem value="">All Spaces</MenuItem>
            {SPACES.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={
              <Switch
                checked={newField.is_required}
                onChange={(e) => setNewField({ ...newField, is_required: e.target.checked })}
              />
            }
            label="Required field"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Field Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Custom Field</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Field Name"
            fullWidth
            value={editField.name}
            onChange={(e) => setEditField({ ...editField, name: e.target.value })}
          />
          <TextField
            select
            label="Field Type"
            value={editField.field_type}
            fullWidth
            onChange={(e) => setEditField({ ...editField, field_type: e.target.value })}
          >
            {FIELD_TYPES.map((t) => (
              <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>
                {t}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={editField.description}
            onChange={(e) => setEditField({ ...editField, description: e.target.value })}
          />
          <FormControlLabel
            control={
              <Switch
                checked={editField.is_required}
                onChange={(e) => setEditField({ ...editField, is_required: e.target.checked })}
              />
            }
            label="Required field"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={editing}>
            {editing ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Field Confirmation */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Custom Field</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the field <strong>{deleteTarget?.name}</strong>? All
            task data for this field will be lost.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Options Dialog (for dropdown fields) */}
      <Dialog
        open={optionOpen}
        onClose={() => {
          setOptionOpen(false);
          setEditOptionId(null);
          setDeleteOptionId(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Manage Options — {optionField?.name}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {/* Add new option */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              size="small"
              label="New option"
              value={newOption}
              sx={{ flex: 1 }}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateOption();
              }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleCreateOption}
              disabled={!newOption || optionSaving}
            >
              {optionSaving ? 'Adding...' : 'Add'}
            </Button>
          </Box>
          {/* Option list */}
          {fieldOptions.map((opt) => (
            <Box key={opt.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
              {editOptionId === opt.id ? (
                <>
                  <TextField
                    size="small"
                    value={editOptionName}
                    sx={{ flex: 1 }}
                    onChange={(e) => setEditOptionName(e.target.value)}
                  />
                  <Button size="small" onClick={handleEditOption} disabled={optionEditing}>
                    Save
                  </Button>
                  <Button size="small" onClick={() => setEditOptionId(null)}>
                    Cancel
                  </Button>
                </>
              ) : deleteOptionId === opt.id ? (
                <>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    Delete &quot;{opt.name}&quot;?
                  </Typography>
                  <Button
                    size="small"
                    color="error"
                    onClick={handleDeleteOption}
                    disabled={optionDeleting}
                  >
                    Yes
                  </Button>
                  <Button size="small" onClick={() => setDeleteOptionId(null)}>
                    No
                  </Button>
                </>
              ) : (
                <>
                  <Chip label={opt.name} size="small" sx={{ flex: 1 }} />
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditOptionId(opt.id);
                      setEditOptionName(opt.name);
                    }}
                  >
                    <Icon icon="solar:pen-bold" width={14} />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => setDeleteOptionId(opt.id)}>
                    <Icon icon="solar:trash-bin-trash-bold" width={14} />
                  </IconButton>
                </>
              )}
            </Box>
          ))}
          {fieldOptions.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No options yet. Add one above.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOptionOpen(false);
              setEditOptionId(null);
              setDeleteOptionId(null);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
