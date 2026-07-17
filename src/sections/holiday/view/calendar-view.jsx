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
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { fDate, fIsAfter } from 'src/utils/format-time';

import { useGetHolidays } from 'src/actions/holiday';
import { DashboardContent } from 'src/layouts/dashboard';
import { CALENDAR_COLOR_OPTIONS } from 'src/_mock/options';
import { useGetSimpleEmployees } from 'src/actions/employees';
import {
  useGetBranches,
  useGetDepartments,
  useGetLeaveGroups,
  useGetDesignations,
} from 'src/actions/settings';

import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { StyledCalendar } from '../styles';
import { useCalendar } from '../hooks/use-calendar';
import { CalendarToolbar } from '../calendar-toolbar';
import { CalendarFilters } from '../calendar-filters';
import { getHolidayTypes } from '../utils/holiday-utils';
import { HolidayQuickEditForm } from '../holiday-quick-edit-form';
import { CalendarFiltersResult } from '../calendar-filters-result';

// ----------------------------------------------------------------------

export function CalendarView() {
  const { user } = useAuthContext();

  const canAddHoliday = user?.user_permissions_list?.some(
    (perm) => perm.codename === 'add_holiday'
  );
  const canChangeHoliday = user?.user_permissions_list?.some(
    (perm) => perm.codename === 'change_holiday'
  );

  const theme = useTheme();
  const openFilters = useBoolean();
  const openForm = useBoolean();
  const currentHoliday = useSetState({
    data: null,
  });

  // Fetch holidays
  const { datas: holidays, datasLoading } = useGetHolidays();
  const { departments, departmentsLoading } = useGetDepartments();
  const { designations, designationsLoading } = useGetDesignations();
  const { branches, branchesLoading } = useGetBranches();
  const { employees, employeesLoading } = useGetSimpleEmployees();
  const { leaveGroups } = useGetLeaveGroups();

  // Transform holidays
  const events =
    holidays?.map((holiday, idx) => ({
      id: holiday.id.toString(),
      title: holiday.name,
      description: holiday.description,
      start: holiday.from_date,
      end: new Date(new Date(holiday.to_date).setDate(new Date(holiday.to_date).getDate() + 1))
        .toISOString()
        .split('T')[0],
      actualEnd: holiday.to_date, // Store actual end date for filtering
      allDay: true,
      color: CALENDAR_COLOR_OPTIONS[idx % CALENDAR_COLOR_OPTIONS.length],
      holidayData: holiday,
    })) || [];

  const initialFilterState = {
    colors: [],
    startDate: null,
    endDate: null,
    is_global: '',
    employment_types: '',
    branches: [],
    departments: [],
    designations: [],
    assigned_employees: [],
    excluded_employees: [],
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
    onClickEventInFilters,
  } = useCalendar();

  const handleOpenForm = (holiday = null) => {
    if (holiday) {
      // Transform the holiday data to match form expectations
      const transformedHoliday = {
        id: holiday.id,
        name: holiday.name,
        from_date: holiday.from_date,
        to_date: holiday.to_date,
        description: holiday.description,
        is_global: holiday.is_global,
        employment_types: holiday.employment_types,
        branches: holiday.branches_data?.map((b) => b.id) || [],
        departments: holiday.departments_data?.map((d) => d.id) || [],
        designations: holiday.designations_data?.map((d) => d.id) || [],
        assigned_employees: holiday.assigned_employees_data?.map((e) => e.id) || [],
        excluded_employees: holiday.excluded_employees_data?.map((e) => e.id) || [],
        status: holiday.status || 'Pending',
        holiday_type: getHolidayTypes(holiday),
        branches_data: holiday.branches_data,
        departments_data: holiday.departments_data,
        designations_data: holiday.designations_data,
        assigned_employees_data: holiday.assigned_employees_data,
        excluded_employees_data: holiday.excluded_employees_data,
      };

      currentHoliday.setState({ data: transformedHoliday });
    } else {
      currentHoliday.setState({ data: null });
    }
    openForm.onTrue();
  };

  const handleCloseForm = () => {
    openForm.onFalse();
    setTimeout(() => {
      currentHoliday.setState({ data: null });
    }, 300);
  };

  const handleClickEvent = (info) => {
    const holidayId = parseInt(info.event.id, 10);
    const holiday = holidays.find((h) => h.id === holidayId);
    if (holiday) {
      handleOpenForm(holiday);
    }
  };

  const canReset =
    filters.state.colors.length > 0 ||
    (!!filters.state.startDate && !!filters.state.endDate) ||
    filters.state.is_global !== '' ||
    filters.state.employment_types !== '' ||
    filters.state.branches.length > 0 ||
    filters.state.departments.length > 0 ||
    filters.state.designations.length > 0 ||
    filters.state.assigned_employees.length > 0 ||
    filters.state.excluded_employees.length > 0;

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

  const renderResults = (
    <CalendarFiltersResult
      filters={filters}
      totalResults={dataFiltered.length}
      holidays={holidays}
      branchOptions={branches}
      departmentOptions={departments}
      designationOptions={designations}
      employeeOptions={employees}
      leaveGroups={leaveGroups}
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
          <Typography variant="h4">Holiday Calendar</Typography>
          {canAddHoliday && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => handleOpenForm()}
            >
              New holiday
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
                const isGlobal = event.extendedProps?.holidayData?.is_global;

                return (
                  <Box
                    sx={{
                      p: '2px 4px',
                      backgroundColor: alpha(event.backgroundColor, 0.12),
                      border: `1px solid ${event.backgroundColor}`,
                      color: event.backgroundColor,
                      borderRadius: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {isGlobal && (
                      <Box component="span" sx={{ mr: '4px' }}>
                        🌎
                      </Box>
                    )}
                    <Typography variant="body2" noWrap color="inherit" fontWeight="bold">
                      {event.title}
                    </Typography>
                  </Box>
                );
              }}
              eventDidMount={(info) => {
                const { event } = info;
                const holiday = event.extendedProps?.holidayData;
                if (!holiday) return;

                const tooltip = document.createElement('div');
                tooltip.className = 'holiday-tooltip';
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
                    <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px">${holiday.name}</div>
                    <div style="color: ${theme.palette.text.secondary}">${holiday.description}</div>
                  </div>
                  <div style="display: flex; gap: 16px; margin-bottom: 8px">
                    <div style="display: flex; align-items: center">
                      <span style="margin-right: 4px">📅</span> ${fDate(holiday.from_date)}
                    </div>
                    <div style="display: flex; align-items: center">
                      <span style="margin-right: 4px">📅</span> ${fDate(holiday.to_date)}
                    </div>
                  </div>
                  ${
                    !holiday.is_global
                      ? `
                    <div style="margin-bottom: 4px">
                      <span style="margin-right: 4px">👥</span> Employment Type: ${
                        holiday.employment_type_name
                          ? holiday.employment_type_name.charAt(0).toUpperCase() +
                            holiday.employment_type_name.slice(1).replace(/_/g, ' ')
                          : 'All'
                      }
                    </div>
                    ${
                      holiday.branches_data?.length
                        ? `
                      <div style="margin-bottom: 4px">
                        <span style="margin-right: 4px">🏢</span> Branches: ${holiday.branches_data
                          .map((b) => b.name)
                          .join(', ')}
                      </div>
                    `
                        : ''
                    }
                    ${
                      holiday.departments_data?.length
                        ? `
                      <div style="margin-bottom: 4px">
                        <span style="margin-right: 4px">🏗️</span> Departments: ${holiday.departments_data
                          .map((d) => d.name)
                          .join(', ')}
                      </div>
                    `
                        : ''
                    }
                    ${
                      holiday.designations_data?.length
                        ? `
                      <div style="margin-bottom: 4px">
                        <span style="margin-right: 4px">👔</span> Designations: ${holiday.designations_data
                          .map((d) => d.name)
                          .join(', ')}
                      </div>
                    `
                        : ''
                    }
                  `
                      : ''
                  }
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

      {canChangeHoliday && (
        <HolidayQuickEditForm
          currentHoliday={currentHoliday.state.data}
          open={openForm.value}
          onClose={handleCloseForm}
          addEntry={!currentHoliday.state.data}
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
          const holidayId = parseInt(eventId, 10);
          const holiday = holidays.find((h) => h.id === holidayId);
          if (holiday) {
            handleOpenForm(holiday);
          }
        }}
        colorOptions={CALENDAR_COLOR_OPTIONS}
        branchOptions={branches}
        departmentOptions={departments}
        designationOptions={designations}
        employeeOptions={employees}
      />
    </>
  );
}

function applyFilter({ inputData, filters, dateError }) {
  const {
    colors,
    startDate,
    endDate,
    employment_types,
    branches,
    departments,
    designations,
    assigned_employees,
    excluded_employees,
    is_global,
  } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  inputData = stabilizedThis.map((el) => el[0]);

  if (colors.length) {
    inputData = inputData.filter((event) => colors.includes(event.color));
  }

  if (!dateError) {
    if (startDate && endDate) {
      inputData = inputData.filter((event) => {
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

  if (employment_types !== '') {
    if (employment_types === 'all') {
      inputData = inputData.filter((event) => event.holidayData?.employment_types === null);
    } else {
      inputData = inputData.filter(
        (event) => event.holidayData?.employment_types === employment_types
      );
    }
  }
  if (branches && branches.length > 0) {
    inputData = inputData.filter((event) =>
      event.holidayData?.branches_data?.some((b) => branches.includes(b.id))
    );
  }
  if (departments && departments.length > 0) {
    inputData = inputData.filter((event) =>
      event.holidayData?.departments_data?.some((d) => departments.includes(d.id))
    );
  }
  if (designations && designations.length > 0) {
    inputData = inputData.filter((event) =>
      event.holidayData?.designations_data?.some((d) => designations.includes(d.id))
    );
  }
  if (assigned_employees && assigned_employees.length > 0) {
    inputData = inputData.filter((event) =>
      event.holidayData?.assigned_employees_data?.some((e) => assigned_employees.includes(e.id))
    );
  }
  if (excluded_employees && excluded_employees.length > 0) {
    inputData = inputData.filter((event) =>
      event.holidayData?.excluded_employees_data?.some((e) => excluded_employees.includes(e.id))
    );
  }
  if (typeof is_global === 'boolean') {
    inputData = inputData.filter((event) => event.holidayData?.is_global === is_global);
  }

  return inputData;
}
