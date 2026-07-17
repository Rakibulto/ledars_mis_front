'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';

import {
  Box,
  Tab,
  Card,
  Chip,
  Tabs,
  Badge,
  Avatar,
  Button,
  Dialog,
  Divider,
  Checkbox,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

function InboxPage() {
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: rawNotifications } = useGetRequest(EP.pm_notifications);
  const { data: rawComments } = useGetRequest(EP.task_comments);
  const { data: rawTasks } = useGetRequest(EP.tasks);
  const { data: rawUsers } = useGetRequest('/api/employees/');

  const NOTIFICATIONS = Array.isArray(rawNotifications)
    ? rawNotifications
    : rawNotifications?.results || [];
  const COMMENTS = Array.isArray(rawComments) ? rawComments : rawComments?.results || [];
  const ALL_TASKS = Array.isArray(rawTasks) ? rawTasks : rawTasks?.results || [];
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];

  const getUserById = (uid) => USERS.find((u) => u.id === uid);

  // Combine into inbox items
  const mentions = COMMENTS.filter((c) => (c.mentions || []).length > 0).map((c) => ({
    id: `m-${c.id}`,
    type: 'mention',
    title: `${getUserById(c.user_id || c.user)?.name} mentioned you`,
    message: (c.text || '').substring(0, 100),
    timestamp: c.created_at,
    is_read: false,
    task: ALL_TASKS.find((t) => t.id === (c.task_id || c.task)),
  }));

  const assignments = NOTIFICATIONS.filter((n) => n.type === 'task_assigned').map((n) => ({
    id: `a-${n.id}`,
    type: 'assignment',
    title: n.title,
    message: n.message,
    timestamp: n.created_at,
    is_read: n.is_read,
    task: null,
  }));

  const comments = COMMENTS.slice(0, 5).map((c) => ({
    id: `c-${c.id}`,
    type: 'comment',
    title: `${getUserById(c.user_id || c.user)?.name} commented`,
    message: (c.text || '').substring(0, 100),
    timestamp: c.created_at,
    is_read: true,
    task: ALL_TASKS.find((t) => t.id === (c.task_id || c.task)),
  }));

  const allItems = [...mentions, ...assignments, ...comments].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  const filtered = tab === 0 ? allItems : tab === 1 ? mentions : tab === 2 ? assignments : comments;

  const typeIcons = {
    mention: 'solar:mention-circle-bold',
    assignment: 'solar:clipboard-check-bold',
    comment: 'solar:chat-round-dots-bold',
  };
  const typeColors = { mention: '#8b5cf6', assignment: '#3b82f6', comment: '#22c55e' };

  const toggle = (id) => {
    const s = new Set(selected);
    if (s.has(id)) {
      s.delete(id);
    } else {
      s.add(id);
    }
    setSelected(s);
  };

  const fmtTime = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return `${Math.floor(diff / 60000)}m`;
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await axiosInstance.delete(EP.pm_notification_by_id(deleteId));
      mutate(EP.pm_notifications);
      toast.success('Message deleted');
      setDeleteId(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  const markAllRead = async () => {
    try {
      await axiosInstance.post(EP.pm_notification_mark_all_read);
      mutate(EP.pm_notifications);
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const markSelectedRead = async () => {
    try {
      await Promise.all(
        [...selected].map((id) => {
          const realId = id.replace(/^[amc]-/, '');
          return axiosInstance.post(EP.pm_notification_mark_read(realId));
        })
      );
      mutate(EP.pm_notifications);
      toast.success(`${selected.size} marked as read`);
      setSelected(new Set());
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Inbox
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {allItems.filter((i) => !i.is_read).length} unread messages
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {selected.size > 0 && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Icon icon="solar:check-read-bold" />}
              onClick={markSelectedRead}
            >
              Mark {selected.size} read
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            startIcon={<Icon icon="solar:check-read-bold" />}
            onClick={markAllRead}
          >
            Mark all read
          </Button>
        </Box>
      </Box>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, pt: 1 }}>
          <Tab
            label={
              <Badge badgeContent={allItems.length} color="default">
                All
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={mentions.length} color="secondary">
                Mentions
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={assignments.length} color="primary">
                Assigned
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={comments.length} color="success">
                Comments
              </Badge>
            }
          />
        </Tabs>
        <Divider />

        {filtered.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Icon icon="solar:inbox-bold-duotone" width={48} style={{ color: '#9ca3af' }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Inbox zero!
            </Typography>
          </Box>
        )}

        {filtered.map((item, idx) => (
          <Box key={item.id}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                px: 2,
                py: 1.5,
                bgcolor: item.is_read ? 'transparent' : 'action.hover',
                '&:hover': { bgcolor: 'action.selected' },
                cursor: 'pointer',
              }}
            >
              <Checkbox
                size="small"
                checked={selected.has(item.id)}
                onChange={() => toggle(item.id)}
              />
              <Avatar
                sx={{
                  bgcolor: `${typeColors[item.type]}20`,
                  color: typeColors[item.type],
                  width: 36,
                  height: 36,
                  mt: 0.5,
                }}
              >
                <Icon icon={typeIcons[item.type]} width={18} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={item.is_read ? 400 : 700}>
                  {item.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.message}
                </Typography>
                {item.task && (
                  <Chip
                    label={item.task.title}
                    size="small"
                    variant="outlined"
                    sx={{ mt: 0.5, height: 22, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
              <Box
                sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}
              >
                <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap' }}>
                  {fmtTime(item.timestamp)}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(item.id.replace(/^[amc]-/, ''));
                  }}
                >
                  <Icon icon="solar:trash-bin-trash-bold" width={14} color="#ef4444" />
                </IconButton>
              </Box>
            </Box>
            {idx < filtered.length - 1 && <Divider />}
          </Box>
        ))}
      </Card>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Message</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this message?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default InboxPage;
