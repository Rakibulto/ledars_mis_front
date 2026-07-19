'use client';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useRef, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import CardContent from '@mui/material/CardContent';
import { alpha, useTheme } from '@mui/material/styles';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import {
  normalizeAssignedUsers,
  normalizePlanWorkItems,
  updateProjectManagementPlan,
  useProjectManagementProject,
  approveProjectManagementWorkItem,
  exportProjectManagementRoadmapExcel,
} from './use-project-managements-api';
import { ProjectActionPlanPanel } from './project-action-plan-panel';
import { ProjectExpenditurePanel } from './project-expenditure-panel';

const ITERATION_COLORS = ['#ff9f43', '#ff3d71', '#6c2bd9'];
const ASSIGNEE_TIME_TABS = ['daily', 'weekly', 'monthly', 'yearly'];
const ROADMAP_SECTION_TABS = [
  { value: 'roadmap', label: 'Roadmap' },
  { value: 'expenditure', label: 'Project Expenditure' },
  { value: 'action-plan', label: 'Action Plan' },
];
const PLAN_STATUS_OPTIONS = ['Pending', 'In Progress', 'On Hold', 'Completed'];

function formatDate(value, fallback = '—') {
  if (!value) return fallback;

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD MMM YYYY') : fallback;
}

function formatDateRange(startValue, endValue, fallback = '—') {
  if (!startValue && !endValue) return fallback;

  const start = dayjs(startValue);
  const end = dayjs(endValue || startValue);

  if (!start.isValid()) return fallback;
  if (!end.isValid() || end.isSame(start, 'day')) return start.format('DD MMM YYYY');

  return `${start.format('DD MMM YYYY')} → ${end.format('DD MMM YYYY')}`;
}

function getEntrySignature(slot) {
  if (!slot?.entries?.length) return '';

  return slot.entries
    .map((entry) => String(entry.id || entry.key || `${entry.planId}-${entry.title}`))
    .sort()
    .join('|');
}

function getContiguousEntrySpan(slots, startIndex) {
  const signature = getEntrySignature(slots?.[startIndex]);

  if (!signature) return 0;

  let span = 1;

  while (getEntrySignature(slots?.[startIndex + span]) === signature) {
    span += 1;
  }

  return span;
}

function getStatusTone(status) {
  if (status === 'Completed') return 'success';
  if (status === 'Active') return 'primary';
  if (status === 'In Progress') return 'primary';
  if (status === 'Planning') return 'warning';
  if (status === 'Pending') return 'default';
  if (status === 'On Hold') return 'warning';
  return 'default';
}

function getProgressTone(progress) {
  if (progress >= 80) return 'success';
  if (progress >= 40) return 'primary';
  return 'warning';
}

function getRoadmapStatusLabel(status) {
  if (status === 'Completed') return 'Done';
  if (status === 'In Progress' || status === 'Active') return 'Working';
  if (status === 'On Hold') return 'Blocked';
  return 'Pending';
}

function getTimelineRange(project) {
  const planDates = (project.plans || []).flatMap((plan) => {
    const assignedUsers = normalizeAssignedUsers(plan.assigned_users);
    const workItemDates = normalizePlanWorkItems(plan.work_items, plan, assignedUsers).flatMap(
      (item, index) => {
        const scheduledDate = item.scheduled_date || getDefaultWorkItemDate(plan, index);
        const scheduledEndDate = item.scheduled_end_date || null;
        const completedDate = item.completed_at
          ? dayjs(item.completed_at).format('YYYY-MM-DD')
          : null;

        return [scheduledDate, scheduledEndDate, completedDate].filter(Boolean);
      }
    );

    return [plan.start_date, plan.end_date, ...workItemDates].filter(Boolean);
  });
  const candidates = [project.start_date, project.end_date, ...planDates]
    .filter(Boolean)
    .map((value) => dayjs(value));

  const validDates = candidates.filter((value) => value.isValid());

  if (!validDates.length) {
    const today = dayjs();
    return {
      start: today.startOf('month'),
      end: today.add(2, 'month').endOf('month'),
    };
  }

  const start = validDates.reduce(
    (min, current) => (current.isBefore(min) ? current : min),
    validDates[0]
  );
  const end = validDates.reduce(
    (max, current) => (current.isAfter(max) ? current : max),
    validDates[0]
  );

  return { start, end };
}

function getCadenceUnit(cadence) {
  if (cadence === 'daily') return 'day';
  if (cadence === 'monthly') return 'month';
  if (cadence === 'yearly') return 'year';
  return 'week';
}

function getSlotStart(dateValue, cadence) {
  return dateValue.startOf(getCadenceUnit(cadence));
}

function getSlotEnd(dateValue, cadence) {
  return dateValue.endOf(getCadenceUnit(cadence));
}

function getSlotLabel(dateValue, cadence) {
  if (cadence === 'daily') return dateValue.format('DD');
  if (cadence === 'monthly') return dateValue.format('MMM');
  if (cadence === 'yearly') return dateValue.format('YYYY');
  return dateValue.format('DD');
}

function getSecondGroupKey(dateValue, cadence) {
  if (cadence === 'yearly') return dateValue.format('YYYY');
  if (cadence === 'monthly') return dateValue.format('YYYY-MM');
  return dateValue.format('YYYY-MM');
}

function getSecondGroupLabel(dateValue, cadence) {
  if (cadence === 'yearly') return dateValue.format('YYYY');
  if (cadence === 'monthly') return dateValue.format('MMM');
  return dateValue.format('MMMM');
}

function getTopGroupKey(dateValue, cadence) {
  if (cadence === 'yearly') return 'timeline';
  if (cadence === 'monthly') return dateValue.format('YYYY');
  return `${dateValue.year()}-${Math.floor(dateValue.month() / 3) + 1}`;
}

function getTopGroupLabel(dateValue, cadence) {
  if (cadence === 'yearly') return 'Timeline';
  if (cadence === 'monthly') return dateValue.format('YYYY');
  return `Q${Math.floor(dateValue.month() / 3) + 1} ${dateValue.format('YYYY')}`;
}

function getScaleLabel(cadence) {
  if (cadence === 'daily') return 'Day';
  if (cadence === 'monthly') return 'Month';
  if (cadence === 'yearly') return 'Year';
  return 'Week';
}

function buildTimeline(project, cadence = 'weekly') {
  const { start, end } = getTimelineRange(project);
  const slots = [];
  let cursor = getSlotStart(start, cadence);
  const lastDate = getSlotEnd(end, cadence);

  while (cursor.isBefore(lastDate) || cursor.isSame(lastDate, 'day')) {
    slots.push({
      key: cursor.format('YYYY-MM-DD'),
      start: getSlotStart(cursor, cadence),
      end: getSlotEnd(cursor, cadence),
      label: getSlotLabel(cursor, cadence),
      monthKey: getSecondGroupKey(cursor, cadence),
      monthLabel: getSecondGroupLabel(cursor, cadence),
      quarterKey: getTopGroupKey(cursor, cadence),
      quarterLabel: getTopGroupLabel(cursor, cadence),
    });
    cursor = cursor.add(1, getCadenceUnit(cadence));
  }

  const monthGroups = [];
  slots.forEach((slot) => {
    const lastGroup = monthGroups[monthGroups.length - 1];
    if (lastGroup && lastGroup.key === slot.monthKey) {
      lastGroup.span += 1;
    } else {
      monthGroups.push({ key: slot.monthKey, label: slot.monthLabel, span: 1 });
    }
  });

  const quarterGroups = [];
  slots.forEach((slot) => {
    const lastGroup = quarterGroups[quarterGroups.length - 1];
    if (lastGroup && lastGroup.key === slot.quarterKey) {
      lastGroup.span += 1;
    } else {
      quarterGroups.push({ key: slot.quarterKey, label: slot.quarterLabel, span: 1 });
    }
  });

  const rows = (project.plans || []).map((plan, index) => {
    const normalizedUsers = normalizeAssignedUsers(plan.assigned_users).map((user) => ({
      ...user,
      id: user.id || user.username || `user-${index}`,
    }));

    const planStart = dayjs(plan.start_date || project.start_date || start);
    const planEnd = dayjs(plan.end_date || plan.start_date || project.end_date || end);

    const safeStart = planStart.isValid() ? planStart.startOf('day') : start;
    const safeEnd = planEnd.isValid() ? planEnd.endOf('day') : getSlotEnd(safeStart, cadence);

    let startIndex = slots.findIndex((slot) => {
      const slotStart = slot.start.startOf('day');
      const slotEnd = slot.end.endOf('day');
      return (
        safeStart.isBefore(slotEnd.add(1, 'millisecond')) &&
        safeEnd.isAfter(slotStart.subtract(1, 'millisecond'))
      );
    });

    let endIndex = slots.findIndex((slot) => {
      const slotStart = slot.start.startOf('day');
      const slotEnd = slot.end.endOf('day');
      return (
        safeEnd.isBefore(slotEnd.add(1, 'millisecond')) &&
        safeEnd.isAfter(slotStart.subtract(1, 'millisecond'))
      );
    });

    if (startIndex < 0) startIndex = 0;
    if (endIndex < 0) endIndex = slots.length - 1;
    if (endIndex < startIndex) endIndex = startIndex;

    return {
      ...plan,
      color: ITERATION_COLORS[index % ITERATION_COLORS.length],
      startIndex,
      endIndex,
      span: endIndex - startIndex + 1,
      assignedUsers: normalizedUsers,
      assignedUsersText: normalizedUsers.length
        ? normalizedUsers.map((user) => user.username).join(', ')
        : 'Unassigned',
    };
  });

  return { weeks: slots, monthGroups, quarterGroups, rows, scaleLabel: getScaleLabel(cadence) };
}

function fCurrency(value) {
  return `৳${Number(value || 0).toLocaleString()}`;
}

function formatProjectCurrency(value, currency = 'BDT') {
  return `${currency} ${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function renderValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  return value;
}

function formatDetailError(error) {
  if (!error) return 'Unable to load the selected project.';
  if (typeof error === 'string') return error;
  if (error.detail) return String(error.detail);
  return 'Unable to load the selected project.';
}

function DetailItem({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
        {renderValue(value)}
      </Typography>
    </Box>
  );
}

function MetricCard({ label, value, helper, accent }) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderRadius: 3,
        borderColor: alpha(accent, 0.25),
        background: `linear-gradient(180deg, ${alpha(accent, 0.12)} 0%, rgba(255,255,255,0.96) 100%)`,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
          {renderValue(value)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {helper}
        </Typography>
      </CardContent>
    </Card>
  );
}

function getProgressSummaryText(user) {
  if (!user.totalPlans) return 'No assigned steps';
  if (user.inProgress) return `${user.inProgress} active • ${user.pending} queued`;
  if (user.pending) return `${user.pending} queued`;
  return `${user.completed} completed`;
}

function NarrativeBlock({ title, value }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.25 }}>
          {title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ whiteSpace: 'pre-wrap', minHeight: 72 }}
        >
          {renderValue(value)}
        </Typography>
      </CardContent>
    </Card>
  );
}

function buildAssigneeModules(project, timelineRows) {
  const registry = new Map();

  (project.assigned_users || []).forEach((user) => {
    if (!user?.id) return;

    registry.set(user.id, {
      id: user.id,
      username: user.username || user.name || `User ${user.id}`,
      plans: [],
    });
  });

  timelineRows.forEach((plan) => {
    plan.assignedUsers.forEach((user) => {
      const existing = registry.get(user.id) || {
        id: user.id,
        username: user.username || `User ${user.id}`,
        plans: [],
      };

      existing.username = user.username || existing.username;
      existing.plans.push(plan);
      registry.set(user.id, existing);
    });
  });

  return Array.from(registry.values())
    .map((user) => {
      const totalPlans = user.plans.length;
      const completed = user.plans.filter((plan) => plan.status === 'Completed').length;
      const inProgress = user.plans.filter(
        (plan) => plan.status === 'In Progress' || plan.status === 'Active'
      ).length;
      const pending = user.plans.filter(
        (plan) => !['Completed', 'In Progress', 'Active'].includes(plan.status)
      ).length;
      const progress = totalPlans ? Math.round((completed / totalPlans) * 100) : 0;
      const nextDuePlan =
        user.plans
          .filter((plan) => plan.end_date && plan.status !== 'Completed')
          .sort(
            (left, right) => dayjs(left.end_date).valueOf() - dayjs(right.end_date).valueOf()
          )[0] || null;

      return {
        ...user,
        totalPlans,
        completed,
        inProgress,
        pending,
        progress,
        nextDuePlan,
      };
    })
    .sort((left, right) => {
      if (right.totalPlans !== left.totalPlans) return right.totalPlans - left.totalPlans;
      return left.username.localeCompare(right.username);
    });
}

function getWeekLabel(dateValue) {
  const startOfYear = dateValue.startOf('year');
  const daysSinceStart = dateValue.startOf('day').diff(startOfYear, 'day');
  const weekNumber = Math.floor(daysSinceStart / 7) + 1;

  return `Week ${weekNumber} • ${dateValue.format('MMM YYYY')}`;
}

function getCadenceBucket(plan, cadence) {
  const start = dayjs(plan.start_date || plan.end_date || new Date());
  const end = dayjs(plan.end_date || plan.start_date || new Date());
  const safeStart = start.isValid() ? start : dayjs();
  const safeEnd = end.isValid() ? end : safeStart;

  if (cadence === 'daily') {
    return `${safeStart.format('DD MMM')} → ${safeEnd.format('DD MMM')}`;
  }

  if (cadence === 'weekly') {
    return getWeekLabel(safeStart);
  }

  if (cadence === 'monthly') {
    return safeStart.format('MMMM YYYY');
  }

  return safeStart.format('YYYY');
}

function buildAssigneeCadenceRows(user, cadence) {
  const buckets = new Map();

  user.plans.forEach((plan) => {
    const bucketLabel = getCadenceBucket(plan, cadence);
    const existing = buckets.get(bucketLabel) || {
      label: bucketLabel,
      completed: 0,
      inProgress: 0,
      pending: 0,
      tasks: [],
    };

    if (plan.status === 'Completed') existing.completed += 1;
    else if (plan.status === 'In Progress' || plan.status === 'Active') existing.inProgress += 1;
    else existing.pending += 1;

    existing.tasks.push(plan);
    buckets.set(bucketLabel, existing);
  });

  return Array.from(buckets.values());
}

function getTaskStatusBucket(status) {
  if (status === 'Completed') return 'completed';
  if (status === 'On Hold') return 'blocked';
  if (status === 'In Progress' || status === 'Active') return 'inProgress';
  return 'pending';
}

function summarizeTaskTitles(tasks, limit = 2) {
  if (!tasks.length) return '—';

  const titles = tasks.map((task) => task.title).filter(Boolean);
  const visible = titles.slice(0, limit);
  const remaining = titles.length - visible.length;

  return remaining > 0 ? `${visible.join(', ')} +${remaining} more` : visible.join(', ');
}

function getExecutionGroupTitle(group, fallback = 'Untitled task') {
  const titles = (group?.entries || [])
    .map((entry) => String(entry?.title || '').trim())
    .filter(Boolean);

  if (!titles.length) return fallback;
  if (titles.length === 1) return titles[0];

  return `${titles[0]} +${titles.length - 1}`;
}

function getTaskHealth(plan, projectStatus) {
  const today = dayjs().startOf('day');
  const statusBucket = getTaskStatusBucket(plan.status);
  const endDate = dayjs(plan.end_date || plan.start_date || today).endOf('day');

  if (statusBucket == 'blocked') return 'blocked';
  if (statusBucket !== 'completed' && projectStatus === 'On Hold') return 'blocked';
  if (statusBucket !== 'completed' && endDate.isValid() && endDate.isBefore(today))
    return 'overdue';

  if (statusBucket !== 'completed' && endDate.isValid()) {
    const daysToDue = endDate.diff(today, 'day');
    if (daysToDue >= 0 && daysToDue <= 7) return 'atRisk';
  }

  return 'onTrack';
}

function getSignalLabel(signal) {
  if (signal === 'blocked') return 'Blocked';
  if (signal === 'overdue') return 'Overdue';
  if (signal === 'atRisk') return 'At Risk';
  return 'On Track';
}

function getSlotVisualTone(slot) {
  if (!slot?.total) return 'default';
  if (slot.completed && !slot.inProgress && !slot.pending) return 'success';
  if (slot.inProgress) return 'success';
  if (slot.pending) return 'warning';
  if (slot.signal === 'blocked' || slot.signal === 'overdue') return 'error';
  if (slot.signal === 'atRisk') return 'warning';
  if (slot.completed) return 'success';
  return 'default';
}

function getSlotVisualStyles(slot, theme) {
  const tone = getSlotVisualTone(slot);

  if (tone === 'error') {
    return {
      tone,
      accent: theme.palette.error.main,
      background: alpha(theme.palette.error.main, slot?.signal === 'blocked' ? 0.12 : 0.08),
    };
  }

  if (tone === 'warning') {
    return {
      tone,
      accent: theme.palette.warning.main,
      background: alpha(theme.palette.warning.main, slot?.signal === 'atRisk' ? 0.12 : 0.1),
    };
  }

  if (tone === 'primary') {
    return {
      tone,
      accent: theme.palette.primary.main,
      background: alpha(theme.palette.primary.main, 0.1),
    };
  }

  if (tone === 'success') {
    return {
      tone,
      accent: theme.palette.success.main,
      background: alpha(theme.palette.success.main, 0.05),
    };
  }

  return {
    tone,
    accent: alpha(theme.palette.grey[700], 0.55),
    background: alpha(theme.palette.grey[500], 0.05),
  };
}

function getChecklistTone(state) {
  if (state === 'Done') return 'success';
  if (state === 'Doing') return 'success';
  return 'warning';
}

function getChecklistLabel(state) {
  if (state === 'Done') return 'Done';
  if (state === 'Doing') return 'Doing';
  return 'Todo';
}

function getChecklistChipSx(theme, state) {
  if (state === 'Doing') {
    return {
      bgcolor: alpha(theme.palette.success.main, 0.14),
      color: theme.palette.success.dark,
      border: `1px solid ${alpha(theme.palette.success.main, 0.28)}`,
    };
  }

  return {};
}

function getWorkItemApprovalStatus(item) {
  return item?.approvalStatus || item?.approval_status || 'Pending Approval';
}

function getWorkItemApprovalLabel(item) {
  const approvalStatus = getWorkItemApprovalStatus(item);
  if (approvalStatus === 'Approved') return 'Approved';
  if (item?.state === 'Done') return 'Pending Approval';
  return 'Not Ready';
}

function getWorkItemApprovalTone(item) {
  return getWorkItemApprovalStatus(item) === 'Approved' ? 'success' : 'default';
}

function getDialogActionButtonSx(theme, variant = 'outlined') {
  return {
    minWidth: { xs: '100%', sm: 'auto' },
    px: 1.8,
    py: 0.8,
    borderRadius: 999,
    fontWeight: 800,
    textTransform: 'none',
    whiteSpace: 'nowrap',
    boxShadow:
      variant === 'contained' ? `0 12px 24px ${alpha(theme.palette.primary.main, 0.18)}` : 'none',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow:
        variant === 'contained'
          ? `0 16px 28px ${alpha(theme.palette.primary.main, 0.24)}`
          : `0 10px 22px ${alpha(theme.palette.grey[900], 0.08)}`,
    },
  };
}

function getNextChecklistState(state) {
  if (state === 'Todo') return 'Doing';
  if (state === 'Doing') return 'Done';
  return 'Done';
}

function getDefaultWorkItemDate(plan, index = 0) {
  const baseDate = dayjs(plan?.start_date || plan?.end_date || new Date()).startOf('day');
  return baseDate.isValid() ? baseDate.add(index, 'day').format('YYYY-MM-DD') : '';
}

function getPlanChecklistItems(plan) {
  return Array.isArray(plan?.work_items)
    ? plan.work_items.map((item, index) => ({
        ...item,
        scheduled_date: item.scheduled_date || getDefaultWorkItemDate(plan, index),
        key: item.id || `${plan.id || plan.serial_no || plan.title}-${index}`,
      }))
    : [];
}

function getAssignableUsers(projectUsers = [], plan) {
  const registry = new Map();

  [
    ...normalizeAssignedUsers(projectUsers),
    ...normalizeAssignedUsers(plan?.assignedUsers || plan?.assigned_users),
  ].forEach((user) => {
    if (!user?.id) return;
    registry.set(String(user.id), user);
  });

  return Array.from(registry.values()).sort((left, right) =>
    left.username.localeCompare(right.username)
  );
}

function getPlanBoardItems(plan, projectUsers = []) {
  const items = getPlanChecklistItems(plan);

  return items.map((item, index) => ({
    ...item,
    isCurrent: item.state !== 'Done',
    isLocked: false,
    canAdvance: true,
    sequenceLabel: item.state === 'Done' ? 'Completed' : 'Available',
    sequenceHelper:
      item.state === 'Done' ? 'Marked completed.' : 'This task can be updated anytime.',
    assigned_to: item.assigned_to || getAssignableUsers(projectUsers, plan)[0] || null,
  }));
}

function createEmptyWorkItem(plan, projectUsers = []) {
  const nextIndex = getPlanChecklistItems(plan).length + 1;
  const defaultAssignee = getAssignableUsers(projectUsers, plan)[0] || null;

  return {
    id: null,
    key: `${plan.id || plan.serial_no || plan.title}-draft-${nextIndex}`,
    title: `${plan.title} - Task ${nextIndex}`,
    state: 'Todo',
    notes: '',
    sort_order: nextIndex,
    scheduled_date: getDefaultWorkItemDate(plan, nextIndex - 1),
    assigned_to: defaultAssignee,
  };
}

function getPrimarySlotTask(slot) {
  return slot.inProgressTasks[0] || slot.pendingTasks[0] || slot.completedTasks[0] || null;
}

function getNextWorkItemTitle(plan) {
  const items = getPlanChecklistItems(plan);
  const nextItem = items.find((item) => item.state !== 'Done') || items[items.length - 1] || null;
  return nextItem?.title || null;
}

function getWorkItemCompletedDate(item) {
  if (!item?.completed_at) return null;

  const completedAt = dayjs(item.completed_at);
  return completedAt.isValid() ? completedAt.startOf('day') : null;
}

function buildExecutionEntryKey(planId, item, fallbackIndex = 0) {
  return `${planId || 'plan'}::${item?.id || item?.key || item?.sort_order || fallbackIndex}`;
}

function buildShiftedWorkItemSchedule(plan, projectUsers = []) {
  const normalizedPlan = normalizePlanForDialog(plan);
  const boardItems = getPlanBoardItems(normalizedPlan, projectUsers);
  const planStart = dayjs(
    normalizedPlan.start_date || normalizedPlan.end_date || new Date()
  ).startOf('day');
  const safePlanStart = planStart.isValid() ? planStart : dayjs().startOf('day');

  return boardItems.map((item, index) => {
    const rawPlannedDate = dayjs(item.scheduled_date || safePlanStart.add(index, 'day')).startOf(
      'day'
    );
    const plannedDate = rawPlannedDate.isValid() ? rawPlannedDate : safePlanStart.add(index, 'day');
    const rawPlannedEndDate = dayjs(
      item.scheduled_end_date || item.scheduled_date || plannedDate
    ).startOf('day');
    const plannedEndDate =
      rawPlannedEndDate.isValid() && !rawPlannedEndDate.isBefore(plannedDate)
        ? rawPlannedEndDate
        : plannedDate;
    const completedDate = getWorkItemCompletedDate(item);

    return {
      ...item,
      entryKey: buildExecutionEntryKey(normalizedPlan.id, item, index),
      planId: normalizedPlan.id,
      planTitle: normalizedPlan.title,
      planDescription: normalizedPlan.description,
      planStatus: normalizedPlan.status,
      plan: normalizedPlan,
      plannedDate,
      plannedEndDate,
      completedDate,
      effectiveStartDate: plannedDate,
      effectiveEndDate: plannedEndDate,
      effectiveDate: plannedDate,
    };
  });
}

function getExecutionEntriesForSlot(tasks, slot, projectUsers = [], assigneeId = null) {
  return tasks
    .flatMap((plan) => buildShiftedWorkItemSchedule(plan, projectUsers))
    .filter((entry) => {
      const slotStart = slot.start.startOf('day');
      const slotEnd = slot.end.endOf('day');
      const entryStart = (
        entry.effectiveStartDate ||
        entry.plannedDate ||
        entry.effectiveDate
      ).startOf('day');
      const entryEnd = (
        entry.effectiveEndDate ||
        entry.plannedEndDate ||
        entry.effectiveDate ||
        entry.plannedDate
      ).endOf('day');
      const isInsideSlot = !entryEnd.isBefore(slotStart) && !entryStart.isAfter(slotEnd);

      if (!isInsideSlot) return false;
      if (!assigneeId) return true;

      return String(entry.assigned_to?.id || '') === String(assigneeId);
    });
}

function getUniquePlans(entries) {
  const registry = new Map();

  entries.forEach((entry) => {
    if (!entry.planId || registry.has(String(entry.planId))) return;
    registry.set(String(entry.planId), entry.plan);
  });

  return Array.from(registry.values());
}

function buildEntrySummary(entries, projectStatus, fallbackStart, fallbackEnd, metadata = {}) {
  const groupedTasks = getUniquePlans(entries);
  const completedEntries = entries.filter((entry) => entry.state === 'Done');
  const inProgressEntries = entries.filter((entry) => entry.state === 'Doing');
  const pendingEntries = entries.filter((entry) => entry.state === 'Todo');
  const completedTasks = getUniquePlans(completedEntries);
  const inProgressTasks = getUniquePlans(inProgressEntries);
  const pendingTasks = getUniquePlans(pendingEntries);
  const blockedTasks = groupedTasks.filter(
    (task) => getTaskHealth(task, projectStatus) === 'blocked'
  );
  const overdueTasks = groupedTasks.filter(
    (task) => getTaskHealth(task, projectStatus) === 'overdue'
  );
  const atRiskTasks = groupedTasks.filter(
    (task) => getTaskHealth(task, projectStatus) === 'atRisk'
  );
  const signal = blockedTasks.length
    ? 'blocked'
    : overdueTasks.length
      ? 'overdue'
      : atRiskTasks.length
        ? 'atRisk'
        : 'onTrack';
  const rangeStart = entries.length
    ? entries.reduce(
        (min, entry) => ((entry.plannedDate || min).isBefore(min) ? entry.plannedDate : min),
        entries[0].plannedDate
      )
    : fallbackStart;
  const rangeEnd = entries.length
    ? entries.reduce(
        (max, entry) =>
          (entry.plannedEndDate || entry.plannedDate || max).isAfter(max)
            ? entry.plannedEndDate || entry.plannedDate
            : max,
        entries[0].plannedEndDate || entries[0].plannedDate
      )
    : fallbackEnd;

  return {
    ...metadata,
    rangeLabel: formatDateRange(rangeStart, rangeEnd),
    start: fallbackStart,
    end: fallbackEnd,
    total: entries.length,
    tasks: groupedTasks,
    entries,
    completed: completedEntries.length,
    inProgress: inProgressEntries.length,
    pending: pendingEntries.length,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    blockedTasks,
    overdueTasks,
    atRiskTasks,
    signal,
    signalLabel: getSignalLabel(signal),
  };
}

function buildPlanWorkItemPayload(plan, workItems) {
  return {
    status: plan.status,
    work_items: workItems.map((item, index) => ({
      ...(item.id ? { id: item.id } : {}),
      title: item.title,
      state: item.state,
      notes: item.notes || '',
      sort_order: item.sort_order || index + 1,
      scheduled_date: item.scheduled_date || getDefaultWorkItemDate(plan, index),
      scheduled_end_date: item.scheduled_end_date || null,
      assigned_to_id: item.assigned_to?.id || null,
    })),
  };
}

function normalizePlanForDialog(plan) {
  const assignedUsers = normalizeAssignedUsers(plan.assignedUsers || plan.assigned_users);

  return {
    ...plan,
    assignedUsers,
    work_items: normalizePlanWorkItems(plan.work_items, plan, assignedUsers),
    isDirty: Boolean(plan.isDirty),
  };
}

function summarizeTasksForSlot(tasks, projectStatus, slot, projectUsers = [], assigneeId = null) {
  const entries = getExecutionEntriesForSlot(tasks, slot, projectUsers, assigneeId);
  return buildEntrySummary(entries, projectStatus, slot.start, slot.end, {
    key: slot.key,
    label: slot.label,
    start: slot.start,
    end: slot.end,
  });
}

function summarizeTasksForEntryKeys(
  tasks,
  projectStatus,
  slot,
  projectUsers = [],
  assigneeId = null,
  entryKeys = []
) {
  const summary = summarizeTasksForSlot(tasks, projectStatus, slot, projectUsers, assigneeId);

  if (!entryKeys.length) {
    return {
      ...summary,
      entryKeys: [],
    };
  }

  const entryKeySet = new Set(entryKeys.map((entryKey) => String(entryKey)));
  const filteredEntries = summary.entries.filter((entry) =>
    entryKeySet.has(String(entry.entryKey))
  );

  return buildEntrySummary(filteredEntries, projectStatus, slot.start, slot.end, {
    key: slot.key,
    label: slot.label,
    start: slot.start,
    end: slot.end,
    entryKeys: Array.from(entryKeySet),
  });
}

function buildExecutionRangeGroups(
  tasks,
  projectStatus,
  slots,
  projectUsers = [],
  assigneeId = null
) {
  const entries = tasks
    .flatMap((plan) => buildShiftedWorkItemSchedule(plan, projectUsers))
    .filter((entry) =>
      !assigneeId ? true : String(entry.assigned_to?.id || '') === String(assigneeId)
    );

  const groupedRanges = new Map();

  entries.forEach((entry, index) => {
    const rangeStart = (
      entry.effectiveStartDate ||
      entry.plannedDate ||
      entry.effectiveDate
    ).startOf('day');
    const rangeEnd = (
      entry.effectiveEndDate ||
      entry.plannedEndDate ||
      entry.effectiveDate ||
      entry.plannedDate
    ).startOf('day');
    const key = `${entry.entryKey || buildExecutionEntryKey(entry.planId, entry, index)}__${rangeStart.format('YYYY-MM-DD')}__${rangeEnd.format('YYYY-MM-DD')}`;

    if (!groupedRanges.has(key)) {
      groupedRanges.set(key, {
        key,
        entries: [],
        rangeStart,
        rangeEnd,
        sourceIndex: index,
      });
    }

    const group = groupedRanges.get(key);
    group.entries.push(entry);
    group.sourceIndex = Math.min(group.sourceIndex, index);
  });

  const preparedGroups = Array.from(groupedRanges.values())
    .map((group) => {
      let startIndex = -1;
      let endIndex = -1;

      slots.forEach((slot, index) => {
        const overlaps =
          !group.rangeEnd.endOf('day').isBefore(slot.start.startOf('day')) &&
          !group.rangeStart.startOf('day').isAfter(slot.end.endOf('day'));

        if (!overlaps) return;
        if (startIndex === -1) startIndex = index;
        endIndex = index;
      });

      if (startIndex === -1 || endIndex === -1) return null;

      return {
        ...group,
        startIndex,
        endIndex,
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (left.startIndex !== right.startIndex) return left.startIndex - right.startIndex;
      if (left.endIndex !== right.endIndex) return right.endIndex - left.endIndex;
      if (left.sourceIndex !== right.sourceIndex) return left.sourceIndex - right.sourceIndex;
      return 0;
    });

  const laneEndIndexes = [];

  return preparedGroups
    .map((group) => {
      let laneIndex = laneEndIndexes.findIndex((lastEndIndex) => group.startIndex > lastEndIndex);

      if (laneIndex === -1) {
        laneIndex = laneEndIndexes.length;
        laneEndIndexes.push(group.endIndex);
      } else {
        laneEndIndexes[laneIndex] = group.endIndex;
      }

      return {
        ...buildEntrySummary(group.entries, projectStatus, group.rangeStart, group.rangeEnd, {
          key: group.key,
          label: formatDateRange(group.rangeStart, group.rangeEnd),
          start: group.rangeStart,
          end: group.rangeEnd,
          entryKeys: group.entries.map((entry) => entry.entryKey).filter(Boolean),
        }),
        laneIndex,
        startIndex: group.startIndex,
        endIndex: group.endIndex,
        span: group.endIndex - group.startIndex + 1,
      };
    })
    .filter(Boolean);
}

function buildAssigneeSlotSummary(user, slots, projectStatus, projectUsers = []) {
  return slots.map((slot) => {
    const tasks = user.plans.filter((plan) =>
      buildShiftedWorkItemSchedule(plan, projectUsers).some(
        (entry) => String(entry.assigned_to?.id || '') === String(user.id)
      )
    );
    const summary = summarizeTasksForSlot(tasks, projectStatus, slot, projectUsers, user.id);
    const onTrackTasks = summary.tasks.filter(
      (task) => getTaskHealth(task, projectStatus) === 'onTrack'
    );

    return {
      ...summary,
      onTrackTasks,
      completedPreview: summarizeTaskTitles(summary.completedTasks),
      inProgressPreview: summarizeTaskTitles(summary.inProgressTasks),
      pendingPreview: summarizeTaskTitles(summary.pendingTasks),
    };
  });
}

export default function ProjectDetail({ projectId }) {
  const theme = useTheme();
  const { project, isLoading, error } = useProjectManagementProject(projectId);
  const roadmapScrollRef = useRef(null);
  const roadmapDragStateRef = useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
    didDrag: false,
  });
  const [assigneeTimeView, setAssigneeTimeView] = useState('weekly');
  const [roadmapSectionTab, setRoadmapSectionTab] = useState('roadmap');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedWorkloadDetail, setSelectedWorkloadDetail] = useState(null);
  const [savingPlanId, setSavingPlanId] = useState(null);
  const [approvingWorkItemId, setApprovingWorkItemId] = useState(null);
  const [isExportingRoadmap, setIsExportingRoadmap] = useState(false);
  const [isProgressBreakdownOpen, setIsProgressBreakdownOpen] = useState(false);

  const timeline = project ? buildTimeline(project, assigneeTimeView) : null;
  const assigneeModules = project && timeline ? buildAssigneeModules(project, timeline.rows) : [];
  const assigneeAnalytics = useMemo(
    () =>
      assigneeModules.map((user) => ({
        ...user,
        cadenceRows: buildAssigneeCadenceRows(user, assigneeTimeView),
        slotSummary: buildAssigneeSlotSummary(
          user,
          timeline?.weeks || [],
          project?.status,
          project?.assigned_users || []
        ),
      })),
    [assigneeModules, assigneeTimeView, timeline, project]
  );
  const totalDays =
    project?.start_date && project?.end_date
      ? Math.max(dayjs(project.end_date).diff(dayjs(project.start_date), 'day') + 1, 0)
      : '—';
  const completedPlans = (project?.plans || []).filter(
    (plan) => plan.status === 'Completed'
  ).length;
  const activePlans = (project?.plans || []).filter((plan) => plan.status === 'Active').length;
  const projectProgressPercent = Math.max(
    0,
    Math.min(
      100,
      Number(
        project?.progressPercent ??
          (project?.plansCount ? Math.round((completedPlans / project.plansCount) * 100) : 0)
      ) || 0
    )
  );
  const projectTaskProgress = useMemo(
    () =>
      (project?.plans || [])
        .map((plan) => {
          const workItems = normalizePlanWorkItems(
            plan.work_items,
            plan,
            plan.assigned_users || []
          );
          const total = workItems.length;
          const completed = workItems.filter((item) => item.state === 'Done').length;
          const inProgress = workItems.filter((item) => item.state === 'Doing').length;
          const pending = workItems.filter((item) => item.state === 'Todo').length;
          const percent = total
            ? Math.round((completed / total) * 100)
            : plan.status === 'Completed'
              ? 100
              : 0;

          return {
            id: plan.id || plan.serial_no || plan.title,
            serialNo: plan.serial_no,
            title: plan.title,
            percent,
            total,
            completed,
            inProgress,
            pending,
          };
        })
        .sort((left, right) => {
          const leftSerial = Number(left.serialNo || 0);
          const rightSerial = Number(right.serialNo || 0);

          if (leftSerial && rightSerial && leftSerial !== rightSerial) {
            return leftSerial - rightSerial;
          }

          return String(left.title || '').localeCompare(String(right.title || ''));
        }),
    [project]
  );
  const materials = Array.isArray(project?.materials) ? project.materials : [];
  const materialsEstimatedTotal = materials.reduce(
    (sum, item) => sum + Number(item.estimatedTotalCost || 0),
    0
  );
  const materialLinkedStepCount = materials.filter(
    (item) => item.planSerialNo || item.planId
  ).length;
  const materialPreferredVendorCount = materials.filter((item) =>
    String(item.preferredVendor || '').trim()
  ).length;
  const materialPreview = materials.slice(0, 5);

  const handleRoadmapMouseDown = (event) => {
    if (event.button !== 0) return;

    const node = roadmapScrollRef.current;
    if (!node) return;

    roadmapDragStateRef.current = {
      isDragging: true,
      startX: event.clientX,
      scrollLeft: node.scrollLeft,
      didDrag: false,
    };
    node.style.cursor = 'grabbing';
    node.style.userSelect = 'none';
  };

  const handleRoadmapMouseMove = (event) => {
    const node = roadmapScrollRef.current;
    const dragState = roadmapDragStateRef.current;

    if (!node || !dragState.isDragging) return;

    const deltaX = event.clientX - dragState.startX;

    if (Math.abs(deltaX) > 4) {
      dragState.didDrag = true;
    }

    node.scrollLeft = dragState.scrollLeft - deltaX;
    event.preventDefault();
  };

  const stopRoadmapDragging = () => {
    const node = roadmapScrollRef.current;
    if (node) {
      node.style.cursor = 'grab';
      node.style.removeProperty('user-select');
    }

    roadmapDragStateRef.current.isDragging = false;
  };

  const handleRoadmapClickCapture = (event) => {
    if (!roadmapDragStateRef.current.didDrag) return;

    event.preventDefault();
    event.stopPropagation();
    roadmapDragStateRef.current.didDrag = false;
  };

  if (isLoading) {
    return (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Loading project details...
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (!project) {
    return <Alert severity="error">{formatDetailError(error)}</Alert>;
  }

  const openPlanDetails = (plan) => {
    const targetTaskId = plan?.id || plan?.serial_no;

    if (!targetTaskId) return;

    window.open(
      paths.dashboard.projectManagements.taskManagement.assignment(project.id, targetTaskId),
      '_blank',
      'noopener,noreferrer'
    );
  };
  const openAssignmentWorkItem = (plan, item) => {
    const targetTaskId = plan?.id || plan?.serial_no;
    const workItemId = item?.id || item?.key;
    const assigneeId =
      item?.assigned_to?.id ||
      (selectedWorkloadDetail?.user?.id && String(selectedWorkloadDetail.user.id) !== 'all'
        ? selectedWorkloadDetail.user.id
        : null);

    if (!targetTaskId || !workItemId) return;

    const params = new URLSearchParams({
      workItem: String(workItemId),
    });

    if (assigneeId) {
      params.set('assigneeId', String(assigneeId));
    }

    window.open(
      `${paths.dashboard.projectManagements.taskManagement.assignment(project.id, targetTaskId)}?${params.toString()}`,
      '_blank',
      'noopener,noreferrer'
    );
  };
  const closePlanDetails = () => setSelectedPlan(null);
  const openWorkloadDetail = (user, slot) =>
    setSelectedWorkloadDetail({
      user,
      slot: {
        ...slot,
        tasks: slot.tasks.map((task) => normalizePlanForDialog(task)),
      },
    });
  const closeWorkloadDetail = () => setSelectedWorkloadDetail(null);

  const patchSelectedPlanDraft = (updater) => {
    setSelectedPlan((prev) => {
      if (!prev) return prev;

      const nextPlan = updater(prev);

      return {
        ...nextPlan,
        isDirty: true,
        work_items: getPlanChecklistItems(nextPlan).map((item, index) => ({
          ...item,
          sort_order: index + 1,
          key:
            item.key ||
            item.id ||
            `${nextPlan.id || nextPlan.serial_no || nextPlan.title}-${index}`,
        })),
      };
    });
  };

  const updatePlanInDialogs = (updatedPlan) => {
    const normalizedPlan = normalizePlanForDialog(updatedPlan);

    setSelectedPlan((prev) =>
      prev && String(prev.id) === String(normalizedPlan.id) ? normalizedPlan : prev
    );
    setSelectedWorkloadDetail((prev) => {
      if (!prev) return prev;

      const nextTasks = prev.slot.tasks.map((task) =>
        String(task.id) === String(normalizedPlan.id) ? normalizedPlan : task
      );

      const nextSlot = summarizeTasksForEntryKeys(
        nextTasks,
        project?.status,
        prev.slot,
        project?.assigned_users || [],
        prev.user?.id === 'all' ? null : prev.user?.id,
        prev.slot.entryKeys || []
      );

      return {
        ...prev,
        slot: {
          ...nextSlot,
          tasks: nextSlot.tasks.map((task) => normalizePlanForDialog(task)),
        },
      };
    });
  };

  const handleDraftWorkItemChange = (itemKey, field, value) => {
    patchSelectedPlanDraft((prev) => ({
      ...prev,
      work_items: getPlanChecklistItems(prev).map((item) =>
        String(item.key) === String(itemKey)
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }));
  };

  const handleDraftPlanStatusChange = (value) => {
    patchSelectedPlanDraft((prev) => ({
      ...prev,
      status: value,
    }));
  };

  const handleAddWorkItem = () => {
    patchSelectedPlanDraft((prev) => ({
      ...prev,
      work_items: [
        ...getPlanChecklistItems(prev),
        createEmptyWorkItem(prev, project.assigned_users),
      ],
    }));
  };

  const handleRemoveWorkItem = (itemKey) => {
    patchSelectedPlanDraft((prev) => ({
      ...prev,
      work_items: getPlanChecklistItems(prev).filter(
        (item) => String(item.key) !== String(itemKey)
      ),
    }));
  };

  const handleSavePlanBoard = async (plan) => {
    setSavingPlanId(plan.id);

    try {
      const updated = await updateProjectManagementPlan(
        plan.id,
        buildPlanWorkItemPayload(plan, getPlanChecklistItems(plan))
      );
      updatePlanInDialogs(updated);
    } finally {
      setSavingPlanId(null);
    }
  };

  const handleApproveWorkItem = async (plan, workItem) => {
    if (
      !workItem?.id ||
      workItem.state !== 'Done' ||
      getWorkItemApprovalStatus(workItem) === 'Approved'
    )
      return;

    setApprovingWorkItemId(workItem.id);

    try {
      const updatedWorkItem = await approveProjectManagementWorkItem(workItem.id, {
        planId: plan.id,
        projectId,
      });

      setSelectedPlan((prev) => {
        if (!prev || String(prev.id) !== String(plan.id)) return prev;

        return {
          ...prev,
          work_items: getPlanChecklistItems(prev).map((item) =>
            String(item.id || item.key) === String(updatedWorkItem.id)
              ? {
                  ...item,
                  ...updatedWorkItem,
                }
              : item
          ),
        };
      });
      toast.success('Execution task approved successfully.');
    } catch (approvalError) {
      toast.error(
        approvalError?.detail || approvalError?.message || 'Failed to approve execution task.'
      );
    } finally {
      setApprovingWorkItemId(null);
    }
  };

  const handleToggleWorkItem = async (plan, workItem) => {
    const planBoard = getPlanBoardItems(plan, project.assigned_users);
    const targetKey = String(workItem.key || workItem.id || workItem.title);
    const targetItem = planBoard.find(
      (item) => String(item.key || item.id || item.title) === targetKey
    );

    if (!targetItem?.canAdvance) return;

    const nextItems = getPlanChecklistItems(plan).map((item) =>
      String(item.key || item.id || item.title) === targetKey
        ? { ...item, state: getNextChecklistState(item.state) }
        : item
    );

    setSavingPlanId(plan.id);
    try {
      const updated = await updateProjectManagementPlan(
        plan.id,
        buildPlanWorkItemPayload(plan, nextItems)
      );
      updatePlanInDialogs(updated);
    } finally {
      setSavingPlanId(null);
    }
  };

  const handleExportRoadmap = async () => {
    if (!project?.id || isExportingRoadmap) return;

    setIsExportingRoadmap(true);
    try {
      await exportProjectManagementRoadmapExcel(project.id);
      toast.success('Roadmap Excel downloaded successfully.');
    } catch (downloadError) {
      toast.error(
        downloadError?.detail || downloadError?.message || 'Failed to download roadmap Excel.'
      );
    } finally {
      setIsExportingRoadmap(false);
    }
  };

  const renderSlotTooltip = (slot) => (
    <Box sx={{ p: 0.5, maxWidth: 320 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>
        Slot task summary
      </Typography>
      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mb: 1.25 }}>
        <Chip size="small" color={getSlotVisualTone(slot)} label={slot.signalLabel} />
        {slot.blockedTasks.length ? (
          <Chip
            size="small"
            color="error"
            variant="outlined"
            label={`Blocked ${slot.blockedTasks.length}`}
          />
        ) : null}
        {slot.overdueTasks.length ? (
          <Chip
            size="small"
            color="error"
            variant="outlined"
            label={`Overdue ${slot.overdueTasks.length}`}
          />
        ) : null}
        {slot.atRiskTasks.length ? (
          <Chip
            size="small"
            color="warning"
            variant="outlined"
            label={`At risk ${slot.atRiskTasks.length}`}
          />
        ) : null}
      </Stack>
      {[
        { label: 'Doing', color: 'success.dark', tasks: slot.inProgressTasks },
        { label: 'Done', color: 'success.main', tasks: slot.completedTasks },
        { label: 'Remaining', color: 'warning.main', tasks: slot.pendingTasks },
      ].map((group) => (
        <Box key={group.label} sx={{ mb: 1, '&:last-of-type': { mb: 0 } }}>
          <Typography variant="caption" sx={{ color: group.color, fontWeight: 700 }}>
            {group.label} ({group.tasks.length})
          </Typography>
          {group.tasks.length ? (
            <Stack spacing={0.5} sx={{ mt: 0.5 }}>
              {group.tasks.map((task) => (
                <Typography
                  key={`${slot.key}-${group.label}-${task.id || task.serial_no || task.title}`}
                  variant="caption"
                  sx={{ color: 'common.white' }}
                >
                  • [{getSignalLabel(getTaskHealth(task, project.status))}] {task.title} (
                  {formatDate(task.start_date)} → {formatDate(task.end_date)})
                </Typography>
              ))}
            </Stack>
          ) : (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'grey.300' }}>
              No tasks
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );

  return (
    <Box>
      <Card
        sx={{
          mb: 3,
          borderRadius: 4,
          color: 'common.white',
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 45%, ${theme.palette.secondary.main} 100%)`,
          boxShadow: theme.shadows[12],
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={2}>
                <Box>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                    sx={{ mb: 1.5 }}
                  >
                    <Chip
                      label={project.code}
                      size="small"
                      sx={{ bgcolor: alpha('#ffffff', 0.12), color: 'common.white' }}
                    />
                    <Chip
                      label={project.status}
                      size="small"
                      sx={{ bgcolor: alpha('#ffffff', 0.18), color: 'common.white' }}
                    />
                    <Chip
                      label={
                        Array.isArray(project.project_type)
                          ? project.project_type.join(', ')
                          : project.project_type
                      }
                      size="small"
                      sx={{ bgcolor: alpha('#ffffff', 0.12), color: 'common.white' }}
                    />
                  </Stack>
                  <Typography variant="h3" fontWeight={800}>
                    {project.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ mt: 1.25, maxWidth: 860, color: alpha('#ffffff', 0.84) }}
                  >
                    {renderValue(
                      project.background ||
                        project.objectives ||
                        'Strategic project detail, timeline, delivery ownership, and planning progress in one place.'
                    )}
                  </Typography>
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap">
                  <Button
                    component={RouterLink}
                    href={paths.dashboard.projectManagements.projects.allProjects}
                    color="inherit"
                    variant="outlined"
                    sx={{ borderColor: alpha('#ffffff', 0.35), color: 'common.white' }}
                  >
                    Back to Projects
                  </Button>
                  <Button
                    component={RouterLink}
                    href={paths.dashboard.projectManagements.projects.edit(project.id)}
                    variant="contained"
                    sx={{
                      bgcolor: 'common.white',
                      color: 'primary.main',
                      '&:hover': { bgcolor: alpha('#ffffff', 0.92) },
                    }}
                  >
                    Edit Project
                  </Button>
                </Stack>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  bgcolor: alpha('#ffffff', 0.1),
                  backdropFilter: 'blur(6px)',
                }}
              >
                <CardContent>
                  <Typography variant="overline" sx={{ color: alpha('#ffffff', 0.72) }}>
                    Delivery Snapshot
                  </Typography>
                  <Stack spacing={1.75} sx={{ mt: 1.25 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.72) }}>
                        Project Manager
                      </Typography>
                      <Typography variant="subtitle2">{project.projectManagerName}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.72) }}>
                        Donor
                      </Typography>
                      <Typography variant="subtitle2">{project.donorName}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.72) }}>
                        Timeline
                      </Typography>
                      <Typography variant="subtitle2">
                        {formatDate(project.start_date)} - {formatDate(project.end_date)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.72) }}>
                        Budget
                      </Typography>
                      <Typography variant="subtitle2">
                        {`${fCurrency(project.budgetAmount)} ${project.currency || ''}`.trim()}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.72) }}>
                        Materials
                      </Typography>
                      <Typography variant="subtitle2">
                        {materials.length} line{materials.length === 1 ? '' : 's'}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Stack spacing={3}>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              label="Budget"
              value={`${fCurrency(project.budgetAmount)} ${project.currency || ''}`.trim()}
              helper="Approved working budget"
              accent={theme.palette.primary.main}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              label="Plan Steps"
              value={project.plansCount}
              helper={`${completedPlans} completed • ${activePlans} active`}
              accent={theme.palette.success.main}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              label="Timeline"
              value={project.duration_months ? `${project.duration_months} months` : '—'}
              helper={
                typeof totalDays === 'number'
                  ? `${totalDays} calendar days`
                  : 'Project duration pending'
              }
              accent={theme.palette.warning.main}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              label="Assigned Team"
              value={Array.isArray(project.assigned_users) ? project.assigned_users.length : 0}
              helper={project.assignedUsersText || 'No team assigned'}
              accent={theme.palette.secondary.main}
            />
          </Grid>
        </Grid>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Project Progress
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Overall project completion with a task-by-task progress breakdown.
                </Typography>
              </Box>

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1.5}
                alignItems={{ xs: 'stretch', md: 'center' }}
              >
                <Box sx={{ flex: 1 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    spacing={1}
                    sx={{ mb: 0.9 }}
                  >
                    <Typography variant="subtitle2" fontWeight={800}>
                      {projectProgressPercent}% complete
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {completedPlans} of {project.plansCount || 0} tasks completed
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={projectProgressPercent}
                    color={getProgressTone(projectProgressPercent)}
                    sx={{
                      height: 12,
                      borderRadius: 999,
                      bgcolor: alpha(theme.palette.grey[500], 0.16),
                    }}
                  />
                </Box>

                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  onClick={() => setIsProgressBreakdownOpen((current) => !current)}
                  endIcon={
                    <Iconify
                      icon={
                        isProgressBreakdownOpen
                          ? 'solar:alt-arrow-up-bold'
                          : 'solar:alt-arrow-down-bold'
                      }
                      width={16}
                    />
                  }
                  sx={{
                    minWidth: { xs: '100%', md: 164 },
                    borderRadius: 2.5,
                    fontWeight: 700,
                    textTransform: 'none',
                  }}
                >
                  Task Progress
                </Button>
              </Stack>

              {isProgressBreakdownOpen ? (
                <Stack spacing={1.5}>
                  {projectTaskProgress.length ? (
                    projectTaskProgress.map((task) => (
                      <Box
                        key={`project-progress-${task.id}`}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
                          bgcolor: alpha(theme.palette.background.paper, 0.82),
                        }}
                      >
                        <Stack spacing={0.9}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            spacing={1}
                            alignItems="center"
                          >
                            <Typography
                              variant="subtitle2"
                              fontWeight={700}
                              sx={{ minWidth: 0 }}
                              noWrap
                            >
                              {task.serialNo ? `SL ${task.serialNo} • ` : ''}
                              {task.title}
                            </Typography>
                            <Typography
                              variant="caption"
                              fontWeight={800}
                              color={`${getProgressTone(task.percent)}.main`}
                            >
                              {task.percent}%
                            </Typography>
                          </Stack>

                          <LinearProgress
                            variant="determinate"
                            value={task.percent}
                            color={getProgressTone(task.percent)}
                            sx={{
                              height: 10,
                              borderRadius: 999,
                              bgcolor: alpha(theme.palette.grey[500], 0.14),
                            }}
                          />

                          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                            <Chip size="small" variant="outlined" label={`${task.total} total`} />
                            <Chip
                              size="small"
                              color="success"
                              variant="outlined"
                              label={`Done ${task.completed}`}
                            />
                            <Chip
                              size="small"
                              color="success"
                              variant="outlined"
                              label={`Doing ${task.inProgress}`}
                              sx={getChecklistChipSx(theme, 'Doing')}
                            />
                            <Chip
                              size="small"
                              color="warning"
                              variant="outlined"
                              label={`Todo ${task.pending}`}
                            />
                          </Stack>
                        </Stack>
                      </Box>
                    ))
                  ) : (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      No task progress is available yet for this project.
                    </Alert>
                  )}
                </Stack>
              ) : null}
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  spacing={2}
                  sx={{ mb: 2.5 }}
                >
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      Project Overview
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Key setup, delivery context, and operating details.
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip
                      label={
                        Array.isArray(project.implementation_type)
                          ? project.implementation_type.join(', ') || 'Implementation'
                          : project.implementation_type || 'Implementation'
                      }
                      variant="outlined"
                    />
                    <Chip label={project.sector || 'Sector'} variant="outlined" />
                    <Chip label={project.location || 'Location'} variant="outlined" />
                  </Stack>
                </Stack>

                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, md: 6, xl: 4 }}>
                    <DetailItem label="Short Name" value={project.short_name} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6, xl: 4 }}>
                    <DetailItem label="Donor" value={project.donorName} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6, xl: 4 }}>
                    <DetailItem label="Project Manager" value={project.projectManagerName} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6, xl: 4 }}>
                    <DetailItem label="Start Date" value={formatDate(project.start_date)} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6, xl: 4 }}>
                    <DetailItem label="End Date" value={formatDate(project.end_date)} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6, xl: 4 }}>
                    <DetailItem
                      label="Target Beneficiaries"
                      value={
                        Array.isArray(project.target_beneficiaries)
                          ? project.target_beneficiaries.join(', ')
                          : project.target_beneficiaries
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6, xl: 4 }}>
                    <DetailItem label="Reporting Frequency" value={project.reporting_frequency} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6, xl: 4 }}>
                    <DetailItem label="Risk Level" value={project.risk_level} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6, xl: 4 }}>
                    <DetailItem label="Created By" value={project.created_by_name} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>
                  Team Allocation
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Core Team
                    </Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
                      {renderValue(project.assignedUsersText)}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Box sx={{ mt: 0.75 }}>
                      <Chip label={project.status} color={getStatusTone(project.status)} />
                    </Box>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Focus
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                      {renderValue(project.objectives || project.expected_outcomes)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  spacing={2}
                  sx={{ mb: 2.5 }}
                >
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      Project Materials
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Expense-ready materials planned for this project, with roadmap linkage and
                      procurement notes.
                    </Typography>
                  </Box>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                    {project.materialsExpenseId ? (
                      <Button
                        component={RouterLink}
                        href={paths.dashboard.projectManagements.expenses.detail(
                          project.materialsExpenseId
                        )}
                        variant="contained"
                        color="primary"
                        startIcon={<Iconify icon="solar:card-send-bold" width={18} />}
                        sx={{ borderRadius: 999 }}
                      >
                        Open Linked Expense
                      </Button>
                    ) : null}
                    <Button
                      component={RouterLink}
                      href={paths.dashboard.projectManagements.projects.edit(project.id)}
                      variant="outlined"
                      startIcon={<Iconify icon="solar:pen-bold" width={18} />}
                      sx={{ borderRadius: 999 }}
                    >
                      Edit Materials
                    </Button>
                  </Stack>
                </Stack>

                {materials.length ? (
                  <Stack spacing={1.25}>
                    {materialPreview.map((item, index) => (
                      <Card
                        key={item.id || `${item.title}-${index}`}
                        variant="outlined"
                        sx={{
                          borderRadius: 2.5,
                          borderColor: alpha(theme.palette.primary.main, 0.14),
                          boxShadow: 'none',
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            justifyContent="space-between"
                            spacing={1.5}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Stack
                                direction="row"
                                spacing={1}
                                flexWrap="wrap"
                                useFlexGap
                                sx={{ mb: 0.75 }}
                              >
                                <Chip
                                  size="small"
                                  label={item.category || 'Material'}
                                  color="primary"
                                  variant="outlined"
                                />
                                {item.planSerialNo ? (
                                  <Chip
                                    size="small"
                                    label={`Step ${item.planSerialNo}`}
                                    variant="outlined"
                                  />
                                ) : null}
                                {item.requiredBy ? (
                                  <Chip
                                    size="small"
                                    label={`Need by ${formatDate(item.requiredBy)}`}
                                    variant="outlined"
                                  />
                                ) : null}
                              </Stack>
                              <Typography variant="subtitle1" fontWeight={700} noWrap>
                                {item.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                                {item.description ||
                                  item.notes ||
                                  'No extra notes added for this material line.'}
                              </Typography>
                            </Box>

                            <Stack spacing={0.75} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                              <Typography variant="subtitle1" fontWeight={800}>
                                {formatProjectCurrency(
                                  item.estimatedTotalCost,
                                  project.currency || 'BDT'
                                )}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {Number(item.quantity || 0).toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })}{' '}
                                {item.unit || 'unit'} ×{' '}
                                {formatProjectCurrency(
                                  item.estimatedUnitCost,
                                  project.currency || 'BDT'
                                )}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Vendor: {renderValue(item.preferredVendor)}
                              </Typography>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}

                    {materials.length > materialPreview.length ? (
                      <Alert severity="info">
                        Showing {materialPreview.length} of {materials.length} material lines. Open
                        Edit Materials to review the full list.
                      </Alert>
                    ) : null}
                  </Stack>
                ) : (
                  <Alert severity="info">
                    No materials have been added to this project yet. Use Edit Materials to plan
                    expense-linked supplies.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>
                  Materials Summary
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Estimated Cost
                    </Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
                      {formatProjectCurrency(materialsEstimatedTotal, project.currency || 'BDT')}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Lines Planned
                    </Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
                      {materials.length}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Linked to Roadmap Steps
                    </Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
                      {materialLinkedStepCount}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Vendor Planned
                    </Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
                      {materialPreferredVendorCount} of {materials.length}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Expense Draft
                    </Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
                      {project.materialsExpenseInvoiceNumber || 'Pending first save'}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <NarrativeBlock title="Background" value={project.background} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <NarrativeBlock title="Objectives" value={project.objectives} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <NarrativeBlock title="Expected Outcomes" value={project.expected_outcomes} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <NarrativeBlock title="Monitoring Plan" value={project.monitoring_plan} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <NarrativeBlock title="Additional Notes" value={project.notes} />
          </Grid>
        </Grid>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack spacing={2} sx={{ mb: 2.5 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Project Plan Roadmap
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Timeline board, expenditure plan, and monthly action plan in Excel-style layouts.
                </Typography>
              </Box>

              <Tabs
                value={roadmapSectionTab}
                onChange={(_, value) => setRoadmapSectionTab(value)}
                variant="scrollable"
                allowScrollButtonsMobile
                sx={{
                  minHeight: 42,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  '& .MuiTab-root': {
                    minHeight: 42,
                    textTransform: 'none',
                    fontWeight: 700,
                  },
                }}
              >
                {ROADMAP_SECTION_TABS.map((tab) => (
                  <Tab key={tab.value} value={tab.value} label={tab.label} />
                ))}
              </Tabs>
            </Stack>

            {roadmapSectionTab === 'expenditure' ? (
              <ProjectExpenditurePanel projectId={project?.id} />
            ) : null}

            {roadmapSectionTab === 'action-plan' ? (
              <ProjectActionPlanPanel
                projectId={project?.id}
                defaultYear={project?.start_date ? dayjs(project.start_date).year() : undefined}
                defaultMonth={
                  project?.start_date ? dayjs(project.start_date).month() + 1 : undefined
                }
              />
            ) : null}

            {roadmapSectionTab === 'roadmap' ? (
              <>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              spacing={2}
              sx={{ mb: 2.5 }}
            >
              <Box />
              <Stack spacing={1.5} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={
                    isExportingRoadmap ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <Iconify icon="solar:download-bold" />
                    )
                  }
                  onClick={handleExportRoadmap}
                  disabled={isExportingRoadmap}
                  sx={{ borderRadius: 999, px: 2 }}
                >
                  {isExportingRoadmap ? 'Preparing Excel...' : 'Download roadmap Excel'}
                </Button>
                <Tabs
                  value={assigneeTimeView}
                  onChange={(_, value) => setAssigneeTimeView(value)}
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
                <Stack direction="row" spacing={1.5} flexWrap="wrap">
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
            </Stack>

            {timeline && timeline.rows.length > 0 ? (
              <Box
                ref={roadmapScrollRef}
                onMouseDown={handleRoadmapMouseDown}
                onMouseMove={handleRoadmapMouseMove}
                onMouseUp={stopRoadmapDragging}
                onMouseLeave={stopRoadmapDragging}
                onClickCapture={handleRoadmapClickCapture}
                sx={{
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  pb: 1,
                  cursor: 'grab',
                  position: 'relative',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: `72px 218px repeat(${timeline.weeks.length}, minmax(40px, 1fr))`,
                    minWidth: `max(100%, ${290 + timeline.weeks.length * 40}px)`,
                    width: `max(100%, ${290 + timeline.weeks.length * 40}px)`,
                    overflow: 'visible',
                    bgcolor: 'background.paper',
                  }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'background.paper',
                      backgroundImage: `linear-gradient(${alpha(theme.palette.secondary.main, 0.16)}, ${alpha(theme.palette.secondary.main, 0.16)})`,
                      borderRight: `1px solid ${theme.palette.divider}`,
                      position: 'sticky',
                      left: 0,
                      top: 0,
                      zIndex: 7,
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={800}>
                      SL
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'background.paper',
                      backgroundImage: `linear-gradient(${alpha(theme.palette.secondary.main, 0.16)}, ${alpha(theme.palette.secondary.main, 0.16)})`,
                      borderRight: `1px solid ${theme.palette.divider}`,
                      position: 'sticky',
                      left: 72,
                      top: 0,
                      zIndex: 7,
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={800}>
                      Project Task Description
                    </Typography>
                  </Box>
                  {timeline.quarterGroups.map((group) => (
                    <Box
                      key={group.key}
                      sx={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 6,
                        gridColumn: `span ${group.span}`,
                        p: 1,
                        textAlign: 'center',
                        bgcolor: alpha(theme.palette.primary.main, 0.92),
                        color: 'common.white',
                        borderLeft: `1px solid ${alpha('#ffffff', 0.15)}`,
                      }}
                    >
                      <Typography variant="caption" fontWeight={800}>
                        {group.label}
                      </Typography>
                    </Box>
                  ))}

                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'background.paper',
                      backgroundImage: `linear-gradient(${alpha(theme.palette.secondary.main, 0.12)}, ${alpha(theme.palette.secondary.main, 0.12)})`,
                      borderTop: `1px solid ${theme.palette.divider}`,
                      borderRight: `1px solid ${theme.palette.divider}`,
                      position: 'sticky',
                      left: 0,
                      top: 40,
                      zIndex: 7,
                    }}
                  />
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'background.paper',
                      backgroundImage: `linear-gradient(${alpha(theme.palette.secondary.main, 0.12)}, ${alpha(theme.palette.secondary.main, 0.12)})`,
                      borderTop: `1px solid ${theme.palette.divider}`,
                      borderRight: `1px solid ${theme.palette.divider}`,
                      position: 'sticky',
                      left: 72,
                      top: 40,
                      zIndex: 7,
                    }}
                  >
                    <Typography variant="caption" fontWeight={700}>
                      Months
                    </Typography>
                  </Box>
                  {timeline.monthGroups.map((group, index) => (
                    <Box
                      key={group.key}
                      sx={{
                        position: 'sticky',
                        top: 40,
                        zIndex: 6,
                        gridColumn: `span ${group.span}`,
                        p: 1,
                        textAlign: 'center',
                        borderTop: `1px solid ${theme.palette.divider}`,
                        borderLeft: `1px solid ${theme.palette.divider}`,
                        bgcolor:
                          index % 2 === 0
                            ? alpha(theme.palette.warning.main, 0.18)
                            : alpha(theme.palette.info.main, 0.18),
                      }}
                    >
                      <Typography variant="caption" fontWeight={700}>
                        {group.label}
                      </Typography>
                    </Box>
                  ))}

                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'background.paper',
                      backgroundImage: `linear-gradient(${alpha(theme.palette.secondary.main, 0.08)}, ${alpha(theme.palette.secondary.main, 0.08)})`,
                      borderTop: `1px solid ${theme.palette.divider}`,
                      borderRight: `1px solid ${theme.palette.divider}`,
                      position: 'sticky',
                      left: 0,
                      top: 89,
                      zIndex: 7,
                    }}
                  />
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'background.paper',
                      backgroundImage: `linear-gradient(${alpha(theme.palette.secondary.main, 0.08)}, ${alpha(theme.palette.secondary.main, 0.08)})`,
                      borderTop: `1px solid ${theme.palette.divider}`,
                      borderRight: `1px solid ${theme.palette.divider}`,
                      position: 'sticky',
                      left: 72,
                      top: 89,
                      zIndex: 7,
                    }}
                  >
                    <Typography variant="caption" fontWeight={700}>
                      {timeline.scaleLabel}
                    </Typography>
                  </Box>
                  {timeline.weeks.map((week, index) => (
                    <Box
                      key={week.key}
                      sx={{
                        position: 'sticky',
                        top: 89,
                        zIndex: 6,
                        p: 0.45,
                        minHeight: 32,
                        textAlign: 'center',
                        borderTop: `1px solid ${theme.palette.divider}`,
                        borderLeft: `1px solid ${theme.palette.divider}`,
                        bgcolor:
                          index % 2 === 0
                            ? alpha(theme.palette.grey[500], 0.06)
                            : alpha(theme.palette.grey[500], 0.12),
                      }}
                    >
                      <Typography variant="caption" fontWeight={700}>
                        {week.label}
                      </Typography>
                    </Box>
                  ))}

                  {timeline.rows.map((plan, rowIndex) => {
                    const planRangeGroups = buildExecutionRangeGroups(
                      [plan],
                      project.status,
                      timeline.weeks,
                      project.assigned_users || []
                    );
                    const planLaneCount = planRangeGroups.length
                      ? Math.max(...planRangeGroups.map((group) => group.laneIndex)) + 1
                      : 0;
                    const planRowHeight = Math.max(82, 54 + planLaneCount * 26);

                    return (
                      <Box
                        key={plan.id || `${plan.serial_no}-${plan.title}`}
                        sx={{ display: 'contents' }}
                      >
                        <Box
                          sx={{
                            minHeight: planRowHeight,
                            p: 1,
                            borderTop: `1px solid ${theme.palette.divider}`,
                            borderRight: `1px solid ${theme.palette.divider}`,
                            bgcolor: 'background.paper',
                            backgroundImage: `linear-gradient(${rowIndex % 2 === 0 ? alpha(theme.palette.secondary.main, 0.08) : alpha(theme.palette.secondary.main, 0.03)}, ${rowIndex % 2 === 0 ? alpha(theme.palette.secondary.main, 0.08) : alpha(theme.palette.secondary.main, 0.03)})`,
                            position: 'sticky',
                            left: 0,
                            zIndex: 5,
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease',
                            '&:hover': {
                              bgcolor: 'background.paper',
                              backgroundImage: `linear-gradient(${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.main, 0.08)})`,
                            },
                          }}
                          onClick={() => openPlanDetails(plan)}
                        >
                          <Stack
                            justifyContent="center"
                            alignItems="flex-start"
                            sx={{ minHeight: planRowHeight }}
                          >
                            <Chip label={`SL ${plan.serial_no}`} size="small" color="primary" />
                          </Stack>
                        </Box>
                        <Box
                          sx={{
                            minHeight: planRowHeight,
                            p: 1,
                            borderTop: `1px solid ${theme.palette.divider}`,
                            borderRight: `1px solid ${theme.palette.divider}`,
                            bgcolor: 'background.paper',
                            backgroundImage: `linear-gradient(${rowIndex % 2 === 0 ? alpha(theme.palette.secondary.main, 0.08) : alpha(theme.palette.secondary.main, 0.03)}, ${rowIndex % 2 === 0 ? alpha(theme.palette.secondary.main, 0.08) : alpha(theme.palette.secondary.main, 0.03)})`,
                            position: 'sticky',
                            left: 72,
                            zIndex: 5,
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease',
                            '&:hover': {
                              bgcolor: 'background.paper',
                              backgroundImage: `linear-gradient(${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.main, 0.08)})`,
                            },
                          }}
                          onClick={() => openPlanDetails(plan)}
                        >
                          <Stack spacing={0.75}>
                            <Stack
                              direction="row"
                              spacing={0.75}
                              alignItems="center"
                              flexWrap="wrap"
                            >
                              <Chip
                                size="small"
                                label={getRoadmapStatusLabel(plan.status)}
                                color={getStatusTone(plan.status)}
                              />
                            </Stack>
                            <Stack
                              direction="row"
                              spacing={0.5}
                              flexWrap="wrap"
                              alignItems="center"
                            >
                              <Chip
                                size="small"
                                variant="outlined"
                                label={`${formatDate(plan.start_date)} → ${formatDate(plan.end_date)}`}
                              />
                              {plan.assignedUsers.length ? (
                                <Chip
                                  size="small"
                                  label={plan.assignedUsers.map((user) => user.username).join(', ')}
                                  sx={{
                                    bgcolor: alpha(plan.color, 0.12),
                                    color: theme.palette.text.primary,
                                    border: `1px solid ${alpha(plan.color, 0.2)}`,
                                    maxWidth: '100%',
                                    '& .MuiChip-label': {
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    },
                                  }}
                                />
                              ) : null}
                            </Stack>
                          </Stack>
                        </Box>

                        {timeline.weeks.map((week, weekIndex) => {
                          const isActive =
                            weekIndex >= plan.startIndex && weekIndex <= plan.endIndex;
                          const isStart = weekIndex === plan.startIndex;
                          const isEnd = weekIndex === plan.endIndex;
                          const planSpan = Math.max(1, plan.endIndex - plan.startIndex + 1);
                          const startingRangeGroups = planRangeGroups.filter(
                            (group) => group.startIndex === weekIndex
                          );

                          return (
                            <Box
                              key={`${plan.id || plan.serial_no}-${week.key}`}
                              sx={{
                                position: 'relative',
                                minHeight: planRowHeight,
                                borderTop: `1px solid ${theme.palette.divider}`,
                                borderLeft: `1px solid ${theme.palette.divider}`,
                                bgcolor:
                                  weekIndex % 2 === 0
                                    ? alpha(theme.palette.grey[500], 0.04)
                                    : alpha(theme.palette.grey[500], 0.09),
                                cursor: isActive ? 'pointer' : 'default',
                              }}
                              onClick={isActive ? () => openPlanDetails(plan) : undefined}
                            >
                              {isStart ? (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: 10,
                                    left: 3,
                                    width: `calc(${planSpan * 100}% - ${planSpan > 1 ? 2 : 6}px)`,
                                    height: 28,
                                    borderRadius: 999,
                                    bgcolor: plan.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    color: 'common.white',
                                    boxShadow: `0 8px 18px ${alpha(plan.color, 0.35)}`,
                                    px: 1,
                                    gap: 0.75,
                                    overflow: 'hidden',
                                    zIndex: 3,
                                    whiteSpace: 'nowrap',
                                    pointerEvents: 'none',
                                  }}
                                >
                                  <Stack
                                    direction="row"
                                    spacing={0.5}
                                    alignItems="center"
                                    sx={{ minWidth: 0, maxWidth: '100%' }}
                                  >
                                    <Typography variant="caption" fontWeight={800} noWrap>
                                      {plan.title}
                                    </Typography>
                                    {plan.duration_days ? (
                                      <Box
                                        component="span"
                                        sx={{
                                          px: 0.75,
                                          py: 0.125,
                                          borderRadius: 999,
                                          bgcolor: alpha('#ffffff', 0.18),
                                          fontSize: 10,
                                          fontWeight: 800,
                                          whiteSpace: 'nowrap',
                                          flexShrink: 0,
                                        }}
                                      >
                                        {plan.duration_days}d
                                      </Box>
                                    ) : null}
                                    <Box
                                      component="span"
                                      sx={{
                                        px: 0.75,
                                        py: 0.125,
                                        borderRadius: 999,
                                        bgcolor: alpha('#ffffff', 0.18),
                                        fontSize: 10,
                                        fontWeight: 800,
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0,
                                      }}
                                    >
                                      {getRoadmapStatusLabel(plan.status)}
                                    </Box>
                                  </Stack>
                                </Box>
                              ) : null}

                              {startingRangeGroups.map((group) => {
                                const groupVisual = getSlotVisualStyles(group, theme);
                                const isCompleteSummary = !!(
                                  group.completed &&
                                  !group.inProgress &&
                                  !group.pending
                                );
                                const isInProgressSummary = !!group.inProgress;
                                const barBackground = isInProgressSummary
                                  ? alpha(theme.palette.success.main, 0.16)
                                  : groupVisual.tone === 'success'
                                    ? theme.palette.success.light
                                    : groupVisual.tone === 'primary'
                                      ? theme.palette.primary.light
                                      : groupVisual.tone === 'warning'
                                        ? theme.palette.warning.light
                                        : groupVisual.tone === 'error'
                                          ? theme.palette.error.light
                                          : theme.palette.grey[200];
                                const barTextColor = isInProgressSummary
                                  ? theme.palette.success.dark
                                  : groupVisual.tone === 'success'
                                    ? theme.palette.success.dark
                                    : groupVisual.tone === 'primary'
                                      ? theme.palette.primary.dark
                                      : groupVisual.tone === 'warning'
                                        ? theme.palette.warning.dark
                                        : groupVisual.tone === 'error'
                                          ? theme.palette.error.dark
                                          : theme.palette.text.primary;
                                const barBorderColor = isInProgressSummary
                                  ? alpha(theme.palette.success.main, 0.46)
                                  : groupVisual.tone === 'success'
                                    ? theme.palette.success.main
                                    : groupVisual.tone === 'primary'
                                      ? theme.palette.primary.main
                                      : groupVisual.tone === 'warning'
                                        ? theme.palette.warning.main
                                        : groupVisual.tone === 'error'
                                          ? theme.palette.error.main
                                          : theme.palette.grey[400];

                                return (
                                  <Box
                                    key={group.key}
                                    sx={{
                                      position: 'absolute',
                                      top: 46 + group.laneIndex * 26,
                                      left: 4,
                                      width: `calc(${group.span * 100}% - 8px)`,
                                      minHeight: 22,
                                      px: 0.7,
                                      py: 0.15,
                                      border: `1px solid ${barBorderColor}`,
                                      bgcolor: barBackground,
                                      color: barTextColor,
                                      borderRadius: 0,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      cursor: 'pointer',
                                      overflow: 'hidden',
                                      zIndex: 2,
                                      gap: 0.5,
                                      boxShadow: 'none',
                                      transition: 'filter 0.18s ease',
                                      '&:hover': {
                                        filter: 'brightness(0.98)',
                                      },
                                    }}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setSelectedWorkloadDetail({
                                        user: {
                                          id: 'all',
                                          username: 'All Tasks',
                                        },
                                        slot: {
                                          ...group,
                                          tasks: group.tasks.map((task) =>
                                            normalizePlanForDialog(task)
                                          ),
                                        },
                                      });
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      fontWeight={700}
                                      noWrap
                                      sx={{ color: 'inherit', lineHeight: 1.1, flexShrink: 0 }}
                                    >
                                      {getExecutionGroupTitle(group)}
                                    </Typography>
                                    {isCompleteSummary ? (
                                      <Box
                                        component="span"
                                        sx={{
                                          width: 16,
                                          height: 16,
                                          borderRadius: 0.75,
                                          bgcolor: theme.palette.success.main,
                                          color: theme.palette.success.contrastText,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: 11,
                                          fontWeight: 900,
                                          lineHeight: 1,
                                          flexShrink: 0,
                                        }}
                                      >
                                        ✓
                                      </Box>
                                    ) : null}
                                  </Box>
                                );
                              })}
                            </Box>
                          );
                        })}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No plan steps added to this project yet.
              </Typography>
            )}
              </>
            ) : null}
          </CardContent>
        </Card>
      </Stack>

      <Dialog
        open={!!selectedPlan}
        onClose={closePlanDetails}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}
      >
        {selectedPlan ? (
          <>
            <DialogTitle sx={{ pb: 1.5 }}>
              <Stack spacing={1.25}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip label={`SL ${selectedPlan.serial_no}`} size="small" color="primary" />
                  <Chip
                    size="small"
                    label={selectedPlan.status}
                    color={getStatusTone(selectedPlan.status)}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={getRoadmapStatusLabel(selectedPlan.status)}
                  />
                </Stack>
                <Typography variant="h6" fontWeight={800}>
                  {selectedPlan.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Assigned work, timeline, and delivery details for this roadmap task.
                </Typography>
              </Stack>
            </DialogTitle>
            <DialogContent dividers sx={{ py: 2.5 }}>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Stack spacing={2.25}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Description
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.75, whiteSpace: 'pre-wrap' }}>
                        {renderValue(
                          selectedPlan.description ||
                            'No detailed description has been added for this task yet.'
                        )}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Assigned Work
                      </Typography>
                      <Stack spacing={1} sx={{ mt: 1 }}>
                        <Card
                          variant="outlined"
                          sx={{
                            borderRadius: 2.5,
                            bgcolor: alpha(theme.palette.primary.main, 0.03),
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              justifyContent="space-between"
                              spacing={1.25}
                              sx={{ mb: 1.25 }}
                            >
                              <Box>
                                <Typography variant="subtitle2" fontWeight={700}>
                                  Execution Task Board
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  Break this roadmap task into daily actions, assign an owner, set
                                  the task date, and move work in sequence.
                                </Typography>
                              </Box>
                              <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={1}
                                useFlexGap
                                flexWrap="wrap"
                                alignItems={{ xs: 'stretch', sm: 'center' }}
                              >
                                <TextField
                                  size="small"
                                  select
                                  label="Task Status"
                                  value={selectedPlan.status}
                                  onChange={(event) =>
                                    handleDraftPlanStatusChange(event.target.value)
                                  }
                                  disabled={savingPlanId === selectedPlan.id}
                                  sx={{ minWidth: { xs: '100%', sm: 170 } }}
                                >
                                  {PLAN_STATUS_OPTIONS.map((option) => (
                                    <MenuItem key={option} value={option}>
                                      {option}
                                    </MenuItem>
                                  ))}
                                </TextField>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={handleAddWorkItem}
                                  disabled={savingPlanId === selectedPlan.id}
                                  startIcon={<Iconify icon="solar:add-circle-bold" width={16} />}
                                  sx={{
                                    ...getDialogActionButtonSx(theme, 'outlined'),
                                    borderColor: alpha(theme.palette.primary.main, 0.24),
                                    bgcolor: alpha(theme.palette.background.paper, 0.92),
                                  }}
                                >
                                  Add Task
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleSavePlanBoard(selectedPlan)}
                                  disabled={
                                    !selectedPlan.isDirty || savingPlanId === selectedPlan.id
                                  }
                                  startIcon={
                                    savingPlanId === selectedPlan.id ? (
                                      <CircularProgress size={14} color="inherit" />
                                    ) : (
                                      <Iconify icon="solar:diskette-bold" width={16} />
                                    )
                                  }
                                  sx={getDialogActionButtonSx(theme, 'contained')}
                                >
                                  {savingPlanId === selectedPlan.id ? 'Saving...' : 'Save Board'}
                                </Button>
                              </Stack>
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                              {selectedPlan.status === 'Completed'
                                ? 'This task is completed and can be reviewed against the planned dates and assigned users.'
                                : selectedPlan.status === 'On Hold'
                                  ? 'This task is on hold. Resume it only after the blocker or approval dependency is cleared.'
                                  : selectedPlan.status === 'In Progress' ||
                                      selectedPlan.status === 'Active'
                                    ? 'This task is actively being worked on. Review the assigned team and current schedule for execution follow-up.'
                                    : 'This task is pending and waiting for execution or prerequisite work to start.'}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', mt: 0.75 }}
                            >
                              Status options include Pending, In Progress, On Hold, and Completed.
                            </Typography>
                            <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                              {getPlanBoardItems(selectedPlan, project.assigned_users).map(
                                (item, index) => (
                                  <Card
                                    key={item.key}
                                    variant="outlined"
                                    sx={{
                                      borderRadius: 2,
                                      borderColor: item.isCurrent
                                        ? alpha(theme.palette.primary.main, 0.4)
                                        : undefined,
                                      bgcolor: item.isLocked
                                        ? alpha(theme.palette.grey[500], 0.05)
                                        : 'background.paper',
                                    }}
                                  >
                                    <CardContent sx={{ p: 1.5 }}>
                                      <Stack spacing={1.25}>
                                        <Stack
                                          direction={{ xs: 'column', sm: 'row' }}
                                          justifyContent="space-between"
                                          spacing={1}
                                        >
                                          <Stack
                                            direction="row"
                                            spacing={0.75}
                                            alignItems="center"
                                            flexWrap="wrap"
                                          >
                                            <Chip
                                              size="small"
                                              color={
                                                item.isCurrent
                                                  ? 'primary'
                                                  : item.isLocked
                                                    ? 'default'
                                                    : 'success'
                                              }
                                              label={item.title || `Task ${index + 1}`}
                                            />
                                            <Chip
                                              size="small"
                                              variant="outlined"
                                              label={item.sequenceLabel}
                                            />
                                            <Chip
                                              size="small"
                                              color={getChecklistTone(item.state)}
                                              label={getChecklistLabel(item.state)}
                                              onClick={() =>
                                                handleToggleWorkItem(selectedPlan, item)
                                              }
                                              disabled={
                                                !item.canAdvance || savingPlanId === selectedPlan.id
                                              }
                                              sx={{
                                                ...getChecklistChipSx(theme, item.state),
                                                cursor:
                                                  !item.canAdvance ||
                                                  savingPlanId === selectedPlan.id
                                                    ? 'not-allowed'
                                                    : 'pointer',
                                              }}
                                            />
                                            <Chip
                                              size="small"
                                              color={getWorkItemApprovalTone(item)}
                                              variant={
                                                getWorkItemApprovalStatus(item) === 'Approved'
                                                  ? 'filled'
                                                  : 'outlined'
                                              }
                                              label={getWorkItemApprovalLabel(item)}
                                            />
                                          </Stack>
                                          <Stack
                                            direction={{ xs: 'column', sm: 'row' }}
                                            spacing={1}
                                            useFlexGap
                                            flexWrap="wrap"
                                          >
                                            <Button
                                              size="small"
                                              color={
                                                getWorkItemApprovalStatus(item) === 'Approved'
                                                  ? 'success'
                                                  : 'primary'
                                              }
                                              variant={
                                                getWorkItemApprovalStatus(item) === 'Approved'
                                                  ? 'contained'
                                                  : 'outlined'
                                              }
                                              onClick={() =>
                                                handleApproveWorkItem(selectedPlan, item)
                                              }
                                              disabled={
                                                approvingWorkItemId === item.id ||
                                                getWorkItemApprovalStatus(item) === 'Approved' ||
                                                item.state !== 'Done'
                                              }
                                              startIcon={
                                                getWorkItemApprovalStatus(item) === 'Approved' ? (
                                                  <Iconify
                                                    icon="solar:verified-check-bold"
                                                    width={15}
                                                  />
                                                ) : (
                                                  <Iconify
                                                    icon="solar:shield-check-bold"
                                                    width={15}
                                                  />
                                                )
                                              }
                                              sx={{
                                                ...getDialogActionButtonSx(
                                                  theme,
                                                  getWorkItemApprovalStatus(item) === 'Approved'
                                                    ? 'contained'
                                                    : 'outlined'
                                                ),
                                              }}
                                            >
                                              {getWorkItemApprovalStatus(item) === 'Approved'
                                                ? 'Approved'
                                                : item.state === 'Done'
                                                  ? 'Approve Task'
                                                  : 'Await Done'}
                                            </Button>
                                            <Button
                                              color="inherit"
                                              size="small"
                                              onClick={() => handleRemoveWorkItem(item.key)}
                                              disabled={
                                                savingPlanId === selectedPlan.id ||
                                                getPlanChecklistItems(selectedPlan).length === 1
                                              }
                                              startIcon={
                                                <Iconify
                                                  icon="solar:trash-bin-trash-bold"
                                                  width={15}
                                                />
                                              }
                                              sx={{
                                                ...getDialogActionButtonSx(theme, 'outlined'),
                                                borderColor: alpha(theme.palette.error.main, 0.2),
                                              }}
                                            >
                                              Remove
                                            </Button>
                                          </Stack>
                                        </Stack>
                                        <Typography variant="caption" color="text.secondary">
                                          {item.sequenceHelper}
                                        </Typography>
                                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                                          <TextField
                                            size="small"
                                            label="Task Name"
                                            value={item.title}
                                            onChange={(event) =>
                                              handleDraftWorkItemChange(
                                                item.key,
                                                'title',
                                                event.target.value
                                              )
                                            }
                                            disabled={savingPlanId === selectedPlan.id}
                                            fullWidth
                                          />
                                          <TextField
                                            size="small"
                                            type="date"
                                            label="Task Date"
                                            value={item.scheduled_date || ''}
                                            onChange={(event) =>
                                              handleDraftWorkItemChange(
                                                item.key,
                                                'scheduled_date',
                                                event.target.value
                                              )
                                            }
                                            disabled={savingPlanId === selectedPlan.id}
                                            InputLabelProps={{ shrink: true }}
                                            sx={{ minWidth: { xs: '100%', md: 180 } }}
                                          />
                                        </Stack>
                                        <TextField
                                          select
                                          size="small"
                                          label="Owner"
                                          value={item.assigned_to?.id || ''}
                                          onChange={(event) => {
                                            const selectedUser =
                                              getAssignableUsers(
                                                project.assigned_users,
                                                selectedPlan
                                              ).find(
                                                (user) =>
                                                  String(user.id) === String(event.target.value)
                                              ) || null;
                                            handleDraftWorkItemChange(
                                              item.key,
                                              'assigned_to',
                                              selectedUser
                                            );
                                          }}
                                          disabled={savingPlanId === selectedPlan.id}
                                          fullWidth
                                        >
                                          <MenuItem value="">Unassigned</MenuItem>
                                          {getAssignableUsers(
                                            project.assigned_users,
                                            selectedPlan
                                          ).map((user) => (
                                            <MenuItem
                                              key={`plan-work-item-user-${selectedPlan.id}-${item.key}-${user.id}`}
                                              value={user.id}
                                            >
                                              {user.username}
                                            </MenuItem>
                                          ))}
                                        </TextField>
                                        <Chip
                                          size="small"
                                          variant="outlined"
                                          color="info"
                                          label={`Scheduled: ${formatDate(item.scheduled_date, 'Not set')}`}
                                          sx={{ alignSelf: 'flex-start' }}
                                        />
                                        <TextField
                                          size="small"
                                          label="Assignee remarks / issues"
                                          placeholder="Assigned person can note blockers, updates, risks, or handoff remarks here"
                                          value={item.notes || ''}
                                          onChange={(event) =>
                                            handleDraftWorkItemChange(
                                              item.key,
                                              'notes',
                                              event.target.value
                                            )
                                          }
                                          disabled={savingPlanId === selectedPlan.id}
                                          fullWidth
                                          multiline
                                          minRows={2}
                                        />
                                      </Stack>
                                    </CardContent>
                                  </Card>
                                )
                              )}
                            </Stack>
                            {selectedPlan.isDirty ? (
                              <Typography
                                variant="caption"
                                color="warning.main"
                                sx={{ display: 'block', mt: 1.25 }}
                              >
                                You have unsaved task-board changes. Click Save Board to persist
                                task names, dates, owners, assignee remarks/issues, and sequence.
                              </Typography>
                            ) : null}
                          </CardContent>
                        </Card>
                      </Stack>
                    </Box>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Stack spacing={2}>
                    <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                          Schedule
                        </Typography>
                        <Stack spacing={1.25}>
                          <DetailItem
                            label="Start Date"
                            value={formatDate(selectedPlan.start_date)}
                          />
                          <DetailItem label="End Date" value={formatDate(selectedPlan.end_date)} />
                          <DetailItem
                            label="Duration"
                            value={`${selectedPlan.duration_days || 0} days`}
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                    <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                          Assigned Team
                        </Typography>
                        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                          {selectedPlan.assignedUsers?.length ? (
                            selectedPlan.assignedUsers.map((user) => (
                              <Chip
                                key={`selected-plan-${selectedPlan.id || selectedPlan.serial_no}-${user.id}`}
                                size="small"
                                label={user.username}
                              />
                            ))
                          ) : (
                            <Chip size="small" variant="outlined" label="Unassigned" />
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions
              sx={{
                px: 3,
                py: 2.25,
                borderTop: `1px solid ${alpha(theme.palette.grey[500], 0.14)}`,
                bgcolor: alpha(theme.palette.background.neutral || theme.palette.grey[500], 0.04),
              }}
            >
              <Button
                onClick={closePlanDetails}
                color="inherit"
                sx={{
                  ...getDialogActionButtonSx(theme, 'outlined'),
                  borderColor: alpha(theme.palette.grey[500], 0.22),
                }}
              >
                Close
              </Button>
              <Button
                component={RouterLink}
                href={paths.dashboard.projectManagements.taskManagement.detail(
                  project.id,
                  selectedPlan.id || selectedPlan.serial_no
                )}
                variant="contained"
                startIcon={<Iconify icon="solar:arrow-right-up-bold" width={16} />}
                sx={{
                  ...getDialogActionButtonSx(theme, 'contained'),
                  background: `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, ${theme.palette.grey[800]} 100%)`,
                }}
              >
                Open Task Page
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>

      <Dialog
        open={!!selectedWorkloadDetail}
        onClose={closeWorkloadDetail}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}
      >
        {selectedWorkloadDetail ? (
          <>
            <DialogTitle sx={{ pb: 1.5 }}>
              <Stack spacing={1.25}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip size="small" color="primary" label={selectedWorkloadDetail.user.username} />
                  <Chip size="small" variant="outlined" label={`${assigneeTimeView} slot`} />
                  <Chip
                    size="small"
                    label={selectedWorkloadDetail.slot.signalLabel}
                    color={getSlotVisualTone(selectedWorkloadDetail.slot)}
                  />
                </Stack>
                <Typography variant="h6" fontWeight={800}>
                  Assigned work in {selectedWorkloadDetail.slot.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedWorkloadDetail.slot.rangeLabel} • Opened from the roadmap workload sheet.
                </Typography>
              </Stack>
            </DialogTitle>
            <DialogContent dividers sx={{ py: 2.5 }}>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2.5, height: '100%' }}>
                    <CardContent sx={{ p: 2.25 }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                        Workload Summary
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={0.75}
                        useFlexGap
                        flexWrap="wrap"
                        sx={{ mb: 1.5 }}
                      >
                        <Chip
                          size="small"
                          color="success"
                          label={`Doing ${selectedWorkloadDetail.slot.inProgress}`}
                          sx={getChecklistChipSx(theme, 'Doing')}
                        />
                        <Chip
                          size="small"
                          color="success"
                          label={`Done ${selectedWorkloadDetail.slot.completed}`}
                        />
                        <Chip
                          size="small"
                          color="warning"
                          label={`Remaining ${selectedWorkloadDetail.slot.pending}`}
                        />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {selectedWorkloadDetail.slot.total} execution item
                        {selectedWorkloadDetail.slot.total === 1 ? '' : 's'} fall in this slot. Use
                        the cards on the right to review who owns the work, what is already done
                        early, and what has shifted forward.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Stack spacing={1.5}>
                    {selectedWorkloadDetail.slot.tasks.map((task) => (
                      <Card
                        key={`workload-${selectedWorkloadDetail.user.id}-${selectedWorkloadDetail.slot.key}-${task.id || task.serial_no}`}
                        variant="outlined"
                        sx={{ borderRadius: 2.5 }}
                      >
                        <CardContent sx={{ p: 2.25 }}>
                          <Stack spacing={1.25}>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              flexWrap="wrap"
                              justifyContent="space-between"
                            >
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                flexWrap="wrap"
                              >
                                <Typography variant="subtitle2" fontWeight={800}>
                                  {task.title}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={task.status}
                                  color={getStatusTone(task.status)}
                                />
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(task.start_date)} → {formatDate(task.end_date)}
                              </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              {renderValue(
                                task.description ||
                                  'No detailed task note exists yet. Use the task board below to assign owners and track execution.'
                              )}
                            </Typography>
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', mb: 0.75 }}
                              >
                                Task work tracker
                              </Typography>
                              <Stack spacing={0.75}>
                                {selectedWorkloadDetail.slot.entries
                                  .filter(
                                    (entry) =>
                                      String(entry.planId) === String(task.id) &&
                                      (selectedWorkloadDetail.user.id === 'all' ||
                                        String(entry.assigned_to?.id || '') ===
                                          String(selectedWorkloadDetail.user.id))
                                  )
                                  .map((item) => (
                                    <Stack
                                      key={item.key}
                                      direction="row"
                                      spacing={1}
                                      alignItems="flex-start"
                                    >
                                      <Chip
                                        size="small"
                                        color={getChecklistTone(item.state)}
                                        label={getChecklistLabel(item.state)}
                                        onClick={() => handleToggleWorkItem(task, item)}
                                        disabled={!item.canAdvance || savingPlanId === task.id}
                                        sx={{
                                          ...getChecklistChipSx(theme, item.state),
                                          mt: 0.1,
                                          cursor:
                                            !item.canAdvance || savingPlanId === task.id
                                              ? 'not-allowed'
                                              : 'pointer',
                                        }}
                                      />
                                      <Box sx={{ flex: 1 }}>
                                        <Typography
                                          component="button"
                                          type="button"
                                          variant="body2"
                                          onClick={() => openAssignmentWorkItem(task, item)}
                                          sx={{
                                            p: 0,
                                            border: 'none',
                                            background: 'transparent',
                                            color: 'primary.main',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            fontWeight: 700,
                                            '&:hover': { textDecoration: 'underline' },
                                          }}
                                        >
                                          {item.title}
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          color={item.isLocked ? 'warning.main' : 'text.disabled'}
                                        >
                                          {item.assigned_to?.username
                                            ? `Owner: ${item.assigned_to.username} • `
                                            : ''}
                                          {item.plannedDate
                                            ? `Planned: ${formatDateRange(item.plannedDate, item.plannedEndDate)} • `
                                            : ''}
                                          {item.effectiveDate &&
                                          formatDate(item.effectiveDate) !==
                                            formatDate(item.plannedDate)
                                            ? `In slot: ${formatDate(item.effectiveDate)} • `
                                            : ''}
                                          {item.sequenceHelper}
                                        </Typography>
                                        {item.notes ? (
                                          <Typography
                                            variant="caption"
                                            color="info.main"
                                            sx={{ display: 'block', mt: 0.45 }}
                                          >
                                            Remarks / issues: {item.notes}
                                          </Typography>
                                        ) : null}
                                      </Box>
                                    </Stack>
                                  ))}
                              </Stack>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={closeWorkloadDetail} color="inherit">
                Close
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>
    </Box>
  );
}
