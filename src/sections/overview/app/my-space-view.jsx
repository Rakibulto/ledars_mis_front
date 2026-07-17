'use client';

import dayjs from 'dayjs';
import { useMemo, useEffect } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { paths } from 'src/routes/paths';

import { useSetState } from 'src/hooks/use-set-state';

import Loading from 'src/app/dashboard/loading';
import { useGetAutoCutOffDate } from 'src/actions/settings';
import { useGetLeaveBalanceByYear } from 'src/actions/leave';
import { useGetEmployeeDashboard } from 'src/actions/dashboard';
import SeoIllustration from 'src/assets/illustrations/seo-illustration';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import { useAuthContext } from 'src/auth/hooks';

import { AppWelcome } from './app-welcome';
import { PendingLeaveList } from './pending-leave-list';
import { ComplianceWidgets } from './compliance-widgets';
import { LeaveAnalyticSummary } from './leave-analytic-summary';
import { AttendanceAnalyticSummary } from './attendance-analytic-summary';
import { PolicyLeaveBalanceOverview } from './policy-leave-balance-overview';

export function MySpaceView() {
  const { user } = useAuthContext();

  const today = useMemo(() => dayjs(), []);

  const { cutOffDate, cutOffDateLoading } = useGetAutoCutOffDate();

  const [computedStartDate, computedEndDate] = useMemo(() => {
    if (cutOffDateLoading) return [null, null];
    if (cutOffDate && cutOffDate[0]) {
      const obj = cutOffDate[0];
      const end = dayjs(obj.cut_off);
      const prevMonth = end.subtract(1, 'month');
      const clampedDay = Math.min(obj.date, prevMonth.daysInMonth());
      const start = prevMonth.date(clampedDay).add(1, 'day');
      return [start, end];
    }
    return [null, null];
  }, [cutOffDateLoading, cutOffDate]);

  // Filters state
  const { state: filters, setState: setFilters } = useSetState({
    startDate: null,
    endDate: null,
  });

  // Set initial dates when cutOffDate is loaded
  useEffect(() => {
    if (cutOffDateLoading) return;

    if (computedStartDate) {
      setFilters({
        startDate: computedStartDate,
        endDate: today,
      });
    } else {
      setFilters({
        startDate: today.subtract(30, 'day'),
        endDate: today,
      });
    }
  }, [cutOffDateLoading, computedStartDate, today]); // eslint-disable-line react-hooks/exhaustive-deps

  // Allow manual date selection and restore computed range when boundaries picked
  const handleDateChange = (date, type) => {
    if (!date) return;
    const selectedDate = dayjs(date);
    if (type === 'startDate') {
      if (computedStartDate && selectedDate.isSame(computedStartDate, 'day')) {
        setFilters({ startDate: computedStartDate, endDate: computedEndDate });
      } else {
        setFilters({ startDate: selectedDate, endDate: filters.endDate });
      }
    } else if (type === 'endDate') {
      if (computedEndDate && selectedDate.isSame(computedEndDate, 'day')) {
        setFilters({ startDate: computedStartDate, endDate: computedEndDate });
      } else {
        setFilters({ startDate: filters.startDate, endDate: selectedDate });
      }
    }
  };

  const { dashboard, dashboardLoading } = useGetEmployeeDashboard(
    user?.employee_id,
    filters.startDate ? filters.startDate.format('YYYY-MM-DD') : undefined,
    filters.endDate ? filters.endDate.format('YYYY-MM-DD') : undefined
  );

  // Fetch leave balance for current year
  const { data: leaveBalanceData = [], dataLoading: leaveBalanceLoading } =
    useGetLeaveBalanceByYear(user?.employee_id);

  // Handle empty or invalid dashboard response
  if (dashboardLoading || cutOffDateLoading) return <Loading />;

  if (!dashboard || Array.isArray(dashboard)) {
    return (
      <EmptyContent
        filled
        title="No dashboard data available"
        description="No attendance or leave data found for this employee."
        sx={{ py: 8 }}
      />
    );
  }

  const employeeInfo = dashboard?.employee_info || {};
  const attendanceData = dashboard?.attendance_data || {};
  const leaveData = dashboard?.leave_data || {};

  // Attendance summary
  const summary = attendanceData.summary || {};

  // Prepare data for attendance summary chart (all as percentage)
  const workingDays = Number(summary.working_days ?? 0) || 0;

  const totalEvents = Number(summary.total_days ?? 0) || 0;

  const monthlyAttendanceSummaryData = [
    { label: 'Present', value: summary.present_count ?? 0 },
    { label: 'Absent', value: summary.absent_count ?? 0 },
    { label: 'Late', value: summary.late_count ?? 0 },
    { label: 'Early Out', value: summary.early_leave_count ?? 0 },
    { label: 'On Leave', value: summary.on_leave_count ?? 0 },
    { label: 'Holiday', value: summary.holiday_count ?? 0 },
    { label: 'Weekend', value: summary.weekend_count ?? 0 },
  ];

  // Prepare data for leave summary chart
  const leaveSummarySeries = [
    { label: 'Approved', value: Number(leaveData.summary?.approved_leaves ?? 0) },
    { label: 'Pending', value: Number(leaveData.summary?.pending_leaves ?? 0) },
    { label: 'Rejected', value: Number(leaveData.summary?.rejected_leaves ?? 0) },
  ];

  // Prepare chart data for each leave type
  const leaveBalanceCharts = Array.isArray(leaveBalanceData)
    ? leaveBalanceData.map((policy) => ({
        leave_type_name: policy.leave_type_name,
        chart: [
          { label: 'Used', value: policy.used ?? 0 },
          { label: 'Pending', value: policy.pending ?? 0 },
          { label: 'Remaining', value: policy.remaining ?? 0 },
        ],
        total_allowed: policy.total_allowed ?? 0,
      }))
    : [];

  return (
    <>
      {/* User Info & Date Filters */}
      <AppWelcome
        title={`Welcome back to My Space 👋 \n ${employeeInfo?.employee_name ?? user?.username ?? 'Employee'}`}
        description={`${employeeInfo?.department ?? ''} • ${employeeInfo?.designation ?? ''}`}
        img={<SeoIllustration hideBackground />}
        action={
          <>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.disabled' }}>
              View your attendance and leave data for the selected date range
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => handleDateChange(date, 'startDate')}
                format="DD-MM-YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    InputLabelProps: {
                      sx: { color: 'common.white' },
                    },
                    InputProps: {
                      sx: {
                        color: 'common.white',
                        '& .MuiSvgIcon-root': { color: 'common.white' },
                      },
                    },
                  },
                }}
                sx={{
                  '& .MuiInputBase-root': { color: 'common.white' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'common.white' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'common.white' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'common.white',
                  },
                }}
              />

              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => handleDateChange(date, 'endDate')}
                format="DD-MM-YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    InputLabelProps: {
                      sx: { color: 'common.white' },
                    },
                    InputProps: {
                      sx: {
                        color: 'common.white',
                        '& .MuiSvgIcon-root': { color: 'common.white' },
                      },
                    },
                  },
                }}
                sx={{
                  '& .MuiInputBase-root': { color: 'common.white' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'common.white' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'common.white' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'common.white',
                  },
                }}
              />
            </Stack>
          </>
        }
      />

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Monthly Attendance Summary */}
        <Grid size={{ xs: 12, md: 6 }}>
          <AttendanceAnalyticSummary
            title={`Monthly Attendance Summary (${summary?.attendance_percentage || 0}%)`}
            subheader={
              filters.startDate && filters.endDate
                ? `${filters.startDate.format('DD MMM YYYY')} - ${filters.endDate.format('DD MMM YYYY')} • Working days: ${workingDays} • Total: ${totalEvents}`
                : ''
            }
            total={totalEvents}
            chart={{
              series: monthlyAttendanceSummaryData,
              options: {},
            }}
            actions={
              <Button
                variant="outlined"
                color="blue"
                size="small"
                startIcon={<Iconify icon="solar:document-bold-duotone" />}
                href={paths.dashboard.attendance.monthly}
              >
                View Details
              </Button>
            }
          />
        </Grid>

        {/* Leave Data Summary */}
        <Grid size={{ xs: 12, md: 6 }}>
          <LeaveAnalyticSummary
            title="Leave Data Summary"
            subheader={`Total Leaves: ${leaveData.summary?.total_leaves || 0}`}
            chart={{
              series: leaveSummarySeries,
              options: {},
            }}
            sx={{ mb: 2 }}
            flag
            actions={
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                startIcon={<Iconify icon="solar:document-bold-duotone" />}
                href={paths.dashboard.leave.request}
              >
                View All
              </Button>
            }
          />
        </Grid>
      </Grid>

      {/* Employee Stats */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          {/* Compliance & Policy KPIs */}
          <ComplianceWidgets
            title="Compliance & Punctuality"
            subheader={
              filters.startDate && filters.endDate
                ? `${filters.startDate.format('DD MMM YYYY')} - ${filters.endDate.format('DD MMM YYYY')}`
                : ''
            }
            chart={{
              series: [
                {
                  label: 'Late Arrival %',
                  percent:
                    summary.present_count > 0
                      ? Number(((summary.late_count / summary.present_count) * 100).toFixed(2))
                      : 0,
                },
                {
                  label: 'Early Out %',
                  percent:
                    summary.present_count > 0
                      ? Number(
                          ((summary.early_leave_count / summary.present_count) * 100).toFixed(2)
                        )
                      : 0,
                },
                {
                  label: 'Avg. Absence Days/Employee',
                  percent:
                    summary.working_days > 0
                      ? Number(((summary.absent_count / summary.working_days) * 100).toFixed(2))
                      : 0,
                },
              ],
              options: {},
            }}
            sx={{ mb: 2 }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          {/* Recent Leave Requests */}
          <Box>
            {Array.isArray(leaveData.recent_requests) && leaveData.recent_requests.length > 0 ? (
              <PendingLeaveList
                title="Recent Leave Requests"
                list={leaveData.recent_requests?.slice(0, 3)?.map((req) => ({
                  id: req.id || Math.random().toString(),
                  title: req.leave_type || 'Leave Request',
                  status: req.status || 'Pending',
                  isHalfDay: req.is_half_day || false,
                  halfDayPeriod: req.half_day_period || '',
                  startDate: req.start_date,
                  endDate: req.end_date,
                }))}
                action={
                  <Button
                    variant="outlined"
                    color="info"
                    size="small"
                    startIcon={<Iconify icon="solar:calendar-bold-duotone" />}
                    href={paths.dashboard.leave.request}
                  >
                    View all
                  </Button>
                }
              />
            ) : (
              <EmptyContent filled title="No recent leave requests" sx={{ py: 6 }} />
            )}
          </Box>
        </Grid>

        <Grid size={12}>
          {/* Leave Balance */}
          <PolicyLeaveBalanceOverview policies={leaveBalanceCharts} />
        </Grid>
      </Grid>
    </>
  );
}
