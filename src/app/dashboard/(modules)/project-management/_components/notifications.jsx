'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';

import {
  Box,
  Tab,
  Card,
  Tabs,
  Badge,
  Button,
  Avatar,
  Dialog,
  Divider,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest, useDeleteMutation } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

const TYPE_ICONS = {
  task_assigned: 'solar:clipboard-check-bold',
  comment: 'solar:chat-round-dots-bold',
  overdue: 'solar:alarm-bold',
  sprint: 'solar:running-round-bold',
  goal: 'solar:target-bold',
  team: 'solar:users-group-rounded-bold',
};

const TYPE_COLORS = {
  task_assigned: '#3b82f6',
  comment: '#8b5cf6',
  overdue: '#ef4444',
  sprint: '#f59e0b',
  goal: '#22c55e',
  team: '#06b6d4',
};

export function PMNotifications() {
  const [tab, setTab] = useState(0);

  const { data: rawNotifications } = useGetRequest(EP.pm_notifications);
  const RAW = Array.isArray(rawNotifications) ? rawNotifications : rawNotifications?.results || [];

  const [deleteId, setDeleteId] = useState(null);

  const items = RAW;
  const unread = items.filter((n) => !n.is_read);
  const filtered = tab === 0 ? items : tab === 1 ? unread : items.filter((n) => n.is_read);

  const { trigger: doDelete, isMutating: deleting } = useDeleteMutation(
    deleteId ? EP.pm_notification_by_id(deleteId) : null
  );

  const markAllRead = async () => {
    try {
      await axiosInstance.post(EP.pm_notification_mark_all_read);
      mutate(EP.pm_notifications);
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const markRead = async (id) => {
    try {
      await axiosInstance.post(EP.pm_notification_mark_read(id));
      mutate(EP.pm_notifications);
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleDelete = async () => {
    try {
      await doDelete();
      mutate(EP.pm_notifications);
      toast.success('Notification deleted');
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const fmtTime = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {unread.length} unread notification{unread.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          onClick={markAllRead}
          startIcon={<Icon icon="solar:check-read-bold" />}
        >
          Mark all read
        </Button>
      </Box>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, pt: 1 }}>
          <Tab
            label={
              <Badge badgeContent={items.length} color="default">
                All
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={unread.length} color="error">
                Unread
              </Badge>
            }
          />
          <Tab label="Read" />
        </Tabs>
        <Divider />

        {filtered.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Icon icon="solar:bell-off-bold-duotone" width={48} style={{ color: '#9ca3af' }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              No notifications
            </Typography>
          </Box>
        )}

        {filtered.map((n, idx) => (
          <Box key={n.id}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                px: 3,
                py: 2,
                bgcolor: n.is_read ? 'transparent' : 'action.hover',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.selected' },
              }}
              onClick={() => markRead(n.id)}
            >
              <Avatar sx={{ bgcolor: TYPE_COLORS[n.type] || '#9ca3af', width: 40, height: 40 }}>
                <Icon icon={TYPE_ICONS[n.type] || 'solar:bell-bold'} width={20} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={n.is_read ? 400 : 700}>
                  {n.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {n.message}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {fmtTime(n.created_at)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {!n.is_read && (
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3b82f6' }} />
                )}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(n.id);
                  }}
                >
                  <Icon icon="solar:trash-bin-trash-bold" width={16} color="#ef4444" />
                </IconButton>
              </Box>
            </Box>
            {idx < filtered.length - 1 && <Divider />}
          </Box>
        ))}
      </Card>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Notification</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this notification?</Typography>
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
