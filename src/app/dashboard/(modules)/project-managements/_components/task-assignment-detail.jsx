'use client';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
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
import { useRouter } from 'src/routes/hooks/use-router';

import { Iconify } from 'src/components/iconify';
import { UploadBox } from 'src/components/upload';

import {
  flattenProjectTasks,
  normalizeAssignedUsers,
  normalizePlanWorkItems,
  normalizePlanAttachments,
  useProjectManagementTask,
  updateProjectManagementPlan,
  approveProjectManagementPlan,
  approveProjectManagementWorkItem,
  uploadProjectManagementPlanAttachment,
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

function parsePlanQueue(value) {
  if (!value) return [];

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildGuidedSetupUrl(projectId, taskId, assignmentQueue = []) {
  const params = new URLSearchParams({
    setup: 'project-create',
    planQueue: assignmentQueue.join(','),
  });

  return `${paths.dashboard.projectManagements.taskManagement.assignment(projectId, taskId)}?${params.toString()}`;
}

function formatDate(value, fallback = '—') {
  if (!value) return fallback;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD MMM YYYY') : fallback;
}

function formatTaskDateRange(startDate, endDate, fallback = 'Not set') {
  if (!startDate && !endDate) return fallback;
  if (startDate && endDate) {
    const formattedStart = formatDate(startDate, fallback);
    const formattedEnd = formatDate(endDate, fallback);
    return formattedStart === formattedEnd ? formattedStart : `${formattedStart} - ${formattedEnd}`;
  }
  return formatDate(startDate || endDate, fallback);
}

function getTaskDateWindow(plan, task = null) {
  const workItemDates = getPlanChecklistItems(plan)
    .flatMap((item) => [item.scheduled_date, item.scheduled_end_date])
    .filter(Boolean);

  const candidates = [
    plan?.start_date,
    plan?.end_date,
    task?.start_date,
    task?.end_date,
    task?.startDate,
    task?.endDate,
    ...workItemDates,
  ]
    .filter(Boolean)
    .map((value) => dayjs(value));
  const validDates = candidates.filter((value) => value.isValid());

  if (!validDates.length) {
    return { startDate: null, endDate: null };
  }

  return {
    startDate: validDates
      .reduce((min, current) => (current.isBefore(min) ? current : min), validDates[0])
      .format('YYYY-MM-DD'),
    endDate: validDates
      .reduce((max, current) => (current.isAfter(max) ? current : max), validDates[0])
      .format('YYYY-MM-DD'),
  };
}

function getAllowedTaskDateWindow(plan, project = null) {
  const candidateStarts = [plan?.start_date, plan?.startDate, project?.start_date]
    .filter(Boolean)
    .map((value) => dayjs(value));
  const candidateEnds = [plan?.end_date, plan?.endDate, project?.end_date]
    .filter(Boolean)
    .map((value) => dayjs(value));
  const validStarts = candidateStarts.filter((value) => value.isValid());
  const validEnds = candidateEnds.filter((value) => value.isValid());

  const startDate = validStarts.length
    ? validStarts
        .reduce((max, current) => (current.isAfter(max) ? current : max), validStarts[0])
        .format('YYYY-MM-DD')
    : '';
  const endDate = validEnds.length
    ? validEnds
        .reduce((min, current) => (current.isBefore(min) ? current : min), validEnds[0])
        .format('YYYY-MM-DD')
    : '';

  return { startDate, endDate };
}

function isDateWithinWindow(dateValue, allowedWindow) {
  if (!dateValue) return true;

  const value = dayjs(dateValue);
  if (!value.isValid()) return false;
  if (allowedWindow?.startDate && value.isBefore(dayjs(allowedWindow.startDate), 'day'))
    return false;
  if (allowedWindow?.endDate && value.isAfter(dayjs(allowedWindow.endDate), 'day')) return false;
  return true;
}

function getTaskDateWindowError(startDate, endDate, allowedWindow) {
  if (startDate && !isDateWithinWindow(startDate, allowedWindow)) {
    return `Task start date must stay within the parent task range: ${formatTaskDateRange(allowedWindow?.startDate, allowedWindow?.endDate, 'allowed range')}.`;
  }

  if (endDate && !isDateWithinWindow(endDate, allowedWindow)) {
    return `Task end date must stay within the parent task range: ${formatTaskDateRange(allowedWindow?.startDate, allowedWindow?.endDate, 'allowed range')}.`;
  }

  if (startDate && endDate && dayjs(endDate).isBefore(dayjs(startDate), 'day')) {
    return 'Task end date cannot be before the start date.';
  }

  return '';
}

function formatFileSize(value) {
  const size = Number(value || 0);
  if (!size) return '0 KB';
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function getAttachmentDisplayName(attachment) {
  const preferredName = [attachment?.originalName, attachment?.fileName]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .find((value) => value.toLowerCase() !== 'attachment');

  if (preferredName) {
    return decodeURIComponent(preferredName)
      .split('?')[0]
      .split('#')[0]
      .split('/')
      .pop()
      .split('\\')
      .pop();
  }

  const filePath = attachment?.fileUrl || attachment?.file || '';
  const lastSegment = decodeURIComponent(String(filePath || ''))
    .split('?')[0]
    .split('#')[0]
    .split('/')
    .pop()
    ?.split('\\')
    .pop();

  return lastSegment || 'Attachment';
}

function getAttachmentTypeLabel(attachment) {
  const displayName = getAttachmentDisplayName(attachment);
  const extension = displayName.includes('.') ? displayName.split('.').pop() : '';

  return extension ? extension.toUpperCase() : 'FILE';
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
  const activeIndex = items.findIndex((item) => item.state !== 'Done');

  return items.map((item, index) => ({
    ...item,
    isCurrent: activeIndex === index,
    isLocked: activeIndex !== -1 && index > activeIndex,
    canAdvance: activeIndex === index,
    sequenceLabel:
      index < activeIndex || activeIndex === -1
        ? 'Completed'
        : activeIndex === index
          ? 'Ready now'
          : 'Waiting',
    sequenceHelper:
      index < activeIndex || activeIndex === -1
        ? 'Completed in sequence'
        : activeIndex === index
          ? 'This is the next task that should move.'
          : 'Unlocks when the task above is marked Done.',
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
    issues: '',
    sort_order: nextIndex,
    scheduled_date: getDefaultWorkItemDate(plan, nextIndex - 1),
    scheduled_end_date: '',
    assigned_to: defaultAssignee,
  };
}

function createNewTaskDraft(plan, projectUsers = [], offset = 0, preferredAssigneeId = '') {
  const items = getPlanChecklistItems(plan);
  const assignableUsers = getAssignableUsers(projectUsers, plan);
  const assignedUsers = normalizeAssignedUsers(plan?.assignedUsers || plan?.assigned_users);
  const taskAssignedUserId = assignedUsers[0]?.id ? String(assignedUsers[0].id) : '';
  const defaultAssignee =
    assignableUsers.find((user) => String(user.id) === String(preferredAssigneeId)) ||
    assignableUsers.find((user) => String(user.id) === taskAssignedUserId) ||
    assignableUsers[0] ||
    null;

  return {
    title: '',
    scheduled_date: getDefaultWorkItemDate(plan, items.length + offset),
    scheduled_end_date: '',
    assigned_to_id: defaultAssignee?.id ? String(defaultAssignee.id) : '',
    remarks: '',
    issues: '',
    attachments: [],
  };
}

function createDraftAttachment(file, index = 0) {
  return {
    id: `draft-${Date.now()}-${index}-${file.name}`,
    fileName: file.name,
    fileSize: Number(file.size || 0),
    fileUrl: URL.createObjectURL(file),
    createdAt: new Date().toISOString(),
    isDraft: true,
    fileObject: file,
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
      issues: item.issues || '',
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

function getWorkItemCompletedDate(item) {
  if (!item?.completed_at) return null;

  const completedAt = dayjs(item.completed_at);
  return completedAt.isValid() ? completedAt.startOf('day') : null;
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
    const completedDate = getWorkItemCompletedDate(item);

    return {
      ...item,
      planId: normalizedPlan.id,
      planTitle: normalizedPlan.title,
      planDescription: normalizedPlan.description,
      planStatus: normalizedPlan.status,
      plan: normalizedPlan,
      plannedDate,
      completedDate,
      effectiveDate: plannedDate,
    };
  });
}

function getExecutionEntriesForSlot(tasks, slot, projectUsers = [], assigneeId = null) {
  return tasks
    .flatMap((plan) => buildShiftedWorkItemSchedule(plan, projectUsers))
    .filter((entry) => {
      const isInsideSlot =
        entry.effectiveDate.isBefore(slot.end.endOf('day').add(1, 'millisecond')) &&
        entry.effectiveDate.isAfter(slot.start.startOf('day').subtract(1, 'millisecond'));

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

  return {
    key: slot.key,
    label: slot.label,
    rangeLabel: `${formatDate(slot.start)} → ${formatDate(slot.end)}`,
    start: slot.start,
    end: slot.end,
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
        const completedDate = item.completed_at
          ? dayjs(item.completed_at).format('YYYY-MM-DD')
          : null;

        return [scheduledDate, completedDate].filter(Boolean);
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

export default function TaskAssignmentDetail({ projectId, taskId }) {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { task, project, isLoading, error } = useProjectManagementTask(projectId, taskId);
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [newTaskDraft, setNewTaskDraft] = useState({
    title: '',
    scheduled_date: '',
    scheduled_end_date: '',
    assigned_to_id: '',
    remarks: '',
    issues: '',
    attachments: [],
  });
  const [projectState, setProjectState] = useState(null);
  const [savingPlanId, setSavingPlanId] = useState(null);
  const [approvingPlanId, setApprovingPlanId] = useState(null);
  const [approvingWorkItemId, setApprovingWorkItemId] = useState(null);
  const [editingWorkItemKey, setEditingWorkItemKey] = useState(null);
  const [editingWorkItemDraft, setEditingWorkItemDraft] = useState(null);
  const [deleteTargetItem, setDeleteTargetItem] = useState(null);
  const [focusedWorkItemKey, setFocusedWorkItemKey] = useState(null);
  const workItemRefs = useRef({});

  const requestedWorkItemKey = searchParams.get('workItem') || '';
  const requestedAssigneeId = searchParams.get('assigneeId') || '';
  const setupMode = searchParams.get('setup') || '';
  const assignmentQueue = useMemo(
    () => parsePlanQueue(searchParams.get('planQueue')),
    [searchParams]
  );
  const isGuidedProjectSetup = setupMode === 'project-create' && assignmentQueue.length > 0;
  const currentQueueIndex = isGuidedProjectSetup
    ? assignmentQueue.findIndex((item) => String(item) === String(taskId))
    : -1;
  const nextQueueTaskId =
    currentQueueIndex >= 0 && currentQueueIndex < assignmentQueue.length - 1
      ? assignmentQueue[currentQueueIndex + 1]
      : null;

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

  useEffect(() => {
    if (!taskView) {
      setSelectedPlan(null);
      return;
    }

    const normalizedTask = normalizePlanForDialog(taskView);

    setSelectedPlan((currentPlan) => {
      if (!currentPlan) return normalizedTask;
      if (String(currentPlan.id || '') !== String(normalizedTask.id || '')) return normalizedTask;
      if (currentPlan.isDirty) return currentPlan;
      return normalizedTask;
    });
  }, [taskView]);
  const activeTaskPlan = selectedPlan || (taskView ? normalizePlanForDialog(taskView) : null);
  const assignableUsers = useMemo(
    () => getAssignableUsers(projectView?.assigned_users || [], activeTaskPlan),
    [projectView?.assigned_users, activeTaskPlan]
  );
  const defaultAssigneeId = assignableUsers[0]?.id ? String(assignableUsers[0].id) : '';
  const preferredDraftAssigneeId = useMemo(() => {
    if (
      requestedAssigneeId &&
      assignableUsers.some((user) => String(user.id) === String(requestedAssigneeId))
    ) {
      return String(requestedAssigneeId);
    }

    const taskAssignedUserId = activeTaskPlan?.assignedUsers?.[0]?.id
      ? String(activeTaskPlan.assignedUsers[0].id)
      : '';

    if (
      taskAssignedUserId &&
      assignableUsers.some((user) => String(user.id) === taskAssignedUserId)
    ) {
      return taskAssignedUserId;
    }

    return defaultAssigneeId;
  }, [requestedAssigneeId, activeTaskPlan?.assignedUsers, assignableUsers, defaultAssigneeId]);
  const allowedTaskDateWindow = useMemo(
    () => getAllowedTaskDateWindow(activeTaskPlan, projectView),
    [activeTaskPlan, projectView]
  );

  useEffect(() => {
    if (!activeTaskPlan) return;

    setNewTaskDraft(
      createNewTaskDraft(
        activeTaskPlan,
        projectView?.assigned_users || [],
        0,
        preferredDraftAssigneeId
      )
    );
  }, [taskView?.id, activeTaskPlan?.id, projectView?.assigned_users, preferredDraftAssigneeId]);

  const filteredSelectedPlanItems = activeTaskPlan
    ? getPlanBoardItems(activeTaskPlan, projectView?.assigned_users || []).filter((item) =>
        matchesWorkItemStatus(item.state, taskStatusFilter)
      )
    : [];
  const taskFilterCounts = useMemo(() => {
    const items = activeTaskPlan
      ? getPlanBoardItems(activeTaskPlan, projectView?.assigned_users || [])
      : [];

    return {
      all: items.length,
      Todo: items.filter((item) => item.state === 'Todo').length,
      Doing: items.filter((item) => item.state === 'Doing').length,
      Done: items.filter((item) => item.state === 'Done').length,
    };
  }, [activeTaskPlan, projectView]);
  const assignedTaskGroups = useMemo(() => {
    if (!activeTaskPlan) return [];

    const grouped = getPlanBoardItems(activeTaskPlan, projectView?.assigned_users || []).reduce(
      (accumulator, item, index) => {
        const assignee = item.assigned_to || null;
        const key = assignee?.id ? `user-${assignee.id}` : 'unassigned';

        if (!accumulator[key]) {
          accumulator[key] = {
            key,
            assignee,
            total: 0,
            todo: 0,
            doing: 0,
            done: 0,
            approved: 0,
            items: [],
          };
        }

        accumulator[key].total += 1;
        if (item.state === 'Todo') accumulator[key].todo += 1;
        if (item.state === 'Doing') accumulator[key].doing += 1;
        if (item.state === 'Done') accumulator[key].done += 1;
        if (getWorkItemApprovalStatus(item) === 'Approved') accumulator[key].approved += 1;
        accumulator[key].items.push({
          ...item,
          displayIndex: index + 1,
        });

        return accumulator;
      },
      {}
    );

    return Object.values(grouped).sort((left, right) => {
      if (left.assignee?.username && right.assignee?.username) {
        return left.assignee.username.localeCompare(right.assignee.username);
      }
      if (left.assignee?.username) return -1;
      if (right.assignee?.username) return 1;
      return 0;
    });
  }, [activeTaskPlan, projectView]);

  useEffect(() => {
    if (!requestedWorkItemKey || !activeTaskPlan) return;

    const matchingItem = getPlanBoardItems(activeTaskPlan, projectView?.assigned_users || []).find(
      (item) => String(item.id || item.key) === String(requestedWorkItemKey)
    );

    if (!matchingItem) return;

    const resolvedKey = String(matchingItem.id || matchingItem.key);

    setTaskStatusFilter('all');
    setFocusedWorkItemKey(resolvedKey);

    const timer = setTimeout(() => {
      workItemRefs.current[resolvedKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);

    const clearTimer = setTimeout(() => {
      setFocusedWorkItemKey((current) => (current === resolvedKey ? null : current));
    }, 2600);

    return () => {
      clearTimeout(timer);
      clearTimeout(clearTimer);
    };
  }, [activeTaskPlan, projectView, requestedWorkItemKey]);
  const canApproveTask =
    taskView?.status === 'Completed' && getApprovalStatus(taskView) !== 'Approved';
  const projectTitle = projectView?.title || taskView?.projectTitle || 'Project';
  const taskBoardItems = useMemo(
    () => (activeTaskPlan ? getPlanChecklistItems(activeTaskPlan) : []),
    [activeTaskPlan]
  );
  const taskSummaryWindow = useMemo(
    () =>
      activeTaskPlan
        ? getTaskDateWindow(activeTaskPlan, taskView)
        : { startDate: null, endDate: null },
    [activeTaskPlan, taskView]
  );
  const taskProgressPercent = useMemo(() => {
    if (!taskBoardItems.length) return 0;
    const completedItems = taskBoardItems.filter((item) => item.state === 'Done').length;
    return Math.round((completedItems / taskBoardItems.length) * 100);
  }, [taskBoardItems]);
  const guidedSetupStepLabel =
    isGuidedProjectSetup && currentQueueIndex >= 0
      ? `${currentQueueIndex + 1} of ${assignmentQueue.length}`
      : '';

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

  const persistPlanBoard = async (plan, workItems, options = {}) => {
    const { successMessage = '', errorMessage = 'Failed to save task changes.' } = options;

    setSavingPlanId(plan.id);

    try {
      const itemsWithPendingFiles = workItems.filter(
        (item) => Array.isArray(item.pendingFiles) && item.pendingFiles.length
      );

      let updatedPlan = await updateProjectManagementPlan(
        plan.id,
        buildPlanWorkItemPayload(plan, workItems)
      );

      if (itemsWithPendingFiles.length) {
        const normalizedUpdatedItems = getPlanChecklistItems(updatedPlan);
        const attachmentsByItemId = new Map();

        for (const pendingItem of itemsWithPendingFiles) {
          const matchingItem = normalizedUpdatedItems.find(
            (item) =>
              String(item.sort_order || '') === String(pendingItem.sort_order || '') &&
              String(item.title || '') === String(pendingItem.title || '') &&
              String(item.scheduled_date || '') === String(pendingItem.scheduled_date || '')
          );

          if (!matchingItem?.id) continue;

          const uploadedAttachments = [];

          for (const file of pendingItem.pendingFiles) {
            const createdAttachment = await uploadProjectManagementPlanAttachment(
              updatedPlan.id,
              file,
              projectId,
              matchingItem.id
            );
            uploadedAttachments.push(createdAttachment);
          }

          attachmentsByItemId.set(String(matchingItem.id), uploadedAttachments);
        }

        if (attachmentsByItemId.size) {
          updatedPlan = {
            ...updatedPlan,
            work_items: (updatedPlan.work_items || []).map((item) => ({
              ...item,
              attachments: attachmentsByItemId.has(String(item.id))
                ? attachmentsByItemId.get(String(item.id))
                : item.attachments || [],
            })),
          };
        }
      }

      updatePlanInState(updatedPlan);

      if (successMessage) {
        toast.success(successMessage);
      }

      return updatedPlan;
    } catch (saveError) {
      toast.error(saveError?.detail || saveError?.message || errorMessage);
      return null;
    } finally {
      setSavingPlanId(null);
    }
  };

  const handleAddWorkItem = async () => {
    if (!activeTaskPlan) return;

    const trimmedTitle = newTaskDraft.title.trim();

    if (!trimmedTitle) {
      toast.error('Enter a task name before assigning it.');
      return;
    }

    const draftDateError = getTaskDateWindowError(
      newTaskDraft.scheduled_date,
      newTaskDraft.scheduled_end_date,
      allowedTaskDateWindow
    );

    if (draftDateError) {
      toast.error(draftDateError);
      return;
    }

    const selectedUser =
      assignableUsers.find((user) => String(user.id) === String(newTaskDraft.assigned_to_id)) ||
      null;
    const existingCount = getPlanChecklistItems(activeTaskPlan).length;

    const nextItems = [
      ...getPlanChecklistItems(activeTaskPlan),
      {
        ...createEmptyWorkItem(activeTaskPlan, projectView?.assigned_users || []),
        clientKey: `draft-item-${Date.now()}`,
        title: trimmedTitle,
        scheduled_date:
          newTaskDraft.scheduled_date || getDefaultWorkItemDate(activeTaskPlan, existingCount),
        scheduled_end_date: newTaskDraft.scheduled_end_date || null,
        assigned_to: selectedUser,
        notes: newTaskDraft.remarks.trim(),
        issues: newTaskDraft.issues.trim(),
        attachments: normalizePlanAttachments(newTaskDraft.attachments),
        pendingFiles: newTaskDraft.attachments
          .filter((attachment) => attachment.fileObject)
          .map((attachment) => attachment.fileObject),
      },
    ].map((item, index) => ({
      ...item,
      sort_order: index + 1,
    }));

    const savedPlan = await persistPlanBoard(activeTaskPlan, nextItems, {
      successMessage: 'Task assigned successfully.',
      errorMessage: 'Failed to assign the new task.',
    });

    if (!savedPlan) return;

    setNewTaskDraft(
      createNewTaskDraft(
        activeTaskPlan,
        projectView?.assigned_users || [],
        1,
        preferredDraftAssigneeId
      )
    );
  };

  const handleUploadAttachments = async (acceptedFiles = []) => {
    if (!acceptedFiles.length) return;

    const draftAttachments = acceptedFiles.map((file, index) => createDraftAttachment(file, index));

    setNewTaskDraft((current) => ({
      ...current,
      attachments: [...current.attachments, ...draftAttachments],
    }));
  };

  const handleRemoveDraftAttachment = (attachmentId) => {
    setNewTaskDraft((current) => ({
      ...current,
      attachments: current.attachments.filter(
        (attachment) => String(attachment.id) !== String(attachmentId)
      ),
    }));
  };

  const handleEditWorkItem = (item) => {
    if (getWorkItemApprovalStatus(item) === 'Approved') return;

    setEditingWorkItemKey(String(item.id || item.key));
    setEditingWorkItemDraft({
      title: item.title || '',
      assigned_to_id: item.assigned_to?.id ? String(item.assigned_to.id) : '',
      scheduled_date: item.scheduled_date || '',
      scheduled_end_date: item.scheduled_end_date || '',
      remarks: item.notes || '',
      issues: item.issues || '',
    });
  };

  const handleCancelEditWorkItem = () => {
    setEditingWorkItemKey(null);
    setEditingWorkItemDraft(null);
  };

  const handleSaveEditedWorkItem = async (item) => {
    if (!activeTaskPlan || !editingWorkItemDraft) return;

    const trimmedTitle = editingWorkItemDraft.title.trim();

    if (!trimmedTitle) {
      toast.error('Enter a task name before saving changes.');
      return;
    }

    const editDateError = getTaskDateWindowError(
      editingWorkItemDraft.scheduled_date,
      editingWorkItemDraft.scheduled_end_date,
      allowedTaskDateWindow
    );

    if (editDateError) {
      toast.error(editDateError);
      return;
    }

    const selectedUser =
      assignableUsers.find(
        (user) => String(user.id) === String(editingWorkItemDraft.assigned_to_id)
      ) || null;

    const updatedItems = getPlanChecklistItems(activeTaskPlan).map((currentItem) =>
      String(currentItem.id || currentItem.key) === String(item.id || item.key)
        ? {
            ...currentItem,
            title: trimmedTitle,
            assigned_to: selectedUser,
            scheduled_date: editingWorkItemDraft.scheduled_date || null,
            scheduled_end_date: editingWorkItemDraft.scheduled_end_date || null,
            notes: editingWorkItemDraft.remarks.trim(),
            issues: editingWorkItemDraft.issues.trim(),
          }
        : currentItem
    );

    const savedPlan = await persistPlanBoard(activeTaskPlan, updatedItems, {
      successMessage: 'Task updated successfully.',
      errorMessage: 'Failed to update task.',
    });

    if (!savedPlan) return;

    handleCancelEditWorkItem();
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
    const currentItems = getPlanChecklistItems(plan);

    if (isGuidedProjectSetup && !currentItems.length) {
      toast.error('Add at least one task before continuing to the next setup step.');
      return;
    }

    if (isGuidedProjectSetup && !plan.isDirty) {
      if (nextQueueTaskId) {
        router.push(buildGuidedSetupUrl(projectId, nextQueueTaskId, assignmentQueue));
      } else {
        router.push(paths.dashboard.projectManagements.projects.allProjects);
      }
      return;
    }

    const savedPlan = await persistPlanBoard(plan, currentItems, {
      successMessage: isGuidedProjectSetup
        ? nextQueueTaskId
          ? 'Tasks saved. Opening the next task setup step.'
          : 'Tasks saved. Returning to the project list.'
        : 'Task changes saved successfully.',
    });

    if (!savedPlan || !isGuidedProjectSetup) return;

    if (nextQueueTaskId) {
      router.push(buildGuidedSetupUrl(projectId, nextQueueTaskId, assignmentQueue));
    } else {
      router.push(paths.dashboard.projectManagements.projects.allProjects);
    }
  };

  const handleDeleteWorkItem = async (item) => {
    if (!activeTaskPlan) return;
    if (item.state === 'Done') return;

    const nextItems = getPlanChecklistItems(activeTaskPlan)
      .filter(
        (currentItem) => String(currentItem.id || currentItem.key) !== String(item.id || item.key)
      )
      .map((currentItem, index) => ({
        ...currentItem,
        sort_order: index + 1,
      }));

    const savedPlan = await persistPlanBoard(activeTaskPlan, nextItems, {
      successMessage: 'Task deleted successfully.',
      errorMessage: 'Failed to delete task.',
    });

    if (!savedPlan) return;

    if (editingWorkItemKey === String(item.id || item.key)) {
      handleCancelEditWorkItem();
    }

    setDeleteTargetItem(null);
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
    const targetItem = planBoard.find(
      (item) =>
        String(item.id || item.key || item.title) ===
        String(workItem.id || workItem.key || workItem.title)
    );

    if (!targetItem?.canAdvance) return;

    const nextItems = getPlanChecklistItems(plan).map((item) =>
      String(item.key) === String(workItem.key)
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
          mb: 2,
          borderRadius: 3,
          color: 'common.white',
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 55%, ${theme.palette.secondary.main} 100%)`,
        }}
      >
        <CardContent sx={{ px: { xs: 2, md: 2.5 }, py: { xs: 1.5, md: 1.75 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            spacing={1.5}
          >
            <Box>
              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                flexWrap="wrap"
                sx={{ mb: 0.75 }}
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
                  label={`${filteredSelectedPlanItems.length} assigned items`}
                  size="small"
                  sx={{ bgcolor: alpha('#ffffff', 0.14), color: 'common.white' }}
                />
              </Stack>
              <Typography
                variant="caption"
                sx={{ color: alpha('#ffffff', 0.72), display: 'block' }}
              >
                Project
              </Typography>
              <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                {projectTitle}
              </Typography>
              <Typography
                variant="caption"
                sx={{ mt: 0.25, color: alpha('#ffffff', 0.72), display: 'block' }}
              >
                Task
              </Typography>
              <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                {taskView.title}
              </Typography>
              <Typography
                variant="body2"
                sx={{ mt: 0.5, color: alpha('#ffffff', 0.82), maxWidth: 760 }}
              >
                Assignment-focused task view with assignees, dates, approvals, remarks, and files.
              </Typography>
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.25}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              sx={{ flexShrink: 0 }}
            >
              <Button
                component={RouterLink}
                href={paths.dashboard.projectManagements.projects.allProjects}
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
                Projects Page
              </Button>
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
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2.5, borderRadius: 3 }}>
        <CardContent sx={{ px: { xs: 2, md: 2.5 }, py: 1.25 }}>
          <Stack spacing={1}>
            <Stack
              direction={{ xs: 'column', xl: 'row' }}
              spacing={1.5}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', xl: 'center' }}
            >
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                <Typography variant="subtitle2" fontWeight={800}>
                  Add Task Summary
                </Typography>
                <Chip
                  size="small"
                  color="primary"
                  label={`SL ${activeTaskPlan?.serial_no || taskView.serialNo}`}
                />
                <Chip
                  size="small"
                  label={activeTaskPlan?.status || taskView.status}
                  color={getStatusTone(activeTaskPlan?.status || taskView.status)}
                />
                <Chip
                  size="small"
                  label={getApprovalLabel(activeTaskPlan || taskView)}
                  color={getApprovalTone(getApprovalStatus(activeTaskPlan || taskView))}
                  variant={
                    getApprovalStatus(activeTaskPlan || taskView) === 'Approved'
                      ? 'filled'
                      : 'outlined'
                  }
                />
              </Stack>

              <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
                <DetailItem
                  label="Start"
                  value={formatDate(taskSummaryWindow.startDate, 'Not set')}
                />
                <DetailItem label="End" value={formatDate(taskSummaryWindow.endDate, 'Not set')} />
                <DetailItem
                  label="Duration"
                  value={`${activeTaskPlan?.duration_days || taskView.duration_days || 0} days`}
                />
                <DetailItem label="Progress" value={`${taskProgressPercent}%`} />
                <DetailItem label="Assigned" value={filteredSelectedPlanItems.length} />
                <DetailItem label="Groups" value={assignedTaskGroups.length} />
              </Stack>
            </Stack>

            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Work Done
              </Typography>
              <Chip
                size="small"
                color={getProgressTone(taskProgressPercent)}
                label={`${taskProgressPercent}% complete`}
                variant={taskProgressPercent >= 80 ? 'filled' : 'outlined'}
              />
            </Stack>

            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Assigned Team
              </Typography>
              {activeTaskPlan?.assignedUsers?.length ? (
                activeTaskPlan.assignedUsers.map((user) => (
                  <Chip
                    key={`task-summary-user-${activeTaskPlan.id || activeTaskPlan.serial_no}-${user.id}`}
                    size="small"
                    variant="outlined"
                    label={user.username}
                  />
                ))
              ) : (
                <Chip size="small" variant="outlined" label="Unassigned" />
              )}
            </Stack>

            {isGuidedProjectSetup ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Guided setup step {guidedSetupStepLabel}. Add the real tasks for this roadmap step,
                then use the save button to continue through the remaining setup pages.
              </Alert>
            ) : null}
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3} alignItems="stretch" sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card
            sx={{
              borderRadius: 3,
              height: { xs: 'auto', lg: 'calc(100vh - 140px)' },
              position: { xs: 'static', lg: 'sticky' },
              top: { lg: 24 },
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, md: 3 }, flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <Stack spacing={2.25} sx={{ height: '100%', minHeight: 0 }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Added Task Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Detailed view of each assignee’s work inside this task, including dates,
                    progress, approvals, and remarks.
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {TASK_STATUS_FILTERS.map((filter) => (
                    <Chip
                      key={filter.value}
                      size="small"
                      label={`${filter.label} ${taskFilterCounts[filter.value] ?? 0}`}
                      clickable
                      color={taskStatusFilter === filter.value ? 'primary' : 'default'}
                      variant={taskStatusFilter === filter.value ? 'filled' : 'outlined'}
                      onClick={() => setTaskStatusFilter(filter.value)}
                    />
                  ))}
                </Stack>

                <Box
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    pr: { xs: 0.25, md: 0.75 },
                    mr: { xs: -0.25, md: -0.5 },
                    '&::-webkit-scrollbar': {
                      width: 8,
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: alpha(theme.palette.grey[500], 0.32),
                      borderRadius: 999,
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: alpha(theme.palette.grey[500], 0.08),
                      borderRadius: 999,
                    },
                  }}
                >
                  <Stack spacing={2}>
                    {assignedTaskGroups.length ? (
                      assignedTaskGroups.map((group) => (
                        <Card key={group.key} variant="outlined" sx={{ borderRadius: 2.5 }}>
                          <CardContent sx={{ p: 2.25 }}>
                            <Stack spacing={1.5}>
                              <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                justifyContent="space-between"
                                spacing={1.25}
                              >
                                <Box>
                                  <Typography variant="subtitle1" fontWeight={800}>
                                    {group.assignee?.username || 'Unassigned work'}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 0.35 }}
                                  >
                                    {group.total} item{group.total === 1 ? '' : 's'} assigned inside
                                    this task.
                                  </Typography>
                                </Box>
                                <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                                  <Chip
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    label={`Todo ${group.todo}`}
                                  />
                                  <Chip
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    label={`Doing ${group.doing}`}
                                    sx={getChecklistChipSx(theme, 'Doing')}
                                  />
                                  <Chip
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    label={`Done ${group.done}`}
                                  />
                                  <Chip
                                    size="small"
                                    color="success"
                                    label={`Approved ${group.approved}`}
                                  />
                                </Stack>
                              </Stack>

                              <Stack spacing={1.25}>
                                {group.items.map((item) => (
                                  <Box
                                    key={`assigned-task-detail-${group.key}-${item.key}`}
                                    ref={(node) => {
                                      const refKey = String(item.id || item.key);
                                      if (node) workItemRefs.current[refKey] = node;
                                      else delete workItemRefs.current[refKey];
                                    }}
                                    sx={{
                                      p: 1.5,
                                      borderRadius: 2,
                                      border: `1px solid ${
                                        focusedWorkItemKey === String(item.id || item.key)
                                          ? alpha(theme.palette.primary.main, 0.42)
                                          : alpha(theme.palette.grey[500], 0.16)
                                      }`,
                                      bgcolor:
                                        focusedWorkItemKey === String(item.id || item.key)
                                          ? alpha(theme.palette.primary.main, 0.08)
                                          : alpha(
                                              theme.palette.background.neutral ||
                                                theme.palette.grey[500],
                                              0.04
                                            ),
                                      boxShadow:
                                        focusedWorkItemKey === String(item.id || item.key)
                                          ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}`
                                          : 'none',
                                      transition:
                                        'background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                                    }}
                                  >
                                    <Stack spacing={1}>
                                      {editingWorkItemKey === String(item.id || item.key) &&
                                      editingWorkItemDraft ? (
                                        <Stack spacing={1.25} sx={{ mb: 0.5 }}>
                                          <TextField
                                            size="small"
                                            label="Task Name"
                                            value={editingWorkItemDraft.title}
                                            onChange={(event) =>
                                              setEditingWorkItemDraft((current) => ({
                                                ...current,
                                                title: event.target.value,
                                              }))
                                            }
                                            fullWidth
                                          />

                                          <Stack
                                            direction={{ xs: 'column', md: 'row' }}
                                            spacing={1.25}
                                          >
                                            <TextField
                                              select
                                              size="small"
                                              label="Assign To"
                                              value={editingWorkItemDraft.assigned_to_id}
                                              onChange={(event) =>
                                                setEditingWorkItemDraft((current) => ({
                                                  ...current,
                                                  assigned_to_id: event.target.value,
                                                }))
                                              }
                                              fullWidth
                                            >
                                              <MenuItem value="">Unassigned</MenuItem>
                                              {assignableUsers.map((user) => (
                                                <MenuItem
                                                  key={`edit-task-user-${item.id || item.key}-${user.id}`}
                                                  value={String(user.id)}
                                                >
                                                  {user.username}
                                                </MenuItem>
                                              ))}
                                            </TextField>

                                            <TextField
                                              size="small"
                                              type="date"
                                              label="Task Start Date"
                                              value={editingWorkItemDraft.scheduled_date}
                                              onChange={(event) =>
                                                setEditingWorkItemDraft((current) => ({
                                                  ...current,
                                                  scheduled_date: event.target.value,
                                                }))
                                              }
                                              InputLabelProps={{ shrink: true }}
                                              slotProps={{
                                                htmlInput: {
                                                  min: allowedTaskDateWindow.startDate || undefined,
                                                  max: allowedTaskDateWindow.endDate || undefined,
                                                },
                                              }}
                                              helperText={
                                                allowedTaskDateWindow.startDate &&
                                                allowedTaskDateWindow.endDate
                                                  ? `Within parent task range: ${allowedTaskDateWindow.startDate} to ${allowedTaskDateWindow.endDate}`
                                                  : undefined
                                              }
                                              fullWidth
                                            />

                                            <TextField
                                              size="small"
                                              type="date"
                                              label="Task End Date"
                                              value={editingWorkItemDraft.scheduled_end_date}
                                              onChange={(event) =>
                                                setEditingWorkItemDraft((current) => ({
                                                  ...current,
                                                  scheduled_end_date: event.target.value,
                                                }))
                                              }
                                              InputLabelProps={{ shrink: true }}
                                              slotProps={{
                                                htmlInput: {
                                                  min:
                                                    editingWorkItemDraft.scheduled_date ||
                                                    allowedTaskDateWindow.startDate ||
                                                    undefined,
                                                  max: allowedTaskDateWindow.endDate || undefined,
                                                },
                                              }}
                                              helperText={
                                                allowedTaskDateWindow.startDate &&
                                                allowedTaskDateWindow.endDate
                                                  ? `Optional. Parent task range: ${allowedTaskDateWindow.startDate} to ${allowedTaskDateWindow.endDate}`
                                                  : 'Optional. Leave empty for a single-date task.'
                                              }
                                              fullWidth
                                            />
                                          </Stack>

                                          <TextField
                                            size="small"
                                            label="Remarks"
                                            value={editingWorkItemDraft.remarks}
                                            onChange={(event) =>
                                              setEditingWorkItemDraft((current) => ({
                                                ...current,
                                                remarks: event.target.value,
                                              }))
                                            }
                                            fullWidth
                                            multiline
                                            minRows={3}
                                          />

                                          <TextField
                                            size="small"
                                            label="Issues"
                                            value={editingWorkItemDraft.issues}
                                            onChange={(event) =>
                                              setEditingWorkItemDraft((current) => ({
                                                ...current,
                                                issues: event.target.value,
                                              }))
                                            }
                                            fullWidth
                                            multiline
                                            minRows={3}
                                          />

                                          <Stack
                                            direction={{ xs: 'column', sm: 'row' }}
                                            spacing={1}
                                          >
                                            <Button
                                              size="small"
                                              variant="contained"
                                              onClick={() => handleSaveEditedWorkItem(item)}
                                              disabled={savingPlanId === activeTaskPlan?.id}
                                              startIcon={
                                                savingPlanId === activeTaskPlan?.id ? (
                                                  <CircularProgress size={14} color="inherit" />
                                                ) : (
                                                  <Iconify icon="solar:diskette-bold" width={16} />
                                                )
                                              }
                                              sx={{
                                                minHeight: 34,
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                fontWeight: 700,
                                              }}
                                            >
                                              {savingPlanId === activeTaskPlan?.id
                                                ? 'Saving...'
                                                : 'Save Changes'}
                                            </Button>
                                            <Button
                                              size="small"
                                              variant="text"
                                              color="inherit"
                                              onClick={handleCancelEditWorkItem}
                                              sx={{
                                                minHeight: 34,
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                fontWeight: 700,
                                              }}
                                            >
                                              Cancel
                                            </Button>
                                          </Stack>
                                        </Stack>
                                      ) : null}

                                      <Stack
                                        direction={{ xs: 'column', sm: 'row' }}
                                        justifyContent="space-between"
                                        spacing={1}
                                      >
                                        <Box>
                                          <Typography variant="subtitle2" fontWeight={800}>
                                            {item.displayIndex}. {item.title}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            {item.sequenceHelper}
                                          </Typography>
                                        </Box>
                                        <Stack
                                          direction="row"
                                          spacing={0.75}
                                          useFlexGap
                                          flexWrap="wrap"
                                        >
                                          <Chip
                                            size="small"
                                            color={getChecklistTone(item.state)}
                                            label={getChecklistLabel(item.state)}
                                            sx={getChecklistChipSx(theme, item.state)}
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
                                      </Stack>

                                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                                        <DetailItem
                                          label="Assigned To"
                                          value={item.assigned_to?.username || 'Unassigned'}
                                        />
                                        <DetailItem
                                          label="Task Date"
                                          value={formatTaskDateRange(
                                            item.scheduled_date,
                                            item.scheduled_end_date,
                                            'Not set'
                                          )}
                                        />
                                      </Stack>

                                      {getWorkItemApprovalStatus(item) !== 'Approved' &&
                                      editingWorkItemKey !== String(item.id || item.key) ? (
                                        <Stack
                                          direction="row"
                                          justifyContent="flex-end"
                                          spacing={1}
                                          useFlexGap
                                          flexWrap="wrap"
                                        >
                                          <Button
                                            size="small"
                                            variant="text"
                                            color="inherit"
                                            onClick={() => handleEditWorkItem(item)}
                                            startIcon={<Iconify icon="solar:pen-bold" width={16} />}
                                            sx={{
                                              minHeight: 30,
                                              borderRadius: 2,
                                              textTransform: 'none',
                                              fontWeight: 700,
                                            }}
                                          >
                                            Edit Task
                                          </Button>
                                          {item.state !== 'Done' ? (
                                            <Button
                                              size="small"
                                              variant="text"
                                              color="error"
                                              onClick={() => setDeleteTargetItem(item)}
                                              startIcon={
                                                <Iconify
                                                  icon="solar:trash-bin-trash-bold"
                                                  width={16}
                                                />
                                              }
                                              disabled={savingPlanId === activeTaskPlan?.id}
                                              sx={{
                                                minHeight: 30,
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                fontWeight: 700,
                                              }}
                                            >
                                              Delete Task
                                            </Button>
                                          ) : null}
                                        </Stack>
                                      ) : null}

                                      <Stack
                                        direction={{ xs: 'column', sm: 'row' }}
                                        spacing={1}
                                        justifyContent="space-between"
                                        alignItems={{ xs: 'stretch', sm: 'center' }}
                                      >
                                        <Typography variant="caption" color="text.secondary">
                                          {getWorkItemApprovalStatus(item) === 'Approved'
                                            ? 'This task has already been approved.'
                                            : item.state === 'Done'
                                              ? 'This task is done and ready for approval.'
                                              : 'Finish this task before approving it.'}
                                        </Typography>
                                        <Button
                                          size="small"
                                          variant={
                                            getWorkItemApprovalStatus(item) === 'Approved'
                                              ? 'contained'
                                              : 'outlined'
                                          }
                                          color={
                                            getWorkItemApprovalStatus(item) === 'Approved'
                                              ? 'success'
                                              : 'inherit'
                                          }
                                          disabled={
                                            !item.id ||
                                            approvingWorkItemId === item.id ||
                                            getWorkItemApprovalStatus(item) === 'Approved' ||
                                            item.state !== 'Done'
                                          }
                                          onClick={() =>
                                            handleApproveBoardWorkItem(activeTaskPlan, item)
                                          }
                                          startIcon={
                                            approvingWorkItemId === item.id ? (
                                              <CircularProgress size={14} color="inherit" />
                                            ) : (
                                              <Iconify
                                                icon="solar:verified-check-bold"
                                                width={16}
                                              />
                                            )
                                          }
                                          sx={{
                                            minHeight: 34,
                                            borderRadius: 2,
                                            textTransform: 'none',
                                            fontWeight: 700,
                                          }}
                                        >
                                          {getWorkItemApprovalStatus(item) === 'Approved'
                                            ? 'Approved'
                                            : approvingWorkItemId === item.id
                                              ? 'Approving...'
                                              : 'Approve'}
                                        </Button>
                                      </Stack>

                                      {item.attachments?.length ? (
                                        <Box>
                                          <Typography variant="caption" color="text.secondary">
                                            Attached Files
                                          </Typography>
                                          <Stack spacing={0.75} sx={{ mt: 0.75 }}>
                                            {item.attachments.map((attachment) => (
                                              <Stack
                                                key={`assigned-item-file-${item.id || item.key}-${attachment.id || attachment.fileName}`}
                                                direction={{ xs: 'column', sm: 'row' }}
                                                spacing={1}
                                                justifyContent="space-between"
                                                alignItems={{ xs: 'flex-start', sm: 'center' }}
                                                sx={{
                                                  p: 1,
                                                  borderRadius: 1.5,
                                                  border: `1px solid ${alpha(theme.palette.grey[500], 0.14)}`,
                                                  bgcolor: alpha(theme.palette.common.white, 0.6),
                                                }}
                                              >
                                                <Box sx={{ minWidth: 0 }}>
                                                  <Typography
                                                    variant="body2"
                                                    fontWeight={700}
                                                    noWrap
                                                  >
                                                    {getAttachmentDisplayName(attachment)}
                                                  </Typography>
                                                  <Stack
                                                    direction="row"
                                                    spacing={0.75}
                                                    useFlexGap
                                                    flexWrap="wrap"
                                                    sx={{ mt: 0.25 }}
                                                  >
                                                    <Typography
                                                      variant="caption"
                                                      color="text.secondary"
                                                    >
                                                      {getAttachmentTypeLabel(attachment)}
                                                    </Typography>
                                                    <Typography
                                                      variant="caption"
                                                      color="text.secondary"
                                                    >
                                                      {formatFileSize(attachment.fileSize)}
                                                    </Typography>
                                                  </Stack>
                                                </Box>

                                                <Stack
                                                  direction={{ xs: 'column', sm: 'row' }}
                                                  spacing={1}
                                                >
                                                  <Button
                                                    component="a"
                                                    href={attachment.fileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    size="small"
                                                    variant="outlined"
                                                    color="inherit"
                                                  >
                                                    View
                                                  </Button>
                                                  <Button
                                                    component="a"
                                                    href={attachment.fileUrl}
                                                    download={getAttachmentDisplayName(attachment)}
                                                    size="small"
                                                    variant="text"
                                                    color="inherit"
                                                  >
                                                    Download
                                                  </Button>
                                                </Stack>
                                              </Stack>
                                            ))}
                                          </Stack>
                                        </Box>
                                      ) : null}

                                      {item.notes || item.issues ? (
                                        <Stack
                                          direction={{ xs: 'column', md: 'row' }}
                                          spacing={1.5}
                                        >
                                          <Box sx={{ flex: 1 }}>
                                            <Typography variant="caption" color="text.secondary">
                                              Remarks
                                            </Typography>
                                            <Typography
                                              variant="body2"
                                              color="text.secondary"
                                              sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}
                                            >
                                              {item.notes || 'No remarks added.'}
                                            </Typography>
                                          </Box>
                                          <Box sx={{ flex: 1 }}>
                                            <Typography variant="caption" color="text.secondary">
                                              Issues
                                            </Typography>
                                            <Typography
                                              variant="body2"
                                              color="text.secondary"
                                              sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}
                                            >
                                              {item.issues || 'No issues added.'}
                                            </Typography>
                                          </Box>
                                        </Stack>
                                      ) : (
                                        <Typography variant="body2" color="text.disabled">
                                          No remarks or issues added yet.
                                        </Typography>
                                      )}
                                    </Stack>
                                  </Box>
                                ))}
                              </Stack>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Alert severity="info" sx={{ borderRadius: 2 }}>
                        No assignee-specific execution items exist yet for this task.
                      </Alert>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ borderRadius: 3, minHeight: '100%' }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Add Task Form
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Create a new task here. When you add it, the task is saved immediately and then
                    appears on the left with its owner, date, status, remarks, and files.
                  </Typography>
                </Box>

                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  {isGuidedProjectSetup
                    ? 'Add Task saves immediately. When you finish this step, use the save button below to continue to the next task setup page.'
                    : 'Add Task now saves the new task right away. Use Save Changes only for other edits you make on this board.'}
                </Alert>

                <Stack spacing={1.25}>
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'stretch', md: 'center' }}
                  >
                    <UploadBox
                      multiple
                      onDrop={handleUploadAttachments}
                      accept={{
                        'application/pdf': ['.pdf'],
                        'application/msword': ['.doc'],
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
                          '.docx',
                        ],
                        'application/vnd.ms-excel': ['.xls'],
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
                          '.xlsx',
                        ],
                        'text/csv': ['.csv'],
                        'text/plain': ['.txt'],
                        'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
                        'application/zip': ['.zip'],
                      }}
                      placeholder={
                        <Stack spacing={0.5} alignItems="center">
                          <Iconify icon="eva:cloud-upload-fill" width={26} />
                          <Typography variant="caption" fontWeight={700}>
                            Upload Files
                          </Typography>
                        </Stack>
                      }
                      sx={{
                        width: { xs: '100%', md: 104 },
                        height: { xs: 96, md: 96 },
                        borderRadius: 2.5,
                      }}
                    />
                    <Stack spacing={0.5} sx={{ flex: 1 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        flexWrap="wrap"
                        alignItems="center"
                      >
                        <Typography variant="subtitle2" fontWeight={800}>
                          Supporting Files
                        </Typography>
                        <Chip
                          color="primary"
                          variant="outlined"
                          size="small"
                          label={`${newTaskDraft.attachments.length} attachment${newTaskDraft.attachments.length === 1 ? '' : 's'}`}
                        />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        Add multiple files here. PDF, Word, Excel, CSV, text, images, and ZIP are
                        supported up to 15 MB each.
                      </Typography>
                    </Stack>
                  </Stack>

                  <Stack spacing={1}>
                    {newTaskDraft.attachments.length ? (
                      newTaskDraft.attachments.map((attachment) => (
                        <Stack
                          key={attachment.id}
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1}
                          justifyContent="space-between"
                          alignItems={{ xs: 'flex-start', sm: 'center' }}
                          sx={{
                            p: 1.25,
                            borderRadius: 2,
                            border: `1px solid ${alpha(theme.palette.grey[500], 0.18)}`,
                            bgcolor: alpha(
                              theme.palette.background.neutral || theme.palette.grey[500],
                              0.05
                            ),
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight={800} noWrap>
                              {attachment.fileName}
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={1}
                              flexWrap="wrap"
                              useFlexGap
                              sx={{ mt: 0.35 }}
                            >
                              <Typography variant="caption" color="text.secondary">
                                {formatFileSize(attachment.fileSize)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Uploaded {formatDate(attachment.createdAt, 'Recently')}
                              </Typography>
                            </Stack>
                          </Box>

                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1}
                            alignItems={{ xs: 'stretch', sm: 'center' }}
                          >
                            <Button
                              component="a"
                              href={attachment.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              size="small"
                              variant="outlined"
                              color="inherit"
                            >
                              Open
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              variant="text"
                              onClick={() => handleRemoveDraftAttachment(attachment.id)}
                            >
                              Remove
                            </Button>
                          </Stack>
                        </Stack>
                      ))
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        No files added for this new task yet.
                      </Typography>
                    )}
                  </Stack>
                </Stack>

                <Divider />

                <TextField
                  size="small"
                  label="Task Name"
                  placeholder="Enter task name"
                  value={newTaskDraft.title}
                  onChange={(event) =>
                    setNewTaskDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  fullWidth
                />

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25}>
                  <TextField
                    select
                    size="small"
                    label="Assign To"
                    value={newTaskDraft.assigned_to_id}
                    onChange={(event) =>
                      setNewTaskDraft((current) => ({
                        ...current,
                        assigned_to_id: event.target.value,
                      }))
                    }
                    fullWidth
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {assignableUsers.map((user) => (
                      <MenuItem
                        key={`task-assignment-user-${activeTaskPlan?.id || taskId}-${user.id}`}
                        value={String(user.id)}
                      >
                        {user.username}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    size="small"
                    type="date"
                    label="Task Start Date"
                    value={newTaskDraft.scheduled_date}
                    onChange={(event) =>
                      setNewTaskDraft((current) => ({
                        ...current,
                        scheduled_date: event.target.value,
                      }))
                    }
                    InputLabelProps={{ shrink: true }}
                    slotProps={{
                      htmlInput: {
                        min: allowedTaskDateWindow.startDate || undefined,
                        max: allowedTaskDateWindow.endDate || undefined,
                      },
                    }}
                    helperText={
                      allowedTaskDateWindow.startDate && allowedTaskDateWindow.endDate
                        ? `Within parent task range: ${allowedTaskDateWindow.startDate} to ${allowedTaskDateWindow.endDate}`
                        : undefined
                    }
                    fullWidth
                  />

                  <TextField
                    size="small"
                    type="date"
                    label="Task End Date"
                    value={newTaskDraft.scheduled_end_date}
                    onChange={(event) =>
                      setNewTaskDraft((current) => ({
                        ...current,
                        scheduled_end_date: event.target.value,
                      }))
                    }
                    InputLabelProps={{ shrink: true }}
                    slotProps={{
                      htmlInput: {
                        min:
                          newTaskDraft.scheduled_date ||
                          allowedTaskDateWindow.startDate ||
                          undefined,
                        max: allowedTaskDateWindow.endDate || undefined,
                      },
                    }}
                    helperText={
                      allowedTaskDateWindow.startDate && allowedTaskDateWindow.endDate
                        ? `Optional. Parent task range: ${allowedTaskDateWindow.startDate} to ${allowedTaskDateWindow.endDate}`
                        : 'Optional. Leave empty for a single-date task.'
                    }
                    fullWidth
                  />
                </Stack>

                <TextField
                  size="small"
                  label="Remarks"
                  placeholder="Add remarks or handoff details for this new task"
                  value={newTaskDraft.remarks}
                  onChange={(event) =>
                    setNewTaskDraft((current) => ({
                      ...current,
                      remarks: event.target.value,
                    }))
                  }
                  fullWidth
                  multiline
                  minRows={4}
                />

                <TextField
                  size="small"
                  label="Issues"
                  placeholder="Add blockers, problems, or risks for this new task"
                  value={newTaskDraft.issues}
                  onChange={(event) =>
                    setNewTaskDraft((current) => ({
                      ...current,
                      issues: event.target.value,
                    }))
                  }
                  fullWidth
                  multiline
                  minRows={4}
                />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleAddWorkItem}
                    disabled={!activeTaskPlan || savingPlanId === activeTaskPlan?.id}
                    startIcon={<Iconify icon="solar:add-circle-bold" width={16} />}
                    sx={{
                      minHeight: 40,
                      borderRadius: 2.5,
                      textTransform: 'none',
                      fontWeight: 700,
                    }}
                  >
                    Add Task
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleSavePlanBoard(activeTaskPlan)}
                    disabled={
                      !activeTaskPlan ||
                      savingPlanId === activeTaskPlan.id ||
                      (!isGuidedProjectSetup && !activeTaskPlan.isDirty)
                    }
                    startIcon={
                      savingPlanId === activeTaskPlan?.id ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : (
                        <Iconify icon="solar:diskette-bold" width={16} />
                      )
                    }
                    sx={{
                      minHeight: 40,
                      borderRadius: 2.5,
                      textTransform: 'none',
                      fontWeight: 700,
                    }}
                  >
                    {savingPlanId === activeTaskPlan?.id
                      ? 'Saving...'
                      : isGuidedProjectSetup
                        ? nextQueueTaskId
                          ? 'Save & Next Task Setup'
                          : 'Save & Finish Setup'
                        : 'Save Changes'}
                  </Button>
                </Stack>

                {activeTaskPlan?.isDirty ? (
                  <Typography variant="caption" color="warning.main">
                    You have unsaved changes on this task. Save Changes to keep your latest board
                    edits.
                  </Typography>
                ) : isGuidedProjectSetup ? (
                  <Typography variant="caption" color="text.secondary">
                    {taskBoardItems.length
                      ? 'This step has saved tasks. Use the save button to continue when you are ready.'
                      : 'Create at least one real task here before continuing to the next step.'}
                  </Typography>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={Boolean(deleteTargetItem)}
        onClose={() => (savingPlanId === activeTaskPlan?.id ? null : setDeleteTargetItem(null))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Added Task</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {deleteTargetItem
              ? `Are you sure you want to delete "${deleteTargetItem.title}"? This action cannot be undone.`
              : ''}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteTargetItem(null)}
            color="inherit"
            disabled={savingPlanId === activeTaskPlan?.id}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDeleteWorkItem(deleteTargetItem)}
            color="error"
            variant="contained"
            disabled={!deleteTargetItem || savingPlanId === activeTaskPlan?.id}
          >
            {savingPlanId === activeTaskPlan?.id ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
