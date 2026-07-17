'use client';

import { Icon } from '@iconify/react';

import { Box, Card, Grid, Chip, Typography, CardContent } from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

export function TimeReports() {
  const { data: rawEntries } = useGetRequest(EP.time_entries);
  const TIME_ENTRIES = Array.isArray(rawEntries) ? rawEntries : rawEntries?.results || [];
  const { data: rawTasks } = useGetRequest(EP.tasks);
  const TASKS = Array.isArray(rawTasks) ? rawTasks : rawTasks?.results || [];
  const { data: rawUsers } = useGetRequest('/api/employees/');
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];

  const totalHours = TIME_ENTRIES.reduce((s, e) => s + (e.duration || 0), 0);
  const billableHours = TIME_ENTRIES.filter((e) => e.is_billable).reduce(
    (s, e) => s + (e.duration || 0),
    0
  );
  const nonBillable = totalHours - billableHours;
  const totalRevenue = TIME_ENTRIES.filter((e) => e.is_billable).reduce(
    (s, e) => s + (e.duration || 0) * (e.hourly_rate || 0),
    0
  );

  const byUser = USERS.slice(0, 6)
    .map((user) => {
      const entries = TIME_ENTRIES.filter((e) => (e.user_id || e.user) === user.id);
      return {
        name: user.name,
        hours: entries.reduce((s, e) => s + (e.duration || 0), 0),
        billable: entries.filter((e) => e.is_billable).reduce((s, e) => s + (e.duration || 0), 0),
      };
    })
    .filter((u) => u.hours > 0)
    .sort((a, b) => b.hours - a.hours);

  const byTask = TASKS.slice(0, 8)
    .map((task) => {
      const entries = TIME_ENTRIES.filter((e) => (e.task_id || e.task) === task.id);
      return {
        id: task.task_id,
        title: task.title,
        hours: entries.reduce((s, e) => s + (e.duration || 0), 0),
      };
    })
    .filter((t) => t.hours > 0)
    .sort((a, b) => b.hours - a.hours);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Time Reports
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Analyze time tracking data
        </Typography>
      </Box>

      {/* Summary cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          {
            label: 'Total Hours',
            value: `${totalHours}h`,
            color: '#3b82f6',
            icon: 'solar:clock-circle-bold-duotone',
          },
          {
            label: 'Billable',
            value: `${billableHours}h`,
            color: '#22c55e',
            icon: 'solar:dollar-minimalistic-bold-duotone',
          },
          {
            label: 'Non-Billable',
            value: `${nonBillable}h`,
            color: '#f59e0b',
            icon: 'solar:clock-circle-bold-duotone',
          },
          {
            label: 'Revenue',
            value: `$${totalRevenue.toLocaleString()}`,
            color: '#8b5cf6',
            icon: 'solar:wallet-money-bold-duotone',
          },
        ].map((stat) => (
          <Grid key={stat.label} size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {stat.value}
                  </Typography>
                </Box>
                <Icon icon={stat.icon} width={32} style={{ color: stat.color, opacity: 0.7 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* By User */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Hours by Team Member
              </Typography>
              {byUser.map((u) => (
                <Box key={u.name} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {u.name}
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {u.hours}h
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      height: 8,
                      borderRadius: 4,
                      overflow: 'hidden',
                      bgcolor: '#f3f4f6',
                    }}
                  >
                    <Box
                      sx={{
                        width: `${(u.billable / Math.max(...byUser.map((x) => x.hours))) * 100}%`,
                        bgcolor: '#22c55e',
                        borderRadius: 4,
                      }}
                    />
                    <Box
                      sx={{
                        width: `${((u.hours - u.billable) / Math.max(...byUser.map((x) => x.hours))) * 100}%`,
                        bgcolor: '#f59e0b',
                      }}
                    />
                  </Box>
                </Box>
              ))}
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: '#22c55e' }} />
                  <Typography variant="caption">Billable</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: '#f59e0b' }} />
                  <Typography variant="caption">Non-billable</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* By Task */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Hours by Task
              </Typography>
              {byTask.map((t) => (
                <Box key={t.id} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Chip label={t.id} size="small" sx={{ height: 18, fontSize: 10 }} />
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {t.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700}>
                      {t.hours}h
                    </Typography>
                  </Box>
                  <Box sx={{ height: 6, borderRadius: 3, overflow: 'hidden', bgcolor: '#f3f4f6' }}>
                    <Box
                      sx={{
                        width: `${(t.hours / Math.max(...byTask.map((x) => x.hours))) * 100}%`,
                        bgcolor: '#3b82f6',
                        height: '100%',
                        borderRadius: 3,
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
