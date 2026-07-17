'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { useRef, useState, useEffect } from 'react';

import {
  Box,
  Card,
  Chip,
  Table,
  Button,
  Switch,
  Dialog,
  MenuItem,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  FormControlLabel,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

export function TimeTracker() {
  const { data: rawEntries } = useGetRequest(EP.time_entries);
  const TIME_ENTRIES = Array.isArray(rawEntries) ? rawEntries : rawEntries?.results || [];
  const { data: rawTasks } = useGetRequest(EP.tasks);
  const TASKS = Array.isArray(rawTasks) ? rawTasks : rawTasks?.results || [];

  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [description, setDescription] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [isBillable, setIsBillable] = useState(true);
  const intervalRef = useRef(null);

  // CRUD state
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    task: '',
    description: '',
    duration_minutes: '',
    date: '',
  });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await axiosInstance.post(EP.time_entries, createForm);
      mutate(EP.time_entries);
      mutate(EP.time_my_entries);
      toast.success('Time entry created');
      setCreateOpen(false);
      setCreateForm({ task: '', description: '', duration_minutes: '', date: '' });
    } catch (err) {
      toast.error(err?.message || 'Create failed');
    } finally {
      setSaving(false);
    }
  };
  const handleEdit = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(EP.time_entry_by_id(editId), editForm);
      mutate(EP.time_entries);
      mutate(EP.time_my_entries);
      toast.success('Time entry updated');
      setEditId(null);
    } catch (err) {
      toast.error(err?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async () => {
    setSaving(true);
    try {
      await axiosInstance.delete(EP.time_entry_by_id(deleteId));
      mutate(EP.time_entries);
      mutate(EP.time_my_entries);
      toast.success('Time entry deleted');
      setDeleteId(null);
    } catch (err) {
      toast.error(err?.message || 'Delete failed');
    } finally {
      setSaving(false);
    }
  };
  const handleStartTimer = async () => {
    try {
      await axiosInstance.post(EP.time_start_timer);
      mutate(EP.time_entries);
      mutate(EP.time_my_entries);
      setIsRunning(true);
      toast.success('Timer started');
    } catch {
      toast.error('Failed to start timer');
    }
  };
  const handleStopTimer = async () => {
    try {
      await axiosInstance.post(EP.time_stop_timer);
      mutate(EP.time_entries);
      mutate(EP.time_my_entries);
      setIsRunning(false);
      setElapsed(0);
      toast.success('Timer stopped');
    } catch {
      toast.error('Failed to stop timer');
    }
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const todayEntries = TIME_ENTRIES.slice(0, 5);
  const todayTotal = todayEntries.reduce((s, e) => s + (e.duration || 0), 0);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Time Tracker
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track time spent on tasks
        </Typography>
      </Box>

      {/* Timer Card */}
      <Card sx={{ mb: 3, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="What are you working on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
          />
          <TextField
            size="small"
            select
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
            sx={{ minWidth: 200 }}
            label="Task"
          >
            <MenuItem value="">No task</MenuItem>
            {TASKS.slice(0, 10).map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.task_id} — {t.title}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={
              <Switch
                checked={isBillable}
                onChange={(e) => setIsBillable(e.target.checked)}
                size="small"
              />
            }
            label={<Typography variant="caption">Billable</Typography>}
          />
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ fontFamily: 'monospace', minWidth: 130, textAlign: 'center' }}
          >
            {formatTime(elapsed)}
          </Typography>
          <IconButton
            onClick={isRunning ? handleStopTimer : handleStartTimer}
            sx={{
              bgcolor: isRunning ? 'error.main' : 'primary.main',
              color: '#fff',
              '&:hover': { bgcolor: isRunning ? 'error.dark' : 'primary.dark' },
              width: 48,
              height: 48,
            }}
          >
            <Icon icon={isRunning ? 'solar:stop-bold' : 'solar:play-bold'} width={24} />
          </IconButton>
        </Box>
      </Card>

      {/* Create Time Entry Button */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<Icon icon="solar:add-circle-bold" width={18} />}
          onClick={() => setCreateOpen(true)}
        >
          Add Time Entry
        </Button>
      </Box>

      {/* Today's entries */}
      <Card>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">Today&apos;s Entries</Typography>
          <Chip label={`${todayTotal} hours`} color="primary" size="small" />
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell>Task</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Billable</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {todayEntries.map((entry) => {
                const task = TASKS.find((t) => t.id === (entry.task_id || entry.task));
                return (
                  <TableRow key={entry.id} hover>
                    <TableCell>
                      <Typography variant="body2">{entry.description}</Typography>
                    </TableCell>
                    <TableCell>
                      {task && (
                        <Chip label={task.task_id} size="small" sx={{ height: 20, fontSize: 10 }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {entry.duration}h
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {entry.is_billable ? (
                        <Chip
                          label="Billable"
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ height: 20, fontSize: 10 }}
                        />
                      ) : (
                        <Chip
                          label="Non-billable"
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: 10 }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditId(entry.id);
                          setEditForm({
                            description: entry.description || '',
                            duration_minutes: entry.duration ? entry.duration * 60 : '',
                          });
                        }}
                      >
                        <Icon icon="solar:pen-bold" width={16} />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteId(entry.id)}>
                        <Icon icon="solar:trash-bin-trash-bold" width={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Time Entry</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}
        >
          <TextField
            select
            label="Task"
            value={createForm.task}
            onChange={(e) => setCreateForm({ ...createForm, task: e.target.value })}
            fullWidth
          >
            <MenuItem value="">Select task</MenuItem>
            {TASKS.slice(0, 20).map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.task_id} — {t.title}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Description"
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            fullWidth
            multiline
            rows={2}
          />
          <TextField
            label="Duration (minutes)"
            type="number"
            value={createForm.duration_minutes}
            onChange={(e) => setCreateForm({ ...createForm, duration_minutes: e.target.value })}
            fullWidth
          />
          <TextField
            label="Date"
            type="date"
            value={createForm.date}
            onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editId} onClose={() => setEditId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Time Entry</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}
        >
          <TextField
            label="Description"
            value={editForm.description || ''}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            fullWidth
            multiline
            rows={2}
          />
          <TextField
            label="Duration (minutes)"
            type="number"
            value={editForm.duration_minutes || ''}
            onChange={(e) => setEditForm({ ...editForm, duration_minutes: e.target.value })}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditId(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Time Entry</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this time entry?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
