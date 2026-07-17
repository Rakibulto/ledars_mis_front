'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ButtonGroup from '@mui/material/ButtonGroup';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  usePatchMutation,
  useDeleteMutation,
  usePatchRequest as patchRequest,
  useCreateRequest as createRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

import { PRIORITY_OPTIONS } from '../constants';

const EP = endpoints.pm;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [filterPriority, setFilterPriority] = useState('all');
  const [quickCreateDate, setQuickCreateDate] = useState(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteId, setDeleteId] = useState(null);

  const { data: rawTasks } = useGetRequest(EP.tasks);
  const { data: rawStatuses } = useGetRequest(EP.statuses);
  const { data: rawLists } = useGetRequest(EP.lists);
  const { data: rawUsers } = useGetRequest('/api/employees/');

  const ALL_TASKS = useMemo(
    () =>
      (Array.isArray(rawTasks) ? rawTasks : rawTasks?.results || []).filter(
        (t) => !t.parent_id && !t.parent && t.due_date
      ),
    [rawTasks]
  );
  const STATUSES = Array.isArray(rawStatuses) ? rawStatuses : rawStatuses?.results || [];
  const LISTS = Array.isArray(rawLists) ? rawLists : rawLists?.results || [];
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];
  const getTaskListId = (task) => task?.list_id || task?.list;
  const getAssigneeName = (assignee) => {
    if (typeof assignee === 'object') return assignee?.name || assignee?.email || '';
    return getUserById(assignee)?.name || getUserById(assignee)?.email || '';
  };

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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const filtered = useMemo(() => {
    let result = ALL_TASKS;
    if (filterPriority !== 'all') result = result.filter((t) => t.priority === filterPriority);
    return result;
  }, [ALL_TASKS, filterPriority]);

  const navigate = (dir) => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + dir);
    else if (viewMode === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  // Month grid
  const monthGrid = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();
    const cells = [];
    for (let i = firstDay - 1; i >= 0; i -= 1)
      cells.push({ day: prevDays - i, month: month - 1, isOther: true });
    for (let i = 1; i <= daysInMonth; i += 1) cells.push({ day: i, month, isOther: false });
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i += 1) cells.push({ day: i, month: month + 1, isOther: true });
    return cells;
  }, [year, month]);

  // Week view dates
  const weekDates = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const getTasksForDate = (dateStr) => filtered.filter((t) => t.due_date === dateStr);

  const formatDateStr = (y, m, d) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const handleDrop = async (dateStr) => {
    if (!dragging) return;
    try {
      await patchRequest(EP.task_by_id(dragging), { due_date: dateStr });
      mutate(EP.tasks);
      toast.success('Task rescheduled');
    } catch {
      toast.error('Failed to reschedule task');
    }
    setDragging(null);
  };

  const handleQuickCreate = async () => {
    if (!quickTitle.trim() || !quickCreateDate) return;
    const inferredListId = ALL_TASKS.map(getTaskListId).find(Boolean) || LISTS[0]?.id;

    if (!inferredListId) {
      toast.error('A list is required before creating calendar tasks');
      return;
    }

    try {
      await createRequest(EP.tasks, {
        title: quickTitle.trim(),
        due_date: quickCreateDate,
        list: inferredListId,
        status: STATUSES[0]?.id,
      });
      mutate(EP.tasks);
      toast.success('Task created');
      setQuickTitle('');
      setQuickCreateDate(null);
    } catch {
      toast.error('Failed to create task');
    }
  };

  const renderDayCell = (dateStr, isToday, isOther) => {
    const dayTasks = getTasksForDate(dateStr);
    return (
      <Box
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => handleDrop(dateStr)}
        onClick={() => {
          if (!dayTasks.length) {
            setQuickCreateDate(dateStr);
            setQuickTitle('');
          }
        }}
        sx={{
          minHeight: viewMode === 'month' ? 100 : 140,
          p: 0.5,
          border: '1px solid',
          borderColor: isToday ? 'primary.main' : 'divider',
          bgcolor: isToday ? 'primary.lighter' : isOther ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          '&:hover': { bgcolor: isToday ? 'primary.lighter' : 'action.hover' },
          overflow: 'hidden',
        }}
      >
        <Typography
          variant="caption"
          fontWeight={isToday ? 700 : 400}
          color={isOther ? 'text.disabled' : 'text.primary'}
          sx={{ display: 'block', mb: 0.3 }}
        >
          {parseInt(dateStr.split('-')[2], 10)}
        </Typography>
        <Stack spacing={0.3}>
          {dayTasks.slice(0, 3).map((task) => {
            const priority = PRIORITY_OPTIONS.find((p) => p.value === task.priority);
            return (
              <Box
                key={task.id}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  setDragging(task.id);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTask(task);
                }}
                sx={{
                  p: 0.3,
                  borderRadius: 0.5,
                  bgcolor: `${priority?.color || '#ccc'}15`,
                  borderLeft: `2px solid ${priority?.color || '#ccc'}`,
                  cursor: 'grab',
                  '&:hover': { bgcolor: `${priority?.color || '#ccc'}25` },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={0.3} sx={{ width: '100%' }}>
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{ fontSize: 10, lineHeight: 1.2, fontWeight: 500, flex: 1 }}
                  >
                    {task.title}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(task);
                    }}
                    sx={{ p: 0 }}
                  >
                    <Iconify icon="solar:pen-bold" width={10} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(task.id);
                    }}
                    sx={{ p: 0 }}
                  >
                    <Iconify
                      icon="solar:trash-bin-trash-bold"
                      width={10}
                      sx={{ color: 'error.main' }}
                    />
                  </IconButton>
                </Stack>
              </Box>
            );
          })}
          {dayTasks.length > 3 && (
            <Typography variant="caption" color="primary" sx={{ fontSize: 10, cursor: 'pointer' }}>
              +{dayTasks.length - 3} more
            </Typography>
          )}
        </Stack>
      </Box>
    );
  };

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
          Calendar
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <ButtonGroup size="small" variant="outlined">
            <Button
              variant={viewMode === 'month' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
            <Button
              variant={viewMode === 'week' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'day' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
          </ButtonGroup>
          <IconButton onClick={() => navigate(-1)}>
            <Iconify icon="solar:alt-arrow-left-bold" />
          </IconButton>
          <Button size="small" onClick={goToday}>
            Today
          </Button>
          <IconButton onClick={() => navigate(1)}>
            <Iconify icon="solar:alt-arrow-right-bold" />
          </IconButton>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{ minWidth: 150, textAlign: 'center' }}
          >
            {viewMode === 'day'
              ? currentDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : viewMode === 'week'
                ? `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                : `${MONTHS[month]} ${year}`}
          </Typography>
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
        </Stack>
      </Stack>

      {/* Month View */}
      {viewMode === 'month' && (
        <Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
            {DAYS.map((day) => (
              <Box
                key={day}
                sx={{ p: 1, textAlign: 'center', bgcolor: 'background.neutral', fontWeight: 600 }}
              >
                <Typography variant="caption">{day}</Typography>
              </Box>
            ))}
            {monthGrid.map((cell, i) => {
              const cellMonth = cell.month < 0 ? 11 : cell.month > 11 ? 0 : cell.month;
              const cellYear = cell.month < 0 ? year - 1 : cell.month > 11 ? year + 1 : year;
              const dateStr = formatDateStr(cellYear, cellMonth, cell.day);
              const isToday = dateStr === todayStr;
              return <Box key={i}>{renderDayCell(dateStr, isToday, cell.isOther)}</Box>;
            })}
          </Box>
        </Box>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
          {weekDates.map((d, i) => {
            const dateStr = d.toISOString().split('T')[0];
            const isToday = dateStr === todayStr;
            return (
              <Box key={i}>
                <Box
                  sx={{
                    p: 1,
                    textAlign: 'center',
                    bgcolor: isToday ? 'primary.lighter' : 'background.neutral',
                  }}
                >
                  <Typography variant="caption" fontWeight={isToday ? 700 : 400}>
                    {DAYS[d.getDay()]} {d.getDate()}
                  </Typography>
                </Box>
                {renderDayCell(dateStr, isToday, false)}
              </Box>
            );
          })}
        </Box>
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <Box>
          {(() => {
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayTasks = getTasksForDate(dateStr);
            return (
              <Box sx={{ minHeight: 400, p: 2 }}>
                {dayTasks.length === 0 ? (
                  <Stack alignItems="center" justifyContent="center" sx={{ height: 300 }}>
                    <Iconify
                      icon="solar:calendar-bold-duotone"
                      width={64}
                      sx={{ color: 'text.disabled', mb: 2 }}
                    />
                    <Typography variant="body1" color="text.secondary">
                      No tasks due on this day
                    </Typography>
                    <Button
                      startIcon={<Iconify icon="solar:add-circle-bold" />}
                      sx={{ mt: 1 }}
                      onClick={() => {
                        setQuickCreateDate(dateStr);
                        setQuickTitle('');
                      }}
                    >
                      Create Task
                    </Button>
                  </Stack>
                ) : (
                  <Stack spacing={1}>
                    {dayTasks.map((task) => {
                      const status = getStatusById(task.status_id);
                      const priority = PRIORITY_OPTIONS.find((p) => p.value === task.priority);
                      return (
                        <Box
                          key={task.id}
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            borderLeft: `4px solid ${priority?.color}`,
                            '&:hover': { bgcolor: 'action.hover' },
                            cursor: 'pointer',
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body1" fontWeight={600}>
                              {task.title}
                            </Typography>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Chip
                                label={status?.name}
                                size="small"
                                sx={{ bgcolor: `${status?.color}20`, color: status?.color }}
                              />
                              <Chip
                                label={priority?.label}
                                size="small"
                                sx={{ bgcolor: `${priority?.color}20`, color: priority?.color }}
                              />
                              <IconButton size="small" onClick={() => openEdit(task)}>
                                <Iconify icon="solar:pen-bold" width={16} />
                              </IconButton>
                              <IconButton size="small" onClick={() => setDeleteId(task.id)}>
                                <Iconify
                                  icon="solar:trash-bin-trash-bold"
                                  width={16}
                                  sx={{ color: 'error.main' }}
                                />
                              </IconButton>
                            </Stack>
                          </Stack>
                          {task.description && (
                            <Typography variant="body2" color="text.secondary" mt={0.5}>
                              {task.description}
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            );
          })()}
        </Box>
      )}

      {/* Quick Create Dialog */}
      <Dialog
        open={Boolean(quickCreateDate)}
        onClose={() => setQuickCreateDate(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Create Task for {quickCreateDate}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Task Title"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            sx={{ mt: 1 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleQuickCreate();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickCreateDate(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleQuickCreate}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Task Detail Dialog */}
      {selectedTask && (
        <Dialog open onClose={() => setSelectedTask(null)} maxWidth="sm" fullWidth>
          <DialogTitle>{selectedTask.title}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={1}>
              {selectedTask.description || 'No description'}
            </Typography>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1}>
                <Chip
                  label={getStatusById(selectedTask.status_id || selectedTask.status)?.name}
                  size="small"
                />
                <Chip
                  label={PRIORITY_OPTIONS.find((p) => p.value === selectedTask.priority)?.label}
                  size="small"
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Due: {selectedTask.due_date}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Assignees:{' '}
                {(selectedTask.assignees || [])
                  .map((assignee) => getAssigneeName(assignee))
                  .filter(Boolean)
                  .join(', ')}
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedTask(null)}>Close</Button>
          </DialogActions>
        </Dialog>
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
      </Dialog>
    </Box>
  );
}
