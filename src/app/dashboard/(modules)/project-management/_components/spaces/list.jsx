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
  Avatar,
  Button,
  Dialog,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  CardContent,
  DialogTitle,
  ToggleButton,
  DialogContent,
  DialogActions,
  InputAdornment,
  ToggleButtonGroup,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  usePatchRequest as patchRequest,
  useCreateRequest as createRequest,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

const EP = endpoints.pm;

export function SpacesList() {
  const [search, setSearch] = useState('');
  const [wsFilter, setWsFilter] = useState('all');

  // CRUD state
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    workspace: '',
    color: '#6366f1',
  });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteId, setDeleteId] = useState(null);

  const { data: rawSpaces } = useGetRequest(EP.spaces);
  const { data: rawWorkspaces } = useGetRequest(EP.workspaces);
  const { data: rawLists } = useGetRequest(EP.lists);

  // Loading states
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const SPACES = Array.isArray(rawSpaces) ? rawSpaces : rawSpaces?.results || [];
  const WORKSPACES = Array.isArray(rawWorkspaces) ? rawWorkspaces : rawWorkspaces?.results || [];
  const LISTS = Array.isArray(rawLists) ? rawLists : rawLists?.results || [];

  // CRUD handlers
  const handleCreate = async () => {
    try {
      setCreating(true);
      await createRequest(EP.spaces, createForm);
      mutate(EP.spaces);
      toast.success('Space created');
      setCreateOpen(false);
      setCreateForm({ name: '', description: '', workspace: '', color: '#6366f1' });
    } catch {
      toast.error('Create failed');
    } finally {
      setCreating(false);
    }
  };
  const openEdit = (item) => {
    setEditId(item.id);
    setEditForm({
      name: item.name,
      description: item.description || '',
      color: item.color || '#6366f1',
    });
  };
  const handleEdit = async () => {
    try {
      setEditing(true);
      await patchRequest(EP.space_by_id(editId), editForm);
      mutate(EP.spaces);
      toast.success('Space updated');
      setEditId(null);
    } catch {
      toast.error('Update failed');
    } finally {
      setEditing(false);
    }
  };
  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteRequest(EP.space_by_id(deleteId));
      mutate(EP.spaces);
      toast.success('Space deleted');
      setDeleteId(null);
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = SPACES.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (wsFilter !== 'all' && (s.workspace_id || s.workspace) !== Number(wsFilter)) return false;
    return true;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Spaces
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Organize your projects into spaces
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="solar:add-circle-bold" />}
          onClick={() => setCreateOpen(true)}
        >
          New Space
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search spaces..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon icon="solar:magnifer-linear" />
              </InputAdornment>
            ),
          }}
        />
        <ToggleButtonGroup
          value={wsFilter}
          exclusive
          onChange={(_, v) => v && setWsFilter(v)}
          size="small"
        >
          <ToggleButton value="all">All</ToggleButton>
          {WORKSPACES.map((ws) => (
            <ToggleButton key={ws.id} value={String(ws.id)}>
              {ws.name}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={3}>
        {filtered.map((space) => {
          const lists = LISTS.filter((l) => (l.space_id || l.space) === space.id);
          return (
            <Grid key={space.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 6 },
                  transition: 'box-shadow 0.2s',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Avatar sx={{ bgcolor: `${space.color}20`, color: space.color }}>
                      <Icon icon={space.icon} width={24} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography fontWeight={700}>{space.name}</Typography>
                        {space.is_private && (
                          <Icon icon="solar:lock-bold" width={14} style={{ color: '#9ca3af' }} />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {
                          WORKSPACES.find((w) => w.id === (space.workspace_id || space.workspace))
                            ?.name
                        }
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(space);
                        }}
                      >
                        <Icon icon="solar:pen-bold" width={18} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(space.id);
                        }}
                      >
                        <Icon icon="solar:trash-bin-trash-bold" width={18} />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                    {space.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        {space.lists_count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Lists
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        {space.tasks_count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tasks
                      </Typography>
                    </Box>
                  </Box>
                  {lists.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {lists.slice(0, 3).map((l) => (
                        <Chip
                          key={l.id}
                          label={l.name}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: 11 }}
                        />
                      ))}
                      {lists.length > 3 && (
                        <Chip
                          label={`+${lists.length - 3} more`}
                          size="small"
                          sx={{ fontSize: 11 }}
                        />
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Space</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Name"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            fullWidth
          />
          <TextField
            label="Description"
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            fullWidth
            multiline
            rows={3}
          />
          <TextField
            label="Workspace"
            select
            value={createForm.workspace}
            onChange={(e) => setCreateForm({ ...createForm, workspace: e.target.value })}
            fullWidth
          >
            {WORKSPACES.map((ws) => (
              <MenuItem key={ws.id} value={ws.id}>
                {ws.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Color"
            type="color"
            value={createForm.color}
            onChange={(e) => setCreateForm({ ...createForm, color: e.target.value })}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editId} onClose={() => setEditId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Space</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Name"
            value={editForm.name || ''}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            fullWidth
          />
          <TextField
            label="Description"
            value={editForm.description || ''}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            fullWidth
            multiline
            rows={3}
          />
          <TextField
            label="Color"
            type="color"
            value={editForm.color || '#6366f1'}
            onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditId(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={editing}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Space?</DialogTitle>
        <DialogContent>
          <Typography>This will permanently delete this space and all its data.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
