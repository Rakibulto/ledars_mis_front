import dayjs from 'dayjs';
import { useMemo, useCallback } from 'react';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { varAlpha } from 'src/theme/styles';
import { useGetAutoCutOffDate } from 'src/actions/settings';

import { Iconify } from 'src/components/iconify';

// Extend dayjs with additional plugins
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKEND_DAYS = [5, 6]; // Friday (5), Saturday (6)

export function MonthlyCalendar({
  selectedDate,
  onDateChange,
  highlightMode = 'selected',
  additionalHighlightCondition = null,
}) {
  const theme = useTheme();
  const { cutOffDate, cutOffDateLoading } = useGetAutoCutOffDate();

  const { periodStart, periodEnd } = useMemo(() => {
    if (cutOffDateLoading || !cutOffDate || cutOffDate.length === 0) {
      const defaultEnd = dayjs();
      const defaultCutoffDay = 25;
      const defaultPrevMonth = defaultEnd.subtract(1, 'month');
      const clampedDefault = Math.min(defaultCutoffDay, defaultPrevMonth.daysInMonth());
      const start = defaultPrevMonth.date(clampedDefault).add(1, 'day');
      return { periodStart: start, periodEnd: defaultEnd };
    }

    const cutoffObj = cutOffDate[0];
    const end = dayjs(cutoffObj.cut_off);
    const prevMonth = end.subtract(1, 'month');
    const clampedDay = Math.min(cutoffObj.date, prevMonth.daysInMonth());
    const start = prevMonth.date(clampedDay).add(1, 'day');
    return { periodStart: start, periodEnd: end };
  }, [cutOffDate, cutOffDateLoading]);

  // Generate array of days from periodStart to periodEnd
  const getCustomMonthlyDays = useCallback(() => {
    const daysArray = [];
    let current = periodStart;
    while (current.isSameOrBefore(periodEnd, 'day')) {
      daysArray.push(current);
      current = current.add(1, 'day');
    }
    return daysArray;
  }, [periodStart, periodEnd]);

  const calendarData = useMemo(() => {
    const days = getCustomMonthlyDays();
    const startDayOffset = days[0].day();
    const monthName =
      periodStart.format('MMMM YYYY') +
      (periodStart.month() !== periodEnd.month() ? ` - ${periodEnd.format('MMMM YYYY')}` : '');
    return {
      days,
      startDayOffset,
      monthName,
    };
  }, [getCustomMonthlyDays, periodStart, periodEnd]);

  const isDateClickable = (date) => dayjs(date).isSameOrBefore(dayjs(), 'day');

  const handleDateClick = (date) => {
    if (isDateClickable(date)) {
      onDateChange(date.toDate());
    }
  };

  const handlePreviousMonth = () => {
    const newDate = dayjs(selectedDate).subtract(1, 'month');
    onDateChange(newDate.toDate());
  };

  const handleNextMonth = () => {
    const newDate = dayjs(selectedDate).add(1, 'month');
    onDateChange(newDate.toDate());
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          onClick={handlePreviousMonth}
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          sx={{ borderRadius: 1.5 }}
        >
          Previous
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {calendarData.monthName}
        </Typography>
        <Button
          variant="outlined"
          onClick={handleNextMonth}
          endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
          sx={{ borderRadius: 1.5 }}
        >
          Next
        </Button>
      </Stack>

      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500, color: 'text.secondary' }}>
        Selected: {dayjs(selectedDate).format('DD MMMM YYYY')}
      </Typography>

      <Card sx={{ p: 2, overflow: 'hidden', boxShadow: theme.customShadows.z8 }}>
        <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1} sx={{ mb: 1 }}>
          {WEEKDAYS.map((day, idx) => (
            <Box
              key={day}
              sx={{
                p: 1.5,
                textAlign: 'center',
                fontWeight: 'bold',
                borderRadius: 1,
                color: WEEKEND_DAYS.includes(idx)
                  ? theme.palette.secondary.main
                  : theme.palette.blue.main,
                bgcolor: WEEKEND_DAYS.includes(idx)
                  ? alpha(theme.palette.secondary.main, 0.08)
                  : varAlpha(theme.palette.blue.mainChannel, 0.08),
              }}
            >
              {day}
            </Box>
          ))}
        </Box>

        <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1} sx={{ mt: 1 }}>
          {Array.from({ length: calendarData.startDayOffset }).map((_, index) => (
            <Box key={`empty-${index}`} />
          ))}

          {calendarData.days.map((date) => {
            const dayNumber = date.format('D');
            const isTodayDate = date.isSame(dayjs(), 'day');
            const isFutureDate = !isDateClickable(date);
            const isSelectedDate = date.isSame(dayjs(selectedDate), 'day');
            const isWeekend = WEEKEND_DAYS.includes(date.day());

            const isDateHighlighted =
              highlightMode === 'selected'
                ? isSelectedDate
                : additionalHighlightCondition
                  ? additionalHighlightCondition(date.toDate())
                  : isSelectedDate;

            return (
              <Box
                key={date.format('YYYY-MM-DD')}
                onClick={() => !isFutureDate && handleDateClick(date)}
                sx={{
                  p: 1.5,
                  textAlign: 'center',
                  cursor: isFutureDate ? 'not-allowed' : 'pointer',
                  fontWeight: isTodayDate || isWeekend ? 'bold' : 'normal',
                  borderRadius: 1.5,
                  transition: 'all 0.2s ease-in-out',
                  ...(isDateHighlighted && {
                    color: theme.palette.common.white,
                    backgroundColor: theme.palette.blue.main,
                    boxShadow: theme.customShadows.blue,
                  }),
                  ...(isWeekend &&
                    !isDateHighlighted && {
                      color: theme.palette.secondary.dark,
                      backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                    }),
                  ...(isTodayDate &&
                    !isDateHighlighted && {
                      outline: `2px solid ${theme.palette.blue.main}`,
                    }),
                  ...(isFutureDate && {
                    color: theme.palette.text.disabled,
                    backgroundColor: theme.palette.action.disabledBackground,
                  }),
                  ...(!isDateHighlighted &&
                    !isTodayDate &&
                    !isFutureDate &&
                    !isWeekend && {
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                        transform: 'scale(1.05)',
                      },
                    }),
                }}
              >
                {dayNumber}
              </Box>
            );
          })}
        </Box>
      </Card>
    </Box>
  );
}
