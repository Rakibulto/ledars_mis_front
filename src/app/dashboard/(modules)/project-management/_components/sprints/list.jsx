'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';

import {
  Box,
  Card,
  Chip,
  Grid,
  Button,
  Avatar,
  Dialog,
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

import {
  useGetRequest,
  usePatchMutation,
  useCreateMutation,
  useDeleteMutation,
} from 'src/actions/ledars-hook';

const EP = endpoints.pm;

const STATUS_CONFIG = {
  active: { color: '#3b82f6', label: 'Active', icon: 'solar:play-circle-bold' },
  planning: { color: '#f59e0b', label: 'Planning', icon: 'solar:clipboard-list-bold' },
  completed: { color: '#22c55e', label: 'Completed', icon: 'solar:check-circle-bold' },
};

export function SprintsList() {
  const { data: rawSprints } = useGetRequest(EP.sprints);
  const { data: rawTasks } = useGetRequest(EP.tasks);
  const { data: rawUsers } = useGetRequest('/api/employees/');

  const SPRINTS = Array.isArray(rawSprints) ? rawSprints : rawSprints?.results || [];
  const ALL_TASKS = Array.isArray(rawTasks) ? rawTasks : rawTasks?.results || [];
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];

  // CRUD state
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    goal: '',
    start_date: '',
    end_date: '',
  });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteId, setDeleteId] = useState(null);

  // CRUD hooks
  const { trigger: doCreate, isMutating: creating } = useCreateMutation(EP.sprints, createForm);
  const { trigger: doEdit, isMutating: editing } = usePatchMutation(
    editId ? EP.sprint_by_id(editId) : null,
    editForm
  );
  const { trigger: doDelete, isMutating: deleting } = useDeleteMutation(
    deleteId ? EP.sprint_by_id(deleteId) : null
  );

  // Handlers
  const handleCreate = async () => {
    try {
      await doCreate();
      mutate(EP.sprints);
      toast.success('Sprint created');
      setCreateOpen(false);
      setCreateForm({ name: '', goal: '', start_date: '', end_date: '' });
    } catch {
      toast.error('Create failed');
    }
  };
  const openEdit = (s) => {
    setEditId(s.id);
    setEditForm({
      name: s.name,
      goal: s.goal || '',
      start_date: s.start_date || '',
      end_date: s.end_date || '',
    });
  };
  const handleEdit = async () => {
    try {
      await doEdit();
      mutate(EP.sprints);
      toast.success('Sprint updated');
      setEditId(null);
    } catch {
      toast.error('Update failed');
    }
  };
  const handleDelete = async () => {
    try {
      await doDelete();
      mutate(EP.sprints);
      toast.success('Sprint deleted');
      setDeleteId(null);
    } catch {
      toast.error('Delete failed');
    }
  };
  const handleStartSprint = async (id) => {
    try {
      await axiosInstance.post(EP.sprint_start(id));
      mutate(EP.sprints);
      toast.success('Sprint started');
    } catch {
      toast.error('Failed to start sprint');
    }
  };
  const handleCompleteSprint = async (id) => {
    try {
      await axiosInstance.post(EP.sprint_complete(id));
      mutate(EP.sprints);
      toast.success('Sprint completed');
    } catch {
      toast.error('Failed to complete sprint');
    }
  };

  const getUserById = (id) => USERS.find((u) => u.id === id);

  const getSprint = (sprint) => {
    const tasks = ALL_TASKS.filter((t) => (sprint.tasks || []).includes(t.id));
    const done = tasks.filter((t) => [4, 5].includes(t.status_id || t.status)).length;
    const totalPoints = tasks.reduce((s, t) => s + (t.story_points || 0), 0);
    const donePoints = tasks
      .filter((t) => [4, 5].includes(t.status_id || t.status))
      .reduce((s, t) => s + (t.story_points || 0), 0);
    const assignees = [...new Set(tasks.flatMap((t) => t.assignees || []))];
    const today = new Date();
    const end = new Date(sprint.end_date);
    const start = new Date(sprint.start_date);
    const totalDays = Math.ceil((end - start) / 86400000);
    const elapsed = Math.ceil((today - start) / 86400000);
    const daysLeft = Math.max(0, Math.ceil((end - today) / 86400000));

    return { tasks, done, totalPoints, donePoints, assignees, totalDays, elapsed, daysLeft };
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Sprints
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your agile sprints
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="solar:add-circle-bold" />}
          onClick={() => setCreateOpen(true)}
        >
          Create Sprint
        </Button>
      </Box>

      <Grid container spacing={3}>
        {SPRINTS.map((sprint) => {
          const s = getSprint(sprint);
          const cfg = STATUS_CONFIG[sprint.status];
          const taskPct = s.tasks.length > 0 ? Math.round((s.done / s.tasks.length) * 100) : 0;
          const timePct =
            s.totalDays > 0 ? Math.min(Math.round((s.elapsed / s.totalDays) * 100), 100) : 0;

          return (
            <Grid key={sprint.id} size={{ xs: 12 }}>
              <Card sx={{ borderLeft: `4px solid ${cfg.color}` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Icon icon={cfg.icon} width={20} style={{ color: cfg.color }} />
                        <Typography variant="h6" fontWeight={600}>
                          {sprint.name}
                        </Typography>
                        <Chip
                          label={cfg.label}
                          size="small"
                          sx={{ bgcolor: `${cfg.color}20`, color: cfg.color, fontWeight: 600 }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {sprint.goal}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" color="text.secondary">
                          {sprint.start_date} &rarr; {sprint.end_date}
                        </Typography>
                        {sprint.status === 'active' && (
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color={s.daysLeft <= 2 ? 'error' : 'text.primary'}
                          >
                            {s.daysLeft} day{s.daysLeft !== 1 ? 's' : ''} left
                          </Typography>
                        )}
                      </Box>
                      {sprint.status === 'planning' && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => handleStartSprint(sprint.id)}
                          startIcon={<Icon icon="solar:play-circle-bold" />}
                        >
                          Start
                        </Button>
                      )}
                      {sprint.status === 'active' && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          onClick={() => handleCompleteSprint(sprint.id)}
                          startIcon={<Icon icon="solar:check-circle-bold" />}
                        >
                          Complete
                        </Button>
                      )}
                      <IconButton size="small" onClick={() => openEdit(sprint)}>
                        <Icon icon="solar:pen-bold" width={18} />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteId(sprint.id)}>
                        <Icon icon="solar:trash-bin-trash-bold" width={18} />
                      </IconButton>
                    </Box>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Tasks Progress
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={taskPct}
                          sx={{
                            flex: 1,
                            height: 8,
                            borderRadius: 4,
                            bgcolor: '#f1f5f9',
                            '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: cfg.color },
                          }}
                        />
                        <Typography variant="body2" fontWeight={600}>
                          {s.done}/{s.tasks.length}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Story Points
                      </Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {s.donePoints}/{s.totalPoints}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Team
                      </Typography>
                      <AvatarGroup max={5}>
                        {s.assignees.map((uid) => {
                          const u = getUserById(uid);
                          return (
                            <Avatar
                              key={uid}
                              sx={{ width: 28, height: 28, fontSize: 12, bgcolor: '#3b82f6' }}
                            >
                              {u?.name?.charAt(0)}
                            </Avatar>
                          );
                        })}
                      </AvatarGroup>
                    </Grid>
                  </Grid>

                  {sprint.status === 'active' && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Time Elapsed
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={timePct}
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          bgcolor: '#f1f5f9',
                          '& .MuiLinearProgress-bar': { borderRadius: 2 },
                        }}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Create Sprint Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Sprint</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}
        >
          <TextField
            label="Name"
            fullWidth
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
          />
          <TextField
            label="Goal"
            fullWidth
            multiline
            rows={2}
            value={createForm.goal}
            onChange={(e) => setCreateForm({ ...createForm, goal: e.target.value })}
          />
          <TextField
            label="Start Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={createForm.start_date}
            onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })}
          />
          <TextField
            label="End Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={createForm.end_date}
            onChange={(e) => setCreateForm({ ...createForm, end_date: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Sprint Dialog */}
      <Dialog open={!!editId} onClose={() => setEditId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Sprint</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}
        >
          <TextField
            label="Name"
            fullWidth
            value={editForm.name || ''}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <TextField
            label="Goal"
            fullWidth
            multiline
            rows={2}
            value={editForm.goal || ''}
            onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
          />
          <TextField
            label="Start Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={editForm.start_date || ''}
            onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
          />
          <TextField
            label="End Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={editForm.end_date || ''}
            onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditId(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={editing}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Sprint Confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Sprint?</DialogTitle>
        <DialogContent>
          <Typography>This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
