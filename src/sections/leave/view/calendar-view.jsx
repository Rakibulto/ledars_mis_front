'use client';

import Calendar from '@fullcalendar/react';
import listPlugin from '@fullcalendar/list';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import timelinePlugin from '@fullcalendar/timeline';
import interactionPlugin from '@fullcalendar/interaction';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { fDate, fIsAfter } from 'src/utils/format-time';

import { useGetLeaveRequests } from 'src/actions/leave';
import { DashboardContent } from 'src/layouts/dashboard';
import { CALENDAR_COLOR_OPTIONS } from 'src/_mock/options';

import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';

import { StyledCalendar } from 'src/sections/holiday/styles';
import { useCalendar } from 'src/sections/holiday/hooks/use-calendar';
import { CalendarToolbar } from 'src/sections/holiday/calendar-toolbar';
import { CalendarFilters } from 'src/sections/holiday/calendar-filters';
import { CalendarFiltersResult } from 'src/sections/holiday/calendar-filters-result';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { LeaveRequestQuickEditForm } from '../leave-request-quick-edit-form';

// ----------------------------------------------------------------------

export function LeaveCalendarView() {
  const { user } = useAuthContext();

  const isSupervisor = user?.role === 'Supervisor';
  const canAddLeave = user?.user_permissions_list?.some(
    (perm) => perm.codename === 'add_leaverequest'
  );
  const canChangeLeave = user?.user_permissions_list?.some(
    (perm) => perm.codename === 'change_leaverequest'
  );

  const openFilters = useBoolean();
  const openForm = useBoolean();
  const currentRequest = useSetState({ data: null });

  // Fetch leave requests
  const { datas: leaves, datasLoading } = useGetLeaveRequests(
    undefined,
    false,
    false,
    isSupervisor
  );

  // Transform leave requests to calendar events
  const events =
    leaves?.map((leave, idx) => ({
      id: leave.id.toString(),
      title: `${leave.employee_name} (${leave.leave_policy_name})${leave.is_half_day && leave.half_day_period ? ` - ${leave.half_day_period}` : ''}`,
      description: leave.reason,
      start: leave.start_date,
      end: new Date(new Date(leave.end_date).setDate(new Date(leave.end_date).getDate() + 1))
        .toISOString()
        .split('T')[0],
      actualEnd: leave.end_date, // Store actual end date for filtering
      allDay: !leave?.is_half_day,
      color: CALENDAR_COLOR_OPTIONS[idx % CALENDAR_COLOR_OPTIONS.length],
      leaveData: leave,
      status: leave.status,
    })) || [];

  const initialFilterState = {
    status: 'all',
    leaveType: [],
    employee: '',
    startDate: null,
    endDate: null,
  };

  const filters = useSetState(initialFilterState);

  const dateError = fIsAfter(filters.state.startDate, filters.state.endDate);

  const {
    calendarRef,
    view,
    date,
    onDatePrev,
    onDateNext,
    onDateToday,
    onChangeView,
    onSelectRange,
    onInitialView,
  } = useCalendar();

  // Open form for add/edit
  const handleOpenForm = (leave = null) => {
    if (leave) {
      currentRequest.setState({ data: leave });
    } else {
      currentRequest.setState({ data: null });
    }
    openForm.onTrue();
  };

  const handleCloseForm = () => {
    openForm.onFalse();
    setTimeout(() => {
      currentRequest.setState({ data: null });
    }, 300);
  };

  // Calendar event click handler
  const handleClickEvent = (info) => {
    const leaveId = parseInt(info.event.id, 10);
    const leave = leaves.find((l) => l.id === leaveId);
    // Allow opening the form for users who can change leave and the leave is pending
    if (leave && canChangeLeave && leave.status === 'pending') {
      handleOpenForm(leave);
    }
  };

  const canReset =
    filters.state.status !== 'all' || (!!filters.state.startDate && !!filters.state.endDate);

  const dataFiltered = applyFilter({ inputData: events, filters: filters.state, dateError });

  if (datasLoading) {
    return <LoadingScreen />;
  }

  const renderResults = (
    <CalendarFiltersResult
      filters={filters}
      totalResults={dataFiltered.length}
      holidays={leaves}
      sx={{ mb: { xs: 3, md: 5 } }}
    />
  );

  const flexProps = { flex: '1 1 auto', display: 'flex', flexDirection: 'column' };

  return (
    <>
      <DashboardContent sx={{ ...flexProps }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: { xs: 3, md: 5 } }}
        >
          <Typography variant="h4">Leave Calendar</Typography>
          {canAddLeave && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => handleOpenForm()}
            >
              New Leave Request
            </Button>
          )}
        </Stack>

        {canReset && renderResults}

        <Card sx={{ ...flexProps, minHeight: '50vh' }}>
          <StyledCalendar sx={{ ...flexProps, '.fc.fc-media-screen': { flex: '1 1 auto' } }}>
            <CalendarToolbar
              date={fDate(date)}
              view={view}
              canReset={canReset}
              loading={datasLoading}
              onNextDate={onDateNext}
              onPrevDate={onDatePrev}
              onToday={onDateToday}
              onChangeView={onChangeView}
              onOpenFilters={openFilters.onTrue}
              leave
              filters={filters}
              leaveTypes={Array.from(new Set(leaves?.map((l) => l.leave_policy_name)))}
              employees={Array.from(new Set(leaves?.map((l) => l.employee_name)))}
            />

            <Calendar
              weekends
              editable={false}
              droppable={false}
              selectable
              rerenderDelay={10}
              allDayMaintainDuration
              ref={(el) => {
                if (el && !calendarRef.current) {
                  calendarRef.current = el;
                  setTimeout(() => {
                    onInitialView();
                  }, 0);
                }
              }}
              initialDate={date}
              initialView={view}
              dayMaxEventRows={3}
              eventDisplay="block"
              events={dataFiltered}
              headerToolbar={false}
              select={onSelectRange}
              eventClick={handleClickEvent}
              aspectRatio={3}
              eventContent={(eventInfo) => {
                const { event } = eventInfo;
                const status = event.extendedProps?.leaveData?.status;
                const isHalfDay = event.extendedProps?.leaveData?.is_half_day;
                return (
                  <Box
                    sx={{
                      width: isHalfDay ? '50%' : '100%',
                      boxSizing: 'border-box',
                      p: '2px 4px',
                      backgroundColor: alpha(event.backgroundColor, 0.12),
                      border: `1px solid ${event.backgroundColor}`,
                      color: event.backgroundColor,
                      borderRadius: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      justifyContent: 'flex-start',
                      mr: isHalfDay ? 0.5 : 0,
                    }}
                  >
                    <Typography variant="caption" noWrap color="inherit" fontWeight="bold">
                      {event.title}{' '}
                    </Typography>
                    <Badge
                      variant="dot"
                      color={
                        status === 'approved'
                          ? 'success'
                          : status === 'pending'
                            ? 'warning'
                            : status === 'rejected'
                              ? 'error'
                              : 'default'
                      }
                      badgeContent={status && status.charAt(0).toUpperCase() + status.slice(1)}
                    />
                  </Box>
                );
              }}
              plugins={[
                listPlugin,
                dayGridPlugin,
                timelinePlugin,
                timeGridPlugin,
                interactionPlugin,
              ]}
            />
          </StyledCalendar>
        </Card>
      </DashboardContent>

      {(canChangeLeave || canAddLeave) && (
        <LeaveRequestQuickEditForm
          open={openForm.value}
          onClose={handleCloseForm}
          addEntry={!currentRequest.state.data}
          currentRequest={currentRequest.state.data || {}}
          user={user}
          isEmployee={user?.role !== 'Admin'}
        />
      )}

      <CalendarFilters
        events={events}
        filters={{
          ...filters,
          onResetState: () => filters.setState(initialFilterState),
        }}
        canReset={canReset}
        dateError={dateError}
        open={openFilters.value}
        onClose={openFilters.onFalse}
        onClickEvent={(eventId) => {
          const leaveId = parseInt(eventId, 10);
          const leave = leaves.find((l) => l.id === leaveId);
          if (leave && canChangeLeave && leave.status === 'pending') {
            handleOpenForm(leave);
          }
        }}
        leave
        leaveTypes={Array.from(new Set(leaves?.map((l) => l.leave_policy_name)))}
        employees={Array.from(new Set(leaves?.map((l) => l.employee_name)))}
      />
    </>
  );
}

function applyFilter({ inputData, filters, dateError }) {
  let filtered = inputData;
  if (filters.leaveType && filters.leaveType.length > 0) {
    filtered = filtered.filter((event) =>
      filters.leaveType.includes(event.leaveData?.leave_policy_name)
    );
  }
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter((event) => event.leaveData?.status === filters.status);
  }
  if (filters.employee && filters.employee !== '') {
    filtered = filtered.filter((event) => event.leaveData?.employee_name === filters.employee);
  }

  const { startDate, endDate } = filters;

  if (!dateError) {
    if (startDate && endDate) {
      filtered = filtered.filter((event) => {
        // Parse dates as strings to avoid timezone issues
        const eventStart = new Date(event.start);
        const eventEnd = event.actualEnd ? new Date(event.actualEnd) : new Date(event.start);

        // Normalize all dates to start of day for comparison
        const filterStart = new Date(startDate);
        filterStart.setHours(0, 0, 0, 0);
        const filterEnd = new Date(endDate);
        filterEnd.setHours(23, 59, 59, 999);

        eventStart.setHours(0, 0, 0, 0);
        eventEnd.setHours(23, 59, 59, 999);

        // Check if event overlaps with the selected date range
        // Event overlaps if it starts before the range ends and ends after the range starts
        return eventStart <= filterEnd && eventEnd >= filterStart;
      });
    }
  }

  return filtered;
}
