'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import { alpha, useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

import ProjectPlanRoadmapBoard, {
  ITERATION_COLORS,
  ASSIGNEE_TIME_TABS,
} from './project-plan-roadmap-board';

function buildOverviewUrl(filters) {
  const params = new URLSearchParams();
  params.set('pagination', 'true');
  params.set('page_size', String(filters.pageSize || 20));
  params.set('page', String(filters.page || 1));

  if (filters.project) params.set('project', String(filters.project));
  if (filters.startDate) params.set('start_date', filters.startDate);
  if (filters.endDate) params.set('end_date', filters.endDate);

  return `${endpoints.projectManagements.projectOverview}?${params.toString()}`;
}

function ProjectOverviewCard({ project, cadence }) {
  const theme = useTheme();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const planCount = Array.isArray(project.plans) ? project.plans.length : 0;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        borderColor: alpha(theme.palette.primary.main, 0.16),
        overflow: 'hidden',
      }}
    >
      <Box
        onClick={() => setExpanded((prev) => !prev)}
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          cursor: 'pointer',
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <IconButton size="small">
            <Iconify
              icon={expanded ? 'solar:alt-arrow-down-bold' : 'solar:alt-arrow-right-bold'}
              width={18}
            />
          </IconButton>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={800} noWrap>
              {project.title || 'Untitled project'}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              {project.code ? (
                <Typography variant="caption" color="text.secondary">
                  {project.code}
                </Typography>
              ) : null}
              <Chip size="small" label={project.status || 'Draft'} variant="outlined" />
              <Typography variant="caption" color="text.secondary">
                {planCount} plan step{planCount === 1 ? '' : 's'}
              </Typography>
            </Stack>
          </Box>
        </Stack>
        <Button
          size="small"
          variant="outlined"
          onClick={(event) => {
            event.stopPropagation();
            router.push(paths.dashboard.projectManagements.projects.detail(project.id));
          }}
        >
          Open project
        </Button>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ pt: 2 }}>
          <ProjectPlanRoadmapBoard
            project={project}
            cadence={cadence}
            onPlanClick={() =>
              router.push(paths.dashboard.projectManagements.projects.detail(project.id))
            }
          />
        </CardContent>
      </Collapse>
    </Card>
  );
}

export default function ProjectOverview() {
  const theme = useTheme();
  const [cadence, setCadence] = useState('weekly');
  const [filters, setFilters] = useState({
    project: '',
    startDate: '',
    endDate: '',
    page: 1,
    pageSize: 20,
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const overviewUrl = useMemo(() => buildOverviewUrl(appliedFilters), [appliedFilters]);
  const { data, loading, error } = useGetRequest(overviewUrl);
  const { data: projectsData } = useGetRequest(endpoints.projectManagements.projectOptions);

  const projectOptions = useMemo(() => {
    const rows = Array.isArray(projectsData) ? projectsData : projectsData?.results || [];
    return rows.map((item) => ({
      id: item.id,
      title: item.title || item.code || `Project ${item.id}`,
    }));
  }, [projectsData]);

  const projects = Array.isArray(data) ? data : data?.results || [];
  const totalCount = data?.count ?? projects.length;
  const totalPages = data?.total_pages || 1;
  const currentPage = data?.current_page || appliedFilters.page;

  const updateFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
  };

  const applyFilters = () => {
    setAppliedFilters({ ...filters, page: 1 });
  };

  const clearFilters = () => {
    const next = {
      project: '',
      startDate: '',
      endDate: '',
      page: 1,
      pageSize: 20,
    };
    setFilters(next);
    setAppliedFilters(next);
  };

  const goToPage = (page) => {
    setAppliedFilters((prev) => ({ ...prev, page }));
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h4">Project Overview</Typography>
        <Typography variant="body2" color="text.secondary">
          Project Plan Roadmap view across projects with daily, weekly, monthly, and yearly
          timelines
        </Typography>
      </Stack>

      <Card sx={{ mb: 2.5, borderRadius: 3 }}>
        <CardContent>
          <Grid container spacing={1.5} alignItems="center">
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                size="small"
                label="Project"
                fullWidth
                value={filters.project}
                onChange={(event) => updateFilter('project', event.target.value)}
              >
                <MenuItem value="">All Projects</MenuItem>
                {projectOptions.map((project) => (
                  <MenuItem key={project.id} value={String(project.id)}>
                    {project.title}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                size="small"
                label="Start Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.startDate}
                onChange={(event) => updateFilter('startDate', event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                size="small"
                label="End Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.endDate}
                onChange={(event) => updateFilter('endDate', event.target.value)}
                inputProps={{ min: filters.startDate || undefined }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Stack direction="row" spacing={1} justifyContent={{ xs: 'stretch', md: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={applyFilters}
                  sx={{ flex: { xs: 1, md: 'none' } }}
                >
                  Apply
                </Button>
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  sx={{ flex: { xs: 1, md: 'none' } }}
                >
                  Clear
                </Button>
              </Stack>
            </Grid>
          </Grid>

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={1.5}
            sx={{ mt: 2 }}
          >
            <Tabs
              value={cadence}
              onChange={(_, value) => setCadence(value)}
              variant="scrollable"
              allowScrollButtonsMobile
              sx={{
                minHeight: 40,
                '& .MuiTabs-indicator': { display: 'none' },
                '& .MuiTabs-flexContainer': { gap: 1 },
                '& .MuiTab-root': {
                  minHeight: 36,
                  px: 1.5,
                  borderRadius: 999,
                  textTransform: 'capitalize',
                  fontWeight: 700,
                  color: theme.palette.text.secondary,
                },
                '& .MuiTab-root.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                },
              }}
            >
              {ASSIGNEE_TIME_TABS.map((tab) => (
                <Tab key={tab} value={tab} label={tab} />
              ))}
            </Tabs>

            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              {ITERATION_COLORS.map((color, index) => (
                <Stack key={color} direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ width: 14, height: 14, borderRadius: 0.75, bgcolor: color }} />
                  <Typography variant="caption" color="text.secondary">
                    Iteration {index + 1}
                  </Typography>
                </Stack>
              ))}
              <Chip size="small" color="error" variant="outlined" label="Blocked / Overdue" />
              <Chip size="small" color="warning" variant="outlined" label="At Risk" />
              <Chip size="small" color="success" variant="outlined" label="On Track" />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      ) : null}

      {!loading && error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load project overview. Please try again.
        </Alert>
      ) : null}

      {!loading && !error ? (
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            Showing {projects.length} of {totalCount} project{totalCount === 1 ? '' : 's'} ·{' '}
            {cadence} view
          </Typography>

          {projects.length ? (
            projects.map((project) => (
              <ProjectOverviewCard key={project.id} project={project} cadence={cadence} />
            ))
          ) : (
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  No projects match the selected filters.
                </Typography>
              </CardContent>
            </Card>
          )}

          {totalPages > 1 ? (
            <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
              <Button
                size="small"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                Previous
              </Button>
              <Typography variant="caption">
                Page {currentPage} / {totalPages}
              </Typography>
              <Button
                size="small"
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(currentPage + 1)}
              >
                Next
              </Button>
            </Stack>
          ) : null}
        </Stack>
      ) : null}
    </Box>
  );
}
