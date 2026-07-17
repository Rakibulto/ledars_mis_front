'use client';

import { toast } from 'sonner';
import React, { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Tab,
  Tabs,
  Stack,
  Dialog,
  Button,
  Tooltip,
  Divider,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import { fetchTodoAttachments, updateTodoAttachment, deleteTodoAttachment } from 'src/actions/todo';

import { Iconify } from 'src/components/iconify';
import TiptapEditor from 'src/components/tiptap-editor';

import { useAuthContext } from 'src/auth/hooks';

const MONO = '"SFMono-Regular","JetBrains Mono",Consolas,Menlo,monospace';

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

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

function DialogHead({ eyebrow, title, accentColor = 'primary.main' }) {
  return (
    <DialogTitle sx={{ pb: 1.5 }}>
      <Eyebrow color={accentColor}>{eyebrow}</Eyebrow>
      <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25 }}>
        {title}
      </Typography>
      <Box sx={{ height: 3, width: 40, borderRadius: 2, bgcolor: accentColor, mt: 1.25 }} />
    </DialogTitle>
  );
}

// ── Confirm Delete Dialog ────────────────────────────────────────────

function ConfirmDeleteDialog({ open, onClose, onConfirm, loading }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogHead eyebrow="Confirm Action" title="Delete Update" accentColor="error.main" />
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          Are you sure you want to delete this update? This action cannot be undone.
        </Typography>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading} sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ borderRadius: 2 }}
        >
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Tab Panel ────────────────────────────────────────────────────────

function TabPanel({ children, index, value }) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ pt: 2.5 }}>
      {value === index && children}
    </Box>
  );
}

// ── Attachment Card View ─────────────────────────────────────────────

function AttachmentViewCard({ attachment, canEdit }) {
  return (
    <Box sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="solar:calendar-bold" width={16} color="text.secondary" />
          <Typography variant="caption" sx={{ fontFamily: MONO }} color="text.secondary">
            {formatDateTime(attachment.created_at)}
          </Typography>
        </Stack>
        {canEdit && (
          <Box
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: 'primary.lighter',
              color: 'primary.dark',
              fontSize: 10.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
            }}
          >
            Yours
          </Box>
        )}
      </Stack>

      <Box sx={{ mb: 2.5 }}>
        <Eyebrow sx={{ mb: 1, display: 'block' }}>Remarks</Eyebrow>
        {attachment.remarks ? (
          <Box
            sx={{
              fontSize: 14,
              lineHeight: 1.7,
              color: 'text.primary',
              '& p': { my: 0.5 },
            }}
            dangerouslySetInnerHTML={{ __html: attachment.remarks }}
          />
        ) : (
          <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
            No remarks provided.
          </Typography>
        )}
      </Box>

      <Box>
        <Eyebrow sx={{ mb: 1, display: 'block' }}>File</Eyebrow>
        {attachment.file ? (
          <Button
            variant="outlined"
            size="small"
            component="a"
            href={attachment.file}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<Iconify icon="solar:download-bold" width={16} />}
            sx={{ borderRadius: 2 }}
          >
            Download File
          </Button>
        ) : (
          <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
            No file uploaded.
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// ── Attachment Edit Card ─────────────────────────────────────────────

function AttachmentEditCard({
  attachment,
  remarks,
  setRemarks,
  file,
  setFile,
  onSave,
  onCancel,
  saving,
}) {
  return (
    <Box sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
        <Iconify icon="solar:calendar-bold" width={16} color="text.secondary" />
        <Typography variant="caption" sx={{ fontFamily: MONO }} color="text.secondary">
          {formatDateTime(attachment.created_at)}
        </Typography>
      </Stack>

      <Box sx={{ mb: 2.5 }}>
        <Eyebrow sx={{ mb: 1, display: 'block' }}>Remarks</Eyebrow>
        <TiptapEditor
          value={remarks}
          onChange={(html) => setRemarks(html)}
          placeholder="Write updated remarks..."
          minHeight={100}
        />
      </Box>

      <Box sx={{ mb: 2.5 }}>
        <Eyebrow sx={{ mb: 1, display: 'block' }}>File</Eyebrow>
        {file ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              component="label"
              startIcon={<Iconify icon="solar:upload-bold" width={16} />}
              sx={{ borderRadius: 2, borderStyle: 'dashed' }}
            >
              {file.name}
              <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </Button>
            <Button
              size="small"
              color="error"
              onClick={() => setFile(null)}
              sx={{ borderRadius: 2 }}
            >
              Remove
            </Button>
          </Stack>
        ) : (
          <Button
            variant="outlined"
            component="label"
            startIcon={<Iconify icon="solar:upload-bold" width={16} />}
            sx={{ borderRadius: 2, borderStyle: 'dashed' }}
          >
            Replace File
            <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </Button>
        )}
        {!file && !attachment.file && (
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
            No file currently uploaded.
          </Typography>
        )}
        {!file && attachment.file && (
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
            Currently: {attachment.file.split('/').pop()}
          </Typography>
        )}
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button onClick={onCancel} disabled={saving} sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ borderRadius: 2 }}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </Stack>
    </Box>
  );
}

// ── Main AttachmentDialog ────────────────────────────────────────────

export default function AttachmentDialog({ open, onClose, todoId, userId }) {
  const { user } = useAuthContext();

  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editRemarks, setEditRemarks] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const currentAttachment = attachments[activeTab] || null;

  const loadAttachments = useCallback(async () => {
    if (!todoId || !userId) return;
    setLoading(true);
    try {
      const data = await fetchTodoAttachments(todoId, { user_id: userId, page_size: 50 });
      setAttachments(data.results || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [todoId, userId]);

  useEffect(() => {
    if (open && todoId && userId) {
      loadAttachments();
      setActiveTab(0);
      setEditMode(false);
      setEditRemarks('');
      setEditFile(null);
    }
  }, [open, todoId, userId, loadAttachments]);

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
    setEditMode(false);
    setEditRemarks('');
    setEditFile(null);
  };

  const canEdit =
    currentAttachment && (user?.id === currentAttachment.user?.id || user?.is_superuser);

  const handleEdit = () => {
    if (!currentAttachment) return;
    setEditMode(true);
    setEditRemarks(currentAttachment.remarks || '');
    setEditFile(null);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditRemarks('');
    setEditFile(null);
  };

  const handleSaveEdit = async () => {
    if (!currentAttachment) return;
    setSaving(true);
    try {
      const formData = new FormData();
      if (editFile) formData.append('file', editFile);
      if (editRemarks) formData.append('remarks', editRemarks);
      await updateTodoAttachment(todoId, currentAttachment.id, formData);
      toast.success('Attachment updated successfully!');
      setEditMode(false);
      setEditRemarks('');
      setEditFile(null);
      await loadAttachments();
    } catch (error) {
      toast.error(error.message || 'Failed to update attachment');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!currentAttachment) return;
    setDeleting(true);
    try {
      await deleteTodoAttachment(todoId, currentAttachment.id);
      toast.success('Attachment deleted successfully!');
      setDeleteConfirmOpen(false);
      await loadAttachments();
      const remainingCount = attachments.length - 1;
      if (remainingCount === 0) {
        setActiveTab(0);
      } else if (activeTab >= remainingCount) {
        setActiveTab(remainingCount - 1);
      }
      setEditMode(false);
    } catch (error) {
      toast.error(error.message || 'Failed to delete attachment');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1.5 }}>
          <Eyebrow>Updates</Eyebrow>
          <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25 }}>
            {attachments.length > 0
              ? `${attachments.length} Update${attachments.length > 1 ? 's' : ''}`
              : 'Update Log'}
          </Typography>
          <Box sx={{ height: 3, width: 40, borderRadius: 2, bgcolor: 'primary.main', mt: 1.25 }} />
        </DialogTitle>

        <DialogContent sx={{ minHeight: 320 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 7 }}>
              <CircularProgress size={32} />
            </Box>
          ) : attachments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 7 }}>
              <Iconify icon="solar:inbox-archive-bold" width={48} color="text.disabled" />
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                No updates yet.
              </Typography>
            </Box>
          ) : (
            <>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: 0,
                  mb: 1,
                  '& .MuiTabs-indicator': { display: 'none' },
                  '& .MuiTabs-flexContainer': { gap: 1 },
                  '& .MuiTab-root': {
                    minHeight: 0,
                    minWidth: 0,
                    px: 1.75,
                    py: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    border: '1px solid',
                    borderColor: 'divider',
                    color: 'text.secondary',
                  },
                  '& .Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'common.white !important',
                    borderColor: 'primary.main',
                  },
                }}
              >
                {attachments.map((att, idx) => (
                  <Tab
                    key={att.id ?? idx}
                    disableRipple
                    label={
                      <Stack alignItems="center" spacing={0}>
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 700, fontSize: 11.5, lineHeight: 1.3 }}
                        >
                          Entry {idx + 1}
                        </Typography>
                        <Typography
                          sx={{ fontFamily: MONO, fontSize: 9, opacity: 0.8, lineHeight: 1 }}
                        >
                          {formatShortDate(att.created_at)}
                        </Typography>
                      </Stack>
                    }
                  />
                ))}
              </Tabs>

              {currentAttachment && !editMode && (
                <TabPanel value={activeTab} index={activeTab}>
                  <AttachmentViewCard attachment={currentAttachment} canEdit={canEdit} />
                </TabPanel>
              )}

              {currentAttachment && editMode && (
                <TabPanel value={activeTab} index={activeTab}>
                  <AttachmentEditCard
                    attachment={currentAttachment}
                    remarks={editRemarks}
                    setRemarks={setEditRemarks}
                    file={editFile}
                    setFile={setEditFile}
                    onSave={handleSaveEdit}
                    onCancel={handleCancelEdit}
                    saving={saving}
                  />
                </TabPanel>
              )}
            </>
          )}
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Box>
            {currentAttachment && !editMode && canEdit && (
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Edit" arrow>
                  <IconButton size="small" onClick={handleEdit} sx={{ borderRadius: 1.5 }}>
                    <Iconify icon="solar:pen-bold" width={17} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete" arrow>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={handleDeleteClick}
                    sx={{ borderRadius: 1.5 }}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" width={17} />
                  </IconButton>
                </Tooltip>
              </Stack>
            )}
          </Box>
          <Button onClick={onClose} sx={{ borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </>
  );
}
