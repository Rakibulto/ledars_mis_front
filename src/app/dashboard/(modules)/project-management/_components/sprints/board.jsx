'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';

import {
  Box,
  Card,
  Chip,
  Avatar,
  Button,
  Select,
  Dialog,
  Tooltip,
  MenuItem,
  TextField,
  Typography,
  InputLabel,
  IconButton,
  CardContent,
  AvatarGroup,
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest, usePatchMutation, useDeleteMutation } from 'src/actions/ledars-hook';

import { PRIORITY_OPTIONS } from '../constants';

const EP = endpoints.pm;

const SprintTaskCard = ({ task, getUserById, onEdit, onDelete, onRemove }) => {
  const prio = PRIORITY_OPTIONS.find((p) => p.value === task.priority);
  return (
    <Card variant="outlined" sx={{ mb: 1, cursor: 'pointer', '&:hover': { boxShadow: 3 } }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}
        >
          <Typography variant="body2" fontWeight={600}>
            {task.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.25 }}>
            <IconButton size="small" onClick={() => onEdit(task)}>
              <Icon icon="solar:pen-bold" width={14} />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => onDelete(task.id)}>
              <Icon icon="solar:trash-bin-trash-bold" width={14} />
            </IconButton>
            <Tooltip title="Remove from sprint">
              <IconButton size="small" color="warning" onClick={() => onRemove(task.id)}>
                <Icon icon="solar:logout-2-bold" width={14} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip label={task.task_id} size="small" sx={{ height: 18, fontSize: 10 }} />
            {task.story_points && (
              <Chip
                label={`${task.story_points} SP`}
                size="small"
                variant="outlined"
                sx={{ height: 18, fontSize: 10 }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: prio?.color }} />
            <AvatarGroup
              max={2}
              sx={{ '& .MuiAvatar-root': { width: 20, height: 20, fontSize: 9 } }}
            >
              {(task.assignees || []).map((uid) => {
                const u = getUserById(uid);
                return (
                  <Tooltip key={uid} title={u?.name}>
                    <Avatar>{u?.name?.charAt(0)}</Avatar>
                  </Tooltip>
                );
              })}
            </AvatarGroup>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export function SprintBoard() {
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteId, setDeleteId] = useState(null);

  const { data: rawTasks } = useGetRequest(EP.tasks);
  const { data: rawSprints } = useGetRequest(EP.sprints);
  const { data: rawStatuses } = useGetRequest(EP.statuses);
  const { data: rawUsers } = useGetRequest('/api/employees/');

  const ALL_TASKS = Array.isArray(rawTasks) ? rawTasks : rawTasks?.results || [];
  const SPRINTS = Array.isArray(rawSprints) ? rawSprints : rawSprints?.results || [];
  const STATUSES = Array.isArray(rawStatuses) ? rawStatuses : rawStatuses?.results || [];
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];

  const getUserById = (id) => USERS.find((u) => u.id === id);

  // Task CRUD hooks
  const { trigger: doEditTask, isMutating: editingTask } = usePatchMutation(
    editId ? EP.task_by_id(editId) : null,
    editForm
  );
  const { trigger: doDeleteTask, isMutating: deletingTask } = useDeleteMutation(
    deleteId ? EP.task_by_id(deleteId) : null
  );

  const openEditTask = (t) => {
    setEditId(t.id);
    setEditForm({ title: t.title, story_points: t.story_points || 0 });
  };
  const handleEditTask = async () => {
    try {
      await doEditTask();
      mutate(EP.tasks);
      toast.success('Task updated');
      setEditId(null);
    } catch {
      toast.error('Update failed');
    }
  };
  const handleDeleteTask = async () => {
    try {
      await doDeleteTask();
      mutate(EP.tasks);
      toast.success('Task deleted');
      setDeleteId(null);
    } catch {
      toast.error('Delete failed');
    }
  };
  const handleRemoveFromSprint = async (taskId) => {
    if (!activeId) return;
    try {
      await axiosInstance.post(EP.sprint_remove_task(activeId), { task_id: taskId });
      mutate(EP.sprints);
      mutate(EP.tasks);
      toast.success('Task removed from sprint');
    } catch {
      toast.error('Failed to remove task');
    }
  };

  const activeId = selectedSprint || SPRINTS[0]?.id;
  const sprint = SPRINTS.find((s) => s.id === activeId);
  const sprintTasks = sprint ? ALL_TASKS.filter((t) => (sprint.tasks || []).includes(t.id)) : [];

  const doneTasks = sprintTasks.filter((t) => [4, 5].includes(t.status_id || t.status)).length;
  const totalPoints = sprintTasks.reduce((s, t) => s + (t.story_points || 0), 0);
  const donePoints = sprintTasks
    .filter((t) => [4, 5].includes(t.status_id || t.status))
    .reduce((s, t) => s + (t.story_points || 0), 0);
  const progress = sprintTasks.length ? Math.round((doneTasks / sprintTasks.length) * 100) : 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Sprint Board
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage sprint tasks and progress
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Sprint</InputLabel>
          <Select
            value={activeId || ''}
            label="Sprint"
            onChange={(e) => setSelectedSprint(e.target.value)}
          >
            {SPRINTS.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name} {s.status === 'active' && '(Active)'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {sprint && (
        <>
          {/* Sprint info bar */}
          <Card sx={{ p: 2, mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box>
                <Typography fontWeight={700}>{sprint.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {sprint.goal}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700}>
                    {sprintTasks.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tasks
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700}>
                    {totalPoints}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Story Points
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    {donePoints}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Completed SP
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ minWidth: 200, flex: 1, maxWidth: 300 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption">Progress</Typography>
                  <Typography variant="caption" fontWeight={700}>
                    {progress}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {sprint.start_date && new Date(sprint.start_date).toLocaleDateString()} —{' '}
                  {sprint.end_date && new Date(sprint.end_date).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Card>

          {/* Kanban columns */}
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, minHeight: 400 }}>
            {STATUSES.filter((s) => s.group !== 'closed').map((status) => {
              const tasks = sprintTasks.filter((t) => (t.status_id || t.status) === status.id);
              return (
                <Box key={status.id} sx={{ minWidth: 260, flex: '1 0 260px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, px: 1 }}>
                    <Box
                      sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: status.color }}
                    />
                    <Typography variant="subtitle2" fontWeight={700}>
                      {status.name}
                    </Typography>
                    <Chip label={tasks.length} size="small" sx={{ height: 20, fontSize: 11 }} />
                  </Box>
                  {tasks.map((task) => (
                    <SprintTaskCard
                      key={task.id}
                      task={task}
                      getUserById={getUserById}
                      onEdit={openEditTask}
                      onDelete={(id) => setDeleteId(id)}
                      onRemove={handleRemoveFromSprint}
                    />
                  ))}
                </Box>
              );
            })}
          </Box>
        </>
      )}

      {/* Edit Task Dialog */}
      <Dialog open={!!editId} onClose={() => setEditId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}
        >
          <TextField
            label="Title"
            fullWidth
            value={editForm.title || ''}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          />
          <TextField
            label="Story Points"
            type="number"
            fullWidth
            value={editForm.story_points || ''}
            onChange={(e) => setEditForm({ ...editForm, story_points: Number(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditId(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditTask} disabled={editingTask}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Task Confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Task?</DialogTitle>
        <DialogContent>
          <Typography>This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteTask}
            disabled={deletingTask}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
