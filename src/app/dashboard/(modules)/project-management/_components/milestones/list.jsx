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
  Avatar,
  Button,
  Dialog,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  CardContent,
  AvatarGroup,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

const STATUS_CONFIG = {
  in_progress: { color: '#3b82f6', label: 'In Progress', icon: 'solar:play-circle-bold' },
  upcoming: { color: '#f59e0b', label: 'Upcoming', icon: 'solar:clock-circle-bold' },
  completed: { color: '#22c55e', label: 'Completed', icon: 'solar:check-circle-bold' },
};

const EMPTY_FORM = { name: '', description: '', due_date: '', status: 'upcoming' };

function MilestonesList() {
  const { data: rawMilestones } = useGetRequest(EP.milestones);
  const { data: rawTasks } = useGetRequest(EP.tasks);
  const { data: rawSpaces } = useGetRequest(EP.spaces);
  const { data: rawUsers } = useGetRequest('/api/employees/');

  const MILESTONES = Array.isArray(rawMilestones) ? rawMilestones : rawMilestones?.results || [];
  const ALL_TASKS = Array.isArray(rawTasks) ? rawTasks : rawTasks?.results || [];
  const SPACES = Array.isArray(rawSpaces) ? rawSpaces : rawSpaces?.results || [];
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];

  const getSpaceById = (sid) => SPACES.find((s) => s.id === sid);
  const getUserById = (uid) => USERS.find((u) => u.id === uid);

  const [saving, setSaving] = useState(false);

  // --- Create Dialog ---
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const setC = (f) => (e) => setCreateForm({ ...createForm, [f]: e.target.value });

  const handleCreate = async () => {
    if (!createForm.name) {
      toast.error('Milestone name is required');
      return;
    }
    setSaving(true);
    try {
      await axiosInstance.post(EP.milestones, {
        name: createForm.name,
        description: createForm.description,
        target_date: createForm.due_date || null,
        status: createForm.status,
      });
      toast.success('Milestone created');
      mutate(EP.milestones);
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err?.message || 'Failed to create milestone');
    } finally {
      setSaving(false);
    }
  };

  // --- Edit Dialog ---
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const setE = (f) => (e) => setEditForm({ ...editForm, [f]: e.target.value });

  const openEdit = (ms) => {
    setEditId(ms.id);
    setEditForm({
      name: ms.name || '',
      description: ms.description || '',
      due_date: ms.target_date?.slice(0, 10) || '',
      status: ms.status || 'upcoming',
    });
    setEditOpen(true);
  };
  const handleEdit = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(EP.milestone_by_id(editId), {
        name: editForm.name,
        description: editForm.description,
        target_date: editForm.due_date || null,
        status: editForm.status,
      });
      toast.success('Milestone updated');
      mutate(EP.milestones);
      setEditOpen(false);
    } catch (err) {
      toast.error(err?.message || 'Failed to update milestone');
    } finally {
      setSaving(false);
    }
  };

  // --- Delete Dialog ---
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');

  const openDelete = (ms) => {
    setDeleteId(ms.id);
    setDeleteName(ms.name);
    setDeleteOpen(true);
  };
  const handleDelete = async () => {
    setSaving(true);
    try {
      await axiosInstance.delete(EP.milestone_by_id(deleteId));
      toast.success('Milestone deleted');
      mutate(EP.milestones);
      setDeleteOpen(false);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete milestone');
    } finally {
      setSaving(false);
    }
  };

  // --- Add Task Dialog ---
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addTaskMsId, setAddTaskMsId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState('');

  const openAddTask = (ms) => {
    setAddTaskMsId(ms.id);
    setSelectedTaskId('');
    setAddTaskOpen(true);
  };
  const handleAddTask = async () => {
    if (!selectedTaskId) {
      toast.error('Select a task');
      return;
    }
    setSaving(true);
    try {
      await axiosInstance.post(EP.milestone_add_task(addTaskMsId), { task_id: selectedTaskId });
      toast.success('Task added to milestone');
      mutate(EP.milestones);
      setAddTaskOpen(false);
    } catch (err) {
      toast.error(err?.message || 'Failed to add task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Milestones
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track key project milestones and deliverables
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="solar:flag-bold" />}
          onClick={() => {
            setCreateForm(EMPTY_FORM);
            setCreateOpen(true);
          }}
        >
          Create Milestone
        </Button>
      </Box>

      <Grid container spacing={3}>
        {MILESTONES.map((ms) => {
          const space = getSpaceById(ms.space_id || ms.space);
          const tasks = (ms.tasks || [])
            .map((tid) => ALL_TASKS.find((t) => t.id === tid))
            .filter(Boolean);
          const done = tasks.filter((t) => [4, 5].includes(t.status_id || t.status)).length;
          const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
          const cfg = STATUS_CONFIG[ms.status] || STATUS_CONFIG.upcoming;
          const daysLeft = Math.ceil((new Date(ms.target_date) - new Date()) / 86400000);
          const assignees = [...new Set(tasks.flatMap((t) => t.assignees || []))];

          return (
            <Grid key={ms.id} size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  borderLeft: `4px solid ${ms.color}`,
                  '&:hover': { boxShadow: 4 },
                  transition: 'box-shadow 0.2s',
                  cursor: 'pointer',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon icon="solar:flag-bold" width={20} style={{ color: ms.color }} />
                        <Typography variant="h6" fontWeight={600}>
                          {ms.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {ms.description}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                      <Chip
                        label={cfg.label}
                        size="small"
                        sx={{ bgcolor: `${cfg.color}20`, color: cfg.color, fontWeight: 600 }}
                      />
                      <IconButton size="small" onClick={() => openEdit(ms)}>
                        <Icon icon="solar:pen-bold" width={16} />
                      </IconButton>
                      <IconButton size="small" onClick={() => openDelete(ms)}>
                        <Icon icon="solar:trash-bin-trash-bold" width={16} color="#ef4444" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Chip
                      label={space?.name}
                      size="small"
                      variant="outlined"
                      sx={{ color: space?.color, borderColor: `${space?.color}40` }}
                    />
                    <Typography
                      variant="body2"
                      color={
                        daysLeft <= 0 && ms.status !== 'completed' ? 'error' : 'text.secondary'
                      }
                    >
                      {ms.status === 'completed'
                        ? 'Completed'
                        : daysLeft > 0
                          ? `${daysLeft} days left`
                          : `${Math.abs(daysLeft)} days overdue`}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">
                        Tasks: {done}/{tasks.length}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {pct}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: '#f1f5f9',
                        '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: ms.color },
                      }}
                    />
                  </Box>

                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Target: {new Date(ms.target_date).toLocaleDateString()}
                      </Typography>
                      <Button
                        size="small"
                        variant="text"
                        sx={{ fontSize: 11, minWidth: 0 }}
                        onClick={() => openAddTask(ms)}
                      >
                        + Add Task
                      </Button>
                    </Box>
                    <AvatarGroup max={4}>
                      {assignees.map((uid) => {
                        const u = getUserById(uid);
                        return (
                          <Avatar
                            key={uid}
                            sx={{ width: 26, height: 26, fontSize: 11, bgcolor: '#3b82f6' }}
                          >
                            {u?.name?.charAt(0)}
                          </Avatar>
                        );
                      })}
                    </AvatarGroup>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* ===== Create Milestone Dialog ===== */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Milestone</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}
        >
          <TextField fullWidth label="Name" value={createForm.name} onChange={setC('name')} />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={createForm.description}
            onChange={setC('description')}
          />
          <TextField
            fullWidth
            type="date"
            label="Due Date"
            value={createForm.due_date}
            onChange={setC('due_date')}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            select
            label="Status"
            value={createForm.status}
            onChange={setC('status')}
          >
            <MenuItem value="upcoming">Upcoming</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Edit Milestone Dialog ===== */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Milestone</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}
        >
          <TextField fullWidth label="Name" value={editForm.name} onChange={setE('name')} />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={editForm.description}
            onChange={setE('description')}
          />
          <TextField
            fullWidth
            type="date"
            label="Due Date"
            value={editForm.due_date}
            onChange={setE('due_date')}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            select
            label="Status"
            value={editForm.status}
            onChange={setE('status')}
          >
            <MenuItem value="upcoming">Upcoming</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Delete Milestone Dialog ===== */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Milestone</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteName}</strong>? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Add Task to Milestone Dialog ===== */}
      <Dialog open={addTaskOpen} onClose={() => setAddTaskOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Task to Milestone</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <TextField
            fullWidth
            select
            label="Select Task"
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
          >
            {ALL_TASKS.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTaskOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddTask} disabled={saving}>
            {saving ? 'Adding...' : 'Add Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MilestonesList;
