'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Typography,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Breadcrumbs,
  Link,
  Stack,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
  AvatarGroup,
} from '@mui/material';

import { toast } from 'sonner';

import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { useAuthContext } from 'src/auth/hooks';

import {
  fetchTodos,
  fetchTodoSummary,
  deleteTodo,
  fetchTodo,
  updateTodo,
  patchTodoStatus,
} from 'src/actions/todo';

// ── Status config ────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'default' },
  pending: { label: 'Pending', color: 'info' },
  hold: { label: 'Hold', color: 'warning' },
  completed: { label: 'Completed', color: 'success' },
};

// ── View Detail Dialog ───────────────────────────────────────────────────
function TodoViewDialog({ open, onClose, todoId, onStatusUpdate }) {
  const [todo, setTodo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (open && todoId) {
      setLoading(true);
      fetchTodo(todoId)
        .then((data) => setTodo(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, todoId]);

  const handleStatusChange = async (newStatus) => {
    if (!todo || todo.status === newStatus || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      await patchTodoStatus(todo.id, { status: newStatus });
      const updated = { ...todo, status: newStatus };
      setTodo(updated);
      toast.success(`Status changed to ${newStatus}`);
      if (onStatusUpdate) onStatusUpdate(todo.id, newStatus);
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Todo Details</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : todo ? (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="h6">{todo.todo_title}</Typography>
            {todo.description && (
              <Typography variant="body2" color="text.secondary">
                {todo.description}
              </Typography>
            )}
            <Divider />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Status
              </Typography>
              <Stack direction="row" spacing={1}>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <Chip
                    key={key}
                    label={cfg.label}
                    color={key === todo.status ? cfg.color : 'default'}
                    variant={key === todo.status ? 'filled' : 'outlined'}
                    size="small"
                    clickable
                    disabled={updatingStatus}
                    onClick={() => handleStatusChange(key)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { opacity: 0.8 },
                    }}
                  />
                ))}
              </Stack>
            </Box>
            <Divider />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Assigned Users
              </Typography>
              {todo.assigned_users?.length > 0 ? (
                <Stack spacing={0.5}>
                  {todo.assigned_users.map((u) => (
                    <Typography key={u.id} variant="body2">
                      {u.name} ({u.email})
                    </Typography>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No users assigned
                </Typography>
              )}
            </Box>
            <Divider />
            <Typography variant="body2">
              <strong>Creator:</strong> {todo.creator_name} ({todo.creator_email})
            </Typography>
            <Typography variant="body2">
              <strong>Created:</strong> {new Date(todo.created_at).toLocaleString()}
            </Typography>
            <Typography variant="body2">
              <strong>Updated:</strong> {new Date(todo.updated_at).toLocaleString()}
            </Typography>
            {todo.role === 'created' && (
              <Alert severity="info" sx={{ mt: 1 }}>
                You created this todo
              </Alert>
            )}
            {todo.role === 'assigned' && (
              <Alert severity="success" sx={{ mt: 1 }}>
                You are assigned to this todo
              </Alert>
            )}
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Delete Confirm Dialog ────────────────────────────────────────────────
function DeleteConfirmDialog({ open, onClose, onConfirm, loading }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete this todo? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={loading}>
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Not Eligible Card ────────────────────────────────────────────────────
function NotEligibleCard({ onCreateClick }) {
  return (
    <Paper sx={{ p: 6, textAlign: 'center' }}>
      <Typography variant="h3" sx={{ mb: 2 }}>
        🚫
      </Typography>
      <Typography variant="h6" sx={{ mb: 2 }}>
        You are not eligible to view any list.
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        You have no created or assigned todos.
      </Typography>
      <Button variant="contained" onClick={onCreateClick}>
        Create Todo
      </Button>
    </Paper>
  );
}

// ── Print View ────────────────────────────────────────────────────────────
function PrintView({ todo, onClose }) {
  if (!todo) return null;
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        {todo.todo_title}
      </Typography>
      <Divider sx={{ my: 2 }} />
      {todo.description && (
        <Typography variant="body1" paragraph>
          {todo.description}
        </Typography>
      )}
      <Typography variant="body2">
        <strong>Status:</strong> {STATUS_CONFIG[todo.status]?.label || todo.status}
      </Typography>
      <Typography variant="body2">
        <strong>Creator:</strong> {todo.creator_name} ({todo.creator_email})
      </Typography>
      <Typography variant="body2">
        <strong>Created:</strong> {new Date(todo.created_at).toLocaleString()}
      </Typography>
      <Typography variant="body2">
        <strong>Updated:</strong> {new Date(todo.updated_at).toLocaleString()}
      </Typography>
      {todo.assigned_users?.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            Assigned Users:
          </Typography>
          {todo.assigned_users.map((u) => (
            <Typography key={u.id} variant="body2">
              {u.name} ({u.email})
            </Typography>
          ))}
        </>
      )}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button variant="outlined" onClick={() => window.print()}>
          Print
        </Button>
        <Button sx={{ ml: 1 }} onClick={onClose}>
          Close
        </Button>
      </Box>
    </Box>
  );
}

// ── Main List Page ───────────────────────────────────────────────────────
export default function TodoListPage() {
  const router = useRouter();
  const { user } = useAuthContext();

  const [todos, setTodos] = useState([]);
  const [summary, setSummary] = useState({ total: 0, draft: 0, pending: 0, hold: 0, completed: 0 });
  const [loading, setLoading] = useState(false);
  const [notEligible, setNotEligible] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const debounceTimerRef = useRef(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTodoId, setSelectedTodoId] = useState(null);
  const [printTodo, setPrintTodo] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(roleFilter && { role: roleFilter }),
      };
      const response = await fetchTodos(params);
      if (response.results !== undefined) {
        setTodos(response.results);
        setTotalCount(response.count || 0);
        setTotalPages(response.total_pages || 1);
        setNotEligible(response.results.length === 0 && !!response.message);
      } else if (response.message) {
        setTodos([]);
        setTotalCount(0);
        setTotalPages(1);
        setNotEligible(true);
      } else {
        setTodos([]);
        setTotalCount(0);
        setTotalPages(1);
        setNotEligible(false);
      }
    } catch (error) {
      toast.error('Failed to load todos');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, roleFilter]);

  const loadSummary = useCallback(async () => {
    try {
      const data = await fetchTodoSummary();
      setSummary(data);
    } catch (error) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleSearchChange = (value) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 400);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleRoleFilterChange = (value) => {
    setRoleFilter(value);
    setPage(1);
  };

  const handleReset = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearch('');
    setStatusFilter('');
    setRoleFilter('');
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }
    return pages;
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await deleteTodo(deleteId);
      toast.success('Todo deleted successfully');
      setDeleteDialogOpen(false);
      setDeleteId(null);
      loadData();
      loadSummary();
    } catch (error) {
      toast.error(error.message || 'Failed to delete todo');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleView = (id) => {
    setSelectedTodoId(id);
    setViewDialogOpen(true);
  };

  const handlePrint = async (id) => {
    try {
      const data = await fetchTodo(id);
      setPrintTodo(data);
    } catch (error) {
      toast.error('Failed to load todo for print');
    }
  };

  const isSuperUser = user?.is_superuser;
  const canEdit = (todo) => isSuperUser || todo.role === 'created';
  const canDelete = (todo) => isSuperUser || todo.role === 'created';

  const handleCreate = () => router.push(paths.dashboard.todo.create);
  const handleEdit = (id) => router.push(paths.dashboard.todo.edit(id));

  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" onClick={() => router.push(paths.dashboard.root)}>
          Dashboard
        </Link>
        <Typography color="text.primary">Todo Management</Typography>
        <Typography color="text.primary">Todo List</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Todo List</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={handleCreate}
        >
          Create Todo
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100' }}>
            <Typography variant="h4">{summary.draft}</Typography>
            <Typography variant="body2" color="text.secondary">
              Draft
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'info.lighter' }}>
            <Typography variant="h4">{summary.pending}</Typography>
            <Typography variant="body2" color="text.secondary">
              Pending
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.lighter' }}>
            <Typography variant="h4">{summary.hold}</Typography>
            <Typography variant="body2" color="text.secondary">
              Hold
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'success.lighter' }}>
            <Typography variant="h4">{summary.completed}</Typography>
            <Typography variant="body2" color="text.secondary">
              Completed
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {notEligible && <NotEligibleCard onCreateClick={handleCreate} />}

      {!notEligible && (
        <Card sx={{ p: { xs: 2, sm: 3 }, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Search & Filter
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by title or creator..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Iconify icon="solar:magnifer-linear" sx={{ mr: 1, color: 'text.disabled' }} />
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <MenuItem key={key} value={key}>
                    {cfg.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="My Role"
                value={roleFilter}
                onChange={(e) => handleRoleFilterChange(e.target.value)}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="created">Created by me</MenuItem>
                <MenuItem value="assigned">Assigned to me</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Button
                variant="outlined"
                onClick={handleReset}
                startIcon={<Iconify icon="solar:restart-bold" />}
                sx={{ flexShrink: 0 }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </Card>
      )}

      {!notEligible && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Todo Title</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Assigned Users</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Creator</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : todos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No todos found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  todos.map((todo) => (
                    <TableRow key={todo.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">{todo.todo_title}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {todo.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {todo.assigned_users?.length > 0 ? (
                          <AvatarGroup max={3} sx={{ justifyContent: 'flex-start' }}>
                            {todo.assigned_users.map((u) => (
                              <Tooltip key={u.id} title={`${u.name} (${u.email})`}>
                                <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                                  {u.name?.charAt(0)?.toUpperCase() || '?'}
                                </Avatar>
                              </Tooltip>
                            ))}
                          </AvatarGroup>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Label color={STATUS_CONFIG[todo.status]?.color || 'default'}>
                          {STATUS_CONFIG[todo.status]?.label || todo.status}
                        </Label>
                      </TableCell>
                      <TableCell>
                        {todo.role === 'created' ? (
                          <Label color="primary">Created</Label>
                        ) : todo.role === 'assigned' ? (
                          <Label color="success">Assigned</Label>
                        ) : (
                          <Label color="default">-</Label>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{todo.creator_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {todo.creator_email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(todo.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => handleView(todo.id)}>
                              <Iconify icon="solar:eye-bold" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Print">
                            <IconButton size="small" onClick={() => handlePrint(todo.id)}>
                              <Iconify icon="solar:printer-bold" />
                            </IconButton>
                          </Tooltip>
                          {canEdit(todo) && (
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleEdit(todo.id)}>
                                <Iconify icon="solar:pen-bold" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canDelete(todo) && (
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteClick(todo.id)}
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Showing {todos.length > 0 ? (page - 1) * pageSize + 1 : 0}–
              {Math.min(page * pageSize, totalCount)} of {totalCount} todos
            </Typography>

            <Stack direction="row" spacing={0.5} alignItems="center">
              {/* First Page */}
              <IconButton size="small" disabled={page <= 1} onClick={() => handlePageChange(1)}>
                <Iconify icon="solar:alt-arrow-left-linear" width={16} />
              </IconButton>

              {/* Previous */}
              <IconButton
                size="small"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                <Iconify icon="solar:arrow-left-linear" width={16} />
              </IconButton>

              {/* Page Numbers */}
              {getPageNumbers()[0] > 1 && (
                <Typography variant="body2" sx={{ px: 0.5, color: 'text.disabled' }}>
                  ...
                </Typography>
              )}
              {getPageNumbers().map((pageNum) => (
                <Button
                  key={pageNum}
                  size="small"
                  variant={pageNum === page ? 'contained' : 'text'}
                  onClick={() => handlePageChange(pageNum)}
                  sx={{
                    minWidth: 32,
                    height: 32,
                    p: 0,
                    fontSize: 13,
                  }}
                >
                  {pageNum}
                </Button>
              ))}
              {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                <Typography variant="body2" sx={{ px: 0.5, color: 'text.disabled' }}>
                  ...
                </Typography>
              )}

              {/* Next */}
              <IconButton
                size="small"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                <Iconify icon="solar:arrow-right-linear" width={16} />
              </IconButton>

              {/* Last Page */}
              <IconButton
                size="small"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(totalPages)}
              >
                <Iconify icon="solar:alt-arrow-right-linear" width={16} />
              </IconButton>

              {/* Page Size Selector */}
              <TextField
                select
                size="small"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                sx={{ width: 80, ml: 1.5 }}
              >
                {[10, 25, 50, 100].map((size) => (
                  <MenuItem key={size} value={size}>
                    {size}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Box>
        </Card>
      )}

      <TodoViewDialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        todoId={selectedTodoId}
        onStatusUpdate={(id, newStatus) => {
          setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
          loadSummary();
        }}
      />
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
      {printTodo && (
        <Dialog open={!!printTodo} onClose={() => setPrintTodo(null)} maxWidth="md" fullWidth>
          <DialogContent>
            <PrintView todo={printTodo} onClose={() => setPrintTodo(null)} />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}
