'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import { alpha, useTheme } from '@mui/material/styles';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { useProjectManagementsApi } from './use-project-managements-api';

const STATUS_COLOR = {
  Draft: 'default',
  Planning: 'warning',
  Active: 'success',
  'On Hold': 'warning',
  Completed: 'info',
  Closed: 'default',
};

const STATUS_OPTIONS = ['Draft', 'Planning', 'Active', 'On Hold', 'Completed', 'Closed'];
const STATUS_FILTER_OPTIONS = ['pending', ...STATUS_OPTIONS];
const PROJECT_LIST_COLUMNS = {
  xs: '1fr',
  xl: 'minmax(240px, 2.2fr) minmax(180px, 1.35fr) minmax(140px, 1.05fr) minmax(190px, 1.45fr) minmax(170px, 1.2fr) minmax(220px, 1.3fr)',
};

function fCurrency(n) {
  return `BDT ${Number(n || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return '-';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString();
}

function durationMonths(start, end) {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24 * 30)));
}

function getProjectProgressPercent(project) {
  const progress = Number(project?.progressPercent || 0);

  if (Number.isFinite(progress)) {
    return Math.max(0, Math.min(100, progress));
  }

  return 0;
}

function getProjectActionButtonSx(theme, variant = 'outlined') {
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

export default function AllProjects() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, isLoading, error, actions } = useProjectManagementsApi();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusSavingId, setStatusSavingId] = useState(null);
  const [statusError, setStatusError] = useState('');
  const [statusDrafts, setStatusDrafts] = useState({});

  useEffect(() => {
    setStatusDrafts((current) => {
      const next = {};

      projects.forEach((project) => {
        next[project.id] =
          current[project.id] || project.status || project.derivedStatus || 'Draft';
      });

      return next;
    });
  }, [projects]);

  const statusFilter = searchParams.get('status') || 'all';
  const projectFilter = searchParams.get('project') || 'all';
  const typeFilter = searchParams.get('type') || 'all';
  const donorFilter = searchParams.get('donor') || 'all';

  const projectOptions = useMemo(
    () =>
      Array.from(new Set(projects.map((project) => project.title).filter(Boolean))).sort(
        (left, right) => left.localeCompare(right)
      ),
    [projects]
  );

  const donorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          projects
            .map((project) => project.donorName)
            .filter((value) => value && value !== '-' && value !== '—')
        )
      ).sort((left, right) => left.localeCompare(right)),
    [projects]
  );

  const projectTypeOptions = useMemo(
    () =>
      Array.from(new Set(projects.map((project) => project.project_type).filter(Boolean))).sort(
        (left, right) => left.localeCompare(right)
      ),
    [projects]
  );

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'pending' && ['Draft', 'Planning'].includes(project.derivedStatus)) ||
          project.derivedStatus === statusFilter;
        const matchesProject = projectFilter === 'all' || project.title === projectFilter;
        const matchesType = typeFilter === 'all' || project.project_type === typeFilter;
        const matchesDonor = donorFilter === 'all' || project.donorName === donorFilter;

        return matchesStatus && matchesProject && matchesType && matchesDonor;
      }),
    [projects, statusFilter, projectFilter, typeFilter, donorFilter]
  );

  const summary = {
    total: filteredProjects.length,
    active: filteredProjects.filter((project) => project.derivedStatus === 'Active').length,
    completed: filteredProjects.filter((project) => project.derivedStatus === 'Completed').length,
    onHold: filteredProjects.filter((project) => project.derivedStatus === 'On Hold').length,
    pending: filteredProjects.filter((project) =>
      ['Draft', 'Planning'].includes(project.derivedStatus)
    ).length,
    totalBudget: filteredProjects.reduce(
      (sum, project) => sum + Number(project.budgetAmount || 0),
      0
    ),
    totalPlans: filteredProjects.reduce((sum, project) => sum + Number(project.plansCount || 0), 0),
  };

  const isFocusedSheetView =
    statusFilter !== 'all' ||
    projectFilter !== 'all' ||
    typeFilter !== 'all' ||
    donorFilter !== 'all';

  function updateRouteFilters(nextFilters) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(nextFilters).forEach(([key, value]) => {
      if (!value || value === 'all') params.delete(key);
      else params.set(key, value);
    });

    const nextQuery = params.toString();
    router.push(
      nextQuery
        ? `${paths.dashboard.projectManagements.projects.allProjects}?${nextQuery}`
        : paths.dashboard.projectManagements.projects.allProjects
    );
  }

  function resetFilters() {
    updateRouteFilters({ status: 'all', project: 'all', type: 'all', donor: 'all' });
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleteError('');
    setIsDeleting(true);

    try {
      await actions.deleteProject(deleteTarget.id);
      setDeleteTarget(null);
    } catch (deleteFailure) {
      setDeleteError(deleteFailure?.detail || 'Unable to delete project right now.');
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleStatusChange(project, nextStatus) {
    if (!project?.id || !nextStatus || nextStatus === (project.status || 'Draft')) return;

    setStatusError('');
    setStatusSavingId(project.id);

    try {
      await actions.updateProject(project.id, { status: nextStatus });
    } catch (updateFailure) {
      setStatusDrafts((current) => ({
        ...current,
        [project.id]: project.status || project.derivedStatus || 'Draft',
      }));
      setStatusError(updateFailure?.detail || 'Unable to update project status right now.');
    } finally {
      setStatusSavingId(null);
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
                  label={`${summary.total} Projects`}
                  sx={{ bgcolor: alpha('#ffffff', 0.16), color: 'common.white' }}
                />
                <Chip
                  size="small"
                  label={`${summary.active} Active`}
                  sx={{ bgcolor: alpha('#ffffff', 0.16), color: 'common.white' }}
                />
                <Chip
                  size="small"
                  label={`${summary.pending} Pending`}
                  sx={{ bgcolor: alpha('#ffffff', 0.16), color: 'common.white' }}
                />
                <Chip
                  size="small"
                  label={`${summary.totalPlans} Plan Steps`}
                  sx={{ bgcolor: alpha('#ffffff', 0.16), color: 'common.white' }}
                />
              </Stack>
              <Typography variant="h4" fontWeight={800}>
                All Projects
              </Typography>
              <Typography
                variant="body1"
                sx={{ mt: 1.1, maxWidth: 860, color: alpha('#ffffff', 0.84) }}
              >
                Portfolio-wide project register with clearer status filters, roadmap coverage,
                delivery progress, and direct actions.
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              href={paths.dashboard.projectManagements.projects.create}
              variant="contained"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              sx={{
                bgcolor: 'common.white',
                color: 'primary.main',
                fontWeight: 800,
                borderRadius: 2.5,
                px: 2,
                '&:hover': { bgcolor: alpha('#ffffff', 0.94) },
              }}
            >
              Create New Project
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Unable to load projects right now.
        </Alert>
      ) : null}
      {deleteError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {deleteError}
        </Alert>
      ) : null}
      {statusError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {statusError}
        </Alert>
      ) : null}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: 'Total Projects',
            value: summary.total,
            icon: 'solar:folder-with-files-bold-duotone',
          },
          { label: 'Active', value: summary.active, icon: 'solar:play-circle-bold-duotone' },
          { label: 'Completed', value: summary.completed, icon: 'solar:check-circle-bold-duotone' },
          { label: 'On Hold', value: summary.onHold, icon: 'solar:pause-circle-bold-duotone' },
          { label: 'Pending', value: summary.pending, icon: 'solar:clock-circle-bold-duotone' },
          {
            label: 'Total Budget',
            value: fCurrency(summary.totalBudget),
            icon: 'solar:wallet-money-bold-duotone',
          },
          {
            label: 'Plan Steps',
            value: summary.totalPlans,
            icon: 'solar:checklist-minimalistic-bold-duotone',
          },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, lg: 4, xl: 2 }}>
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
                  Filters
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Use dropdown filters to focus by status, project, type, or donor.
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
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={statusFilter}
                  onChange={(event) => updateRouteFilters({ status: event.target.value })}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  {STATUS_FILTER_OPTIONS.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status === 'pending' ? 'Pending' : status}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Project"
                  value={projectFilter}
                  onChange={(event) => updateRouteFilters({ project: event.target.value })}
                >
                  <MenuItem value="all">All Projects</MenuItem>
                  {projectOptions.map((projectOption) => (
                    <MenuItem key={projectOption} value={projectOption}>
                      {projectOption}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Project Type"
                  value={typeFilter}
                  onChange={(event) => updateRouteFilters({ type: event.target.value })}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  {projectTypeOptions.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Donor"
                  value={donorFilter}
                  onChange={(event) => updateRouteFilters({ donor: event.target.value })}
                >
                  <MenuItem value="all">All Donors</MenuItem>
                  {donorOptions.map((donor) => (
                    <MenuItem key={donor} value={donor}>
                      {donor}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label={`Showing ${filteredProjects.length} of ${projects.length} projects`}
                color="primary"
                variant="outlined"
              />
              {statusFilter !== 'all' ? (
                <Chip label={`Status: ${statusFilter === 'pending' ? 'Pending' : statusFilter}`} />
              ) : null}
              {projectFilter !== 'all' ? <Chip label={`Project: ${projectFilter}`} /> : null}
              {typeFilter !== 'all' ? <Chip label={`Type: ${typeFilter}`} /> : null}
              {donorFilter !== 'all' ? <Chip label={`Donor: ${donorFilter}`} /> : null}
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
                  Focused Project Sheet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Filtered project results are shown in the same focused sheet style used on the
                  all-tasks page.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {statusFilter !== 'all' ? (
                  <Chip
                    size="small"
                    color="primary"
                    label={statusFilter === 'pending' ? 'Pending' : statusFilter}
                  />
                ) : null}
                {projectFilter !== 'all' ? (
                  <Chip size="small" color="primary" variant="outlined" label={projectFilter} />
                ) : null}
                {typeFilter !== 'all' ? (
                  <Chip size="small" color="primary" variant="outlined" label={typeFilter} />
                ) : null}
                {donorFilter !== 'all' ? (
                  <Chip size="small" color="primary" variant="outlined" label={donorFilter} />
                ) : null}
              </Stack>
            </Stack>
          </Box>
        ) : null}

        <Box sx={{ p: { xs: 1.5, md: 2 } }}>
          {isLoading ? (
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              justifyContent="center"
              sx={{ py: 5 }}
            >
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Loading project list...
              </Typography>
            </Stack>
          ) : null}

          {!isLoading ? (
            <Stack spacing={1.5}>
              <Box
                sx={{
                  display: { xs: 'none', lg: 'grid' },
                  gridTemplateColumns: PROJECT_LIST_COLUMNS,
                  gap: 2,
                  px: 1.5,
                  pb: 0.5,
                }}
              >
                {['Project', 'Donor & Team', 'Timeline', 'Progress', 'Status', 'Actions'].map(
                  (label) => (
                    <Typography
                      key={label}
                      variant="caption"
                      fontWeight={800}
                      color="text.secondary"
                      sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                    >
                      {label}
                    </Typography>
                  )
                )}
              </Box>

              {filteredProjects.map((project, index) => {
                const projectProgressPercent = getProjectProgressPercent(project);

                return <Box
                  key={project.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: PROJECT_LIST_COLUMNS,
                    gap: 2,
                    alignItems: 'start',
                    px: { xs: 1.5, md: 1.8 },
                    py: { xs: 1.5, md: 1.7 },
                    borderRadius: 3,
                    border: `1px solid ${alpha(isFocusedSheetView ? theme.palette.primary.main : theme.palette.grey[500], isFocusedSheetView ? 0.18 : 0.14)}`,
                    background: isFocusedSheetView
                      ? `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`
                      : alpha(theme.palette.background.paper, 0.98),
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: { xs: 'block', lg: 'none' },
                        textTransform: 'uppercase',
                        mb: 0.6,
                      }}
                    >
                      Project
                    </Typography>
                    <Stack spacing={0.7}>
                      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Chip size="small" label={`#${index + 1}`} color="primary" variant="outlined" />
                        <Typography variant="subtitle2" fontWeight={800}>{project.title}</Typography>
                        {project.code ? <Chip label={project.code} size="small" color="primary" /> : null}
                        <Chip label={project.derivedStatus || project.status} color={STATUS_COLOR[project.derivedStatus || project.status] || 'default'} size="small" />
                        <Chip label={`${projectProgressPercent}% done`} size="small" variant="outlined" color="primary" />
                      </Stack>
                      <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
                        {project.project_type ? (
                          <Chip label={project.project_type} size="small" variant="outlined" />
                        ) : null}
                        {project.implementation_type ? (
                          <Chip
                            label={project.implementation_type}
                            size="small"
                            variant="outlined"
                          />
                        ) : null}
                        {project.location ? (
                          <Chip label={project.location} size="small" variant="outlined" />
                        ) : null}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {project.progressSummary}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {project.progressDetail}
                      </Typography>
                    </Stack>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: { xs: 'block', lg: 'none' },
                        textTransform: 'uppercase',
                        mb: 0.6,
                      }}
                    >
                      Donor & Team
                    </Typography>
                    <Stack spacing={0.7}>
                      <Typography variant="body2" fontWeight={700}>
                        {project.donorName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Manager: {project.projectManagerName || '-'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Budget: {fCurrency(project.budgetAmount)}
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {project.assigned_users?.length ? (
                          project.assigned_users.map((user) => (
                            <Chip
                              key={`${project.id}-${user.id}`}
                              label={user.username}
                              size="small"
                            />
                          ))
                        ) : (
                          <Chip label="Unassigned" size="small" variant="outlined" />
                        )}
                      </Stack>
                    </Stack>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: { xs: 'block', lg: 'none' },
                        textTransform: 'uppercase',
                        mb: 0.6,
                      }}
                    >
                      Timeline
                    </Typography>
                    <Stack spacing={0.7}>
                      <Typography variant="body2" fontWeight={600}>
                        {formatDate(project.start_date)} → {formatDate(project.end_date)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {project.duration_months
                          ? `${project.duration_months} months`
                          : 'Duration pending'}
                      </Typography>
                    </Stack>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: { xs: 'block', lg: 'none' },
                        textTransform: 'uppercase',
                        mb: 0.6,
                      }}
                    >
                      Progress
                    </Typography>
                    <Stack spacing={0.7}>
                      <Typography variant="body2" fontWeight={600}>{projectProgressPercent}% complete</Typography>
                      <Box sx={{ position: 'relative', height: 9, borderRadius: 999, bgcolor: alpha(theme.palette.grey[500], 0.14), overflow: 'hidden' }}>
                        <Box sx={{ position: 'absolute', inset: 0, width: `${projectProgressPercent}%`, borderRadius: 999, bgcolor: projectProgressPercent >= 100 ? theme.palette.success.main : projectProgressPercent >= 50 ? theme.palette.primary.main : theme.palette.warning.main }} />
                      </Box>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`${project.plansCount || 0} steps`}
                        />
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`${project.workItemStatusCounts?.total || 0} work items`}
                        />
                      </Stack>
                    </Stack>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: { xs: 'block', lg: 'none' },
                        textTransform: 'uppercase',
                        mb: 0.6,
                      }}
                    >
                      Status
                    </Typography>
                    <Stack spacing={0.7} alignItems="flex-start">
                      <TextField
                        select
                        size="small"
                        label="Status"
                        value={
                          statusDrafts[project.id] ||
                          project.status ||
                          project.derivedStatus ||
                          'Draft'
                        }
                        onChange={(event) => {
                          const nextStatus = event.target.value;
                          setStatusDrafts((current) => ({ ...current, [project.id]: nextStatus }));
                          handleStatusChange(project, nextStatus);
                        }}
                        disabled={statusSavingId === project.id}
                        sx={{ width: '100%' }}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <MenuItem key={status} value={status}>
                            {status}
                          </MenuItem>
                        ))}
                      </TextField>
                      {statusSavingId === project.id ? (
                        <Typography variant="caption" color="text.secondary">
                          Saving status...
                        </Typography>
                      ) : null}
                      <Typography
                        variant="caption"
                        color={
                          project.derivedStatus === 'On Hold' ? 'warning.main' : 'text.secondary'
                        }
                      >
                        {project.derivedStatus === 'On Hold'
                          ? 'Project is paused until blockers are resolved.'
                          : `Current status is ${project.derivedStatus || project.status}.`}
                      </Typography>
                    </Stack>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: { xs: 'block', lg: 'none' },
                        textTransform: 'uppercase',
                        mb: 0.6,
                      }}
                    >
                      Actions
                    </Typography>
                    <Stack spacing={1}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row', lg: 'column' }}
                        spacing={0.8}
                        alignItems={{ xs: 'stretch', sm: 'center', lg: 'stretch' }}
                        useFlexGap
                        flexWrap="wrap"
                      >
                        <Button
                          component={RouterLink}
                          href={paths.dashboard.projectManagements.projects.detail(project.id)}
                          size="small"
                          variant="contained"
                          startIcon={<Iconify icon="solar:eye-bold" width={16} />}
                          sx={{
                            ...getProjectActionButtonSx(theme, 'contained'),
                            background: `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, ${theme.palette.grey[800]} 100%)`,
                            color: 'common.white',
                          }}
                        >
                          Project Details
                        </Button>
                        <Button
                          component={RouterLink}
                          href={paths.dashboard.projectManagements.projects.edit(project.id)}
                          size="small"
                          variant="outlined"
                          color="inherit"
                          startIcon={<Iconify icon="solar:pen-bold" width={16} />}
                          sx={{
                            ...getProjectActionButtonSx(theme, 'outlined'),
                            borderColor: alpha(theme.palette.grey[500], 0.28),
                            bgcolor: alpha(theme.palette.background.paper, 0.9),
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => setDeleteTarget(project)}
                          startIcon={<Iconify icon="solar:trash-bin-trash-bold" width={16} />}
                          sx={{
                            ...getProjectActionButtonSx(theme, 'outlined'),
                            borderColor: alpha(theme.palette.error.main, 0.36),
                          }}
                        >
                          Delete
                        </Button>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Health: {project.progressDetail}
                      </Typography>
                    </Stack>
                  </Box>
                </Box>;
              })}

              {!filteredProjects.length ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: 4, textAlign: 'center' }}
                >
                  No projects match the current filter selection.
                </Typography>
              ) : null}
            </Stack>
          ) : null}
        </Box>
      </Card>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {deleteTarget
              ? `Are you sure you want to delete ${deleteTarget.title}? This action cannot be undone.`
              : ''}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} color="inherit" disabled={isDeleting}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
