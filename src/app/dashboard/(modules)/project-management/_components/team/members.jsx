'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';

import {
  Box,
  Card,
  Chip,
  Table,
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
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  InputAdornment,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

const ROLE_COLORS = {
  Owner: '#8b5cf6',
  Admin: '#3b82f6',
  Manager: '#f59e0b',
  Member: '#22c55e',
  Guest: '#9ca3af',
};

export function TeamMembers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ user: '', role: '' });
  const [inviting, setInviting] = useState(false);

  // Change role state
  const [roleOpen, setRoleOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState(null);
  const [newRoleId, setNewRoleId] = useState('');
  const [changingRole, setChangingRole] = useState(false);

  // Remove member state
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  const { data: rawMembers } = useGetRequest(EP.workspace_members);
  const { data: rawUsers } = useGetRequest('/api/employees/');
  const { data: rawRoles } = useGetRequest(EP.pm_roles);
  const { data: rawUserRoles } = useGetRequest(EP.pm_user_roles);
  const { data: rawWorkspaces } = useGetRequest(EP.workspaces);
  const { data: rawTasks } = useGetRequest(EP.tasks);
  const { data: rawTimeEntries } = useGetRequest(EP.time_entries);

  const MEMBERS = Array.isArray(rawMembers) ? rawMembers : rawMembers?.results || [];
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];
  const ROLES = Array.isArray(rawRoles) ? rawRoles : rawRoles?.results || [];
  const USER_ROLES = Array.isArray(rawUserRoles) ? rawUserRoles : rawUserRoles?.results || [];
  const WORKSPACES = Array.isArray(rawWorkspaces) ? rawWorkspaces : rawWorkspaces?.results || [];
  const ALL_TASKS = Array.isArray(rawTasks) ? rawTasks : rawTasks?.results || [];
  const TIME_ENTRIES = Array.isArray(rawTimeEntries)
    ? rawTimeEntries
    : rawTimeEntries?.results || [];
  const workspace = WORKSPACES[0];

  const getMemberRole = (userId) => {
    const ur = USER_ROLES.find((r) => r.user === userId);
    if (ur) {
      const role = ROLES.find((r) => r.id === ur.role);
      return role?.name || 'Member';
    }
    return 'Member';
  };

  const getUserRoleAssignment = (userId) => USER_ROLES.find((r) => r.user === userId);

  const filtered = USERS.filter((u) => {
    const matchSearch =
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase());
    const roleName = getMemberRole(u.id);
    const matchRole = roleFilter === 'all' || roleName === roleFilter;
    return matchSearch && matchRole;
  });

  const getUserStats = (uid) => {
    const tasks = ALL_TASKS.filter((t) => (t.assignees || []).includes(uid));
    const done = tasks.filter((t) => [4, 5].includes(t.status_id || t.status)).length;
    const hours = TIME_ENTRIES.filter((e) => (e.user_id || e.user) === uid).reduce(
      (s, e) => s + (e.duration || 0),
      0
    );
    return { tasks: tasks.length, done, hours };
  };

  const refreshAll = () => {
    mutate(EP.workspace_members);
    mutate(EP.pm_user_roles);
    mutate('/api/employees/');
  };

  const handleAddMember = async () => {
    if (!inviteForm.user || !workspace) {
      toast.error('Select a user');
      return;
    }
    setInviting(true);
    try {
      await axiosInstance.post(EP.workspace_add_member(workspace.id), { user: inviteForm.user });
      if (inviteForm.role) {
        await axiosInstance.post(EP.pm_user_roles, {
          user: inviteForm.user,
          role: inviteForm.role,
        });
      }
      toast.success('Member added successfully');
      setInviteOpen(false);
      setInviteForm({ user: '', role: '' });
      refreshAll();
    } catch (err) {
      toast.error(err?.message || 'Failed to add member');
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async () => {
    if (!roleTarget || !newRoleId) {
      toast.error('Select a role');
      return;
    }
    setChangingRole(true);
    try {
      const existing = getUserRoleAssignment(roleTarget.id);
      if (existing) {
        await axiosInstance.patch(EP.pm_user_role_by_id(existing.id), { role: newRoleId });
      } else {
        await axiosInstance.post(EP.pm_user_roles, { user: roleTarget.id, role: newRoleId });
      }
      toast.success(`Role updated for ${roleTarget.name}`);
      setRoleOpen(false);
      setRoleTarget(null);
      setNewRoleId('');
      refreshAll();
    } catch (err) {
      toast.error(err?.message || 'Failed to change role');
    } finally {
      setChangingRole(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeTarget || !workspace) return;
    setRemoving(true);
    try {
      await axiosInstance.post(EP.workspace_remove_member(workspace.id), { user: removeTarget.id });
      toast.success(`${removeTarget.name} removed from workspace`);
      setRemoveOpen(false);
      setRemoveTarget(null);
      refreshAll();
    } catch (err) {
      toast.error(err?.message || 'Failed to remove member');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Team Members
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {USERS.length} members
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="solar:user-plus-bold" />}
          onClick={() => setInviteOpen(true)}
        >
          Add Member
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Icon icon="solar:magnifer-linear" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            size="small"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            sx={{ width: 150 }}
          >
            <MenuItem value="all">All Roles</MenuItem>
            {ROLES.map((r) => (
              <MenuItem key={r.id} value={r.name}>
                {r.name}
              </MenuItem>
            ))}
          </TextField>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell>Role</TableCell>
                <TableCell align="center">Tasks</TableCell>
                <TableCell align="center">Completed</TableCell>
                <TableCell align="center">Hours</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((u) => {
                const stats = getUserStats(u.id);
                const roleName = getMemberRole(u.id);
                return (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: '#3b82f6', fontSize: 14 }}>
                          {(u.name || '')
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {u.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {u.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={roleName}
                        size="small"
                        sx={{
                          bgcolor: `${ROLE_COLORS[roleName] || '#9ca3af'}20`,
                          color: ROLE_COLORS[roleName] || '#9ca3af',
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">{stats.tasks}</TableCell>
                    <TableCell align="center">{stats.done}</TableCell>
                    <TableCell align="center">{stats.hours}h</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        title="Change Role"
                        onClick={() => {
                          setRoleTarget(u);
                          setNewRoleId(getUserRoleAssignment(u.id)?.role || '');
                          setRoleOpen(true);
                        }}
                      >
                        <Icon icon="solar:pen-bold" width={18} />
                      </IconButton>
                      <IconButton
                        size="small"
                        title="Remove Member"
                        color="error"
                        onClick={() => {
                          setRemoveTarget(u);
                          setRemoveOpen(true);
                        }}
                      >
                        <Icon icon="solar:trash-bin-trash-bold" width={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Member to Workspace</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            select
            label="Select User"
            value={inviteForm.user}
            fullWidth
            onChange={(e) => setInviteForm({ ...inviteForm, user: e.target.value })}
          >
            {USERS.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.name} ({u.email})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Assign Role"
            value={inviteForm.role}
            fullWidth
            onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
          >
            <MenuItem value="">No role</MenuItem>
            {ROLES.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {r.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddMember} disabled={inviting}>
            {inviting ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleOpen} onClose={() => setRoleOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Role — {roleTarget?.name}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            select
            label="Role"
            value={newRoleId}
            fullWidth
            onChange={(e) => setNewRoleId(e.target.value)}
          >
            {ROLES.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {r.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleChangeRole} disabled={changingRole}>
            {changingRole ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Member Confirmation */}
      <Dialog open={removeOpen} onClose={() => setRemoveOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove Member</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove <strong>{removeTarget?.name}</strong> from this
            workspace? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRemoveMember}
            disabled={removing}
          >
            {removing ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
