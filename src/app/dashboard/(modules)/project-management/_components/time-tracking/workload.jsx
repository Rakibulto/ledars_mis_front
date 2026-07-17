'use client';

import {
  Box,
  Card,
  Grid,
  Chip,
  Avatar,
  Typography,
  CardContent,
  LinearProgress,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

export function TimeWorkload() {
  const { data: rawUsers } = useGetRequest('/api/employees/');
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];
  const { data: rawTasks } = useGetRequest(EP.tasks);
  const TASKS = Array.isArray(rawTasks) ? rawTasks : rawTasks?.results || [];
  const { data: rawEntries } = useGetRequest(EP.time_entries);
  const TIME_ENTRIES = Array.isArray(rawEntries) ? rawEntries : rawEntries?.results || [];

  const userWorkloads = USERS.slice(0, 7).map((user) => {
    const assignedTasks = TASKS.filter(
      (t) =>
        (t.assignees || []).includes(user.id) &&
        (t.status_id || t.status) !== 4 &&
        (t.status_id || t.status) !== 5
    );
    const completedTasks = TASKS.filter(
      (t) => (t.assignees || []).includes(user.id) && (t.status_id || t.status) === 4
    );
    const timeEntries = TIME_ENTRIES.filter((e) => (e.user_id || e.user) === user.id);
    const trackedHours = timeEntries.reduce((s, e) => s + (e.duration || 0), 0);
    const estimatedHours = assignedTasks.reduce((s, t) => s + (t.time_estimate || 0), 0);
    const capacity = 40; // weekly capacity
    const utilization = Math.round((trackedHours / capacity) * 100);

    return {
      ...user,
      assigned: assignedTasks.length,
      completed: completedTasks.length,
      trackedHours,
      estimatedHours,
      capacity,
      utilization: Math.min(utilization, 100),
      overloaded: utilization > 85,
    };
  });

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Workload
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Team capacity and workload distribution
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {userWorkloads.map((user) => (
          <Grid key={user.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{
                border: user.overloaded ? '1px solid' : 'none',
                borderColor: user.overloaded ? 'warning.main' : 'transparent',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Avatar sx={{ width: 40, height: 40 }}>{user.name.charAt(0)}</Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={700}>{user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.role}
                    </Typography>
                  </Box>
                  {user.overloaded && (
                    <Chip
                      label="Overloaded"
                      color="warning"
                      size="small"
                      sx={{ height: 20, fontSize: 10 }}
                    />
                  )}
                </Box>

                {/* Utilization bar */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Utilization
                    </Typography>
                    <Typography variant="caption" fontWeight={700}>
                      {user.utilization}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={user.utilization}
                    color={
                      user.utilization > 85
                        ? 'warning'
                        : user.utilization > 50
                          ? 'primary'
                          : 'inherit'
                    }
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Grid container spacing={1}>
                  <Grid size={6}>
                    <Box
                      sx={{ textAlign: 'center', p: 1, bgcolor: 'action.hover', borderRadius: 1 }}
                    >
                      <Typography variant="h6" fontWeight={700}>
                        {user.assigned}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Active Tasks
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={6}>
                    <Box
                      sx={{ textAlign: 'center', p: 1, bgcolor: 'action.hover', borderRadius: 1 }}
                    >
                      <Typography variant="h6" fontWeight={700} color="success.main">
                        {user.completed}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Completed
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={6}>
                    <Box
                      sx={{ textAlign: 'center', p: 1, bgcolor: 'action.hover', borderRadius: 1 }}
                    >
                      <Typography variant="h6" fontWeight={700}>
                        {user.trackedHours}h
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tracked
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={6}>
                    <Box
                      sx={{ textAlign: 'center', p: 1, bgcolor: 'action.hover', borderRadius: 1 }}
                    >
                      <Typography variant="h6" fontWeight={700}>
                        {user.estimatedHours}h
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Estimated
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
