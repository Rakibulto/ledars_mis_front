'use client';

import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import { alpha, useTheme } from '@mui/material/styles';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { useProjectManagementDashboard } from './use-project-managements-api';

const STATUS_TONE = {
  Active: 'success',
  Completed: 'info',
  'On Hold': 'warning',
  Planning: 'default',
  Closed: 'default',
};

function formatCurrency(value, currency = 'BDT') {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatCompactCurrency(value, currency = 'BDT') {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function formatDeadlineLabel(item) {
  if (!item?.scheduledDate) return 'No due date';

  const formatted = dayjs(item.scheduledDate).isValid()
    ? dayjs(item.scheduledDate).format('DD MMM YYYY')
    : 'No due date';

  if (item.daysLeft < 0) return `${formatted} • ${Math.abs(item.daysLeft)} day(s) overdue`;
  if (item.daysLeft === 0) return `${formatted} • Due today`;
  return `${formatted} • ${item.daysLeft} day(s) left`;
}

export default function ProjectManagementsDashboard() {
  const theme = useTheme();
  const router = useRouter();
  const { overview, isLoading, error } = useProjectManagementDashboard();

  function openProjectList(status = 'all') {
    const basePath = paths.dashboard.projectManagements.projects.allProjects;
    if (!status || status === 'all') {
      router.push(basePath);
      return;
    }

    router.push(`${basePath}?status=${encodeURIComponent(status)}`);
  }

  const stats = [
    {
      label: 'Live Projects',
      value: overview.totalProjects,
      helper: `${overview.pendingProjects} pending • ${overview.onHoldProjects} on hold`,
      icon: 'solar:folder-with-files-bold-duotone',
      color: theme.palette.primary.main,
      onClick: () => router.push(paths.dashboard.projectManagements.projects.allProjects),
    },
    {
      label: 'Roadmap Completion',
      value: `${overview.planCompletionRate}%`,
      helper: `${overview.completedPlans}/${overview.totalPlans} roadmap steps completed`,
      icon: 'solar:chart-2-bold-duotone',
      color: theme.palette.info.main,
      onClick: () => router.push(paths.dashboard.projectManagements.taskManagement.allTasks),
    },
    {
      label: 'Execution Delivery',
      value: `${overview.workItemCompletionRate}%`,
      helper: `${overview.inProgressWorkItems} in progress • ${overview.pendingWorkItems} pending`,
      icon: 'solar:checklist-minimalistic-bold-duotone',
      color: theme.palette.success.main,
      onClick: () => router.push(paths.dashboard.projectManagements.taskManagement.allTasks),
    },
    {
      label: 'Portfolio Budget',
      value: formatCompactCurrency(overview.totalBudget),
      helper: `${overview.donorRows.length} donor-backed funding streams`,
      icon: 'solar:wallet-money-bold-duotone',
      color: theme.palette.warning.main,
      onClick: () => router.push(paths.dashboard.projectManagements.projects.report),
    },
  ];

  return (
    <Box>
      <Card
        sx={{
          mb: 3,
          borderRadius: 4,
          overflow: 'hidden',
          color: 'common.white',
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 58%, ${theme.palette.secondary.main} 100%)`,
          boxShadow: `0 24px 48px ${alpha(theme.palette.primary.main, 0.22)}`,
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack direction={{ xs: 'column', xl: 'row' }} justifyContent="space-between" spacing={3}>
            <Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                <Chip
                  size="small"
                  label={`${overview.totalProjects} Projects`}
                  onClick={() => openProjectList('all')}
                  clickable
                  sx={{
                    bgcolor: alpha('#ffffff', 0.16),
                    color: 'common.white',
                    '&:hover': { bgcolor: alpha('#ffffff', 0.24) },
                  }}
                />
                <Chip
                  size="small"
                  label={`${overview.pendingProjects} Pending`}
                  onClick={() => openProjectList('pending')}
                  clickable
                  sx={{
                    bgcolor: alpha('#ffffff', 0.16),
                    color: 'common.white',
                    '&:hover': { bgcolor: alpha('#ffffff', 0.24) },
                  }}
                />
                <Chip
                  size="small"
                  label={`${overview.onHoldProjects} On Hold`}
                  onClick={() => openProjectList('On Hold')}
                  clickable
                  sx={{
                    bgcolor: alpha('#ffffff', 0.16),
                    color: 'common.white',
                    '&:hover': { bgcolor: alpha('#ffffff', 0.24) },
                  }}
                />
                <Chip
                  size="small"
                  label={`${overview.completedProjects} Completed`}
                  onClick={() => openProjectList('Completed')}
                  clickable
                  sx={{
                    bgcolor: alpha('#ffffff', 0.16),
                    color: 'common.white',
                    '&:hover': { bgcolor: alpha('#ffffff', 0.24) },
                  }}
                />
                <Chip
                  size="small"
                  label={`${overview.projectCompletionRate}% Portfolio Complete`}
                  sx={{ bgcolor: alpha('#ffffff', 0.16), color: 'common.white' }}
                />
                <Chip
                  size="small"
                  label={`${overview.totalTrackedAttachments} Files Tracked`}
                  sx={{ bgcolor: alpha('#ffffff', 0.16), color: 'common.white' }}
                />
              </Stack>
              <Typography variant="h4" fontWeight={800}>
                Project Management Dashboard
              </Typography>
              <Typography
                variant="body1"
                sx={{ mt: 1.1, maxWidth: 880, color: alpha('#ffffff', 0.84) }}
              >
                Dedicated live portfolio intelligence built from project, roadmap, and execution
                task data inside the project managements module only.
              </Typography>
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.25}
              alignItems={{ xs: 'stretch', xl: 'flex-start' }}
            >
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
                }}
              >
                Open Projects
              </Button>
              <Button
                component={RouterLink}
                href={paths.dashboard.projectManagements.taskManagement.allTasks}
                variant="outlined"
                startIcon={<Iconify icon="solar:checklist-minimalistic-bold" />}
                sx={{
                  borderColor: alpha('#ffffff', 0.35),
                  color: 'common.white',
                  borderRadius: 2.5,
                }}
              >
                Review Tasks
              </Button>
              <Button
                component={RouterLink}
                href={paths.dashboard.projectManagements.expenses.root}
                variant="outlined"
                startIcon={<Iconify icon="solar:card-send-bold" />}
                sx={{
                  borderColor: alpha('#ffffff', 0.35),
                  color: 'common.white',
                  borderRadius: 2.5,
                }}
              >
                Expenses
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Unable to load project management dashboard data right now.
        </Alert>
      ) : null}

      {isLoading ? (
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          justifyContent="center"
          sx={{ py: 8 }}
        >
          <CircularProgress size={22} />
          <Typography variant="body2" color="text.secondary">
            Loading live project dashboard...
          </Typography>
        </Stack>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {stats.map((item) => (
              <Grid key={item.label} size={{ xs: 12, sm: 6, xl: 3 }}>
                <Card
                  onClick={item.onClick}
                  sx={{
                    borderRadius: 3.5,
                    height: '100%',
                    cursor: 'pointer',
                    border: `1px solid ${alpha(item.color, 0.18)}`,
                    boxShadow: 'none',
                    background: `linear-gradient(180deg, ${alpha(item.color, 0.08)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
                    transition:
                      'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 18px 36px ${alpha(item.color, 0.18)}`,
                      borderColor: alpha(item.color, 0.32),
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {item.label}
                        </Typography>
                        <Typography variant="h4" fontWeight={800} sx={{ mt: 0.6 }}>
                          {item.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                          {item.helper}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: 54,
                          height: 54,
                          borderRadius: 2.5,
                          bgcolor: alpha(item.color, 0.12),
                          color: item.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Iconify icon={item.icon} width={30} />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              {
                label: 'Pending Projects',
                value: overview.pendingProjects,
                color: theme.palette.grey[700],
                icon: 'solar:clock-circle-bold-duotone',
                status: 'pending',
              },
              {
                label: 'On Hold Projects',
                value: overview.onHoldProjects,
                color: theme.palette.warning.main,
                icon: 'solar:pause-circle-bold-duotone',
                status: 'On Hold',
              },
              {
                label: 'Completed Projects',
                value: overview.completedProjects,
                color: theme.palette.success.main,
                icon: 'solar:check-circle-bold-duotone',
                status: 'Completed',
              },
            ].map((item) => (
              <Grid key={item.label} size={{ xs: 12, md: 4 }}>
                <Card
                  onClick={() => openProjectList(item.status)}
                  sx={{
                    borderRadius: 3.5,
                    border: `1px solid ${alpha(item.color, 0.18)}`,
                    boxShadow: 'none',
                    cursor: 'pointer',
                    background: `linear-gradient(180deg, ${alpha(item.color, 0.07)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
                    transition:
                      'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 18px 36px ${alpha(item.color, 0.16)}`,
                      borderColor: alpha(item.color, 0.3),
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.25 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={2}
                    >
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
                          width: 48,
                          height: 48,
                          borderRadius: 2.5,
                          bgcolor: alpha(item.color, 0.12),
                          color: item.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Iconify icon={item.icon} width={28} />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, xl: 8 }}>
              <Stack spacing={3}>
                <Card
                  sx={{
                    borderRadius: 3.5,
                    border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
                    boxShadow: 'none',
                  }}
                >
                  <CardContent>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      justifyContent="space-between"
                      spacing={2}
                      sx={{ mb: 2.5 }}
                    >
                      <Box>
                        <Typography variant="h6" fontWeight={800}>
                          Portfolio Progress Snapshot
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Top live projects ranked by delivery progress, budget size, and execution
                          health.
                        </Typography>
                      </Box>
                      <Chip
                        label={`${overview.totalProjects} live projects`}
                        color="primary"
                        variant="outlined"
                      />
                    </Stack>
                    <Stack spacing={2}>
                      {overview.projectProgressRows.map((project) => (
                        <Box
                          key={project.id}
                          sx={{
                            p: 2,
                            borderRadius: 2.5,
                            border: `1px solid ${alpha(theme.palette.grey[500], 0.14)}`,
                            backgroundColor: alpha(
                              theme.palette.background.neutral || theme.palette.grey[500],
                              0.03
                            ),
                          }}
                        >
                          <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            justifyContent="space-between"
                            spacing={1.5}
                            sx={{ mb: 1 }}
                          >
                            <Box>
                              <Stack
                                direction="row"
                                spacing={1}
                                useFlexGap
                                flexWrap="wrap"
                                alignItems="center"
                                sx={{ mb: 0.5 }}
                              >
                                <Typography variant="body2" fontWeight={700}>
                                  {project.title}
                                </Typography>
                                <Chip
                                  label={project.derivedStatus}
                                  size="small"
                                  color={STATUS_TONE[project.derivedStatus] || 'default'}
                                />
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                {project.code || 'No code'} • {project.donorName} •{' '}
                                {project.projectManagerName}
                              </Typography>
                            </Box>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              flexWrap="wrap"
                              useFlexGap
                            >
                              <Typography variant="caption" color="text.secondary">
                                {formatCurrency(project.budgetAmount, project.currency)}
                              </Typography>
                              <Button
                                component={RouterLink}
                                href={paths.dashboard.projectManagements.projects.detail(
                                  project.id
                                )}
                                size="small"
                                variant="outlined"
                                color="inherit"
                              >
                                View Project
                              </Button>
                            </Stack>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(project.progressPercent, 100)}
                            color={
                              project.progressPercent >= 100
                                ? 'success'
                                : project.progressPercent >= 55
                                  ? 'primary'
                                  : 'warning'
                            }
                            sx={{ height: 8, borderRadius: 999 }}
                          />
                          <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            justifyContent="space-between"
                            spacing={1}
                            sx={{ mt: 1 }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              {project.progressSummary} • {project.progressDetail}
                            </Typography>
                            <Typography
                              variant="caption"
                              color={project.overdueCount ? 'error.main' : 'text.secondary'}
                            >
                              {project.overdueCount
                                ? `${project.overdueCount} overdue item(s)`
                                : 'No overdue items'}
                            </Typography>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card
                      sx={{
                        borderRadius: 3.5,
                        border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
                        boxShadow: 'none',
                        height: '100%',
                      }}
                    >
                      <CardContent>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          spacing={2}
                          sx={{ mb: 2 }}
                        >
                          <Box>
                            <Typography variant="h6" fontWeight={800}>
                              Donor Portfolio
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Funding concentration and active donor load across the module.
                            </Typography>
                          </Box>
                          <Chip label={`${overview.donorRows.length} donors`} variant="outlined" />
                        </Stack>
                        <Stack spacing={1.5}>
                          {overview.donorRows.map((donor) => (
                            <Stack
                              key={donor.donorName}
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                              spacing={2}
                            >
                              <Box>
                                <Typography variant="body2" fontWeight={700}>
                                  {donor.donorName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {donor.projects} project(s) • {donor.activeProjects} active
                                </Typography>
                              </Box>
                              <Typography variant="body2" fontWeight={800}>
                                {formatCompactCurrency(donor.budgetAmount)}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card
                      sx={{
                        borderRadius: 3.5,
                        border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
                        boxShadow: 'none',
                        height: '100%',
                      }}
                    >
                      <CardContent>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          spacing={2}
                          sx={{ mb: 2 }}
                        >
                          <Box>
                            <Typography variant="h6" fontWeight={800}>
                              Team Execution Load
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Who owns the most tracked execution work right now.
                            </Typography>
                          </Box>
                          <Chip
                            label={`${overview.teamLoadRows.length} assignees`}
                            variant="outlined"
                          />
                        </Stack>
                        <Stack spacing={1.5}>
                          {overview.teamLoadRows.map((member) => (
                            <Box key={member.username}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{ mb: 0.5 }}
                              >
                                <Box>
                                  <Typography variant="body2" fontWeight={700}>
                                    {member.username}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {member.done} done • {member.doing} doing • {member.todo} todo
                                  </Typography>
                                </Box>
                                <Chip
                                  size="small"
                                  color={
                                    member.progress >= 70
                                      ? 'success'
                                      : member.progress >= 40
                                        ? 'primary'
                                        : 'warning'
                                  }
                                  label={`${member.total} items`}
                                />
                              </Stack>
                              <LinearProgress
                                variant="determinate"
                                value={member.progress}
                                sx={{ height: 7, borderRadius: 999 }}
                              />
                            </Box>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, xl: 4 }}>
              <Stack spacing={3}>
                <Card
                  sx={{
                    borderRadius: 3.5,
                    border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
                    boxShadow: 'none',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                      Delivery Signals
                    </Typography>
                    <Stack spacing={1.5}>
                      {[
                        {
                          label: 'On Track',
                          value: overview.timelineHealth.onTrack,
                          color: 'success',
                        },
                        {
                          label: 'At Risk',
                          value: overview.timelineHealth.atRisk,
                          color: 'warning',
                        },
                        {
                          label: 'Overdue',
                          value: overview.timelineHealth.overdue,
                          color: 'error',
                        },
                        {
                          label: 'Blocked',
                          value: overview.timelineHealth.blocked,
                          color: 'default',
                        },
                      ].map((item) => (
                        <Stack
                          key={item.label}
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Chip label={item.label} color={item.color} size="small" />
                          <Typography variant="h6" fontWeight={800}>
                            {item.value}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>

                <Card
                  sx={{
                    borderRadius: 3.5,
                    border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
                    boxShadow: 'none',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                      Upcoming Deadlines
                    </Typography>
                    <Stack spacing={1.5}>
                      {overview.upcomingDeadlines.length ? (
                        overview.upcomingDeadlines.map((item) => (
                          <Box
                            key={item.id}
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              border: `1px solid ${alpha(theme.palette.grey[500], 0.14)}`,
                              backgroundColor: alpha(
                                theme.palette.background.neutral || theme.palette.grey[500],
                                0.03
                              ),
                            }}
                          >
                            <Typography variant="body2" fontWeight={700}>
                              {item.title}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', mt: 0.45 }}
                            >
                              {item.projectTitle} • {item.planTitle}
                            </Typography>
                            <Typography
                              variant="caption"
                              color={
                                item.daysLeft < 0
                                  ? 'error.main'
                                  : item.daysLeft <= 2
                                    ? 'warning.main'
                                    : 'text.secondary'
                              }
                              sx={{ display: 'block', mt: 0.45 }}
                            >
                              {formatDeadlineLabel(item)}
                            </Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No pending deadlines detected.
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>

                <Card
                  sx={{
                    borderRadius: 3.5,
                    border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
                    boxShadow: 'none',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                      Priority Actions
                    </Typography>
                    <Stack spacing={1.5}>
                      {overview.priorityActions.map((item, index) => (
                        <Stack key={item} direction="row" spacing={1.25} alignItems="flex-start">
                          <Box
                            sx={{
                              mt: 0.35,
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              bgcolor:
                                index === 0
                                  ? alpha(theme.palette.error.main, 0.12)
                                  : index === 1
                                    ? alpha(theme.palette.warning.main, 0.14)
                                    : alpha(theme.palette.primary.main, 0.12),
                              color:
                                index === 0
                                  ? 'error.main'
                                  : index === 1
                                    ? 'warning.main'
                                    : 'primary.main',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Iconify icon="solar:danger-triangle-bold" width={14} />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {item}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>

                <Card
                  sx={{
                    borderRadius: 3.5,
                    border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
                    boxShadow: 'none',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                      Quick Access
                    </Typography>
                    <Stack spacing={1}>
                      {[
                        {
                          label: 'All Projects',
                          href: paths.dashboard.projectManagements.projects.allProjects,
                        },
                        {
                          label: 'Create Project',
                          href: paths.dashboard.projectManagements.projects.create,
                        },
                        {
                          label: 'Task Management',
                          href: paths.dashboard.projectManagements.taskManagement.allTasks,
                        },
                        {
                          label: 'Expenses',
                          href: paths.dashboard.projectManagements.expenses.root,
                        },
                        {
                          label: 'Reports',
                          href: paths.dashboard.projectManagements.projects.report,
                        },
                      ].map((action) => (
                        <Button
                          key={action.label}
                          component={RouterLink}
                          href={action.href}
                          variant="outlined"
                          color="inherit"
                          fullWidth
                        >
                          {action.label}
                        </Button>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
