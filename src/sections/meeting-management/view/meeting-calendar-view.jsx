'use client';

import dayjs from 'dayjs';
import { useMemo } from 'react';
import Calendar from '@fullcalendar/react';
import listPlugin from '@fullcalendar/list';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { fDate, fIsAfter } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetSimpleEmployees } from 'src/actions/employees';
import { useGetMeetings } from 'src/actions/meeting-management';
import { useGetBranches, useGetDepartments, useGetDesignations } from 'src/actions/settings';

import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { StyledCalendar } from '../styles';
import { useCalendar } from '../hooks/use-calendar';
import { MEETING_STATUS_COLORS } from '../constants';
import { MeetingQuickEditForm } from '../meeting-quick-edit-form';

const EVENT_PALETTE = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#f97316',
  '#6366f1',
  '#84cc16',
  '#14b8a6',
];

function getEventColor(id) {
  return EVENT_PALETTE[id % EVENT_PALETTE.length];
}

// ----------------------------------------------------------------------

export function MeetingCalendarView() {
  const { user } = useAuthContext();

  const canAddMeeting = user?.user_permissions_list?.some(
    (perm) => perm.codename === 'add_meeting'
  );
  const canChangeMeeting = user?.user_permissions_list?.some(
    (perm) => perm.codename === 'change_meeting'
  );

  const theme = useTheme();
  const openForm = useBoolean();
  const currentMeeting = useSetState({
    data: null,
  });

  // Fetch meetings
  const { datas: meetings, datasLoading } = useGetMeetings();
  const { departments, departmentsLoading } = useGetDepartments();
  const { designations, designationsLoading } = useGetDesignations();
  const { branches, branchesLoading } = useGetBranches();
  const { employees, employeesLoading } = useGetSimpleEmployees();

  // Transform meetings to calendar events
  const meetingsByDate = useMemo(() => {
    const map = {};
    (meetings || []).forEach((m) => {
      if (!map[m.date]) map[m.date] = [];
      map[m.date].push(m.id);
    });
    return map;
  }, [meetings]);

  const events =
    meetings?.map((meeting) => {
      const startDateTime = `${meeting.date}T${meeting.start_time}`;
      const endDateTime = `${meeting.date}T${meeting.end_time}`;
      const sameDay = meetingsByDate[meeting.date] || [];
      const isMultiple = sameDay.length > 1;
      const color = isMultiple
        ? getEventColor(sameDay.indexOf(meeting.id))
        : getStatusColor(meeting.status, theme);

      return {
        id: meeting.id.toString(),
        title: meeting.title,
        description: meeting.description,
        start: startDateTime,
        end: endDateTime,
        allDay: false,
        color,
        meetingData: meeting,
      };
    }) || [];

  const initialFilterState = {
    colors: [],
    startDate: null,
    endDate: null,
    status: '',
    branches: [],
    departments: [],
    designations: [],
    assigned_employees: [],
    created_by: '',
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
    onDateGoto,
    onChangeView,
    onSelectRange,
    onInitialView,
    onClickEventInFilters,
  } = useCalendar();

  const handleOpenForm = (meeting = null) => {
    if (meeting) {
      currentMeeting.setState({ data: meeting });
    } else {
      currentMeeting.setState({ data: null });
    }
    openForm.onTrue();
  };

  const handleCloseForm = () => {
    openForm.onFalse();
    setTimeout(() => {
      currentMeeting.setState({ data: null });
    }, 300);
  };

  const handleClickEvent = (info) => {
    const meetingId = parseInt(info.event.id, 10);
    const meeting = meetings.find((m) => m.id === meetingId);
    if (meeting) {
      handleOpenForm(meeting);
    }
  };

  const canReset =
    filters.state.colors.length > 0 ||
    (!!filters.state.startDate && !!filters.state.endDate) ||
    filters.state.status !== '' ||
    filters.state.branches.length > 0 ||
    filters.state.departments.length > 0 ||
    filters.state.designations.length > 0 ||
    filters.state.assigned_employees.length > 0 ||
    filters.state.created_by !== '';

  const dataFiltered = applyFilter({ inputData: events, filters: filters.state, dateError });

  if (
    datasLoading ||
    departmentsLoading ||
    designationsLoading ||
    branchesLoading ||
    employeesLoading
  ) {
    return <LoadingScreen />;
  }

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
          <Typography variant="h4">Meeting Calendar</Typography>
          {canAddMeeting && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => handleOpenForm()}
            >
              New meeting
            </Button>
          )}
        </Stack>

        <Card sx={{ ...flexProps, minHeight: '50vh' }}>
          <StyledCalendar sx={{ ...flexProps, '.fc.fc-media-screen': { flex: '1 1 auto' } }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ p: 2.5, pr: 2 }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <DatePicker
                  value={date ? dayjs(date) : dayjs()}
                  onChange={(newDate) => {
                    if (newDate && newDate.isValid()) {
                      onDateGoto(newDate.toDate());
                    }
                  }}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { width: 160 },
                    },
                  }}
                />

                <IconButton onClick={onDatePrev}>
                  <Iconify icon="eva:arrow-ios-back-fill" />
                </IconButton>

                <Typography variant="h6">{fDate(date)}</Typography>

                <IconButton onClick={onDateNext}>
                  <Iconify icon="eva:arrow-ios-forward-fill" />
                </IconButton>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1}>
                <Button size="small" color="error" variant="contained" onClick={onDateToday}>
                  Today
                </Button>

                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => filters.setState(initialFilterState)}
                  startIcon={<Iconify icon="solar:restart-bold" />}
                >
                  Reset
                </Button>
              </Stack>
            </Stack>

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
                const meeting = event.extendedProps?.meetingData;
                if (!meeting) return null;

                const sameDay = meetingsByDate[meeting.date] || [];
                const isMultiple = sameDay.length > 1;
                const eventColor = isMultiple
                  ? getEventColor(sameDay.indexOf(meeting.id))
                  : getStatusColor(meeting.status, theme);
                const statusColor = getStatusColor(meeting.status, theme);

                return (
                  <Box
                    sx={{
                      p: '2px 4px',
                      backgroundColor: alpha(eventColor, 0.12),
                      border: `1px solid ${eventColor}`,
                      color: eventColor,
                      borderRadius: '4px',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                    }}
                  >
                    <Typography variant="body2" noWrap color="inherit" fontWeight="bold">
                      {event.title}
                    </Typography>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: statusColor,
                        flexShrink: 0,
                        ml: 0.5,
                      }}
                    />
                  </Box>
                );
              }}
              eventDidMount={(info) => {
                const { event } = info;
                const meeting = event.extendedProps?.meetingData;
                if (!meeting) return;

                const tooltip = document.createElement('div');
                tooltip.className = 'meeting-tooltip';
                tooltip.style.position = 'absolute';
                tooltip.style.zIndex = '10000';
                tooltip.style.backgroundColor = theme.palette.background.paper;
                tooltip.style.color = theme.palette.text.primary;
                tooltip.style.border = `1px solid ${theme.palette.divider}`;
                tooltip.style.padding = '16px';
                tooltip.style.borderRadius = '8px';
                tooltip.style.boxShadow = theme.shadows[3];
                tooltip.style.display = 'none';
                tooltip.style.maxWidth = '320px';

                tooltip.innerHTML = `
                  <div style="margin-bottom: 8px">
                    <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px">${meeting.title}</div>
                    <div style="color: ${theme.palette.text.secondary}">${meeting.description || 'No description'}</div>
                  </div>
                  <div style="display: flex; gap: 16px; margin-bottom: 8px">
                    <div style="display: flex; align-items: center">
                      <span style="margin-right: 4px">📅</span> ${fDate(meeting.date)}
                    </div>
                    <div style="display: flex; align-items: center">
                      <span style="margin-right: 4px">⏰</span> ${meeting.start_time} - ${meeting.end_time}
                    </div>
                  </div>
                  <div style="margin-bottom: 4px">
                    <span style="margin-right: 4px">📍</span> ${meeting.location || 'No location'}
                  </div>
                  ${
                    meeting.meeting_link
                      ? `
                  <div style="margin-bottom: 4px">
                    <span style="margin-right: 4px">🔗</span> ${meeting.meeting_link}
                  </div>
                  `
                      : ''
                  }
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid ${theme.palette.divider}">
                    <span style="margin-right: 4px">👤</span> ${meeting.assigned_to_names || 'No assignees'}
                  </div>
                `;

                document.body.appendChild(tooltip);

                const mouseOver = () => {
                  const rect = info.el.getBoundingClientRect();
                  tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
                  tooltip.style.left = `${rect.left + window.scrollX}px`;
                  tooltip.style.display = 'block';
                };

                const mouseOut = () => {
                  tooltip.style.display = 'none';
                };

                const mouseMove = (e) => {
                  tooltip.style.top = `${e.pageY + 10}px`;
                  tooltip.style.left = `${e.pageX + 10}px`;
                };

                info.el.addEventListener('mouseover', mouseOver);
                info.el.addEventListener('mouseout', mouseOut);
                info.el.addEventListener('mousemove', mouseMove);

                info.el.addEventListener('remove', () => {
                  info.el.removeEventListener('mouseover', mouseOver);
                  info.el.removeEventListener('mouseout', mouseOut);
                  info.el.removeEventListener('mousemove', mouseMove);
                  if (document.body.contains(tooltip)) {
                    document.body.removeChild(tooltip);
                  }
                });
              }}
              plugins={[listPlugin, dayGridPlugin, timeGridPlugin, interactionPlugin]}
            />
          </StyledCalendar>
        </Card>
      </DashboardContent>

      {canChangeMeeting && (
        <MeetingQuickEditForm
          currentMeeting={currentMeeting.state.data}
          open={openForm.value}
          onClose={handleCloseForm}
          addEntry={!currentMeeting.state.data}
        />
      )}
    </>
  );
}

function getStatusColor(status, theme) {
  const colorKey = MEETING_STATUS_COLORS[status];
  if (colorKey && theme.palette[colorKey]) {
    return theme.palette[colorKey].main;
  }
  return theme.palette.grey[500];
}

function applyFilter({ inputData, filters, dateError }) {
  const {
    colors,
    startDate,
    endDate,
    status,
    branches,
    departments,
    designations,
    assigned_employees,
    created_by,
  } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  inputData = stabilizedThis.map((el) => el[0]);

  if (colors.length) {
    inputData = inputData.filter((event) => colors.includes(event.color));
  }

  if (!dateError) {
    if (startDate && endDate) {
      inputData = inputData.filter((event) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        const filterStart = new Date(startDate);
        filterStart.setHours(0, 0, 0, 0);
        const filterEnd = new Date(endDate);
        filterEnd.setHours(23, 59, 59, 999);

        eventStart.setHours(0, 0, 0, 0);
        eventEnd.setHours(23, 59, 59, 999);

        return eventStart <= filterEnd && eventEnd >= filterStart;
      });
    }
  }

  if (status) {
    inputData = inputData.filter((event) => event.meetingData?.status === status);
  }
  if (branches && branches.length > 0) {
    inputData = inputData.filter((event) =>
      event.meetingData?.branches_data?.some((b) => branches.includes(b.id))
    );
  }
  if (departments && departments.length > 0) {
    inputData = inputData.filter((event) =>
      event.meetingData?.departments_data?.some((d) => departments.includes(d.id))
    );
  }
  if (designations && designations.length > 0) {
    inputData = inputData.filter((event) =>
      event.meetingData?.designations_data?.some((d) => designations.includes(d.id))
    );
  }
  if (assigned_employees && assigned_employees.length > 0) {
    inputData = inputData.filter((event) =>
      event.meetingData?.assigned_employees_data?.some((e) => assigned_employees.includes(e.id))
    );
  }
  if (created_by) {
    inputData = inputData.filter((event) => event.meetingData?.created_by === created_by);
  }

  return inputData;
}
