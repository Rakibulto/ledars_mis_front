'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';

import {
  Box,
  Card,
  Chip,
  Avatar,
  Button,
  Divider,
  MenuItem,
  TextField,
  Typography,
  CardContent,
  InputAdornment,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

const ACTION_ICONS = {
  'changed status': 'solar:refresh-circle-bold',
  'added assignee': 'solar:user-plus-bold',
  'changed priority': 'solar:arrow-up-bold',
  'added attachment': 'solar:paperclip-bold',
  'completed checklist item': 'solar:check-square-bold',
  'created task': 'solar:add-circle-bold',
  'added tag': 'solar:tag-bold',
  'updated time estimate': 'solar:clock-circle-bold',
  'added dependency': 'solar:link-circle-bold',
};

const ACTION_COLORS = {
  'changed status': '#3b82f6',
  'added assignee': '#8b5cf6',
  'changed priority': '#f59e0b',
  'added attachment': '#06b6d4',
  'completed checklist item': '#22c55e',
  'created task': '#10b981',
  'added tag': '#ec4899',
  'updated time estimate': '#f97316',
  'added dependency': '#6366f1',
};

function ActivityLog() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: rawActivities, isLoading } = useGetRequest(EP.task_activity_logs);
  const { data: rawTasks } = useGetRequest(EP.tasks);
  const { data: rawUsers } = useGetRequest('/api/employees/');

  const ACTIVITIES = Array.isArray(rawActivities) ? rawActivities : rawActivities?.results || [];
  const ALL_TASKS = Array.isArray(rawTasks) ? rawTasks : rawTasks?.results || [];
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];

  const getUserById = (uid) => USERS.find((u) => u.id === uid);

  const fmtTime = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const activities = ACTIVITIES.filter((a) => {
    const actionStr = a.action?.replace(/_/g, ' ') || '';
    if (filter !== 'all' && actionStr !== filter) return false;
    if (search) {
      const task = ALL_TASKS.find((t) => t.id === (a.task_id || a.task));
      const user = getUserById(a.user_id || a.user);
      const text =
        `${user?.name} ${actionStr} ${task?.title} ${a.old_value || ''} ${a.new_value || ''}`.toLowerCase();
      if (!text.includes(search.toLowerCase())) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const actionTypes = [...new Set(ACTIVITIES.map((a) => a.action?.replace(/_/g, ' ') || ''))];

  // Group by date
  const grouped = {};
  activities.forEach((a) => {
    const day = new Date(a.timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(a);
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Activity Log
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {activities.length} activities
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Icon icon="solar:download-minimalistic-bold" />}
        >
          Export
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search activities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Icon icon="solar:magnifer-linear" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            size="small"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            sx={{ width: 200 }}
          >
            <MenuItem value="all">All Actions</MenuItem>
            {actionTypes.map((a) => (
              <MenuItem key={a} value={a} sx={{ textTransform: 'capitalize' }}>
                {a}
              </MenuItem>
            ))}
          </TextField>
        </CardContent>
      </Card>

      {Object.entries(grouped).map(([day, items]) => (
        <Box key={day} sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, px: 1 }}>
            {day}
          </Typography>
          <Card>
            {items.map((a, idx) => {
              const user = getUserById(a.user_id || a.user);
              const task = ALL_TASKS.find((t) => t.id === (a.task_id || a.task));
              const actionStr = a.action?.replace(/_/g, ' ') || '';
              return (
                <Box key={a.id}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      px: 3,
                      py: 1.5,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: `${ACTION_COLORS[actionStr] || '#9ca3af'}20`,
                        color: ACTION_COLORS[actionStr] || '#9ca3af',
                        width: 36,
                        height: 36,
                      }}
                    >
                      <Icon icon={ACTION_ICONS[actionStr] || 'solar:history-bold'} width={18} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">
                        <Typography component="span" fontWeight={600}>
                          {user?.name}
                        </Typography>{' '}
                        {actionStr}{' '}
                        {a.old_value && (
                          <>
                            <Chip
                              label={a.old_value}
                              size="small"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />{' '}
                            →{' '}
                          </>
                        )}
                        {a.new_value && (
                          <Chip
                            label={a.new_value}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        on{' '}
                        <Typography component="span" variant="caption" fontWeight={600}>
                          {task?.title}
                        </Typography>
                        {' · '}
                        {fmtTime(a.timestamp)}
                      </Typography>
                    </Box>
                  </Box>
                  {idx < items.length - 1 && <Divider />}
                </Box>
              );
            })}
          </Card>
        </Box>
      ))}

      {isLoading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="body2" color="text.secondary">
            Loading activities...
          </Typography>
        </Box>
      )}

      {!isLoading && activities.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Icon icon="solar:history-bold-duotone" width={48} style={{ color: '#9ca3af' }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No activities found
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ActivityLog;
