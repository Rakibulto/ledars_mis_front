import dayjs from 'dayjs';
import { useMemo, useReducer, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import { DataGrid } from '@mui/x-data-grid';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import { AttendanceInfoDialog } from 'src/sections/user/attendance-info-dialog';

import { AdjustmentForm } from './view/adjustment-form-view';
import { getStatusColor, calculateWorkingHours } from './utils/attendance-utils';

const LegendBox = () => (
  <Stack
    direction="row"
    flexWrap="wrap"
    gap={1}
    sx={{
      '& > *': { fontSize: '0.7rem' },
      justifyContent: 'flex-end',
    }}
    mb={2}
  >
    <Label color="success" variant="soft" size="small">
      P - Present
    </Label>
    <Label
      color="orange"
      variant="soft"
      size="small"
      startIcon={<Iconify icon="mdi:clock-alert" size={12} />}
    >
      L - Late
    </Label>
    <Label color="pink" variant="soft" size="small">
      EL - Early Out
    </Label>
    <Label color="tertiary" variant="soft" size="small">
      HD - Half Day
    </Label>
    <Label color="secondary" variant="soft" size="small">
      W - Weekend (No Attendance)
    </Label>
    <Label color="warning" variant="soft" size="small">
      Leave
    </Label>
    <Label color="tertiary" variant="soft" size="small">
      HDL - Half Day Leave
    </Label>
    <Label color="blue" variant="soft" size="small">
      H - Holiday (No Attendance)
    </Label>
    <Label color="error" variant="soft" size="small">
      A - Absent
    </Label>
  </Stack>
);

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SELECTED_ATTENDANCE':
      return { ...state, selectedAttendance: action.payload };
    case 'CLEAR_SELECTED_ATTENDANCE':
      return { ...state, selectedAttendance: null };
    case 'SET_SELECTED_ADJUSTMENT_DATA':
      return { ...state, selectedAdjustmentData: action.payload };
    case 'CLEAR_SELECTED_ADJUSTMENT_DATA':
      return { ...state, selectedAdjustmentData: null };
    default:
      return state;
  }
}

const STATUS_LABELS = {
  In: { label: 'In', color: 'primaryAlt' },
  Present: { label: 'P', color: 'success' },
  Absent: { label: 'A', color: 'error' },
  Late: { label: 'L', color: 'orange', icon: <Iconify icon="mdi:clock-alert" size={14} /> },
  Leave: { label: 'Leave', color: 'warning' },
  'Half Day': {
    label: 'Half',
    color: 'tertiary',
    icon: <Iconify icon="mdi:weather-sunset" size={14} />,
  },
  'Early Leave': { label: 'EL', color: 'pink', icon: <Iconify icon="mdi:clock-fast" size={14} /> },
  Overtime: { label: 'OT', color: 'blue', icon: <Iconify icon="mdi:clock-time-four" size={14} /> },
  'Not Detected': { label: 'N/A', color: 'default' },
  Holiday: { label: 'H', color: 'blue', icon: <Iconify icon="mdi:calendar-star" size={14} /> },
  Weekend: {
    label: 'W',
    color: 'secondary',
    icon: <Iconify icon="mdi:calendar-weekend" size={14} />,
  },
  'Half Day Leave': {
    label: 'HL',
    color: 'tertiary',
    icon: <Iconify icon="mdi:weather-sunset" size={14} />,
  },
};

// Icon shorthand — add new icons here, then reference by key in ATTENDANCE_LABEL_RULES
const STATUS_ICONS = {
  'clock-alert': <Iconify icon="mdi:clock-alert" size={14} />,
  'clock-fast': <Iconify icon="mdi:clock-fast" size={14} />,
  'weather-sunset': <Iconify icon="mdi:weather-sunset" size={14} />,
  'calendar-star': <Iconify icon="mdi:calendar-star" size={14} />,
  'calendar-weekend': <Iconify icon="mdi:calendar-weekend" size={14} />,
  'calendar-remove': <Iconify icon="mdi:calendar-remove" size={14} />,
};

/**
 * Declarative attendance label rules.
 *
 * Each rule is matched top-to-bottom; the first match wins.
 * Fields left undefined are treated as "don't care".
 *
 * Columns:
 *   status   – string or string[]   (required)
 *   hasIn    – bool | undefined
 *   hasOut   – bool | undefined
 *   late     – bool | undefined
 *   early    – bool | undefined
 *   label    – string               (required)
 *   color    – string               (required)
 *   iconKey  – keyof STATUS_ICONS   (optional)
 *
 * To add or change a label, just add/edit a row in this table.
 */
const ATTENDANCE_LABEL_RULES = [
  // ── Early Leave / Late (these two statuses share the same display logic) ───
  {
    status: ['Early Leave', 'Late'],
    hasIn: true,
    hasOut: true,
    late: true,
    early: true,
    label: 'L+EL',
    color: 'orange',
    iconKey: 'clock-alert',
  },
  {
    status: ['Early Leave', 'Late'],
    hasIn: true,
    hasOut: false,
    late: true,
    label: 'L+EL',
    color: 'orange',
    iconKey: 'clock-alert',
  },
  {
    status: 'Late',
    hasIn: true,
    hasOut: true,
    late: true,
    early: false,
    label: 'L',
    color: 'orange',
    iconKey: 'clock-alert',
  },

  // ── Present ────────────────────────────────────────────────────────────────
  {
    status: 'Present',
    hasIn: true,
    hasOut: true,
    late: true,
    early: true,
    label: 'L+EL',
    color: 'orange',
    iconKey: 'clock-alert',
  },
  {
    status: 'Present',
    hasIn: true,
    hasOut: true,
    late: true,
    early: false,
    label: 'L',
    color: 'orange',
    iconKey: 'clock-alert',
  },
  {
    status: 'Present',
    hasIn: true,
    hasOut: true,
    late: false,
    early: true,
    label: 'EL',
    color: 'pink',
    iconKey: 'clock-fast',
  },
  {
    status: 'Present',
    hasIn: true,
    hasOut: true,
    late: false,
    early: false,
    label: 'P',
    color: 'success',
  },
  {
    status: 'Present',
    hasIn: true,
    hasOut: false,
    late: true,
    label: 'L+EL',
    color: 'orange',
    iconKey: 'clock-alert',
  },
  { status: 'Present', hasIn: true, hasOut: false, late: false, label: 'P+EL', color: 'pink' },

  // ── Half Day ───────────────────────────────────────────────────────────────
  {
    status: 'Half Day',
    hasIn: true,
    hasOut: true,
    late: false,
    label: 'P+HD',
    color: 'tertiary',
    iconKey: 'weather-sunset',
  },
  {
    status: 'Half Day',
    hasIn: true,
    hasOut: false,
    late: false,
    label: 'P+HD+EL',
    color: 'pink',
    iconKey: 'weather-sunset',
  },
  {
    status: 'Half Day',
    hasIn: true,
    hasOut: true,
    late: true,
    label: 'L+HD',
    color: 'orange',
    iconKey: 'weather-sunset',
  },
  {
    status: 'Half Day',
    hasIn: true,
    hasOut: false,
    late: true,
    label: 'L+HD+EL',
    color: 'orange',
    iconKey: 'weather-sunset',
  },

  // ── Half Day Leave ─────────────────────────────────────────────────────────
  {
    status: 'Half Day Leave',
    hasIn: false,
    hasOut: false,
    label: 'HDL',
    color: 'tertiary',
    iconKey: 'weather-sunset',
  },
  {
    status: 'Half Day Leave',
    hasIn: true,
    hasOut: false,
    late: false,
    label: 'P+HDL+EL',
    color: 'pink',
  },
  {
    status: 'Half Day Leave',
    hasIn: true,
    hasOut: false,
    late: true,
    label: 'L+HDL+EL',
    color: 'pink',
  },
  {
    status: 'Half Day Leave',
    hasIn: true,
    hasOut: true,
    late: false,
    label: 'P+HDL',
    color: 'tertiary',
    iconKey: 'weather-sunset',
  },
  {
    status: 'Half Day Leave',
    hasIn: true,
    hasOut: true,
    late: true,
    early: true,
    label: 'L+HDL+EL',
    color: 'pink',
  },
  {
    status: 'Half Day Leave',
    hasIn: true,
    hasOut: true,
    late: true,
    label: 'L+HDL',
    color: 'orange',
    iconKey: 'weather-sunset',
  },

  // ── Holiday ────────────────────────────────────────────────────────────────
  {
    status: 'Holiday',
    hasIn: false,
    hasOut: false,
    label: 'H',
    color: 'blue',
    iconKey: 'calendar-star',
  },
  {
    status: 'Holiday',
    hasIn: true,
    hasOut: false,
    late: false,
    label: 'H+EL',
    color: 'pink',
    iconKey: 'calendar-remove',
  },
  {
    status: 'Holiday',
    hasIn: true,
    hasOut: false,
    late: true,
    label: 'H+L+EL',
    color: 'orange',
    iconKey: 'calendar-remove',
  },
  {
    status: 'Holiday',
    hasIn: true,
    hasOut: true,
    late: true,
    early: true,
    label: 'H+L+EL',
    color: 'blue',
    iconKey: 'calendar-remove',
  },
  {
    status: 'Holiday',
    hasIn: true,
    hasOut: true,
    late: true,
    early: false,
    label: 'H+L',
    color: 'blue',
    iconKey: 'calendar-remove',
  },
  {
    status: 'Holiday',
    hasIn: true,
    hasOut: true,
    late: false,
    early: true,
    label: 'H+EL',
    color: 'blue',
    iconKey: 'calendar-remove',
  },
  {
    status: 'Holiday',
    hasIn: true,
    hasOut: true,
    late: false,
    early: false,
    label: 'H',
    color: 'blue',
    iconKey: 'calendar-remove',
  },

  // ── Weekend ────────────────────────────────────────────────────────────────
  {
    status: 'Weekend',
    hasIn: false,
    hasOut: false,
    label: 'W',
    color: 'secondary',
    iconKey: 'calendar-weekend',
  },
  {
    status: 'Weekend',
    hasIn: true,
    hasOut: false,
    late: false,
    label: 'W+EL',
    color: 'pink',
    iconKey: 'calendar-remove',
  },
  {
    status: 'Weekend',
    hasIn: true,
    hasOut: false,
    late: true,
    label: 'W+L+EL',
    color: 'orange',
    iconKey: 'calendar-remove',
  },
  {
    status: 'Weekend',
    hasIn: true,
    hasOut: true,
    late: true,
    early: true,
    label: 'W+L+EL',
    color: 'secondary',
    iconKey: 'calendar-remove',
  },
  {
    status: 'Weekend',
    hasIn: true,
    hasOut: true,
    late: true,
    early: false,
    label: 'W+L',
    color: 'secondary',
    iconKey: 'calendar-remove',
  },
  {
    status: 'Weekend',
    hasIn: true,
    hasOut: true,
    late: false,
    early: true,
    label: 'W+EL',
    color: 'secondary',
    iconKey: 'calendar-remove',
  },
  {
    status: 'Weekend',
    hasIn: true,
    hasOut: true,
    late: false,
    early: false,
    label: 'W',
    color: 'secondary',
    iconKey: 'calendar-remove',
  },
];

const WEEKEND_DAYS = [5, 6]; // Friday (5), Saturday (6)

const getAttendanceLabel = (attendance) => {
  if (!attendance) return { label: 'N/A', color: 'default' };

  const { status, check_in, check_out, is_late, early_out_by } = attendance;
  const hasIn = !!check_in;
  const hasOut = !!check_out;
  const late = !!is_late;
  const early = !!early_out_by;

  const match = ATTENDANCE_LABEL_RULES.find((rule) => {
    if (Array.isArray(rule.status) ? !rule.status.includes(status) : rule.status !== status)
      return false;
    if (rule.hasIn !== undefined && rule.hasIn !== hasIn) return false;
    if (rule.hasOut !== undefined && rule.hasOut !== hasOut) return false;
    if (rule.late !== undefined && rule.late !== late) return false;
    if (rule.early !== undefined && rule.early !== early) return false;
    return true;
  });

  if (match) {
    return {
      label: match.label,
      color: match.color,
      icon: match.iconKey ? STATUS_ICONS[match.iconKey] : undefined,
    };
  }

  // Fallback to the simple status-only map
  return STATUS_LABELS[status] || { label: 'N/A', color: 'default' };
};

const AttendanceCell = ({ attendance, date, employee, onAttendanceClick }) => {
  const { label, color, icon } = getAttendanceLabel(attendance);
  return (
    <Tooltip title={attendance?.remarks || ''}>
      <Label
        variant="soft"
        color={color}
        startIcon={icon}
        onClick={() => onAttendanceClick(attendance, date, employee)}
        sx={{
          cursor: 'pointer',
          minWidth: 24,
        }}
      >
        {label}
      </Label>
    </Tooltip>
  );
};

export function MonthlyAttendanceTable({ attendanceData, tableHead, pagination, onPageChange }) {
  const settings = useSettingsContext();
  const dialog = useBoolean();
  const adjustmentDialog = useBoolean();
  const today = useMemo(() => new Date(), []);

  const [state, dispatch] = useReducer(reducer, {
    selectedAttendance: null,
    selectedAdjustmentData: null,
    activeFilter: 'all',
  });

  const { selectedAttendance, selectedAdjustmentData, activeFilter } = state;

  const handleAttendanceClick = useCallback(
    (attendance, date, employee) => {
      if (attendance && attendance.check_in) {
        // Open info dialog for attendance with check-in
        dispatch({
          type: 'SET_SELECTED_ATTENDANCE',
          payload: {
            ...attendance,
            date,
            employeeName: employee?.employee_info?.employee_name || 'Unknown',
            employeeId: employee?.employee_info?.employeeId || employee?.employee_info?.id,
            userId: employee?.employee_info?.id || null,
            department: employee?.employee_info?.department || 'Unknown',
            designation: employee?.employee_info?.designation || 'Unknown',
            branch: employee?.employee_info?.branch || 'Unknown',
          },
        });
        dialog.onTrue();
      } else if (
        attendance &&
        (attendance.status === 'Absent' ||
          attendance.status === 'Weekend' ||
          attendance.status === 'Holiday')
      ) {
        // Open adjustment dialog for absent, weekend, or holiday without check-in
        dispatch({
          type: 'SET_SELECTED_ADJUSTMENT_DATA',
          payload: {
            employeeId: employee?.employee_info?.id,
            selectedDate: date,
            checkOut: false,
            attendanceData: {
              status: attendance.status,
              totalWorkedHours: attendance.actual_work_duration || 0,
              timestamps:
                attendance.timestamps ||
                (attendance.check_in
                  ? [attendance.check_in, attendance.check_out].filter(Boolean)
                  : []),
              late_by: attendance.late_by || 0,
              early_out_by: attendance.early_out_by || 0,
              dayOfWeek: dayjs(date, 'YYYY-MM-DD').format('dddd'),
              remarks: attendance?.remarks || '',
            },
          },
        });
        adjustmentDialog.onTrue();
      } else if (attendance) {
        // Open info dialog for other statuses
        dispatch({
          type: 'SET_SELECTED_ATTENDANCE',
          payload: {
            ...attendance,
            date,
            employeeName: employee?.employee_info?.employee_name || 'Unknown',
            employeeId: employee?.employee_info?.employeeId || employee?.employee_info?.id,
            userId: employee?.employee_info?.id || null,
            department: employee?.employee_info?.department || 'Unknown',
            designation: employee?.employee_info?.designation || 'Unknown',
            branch: employee?.employee_info?.branch || 'Unknown',
          },
        });
        dialog.onTrue();
      }
    },
    [dialog, adjustmentDialog]
  );

  const handleCloseDialog = useCallback(() => {
    dialog.onFalse();
    dispatch({ type: 'CLEAR_SELECTED_ATTENDANCE' });
  }, [dialog]);

  const handleCloseAdjustmentDialog = useCallback(() => {
    adjustmentDialog.onFalse();
    dispatch({ type: 'CLEAR_SELECTED_ADJUSTMENT_DATA' });
  }, [adjustmentDialog]);

  // Processing to ensure we're dealing with unique employees
  const processedData = useMemo(() => {
    if (!attendanceData) return [];

    // Handle array data
    const dataArray = Array.isArray(attendanceData) ? attendanceData : attendanceData.results || [];

    // Group by employee ID to ensure unique employees
    const employeeMap = {};

    dataArray.forEach((employee) => {
      const id = employee?.employee_info?.employeeId || employee?.employee_info?.id;

      if (!id) return; // Skip entries without ID

      if (!employeeMap[id]) {
        employeeMap[id] = {
          id,
          employee_info: employee.employee_info,
          attendance: [],
        };
      }

      // Add attendance entries to the appropriate employee
      if (employee.attendance) {
        if (Array.isArray(employee.attendance)) {
          employeeMap[id].attendance.push(...employee.attendance);
        } else {
          employeeMap[id].attendance.push(employee.attendance);
        }
      }
    });

    return Object.values(employeeMap);
  }, [attendanceData]);

  // Generate columns for each day
  const columns = useMemo(() => {
    // Employee info column (pinned left)
    const baseColumns = [
      {
        field: 'employee_info',
        headerName: 'Employee Information',
        minWidth: 250,
        pinned: 'left',
        flex: 1,
        sortable: false,
        filterable: false,
        renderHeader: () => <Typography variant="subtitle2">Employee Information</Typography>,
        renderCell: (params) => {
          const employee = params.row;
          return (
            <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 1 }}>
              <Avatar
                alt={employee?.employee_info?.employee_name || ''}
                src={
                  employee?.employee_info?.profile_picture
                    ? `${CONFIG.serverUrl}${employee?.employee_info?.profile_picture}`
                    : ''
                }
              >
                {(employee?.employee_info?.employee_name?.charAt(0) || '?').toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="subtitle2" noWrap>
                  {employee.employee_info.employee_name || 'Unknown'}
                </Typography>
                {employee?.employee_info?.employeeId && (
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: 'blue.dark',
                      fontWeight: 'bold',
                      bgcolor: (theme) => alpha(theme.palette.blue.lighter, 0.5),
                      py: 0.3,
                      px: 0.8,
                      borderRadius: 1,
                      display: 'inline-block',
                      mt: 0.5,
                    }}
                    noWrap
                  >
                    {employee.employee_info.employeeId}
                  </Typography>
                )}
                {(employee?.employee_info?.department || employee?.employee_info?.designation) && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      mt: 0.5,
                      display: 'block',
                    }}
                    noWrap
                  >
                    {[
                      employee?.employee_info?.department,
                      employee?.employee_info?.designation,
                      employee?.employee_info?.branch,
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                  </Typography>
                )}
              </Box>
            </Stack>
          );
        },
      },
    ];

    // Day columns (middle columns)
    if (tableHead && tableHead.length > 1) {
      tableHead.slice(1, -1).forEach((day) => {
        const isWeekend =
          day.fullDate && (dayjs(day.fullDate).day() === 5 || dayjs(day.fullDate).day() === 6);

        baseColumns.push({
          field: `day_${day.id}`,
          headerName: day.label,
          sortable: false,
          filterable: false,
          minWidth: 70,
          flex: 1,
          renderHeader: () => (
            <Stack spacing={0.5} alignItems="center" justifyContent="center">
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                {day.label}
              </Typography>
              <Typography variant="caption">
                {day.fullDate ? dayjs(day.fullDate).format('ddd') : ''}
              </Typography>
            </Stack>
          ),
          renderCell: (params) => {
            const employee = params.row;
            const date = day.fullDate;
            const dateObj = dayjs(date);
            const dateStr = dateObj.format('DD-MM-YYYY');
            const attendanceRecord = employee.attendance?.find((att) => att.date === dateStr);

            // Handle different cases as in your original code
            if (isWeekend && attendanceRecord && attendanceRecord.check_in) {
              return (
                <AttendanceCell
                  attendance={attendanceRecord}
                  date={date}
                  employee={employee}
                  onAttendanceClick={handleAttendanceClick}
                />
              );
            }

            if (
              attendanceRecord &&
              attendanceRecord.status === 'Holiday' &&
              attendanceRecord.check_in
            ) {
              return (
                <AttendanceCell
                  attendance={attendanceRecord}
                  date={date}
                  employee={employee}
                  onAttendanceClick={handleAttendanceClick}
                />
              );
            }

            if (
              attendanceRecord &&
              attendanceRecord.status === 'Weekend' &&
              !attendanceRecord.check_in
            ) {
              return (
                <AttendanceCell
                  attendance={attendanceRecord}
                  date={date}
                  employee={employee}
                  onAttendanceClick={handleAttendanceClick}
                />
              );
            }

            if (
              attendanceRecord &&
              attendanceRecord.status === 'Holiday' &&
              !attendanceRecord.check_in
            ) {
              return (
                <AttendanceCell
                  attendance={attendanceRecord}
                  date={date}
                  employee={employee}
                  onAttendanceClick={handleAttendanceClick}
                />
              );
            }

            if (attendanceRecord && attendanceRecord.status === 'Leave') {
              return (
                <Label variant="soft" color="warning" sx={{ minWidth: 24 }}>
                  Leave
                </Label>
              );
            }

            return (
              <AttendanceCell
                attendance={attendanceRecord}
                date={date}
                employee={employee}
                onAttendanceClick={handleAttendanceClick}
              />
            );
          },
        });
      });
    }

    // Summary column (pinned right)
    baseColumns.push({
      field: 'summary',
      headerName: 'Monthly Summary',
      minWidth: 300,
      flex: 1,
      pinned: 'right',
      sortable: false,
      filterable: false,
      renderHeader: () => <Typography variant="subtitle2">Monthly Summary</Typography>,
      renderCell: (params) => {
        const employee = params.row;
        const attendance = employee.attendance || [];

        // Recalculate summary metrics
        const countPresent = attendance.filter((att) => att.check_in).length;

        const countLate = attendance.filter((att) => att.is_late).length;
        const countEarlyLeave = attendance.filter(
          (att) =>
            att.status !== 'Half Day Leave' &&
            att.status !== 'Leave' &&
            (!!att.early_out_by || (att.check_in && !att.check_out))
        ).length;
        const countLeave = attendance.reduce(
          (acc, att) =>
            acc + (att.status === 'Leave' ? 1 : att.status === 'Half Day Leave' ? 0.5 : 0),
          0
        );

        const countAbsent = tableHead.slice(1, -1).filter((day) => {
          const dateObj = dayjs(day.fullDate);
          if (dateObj.isAfter(today)) return false;
          const dateStr = dateObj.format('DD-MM-YYYY');
          const attendanceRecord = attendance.find((att) => att.date === dateStr);
          // Weekend with no attendance
          if (WEEKEND_DAYS.includes(dateObj.day()) && !attendanceRecord) return false;
          // Holiday with no attendance
          if (
            attendanceRecord &&
            attendanceRecord.status === 'Holiday' &&
            !attendanceRecord.check_in
          )
            return false;
          // If no attendance or status is Absent
          return !attendanceRecord || attendanceRecord.status === 'Absent';
        }).length;

        const countAdjustment = attendance.filter(
          (att) =>
            att.remarks &&
            typeof att.remarks === 'string' &&
            att.remarks.toLowerCase().includes('attendance adjusted')
        ).length;

        return (
          <Stack
            spacing={0.5}
            alignItems="center"
            justifyContent="center"
            flexDirection="row"
            flexWrap="wrap"
          >
            <Label variant="soft" color="success">
              P: {countPresent}
            </Label>
            <Label variant="soft" color="error">
              A: {countAbsent}
            </Label>
            <Label variant="soft" color="orange">
              L: {countLate}
            </Label>
            <Label variant="soft" color="pink">
              EL: {countEarlyLeave}
            </Label>
            <Label variant="soft" color="warning">
              Leave: {countLeave}
            </Label>
            <Label variant="soft" color="info">
              Adjustments: {countAdjustment}
            </Label>
          </Stack>
        );
      },
    });

    return baseColumns;
  }, [tableHead, today, handleAttendanceClick]);

  return (
    <Box>
      <LegendBox />
      <Card sx={{ boxShadow: (theme) => theme.customShadows.z20, borderRadius: 2 }}>
        <Box sx={{ height: 'calc(100vh - 200px)' }}>
          <DataGrid
            rows={processedData}
            columns={columns}
            disableRowSelectionOnClick
            getRowHeight={() => 'auto'}
            getEstimatedRowHeight={() => 100}
            pagination
            paginationMode="server"
            rowCount={pagination?.total_count || 0}
            paginationModel={{
              page: (pagination?.page || 1) - 1,
              pageSize: 100,
            }}
            onPaginationModelChange={(model) => {
              if (onPageChange) {
                onPageChange(model.page + 1);
              }
            }}
            pageSizeOptions={[100]}
            sx={{
              '& .MuiDataGrid-cell': {
                py: 1,
                px: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              },
              '& .MuiDataGrid-columnHeaderTitleContainer': {
                justifyContent: 'center',
              },
              '& .MuiDataGrid-columnHeader': {
                backgroundColor: 'background.neutral',
              },
              '& .MuiDataGrid-cell[data-field="employee_info"]': {
                justifyContent: 'flex-start',
              },
              '& .MuiDataGrid-row:nth-of-type(even)': {
                backgroundColor: settings.colorScheme === 'dark' ? '#1a2027' : '#f5faff',
              },
              '& .MuiDataGrid-row:nth-of-type(odd)': {
                backgroundColor: settings.colorScheme === 'dark' ? '#0a0e17' : '#ffffff',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: (theme) => alpha(theme.palette.primary.lighter, 0.08),
              },
              border: 'none',
              '& .MuiDataGrid-withBorderColor': {
                borderColor: (theme) => theme.palette.divider,
              },
            }}
          />
        </Box>
      </Card>

      {selectedAttendance && (
        <AttendanceInfoDialog
          dialog={{
            ...dialog,
            onFalse: handleCloseDialog,
          }}
          timestamps={
            selectedAttendance.timestamps ||
            (selectedAttendance.check_in
              ? [selectedAttendance.check_in, selectedAttendance.check_out].filter(Boolean)
              : [])
          }
          status={selectedAttendance.status || 'Present'}
          color={getStatusColor(selectedAttendance)}
          totalWorkedHours={
            calculateWorkingHours(selectedAttendance?.check_in, selectedAttendance?.check_out) ||
            selectedAttendance?.actual_work_duration ||
            0
          }
          checkOut={selectedAttendance.check_out || ''}
          date={selectedAttendance.date}
          employeeName={selectedAttendance.employeeName || 'Unknown'}
          employeeId={selectedAttendance?.employeeId}
          userId={selectedAttendance?.userId}
          department={selectedAttendance?.department || 'N/A'}
          designation={selectedAttendance?.designation || 'N/A'}
          branch={selectedAttendance?.branch || 'N/A'}
          dayOfWeek={dayjs(selectedAttendance.date, 'YYYY-MM-DD').format('dddd') || ''}
          flag
          late_by={selectedAttendance.late_by || 0}
          early_out_by={selectedAttendance.early_out_by || 0}
          remarks={selectedAttendance.remarks || ''}
        />
      )}

      {selectedAdjustmentData && (
        <AdjustmentForm
          open={adjustmentDialog.value}
          onClose={handleCloseAdjustmentDialog}
          inDialog
          userId={selectedAdjustmentData.employeeId}
          selectedDate={selectedAdjustmentData.selectedDate}
          checkOut={selectedAdjustmentData.checkOut}
          attendanceData={selectedAdjustmentData.attendanceData}
        />
      )}
    </Box>
  );
}
