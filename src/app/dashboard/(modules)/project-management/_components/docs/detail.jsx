'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';

import {
  Box,
  Card,
  Chip,
  Grid,
  Avatar,
  Button,
  Dialog,
  Divider,
  TextField,
  Typography,
  IconButton,
  CardContent,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, usePatchMutation, useDeleteMutation } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

export function DocDetail({ id }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  const { data: rawDocs } = useGetRequest(EP.docs);
  const { data: rawSpaces } = useGetRequest(EP.spaces);
  const { data: rawUsers } = useGetRequest('/api/employees/');

  const patchDoc = usePatchMutation(EP.doc_by_id(id), form);
  const deleteDoc = useDeleteMutation(EP.doc_by_id(id));

  const DOCS = Array.isArray(rawDocs) ? rawDocs : rawDocs?.results || [];
  const SPACES = Array.isArray(rawSpaces) ? rawSpaces : rawSpaces?.results || [];
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];

  const getUserById = (uid) => USERS.find((u) => u.id === uid);
  const getSpaceById = (sid) => SPACES.find((s) => s.id === sid);

  const doc = DOCS.find((d) => d.id === Number(id));
  if (!doc) return <Typography color="error">Document not found.</Typography>;

  const creator = getUserById(doc.created_by);
  const space = getSpaceById(doc.space_id || doc.space);

  const openEdit = () => {
    setForm({ title: doc.title, content: doc.content || '' });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!form.title) {
      toast.error('Title is required');
      return;
    }
    try {
      await patchDoc.trigger(form);
      toast.success('Document updated');
      mutate(EP.docs);
      setEditOpen(false);
    } catch (err) {
      toast.error(err?.message || 'Failed to update document');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc.trigger();
      toast.success('Document deleted');
      mutate(EP.docs);
      setDeleteOpen(false);
      router.push(paths.dashboard.projectManagement.docs.root);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete document');
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: 1,
                }}
              >
                <Typography variant="h4" fontWeight={700}>
                  {doc.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton onClick={openEdit}>
                    <Icon icon="solar:pen-bold" width={20} />
                  </IconButton>
                  <IconButton color="error" onClick={() => setDeleteOpen(true)}>
                    <Icon icon="solar:trash-bin-trash-bold" width={20} />
                  </IconButton>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Avatar sx={{ width: 24, height: 24, fontSize: 10 }}>
                  {creator?.name?.charAt(0)}
                </Avatar>
                <Typography variant="body2" color="text.secondary">
                  {creator?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  •
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Updated {new Date(doc.updated_at).toLocaleDateString()}
                </Typography>
                {space && (
                  <Chip label={space.name} size="small" sx={{ height: 20, fontSize: 10 }} />
                )}
              </Box>
              <Divider sx={{ mb: 3 }} />
              <Typography
                variant="body1"
                component="div"
                sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}
              >
                {doc.content || 'No content yet.'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                Document Info
              </Typography>
              {[
                ['Created', new Date(doc.created_at).toLocaleDateString()],
                ['Updated', new Date(doc.updated_at).toLocaleDateString()],
                ['Author', creator?.name],
                ['Pages', doc.pages_count],
                ['Space', space?.name],
              ].map(([label, value]) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
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
            rows={12}
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
            Are you sure you want to delete &quot;{doc.title}&quot;? This action cannot be undone.
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
