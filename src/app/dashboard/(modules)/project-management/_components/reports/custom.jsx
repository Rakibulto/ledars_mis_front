'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';

import {
  Box,
  Card,
  Grid,
  Chip,
  Table,
  Button,
  MenuItem,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  CardContent,
  TableContainer,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

const REPORT_TYPES = [
  { value: 'tasks_by_status', label: 'Tasks by Status' },
  { value: 'tasks_by_assignee', label: 'Tasks by Assignee' },
  { value: 'tasks_by_space', label: 'Tasks by Space' },
  { value: 'overdue_tasks', label: 'Overdue Tasks' },
  { value: 'completed_this_week', label: 'Completed This Week' },
];

export function CustomReport() {
  const [reportType, setReportType] = useState('tasks_by_status');
  const [space, setSpace] = useState('all');

  const { data: rawTasks } = useGetRequest(EP.tasks);
  const TASKS = Array.isArray(rawTasks) ? rawTasks : rawTasks?.results || [];
  const { data: rawUsers } = useGetRequest('/api/employees/');
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];
  const { data: rawSpaces } = useGetRequest(EP.spaces);
  const SPACES = Array.isArray(rawSpaces) ? rawSpaces : rawSpaces?.results || [];
  const { data: rawStatuses } = useGetRequest(EP.statuses);
  const STATUSES = Array.isArray(rawStatuses) ? rawStatuses : rawStatuses?.results || [];
  const { data: rawLists } = useGetRequest(EP.lists);
  const LISTS = Array.isArray(rawLists) ? rawLists : rawLists?.results || [];

  const getUserById = (uid) => USERS.find((u) => u.id === uid);
  const getStatusById = (sid) => STATUSES.find((s) => s.id === sid);
  const getListById = (lid) => LISTS.find((l) => l.id === lid);

  const filteredTasks =
    space === 'all'
      ? TASKS
      : TASKS.filter((t) => {
          const list = getListById(t.list_id || t.list);
          return list && (list.space_id || list.space) === Number(space);
        });

  const getReportData = () => {
    switch (reportType) {
      case 'tasks_by_status': {
        const grouped = {};
        filteredTasks.forEach((t) => {
          const st = getStatusById(t.status_id || t.status);
          const name = st?.name || 'Unknown';
          if (!grouped[name]) grouped[name] = [];
          grouped[name].push(t);
        });
        return grouped;
      }
      case 'tasks_by_assignee': {
        const grouped = {};
        filteredTasks.forEach((t) => {
          (t.assignees || []).forEach((uid) => {
            const user = getUserById(uid);
            const name = user?.name || 'Unassigned';
            if (!grouped[name]) grouped[name] = [];
            grouped[name].push(t);
          });
        });
        return grouped;
      }
      case 'overdue_tasks':
        return {
          Overdue: filteredTasks.filter(
            (t) =>
              t.due_date < new Date().toISOString().split('T')[0] &&
              (t.status_id || t.status) !== 4 &&
              (t.status_id || t.status) !== 5
          ),
        };
      case 'completed_this_week':
        return { Completed: filteredTasks.filter((t) => (t.status_id || t.status) === 4) };
      default:
        return {};
    }
  };

  const reportData = getReportData();

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        Custom Report Builder
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Report Type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                {REPORT_TYPES.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    {r.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Space"
                value={space}
                onChange={(e) => setSpace(e.target.value)}
              >
                <MenuItem value="all">All Spaces</MenuItem>
                {SPACES.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Button
                variant="contained"
                startIcon={<Icon icon="solar:download-minimalistic-bold" />}
              >
                Export CSV
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {Object.entries(reportData).map(([group, tasks]) => (
        <Card key={group} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                {group}
              </Typography>
              <Chip label={`${tasks.length} tasks`} size="small" />
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Assignee(s)</TableCell>
                    <TableCell>Due Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.map((t) => {
                    const st = getStatusById(t.status_id || t.status);
                    return (
                      <TableRow key={t.id}>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {t.task_id}
                          </Typography>
                        </TableCell>
                        <TableCell>{t.title}</TableCell>
                        <TableCell>
                          <Chip
                            label={st?.name}
                            size="small"
                            sx={{ bgcolor: `${st?.color}20`, color: st?.color, fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {t.priority}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {(t.assignees || []).map((uid) => getUserById(uid)?.name).join(', ')}
                        </TableCell>
                        <TableCell>{t.due_date}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
