'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ButtonGroup from '@mui/material/ButtonGroup';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, usePatchMutation, useDeleteMutation } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

import { PRIORITY_OPTIONS } from '../constants';

const EP = endpoints.pm;
const DAY_MS = 86400000;

export default function GanttView() {
  const [zoom, setZoom] = useState('week');
  const [showDeps, setShowDeps] = useState(true);
  const [showMilestones, setShowMilestones] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteId, setDeleteId] = useState(null);

  const { data: rawTasks } = useGetRequest(EP.tasks);
  const { data: rawStatuses } = useGetRequest(EP.statuses);
  const { data: rawMilestones } = useGetRequest(EP.milestones);
  const { data: rawUsers } = useGetRequest('/api/employees/');

  const TASKS = useMemo(
    () =>
      (Array.isArray(rawTasks) ? rawTasks : rawTasks?.results || []).filter(
        (t) => !t.parent_id && !t.parent && t.start_date && t.due_date
      ),
    [rawTasks]
  );
  const STATUSES = Array.isArray(rawStatuses) ? rawStatuses : rawStatuses?.results || [];
  const MILESTONES = Array.isArray(rawMilestones) ? rawMilestones : rawMilestones?.results || [];
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];

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
  const getStatusById = (id) => STATUSES.find((s) => s.id === id);

  const COL_WIDTH = zoom === 'day' ? 40 : zoom === 'week' ? 28 : 10;
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const filtered = useMemo(() => {
    let result = TASKS;
    if (search) result = result.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
    if (filterPriority !== 'all') result = result.filter((t) => t.priority === filterPriority);
    return result.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  }, [TASKS, search, filterPriority]);

  const { startDate, endDate, totalDays, dates } = useMemo(() => {
    if (filtered.length === 0)
      return { startDate: today, endDate: today, totalDays: 30, dates: [] };
    const allDates = filtered.flatMap((t) => [new Date(t.start_date), new Date(t.due_date)]);
    const min = new Date(Math.min(...allDates));
    const max = new Date(Math.max(...allDates));
    min.setDate(min.getDate() - 7);
    max.setDate(max.getDate() + 7);
    const total = Math.ceil((max - min) / DAY_MS) + 1;
    const d = [];
    for (let i = 0; i < total; i += 1) {
      const dt = new Date(min);
      dt.setDate(dt.getDate() + i);
      d.push(dt);
    }
    return { startDate: min, endDate: max, totalDays: total, dates: d };
  }, [filtered, today]);

  const getBarPosition = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const left = Math.max(0, Math.round((s - startDate) / DAY_MS));
    const width = Math.max(1, Math.round((e - s) / DAY_MS) + 1);
    return { left: left * COL_WIDTH, width: width * COL_WIDTH };
  };

  // Generate week/month headers
  const headerGroups = useMemo(() => {
    const groups = [];
    let currentLabel = '';
    dates.forEach((d, i) => {
      let label;
      if (zoom === 'month')
        label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      else
        label = `Week ${Math.ceil(d.getDate() / 7)} · ${d.toLocaleDateString('en-US', { month: 'short' })}`;
      if (label !== currentLabel) {
        groups.push({ label, start: i, count: 1 });
        currentLabel = label;
      } else {
        groups[groups.length - 1].count += 1;
      }
    });
    return groups;
  }, [dates, zoom]);

  const todayOffset = Math.round((today - startDate) / DAY_MS) * COL_WIDTH;

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        flexWrap="wrap"
        gap={1}
      >
        <Typography variant="h5" fontWeight={700}>
          Gantt Chart
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 160 }}
            InputProps={{
              startAdornment: (
                <Iconify
                  icon="solar:magnifer-line-duotone"
                  sx={{ mr: 1, color: 'text.disabled' }}
                />
              ),
            }}
          />
          <TextField
            select
            size="small"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            label="Priority"
            sx={{ minWidth: 100 }}
          >
            <MenuItem value="all">All</MenuItem>
            {PRIORITY_OPTIONS.map((p) => (
              <MenuItem key={p.value} value={p.value}>
                {p.label}
              </MenuItem>
            ))}
          </TextField>
          <ButtonGroup size="small" variant="outlined">
            <Button
              variant={zoom === 'day' ? 'contained' : 'outlined'}
              onClick={() => setZoom('day')}
            >
              Day
            </Button>
            <Button
              variant={zoom === 'week' ? 'contained' : 'outlined'}
              onClick={() => setZoom('week')}
            >
              Week
            </Button>
            <Button
              variant={zoom === 'month' ? 'contained' : 'outlined'}
              onClick={() => setZoom('month')}
            >
              Month
            </Button>
          </ButtonGroup>
          <Button
            size="small"
            variant={showDeps ? 'contained' : 'outlined'}
            onClick={() => setShowDeps(!showDeps)}
          >
            <Iconify icon="solar:link-bold" width={16} />
          </Button>
          <Button
            size="small"
            variant={showMilestones ? 'contained' : 'outlined'}
            onClick={() => setShowMilestones(!showMilestones)}
          >
            <Iconify icon="solar:flag-bold" width={16} />
          </Button>
        </Stack>
      </Stack>

      <Box
        sx={{
          display: 'flex',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        {/* Task list sidebar */}
        <Box
          sx={{
            width: 280,
            flexShrink: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.neutral',
          }}
        >
          <Box
            sx={{
              p: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
              height: 56,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Typography variant="caption" fontWeight={700}>
              TASK NAME
            </Typography>
          </Box>
          {filtered.map((task) => {
            const priority = PRIORITY_OPTIONS.find((p) => p.value === task.priority);
            return (
              <Stack
                key={task.id}
                direction="row"
                alignItems="center"
                spacing={1}
                px={1}
                sx={{ height: 36, borderBottom: '1px solid', borderColor: 'divider' }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: priority?.color,
                    flexShrink: 0,
                  }}
                />
                <Typography variant="caption" noWrap fontWeight={500} sx={{ flex: 1 }}>
                  {task.title}
                </Typography>
                <IconButton size="small" onClick={() => openEdit(task)} sx={{ p: 0 }}>
                  <Iconify icon="solar:pen-bold" width={12} />
                </IconButton>
                <IconButton size="small" onClick={() => setDeleteId(task.id)} sx={{ p: 0 }}>
                  <Iconify
                    icon="solar:trash-bin-trash-bold"
                    width={12}
                    sx={{ color: 'error.main' }}
                  />
                </IconButton>
                <AvatarGroupMini assignees={task.assignees} users={USERS} />
              </Stack>
            );
          })}
          {/* Milestones */}
          {showMilestones &&
            MILESTONES.map((m) => (
              <Stack
                key={`m-${m.id}`}
                direction="row"
                alignItems="center"
                spacing={1}
                px={1}
                sx={{
                  height: 36,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: `${m.color || '#888'}08`,
                }}
              >
                <Iconify icon="solar:flag-bold" width={14} sx={{ color: m.color }} />
                <Typography variant="caption" noWrap fontWeight={600} sx={{ color: m.color }}>
                  {m.name}
                </Typography>
              </Stack>
            ))}
        </Box>

        {/* Gantt area */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Box sx={{ minWidth: totalDays * COL_WIDTH, position: 'relative' }}>
            {/* Header rows */}
            <Box
              sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                height: 28,
              }}
            >
              {headerGroups.map((g, i) => (
                <Box
                  key={i}
                  sx={{
                    width: g.count * COL_WIDTH,
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="caption" fontWeight={600} noWrap sx={{ fontSize: 10 }}>
                    {g.label}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Box
              sx={{
                display: 'flex',
                borderBottom: '1px solid',
                borderColor: 'divider',
                height: 28,
              }}
            >
              {dates.map((d, i) => {
                const isT = d.toDateString() === today.toDateString();
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <Box
                    key={i}
                    sx={{
                      width: COL_WIDTH,
                      borderRight: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: isT ? 'primary.lighter' : isWeekend ? 'action.hover' : 'transparent',
                    }}
                  >
                    <Typography variant="caption" fontWeight={isT ? 700 : 400} sx={{ fontSize: 9 }}>
                      {d.getDate()}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            {/* Today line */}
            {todayOffset > 0 && todayOffset < totalDays * COL_WIDTH && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 56,
                  bottom: 0,
                  left: todayOffset + COL_WIDTH / 2,
                  width: 2,
                  bgcolor: 'error.main',
                  zIndex: 10,
                  opacity: 0.5,
                }}
              />
            )}

            {/* Task bars */}
            {filtered.map((task) => {
              const { left, width } = getBarPosition(task.start_date, task.due_date);
              const priority = PRIORITY_OPTIONS.find((p) => p.value === task.priority);
              const status = getStatusById(task.status_id || task.status);
              const pct = task.checklist_count
                ? (task.checklist_done / task.checklist_count) * 100
                : 0;
              return (
                <Box
                  key={task.id}
                  sx={{
                    height: 36,
                    position: 'relative',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {/* Weekend bg stripes */}
                  {dates.map(
                    (d, i) =>
                      (d.getDay() === 0 || d.getDay() === 6) && (
                        <Box
                          key={i}
                          sx={{
                            position: 'absolute',
                            left: i * COL_WIDTH,
                            width: COL_WIDTH,
                            height: '100%',
                            bgcolor: 'action.hover',
                          }}
                        />
                      )
                  )}
                  <Tooltip title={`${task.title} (${task.start_date} → ${task.due_date})`}>
                    <Box
                      sx={{
                        position: 'absolute',
                        left,
                        width: Math.max(width, COL_WIDTH),
                        top: 6,
                        height: 24,
                        bgcolor: `${priority?.color || '#3b82f6'}30`,
                        border: `1px solid ${priority?.color || '#3b82f6'}60`,
                        borderRadius: 0.5,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: `${priority?.color || '#3b82f6'}50` },
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        px: 0.5,
                      }}
                    >
                      {/* Progress fill */}
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          height: '100%',
                          width: `${pct}%`,
                          bgcolor: `${priority?.color || '#3b82f6'}40`,
                          borderRadius: 'inherit',
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: 9,
                          fontWeight: 600,
                          position: 'relative',
                          zIndex: 1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {width > 60 ? task.title : task.task_id}
                      </Typography>
                    </Box>
                  </Tooltip>
                </Box>
              );
            })}

            {/* Milestone markers */}
            {showMilestones &&
              MILESTONES.map((m) => {
                const mDate = new Date(m.target_date);
                const offset = Math.round((mDate - startDate) / DAY_MS) * COL_WIDTH;
                return (
                  <Box
                    key={`m-${m.id}`}
                    sx={{
                      height: 36,
                      position: 'relative',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      bgcolor: `${m.color}04`,
                    }}
                  >
                    <Tooltip title={`${m.name} — ${m.target_date}`}>
                      <Box
                        sx={{
                          position: 'absolute',
                          left: offset + COL_WIDTH / 2 - 8,
                          top: 6,
                          width: 24,
                          height: 24,
                          transform: 'rotate(45deg)',
                          bgcolor: m.color,
                          borderRadius: 0.5,
                          cursor: 'pointer',
                          opacity: m.status === 'completed' ? 0.4 : 0.8,
                        }}
                      />
                    </Tooltip>
                  </Box>
                );
              })}
          </Box>
        </Box>
      </Box>

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
      </Dialog>
    </Box>
  );
}

function AvatarGroupMini({ assignees, users = [] }) {
  if (!assignees?.length) return null;
  return (
    <Stack direction="row" spacing={-0.5}>
      {assignees.slice(0, 2).map((assignee) => {
        const assigneeId = typeof assignee === 'object' ? assignee?.id : assignee;
        const assigneeName =
          typeof assignee === 'object'
            ? assignee?.name || assignee?.email || ''
            : users.find((u) => u.id === assignee)?.name || '';
        return (
          <Avatar
            key={assigneeId}
            sx={{ width: 18, height: 18, fontSize: 8, bgcolor: 'primary.main' }}
          >
            {assigneeName?.charAt(0)}
          </Avatar>
        );
      })}
    </Stack>
  );
}
