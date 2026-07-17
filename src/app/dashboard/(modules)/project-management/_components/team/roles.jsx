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
  Button,
  Switch,
  Dialog,
  TableRow,
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
  CircularProgress,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

const PERMISSION_FIELDS = [
  { key: 'can_create_tasks', label: 'Create Tasks' },
  { key: 'can_edit_tasks', label: 'Edit Tasks' },
  { key: 'can_delete_tasks', label: 'Delete Tasks' },
  { key: 'can_manage_members', label: 'Manage Members' },
  { key: 'can_manage_spaces', label: 'Manage Spaces' },
  { key: 'can_view_reports', label: 'View Reports' },
  { key: 'can_manage_automations', label: 'Manage Automations' },
  { key: 'can_manage_settings', label: 'Admin Settings' },
  { key: 'can_manage_goals', label: 'Manage Goals' },
  { key: 'can_manage_docs', label: 'Manage Docs' },
  { key: 'can_track_time', label: 'Track Time' },
  { key: 'can_manage_sprints', label: 'Manage Sprints' },
  { key: 'can_manage_custom_fields', label: 'Custom Fields' },
  { key: 'can_export_data', label: 'Export Data' },
];

const ROLE_COLORS = [
  '#8b5cf6',
  '#3b82f6',
  '#f59e0b',
  '#22c55e',
  '#9ca3af',
  '#ef4444',
  '#ec4899',
  '#06b6d4',
];

export function TeamRoles() {
  const { data: rawRoles, loading, error } = useGetRequest(EP.pm_roles);
  const { data: rawUserRoles } = useGetRequest(EP.pm_user_roles);
  const ROLES = Array.isArray(rawRoles) ? rawRoles : rawRoles?.results || [];
  const USER_ROLES = Array.isArray(rawUserRoles) ? rawUserRoles : rawUserRoles?.results || [];

  // Create state
  const [createOpen, setCreateOpen] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [newPerms, setNewPerms] = useState(
    PERMISSION_FIELDS.reduce((a, p) => ({ ...a, [p.key]: false }), {})
  );
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editRole, setEditRole] = useState({ id: null, name: '', description: '' });
  const [editPerms, setEditPerms] = useState(
    PERMISSION_FIELDS.reduce((a, p) => ({ ...a, [p.key]: false }), {})
  );
  const [editing, setEditing] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const getMemberCount = (roleId) => USER_ROLES.filter((ur) => ur.role === roleId).length;

  const handleCreateRole = async () => {
    if (!newRole.name) {
      toast.error('Role name is required');
      return;
    }
    setSaving(true);
    try {
      await axiosInstance.post(EP.pm_roles, { ...newRole, ...newPerms, is_active: true });
      toast.success(`Role "${newRole.name}" created!`);
      setCreateOpen(false);
      setNewRole({ name: '', description: '' });
      setNewPerms(PERMISSION_FIELDS.reduce((a, p) => ({ ...a, [p.key]: false }), {}));
      mutate(EP.pm_roles);
    } catch (err) {
      toast.error(err?.message || 'Failed to create role');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (role) => {
    setEditRole({ id: role.id, name: role.name, description: role.description || '' });
    setEditPerms(PERMISSION_FIELDS.reduce((a, p) => ({ ...a, [p.key]: !!role[p.key] }), {}));
    setEditOpen(true);
  };

  const handleEditRole = async () => {
    if (!editRole.name) {
      toast.error('Role name is required');
      return;
    }
    setEditing(true);
    try {
      await axiosInstance.patch(EP.pm_role_by_id(editRole.id), {
        name: editRole.name,
        description: editRole.description,
        ...editPerms,
      });
      toast.success(`Role "${editRole.name}" updated!`);
      setEditOpen(false);
      mutate(EP.pm_roles);
    } catch (err) {
      toast.error(err?.message || 'Failed to update role');
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(EP.pm_role_by_id(deleteTarget.id));
      toast.success(`Role "${deleteTarget.name}" deleted`);
      setDeleteOpen(false);
      setDeleteTarget(null);
      mutate(EP.pm_roles);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete role');
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
  if (error) return <Alert severity="error">Failed to load roles.</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Roles & Permissions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage access levels for your workspace
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="solar:shield-plus-bold" />}
          onClick={() => setCreateOpen(true)}
        >
          Create Role
        </Button>
      </Box>

      {/* Role Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {ROLES.map((role, idx) => {
          const color = ROLE_COLORS[idx % ROLE_COLORS.length];
          const memberCount = getMemberCount(role.id);
          const enabledPerms = PERMISSION_FIELDS.filter((p) => role[p.key]);
          return (
            <Grid key={role.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ borderTop: `3px solid ${color}` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" fontWeight={600}>
                      {role.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Chip
                        label={`${memberCount} member${memberCount !== 1 ? 's' : ''}`}
                        size="small"
                      />
                      <IconButton size="small" title="Edit" onClick={() => openEdit(role)}>
                        <Icon icon="solar:pen-bold" width={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        title="Delete"
                        color="error"
                        onClick={() => {
                          setDeleteTarget(role);
                          setDeleteOpen(true);
                        }}
                      >
                        <Icon icon="solar:trash-bin-trash-bold" width={16} />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {role.description}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {enabledPerms.map((perm) => (
                      <Chip
                        key={perm.key}
                        label={perm.label}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 24 }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Permission Matrix */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Permission Matrix
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Permission</TableCell>
                  {ROLES.map((r) => (
                    <TableCell key={r.id} align="center">
                      {r.name}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {PERMISSION_FIELDS.map((perm) => (
                  <TableRow key={perm.key}>
                    <TableCell>{perm.label}</TableCell>
                    {ROLES.map((r) => (
                      <TableCell key={r.id} align="center">
                        <Switch checked={!!r[perm.key]} size="small" disabled />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create Role Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Custom Role</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Role Name"
            fullWidth
            value={newRole.name}
            onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={newRole.description}
            onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
          />
          <Typography variant="subtitle2" sx={{ mt: 1 }}>
            Permissions
          </Typography>
          {PERMISSION_FIELDS.map((p) => (
            <Box
              key={p.key}
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Typography variant="body2">{p.label}</Typography>
              <Switch
                checked={newPerms[p.key]}
                onChange={(e) => setNewPerms({ ...newPerms, [p.key]: e.target.checked })}
              />
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateRole} disabled={saving}>
            {saving ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Role — {editRole.name}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Role Name"
            fullWidth
            value={editRole.name}
            onChange={(e) => setEditRole({ ...editRole, name: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={editRole.description}
            onChange={(e) => setEditRole({ ...editRole, description: e.target.value })}
          />
          <Typography variant="subtitle2" sx={{ mt: 1 }}>
            Permissions
          </Typography>
          {PERMISSION_FIELDS.map((p) => (
            <Box
              key={p.key}
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Typography variant="body2">{p.label}</Typography>
              <Switch
                checked={editPerms[p.key]}
                onChange={(e) => setEditPerms({ ...editPerms, [p.key]: e.target.checked })}
              />
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditRole} disabled={editing}>
            {editing ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Role Confirmation */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Role</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the role <strong>{deleteTarget?.name}</strong>?
            {getMemberCount(deleteTarget?.id) > 0 &&
              ` ${getMemberCount(deleteTarget?.id)} member(s) currently have this role.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteRole} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
