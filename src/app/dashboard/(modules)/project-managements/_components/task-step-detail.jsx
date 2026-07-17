'use client';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useRef, useMemo, useState, useEffect } from 'react';

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
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import CardContent from '@mui/material/CardContent';
import { alpha, useTheme } from '@mui/material/styles';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import {
  flattenProjectTasks,
  normalizeAssignedUsers,
  normalizePlanWorkItems,
  useProjectManagementTask,
  updateProjectManagementPlan,
  approveProjectManagementPlan,
  approveProjectManagementWorkItem,
} from './use-project-managements-api';

const ITERATION_COLORS = ['#ff9f43', '#ff3d71', '#6c2bd9'];
const ROADMAP_TABS = ['daily', 'weekly', 'monthly', 'yearly'];
const PLAN_STATUS_OPTIONS = ['Pending', 'In Progress', 'On Hold', 'Completed'];
const TASK_STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'Todo', label: 'Pending' },
  { value: 'Doing', label: 'Doing' },
  { value: 'Done', label: 'Done' },
];
const TASK_DESCRIPTION_DUMMY_HTML = `
  <p><strong>Demo task overview:</strong> This is sample rich text so you can immediately verify the task details layout.</p>
  <p>The task details page can show formatted paragraphs, emphasis, and structured checklist-style content for the selected roadmap step.</p>
  <ul>
    <li>Review the scope and expected output for the assigned task</li>
    <li>Coordinate day-by-day execution with the assigned owner</li>
    <li>Track blockers, evidence, and follow-up notes clearly</li>
  </ul>
  <p><em>Replace this demo content with the real task description whenever you are ready.</em></p>
`;

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

function getApprovalTone(status) {
  if (status === 'Approved') return 'success';
  return 'default';
}

function getApprovalStatus(plan) {
  return plan?.approvalStatus || plan?.approval_status || 'Pending Approval';
}

function getApprovalLabel(plan) {
  const approvalStatus = getApprovalStatus(plan);
  const planStatus = plan?.status || '';

  if (approvalStatus === 'Approved') return 'Approved';
  if (planStatus === 'Completed') return 'Pending Approval';
  return 'Not Ready';
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

function renderValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  return value;
}

function getExecutionGroupTitle(group, fallback = 'Untitled task') {
  const titles = (group?.entries || []).map((entry) => String(entry?.title || '').trim()).filter(Boolean);

  if (!titles.length) return fallback;
  if (titles.length === 1) return titles[0];

  return `${titles[0]} +${titles.length - 1}`;
}

function getDescriptionMarkup(value) {
  if (!value) return '';

  const description = String(value).trim();
  const containsHtml = /<[^>]+>/i.test(description);

  return containsHtml ? description : description.replace(/\n/g, '<br />');
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

function matchesWorkItemStatus(state, filter) {
  if (!filter || filter === 'all') return true;
  return state === filter;
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
  const assignedUsers = plan.assignedUsers || normalizeAssignedUsers(plan.assigned_users);

  return normalizePlanWorkItems(plan.work_items || plan.workItems, plan, assignedUsers).map(
    (item, index) => ({
      ...item,
      scheduled_date: item.scheduled_date || getDefaultWorkItemDate(plan, index),
      key: item.id || `${plan.id || plan.serial_no || plan.title}-work-item-${index + 1}`,
    })
  );
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
    sequenceHelper: item.state === 'Done' ? 'Marked completed.' : 'This task can be updated anytime.',
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

function normalizePlanForDialog(plan) {
  const assignedUsers = plan.assignedUsers || normalizeAssignedUsers(plan.assigned_users);

  return {
    ...plan,
    assignedUsers,
    work_items: getPlanChecklistItems({
      ...plan,
      assignedUsers,
    }),
    isDirty: Boolean(plan.isDirty),
  };
}

function buildPlanWorkItemPayload(plan, workItems) {
  const assignedUsers = plan.assignedUsers || normalizeAssignedUsers(plan.assigned_users);
  const fallbackAssigneeId = assignedUsers[0]?.id || null;

  return {
    status: plan.status,
    work_items: workItems.map((item, index) => ({
      id: item.id || undefined,
      title: item.title,
      state: item.state,
      notes: item.notes || '',
      sort_order: item.sort_order || index + 1,
      scheduled_date: item.scheduled_date || getDefaultWorkItemDate(plan, index),
      scheduled_end_date: item.scheduled_end_date || null,
      assigned_to_id: item.assigned_to?.id || fallbackAssigneeId,
    })),
  };
}

function getTaskStatusBucket(status) {
  if (status === 'Completed') return 'completed';
  if (status === 'On Hold') return 'blocked';
  if (status === 'In Progress' || status === 'Active') return 'inProgress';
  return 'pending';
}

function getTaskHealth(plan, projectStatus) {
  const today = dayjs().startOf('day');
  const statusBucket = getTaskStatusBucket(plan.status);
  const endDate = dayjs(plan.end_date || plan.start_date || today).endOf('day');

  if (statusBucket === 'blocked') return 'blocked';
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

function summarizeTasksForSlot(
  tasks,
  projectStatus,
  slot,
  projectUsers = [],
  assigneeId = null,
  statusFilter = 'all'
) {
  const entries = getExecutionEntriesForSlot(tasks, slot, projectUsers, assigneeId).filter(
    (entry) => matchesWorkItemStatus(entry.state, statusFilter)
  );
  return buildEntrySummary(entries, projectStatus, slot.start, slot.end, {
    key: slot.key,
    label: slot.label,
    start: slot.start,
    end: slot.end,
  });
}

function summarizeTasksForEntryKeys(tasks, projectStatus, slot, projectUsers = [], assigneeId = null, statusFilter = 'all', entryKeys = []) {
  const summary = summarizeTasksForSlot(tasks, projectStatus, slot, projectUsers, assigneeId, statusFilter);

  if (!entryKeys.length) {
    return {
      ...summary,
      entryKeys: [],
    };
  }

  const entryKeySet = new Set(entryKeys.map((entryKey) => String(entryKey)));
  const filteredEntries = summary.entries.filter((entry) => entryKeySet.has(String(entry.entryKey)));

  return buildEntrySummary(filteredEntries, projectStatus, slot.start, slot.end, {
    key: slot.key,
    label: slot.label,
    start: slot.start,
    end: slot.end,
    entryKeys: Array.from(entryKeySet),
  });
}

function buildExecutionRangeGroups(tasks, projectStatus, slots, projectUsers = [], assigneeId = null, statusFilter = 'all') {
  const entries = tasks
    .flatMap((plan) => buildShiftedWorkItemSchedule(plan, projectUsers))
    .filter((entry) =>
      !assigneeId ? true : String(entry.assigned_to?.id || '') === String(assigneeId)
    )
    .filter((entry) => matchesWorkItemStatus(entry.state, statusFilter));

  const groupedRanges = new Map();

  entries.forEach((entry, index) => {
    const rangeStart = (entry.effectiveStartDate || entry.plannedDate || entry.effectiveDate).startOf('day');
    const rangeEnd = (entry.effectiveEndDate || entry.plannedEndDate || entry.effectiveDate || entry.plannedDate).startOf('day');
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

function buildTaskAssigneeAnalytics(
  task,
  slots,
  projectStatus,
  projectUsers = [],
  statusFilter = 'all'
) {
  const normalizedTask = normalizePlanForDialog(task);
  const boardItems = getPlanBoardItems(normalizedTask, projectUsers);
  const registry = new Map();

  normalizeAssignedUsers(normalizedTask.assignedUsers || normalizedTask.assigned_users).forEach(
    (user) => {
      if (!user?.id) return;
      registry.set(String(user.id), user);
    }
  );

  boardItems.forEach((item) => {
    if (!item.assigned_to?.id) return;
    registry.set(String(item.assigned_to.id), item.assigned_to);
  });

  return Array.from(registry.values())
    .map((user) => {
      const assignedEntries = buildShiftedWorkItemSchedule(normalizedTask, projectUsers).filter(
        (entry) =>
          String(entry.assigned_to?.id || '') === String(user.id) &&
          matchesWorkItemStatus(entry.state, statusFilter)
      );
      const completed = assignedEntries.filter((entry) => entry.state === 'Done').length;
      const inProgress = assignedEntries.filter((entry) => entry.state === 'Doing').length;
      const pending = assignedEntries.filter((entry) => entry.state === 'Todo').length;

      return {
        ...user,
        plans: assignedEntries.length ? [normalizedTask] : [],
        completed,
        inProgress,
        pending,
        progress: assignedEntries.length
          ? Math.round((completed / assignedEntries.length) * 100)
          : 0,
        nextDuePlan: assignedEntries.length ? normalizedTask : null,
        slotSummary: slots.map((slot) =>
          summarizeTasksForSlot(
            [normalizedTask],
            projectStatus,
            slot,
            projectUsers,
            user.id,
            statusFilter
          )
        ),
      };
    })
    .filter((user) => user.slotSummary.some((slot) => slot.total));
}

function getTimelineRange(project) {
  const planDates = (project?.plans || []).flatMap((plan) => {
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
  const candidates = [project?.start_date, project?.end_date, ...planDates]
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

  return {
    start: validDates.reduce(
      (min, current) => (current.isBefore(min) ? current : min),
      validDates[0]
    ),
    end: validDates.reduce((max, current) => (current.isAfter(max) ? current : max), validDates[0]),
  };
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

function buildTimeline(project, selectedTaskId, cadence = 'weekly') {
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
    if (lastGroup && lastGroup.key === slot.monthKey) lastGroup.span += 1;
    else monthGroups.push({ key: slot.monthKey, label: slot.monthLabel, span: 1 });
  });

  const quarterGroups = [];
  slots.forEach((slot) => {
    const lastGroup = quarterGroups[quarterGroups.length - 1];
    if (lastGroup && lastGroup.key === slot.quarterKey) lastGroup.span += 1;
    else quarterGroups.push({ key: slot.quarterKey, label: slot.quarterLabel, span: 1 });
  });

  const rows = (project?.plans || []).map((plan, index) => {
    const planStart = dayjs(plan.start_date || project?.start_date || start).startOf('day');
    const planEnd = dayjs(plan.end_date || plan.start_date || project?.end_date || end).endOf(
      'day'
    );
    let startIndex = slots.findIndex(
      (slot) =>
        planStart.isBefore(slot.end.endOf('day').add(1, 'millisecond')) &&
        planEnd.isAfter(slot.start.startOf('day').subtract(1, 'millisecond'))
    );
    let endIndex = slots.findIndex(
      (slot) =>
        planEnd.isBefore(slot.end.endOf('day').add(1, 'millisecond')) &&
        planEnd.isAfter(slot.start.startOf('day').subtract(1, 'millisecond'))
    );

    if (startIndex < 0) startIndex = 0;
    if (endIndex < 0) endIndex = slots.length - 1;
    if (endIndex < startIndex) endIndex = startIndex;

    return {
      ...plan,
      assignedUsers: normalizeAssignedUsers(plan.assigned_users),
      startIndex,
      endIndex,
      span: endIndex - startIndex + 1,
      color: ITERATION_COLORS[index % ITERATION_COLORS.length],
      isSelected: String(plan.id) === String(selectedTaskId),
    };
  });

  return {
    rows,
    weeks: slots,
    monthGroups,
    quarterGroups,
    scaleLabel: getScaleLabel(cadence),
    selectedRow: rows.find((row) => row.isSelected) || null,
  };
}

export default function TaskStepDetail({ projectId, taskId }) {
  const theme = useTheme();
  const { task, project, isLoading, error } = useProjectManagementTask(projectId, taskId);
  const roadmapScrollRef = useRef(null);
  const roadmapDragStateRef = useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
    didDrag: false,
  });
  const [timeView, setTimeView] = useState('weekly');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedWorkloadDetail, setSelectedWorkloadDetail] = useState(null);
  const [projectState, setProjectState] = useState(null);
  const [savingPlanId, setSavingPlanId] = useState(null);
  const [approvingPlanId, setApprovingPlanId] = useState(null);
  const [approvingWorkItemId, setApprovingWorkItemId] = useState(null);

  useEffect(() => {
    setProjectState(project || null);
  }, [project]);

  const projectView = projectState || project;

  const taskView = useMemo(() => {
    if (!projectView) return task;

    return (
      flattenProjectTasks([projectView]).find(
        (item) => String(item.projectId) === String(projectId) && String(item.id) === String(taskId)
      ) || task
    );
  }, [projectId, projectView, task, taskId]);

  const timeline = useMemo(
    () => (projectView ? buildTimeline(projectView, taskId, timeView) : null),
    [projectView, taskId, timeView]
  );
  const visibleTimelineRows = useMemo(
    () => (timeline?.selectedRow ? [timeline.selectedRow] : timeline?.rows || []),
    [timeline]
  );
  const taskAssigneeAnalytics = useMemo(
    () =>
      taskView && timeline
        ? buildTaskAssigneeAnalytics(
            taskView,
            timeline.weeks || [],
            projectView?.status,
            projectView?.assigned_users || [],
            taskStatusFilter
          )
        : [],
    [taskView, timeline, projectView, taskStatusFilter]
  );
  const taskDescriptionMarkup =
    getDescriptionMarkup(taskView?.description) || TASK_DESCRIPTION_DUMMY_HTML;
  const filteredSelectedPlanItems = selectedPlan
    ? getPlanBoardItems(selectedPlan, projectView?.assigned_users || []).filter((item) =>
        matchesWorkItemStatus(item.state, taskStatusFilter)
      )
    : [];
  const taskFilterCounts = useMemo(() => {
    const items = taskView ? getPlanBoardItems(taskView, projectView?.assigned_users || []) : [];

    return {
      all: items.length,
      Todo: items.filter((item) => item.state === 'Todo').length,
      Doing: items.filter((item) => item.state === 'Doing').length,
      Done: items.filter((item) => item.state === 'Done').length,
    };
  }, [taskView, projectView]);
  const canApproveTask =
    taskView?.status === 'Completed' && getApprovalStatus(taskView) !== 'Approved';

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

  const openPlanDetails = (plan) => {
    const targetTaskId = plan?.id || plan?.serial_no;

    if (!targetTaskId) {
      setSelectedPlan(normalizePlanForDialog(plan));
      return;
    }

    window.open(
      paths.dashboard.projectManagements.taskManagement.assignment(projectId, targetTaskId),
      '_blank',
      'noopener,noreferrer'
    );
  };
  const openAssignmentWorkItem = (plan, item) => {
    const targetTaskId = plan?.id || plan?.serial_no;
    const workItemId = item?.id || item?.key;
    const assigneeId = item?.assigned_to?.id
      || (selectedWorkloadDetail?.user?.id && String(selectedWorkloadDetail.user.id) !== 'all'
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
      `${paths.dashboard.projectManagements.taskManagement.assignment(projectId, targetTaskId)}?${params.toString()}`,
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
        tasks: slot.tasks.map((taskItem) => normalizePlanForDialog(taskItem)),
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

  const updatePlanInState = (updatedPlan) => {
    setProjectState((currentProject) => {
      if (!currentProject) return currentProject;

      return {
        ...currentProject,
        plans: (currentProject.plans || []).map((plan) =>
          String(plan.id) === String(updatedPlan.id)
            ? {
                ...plan,
                ...updatedPlan,
                assigned_users: updatedPlan.assigned_users || plan.assigned_users,
              }
            : plan
        ),
      };
    });

    setSelectedPlan((currentPlan) => {
      if (!currentPlan || String(currentPlan.id) !== String(updatedPlan.id)) return currentPlan;
      return normalizePlanForDialog({
        ...currentPlan,
        ...updatedPlan,
        assigned_users: updatedPlan.assigned_users || currentPlan.assigned_users,
      });
    });

    setSelectedWorkloadDetail((currentDetail) => {
      if (!currentDetail || String(updatedPlan.id) !== String(taskId)) return currentDetail;

      const normalizedTask = normalizePlanForDialog({
        ...taskView,
        ...updatedPlan,
        assigned_users: updatedPlan.assigned_users || taskView?.assigned_users,
      });
      const nextSlot = summarizeTasksForEntryKeys(
        [normalizedTask],
        projectView?.status,
        currentDetail.slot,
        projectView?.assigned_users || [],
        currentDetail.user?.id === 'all' ? null : currentDetail.user?.id,
        taskStatusFilter,
        currentDetail.slot.entryKeys || []
      );

      return {
        ...currentDetail,
        slot: {
          ...nextSlot,
          tasks: nextSlot.tasks.map((taskItem) => normalizePlanForDialog(taskItem)),
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
        createEmptyWorkItem(prev, projectView?.assigned_users || []),
      ],
    }));
  };

  const handleApproveTask = async () => {
    if (!taskView?.id || !canApproveTask) return;

    setApprovingPlanId(taskView.id);

    try {
      const updatedPlan = await approveProjectManagementPlan(taskView.id, projectId);
      updatePlanInState(updatedPlan);
      toast.success('Task approved successfully.');
    } catch (approvalError) {
      toast.error(approvalError?.detail || approvalError?.message || 'Failed to approve task.');
    } finally {
      setApprovingPlanId(null);
    }
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
      const updatedPlan = await updateProjectManagementPlan(
        plan.id,
        buildPlanWorkItemPayload(plan, getPlanChecklistItems(plan))
      );

      updatePlanInState(updatedPlan);
    } finally {
      setSavingPlanId(null);
    }
  };

  const handleApproveBoardWorkItem = async (plan, workItem) => {
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

      updatePlanInState({
        id: plan.id,
        work_items: getPlanChecklistItems(plan).map((item) =>
          String(item.id || item.key) === String(updatedWorkItem.id)
            ? {
                ...item,
                ...updatedWorkItem,
              }
            : item
        ),
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

  const toggleChecklistItem = async (plan, workItem) => {
    if (!plan?.id) return;

    const planBoard = getPlanBoardItems(plan, projectView?.assigned_users || []);
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
      const updatedPlan = await updateProjectManagementPlan(
        plan.id,
        buildPlanWorkItemPayload(plan, nextItems)
      );

      updatePlanInState(updatedPlan);
    } finally {
      setSavingPlanId(null);
    }
  };

  if (isLoading) {
    return (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Loading task step...
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (error || !taskView) {
    return <Alert severity="error">Unable to load the selected task step.</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Card
        sx={{
          mb: 3,
          borderRadius: 4,
          color: 'common.white',
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 55%, ${theme.palette.secondary.main} 100%)`,
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
            <Box>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                sx={{ mb: 1.25 }}
              >
                <Chip
                  label={`SL ${taskView.serialNo}`}
                  size="small"
                  sx={{ bgcolor: alpha('#ffffff', 0.14), color: 'common.white' }}
                />
                <Chip
                  label={taskView.status}
                  size="small"
                  sx={{ bgcolor: alpha('#ffffff', 0.14), color: 'common.white' }}
                />
                <Chip
                  label={getApprovalLabel(taskView)}
                  size="small"
                  sx={{ bgcolor: alpha('#ffffff', 0.14), color: 'common.white' }}
                />
                <Chip
                  label={projectView?.code || 'Project'}
                  size="small"
                  sx={{ bgcolor: alpha('#ffffff', 0.14), color: 'common.white' }}
                />
                <Chip
                  label="Roadmap View"
                  size="small"
                  sx={{ bgcolor: alpha('#ffffff', 0.14), color: 'common.white' }}
                />
              </Stack>
              <Typography variant="h4" fontWeight={800}>
                {taskView.title}
              </Typography>
              <Typography
                variant="body1"
                sx={{ mt: 1.25, color: alpha('#ffffff', 0.84), maxWidth: 900 }}
              >
                Showing this single roadmap step with the same execution-board view as project
                details, but focused only on this task and its assigned team.
              </Typography>
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.25}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              sx={{ flexShrink: 0 }}
            >
              <Button
                size="small"
                variant={getApprovalStatus(taskView) === 'Approved' ? 'contained' : 'outlined'}
                color={getApprovalStatus(taskView) === 'Approved' ? 'success' : 'inherit'}
                disabled={
                  approvingPlanId === taskView.id ||
                  getApprovalStatus(taskView) === 'Approved' ||
                  taskView.status !== 'Completed'
                }
                onClick={handleApproveTask}
                sx={{
                  alignSelf: { xs: 'stretch', sm: 'center' },
                  minHeight: 38,
                  px: 1.75,
                  borderRadius: 2.5,
                  borderColor: alpha('#ffffff', 0.24),
                  bgcolor:
                    getApprovalStatus(taskView) === 'Approved'
                      ? 'common.white'
                      : alpha('#ffffff', 0.04),
                  color:
                    getApprovalStatus(taskView) === 'Approved' ? 'success.main' : 'common.white',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  backdropFilter: 'blur(8px)',
                  '&:hover': {
                    borderColor: alpha('#ffffff', 0.4),
                    bgcolor:
                      getApprovalStatus(taskView) === 'Approved'
                        ? alpha('#ffffff', 0.94)
                        : alpha('#ffffff', 0.1),
                  },
                }}
              >
                {getApprovalStatus(taskView) === 'Approved'
                  ? 'Approved'
                  : taskView.status === 'Completed'
                    ? 'Approve Task'
                    : 'Await Completion'}
              </Button>
              <Button
                component={RouterLink}
                href={paths.dashboard.projectManagements.taskManagement.allTasks}
                variant="outlined"
                color="inherit"
                size="small"
                sx={{
                  alignSelf: { xs: 'stretch', sm: 'center' },
                  minHeight: 38,
                  px: 1.75,
                  borderRadius: 2.5,
                  borderColor: alpha('#ffffff', 0.24),
                  bgcolor: alpha('#ffffff', 0.04),
                  color: 'common.white',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  backdropFilter: 'blur(8px)',
                  '&:hover': {
                    borderColor: alpha('#ffffff', 0.4),
                    bgcolor: alpha('#ffffff', 0.1),
                  },
                }}
              >
                Back to All Tasks
              </Button>
              <Button
                component={RouterLink}
                href={paths.dashboard.projectManagements.projects.detail(projectId)}
                variant="contained"
                size="small"
                disableElevation
                sx={{
                  alignSelf: { xs: 'stretch', sm: 'center' },
                  minHeight: 38,
                  px: 1.9,
                  borderRadius: 2.5,
                  bgcolor: 'common.white',
                  color: 'primary.main',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  boxShadow: `0 10px 22px ${alpha(theme.palette.common.black, 0.14)}`,
                  '&:hover': {
                    bgcolor: alpha('#ffffff', 0.96),
                    boxShadow: `0 12px 24px ${alpha(theme.palette.common.black, 0.18)}`,
                  },
                }}
              >
                Open Project
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
              <Chip
                size="small"
                color="primary"
                label={taskView.projectTitle || projectView?.title || 'Project'}
              />
              {projectView?.code ? (
                <Chip size="small" variant="outlined" label={projectView.code} />
              ) : null}
              <Chip size="small" label={taskView.status} color={getStatusTone(taskView.status)} />
              <Chip
                size="small"
                label={getApprovalLabel(taskView)}
                color={getApprovalTone(getApprovalStatus(taskView))}
                variant={getApprovalStatus(taskView) === 'Approved' ? 'filled' : 'outlined'}
              />
            </Stack>
            <Box>
              <Typography variant="h4" fontWeight={800} sx={{ mb: 0.75 }}>
                {taskView.projectTitle || projectView?.title || 'Project details'}
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
                {taskView.title}
              </Typography>
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                This rich text block uses the selected task plan&apos;s description from the NGO
                Project Plans API. If the description contains HTML, this page renders it as
                formatted content.
              </Alert>
              <Box
                sx={{
                  fontSize: '1rem',
                  lineHeight: 1.9,
                  color: 'text.secondary',
                  '& p': { mt: 0, mb: 1.5 },
                  '& p:last-child': { mb: 0 },
                  '& ul, & ol': { pl: 3, mb: 1.5 },
                  '& li': { mb: 0.5 },
                }}
                dangerouslySetInnerHTML={{ __html: taskDescriptionMarkup }}
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, order: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2.5 }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Project Plan Roadmap
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                This page mirrors the project roadmap card pattern, but only for the selected task.
              </Typography>
            </Box>
            <Stack spacing={1.5} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
              <Tabs
                value={timeView}
                onChange={(_, value) => setTimeView(value)}
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
                {ROADMAP_TABS.map((tab) => (
                  <Tab key={tab} value={tab} label={tab} />
                ))}
              </Tabs>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip size="small" color="primary" label="Selected step" />
                <Chip size="small" variant="outlined" label={taskView.projectTitle} />
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {TASK_STATUS_FILTERS.map((filter) => (
                  <Chip
                    key={filter.value}
                    size="small"
                    icon={
                      taskStatusFilter === filter.value ? (
                        <Box
                          component="span"
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            bgcolor: 'currentColor',
                          }}
                        />
                      ) : undefined
                    }
                    label={`${filter.label} ${taskFilterCounts[filter.value] ?? 0}`}
                    clickable
                    color={taskStatusFilter === filter.value ? 'primary' : 'default'}
                    variant={taskStatusFilter === filter.value ? 'filled' : 'outlined'}
                    onClick={() => setTaskStatusFilter(filter.value)}
                    sx={{
                      fontWeight: taskStatusFilter === filter.value ? 800 : 700,
                      boxShadow: taskStatusFilter === filter.value ? theme.shadows[2] : 'none',
                      '& .MuiChip-icon': {
                        ml: 0.75,
                        mr: -0.25,
                      },
                    }}
                  />
                ))}
              </Stack>
            </Stack>
          </Stack>

          {timeline && visibleTimelineRows.length > 0 ? (
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
                  gridTemplateColumns: `290px repeat(${timeline.weeks.length}, minmax(40px, 1fr))`,
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
                >
                  <Typography variant="caption" fontWeight={700}>
                    {timeline.scaleLabel}
                  </Typography>
                </Box>
                {timeline.weeks.map((slot, index) => (
                  <Box
                    key={slot.key}
                    sx={{
                      position: 'sticky',
                      top: 89,
                      zIndex: 6,
                      p: 0.4,
                      minHeight: 30,
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
                      {slot.label}
                    </Typography>
                  </Box>
                ))}

                {visibleTimelineRows.map((plan, rowIndex) => {
                  const planRangeGroups = buildExecutionRangeGroups(
                    [plan],
                    projectView?.status,
                    timeline.weeks,
                    projectView?.assigned_users || [],
                    null,
                    taskStatusFilter
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
                          p: 1.2,
                          borderTop: `1px solid ${theme.palette.divider}`,
                          borderRight: `1px solid ${theme.palette.divider}`,
                          bgcolor: 'background.paper',
                          backgroundImage: `linear-gradient(${plan.isSelected ? alpha(theme.palette.primary.main, 0.12) : rowIndex % 2 === 0 ? alpha(theme.palette.secondary.main, 0.08) : alpha(theme.palette.secondary.main, 0.03)}, ${plan.isSelected ? alpha(theme.palette.primary.main, 0.12) : rowIndex % 2 === 0 ? alpha(theme.palette.secondary.main, 0.08) : alpha(theme.palette.secondary.main, 0.03)})`,
                          boxShadow: plan.isSelected
                            ? `inset 4px 0 0 ${theme.palette.primary.main}`
                            : 'none',
                          position: 'sticky',
                          left: 0,
                          zIndex: 5,
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: 'background.paper',
                            backgroundImage: `linear-gradient(${alpha(theme.palette.primary.main, plan.isSelected ? 0.16 : 0.08)}, ${alpha(theme.palette.primary.main, plan.isSelected ? 0.16 : 0.08)})`,
                          },
                        }}
                        onClick={() => openPlanDetails(plan)}
                      >
                        <Stack spacing={0.7}>
                          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                            <Chip
                              label={`SL ${plan.serial_no}`}
                              size="small"
                              color={plan.isSelected ? 'primary' : 'default'}
                            />
                            <Typography
                              variant="subtitle2"
                              fontWeight={800}
                              noWrap
                              sx={{ maxWidth: 150 }}
                            >
                              {plan.title}
                            </Typography>
                            <Chip
                              size="small"
                              label={getRoadmapStatusLabel(plan.status)}
                              color={getStatusTone(plan.status)}
                            />
                            {plan.isSelected ? (
                              <Chip size="small" color="primary" label="Selected Step" />
                            ) : null}
                          </Stack>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" alignItems="center">
                            <Chip
                              size="small"
                              variant="outlined"
                              label={`${formatDate(plan.start_date)} → ${formatDate(plan.end_date)}`}
                            />
                            {plan.duration_days ? (
                              <Chip
                                size="small"
                                variant="outlined"
                                label={`${plan.duration_days}d`}
                              />
                            ) : null}
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

                      {timeline.weeks.map((slot, slotIndex) => {
                        const isActive = slotIndex >= plan.startIndex && slotIndex <= plan.endIndex;
                        const isStart = slotIndex === plan.startIndex;
                        const planSpan = Math.max(1, plan.endIndex - plan.startIndex + 1);
                        const startingRangeGroups = planRangeGroups.filter(
                          (group) => group.startIndex === slotIndex
                        );

                        return (
                          <Box
                            key={`${plan.id || plan.serial_no}-${slot.key}`}
                            sx={{
                              position: 'relative',
                              minHeight: planRowHeight,
                              borderTop: `1px solid ${theme.palette.divider}`,
                              borderLeft: `1px solid ${theme.palette.divider}`,
                              bgcolor: plan.isSelected
                                ? slotIndex % 2 === 0
                                  ? alpha(theme.palette.primary.main, 0.06)
                                  : alpha(theme.palette.primary.main, 0.11)
                                : slotIndex % 2 === 0
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
                                  height: plan.isSelected ? 28 : 22,
                                  borderRadius: 999,
                                  bgcolor: plan.isSelected
                                    ? theme.palette.primary.main
                                    : plan.color,
                                  border: plan.isSelected
                                    ? `2px solid ${alpha('#ffffff', 0.85)}`
                                    : 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-start',
                                  color: 'common.white',
                                  boxShadow: plan.isSelected
                                    ? `0 10px 24px ${alpha(theme.palette.primary.main, 0.42)}`
                                    : `0 8px 18px ${alpha(plan.color, 0.35)}`,
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
                                    {plan.isSelected
                                      ? 'Selected Step'
                                      : getRoadmapStatusLabel(plan.status)}
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
                                        tasks: group.tasks.map((taskItem) =>
                                          normalizePlanForDialog(taskItem)
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
              No plan roadmap is available for this task.
            </Typography>
          )}
        </CardContent>
      </Card>

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
                  <Chip size="small" variant="outlined" label={`${timeView} slot`} />
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
                  {selectedWorkloadDetail.slot.rangeLabel} • Opened from the roadmap workload sheet
                  for this task only.
                </Typography>
              </Stack>
            </DialogTitle>
            <DialogContent dividers sx={{ py: 2.5 }}>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2.5, height: '100%' }}>
                    <CardContent sx={{ p: 2.25 }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Workload Summary</Typography>
                      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mb: 1.5 }}>
                        <Chip size="small" color="success" label={`Doing ${selectedWorkloadDetail.slot.inProgress}`} sx={getChecklistChipSx(theme, 'Doing')} />
                        <Chip size="small" color="success" label={`Done ${selectedWorkloadDetail.slot.completed}`} />
                        <Chip size="small" color="warning" label={`Remaining ${selectedWorkloadDetail.slot.pending}`} />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {selectedWorkloadDetail.slot.total} execution item
                        {selectedWorkloadDetail.slot.total === 1 ? '' : 's'} fall in this slot for
                        this assignee inside the current task.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Stack spacing={1.5}>
                    {selectedWorkloadDetail.slot.tasks.map((taskItem) => (
                      <Card
                        key={`task-workload-${selectedWorkloadDetail.user.id}-${selectedWorkloadDetail.slot.key}-${taskItem.id || taskItem.serial_no}`}
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
                                  {taskItem.title}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={taskItem.status}
                                  color={getStatusTone(taskItem.status)}
                                />
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(taskItem.start_date)} → {formatDate(taskItem.end_date)}
                              </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              {renderValue(
                                taskItem.description ||
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
                                      String(entry.planId) === String(taskItem.id) &&
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
                                        onClick={() => toggleChecklistItem(taskItem, item)}
                                        disabled={!item.canAdvance || savingPlanId === taskItem.id}
                                        sx={{ ...getChecklistChipSx(theme, item.state), mt: 0.1, cursor: !item.canAdvance || savingPlanId === taskItem.id ? 'not-allowed' : 'pointer' }}
                                      />
                                      <Box sx={{ flex: 1 }}>
                                        <Typography
                                          component="button"
                                          type="button"
                                          variant="body2"
                                          onClick={() => openAssignmentWorkItem(taskItem, item)}
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
                  <Chip
                    size="small"
                    color={getApprovalTone(getApprovalStatus(selectedPlan))}
                    variant={getApprovalStatus(selectedPlan) === 'Approved' ? 'filled' : 'outlined'}
                    label={getApprovalLabel(selectedPlan)}
                  />
                  {String(selectedPlan.id) === String(taskId) ? (
                    <Chip size="small" color="primary" label="Current Task" />
                  ) : null}
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
                        {selectedPlan.description ||
                          'No detailed description has been added for this task yet.'}
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
                                  the task date, capture assignee remarks/issues, and move work in
                                  sequence.
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
                                  ? 'This task is currently on hold and should remain paused until the blocker is cleared.'
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
                              {filteredSelectedPlanItems.map((item, index) => (
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
                                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                                        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                                          <Chip size="small" color={item.isCurrent ? 'primary' : item.isLocked ? 'default' : 'success'} label={item.title || `Task ${index + 1}`} />
                                          <Chip size="small" variant="outlined" label={item.sequenceLabel} />
                                          <Chip
                                            size="small"
                                            color={getChecklistTone(item.state)}
                                            label={getChecklistLabel(item.state)}
                                            onClick={() => toggleChecklistItem(selectedPlan, item)}
                                            disabled={!item.canAdvance || savingPlanId === selectedPlan.id}
                                            sx={{ ...getChecklistChipSx(theme, item.state), cursor: !item.canAdvance || savingPlanId === selectedPlan.id ? 'not-allowed' : 'pointer' }}
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
                                              handleApproveBoardWorkItem(selectedPlan, item)
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
                                              minWidth: { xs: '100%', sm: 'auto' },
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
                                              projectView?.assigned_users || [],
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
                                          projectView?.assigned_users || [],
                                          selectedPlan
                                        ).map((user) => (
                                          <MenuItem
                                            key={`task-step-user-${selectedPlan.id}-${item.key}-${user.id}`}
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
                              ))}
                            </Stack>
                            {!filteredSelectedPlanItems.length ? (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25 }}>
                                No execution items match the selected status filter.
                              </Typography>
                            ) : null}
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
                                key={`task-detail-plan-${selectedPlan.id || selectedPlan.serial_no}-${user.id}`}
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
                  projectId,
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
    </Box>
  );
}
