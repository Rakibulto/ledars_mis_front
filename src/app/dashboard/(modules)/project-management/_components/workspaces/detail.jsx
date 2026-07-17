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
  List,
  Alert,
  Avatar,
  Button,
  Dialog,
  Tooltip,
  ListItem,
  TextField,
  Typography,
  IconButton,
  CardContent,
  DialogTitle,
  ListItemText,
  DialogContent,
  DialogActions,
  ListItemAvatar,
  CircularProgress,
  ListItemSecondaryAction,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  usePatchRequest as patchRequest,
  useDeleteRequest as deleteRequest,
  useCreateRequest as createRequest,
} from 'src/actions/ledars-hook';

const EP = endpoints.pm;

export function WorkspaceDetail({ id }) {
  const router = useRouter();
  const { data: ws, loading, error } = useGetRequest(EP.workspace_by_id(id));
  const { data: spaces } = useGetRequest(EP.spaces);
  const { data: members } = useGetRequest(EP.workspace_members);
  const { data: allEmployees } = useGetRequest(endpoints.employee?.employees || '/api/employees/');

  // Edit workspace state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Delete workspace state
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Add member state
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMemberForm, setAddMemberForm] = useState({});

  // Remove member state
  const [removeMemberId, setRemoveMemberId] = useState(null);

  // Loading states
  const [editingWs, setEditingWs] = useState(false);
  const [deletingWs, setDeletingWs] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [removingMember, setRemovingMember] = useState(false);

  // Handlers
  const handleOpenEdit = () => {
    setEditForm({
      name: ws.name || '',
      description: ws.description || '',
      color: ws.color || '#3b82f6',
    });
    setEditOpen(true);
  };

  const handleEditWs = async () => {
    try {
      setEditingWs(true);
      await patchRequest(EP.workspace_by_id(id), editForm);
      mutate(EP.workspace_by_id(id));
      mutate(EP.workspaces);
      toast.success('Workspace updated');
      setEditOpen(false);
    } catch {
      toast.error('Failed to update workspace');
    } finally {
      setEditingWs(false);
    }
  };

  const handleDeleteWs = async () => {
    try {
      setDeletingWs(true);
      await deleteRequest(EP.workspace_by_id(id));
      mutate(EP.workspaces);
      toast.success('Workspace deleted');
      setDeleteOpen(false);
      router.push('/dashboard/project-management');
    } catch {
      toast.error('Failed to delete workspace');
    } finally {
      setDeletingWs(false);
    }
  };

  const handleAddMember = async () => {
    try {
      setAddingMember(true);
      await createRequest(EP.workspace_add_member(id), addMemberForm);
      mutate(EP.workspace_by_id(id));
      mutate(EP.workspace_members);
      toast.success('Member added');
      setAddMemberOpen(false);
      setAddMemberForm({});
    } catch {
      toast.error('Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async () => {
    try {
      setRemovingMember(true);
      await createRequest(EP.workspace_remove_member(id), { member_id: removeMemberId });
      mutate(EP.workspace_by_id(id));
      mutate(EP.workspace_members);
      toast.success('Member removed');
      setRemoveMemberId(null);
    } catch {
      toast.error('Failed to remove member');
    } finally {
      setRemovingMember(false);
    }
  };

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  if (error || !ws || !ws.id) return <Alert severity="error">Workspace not found.</Alert>;

  const spList = Array.isArray(spaces) ? spaces : spaces?.results || [];
  const wsSpaces = spList.filter((s) => s.workspace === ws.id || s.workspace_id === ws.id);
  const totalTasks = wsSpaces.reduce((sum, sp) => sum + (sp.tasks_count || 0), 0);

  const memberList = Array.isArray(members) ? members : members?.results || [];
  const wsMembers = memberList.filter((m) => m.workspace === ws.id || m.workspace_id === ws.id);

  return (
    <Box>
      {/* Header with Edit/Delete */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: ws.color, fontSize: 24, fontWeight: 700 }}>
            {ws.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {ws.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {ws.description}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Edit Workspace">
            <IconButton onClick={handleOpenEdit} color="primary">
              <Icon icon="solar:pen-bold" width={22} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Workspace">
            <IconButton onClick={() => setDeleteOpen(true)} color="error">
              <Icon icon="solar:trash-bin-trash-bold" width={22} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="primary">
                {wsSpaces.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Spaces
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {totalTasks}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Tasks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700}>
                {ws.members_count || wsMembers.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Members
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Members Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Members
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Icon icon="solar:user-plus-bold" />}
          onClick={() => {
            setAddMemberForm({});
            setAddMemberOpen(true);
          }}
        >
          Add Member
        </Button>
      </Box>
      {wsMembers.length > 0 ? (
        <Card sx={{ mb: 3 }}>
          <List>
            {wsMembers.map((m) => (
              <ListItem key={m.id} divider>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: ws.color }}>
                    {(m.member_name || m.user_name || m.email || '?').charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={m.member_name || m.user_name || m.email || `Member #${m.id}`}
                  secondary={m.role || m.permission || ''}
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Remove Member">
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => setRemoveMemberId(m.member || m.user || m.id)}
                    >
                      <Icon icon="solar:user-minus-bold" width={20} />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Card>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          No members found for this workspace.
        </Alert>
      )}

      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Spaces
      </Typography>
      <Grid container spacing={3}>
        {wsSpaces.map((sp) => (
          <Grid key={sp.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{
                borderTop: `3px solid ${sp.color}`,
                '&:hover': { boxShadow: 4 },
                cursor: 'pointer',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Icon icon={sp.icon} width={24} style={{ color: sp.color }} />
                  <Typography variant="subtitle1" fontWeight={600}>
                    {sp.name}
                  </Typography>
                  {sp.is_private && (
                    <Icon icon="solar:lock-bold" width={16} style={{ color: '#9ca3af' }} />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {sp.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label={`${sp.lists_count} lists`} size="small" variant="outlined" />
                  <Chip label={`${sp.tasks_count} tasks`} size="small" variant="outlined" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Edit Workspace Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
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
            value={editForm.color || '#3b82f6'}
            onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditWs} disabled={editingWs}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Workspace Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Workspace?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{ws.name}&quot;? This action cannot be undone and
            will remove all associated spaces, lists, and tasks.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteWs} disabled={deletingWs}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onClose={() => setAddMemberOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Member to Workspace</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Member ID or Email"
            value={addMemberForm.member_id || ''}
            onChange={(e) => setAddMemberForm({ ...addMemberForm, member_id: e.target.value })}
            fullWidth
            placeholder="Enter member ID or email"
          />
          <TextField
            label="Role"
            value={addMemberForm.role || ''}
            onChange={(e) => setAddMemberForm({ ...addMemberForm, role: e.target.value })}
            fullWidth
            placeholder="e.g. admin, member, viewer"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMemberOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddMember} disabled={addingMember}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog open={!!removeMemberId} onClose={() => setRemoveMemberId(null)}>
        <DialogTitle>Remove Member?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to remove this member from the workspace?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveMemberId(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleRemoveMember}
            disabled={removingMember}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
