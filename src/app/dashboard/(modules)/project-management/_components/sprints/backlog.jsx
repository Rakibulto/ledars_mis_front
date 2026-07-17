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
  Tooltip,
  TableRow,
  Checkbox,
  MenuItem,
  TableBody,
  TableCell,
  TextField,
  Typography,
  IconButton,
  AvatarGroup,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest, usePatchMutation, useDeleteMutation } from 'src/actions/ledars-hook';

import { PRIORITY_OPTIONS } from '../constants';

const EP = endpoints.pm;

export function SprintBacklog() {
  const [selected, setSelected] = useState([]);
  const [addToSprintTask, setAddToSprintTask] = useState(null);
  const [addToSprintId, setAddToSprintId] = useState('');
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
  const getStatusById = (id) => STATUSES.find((s) => s.id === id);

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
  const handleAddToSprint = async () => {
    if (!addToSprintId || !addToSprintTask) return;
    try {
      await axiosInstance.post(EP.sprint_add_task(addToSprintId), { task_id: addToSprintTask });
      mutate(EP.sprints);
      mutate(EP.tasks);
      toast.success('Task added to sprint');
      setAddToSprintTask(null);
      setAddToSprintId('');
    } catch {
      toast.error('Failed to add task to sprint');
    }
  };
  const handleBulkMove = async () => {
    const targetSprint = planningSprint || SPRINTS[0];
    if (!targetSprint || selected.length === 0) return;
    try {
      await Promise.all(
        selected.map((taskId) =>
          axiosInstance.post(EP.sprint_add_task(targetSprint.id), { task_id: taskId })
        )
      );
      mutate(EP.sprints);
      mutate(EP.tasks);
      toast.success(`${selected.length} tasks moved`);
      setSelected([]);
    } catch {
      toast.error('Failed to move tasks');
    }
  };

  const activeSprint = SPRINTS.find((s) => s.status === 'active');
  const planningSprint = SPRINTS.find((s) => s.status === 'planning');

  const sprintTasks = activeSprint
    ? ALL_TASKS.filter((t) => (activeSprint.tasks || []).includes(t.id))
    : [];
  const backlogTasks = ALL_TASKS.filter(
    (t) => !SPRINTS.some((s) => (s.tasks || []).includes(t.id))
  );

  const toggleSelect = (id) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const renderTaskRow = (task, showCheckbox = false) => {
    const status = getStatusById(task.status_id || task.status);
    const prio = PRIORITY_OPTIONS.find((p) => p.value === task.priority);
    return (
      <TableRow key={task.id} hover>
        {showCheckbox && (
          <TableCell padding="checkbox">
            <Checkbox
              size="small"
              checked={selected.includes(task.id)}
              onChange={() => toggleSelect(task.id)}
            />
          </TableCell>
        )}
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: status?.color }} />
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {task.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {task.task_id}
              </Typography>
            </Box>
          </Box>
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: prio?.color }} />
            <Typography variant="caption">{prio?.label}</Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            label={`${task.story_points || 0} SP`}
            size="small"
            variant="outlined"
            sx={{ height: 20, fontSize: 10 }}
          />
        </TableCell>
        <TableCell>
          <AvatarGroup max={2} sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: 9 } }}>
            {(task.assignees || []).map((uid) => {
              const u = getUserById(uid);
              return (
                <Tooltip key={uid} title={u?.name}>
                  <Avatar>{u?.name?.charAt(0)}</Avatar>
                </Tooltip>
              );
            })}
          </AvatarGroup>
        </TableCell>
        <TableCell align="right">
          <Tooltip title="Add to sprint">
            <IconButton size="small" onClick={() => setAddToSprintTask(task.id)}>
              <Icon icon="solar:arrow-right-bold" width={16} />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={() => openEditTask(task)}>
            <Icon icon="solar:pen-bold" width={16} />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => setDeleteId(task.id)}>
            <Icon icon="solar:trash-bin-trash-bold" width={16} />
          </IconButton>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Backlog
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Prioritize and plan sprint work
          </Typography>
        </Box>
        {selected.length > 0 && (
          <Button
            variant="contained"
            startIcon={<Icon icon="solar:arrow-right-bold" />}
            onClick={handleBulkMove}
          >
            Move {selected.length} to {planningSprint?.name || 'Sprint'}
          </Button>
        )}
      </Box>

      {/* Active Sprint */}
      {activeSprint && (
        <Card sx={{ mb: 3 }}>
          <Box
            sx={{
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: 'primary.50',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="Active" color="primary" size="small" />
              <Typography fontWeight={700}>{activeSprint.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                ({sprintTasks.length} tasks,{' '}
                {sprintTasks.reduce((s, t) => s + (t.story_points || 0), 0)} SP)
              </Typography>
            </Box>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableBody>{sprintTasks.map((t) => renderTaskRow(t))}</TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Backlog */}
      <Card>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography fontWeight={700}>Backlog</Typography>
            <Chip label={backlogTasks.length} size="small" sx={{ height: 20, fontSize: 11 }} />
            <Typography variant="body2" color="text.secondary">
              ({backlogTasks.reduce((s, t) => s + (t.story_points || 0), 0)} SP)
            </Typography>
          </Box>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableBody>{backlogTasks.map((t) => renderTaskRow(t, true))}</TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add to Sprint Dialog */}
      <Dialog
        open={!!addToSprintTask}
        onClose={() => setAddToSprintTask(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add Task to Sprint</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <TextField
            select
            label="Select Sprint"
            fullWidth
            value={addToSprintId}
            onChange={(e) => setAddToSprintId(e.target.value)}
          >
            {SPRINTS.filter((s) => s.status !== 'completed').map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name} ({s.status})
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddToSprintTask(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddToSprint} disabled={!addToSprintId}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

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
