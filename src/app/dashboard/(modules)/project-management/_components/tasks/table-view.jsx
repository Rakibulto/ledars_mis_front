'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AvatarGroup from '@mui/material/AvatarGroup';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import TableSortLabel from '@mui/material/TableSortLabel';
import LinearProgress from '@mui/material/LinearProgress';
import TablePagination from '@mui/material/TablePagination';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  usePatchMutation,
  useDeleteMutation,
  useCreateRequest as createRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

import { PRIORITY_OPTIONS } from '../constants';

const EP = endpoints.pm;

const COLUMNS = [
  { id: 'task_id', label: 'ID', width: 80 },
  { id: 'title', label: 'Title', minWidth: 200 },
  { id: 'status', label: 'Status', width: 120 },
  { id: 'priority', label: 'Priority', width: 100 },
  { id: 'assignees', label: 'Assignees', width: 120 },
  { id: 'due_date', label: 'Due Date', width: 110 },
  { id: 'start_date', label: 'Start Date', width: 110 },
  { id: 'story_points', label: 'Points', width: 70 },
  { id: 'time_estimate', label: 'Estimate', width: 80 },
  { id: 'tags', label: 'Tags', width: 150 },
  { id: 'list', label: 'List', width: 160 },
  { id: 'progress', label: 'Progress', width: 100 },
  { id: 'actions', label: 'Actions', width: 90 },
];

export default function TableView() {
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
  const STATUSES = Array.isArray(rawStatuses) ? rawStatuses : rawStatuses?.results || [];
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];
  const TAGS = Array.isArray(rawTags) ? rawTags : rawTags?.results || [];
  const LISTS = Array.isArray(rawLists) ? rawLists : rawLists?.results || [];

  const getUserById = (id) => USERS.find((u) => u.id === id);
  const getStatusById = (id) => STATUSES.find((s) => s.id === id);
  const getListById = (id) => LISTS.find((l) => l.id === id);
  const getAssigneeId = (assignee) => (typeof assignee === 'object' ? assignee?.id : assignee);
  const getAssigneeName = (assignee) => {
    if (typeof assignee === 'object') return assignee?.name || assignee?.email || '';
    return getUserById(assignee)?.name || getUserById(assignee)?.email || '';
  };
  const getTagMeta = (tag) =>
    typeof tag === 'object' ? tag : TAGS.find((item) => item.id === tag);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState('task_id');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [visibleCols, setVisibleCols] = useState(COLUMNS.map((c) => c.id));
  const [filterPriority, setFilterPriority] = useState('all');
  const [colMenuAnchor, setColMenuAnchor] = useState(null);
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

  const today = new Date().toISOString().split('T')[0];

  const filtered = useMemo(() => {
    let result = [...TASKS];
    if (search)
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.task_id.toLowerCase().includes(search.toLowerCase())
      );
    if (filterPriority !== 'all') result = result.filter((t) => t.priority === filterPriority);
    result.sort((a, b) => {
      let va;
      let vb;
      switch (orderBy) {
        case 'title':
          va = a.title;
          vb = b.title;
          break;
        case 'priority': {
          const o = { urgent: 0, high: 1, normal: 2, low: 3, none: 4 };
          va = o[a.priority];
          vb = o[b.priority];
          break;
        }
        case 'due_date':
          va = a.due_date || '9999';
          vb = b.due_date || '9999';
          break;
        case 'start_date':
          va = a.start_date || '9999';
          vb = b.start_date || '9999';
          break;
        case 'status':
          va = a.status_id;
          vb = b.status_id;
          break;
        case 'story_points':
          va = a.story_points;
          vb = b.story_points;
          break;
        case 'time_estimate':
          va = a.time_estimate;
          vb = b.time_estimate;
          break;
        default:
          va = a.task_id;
          vb = b.task_id;
      }
      if (va < vb) return order === 'asc' ? -1 : 1;
      if (va > vb) return order === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [TASKS, search, orderBy, order, filterPriority]);

  const handleSort = (col) => {
    if (orderBy === col) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else {
      setOrderBy(col);
      setOrder('asc');
    }
  };

  const toggleSelect = (id) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleSelectAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((t) => t.id));
  };

  const toggleCol = (colId) =>
    setVisibleCols((p) => (p.includes(colId) ? p.filter((c) => c !== colId) : [...p, colId]));

  const handleExportCSV = () => {
    const headers = COLUMNS.filter((c) => visibleCols.includes(c.id)).map((c) => c.label);
    const rows = filtered.map((t) => {
      const status = getStatusById(t.status_id);
      const priority = PRIORITY_OPTIONS.find((p) => p.value === t.priority);
      const list = getListById(t.list_id);
      return COLUMNS.filter((c) => visibleCols.includes(c.id)).map((c) => {
        switch (c.id) {
          case 'task_id':
            return t.task_id;
          case 'title':
            return t.title;
          case 'status':
            return status?.name || '';
          case 'priority':
            return priority?.label || '';
          case 'assignees':
            return (t.assignees || []).map((assignee) => getAssigneeName(assignee)).join(', ');
          case 'due_date':
            return t.due_date || '';
          case 'start_date':
            return t.start_date || '';
          case 'story_points':
            return t.story_points;
          case 'time_estimate':
            return t.time_estimate ? `${t.time_estimate}h` : '';
          case 'tags':
            return (t.tags || []).map((tagItem) => getTagMeta(tagItem)?.name || '').join(', ');
          case 'list':
            return list?.name || '';
          case 'progress':
            return t.checklist_count
              ? `${Math.round((t.checklist_done / t.checklist_count) * 100)}%`
              : '';
          default:
            return '';
        }
      });
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkAction = async (action) => {
    const payload = { task_ids: selected };

    if (action === 'done') {
      payload.action = 'mark_done';
    } else if (action === 'delete') {
      payload.action = 'delete';
    } else {
      setBulkMenuAnchor(null);
      return;
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

  const activeColumns = COLUMNS.filter((c) => visibleCols.includes(c.id));

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
          Table View
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search..."
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
            sx={{ width: 180 }}
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
          <Button
            size="small"
            variant="outlined"
            startIcon={<Iconify icon="solar:settings-bold" />}
            onClick={(e) => setColMenuAnchor(e.currentTarget)}
          >
            Columns
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Iconify icon="solar:export-bold" />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
          <Menu
            anchorEl={colMenuAnchor}
            open={Boolean(colMenuAnchor)}
            onClose={() => setColMenuAnchor(null)}
          >
            {COLUMNS.map((col) => (
              <MenuItem key={col.id} onClick={() => toggleCol(col.id)} dense>
                <Checkbox
                  size="small"
                  checked={visibleCols.includes(col.id)}
                  sx={{ p: 0, mr: 1 }}
                />
                {col.label}
              </MenuItem>
            ))}
          </Menu>
        </Stack>
      </Stack>

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
          <Button size="small" onClick={(e) => setBulkMenuAnchor(e.currentTarget)}>
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
            <MenuItem onClick={() => handleBulkAction('done')}>Mark Done</MenuItem>
            <MenuItem onClick={() => handleBulkAction('delete')} sx={{ color: 'error.main' }}>
              Delete
            </MenuItem>
          </Menu>
        </Stack>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  checked={selected.length === filtered.length && filtered.length > 0}
                  indeterminate={selected.length > 0 && selected.length < filtered.length}
                  onChange={toggleSelectAll}
                />
              </TableCell>
              {activeColumns.map((col) => (
                <TableCell
                  key={col.id}
                  sx={{ width: col.width, minWidth: col.minWidth, fontWeight: 600 }}
                >
                  <TableSortLabel
                    active={orderBy === col.id}
                    direction={orderBy === col.id ? order : 'asc'}
                    onClick={() => handleSort(col.id)}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((task) => {
              const status = getStatusById(task.status_id);
              const priority = PRIORITY_OPTIONS.find((p) => p.value === task.priority);
              const list = getListById(task.list_id);
              const isOverdue =
                task.due_date && task.due_date < today && ![4, 5].includes(task.status_id);
              return (
                <TableRow
                  key={task.id}
                  hover
                  selected={selected.includes(task.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={selected.includes(task.id)}
                      onChange={() => toggleSelect(task.id)}
                    />
                  </TableCell>
                  {visibleCols.includes('task_id') && (
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {task.task_id}
                      </Typography>
                    </TableCell>
                  )}
                  {visibleCols.includes('title') && (
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Typography variant="body2" fontWeight={500}>
                          {task.title}
                        </Typography>
                        {task.is_recurring && (
                          <Iconify
                            icon="solar:refresh-bold"
                            width={14}
                            sx={{ color: 'info.main' }}
                          />
                        )}
                        {task.dependencies?.length > 0 && (
                          <Iconify
                            icon="solar:link-bold"
                            width={14}
                            sx={{ color: 'warning.main' }}
                          />
                        )}
                      </Stack>
                    </TableCell>
                  )}
                  {visibleCols.includes('status') && (
                    <TableCell>
                      <Chip
                        label={status?.name}
                        size="small"
                        sx={{
                          bgcolor: `${status?.color}20`,
                          color: status?.color,
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      />
                    </TableCell>
                  )}
                  {visibleCols.includes('priority') && (
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: priority?.color,
                          }}
                        />
                        <Typography variant="caption">{priority?.label}</Typography>
                      </Stack>
                    </TableCell>
                  )}
                  {visibleCols.includes('assignees') && (
                    <TableCell>
                      <AvatarGroup
                        max={3}
                        sx={{
                          justifyContent: 'flex-start',
                          '& .MuiAvatar-root': { width: 24, height: 24, fontSize: 10 },
                        }}
                      >
                        {(task.assignees || []).map((assignee) => (
                          <Avatar key={getAssigneeId(assignee)} sx={{ bgcolor: 'primary.main' }}>
                            {getAssigneeName(assignee)?.charAt(0)}
                          </Avatar>
                        ))}
                      </AvatarGroup>
                    </TableCell>
                  )}
                  {visibleCols.includes('due_date') && (
                    <TableCell>
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
                    </TableCell>
                  )}
                  {visibleCols.includes('start_date') && (
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {task.start_date
                          ? new Date(task.start_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </Typography>
                    </TableCell>
                  )}
                  {visibleCols.includes('story_points') && (
                    <TableCell>
                      <Typography variant="caption">{task.story_points || '—'}</Typography>
                    </TableCell>
                  )}
                  {visibleCols.includes('time_estimate') && (
                    <TableCell>
                      <Typography variant="caption">
                        {task.time_estimate ? `${task.time_estimate}h` : '—'}
                      </Typography>
                    </TableCell>
                  )}
                  {visibleCols.includes('tags') && (
                    <TableCell>
                      <Stack direction="row" spacing={0.3} flexWrap="wrap">
                        {(task.tags || []).map((tagItem) => {
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
                    </TableCell>
                  )}
                  {visibleCols.includes('list') && (
                    <TableCell>
                      <Typography variant="caption" noWrap>
                        {list?.name || '—'}
                      </Typography>
                    </TableCell>
                  )}
                  {visibleCols.includes('progress') && (
                    <TableCell>
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
                    </TableCell>
                  )}
                  {visibleCols.includes('actions') && (
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" onClick={() => openEdit(task)}>
                          <Iconify icon="solar:pen-bold" width={16} />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteId(task.id)}>
                          <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
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
