'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemText from '@mui/material/ListItemText';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import LinearProgress from '@mui/material/LinearProgress';

import { useRouter } from 'src/routes/hooks';

import axiosInstance, { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  usePatchRequest as patchRequest,
  useDeleteRequest as deleteRequest,
  useCreateRequest as createRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

import { PRIORITY_OPTIONS } from '../constants';

const EP = endpoints.pm;

export default function TaskDetail({ id }) {
  const taskId = Number(id);
  const [tab, setTab] = useState(0);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [deleteAttachmentId, setDeleteAttachmentId] = useState(null);
  const router = useRouter();

  const { data: rawTask } = useGetRequest(EP.task_by_id(taskId));
  const { data: rawStatuses } = useGetRequest(EP.statuses);
  const { data: rawUsers } = useGetRequest('/api/employees/');
  const { data: rawTags } = useGetRequest(EP.tags);
  const { data: rawLists } = useGetRequest(EP.lists);
  const { data: rawSpaces } = useGetRequest(EP.spaces);
  const { data: rawComments } = useGetRequest(EP.task_comments);
  const { data: rawActivities } = useGetRequest(EP.task_activity_logs);
  const { data: rawChecklists } = useGetRequest(EP.checklists);
  const { data: rawAllTasks } = useGetRequest(EP.tasks);

  const task = rawTask || {};
  const STATUSES = Array.isArray(rawStatuses) ? rawStatuses : rawStatuses?.results || [];
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];
  const TAGS = Array.isArray(rawTags) ? rawTags : rawTags?.results || [];
  const LISTS = Array.isArray(rawLists) ? rawLists : rawLists?.results || [];
  const SPACES = Array.isArray(rawSpaces) ? rawSpaces : rawSpaces?.results || [];
  const ALL_COMMENTS = Array.isArray(rawComments) ? rawComments : rawComments?.results || [];
  const ALL_ACTIVITIES = Array.isArray(rawActivities)
    ? rawActivities
    : rawActivities?.results || [];
  const ALL_CHECKLISTS = Array.isArray(rawChecklists)
    ? rawChecklists
    : rawChecklists?.results || [];
  const ALL_TASKS = Array.isArray(rawAllTasks) ? rawAllTasks : rawAllTasks?.results || [];

  const getUserById = (uid) => USERS.find((u) => u.id === uid);
  const getStatusById = (sid) => STATUSES.find((s) => s.id === sid);
  const getListById = (lid) => LISTS.find((l) => l.id === lid);

  const [titleValue, setTitleValue] = useState('');
  const [descValue, setDescValue] = useState('');

  const status = getStatusById(task.status_id || task.status);
  const priority = PRIORITY_OPTIONS.find((p) => p.value === task.priority);
  const list = getListById(task.list_id || task.list);
  const space = list ? SPACES.find((s) => s.id === (list.space_id || list.space)) : null;
  const subtasks = ALL_TASKS.filter((t) => (t.parent_id || t.parent) === taskId);
  const comments = ALL_COMMENTS.filter((c) => (c.task_id || c.task) === taskId);
  const activities = ALL_ACTIVITIES.filter((a) => (a.task_id || a.task) === taskId);
  const checklists = ALL_CHECKLISTS.filter((c) => (c.task_id || c.task) === taskId);
  const detailAssignees = Array.isArray(task.assignees) ? task.assignees : [];
  const detailWatchers = Array.isArray(task.watchers) ? task.watchers : [];
  const detailTags = Array.isArray(task.tags) ? task.tags : [];
  const detailAttachments = Array.isArray(task.attachments) ? task.attachments : [];
  const today = new Date().toISOString().split('T')[0];
  const isOverdue =
    task.due_date && task.due_date < today && ![4, 5].includes(task.status_id || task.status);

  // Loading states
  const [editing, setEditing] = useState(false);
  const [deletingTask, setDeletingTask] = useState(false);
  const [creatingComment, setCreatingComment] = useState(false);
  const [creatingSubtask, setCreatingSubtask] = useState(false);

  const openEdit = () => {
    setEditId(taskId);
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
      setEditing(true);
      await patchRequest(EP.task_by_id(editId), editForm);
      mutate(EP.task_by_id(taskId));
      mutate(EP.tasks);
      toast.success('Task updated');
      setEditId(null);
    } catch {
      toast.error('Update failed');
    } finally {
      setEditing(false);
    }
  };
  const handleDeleteTask = async () => {
    try {
      setDeletingTask(true);
      await deleteRequest(EP.task_by_id(taskId));
      mutate(EP.tasks);
      toast.success('Task deleted');
      setDeleteOpen(false);
      router.back();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeletingTask(false);
    }
  };
  const handleDeleteComment = async () => {
    try {
      await deleteRequest(EP.task_comment_by_id(deleteCommentId));
      mutate(EP.task_comments);
      toast.success('Comment deleted');
      setDeleteCommentId(null);
    } catch {
      toast.error('Failed');
    }
  };
  const handleCreateSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    try {
      setCreatingSubtask(true);
      await createRequest(EP.subtasks, { title: newSubtaskTitle, parent: taskId });
      mutate(EP.tasks);
      toast.success('Subtask created');
      setNewSubtaskTitle('');
      setShowSubtaskForm(false);
    } catch {
      toast.error('Failed');
    } finally {
      setCreatingSubtask(false);
    }
  };

  const handleUpdateField = async (field, value) => {
    try {
      await patchRequest(EP.task_by_id(taskId), { [field]: value });
      mutate(EP.task_by_id(taskId));
      mutate(EP.tasks);
      toast.success('Task updated');
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      setCreatingComment(true);
      await createRequest(EP.task_comments, { task: taskId, text: newComment });
      mutate(EP.task_comments);
      toast.success('Comment posted');
      setNewComment('');
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setCreatingComment(false);
    }
  };

  const handleUploadAttachment = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const formData = new FormData();
    formData.append('task', taskId);
    formData.append('file', file);
    formData.append('file_name', file.name);
    formData.append('file_size', String(file.size));

    try {
      setUploadingAttachment(true);
      await axiosInstance.post(EP.task_attachments, formData);
      mutate(EP.task_by_id(taskId));
      mutate(EP.tasks);
      mutate(EP.task_activity_logs);
      toast.success('Attachment uploaded');
    } catch {
      toast.error('Failed to upload attachment');
    } finally {
      setUploadingAttachment(false);
      event.target.value = '';
    }
  };

  const handleDeleteAttachment = async () => {
    if (!deleteAttachmentId) return;

    try {
      await deleteRequest(EP.task_attachment_by_id(deleteAttachmentId));
      mutate(EP.task_by_id(taskId));
      mutate(EP.tasks);
      mutate(EP.task_activity_logs);
      toast.success('Attachment deleted');
      setDeleteAttachmentId(null);
    } catch {
      toast.error('Failed to delete attachment');
    }
  };

  const formatAttachmentSize = (size) => {
    if (!size) return '—';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const toggleCheckItem = async (checklistId, itemId) => {
    try {
      await patchRequest(EP.checklist_item_toggle(itemId), {});
      mutate(EP.checklists);
      mutate(EP.task_by_id(taskId));
      mutate(EP.tasks);
    } catch {
      toast.error('Failed to update checklist item');
    }
  };

  return (
    <Box>
      {/* Breadcrumb + Actions */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          {space && (
            <Typography variant="caption" color="text.secondary">
              {space.name}
            </Typography>
          )}
          {space && (
            <Iconify icon="solar:alt-arrow-right-bold" width={12} sx={{ color: 'text.disabled' }} />
          )}
          {list && (
            <Typography variant="caption" color="text.secondary">
              {list.name}
            </Typography>
          )}
          {list && (
            <Iconify icon="solar:alt-arrow-right-bold" width={12} sx={{ color: 'text.disabled' }} />
          )}
          <Typography variant="caption" color="text.secondary">
            {task.task_id}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Iconify icon="solar:pen-bold" />}
            onClick={openEdit}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              {/* Title (inline editable) */}
              {editingTitle ? (
                <TextField
                  fullWidth
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  autoFocus
                  onBlur={() => {
                    handleUpdateField('title', titleValue);
                    setEditingTitle(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateField('title', titleValue);
                      setEditingTitle(false);
                    }
                  }}
                  sx={{ mb: 1 }}
                />
              ) : (
                <Typography
                  variant="h5"
                  fontWeight={700}
                  mb={1}
                  onClick={() => setEditingTitle(true)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover', borderRadius: 0.5, px: 0.5, mx: -0.5 },
                  }}
                >
                  {task.title}
                  {task.is_recurring && (
                    <Iconify
                      icon="solar:refresh-bold"
                      width={18}
                      sx={{ ml: 1, color: 'info.main', verticalAlign: 'middle' }}
                    />
                  )}
                </Typography>
              )}

              {/* Status bar */}
              <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
                <Chip
                  label={status?.name}
                  sx={{ bgcolor: `${status?.color}20`, color: status?.color, fontWeight: 600 }}
                />
                <Chip
                  icon={
                    <Box
                      sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: priority?.color }}
                    />
                  }
                  label={priority?.label}
                  variant="outlined"
                  size="small"
                />
                {isOverdue && (
                  <Chip
                    label="OVERDUE"
                    color="error"
                    size="small"
                    icon={<Iconify icon="solar:danger-triangle-bold" width={14} />}
                  />
                )}
                {task.story_points > 0 && (
                  <Chip label={`${task.story_points} SP`} size="small" variant="outlined" />
                )}
                {task.time_estimate > 0 && (
                  <Chip label={`Est: ${task.time_estimate}h`} size="small" variant="outlined" />
                )}
              </Stack>

              {/* Description (inline editable) */}
              <Box mb={2}>
                <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
                  Description
                </Typography>
                {editingDesc ? (
                  <>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={descValue}
                      onChange={(e) => setDescValue(e.target.value)}
                      autoFocus
                    />
                    <Stack direction="row" spacing={1} mt={1}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                          handleUpdateField('description', descValue);
                          setEditingDesc(false);
                        }}
                      >
                        Save
                      </Button>
                      <Button size="small" onClick={() => setEditingDesc(false)}>
                        Cancel
                      </Button>
                    </Stack>
                  </>
                ) : (
                  <Box
                    onClick={() => {
                      setDescValue(task.description);
                      setEditingDesc(true);
                    }}
                    sx={{
                      p: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      minHeight: 60,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Typography
                      variant="body2"
                      color={task.description ? 'text.primary' : 'text.disabled'}
                      sx={{ whiteSpace: 'pre-wrap' }}
                    >
                      {task.description || 'Click to add description...'}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Subtasks */}
              <Box mb={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Subtasks ({subtasks.filter((s) => [4, 5].includes(s.status_id)).length}/
                    {subtasks.length})
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Iconify icon="solar:add-circle-line-duotone" />}
                    onClick={() => setShowSubtaskForm(true)}
                  >
                    Add
                  </Button>
                </Stack>
                {showSubtaskForm && (
                  <Stack direction="row" spacing={1} mb={1}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Subtask title..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateSubtask();
                        if (e.key === 'Escape') setShowSubtaskForm(false);
                      }}
                      autoFocus
                    />
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleCreateSubtask}
                      disabled={creatingSubtask}
                    >
                      Add
                    </Button>
                    <Button size="small" onClick={() => setShowSubtaskForm(false)}>
                      Cancel
                    </Button>
                  </Stack>
                )}
                {subtasks.length > 0 && (
                  <Stack spacing={0.5}>
                    {subtasks.map((st) => {
                      const stStatus = getStatusById(st.status_id);
                      return (
                        <Stack
                          key={st.id}
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          sx={{ p: 0.5, borderRadius: 0.5, '&:hover': { bgcolor: 'action.hover' } }}
                        >
                          <Checkbox size="small" checked={[4, 5].includes(st.status_id)} />
                          <Typography
                            variant="body2"
                            sx={{
                              flex: 1,
                              textDecoration: [4, 5].includes(st.status_id)
                                ? 'line-through'
                                : 'none',
                            }}
                          >
                            {st.title}
                          </Typography>
                          <Chip
                            label={stStatus?.name}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: 10,
                              bgcolor: `${stStatus?.color}20`,
                              color: stStatus?.color,
                            }}
                          />
                        </Stack>
                      );
                    })}
                  </Stack>
                )}
              </Box>

              {/* Dependencies */}
              {task.dependencies?.length > 0 && (
                <Box mb={2}>
                  <Typography variant="subtitle2" fontWeight={600} mb={1}>
                    Dependencies
                  </Typography>
                  <Stack spacing={0.5}>
                    {task.dependencies.map((dep, idx) => {
                      const depTask = ALL_TASKS.find((t) => t.id === dep.task_id);
                      return (
                        <Stack
                          key={idx}
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          sx={{
                            p: 0.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 0.5,
                          }}
                        >
                          <Iconify
                            icon="solar:link-bold"
                            width={16}
                            sx={{ color: 'warning.main' }}
                          />
                          <Typography variant="body2">{dep.type.replace(/_/g, ' ')}</Typography>
                          <Iconify icon="solar:alt-arrow-right-bold" width={12} />
                          <Chip
                            label={
                              depTask
                                ? `${depTask.task_id} ${depTask.title}`
                                : `Task #${dep.task_id}`
                            }
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                      );
                    })}
                  </Stack>
                </Box>
              )}

              {/* Tabs: Comments / Checklists / Activity / Attachments */}
              <Divider sx={{ mb: 0 }} />
              <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                <Tab
                  label={
                    <Badge badgeContent={comments.length} color="primary">
                      Comments
                    </Badge>
                  }
                />
                <Tab label="Checklists" />
                <Tab label="Activity" />
                <Tab label="Attachments" />
              </Tabs>
              <Divider />

              {/* Comments Tab */}
              {tab === 0 && (
                <Box mt={2}>
                  <Stack spacing={1.5}>
                    {comments.map((c) => {
                      const user = getUserById(c.user_id);
                      return (
                        <Stack key={c.id} direction="row" spacing={1.5}>
                          <Avatar
                            sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'primary.main' }}
                          >
                            {user?.name?.charAt(0)}
                          </Avatar>
                          <Box flex={1}>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Typography variant="body2" fontWeight={600}>
                                {user?.name}
                              </Typography>
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(c.created_at).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => setDeleteCommentId(c.id)}
                                  sx={{ p: 0.25 }}
                                >
                                  <Iconify
                                    icon="solar:trash-bin-trash-bold"
                                    width={14}
                                    sx={{ color: 'error.main' }}
                                  />
                                </IconButton>
                              </Stack>
                            </Stack>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.25 }}>
                              {c.text}
                            </Typography>
                            {c.reactions?.length > 0 && (
                              <Stack direction="row" spacing={0.5} mt={0.5}>
                                {c.reactions.map((r, ri) => (
                                  <Chip
                                    key={ri}
                                    label={`${r.emoji} ${r.users.length}`}
                                    size="small"
                                    sx={{ height: 22, fontSize: 11 }}
                                  />
                                ))}
                              </Stack>
                            )}
                          </Box>
                        </Stack>
                      );
                    })}
                  </Stack>
                  <Stack direction="row" spacing={1} mt={2}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'primary.main' }}>
                      R
                    </Avatar>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      maxRows={4}
                      placeholder="Write a comment... (use @ to mention)"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || creatingComment}
                    >
                      {creatingComment ? 'Posting...' : 'Post'}
                    </Button>
                  </Stack>
                </Box>
              )}

              {/* Checklists Tab */}
              {tab === 1 && (
                <Box mt={2}>
                  {checklists.length > 0 ? (
                    checklists.map((cl) => {
                      const doneCount = cl.items.filter((i) => i.is_done).length;
                      const pct = Math.round((doneCount / cl.items.length) * 100);
                      return (
                        <Box key={cl.id} mb={2}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={0.5}
                          >
                            <Typography variant="subtitle2" fontWeight={600}>
                              {cl.name}
                            </Typography>
                            <Typography variant="caption" fontWeight={600}>
                              {pct}%
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{ height: 6, borderRadius: 3, mb: 1 }}
                          />
                          <Stack spacing={0}>
                            {cl.items.map((item) => (
                              <Stack
                                key={item.id}
                                direction="row"
                                alignItems="center"
                                spacing={0.5}
                                sx={{ '&:hover': { bgcolor: 'action.hover' }, borderRadius: 0.5 }}
                              >
                                <Checkbox
                                  size="small"
                                  checked={item.is_done}
                                  onChange={() => toggleCheckItem(cl.id, item.id)}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    flex: 1,
                                    textDecoration: item.is_done ? 'line-through' : 'none',
                                    color: item.is_done ? 'text.disabled' : 'text.primary',
                                  }}
                                >
                                  {item.text}
                                </Typography>
                                {item.assignee && (
                                  <Avatar
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      fontSize: 10,
                                      bgcolor: 'primary.main',
                                    }}
                                  >
                                    {getUserById(item.assignee)?.name?.charAt(0)}
                                  </Avatar>
                                )}
                              </Stack>
                            ))}
                          </Stack>
                        </Box>
                      );
                    })
                  ) : (
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                      No checklists for this task
                    </Typography>
                  )}
                </Box>
              )}

              {/* Activity Tab */}
              {tab === 2 && (
                <Box mt={2}>
                  <List dense>
                    {activities.length > 0 ? (
                      activities.map((act) => {
                        const user = getUserById(act.user_id || act.user);
                        return (
                          <ListItem key={act.id}>
                            <ListItemAvatar>
                              <Avatar
                                sx={{ width: 28, height: 28, fontSize: 11, bgcolor: 'grey.400' }}
                              >
                                {user?.name?.charAt(0) || '?'}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="body2">
                                  <strong>{user?.name || 'User'}</strong>{' '}
                                  {act.action?.replace(/_/g, ' ')}{' '}
                                  {act.old_value && `from "${act.old_value}"`}{' '}
                                  {act.new_value && `to "${act.new_value}"`}
                                </Typography>
                              }
                              secondary={new Date(act.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            />
                          </ListItem>
                        );
                      })
                    ) : (
                      <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                        No activity recorded
                      </Typography>
                    )}
                  </List>
                </Box>
              )}

              {/* Attachments Tab */}
              {tab === 3 && (
                <Box mt={2}>
                  <Box
                    sx={{
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 4,
                      textAlign: 'center',
                    }}
                  >
                    <Stack spacing={1} alignItems="center">
                      <Iconify
                        icon="solar:cloud-upload-bold-duotone"
                        width={48}
                        sx={{ color: 'text.disabled' }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Upload files to this task
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        Max 10MB per file
                      </Typography>
                      <Button component="label" variant="contained" disabled={uploadingAttachment}>
                        {uploadingAttachment ? 'Uploading...' : 'Upload Attachment'}
                        <input hidden type="file" onChange={handleUploadAttachment} />
                      </Button>
                    </Stack>
                  </Box>
                  {detailAttachments.length > 0 ? (
                    <Stack spacing={1.5} mt={2}>
                      {detailAttachments.map((attachment) => (
                        <Stack
                          key={attachment.id}
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          spacing={1}
                          sx={{
                            p: 1.25,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1.25} minWidth={0}>
                            <Iconify
                              icon="solar:paperclip-bold"
                              width={18}
                              sx={{ color: 'text.secondary' }}
                            />
                            <Box minWidth={0}>
                              <Typography variant="body2" fontWeight={600} noWrap>
                                {attachment.file_name || 'Attachment'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatAttachmentSize(attachment.file_size)}
                                {attachment.uploaded_at
                                  ? ` • ${new Date(attachment.uploaded_at).toLocaleDateString(
                                      'en-US',
                                      {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      }
                                    )}`
                                  : ''}
                                {attachment.uploaded_by_name
                                  ? ` • ${attachment.uploaded_by_name}`
                                  : ''}
                              </Typography>
                            </Box>
                          </Stack>
                          <Stack direction="row" spacing={0.5}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() =>
                                window.open(attachment.file, '_blank', 'noopener,noreferrer')
                              }
                            >
                              Open
                            </Button>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteAttachmentId(attachment.id)}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                            </IconButton>
                          </Stack>
                        </Stack>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" textAlign="center" mt={2}>
                      No attachments uploaded yet
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            {/* Status & Priority Controls */}
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <TextField
                    select
                    label="Status"
                    fullWidth
                    size="small"
                    value={task.status_id || task.status || ''}
                    onChange={(e) => handleUpdateField('status_id', e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box
                            sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color }}
                          />
                          <span>{s.name}</span>
                        </Stack>
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label="Priority"
                    fullWidth
                    size="small"
                    value={task.priority}
                    onChange={(e) => handleUpdateField('priority', e.target.value)}
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <MenuItem key={p.value} value={p.value}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box
                            sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: p.color }}
                          />
                          <span>{p.label}</span>
                        </Stack>
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    type="date"
                    label="Start Date"
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={task.start_date || ''}
                    onChange={(e) => handleUpdateField('start_date', e.target.value)}
                  />
                  <TextField
                    type="date"
                    label="Due Date"
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={task.due_date || ''}
                    onChange={(e) => handleUpdateField('due_date', e.target.value)}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* People */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>
                  Assignees
                </Typography>
                <Stack spacing={0.5} mb={1}>
                  {detailAssignees.map((assignee) => {
                    const user = typeof assignee === 'object' ? assignee : getUserById(assignee);
                    const userId = typeof assignee === 'object' ? assignee.id : assignee;
                    return (
                      <Stack key={userId} direction="row" alignItems="center" spacing={1}>
                        <Avatar
                          sx={{ width: 28, height: 28, fontSize: 11, bgcolor: 'primary.main' }}
                        >
                          {user?.name?.charAt(0)}
                        </Avatar>
                        <Typography variant="body2">{user?.name}</Typography>
                      </Stack>
                    );
                  })}
                </Stack>
                <Button size="small" startIcon={<Iconify icon="solar:add-circle-line-duotone" />}>
                  Add Assignee
                </Button>

                <Divider sx={{ my: 1.5 }} />
                <Typography variant="subtitle2" fontWeight={600} mb={1}>
                  Watchers
                </Typography>
                <Stack direction="row" spacing={0.5}>
                  {detailWatchers.map((watcher) => {
                    const user = typeof watcher === 'object' ? watcher : getUserById(watcher);
                    const userId = typeof watcher === 'object' ? watcher.id : watcher;
                    return (
                      <Tooltip key={userId} title={user?.name}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: 'grey.400' }}>
                          {user?.name?.charAt(0)}
                        </Avatar>
                      </Tooltip>
                    );
                  })}
                  <IconButton size="small">
                    <Iconify icon="solar:add-circle-line-duotone" width={20} />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>
                  Details
                </Typography>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      Created by
                    </Typography>
                    <Typography variant="caption">{getUserById(task.created_by)?.name}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="caption">
                      {task.created_at
                        ? new Date(task.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      Story Points
                    </Typography>
                    <Typography variant="caption">{task.story_points || '—'}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      Time Estimate
                    </Typography>
                    <Typography variant="caption">
                      {task.time_estimate ? `${task.time_estimate}h` : '—'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      List
                    </Typography>
                    <Typography variant="caption">{list?.name || '—'}</Typography>
                  </Stack>
                </Stack>

                {/* Tags */}
                {detailTags.length > 0 && (
                  <>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
                      Tags
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {detailTags.map((tagItem) => {
                        const tag =
                          typeof tagItem === 'object'
                            ? tagItem
                            : TAGS.find((t) => t.id === tagItem);
                        const tagId = typeof tagItem === 'object' ? tagItem.id : tagItem;
                        return tag ? (
                          <Chip
                            key={tagId}
                            label={tag.name}
                            size="small"
                            sx={{ bgcolor: `${tag.color}20`, color: tag.color }}
                          />
                        ) : null;
                      })}
                    </Stack>
                  </>
                )}

                {/* Custom Fields */}
                {Object.keys(task.custom_fields || {}).length > 0 && (
                  <>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
                      Custom Fields
                    </Typography>
                    <Stack spacing={0.5}>
                      {Object.entries(task.custom_fields).map(([key, val]) => (
                        <Stack key={key} direction="row" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">
                            {key}
                          </Typography>
                          <Typography variant="caption">{String(val)}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

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
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this task? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteTask}
            disabled={deletingTask}
          >
            {deletingTask ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Comment Dialog */}
      <Dialog
        open={Boolean(deleteCommentId)}
        onClose={() => setDeleteCommentId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Comment</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this comment?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteCommentId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteComment}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteAttachmentId)}
        onClose={() => setDeleteAttachmentId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Attachment</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this attachment?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAttachmentId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteAttachment}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
