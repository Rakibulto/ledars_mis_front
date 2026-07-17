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
  InputAdornment,
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

export function DocsList() {
  const [search, setSearch] = useState('');

  // CRUD dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title: '', content: '' });

  const { data: rawDocs } = useGetRequest(EP.docs);
  const { data: rawSpaces } = useGetRequest(EP.spaces);
  const { data: rawUsers } = useGetRequest('/api/employees/');

  const DOCS = Array.isArray(rawDocs) ? rawDocs : rawDocs?.results || [];
  const SPACES = Array.isArray(rawSpaces) ? rawSpaces : rawSpaces?.results || [];
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];

  const getUserById = (uid) => USERS.find((u) => u.id === uid);
  const getSpaceById = (sid) => SPACES.find((s) => s.id === sid);

  const filtered = DOCS.filter(
    (d) => !search || d.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.title) {
      toast.error('Title is required');
      return;
    }
    try {
      await createRequest(EP.docs, form);
      toast.success('Document created');
      mutate(EP.docs);
      setCreateOpen(false);
      setForm({ title: '', content: '' });
    } catch (err) {
      toast.error(err?.message || 'Failed to create document');
    }
  };

  const handleEdit = async () => {
    if (!form.title) {
      toast.error('Title is required');
      return;
    }
    try {
      await patchRequest(EP.doc_by_id(selected.id), form);
      toast.success('Document updated');
      mutate(EP.docs);
      setEditOpen(false);
      setSelected(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to update document');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRequest(EP.doc_by_id(selected.id));
      toast.success('Document deleted');
      mutate(EP.docs);
      setDeleteOpen(false);
      setSelected(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete document');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Docs & Wiki
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Knowledge base and documentation
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="solar:add-circle-bold" />}
          onClick={() => {
            setForm({ title: '', content: '' });
            setCreateOpen(true);
          }}
        >
          New Document
        </Button>
      </Box>

      <TextField
        size="small"
        placeholder="Search documents..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3, minWidth: 300 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Icon icon="solar:magnifer-linear" />
            </InputAdornment>
          ),
        }}
      />

      <Grid container spacing={3}>
        {filtered.map((doc) => {
          const creator = getUserById(doc.created_by);
          const space = getSpaceById(doc.space_id || doc.space);
          return (
            <Grid key={doc.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{ height: '100%', '&:hover': { boxShadow: 6 }, transition: 'box-shadow 0.2s' }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                    <Avatar
                      sx={{ bgcolor: '#3b82f620', color: '#3b82f6', width: 40, height: 40 }}
                      component={Link}
                      href={paths.dashboard.projectManagement.docs.detail(doc.id)}
                      style={{ textDecoration: 'none', cursor: 'pointer' }}
                    >
                      <Icon icon="solar:document-text-bold-duotone" width={22} />
                    </Avatar>
                    <Box
                      sx={{ flex: 1 }}
                      component={Link}
                      href={paths.dashboard.projectManagement.docs.detail(doc.id)}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <Typography fontWeight={700}>{doc.title}</Typography>
                      {space && (
                        <Chip
                          label={space.name}
                          size="small"
                          sx={{ height: 18, fontSize: 10, mt: 0.5 }}
                        />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelected(doc);
                          setForm({ title: doc.title, content: doc.content || '' });
                          setEditOpen(true);
                        }}
                      >
                        <Icon icon="solar:pen-bold" width={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelected(doc);
                          setDeleteOpen(true);
                        }}
                      >
                        <Icon icon="solar:trash-bin-trash-bold" width={16} />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box
                    component={Link}
                    href={paths.dashboard.projectManagement.docs.detail(doc.id)}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Avatar sx={{ width: 20, height: 20, fontSize: 9 }}>
                        {creator?.name?.charAt(0)}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary">
                        {creator?.name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        <Icon
                          icon="solar:documents-linear"
                          width={12}
                          style={{ verticalAlign: 'middle' }}
                        />{' '}
                        {doc.pages_count} pages
                      </Typography>
                    </Box>
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    Updated {new Date(doc.updated_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Document</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Content"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Document</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Content"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{selected?.title}&quot;? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
