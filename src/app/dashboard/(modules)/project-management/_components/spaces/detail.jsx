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
  Table,
  Alert,
  Avatar,
  Button,
  Dialog,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  IconButton,
  CardContent,
  AvatarGroup,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  LinearProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  usePatchRequest as patchRequest,
  useDeleteRequest as deleteRequest,
  useCreateRequest as createRequest,
} from 'src/actions/ledars-hook';

const EP = endpoints.pm;

export function SpaceDetail({ id }) {
  // CRUD state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMemberForm, setAddMemberForm] = useState({ user: '', role: 'member' });
  const [removeMemberId, setRemoveMemberId] = useState(null);

  const router = useRouter();

  const { data: rawSpaces } = useGetRequest(EP.spaces);
  const { data: rawLists } = useGetRequest(EP.lists);
  const { data: rawTasks } = useGetRequest(EP.tasks);
  const { data: rawStatuses } = useGetRequest(EP.statuses);
  const { data: rawUsers } = useGetRequest('/api/employees/');
  const { data: rawMembers } = useGetRequest(EP.space_members);

  // Loading states
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [removingMember, setRemovingMember] = useState(false);

  const SPACES = Array.isArray(rawSpaces) ? rawSpaces : rawSpaces?.results || [];
  const LISTS = Array.isArray(rawLists) ? rawLists : rawLists?.results || [];
  const ALL_TASKS = Array.isArray(rawTasks) ? rawTasks : rawTasks?.results || [];
  const STATUSES = Array.isArray(rawStatuses) ? rawStatuses : rawStatuses?.results || [];
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];
  const MEMBERS = Array.isArray(rawMembers) ? rawMembers : rawMembers?.results || [];

  const getUserById = (uid) => USERS.find((u) => u.id === uid);
  const getStatusById = (sid) => STATUSES.find((s) => s.id === sid);

  // CRUD handlers
  const openEditDialog = () => {
    setEditForm({
      name: space?.name || '',
      description: space?.description || '',
      color: space?.color || '#6366f1',
    });
    setEditOpen(true);
  };
  const handleEdit = async () => {
    try {
      setEditing(true);
      await patchRequest(EP.space_by_id(id), editForm);
      mutate(EP.spaces);
      toast.success('Space updated');
      setEditOpen(false);
    } catch {
      toast.error('Update failed');
    } finally {
      setEditing(false);
    }
  };
  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteRequest(EP.space_by_id(id));
      mutate(EP.spaces);
      toast.success('Space deleted');
      setDeleteOpen(false);
      router.push(paths.dashboard.projectManagement.spaces.root);
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };
  const handleAddMember = async () => {
    try {
      setAddingMember(true);
      await createRequest(EP.space_add_member(id), addMemberForm);
      mutate(EP.space_members);
      toast.success('Member added');
      setAddMemberOpen(false);
      setAddMemberForm({ user: '', role: 'member' });
    } catch {
      toast.error('Add member failed');
    } finally {
      setAddingMember(false);
    }
  };
  const handleRemoveMember = async () => {
    try {
      setRemovingMember(true);
      await deleteRequest(EP.space_remove_member(removeMemberId));
      mutate(EP.space_members);
      toast.success('Member removed');
      setRemoveMemberId(null);
    } catch {
      toast.error('Remove member failed');
    } finally {
      setRemovingMember(false);
    }
  };

  const space = SPACES.find((s) => s.id === Number(id));
  if (!space) return <Alert severity="error">Space not found.</Alert>;

  const spaceMembers = MEMBERS.filter((m) => (m.space_id || m.space) === space.id);

  const lists = LISTS.filter((l) => (l.space_id || l.space) === space.id);
  const tasks = ALL_TASKS.filter((t) => lists.some((l) => l.id === (t.list_id || t.list)));
  const done = tasks.filter((t) => [4, 5].includes(t.status_id || t.status)).length;
  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${space.color}20`,
          }}
        >
          <Icon icon={space.icon} width={28} style={{ color: space.color }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h4" fontWeight={700}>
              {space.name}
            </Typography>
            {space.is_private && (
              <Chip
                icon={<Icon icon="solar:lock-bold" width={14} />}
                label="Private"
                size="small"
              />
            )}
          </Box>
          <Typography variant="body1" color="text.secondary">
            {space.description}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Icon icon="solar:pen-bold" />}
            onClick={openEditDialog}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Icon icon="solar:trash-bin-trash-bold" />}
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700}>
                {tasks.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tasks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {done}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700}>
                {lists.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Lists
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="primary">
                {pct}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lists */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Lists
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {lists.map((list) => {
          const listTasks = tasks.filter((t) => (t.list_id || t.list) === list.id);
          const listDone = listTasks.filter((t) => [4, 5].includes(t.status_id || t.status)).length;
          const listPct =
            listTasks.length > 0 ? Math.round((listDone / listTasks.length) * 100) : 0;
          return (
            <Grid key={list.id} size={{ xs: 12, sm: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {list.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={listPct}
                      sx={{
                        flex: 1,
                        height: 6,
                        borderRadius: 3,
                        bgcolor: '#f1f5f9',
                        '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: space.color },
                      }}
                    />
                    <Typography variant="caption">
                      {listDone}/{listTasks.length}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Recent Tasks */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Recent Tasks
      </Typography>
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Assignee(s)</TableCell>
                <TableCell>Due</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.slice(0, 10).map((t) => {
                const st = getStatusById(t.status_id || t.status);
                return (
                  <TableRow key={t.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {t.task_id}
                      </Typography>
                    </TableCell>
                    <TableCell>{t.title}</TableCell>
                    <TableCell>
                      <Chip
                        label={st?.name}
                        size="small"
                        sx={{ bgcolor: `${st?.color}20`, color: st?.color, fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{t.priority}</TableCell>
                    <TableCell>
                      <AvatarGroup max={3}>
                        {t.assignees.map((uid) => {
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
                    </TableCell>
                    <TableCell>{t.due_date}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Members */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 3,
          mb: 2,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Members
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<Icon icon="solar:add-circle-bold" />}
          onClick={() => setAddMemberOpen(true)}
        >
          Add Member
        </Button>
      </Box>
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell>Role</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {spaceMembers.map((m) => {
                const u = getUserById(m.user_id || m.user);
                return (
                  <TableRow key={m.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: '#3b82f6' }}>
                          {u?.name?.charAt(0)}
                        </Avatar>
                        <Typography variant="body2">
                          {u?.name || `User #${m.user_id || m.user}`}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={m.role || 'member'} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setRemoveMemberId(m.id)}
                      >
                        <Icon icon="solar:trash-bin-trash-bold" width={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {spaceMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No members yet
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
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
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={editing}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Space?</DialogTitle>
        <DialogContent>
          <Typography>This will permanently delete this space and all its data.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onClose={() => setAddMemberOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Member</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="User"
            select
            value={addMemberForm.user}
            onChange={(e) => setAddMemberForm({ ...addMemberForm, user: e.target.value })}
            fullWidth
          >
            {USERS.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Role"
            select
            value={addMemberForm.role}
            onChange={(e) => setAddMemberForm({ ...addMemberForm, role: e.target.value })}
            fullWidth
          >
            <MenuItem value="member">Member</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="viewer">Viewer</MenuItem>
          </TextField>
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
          <Typography>This member will be removed from the space.</Typography>
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
