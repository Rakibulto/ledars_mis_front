'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';

import {
  Box,
  Card,
  Grid,
  Chip,
  Alert,
  Avatar,
  Button,
  Dialog,
  TextField,
  Typography,
  IconButton,
  CardContent,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  usePatchRequest as patchRequest,
  useCreateRequest as createRequest,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

const EP = endpoints.pm;

export function WorkspacesView() {
  const { data: workspaces, loading, error } = useGetRequest(EP.workspaces);
  const { data: spaces } = useGetRequest(EP.spaces);

  const wsList = Array.isArray(workspaces) ? workspaces : workspaces?.results || [];
  const spList = Array.isArray(spaces) ? spaces : spaces?.results || [];

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', color: '#6366f1' });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteId, setDeleteId] = useState(null);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleCreate = async () => {
    try {
      setCreating(true);
      await createRequest(EP.workspaces, createForm);
      mutate(EP.workspaces);
      toast.success('Workspace created');
      setCreateOpen(false);
      setCreateForm({ name: '', description: '', color: '#6366f1' });
    } catch {
      toast.error('Create failed');
    } finally {
      setCreating(false);
    }
  };
  const openEdit = (ws) => {
    setEditId(ws.id);
    setEditForm({ name: ws.name, description: ws.description || '', color: ws.color || '#6366f1' });
  };
  const handleEdit = async () => {
    try {
      setEditing(true);
      await patchRequest(EP.workspace_by_id(editId), editForm);
      mutate(EP.workspaces);
      toast.success('Workspace updated');
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
      await deleteRequest(EP.workspace_by_id(deleteId));
      mutate(EP.workspaces);
      toast.success('Workspace deleted');
      setDeleteId(null);
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load workspaces.
      </Alert>
    );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Workspaces
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your organization workspaces
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="solar:add-circle-bold" />}
          onClick={() => setCreateOpen(true)}
        >
          New Workspace
        </Button>
      </Box>
      <Grid container spacing={3}>
        {wsList.map((ws) => {
          const wsSpaces = spList.filter((s) => s.workspace === ws.id || s.workspace_id === ws.id);
          return (
            <Grid key={ws.id} size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: ws.color || '#6366f1',
                        width: 56,
                        height: 56,
                        fontSize: 24,
                        fontWeight: 700,
                      }}
                    >
                      {(ws.name || '').charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight={700}>
                        {ws.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {ws.description}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => openEdit(ws)}>
                        <Icon icon="solar:pen-bold" width={18} />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteId(ws.id)}>
                        <Icon icon="solar:trash-bin-trash-bold" width={18} />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        {ws.members_count || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Members
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        {ws.spaces_count || wsSpaces.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Spaces
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        {wsSpaces.reduce((s, sp) => s + (sp.tasks_count || 0), 0)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tasks
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Spaces
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {wsSpaces.map((sp) => (
                      <Chip
                        key={sp.id}
                        label={sp.name}
                        size="small"
                        sx={{
                          bgcolor: `${sp.color || '#6366f1'}15`,
                          color: sp.color || '#6366f1',
                          fontWeight: 600,
                        }}
                        component={Link}
                        href={paths.dashboard.projectManagement.spaces.root}
                        clickable
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Workspace</DialogTitle>
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
        <DialogTitle>Edit Workspace</DialogTitle>
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
        <DialogTitle>Delete Workspace?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete this workspace and all its data. This action cannot be
            undone.
          </Typography>
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
