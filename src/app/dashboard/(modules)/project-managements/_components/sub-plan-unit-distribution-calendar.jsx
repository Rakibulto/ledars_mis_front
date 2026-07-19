'use client';

import dayjs from 'dayjs';
import { useMemo, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';

const RANGE_COLORS = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#db2777', '#0891b2'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CALENDAR_VIEWS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export function sumUnitPeriodUnits(periods = []) {
  return (Array.isArray(periods) ? periods : []).reduce(
    (sum, period) => sum + Number(period?.unit_no || 0),
    0
  );
}

export function getRemainingUnitAmount(totalUnits, periods = []) {
  return Math.max(0, Number(totalUnits || 0) - sumUnitPeriodUnits(periods));
}

export function normalizeUnitPeriodsFromApi(periods = []) {
  return (Array.isArray(periods) ? periods : [])
    .map((period) => {
      if (period.start_date && period.end_date) {
        return {
          period_type: 'range',
          start_date: toDayKey(period.start_date),
          end_date: toDayKey(period.end_date),
          unit_no: String(period.unit_no ?? ''),
        };
      }
      if (period.month) {
        const start = dayjs(`${period.year}-${String(period.month).padStart(2, '0')}-01`);
        return {
          period_type: 'range',
          start_date: start.format('YYYY-MM-DD'),
          end_date: start.endOf('month').format('YYYY-MM-DD'),
          unit_no: String(period.unit_no ?? ''),
        };
      }
      return null;
    })
    .filter(Boolean);
}

export function deriveSubPlanDatesFromPeriods(periods = []) {
  const normalized = normalizeUnitPeriodsFromApi(periods).filter((p) => Number(p.unit_no) > 0);
  if (!normalized.length) {
    return { start_date: '', end_date: '' };
  }
  const starts = normalized.map((p) => p.start_date).sort();
  const ends = normalized.map((p) => p.end_date).sort();
  return { start_date: starts[0], end_date: ends[ends.length - 1] };
}

function toDayKey(value) {
  return dayjs(value).format('YYYY-MM-DD');
}

function minDayKey(a, b) {
  return a <= b ? a : b;
}

function maxDayKey(a, b) {
  return a >= b ? a : b;
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && bStart <= aEnd;
}

function isDayInRange(dayKey, startKey, endKey) {
  const start = minDayKey(startKey, endKey);
  const end = maxDayKey(startKey, endKey);
  return dayKey >= start && dayKey <= end;
}

function clipRangeToBounds(startKey, endKey, boundStart, boundEnd) {
  let start = minDayKey(startKey, endKey);
  let end = maxDayKey(startKey, endKey);
  if (boundStart && start < boundStart) start = boundStart;
  if (boundEnd && end > boundEnd) end = boundEnd;
  return start <= end ? { start, end } : null;
}

function buildCalendarDays(monthCursor, boundStart, boundEnd) {
  const monthStart = monthCursor.startOf('month');
  const startOffset = (monthStart.day() + 6) % 7;
  let cursor = monthStart.subtract(startOffset, 'day');

  const days = [];
  for (let i = 0; i < 42; i += 1) {
    const key = cursor.format('YYYY-MM-DD');
    const inMonth = cursor.month() === monthCursor.month();
    const selectable =
      (!boundStart || key >= boundStart) && (!boundEnd || key <= boundEnd);
    days.push({
      key,
      inMonth,
      selectable,
      label: cursor.date(),
    });
    cursor = cursor.add(1, 'day');
  }
  return days;
}

function buildYearMonths(year, boundStart, boundEnd) {
  const months = [];
  for (let month = 0; month < 12; month += 1) {
    const cursor = dayjs().year(year).month(month).startOf('month');
    const start = cursor.format('YYYY-MM-DD');
    const end = cursor.endOf('month').format('YYYY-MM-DD');
    const selectable =
      (!boundEnd || start <= boundEnd) && (!boundStart || end >= boundStart);
    months.push({
      key: `${year}-${month + 1}`,
      year,
      month: month + 1,
      label: cursor.format('MMM'),
      start,
      end,
      selectable,
    });
  }
  return months;
}

function findRangeIndexForDay(periods, dayKey) {
  return periods.findIndex((period) =>
    isDayInRange(dayKey, period.start_date, period.end_date)
  );
}

function monthOverlapsRange(monthStart, monthEnd, rangeStart, rangeEnd) {
  return rangesOverlap(monthStart, monthEnd, rangeStart, rangeEnd);
}

export function SubPlanUnitDistributionCalendar({
  projectStart,
  projectEnd,
  totalUnits,
  periods = [],
  onChange,
  accentColor = '#2563eb',
}) {
  const theme = useTheme();
  const dragActive = useRef(false);
  const dragMoved = useRef(false);
  const suppressClick = useRef(false);

  const boundStart = projectStart ? toDayKey(projectStart) : null;
  const boundEnd = projectEnd ? toDayKey(projectEnd) : null;
  const initialCursor = boundStart ? dayjs(boundStart) : dayjs();

  const [calendarView, setCalendarView] = useState('monthly');
  const [viewMonth, setViewMonth] = useState(initialCursor.startOf('month'));
  const [viewYear, setViewYear] = useState(initialCursor.year());
  const [dragAnchorKey, setDragAnchorKey] = useState(null);
  const [dragCurrentKey, setDragCurrentKey] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingRange, setPendingRange] = useState(null);
  const [unitInput, setUnitInput] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [error, setError] = useState('');

  const normalizedPeriods = useMemo(
    () => normalizeUnitPeriodsFromApi(periods).filter((p) => Number(p.unit_no) > 0),
    [periods]
  );
  const remaining = getRemainingUnitAmount(totalUnits, normalizedPeriods);
  const distributed = sumUnitPeriodUnits(normalizedPeriods);

  const calendarDays = useMemo(
    () => buildCalendarDays(viewMonth, boundStart, boundEnd),
    [viewMonth, boundStart, boundEnd]
  );
  const yearMonths = useMemo(
    () => buildYearMonths(viewYear, boundStart, boundEnd),
    [viewYear, boundStart, boundEnd]
  );

  const selectionStartKey =
    dragAnchorKey && dragCurrentKey ? minDayKey(dragAnchorKey, dragCurrentKey) : null;
  const selectionEndKey =
    dragAnchorKey && dragCurrentKey ? maxDayKey(dragAnchorKey, dragCurrentKey) : null;

  const openAssignDialog = (startKey, endKey, editIndex = null) => {
    const clipped = clipRangeToBounds(startKey, endKey, boundStart, boundEnd);
    if (!clipped) {
      setError('Selected dates are outside the project timeline.');
      return;
    }

    const others = normalizedPeriods.filter((_, idx) => idx !== editIndex);
    const hasOverlap = others.some((period) =>
      rangesOverlap(clipped.start, clipped.end, period.start_date, period.end_date)
    );
    if (hasOverlap) {
      setError('Selected dates overlap an existing distribution. Remove or edit that range first.');
      return;
    }

    setError('');
    setPendingRange({ start: clipped.start, end: clipped.end });
    setEditingIndex(editIndex);
    const editUnits =
      editIndex != null ? Number(normalizedPeriods[editIndex]?.unit_no || 0) : 0;
    const maxUnits = getRemainingUnitAmount(totalUnits, others) + editUnits;
    setUnitInput(editUnits ? String(editUnits) : maxUnits ? String(maxUnits) : '');
    setDialogOpen(true);
  };

  const finishDayDrag = () => {
    if (!dragActive.current) return;
    dragActive.current = false;

    if (dragAnchorKey && dragCurrentKey) {
      const start = minDayKey(dragAnchorKey, dragCurrentKey);
      const end = maxDayKey(dragAnchorKey, dragCurrentKey);
      suppressClick.current = dragMoved.current;
      openAssignDialog(start, end);
    }

    setDragAnchorKey(null);
    setDragCurrentKey(null);
    dragMoved.current = false;
  };

  const handleMonthClick = (month) => {
    if (!month.selectable) return;
    setViewMonth(dayjs(`${month.year}-${String(month.month).padStart(2, '0')}-01`));
    setCalendarView('monthly');
  };

  const handleDayMouseDown = (day, event) => {
    event.preventDefault();
    if (!day.selectable) return;
    if (findRangeIndexForDay(normalizedPeriods, day.key) >= 0) return;

    dragActive.current = true;
    dragMoved.current = false;
    setDragAnchorKey(day.key);
    setDragCurrentKey(day.key);
  };

  const handleDayMouseEnter = (day) => {
    if (!dragActive.current || !day.selectable) return;
    if (day.key !== dragAnchorKey) dragMoved.current = true;
    setDragCurrentKey(day.key);
  };

  const handleDayClick = (day) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    const existingIndex = findRangeIndexForDay(normalizedPeriods, day.key);
    if (existingIndex >= 0) {
      const period = normalizedPeriods[existingIndex];
      openAssignDialog(period.start_date, period.end_date, existingIndex);
    }
  };

  const handleSaveRange = () => {
    const amount = Number(unitInput);
    if (!pendingRange) return;
    if (!amount || amount <= 0) {
      setError('Enter a unit amount greater than 0.');
      return;
    }

    const others = normalizedPeriods.filter((_, idx) => idx !== editingIndex);
    const maxAllowed =
      getRemainingUnitAmount(totalUnits, others) +
      (editingIndex != null ? Number(normalizedPeriods[editingIndex]?.unit_no || 0) : 0);

    if (amount > maxAllowed + 0.001) {
      setError(`You can assign at most ${maxAllowed.toFixed(2)} remaining units.`);
      return;
    }

    const next = [
      ...others,
      {
        period_type: 'range',
        start_date: pendingRange.start,
        end_date: pendingRange.end,
        unit_no: String(amount),
      },
    ].sort((a, b) => a.start_date.localeCompare(b.start_date));

    onChange?.(next);
    setDialogOpen(false);
    setPendingRange(null);
    setEditingIndex(null);
    setUnitInput('');
    setError('');
  };

  const handleDeleteRange = (index) => {
    onChange?.(normalizedPeriods.filter((_, idx) => idx !== index));
  };

  if (!boundStart || !boundEnd) {
    return (
      <Alert severity="info" sx={{ mt: 1 }}>
        Set the project Start Date and End Date first, then distribute units on the calendar.
      </Alert>
    );
  }

  const canGoPrevMonth =
    viewMonth.year() > dayjs(boundStart).year() ||
    (viewMonth.year() === dayjs(boundStart).year() &&
      viewMonth.month() > dayjs(boundStart).month());
  const canGoNextMonth =
    viewMonth.year() < dayjs(boundEnd).year() ||
    (viewMonth.year() === dayjs(boundEnd).year() &&
      viewMonth.month() < dayjs(boundEnd).month());

  const canGoPrevYear = viewYear > dayjs(boundStart).year();
  const canGoNextYear = viewYear < dayjs(boundEnd).year();

  return (
    <Box
      onMouseUp={() => {
        if (calendarView === 'monthly') finishDayDrag();
      }}
      onMouseLeave={() => {
        if (calendarView === 'monthly' && dragActive.current) finishDayDrag();
      }}
      sx={{
        mt: 1.25,
        p: 1.5,
        borderRadius: 1.5,
        border: `1px dashed ${alpha(accentColor, 0.35)}`,
        bgcolor: alpha('#fff', 0.75),
        userSelect: 'none',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1}
        sx={{ mb: 1.25 }}
      >
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>
            Unit distribution calendar
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Yearly view: click a month to open its day calendar. Monthly view: drag to select exact
            dates for unit distribution.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            label={`Distributed ${distributed.toFixed(2)} / ${Number(totalUnits || 0).toFixed(2)}`}
            color={Math.abs(distributed - Number(totalUnits || 0)) <= 0.01 ? 'success' : 'warning'}
          />
          <Chip size="small" variant="outlined" label={`Remaining ${remaining.toFixed(2)}`} />
        </Stack>
      </Stack>

      <Tabs
        value={calendarView}
        onChange={(_, value) => {
          setCalendarView(value);
          if (value === 'yearly') {
            setViewYear(viewMonth.year());
          }
        }}
        sx={{ mb: 1, minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5 } }}
      >
        {CALENDAR_VIEWS.map((tab) => (
          <Tab key={tab.value} value={tab.value} label={tab.label} />
        ))}
      </Tabs>

      {error && !dialogOpen ? (
        <Alert severity="warning" sx={{ mb: 1 }} onClose={() => setError('')}>
          {error}
        </Alert>
      ) : null}

      {calendarView === 'monthly' ? (
        <>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <IconButton
                size="small"
                onClick={() => setViewMonth((prev) => prev.subtract(1, 'month'))}
                disabled={!canGoPrevMonth}
              >
                <Iconify icon="solar:alt-arrow-left-bold" width={18} />
              </IconButton>
              <Button
                size="small"
                variant="text"
                onClick={() => {
                  setViewYear(viewMonth.year());
                  setCalendarView('yearly');
                }}
                sx={{ minWidth: 0, px: 0.5, fontSize: 12 }}
              >
                Year
              </Button>
            </Stack>
            <Typography variant="subtitle2" fontWeight={700}>
              {viewMonth.format('MMMM YYYY')}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setViewMonth((prev) => prev.add(1, 'month'))}
              disabled={!canGoNextMonth}
            >
              <Iconify icon="solar:alt-arrow-right-bold" width={18} />
            </IconButton>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: 0.5,
              mb: 1.25,
            }}
          >
            {WEEKDAYS.map((label) => (
              <Typography
                key={label}
                variant="caption"
                fontWeight={700}
                align="center"
                color="text.secondary"
              >
                {label}
              </Typography>
            ))}

            {calendarDays.map((day) => {
              const rangeIndex = findRangeIndexForDay(normalizedPeriods, day.key);
              const rangeColor =
                rangeIndex >= 0 ? RANGE_COLORS[rangeIndex % RANGE_COLORS.length] : null;
              const isSelected =
                selectionStartKey &&
                selectionEndKey &&
                isDayInRange(day.key, selectionStartKey, selectionEndKey);

              return (
                <Box
                  key={day.key}
                  onMouseDown={(event) => handleDayMouseDown(day, event)}
                  onMouseEnter={() => handleDayMouseEnter(day)}
                  onClick={() => handleDayClick(day)}
                  sx={{
                    minHeight: 42,
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                    bgcolor: !day.inMonth
                      ? alpha(theme.palette.grey[500], 0.06)
                      : rangeColor
                        ? alpha(rangeColor, 0.22)
                        : isSelected
                          ? alpha(accentColor, 0.18)
                          : day.selectable
                            ? 'background.paper'
                            : alpha(theme.palette.grey[500], 0.08),
                    color: day.inMonth ? 'text.primary' : 'text.disabled',
                    opacity: day.selectable ? 1 : 0.4,
                    cursor: day.selectable ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: rangeColor || isSelected ? 700 : 500,
                    outline: isSelected ? `2px solid ${accentColor}` : 'none',
                  }}
                >
                  {day.label}
                </Box>
              );
            })}
          </Box>
        </>
      ) : (
        <>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <IconButton
              size="small"
              onClick={() => setViewYear((prev) => prev - 1)}
              disabled={!canGoPrevYear}
            >
              <Iconify icon="solar:alt-arrow-left-bold" width={18} />
            </IconButton>
            <Typography variant="subtitle2" fontWeight={700}>
              {viewYear}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setViewYear((prev) => prev + 1)}
              disabled={!canGoNextYear}
            >
              <Iconify icon="solar:alt-arrow-right-bold" width={18} />
            </IconButton>
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Click a month to open its day calendar and distribute units.
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 1,
              mb: 1.25,
            }}
          >
            {yearMonths.map((month) => {
              const hasRange = normalizedPeriods.some((period) =>
                monthOverlapsRange(month.start, month.end, period.start_date, period.end_date)
              );

              return (
                <Box
                  key={month.key}
                  onClick={() => handleMonthClick(month)}
                  sx={{
                    py: 2,
                    px: 1,
                    borderRadius: 1.5,
                    textAlign: 'center',
                    border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                    bgcolor: hasRange
                      ? alpha(accentColor, 0.14)
                      : month.selectable
                        ? 'background.paper'
                        : alpha(theme.palette.grey[500], 0.08),
                    opacity: month.selectable ? 1 : 0.45,
                    cursor: month.selectable ? 'pointer' : 'not-allowed',
                    fontWeight: hasRange ? 700 : 500,
                    '&:hover': month.selectable
                      ? { bgcolor: alpha(accentColor, 0.1), borderColor: accentColor }
                      : undefined,
                  }}
                >
                  <Typography variant="body2">{month.label}</Typography>
                </Box>
              );
            })}
          </Box>
        </>
      )}

      {normalizedPeriods.length ? (
        <Stack spacing={0.75}>
          <Typography variant="caption" fontWeight={700} color="text.secondary">
            Scheduled distributions
          </Typography>
          {normalizedPeriods.map((period, index) => (
            <Stack
              key={`${period.start_date}-${period.end_date}-${index}`}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                px: 1,
                py: 0.75,
                borderRadius: 1,
                bgcolor: alpha(RANGE_COLORS[index % RANGE_COLORS.length], 0.1),
                border: `1px solid ${alpha(RANGE_COLORS[index % RANGE_COLORS.length], 0.25)}`,
              }}
            >
              <Typography variant="body2">
                {dayjs(period.start_date).format('DD MMM YYYY')} →{' '}
                {dayjs(period.end_date).format('DD MMM YYYY')} —{' '}
                <strong>{Number(period.unit_no).toFixed(2)}</strong> units
              </Typography>
              <Stack direction="row" spacing={0.5}>
                <IconButton
                  size="small"
                  onClick={() => openAssignDialog(period.start_date, period.end_date, index)}
                >
                  <Iconify icon="solar:pen-bold" width={16} />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDeleteRange(index)}>
                  <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                </IconButton>
              </Stack>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Typography variant="caption" color="text.secondary">
          No units scheduled yet. Drag on the calendar to create your first distribution.
        </Typography>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {editingIndex != null ? 'Edit distribution' : 'Assign units to selected period'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 0.5 }}>
            {pendingRange ? (
              <Typography variant="body2" color="text.secondary">
                {dayjs(pendingRange.start).format('DD MMM YYYY')} →{' '}
                {dayjs(pendingRange.end).format('DD MMM YYYY')}
              </Typography>
            ) : null}
            <Alert severity="info" icon={false} sx={{ py: 0.75 }}>
              Remaining units available:{' '}
              <strong>
                {(
                  getRemainingUnitAmount(totalUnits, normalizedPeriods) +
                  (editingIndex != null ? Number(normalizedPeriods[editingIndex]?.unit_no || 0) : 0)
                ).toFixed(2)}
              </strong>
            </Alert>
            <TextField
              autoFocus
              label="Units for this period"
              type="number"
              fullWidth
              value={unitInput}
              onChange={(event) => setUnitInput(event.target.value)}
              inputProps={{ min: 0, step: 'any' }}
              helperText="Total distributed units must equal the activity Unit No."
            />
            {error ? <Alert severity="error">{error}</Alert> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveRange}>
            Save distribution
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
