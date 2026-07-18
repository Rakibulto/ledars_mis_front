'use client';

import dayjs from 'dayjs';
import { Fragment, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import { useGetRequest } from 'src/actions/ledars-hook';

import { endpoints } from 'src/utils/axios';

const PERIOD_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'daily', label: 'Daily' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const ROW_STATUS_STYLES = {
  completed: { bg: '#dcfce7', border: '#86efac' },
  overdue: { bg: '#fee2e2', border: '#fca5a5' },
  pending: { bg: '#fef9c3', border: '#fde047' },
};

const COLUMNS = [
  { key: 'expand', label: '', width: 48 },
  { key: 'si', label: 'Si No', width: 90 },
  { key: 'name', label: 'Name of Activities', width: 'auto' },
  { key: 'unit', label: 'Unit', width: 110 },
  { key: 'completion', label: 'Completion Date', width: 140 },
  { key: 'assigned', label: 'Assigned to', width: 160 },
  { key: 'deliverable', label: 'Deliverables Date', width: 150 },
  { key: 'remarks', label: 'Remarks', width: 140 },
];

function formatDate(value) {
  if (!value) return '';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD MMM YYYY') : '';
}

function formatAssignees(users) {
  if (!Array.isArray(users) || !users.length) return '';
  return users.map((user) => user.username || user.name || 'User').join(', ');
}

function buildOverviewUrl(filters) {
  const params = new URLSearchParams();
  params.set('pagination', 'true');
  params.set('page_size', String(filters.pageSize || 20));
  params.set('page', String(filters.page || 1));

  if (filters.project) params.set('project', String(filters.project));
  if (filters.startDate) params.set('start_date', filters.startDate);
  if (filters.endDate) params.set('end_date', filters.endDate);
  if (filters.period) params.set('period', filters.period);

  return `${endpoints.projectManagements.projectOverview}?${params.toString()}`;
}

function cellSx(theme, options = {}) {
  return {
    border: `1px solid ${theme.palette.divider}`,
    px: 1.25,
    py: 1,
    verticalAlign: 'middle',
    fontSize: 13,
    ...options,
  };
}

function ActivityTable({ projectId, plans }) {
  const theme = useTheme();
  const router = useRouter();
  const [expandedMains, setExpandedMains] = useState({});

  const toggleMain = (planId) => {
    setExpandedMains((prev) => ({ ...prev, [planId]: !prev[planId] }));
  };

  const openTaskCompletion = (plan) => {
    const taskId = plan?.id || plan?.serial_no;
    if (!projectId || !taskId) return;
    router.push(paths.dashboard.projectManagements.taskManagement.assignment(projectId, taskId));
  };

  if (!plans?.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, px: 1.5 }}>
        No activities found for the selected filters.
      </Typography>
    );
  }

  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table
        size="small"
        sx={{
          tableLayout: 'fixed',
          width: '100%',
          minWidth: 960,
          borderCollapse: 'collapse',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <colgroup>
          {COLUMNS.map((column) => (
            <col
              key={column.key}
              style={
                column.width === 'auto'
                  ? undefined
                  : { width: typeof column.width === 'number' ? `${column.width}px` : column.width }
              }
            />
          ))}
        </colgroup>
        <TableHead>
          <TableRow>
            {COLUMNS.map((column) => (
              <TableCell
                key={column.key}
                sx={cellSx(theme, {
                  fontWeight: 800,
                  bgcolor: alpha(theme.palette.grey[500], 0.08),
                  whiteSpace: 'nowrap',
                })}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {plans.map((plan) => {
            const planId = plan.id;
            const isExpanded = Boolean(expandedMains[planId]);
            const subPlans = Array.isArray(plan.sub_plans) ? plan.sub_plans : [];

            return (
              <Fragment key={`main-group-${planId}`}>
                <TableRow
                  hover
                  onClick={() => openTaskCompletion(plan)}
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.03),
                    cursor: 'pointer',
                  }}
                >
                  <TableCell sx={cellSx(theme, { textAlign: 'center' })}>
                    {subPlans.length ? (
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleMain(planId);
                        }}
                      >
                        <Iconify
                          icon={
                            isExpanded
                              ? 'solar:alt-arrow-down-bold'
                              : 'solar:alt-arrow-right-bold'
                          }
                          width={16}
                        />
                      </IconButton>
                    ) : null}
                  </TableCell>
                  <TableCell sx={cellSx(theme)}>{plan.serial_code || plan.serial_no || ''}</TableCell>
                  <TableCell sx={cellSx(theme)}>
                    <Typography variant="body2" fontWeight={700} noWrap title={plan.title || ''}>
                      {plan.title || 'Untitled activity'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={cellSx(theme)} />
                  <TableCell sx={cellSx(theme)} />
                  <TableCell sx={cellSx(theme)} />
                  <TableCell sx={cellSx(theme)} />
                  <TableCell sx={cellSx(theme)} />
                </TableRow>

                {subPlans.map((sub) => {
                  const tone = ROW_STATUS_STYLES[sub.row_status] || ROW_STATUS_STYLES.pending;
                  return (
                    <TableRow
                      key={`sub-${sub.id}`}
                      hover
                      onClick={() => openTaskCompletion(plan)}
                      sx={{
                        display: isExpanded ? 'table-row' : 'none',
                        bgcolor: tone.bg,
                        cursor: 'pointer',
                      }}
                    >
                      <TableCell sx={cellSx(theme, { borderColor: tone.border })} />
                      <TableCell sx={cellSx(theme, { borderColor: tone.border, pl: 2.5 })}>
                        {sub.serial_code || ''}
                      </TableCell>
                      <TableCell sx={cellSx(theme, { borderColor: tone.border })}>
                        <Typography variant="body2" noWrap title={sub.title || ''}>
                          {sub.title || ''}
                        </Typography>
                      </TableCell>
                      <TableCell sx={cellSx(theme, { borderColor: tone.border })}>
                        {sub.unit_no != null && sub.unit_no !== '' ? sub.unit_no : ''}
                      </TableCell>
                      <TableCell sx={cellSx(theme, { borderColor: tone.border })}>
                        {sub.row_status === 'completed' ? formatDate(sub.end_date) : ''}
                      </TableCell>
                      <TableCell sx={cellSx(theme, { borderColor: tone.border })}>
                        <Typography variant="body2" noWrap title={formatAssignees(sub.assigned_users)}>
                          {formatAssignees(sub.assigned_users)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={cellSx(theme, { borderColor: tone.border })}>
                        {formatDate(sub.deliverable_date || sub.end_date)}
                      </TableCell>
                      <TableCell sx={cellSx(theme, { borderColor: tone.border })} />
                    </TableRow>
                  );
                })}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function ProjectOverviewCard({ project }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const plans = Array.isArray(project.plans) ? project.plans : [];
  const activityCount = plans.reduce(
    (sum, plan) => sum + 1 + (Array.isArray(plan.sub_plans) ? plan.sub_plans.length : 0),
    0
  );

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2.5,
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
          borderBottom: expanded ? `1px solid ${theme.palette.divider}` : 'none',
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
                {activityCount} activit{activityCount === 1 ? 'y' : 'ies'}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ p: 0 }}>
          <ActivityTable projectId={project.id} plans={plans} />
        </Box>
      </Collapse>
    </Card>
  );
}

export default function ProjectOverview() {
  const [filters, setFilters] = useState({
    project: '',
    startDate: '',
    endDate: '',
    period: '',
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
      period: '',
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
          Collapsible activity tables across projects with deliverable tracking
        </Typography>
      </Stack>

      <Card sx={{ mb: 2.5, borderRadius: 2.5 }}>
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
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                select
                size="small"
                label="Period"
                fullWidth
                value={filters.period}
                onChange={(event) => updateFilter('period', event.target.value)}
              >
                {PERIOD_OPTIONS.map((option) => (
                  <MenuItem key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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

          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
            <Chip size="small" label="Green: Completed" sx={{ bgcolor: '#dcfce7' }} />
            <Chip size="small" label="Yellow: Pending" sx={{ bgcolor: '#fef9c3' }} />
            <Chip size="small" label="Red: Overdue deliverable" sx={{ bgcolor: '#fee2e2' }} />
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
            Showing {projects.length} of {totalCount} project{totalCount === 1 ? '' : 's'}
          </Typography>

          {projects.length ? (
            projects.map((project) => (
              <ProjectOverviewCard key={project.id} project={project} />
            ))
          ) : (
            <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
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
