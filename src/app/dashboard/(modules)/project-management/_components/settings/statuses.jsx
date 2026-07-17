'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';

import {
  Box,
  Card,
  Chip,
  Button,
  Dialog,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  CardContent,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

const COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#6b7280',
  '#06b6d4',
];

export function SettingsStatuses() {
  const { data: rawStatuses } = useGetRequest(EP.statuses);
  const { data: rawGroups } = useGetRequest(EP.status_groups);
  const API_STATUSES = Array.isArray(rawStatuses) ? rawStatuses : rawStatuses?.results || [];
  const STATUS_GROUPS = Array.isArray(rawGroups) ? rawGroups : rawGroups?.results || [];

  // --- Status Group CRUD ---
  const [groupCreateOpen, setGroupCreateOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '' });
  const [groupSaving, setGroupSaving] = useState(false);

  const [groupEditOpen, setGroupEditOpen] = useState(false);
  const [editGroup, setEditGroup] = useState({ id: null, name: '' });
  const [groupEditing, setGroupEditing] = useState(false);

  const [groupDeleteOpen, setGroupDeleteOpen] = useState(false);
  const [groupDeleteTarget, setGroupDeleteTarget] = useState(null);
  const [groupDeleting, setGroupDeleting] = useState(false);

  // --- Status CRUD ---
  const [createOpen, setCreateOpen] = useState(false);
  const [newStatus, setNewStatus] = useState({
    name: '',
    color: '#3b82f6',
    status_group: '',
    order: 0,
  });
  const [statusSaving, setStatusSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editStatus, setEditStatus] = useState({ id: null, name: '', color: '#3b82f6', order: 0 });
  const [statusEditing, setStatusEditing] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusDeleting, setStatusDeleting] = useState(false);

  const refreshAll = () => {
    mutate(EP.statuses);
    mutate(EP.status_groups);
  };

  // --- Status Group handlers ---
  const handleCreateGroup = async () => {
    if (!newGroup.name) {
      toast.error('Group name is required');
      return;
    }
    setGroupSaving(true);
    try {
      await axiosInstance.post(EP.status_groups, newGroup);
      toast.success(`Status group "${newGroup.name}" created`);
      setGroupCreateOpen(false);
      setNewGroup({ name: '' });
      refreshAll();
    } catch (err) {
      toast.error(err?.message || 'Failed to create status group');
    } finally {
      setGroupSaving(false);
    }
  };

  const handleEditGroup = async () => {
    if (!editGroup.name) {
      toast.error('Group name is required');
      return;
    }
    setGroupEditing(true);
    try {
      await axiosInstance.patch(EP.status_group_by_id(editGroup.id), { name: editGroup.name });
      toast.success(`Status group "${editGroup.name}" updated`);
      setGroupEditOpen(false);
      refreshAll();
    } catch (err) {
      toast.error(err?.message || 'Failed to update status group');
    } finally {
      setGroupEditing(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupDeleteTarget) return;
    setGroupDeleting(true);
    try {
      await axiosInstance.delete(EP.status_group_by_id(groupDeleteTarget.id));
      toast.success(`Status group "${groupDeleteTarget.name}" deleted`);
      setGroupDeleteOpen(false);
      setGroupDeleteTarget(null);
      refreshAll();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete status group');
    } finally {
      setGroupDeleting(false);
    }
  };

  // --- Status handlers ---
  const handleCreateStatus = async () => {
    if (!newStatus.name) {
      toast.error('Status name is required');
      return;
    }
    setStatusSaving(true);
    try {
      await axiosInstance.post(EP.statuses, newStatus);
      toast.success(`Status "${newStatus.name}" created`);
      setCreateOpen(false);
      setNewStatus({ name: '', color: '#3b82f6', status_group: '', order: 0 });
      refreshAll();
    } catch (err) {
      toast.error(err?.message || 'Failed to create status');
    } finally {
      setStatusSaving(false);
    }
  };

  const handleEditStatus = async () => {
    if (!editStatus.name) {
      toast.error('Status name is required');
      return;
    }
    setStatusEditing(true);
    try {
      await axiosInstance.patch(EP.status_by_id(editStatus.id), {
        name: editStatus.name,
        color: editStatus.color,
        order: editStatus.order,
      });
      toast.success(`Status "${editStatus.name}" updated`);
      setEditOpen(false);
      refreshAll();
    } catch (err) {
      toast.error(err?.message || 'Failed to update status');
    } finally {
      setStatusEditing(false);
    }
  };

  const handleDeleteStatus = async () => {
    if (!deleteTarget) return;
    setStatusDeleting(true);
    try {
      await axiosInstance.delete(EP.status_by_id(deleteTarget.id));
      toast.success(`Status "${deleteTarget.name}" deleted`);
      setDeleteOpen(false);
      setDeleteTarget(null);
      refreshAll();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete status');
    } finally {
      setStatusDeleting(false);
    }
  };

  const getGroupName = (groupId) => {
    const g = STATUS_GROUPS.find((sg) => sg.id === groupId);
    return g?.name || 'Ungrouped';
  };

  // Group statuses by status_group
  const grouped = STATUS_GROUPS.map((g) => ({
    ...g,
    statuses: API_STATUSES.filter((s) => s.status_group === g.id),
  }));
  const ungrouped = API_STATUSES.filter((s) => !STATUS_GROUPS.some((g) => g.id === s.status_group));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Status Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure task workflow statuses
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Icon icon="solar:folder-with-files-bold" />}
            onClick={() => setGroupCreateOpen(true)}
          >
            Add Group
          </Button>
          <Button
            variant="contained"
            startIcon={<Icon icon="solar:add-circle-bold" />}
            onClick={() => setCreateOpen(true)}
          >
            Add Status
          </Button>
        </Box>
      </Box>

      {/* Status Groups */}
      {grouped.map((group) => (
        <Card key={group.id} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                {group.name}
              </Typography>
              <Chip label={group.statuses.length} size="small" />
              <Box sx={{ ml: 'auto' }}>
                <IconButton
                  size="small"
                  title="Edit Group"
                  onClick={() => {
                    setEditGroup({ id: group.id, name: group.name });
                    setGroupEditOpen(true);
                  }}
                >
                  <Icon icon="solar:pen-bold" width={16} />
                </IconButton>
                <IconButton
                  size="small"
                  title="Delete Group"
                  color="error"
                  onClick={() => {
                    setGroupDeleteTarget(group);
                    setGroupDeleteOpen(true);
                  }}
                >
                  <Icon icon="solar:trash-bin-trash-bold" width={16} />
                </IconButton>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {group.statuses.map((s) => (
                <Chip
                  key={s.id}
                  label={s.name}
                  onDelete={() => {
                    setDeleteTarget(s);
                    setDeleteOpen(true);
                  }}
                  onClick={() => {
                    setEditStatus({
                      id: s.id,
                      name: s.name,
                      color: s.color || '#3b82f6',
                      order: s.order || 0,
                    });
                    setEditOpen(true);
                  }}
                  sx={{
                    bgcolor: `${s.color || '#3b82f6'}20`,
                    color: s.color || '#3b82f6',
                    fontWeight: 600,
                    cursor: 'pointer',
                    '& .MuiChip-deleteIcon': { color: `${s.color || '#3b82f6'}60` },
                    border: `1px solid ${s.color || '#3b82f6'}40`,
                  }}
                  icon={
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: s.color || '#3b82f6',
                        ml: 1,
                      }}
                    />
                  }
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      ))}

      {/* Ungrouped statuses */}
      {ungrouped.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Ungrouped
              </Typography>
              <Chip label={ungrouped.length} size="small" />
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {ungrouped.map((s) => (
                <Chip
                  key={s.id}
                  label={s.name}
                  onDelete={() => {
                    setDeleteTarget(s);
                    setDeleteOpen(true);
                  }}
                  onClick={() => {
                    setEditStatus({
                      id: s.id,
                      name: s.name,
                      color: s.color || '#3b82f6',
                      order: s.order || 0,
                    });
                    setEditOpen(true);
                  }}
                  sx={{
                    bgcolor: `${s.color || '#6b7280'}20`,
                    color: s.color || '#6b7280',
                    fontWeight: 600,
                    cursor: 'pointer',
                    '& .MuiChip-deleteIcon': { color: `${s.color || '#6b7280'}60` },
                    border: `1px solid ${s.color || '#6b7280'}40`,
                  }}
                  icon={
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: s.color || '#6b7280',
                        ml: 1,
                      }}
                    />
                  }
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Status Flow Preview */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Status Flow Preview
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {[...API_STATUSES]
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((s, idx) => (
                <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={s.name}
                    sx={{
                      bgcolor: `${s.color || '#3b82f6'}20`,
                      color: s.color || '#3b82f6',
                      fontWeight: 600,
                    }}
                  />
                  {idx < API_STATUSES.length - 1 && (
                    <Icon icon="solar:arrow-right-linear" width={16} style={{ color: '#9ca3af' }} />
                  )}
                </Box>
              ))}
          </Box>
        </CardContent>
      </Card>

      {/* Create Status Group Dialog */}
      <Dialog
        open={groupCreateOpen}
        onClose={() => setGroupCreateOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add Status Group</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Group Name"
            value={newGroup.name}
            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGroupCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateGroup} disabled={groupSaving}>
            {groupSaving ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Status Group Dialog */}
      <Dialog open={groupEditOpen} onClose={() => setGroupEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Status Group</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Group Name"
            value={editGroup.name}
            onChange={(e) => setEditGroup({ ...editGroup, name: e.target.value })}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGroupEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditGroup} disabled={groupEditing}>
            {groupEditing ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Status Group Confirmation */}
      <Dialog
        open={groupDeleteOpen}
        onClose={() => setGroupDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Status Group</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the group <strong>{groupDeleteTarget?.name}</strong>?
            Statuses in this group will become ungrouped.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGroupDeleteOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteGroup}
            disabled={groupDeleting}
          >
            {groupDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Status Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Status</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Status Name"
            value={newStatus.name}
            onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value })}
            fullWidth
          />
          <TextField
            select
            label="Status Group"
            value={newStatus.status_group}
            onChange={(e) => setNewStatus({ ...newStatus, status_group: e.target.value })}
            fullWidth
          >
            <MenuItem value="">None</MenuItem>
            {STATUS_GROUPS.map((g) => (
              <MenuItem key={g.id} value={g.id}>
                {g.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Order"
            type="number"
            value={newStatus.order}
            onChange={(e) =>
              setNewStatus({ ...newStatus, order: parseInt(e.target.value, 10) || 0 })
            }
            fullWidth
          />
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Color
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {COLORS.map((c) => (
                <Box
                  key={c}
                  onClick={() => setNewStatus({ ...newStatus, color: c })}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: c,
                    cursor: 'pointer',
                    border: newStatus.color === c ? '3px solid #1a1a1a' : '3px solid transparent',
                  }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateStatus}
            disabled={!newStatus.name || statusSaving}
          >
            {statusSaving ? 'Adding...' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Status</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Status Name"
            value={editStatus.name}
            onChange={(e) => setEditStatus({ ...editStatus, name: e.target.value })}
            fullWidth
          />
          <TextField
            label="Order"
            type="number"
            value={editStatus.order}
            onChange={(e) =>
              setEditStatus({ ...editStatus, order: parseInt(e.target.value, 10) || 0 })
            }
            fullWidth
          />
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Color
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {COLORS.map((c) => (
                <Box
                  key={c}
                  onClick={() => setEditStatus({ ...editStatus, color: c })}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: c,
                    cursor: 'pointer',
                    border: editStatus.color === c ? '3px solid #1a1a1a' : '3px solid transparent',
                  }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditStatus} disabled={statusEditing}>
            {statusEditing ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Status Confirmation */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Status</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the status <strong>{deleteTarget?.name}</strong>? Tasks
            with this status may need to be reassigned.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteStatus}
            disabled={statusDeleting}
          >
            {statusDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
