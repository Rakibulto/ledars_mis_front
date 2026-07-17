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
  Alert,
  Avatar,
  Button,
  Dialog,
  TextField,
  Typography,
  AvatarGroup,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, usePatchMutation, useDeleteMutation } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

function WhiteboardDetail({ id }) {
  const router = useRouter();

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

  const wb = WHITEBOARDS.find((w) => w.id === Number(id));

  // --- Edit ---
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const { trigger: doEdit, isMutating: editing } = usePatchMutation(
    id ? EP.whiteboard_by_id(id) : null,
    editForm
  );
  const openEdit = () => {
    setEditForm({ name: wb?.name || '', description: wb?.description || '' });
    setEditOpen(true);
  };
  const handleEdit = async () => {
    try {
      await doEdit();
      mutate(EP.whiteboards);
      toast.success('Whiteboard updated');
      setEditOpen(false);
    } catch {
      toast.error('Update failed');
    }
  };

  // --- Delete ---
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { trigger: doDelete, isMutating: deleting } = useDeleteMutation(
    id ? EP.whiteboard_by_id(id) : null
  );
  const handleDelete = async () => {
    try {
      await doDelete();
      mutate(EP.whiteboards);
      toast.success('Whiteboard deleted');
      router.push(paths.dashboard.projectManagement.whiteboards.root);
    } catch {
      toast.error('Delete failed');
    }
  };

  if (!wb) return <Alert severity="error">Whiteboard not found.</Alert>;

  const space = getSpaceById(wb.space_id);
  const creator = getUserById(wb.created_by);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" fontWeight={700}>
            {wb.name}
          </Typography>
          <Chip
            label={space?.name}
            size="small"
            variant="outlined"
            sx={{ color: space?.color, borderColor: `${space?.color}40` }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <AvatarGroup max={5}>
            {(wb.collaborators || []).map((uid) => {
              const u = getUserById(uid);
              return (
                <Avatar key={uid} sx={{ width: 28, height: 28, fontSize: 12, bgcolor: '#3b82f6' }}>
                  {u?.name?.charAt(0)}
                </Avatar>
              );
            })}
          </AvatarGroup>
          <Button variant="outlined" size="small" startIcon={<Icon icon="solar:share-bold" />}>
            Share
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<Icon icon="solar:pen-bold" />}
            onClick={openEdit}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<Icon icon="solar:trash-bin-trash-bold" />}
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {/* Canvas area */}
      <Card
        sx={{
          minHeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#fafbfc',
          border: '2px dashed #e5e7eb',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Icon icon="solar:pallete-2-bold-duotone" width={64} style={{ color: '#cbd5e1' }} />
          <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
            Whiteboard Canvas
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
            {wb.elements_count} elements · Created by {creator?.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Chip
              icon={<Icon icon="solar:pen-bold" width={14} />}
              label="Draw"
              variant="outlined"
            />
            <Chip
              icon={<Icon icon="solar:sticker-smile-circle-bold" width={14} />}
              label="Sticky Note"
              variant="outlined"
            />
            <Chip
              icon={<Icon icon="solar:text-bold" width={14} />}
              label="Text"
              variant="outlined"
            />
            <Chip
              icon={<Icon icon="solar:gallery-minimalistic-bold" width={14} />}
              label="Image"
              variant="outlined"
            />
            <Chip
              icon={<Icon icon="solar:ruler-bold" width={14} />}
              label="Shape"
              variant="outlined"
            />
            <Chip
              icon={<Icon icon="solar:link-bold" width={14} />}
              label="Connector"
              variant="outlined"
            />
          </Box>
        </Box>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Last updated: {new Date(wb.updated_at).toLocaleString()}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<Icon icon="solar:download-minimalistic-bold" width={16} />}
          >
            Export
          </Button>
          <Button size="small" startIcon={<Icon icon="solar:printer-bold" width={16} />}>
            Print
          </Button>
        </Box>
      </Box>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
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
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={editing}>
            {editing ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Whiteboard</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this whiteboard? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default WhiteboardDetail;
