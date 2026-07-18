'use client';

import dayjs from 'dayjs';
import { useMemo, useRef } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import {
  normalizeAssignedUsers,
  normalizePlanWorkItems,
} from './use-project-managements-api';

export const ITERATION_COLORS = ['#ff9f43', '#ff3d71', '#6c2bd9'];
export const ASSIGNEE_TIME_TABS = ['daily', 'weekly', 'monthly', 'yearly'];

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

  return items.map((item) => ({
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

function normalizePlanForDialog(plan) {
  const assignedUsers = normalizeAssignedUsers(plan.assignedUsers || plan.assigned_users);

  return {
    ...plan,
    assignedUsers,
    work_items: normalizePlanWorkItems(plan.work_items, plan, assignedUsers),
    isDirty: Boolean(plan.isDirty),
  };
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

export default function ProjectPlanRoadmapBoard({
  project,
  cadence = 'weekly',
  onPlanClick,
  onWorkloadClick,
}) {
  const theme = useTheme();
  const roadmapScrollRef = useRef(null);
  const roadmapDragStateRef = useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
    didDrag: false,
  });

  const timeline = useMemo(
    () => (project ? buildTimeline(project, cadence) : null),
    [project, cadence]
  );

  function handleRoadmapMouseDown(event) {
    const container = roadmapScrollRef.current;
    if (!container) return;
    roadmapDragStateRef.current = {
      isDragging: true,
      startX: event.pageX - container.offsetLeft,
      scrollLeft: container.scrollLeft,
      didDrag: false,
    };
    container.style.cursor = 'grabbing';
  }

  function handleRoadmapMouseMove(event) {
    const container = roadmapScrollRef.current;
    const drag = roadmapDragStateRef.current;
    if (!container || !drag.isDragging) return;
    event.preventDefault();
    const x = event.pageX - container.offsetLeft;
    const walk = x - drag.startX;
    if (Math.abs(walk) > 3) drag.didDrag = true;
    container.scrollLeft = drag.scrollLeft - walk;
  }

  function stopRoadmapDragging() {
    const container = roadmapScrollRef.current;
    const drag = roadmapDragStateRef.current;
    drag.isDragging = false;
    if (container) container.style.cursor = 'grab';
  }

  function handleRoadmapClickCapture(event) {
    if (roadmapDragStateRef.current.didDrag) {
      event.preventDefault();
      event.stopPropagation();
      roadmapDragStateRef.current.didDrag = false;
    }
  }

  if (!timeline || !timeline.rows.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No plan steps added to this project yet.
      </Typography>
    );
  }

  return (
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
                              onClick={() => onPlanClick?.(plan)}
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
                              onClick={() => onPlanClick?.(plan)}
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
                                  onClick={isActive ? () => onPlanClick?.(plan) : undefined}
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
                                          onWorkloadClick?.(group);
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
  );
}
