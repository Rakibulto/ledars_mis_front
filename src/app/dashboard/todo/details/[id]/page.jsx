'use client';

import { toast } from 'sonner';
import React, { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Link,
  Stack,
  Button,
  Avatar,
  Dialog,
  Tooltip,
  Divider,
  Typography,
  IconButton,
  Breadcrumbs,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useParams, useRouter } from 'src/routes/hooks';

import { fetchTodo, patchTodoStatus, createTodoAttachment } from 'src/actions/todo';

import { Iconify } from 'src/components/iconify';
import TiptapEditor from 'src/components/tiptap-editor';
import AttachmentDialog from 'src/components/todo/attachment-dialog';
import PrintPreviewDialog from 'src/components/todo/print-preview-dialog';

import { useAuthContext } from 'src/auth/hooks';

// ── Tokens ───────────────────────────────────────────────────────────

const MONO = '"SFMono-Regular","JetBrains Mono",Consolas,Menlo,monospace';

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    icon: 'solar:document-bold',
    bg: 'grey.100',
    color: 'text.secondary',
    dot: 'grey.500',
  },
  pending: {
    label: 'Pending',
    icon: 'solar:clock-circle-bold',
    bg: 'info.lighter',
    color: 'info.dark',
    dot: 'info.main',
  },
  hold: {
    label: 'Hold',
    icon: 'solar:pause-circle-bold',
    bg: 'warning.lighter',
    color: 'warning.dark',
    dot: 'warning.main',
  },
  completed: {
    label: 'Completed',
    icon: 'solar:check-circle-bold',
    bg: 'success.lighter',
    color: 'success.dark',
    dot: 'success.main',
  },
};

// ── Small shared bits ────────────────────────────────────────────────

function Eyebrow({ children, color = 'text.secondary', sx }) {
  return (
    <Typography
      variant="caption"
      sx={{
        textTransform: 'uppercase',
        letterSpacing: 1.4,
        fontWeight: 700,
        fontSize: 11,
        color,
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
}

function InitialsAvatar({ name, size = 32 }) {
  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        fontWeight: 700,
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
        color: 'common.white',
      }}
    >
      {name?.charAt(0)?.toUpperCase() || '?'}
    </Avatar>
  );
}

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <Stack
      direction="row"
      spacing={0.75}
      alignItems="center"
      sx={{
        display: 'inline-flex',
        px: 1.25,
        py: 0.5,
        borderRadius: 1.5,
        bgcolor: cfg.bg,
        color: cfg.color,
        fontWeight: 700,
        fontSize: 12.5,
      }}
    >
      <Iconify icon={cfg.icon} width={14} />
      {cfg.label}
    </Stack>
  );
}

function DetailRow({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.25 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ fontFamily: MONO, fontWeight: 700, fontSize: 13 }}>{value}</Box>
    </Stack>
  );
}

function RosterRow({
  name,
  email,
  roleLabel,
  count,
  onShowUpdates,
  canAddData,
  onAddData,
  showDivider,
}) {
  return (
    <>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 1.75 }}>
        <InitialsAvatar name={name} size={36} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" fontWeight={700} noWrap>
              {name || 'Unnamed'}
            </Typography>
            <Box
              sx={{
                px: 0.75,
                py: 0.1,
                borderRadius: 1,
                bgcolor: 'action.hover',
                fontSize: 10,
                fontWeight: 700,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: 0.4,
                flexShrink: 0,
              }}
            >
              {roleLabel}
            </Box>
          </Stack>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {email}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: 52 }}>
          <Typography sx={{ fontFamily: MONO, fontWeight: 700, fontSize: 15, lineHeight: 1 }}>
            {count}
          </Typography>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.4 }}
          >
            Updates
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Show Updates" arrow>
            <IconButton size="small" onClick={onShowUpdates} sx={{ borderRadius: 1.5 }}>
              <Iconify icon="solar:folder-with-files-bold" width={17} />
            </IconButton>
          </Tooltip>
          {canAddData && (
            <Tooltip title="Add Data" arrow>
              <IconButton
                size="small"
                color="primary"
                onClick={onAddData}
                sx={{ borderRadius: 1.5 }}
              >
                <Iconify icon="solar:add-circle-bold" width={17} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>
      {showDivider && <Divider />}
    </>
  );
}

const panelSx = {
  p: 3,
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: 'none',
};

// ── Add Data Dialog ──────────────────────────────────────────────────

function AddDataDialog({ open, onClose, todoId, onSuccess }) {
  const [file, setFile] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!file && !remarks) {
      toast.error('Please upload a file or add remarks');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (remarks) formData.append('remarks', remarks);
      await createTodoAttachment(todoId, formData);
      toast.success('Data submitted successfully!');
      setFile(null);
      setRemarks('');
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to submit data');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Eyebrow color="primary.main">New Entry</Eyebrow>
        <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25 }}>
          Add Data
        </Typography>
        <Box sx={{ height: 3, width: 40, borderRadius: 2, bgcolor: 'primary.main', mt: 1.25 }} />
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Box>
            <Eyebrow sx={{ mb: 1, display: 'block' }}>Upload File</Eyebrow>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<Iconify icon="solar:upload-bold" width={18} />}
              sx={{
                borderRadius: 2,
                borderStyle: 'dashed',
                py: 1.5,
                justifyContent: 'flex-start',
                color: file ? 'text.primary' : 'text.secondary',
              }}
            >
              {file ? file.name : 'Click to choose a file'}
              <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </Button>
            {file && (
              <Button
                size="small"
                color="error"
                onClick={() => setFile(null)}
                sx={{ mt: 0.5, borderRadius: 2 }}
              >
                Remove file
              </Button>
            )}
          </Box>

          <Box>
            <Eyebrow sx={{ mb: 1, display: 'block' }}>Remarks</Eyebrow>
            <TiptapEditor
              value={remarks}
              onChange={(html) => setRemarks(html)}
              placeholder="Write your remarks..."
              minHeight={100}
            />
          </Box>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ borderRadius: 2 }}
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Details Page ────────────────────────────────────────────────

export default function TodoDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const id = params?.id;

  const [todo, setTodo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  const [attachmentUserId, setAttachmentUserId] = useState(null);
  const [addDataDialogOpen, setAddDataDialogOpen] = useState(false);
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);

  const [statusChangeConfirm, setStatusChangeConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadTodo = useCallback(() => {
    if (!id) return Promise.resolve();
    return fetchTodo(id)
      .then((data) => {
        setTodo(data);
        setNotFound(false);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    loadTodo().finally(() => setLoading(false));
  }, [id, loadTodo]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (notFound || !todo) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Iconify icon="solar:document-text-bold" width={48} color="text.disabled" />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Todo not found.
        </Typography>
        <Button
          sx={{ mt: 2, borderRadius: 2 }}
          variant="contained"
          onClick={() => router.push(paths.dashboard.todo.list)}
        >
          Back to List
        </Button>
      </Box>
    );
  }

  const assignedUsers = todo.assigned_users || [];
  const isCreator = user?.id === todo.creator_user_id;

  const formattedDate = new Date(todo.created_at).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const participantsCount = 1 + assignedUsers.length;
  const totalUpdates =
    (todo.creator_attachments_count || 0) +
    assignedUsers.reduce((sum, u) => sum + (u.attachments_count || 0), 0);

  const statusEntries = Object.entries(STATUS_CONFIG).filter(([key]) =>
    key === 'draft' ? isCreator : true
  );

  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 3 }} maxWidth="xl">
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<Iconify icon="solar:alt-arrow-right-bold" width={11} />}
        sx={{ mb: 3, '& .MuiBreadcrumbs-li': { fontSize: 12.5 } }}
      >
        <Link
          underline="hover"
          color="inherit"
          onClick={() => router.push(paths.dashboard.root)}
          sx={{ cursor: 'pointer' }}
        >
          Dashboard
        </Link>
        <Link
          underline="hover"
          color="inherit"
          onClick={() => router.push(paths.dashboard.todo.list)}
          sx={{ cursor: 'pointer' }}
        >
          Todo Management
        </Link>
        <Typography color="text.primary" fontSize={12.5} fontWeight={600}>
          {todo.todo_title}
        </Typography>
      </Breadcrumbs>

      {/* Header — status thread + record info */}
      <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: { xs: 4, md: 5 } }}>
        <Box
          sx={{
            width: 5,
            borderRadius: 10,
            bgcolor: STATUS_CONFIG[todo.status]?.dot || 'grey.400',
            flexShrink: 0,
          }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={1.5}
            sx={{ mb: 1.5 }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Eyebrow>Todo Record</Eyebrow>
              <Box
                title={String(id)}
                sx={{
                  fontFamily: MONO,
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'text.disabled',
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  maxWidth: 140,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                #{id}
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {isCreator && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Iconify icon="solar:pen-bold" width={15} />}
                  onClick={() => router.push(paths.dashboard.todo.edit(id))}
                  sx={{ borderRadius: 999, px: 2 }}
                >
                  Edit
                </Button>
              )}
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                startIcon={<Iconify icon="solar:printer-bold" width={15} />}
                onClick={() => setPrintPreviewOpen(true)}
                sx={{ borderRadius: 999, px: 2 }}
              >
                Print
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                startIcon={<Iconify icon="solar:arrow-left-bold" width={15} />}
                onClick={() => router.push(paths.dashboard.todo.list)}
                sx={{ borderRadius: 999, px: 2 }}
              >
                Back
              </Button>
            </Stack>
          </Stack>

          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ letterSpacing: -0.5, mb: 0.75, wordBreak: 'break-word' }}
          >
            {todo.todo_title}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Created by{' '}
            <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {todo.creator_name}
            </Box>{' '}
            on {formattedDate}
          </Typography>

          <Eyebrow sx={{ display: 'block', mb: 1 }}>Status</Eyebrow>
          <Box
            sx={{
              display: 'inline-flex',
              flexWrap: 'wrap',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2.5,
              overflow: 'hidden',
            }}
          >
            {statusEntries.map(([key, cfg], idx) => {
              const isActive = key === todo.status;
              return (
                <Box
                  key={key}
                  onClick={() => {
                    if (key !== todo.status) {
                      setPendingStatus(key);
                      setStatusChangeConfirm(true);
                    }
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 2,
                    py: 1,
                    cursor: 'pointer',
                    borderRight: idx < statusEntries.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    bgcolor: isActive ? cfg.bg : 'transparent',
                    color: isActive ? cfg.color : 'text.secondary',
                    fontSize: 12.5,
                    fontWeight: isActive ? 700 : 500,
                    transition: 'all 0.15s ease',
                    '&:hover': { bgcolor: cfg.bg, color: cfg.color },
                  }}
                >
                  <Iconify icon={cfg.icon} width={14} />
                  {cfg.label}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Body — main content + sidebar */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2.1fr 1fr' },
          gap: { xs: 3, md: 4 },
        }}
      >
        {/* Main column */}
        <Stack spacing={3} sx={{ minWidth: 0 }}>
          <Card sx={panelSx}>
            <Eyebrow>Description</Eyebrow>
            <Box sx={{ mt: 1.5 }}>
              {todo.description ? (
                <Box
                  sx={{
                    fontSize: 14.5,
                    lineHeight: 1.75,
                    color: 'text.primary',
                    '& p': { my: 0.75 },
                  }}
                  dangerouslySetInnerHTML={{ __html: todo.description }}
                />
              ) : (
                <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                  No description added for this record.
                </Typography>
              )}
            </Box>
          </Card>

          <Card sx={panelSx}>
            <Eyebrow>Team & Updates</Eyebrow>

            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 2,
                mb: 0.5,
                fontWeight: 700,
                color: 'text.disabled',
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                fontSize: 10,
              }}
            >
              Creator
            </Typography>
            <RosterRow
              name={todo.creator_name}
              email={todo.creator_email}
              roleLabel="Creator"
              count={todo.creator_attachments_count || 0}
              onShowUpdates={() => {
                setAttachmentUserId(todo.creator_user_id);
                setAttachmentDialogOpen(true);
              }}
              canAddData={isCreator}
              onAddData={() => setAddDataDialogOpen(true)}
              showDivider
            />

            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 1.5,
                mb: 0.5,
                fontWeight: 700,
                color: 'text.disabled',
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                fontSize: 10,
              }}
            >
              Assigned ({assignedUsers.length})
            </Typography>
            {assignedUsers.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Iconify icon="solar:users-group-rounded-bold" width={28} color="text.disabled" />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  No users assigned to this record yet.
                </Typography>
              </Box>
            ) : (
              assignedUsers.map((u, idx) => (
                <RosterRow
                  key={u.id}
                  name={u.name}
                  email={u.email}
                  roleLabel="Assigned"
                  count={u.attachments_count || 0}
                  onShowUpdates={() => {
                    setAttachmentUserId(u.id);
                    setAttachmentDialogOpen(true);
                  }}
                  canAddData={user?.id === u.id}
                  onAddData={() => setAddDataDialogOpen(true)}
                  showDivider={idx < assignedUsers.length - 1}
                />
              ))
            )}
          </Card>
        </Stack>

        {/* Sidebar */}
        <Box sx={{ minWidth: 0 }}>
          <Card sx={panelSx}>
            <Eyebrow>Overview</Eyebrow>
            <Stack divider={<Divider />} sx={{ mt: 1 }}>
              <DetailRow label="Status" value={<StatusPill status={todo.status} />} />
              <DetailRow label="Created" value={formattedDate} />
              <DetailRow label="Participants" value={participantsCount} />
              <DetailRow label="Total Updates" value={totalUpdates} />
            </Stack>
          </Card>

          <Card sx={{ ...panelSx, mt: 3 }}>
            <Eyebrow>Created By</Eyebrow>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
              <InitialsAvatar name={todo.creator_name} size={44} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} noWrap>
                  {todo.creator_name}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ display: 'block' }}
                >
                  {todo.creator_email}
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Box>
      </Box>

      {/* Dialogs */}
      <AttachmentDialog
        open={attachmentDialogOpen}
        onClose={() => setAttachmentDialogOpen(false)}
        todoId={id}
        userId={attachmentUserId}
      />
      <AddDataDialog
        open={addDataDialogOpen}
        onClose={() => setAddDataDialogOpen(false)}
        todoId={id}
        onSuccess={loadTodo}
      />
      <PrintPreviewDialog
        open={printPreviewOpen}
        onClose={() => setPrintPreviewOpen(false)}
        todo={todo}
      />

      {/* Status Change Confirmation Dialog */}
      <Dialog
        open={statusChangeConfirm}
        onClose={() => setStatusChangeConfirm(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle component="div" sx={{ pb: 1.5 }}>
          <Eyebrow color={`${STATUS_CONFIG[pendingStatus]?.color || 'primary.main'}`}>
            Confirm Action
          </Eyebrow>

          <Typography variant="h6" component="div" fontWeight={800} sx={{ mt: 0.25 }}>
            Change Status
          </Typography>

          <Box
            sx={{
              height: 3,
              width: 40,
              borderRadius: 2,
              bgcolor: STATUS_CONFIG[pendingStatus]?.dot || 'primary.main',
              mt: 1.25,
            }}
          />
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This record will move from its current status to:
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <StatusPill status={todo.status} />
            <Iconify icon="solar:arrow-right-bold" width={18} color="text.disabled" />
            {pendingStatus && <StatusPill status={pendingStatus} />}
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setStatusChangeConfirm(false)}
            disabled={updatingStatus}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!pendingStatus) return;
              setUpdatingStatus(true);
              try {
                await patchTodoStatus(id, { status: pendingStatus });
                setTodo((prev) => ({ ...prev, status: pendingStatus }));
                toast.success(`Status changed to ${pendingStatus}`);
              } catch (error) {
                toast.error(error.message || 'Failed to update status');
              } finally {
                setUpdatingStatus(false);
                setStatusChangeConfirm(false);
                setPendingStatus(null);
              }
            }}
            disabled={updatingStatus}
            startIcon={updatingStatus ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ borderRadius: 2 }}
          >
            {updatingStatus ? 'Updating...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
