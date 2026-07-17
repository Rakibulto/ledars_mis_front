'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, usePatchMutation, useDeleteMutation } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

import { PRIORITY_OPTIONS } from '../constants';

const EP = endpoints.pm;

export default function TimelineView() {
  const [filterType, setFilterType] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [dateRange, setDateRange] = useState('week');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteId, setDeleteId] = useState(null);

  const { data: rawTasks } = useGetRequest(EP.tasks);
  const { data: rawActivities } = useGetRequest(EP.task_activity_logs);
  const { data: rawComments } = useGetRequest(EP.task_comments);
  const { data: rawStatuses } = useGetRequest(EP.statuses);
  const { data: rawUsers } = useGetRequest('/api/employees/');

  const TASKS = useMemo(
    () => (Array.isArray(rawTasks) ? rawTasks : rawTasks?.results || []),
    [rawTasks]
  );
  const ACTIVITIES = useMemo(
    () => (Array.isArray(rawActivities) ? rawActivities : rawActivities?.results || []),
    [rawActivities]
  );
  const COMMENTS = useMemo(
    () => (Array.isArray(rawComments) ? rawComments : rawComments?.results || []),
    [rawComments]
  );
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];
  const STATUSES = Array.isArray(rawStatuses) ? rawStatuses : rawStatuses?.results || [];

  const { trigger: doEdit, isMutating: editing } = usePatchMutation(
    editId ? EP.task_by_id(editId) : null,
    editForm
  );
  const { trigger: doDelete, isMutating: deleting } = useDeleteMutation(
    deleteId ? EP.task_by_id(deleteId) : null
  );

  const openEdit = (task) => {
    setEditId(task.id);
    setEditForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date || '',
      start_date: task.start_date || '',
    });
  };
  const handleEdit = async () => {
    try {
      await doEdit();
      mutate(EP.tasks);
      toast.success('Task updated');
      setEditId(null);
    } catch {
      toast.error('Update failed');
    }
  };
  const handleDelete = async () => {
    try {
      await doDelete();
      mutate(EP.tasks);
      toast.success('Task deleted');
      setDeleteId(null);
    } catch {
      toast.error('Delete failed');
    }
  };

  const getUserById = (id) => USERS.find((u) => u.id === id);

  // Combine activities and comments into a unified timeline
  const timelineItems = useMemo(() => {
    const items = [];
    ACTIVITIES.forEach((a) => {
      const task = TASKS.find((t) => t.id === (a.task_id || a.task));
      items.push({
        ...a,
        type: 'activity',
        task,
        user_id: a.user_id || a.user,
        sortDate: new Date(a.timestamp),
      });
    });
    COMMENTS.forEach((c) => {
      const task = TASKS.find((t) => t.id === (c.task_id || c.task));
      items.push({
        ...c,
        type: 'comment',
        task,
        user_id: c.user_id || c.user,
        sortDate: new Date(c.created_at),
        action: 'commented',
      });
    });
    TASKS.filter((t) => !t.parent_id && !t.parent).forEach((t) => {
      items.push({
        id: `task-${t.id}`,
        type: 'task_created',
        task: t,
        user_id: t.created_by,
        action: 'created task',
        sortDate: new Date(t.created_at),
        timestamp: t.created_at,
      });
    });

    let filtered = items.sort((a, b) => b.sortDate - a.sortDate);
    if (filterType !== 'all') filtered = filtered.filter((i) => i.type === filterType);
    if (filterUser !== 'all') filtered = filtered.filter((i) => i.user_id === Number(filterUser));

    const now = new Date();
    if (dateRange === 'today')
      filtered = filtered.filter((i) => i.sortDate.toDateString() === now.toDateString());
    else if (dateRange === 'week') {
      const w = new Date(now);
      w.setDate(w.getDate() - 7);
      filtered = filtered.filter((i) => i.sortDate >= w);
    } else if (dateRange === 'month') {
      const m = new Date(now);
      m.setMonth(m.getMonth() - 1);
      filtered = filtered.filter((i) => i.sortDate >= m);
    }

    return filtered;
  }, [ACTIVITIES, COMMENTS, TASKS, filterType, filterUser, dateRange]);

  // Group by date
  const grouped = useMemo(() => {
    const groups = {};
    timelineItems.forEach((item) => {
      const key = item.sortDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [timelineItems]);

  const getIcon = (type, action) => {
    if (type === 'comment') return { icon: 'solar:chat-round-bold-duotone', color: '#3b82f6' };
    if (type === 'task_created') return { icon: 'solar:add-circle-bold-duotone', color: '#22c55e' };
    if (action?.includes('status')) return { icon: 'solar:refresh-bold-duotone', color: '#f59e0b' };
    if (action?.includes('priority'))
      return { icon: 'solar:arrow-up-bold-duotone', color: '#ef4444' };
    if (action?.includes('assignee'))
      return { icon: 'solar:user-plus-bold-duotone', color: '#8b5cf6' };
    if (action?.includes('attachment'))
      return { icon: 'solar:paperclip-bold-duotone', color: '#06b6d4' };
    if (action?.includes('checklist'))
      return { icon: 'solar:check-circle-bold-duotone', color: '#22c55e' };
    if (action?.includes('tag')) return { icon: 'solar:tag-bold-duotone', color: '#ec4899' };
    if (action?.includes('dependency'))
      return { icon: 'solar:link-bold-duotone', color: '#f97316' };
    return { icon: 'solar:pen-bold-duotone', color: '#6b7280' };
  };

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
        gap={1}
      >
        <Typography variant="h5" fontWeight={700}>
          Timeline
        </Typography>
        <Stack direction="row" spacing={1}>
          <TextField
            select
            size="small"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            label="Type"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="activity">Activities</MenuItem>
            <MenuItem value="comment">Comments</MenuItem>
            <MenuItem value="task_created">Created Tasks</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            label="User"
            sx={{ minWidth: 130 }}
          >
            <MenuItem value="all">All Users</MenuItem>
            {USERS.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            label="Range"
            sx={{ minWidth: 110 }}
          >
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </TextField>
        </Stack>
      </Stack>
      {Object.keys(grouped).length === 0 ? (
        <Stack alignItems="center" py={6}>
          <Iconify
            icon="solar:calendar-bold-duotone"
            width={64}
            sx={{ color: 'text.disabled', mb: 2 }}
          />
          <Typography variant="body1" color="text.secondary">
            No timeline events found
          </Typography>
        </Stack>
      ) : (
        <Stack spacing={3}>
          {Object.entries(grouped).map(([date, items]) => (
            <Box key={date}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1.5}>
                {date}
              </Typography>
              <Stack spacing={0}>
                {items.map((item, idx) => {
                  const user = getUserById(item.user_id);
                  const { icon, color } = getIcon(item.type, item.action);
                  return (
                    <Stack key={`${item.type}-${item.id}-${idx}`} direction="row" spacing={2}>
                      {/* Timeline line */}
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          width: 32,
                        }}
                      >
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            bgcolor: `${color}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Iconify icon={icon} width={16} sx={{ color }} />
                        </Box>
                        {idx < items.length - 1 && (
                          <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', my: 0.5 }} />
                        )}
                      </Box>
                      {/* Content */}
                      <Box sx={{ flex: 1, pb: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1} mb={0.25}>
                          <Avatar
                            sx={{ width: 20, height: 20, fontSize: 9, bgcolor: 'primary.main' }}
                          >
                            {user?.name?.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">
                            <strong>{user?.name}</strong> {item.action}{' '}
                            {item.from && (
                              <>
                                <Typography component="span" variant="body2" color="text.secondary">
                                  from &quot;{item.from}&quot;
                                </Typography>{' '}
                              </>
                            )}
                            {item.to && (
                              <Typography component="span" variant="body2" color="text.secondary">
                                to &quot;{item.to}&quot;
                              </Typography>
                            )}
                          </Typography>
                        </Stack>
                        {item.task && (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Chip
                              label={`${item.task.task_id} ${item.task.title}`}
                              size="small"
                              variant="outlined"
                              sx={{ height: 22, fontSize: 11, mt: 0.25 }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => openEdit(item.task)}
                              sx={{ mt: 0.25 }}
                            >
                              <Iconify icon="solar:pen-bold" width={14} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => setDeleteId(item.task.id)}
                              sx={{ mt: 0.25 }}
                            >
                              <Iconify
                                icon="solar:trash-bin-trash-bold"
                                width={14}
                                sx={{ color: 'error.main' }}
                              />
                            </IconButton>
                          </Stack>
                        )}
                        {item.type === 'comment' && item.text && (
                          <Box
                            sx={{
                              mt: 0.5,
                              p: 1,
                              bgcolor: 'background.neutral',
                              borderRadius: 0.5,
                              borderLeft: '3px solid',
                              borderColor: 'primary.main',
                            }}
                          >
                            <Typography variant="caption" sx={{ whiteSpace: 'pre-wrap' }}>
                              {item.text}
                            </Typography>
                          </Box>
                        )}
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          display="block"
                          mt={0.25}
                        >
                          {item.sortDate.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
      {/* Edit Dialog */}
      <Dialog open={Boolean(editId)} onClose={() => setEditId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              value={editForm.title || ''}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={editForm.description || ''}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
            <TextField
              select
              fullWidth
              label="Status"
              value={editForm.status || ''}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            >
              {STATUSES.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              fullWidth
              label="Priority"
              value={editForm.priority || ''}
              onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <MenuItem key={p.value} value={p.value}>
                  {p.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={editForm.start_date || ''}
              onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
            />
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={editForm.due_date || ''}
              onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditId(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={editing}>
            {editing ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} maxWidth="xs">
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this task? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>{' '}
    </Box>
  );
}
