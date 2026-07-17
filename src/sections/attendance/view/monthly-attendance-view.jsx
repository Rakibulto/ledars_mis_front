'use client';

import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekday from 'dayjs/plugin/weekday';
import isBetween from 'dayjs/plugin/isBetween';
import { useSearchParams } from 'next/navigation';
import { useRef, useMemo, useEffect, useReducer, forwardRef, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import Slide from '@mui/material/Slide';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ToggleButton from '@mui/material/ToggleButton';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import LinearProgress from '@mui/material/LinearProgress';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { fetcher, endpoints } from 'src/utils/axios';

import { DashboardContent } from 'src/layouts/dashboard/main';
import { useGetMonthlyAttendanceReport } from 'src/actions/attendance';
import {
  useGetBranches,
  useGetDepartments,
  useGetDesignations,
  useGetAutoCutOffDate,
} from 'src/actions/settings';

import { Iconify } from 'src/components/iconify';
import { MonthSelector } from 'src/components/month-selector';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { RenderContentLoading } from 'src/components/loading/render-content-loading';

import { useAuthContext } from 'src/auth/hooks';

import { MonthlyAttendanceTable } from '../monthly-attendance-table';
import { AttendanceFilters } from '../components/attendance-filters';
import { getDateDiffInDays, exportMonthlyAttendanceToExcel } from '../utils/attendance-utils';

dayjs.extend(isoWeek);
dayjs.extend(weekday);
dayjs.extend(isBetween);

const Transition = forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

export function MonthlyAttendanceView() {
  const searchParams = useSearchParams();
  const periodParam = searchParams.get('period');
  const loadingTimerRef = useRef(null);
  const userHasSelectedMonthRef = useRef(false);

  const { cutOffDate, cutOffDateLoading } = useGetAutoCutOffDate();
  const cutoffDay = cutOffDateLoading
    ? null
    : cutOffDate && cutOffDate[0]
      ? cutOffDate[0].date
      : 25;

  const today = dayjs();
  const cutoffDate =
    cutOffDateLoading || !cutOffDate || !cutOffDate[0] ? dayjs() : dayjs(cutOffDate[0].cut_off);
  let currentYear = cutoffDate.year();
  let currentMonth = cutoffDate.month() + 1;
  if (today.isAfter(cutoffDate, 'day')) {
    currentMonth += 1;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear += 1;
    }
  }

  const initialState = {
    selectedYear: currentYear,
    selectedMonth: currentMonth,
    timePeriod: periodParam || 'thisMonth',
    departmentFilter: '',
    designationFilter: '',
    employeeIdFilter: '',
    branchFilter: '',
    lateIn: false,
    onLeave: false,
    absent: false,
    present: false,
    earlyOut: false,
    openSummaryDialog: false,
    isLoading: false,
    excelExportLoading: false,
    excelExportType: null,
    startDate: null,
    endDate: null,
    openDateRangePicker: false,
    page: 1,
  };

  function reducer(state, action) {
    switch (action.type) {
      case 'SET_YEAR':
        return {
          ...state,
          selectedYear: action.payload,
          timePeriod: null,
          startDate: null,
          endDate: null,
          excelExportLoading: false,
        };
      case 'SET_MONTH':
        return {
          ...state,
          selectedMonth: action.payload,
          timePeriod: null,
          startDate: null,
          endDate: null,
          excelExportLoading: false,
        };
      case 'SET_TIME_PERIOD':
        return {
          ...state,
          timePeriod: action.payload,
          excelExportLoading: false,
        };
      case 'SET_DEPARTMENT_FILTER':
        return { ...state, departmentFilter: action.payload, excelExportLoading: false };
      case 'SET_DESIGNATION_FILTER':
        return { ...state, designationFilter: action.payload, excelExportLoading: false };
      case 'SET_EMPLOYEE_FILTER':
        return { ...state, employeeIdFilter: action.payload, excelExportLoading: false };
      case 'SET_BRANCH_FILTER':
        return { ...state, branchFilter: action.payload, excelExportLoading: false };
      case 'TOGGLE_SUMMARY_DIALOG':
        return { ...state, openSummaryDialog: !state.openSummaryDialog };
      case 'SET_LOADING':
        return { ...state, isLoading: action.payload };
      case 'START_EXCEL_EXPORT':
        return {
          ...state,
          excelExportLoading: true,
          excelExportType: action.payload,
        };
      case 'END_EXCEL_EXPORT':
        return {
          ...state,
          excelExportLoading: false,
          excelExportType: null,
        };
      case 'TOGGLE_LATE_IN':
        return { ...state, lateIn: !state.lateIn, excelExportLoading: false };
      case 'TOGGLE_ON_LEAVE':
        return { ...state, onLeave: !state.onLeave, excelExportLoading: false };
      case 'TOGGLE_ABSENT':
        return { ...state, absent: !state.absent, excelExportLoading: false };
      case 'TOGGLE_PRESENT':
        return { ...state, present: !state.present, excelExportLoading: false };
      case 'TOGGLE_EARLY_OUT':
        return { ...state, earlyOut: !state.earlyOut, excelExportLoading: false };
      case 'SET_START_DATE':
        return { ...state, startDate: action.payload, timePeriod: null, excelExportLoading: false };
      case 'SET_END_DATE':
        return { ...state, endDate: action.payload, timePeriod: null, excelExportLoading: false };
      case 'OPEN_DATE_RANGE_PICKER':
        return { ...state, openDateRangePicker: true };
      case 'CLOSE_DATE_RANGE_PICKER':
        return { ...state, openDateRangePicker: false };
      case 'RESET_DATE_RANGE':
        return {
          ...state,
          startDate: null,
          endDate: null,
          openDateRangePicker: false,
          timePeriod: 'thisMonth',
          excelExportLoading: false,
        };
      case 'SET_PAGE':
        return { ...state, page: action.payload };
      default:
        return state;
    }
  }

  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    selectedYear,
    selectedMonth,
    timePeriod,
    departmentFilter,
    designationFilter,
    employeeIdFilter,
    branchFilter,
    openSummaryDialog,
    isLoading,
    excelExportLoading,
    excelExportType,
    lateIn,
    onLeave,
    absent,
    present,
    earlyOut,
    startDate,
    endDate,
    page,
  } = state;

  useEffect(() => {
    if (!cutOffDateLoading && cutOffDate && cutOffDate[0] && !userHasSelectedMonthRef.current) {
      const realCutoff = dayjs(cutOffDate[0].cut_off);
      const now = dayjs();
      let newYear = realCutoff.year();
      let newMonth = realCutoff.month() + 1;

      if (now.isAfter(realCutoff, 'day')) {
        newMonth += 1;
        if (newMonth > 12) {
          newMonth = 1;
          newYear += 1;
        }
      }

      if (
        !periodParam &&
        !startDate &&
        !endDate &&
        (selectedYear !== newYear || selectedMonth !== newMonth)
      ) {
        dispatch({ type: 'SET_YEAR', payload: newYear });
        dispatch({ type: 'SET_MONTH', payload: newMonth });
      }
    }
  }, [cutOffDateLoading, cutOffDate, endDate, periodParam, selectedMonth, selectedYear, startDate]);

  const { departments, departmentsLoading } = useGetDepartments();
  const { designations, designationsLoading } = useGetDesignations();
  const { branches, branchesLoading } = useGetBranches();

  const {
    tableData,
    pagination,
    isLoading: attendanceLoading,
  } = useGetMonthlyAttendanceReport({
    timePeriod,
    selectedYear,
    selectedMonth,
    departmentFilter,
    designationFilter,
    keywordFilter: employeeIdFilter,
    branchFilter,
    lateIn,
    onLeave,
    absent,
    present,
    earlyOut,
    startDate,
    endDate,
    cutoffDay,
    page,
  });

  const handleFilterChange = useCallback((type, value) => {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type, payload: value });
    dispatch({ type: 'SET_PAGE', payload: 1 }); // Reset to page 1 on filter change

    loadingTimerRef.current = setTimeout(() => {
      dispatch({ type: 'SET_LOADING', payload: false });
    }, 500);
  }, []);

  const handleDepartmentChange = useCallback(
    (e) => {
      handleFilterChange('SET_DEPARTMENT_FILTER', e.target.value);
    },
    [handleFilterChange]
  );

  const handleDesignationChange = useCallback(
    (e) => {
      handleFilterChange('SET_DESIGNATION_FILTER', e.target.value);
    },
    [handleFilterChange]
  );

  const handleKeywordChange = useCallback(
    (e) => {
      handleFilterChange('SET_EMPLOYEE_FILTER', e.target.value);
    },
    [handleFilterChange]
  );

  const handleBranchChange = useCallback(
    (e) => {
      handleFilterChange('SET_BRANCH_FILTER', e.target.value);
    },
    [handleFilterChange]
  );

  const getPeriodTitle = () => {
    const titles = {
      last7Days: 'Last 7 Days Attendance',
      last15Days: 'Last 15 Days Attendance',
      last30Days: 'Last 30 Days Attendance',
      thisMonth: 'This Month Attendance',
      lastMonth: 'Last Month Attendance',
    };

    return titles[timePeriod] || 'Monthly Attendance';
  };

  const filteredAttendanceList = useMemo(() => tableData || [], [tableData]);

  const groupedAttendanceList = useMemo(() => {
    if (!Array.isArray(tableData)) return [];

    if (
      tableData.length > 0 &&
      tableData[0].employee_info &&
      Array.isArray(tableData[0].attendance)
    ) {
      return tableData;
    }

    const groupedByEmployee = {};

    tableData.forEach((record) => {
      if (!record || !record.user_info) return;

      const { employeeId } = record.user_info;
      if (!employeeId) return;

      if (!groupedByEmployee[employeeId]) {
        groupedByEmployee[employeeId] = {
          employee_info: record.user_info,
          attendance: [],
        };
      }

      const {
        date,
        is_late,
        timestamps,
        check_in,
        check_out,
        late_by,
        early_out_by,
        status,
        remarks,
      } = record;

      groupedByEmployee[employeeId].attendance.push({
        date,
        is_late,
        timestamps,
        check_in,
        check_out,
        late_by,
        early_out_by,
        status,
        remarks,
      });
    });

    return Object.values(groupedByEmployee);
  }, [tableData]);

  const departmentDesignationSummary = useMemo(() => {
    const summary = {};

    if (!Array.isArray(groupedAttendanceList)) {
      return summary;
    }

    groupedAttendanceList.forEach((employee) => {
      const department = employee.employee_info.department || 'Unknown';
      const designation = employee.employee_info.designation || 'Unknown';

      if (!summary[department]) {
        summary[department] = [];
      }

      const existing = summary[department].find((d) => d.designation === designation);
      if (existing) {
        existing.count += 1;
      } else {
        summary[department].push({ designation, count: 1 });
      }
    });

    return summary;
  }, [groupedAttendanceList]);

  // Custom date range validation
  const customRangeTooLong = startDate && endDate && getDateDiffInDays(startDate, endDate) > 31;

  const handleExportExcel = async () => {
    dispatch({ type: 'START_EXCEL_EXPORT', payload: 'all' });
    try {
      const queryParams = new URLSearchParams();

      // Add pagination parameters for export - large page size to get all data
      queryParams.append('page', 1);
      queryParams.append('page_size', '10000');
      queryParams.append('pagination', 'true');

      const effectiveCutoffDay = cutoffDay || 25;

      if (startDate && endDate) {
        queryParams.append('start_date', dayjs(startDate).format('YYYY-MM-DD'));
        queryParams.append('end_date', dayjs(endDate).format('YYYY-MM-DD'));
      } else if (!timePeriod && selectedYear && selectedMonth) {
        const exportCurrentMonth = dayjs(
          `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
        );
        const exportPrevMonth = exportCurrentMonth.subtract(1, 'month');
        const daysInPrevMonth = exportPrevMonth.daysInMonth();
        const startDay = Math.min(effectiveCutoffDay + 1, daysInPrevMonth);
        const start = exportPrevMonth.date(startDay).format('YYYY-MM-DD');
        const daysInCurrentMonth = exportCurrentMonth.daysInMonth();
        const endDay = Math.min(effectiveCutoffDay, daysInCurrentMonth);
        const end = exportCurrentMonth.date(endDay).format('YYYY-MM-DD');
        queryParams.append('start_date', start);
        queryParams.append('end_date', end);
      } else if (timePeriod === 'thisMonth' && selectedYear && selectedMonth) {
        const exportCurrentMonth = dayjs(
          `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
        );
        const exportPrevMonth = exportCurrentMonth.subtract(1, 'month');
        const daysInPrevMonth = exportPrevMonth.daysInMonth();
        const startDay = Math.min(effectiveCutoffDay + 1, daysInPrevMonth);
        const start = exportPrevMonth.date(startDay).format('YYYY-MM-DD');
        const end = dayjs().format('YYYY-MM-DD');
        queryParams.append('start_date', start);
        queryParams.append('end_date', end);
      } else if (timePeriod === 'lastMonth' && selectedYear && selectedMonth) {
        const exportPrevMonth = dayjs(
          `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
        ).subtract(1, 'month');
        const exportPrevPrevMonth = exportPrevMonth.subtract(1, 'month');
        const daysInPrevPrevMonth = exportPrevPrevMonth.daysInMonth();
        const startDay = Math.min(effectiveCutoffDay + 1, daysInPrevPrevMonth);
        const start = exportPrevPrevMonth.date(startDay).format('YYYY-MM-DD');
        const daysInPrevMonth = exportPrevMonth.daysInMonth();
        const endDay = Math.min(effectiveCutoffDay, daysInPrevMonth);
        const end = exportPrevMonth.date(endDay).format('YYYY-MM-DD');
        queryParams.append('start_date', start);
        queryParams.append('end_date', end);
      } else if (timePeriod === 'last7Days') {
        const last7DaysEnd = dayjs().format('YYYY-MM-DD');
        const last7DaysStart = dayjs().subtract(6, 'day').format('YYYY-MM-DD');
        queryParams.append('start_date', last7DaysStart);
        queryParams.append('end_date', last7DaysEnd);
      } else if (timePeriod === 'last15Days') {
        const last15DaysEnd = dayjs().format('YYYY-MM-DD');
        const last15DaysStart = dayjs().subtract(14, 'day').format('YYYY-MM-DD');
        queryParams.append('start_date', last15DaysStart);
        queryParams.append('end_date', last15DaysEnd);
      } else if (timePeriod === 'last30Days') {
        const last30DaysEnd = dayjs().format('YYYY-MM-DD');
        const last30DaysStart = dayjs().subtract(29, 'day').format('YYYY-MM-DD');
        queryParams.append('start_date', last30DaysStart);
        queryParams.append('end_date', last30DaysEnd);
      }

      if (departmentFilter) queryParams.append('department', departmentFilter);
      if (designationFilter) queryParams.append('designation', designationFilter);
      if (employeeIdFilter) queryParams.append('keywords', employeeIdFilter);
      if (branchFilter) queryParams.append('branch', branchFilter);
      if (lateIn) queryParams.append('late_in', 'true');
      if (onLeave) queryParams.append('on_leave', 'true');
      if (absent) queryParams.append('absent', 'true');
      if (present) queryParams.append('present', 'true');
      if (earlyOut) queryParams.append('early_out', 'true');

      const queryString = queryParams.toString();
      const url = `${endpoints.attendance.report}${queryString ? `?${queryString}` : ''}`;

      const response = await fetcher(url);
      const allTableData = response.results || response;

      // Group the data like groupedAttendanceList
      const allGroupedAttendanceList = (() => {
        if (!Array.isArray(allTableData)) return [];

        if (
          allTableData.length > 0 &&
          allTableData[0].employee_info &&
          Array.isArray(allTableData[0].attendance)
        ) {
          return allTableData;
        }

        const groupedByEmployee = {};

        allTableData.forEach((record) => {
          if (!record || !record.user_info) return;

          const { employeeId } = record.user_info;
          if (!employeeId) return;

          if (!groupedByEmployee[employeeId]) {
            groupedByEmployee[employeeId] = {
              employee_info: record.user_info,
              attendance: [],
            };
          }

          const {
            date,
            is_late,
            timestamps,
            check_in,
            check_out,
            late_by,
            early_out_by,
            status,
            remarks,
          } = record;

          groupedByEmployee[employeeId].attendance.push({
            date,
            is_late,
            timestamps,
            check_in,
            check_out,
            late_by,
            early_out_by,
            status,
            remarks,
          });
        });

        return Object.values(groupedByEmployee);
      })();

      await exportMonthlyAttendanceToExcel(
        allGroupedAttendanceList,
        `monthly-attendance.${selectedYear}-${String(selectedMonth).padStart(2, '0')}.xlsx`
      );
    } finally {
      dispatch({ type: 'END_EXCEL_EXPORT' });
    }
  };

  const { user } = useAuthContext();
  const isEmployee = user?.role === 'Employee';

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={getPeriodTitle()}
        links={[{ name: 'Dashboard', href: '/' }, { name: 'Attendance' }]}
        sx={{ mb: 3 }}
      />

      {!periodParam && (
        <Card sx={{ p: 3, mb: 3 }}>
          <Stack spacing={3}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="subtitle1" sx={{ minWidth: 120 }}>
                Select Year:
              </Typography>
              <Select
                value={selectedYear}
                onChange={(e) => {
                  userHasSelectedMonthRef.current = true;
                  dispatch({ type: 'SET_YEAR', payload: e.target.value });
                }}
                size="small"
                sx={{ minWidth: 120 }}
              >
                {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Select Month:
              </Typography>
              <MonthSelector
                selectedMonth={selectedMonth}
                onChange={(month) => {
                  userHasSelectedMonthRef.current = true;
                  dispatch({ type: 'SET_MONTH', payload: month });
                }}
                variant="button"
                showTitle={false}
                gridConfig={{
                  xs: 'repeat(3, 1fr)',
                  sm: 'repeat(4, 1fr)',
                  md: 'repeat(6, 1fr)',
                  lg: 'repeat(12, 1fr)',
                }}
              />
            </Box>
          </Stack>
        </Card>
      )}

      <Card
        sx={{
          p: 3,
          mb: 3,
          bgcolor: (theme) => alpha(theme.palette.blue.lighter, 0.1),
        }}
      >
        <Stack spacing={3}>
          {!isEmployee && (
            <AttendanceFilters
              departments={departments}
              designations={designations}
              branches={branches}
              departmentFilter={departmentFilter}
              designationFilter={designationFilter}
              keywordFilter={employeeIdFilter}
              branchFilter={branchFilter}
              onDepartmentChange={handleDepartmentChange}
              onDesignationChange={handleDesignationChange}
              onKeywordChange={handleKeywordChange}
              onBranchChange={handleBranchChange}
              flag
            />
          )}

          {/* Date range picker */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
            width="100%"
          >
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                width: { xs: '100%', md: '49%' },
              }}
            >
              <DatePicker
                openTo="day"
                format="DD/MM/YYYY"
                label="Start date"
                value={startDate}
                onChange={(date) => dispatch({ type: 'SET_START_DATE', payload: date })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error:
                      !!(startDate && endDate && dayjs(startDate).isAfter(dayjs(endDate))) ||
                      customRangeTooLong,
                    helperText:
                      startDate && endDate && dayjs(startDate).isAfter(dayjs(endDate))
                        ? 'Start date must be before end date'
                        : customRangeTooLong
                          ? 'Custom date range cannot exceed 31 days'
                          : '',
                  },
                }}
              />
              <DatePicker
                openTo="day"
                format="DD/MM/YYYY"
                label="End date"
                value={endDate}
                onChange={(date) => dispatch({ type: 'SET_END_DATE', payload: date })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error:
                      !!(startDate && endDate && dayjs(startDate).isAfter(dayjs(endDate))) ||
                      customRangeTooLong,
                    helperText:
                      startDate && endDate && dayjs(startDate).isAfter(dayjs(endDate))
                        ? 'End date must be after start date'
                        : customRangeTooLong
                          ? 'Custom date range cannot exceed 31 days'
                          : '',
                  },
                }}
              />
            </Box>

            <ToggleButtonGroup
              value={[
                lateIn && 'lateIn',
                earlyOut && 'earlyOut',
                onLeave && 'onLeave',
                absent && 'absent',
                present && 'present',
              ].filter(Boolean)}
              onChange={(event, newValues) => {
                if (newValues.includes('lateIn') !== lateIn) dispatch({ type: 'TOGGLE_LATE_IN' });
                if (newValues.includes('earlyOut') !== earlyOut)
                  dispatch({ type: 'TOGGLE_EARLY_OUT' });
                if (newValues.includes('onLeave') !== onLeave)
                  dispatch({ type: 'TOGGLE_ON_LEAVE' });
                if (newValues.includes('absent') !== absent) dispatch({ type: 'TOGGLE_ABSENT' });
                if (newValues.includes('present') !== present) dispatch({ type: 'TOGGLE_PRESENT' });
              }}
              aria-label="attendance status filters"
              sx={{
                flexWrap: { xs: 'wrap', md: 'nowrap' },
                width: { xs: '100%', md: '50%' },
                justifyContent: 'flex-start',
              }}
            >
              <ToggleButton value="lateIn" aria-label="Late In" selected={lateIn}>
                <Iconify
                  icon="solar:clock-circle-bold-duotone"
                  sx={{ mr: 0.5, color: 'orange.main' }}
                />
                Late In
              </ToggleButton>
              <ToggleButton value="earlyOut" aria-label="Early Out" selected={earlyOut}>
                <Iconify icon="solar:logout-2-bold-duotone" sx={{ mr: 0.5, color: 'pink.main' }} />
                Early Out
              </ToggleButton>
              <ToggleButton value="onLeave" aria-label="On Leave" selected={onLeave}>
                <Iconify
                  icon="ic:twotone-holiday-village"
                  sx={{ mr: 0.5, color: 'warning.main' }}
                />
                On Leave
              </ToggleButton>
              <ToggleButton value="absent" aria-label="Absent" selected={absent}>
                <Iconify icon="mynaui:calendar-x-solid" sx={{ mr: 0.5, color: 'error.main' }} />
                Absent
              </ToggleButton>
              <ToggleButton value="present" aria-label="Present" selected={present}>
                <Iconify
                  icon="solar:check-circle-bold-duotone"
                  sx={{ mr: 0.5, color: 'success.main' }}
                />
                Present
              </ToggleButton>
            </ToggleButtonGroup>
            {(departmentFilter ||
              designationFilter ||
              employeeIdFilter ||
              branchFilter ||
              lateIn ||
              onLeave ||
              absent ||
              present ||
              earlyOut ||
              startDate ||
              endDate) && (
              <Button
                variant="text"
                color="error"
                onClick={() => {
                  // Reset all filters
                  dispatch({ type: 'SET_DEPARTMENT_FILTER', payload: '' });
                  dispatch({ type: 'SET_DESIGNATION_FILTER', payload: '' });
                  dispatch({ type: 'SET_EMPLOYEE_FILTER', payload: '' });
                  dispatch({ type: 'SET_BRANCH_FILTER', payload: '' });
                  dispatch({ type: 'RESET_DATE_RANGE' });
                  dispatch({ type: 'SET_PAGE', payload: 1 });
                  if (lateIn) dispatch({ type: 'TOGGLE_LATE_IN' });
                  if (onLeave) dispatch({ type: 'TOGGLE_ON_LEAVE' });
                  if (absent) dispatch({ type: 'TOGGLE_ABSENT' });
                  if (present) dispatch({ type: 'TOGGLE_PRESENT' });
                  if (earlyOut) dispatch({ type: 'TOGGLE_EARLY_OUT' });
                }}
              >
                Reset
              </Button>
            )}
          </Stack>

          {!isEmployee && (
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              spacing={2}
            >
              <Button
                variant="soft"
                color="primary"
                startIcon={<Iconify icon="mdi:chart-box-outline" />}
                onClick={() => dispatch({ type: 'TOGGLE_SUMMARY_DIALOG' })}
              >
                View Summary
              </Button>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={
                    excelExportLoading && excelExportType === 'all' ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <Iconify icon="eva:file-text-fill" />
                    )
                  }
                  onClick={handleExportExcel}
                  disabled={excelExportLoading}
                >
                  {excelExportLoading && excelExportType === 'all'
                    ? 'Generating...'
                    : 'Export Report'}
                </Button>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Card>

      {!isEmployee && (
        <Box
          sx={{
            mb: 3,
            display: 'grid',
            gap: 3,
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
          }}
        >
          <Card sx={{ p: 3, height: '100%' }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                Total Employees
              </Typography>
              <Typography variant="h3">
                {pagination?.total_count || groupedAttendanceList.length}
              </Typography>
              <LinearProgress
                variant="determinate"
                color="blue"
                value={100}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Stack>
          </Card>

          <Card sx={{ p: 3, height: '100%' }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                Departments
              </Typography>
              <Typography variant="h3">{departments.length}</Typography>
              <Box component="span" sx={{ color: 'text.secondary', typography: 'body2' }}>
                Active departments with attendance records
              </Box>
            </Stack>
          </Card>

          <Card sx={{ p: 3, height: '100%' }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                Designations
              </Typography>
              <Typography variant="h3">{designations.length}</Typography>
              <Box component="span" sx={{ color: 'text.secondary', typography: 'body2' }}>
                Different roles across departments
              </Box>
            </Stack>
          </Card>
        </Box>
      )}

      {attendanceLoading ||
      departmentsLoading ||
      designationsLoading ||
      branchesLoading ||
      isLoading ? (
        <RenderContentLoading showAnalytics={false} />
      ) : (
        <MonthlyAttendanceTable
          attendanceData={{
            results: groupedAttendanceList,
          }}
          tableHead={generateTableHead(
            selectedYear,
            selectedMonth,
            timePeriod,
            startDate,
            endDate,
            cutoffDay
          )}
          year={selectedYear}
          month={selectedMonth}
          pagination={pagination}
          onPageChange={(newPage) => dispatch({ type: 'SET_PAGE', payload: newPage })}
        />
      )}

      <Dialog
        open={openSummaryDialog}
        onClose={() => dispatch({ type: 'TOGGLE_SUMMARY_DIALOG' })}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: (theme) => theme.customShadows.z24,
          },
        }}
        TransitionComponent={Transition}
      >
        <DialogTitle sx={{ pb: 0 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Department & Designation Summary
          </Typography>
          <Typography variant="body2" color="text.secondary">
            User count by department and designation
          </Typography>
        </DialogTitle>
        <Divider sx={{ mb: 0.5 }} />
        <DialogContent sx={{ p: 0 }}>
          <TableContainer component={Paper} sx={{ boxShadow: 'none', borderRadius: 0 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', width: 180 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 180 }}>Designation</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', width: 80 }}>
                    Count
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(departmentDesignationSummary || {}).map(
                  ([department, desigList], deptIdx) =>
                    desigList.map((item, index) => (
                      <TableRow
                        key={`${department}-${item.designation}`}
                        sx={{
                          backgroundColor: index % 2 === 0 ? 'background.paper' : 'grey.100',
                        }}
                      >
                        {index === 0 && (
                          <TableCell
                            rowSpan={desigList.length}
                            sx={{
                              fontWeight: 'bold',
                              background: 'rgba(0,0,0,0.03)',
                              borderRight: '1px solid #eee',
                              verticalAlign: 'middle',
                            }}
                          >
                            {department}
                          </TableCell>
                        )}
                        <TableCell sx={{ pl: 2 }}>{item.designation}</TableCell>
                        <TableCell align="right">{item.count}</TableCell>
                      </TableRow>
                    ))
                )}
                <TableRow>
                  <TableCell
                    colSpan={2}
                    sx={{ fontWeight: 'bold', background: 'rgba(0,0,0,0.04)' }}
                  >
                    Total
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 'bold', background: 'rgba(0,0,0,0.04)' }}
                  >
                    {Array.isArray(filteredAttendanceList) ? filteredAttendanceList.length : 0}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>
    </DashboardContent>
  );
}

function generateTableHead(year, month, timePeriod, startDate, endDate, cutoffDay = 25) {
  let days;
  const today = dayjs();

  // If custom date range is applied, use it for table head
  if (startDate && endDate) {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    days = getDaysInInterval(start, end);
  } else {
    switch (timePeriod) {
      case 'last7Days': {
        const end = dayjs();
        const start = end.subtract(6, 'day');
        days = getDaysInInterval(start, end);
        break;
      }
      case 'last15Days': {
        const end = dayjs();
        const start = end.subtract(14, 'day');
        days = getDaysInInterval(start, end);
        break;
      }
      case 'last30Days': {
        const end = dayjs();
        const start = end.subtract(29, 'day');
        days = getDaysInInterval(start, end);
        break;
      }
      case 'thisWeek': {
        const start = today.startOf('week');
        days = getDaysInInterval(start, today);
        break;
      }
      case 'thisMonth': {
        // Show from cutoffDay+1 of previous month to today
        const prevMonth = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).subtract(
          1,
          'month'
        );
        const daysInPrevMonth = prevMonth.daysInMonth();
        const clampedDay = Math.min(cutoffDay, daysInPrevMonth);
        const start = prevMonth.date(clampedDay).add(1, 'day');
        const end = dayjs(); // today
        days = getDaysInInterval(start, end);
        break;
      }
      case 'lastMonth': {
        // Show from cutoffDay+1 of two months ago to cutoffDay of previous month
        const prevMonth = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).subtract(
          1,
          'month'
        );
        const prevPrevMonth = prevMonth.subtract(1, 'month');
        const daysInPrevPrevMonth = prevPrevMonth.daysInMonth();
        const clampedStartDay = Math.min(cutoffDay, daysInPrevPrevMonth);
        const start = prevPrevMonth.date(clampedStartDay).add(1, 'day');
        const daysInPrevMonth = prevMonth.daysInMonth();
        const endDay = Math.min(cutoffDay, daysInPrevMonth);
        const end = prevMonth.date(endDay);
        days = getDaysInInterval(start, end);
        break;
      }
      default: {
        // Show from cutoffDay+1 of previous month to cutoffDay of current month
        const currentMonth = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
        const prevMonth = currentMonth.subtract(1, 'month');
        const daysInPrevMonth = prevMonth.daysInMonth();
        const clampedStartDay = Math.min(cutoffDay, daysInPrevMonth);
        const start = prevMonth.date(clampedStartDay).add(1, 'day');
        const daysInCurrentMonth = currentMonth.daysInMonth();
        const endDay = Math.min(cutoffDay, daysInCurrentMonth);
        const end = currentMonth.date(endDay);
        days = getDaysInInterval(start, end);
      }
    }
  }

  return [
    { id: 'name', label: 'Employee' },
    ...days.map((date) => {
      const firstDayOfMonth = date.startOf('month');
      const dayOfMonth = date.date();
      const adjustedDayOfWeek = (firstDayOfMonth.day() + 1) % 7;
      const weekNumber = Math.ceil((dayOfMonth + adjustedDayOfWeek) / 7);

      return {
        id: date.format('D'),
        label: date.format('D'),
        fullDate: date.format('YYYY-MM-DD'),
        weekNumber,
        isFriday: date.format('ddd') === 'Fri',
      };
    }),
    { id: 'summary', label: 'Summary' },
  ];
}

// Helper function to generate array of days between two dates
function getDaysInInterval(start, end) {
  const days = [];
  let currentDay = start;

  while (currentDay.isBefore(end) || currentDay.isSame(end, 'day')) {
    days.push(currentDay);
    currentDay = currentDay.add(1, 'day');
  }

  return days;
}
