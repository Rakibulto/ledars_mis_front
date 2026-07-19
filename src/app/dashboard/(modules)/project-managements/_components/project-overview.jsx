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

const SUMMARY_COLUMNS = [
  { key: 'expand', label: '', width: 72 },
  { key: 'projectCode', label: 'Project Code', width: 140 },
  { key: 'si', label: 'Si No', width: 90 },
  { key: 'name', label: 'Name of Activity', width: 'auto' },
  { key: 'unit', label: 'Unit No', width: 110 },
  { key: 'completion', label: 'Completion Date', width: 150 },
  { key: 'deliverable', label: 'Deliverable Date', width: 150 },
  { key: 'assigned', label: 'Assign to', width: 180 },
  { key: 'remarks', label: 'Remarks', width: 160 },
];

const EXPAND_INDENT = {
  project: 0,
  main: 18,
  sub: 36,
};

const SUMMARY_TONES = {
  border: '#9e9e9e',
  header: '#f0f0f0',
  projectWhite: '#ffffff',
  projectGray: '#d6d6d6',
  chip: '#f5f5f5',
  hoverWhite: '#f0f0f0',
  hoverGray: '#c4c4c4',
};

function formatDate(value) {
  if (!value) return '';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD MMM YYYY') : '';
}

function formatAssignees(users) {
  if (!Array.isArray(users) || !users.length) return '';
  return users
    .map((user) => user.designation || user.username || user.name || 'User')
    .join(', ');
}

function formatAssigneeTooltip(users) {
  if (!Array.isArray(users) || !users.length) return '';
  return users
    .map((user) => {
      const name = user.username || user.name || 'User';
      return user.designation ? `${name} (${user.designation})` : name;
    })
    .join(', ');
}

function sumProjectUnitNo(project) {
  return (project?.plans || []).reduce((planSum, plan) => {
    const subTotal = (plan.sub_plans || []).reduce(
      (sum, sub) => sum + Number(sub.unit_no || 0),
      0
    );
    return planSum + subTotal;
  }, 0);
}

function getPlanCompletionDate(plan) {
  const completedDates = (plan.work_items || [])
    .filter((item) => item.state === 'Done' && item.completed_at)
    .map((item) => dayjs(item.completed_at))
    .filter((value) => value.isValid());

  if (completedDates.length) {
    return completedDates
      .reduce((latest, current) => (current.isAfter(latest) ? current : latest))
      .format('YYYY-MM-DD');
  }

  if (plan.status === 'Completed' && plan.end_date) {
    return plan.end_date;
  }

  return '';
}

function getPlanDeliverableDate(plan) {
  const dates = [
    plan.end_date,
    ...(plan.sub_plans || []).map((sub) => sub.end_date || sub.deliverable_date),
  ]
    .filter(Boolean)
    .map((value) => dayjs(value))
    .filter((value) => value.isValid());

  if (!dates.length) return '';

  return dates
    .reduce((latest, current) => (current.isAfter(latest) ? current : latest))
    .format('YYYY-MM-DD');
}

function buildProjectSummaryGroups(projects = []) {
  return projects.map((project) => {
    const projectUnitTotal = sumProjectUnitNo(project);
    const activities = (project.plans || []).map((plan, index) => {
      const mainKey = `${project.id}-${plan.id || plan.serial_no || index}`;
      const subPlans = Array.isArray(plan.sub_plans) ? plan.sub_plans : [];

      return {
        key: mainKey,
        projectId: project.id,
        plan,
        siNo: plan.serial_code || plan.serial_no || index + 1,
        name: plan.title || 'Untitled activity',
        unitNo: subPlans.reduce((sum, sub) => sum + Number(sub.unit_no || 0), 0),
        completionDate: getPlanCompletionDate(plan),
        deliverableDate: getPlanDeliverableDate(plan),
        assignedUsers: plan.assigned_users || [],
        remarks: plan.description || '',
        subActivities: subPlans.map((sub, subIndex) => ({
          key: `${mainKey}-sub-${sub.id || subIndex}`,
          projectId: project.id,
          plan,
          siNo: sub.serial_code || `${plan.serial_code || plan.serial_no || index + 1}.${subIndex + 1}`,
          name: sub.title || 'Untitled sub activity',
          unitNo: Number(sub.unit_no || 0),
          completionDate:
            plan.status === 'Completed' || sub.row_status === 'completed'
              ? sub.end_date || sub.deliverable_date || ''
              : '',
          deliverableDate: sub.deliverable_date || sub.end_date || '',
          assignedUsers: sub.assigned_users || [],
          remarks: '',
        })),
      };
    });

    return {
      key: `project-${project.id}`,
      projectId: project.id,
      projectCode: project.code || `P-${project.id}`,
      projectTitle: project.title || 'Untitled project',
      projectStatus: project.status || 'Draft',
      unitNo: projectUnitTotal,
      activityCount: activities.length,
      activities,
    };
  });
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

function summaryCellSx(options = {}) {
  return {
    border: `1px solid ${SUMMARY_TONES.border} !important`,
    px: 1.25,
    py: 1,
    verticalAlign: 'middle',
    fontSize: 13,
    ...options,
  };
}

function summaryHeaderSx() {
  return summaryCellSx({
    py: 1.1,
    fontWeight: 800,
    whiteSpace: 'nowrap',
    bgcolor: SUMMARY_TONES.header,
    color: 'text.primary',
  });
}

function ExpandArrowCell({ theme, level, expanded, hasChildren, onToggle, cream }) {
  const sx = cream
    ? summaryCellSx({ textAlign: 'left', pl: 0.5 })
    : cellSx(theme, { textAlign: 'left', pl: 0.5 });

  return (
    <TableCell sx={sx}>
      <Box sx={{ pl: `${EXPAND_INDENT[level] || 0}px` }}>
        {hasChildren ? (
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onToggle?.();
            }}
          >
            <Iconify
              icon={expanded ? 'solar:alt-arrow-down-bold' : 'solar:alt-arrow-right-bold'}
              width={16}
            />
          </IconButton>
        ) : (
          <Box sx={{ width: 30, height: 30 }} />
        )}
      </Box>
    </TableCell>
  );
}

function ActivitySummaryTable({ projects }) {
  const theme = useTheme();
  const router = useRouter();
  const groups = useMemo(() => buildProjectSummaryGroups(projects), [projects]);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [expandedMains, setExpandedMains] = useState({});

  const toggleProject = (projectId) => {
    setExpandedProjects((prev) => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const toggleMain = (mainKey) => {
    setExpandedMains((prev) => ({ ...prev, [mainKey]: !prev[mainKey] }));
  };

  const openTaskCompletion = (projectId, plan) => {
    const taskId = plan?.id || plan?.serial_no;
    if (!projectId || !taskId) return;
    router.push(paths.dashboard.projectManagements.taskManagement.assignment(projectId, taskId));
  };

  if (!groups.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, px: 0.5 }}>
        No projects found for the selected filters.
      </Typography>
    );
  }

  return (
    <TableContainer
      sx={{
        border: `1px solid ${SUMMARY_TONES.border}`,
        borderRadius: 1,
        overflowX: 'auto',
        bgcolor: SUMMARY_TONES.projectWhite,
      }}
    >
      <Table
        size="small"
        sx={{
          tableLayout: 'fixed',
          width: '100%',
          minWidth: 1100,
          borderCollapse: 'collapse',
          border: `1px solid ${SUMMARY_TONES.border}`,
          '& .MuiTableCell-root': {
            border: `1px solid ${SUMMARY_TONES.border} !important`,
          },
        }}
      >
        <colgroup>
          {SUMMARY_COLUMNS.map((column) => (
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
            {SUMMARY_COLUMNS.map((column) => (
              <TableCell key={column.key} sx={summaryHeaderSx()}>
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {groups.map((group, groupIndex) => {
            const isProjectExpanded = Boolean(expandedProjects[group.projectId]);
            const isGrayProject = groupIndex % 2 === 1;
            const projectBg = isGrayProject
              ? SUMMARY_TONES.projectGray
              : SUMMARY_TONES.projectWhite;
            const projectHover = isGrayProject
              ? SUMMARY_TONES.hoverGray
              : SUMMARY_TONES.hoverWhite;

            return (
              <Fragment key={group.key}>
                <TableRow
                  hover
                  onClick={() => toggleProject(group.projectId)}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: projectBg,
                    '&:hover': { bgcolor: projectHover },
                  }}
                >
                  <ExpandArrowCell
                    theme={theme}
                    cream
                    level="project"
                    expanded={isProjectExpanded}
                    hasChildren={group.activities.length > 0}
                    onToggle={() => toggleProject(group.projectId)}
                  />
                  <TableCell sx={summaryCellSx()}>
                    <Chip
                      size="small"
                      label={group.projectCode}
                      sx={{
                        fontWeight: 800,
                        color: '#111111',
                        bgcolor: '#e8e8e8',
                        border: `1px solid ${SUMMARY_TONES.border}`,
                        '& .MuiChip-label': { color: '#111111', px: 1 },
                      }}
                    />
                  </TableCell>
                  <TableCell sx={summaryCellSx()} />
                  <TableCell sx={summaryCellSx()}>
                    <Stack spacing={0.25}>
                      <Typography variant="body2" fontWeight={800} noWrap title={group.projectTitle}>
                        {group.projectTitle}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {group.activityCount} activit{group.activityCount === 1 ? 'y' : 'ies'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={summaryCellSx()}>{group.unitNo || 0}</TableCell>
                  <TableCell sx={summaryCellSx()} />
                  <TableCell sx={summaryCellSx()} />
                  <TableCell sx={summaryCellSx()}>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={group.projectStatus}
                      sx={{ borderColor: SUMMARY_TONES.border, bgcolor: SUMMARY_TONES.chip }}
                    />
                  </TableCell>
                  <TableCell sx={summaryCellSx()} />
                </TableRow>

                {group.activities.map((row) => {
                  const isMainExpanded = Boolean(expandedMains[row.key]);
                  const hasSubs = row.subActivities.length > 0;

                  return (
                    <Fragment key={row.key}>
                      <TableRow
                        hover
                        onClick={() => openTaskCompletion(row.projectId, row.plan)}
                        sx={{
                          display: isProjectExpanded ? 'table-row' : 'none',
                          cursor: 'pointer',
                          bgcolor: projectBg,
                          '&:hover': { bgcolor: projectHover },
                        }}
                      >
                        <ExpandArrowCell
                          theme={theme}
                          cream
                          level="main"
                          expanded={isMainExpanded}
                          hasChildren={hasSubs}
                          onToggle={() => toggleMain(row.key)}
                        />
                        <TableCell sx={summaryCellSx()}>
                          <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>
                            {group.projectCode}
                          </Typography>
                        </TableCell>
                        <TableCell sx={summaryCellSx()}>
                          <Typography variant="body2" fontWeight={700}>
                            {row.siNo}
                          </Typography>
                        </TableCell>
                        <TableCell sx={summaryCellSx()}>
                          <Typography variant="body2" fontWeight={700} noWrap title={row.name}>
                            {row.name}
                          </Typography>
                        </TableCell>
                        <TableCell sx={summaryCellSx()}>{row.unitNo || 0}</TableCell>
                        <TableCell sx={summaryCellSx()}>
                          {formatDate(row.completionDate)}
                        </TableCell>
                        <TableCell sx={summaryCellSx()}>
                          {formatDate(row.deliverableDate)}
                        </TableCell>
                        <TableCell sx={summaryCellSx()}>
                          <Typography
                            variant="body2"
                            noWrap
                            title={formatAssigneeTooltip(row.assignedUsers)}
                          >
                            {formatAssignees(row.assignedUsers) || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={summaryCellSx()}>
                          <Typography variant="body2" noWrap title={row.remarks}>
                            {row.remarks || '—'}
                          </Typography>
                        </TableCell>
                      </TableRow>

                      {row.subActivities.map((sub) => (
                        <TableRow
                          key={sub.key}
                          hover
                          onClick={() => openTaskCompletion(sub.projectId, sub.plan)}
                          sx={{
                            display: isProjectExpanded && isMainExpanded ? 'table-row' : 'none',
                            cursor: 'pointer',
                            bgcolor: projectBg,
                            '&:hover': { bgcolor: projectHover },
                          }}
                        >
                          <ExpandArrowCell
                            theme={theme}
                            cream
                            level="sub"
                            expanded={false}
                            hasChildren={false}
                          />
                          <TableCell sx={summaryCellSx()}>
                            <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>
                              {group.projectCode}
                            </Typography>
                          </TableCell>
                          <TableCell sx={summaryCellSx()}>
                            <Typography variant="body2">{sub.siNo}</Typography>
                          </TableCell>
                          <TableCell sx={summaryCellSx()}>
                            <Typography variant="body2" noWrap title={sub.name} sx={{ pl: 1 }}>
                              {sub.name}
                            </Typography>
                          </TableCell>
                          <TableCell sx={summaryCellSx()}>{sub.unitNo || 0}</TableCell>
                          <TableCell sx={summaryCellSx()}>
                            {formatDate(sub.completionDate)}
                          </TableCell>
                          <TableCell sx={summaryCellSx()}>
                            {formatDate(sub.deliverableDate)}
                          </TableCell>
                          <TableCell sx={summaryCellSx()}>
                            <Typography
                              variant="body2"
                              noWrap
                              title={formatAssigneeTooltip(sub.assignedUsers)}
                            >
                              {formatAssignees(sub.assignedUsers) || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={summaryCellSx()}>
                            <Typography variant="body2" noWrap>
                              {sub.remarks || '—'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </Fragment>
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
                        <Typography
                          variant="body2"
                          noWrap
                          title={formatAssigneeTooltip(sub.assigned_users)}
                        >
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
        <Stack spacing={1.5} sx={{ mb: 2.5 }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Activity Summary
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Project, main, and sub activities with unit totals and deliverable tracking
            </Typography>
          </Box>
          <ActivitySummaryTable projects={projects} />
        </Stack>
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
