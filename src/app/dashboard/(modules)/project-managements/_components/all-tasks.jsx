'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import { alpha, useTheme } from '@mui/material/styles';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import {
  useProjectManagementTasks,
  approveProjectManagementPlan,
} from './use-project-managements-api';

const STATUS_COLOR = {
  Pending: 'warning',
  'In Progress': 'primary',
  'On Hold': 'warning',
  Completed: 'success',
};

function getApprovalTone(status) {
  if (status === 'Approved') return 'success';
  return 'default';
}

function getApprovalLabel(task) {
  if (task.approvalStatus === 'Approved') return 'Approved';
  if (task.status === 'Completed') return 'Pending Approval';
  return 'Not Ready';
}

function formatDate(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString();
}

function getDescriptionMarkup(value) {
  if (!value) return '';

  const description = String(value).trim();
  const containsHtml = /<[^>]+>/i.test(description);

  return containsHtml ? description : description.replace(/\n/g, '<br />');
}

function getStatusTone(status) {
  if (status === 'Completed') return 'success';
  if (status === 'In Progress') return 'primary';
  if (status === 'On Hold') return 'warning';
  return 'warning';
}

function getTaskActionButtonSx(theme, variant = 'outlined') {
  return {
    minWidth: { xs: '100%', sm: 'auto' },
    px: 1.6,
    py: 0.7,
    borderRadius: 999,
    fontWeight: 800,
    textTransform: 'none',
    whiteSpace: 'nowrap',
    lineHeight: 1,
    boxShadow:
      variant === 'contained' ? `0 10px 20px ${alpha(theme.palette.primary.main, 0.18)}` : 'none',
    borderWidth: 1,
    '&:hover': {
      borderWidth: 1,
      transform: 'translateY(-1px)',
      boxShadow:
        variant === 'contained'
          ? `0 14px 26px ${alpha(theme.palette.primary.main, 0.24)}`
          : `0 10px 22px ${alpha(theme.palette.grey[900], 0.08)}`,
    },
    '& .MuiButton-startIcon': {
      mr: 0.6,
    },
  };
}

export default function AllTasks() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tasks, isLoading, error } = useProjectManagementTasks();
  const [searchTerm, setSearchTerm] = useState('');
  const [approvingTaskId, setApprovingTaskId] = useState(null);

  const statusFilter = searchParams.get('status') || 'all';
  const projectFilter = searchParams.get('project') || 'all';
  const assigneeFilter = searchParams.get('assignee') || 'all';

  const projectOptions = useMemo(
    () =>
      Array.from(new Set(tasks.map((task) => task.projectTitle).filter(Boolean))).sort(
        (left, right) => left.localeCompare(right)
      ),
    [tasks]
  );

  const assigneeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          tasks.flatMap((task) => task.assignedUsers.map((user) => user.username)).filter(Boolean)
        )
      ).sort((left, right) => left.localeCompare(right)),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        [
          task.title,
          task.description,
          task.projectTitle,
          task.projectCode,
          task.assignedUsersText,
          task.latestRemark,
          task.remarksSearchText,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesProject = projectFilter === 'all' || task.projectTitle === projectFilter;
      const matchesAssignee =
        assigneeFilter === 'all' ||
        task.assignedUsers.some((user) => user.username === assigneeFilter);

      return matchesSearch && matchesStatus && matchesProject && matchesAssignee;
    });
  }, [tasks, searchTerm, statusFilter, projectFilter, assigneeFilter]);

  const summary = {
    total: filteredTasks.length,
    completed: filteredTasks.filter((task) => task.status === 'Completed').length,
    inProgress: filteredTasks.filter((task) => task.status === 'In Progress').length,
    onHold: filteredTasks.filter((task) => task.status === 'On Hold').length,
    pending: filteredTasks.filter((task) => task.status === 'Pending').length,
    approved: filteredTasks.filter((task) => task.approvalStatus === 'Approved').length,
  };
  const isFocusedSheetView =
    projectFilter !== 'all' ||
    statusFilter !== 'all' ||
    assigneeFilter !== 'all' ||
    Boolean(searchTerm.trim());

  function updateRouteFilters(nextFilters) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(nextFilters).forEach(([key, value]) => {
      if (!value || value === 'all') params.delete(key);
      else params.set(key, value);
    });

    const nextQuery = params.toString();
    router.push(
      nextQuery
        ? `${paths.dashboard.projectManagements.taskManagement.allTasks}?${nextQuery}`
        : paths.dashboard.projectManagements.taskManagement.allTasks
    );
  }

  function resetFilters() {
    setSearchTerm('');
    updateRouteFilters({ status: 'all', project: 'all', assignee: 'all' });
  }

  async function handleApproveTask(task) {
    if (!task?.id || task.status !== 'Completed' || task.approvalStatus === 'Approved') return;

    setApprovingTaskId(task.id);

    try {
      await approveProjectManagementPlan(task.id, task.projectId);
      toast.success('Task approved successfully.');
    } catch (approvalError) {
      toast.error(approvalError?.detail || approvalError?.message || 'Failed to approve task.');
    } finally {
      setApprovingTaskId(null);
    }
  }

  return (
    <Box>
      <Card
        sx={{
          mb: 3,
          borderRadius: 4,
          overflow: 'hidden',
          color: 'common.white',
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 58%, ${theme.palette.secondary.main} 100%)`,
          boxShadow: `0 22px 44px ${alpha(theme.palette.primary.main, 0.2)}`,
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2.5}
          >
            <Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.25 }}>
                <Chip
                  size="small"
                  label={`${summary.total} Tasks`}
                  sx={{ bgcolor: alpha('#ffffff', 0.16), color: 'common.white' }}
                />
                <Chip
                  size="small"
                  label={`${summary.inProgress} In Progress`}
                  sx={{ bgcolor: alpha('#ffffff', 0.16), color: 'common.white' }}
                />
                <Chip
                  size="small"
                  label={`${summary.onHold} On Hold`}
                  sx={{ bgcolor: alpha('#ffffff', 0.16), color: 'common.white' }}
                />
                <Chip
                  size="small"
                  label={`${summary.completed} Completed`}
                  sx={{ bgcolor: alpha('#ffffff', 0.16), color: 'common.white' }}
                />
                <Chip
                  size="small"
                  label={`${summary.approved} Approved`}
                  sx={{ bgcolor: alpha('#ffffff', 0.16), color: 'common.white' }}
                />
              </Stack>
              <Typography variant="h4" fontWeight={800}>
                All Tasks
              </Typography>
              <Typography
                variant="body1"
                sx={{ mt: 1.1, maxWidth: 820, color: alpha('#ffffff', 0.84) }}
              >
                Unified task register across all project plans with owners, schedule clarity, and a
                cleaner spreadsheet-style delivery view.
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              href={paths.dashboard.projectManagements.projects.allProjects}
              variant="contained"
              startIcon={<Iconify icon="solar:folder-with-files-bold" />}
              sx={{
                bgcolor: 'common.white',
                color: 'primary.main',
                fontWeight: 800,
                borderRadius: 2.5,
                px: 2,
                '&:hover': {
                  bgcolor: alpha('#ffffff', 0.94),
                },
              }}
            >
              Back to Projects
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Unable to load tasks right now.
        </Alert>
      ) : null}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: 'Total Tasks',
            value: summary.total,
            icon: 'solar:checklist-minimalistic-bold-duotone',
          },
          { label: 'Completed', value: summary.completed, icon: 'solar:check-circle-bold-duotone' },
          {
            label: 'In Progress',
            value: summary.inProgress,
            icon: 'solar:play-circle-bold-duotone',
          },
          { label: 'On Hold', value: summary.onHold, icon: 'solar:pause-circle-bold-duotone' },
          { label: 'Pending', value: summary.pending, icon: 'solar:clock-circle-bold-duotone' },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, lg: 4, xl: 2.4 }}>
            <Card
              sx={{
                borderRadius: 3.5,
                border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
                boxShadow: 'none',
                bgcolor: alpha(theme.palette.background.paper, 0.98),
              }}
            >
              <CardContent sx={{ p: 2.25 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                      {item.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: 2.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                    }}
                  >
                    <Iconify icon={item.icon} width={26} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card
        sx={{
          borderRadius: 3.5,
          mb: 3,
          border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
          boxShadow: 'none',
          background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
        }}
      >
        <CardContent>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={2}
            >
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  Search & Filters
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Filter by task name, project, assignee, remarks/issues, or status.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="inherit"
                onClick={resetFilters}
                sx={{ borderRadius: 2.5, fontWeight: 700 }}
              >
                Reset Filters
              </Button>
            </Stack>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Search Tasks"
                  placeholder="Task, project, assignee, remark..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={statusFilter}
                  onChange={(event) => updateRouteFilters({ status: event.target.value })}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  {Object.keys(STATUS_COLOR).map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Assignee"
                  value={assigneeFilter}
                  onChange={(event) => updateRouteFilters({ assignee: event.target.value })}
                >
                  <MenuItem value="all">All Assignees</MenuItem>
                  {assigneeOptions.map((assignee) => (
                    <MenuItem key={assignee} value={assignee}>
                      {assignee}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Projects
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label="01. All Projects"
                  color={projectFilter === 'all' ? 'primary' : 'default'}
                  variant={projectFilter === 'all' ? 'filled' : 'outlined'}
                  onClick={() => updateRouteFilters({ project: 'all' })}
                  clickable
                />
                {projectOptions.map((projectOption, index) => (
                  <Chip
                    key={projectOption}
                    label={`${String(index + 2).padStart(2, '0')}. ${projectOption}`}
                    color={projectFilter === projectOption ? 'primary' : 'default'}
                    variant={projectFilter === projectOption ? 'filled' : 'outlined'}
                    onClick={() => updateRouteFilters({ project: projectOption })}
                    clickable
                  />
                ))}
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label={`Showing ${filteredTasks.length} of ${tasks.length} tasks`}
                color="primary"
                variant="outlined"
              />
              {statusFilter !== 'all' ? <Chip label={`Status: ${statusFilter}`} /> : null}
              {projectFilter !== 'all' ? <Chip label={`Project: ${projectFilter}`} /> : null}
              {assigneeFilter !== 'all' ? <Chip label={`Assignee: ${assigneeFilter}`} /> : null}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: isFocusedSheetView
            ? `1px solid ${alpha(theme.palette.primary.main, 0.18)}`
            : 'none',
          boxShadow: isFocusedSheetView
            ? `0 18px 34px ${alpha(theme.palette.primary.main, 0.08)}`
            : undefined,
        }}
      >
        {isFocusedSheetView ? (
          <Box
            sx={{
              px: 2.25,
              py: 1.4,
              borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              spacing={1.5}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight={800}>
                  Focused Task Sheet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Filtered task results are shown in a more focused excel-style sheet while keeping
                  the same columns and information.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {projectFilter !== 'all' ? (
                  <Chip size="small" color="primary" label={projectFilter} />
                ) : null}
                {statusFilter !== 'all' ? (
                  <Chip size="small" color="primary" variant="outlined" label={statusFilter} />
                ) : null}
                {assigneeFilter !== 'all' ? (
                  <Chip size="small" color="primary" variant="outlined" label={assigneeFilter} />
                ) : null}
              </Stack>
            </Stack>
          </Box>
        ) : null}
        <TableContainer>
          <Table
            stickyHeader
            sx={{
              minWidth: 1180,
              '& .MuiTableCell-root': {
                borderColor: isFocusedSheetView
                  ? alpha(theme.palette.primary.main, 0.18)
                  : alpha(theme.palette.grey[500], 0.18),
                verticalAlign: 'top',
              },
              '& .MuiTableHead-root .MuiTableCell-root': {
                bgcolor: isFocusedSheetView
                  ? alpha(theme.palette.primary.main, 0.12)
                  : alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            <TableHead>
              <TableRow>
                {[
                  '#',
                  'Task',
                  'Project',
                  'Assigned Users',
                  'Schedule',
                  'Remarks / Issues',
                  'Status',
                  'Action',
                ].map((label) => (
                  <TableCell
                    key={label}
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      backdropFilter: 'blur(6px)',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                    }}
                    align={label === 'Action' ? 'right' : 'left'}
                  >
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      justifyContent="center"
                      sx={{ py: 5 }}
                    >
                      <CircularProgress size={20} />
                      <Typography variant="body2" color="text.secondary">
                        Loading tasks...
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : null}

              {!isLoading &&
                filteredTasks.map((task, index) => (
                  <TableRow
                    key={task.id}
                    hover
                    sx={{
                      '&:nth-of-type(odd)': {
                        bgcolor: isFocusedSheetView
                          ? alpha(theme.palette.primary.main, 0.025)
                          : alpha(theme.palette.secondary.main, 0.035),
                      },
                      '&:hover': {
                        bgcolor: alpha(
                          theme.palette.primary.main,
                          isFocusedSheetView ? 0.08 : 0.05
                        ),
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        position: isFocusedSheetView ? 'sticky' : 'static',
                        left: 0,
                        zIndex: isFocusedSheetView ? 1 : 'auto',
                        bgcolor: isFocusedSheetView ? 'background.paper' : undefined,
                      }}
                    >
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ minWidth: 320 }}>
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                          <Chip label={`SL ${task.serialNo}`} size="small" color="primary" />
                          <Typography variant="body2" fontWeight={800}>
                            {task.title}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                          {task.durationDays ? (
                            <Chip
                              label={`${task.durationDays} days`}
                              size="small"
                              variant="outlined"
                            />
                          ) : null}
                          {task.projectCode ? (
                            <Chip label={task.projectCode} size="small" variant="outlined" />
                          ) : null}
                        </Stack>
                        {task.description ? (
                          <Box
                            sx={{
                              px: 1.25,
                              py: 0.9,
                              borderRadius: 2,
                              bgcolor: alpha(
                                theme.palette.background.neutral || theme.palette.grey[500],
                                0.08
                              ),
                              border: `1px solid ${alpha(theme.palette.grey[500], 0.18)}`,
                              color: 'text.secondary',
                              fontSize: 13,
                              lineHeight: 1.45,
                              maxWidth: 420,
                              '& p': { my: 0 },
                              '& ul, & ol': { my: 0, pl: 2.25 },
                              '& strong': { color: theme.palette.text.primary },
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                            dangerouslySetInnerHTML={{
                              __html: getDescriptionMarkup(task.description),
                            }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            No description added yet.
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" fontWeight={700}>
                          {task.projectTitle}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {task.projectCode}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      <Stack spacing={0.85} alignItems="flex-start">
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                          {task.assignedUsers?.length ? (
                            task.assignedUsers.map((user) => (
                              <Chip
                                key={`${task.id}-${user.id}`}
                                label={user.username}
                                size="small"
                              />
                            ))
                          ) : (
                            <Chip label="Unassigned" size="small" variant="outlined" />
                          )}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {task.progressPercent || 0}% complete under assigned person
                          {task.assignedUsers?.length === 1 ? '' : 's'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ minWidth: 210 }}>
                      <Stack spacing={0.75}>
                        <Typography variant="body2" fontWeight={600}>
                          {formatDate(task.startDate)} → {formatDate(task.endDate)}
                        </Typography>
                        <Box
                          sx={{
                            position: 'relative',
                            height: 10,
                            borderRadius: 999,
                            bgcolor: alpha(theme.palette.grey[500], 0.14),
                            overflow: 'hidden',
                            maxWidth: 180,
                          }}
                        >
                          <Box
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              width:
                                task.status === 'Completed'
                                  ? '100%'
                                  : task.status === 'In Progress'
                                    ? '60%'
                                    : '28%',
                              borderRadius: 999,
                              bgcolor:
                                task.status === 'Completed'
                                  ? theme.palette.success.main
                                  : task.status === 'In Progress'
                                    ? theme.palette.primary.main
                                    : task.status === 'On Hold'
                                      ? theme.palette.warning.dark
                                      : theme.palette.warning.main,
                            }}
                          />
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ minWidth: 260 }}>
                      <Stack spacing={0.85} alignItems="flex-start">
                        {task.latestRemark ? (
                          <>
                            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                              <Chip
                                size="small"
                                color="info"
                                variant="outlined"
                                label={`${task.remarksCount} remark${task.remarksCount === 1 ? '' : 's'}`}
                              />
                              <Chip
                                size="small"
                                variant="outlined"
                                label={task.latestRemarkBy || 'Assigned user'}
                              />
                            </Stack>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                maxWidth: 240,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {task.latestRemark}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            No assignee remarks or issues added yet.
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ minWidth: 130 }}>
                      <Stack spacing={0.75} alignItems="flex-start">
                        <Chip label={task.status} color={getStatusTone(task.status)} size="small" />
                        {task.status === 'On Hold' ? (
                          <Typography variant="caption" color="warning.main">
                            Task is paused until the blocker is cleared.
                          </Typography>
                        ) : null}
                        <Chip
                          label={getApprovalLabel(task)}
                          color={getApprovalTone(task.approvalStatus)}
                          size="small"
                          variant={task.approvalStatus === 'Approved' ? 'filled' : 'outlined'}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell align="right" sx={{ minWidth: 320 }}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        justifyContent="flex-end"
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        useFlexGap
                        flexWrap="wrap"
                      >
                        <Button
                          size="small"
                          variant={task.approvalStatus === 'Approved' ? 'contained' : 'outlined'}
                          color={task.approvalStatus === 'Approved' ? 'success' : 'primary'}
                          disabled={
                            approvingTaskId === task.id ||
                            task.approvalStatus === 'Approved' ||
                            task.status !== 'Completed'
                          }
                          onClick={() => handleApproveTask(task)}
                          startIcon={
                            approvingTaskId === task.id ? (
                              <CircularProgress size={14} />
                            ) : (
                              <Iconify icon="solar:shield-check-bold" width={16} />
                            )
                          }
                          sx={{
                            ...getTaskActionButtonSx(
                              theme,
                              task.approvalStatus === 'Approved' ? 'contained' : 'outlined'
                            ),
                            bgcolor:
                              task.approvalStatus === 'Approved'
                                ? alpha(theme.palette.success.main, 0.92)
                                : undefined,
                            color: task.approvalStatus === 'Approved' ? 'common.white' : undefined,
                            borderColor:
                              task.approvalStatus === 'Approved'
                                ? alpha(theme.palette.success.main, 0.24)
                                : alpha(theme.palette.success.main, 0.36),
                          }}
                        >
                          {task.approvalStatus === 'Approved'
                            ? 'Approved'
                            : task.status === 'Completed'
                              ? 'Approve'
                              : 'Await Completion'}
                        </Button>
                        <Button
                          component={RouterLink}
                          href={paths.dashboard.projectManagements.taskManagement.detail(
                            task.projectId,
                            task.id
                          )}
                          size="small"
                          variant="contained"
                          startIcon={
                            <Iconify icon="solar:checklist-minimalistic-bold" width={16} />
                          }
                          sx={{
                            ...getTaskActionButtonSx(theme, 'contained'),
                            background: `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, ${theme.palette.grey[800]} 100%)`,
                            color: 'common.white',
                          }}
                        >
                          Manage Tasks
                        </Button>
                        <Button
                          component={RouterLink}
                          href={paths.dashboard.projectManagements.projects.detail(task.projectId)}
                          size="small"
                          variant="outlined"
                          color="inherit"
                          startIcon={<Iconify icon="solar:folder-with-files-bold" width={16} />}
                          sx={{
                            ...getTaskActionButtonSx(theme, 'outlined'),
                            borderColor: alpha(theme.palette.grey[500], 0.28),
                            bgcolor: alpha(theme.palette.background.paper, 0.9),
                          }}
                        >
                          Project Details
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                      No tasks match the current search/filter selection.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
