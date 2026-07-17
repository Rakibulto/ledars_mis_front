'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import AvatarGroup from '@mui/material/AvatarGroup';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  usePatchRequest as patchRequest,
  useCreateRequest as createRequest,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

import { PRIORITY_OPTIONS } from '../constants';

const EP = endpoints.pm;

export default function BoardView() {
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('status');
  const [filterPriority, setFilterPriority] = useState('all');
  const [dragging, setDragging] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [cardSize, setCardSize] = useState('normal');
  const [swimlane, setSwimlane] = useState('none');
  const [showWip, setShowWip] = useState(false);
  const [quickAddCol, setQuickAddCol] = useState(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteId, setDeleteId] = useState(null);

  const { data: rawTasks } = useGetRequest(EP.tasks);
  const { data: rawStatuses } = useGetRequest(EP.statuses);
  const { data: rawUsers } = useGetRequest('/api/employees/');
  const { data: rawTags } = useGetRequest(EP.tags);
  const { data: rawLists } = useGetRequest(EP.lists);

  const TASKS = useMemo(
    () =>
      (Array.isArray(rawTasks) ? rawTasks : rawTasks?.results || []).filter(
        (t) => !t.parent_id && !t.parent
      ),
    [rawTasks]
  );
  const STATUSES = useMemo(
    () => (Array.isArray(rawStatuses) ? rawStatuses : rawStatuses?.results || []),
    [rawStatuses]
  );
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];
  const TAGS = Array.isArray(rawTags) ? rawTags : rawTags?.results || [];
  const LISTS = Array.isArray(rawLists) ? rawLists : rawLists?.results || [];

  const getUserById = (id) => USERS.find((u) => u.id === id);
  const getListById = (id) => LISTS.find((l) => l.id === id);
  const getTaskListId = (task) => task?.list_id || task?.list;
  const getAssigneeId = (assignee) => (typeof assignee === 'object' ? assignee?.id : assignee);
  const getAssigneeName = (assignee) => {
    if (typeof assignee === 'object') return assignee?.name || assignee?.email || '';
    return getUserById(assignee)?.name || getUserById(assignee)?.email || '';
  };
  const getTagMeta = (tag) =>
    typeof tag === 'object' ? tag : TAGS.find((item) => item.id === tag);

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openEdit = (task) => {
    setEditId(task.id);
    setEditForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date || '',
    });
  };
  const handleEdit = async () => {
    try {
      setEditing(true);
      await patchRequest(EP.task_by_id(editId), editForm);
      mutate(EP.tasks);
      toast.success('Task updated');
      setEditId(null);
    } catch {
      toast.error('Update failed');
    } finally {
      setEditing(false);
    }
  };
  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteRequest(EP.task_by_id(deleteId));
      mutate(EP.tasks);
      toast.success('Task deleted');
      setDeleteId(null);
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const [filterAssignee, setFilterAssignee] = useState('all');

  const filtered = useMemo(() => {
    let result = TASKS;
    if (search) result = result.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
    if (filterPriority !== 'all') result = result.filter((t) => t.priority === filterPriority);
    if (filterAssignee !== 'all')
      result = result.filter((t) =>
        (t.assignees || []).some((assignee) => getAssigneeId(assignee) === Number(filterAssignee))
      );
    return result;
  }, [TASKS, search, filterPriority, filterAssignee]);

  const columns = useMemo(() => {
    if (groupBy === 'status') {
      return STATUSES.map((s) => ({
        id: s.id,
        title: s.name,
        color: s.color || '#888',
        tasks: filtered.filter((t) => (t.status_id || t.status) === s.id),
        wipLimit: showWip ? (s.position === 2 ? 5 : s.position === 3 ? 3 : 0) : 0,
      }));
    }
    if (groupBy === 'priority') {
      return PRIORITY_OPTIONS.map((p) => ({
        id: p.value,
        title: p.label,
        color: p.color,
        tasks: filtered.filter((t) => t.priority === p.value),
        wipLimit: 0,
      }));
    }
    return [];
  }, [groupBy, filtered, showWip, STATUSES]);

  const handleDragStart = (taskId) => setDragging(taskId);
  const handleDragOver = (e, colId) => {
    e.preventDefault();
    setDragOverCol(colId);
  };
  const handleDrop = async (colId) => {
    if (!dragging) return;
    try {
      if (groupBy === 'status') {
        await patchRequest(EP.task_move(dragging), { status_id: colId });
      } else {
        await patchRequest(EP.task_by_id(dragging), { priority: colId });
      }
      mutate(EP.tasks);
      toast.success('Task updated');
    } catch {
      toast.error('Failed to update task');
    }
    setDragging(null);
    setDragOverCol(null);
  };
  const handleDragEnd = () => {
    setDragging(null);
    setDragOverCol(null);
  };

  const handleQuickAdd = async (colId) => {
    if (!quickAddTitle.trim()) return;
    const column = columns.find((item) => item.id === colId);
    const inferredListId =
      column?.tasks?.map(getTaskListId).find(Boolean) || TASKS.map(getTaskListId).find(Boolean);

    if (!inferredListId) {
      toast.error('A list is required before creating tasks from the board');
      return;
    }

    try {
      if (groupBy === 'status') {
        await createRequest(EP.task_quick_add, {
          title: quickAddTitle.trim(),
          list_id: inferredListId,
          status_id: colId,
        });
      } else {
        await createRequest(EP.tasks, {
          title: quickAddTitle.trim(),
          list: inferredListId,
          status: STATUSES[0]?.id,
          priority: colId,
        });
      }
      mutate(EP.tasks);
      toast.success('Task created');
      setQuickAddTitle('');
      setQuickAddCol(null);
    } catch {
      toast.error('Failed to create task');
    }
  };

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
          Board View
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            label="Group by"
            sx={{ minWidth: 110 }}
          >
            <MenuItem value="status">Status</MenuItem>
            <MenuItem value="priority">Priority</MenuItem>
          </TextField>
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
          <TextField
            select
            size="small"
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            label="Assignee"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">All</MenuItem>
            {USERS.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.name}
              </MenuItem>
            ))}
          </TextField>
          <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
            <Iconify icon="solar:settings-bold" />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
          >
            <MenuItem
              onClick={() => {
                setCardSize('compact');
                setMenuAnchor(null);
              }}
            >
              <Iconify icon="solar:minimize-bold" sx={{ mr: 1 }} /> Compact Cards
            </MenuItem>
            <MenuItem
              onClick={() => {
                setCardSize('normal');
                setMenuAnchor(null);
              }}
            >
              <Iconify icon="solar:card-bold" sx={{ mr: 1 }} /> Normal Cards
            </MenuItem>
            <MenuItem
              onClick={() => {
                setCardSize('detailed');
                setMenuAnchor(null);
              }}
            >
              <Iconify icon="solar:document-text-bold" sx={{ mr: 1 }} /> Detailed Cards
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                setShowWip(!showWip);
                setMenuAnchor(null);
              }}
            >
              <Iconify
                icon={showWip ? 'solar:check-circle-bold' : 'solar:close-circle-bold'}
                sx={{ mr: 1 }}
              />{' '}
              WIP Limits
            </MenuItem>
          </Menu>
        </Stack>
      </Stack>

      {/* Board Columns */}
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, minHeight: '70vh' }}>
        {columns.map((col) => {
          const isOver = dragOverCol === col.id;
          const isWipExceeded = col.wipLimit > 0 && col.tasks.length >= col.wipLimit;
          return (
            <Box
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDrop={() => handleDrop(col.id)}
              sx={{
                minWidth: 280,
                maxWidth: 320,
                flex: '0 0 300px',
                bgcolor: isOver ? `${col.color}10` : 'background.neutral',
                borderRadius: 2,
                border: isOver ? `2px dashed ${col.color}` : '2px solid transparent',
                transition: '0.2s',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Column Header */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                p={1.5}
                pb={1}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: col.color }} />
                  <Typography variant="subtitle2" fontWeight={700}>
                    {col.title}
                  </Typography>
                  <Chip
                    label={col.tasks.length}
                    size="small"
                    sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                  />
                  {col.wipLimit > 0 && (
                    <Chip
                      label={`WIP: ${col.wipLimit}`}
                      size="small"
                      color={isWipExceeded ? 'error' : 'default'}
                      sx={{ height: 20, fontSize: 10 }}
                    />
                  )}
                </Stack>
                <Stack direction="row">
                  <IconButton
                    size="small"
                    onClick={() => setQuickAddCol(quickAddCol === col.id ? null : col.id)}
                  >
                    <Iconify icon="solar:add-circle-line-duotone" width={18} />
                  </IconButton>
                </Stack>
              </Stack>

              {/* Quick Add */}
              <Collapse in={quickAddCol === col.id}>
                <Box px={1.5} pb={1}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Task name..."
                    value={quickAddCol === col.id ? quickAddTitle : ''}
                    onChange={(e) => setQuickAddTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleQuickAdd(col.id);
                      if (e.key === 'Escape') setQuickAddCol(null);
                    }}
                    autoFocus
                  />
                  <Stack direction="row" spacing={0.5} mt={0.5}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleQuickAdd(col.id)}
                      sx={{ fontSize: 11 }}
                    >
                      Add
                    </Button>
                    <Button size="small" onClick={() => setQuickAddCol(null)} sx={{ fontSize: 11 }}>
                      Cancel
                    </Button>
                  </Stack>
                </Box>
              </Collapse>

              {/* Task Cards */}
              <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, pb: 1.5 }}>
                <Stack spacing={1}>
                  {col.tasks.map((task) => {
                    const priority = PRIORITY_OPTIONS.find((p) => p.value === task.priority);
                    const list = getListById(task.list_id);
                    const isOverdue =
                      task.due_date &&
                      task.due_date < new Date().toISOString().split('T')[0] &&
                      ![4, 5].includes(task.status_id || task.status);
                    return (
                      <Card
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task.id)}
                        onDragEnd={handleDragEnd}
                        sx={{
                          cursor: 'grab',
                          opacity: dragging === task.id ? 0.4 : 1,
                          '&:hover': { boxShadow: 4, transform: 'translateY(-1px)' },
                          transition: '0.15s',
                          borderLeft: `3px solid ${priority?.color || '#ccc'}`,
                        }}
                      >
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          {/* Tags */}
                          {(task.tags || []).length > 0 && cardSize !== 'compact' && (
                            <Stack direction="row" spacing={0.5} mb={0.5} flexWrap="wrap">
                              {task.tags.map((tagItem) => {
                                const tag = getTagMeta(tagItem);
                                const tagId = typeof tagItem === 'object' ? tagItem.id : tagItem;
                                return tag ? (
                                  <Chip
                                    key={tagId}
                                    label={tag.name}
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: 10,
                                      bgcolor: `${tag.color}20`,
                                      color: tag.color,
                                    }}
                                  />
                                ) : null;
                              })}
                            </Stack>
                          )}

                          {/* Title + Actions */}
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                          >
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{ mb: 0.5, lineHeight: 1.3, flex: 1 }}
                            >
                              {task.title}
                            </Typography>
                            <Stack direction="row" spacing={0}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(task);
                                }}
                                sx={{ p: 0.25 }}
                              >
                                <Iconify icon="solar:pen-bold" width={14} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteId(task.id);
                                }}
                                sx={{ p: 0.25, color: 'error.main' }}
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" width={14} />
                              </IconButton>
                            </Stack>
                          </Stack>

                          {/* Task ID + List */}
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={cardSize === 'compact' ? 0 : 0.5}
                          >
                            <Typography variant="caption" color="text.disabled">
                              {task.task_id}
                            </Typography>
                            {list && cardSize !== 'compact' && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                noWrap
                                sx={{ maxWidth: 120 }}
                              >
                                {list.name}
                              </Typography>
                            )}
                          </Stack>

                          {/* Details (normal/detailed mode) */}
                          {cardSize !== 'compact' && (
                            <>
                              {/* Progress */}
                              {task.checklist_count > 0 && (
                                <Stack direction="row" alignItems="center" spacing={0.5} mb={0.5}>
                                  <Iconify
                                    icon="solar:checklist-bold"
                                    width={14}
                                    sx={{ color: 'text.secondary' }}
                                  />
                                  <LinearProgress
                                    variant="determinate"
                                    value={(task.checklist_done / task.checklist_count) * 100}
                                    sx={{ flex: 1, height: 4, borderRadius: 2 }}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    {task.checklist_done}/{task.checklist_count}
                                  </Typography>
                                </Stack>
                              )}

                              {/* Subtasks */}
                              {task.subtask_count > 0 && (
                                <Stack direction="row" alignItems="center" spacing={0.5} mb={0.5}>
                                  <Iconify
                                    icon="solar:layers-bold"
                                    width={14}
                                    sx={{ color: 'text.secondary' }}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    {task.subtask_done}/{task.subtask_count} subtasks
                                  </Typography>
                                </Stack>
                              )}

                              {/* Detailed mode extras */}
                              {cardSize === 'detailed' && task.description && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: 'block', mb: 0.5, lineHeight: 1.3 }}
                                  noWrap
                                >
                                  {task.description}
                                </Typography>
                              )}

                              {/* Footer: Due date + meta + assignees */}
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                mt={0.5}
                              >
                                <Stack direction="row" spacing={1} alignItems="center">
                                  {task.due_date && (
                                    <Chip
                                      icon={<Iconify icon="solar:calendar-bold" width={12} />}
                                      label={new Date(task.due_date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                      size="small"
                                      color={isOverdue ? 'error' : 'default'}
                                      sx={{ height: 20, fontSize: 10 }}
                                    />
                                  )}
                                  {task.story_points > 0 && (
                                    <Chip
                                      label={`${task.story_points} SP`}
                                      size="small"
                                      sx={{ height: 20, fontSize: 10 }}
                                    />
                                  )}
                                  {task.comment_count > 0 && (
                                    <Stack direction="row" alignItems="center" spacing={0.3}>
                                      <Iconify
                                        icon="solar:chat-round-bold"
                                        width={12}
                                        sx={{ color: 'text.disabled' }}
                                      />
                                      <Typography variant="caption" color="text.disabled">
                                        {task.comment_count}
                                      </Typography>
                                    </Stack>
                                  )}
                                  {(task.attachment_count || task.attachments || 0) > 0 && (
                                    <Stack direction="row" alignItems="center" spacing={0.3}>
                                      <Iconify
                                        icon="solar:paperclip-bold"
                                        width={12}
                                        sx={{ color: 'text.disabled' }}
                                      />
                                      <Typography variant="caption" color="text.disabled">
                                        {task.attachment_count || task.attachments}
                                      </Typography>
                                    </Stack>
                                  )}
                                  {task.is_recurring && (
                                    <Tooltip title="Recurring task">
                                      <Iconify
                                        icon="solar:refresh-bold"
                                        width={14}
                                        sx={{ color: 'info.main' }}
                                      />
                                    </Tooltip>
                                  )}
                                  {task.dependencies?.length > 0 && (
                                    <Tooltip title={`${task.dependencies.length} dependencies`}>
                                      <Iconify
                                        icon="solar:link-bold"
                                        width={14}
                                        sx={{ color: 'warning.main' }}
                                      />
                                    </Tooltip>
                                  )}
                                </Stack>
                                <AvatarGroup
                                  max={3}
                                  sx={{
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
                              </Stack>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              </Box>
            </Box>
          );
        })}

        {/* Add Column */}
        <Box
          sx={{
            minWidth: 280,
            bgcolor: 'background.neutral',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed',
            borderColor: 'divider',
            cursor: 'pointer',
            '&:hover': { borderColor: 'primary.main' },
          }}
        >
          <Stack alignItems="center" spacing={1} sx={{ color: 'text.disabled' }}>
            <Iconify icon="solar:add-circle-line-duotone" width={32} />
            <Typography variant="body2">Add Column</Typography>
          </Stack>
        </Box>
      </Box>

      {/* Edit Task Dialog */}
      <Dialog open={Boolean(editId)} onClose={() => setEditId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Title"
              fullWidth
              value={editForm.title || ''}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={editForm.description || ''}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
            <TextField
              select
              label="Status"
              fullWidth
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
              label="Priority"
              fullWidth
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
              type="date"
              label="Due Date"
              fullWidth
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

      {/* Delete Task Dialog */}
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
    </Box>
  );
}
