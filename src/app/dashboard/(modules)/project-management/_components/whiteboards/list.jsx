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
  TextField,
  Typography,
  IconButton,
  CardContent,
  AvatarGroup,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  usePatchMutation,
  useCreateMutation,
  useDeleteMutation,
} from 'src/actions/ledars-hook';

const EP = endpoints.pm;

function WhiteboardsList() {
  const { data: rawWhiteboards } = useGetRequest(EP.whiteboards);
  const WHITEBOARDS = Array.isArray(rawWhiteboards)
    ? rawWhiteboards
    : rawWhiteboards?.results || [];
  const { data: rawSpaces } = useGetRequest(EP.spaces);
  const SPACES = Array.isArray(rawSpaces) ? rawSpaces : rawSpaces?.results || [];
  const { data: rawUsers } = useGetRequest('/api/employees/');
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];

  const getSpaceById = (sid) => SPACES.find((s) => s.id === sid);
  const getUserById = (uid) => USERS.find((u) => u.id === uid);

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // --- Create ---
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const { trigger: doCreate, isMutating: creating } = useCreateMutation(EP.whiteboards, createForm);
  const handleCreate = async () => {
    try {
      await doCreate();
      mutate(EP.whiteboards);
      toast.success('Whiteboard created');
      setCreateOpen(false);
      setCreateForm({ name: '', description: '' });
    } catch {
      toast.error('Create failed');
    }
  };

  // --- Edit ---
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const { trigger: doEdit, isMutating: editing } = usePatchMutation(
    editId ? EP.whiteboard_by_id(editId) : null,
    editForm
  );
  const openEdit = (item) => {
    setEditId(item.id);
    setEditForm({ name: item.name, description: item.description || '' });
  };
  const handleEdit = async () => {
    try {
      await doEdit();
      mutate(EP.whiteboards);
      toast.success('Whiteboard updated');
      setEditId(null);
    } catch {
      toast.error('Update failed');
    }
  };

  // --- Delete ---
  const [deleteId, setDeleteId] = useState(null);
  const { trigger: doDelete, isMutating: deleting } = useDeleteMutation(
    deleteId ? EP.whiteboard_by_id(deleteId) : null
  );
  const handleDelete = async () => {
    try {
      await doDelete();
      mutate(EP.whiteboards);
      toast.success('Whiteboard deleted');
      setDeleteId(null);
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Whiteboards
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Collaborative visual canvases for brainstorming and planning
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="solar:add-circle-bold" />}
          onClick={() => setCreateOpen(true)}
        >
          New Whiteboard
        </Button>
      </Box>

      <Grid container spacing={3}>
        {WHITEBOARDS.map((wb) => {
          const space = getSpaceById(wb.space_id);
          const creator = getUserById(wb.created_by);
          return (
            <Grid key={wb.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 6 },
                  transition: 'box-shadow 0.2s',
                }}
              >
                {/* Whiteboard preview placeholder */}
                <Box
                  sx={{
                    height: 140,
                    bgcolor: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  <Icon
                    icon="solar:pallete-2-bold-duotone"
                    width={48}
                    style={{ color: '#cbd5e1' }}
                  />
                </Box>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={600}>
                      {wb.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => openEdit(wb)}>
                        <Icon icon="solar:pen-bold" width={16} />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteId(wb.id)}>
                        <Icon icon="solar:trash-bin-trash-bold" width={16} />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, mb: 1.5 }}>
                    <Chip
                      label={space?.name}
                      size="small"
                      variant="outlined"
                      sx={{
                        color: space?.color,
                        borderColor: `${space?.color}40`,
                        fontSize: '0.65rem',
                        height: 22,
                      }}
                    />
                    <Chip
                      label={`${wb.elements_count} elements`}
                      size="small"
                      sx={{ fontSize: '0.65rem', height: 22 }}
                    />
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <AvatarGroup max={4}>
                      {(wb.collaborators || []).map((uid) => {
                        const u = getUserById(uid);
                        return (
                          <Avatar
                            key={uid}
                            sx={{ width: 24, height: 24, fontSize: 10, bgcolor: '#3b82f6' }}
                          >
                            {u?.name?.charAt(0)}
                          </Avatar>
                        );
                      })}
                    </AvatarGroup>
                    <Typography variant="caption" color="text.secondary">
                      Updated {fmtDate(wb.updated_at)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Whiteboard</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}
        >
          <TextField
            label="Name"
            fullWidth
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!createForm.name || creating}
          >
            {creating ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editId} onClose={() => setEditId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Whiteboard</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}
        >
          <TextField
            label="Name"
            fullWidth
            value={editForm.name || ''}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={editForm.description || ''}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditId(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={editing}>
            {editing ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Whiteboard</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this whiteboard? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default WhiteboardsList;
