'use client';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import ListItem from '@mui/material/ListItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import ListItemText from '@mui/material/ListItemText';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';
import ListItemAvatar from '@mui/material/ListItemAvatar';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

import { PRIORITY_OPTIONS } from './constants';

const EP = endpoints.pm;

const STAT_ICONS = [
  {
    label: 'Total Tasks',
    icon: 'solar:checklist-minimalistic-bold-duotone',
    color: '#3b82f6',
    key: 'total',
  },
  {
    label: 'In Progress',
    icon: 'solar:play-circle-bold-duotone',
    color: '#f59e0b',
    key: 'progress',
  },
  { label: 'Completed', icon: 'solar:check-circle-bold-duotone', color: '#22c55e', key: 'done' },
  {
    label: 'Overdue',
    icon: 'solar:danger-triangle-bold-duotone',
    color: '#ef4444',
    key: 'overdue',
  },
  {
    label: 'Team Members',
    icon: 'solar:users-group-rounded-bold-duotone',
    color: '#8b5cf6',
    key: 'members',
  },
  {
    label: 'Active Sprints',
    icon: 'solar:rewind-forward-bold-duotone',
    color: '#06b6d4',
    key: 'sprints',
  },
];

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('week');
  const [activityTab, setActivityTab] = useState(0);

  const { data: rawTasks, loading: tasksLoading } = useGetRequest(EP.tasks);
  const { data: rawUsers } = useGetRequest('/api/employees/');
  const { data: rawSprints } = useGetRequest(EP.sprints);
  const { data: rawGoals } = useGetRequest(EP.goals);
  const { data: rawSpaces } = useGetRequest(EP.spaces);
  const { data: rawStatuses } = useGetRequest(EP.statuses);
  const { data: rawMilestones } = useGetRequest(EP.milestones);
  const { data: rawNotifications } = useGetRequest(EP.pm_notifications);
  const { data: rawTimeEntries } = useGetRequest(EP.time_entries);
  const { data: rawActivities } = useGetRequest(EP.task_activity_logs);

  const TASKS = useMemo(
    () => (Array.isArray(rawTasks) ? rawTasks : rawTasks?.results || []),
    [rawTasks]
  );
  const USERS = useMemo(
    () => (Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || []),
    [rawUsers]
  );
  const SPRINTS = useMemo(
    () => (Array.isArray(rawSprints) ? rawSprints : rawSprints?.results || []),
    [rawSprints]
  );
  const GOALS = Array.isArray(rawGoals) ? rawGoals : rawGoals?.results || [];
  const SPACES = Array.isArray(rawSpaces) ? rawSpaces : rawSpaces?.results || [];
  const STATUSES = Array.isArray(rawStatuses) ? rawStatuses : rawStatuses?.results || [];
  const MILESTONES = Array.isArray(rawMilestones) ? rawMilestones : rawMilestones?.results || [];
  const NOTIFICATIONS = Array.isArray(rawNotifications)
    ? rawNotifications
    : rawNotifications?.results || [];
  const TIME_ENTRIES = Array.isArray(rawTimeEntries)
    ? rawTimeEntries
    : rawTimeEntries?.results || [];
  const ACTIVITIES = Array.isArray(rawActivities) ? rawActivities : rawActivities?.results || [];

  const recentActivities = ACTIVITIES.slice(0, 20);

  const getUserById = (id) => USERS.find((u) => u.id === id);
  const getStatusById = (id) => STATUSES.find((s) => s.id === id);
  const getSpaceById = (id) => SPACES.find((s) => s.id === id);

  const today = new Date().toISOString().split('T')[0];
  const stats = useMemo(() => {
    const parentTasks = TASKS.filter((t) => !t.parent_id && !t.parent);
    const total = parentTasks.length;
    const progress = parentTasks.filter((t) => {
      const sid = t.status_id || t.status;
      return [2, 3].includes(sid);
    }).length;
    const done = parentTasks.filter((t) => {
      const sid = t.status_id || t.status;
      return [4, 5].includes(sid);
    }).length;
    const overdue = parentTasks.filter((t) => {
      const sid = t.status_id || t.status;
      return t.due_date && t.due_date < today && ![4, 5].includes(sid);
    }).length;
    const activeSprints = SPRINTS.filter((s) => s.status === 'active').length;
    return { total, progress, done, overdue, members: USERS.length, sprints: activeSprints };
  }, [TASKS, SPRINTS, USERS, today]);

  const myTasks = TASKS.filter((t) => {
    const assignees = t.assignees || [];
    const sid = t.status_id || t.status;
    return assignees.includes(1) && ![4, 5].includes(sid) && !t.parent_id && !t.parent;
  });
  const activeSprint = SPRINTS.find((s) => s.status === 'active');
  const unreadNotifications = NOTIFICATIONS.filter((n) => !n.is_read);

  // Status distribution
  const statusDist = STATUSES.map((s) => ({
    ...s,
    count: TASKS.filter((t) => (t.status_id || t.status) === s.id && !t.parent_id && !t.parent)
      .length,
  })).filter((s) => s.count > 0);
  const totalForChart = statusDist.reduce((sum, s) => sum + s.count, 0);

  // Priority distribution
  const priorityDist = PRIORITY_OPTIONS.map((p) => ({
    ...p,
    count: TASKS.filter((t) => t.priority === p.value && !t.parent_id && !t.parent).length,
  })).filter((p) => p.count > 0);

  // Hours logged
  const totalHours = TIME_ENTRIES.reduce((sum, e) => sum + (e.duration || 0), 0);

  const cardValues = {
    total: stats.total,
    progress: stats.progress,
    done: stats.done,
    overdue: stats.overdue,
    members: stats.members,
    sprints: stats.sprints,
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Project Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back! Here&apos;s what&apos;s happening across your projects.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <TextField
            select
            size="small"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="quarter">This Quarter</MenuItem>
          </TextField>
          <Button variant="contained" startIcon={<Iconify icon="solar:add-circle-bold" />}>
            New Task
          </Button>
        </Stack>
      </Stack>

      {/* Stat Cards */}
      <Grid container spacing={2} mb={3}>
        {STAT_ICONS.map((card) => (
          <Grid item xs={6} sm={4} md={2} key={card.key}>
            <Card sx={{ '&:hover': { boxShadow: 6 }, transition: '0.2s' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 1.5,
                      bgcolor: `${card.color}14`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Iconify icon={card.icon} width={24} sx={{ color: card.color }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {cardValues[card.key]}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {card.label}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Status Distribution Bar Chart */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                Tasks by Status
              </Typography>
              <Stack spacing={1.5}>
                {statusDist.map((s) => (
                  <Box key={s.id}>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2">{s.name}</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {s.count}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={(s.count / totalForChart) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: `${s.color}20`,
                        '& .MuiLinearProgress-bar': { bgcolor: s.color, borderRadius: 4 },
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Priority Distribution */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                Tasks by Priority
              </Typography>
              <Stack spacing={1.5}>
                {priorityDist.map((p) => (
                  <Box key={p.value}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={0.5}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                          sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: p.color }}
                        />
                        <Typography variant="body2">{p.label}</Typography>
                      </Stack>
                      <Typography variant="body2" fontWeight={600}>
                        {p.count}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={(p.count / (totalForChart || 1)) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: `${p.color}20`,
                        '& .MuiLinearProgress-bar': { bgcolor: p.color, borderRadius: 4 },
                      }}
                    />
                  </Box>
                ))}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Total Hours Logged
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {totalHours}h
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Sprint Progress */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                Sprint Progress
              </Typography>
              {activeSprint ? (
                <Box>
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" fontWeight={600}>
                      {activeSprint.name}
                    </Typography>
                    <Chip label={activeSprint.status} size="small" color="primary" />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    {activeSprint.goal}
                  </Typography>
                  {(() => {
                    const bd = activeSprint.burndown;
                    const total = bd[0] || 1;
                    const remaining = bd[bd.length - 1] || 0;
                    const pct = Math.round(((total - remaining) / total) * 100);
                    return (
                      <>
                        <Stack direction="row" justifyContent="space-between" mb={0.5}>
                          <Typography variant="body2">Completion</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {pct}%
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{ height: 10, borderRadius: 5, mb: 2 }}
                        />
                        {/* Mini burndown */}
                        <Typography variant="caption" color="text.secondary" mb={1} display="block">
                          Burndown
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.3, height: 60 }}>
                          {bd.map((v, i) => (
                            <Tooltip key={i} title={`Day ${i + 1}: ${v} pts`}>
                              <Box
                                sx={{
                                  flex: 1,
                                  height: `${(v / total) * 100}%`,
                                  bgcolor: i < bd.length - 3 ? 'primary.main' : 'warning.main',
                                  borderRadius: '2px 2px 0 0',
                                  minHeight: 2,
                                  opacity: 0.8,
                                }}
                              />
                            </Tooltip>
                          ))}
                        </Box>
                      </>
                    );
                  })()}
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="caption" color="text.secondary">
                    Velocity: {activeSprint.velocity} pts
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No active sprint
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* My Tasks */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight={600}>
                  My Tasks ({myTasks.length})
                </Typography>
                <Button size="small">View All</Button>
              </Stack>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Task</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Progress</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myTasks.slice(0, 8).map((task) => {
                      const status = getStatusById(task.status_id);
                      const priority = PRIORITY_OPTIONS.find((p) => p.value === task.priority);
                      const isOverdue =
                        task.due_date && task.due_date < today && ![4, 5].includes(task.status_id);
                      return (
                        <TableRow key={task.id} hover sx={{ cursor: 'pointer' }}>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography
                                variant="body2"
                                fontWeight={500}
                                sx={{
                                  maxWidth: 250,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {task.title}
                              </Typography>
                              {task.subtask_count > 0 && (
                                <Chip
                                  size="small"
                                  label={`${task.subtask_done}/${task.subtask_count}`}
                                  sx={{ fontSize: 11, height: 20 }}
                                />
                              )}
                            </Stack>
                          </TableCell>
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
                          <TableCell sx={{ width: 120 }}>
                            {task.checklist_count > 0 ? (
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <LinearProgress
                                  variant="determinate"
                                  value={(task.checklist_done / task.checklist_count) * 100}
                                  sx={{ flex: 1, height: 6, borderRadius: 3 }}
                                />
                                <Typography variant="caption">
                                  {Math.round((task.checklist_done / task.checklist_count) * 100)}%
                                </Typography>
                              </Stack>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Activity Feed + Notifications */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 0 }}>
              <Tabs
                value={activityTab}
                onChange={(_, v) => setActivityTab(v)}
                sx={{ px: 2, pt: 1 }}
              >
                <Tab label="Activity" sx={{ fontSize: 13 }} />
                <Tab
                  label={
                    <Badge
                      badgeContent={unreadNotifications.length}
                      color="error"
                      sx={{ '& .MuiBadge-badge': { fontSize: 10 } }}
                    >
                      Notifications
                    </Badge>
                  }
                  sx={{ fontSize: 13 }}
                />
              </Tabs>
              <Divider />
              <List dense sx={{ maxHeight: 380, overflow: 'auto', p: 0 }}>
                {activityTab === 0
                  ? recentActivities.map((act) => {
                      const user = getUserById(act.user_id || act.user);
                      return (
                        <ListItem
                          key={act.id}
                          sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'primary.main' }}
                            >
                              {user?.name?.charAt(0) || '?'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="body2">
                                <strong>{user?.name || 'User'}</strong>{' '}
                                {act.action?.replace(/_/g, ' ')}{' '}
                                {act.new_value ? `→ ${act.new_value}` : ''}
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
                  : NOTIFICATIONS.map((n) => (
                      <ListItem
                        key={n.id}
                        sx={{
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          bgcolor: n.is_read ? 'transparent' : 'action.hover',
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: n.is_read ? 'grey.300' : 'primary.main',
                            }}
                          >
                            <Iconify
                              icon={
                                n.type === 'overdue'
                                  ? 'solar:danger-triangle-bold'
                                  : n.type === 'comment'
                                    ? 'solar:chat-round-bold'
                                    : 'solar:bell-bold'
                              }
                              width={16}
                            />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={n.is_read ? 400 : 600}>
                              {n.title}
                            </Typography>
                          }
                          secondary={n.message}
                        />
                      </ListItem>
                    ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Milestones */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                Milestones
              </Typography>
              <Stack spacing={2}>
                {MILESTONES.map((m) => {
                  const mTasks = m.tasks || [];
                  const completedTasks = mTasks.filter((tid) => {
                    const t = TASKS.find((x) => x.id === tid);
                    return t && [4, 5].includes(t.status_id);
                  }).length;
                  const pct = mTasks.length
                    ? Math.round((completedTasks / mTasks.length) * 100)
                    : 0;
                  return (
                    <Box
                      key={m.id}
                      sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={0.5}
                      >
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box
                            sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: m.color }}
                          />
                          <Typography variant="body2" fontWeight={600}>
                            {m.name}
                          </Typography>
                        </Stack>
                        <Chip
                          label={m.status.replace('_', ' ')}
                          size="small"
                          color={
                            m.status === 'completed'
                              ? 'success'
                              : m.status === 'in_progress'
                                ? 'warning'
                                : 'default'
                          }
                          sx={{ fontSize: 11 }}
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {m.description}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{ flex: 1, height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption" fontWeight={600}>
                          {pct}%
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                        Target:{' '}
                        {new Date(m.target_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        · {completedTasks}/{mTasks.length} tasks
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Goals Progress */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                Goals & OKRs
              </Typography>
              <Stack spacing={2}>
                {GOALS.filter((g) => !g.parent_id).map((goal) => {
                  const pct = goal.target_value
                    ? Math.round((goal.current_value / goal.target_value) * 100)
                    : 0;
                  const owner = getUserById(goal.owner_id);
                  return (
                    <Box
                      key={goal.id}
                      sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                    >
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" fontWeight={600}>
                          {goal.name}
                        </Typography>
                        <Chip
                          label={goal.status.replace('_', ' ')}
                          size="small"
                          color={
                            goal.status === 'on_track'
                              ? 'success'
                              : goal.status === 'at_risk'
                                ? 'warning'
                                : goal.status === 'completed'
                                  ? 'info'
                                  : 'error'
                          }
                          sx={{ fontSize: 11 }}
                        />
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(pct, 100)}
                          sx={{ flex: 1, height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="body2" fontWeight={600}>
                          {pct}%
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" mt={1}>
                        <Typography variant="caption" color="text.secondary">
                          Owner: {owner?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {goal.key_results?.length || 0} key results
                        </Typography>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Spaces Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                Spaces Overview
              </Typography>
              <Grid container spacing={2}>
                {SPACES.slice(0, 6).map((space) => (
                  <Grid item xs={12} sm={6} md={4} lg={2} key={space.id}>
                    <Box
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1.5,
                        cursor: 'pointer',
                        '&:hover': { borderColor: space.color, bgcolor: `${space.color}08` },
                        transition: '0.2s',
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1,
                            bgcolor: `${space.color}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Iconify icon={space.icon} width={18} sx={{ color: space.color }} />
                        </Box>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {space.name}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={2}>
                        <Typography variant="caption" color="text.secondary">
                          {space.lists_count} lists
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {space.tasks_count} tasks
                        </Typography>
                      </Stack>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
