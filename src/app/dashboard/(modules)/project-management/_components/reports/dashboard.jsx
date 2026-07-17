'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';

import {
  Box,
  Card,
  Grid,
  Chip,
  Table,
  Avatar,
  MenuItem,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  CardContent,
  LinearProgress,
  TableContainer,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

export function ProjectReports() {
  const [period, setPeriod] = useState('this_week');

  const { data: rawTasks } = useGetRequest(EP.tasks);
  const TASKS = Array.isArray(rawTasks) ? rawTasks : rawTasks?.results || [];
  const { data: rawUsers } = useGetRequest('/api/employees/');
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];
  const { data: rawStatuses } = useGetRequest(EP.statuses);
  const STATUSES = Array.isArray(rawStatuses) ? rawStatuses : rawStatuses?.results || [];
  const { data: rawSprints } = useGetRequest(EP.sprints);
  const SPRINTS = Array.isArray(rawSprints) ? rawSprints : rawSprints?.results || [];
  const { data: rawEntries } = useGetRequest(EP.time_entries);
  const TIME_ENTRIES = Array.isArray(rawEntries) ? rawEntries : rawEntries?.results || [];

  const getUserById = (uid) => USERS.find((u) => u.id === uid);
  const getStatusById = (sid) => STATUSES.find((s) => s.id === sid);

  const totalTasks = TASKS.length;
  const done = TASKS.filter((t) => (t.status_id || t.status) === 4).length;
  const inProgress = TASKS.filter((t) => (t.status_id || t.status) === 2).length;
  const overdue = TASKS.filter(
    (t) =>
      t.due_date < new Date().toISOString().split('T')[0] &&
      (t.status_id || t.status) !== 4 &&
      (t.status_id || t.status) !== 5
  ).length;
  const totalHours = TIME_ENTRIES.reduce((s, e) => s + (e.duration || 0), 0);
  const billableHours = TIME_ENTRIES.filter((e) => e.is_billable).reduce(
    (s, e) => s + (e.duration || 0),
    0
  );

  const stats = [
    {
      label: 'Total Tasks',
      value: totalTasks,
      icon: 'solar:clipboard-list-bold-duotone',
      color: '#3b82f6',
    },
    { label: 'Completed', value: done, icon: 'solar:check-circle-bold-duotone', color: '#22c55e' },
    {
      label: 'In Progress',
      value: inProgress,
      icon: 'solar:play-circle-bold-duotone',
      color: '#f59e0b',
    },
    {
      label: 'Overdue',
      value: overdue,
      icon: 'solar:danger-triangle-bold-duotone',
      color: '#ef4444',
    },
  ];

  // Tasks per assignee
  const userTaskMap = {};
  TASKS.forEach((t) => {
    (t.assignees || []).forEach((uid) => {
      if (!userTaskMap[uid]) userTaskMap[uid] = { total: 0, done: 0, hours: 0 };
      userTaskMap[uid].total += 1;
      if ((t.status_id || t.status) === 4) userTaskMap[uid].done += 1;
    });
  });
  TIME_ENTRIES.forEach((e) => {
    const uid = e.user_id || e.user;
    if (!userTaskMap[uid]) userTaskMap[uid] = { total: 0, done: 0, hours: 0 };
    userTaskMap[uid].hours += e.duration || 0;
  });

  // Status distribution
  const statusCounts = {};
  TASKS.forEach((t) => {
    const st = getStatusById(t.status_id || t.status);
    const name = st ? st.name : 'Unknown';
    statusCounts[name] = (statusCounts[name] || 0) + 1;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Reports & Analytics
        </Typography>
        <TextField
          select
          size="small"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          sx={{ width: 180 }}
        >
          <MenuItem value="today">Today</MenuItem>
          <MenuItem value="this_week">This Week</MenuItem>
          <MenuItem value="this_month">This Month</MenuItem>
          <MenuItem value="this_quarter">This Quarter</MenuItem>
        </TextField>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((s) => (
          <Grid key={s.label} size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: `${s.color}20`, color: s.color, width: 48, height: 48 }}>
                  <Icon icon={s.icon} width={24} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {s.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {s.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Status Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Status Distribution
              </Typography>
              {Object.entries(statusCounts).map(([name, count]) => {
                const st = STATUSES.find((s) => s.name === name);
                const pct = Math.round((count / totalTasks) * 100);
                return (
                  <Box key={name} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: st?.color || '#9ca3af',
                          }}
                        />
                        <Typography variant="body2">{name}</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={600}>
                        {count} ({pct}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: '#f1f5f9',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: st?.color || '#9ca3af',
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>

        {/* Time Tracking Summary */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Time Tracking
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <Box>
                  <Typography variant="h3" fontWeight={700} color="primary">
                    {totalHours}h
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Logged
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h3" fontWeight={700} color="success.main">
                    {billableHours}h
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Billable
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h3" fontWeight={700} color="text.secondary">
                    {totalHours - billableHours}h
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Non-billable
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.round((billableHours / totalHours) * 100)}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: '#f1f5f9',
                  '& .MuiLinearProgress-bar': { borderRadius: 5 },
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: 'block' }}
              >
                {Math.round((billableHours / totalHours) * 100)}% billable rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Team Workload Table */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Team Workload
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Team Member</TableCell>
                      <TableCell align="center">Tasks</TableCell>
                      <TableCell align="center">Completed</TableCell>
                      <TableCell align="center">Completion %</TableCell>
                      <TableCell align="center">Hours Logged</TableCell>
                      <TableCell>Progress</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(userTaskMap).map(([uid, data]) => {
                      const user = getUserById(Number(uid));
                      const pct = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
                      return (
                        <TableRow key={uid}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar
                                sx={{ width: 28, height: 28, fontSize: 12, bgcolor: '#3b82f6' }}
                              >
                                {user?.name?.charAt(0)}
                              </Avatar>
                              <Typography variant="body2">{user?.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">{data.total}</TableCell>
                          <TableCell align="center">{data.done}</TableCell>
                          <TableCell align="center">{pct}%</TableCell>
                          <TableCell align="center">{data.hours}h</TableCell>
                          <TableCell>
                            <LinearProgress
                              variant="determinate"
                              value={pct}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                width: 100,
                                bgcolor: '#f1f5f9',
                                '& .MuiLinearProgress-bar': { borderRadius: 3 },
                              }}
                            />
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

        {/* Sprint Velocity */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Sprint Velocity
              </Typography>
              {SPRINTS.filter((s) => s.velocity !== null).map((s) => (
                <Box key={s.id} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip
                    label={s.name}
                    size="small"
                    variant={s.status === 'active' ? 'filled' : 'outlined'}
                    color={s.status === 'active' ? 'primary' : 'default'}
                  />
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((s.velocity / 40) * 100, 100)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: '#f1f5f9',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          bgcolor: s.status === 'active' ? '#3b82f6' : '#22c55e',
                        },
                      }}
                    />
                  </Box>
                  <Typography variant="body2" fontWeight={600}>
                    {s.velocity} pts
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Priority Breakdown */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Priority Breakdown
              </Typography>
              {['urgent', 'high', 'normal', 'low'].map((p) => {
                const count = TASKS.filter((t) => t.priority === p).length;
                const pct = Math.round((count / totalTasks) * 100);
                const colors = {
                  urgent: '#ef4444',
                  high: '#f97316',
                  normal: '#eab308',
                  low: '#3b82f6',
                };
                return (
                  <Box key={p} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {p}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {count}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: '#f1f5f9',
                        '& .MuiLinearProgress-bar': { bgcolor: colors[p], borderRadius: 4 },
                      }}
                    />
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
