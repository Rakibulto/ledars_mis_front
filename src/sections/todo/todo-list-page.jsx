'use client';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

import {
  Box,
  Chip,
  Card,
  Grid,
  Menu,
  Table,
  Paper,
  Stack,
  alpha,
  Button,
  Dialog,
  Avatar,
  Tooltip,
  TableRow,
  MenuItem,
  useTheme,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  DialogTitle,
  AvatarGroup,
  Autocomplete,
  DialogContent,
  DialogActions,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import {
  fetchTodo,
  fetchTodos,
  deleteTodo,
  updateTodo,
  createTodo,
  fetchTodoUsers,
  patchTodoStatus,
  fetchTodoSummary,
  createTodoAttachment,
} from 'src/actions/todo';

import { Iconify } from 'src/components/iconify';
import TiptapEditor from 'src/components/tiptap-editor';
import PrintPreviewDialog from 'src/components/todo/print-preview-dialog';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { useAuthContext } from 'src/auth/hooks';

// ── Constants ───────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { key: 'draft', label: 'Draft', color: 'default' },
  { key: 'pending', label: 'Pending', color: 'info' },
  { key: 'hold', label: 'Hold', color: 'warning' },
  { key: 'completed', label: 'Completed', color: 'success' },
];

const STATUS_CONFIG = Object.fromEntries(
  STATUS_OPTIONS.map(({ key, label, color }) => [key, { label, color }])
);

const TODAY = dayjs().format('YYYY-MM-DD');
const YESTERDAY = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
const TOMORROW = dayjs().add(1, 'day').format('YYYY-MM-DD');

function isMissed(row) {
  return row.expected_date && row.expected_date < TODAY && !['completed', 'hold'].includes(row.status);
}

const STATUS_BADGE_STYLES = {
  draft: {
    bg: 'grey.100',
    color: 'text.secondary',
    dot: 'grey.400',
    gradFrom: '#e0e0e0',
    gradTo: '#bdbdbd',
  },
  pending: {
    bg: 'info.lighter',
    color: 'info.dark',
    dot: 'info.main',
    gradFrom: '#e3f2fd',
    gradTo: '#90caf9',
  },
  hold: {
    bg: 'warning.lighter',
    color: 'warning.dark',
    dot: 'warning.main',
    gradFrom: '#fff8e1',
    gradTo: '#ffcc02',
  },
  completed: {
    bg: 'success.lighter',
    color: 'success.dark',
    dot: 'success.main',
    gradFrom: '#e8f5e9',
    gradTo: '#66bb6a',
  },
};

const SUMMARY_CARDS = [
  {
    key: 'draft',
    label: 'Draft',
    icon: 'solar:document-text-bold',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    lightBg: 'rgba(102,126,234,0.08)',
    iconColor: '#764ba2',
    numColor: '#4527a0',
  },
  {
    key: 'pending',
    label: 'Pending',
    icon: 'solar:clock-circle-bold',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    lightBg: 'rgba(245,87,108,0.08)',
    iconColor: '#f5576c',
    numColor: '#c62828',
  },
  {
    key: 'hold',
    label: 'Hold',
    icon: 'solar:pause-circle-bold',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    lightBg: 'rgba(252,182,159,0.15)',
    iconColor: '#e65100',
    numColor: '#bf360c',
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: 'solar:check-circle-bold',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    lightBg: 'rgba(76,175,80,0.08)',
    iconColor: '#2e7d32',
    numColor: '#1b5e20',
  },
];

// ── Small helper components ─────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_BADGE_STYLES[status] || STATUS_BADGE_STYLES.draft;
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.5,
        py: 0.5,
        borderRadius: '20px',
        bgcolor: cfg.bg,
        color: cfg.color,
        fontSize: 11.5,
        fontWeight: 600,
        letterSpacing: '0.02em',
        lineHeight: 1.5,
        whiteSpace: 'nowrap',
        border: '1px solid',
        borderColor: cfg.dot,
        borderOpacity: 0.3,
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cfg.dot, flexShrink: 0 }} />
      {STATUS_CONFIG[status]?.label || status}
    </Box>
  );
}

function RoleTag({ role }) {
  if (role === 'created') {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.25,
          py: 0.4,
          borderRadius: 1.5,
          bgcolor: 'primary.lighter',
          color: 'primary.dark',
          fontSize: 11.5,
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}
      >
        <Iconify icon="solar:pen-bold" width={12} />
        Created
      </Box>
    );
  }
  if (role === 'assigned') {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.25,
          py: 0.4,
          borderRadius: 1.5,
          bgcolor: 'success.lighter',
          color: 'success.dark',
          fontSize: 11.5,
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}
      >
        <Iconify icon="solar:user-check-bold" width={12} />
        Assigned
      </Box>
    );
  }
  if (role === 'viewer') {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.25,
          py: 0.4,
          borderRadius: 1.5,
          bgcolor: 'warning.lighter',
          color: 'warning.dark',
          fontSize: 11.5,
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}
      >
        <Iconify icon="solar:eye-bold" width={12} />
        Viewer
      </Box>
    );
  }
  return (
    <Typography variant="caption" color="text.disabled">
      —
    </Typography>
  );
}

function ActionBtn({ title, icon, onClick, hoverBg, hoverColor }) {
  return (
    <Tooltip title={title} arrow placement="top">
      <IconButton
        size="small"
        onClick={onClick}
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          color: hoverColor,
          transition: 'all 0.18s ease',
          '&:hover': {
            bgcolor: hoverBg,
            color: hoverColor,
            transform: 'translateY(-1px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          },
        }}
      >
        <Iconify icon={icon} width={17} />
      </IconButton>
    </Tooltip>
  );
}

// ── Info Row helper for dialogs ─────────────────────────────────────────
function InfoRow({ icon, label, value, valueColor }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          mt: 0.25,
        }}
      >
        <Iconify icon={icon} width={16} sx={{ color: 'text.secondary' }} />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ display: 'block', mb: 0.2, fontWeight: 500 }}
        >
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, color: valueColor || 'text.primary', lineHeight: 1.5 }}
        >
          {value || '—'}
        </Typography>
      </Box>
    </Stack>
  );
}

// ── Todo View Dialog ────────────────────────────────────────────────────

function TodoViewDialog({ open, onClose, todoId, onStatusUpdate, onDeleteClick }) {
  const [todo, setTodo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const theme = useTheme();

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
      setTodo((prev) => ({ ...prev, status: newStatus }));
      toast.success(`Status changed to ${newStatus}`);
      if (onStatusUpdate) onStatusUpdate(todo.id, newStatus);
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleEditClick = () => {
    if (todo) {
      onClose();
      // Trigger edit dialog from parent
      window.dispatchEvent(new CustomEvent('todo-view-edit', { detail: { todoId: todo.id } }));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
        },
      }}
    >
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 10,
            gap: 2,
          }}
        >
          <CircularProgress size={36} thickness={3} />
          <Typography variant="body2" color="text.secondary">
            Loading details…
          </Typography>
        </Box>
      ) : todo ? (
        <>
          {/* ── Header ── */}
          <Box
            sx={{
              px: 3,
              pt: 3,
              pb: 2.5,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: 'primary.lighter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Iconify
                  icon="solar:document-text-bold"
                  width={20}
                  sx={{ color: 'primary.dark' }}
                />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                  {todo.todo_title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Todo details
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={onClose} size="small" sx={{ borderRadius: 2, mt: -0.5 }}>
              <Iconify icon="solar:close-circle-bold" width={22} sx={{ color: 'text.disabled' }} />
            </IconButton>
          </Box>

          <DialogContent sx={{ px: 3, pt: 0, pb: 1 }}>
            <Stack spacing={2.5}>
              {/* Description */}
              {todo.description && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      mb: 1,
                      display: 'block',
                    }}
                  >
                    Description
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'action.hover',
                      border: '1px solid',
                      borderColor: 'divider',
                      '& p': { margin: '0 0 0.5em 0' },
                      '& p:last-child': { marginBottom: 0 },
                      '& ul, & ol': { pl: 2.5, margin: '0.5em 0' },
                      '& li': { mb: 0.25 },
                      '& strong': { fontWeight: 700 },
                      '& em': { fontStyle: 'italic' },
                      '& a': { color: 'primary.main', textDecoration: 'underline' },
                      '& code': {
                        px: 0.5,
                        py: 0.25,
                        borderRadius: 0.5,
                        bgcolor: 'action.selected',
                        fontSize: '0.875em',
                        fontFamily: 'monospace',
                      },
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      component="div"
                      sx={{ lineHeight: 1.7 }}
                      dangerouslySetInnerHTML={{ __html: todo.description }}
                    />
                  </Box>
                </Box>
              )}

              {/* Expected Date */}
              {todo.expected_date && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      mb: 1,
                      display: 'block',
                    }}
                  >
                    Expected Date
                  </Typography>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: isMissed(todo) ? 'error.lighter' : 'action.hover',
                      border: '1px solid',
                      borderColor: isMissed(todo) ? 'error.main' : 'divider',
                    }}
                  >
                    <Iconify
                      icon={isMissed(todo) ? 'solar:danger-triangle-bold' : 'solar:calendar-bold'}
                      width={16}
                      sx={{ color: isMissed(todo) ? 'error.main' : 'text.secondary' }}
                    />
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ color: isMissed(todo) ? 'error.dark' : 'text.primary' }}
                    >
                      {dayjs(todo.expected_date).format('DD MMM YYYY')}
                    </Typography>
                    {isMissed(todo) && (
                      <Typography variant="caption" color="error.main" fontWeight={600}>
                        (Overdue)
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* Recurrence Info */}
              {todo.is_recurring && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      mb: 1,
                      display: 'block',
                    }}
                  >
                    Recurrence
                  </Typography>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: 'secondary.lighter',
                      border: '1px solid',
                      borderColor: 'secondary.main',
                    }}
                  >
                    <Iconify icon="solar:recurso-bold" width={16} sx={{ color: 'secondary.dark' }} />
                    <Typography variant="body2" fontWeight={600} sx={{ color: 'secondary.dark' }}>
                      {todo.recurrence_type === 'daily' && 'Daily'}
                      {todo.recurrence_type === 'weekly' && `Weekly (${(todo.recurrence_weekdays || []).map(d => ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d]).join(', ')})`}
                      {todo.recurrence_type === 'monthly' && `Monthly (day ${todo.recurrence_day_of_month})`}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Status */}
              <Box>
                <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    mb: 1,
                    display: 'block',
                  }}
                >
                  Status
                </Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  {STATUS_OPTIONS.map((opt) => {
                    const isActive = opt.key === todo.status;
                    const cfg = STATUS_BADGE_STYLES[opt.key];
                    return (
                      <Box
                        key={opt.key}
                        onClick={() => !updatingStatus && handleStatusChange(opt.key)}
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          px: 1.5,
                          py: 0.6,
                          borderRadius: 2,
                          cursor: updatingStatus ? 'not-allowed' : 'pointer',
                          border: '1px solid',
                          borderColor: isActive ? cfg.dot : 'divider',
                          bgcolor: isActive ? cfg.bg : 'transparent',
                          color: isActive ? cfg.color : 'text.secondary',
                          fontSize: 12,
                          fontWeight: isActive ? 700 : 500,
                          transition: 'all 0.18s ease',
                          opacity: updatingStatus ? 0.6 : 1,
                          '&:hover': !updatingStatus
                            ? {
                                borderColor: cfg.dot,
                                bgcolor: cfg.bg,
                                color: cfg.color,
                              }
                            : {},
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: isActive ? cfg.dot : 'text.disabled',
                            flexShrink: 0,
                          }}
                        />
                        {opt.label}
                      </Box>
                    );
                  })}
                </Stack>
              </Box>

              {/* Info banner */}
              {todo.role === 'created' && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.08),
                    border: '1px solid',
                    borderColor: alpha(theme.palette.info.main, 0.2),
                  }}
                >
                  <Iconify
                    icon="solar:info-circle-bold"
                    width={16}
                    sx={{ color: 'info.main', flexShrink: 0 }}
                  />
                  <Typography variant="body2" color="info.dark" fontWeight={500}>
                    You created this todo
                  </Typography>
                </Box>
              )}

              {/* Creator & Created Info */}
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 140 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        fontSize: 11,
                        fontWeight: 700,
                        bgcolor: 'primary.lighter',
                        color: 'primary.dark',
                      }}
                    >
                      {todo.creator_name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ display: 'block', fontWeight: 500 }}
                      >
                        Creator
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ fontSize: 13, lineHeight: 1.3 }}
                      >
                        {todo.creator_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                        {todo.creator_email}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
                <Box sx={{ flex: 1, minWidth: 140 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1.5,
                        bgcolor: 'action.hover',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Iconify
                        icon="solar:calendar-bold"
                        width={14}
                        sx={{ color: 'text.secondary' }}
                      />
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ display: 'block', fontWeight: 500 }}
                      >
                        Created
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ fontSize: 13, lineHeight: 1.3 }}
                      >
                        {new Date(todo.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                        Updated{' '}
                        {new Date(todo.updated_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>

              {/* Assigned Users */}
              <Box>
                <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    mb: 1,
                    display: 'block',
                  }}
                >
                  Assigned Users
                </Typography>
                {todo.assigned_users?.length > 0 ? (
                  <Stack spacing={0.75}>
                    {todo.assigned_users.map((u) => (
                      <Stack
                        key={u.id}
                        direction="row"
                        spacing={1.25}
                        alignItems="center"
                        sx={{ py: 0.75 }}
                      >
                        <Avatar
                          sx={{
                            width: 30,
                            height: 30,
                            fontSize: 12,
                            fontWeight: 700,
                            bgcolor: 'primary.lighter',
                            color: 'primary.dark',
                          }}
                        >
                          {u.name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: 13 }}>
                            {u.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            sx={{ fontSize: 11 }}
                          >
                            {u.email}
                          </Typography>
                        </Box>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.disabled" sx={{ fontSize: 13 }}>
                    No users assigned
                  </Typography>
                )}
              </Box>
            </Stack>
          </DialogContent>

          {/* ── Footer Actions ── */}
          <Box
            sx={{
              px: 3,
              py: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'center',
              gap: 1.5,
            }}
          >
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
            >
              Close
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                onClose();
                if (onDeleteClick && todo) onDeleteClick(todo.id);
              }}
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" width={16} />}
              sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
            >
              Delete
            </Button>
            <Button
              variant="contained"
              onClick={handleEditClick}
              startIcon={<Iconify icon="solar:pen-bold" width={16} />}
              sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
            >
              Edit
            </Button>
          </Box>
        </>
      ) : null}
    </Dialog>
  );
}

// ── Todo Create Dialog ──────────────────────────────────────────────────

function TodoCreateDialog({ open, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [expectedDate, setExpectedDate] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [userSearchInput, setUserSearchInput] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  // Attachment fields (optional)
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentRemarks, setAttachmentRemarks] = useState('');
  // Recurrence fields
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState('daily');
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState([]);
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState(1);

  useEffect(() => {
    setLoadingUsers(true);
    fetchTodoUsers(userSearchInput)
      .then((data) => setUserOptions(data || []))
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
  }, [userSearchInput]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      const todo = await createTodo({
        todo_title: title.trim(),
        description: description || '',
        expected_date: expectedDate || null,
        status,
        assign_user_ids: selectedUsers.map((u) => u.id),
        is_recurring: isRecurring,
        recurrence_type: isRecurring ? recurrenceType : 'none',
        recurrence_weekdays: isRecurring && recurrenceType === 'weekly' ? recurrenceWeekdays : null,
        recurrence_day_of_month: isRecurring && recurrenceType === 'monthly' ? recurrenceDayOfMonth : null,
      });

      // If file or remarks provided, create attachment for the creator
      if (attachmentFile || attachmentRemarks) {
        const formData = new FormData();
        if (attachmentFile) formData.append('file', attachmentFile);
        if (attachmentRemarks) formData.append('remarks', attachmentRemarks);
        await createTodoAttachment(todo.id, formData);
      }

      toast.success('Todo created successfully!');
      setTitle('');
      setDescription('');
      setStatus('pending');
      setExpectedDate('');
      setSelectedUsers([]);
      setAttachmentFile(null);
      setAttachmentRemarks('');
      setIsRecurring(false);
      setRecurrenceType('daily');
      setRecurrenceWeekdays([]);
      setRecurrenceDayOfMonth(1);
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to create todo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' } }}
    >
      <Box
        sx={{
          px: 3,
          pt: 3,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: 'primary.lighter',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify icon="solar:add-circle-bold" width={20} sx={{ color: 'primary.dark' }} />
          </Box>
          <Typography variant="h6" fontWeight={700}>
            Create Todo
          </Typography>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ borderRadius: 2 }}>
          <Iconify icon="solar:close-circle-bold" width={20} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 3, py: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <TextField
              label="Todo Title"
              required
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              InputProps={{ sx: { borderRadius: 2 } }}
            />
            {/* Description - Tiptap */}
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1.25, display: 'block', fontWeight: 600 }}
              >
                Description
              </Typography>
              <TiptapEditor
                value={description}
                onChange={(html) => setDescription(html)}
                placeholder="Write a description..."
                minHeight={100}
              />
            </Box>
            <DatePicker
              label="Expected Date"
              value={expectedDate ? dayjs(expectedDate) : null}
              onChange={(newVal) => setExpectedDate(newVal ? newVal.format('YYYY-MM-DD') : '')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } },
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="solar:calendar-bold" width={18} sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  },
                },
              }}
            />
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1.25, display: 'block', fontWeight: 600 }}
              >
                Initial Status
              </Typography>
              <Stack direction="row" spacing={1}>
                {[
                  { key: 'draft', label: 'Draft' },
                  { key: 'pending', label: 'Pending' },
                ].map((opt) => {
                  const cfg = STATUS_BADGE_STYLES[opt.key];
                  const isActive = status === opt.key;
                  return (
                    <Box
                      key={opt.key}
                      onClick={() => setStatus(opt.key)}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.75,
                        px: 1.75,
                        py: 0.85,
                        borderRadius: 2,
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: isActive ? cfg.dot : 'divider',
                        bgcolor: isActive ? cfg.bg : 'transparent',
                        color: isActive ? cfg.color : 'text.secondary',
                        fontSize: 12.5,
                        fontWeight: isActive ? 700 : 500,
                        transition: 'all 0.18s ease',
                        '&:hover': { borderColor: cfg.dot, bgcolor: cfg.bg, color: cfg.color },
                      }}
                    >
                      {isActive && <Iconify icon="solar:check-circle-bold" width={14} />}
                      {opt.label}
                    </Box>
                  );
                })}
              </Stack>
            </Box>

            {/* ── Recurrence Section ── */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: isRecurring ? 'primary.main' : 'divider',
                bgcolor: isRecurring ? 'primary.lighter' : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: isRecurring ? 1.5 : 0 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Iconify icon="solar:recurso-bold" width={18} sx={{ color: isRecurring ? 'primary.dark' : 'text.secondary' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: isRecurring ? 'primary.dark' : 'text.secondary' }}>
                    Recurring Todo
                  </Typography>
                </Stack>
                <Box
                  onClick={() => setIsRecurring(!isRecurring)}
                  sx={{
                    width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
                    bgcolor: isRecurring ? 'primary.main' : 'action.disabledBackground',
                    position: 'relative', transition: 'all 0.2s ease',
                  }}
                >
                  <Box
                    sx={{
                      width: 18, height: 18, borderRadius: '50%', bgcolor: 'white',
                      position: 'absolute', top: 2,
                      left: isRecurring ? 20 : 2,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  />
                </Box>
              </Stack>

              {isRecurring && (
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block', fontWeight: 600 }}>
                      Frequency
                    </Typography>
                    <Stack direction="row" spacing={0.75}>
                      {[
                        { key: 'daily', label: 'Daily' },
                        { key: 'weekly', label: 'Weekly' },
                        { key: 'monthly', label: 'Monthly' },
                      ].map((opt) => (
                        <Box
                          key={opt.key}
                          onClick={() => setRecurrenceType(opt.key)}
                          sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.5,
                            px: 1.5, py: 0.75, borderRadius: 1.5, cursor: 'pointer',
                            border: '1.5px solid',
                            borderColor: recurrenceType === opt.key ? 'primary.main' : 'divider',
                            bgcolor: recurrenceType === opt.key ? 'primary.lighter' : 'transparent',
                            color: recurrenceType === opt.key ? 'primary.dark' : 'text.secondary',
                            fontSize: 12, fontWeight: recurrenceType === opt.key ? 700 : 500,
                            transition: 'all 0.15s ease',
                            '&:hover': { borderColor: 'primary.main' },
                          }}
                        >
                          {recurrenceType === opt.key && <Iconify icon="solar:check-circle-bold" width={13} />}
                          {opt.label}
                        </Box>
                      ))}
                    </Stack>
                  </Box>

                  {recurrenceType === 'weekly' && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block', fontWeight: 600 }}>
                        Select Days
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {[
                          { key: 0, label: 'Mon' }, { key: 1, label: 'Tue' }, { key: 2, label: 'Wed' },
                          { key: 3, label: 'Thu' }, { key: 4, label: 'Fri' }, { key: 5, label: 'Sat' },
                          { key: 6, label: 'Sun' },
                        ].map((day) => {
                          const isSelected = recurrenceWeekdays.includes(day.key);
                          return (
                            <Box
                              key={day.key}
                              onClick={() => {
                                setRecurrenceWeekdays((prev) =>
                                  isSelected ? prev.filter((d) => d !== day.key) : [...prev, day.key]
                                );
                              }}
                              sx={{
                                px: 1.5, py: 0.65, borderRadius: 1.5, cursor: 'pointer',
                                border: '1.5px solid',
                                borderColor: isSelected ? 'primary.main' : 'divider',
                                bgcolor: isSelected ? 'primary.main' : 'transparent',
                                color: isSelected ? 'white' : 'text.secondary',
                                fontSize: 11.5, fontWeight: isSelected ? 700 : 500,
                                transition: 'all 0.15s ease',
                                '&:hover': { borderColor: 'primary.main' },
                              }}
                            >
                              {day.label}
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}

                  {recurrenceType === 'monthly' && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block', fontWeight: 600 }}>
                        Day of Month
                      </Typography>
                      <TextField
                        select
                        size="small"
                        value={recurrenceDayOfMonth}
                        onChange={(e) => setRecurrenceDayOfMonth(Number(e.target.value))}
                        sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <MenuItem key={day} value={day}>{day}</MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  )}
                </Stack>
              )}
            </Box>

            <Autocomplete
              multiple
              options={userOptions}
              value={selectedUsers}
              onChange={(_, v) => setSelectedUsers(v)}
              onInputChange={(_, v) => setUserSearchInput(v)}
              getOptionLabel={(option) => `${option.name || ''} (${option.email || ''})`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              loading={loadingUsers}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assign Users"
                  placeholder="Search by name or email…"
                  InputProps={{
                    ...params.InputProps,
                    sx: { borderRadius: 2 },
                    endAdornment: (
                      <>
                        {loadingUsers ? <CircularProgress size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.name || option.email}
                    size="small"
                    sx={{ borderRadius: 1.5 }}
                  />
                ))
              }
            />

            {/* Attachment File (optional) */}
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1.25, display: 'block', fontWeight: 600 }}
              >
                Attachment File (optional)
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<Iconify icon="solar:upload-bold" width={16} />}
                sx={{ borderRadius: 2 }}
              >
                {attachmentFile ? attachmentFile.name : 'Choose File'}
                <input
                  type="file"
                  hidden
                  onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                />
              </Button>
              {attachmentFile && (
                <Button
                  size="small"
                  color="error"
                  onClick={() => setAttachmentFile(null)}
                  sx={{ ml: 1, borderRadius: 2 }}
                >
                  Remove
                </Button>
              )}
            </Box>

            {/* Remarks (optional) - Tiptap */}
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1.25, display: 'block', fontWeight: 600 }}
              >
                Remarks (optional)
              </Typography>
              <TiptapEditor
                value={attachmentRemarks}
                onChange={(html) => setAttachmentRemarks(html)}
                placeholder="Write your remarks..."
                minHeight={80}
              />
            </Box>
          </Stack>
        </Box>
      </DialogContent>

      <Box sx={{ px: 3, pb: 3, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
        <Button
          onClick={onClose}
          disabled={submitting}
          variant="outlined"
          sx={{ borderRadius: 2, px: 2.5 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={submitting}
          onClick={handleSubmit}
          startIcon={
            submitting ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Iconify icon="solar:add-circle-bold" width={18} />
            )
          }
          sx={{ borderRadius: 2, px: 2.5, fontWeight: 600 }}
        >
          {submitting ? 'Creating…' : 'Create Todo'}
        </Button>
      </Box>
    </Dialog>
  );
}

// ── Todo Edit Dialog ────────────────────────────────────────────────────

function TodoEditDialog({ open, onClose, todoId, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('draft');
  const [expectedDate, setExpectedDate] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [userSearchInput, setUserSearchInput] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTodo, setLoadingTodo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [notFound, setNotFound] = useState(false);
  // Recurrence fields
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState('daily');
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState([]);
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState(1);

  useEffect(() => {
    if (!todoId) return;
    setLoadingTodo(true);
    fetchTodo(todoId)
      .then((data) => {
        setTitle(data.todo_title);
        setDescription(data.description || '');
        setStatus(data.status);
        setExpectedDate(data.expected_date || '');
        setSelectedUsers(
          (data.assigned_users || []).map((u) => ({ id: u.id, name: u.name, email: u.email }))
        );
        setIsRecurring(data.is_recurring || false);
        setRecurrenceType(data.recurrence_type || 'daily');
        setRecurrenceWeekdays(data.recurrence_weekdays || []);
        setRecurrenceDayOfMonth(data.recurrence_day_of_month || 1);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoadingTodo(false));
  }, [todoId, open]);

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setStatus('draft');
    setExpectedDate('');
    setSelectedUsers([]);
    setUserOptions([]);
    setUserSearchInput('');
    setErrors({});
    setNotFound(false);
    setIsRecurring(false);
    setRecurrenceType('daily');
    setRecurrenceWeekdays([]);
    setRecurrenceDayOfMonth(1);
    onClose();
  };

  useEffect(() => {
    setLoadingUsers(true);
    fetchTodoUsers(userSearchInput)
      .then((data) => setUserOptions(data || []))
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
  }, [userSearchInput]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      const updated = await updateTodo(todoId, {
        todo_title: title.trim(),
        description: description || '',
        expected_date: expectedDate || null,
        status,
        assign_user_ids: selectedUsers.map((u) => u.id),
        is_recurring: isRecurring,
        recurrence_type: isRecurring ? recurrenceType : 'none',
        recurrence_weekdays: isRecurring && recurrenceType === 'weekly' ? recurrenceWeekdays : null,
        recurrence_day_of_month: isRecurring && recurrenceType === 'monthly' ? recurrenceDayOfMonth : null,
      });

      toast.success('Todo updated successfully!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to update todo');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingTodo) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}
        >
          <CircularProgress size={36} thickness={3} />
          <Typography variant="body2" color="text.secondary">
            Loading todo…
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (notFound) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogContent sx={{ textAlign: 'center', py: 6 }}>
          <Iconify
            icon="solar:shield-warning-bold"
            width={48}
            sx={{ color: 'warning.main', mb: 2 }}
          />
          <Typography variant="h6" gutterBottom>
            Not Found
          </Typography>
          <Typography color="text.secondary">
            Todo not found or you do not have permission to edit.
          </Typography>
        </DialogContent>
        <Box sx={{ px: 3, pb: 3, display: 'flex', justifyContent: 'center' }}>
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2, px: 3 }}>
            Close
          </Button>
        </Box>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' } }}
    >
      <Box
        sx={{
          px: 3,
          pt: 3,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: 'warning.lighter',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify icon="solar:pen-bold" width={20} sx={{ color: 'warning.dark' }} />
          </Box>
          <Typography variant="h6" fontWeight={700}>
            Edit Todo
          </Typography>
        </Stack>
        <IconButton onClick={handleClose} size="small" sx={{ borderRadius: 2 }}>
          <Iconify icon="solar:close-circle-bold" width={20} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 3, py: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <TextField
              label="Todo Title"
              required
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              InputProps={{ sx: { borderRadius: 2 } }}
            />
            {/* Description - Tiptap */}
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1.25, display: 'block', fontWeight: 600 }}
              >
                Description
              </Typography>
              <TiptapEditor
                value={description}
                onChange={(html) => setDescription(html)}
                placeholder="Write a description..."
                minHeight={100}
              />
            </Box>
            <DatePicker
              label="Expected Date"
              value={expectedDate ? dayjs(expectedDate) : null}
              onChange={(newVal) => setExpectedDate(newVal ? newVal.format('YYYY-MM-DD') : '')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } },
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="solar:calendar-bold" width={18} sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  },
                },
              }}
            />
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1.25, display: 'block', fontWeight: 600 }}
              >
                Status
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {STATUS_OPTIONS.map((opt) => {
                  const cfg = STATUS_BADGE_STYLES[opt.key];
                  const isActive = status === opt.key;
                  return (
                    <Box
                      key={opt.key}
                      onClick={() => setStatus(opt.key)}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.75,
                        px: 1.75,
                        py: 0.85,
                        borderRadius: 2,
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: isActive ? cfg.dot : 'divider',
                        bgcolor: isActive ? cfg.bg : 'transparent',
                        color: isActive ? cfg.color : 'text.secondary',
                        fontSize: 12.5,
                        fontWeight: isActive ? 700 : 500,
                        transition: 'all 0.18s ease',
                        '&:hover': { borderColor: cfg.dot, bgcolor: cfg.bg, color: cfg.color },
                      }}
                    >
                      {isActive && <Iconify icon="solar:check-circle-bold" width={14} />}
                      {opt.label}
                    </Box>
                  );
                })}
              </Stack>
            </Box>

            {/* ── Recurrence Section (Edit) ── */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: isRecurring ? 'primary.main' : 'divider',
                bgcolor: isRecurring ? 'primary.lighter' : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: isRecurring ? 1.5 : 0 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Iconify icon="solar:recurso-bold" width={18} sx={{ color: isRecurring ? 'primary.dark' : 'text.secondary' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: isRecurring ? 'primary.dark' : 'text.secondary' }}>
                    Recurring Todo
                  </Typography>
                </Stack>
                <Box
                  onClick={() => setIsRecurring(!isRecurring)}
                  sx={{
                    width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
                    bgcolor: isRecurring ? 'primary.main' : 'action.disabledBackground',
                    position: 'relative', transition: 'all 0.2s ease',
                  }}
                >
                  <Box
                    sx={{
                      width: 18, height: 18, borderRadius: '50%', bgcolor: 'white',
                      position: 'absolute', top: 2,
                      left: isRecurring ? 20 : 2,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  />
                </Box>
              </Stack>

              {isRecurring && (
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block', fontWeight: 600 }}>
                      Frequency
                    </Typography>
                    <Stack direction="row" spacing={0.75}>
                      {[
                        { key: 'daily', label: 'Daily' },
                        { key: 'weekly', label: 'Weekly' },
                        { key: 'monthly', label: 'Monthly' },
                      ].map((opt) => (
                        <Box
                          key={opt.key}
                          onClick={() => setRecurrenceType(opt.key)}
                          sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.5,
                            px: 1.5, py: 0.75, borderRadius: 1.5, cursor: 'pointer',
                            border: '1.5px solid',
                            borderColor: recurrenceType === opt.key ? 'primary.main' : 'divider',
                            bgcolor: recurrenceType === opt.key ? 'primary.lighter' : 'transparent',
                            color: recurrenceType === opt.key ? 'primary.dark' : 'text.secondary',
                            fontSize: 12, fontWeight: recurrenceType === opt.key ? 700 : 500,
                            transition: 'all 0.15s ease',
                            '&:hover': { borderColor: 'primary.main' },
                          }}
                        >
                          {recurrenceType === opt.key && <Iconify icon="solar:check-circle-bold" width={13} />}
                          {opt.label}
                        </Box>
                      ))}
                    </Stack>
                  </Box>

                  {recurrenceType === 'weekly' && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block', fontWeight: 600 }}>
                        Select Days
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {[
                          { key: 0, label: 'Mon' }, { key: 1, label: 'Tue' }, { key: 2, label: 'Wed' },
                          { key: 3, label: 'Thu' }, { key: 4, label: 'Fri' }, { key: 5, label: 'Sat' },
                          { key: 6, label: 'Sun' },
                        ].map((day) => {
                          const isSelected = recurrenceWeekdays.includes(day.key);
                          return (
                            <Box
                              key={day.key}
                              onClick={() => {
                                setRecurrenceWeekdays((prev) =>
                                  isSelected ? prev.filter((d) => d !== day.key) : [...prev, day.key]
                                );
                              }}
                              sx={{
                                px: 1.5, py: 0.65, borderRadius: 1.5, cursor: 'pointer',
                                border: '1.5px solid',
                                borderColor: isSelected ? 'primary.main' : 'divider',
                                bgcolor: isSelected ? 'primary.main' : 'transparent',
                                color: isSelected ? 'white' : 'text.secondary',
                                fontSize: 11.5, fontWeight: isSelected ? 700 : 500,
                                transition: 'all 0.15s ease',
                                '&:hover': { borderColor: 'primary.main' },
                              }}
                            >
                              {day.label}
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}

                  {recurrenceType === 'monthly' && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block', fontWeight: 600 }}>
                        Day of Month
                      </Typography>
                      <TextField
                        select
                        size="small"
                        value={recurrenceDayOfMonth}
                        onChange={(e) => setRecurrenceDayOfMonth(Number(e.target.value))}
                        sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <MenuItem key={day} value={day}>{day}</MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  )}
                </Stack>
              )}
            </Box>

            <Autocomplete
              multiple
              options={userOptions}
              value={selectedUsers}
              onChange={(_, v) => setSelectedUsers(v)}
              onInputChange={(_, v) => setUserSearchInput(v)}
              getOptionLabel={(option) => `${option.name || ''} (${option.email || ''})`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              loading={loadingUsers}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assign Users"
                  placeholder="Search by name or email…"
                  InputProps={{
                    ...params.InputProps,
                    sx: { borderRadius: 2 },
                    endAdornment: (
                      <>
                        {loadingUsers ? <CircularProgress size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.name || option.email}
                    size="small"
                    sx={{ borderRadius: 1.5 }}
                  />
                ))
              }
            />
          </Stack>
        </Box>
      </DialogContent>

      <Box sx={{ px: 3, pb: 3, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
        <Button
          onClick={onClose}
          disabled={submitting}
          variant="outlined"
          sx={{ borderRadius: 2, px: 2.5 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={submitting}
          onClick={handleSubmit}
          startIcon={
            submitting ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Iconify icon="solar:diskette-bold" width={18} />
            )
          }
          sx={{ borderRadius: 2, px: 2.5, fontWeight: 600 }}
        >
          {submitting ? 'Saving…' : 'Save Changes'}
        </Button>
      </Box>
    </Dialog>
  );
}

// ── Delete Confirm Dialog ───────────────────────────────────────────────

function DeleteConfirmDialog({ open, onClose, onConfirm, loading }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 4, boxShadow: '0 24px 64px rgba(0,0,0,0.15)', overflow: 'hidden' },
      }}
    >
      <Box sx={{ bgcolor: 'error.lighter', px: 3, pt: 4, pb: 3, textAlign: 'center' }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: 'error.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" width={30} sx={{ color: 'error.dark' }} />
        </Box>
        <Typography variant="h6" fontWeight={700} color="error.dark" gutterBottom>
          Delete Todo?
        </Typography>
        <Typography variant="body2" color="error.dark" sx={{ opacity: 0.8 }}>
          This action cannot be undone.
        </Typography>
      </Box>
      <Box sx={{ px: 3, py: 2.5, display: 'flex', gap: 1.5 }}>
        <Button
          fullWidth
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          Keep it
        </Button>
        <Button
          fullWidth
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          {loading ? 'Deleting…' : 'Yes, Delete'}
        </Button>
      </Box>
    </Dialog>
  );
}

// ── Not Eligible Card ───────────────────────────────────────────────────

function NotEligibleCard({ onCreateClick }) {
  return (
    <Paper
      sx={{
        p: { xs: 5, md: 8 },
        textAlign: 'center',
        borderRadius: 4,
        border: '2px dashed',
        borderColor: 'divider',
        boxShadow: 'none',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.03) 0%, rgba(168,85,247,0.03) 100%)',
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 3,
        }}
      >
        <Iconify icon="solar:clipboard-list-bold" width={38} sx={{ color: 'text.disabled' }} />
      </Box>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        No todos yet
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 3.5, maxWidth: 320, mx: 'auto' }}
      >
        You have no created or assigned todos. Create your first one to get started.
      </Typography>
      <Button
        variant="contained"
        onClick={onCreateClick}
        startIcon={<Iconify icon="solar:add-circle-bold" width={18} />}
        sx={{ borderRadius: 2.5, px: 3, py: 1, fontWeight: 600 }}
      >
        Create your first Todo
      </Button>
    </Paper>
  );
}

// ── Custom Date Dialog ──────────────────────────────────────────────────

function CustomDateDialog({ open, onClose, selectedDate, onDateSelect, selectedMonth, onMonthChange }) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const now = new Date();
  const [dialogMonth, setDialogMonth] = useState(() => {
    if (selectedMonth) {
      const [y, m] = selectedMonth.split('-').map(Number);
      return { year: y, month: m - 1 };
    }
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [dialogDate, setDialogDate] = useState(selectedDate || '');

  useEffect(() => {
    if (open) {
      if (selectedMonth) {
        const [y, m] = selectedMonth.split('-').map(Number);
        setDialogMonth({ year: y, month: m - 1 });
      } else {
        setDialogMonth({ year: now.getFullYear(), month: now.getMonth() });
      }
      // Always reset date selection when dialog opens
      // User must explicitly click a date to select it
      setDialogDate('');
    }
  }, [open, selectedMonth]);

  const daysInMonth = new Date(dialogMonth.year, dialogMonth.month + 1, 0).getDate();
  const firstDayOfWeek = new Date(dialogMonth.year, dialogMonth.month, 1).getDay();

  const handlePrevMonth = () => {
    setDialogMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setDialogMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  const handleDayClick = (day) => {
    const dateStr = `${dialogMonth.year}-${String(dialogMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setDialogDate(dateStr);
  };

  const handleApply = () => {
    const monthKey = `${dialogMonth.year}-${String(dialogMonth.month + 1).padStart(2, '0')}`;
    onMonthChange(monthKey);
    if (dialogDate) {
      onDateSelect(dialogDate);
    }
    onClose();
  };

  const handleClear = () => {
    setDialogDate('');
    onDateSelect('');
    onMonthChange('');
    onClose();
  };

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      <Box sx={{ px: 3, pt: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: 'primary.lighter', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Iconify icon="solar:calendar-bold" width={18} sx={{ color: 'primary.dark' }} />
            </Box>
            <Typography variant="h6" fontWeight={700}>Select Date</Typography>
          </Stack>
          <IconButton onClick={onClose} size="small" sx={{ borderRadius: 2 }}>
            <Iconify icon="solar:close-circle-bold" width={20} sx={{ color: 'text.disabled' }} />
          </IconButton>
        </Stack>
      </Box>

      <DialogContent sx={{ px: 3, pt: 2.5, pb: 2 }}>
        <Stack spacing={2}>
          {/* Month selector with arrows */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton size="small" onClick={handlePrevMonth} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Iconify icon="solar:arrow-left-linear" width={18} />
            </IconButton>
            <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1, textAlign: 'center' }}>
              {months[dialogMonth.month]} {dialogMonth.year}
            </Typography>
            <IconButton size="small" onClick={handleNextMonth} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Iconify icon="solar:arrow-right-linear" width={18} />
            </IconButton>
          </Stack>

          {/* Month quick select chips */}
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ justifyContent: 'center' }}>
            {months.map((m, idx) => (
              <Box
                key={m}
                onClick={() => setDialogMonth((prev) => ({ ...prev, month: idx }))}
                sx={{
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: dialogMonth.month === idx ? 700 : 500,
                  bgcolor: dialogMonth.month === idx ? 'primary.main' : 'action.hover',
                  color: dialogMonth.month === idx ? 'white' : 'text.secondary',
                  transition: 'all 0.15s ease',
                  '&:hover': { bgcolor: dialogMonth.month === idx ? 'primary.dark' : 'action.selected' },
                }}
              >
                {m.slice(0, 3)}
              </Box>
            ))}
          </Stack>

          {/* Day names header */}
          <Stack direction="row" spacing={0}>
            {dayNames.map((d) => (
              <Box key={d} sx={{ flex: 1, textAlign: 'center', py: 0.5 }}>
                <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {d}
                </Typography>
              </Box>
            ))}
          </Stack>

          {/* Day grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <Box key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${dialogMonth.year}-${String(dialogMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === dialogDate;
              const isPast = new Date(dateStr) < new Date(todayStr);

              return (
                <Box
                  key={day}
                  onClick={() => handleDayClick(day)}
                  sx={{
                    width: '100%',
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: isSelected ? 700 : isToday ? 600 : 400,
                    bgcolor: isSelected ? 'primary.main' : isToday ? 'primary.lighter' : 'transparent',
                    color: isSelected ? 'white' : isToday ? 'primary.dark' : isPast ? 'text.disabled' : 'text.primary',
                    border: isToday && !isSelected ? '1.5px solid' : '1.5px solid transparent',
                    borderColor: isToday && !isSelected ? 'primary.main' : 'transparent',
                    transition: 'all 0.12s ease',
                    '&:hover': {
                      bgcolor: isSelected ? 'primary.dark' : 'action.hover',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  {day}
                </Box>
              );
            })}
          </Box>
        </Stack>
      </DialogContent>

      <Box sx={{ px: 3, pb: 2.5, display: 'flex', justifyContent: 'space-between', gap: 1.5 }}>
        <Button onClick={handleClear} variant="outlined" color="inherit" sx={{ borderRadius: 2, px: 2 }}>
          Clear
        </Button>
        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2, px: 2 }}>
            Cancel
          </Button>
          <Button onClick={handleApply} variant="contained" sx={{ borderRadius: 2, px: 2.5, fontWeight: 600 }}>
            Apply
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ── Main List Page ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export default function TodoListPage() {
  const router = useRouter();
  const { user } = useAuthContext();

  // ── Data state ──
  const [todos, setTodos] = useState([]);
  const [summary, setSummary] = useState({ total: 0, draft: 0, pending: 0, hold: 0, completed: 0, today: 0, yesterday: 0, missed: 0, tomorrow: 0, next: 0 });
  const [loading, setLoading] = useState(false);
  const [notEligible, setNotEligible] = useState(false);

  // ── Filter state ──
  const [dateTab, setDateTab] = useState('today');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const [monthFilter, setMonthFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [monthMode, setMonthMode] = useState('current');
  const [customDateDialogOpen, setCustomDateDialogOpen] = useState(false);
  const [customSelectedDate, setCustomSelectedDate] = useState('');
  const [isCustomDateActive, setIsCustomDateActive] = useState(false);

  // ── Pagination state ──
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ── Dialog state ──
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTodoId, setSelectedTodoId] = useState(null);
  const [printTodo, setPrintTodo] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTodoId, setEditTodoId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // ── Status change state ──
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [statusChangeTodo, setStatusChangeTodo] = useState(null);
  const [statusChangeConfirmOpen, setStatusChangeConfirmOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [updatingRowStatus, setUpdatingRowStatus] = useState(false);

  // ── Data fetching ──
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const useDateTab = dateTab !== 'all';
      const params = {
        page,
        page_size: pageSize,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(roleFilter && { role: roleFilter }),
        ...(isCustomDateActive && startDate && endDate && { start_date: startDate, end_date: endDate }),
        ...(!isCustomDateActive && useDateTab && { date_tab: dateTab }),
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
  }, [page, pageSize, search, statusFilter, roleFilter, startDate, endDate, dateTab, isCustomDateActive]);

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

  // ── Filter handlers ──
  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };
  const handleRoleFilterChange = (value) => {
    setRoleFilter(value);
    setPage(1);
  };
  const handleReset = () => {
    setDateTab('all');
    setSearch('');
    setStatusFilter('');
    setRoleFilter('');
    setMonthFilter('');
    setStartDate('');
    setEndDate('');
    setMonthMode('current');
    setCustomSelectedDate('');
    setIsCustomDateActive(false);
    setPage(1);
  };

  // ── Pagination ──
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  };

  // ── CRUD handlers ──
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
    router.push(paths.dashboard.todo.details(id));
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

  const handleCreate = () => setCreateDialogOpen(true);
  const handleEdit = useCallback((id) => {
    setEditTodoId(id);
    setEditDialogOpen(true);
  }, []);

  // ── Listen for edit event from View dialog ──
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.todoId) {
        handleEdit(e.detail.todoId);
      }
    };
    window.addEventListener('todo-view-edit', handler);
    return () => window.removeEventListener('todo-view-edit', handler);
  }, [handleEdit]);

  // ── Table head cell style ──
  const thSx = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: 'text.disabled',
    bgcolor: 'background.neutral',
    py: 1.5,
    px: 2,
    whiteSpace: 'nowrap',
    borderBottom: '1px solid',
    borderColor: 'divider',
  };

  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2.5, md: 4 } }}>
      {/* ── Page header ── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3.5 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.2 }}>
            Todo List
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage your tasks and assignments
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={handleCreate}
          sx={{
            borderRadius: 2.5,
            px: 2.5,
            py: 1,
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
            '&:hover': {
              boxShadow: '0 6px 20px rgba(99,102,241,0.45)',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          Create Todo
        </Button>
      </Stack>

      {/* ── Summary cards ── */}
      <Grid container spacing={2} sx={{ mb: 3.5 }}>
        {SUMMARY_CARDS.map((card) => (
          <Grid key={card.key} size={{ xs: 6, sm: 3 }}>
            <Card
              sx={{
                p: { xs: 2, md: 2.5 },
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                borderRadius: 3,
                boxShadow: 'none',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.18s, box-shadow 0.18s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                },
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: card.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                }}
              >
                <Iconify icon={card.icon} width={22} sx={{ color: 'white' }} />
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  sx={{ lineHeight: 1.1, color: card.numColor, fontWeight: 800 }}
                >
                  {summary[card.key]}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.25, fontSize: 12.5 }}
                >
                  {card.label}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Not eligible ── */}
      {notEligible && <NotEligibleCard onCreateClick={handleCreate} />}

      {/* ── Merged Filter Bar ── */}
      {!notEligible && (
        <Card
          sx={{
            p: { xs: 2, md: 2.5 },
            mb: 2,
            borderRadius: 3,
            boxShadow: 'none',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* Date Tabs */}
          <Stack sx={{ mb: 2 }} direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {[
              { value: 'all', label: 'All', count: summary.total, color: 'primary' },
              { value: 'missed', label: 'Missing', count: summary.missed, color: 'error' },
              { value: 'yesterday', label: 'Yesterday', count: summary.yesterday, color: 'warning' },
              { value: 'today', label: 'Today', count: summary.today, color: 'success' },
              { value: 'tomorrow', label: 'Tomorrow', count: summary.tomorrow, color: 'info' },
            ].map((tab) => {
              const isActive = !isCustomDateActive && dateTab === tab.value;
              return (
                <Box
                  key={tab.value}
                  onClick={() => { setDateTab(tab.value); setIsCustomDateActive(false); setCustomSelectedDate(''); setMonthFilter(''); setStartDate(''); setEndDate(''); setPage(1); }}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.75,
                    py: 0.85,
                    borderRadius: 2,
                    cursor: 'pointer',
                    border: '2px solid',
                    borderColor: isActive ? `${tab.color}.main` : 'divider',
                    bgcolor: isActive ? `${tab.color}.lighter` : 'transparent',
                    color: isActive ? `${tab.color}.dark` : 'text.secondary',
                    fontSize: 12.5,
                    fontWeight: isActive ? 700 : 500,
                    transition: 'all 0.18s ease',
                    '&:hover': { borderColor: `${tab.color}.main`, bgcolor: `${tab.color}.lighter`, color: `${tab.color}.dark` },
                  }}
                >
                  {isActive && <Iconify icon="solar:check-circle-bold" width={14} />}
                  {tab.label} ({tab.count})
                </Box>
              );
            })}
            {/* Custom Date Button */}
            <Box
              onClick={() => setCustomDateDialogOpen(true)}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.75,
                py: 0.85,
                borderRadius: 2,
                cursor: 'pointer',
                border: '2px dashed',
                borderColor: isCustomDateActive && (customSelectedDate || monthFilter) ? 'secondary.main' : 'divider',
                bgcolor: isCustomDateActive && (customSelectedDate || monthFilter) ? 'secondary.lighter' : 'transparent',
                color: isCustomDateActive && (customSelectedDate || monthFilter) ? 'secondary.dark' : 'text.secondary',
                fontSize: 12.5,
                fontWeight: isCustomDateActive && (customSelectedDate || monthFilter) ? 700 : 500,
                transition: 'all 0.18s ease',
                '&:hover': { borderColor: 'secondary.main', bgcolor: 'secondary.lighter', color: 'secondary.dark' },
              }}
            >
              {isCustomDateActive && (customSelectedDate || monthFilter) && <Iconify icon="solar:check-circle-bold" width={14} />}
              <Iconify icon="solar:calendar-bold" width={14} />
              {customSelectedDate
                ? dayjs(customSelectedDate).format('DD MMM YYYY')
                : monthFilter
                  ? `${dayjs(monthFilter + '-01').format('MMM YYYY')}`
                  : 'Custom Date'}
            </Box>
          </Stack>

          {/* Search + Status + Type filters */}
          <Grid container spacing={1.5} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by title or creator…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                InputProps={{
                  sx: { borderRadius: 2 },
                  startAdornment: (
                    <Iconify
                      icon="solar:magnifer-linear"
                      sx={{ mr: 1, color: 'text.disabled', flexShrink: 0 }}
                    />
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
                InputProps={{ sx: { borderRadius: 2 } }}
              >
                <MenuItem value="">All Status</MenuItem>
                {STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt.key} value={opt.key}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_BADGE_STYLES[opt.key]?.dot || 'grey.400', flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ flex: 1 }}>{opt.label}</Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600 }}>
                        ({summary[opt.key] || 0})
                      </Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Todo Type"
                value={roleFilter}
                onChange={(e) => handleRoleFilterChange(e.target.value)}
                InputProps={{ sx: { borderRadius: 2 } }}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="created">Created by me</MenuItem>
                <MenuItem value="assigned">Assigned to me</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 'auto' }}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleReset}
                  startIcon={<Iconify icon="solar:eraser-bold" />}
                  sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
                >
                  Reset
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    loadData();
                    loadSummary();
                  }}
                  startIcon={<Iconify icon="solar:refresh-bold" />}
                  sx={{ borderRadius: 2 }}
                >
                  Refresh
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Card>
      )}
      {/* ── Table ── */}
      {!notEligible && (
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: 'none',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...thSx, width: 50, textAlign: 'center' }}>SL No</TableCell>
                  <TableCell sx={thSx}>Todo Title</TableCell>
                  <TableCell sx={thSx}>Assigned Users</TableCell>
                  <TableCell sx={thSx}>Status</TableCell>
                  <TableCell sx={thSx}>Expected Date</TableCell>
                  <TableCell sx={thSx}>List Type</TableCell>
                  <TableCell sx={thSx}>Creator</TableCell>
                  <TableCell sx={thSx}>Created At</TableCell>
                  <TableCell sx={{ ...thSx, textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <CircularProgress size={28} thickness={3} />
                    </TableCell>
                  </TableRow>
                ) : todos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <Box>
                        <Iconify
                          icon="solar:inbox-bold"
                          width={40}
                          sx={{ color: 'text.disabled', mb: 1.5 }}
                        />
                        <Typography color="text.secondary" variant="body2">
                          No todos found
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  todos.map((todo, idx) => (
                    <TableRow
                      key={todo.id}
                      hover
                      sx={{
                        '&:last-child td': { borderBottom: 0 },
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'background 0.12s',
                        bgcolor: idx % 2 === 0 ? 'transparent' : 'action.hover',
                        // '&:hover': { bgcolor: 'action.selected' },
                      }}
                    >
                      {/* SL No */}
                      <TableCell sx={{ px: 2, py: 2, textAlign: 'center', width: 50 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {(page - 1) * pageSize + idx + 1}
                        </Typography>
                      </TableCell>

                      {/* Title + description */}
                      <TableCell sx={{ px: 2, py: 2, maxWidth: 220 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                          <Typography
                            variant="subtitle2"
                            noWrap
                            sx={{ fontWeight: 600, fontSize: 13, flex: 1, minWidth: 0 }}
                          >
                            {todo.todo_title}
                          </Typography>
                          {todo.is_recurring && (
                            <Tooltip
                              title={
                                todo.recurrence_type === 'daily' ? 'Daily recurring' :
                                todo.recurrence_type === 'weekly' ? `Weekly (${(todo.recurrence_weekdays || []).map(d => ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d]).join(', ')})` :
                                todo.recurrence_type === 'monthly' ? `Monthly (day ${todo.recurrence_day_of_month})` :
                                'Recurring'
                              }
                              arrow
                            >
                              <Box
                                sx={{
                                  display: 'inline-flex', alignItems: 'center', gap: 0.25,
                                  px: 0.75, py: 0.25, borderRadius: 1,
                                  bgcolor: 'secondary.lighter', color: 'secondary.dark',
                                  fontSize: 10, fontWeight: 700, flexShrink: 0,
                                }}
                              >
                                <Iconify icon="solar:recurso-bold" width={12} />
                              </Box>
                            </Tooltip>
                          )}
                        </Stack>
                        {todo.description && (
                          <Box
                            sx={{
                              display: 'block',
                              mt: 0.3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '100%',
                              '& *': {
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                margin: 0,
                                padding: 0,
                                lineHeight: 1.4,
                              },
                              '& p': { margin: 0 },
                              '& span': { margin: 0 },
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              component="div"
                              dangerouslySetInnerHTML={{ __html: todo.description }}
                            />
                          </Box>
                        )}
                      </TableCell>

                      {/* Assigned users */}
                      <TableCell sx={{ px: 2, py: 2 }}>
                        {todo.assigned_users?.length > 0 ? (
                          <AvatarGroup
                            max={3}
                            sx={{
                              justifyContent: 'flex-start',
                              '& .MuiAvatar-root': {
                                width: 28,
                                height: 28,
                                fontSize: 11,
                                fontWeight: 700,
                                ml: '-6px !important',
                                border: '2px solid',
                                borderColor: 'background.paper',
                                '&:first-of-type': { ml: '0 !important' },
                                bgcolor: 'primary.lighter',
                                color: 'primary.dark',
                              },
                            }}
                          >
                            {todo.assigned_users.map((u) => (
                              <Tooltip key={u.id} title={`${u.name} (${u.email})`} arrow>
                                <Avatar>{u.name?.charAt(0)?.toUpperCase() || '?'}</Avatar>
                              </Tooltip>
                            ))}
                          </AvatarGroup>
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell sx={{ px: 2, py: 2 }}>
                        <StatusBadge status={todo.status} />
                      </TableCell>

                      {/* Expected Date */}
                      <TableCell sx={{ px: 2, py: 2 }}>
                        {todo.expected_date ? (
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              px: 1,
                              py: 0.4,
                              borderRadius: 1.5,
                              bgcolor: isMissed(todo) ? 'error.lighter' : 'grey.50',
                              border: '1px solid',
                              borderColor: isMissed(todo) ? 'error.main' : 'divider',
                            }}
                          >
                            <Iconify
                              icon={isMissed(todo) ? 'solar:danger-triangle-bold' : 'solar:calendar-bold'}
                              width={13}
                              sx={{ color: isMissed(todo) ? 'error.main' : 'text.secondary' }}
                            />
                            <Typography
                              variant="caption"
                              fontWeight={600}
                              sx={{ color: isMissed(todo) ? 'error.dark' : 'text.primary', fontSize: 11.5 }}
                            >
                              {dayjs(todo.expected_date).format('DD MMM YYYY')}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </TableCell>

                      {/* Role */}
                      <TableCell sx={{ px: 2, py: 2 }}>
                        <RoleTag role={todo.role} />
                      </TableCell>

                      {/* Creator */}
                      <TableCell sx={{ px: 2, py: 2 }}>
                        <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 600 }} noWrap>
                          {todo.creator_name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          sx={{ display: 'block', mt: 0.2 }}
                        >
                          {todo.creator_email}
                        </Typography>
                      </TableCell>

                      {/* Date */}
                      <TableCell sx={{ px: 2, py: 2 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 500 }}
                        >
                          {new Date(todo.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Typography>
                      </TableCell>

                      {/* Actions */}
                      <TableCell sx={{ px: 2, py: 2, textAlign: 'center' }}>
                        <Stack direction="row" spacing={0.25} justifyContent="center">
                          <ActionBtn
                            title="View Details"
                            icon="solar:eye-bold"
                            onClick={() => handleView(todo.id)}
                            hoverBg="info.lighter"
                            hoverColor="info.dark"
                          />
                          <ActionBtn
                            title="Print"
                            icon="solar:printer-bold"
                            onClick={() => handlePrint(todo.id)}
                            hoverBg="grey.200"
                            hoverColor="text.primary"
                          />
                          {canEdit(todo) && (
                            <ActionBtn
                              title="Edit"
                              icon="solar:pen-bold"
                              onClick={() => handleEdit(todo.id)}
                              hoverBg="primary.lighter"
                              hoverColor="primary.dark"
                            />
                          )}
                          {canDelete(todo) && (
                            <ActionBtn
                              title="Delete"
                              icon="solar:trash-bin-trash-bold"
                              onClick={() => handleDeleteClick(todo.id)}
                              hoverBg="error.lighter"
                              hoverColor="error.dark"
                            />
                          )}
                          {/* Status change button */}
                          <Tooltip title="Change Status" arrow>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                setStatusMenuAnchor(e.currentTarget);
                                setStatusChangeTodo(todo);
                              }}
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1.5,
                                color: 'warning.dark',
                                transition: 'all 0.18s ease',
                                '&:hover': {
                                  bgcolor: 'warning.lighter',
                                  color: 'warning.dark',
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                                },
                              }}
                            >
                              <Iconify icon="solar:refresh-circle-bold" width={17} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* ── Pagination ── */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 2,
              py: 1.75,
              borderTop: '1px solid',
              borderColor: 'divider',
              flexWrap: 'wrap',
              gap: 1.5,
              bgcolor: 'background.neutral',
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12.5 }}>
              Showing{' '}
              <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {todos.length > 0 ? (page - 1) * pageSize + 1 : 0}–
                {Math.min(page * pageSize, totalCount)}
              </Box>{' '}
              of{' '}
              <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {totalCount}
              </Box>{' '}
              todos
            </Typography>

            <Stack direction="row" spacing={0.5} alignItems="center">
              <IconButton
                size="small"
                disabled={page <= 1}
                onClick={() => handlePageChange(1)}
                sx={{ borderRadius: 1.5, width: 30, height: 30 }}
              >
                <Iconify icon="solar:alt-arrow-left-linear" width={15} />
              </IconButton>
              <IconButton
                size="small"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                sx={{ borderRadius: 1.5, width: 30, height: 30 }}
              >
                <Iconify icon="solar:arrow-left-linear" width={15} />
              </IconButton>

              {getPageNumbers()[0] > 1 && (
                <Typography variant="body2" sx={{ px: 0.5, color: 'text.disabled' }}>
                  …
                </Typography>
              )}
              {getPageNumbers().map((pageNum) => (
                <Button
                  key={pageNum}
                  size="small"
                  variant={pageNum === page ? 'contained' : 'text'}
                  onClick={() => handlePageChange(pageNum)}
                  disableElevation
                  sx={{
                    minWidth: 30,
                    height: 30,
                    p: 0,
                    fontSize: 13,
                    borderRadius: 1.5,
                    fontWeight: pageNum === page ? 700 : 400,
                  }}
                >
                  {pageNum}
                </Button>
              ))}
              {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                <Typography variant="body2" sx={{ px: 0.5, color: 'text.disabled' }}>
                  …
                </Typography>
              )}

              <IconButton
                size="small"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                sx={{ borderRadius: 1.5, width: 30, height: 30 }}
              >
                <Iconify icon="solar:arrow-right-linear" width={15} />
              </IconButton>
              <IconButton
                size="small"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(totalPages)}
                sx={{ borderRadius: 1.5, width: 30, height: 30 }}
              >
                <Iconify icon="solar:alt-arrow-right-linear" width={15} />
              </IconButton>

              <TextField
                select
                size="small"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                sx={{
                  width: 76,
                  ml: 1.5,
                  '& .MuiOutlinedInput-root': { height: 30, fontSize: 13, borderRadius: 1.5 },
                }}
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

      {/* ── Dialogs ── */}
      <TodoCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => {
          loadData();
          loadSummary();
        }}
      />
      <TodoEditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        todoId={editTodoId}
        onSuccess={() => {
          loadData();
          loadSummary();
        }}
      />
      <TodoViewDialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        todoId={selectedTodoId}
        onStatusUpdate={(id, newStatus) => {
          setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
          loadSummary();
        }}
        onDeleteClick={handleDeleteClick}
      />
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
      {printTodo && (
        <PrintPreviewDialog
          open={!!printTodo}
          onClose={() => setPrintTodo(null)}
          todo={printTodo}
        />
      )}
      <CustomDateDialog
        open={customDateDialogOpen}
        onClose={() => setCustomDateDialogOpen(false)}
        selectedDate={customSelectedDate}
        onDateSelect={(date) => {
          setCustomSelectedDate(date);
          if (date) {
            setStartDate(date);
            setEndDate(date);
            setMonthFilter('');
            setIsCustomDateActive(true);
          } else {
            setStartDate('');
            setEndDate('');
            setIsCustomDateActive(false);
          }
          setPage(1);
        }}
        selectedMonth={monthFilter}
        onMonthChange={(month) => {
          setMonthFilter(month);
          if (month) {
            // Calculate full month range: first day to last day
            const [year, monthNum] = month.split('-').map(Number);
            const firstDay = `${year}-${String(monthNum).padStart(2, '0')}-01`;
            const lastDayDate = new Date(year, monthNum, 0); // Day 0 = last day of previous month
            const lastDay = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDayDate.getDate()).padStart(2, '0')}`;
            setStartDate(firstDay);
            setEndDate(lastDay);
            setCustomSelectedDate('');
            setIsCustomDateActive(true);
          } else {
            setStartDate('');
            setEndDate('');
            setIsCustomDateActive(false);
          }
          setPage(1);
        }}
      />

      {/* ── Status Change Menu ── */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={() => {
          setStatusMenuAnchor(null);
          setStatusChangeTodo(null);
        }}
        PaperProps={{
          sx: { borderRadius: 2, mt: 0.5, minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
        }}
      >
        {STATUS_OPTIONS.filter((opt) => {
          if (opt.key === 'draft') {
            return statusChangeTodo?.role === 'created' || isSuperUser;
          }
          return true;
        }).map((opt) => {
          const cfg = STATUS_BADGE_STYLES[opt.key];
          const isCurrent = statusChangeTodo?.status === opt.key;
          return (
            <MenuItem
              key={opt.key}
              onClick={() => {
                setStatusMenuAnchor(null);
                if (!isCurrent) {
                  setPendingStatusChange(opt.key);
                  setStatusChangeConfirmOpen(true);
                } else {
                  setStatusChangeTodo(null);
                }
              }}
              sx={{
                py: 1.25,
                px: 2,
                gap: 1.5,
                '&:hover': { bgcolor: cfg.bg },
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: cfg.dot,
                  flexShrink: 0,
                }}
              />
              <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                {opt.label}
              </Typography>
              {isCurrent && <Iconify icon="solar:check-circle-bold" width={16} color={cfg.dot} />}
            </MenuItem>
          );
        })}
      </Menu>

      {/* ── Status Change Confirmation Dialog ── */}
      <Dialog
        open={statusChangeConfirmOpen}
        onClose={() => setStatusChangeConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify icon="solar:refresh-circle-bold" width={22} color="primary.main" />
            <Typography variant="h6">Change Status</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to change the status to <strong>{pendingStatusChange}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setStatusChangeConfirmOpen(false);
              setPendingStatusChange(null);
            }}
            disabled={updatingRowStatus}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!statusChangeTodo || !pendingStatusChange) return;
              setUpdatingRowStatus(true);
              try {
                await patchTodoStatus(statusChangeTodo.id, { status: pendingStatusChange });
                setTodos((prev) =>
                  prev.map((t) =>
                    t.id === statusChangeTodo.id ? { ...t, status: pendingStatusChange } : t
                  )
                );
                toast.success(`Status changed to ${pendingStatusChange}`);
                loadSummary();
              } catch (error) {
                toast.error(error.message || 'Failed to update status');
              } finally {
                setUpdatingRowStatus(false);
                setStatusChangeConfirmOpen(false);
                setPendingStatusChange(null);
                setStatusChangeTodo(null);
              }
            }}
            disabled={updatingRowStatus}
            startIcon={updatingRowStatus ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ borderRadius: 2 }}
          >
            {updatingRowStatus ? 'Updating…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
