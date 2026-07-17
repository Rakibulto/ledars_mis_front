'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AvatarGroup from '@mui/material/AvatarGroup';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

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

export default function ListView() {
  const { data: rawTasks, loading: tasksLoading, error: tasksError } = useGetRequest(EP.tasks);
  const { data: rawStatuses } = useGetRequest(EP.statuses);
  const { data: rawUsers } = useGetRequest('/api/employees/');
  const { data: rawLists } = useGetRequest(EP.lists);

  const allTasks = useMemo(
    () => (Array.isArray(rawTasks) ? rawTasks : rawTasks?.results || []),
    [rawTasks]
  );
  const statuses = useMemo(
    () => (Array.isArray(rawStatuses) ? rawStatuses : rawStatuses?.results || []),
    [rawStatuses]
  );
  const users = useMemo(
    () => (Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || []),
    [rawUsers]
  );
  const lists = useMemo(
    () => (Array.isArray(rawLists) ? rawLists : rawLists?.results || []),
    [rawLists]
  );

  const getUserById = useCallback((id) => users.find((u) => u.id === id), [users]);
  const getStatusById = (id) => statuses.find((s) => s.id === id);
  const getListById = (id) => lists.find((l) => l.id === id);
  const getAssigneeId = useCallback(
    (assignee) => (typeof assignee === 'object' ? assignee?.id : assignee),
    []
  );
  const getAssigneeName = useCallback(
    (assignee) => {
      if (typeof assignee === 'object') return assignee?.name || assignee?.email || 'Unknown';
      return getUserById(assignee)?.name || getUserById(assignee)?.first_name || 'Unknown';
    },
    [getUserById]
  );

  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('status');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterList, setFilterList] = useState('all');
  const [selected, setSelected] = useState([]);
  const [collapsed, setCollapsed] = useState({});
  const [sortField, setSortField] = useState('position');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [editingTask, setEditingTask] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteId, setDeleteId] = useState(null);

  const { trigger: doEdit, isMutating: editing } = usePatchMutation(
    editId ? EP.task_by_id(editId) : null,
    editForm
  );
  const { trigger: doDelete, isMutating: deleting } = useDeleteMutation(
    deleteId ? EP.task_by_id(deleteId) : null
  );

  const parentTasks = useMemo(() => allTasks.filter((t) => !t.parent_id && !t.parent), [allTasks]);

  const filtered = useMemo(() => {
    let result = [...parentTasks];
    if (search)
      result = result.filter(
        (t) =>
          (t.title || '').toLowerCase().includes(search.toLowerCase()) ||
          (t.task_id || '').toLowerCase().includes(search.toLowerCase())
      );
    if (filterPriority !== 'all') result = result.filter((t) => t.priority === filterPriority);
    if (filterAssignee !== 'all')
      result = result.filter((t) =>
        (t.assignees || []).some((assignee) => getAssigneeId(assignee) === Number(filterAssignee))
      );
    if (filterList !== 'all')
      result = result.filter((t) => (t.list_id || t.list) === Number(filterList));
    // Sort
    result.sort((a, b) => {
      let va;
      let vb;
      if (sortField === 'title') {
        va = a.title;
        vb = b.title;
      } else if (sortField === 'priority') {
        const order = { urgent: 0, high: 1, normal: 2, low: 3, none: 4 };
        va = order[a.priority];
        vb = order[b.priority];
      } else if (sortField === 'due_date') {
        va = a.due_date || '9999';
        vb = b.due_date || '9999';
      } else if (sortField === 'status') {
        va = a.status_id || a.status;
        vb = b.status_id || b.status;
      } else if (sortField === 'story_points') {
        va = a.story_points;
        vb = b.story_points;
      } else {
        va = a.position;
        vb = b.position;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [
    parentTasks,
    search,
    filterPriority,
    filterAssignee,
    filterList,
    sortField,
    sortDir,
    getAssigneeId,
  ]);

  const groups = useMemo(() => {
    if (groupBy === 'none')
      return [{ key: 'all', label: 'All Tasks', color: '#3b82f6', tasks: filtered }];
    if (groupBy === 'status') {
      return statuses
        .map((s) => ({
          key: s.id,
          label: s.name,
          color: s.color || '#3b82f6',
          tasks: filtered.filter((t) => (t.status_id || t.status) === s.id),
        }))
        .filter((g) => g.tasks.length > 0);
    }
    if (groupBy === 'priority') {
      return PRIORITY_OPTIONS.map((p) => ({
        key: p.value,
        label: p.label,
        color: p.color,
        tasks: filtered.filter((t) => t.priority === p.value),
      })).filter((g) => g.tasks.length > 0);
    }
    if (groupBy === 'list') {
      return lists
        .map((l) => ({
          key: l.id,
          label: l.name,
          color: '#3b82f6',
          tasks: filtered.filter((t) => (t.list_id || t.list) === l.id),
        }))
        .filter((g) => g.tasks.length > 0);
    }
    if (groupBy === 'assignee') {
      const grouped = {};
      filtered.forEach((t) => {
        (t.assignees || []).forEach((assignee) => {
          const assigneeId = getAssigneeId(assignee);
          if (!grouped[assigneeId])
            grouped[assigneeId] = {
              key: assigneeId,
              label: getAssigneeName(assignee),
              color: '#8b5cf6',
              tasks: [],
            };
          grouped[assigneeId].tasks.push(t);
        });
        if (!t.assignees || t.assignees.length === 0) {
          if (!grouped[0])
            grouped[0] = { key: 0, label: 'Unassigned', color: '#9ca3af', tasks: [] };
          grouped[0].tasks.push(t);
        }
      });
      return Object.values(grouped);
    }
    return [];
  }, [groupBy, filtered, statuses, lists, getAssigneeId, getAssigneeName]);

  const toggleCollapse = (key) => setCollapsed((p) => ({ ...p, [key]: !p[key] }));
  const toggleSelect = (id) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleSelectAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((t) => t.id));
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const renderSortIcon = (field) => (
    <IconButton size="small" onClick={() => handleSort(field)} sx={{ ml: 0.5 }}>
      <Iconify
        icon={
          sortField === field
            ? sortDir === 'asc'
              ? 'solar:alt-arrow-up-bold'
              : 'solar:alt-arrow-down-bold'
            : 'solar:sort-bold'
        }
        width={14}
        sx={{ color: sortField === field ? 'primary.main' : 'text.disabled' }}
      />
    </IconButton>
  );

  const handleInlineEdit = (taskId) => {
    const task = parentTasks.find((t) => t.id === taskId);
    if (task) {
      setEditingTask(taskId);
      setEditValue(task.title);
    }
  };

  const saveInlineEdit = async () => {
    if (!editingTask) return;

    const nextTitle = editValue.trim();
    const currentTask = parentTasks.find((task) => task.id === editingTask);

    if (!nextTitle || currentTask?.title === nextTitle) {
      setEditingTask(null);
      setEditValue('');
      return;
    }

    try {
      await patchRequest(EP.task_by_id(editingTask), { title: nextTitle });
      mutate(EP.tasks);
      toast.success('Task renamed');
      setEditingTask(null);
      setEditValue('');
    } catch {
      toast.error('Failed to rename task');
    }
  };

  const openEdit = (task) => {
    setEditId(task.id);
    setEditForm({
      title: task.title,
      description: task.description || '',
      status: task.status_id || task.status,
      priority: task.priority,
      due_date: task.due_date || '',
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

  const handleBulkAction = async (action) => {
    const payload = { task_ids: selected };

    if (action === 'done') {
      payload.action = 'mark_done';
    } else if (action === 'high') {
      payload.action = 'set_priority';
      payload.priority = 'high';
    } else if (action === 'delete') {
      payload.action = 'delete';
    }

    try {
      await createRequest(EP.task_bulk_update, payload);
      mutate(EP.tasks);
      toast.success('Tasks updated');
      setSelected([]);
    } catch {
      toast.error('Failed to update selected tasks');
    } finally {
      setBulkMenuAnchor(null);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (tasksLoading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  if (tasksError)
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load tasks.
      </Alert>
    );

  return (
    <Box>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        flexWrap="wrap"
        gap={1}
      >
        <Typography variant="h5" fontWeight={700}>
          List View
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <Iconify
                  icon="solar:magnifer-line-duotone"
                  sx={{ mr: 1, color: 'text.disabled' }}
                />
              ),
            }}
            sx={{ width: 200 }}
          />
          <TextField
            select
            size="small"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            label="Group"
            sx={{ minWidth: 100 }}
          >
            <MenuItem value="none">None</MenuItem>
            <MenuItem value="status">Status</MenuItem>
            <MenuItem value="priority">Priority</MenuItem>
            <MenuItem value="list">List</MenuItem>
            <MenuItem value="assignee">Assignee</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            value={filterPriority}
            onChange={(e) => {
              setFilterPriority(e.target.value);
              setPage(0);
            }}
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
          <TextField
            select
            size="small"
            value={filterAssignee}
            onChange={(e) => {
              setFilterAssignee(e.target.value);
              setPage(0);
            }}
            label="Assignee"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">All</MenuItem>
            {users.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.name || u.first_name || 'User'}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            value={filterList}
            onChange={(e) => {
              setFilterList(e.target.value);
              setPage(0);
            }}
            label="List"
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="all">All Lists</MenuItem>
            {lists.map((l) => (
              <MenuItem key={l.id} value={l.id}>
                {l.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Stack>

      {/* Bulk Actions Bar */}
      {selected.length > 0 && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          mb={1}
          p={1}
          sx={{ bgcolor: 'primary.lighter', borderRadius: 1 }}
        >
          <Typography variant="body2" fontWeight={600}>
            {selected.length} selected
          </Typography>
          <Button
            size="small"
            onClick={(e) => setBulkMenuAnchor(e.currentTarget)}
            startIcon={<Iconify icon="solar:menu-dots-bold" />}
          >
            Actions
          </Button>
          <Button size="small" onClick={() => setSelected([])}>
            Clear
          </Button>
          <Menu
            anchorEl={bulkMenuAnchor}
            open={Boolean(bulkMenuAnchor)}
            onClose={() => setBulkMenuAnchor(null)}
          >
            <MenuItem onClick={() => handleBulkAction('done')}>
              <Iconify icon="solar:check-circle-bold" sx={{ mr: 1, color: 'success.main' }} /> Mark
              Done
            </MenuItem>
            <MenuItem onClick={() => handleBulkAction('high')}>
              <Iconify icon="solar:arrow-up-bold" sx={{ mr: 1, color: 'warning.main' }} /> Set High
              Priority
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleBulkAction('delete')} sx={{ color: 'error.main' }}>
              <Iconify icon="solar:trash-bin-trash-bold" sx={{ mr: 1 }} /> Delete
            </MenuItem>
          </Menu>
        </Stack>
      )}

      {/* Column Headers */}
      <Stack
        direction="row"
        alignItems="center"
        px={1}
        py={0.5}
        sx={{ bgcolor: 'background.neutral', borderRadius: 1, mb: 0.5 }}
      >
        <Checkbox
          size="small"
          checked={selected.length === filtered.length && filtered.length > 0}
          indeterminate={selected.length > 0 && selected.length < filtered.length}
          onChange={toggleSelectAll}
        />
        <Box flex={1} minWidth={200}>
          <Stack direction="row" alignItems="center">
            <Typography variant="caption" fontWeight={600}>
              TASK
            </Typography>
            {renderSortIcon('title')}
          </Stack>
        </Box>
        <Box width={110}>
          <Stack direction="row" alignItems="center">
            <Typography variant="caption" fontWeight={600}>
              STATUS
            </Typography>
            {renderSortIcon('status')}
          </Stack>
        </Box>
        <Box width={90}>
          <Stack direction="row" alignItems="center">
            <Typography variant="caption" fontWeight={600}>
              PRIORITY
            </Typography>
            {renderSortIcon('priority')}
          </Stack>
        </Box>
        <Box width={100}>
          <Stack direction="row" alignItems="center">
            <Typography variant="caption" fontWeight={600}>
              DUE DATE
            </Typography>
            {renderSortIcon('due_date')}
          </Stack>
        </Box>
        <Box width={100}>
          <Typography variant="caption" fontWeight={600}>
            ASSIGNEES
          </Typography>
        </Box>
        <Box width={60}>
          <Stack direction="row" alignItems="center">
            <Typography variant="caption" fontWeight={600}>
              SP
            </Typography>
            {renderSortIcon('story_points')}
          </Stack>
        </Box>
        <Box width={80}>
          <Typography variant="caption" fontWeight={600}>
            PROGRESS
          </Typography>
        </Box>
        <Box width={80}>
          <Typography variant="caption" fontWeight={600}>
            ACTIONS
          </Typography>
        </Box>
      </Stack>

      {/* Groups + Tasks */}
      {groups.map((group) => (
        <Box key={group.key} mb={1}>
          {groupBy !== 'none' && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              px={1}
              py={0.5}
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderRadius: 0.5 }}
              onClick={() => toggleCollapse(group.key)}
            >
              <Iconify
                icon={
                  collapsed[group.key] ? 'solar:alt-arrow-right-bold' : 'solar:alt-arrow-down-bold'
                }
                width={16}
              />
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: group.color }} />
              <Typography variant="body2" fontWeight={600}>
                {group.label}
              </Typography>
              <Chip label={group.tasks.length} size="small" sx={{ height: 18, fontSize: 10 }} />
            </Stack>
          )}
          <Collapse in={!collapsed[group.key]}>
            {group.tasks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((task) => {
              const status = getStatusById(task.status_id);
              const priority = PRIORITY_OPTIONS.find((p) => p.value === task.priority);
              const list = getListById(task.list_id);
              const isOverdue =
                task.due_date && task.due_date < today && ![4, 5].includes(task.status_id);
              return (
                <Stack
                  key={task.id}
                  direction="row"
                  alignItems="center"
                  px={1}
                  py={0.75}
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover' },
                    cursor: 'pointer',
                    transition: '0.1s',
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={selected.includes(task.id)}
                    onChange={() => toggleSelect(task.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Box flex={1} minWidth={200}>
                    {editingTask === task.id ? (
                      <TextField
                        size="small"
                        fullWidth
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveInlineEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveInlineEdit();
                          if (e.key === 'Escape') {
                            setEditingTask(null);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Typography variant="caption" color="text.disabled" sx={{ minWidth: 55 }}>
                          {task.task_id}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          onDoubleClick={() => handleInlineEdit(task.id)}
                          sx={{ '&:hover': { textDecoration: 'underline' } }}
                        >
                          {task.title}
                        </Typography>
                        {task.subtask_count > 0 && (
                          <Chip
                            size="small"
                            label={`${task.subtask_done}/${task.subtask_count}`}
                            sx={{ height: 18, fontSize: 10 }}
                          />
                        )}
                        {task.is_recurring && (
                          <Tooltip title="Recurring">
                            <Iconify
                              icon="solar:refresh-bold"
                              width={14}
                              sx={{ color: 'info.main' }}
                            />
                          </Tooltip>
                        )}
                        {task.dependencies?.length > 0 && (
                          <Tooltip title="Has dependencies">
                            <Iconify
                              icon="solar:link-bold"
                              width={14}
                              sx={{ color: 'warning.main' }}
                            />
                          </Tooltip>
                        )}
                      </Stack>
                    )}
                  </Box>
                  <Box width={110}>
                    <Chip
                      label={status?.name}
                      size="small"
                      sx={{
                        bgcolor: `${status?.color}20`,
                        color: status?.color,
                        fontWeight: 600,
                        fontSize: 11,
                        height: 22,
                      }}
                    />
                  </Box>
                  <Box width={90}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Box
                        sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: priority?.color }}
                      />
                      <Typography variant="caption">{priority?.label}</Typography>
                    </Stack>
                  </Box>
                  <Box width={100}>
                    <Typography
                      variant="caption"
                      color={isOverdue ? 'error' : 'text.secondary'}
                      fontWeight={isOverdue ? 600 : 400}
                    >
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </Typography>
                  </Box>
                  <Box width={100}>
                    <AvatarGroup
                      max={3}
                      sx={{
                        justifyContent: 'flex-start',
                        '& .MuiAvatar-root': { width: 24, height: 24, fontSize: 11 },
                      }}
                    >
                      {(task.assignees || []).map((assignee) => {
                        const assigneeId = getAssigneeId(assignee);
                        const assigneeName = getAssigneeName(assignee);
                        return (
                          <Avatar key={assigneeId} sx={{ bgcolor: 'primary.main' }}>
                            {assigneeName?.charAt(0)}
                          </Avatar>
                        );
                      })}
                    </AvatarGroup>
                  </Box>
                  <Box width={60}>
                    <Typography variant="caption">{task.story_points || '—'}</Typography>
                  </Box>
                  <Box width={80}>
                    {task.checklist_count > 0 ? (
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <LinearProgress
                          variant="determinate"
                          value={(task.checklist_done / task.checklist_count) * 100}
                          sx={{ flex: 1, height: 4, borderRadius: 2 }}
                        />
                        <Typography variant="caption" sx={{ fontSize: 10 }}>
                          {Math.round((task.checklist_done / task.checklist_count) * 100)}%
                        </Typography>
                      </Stack>
                    ) : (
                      '—'
                    )}
                  </Box>
                  <Box width={80}>
                    <Stack direction="row" spacing={0.25}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(task);
                        }}
                      >
                        <Iconify icon="solar:pen-bold" width={18} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(task.id);
                        }}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                      </IconButton>
                    </Stack>
                  </Box>
                </Stack>
              );
            })}
          </Collapse>
        </Box>
      ))}

      {/* Edit Dialog */}
      <Dialog open={Boolean(editId)} onClose={() => setEditId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}
        >
          <TextField
            label="Title"
            fullWidth
            value={editForm.title || ''}
            onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={editForm.description || ''}
            onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
          />
          <TextField
            select
            label="Status"
            fullWidth
            value={editForm.status || ''}
            onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
          >
            {statuses.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Priority"
            fullWidth
            value={editForm.priority || ''}
            onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value }))}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <MenuItem key={p.value} value={p.value}>
                {p.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Due Date"
            type="date"
            fullWidth
            value={editForm.due_date || ''}
            onChange={(e) => setEditForm((f) => ({ ...f, due_date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditId(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={editing}>
            {editing ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
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

      {/* Pagination */}
      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />
    </Box>
  );
}
