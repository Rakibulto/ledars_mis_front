'use client';

import dayjs from 'dayjs';
import { useMemo, useReducer } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { ATTENDANCE_STATUS_OPTIONS } from 'src/_mock/options';
import { useGetAttendanceReport } from 'src/actions/attendance';
import { useGetBranches, useGetDepartments, useGetDesignations } from 'src/actions/settings';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { MonthlyCalendar } from 'src/components/calendar';
import { RenderContentLoading } from 'src/components/loading';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { useAuthContext } from 'src/auth/hooks';

import { InvoiceAnalytic } from '../invoice-analytic';
import { exportAttendanceToExcel } from '../utils/attendance-utils';
import { AttendanceFilters } from '../components/attendance-filters';
import { TimePeriodSelector } from '../components/timeperiod-selector';
import { UserAttendanceTableRow } from '../../user/user-attendance-table-row';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: '', width: 0 },
  { id: 'employee_info', label: 'Employee' },
  { id: 'date', label: 'Date' },
  { id: 'check_in', label: 'Check in time' },
  { id: 'check_out', label: 'Check out time' },
  { id: 'late_by', label: 'Late By' },
  { id: 'early_out_by', label: 'Early Out By' },
  { id: 'status', label: 'Status' },
  { id: 'manual', label: 'Manual Attendance' },
];

// ----------------------------------------------------------------------

export function DailyAttendanceView({ flag }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const theme = useTheme();
  const { departments } = useGetDepartments();
  const { designations } = useGetDesignations();
  const { branches } = useGetBranches();
  const table = useTable();
  const { user } = useAuthContext();
  const isAdmin = user?.role === 'Admin';

  const headLabel = useMemo(
    () => (isAdmin ? TABLE_HEAD : TABLE_HEAD.filter((h) => h.id !== 'manual')),
    [isAdmin]
  );

  const initialState = {
    selectedDate: new Date(),
    timePeriod: 'today',
    departmentFilter: '',
    designationFilter: '',
    keywordFilter: '',
    activeStatus: statusParam || 'all',
    branchFilter: '',
  };

  function reducer(state, action) {
    switch (action.type) {
      case 'SET_DATE':
        return {
          ...state,
          selectedDate: action.payload,
          departmentFilter: '',
          designationFilter: '',
          keywordFilter: '',
          branchFilter: '',
        };
      case 'SET_TIME_PERIOD':
        return {
          ...state,
          timePeriod: action.payload,
          departmentFilter: '',
          designationFilter: '',
          keywordFilter: '',
          branchFilter: '',
        };
      case 'SET_DEPARTMENT_FILTER':
        return { ...state, departmentFilter: action.payload };
      case 'SET_DESIGNATION_FILTER':
        return { ...state, designationFilter: action.payload };
      case 'SET_KEYWORD_FILTER':
        return { ...state, keywordFilter: action.payload };
      case 'SET_BRANCH_FILTER':
        return { ...state, branchFilter: action.payload };
      case 'SET_ACTIVE_STATUS':
        return { ...state, activeStatus: action.payload };
      default:
        return state;
    }
  }

  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    selectedDate,
    timePeriod,
    departmentFilter,
    designationFilter,
    keywordFilter,
    activeStatus,
    branchFilter,
  } = state;

  const {
    tableData,
    isLoading,
    rawData: currentResponse,
  } = useGetAttendanceReport({
    timePeriod,
    selectedDate,
    departmentFilter,
    designationFilter,
    keywordFilter,
    showOvertimeOnly: flag,
    branch: branchFilter,
  });

  const departmentAnalyticsData = useMemo(() => {
    if (!Array.isArray(currentResponse)) {
      return { result: {}, total_present: 0, total_absent: 0, grand_total: 0 };
    }

    const result = {};
    let total_present = 0;
    let total_absent = 0;
    let grand_total = 0;

    currentResponse.forEach((usr) => {
      const department = usr.employee_info?.department || 'Unknown';
      const designation = usr.employee_info?.designation || 'Unknown';
      const attendances = usr.attendance || [];

      if (!result[department]) {
        result[department] = {
          total: 0,
          present: 0,
          absent: 0,
          leave: 0,
          designations: {},
        };
      }

      if (!result[department].designations[designation]) {
        result[department].designations[designation] = {
          present: 0,
          absent: 0,
          leave: 0,
          department_wise: 0,
        };
      }

      let userPresent = false;
      let userAbsent = true;

      attendances.forEach((att) => {
        if (att.status === 'Present' || att.status === 'Late' || Boolean(att.check_in)) {
          userPresent = true;
          userAbsent = false;
        }
      });

      result[department].total += 1;
      result[department].designations[designation].department_wise += 1;
      grand_total += 1;

      if (userPresent) {
        result[department].present += 1;
        result[department].designations[designation].present += 1;
        total_present += 1;
      }

      if (userAbsent) {
        result[department].absent += 1;
        result[department].designations[designation].absent += 1;
        total_absent += 1;
      }
    });

    const total_present_percentage = grand_total > 0 ? (total_present / grand_total) * 100 : 0;
    const total_absent_percentage = grand_total > 0 ? (total_absent / grand_total) * 100 : 0;

    return {
      result,
      total_present,
      total_absent,
      total_leave: 0,
      grand_total,
      total_present_percentage,
      total_absent_percentage,
    };
  }, [currentResponse]);

  const filterAttendanceByStatus = (row, status) => {
    if (status === 'all') return true;

    if (row?.status && status === row.status) {
      return true;
    }

    const hasCheckIn = Boolean(row?.check_in);
    const hasCheckOut = Boolean(row?.check_out);
    const isLate = Boolean(row?.is_late);
    const isAbsent = row?.status === 'Absent';

    if (status === 'Present' && row?.status !== 'Absent') {
      return hasCheckIn;
    }

    if (status === 'Late') {
      return isLate || row?.status === 'Late';
    }

    if (status === 'Early Leave') {
      return Boolean(row?.early_out_by);
    }

    if (status === 'Checked In') {
      return hasCheckIn && !hasCheckOut;
    }

    if (status === 'Checked Out') {
      return hasCheckIn && hasCheckOut;
    }

    if (status === 'Absent') {
      return isAbsent;
    }

    if (status === 'Half Day') {
      return row?.status === 'Half Day';
    }

    if (status === 'Leave') {
      return row?.status === 'Leave' || row?.status === 'Half Day Leave';
    }

    if (status === 'Weekend') {
      return row?.status === 'Weekend';
    }

    return false;
  };

  const statusCounts = useMemo(() => {
    const counts = {};

    ATTENDANCE_STATUS_OPTIONS.forEach((option) => {
      counts[option.value] = Array.isArray(tableData)
        ? tableData.filter((row) => filterAttendanceByStatus(row, option.value)).length
        : 0;
    });

    return counts;
  }, [tableData]);

  const departmentAnalytics = useMemo(() => {
    if (departmentAnalyticsData && departmentAnalyticsData.result) {
      return Object.entries(departmentAnalyticsData.result)
        .filter(([_, deptData]) => deptData.total > 0 && deptData.present > 0)
        .map(([department, deptData]) => ({
          department,
          count: deptData.total,
          percentage: (deptData.total / departmentAnalyticsData.grand_total) * 100,
          present: deptData.present,
          leave: deptData.leave || 0,
          absent: deptData.absent,
        }));
    }

    if (!Array.isArray(tableData)) return [];

    return Array.from(
      new Set(
        tableData
          .filter((item) => Boolean(item?.check_in))
          .map((item) => item?.user_info?.department)
      )
    )
      .filter(Boolean)
      .map((department) => {
        const deptEmployees = tableData.filter(
          (item) => item?.user_info?.department === department
        );
        const presentEmployees = deptEmployees.filter((item) => Boolean(item?.check_in));

        return {
          department,
          count: deptEmployees.length,
          percentage: (deptEmployees.length / tableData.length) * 100,
          present: presentEmployees.length,
          leave: 0,
          absent: deptEmployees.length - presentEmployees.length,
        };
      });
  }, [tableData, departmentAnalyticsData]);

  const handleTimePeriodChange = (event, newPeriod) => {
    const longPeriods = [
      'thisWeek',
      'last7Days',
      'last15Days',
      'last30Days',
      'thisMonth',
      'lastMonth',
    ];

    if (newPeriod !== null) {
      if (longPeriods.includes(newPeriod)) {
        router.push(`${paths.attendance.monthly}?period=${newPeriod}`);
        return;
      }

      dispatch({ type: 'SET_TIME_PERIOD', payload: newPeriod });
      dispatch({ type: 'SET_DATE', payload: dayjs() });
    }
  };

  const handleDateChange = (date) => {
    dispatch({ type: 'SET_DATE', payload: date });
    dispatch({ type: 'SET_TIME_PERIOD', payload: 'dateRange' });
  };

  const handleStatusChange = (event, newValue) => {
    if (newValue) {
      dispatch({ type: 'SET_ACTIVE_STATUS', payload: newValue });
      router.push(`${paths.dashboard.attendance.daily}?status=${encodeURIComponent(newValue)}`);
    }
  };

  const handleDepartmentChange = (e) => {
    dispatch({ type: 'SET_DEPARTMENT_FILTER', payload: e.target.value });
  };

  const handleDesignationChange = (e) => {
    dispatch({ type: 'SET_DESIGNATION_FILTER', payload: e.target.value });
  };

  const handleKeywordChange = (e) => {
    dispatch({ type: 'SET_KEYWORD_FILTER', payload: e.target.value });
  };

  const handleBranchChange = (e) => {
    dispatch({ type: 'SET_BRANCH_FILTER', payload: e.target.value });
  };

  // Helper to get the report day label
  const getReportDayLabel = () => {
    if (timePeriod === 'today') {
      return `Attendance Report for Today (${dayjs().format('DD MMM YYYY, dddd')})`;
    }
    if (timePeriod === 'yesterday') {
      return `Attendance Report for Yesterday (${dayjs().subtract(1, 'day').format('DD MMM YYYY, dddd')})`;
    }
    if (timePeriod === 'dateRange' && selectedDate) {
      return `Attendance Report for ${dayjs(selectedDate).format('DD MMM YYYY, dddd')}`;
    }
    return '';
  };

  // Helper to get the export file name with date
  const getExportFileName = () => {
    if (timePeriod === 'today') {
      return `attendance.report.${dayjs().format('YYYY-MM-DD')}.xlsx`;
    }
    if (timePeriod === 'yesterday') {
      return `attendance.report.${dayjs().subtract(1, 'day').format('YYYY-MM-DD')}.xlsx`;
    }
    if (timePeriod === 'dateRange' && selectedDate) {
      return `attendance.report.${dayjs(selectedDate).format('YYYY-MM-DD')}.xlsx`;
    }
    return 'attendance.report.xlsx';
  };

  const isDateHighlighted = (date) => {
    if (timePeriod === 'today' && dayjs(date).isSame(dayjs(), 'day')) return true;

    if (
      timePeriod === 'yesterday' &&
      dayjs(date).format('YYYY-MM-DD') === dayjs().subtract(1, 'day').format('YYYY-MM-DD')
    )
      return true;

    if (
      timePeriod === 'dateRange' &&
      dayjs(date).format('YYYY-MM-DD') === dayjs(selectedDate).format('YYYY-MM-DD')
    )
      return true;
    return false;
  };

  const displayedData = useMemo(() => {
    if (!Array.isArray(tableData)) return [];

    return activeStatus === 'all'
      ? tableData
      : tableData.filter((row) => filterAttendanceByStatus(row, activeStatus));
  }, [tableData, activeStatus]);

  const dataInPage = useMemo(() => {
    if (!Array.isArray(displayedData)) return [];
    const startIndex = table.page * table.rowsPerPage;
    const endIndex = startIndex + table.rowsPerPage;
    return displayedData.slice(startIndex, endIndex);
  }, [displayedData, table.page, table.rowsPerPage]);

  function groupFlatAttendanceRows(rows) {
    const grouped = {};
    rows.forEach((row) => {
      const empId = row.user_info?.employeeId || row.user_info?.id || 'unknown';
      if (!grouped[empId]) {
        grouped[empId] = {
          employee_info: row.user_info,
          attendance: [],
        };
      }
      const { user_info, ...attendanceFields } = row;
      grouped[empId].attendance.push(attendanceFields);
    });
    return Object.values(grouped);
  }

  const handleExport = async () => {
    const groupedData = groupFlatAttendanceRows(displayedData);
    await exportAttendanceToExcel(groupedData, getExportFileName());
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={flag ? 'Overtime Manpower' : 'Attendance'}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: flag ? 'Overtime Manpower' : 'Attendance' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <TimePeriodSelector value={timePeriod} onChange={handleTimePeriodChange} theme={theme} />

      <MonthlyCalendar
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        highlightMode="dateRange"
        additionalHighlightCondition={isDateHighlighted}
      />

      <Card sx={{ p: 2, mb: 3, mt: 3 }}>
        <AttendanceFilters
          departments={departments}
          designations={designations}
          branches={branches}
          departmentFilter={departmentFilter}
          designationFilter={designationFilter}
          keywordFilter={keywordFilter}
          branchFilter={branchFilter}
          onDepartmentChange={handleDepartmentChange}
          onDesignationChange={handleDesignationChange}
          onKeywordChange={handleKeywordChange}
          onBranchChange={handleBranchChange}
          flag
        />
      </Card>

      {isLoading ? (
        <RenderContentLoading />
      ) : (
        <Box mt={3}>
          <Card
            sx={{
              mb: 4,
              overflow: 'hidden',
              boxShadow: theme.customShadows.z8,
              borderRadius: 3,
            }}
          >
            <Scrollbar sx={{ minHeight: 120 }}>
              <Stack
                direction="row"
                divider={
                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{
                      borderStyle: 'dashed',
                      borderColor: (themes) => alpha(themes.palette.grey[500], 0.24),
                    }}
                  />
                }
                sx={{ p: 3 }}
              >
                <InvoiceAnalytic
                  title="Total Present"
                  value={
                    Array.isArray(tableData)
                      ? tableData.filter(
                          (item) =>
                            item?.status === 'Present' ||
                            item?.status === 'Late' ||
                            Boolean(item?.check_in)
                        ).length
                      : 0
                  }
                  percent={
                    departmentAnalyticsData
                      ? departmentAnalyticsData.total_present_percentage
                      : Array.isArray(tableData)
                        ? (tableData.filter(
                            (item) =>
                              item?.status === 'Present' ||
                              item?.status === 'Late' ||
                              Boolean(item?.check_in)
                          ).length /
                            (tableData.length || 1)) *
                          100
                        : 0
                  }
                  icon="solar:user-check-bold-duotone"
                  color={theme.vars.palette.success.main}
                  sx={{
                    px: 3,
                    py: 2.5,
                    borderRadius: 2.5,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: (themes) =>
                        `0 8px 20px ${alpha(themes.palette.success.main, 0.2)}`,
                    },
                  }}
                />

                <InvoiceAnalytic
                  title="Total Absent"
                  value={
                    Array.isArray(tableData)
                      ? tableData.filter(
                          (item) =>
                            item?.status === 'Absent' || (!item?.check_in && !item?.check_out)
                        ).length
                      : 0
                  }
                  percent={
                    departmentAnalyticsData
                      ? departmentAnalyticsData.total_absent_percentage
                      : Array.isArray(tableData)
                        ? (tableData.filter(
                            (item) =>
                              item?.status === 'Absent' || (!item?.check_in && !item?.check_out)
                          ).length /
                            (tableData.length || 1)) *
                          100
                        : 0
                  }
                  icon="solar:user-cross-bold-duotone"
                  color={theme.vars.palette.error.main}
                  sx={{
                    px: 3,
                    py: 2.5,
                    borderRadius: 2.5,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: (themes) => `0 8px 20px ${alpha(themes.palette.error.main, 0.2)}`,
                    },
                  }}
                />

                {departmentAnalytics.length > 0 ? (
                  departmentAnalytics.map((dept, index) => {
                    const colors = [
                      theme.vars.palette.success.main,
                      theme.vars.palette.warning.main,
                      theme.vars.palette.error.main,
                      theme.vars.palette.info.main,
                      theme.vars.palette.blue.main,
                      theme.vars.palette.pink.main,
                      theme.vars.palette.secondary.main,
                      theme.vars.palette.primary.main,
                    ];
                    const color = colors[index % colors.length];

                    return (
                      <InvoiceAnalytic
                        key={dept.department}
                        title={dept.department}
                        value={dept.present}
                        percent={(dept.present / (dept.present + dept.absent || 1)) * 100}
                        icon="fluent:people-team-toolbox-24-filled"
                        color={color}
                        sx={{
                          px: 3,
                          py: 2.5,
                          borderRadius: 2.5,
                          transition: 'all 0.3s cubic-bezier(0.4, 0.2, 0.2, 1)',
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: (themes) => `0 8px 20px ${alpha(color, 0.2)}`,
                          },
                        }}
                        details={
                          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {flag ? (
                              <>
                                <Label color="info" variant="soft" size="small">
                                  OT:{' '}
                                  {
                                    tableData.filter(
                                      (item) =>
                                        item?.user_info?.department === dept.department &&
                                        item?.over_time > 0
                                    ).length
                                  }
                                </Label>
                                <Label color="pink" variant="soft" size="small">
                                  Extra OT:{' '}
                                  {
                                    tableData.filter(
                                      (item) =>
                                        item?.user_info?.department === dept.department &&
                                        item?.extra_over_time > 0
                                    ).length
                                  }
                                </Label>
                              </>
                            ) : (
                              <>
                                <Label color="success" variant="soft" size="small">
                                  Present: {dept.present}
                                </Label>
                                <Label color="error" variant="soft" size="small">
                                  Absent: {dept.absent || 0}
                                </Label>
                                {dept.leave > 0 && (
                                  <Label color="warning" variant="soft" size="small">
                                    Leave: {dept.leave || 0}
                                  </Label>
                                )}
                                <Label color="info" variant="soft" size="small">
                                  Total: {dept.present + dept.absent + (dept.leave || 0)}
                                </Label>
                              </>
                            )}
                          </Box>
                        }
                      />
                    );
                  })
                ) : (
                  <Typography sx={{ p: 3, color: 'text.secondary' }}>
                    No departments with present employees found.
                  </Typography>
                )}
              </Stack>
            </Scrollbar>
          </Card>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2.5 }}
          >
            <Typography variant="subtitle1" sx={{ my: 1 }}>
              {getReportDayLabel()}
            </Typography>

            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="mdi:file-export-outline" />}
              onClick={handleExport}
            >
              Export {activeStatus !== 'all' ? `${activeStatus}` : 'All'}
            </Button>
          </Stack>

          <Card>
            <Tabs value={activeStatus} onChange={handleStatusChange} sx={{ px: 2.5 }}>
              {ATTENDANCE_STATUS_OPTIONS.map((tab) => (
                <Tab
                  key={tab.value}
                  iconPosition="end"
                  value={tab.value}
                  label={tab.label}
                  icon={
                    <Label
                      variant={
                        tab.value === 'all' || tab.value === activeStatus ? 'filled' : 'soft'
                      }
                      color={
                        (tab.value === 'Present' && 'success') ||
                        (tab.value === 'Absent' && 'error') ||
                        (tab.value === 'Checked In' && 'info') ||
                        (tab.value === 'Checked Out' && 'primary') ||
                        (tab.value === 'Early Leave' && 'pink') ||
                        (tab.value === 'Late' && 'orange') ||
                        (tab.value === 'Holiday' && 'blue') ||
                        (tab.value === 'Weekend' && 'secondary') ||
                        (tab.value === 'Half Day' && 'tertiary') ||
                        (tab.value === 'Leave' && 'warning') ||
                        'default'
                      }
                    >
                      {statusCounts[tab.value] || 0}
                    </Label>
                  }
                />
              ))}
            </Tabs>

            <Box sx={{ position: 'relative' }}>
              <TableSelectedAction
                dense={table.dense}
                numSelected={table.selected.length}
                rowCount={displayedData.length}
              />

              <Scrollbar>
                <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                  <TableHeadCustom
                    order={table.order}
                    orderBy={table.orderBy}
                    headLabel={headLabel}
                    rowCount={displayedData.length}
                    numSelected={table.selected.length}
                    onSort={table.onSort}
                  />

                  <TableBody>
                    {dataInPage.map((row, index) => (
                      <UserAttendanceTableRow
                        key={`${row.id}-${table.page}-${index}`}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        flag
                        user={user}
                        isAdmin={isAdmin}
                      />
                    ))}

                    <TableEmptyRows height={table.dense ? 56 : 76} emptyRows={0} />

                    <TableNoData notFound={displayedData.length === 0} />
                  </TableBody>
                </Table>
              </Scrollbar>
            </Box>

            <TablePaginationCustom
              page={table.page}
              dense={table.dense}
              count={displayedData.length}
              rowsPerPage={table.rowsPerPage}
              onPageChange={table.onChangePage}
              onChangeDense={table.onChangeDense}
              onRowsPerPageChange={table.onChangeRowsPerPage}
            />
          </Card>
        </Box>
      )}
    </DashboardContent>
  );
}
