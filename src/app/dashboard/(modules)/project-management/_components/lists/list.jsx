'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';

import {
  Box,
  Card,
  Chip,
  Grid,
  Dialog,
  Button,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  CardContent,
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

export function ListsList() {
  const { data: rawLists } = useGetRequest(EP.lists);
  const { data: rawTasks } = useGetRequest(EP.tasks);
  const { data: rawSpaces } = useGetRequest(EP.spaces);

  const LISTS = Array.isArray(rawLists) ? rawLists : rawLists?.results || [];
  const ALL_TASKS = Array.isArray(rawTasks) ? rawTasks : rawTasks?.results || [];
  const SPACES = Array.isArray(rawSpaces) ? rawSpaces : rawSpaces?.results || [];

  const getSpaceById = (id) => SPACES.find((s) => s.id === id);

  // CRUD state
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', space: '' });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteId, setDeleteId] = useState(null);

  // Mutation hooks
  const { trigger: doCreate, isMutating: creating } = useCreateMutation(EP.lists, createForm);
  const { trigger: doEdit, isMutating: editing } = usePatchMutation(
    editId ? EP.list_by_id(editId) : null,
    editForm
  );
  const { trigger: doDelete, isMutating: deleting } = useDeleteMutation(
    deleteId ? EP.list_by_id(deleteId) : null
  );

  // Handlers
  const handleCreate = async () => {
    try {
      await doCreate();
      mutate(EP.lists);
      toast.success('List created');
      setCreateOpen(false);
      setCreateForm({ name: '', space: '' });
    } catch {
      toast.error('Create failed');
    }
  };
  const openEdit = (item) => {
    setEditId(item.id);
    setEditForm({ name: item.name, space: item.space_id || item.space });
  };
  const handleEdit = async () => {
    try {
      await doEdit();
      mutate(EP.lists);
      toast.success('List updated');
      setEditId(null);
    } catch {
      toast.error('Update failed');
    }
  };
  const handleDelete = async () => {
    try {
      await doDelete();
      mutate(EP.lists);
      toast.success('List deleted');
      setDeleteId(null);
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          All Lists
        </Typography>
        <Button
          variant="contained"
          startIcon={<Icon icon="solar:add-circle-bold" />}
          onClick={() => setCreateOpen(true)}
        >
          New List
        </Button>
      </Box>
      <Grid container spacing={3}>
        {LISTS.map((list) => {
          const space = getSpaceById(list.space_id || list.space);
          const tasks = ALL_TASKS.filter((t) => (t.list_id || t.list) === list.id);
          const done = tasks.filter((t) => [4, 5].includes(t.status_id || t.status)).length;
          return (
            <Grid key={list.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  '&:hover': { boxShadow: 4 },
                  transition: 'box-shadow 0.2s',
                  cursor: 'pointer',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Icon
                      icon="solar:checklist-bold-duotone"
                      width={20}
                      style={{ color: space?.color || '#3b82f6' }}
                    />
                    <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
                      {list.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(list);
                      }}
                    >
                      <Icon icon="solar:pen-bold" width={18} />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(list.id);
                      }}
                    >
                      <Icon icon="solar:trash-bin-trash-bold" width={18} />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip
                      label={space?.name || 'Space'}
                      size="small"
                      variant="outlined"
                      sx={{ color: space?.color, borderColor: `${space?.color}40` }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {tasks.length} tasks &middot; {done} completed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New List</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Name"
            fullWidth
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
          />
          <TextField
            label="Space"
            select
            fullWidth
            value={createForm.space}
            onChange={(e) => setCreateForm((f) => ({ ...f, space: e.target.value }))}
          >
            {SPACES.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating || !createForm.name}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editId} onClose={() => setEditId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit List</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Name"
            fullWidth
            value={editForm.name || ''}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
          />
          <TextField
            label="Space"
            select
            fullWidth
            value={editForm.space || ''}
            onChange={(e) => setEditForm((f) => ({ ...f, space: e.target.value }))}
          >
            {SPACES.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditId(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={editing || !editForm.name}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete List</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this list? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
