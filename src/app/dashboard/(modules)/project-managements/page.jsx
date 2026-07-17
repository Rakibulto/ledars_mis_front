'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import { alpha, useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { useProjectManagementsApi } from './_components/use-project-managements-api';

const WORKSPACES = [
  {
    title: 'Dashboard',
    description:
      'High-level analytics — project status distribution, budget overview, and task completion trends.',
    href: paths.dashboard.projectManagements.dashboard,
    icon: 'solar:chart-bold-duotone',
  },
  {
    title: 'Projects',
    description:
      'Manage all projects, assign tasks, track milestones, and generate project-level reports.',
    href: paths.dashboard.projectManagements.projects.allProjects,
    icon: 'solar:folder-with-files-bold-duotone',
  },
  {
    title: 'Create New Project',
    description:
      'Capture NGO project basics, donor details, duration, assigned teams, and multi-step implementation plans.',
    href: paths.dashboard.projectManagements.projects.create,
    icon: 'solar:add-square-bold-duotone',
  },
  {
    title: 'Task Management',
    description:
      'Browse all project tasks from one place, grouped from project plans with owners, dates, and status.',
    href: paths.dashboard.projectManagements.taskManagement.allTasks,
    icon: 'solar:checklist-minimalistic-bold-duotone',
  },
];

const QUICK_ACTIONS = [
  { label: 'View dashboard', href: paths.dashboard.projectManagements.dashboard },
  { label: 'All Projects', href: paths.dashboard.projectManagements.projects.allProjects },
  { label: 'Create New Project', href: paths.dashboard.projectManagements.projects.create },
  { label: 'All Tasks', href: paths.dashboard.projectManagements.taskManagement.allTasks },
  { label: 'Project Reports', href: paths.dashboard.projectManagements.projects.report },
];

export default function Page() {
  const theme = useTheme();
  const { overview, isLoading, error } = useProjectManagementsApi();

  const kpiCards = [
    {
      label: 'Active Projects',
      value: overview.activeProjects,
      helper: 'Projects currently moving through active roadmap execution',
      icon: 'solar:folder-with-files-bold-duotone',
    },
    {
      label: 'Tasks Pending',
      value: overview.pendingWorkItems,
      helper: `${overview.inProgressWorkItems} work items are currently in progress`,
      icon: 'solar:checklist-minimalistic-bold-duotone',
    },
    {
      label: 'Approved Budget',
      value: `৳${Number(overview.totalBudget || 0).toLocaleString()}`,
      helper: 'Approved budget total derived from the live project list',
      icon: 'solar:wallet-bold-duotone',
    },
    {
      label: 'Overdue Items',
      value: overview.overduePlans + overview.overdueWorkItems,
      helper: `${overview.overduePlans} plan steps and ${overview.overdueWorkItems} work items are overdue`,
      icon: 'solar:danger-circle-bold-duotone',
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
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 55%, ${theme.palette.secondary.main} 100%)`,
          boxShadow: `0 22px 44px ${alpha(theme.palette.primary.main, 0.22)}`,
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" spacing={3}>
            <Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                <Chip
                  size="small"
                  label={`${overview.totalProjects} Projects`}
                  sx={{ bgcolor: alpha('#ffffff', 0.18), color: 'common.white' }}
                />
                <Chip
                  size="small"
                  label={`${overview.activeProjects} Active`}
                  sx={{ bgcolor: alpha('#ffffff', 0.18), color: 'common.white' }}
                />
                <Chip
                  size="small"
                  label={`${overview.workItemCompletionRate}% Task Completion`}
                  sx={{ bgcolor: alpha('#ffffff', 0.18), color: 'common.white' }}
                />
              </Stack>
              <Typography variant="h4" fontWeight={800}>
                Project Management Workspace
              </Typography>
              <Typography
                variant="body1"
                sx={{ mt: 1.1, maxWidth: 860, color: alpha('#ffffff', 0.84) }}
              >
                A live command center for project delivery, task execution, overdue work, and
                donor-backed portfolio visibility.
              </Typography>
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.25}
              alignItems={{ xs: 'stretch', lg: 'flex-start' }}
            >
              {QUICK_ACTIONS.slice(0, 3).map((action, index) => (
                <Button
                  key={action.label}
                  component={RouterLink}
                  href={action.href}
                  variant={index === 0 ? 'contained' : 'outlined'}
                  sx={
                    index === 0
                      ? {
                          bgcolor: 'common.white',
                          color: 'primary.main',
                          fontWeight: 800,
                          borderRadius: 2.5,
                        }
                      : {
                          borderColor: alpha('#ffffff', 0.35),
                          color: 'common.white',
                          borderRadius: 2.5,
                        }
                  }
                >
                  {action.label}
                </Button>
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Unable to load project workspace analytics right now.
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
            Loading workspace overview...
          </Typography>
        </Stack>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {kpiCards.map((item) => (
              <Grid key={item.label} size={{ xs: 12, sm: 6, xl: 3 }}>
                <Card
                  sx={{
                    borderRadius: 3.5,
                    height: '100%',
                    border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
                    boxShadow: 'none',
                    background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
                  }}
                >
                  <CardContent sx={{ p: 2.4 }}>
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {item.label}
                        </Typography>
                        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                          {item.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                          {item.helper}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          borderRadius: 2.5,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
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
            <Grid size={{ xs: 12, lg: 8 }}>
              <Grid container spacing={2}>
                {WORKSPACES.map((item) => (
                  <Grid key={item.title} size={{ xs: 12, md: 6 }}>
                    <Card
                      sx={{
                        borderRadius: 3.5,
                        height: '100%',
                        border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
                        boxShadow: 'none',
                        transition: 'transform 160ms ease, box-shadow 160ms ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 18px 36px ${alpha(theme.palette.grey[900], 0.08)}`,
                        },
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            color: 'primary.main',
                            width: 'fit-content',
                            mb: 2,
                          }}
                        >
                          <Iconify icon={item.icon} width={24} />
                        </Box>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          spacing={1}
                          alignItems="flex-start"
                          sx={{ mb: 0.75 }}
                        >
                          <Typography variant="h6" fontWeight={700}>
                            {item.title}
                          </Typography>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={
                              item.title === 'Dashboard'
                                ? `${overview.projectCompletionRate}% complete`
                                : item.title === 'Projects'
                                  ? `${overview.totalProjects} live`
                                  : item.title === 'Create New Project'
                                    ? `${overview.planningProjects} planning`
                                    : `${overview.totalWorkItems} items`
                            }
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 2 }}>
                          {item.description}
                        </Typography>
                        <Button
                          component={RouterLink}
                          href={item.href}
                          variant="outlined"
                          fullWidth
                          color="inherit"
                        >
                          Open Workspace
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <Stack spacing={3}>
                <Card
                  sx={{
                    borderRadius: 3.5,
                    border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
                    boxShadow: 'none',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                      Live Snapshot
                    </Typography>
                    <Stack spacing={1.4}>
                      {[
                        { label: 'Projects on hold', value: overview.onHoldProjects },
                        { label: 'Roadmap steps overdue', value: overview.overduePlans },
                        { label: 'Task items overdue', value: overview.overdueWorkItems },
                        { label: 'Tracked donors', value: overview.donorRows.length },
                      ].map((item, index) => (
                        <Box key={item.label}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" color="text.secondary">
                              {item.label}
                            </Typography>
                            <Typography variant="body2" fontWeight={800}>
                              {item.value}
                            </Typography>
                          </Stack>
                          {index < 3 ? <Divider sx={{ mt: 1.1 }} /> : null}
                        </Box>
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
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
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
                            <Iconify icon="solar:bolt-bold" width={14} />
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
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                      Quick Actions
                    </Typography>
                    <Stack spacing={1}>
                      {QUICK_ACTIONS.map((action) => (
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
