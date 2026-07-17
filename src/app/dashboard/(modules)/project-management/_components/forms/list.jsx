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
  Switch,
  Dialog,
  TextField,
  Typography,
  IconButton,
  CardContent,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  usePatchMutation,
  useCreateMutation,
  useDeleteMutation,
} from 'src/actions/ledars-hook';

const EP = endpoints.pm;

function FormsList() {
  const [search, setSearch] = useState('');

  const { data: rawForms } = useGetRequest(EP.forms);
  const FORMS = Array.isArray(rawForms) ? rawForms : rawForms?.results || [];
  const { data: rawSpaces } = useGetRequest(EP.spaces);
  const SPACES = Array.isArray(rawSpaces) ? rawSpaces : rawSpaces?.results || [];

  const getSpaceById = (sid) => SPACES.find((s) => s.id === sid);

  const filtered = FORMS.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  // --- Create ---
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const { trigger: doCreate, isMutating: creating } = useCreateMutation(EP.forms, createForm);
  const handleCreate = async () => {
    try {
      await doCreate();
      mutate(EP.forms);
      toast.success('Form created');
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
    editId ? EP.form_by_id(editId) : null,
    editForm
  );
  const openEdit = (item) => {
    setEditId(item.id);
    setEditForm({ name: item.name, description: item.description || '' });
  };
  const handleEdit = async () => {
    try {
      await doEdit();
      mutate(EP.forms);
      toast.success('Form updated');
      setEditId(null);
    } catch {
      toast.error('Update failed');
    }
  };

  // --- Delete ---
  const [deleteId, setDeleteId] = useState(null);
  const { trigger: doDelete, isMutating: deleting } = useDeleteMutation(
    deleteId ? EP.form_by_id(deleteId) : null
  );
  const handleDelete = async () => {
    try {
      await doDelete();
      mutate(EP.forms);
      toast.success('Form deleted');
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
            Forms
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create forms to collect data and auto-create tasks
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="solar:add-circle-bold" />}
          onClick={() => setCreateOpen(true)}
        >
          Create Form
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            size="small"
            fullWidth
            placeholder="Search forms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Icon icon="solar:magnifer-linear" />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {filtered.map((form) => {
          const space = getSpaceById(form.space_id);
          return (
            <Grid key={form.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 4 },
                  transition: 'box-shadow 0.2s',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        sx={{ bgcolor: '#6366f120', color: '#6366f1', width: 40, height: 40 }}
                      >
                        <Icon icon="solar:document-add-bold-duotone" width={22} />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {form.name}
                        </Typography>
                        <Chip
                          label={space?.name}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                      </Box>
                    </Box>
                    <Switch checked={form.is_active} size="small" />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" fontWeight={700}>
                        {form.submissions}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Submissions
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" fontWeight={700}>
                        {form.fields.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Fields
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {form.fields.slice(0, 4).map((f) => (
                      <Chip
                        key={f}
                        label={f}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: 22 }}
                      />
                    ))}
                    {form.fields.length > 4 && (
                      <Chip
                        label={`+${form.fields.length - 4}`}
                        size="small"
                        sx={{ fontSize: '0.65rem', height: 22 }}
                      />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 0.5 }}>
                    <IconButton size="small">
                      <Icon icon="solar:copy-bold" width={16} />
                    </IconButton>
                    <IconButton size="small">
                      <Icon icon="solar:share-bold" width={16} />
                    </IconButton>
                    <IconButton size="small" onClick={() => openEdit(form)}>
                      <Icon icon="solar:pen-bold" width={16} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteId(form.id)}>
                      <Icon icon="solar:trash-bin-trash-bold" width={16} />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Form</DialogTitle>
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
        <DialogTitle>Edit Form</DialogTitle>
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
        <DialogTitle>Delete Form</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this form? This action cannot be undone.
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

export default FormsList;
