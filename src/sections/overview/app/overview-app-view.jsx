'use client';

import dayjs from 'dayjs';
import { useMemo, useEffect } from 'react';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useSetState } from 'src/hooks/use-set-state';

import Loading from 'src/app/dashboard/loading';
import { useGetDashboard } from 'src/actions/dashboard';
import { useGetLeaveRequests } from 'src/actions/leave';
import { useGetAutoCutOffDate } from 'src/actions/settings';
import SeoIllustration from 'src/assets/illustrations/seo-illustration';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import { getStatusColors } from 'src/sections/attendance/utils/attendance-utils';

import { useAuthContext } from 'src/auth/hooks';

import { AppWelcome } from './app-welcome';
import { BirthdayList } from './birthday-list';
import { WidgetSummary } from './widget-summary';
import { TodayLeaveList } from './today-leave-list';
import { SubordinateList } from './subordinate-list';
import { PendingLeaveList } from './pending-leave-list';
import { ComplianceWidgets } from './compliance-widgets';
import { LeaveAnalyticSummary } from './leave-analytic-summary';
import { AttendanceWidgetSummary } from './attendance-widget-summary';
import { AttendanceAdjustmentSummary } from './attendance-adjustment-summary';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// ----------------------------------------------------------------------

export function OverviewAppView() {
  const { user } = useAuthContext();
  const router = useRouter();

  const handleSummaryClick = (status) => {
    let tab = status;
    if (status === 'Total') tab = 'all';
    else if (status === 'On Leave') tab = 'Leave';
    router.push(`${paths.dashboard.attendance.daily}?status=${encodeURIComponent(tab)}`);
  };

  const today = useMemo(() => dayjs(), []);

  const { cutOffDate, cutOffDateLoading } = useGetAutoCutOffDate();

  // backend returns objects containing `date`(day-of-month) and a concrete
  // `cut_off` datetime string. We interpret the period as starting on the day
  // after *last month's* cutoff and ending on the current cutoff.
  //
  // e.g. [ { date: 31, cut_off: '2026-02-28', ... } ] -> start=2026-02-01
  //      [ { date: 25, cut_off: '2026-02-25', ... } ] -> start=2026-01-26
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

  const { datas: leaveRequests = [], datasLoading: leaveRequestsLoading } = useGetLeaveRequests(
    undefined,
    'today',
    false,
    false
  );

  // Deduplicate by employee_id + leave_policy_name + start_date
  const uniqueLeaveMap = {};
  (leaveRequests ?? []).forEach((req) => {
    const key = `${req?.employee_id ?? ''}_${req?.leave_policy_name ?? ''}_${req?.start_date ?? ''}`;
    if (!uniqueLeaveMap[key]) {
      uniqueLeaveMap[key] = req;
    }
  });
  const uniquePendingLeaveRequests = Object.values(uniqueLeaveMap).filter(
    (req) => req?.status === 'pending'
  );

  // Prepare chart data for each pending leave request
  const leaveChartList = (uniquePendingLeaveRequests ?? []).map((req) => ({
    id: req?.id,
    title: req?.employee_name,
    subtitle: req?.leave_policy_name,
    startDate: req?.start_date,
    endDate: req?.end_date,
    requestName: req?.leave_policy_name,
    department: req?.department_name,
    branch: req?.branch_name,
    status: req?.status,
    employeeId: req?.employee_id,
    used: req?.applied_leave_balance?.used ?? 0,
    allowed: req?.applied_leave_balance?.total_allowed ?? 0,
    pending: req?.applied_leave_balance?.pending ?? 0,
    remaining: req?.applied_leave_balance?.remaining ?? 0,
    coverUrl: req?.profile_picture ?? '',
    isHalfDay: req?.is_half_day,
    halfDayPeriod: req?.half_day_period || '',
    requestedDays: req?.requested_days,
    approval_status_tracking: req?.approval_status_tracking ?? [],
  }));

  // Filter leave requests for today with approved status
  const todayLeaveApprovedList = (leaveRequests ?? []).filter((req) => {
    const start = dayjs(req?.start_date, 'YYYY-MM-DD');
    const end = dayjs(req?.end_date, 'YYYY-MM-DD');
    return (
      req?.status === 'approved' &&
      today.isSameOrAfter(start, 'day') &&
      today.isSameOrBefore(end, 'day')
    );
  });

  const filters = useSetState({
    startDate: null,
    endDate: null,
  });

  // Set initial dates when cutOffDate is loaded
  useEffect(() => {
    if (cutOffDateLoading) return;

    if (computedStartDate && computedEndDate) {
      filters.setState({
        startDate: computedStartDate,
        endDate: computedEndDate,
      });
    } else {
      // Fallback to last 30 days if cutoff not available
      filters.setState({
        startDate: today.subtract(30, 'day'),
        endDate: today,
      });
    }
  }, [cutOffDateLoading, computedStartDate, computedEndDate, today]); // eslint-disable-line react-hooks/exhaustive-deps

  // Allow manual date selection; if the user picks one of the computed boundaries
  // we automatically restore the full cutoff range.
  const handleDateChange = (date, type) => {
    if (!date) return;
    const selectedDate = dayjs(date);

    if (type === 'startDate') {
      if (computedStartDate && selectedDate.isSame(computedStartDate, 'day')) {
        filters.setState({
          startDate: computedStartDate,
          endDate: computedEndDate,
        });
      } else {
        filters.setState({
          startDate: selectedDate,
          endDate: filters.state.endDate,
        });
      }
    } else if (type === 'endDate') {
      if (computedEndDate && selectedDate.isSame(computedEndDate, 'day')) {
        filters.setState({
          startDate: computedStartDate,
          endDate: computedEndDate,
        });
      } else {
        filters.setState({
          startDate: filters.state.startDate,
          endDate: selectedDate,
        });
      }
    }
  };

  // Monthly attendance dashboard data
  const { dashboard: monthlyDashboard, dashboardLoading: monthlyDashboardLoading } =
    useGetDashboard(
      filters.state.startDate ? filters.state.startDate.format('YYYY-MM-DD') : undefined,
      filters.state.endDate ? filters.state.endDate.format('YYYY-MM-DD') : undefined
    );

  // Today's attendance summary data
  const todayAttendanceCounts = monthlyDashboard?.attendance_counts ?? {};

  const todayAttendanceSummaryData = [
    {
      status: 'Total',
      quantity: todayAttendanceCounts?.total_employees ?? 0,
      color: getStatusColors('Total'),
    },
    {
      status: 'Present',
      quantity: todayAttendanceCounts?.present_count ?? 0,
      color: getStatusColors('Present'),
    },
    {
      status: 'Absent',
      quantity: todayAttendanceCounts?.absent_count ?? 0,
      color: getStatusColors('Absent'),
    },
    {
      status: 'Late',
      quantity: todayAttendanceCounts?.late_count ?? 0,
      color: getStatusColors('Late'),
    },
    {
      status: 'Early Leave',
      quantity: todayAttendanceCounts?.early_leave ?? 0,
      color: getStatusColors('Early Leave'),
    },
    {
      status: 'On Leave',
      quantity: todayAttendanceCounts?.on_leave_count ?? 0,
      color: getStatusColors('On Leave'),
    },
    {
      status: 'Holiday',
      quantity: todayAttendanceCounts?.holiday_count ?? 0,
      color: getStatusColors('Holiday'),
    },
    {
      status: 'Weekend',
      quantity: todayAttendanceCounts?.weekend_count ?? 0,
      color: getStatusColors('Weekend'),
    },
  ];

  // Monthly attendance summary data for AttendanceSummary
  const monthlyAttendanceCounts = monthlyDashboard?.attendance_counts ?? {};
  const monthlyTotal =
    (monthlyAttendanceCounts?.present_count ?? 0) +
    (monthlyAttendanceCounts?.absent_count ?? 0) +
    (monthlyAttendanceCounts?.late_count ?? 0) +
    (monthlyAttendanceCounts?.early_leave ?? 0) +
    (monthlyAttendanceCounts?.on_leave_count ?? 0) +
    (monthlyAttendanceCounts?.holiday_count ?? 0) +
    (monthlyAttendanceCounts?.weekend_count ?? 0);

  const getPercentage = (count) =>
    monthlyTotal > 0 ? Math.round((count / monthlyTotal) * 100) : 0;

  const monthlyAttendanceSummaryData = [
    {
      status: 'Present',
      value: getPercentage(monthlyAttendanceCounts?.present_count ?? 0),
    },
    {
      status: 'Absent',
      value: getPercentage(monthlyAttendanceCounts?.absent_count ?? 0),
    },
    {
      status: 'Late',
      value: getPercentage(monthlyAttendanceCounts?.late_count ?? 0),
    },
    {
      status: 'Early Leave',
      value: getPercentage(monthlyAttendanceCounts?.early_leave ?? 0),
    },
    {
      status: 'On Leave',
      value: getPercentage(monthlyAttendanceCounts?.on_leave_count ?? 0),
    },
    {
      status: 'Holiday',
      value: getPercentage(monthlyAttendanceCounts?.holiday_count ?? 0),
    },
    {
      status: 'Weekend',
      value: getPercentage(monthlyAttendanceCounts?.weekend_count ?? 0),
    },
  ];

  const adjustmentCounts = monthlyDashboard?.attendance_adjustment_counts ?? {};
  const totalAdjustments = adjustmentCounts?.total_adjustments ?? 0;

  const adjustmentSummaryData = [
    {
      status: 'Pending',
      count: adjustmentCounts?.pending_adjustments ?? 0,
      value:
        totalAdjustments > 0
          ? Math.round(((adjustmentCounts?.pending_adjustments ?? 0) / totalAdjustments) * 100)
          : 0,
    },
    {
      status: 'Approved',
      count: adjustmentCounts?.approved_adjustments ?? 0,
      value:
        totalAdjustments > 0
          ? Math.round(((adjustmentCounts?.approved_adjustments ?? 0) / totalAdjustments) * 100)
          : 0,
    },
    {
      status: 'Rejected',
      count: adjustmentCounts?.rejected_adjustments ?? 0,
      value:
        totalAdjustments > 0
          ? Math.round(((adjustmentCounts?.rejected_adjustments ?? 0) / totalAdjustments) * 100)
          : 0,
    },
  ];

  const leaveCounts = monthlyDashboard?.leave_counts ?? {};
  const leaveSummarySeries = [
    { label: 'Approved', value: leaveCounts?.approved_leaves ?? 0 },
    { label: 'Pending', value: leaveCounts?.pending_leaves ?? 0 },
    { label: 'Rejected', value: leaveCounts?.rejected_leaves ?? 0 },
  ];

  const employeeCounts = monthlyDashboard?.employee_counts ?? {};

  // Employee summary widgets data
  const attrition =
    (employeeCounts?.resigned_employees ?? 0) + (employeeCounts?.terminated_employees ?? 0);
  const growthRate =
    (employeeCounts?.total_employees ?? 0) > 0
      ? Math.round(
          (((employeeCounts?.new_joined ?? 0) - attrition) /
            (employeeCounts?.total_employees ?? 1)) *
            100
        )
      : 0;

  const employeeSummaryData = [
    {
      title: 'Total Employees',
      total: employeeCounts?.total_employees ?? 0,
      percent: 0,
      icon: (
        <Iconify icon="solar:users-group-two-rounded-bold-duotone" width={120} color="blue.main" />
      ),
      color: 'primary',
    },
    {
      title: 'Active Employees',
      total: employeeCounts?.active_employees ?? 0,
      percent: 0,
      icon: (
        <Iconify icon="solar:user-check-rounded-bold-duotone" width={120} color="success.main" />
      ),
      color: 'success',
    },
    {
      title: 'Incomplete Profiles',
      total: employeeCounts?.incomplete_employees ?? 0,
      percent: 0,
      icon: <Iconify icon="solar:user-id-bold-duotone" width={120} color="warning.main" />,
      color: 'warning',
    },
    {
      title: 'Newly Joined Employees (in period)',
      total: employeeCounts?.new_joined ?? 0,
      percent: 0,
      icon: <Iconify icon="solar:user-plus-rounded-bold-duotone" width={120} color="info.main" />,
      color: 'info',
    },
    {
      title: 'Attrition (resigned + terminated)',
      total: attrition,
      percent: 0,
      icon: <Iconify icon="solar:user-cross-rounded-bold-duotone" width={120} color="error.main" />,
      color: 'error',
    },
    {
      title: 'Growth Rate (%)',
      total: growthRate,
      percent: 0,
      icon: <Iconify icon="solar:chart-bold-duotone" width={120} color="secondary.main" />,
      color: 'secondary',
    },
  ];

  // Compliance & Punctuality KPIs
  const complianceSource =
    (monthlyAttendanceCounts?.total_days === 1 ? todayAttendanceCounts : monthlyAttendanceCounts) ||
    {};

  const presentCount = complianceSource?.present_count ?? 0;
  const lateCount = complianceSource?.late_count ?? 0;
  const earlyLeaveCount = complianceSource?.early_leave ?? 0;
  const absentCount = complianceSource?.absent_count ?? 0;
  const totalEmployees = employeeCounts?.total_employees ?? 1;

  const complianceChart = {
    series: [
      {
        label: 'Late Arrival %',
        percent: presentCount > 0 ? Math.round((lateCount / presentCount) * 100) : 0,
        total: lateCount,
      },
      {
        label: 'Early Out %',
        percent: presentCount > 0 ? Math.round((earlyLeaveCount / presentCount) * 100) : 0,
        total: earlyLeaveCount,
      },
      {
        label: 'Avg. Absence Days/Employee',
        percent: totalEmployees > 0 ? Math.round((absentCount / totalEmployees) * 100) / 100 : 0,
        total: absentCount,
      },
    ],
    options: {},
  };

  function getDashboardInsights({
    attrition: insightsAttrition,
    complianceChart: insightsComplianceChart,
    adjustmentSummaryData: insightsAdjustmentSummaryData,
    monthlyAttendanceSummaryData: insightsMonthlyAttendanceSummaryData,
  }) {
    const insights = [];

    // Pending leave requests
    const pendingLeaveCount = monthlyDashboard?.leave_counts?.pending_leaves ?? 0;
    const totalLeaves = monthlyDashboard?.leave_counts?.total_leaves ?? 0;
    let percent = 0;
    if (totalLeaves > 0) {
      percent = Math.round((pendingLeaveCount / totalLeaves) * 100);
    }
    // Only show warning if there are pending leaves and totalLeaves > 0
    if (pendingLeaveCount > 0 && totalLeaves > 0) {
      insights.push(`⚠️ High pending leave requests (${percent}%) – might need attention.`);
    } else if (pendingLeaveCount === 0) {
      insights.push('✅ No pending leave requests – all clear.');
    }

    // Attrition
    if (insightsAttrition === 0) {
      insights.push('✅ No attrition in this period – excellent retention.');
    } else {
      insights.push(`⚠️ Attrition detected (${insightsAttrition}) – review exit reasons.`);
    }

    // Attendance rate
    const presentSummary = insightsMonthlyAttendanceSummaryData.find((d) => d.status === 'Present');
    if (presentSummary) {
      insights.push(
        presentSummary.value > 90
          ? `✅ Attendance rate for the period is ${presentSummary.value}% – great engagement.`
          : `📈 Attendance rate for the period is ${presentSummary.value}% – room for improvement.`
      );
    }

    // Compliance KPIs
    if (insightsComplianceChart.series[0].percent > 20) {
      insights.push(
        `⚠️ Late Arrival rate is ${insightsComplianceChart.series[0].percent}% – consider stricter policies.`
      );
    }
    if (insightsComplianceChart.series[1].percent > 10) {
      insights.push(
        `⚠️ Early Out rate is ${insightsComplianceChart.series[1].percent}% – monitor closely.`
      );
    }
    if (insightsComplianceChart.series[2].percent > 2) {
      insights.push(
        `⚠️ Avg. Absence Days/Employee is ${insightsComplianceChart.series[2].percent} – check for patterns.`
      );
    }

    // Attendance adjustments
    const pendingAdjustment = insightsAdjustmentSummaryData.find((d) => d.status === 'Pending');
    if (pendingAdjustment && pendingAdjustment.value > 30) {
      insights.push(
        `⚠️ High pending attendance adjustments (${pendingAdjustment.value}%) – review approvals.`
      );
    }

    return insights;
  }

  const dashboardInsights = getDashboardInsights({
    leaveChartList,
    attrition,
    growthRate,
    todayAttendanceSummaryData,
    complianceChart,
    totalAdjustments,
    adjustmentSummaryData,
    monthlyAttendanceSummaryData,
  });

  // Helper to get all insights containing a keyword
  const getInsights = (type) => dashboardInsights.filter((msg) => msg.includes(type));

  if (leaveRequestsLoading || cutOffDateLoading || monthlyDashboardLoading) {
    return <Loading />;
  }

  return (
    <>
      {/* User Info & Date Filters */}
      <AppWelcome
        title={`Welcome back to Workspace👋 \n ${user?.username ?? 'User'}`}
        description="Track and manage your peers' progress here."
        img={<SeoIllustration hideBackground />}
        action={
          <>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.disabled' }}>
              Choose a date range to filter Attendance, Leaves, Adjustments, <br />
              and Birthdays below.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <DatePicker
                label="Start Date"
                value={filters?.state?.startDate ?? null}
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
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'common.white' },
                }}
              />

              <DatePicker
                label="End Date"
                value={filters?.state?.endDate ?? null}
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
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'common.white' },
                }}
              />
            </Stack>
          </>
        }
      />

      {/* Employee Counts Summary */}
      <Grid container spacing={2} mt={3} mb={2}>
        {(employeeSummaryData ?? []).map((item) => (
          <Grid key={item?.title ?? ''} size={{ xs: 12, sm: 6, md: 4 }}>
            <WidgetSummary
              title={item?.title ?? ''}
              total={item?.total ?? 0}
              percent={item?.percent ?? 0}
              icon={item?.icon ?? null}
              color={item?.color ?? 'primary'}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Attendance Summary */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Today&apos;s Attendance{' '}
            <Box color="text.secondary" component="span">
              ({today?.format?.('DD MMM YYYY') ?? ''} - {dayjs()?.format?.('dddd') ?? ''})
            </Box>
          </Typography>

          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Grid container spacing={2}>
              {(todayAttendanceSummaryData ?? []).map((item) => (
                <Grid key={item?.status ?? ''} size={{ xs: 12, sm: 6, md: 4 }}>
                  <AttendanceWidgetSummary
                    title={item?.status ?? ''}
                    total={item?.quantity ?? 0}
                    color={item?.color ?? 'primary'}
                    sx={{
                      minWidth: 120,
                      position: 'relative',
                      mb: 1,
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSummaryClick(item?.status)}
                  />
                </Grid>
              ))}
            </Grid>
          </Stack>

          {/* Compliance & Punctuality Alerts */}
          {(getInsights?.('Late Arrival rate') ?? []).map((msg, idx) => (
            <Alert
              key={`late-arrival-${idx}`}
              severity={msg?.startsWith?.('✅') ? 'success' : 'warning'}
              sx={{ mt: 3 }}
            >
              {msg}
            </Alert>
          ))}
          {(getInsights?.('Early Leave rate') ?? []).map((msg, idx) => (
            <Alert
              key={`early-leave-${idx}`}
              severity={msg?.startsWith?.('✅') ? 'success' : 'warning'}
              sx={{ mt: 1 }}
            >
              {msg}
            </Alert>
          ))}
          {(getInsights?.('Avg. Absence Days/Employee') ?? []).map((msg, idx) => (
            <Alert
              key={`absence-days-${idx}`}
              severity={msg?.startsWith?.('✅') ? 'success' : 'warning'}
              sx={{ mt: 1 }}
            >
              {msg}
            </Alert>
          ))}
          {/* Attrition Alerts */}
          {(getInsights?.('Attrition') ?? []).map((msg, idx) => (
            <Alert
              key={`attrition-${idx}`}
              severity={msg?.startsWith?.('✅') ? 'success' : 'warning'}
              sx={{ mt: 1 }}
            >
              {msg}
            </Alert>
          ))}

          {/* Compliance & Punctuality Widget */}
          <Box sx={{ my: 3 }}>
            <ComplianceWidgets
              chart={complianceChart ?? { series: [], options: {} }}
              title="Compliance & Punctuality"
              subheader={`${today.format('DD MMM YYYY')} - ${today.format('dddd')}`}
            />
          </Box>

          {/* Attendance Adjustments Insight */}
          {(getInsights?.('pending attendance adjustments') ?? []).map((msg, idx) => (
            <Alert
              key={`attendance-adjustment-${idx}`}
              severity={msg?.startsWith?.('✅') ? 'success' : 'warning'}
              sx={{ mb: 3 }}
            >
              {msg}
            </Alert>
          ))}

          <AttendanceAdjustmentSummary
            title={`Total Attendance Adjustments (${totalAdjustments ?? 0})`}
            subheader={
              filters?.state?.startDate && filters?.state?.endDate
                ? `${filters?.state?.startDate?.format?.('DD MMM YYYY') ?? ''} - ${filters?.state?.endDate?.format?.('DD MMM YYYY') ?? ''}`
                : ''
            }
            data={adjustmentSummaryData ?? []}
            sx={{ mt: 3 }}
            actions={
              <Button
                variant="outlined"
                color="info"
                size="small"
                startIcon={<Iconify icon="solar:document-bold-duotone" />}
                href={paths.dashboard.attendance.adjustment}
              >
                View All
              </Button>
            }
          />
        </Grid>

        {/* Leave Requests */}
        <Grid size={{ xs: 12, md: 4 }} mt={3}>
          {/* Pending Leave Requests Insight */}
          {(getInsights?.('pending leave requests') ?? []).map((msg, idx) => (
            <Alert
              key={`pending-leave-${idx}`}
              severity={msg?.startsWith?.('✅') ? 'success' : 'warning'}
              sx={{ mb: 3 }}
            >
              {msg}
            </Alert>
          ))}

          <LeaveAnalyticSummary
            title="Leave Overview"
            subheader={
              filters?.state?.startDate && filters?.state?.endDate
                ? `${filters?.state?.startDate?.format?.('DD MMM YYYY') ?? ''} - ${filters?.state?.endDate?.format?.('DD MMM YYYY') ?? ''}`
                : ''
            }
            chart={{
              series: leaveSummarySeries ?? [],
              options: {},
            }}
            sx={{ mb: 2 }}
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

          {/* On Leave Today */}
          {(todayLeaveApprovedList?.length ?? 0) > 0 ? (
            <TodayLeaveList
              title="On Leave Today"
              subheader={`${today?.format?.('DD MMM YYYY') ?? ''} - ${dayjs()?.format?.('dddd') ?? ''}`}
              list={todayLeaveApprovedList?.slice?.(0, 3) ?? []}
              sx={{ mb: 2 }}
              action={
                <Button
                  variant="outlined"
                  color="success"
                  size="small"
                  startIcon={<Iconify icon="solar:calendar-bold-duotone" />}
                  href={paths.dashboard.leave.calendar}
                >
                  View all
                </Button>
              }
            />
          ) : (
            <EmptyContent
              filled
              title="No peers are on leave today"
              sx={{ py: 5, height: 'fit-content', mb: 3 }}
            />
          )}

          {/* Pending leaves card */}
          {(leaveChartList?.length ?? 0) > 0 ? (
            <PendingLeaveList
              title="Pending Leave Requests"
              subheader="Latest requests"
              list={leaveChartList?.slice?.(0, 3) ?? []}
              action={
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  startIcon={<Iconify icon="solar:calendar-bold-duotone" />}
                  href={paths.dashboard.leave.approval}
                >
                  View all
                </Button>
              }
            />
          ) : (
            <Box mb={3}>
              <EmptyContent
                filled
                title="No pending leave requests"
                sx={{ py: 5, height: 'fit-content' }}
              />
            </Box>
          )}
        </Grid>

        {/* Birthday List */}
        <Grid size={{ xs: 12, md: 4 }} my={3}>
          {/* Subordinate List for Supervisor */}
          {user?.role === 'Supervisor' ? (
            Array.isArray(monthlyDashboard?.supervisor_info?.subordinate_list) &&
            monthlyDashboard?.supervisor_info?.subordinate_list.length > 0 ? (
              <SubordinateList supervisorInfo={monthlyDashboard?.supervisor_info} sx={{ mb: 3 }} />
            ) : (
              <EmptyContent
                filled
                title="No subordinates"
                sx={{ py: 5, height: 'fit-content', mb: 3 }}
              />
            )
          ) : null}

          {(monthlyDashboard?.birthday_employees?.length ?? 0) > 0 ? (
            <BirthdayList
              title={`Monthly Birthday List (${monthlyDashboard?.birthday_employees?.length ?? 0})`}
              subheader={
                filters?.state?.startDate && filters?.state?.endDate
                  ? `${filters?.state?.startDate?.format?.('DD MMM YYYY') ?? ''} - ${filters?.state?.endDate?.format?.('DD MMM YYYY') ?? ''}`
                  : ''
              }
              employees={monthlyDashboard?.birthday_employees ?? []}
            />
          ) : (
            <EmptyContent
              filled
              title="No employees with birthdays"
              sx={{ py: 5, height: 'fit-content', mb: 3 }}
            />
          )}
        </Grid>
      </Grid>
    </>
  );
}
