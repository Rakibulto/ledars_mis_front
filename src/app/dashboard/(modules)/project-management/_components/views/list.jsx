'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';

import {
  Box,
  Card,
  Grid,
  Chip,
  Button,
  Avatar,
  Dialog,
  MenuItem,
  Checkbox,
  TextField,
  Typography,
  IconButton,
  CardContent,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

const VIEW_ICONS = {
  list: 'solar:list-bold-duotone',
  board: 'solar:widget-5-bold-duotone',
  calendar: 'solar:calendar-bold-duotone',
  gantt: 'solar:chart-bold-duotone',
  timeline: 'solar:graph-up-bold-duotone',
  table: 'solar:database-bold-duotone',
};

const VIEW_COLORS = {
  list: '#3b82f6',
  board: '#8b5cf6',
  calendar: '#f59e0b',
  gantt: '#06b6d4',
  timeline: '#ec4899',
  table: '#22c55e',
};

function ViewsList() {
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    view_type: 'list',
    filters: '{}',
    is_default: false,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: null, name: '', description: '' });
  const [deleteId, setDeleteId] = useState(null);

  const { data: rawViews } = useGetRequest(EP.saved_views);
  const { data: rawUsers } = useGetRequest('/api/employees/');

  const VIEWS = Array.isArray(rawViews) ? rawViews : rawViews?.results || [];
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];

  const getUserById = (uid) => USERS.find((u) => u.id === uid);

  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await axiosInstance.post(EP.saved_views, {
        name: createForm.name,
        description: createForm.description,
        view_type: createForm.view_type,
        filters: JSON.parse(createForm.filters || '{}'),
        is_default: createForm.is_default,
      });
      mutate(EP.saved_views);
      toast.success('View created');
      setCreateOpen(false);
      setCreateForm({
        name: '',
        description: '',
        view_type: 'list',
        filters: '{}',
        is_default: false,
      });
    } catch (err) {
      toast.error(err?.message || 'Failed to create view');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(EP.saved_view_by_id(editForm.id), {
        name: editForm.name,
        description: editForm.description,
      });
      mutate(EP.saved_views);
      toast.success('View updated');
      setEditOpen(false);
    } catch (err) {
      toast.error(err?.message || 'Failed to update view');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await axiosInstance.delete(EP.saved_view_by_id(deleteId));
      mutate(EP.saved_views);
      toast.success('View deleted');
      setDeleteId(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete view');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Saved Views
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Custom filtered & sorted views of your tasks
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="solar:add-circle-bold" />}
          onClick={() => setCreateOpen(true)}
        >
          Create View
        </Button>
      </Box>

      <Grid container spacing={3}>
        {VIEWS.map((view) => {
          const creator = getUserById(view.created_by);
          const filterCount = Object.keys(view.filters).length;
          return (
            <Grid key={view.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 4 },
                  transition: 'box-shadow 0.2s',
                  borderTop: `3px solid ${VIEW_COLORS[view.type] || '#9ca3af'}`,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        sx={{
                          bgcolor: `${VIEW_COLORS[view.type] || '#9ca3af'}20`,
                          color: VIEW_COLORS[view.type] || '#9ca3af',
                          width: 40,
                          height: 40,
                        }}
                      >
                        <Icon icon={VIEW_ICONS[view.type] || 'solar:list-bold'} width={20} />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {view.name}
                        </Typography>
                        <Chip
                          label={view.type}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            textTransform: 'capitalize',
                            bgcolor: `${VIEW_COLORS[view.type] || '#9ca3af'}15`,
                            color: VIEW_COLORS[view.type] || '#9ca3af',
                          }}
                        />
                      </Box>
                    </Box>
                    <Box>
                      {view.is_default && (
                        <Chip
                          label="Default"
                          size="small"
                          color="primary"
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {Object.entries(view.filters).map(([key, val]) => (
                      <Chip
                        key={key}
                        label={`${key}: ${Array.isArray(val) ? val.join(', ') : val}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: 22 }}
                      />
                    ))}
                    <Chip
                      label={`Sort: ${view.sort.field} ${view.sort.direction}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.65rem', height: 22 }}
                    />
                  </Box>

                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Avatar sx={{ width: 20, height: 20, fontSize: 10, bgcolor: '#3b82f6' }}>
                        {creator?.name?.charAt(0)}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary">
                        {creator?.name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {view.is_shared && (
                        <Icon
                          icon="solar:users-group-rounded-bold"
                          width={16}
                          style={{ color: '#9ca3af' }}
                        />
                      )}
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditForm({
                            id: view.id,
                            name: view.name,
                            description: view.description || '',
                          });
                          setEditOpen(true);
                        }}
                      >
                        <Icon icon="solar:pen-bold" width={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(view.id);
                        }}
                      >
                        <Icon icon="solar:trash-bin-trash-bold" width={16} color="#ef4444" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Saved View</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="View Name"
            fullWidth
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
          />
          <TextField
            select
            label="View Type"
            fullWidth
            value={createForm.view_type}
            onChange={(e) => setCreateForm({ ...createForm, view_type: e.target.value })}
          >
            {Object.entries(VIEW_ICONS).map(([type]) => (
              <MenuItem key={type} value={type} sx={{ textTransform: 'capitalize' }}>
                {type}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Filters (JSON)"
            fullWidth
            multiline
            rows={2}
            value={createForm.filters}
            onChange={(e) => setCreateForm({ ...createForm, filters: e.target.value })}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={createForm.is_default}
                onChange={(e) => setCreateForm({ ...createForm, is_default: e.target.checked })}
              />
            }
            label="Set as default view"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit View</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="View Name"
            fullWidth
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete View</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this view? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ViewsList;
