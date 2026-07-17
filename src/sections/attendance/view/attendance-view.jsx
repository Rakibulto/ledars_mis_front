'use client';

import dayjs from 'dayjs';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, Fragment, useEffect, forwardRef, useReducer, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Slide from '@mui/material/Slide';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import ListItemText from '@mui/material/ListItemText';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { getLocalIP } from 'src/utils/get-local-ip';
import { fDate, fTime, fDateTime, fDateRangeShortLabel } from 'src/utils/format-time';

import { ATTENDANCE_STATUS } from 'src/_mock/options';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetSimpleEmployees } from 'src/actions/employees';
import {
  createAttendance,
  updateAttendance,
  deleteAttendance,
  useGetAttendances,
} from 'src/actions/attendance';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { RenderContentLoading } from 'src/components/loading';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { View403 } from 'src/sections/error';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const Transition = forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

const TABLE_HEAD = [
  { id: 'employee_name', label: 'Employee Name' },
  { id: 'attendance_status', label: 'Status' },
  { id: 'device_serial_number', label: 'Device' },
  { id: 'timestamp', label: 'Timestamp' },
  { id: 'created_by', label: 'Created By' },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CURRENT_ATTENDANCE':
      return { ...state, currentAttendance: action.payload };
    case 'SET_IS_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    case 'SET_ATTENDANCE_TO_DELETE':
      return { ...state, attendanceToDelete: action.payload };
    default:
      return state;
  }
}

const initialState = {
  currentAttendance: null,
  isSubmitting: false,
  attendanceToDelete: null,
};

export function AttendanceView() {
  const { user } = useAuthContext();
  const table = useTable();
  const confirm = useBoolean();
  const bulkDeleteConfirm = useBoolean();
  const dialog = useBoolean();
  const [localIp, setLocalIp] = useState('');
  const [publicIp, setPublicIp] = useState('');
  const [localIpLoading, setLocalIpLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLocalIpLoading(true);
    getLocalIP()
      .then((ipInfo) => {
        if (mounted) {
          setLocalIp(ipInfo.localIP || '');
          setPublicIp(ipInfo.publicIP || '');
          setLocalIpLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setLocalIp('');
          setPublicIp('');
          setLocalIpLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const [state, dispatch] = useReducer(reducer, initialState);

  // Permission checks
  const canAddAttendance = hasPermission('add_attendancedata');
  const canEditAttendance = hasPermission('change_attendancedata');
  const canDeleteAttendance = hasPermission('delete_attendancedata');

  function hasPermission(codename) {
    return (
      user?.user_permissions_list?.some((permission) => permission.codename === codename) || false
    );
  }

  // Filters
  const filters = useSetState({
    keyword: '',
    status: 'all',
    employee: '',
    startDate: null,
    endDate: null,
  });

  // Fetch attendance data with backend filters
  const { attendances, attendancesLoading, attendancesError, pagination } = useGetAttendances(
    table.page + 1,
    table.rowsPerPage,
    {
      keyword: filters.state.keyword,
      status: filters.state.status,
      employee: filters.state.employee,
      startDate: filters.state.startDate,
      endDate: filters.state.endDate,
    }
  );

  // Fetch employees for dropdown
  const { employees = [], employeesLoading } = useGetSimpleEmployees();

  const canReset =
    !!filters.state.keyword ||
    filters.state.status !== 'all' ||
    !!filters.state.employee ||
    !!filters.state.startDate ||
    !!filters.state.endDate;
  const notFound = (!attendances.length && canReset) || !attendances.length;

  // Handlers
  const handleFilterKeyword = useCallback(
    (event) => {
      filters.setState({ keyword: event.target.value });
      table.onResetPage();
    },
    [filters, table]
  );

  const handleFilterStatus = useCallback(
    (event) => {
      filters.setState({ status: event.target.value });
      table.onResetPage();
    },
    [filters, table]
  );

  const handleFilterEmployee = useCallback(
    (_, value) => {
      filters.setState({ employee: value ? value.employee_id : '' });
      table.onResetPage();
    },
    [filters, table]
  );

  const handleFilterStartDate = useCallback(
    (date) => {
      filters.setState({ startDate: date });
      table.onResetPage();
    },
    [filters, table]
  );

  const handleFilterEndDate = useCallback(
    (date) => {
      filters.setState({ endDate: date });
      table.onResetPage();
    },
    [filters, table]
  );

  const handleAddAttendance = useCallback(() => {
    dispatch({ type: 'SET_CURRENT_ATTENDANCE', payload: null });
    dialog.onTrue();
  }, [dialog]);

  const handleEditAttendance = useCallback(
    (attendance) => {
      dispatch({ type: 'SET_CURRENT_ATTENDANCE', payload: attendance });
      dialog.onTrue();
    },
    [dialog]
  );

  const handleDeleteAttendance = useCallback(
    (attendance) => {
      dispatch({ type: 'SET_ATTENDANCE_TO_DELETE', payload: attendance });
      confirm.onTrue();
    },
    [confirm]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!state.attendanceToDelete) return;
    try {
      await deleteAttendance(state.attendanceToDelete.id);
      toast.success('Attendance record deleted successfully');
    } catch (error) {
      console.error('Error deleting attendance:', error);
      toast.error(error?.detail || 'Failed to delete attendance record');
    } finally {
      confirm.onFalse();
      dispatch({ type: 'SET_ATTENDANCE_TO_DELETE', payload: null });
    }
  }, [state.attendanceToDelete, confirm]);

  // Bulk delete handler
  const handleDeleteRows = useCallback(async () => {
    try {
      const deletePromises = table.selected.map((id) => deleteAttendance(id));
      await Promise.all(deletePromises);
      toast.success('Attendance records deleted successfully!');
      table.onSelectAllRows(false, []);
    } catch (error) {
      console.error('Error deleting attendances:', error);
      toast.error('Failed to delete attendance records');
    }
  }, [table]);

  const handleCloseDialog = useCallback(() => {
    dialog.onFalse();
    dispatch({ type: 'SET_CURRENT_ATTENDANCE', payload: null });
  }, [dialog]);

  const handleSubmitAttendance = async (formData) => {
    try {
      dispatch({ type: 'SET_IS_SUBMITTING', payload: true });

      const dateStr = formData.timestamp; // YYYY-MM-DD format or Date object
      const timeStr = formData.time; // HH:mm:ss format

      let combinedDate;
      if (user?.role === 'Admin') {
        const originalDate = state.currentAttendance
          ? dayjs(state.currentAttendance.timestamp).format('YYYY-MM-DD')
          : dayjs(dateStr).format('YYYY-MM-DD');
        combinedDate = dayjs(`${originalDate}T${timeStr}`);
        if (!combinedDate.isValid()) {
          throw new Error('Invalid date or time format');
        }
        formData.timestamp = combinedDate.toISOString();
      } else {
        formData.timestamp = state.currentAttendance?.timestamp || dayjs().toISOString();
      }

      delete formData.time;

      if (state.currentAttendance) {
        await updateAttendance(state.currentAttendance.id, formData);
        toast.success('Attendance record updated successfully');
      } else {
        await createAttendance(formData);
        toast.success('Attendance record created successfully');
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error(
        error?.detail || error[0] || error?.message || 'Failed to save attendance record'
      );
    } finally {
      dispatch({ type: 'SET_IS_SUBMITTING', payload: false });
    }
  };

  if (attendancesError?.detail === 'You do not have permission to view this attendance data.') {
    return <View403 />;
  }

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Attendance"
          links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Attendance' }]}
          action={
            canAddAttendance && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Iconify icon="eva:plus-fill" />}
                onClick={handleAddAttendance}
              >
                New Record
              </Button>
            )
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Stack
            spacing={2}
            direction={{ xs: 'column', sm: 'row' }}
            sx={{ py: 2.5, px: 3 }}
            alignItems="stretch"
            justifyContent="space-between"
            flexWrap="wrap"
          >
            <TextField
              value={filters.state.keyword}
              onChange={handleFilterKeyword}
              placeholder="Search by name, ID, RFID, device serial..."
              sx={{ minWidth: { sm: 220 }, width: { xs: '100%', sm: 'auto' }, flex: 1 }}
              InputProps={{
                startAdornment: (
                  <Box component="span" sx={{ mr: 1, color: 'text.disabled' }}>
                    <Iconify icon="eva:search-fill" />
                  </Box>
                ),
              }}
            />

            <TextField
              select
              label="Status"
              value={filters.state.status}
              onChange={handleFilterStatus}
              sx={{ minWidth: { sm: 140 }, width: { xs: '100%', sm: 'auto' }, flex: 1 }}
            >
              <MenuItem value="all">All Status</MenuItem>
              {ATTENDANCE_STATUS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <Autocomplete
              options={employees}
              loading={employeesLoading}
              value={
                filters.state.employee
                  ? employees.find((emp) => emp.employee_id === filters.state.employee)
                  : null
              }
              onChange={handleFilterEmployee}
              getOptionLabel={(option) =>
                option?.employee_name
                  ? `${option.employee_name} (${option.employee_id})`
                  : option?.user?.username || ''
              }
              isOptionEqualToValue={(option, value) => option?.employee_id === value?.employee_id}
              renderOption={(props, option) => (
                <li {...props} key={option.user?.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={option.profile_picture || ''}
                      alt={option.employee_name || option.user?.username}
                      sx={{ width: 24, height: 24 }}
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" color="text.primary">
                        {option.employee_name || option.user?.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.employee_id || ''}
                      </Typography>
                    </Box>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Employee"
                  placeholder="Select employee"
                  sx={{ minWidth: { sm: 240 }, width: { xs: '100%', sm: 'auto' }, flex: 1 }}
                />
              )}
            />

            <DatePicker
              openTo="day"
              format="DD/MM/YYYY"
              label="Start Date"
              value={filters.state.startDate}
              onChange={handleFilterStartDate}
              slotProps={{
                textField: {
                  sx: { minWidth: { sm: 140 }, width: { xs: '100%', sm: 'auto' }, flex: 1 },
                },
              }}
            />
            <DatePicker
              openTo="day"
              format="DD/MM/YYYY"
              label="End Date"
              value={filters.state.endDate}
              onChange={handleFilterEndDate}
              slotProps={{
                textField: {
                  sx: { minWidth: { sm: 140 }, width: { xs: '100%', sm: 'auto' }, flex: 1 },
                },
              }}
            />
          </Stack>

          {/* Show filters result summary when there are active filters */}
          {canReset && (
            <AttendanceTableFiltersResult
              filters={filters}
              totalResults={pagination.count}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5 }}
            />
          )}
          {attendancesLoading ? (
            <RenderContentLoading showAnalytics={false} m={0} />
          ) : attendancesError ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
              <Typography color="error">
                Error loading attendance data. Please try again later.
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ position: 'relative' }}>
                {canDeleteAttendance && (
                  <TableSelectedAction
                    dense={table.dense}
                    numSelected={table.selected.length}
                    rowCount={attendances.length}
                    onSelectAllRows={(checked) =>
                      table.onSelectAllRows(
                        checked,
                        attendances.map((row) => row.id)
                      )
                    }
                    action={
                      <Tooltip title="Delete">
                        <IconButton color="primary" onClick={bulkDeleteConfirm.onTrue}>
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Tooltip>
                    }
                  />
                )}

                <Scrollbar>
                  <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                    <TableHeadCustom
                      order={table.order}
                      orderBy={table.orderBy}
                      headLabel={TABLE_HEAD}
                      rowCount={attendances.length}
                      numSelected={table.selected.length}
                      onSort={table.onSort}
                      onSelectAllRows={
                        canDeleteAttendance
                          ? (checked) =>
                              table.onSelectAllRows(
                                checked,
                                attendances.map((row) => row.id)
                              )
                          : undefined
                      }
                    />

                    <TableBody>
                      {attendances.map((row) => (
                        <AttendanceTableRow
                          key={row.id}
                          row={row}
                          selected={table.selected.includes(row.id)}
                          onSelectRow={() => table.onSelectRow(row.id)}
                          onDeleteRow={() => handleDeleteAttendance(row)}
                          onEditRow={() => handleEditAttendance(row)}
                          canEdit={canEditAttendance}
                          canDelete={canDeleteAttendance}
                          showCheckbox={canDeleteAttendance}
                        />
                      ))}

                      <TableEmptyRows height={table.dense ? 52 : 76} emptyRows={emptyRows(0)} />

                      <TableNoData notFound={notFound} />
                    </TableBody>
                  </Table>
                </Scrollbar>
              </Box>

              <TablePaginationCustom
                count={pagination.count}
                page={table.page}
                rowsPerPage={table.rowsPerPage}
                onPageChange={table.onChangePage}
                onRowsPerPageChange={table.onChangeRowsPerPage}
                dense={table.dense}
                onChangeDense={table.onChangeDense}
              />
            </>
          )}
        </Card>
      </DashboardContent>

      <AttendanceFormDialog
        open={dialog.value}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitAttendance}
        currentAttendance={state.currentAttendance}
        isSubmitting={state.isSubmitting}
        employees={employees}
        employeesLoading={employeesLoading}
        localIp={localIpLoading ? '' : localIp}
        publicIp={localIpLoading ? '' : publicIp}
        showBothIPs={localIp && publicIp && localIp !== publicIp}
        user={user}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content="Are you sure you want to delete this attendance record?"
        action={
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Delete
          </Button>
        }
      />

      <ConfirmDialog
        open={bulkDeleteConfirm.value}
        onClose={bulkDeleteConfirm.onFalse}
        title="Delete"
        content={
          <>
            Are you sure you want to delete <strong>{table.selected.length}</strong> attendance
            records?
          </>
        }
        action={
          <LoadingButton
            variant="contained"
            color="error"
            onClick={handleDeleteRows}
            loading={state.isSubmitting}
            disabled={table.selected.length === 0}
          >
            Delete
          </LoadingButton>
        }
      />
    </>
  );
}

// ----------------------------------------------------------------------

function AttendanceTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  onEditRow,
  canEdit,
  canDelete,
  showCheckbox,
}) {
  return (
    <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
      {showCheckbox && (
        <TableCell padding="checkbox">
          <Checkbox id={row.id} checked={selected} onClick={onSelectRow} />
        </TableCell>
      )}

      <TableCell>
        <Stack
          spacing={0.5}
          sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Iconify icon="solar:user-bold" width={20} sx={{ color: 'primary.main' }} />
            <Typography variant="subtitle2" noWrap>
              {row.employee_name || <span style={{ color: '#aaa' }}>Unknown</span>}
            </Typography>
          </Stack>
          {row?.employee_id && (
            <Label
              variant="soft"
              color="blue"
              sx={{
                typography: 'caption',
                fontWeight: 600,
                borderRadius: '4px',
                px: 1,
                fontSize: '14px',
              }}
            >
              ID: {row?.employee_id}
            </Label>
          )}
          {(row?.department || row?.branch) && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                mt: 0.5,
                display: 'block',
              }}
            >
              {row?.department && row?.branch
                ? `${row?.department} • ${row?.branch}`
                : row?.department || row?.branch}
            </Typography>
          )}
        </Stack>
      </TableCell>

      <TableCell>
        {row.attendance_status ? (
          <Label
            variant="soft"
            color={
              (row.attendance_status === 'Present' && 'success') ||
              (row.attendance_status === 'Absent' && 'error') ||
              (row.attendance_status === 'Late' && 'orange') ||
              (row.attendance_status === 'Overtime' && 'info') ||
              (row.attendance_status === 'Early Leave' && 'pink') ||
              (row.attendance_status === 'Not Detected' && 'default') ||
              'default'
            }
          >
            {row.attendance_status}
          </Label>
        ) : (
          <Label variant="soft" color="default">
            N/A
          </Label>
        )}
      </TableCell>

      <TableCell>
        <Stack
          spacing={0.5}
          sx={{
            typography: 'body2',
            flex: '1 1 auto',
            alignItems: 'flex-start',
          }}
        >
          <Label
            color={
              row?.login_type === 'Web Login'
                ? 'primary'
                : row?.login_type === 'Manual Entry'
                  ? 'info'
                  : 'success'
            }
          >
            {row?.login_type}
          </Label>
          {(row?.login_type === 'Web Login' || row?.login_type === 'Manual Entry') &&
            (() => {
              const lines = [];
              lines.push(`Device: ${row?.device_serial_number || 'N/A'}`);
              lines.push(`Local IP: ${row?.local_ip_address || 'N/A'}`);
              lines.push(`RFID: ${row?.rfid || 'N/A'}`);
              if (row?.location_name) {
                let loc = `Location: ${row.location_name}`;
                if (row.latitude && row.longitude) {
                  const acc = row.location_accuracy || 'N/A';
                  loc += ` (${row.latitude}, ${row.longitude} ±${acc}m)`;
                }
                lines.push(loc);
              }
              const displayText = lines.join('\n');
              return (
                <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{displayText}</span>}>
                  <Typography
                    variant="span"
                    color={
                      !row.device_serial_number || !row.rfid || !row.local_ip_address
                        ? 'text.disabled'
                        : 'text.primary'
                    }
                  >
                    {lines.map((l, i) => (
                      <Fragment key={i}>
                        {l}
                        {i < lines.length - 1 && <br />}
                      </Fragment>
                    ))}
                  </Typography>
                </Tooltip>
              );
            })()}
        </Stack>
      </TableCell>

      <TableCell>
        <Tooltip
          title={row.timestamp ? `${fDate(row.timestamp)} ${fTime(row.timestamp)}` : 'No timestamp'}
        >
          <Typography variant="body2" color={row.timestamp ? 'text.primary' : 'text.disabled'}>
            {row.timestamp ? (
              <>
                {fDate(row.timestamp)}{' '}
                <span style={{ color: 'text.secondary' }}>{fTime(row.timestamp)}</span>
              </>
            ) : (
              <span style={{ color: '#aaa' }}>N/A</span>
            )}
          </Typography>
        </Tooltip>
      </TableCell>

      <TableCell>
        <Stack direction="row" spacing={1} alignItems="center">
          <Iconify icon="solar:user-bold" width={20} sx={{ color: 'primary.main' }} />
          <Typography variant="subtitle2" noWrap>
            {row?.created_by || <span style={{ color: '#aaa' }}>Unknown</span>}
          </Typography>
        </Stack>
        <ListItemText
          primary={`Created at: ${fDateTime(row?.created_at)}`}
          secondary={`Updated at: ${fDateTime(row?.updated_at)}`}
          primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
          secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
        />
      </TableCell>

      <TableCell align="right">
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {canEdit && (
            <Tooltip title="Quick Edit" placement="top" arrow>
              <IconButton onClick={onEditRow} color="default">
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Delete" placement="top" arrow>
              <IconButton onClick={onDeleteRow} color="default">
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
}

// ----------------------------------------------------------------------

export function AttendanceFormDialog({
  open,
  onClose,
  onSubmit,
  currentAttendance,
  isSubmitting,
  employees = [],
  employeesLoading = false,
  localIp = '',
  publicIp = '',
  showBothIPs = false,
  user = {},
}) {
  // Define validation schema using Zod
  const AttendanceSchema = zod.object({
    employee: zod
      .number()
      .min(1, { message: 'Employee is required' })
      .or(zod.string().min(1, { message: 'Employee is required' })),
    device_serial_number: zod.string().optional(),
    local_ip_address: zod.string().optional(),
    login_type: zod.string().min(1, { message: 'Login type is required' }),
    timestamp: zod.union([zod.string(), zod.date(), zod.instanceof(Date)]).transform((val) => {
      if (val instanceof Date) return val;
      try {
        const date = new Date(val);
        if (Number.isNaN(date.getTime())) throw new Error('Invalid date');
        return date;
      } catch (e) {
        throw new Error('Timestamp is not valid');
      }
    }),
    time: zod.string().min(1, { message: 'Time is required!' }),
  });

  const defaultValues = useMemo(() => {
    // Extract time in 'HH:mm:ss' format from timestamp
    let timeValue = '';
    if (currentAttendance?.timestamp) {
      const dateObj = new Date(currentAttendance.timestamp);
      // Pad hours, minutes, seconds
      const pad = (n) => n.toString().padStart(2, '0');
      timeValue = `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;
    } else {
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      timeValue = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    }
    return {
      employee: currentAttendance?.employee?.toString() || '',
      device_serial_number: currentAttendance?.device_serial_number || publicIp || '',
      local_ip_address: showBothIPs ? localIp : '',
      login_type: currentAttendance?.login_type || 'Manual Entry',
      timestamp: currentAttendance?.timestamp ? new Date(currentAttendance?.timestamp) : new Date(),
      time: timeValue,
    };
  }, [currentAttendance, publicIp, localIp, showBothIPs]);

  const methods = useForm({
    resolver: zodResolver(AttendanceSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting: isFormSubmitting, errors },
    watch,
    setValue,
  } = methods;

  useMemo(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" TransitionComponent={Transition}>
      <DialogTitle>
        {currentAttendance ? 'Edit Attendance Record' : 'New Attendance Record'}
      </DialogTitle>
      <Form methods={methods} onSubmit={handleSubmit(onFormSubmit)}>
        <DialogContent>
          {!currentAttendance && (
            <IpInfoCard publicIp={publicIp} localIp={localIp} showBothIPs={showBothIPs} />
          )}
          <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            {user?.role === 'Admin' ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <Iconify icon="mdi:information" color="primary.main" />
                <Typography variant="body2" color="text.secondary">
                  As an admin, you can modify the time but not the date of the attendance record.
                </Typography>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1} alignItems="center">
                <Iconify icon="mdi:lock" color="warning.main" />
                <Typography variant="body2" color="text.secondary">
                  You don&apos;t have permission to modify the date or time of attendance records.
                </Typography>
              </Stack>
            )}
          </Box>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field.Autocomplete
                  name="employee"
                  label="Employee"
                  options={employees}
                  loading={employeesLoading}
                  value={employees.find((e) => e.user?.id === Number(watch('employee'))) || null}
                  onChange={(_, newValue) => {
                    setValue('employee', newValue ? newValue.user?.id : '');
                  }}
                  getOptionLabel={(option) =>
                    option?.employee_name
                      ? `${option.employee_name} (${option.employee_id})`
                      : option?.user?.username || ''
                  }
                  isOptionEqualToValue={(option, value) => option?.user?.id === value?.user?.id}
                  renderOption={(props, option) => (
                    <li {...props} key={option.user?.id}>
                      {option.employee_name} ({option.employee_id})
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField {...params} label="Employee" placeholder="Select employee" />
                  )}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field.Text
                  name="device_serial_number"
                  label="Device Serial Number"
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field.DatePicker name="timestamp" label="Date" fullWidth maxDate={dayjs()} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field.TimePicker
                  name="time"
                  label="Time"
                  fullWidth
                  helperText={
                    user?.role === 'Admin' ? 'Admins can modify time' : 'Time cannot be modified'
                  }
                  disabled={user?.role !== 'Admin'}
                />
              </Grid>
            </Grid>
            {/* Hidden local_ip_address field, only if showBothIPs is true */}
            {showBothIPs && <input type="hidden" name="local_ip_address" value={localIp} />}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            color="primary"
            loading={isSubmitting || isFormSubmitting}
            variant="contained"
          >
            {currentAttendance ? 'Update' : 'Create'}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

function AttendanceTableFiltersResult({ filters, totalResults, onResetPage, sx }) {
  const handleRemoveKeyword = () => {
    onResetPage();
    filters.setState({ keyword: '' });
  };

  const handleRemoveStatus = () => {
    onResetPage();
    filters.setState({ status: 'all' });
  };

  const handleRemoveEmployee = () => {
    onResetPage();
    filters.setState({ employee: '' });
  };

  const handleRemoveStartDate = () => {
    onResetPage();
    filters.setState({ startDate: null });
  };

  const handleRemoveEndDate = () => {
    onResetPage();
    filters.setState({ endDate: null });
  };

  const handleRemoveDate = () => {
    onResetPage();
    filters.setState({ startDate: null, endDate: null });
  };

  return (
    <FiltersResult totalResults={totalResults} onReset={filters.onResetState} sx={sx}>
      <FiltersBlock label="Status:" isShow={filters.state.status !== 'all'}>
        <Chip
          {...chipProps}
          label={filters.state.status}
          onDelete={handleRemoveStatus}
          sx={{ textTransform: 'capitalize' }}
        />
      </FiltersBlock>

      <FiltersBlock label="Employee:" isShow={!!filters.state.employee}>
        <Chip {...chipProps} label={filters.state.employee} onDelete={handleRemoveEmployee} />
      </FiltersBlock>

      <FiltersBlock
        label="Date:"
        isShow={Boolean(filters.state.startDate || filters.state.endDate)}
      >
        {filters.state.startDate && filters.state.endDate ? (
          <Chip
            {...chipProps}
            label={fDateRangeShortLabel(filters.state.startDate, filters.state.endDate)}
            onDelete={handleRemoveDate}
          />
        ) : filters.state.startDate ? (
          <Chip
            {...chipProps}
            label={`From: ${fDate(filters.state.startDate)}`}
            onDelete={handleRemoveStartDate}
          />
        ) : filters.state.endDate ? (
          <Chip
            {...chipProps}
            label={`To: ${fDate(filters.state.endDate)}`}
            onDelete={handleRemoveEndDate}
          />
        ) : null}
      </FiltersBlock>

      <FiltersBlock label="Keyword:" isShow={!!filters.state.keyword}>
        <Chip {...chipProps} label={filters.state.keyword} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
}

// IP Info Card for displaying local and public IPs
function IpInfoCard({ publicIp, localIp, showBothIPs }) {
  return (
    <Card sx={{ mb: 3, p: 2 }}>
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            Public IP
          </Typography>
          <Typography variant="body2" fontWeight="bold" ml={1}>
            {publicIp || 'Detecting...'}
          </Typography>
        </Stack>
        {showBothIPs && (
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Local IP
            </Typography>
            <Typography variant="body2" fontWeight="bold" ml={1}>
              {localIp || 'Detecting...'}
            </Typography>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
