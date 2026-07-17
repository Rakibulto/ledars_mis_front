'use client';

import dayjs from 'dayjs';
import { z as zod } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, forwardRef } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Slide from '@mui/material/Slide';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import { alpha, useTheme } from '@mui/material/styles';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';

import { formatTo12Hour, formatTimestamp } from 'src/utils/format-time';

import Loading from 'src/app/dashboard/loading';
import { ADJUSTMENT_TYPES } from 'src/_mock/options';
import { useGetEmployee } from 'src/actions/employees';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  useGetAttendanceShift,
  useGetAttendanceByDate,
  createAttendanceAdjustment,
  updateAttendanceAdjustment,
  deleteAttendanceAdjustment,
  useGetAttendanceAdjustments,
} from 'src/actions/attendance';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { CustomTabs } from 'src/components/custom-tabs';
import { EmptyContent } from 'src/components/empty-content';
import { RenderContentLoading } from 'src/components/loading';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TablePaginationCustom } from 'src/components/table';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const Transition = forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

const AdjustmentSchema = zod.object({
  employee: zod.string().min(1, { message: 'Employee is required' }),
  date: zod.string().min(1, { message: 'Date is required' }),
  actual_duty_start_time: zod.string().min(1, { message: 'Duty Start Time is required' }),
  actual_arival_time: zod.string().min(1, { message: 'Actual Arrival Time is required' }),
  adjustment_type: zod.string().min(1, { message: 'Adjustment Type is required' }),
  remarks: zod.string().min(1, { message: 'Remarks are required' }),
  check_type: zod.string().min(1, { message: 'Check Type is required' }),
});

function AdjustmentApprovalsTable({
  targetEmployeeId,
  table,
  onEditAdjustment,
  onDeleteAdjustment,
  canChange,
  canDelete,
  isAdmin,
  title = 'Previous Attendance Adjustments',
  page = 1,
  pageSize = 30,
  onPageChange,
  onRowsPerPageChange,
  submitCounter,
}) {
  const { approvals, approvalsLoading, pagination, refetch } = useGetAttendanceAdjustments({
    id: targetEmployeeId,
    page,
    pageSize,
  });

  useEffect(() => {
    if (submitCounter > 0) {
      refetch();
    }
  }, [submitCounter, refetch]);

  return (
    <>
      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
        {title}
      </Typography>
      <Card>
        {approvalsLoading ? (
          <RenderContentLoading showAnalytics={false} m={0} />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  {targetEmployeeId === null && <TableCell>Employee</TableCell>}
                  <TableCell>Reason</TableCell>
                  <TableCell>Check Type</TableCell>
                  <TableCell>Actual Arrival/Leave Time</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell>Approvers</TableCell>
                  {(canChange || canDelete) && <TableCell align="center">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {(approvals || []).map((approval) => (
                  <TableRow key={approval.adjustment_request || approval.id}>
                    {targetEmployeeId === null && (
                      <TableCell>
                        <Typography variant="body2">
                          {approval.employee_name} ({approval.employee_id})
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell>
                      {
                        ADJUSTMENT_TYPES.find(
                          (type) => type.value === approval?.adjustment_request_name
                        )?.label
                      }
                    </TableCell>
                    <TableCell>
                      {approval?.check_type === 'check_in'
                        ? 'Check In'
                        : approval?.check_type === 'check_out'
                          ? 'Check Out'
                          : ''}
                    </TableCell>
                    <TableCell>
                      {approval?.actual_arrival_time
                        ? dayjs(approval?.actual_arrival_time).format('DD-MM-YYYY')
                        : ''}
                      <br />
                      {targetEmployeeId === null && approval?.actual_duty_start_time && (
                        <>Duty: {dayjs(approval.actual_duty_start_time).format('h:mm A')} | </>
                      )}
                      Actual:{' '}
                      {approval?.actual_arrival_time
                        ? dayjs(approval?.actual_arrival_time).format('h:mm A')
                        : ''}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{approval?.remarks}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={1} justifyContent="flex-start" alignItems="flex-start">
                        {approval?.approvers?.map((a, idx) => (
                          <Box key={idx}>
                            <Typography variant="body2">
                              <b>{a.approver_name}</b> -{' '}
                              <Label
                                color={
                                  a.status === 'pending'
                                    ? 'warning'
                                    : a.status === 'approved'
                                      ? 'success'
                                      : 'error'
                                }
                              >
                                {a.status}
                              </Label>
                            </Typography>
                            {a?.comments && (
                              <Typography variant="caption" color="text.secondary">
                                Comments: {a.comments || '—'} | Action Date:{' '}
                                {a.action_date
                                  ? dayjs(a.action_date).format('DD-MM-YYYY h:mm A')
                                  : '—'}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </TableCell>
                    {(canChange || canDelete) && (
                      <TableCell align="center">
                        {(() => {
                          const hasPendingApprovers = approval?.approvers?.some(
                            (a) => a.status === 'pending'
                          );
                          const showEdit = Boolean(canChange && hasPendingApprovers);
                          const showDelete = Boolean(canDelete && hasPendingApprovers);

                          return hasPendingApprovers && (showEdit || showDelete) ? (
                            <Stack direction="row" spacing={1} justifyContent="center">
                              {showEdit && (
                                <Tooltip title="Edit adjustment">
                                  <IconButton
                                    size="small"
                                    onClick={() => onEditAdjustment && onEditAdjustment(approval)}
                                  >
                                    <Iconify icon="solar:pen-bold" />
                                  </IconButton>
                                </Tooltip>
                              )}

                              {showDelete && (
                                <Tooltip title="Delete adjustment">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      onDeleteAdjustment && onDeleteAdjustment(approval)
                                    }
                                  >
                                    <Iconify icon="solar:trash-bin-trash-bold" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          ) : null;
                        })()}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {(!approvals || approvals.length === 0) && (
                  <TableRow>
                    <TableCell
                      colSpan={
                        targetEmployeeId === null
                          ? canChange || canDelete
                            ? 7
                            : 6
                          : canChange || canDelete
                            ? 6
                            : 5
                      }
                      align="center"
                    >
                      <EmptyContent title="No previous adjustments found" py={5} />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <TablePaginationCustom
              page={pagination.page - 1}
              dense={table.dense}
              count={pagination.count}
              rowsPerPage={pageSize}
              onPageChange={(e, newPage) => onPageChange(newPage + 1)}
              onChangeDense={table.onChangeDense}
              onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
            />
          </>
        )}
      </Card>
    </>
  );
}

function AdjustmentFormContent({
  employee,
  methods,
  onSubmit,
  checkType,
  errors,
  isSubmitting,
  inDialog = false,
  shiftData = {},
  shiftErrorMessage = '',
}) {
  const theme = useTheme();
  const { user } = useAuthContext();

  const formContent = (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card
        sx={{
          p: inDialog ? 2 : 4,
          boxShadow: theme.customShadows.z8,
          mb: inDialog ? 2 : 0,
        }}
      >
        {employee && (
          <Box
            sx={{
              mb: inDialog ? 2 : 4,
              p: inDialog ? 2 : 3,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.lighter, 0.08),
              border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={inDialog ? 2 : 3}
              alignItems="center"
            >
              <Avatar
                src={employee?.profile_picture}
                alt={employee?.employee_name}
                sx={{
                  width: inDialog ? 48 : 64,
                  height: inDialog ? 48 : 64,
                  bgcolor: 'primary.main',
                  border: `4px solid ${alpha(theme.palette.background.paper, 0.8)}`,
                }}
              >
                {employee?.employee_name?.charAt(0).toUpperCase()}
              </Avatar>

              <Box sx={{ flexGrow: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                  <Iconify icon="solar:user-bold" width={20} sx={{ color: 'primary.main' }} />
                  <Typography variant={inDialog ? 'subtitle1' : 'h6'}>
                    {employee?.employee_name || 'Employee'}
                  </Typography>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 3 }}>
                  {employee?.employee_id && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Iconify
                        icon="solar:user-id-bold"
                        width={16}
                        sx={{ color: 'text.secondary' }}
                      />
                      <Label variant="soft" color="info">
                        ID: {employee?.employee_id}
                      </Label>
                    </Stack>
                  )}

                  {employee?.department && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Iconify
                        icon="solar:buildings-2-bold"
                        width={16}
                        sx={{ color: 'text.secondary' }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {employee?.department?.name || 'N/A'}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Box>

              {shiftData?.check_in || shiftData?.check_out || employee?.office_time ? (
                <Stack
                  spacing={1.5}
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: 1.5,
                    bgcolor: 'background.paper',
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    display: { xs: inDialog ? 'none' : 'flex', md: 'flex' },
                  }}
                >
                  {shiftData?.check_in || shiftData?.check_out ? (
                    <>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Iconify
                          icon="mdi:clock-time-five"
                          width={18}
                          sx={{ color: 'primaryAlt.main' }}
                        />
                        <Typography variant="subtitle2">Expected shift</Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Iconify
                          icon="solar:clock-circle-bold-duotone"
                          width={18}
                          sx={{ color: 'info.main' }}
                        />
                        <Typography variant="body2">
                          Start: <b>{shiftData.check_in || '—'}</b>
                        </Typography>
                        <Iconify
                          icon="solar:clock-circle-bold-duotone"
                          width={18}
                          sx={{ color: 'warning.main' }}
                        />
                        <Typography variant="body2">
                          End: <b>{shiftData.check_out || '—'}</b>
                        </Typography>
                      </Stack>
                    </>
                  ) : (
                    <>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Iconify
                          icon="mdi:clock-time-five"
                          width={18}
                          sx={{ color: 'primaryAlt.main' }}
                        />
                        <Typography variant="subtitle2">{employee.office_time.name}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Iconify
                          icon="solar:clock-circle-bold-duotone"
                          width={18}
                          sx={{ color: 'info.main' }}
                        />
                        <Typography variant="body2">
                          Start:{' '}
                          <b>
                            {formatTo12Hour(
                              employee?.office_time?.office_start_time?.slice(0, 5) || ''
                            )}
                          </b>
                        </Typography>
                        <Iconify
                          icon="solar:clock-circle-bold-duotone"
                          width={18}
                          sx={{ color: 'warning.main' }}
                        />
                        <Typography variant="body2">
                          End: <b>{formatTo12Hour(employee?.office_time?.office_end_time)}</b>
                        </Typography>
                      </Stack>
                    </>
                  )}
                </Stack>
              ) : null}
            </Stack>

            {shiftErrorMessage && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {shiftErrorMessage}
              </Alert>
            )}
          </Box>
        )}

        <Typography variant={inDialog ? 'subtitle1' : 'h6'} sx={{ mb: inDialog ? 2 : 3 }}>
          <Iconify
            icon="mdi:form-textbox"
            width={inDialog ? 20 : 22}
            sx={{ mr: 1, verticalAlign: 'text-bottom' }}
          />
          Adjustment Details
        </Typography>

        <Box
          rowGap={inDialog ? 2 : 3}
          columnGap={inDialog ? 2 : 2}
          display="grid"
          gridTemplateColumns={{
            xs: 'repeat(1, 1fr)',
            sm: inDialog ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
            md: inDialog ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
          }}
        >
          <Field.DatePicker
            name="date"
            label="Date"
            fullWidth
            slotProps={{
              textField: {
                InputProps: {
                  startAdornment: (
                    <Iconify
                      icon="solar:calendar-bold"
                      width={18}
                      sx={{ mr: 1, color: 'text.disabled' }}
                    />
                  ),
                },
              },
            }}
            maxDate={dayjs()}
            error={!!errors.date}
            helperText={errors.date?.message}
            disabled={inDialog}
          />

          <Field.Select
            name="check_type"
            label="Check Type"
            fullWidth
            slotProps={{
              textField: {
                InputProps: {
                  startAdornment: (
                    <Iconify
                      icon="solar:login-bold"
                      width={18}
                      sx={{ mr: 1, color: 'text.disabled' }}
                    />
                  ),
                },
              },
            }}
          >
            <MenuItem value="check_in">Check In</MenuItem>
            <MenuItem value="check_out">Check Out</MenuItem>
          </Field.Select>

          <Field.TimePicker
            name="actual_duty_start_time"
            label={checkType === 'check_in' ? 'Office Start Time' : 'Office End Time'}
            fullWidth
            disabled
            slotProps={{
              textField: {
                InputProps: {
                  startAdornment: (
                    <Iconify
                      icon="solar:clock-circle-bold"
                      width={18}
                      sx={{ mr: 1, color: 'text.disabled' }}
                    />
                  ),
                },
              },
            }}
            error={!!errors.actual_duty_start_time}
            helperText={
              checkType === 'check_in' ? 'Scheduled office start time' : 'Scheduled office end time'
            }
          />

          <Field.TimePicker
            name="actual_arival_time"
            label={checkType === 'check_out' ? 'Actual Leave Time' : 'Actual Arrival Time'}
            fullWidth
            disabled={user?.role !== 'Admin'}
            slotProps={{
              textField: {
                InputProps: {
                  startAdornment: (
                    <Iconify
                      icon="solar:clock-bold"
                      width={18}
                      sx={{ mr: 1, color: 'text.disabled' }}
                    />
                  ),
                },
              },
            }}
            error={!!errors.actual_arival_time}
            helperText={
              user?.role !== 'Admin'
                ? checkType === 'check_out'
                  ? 'Actual leave time from records'
                  : 'Actual arrival time from records'
                : checkType === 'check_out'
                  ? 'Your actual leave time'
                  : errors.actual_arival_time?.message || 'Your actual arrival time'
            }
          />

          <Field.Select
            name="adjustment_type"
            label="Adjustment Type"
            fullWidth
            slotProps={{
              textField: {
                InputProps: {
                  startAdornment: (
                    <Iconify
                      icon="solar:settings-bold"
                      width={18}
                      sx={{ mr: 1, color: 'text.disabled' }}
                    />
                  ),
                },
              },
            }}
            error={!!errors.adjustment_type}
            helperText={errors.adjustment_type?.message}
          >
            {ADJUSTMENT_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Text
            name="remarks"
            label="Remarks"
            fullWidth
            multiline
            minRows={inDialog ? 2 : 3}
            sx={{ gridColumn: { xs: '1', md: inDialog ? 'span 2' : 'span 5' } }}
            InputProps={{
              startAdornment: (
                <Iconify
                  icon="solar:notebook-bold"
                  width={18}
                  sx={{ mr: 1, mt: 1, color: 'text.disabled' }}
                />
              ),
            }}
            helperText="Explain why you need this adjustment (required)"
          />
        </Box>

        {!inDialog && (
          <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={isSubmitting}
              startIcon={<Iconify icon="solar:check-circle-bold" />}
              color="primary"
              size="large"
            >
              Submit Adjustment
            </LoadingButton>
          </Stack>
        )}
      </Card>
    </Form>
  );

  return formContent;
}

function EditFormWrapper({ editingAdjustment, employee, onClose, checkType }) {
  const { employee: editingEmployee, employeeLoading: editingEmployeeLoading } = useGetEmployee(
    editingAdjustment?.user_id
  );

  const adjustmentDate = editingAdjustment
    ? editingAdjustment?.date
      ? dayjs(editingAdjustment.date).format('YYYY-MM-DD')
      : editingAdjustment?.actual_duty_start_time
        ? dayjs(editingAdjustment.actual_duty_start_time).format('YYYY-MM-DD')
        : null
    : null;

  const {
    shiftData: editShiftData,
    isError: editShiftError,
    error: editShiftErrorObj,
  } = useGetAttendanceShift(
    editingEmployee?.user?.id || editingAdjustment?.employee,
    adjustmentDate
  );

  const editShiftErrorMessage =
    editShiftErrorObj?.detail ||
    editShiftErrorObj?.message ||
    (editShiftError ? 'Failed to load shift information' : '');

  const editDefaultValues = useMemo(() => {
    if (!editingAdjustment) return {};

    return {
      employee: String(editingEmployee?.user?.id) || null,
      date: editingAdjustment?.actual_duty_start_time
        ? dayjs(editingAdjustment.actual_duty_start_time).format()
        : editingAdjustment?.date
          ? dayjs(editingAdjustment.date).format()
          : dayjs().format(),
      actual_duty_start_time: editingAdjustment?.actual_duty_start_time
        ? dayjs(editingAdjustment.actual_duty_start_time).format('HH:mm:ss')
        : '',
      actual_arival_time: editingAdjustment?.actual_arival_time
        ? dayjs(editingAdjustment.actual_arival_time).format('HH:mm:ss')
        : editingAdjustment?.actual_arrival_time
          ? dayjs(editingAdjustment.actual_arrival_time).format('HH:mm:ss')
          : '',
      actual_arrival_time: editingAdjustment?.actual_arival_time
        ? dayjs(editingAdjustment.actual_arival_time).format('HH:mm:ss')
        : editingAdjustment?.actual_arrival_time
          ? dayjs(editingAdjustment.actual_arrival_time).format('HH:mm:ss')
          : '',
      adjustment_type:
        editingAdjustment?.adjustment_type || editingAdjustment?.adjustment_request_name || '',
      remarks: editingAdjustment?.remarks || '',
      check_type: editingAdjustment?.check_type || 'check_in',
    };
  }, [editingAdjustment, editingEmployee?.user?.id]);

  const methods = useForm({
    mode: 'onBlur',
    resolver: zodResolver(AdjustmentSchema),
    defaultValues: editDefaultValues,
  });

  const {
    handleSubmit,
    getValues,
    formState: { isSubmitting, errors },
  } = methods;

  const submitEdit = async () => {
    try {
      const values = getValues();
      const id = editingAdjustment.adjustment_request || editingAdjustment.id;
      const dateStr = dayjs(values.date).format('YYYY-MM-DD');
      const dutyStart = dayjs(`${dateStr}T${values.actual_duty_start_time}`);
      const arrival = dayjs(`${dateStr}T${values.actual_arival_time}`);
      const payload = {
        ...values,
        date: dateStr,
        actual_duty_start_time: dutyStart.isValid() ? dutyStart.toISOString() : '',
        actual_arival_time: arrival.isValid() ? arrival.toISOString() : '',
      };

      await updateAttendanceAdjustment(id, payload);
      toast.success('Adjustment updated');
      if (onClose) onClose();
    } catch (err) {
      toast.error('Failed to update adjustment');
    }
  };

  if (editingEmployeeLoading) return <Loading />;

  return (
    <>
      <DialogContent>
        <AdjustmentFormContent
          employee={editingEmployee}
          methods={methods}
          onSubmit={handleSubmit(submitEdit)}
          checkType={checkType}
          errors={errors}
          isSubmitting={isSubmitting}
          inDialog
          shiftData={editShiftData}
          shiftErrorMessage={editShiftErrorMessage}
        />
      </DialogContent>

      <DialogActions>
        <Button
          variant="outlined"
          onClick={() => {
            if (onClose) onClose();
          }}
        >
          Cancel
        </Button>

        <LoadingButton
          type="button"
          variant="contained"
          color="primary"
          loading={isSubmitting}
          startIcon={<Iconify icon="mdi:send" />}
          onClick={handleSubmit(submitEdit)}
        >
          Update Adjustment
        </LoadingButton>
      </DialogActions>
    </>
  );
}

export function AdjustmentForm({
  open,
  onClose,
  userId,
  selectedDate,
  inDialog = false,
  attendanceData = null,
  checkOut = null,
  employee,
}) {
  const table = useTable();
  const tableAll = useTable();
  const tableOwn = useTable();
  const theme = useTheme();
  const { user } = useAuthContext();
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [editingAdjustment, setEditingAdjustment] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [adjustmentToDelete, setAdjustmentToDelete] = useState(null);
  const [tabValue, setTabValue] = useState(1);
  const [submitCounter, setSubmitCounter] = useState(0);

  // Pagination states
  const [pageAll, setPageAll] = useState(1);
  const [pageSizeAll, setPageSizeAll] = useState(30);
  const [pageOwn, setPageOwn] = useState(1);
  const [pageSizeOwn, setPageSizeOwn] = useState(30);

  const targetEmployeeId = userId || user?.id;

  const { employee: fetchedEmployee, employeeLoading } = useGetEmployee(
    employee ? null : targetEmployeeId
  );

  const employeeData = employee || fetchedEmployee;

  const [currentDate, setCurrentDate] = useState(() => {
    if (selectedDate) {
      // Handle DD-MM-YYYY format
      if (typeof selectedDate === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(selectedDate)) {
        return dayjs(selectedDate, 'DD-MM-YYYY').toDate();
      }
      return dayjs(selectedDate).isValid() ? dayjs(selectedDate).toDate() : new Date();
    }
    return new Date();
  });

  const {
    attendanceData: fetchedAttendanceData,
    isLoading: attendanceLoading,
    refetch,
  } = useGetAttendanceByDate(targetEmployeeId, currentDate);

  const {
    shiftData,
    isLoading: shiftLoading,
    isError: shiftError,
    error: shiftErrorObj,
    refetch: refetchShift,
  } = useGetAttendanceShift(targetEmployeeId, currentDate);

  const shiftErrorMessage =
    shiftErrorObj?.detail ||
    shiftErrorObj?.message ||
    (shiftError ? 'Failed to load shift information' : '');

  const defaultValues = useMemo(() => {
    // If editing an existing adjustment, use its data
    if (editingAdjustment) {
      return {
        employee: targetEmployeeId || editingAdjustment?.employee || null,
        date: editingAdjustment?.date ? dayjs(editingAdjustment.date).format() : dayjs().format(),
        actual_duty_start_time: editingAdjustment?.actual_duty_start_time
          ? dayjs(editingAdjustment.actual_duty_start_time).format('HH:mm:ss')
          : '',
        actual_arival_time: editingAdjustment?.actual_arival_time
          ? dayjs(editingAdjustment.actual_arival_time).format('HH:mm:ss')
          : editingAdjustment.actual_arrival_time
            ? dayjs(editingAdjustment.actual_arrival_time).format('HH:mm:ss')
            : '',
        adjustment_type:
          editingAdjustment?.adjustment_type || editingAdjustment?.adjustment_request_name || '',
        remarks: editingAdjustment?.remarks || '',
        check_type: editingAdjustment?.check_type || 'check_in',
      };
    }

    const officeStart = shiftData?.check_in
      ? dayjs(shiftData.check_in, 'hh:mm a').format('HH:mm:ss')
      : employeeData?.office_time?.office_start_time || '';
    const officeEnd = shiftData?.check_out
      ? dayjs(shiftData.check_out, 'hh:mm a').format('HH:mm:ss')
      : employeeData?.office_time?.office_end_time || '';

    let defaultRemarks = '';
    let defaultCheckType = 'check_in';
    let defaultAdjustmentType = '';
    let defaultActualDutyStartTime = '';
    let defaultActualArrivalTime = '';

    if (attendanceData) {
      // If user is present, shift ended, and forgot to sign out
      if (
        attendanceData.status === 'Present' &&
        officeEnd &&
        !checkOut &&
        dayjs().isAfter(dayjs(`${selectedDate} ${officeEnd}`))
      ) {
        defaultCheckType = 'check_out';
        defaultAdjustmentType = 'forgot_sign_out';
        defaultRemarks = 'Forgot to sign out. Office is closed.';
        defaultActualDutyStartTime = officeEnd;
        defaultActualArrivalTime = officeEnd;
      } else if (attendanceData.late_by) {
        defaultCheckType = 'check_in';
        defaultRemarks = `Requesting adjustment for late arrival (${attendanceData.late_by}).`;
      } else if (attendanceData.early_out_by) {
        defaultCheckType = 'check_out';
        defaultRemarks = `Requesting adjustment for early departure (${attendanceData.early_out_by}).`;
      } else if (attendanceData.status === 'Absent') {
        defaultCheckType = 'check_in';
        defaultActualArrivalTime = officeStart;
        defaultAdjustmentType = 'forgot_sign_in';
        defaultRemarks = 'Requesting adjustment for absent status.';
      } else if (attendanceData.status === 'Weekend') {
        defaultCheckType = 'check_in';
        defaultActualArrivalTime = officeStart;
        defaultAdjustmentType = 'forgot_sign_in';
        defaultRemarks = 'Requesting adjustment for weekend status.';
      } else if (attendanceData.status === 'Holiday') {
        defaultCheckType = 'check_in';
        defaultActualArrivalTime = officeStart;
        defaultAdjustmentType = 'forgot_sign_in';
        defaultRemarks = 'Requesting adjustment for holiday status.';
      }
      if (attendanceData.status && !defaultRemarks.includes(attendanceData.status)) {
        defaultRemarks += ` Current status: ${attendanceData.status !== 'Early Leave' ? attendanceData.status : 'Early Out'}.`;
      }
    }

    return {
      employee: targetEmployeeId ? String(targetEmployeeId) : '',
      date: selectedDate ? dayjs(selectedDate).format() : dayjs().format(),
      actual_duty_start_time: defaultActualDutyStartTime,
      actual_arival_time: defaultActualArrivalTime,
      adjustment_type: defaultAdjustmentType,
      remarks: defaultRemarks,
      check_type: defaultCheckType,
    };
  }, [
    targetEmployeeId,
    selectedDate,
    attendanceData,
    employeeData,
    checkOut,
    editingAdjustment,
    shiftData,
  ]);

  const handleEditAdjustment = (approval) => {
    const adj = {
      ...approval,
    };
    setEditingAdjustment(adj);
    setEditDialogOpen(true);
  };

  const handleDeleteAdjustment = (approval) => {
    setAdjustmentToDelete(approval);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!adjustmentToDelete) return;
    const id = adjustmentToDelete.adjustment_request || adjustmentToDelete.id;
    const empId = adjustmentToDelete.employee || targetEmployeeId;
    try {
      await deleteAttendanceAdjustment(id, empId);
      toast.success('Adjustment deleted');
    } catch (err) {
      toast.error('Failed to delete adjustment');
    } finally {
      setDeleteConfirmOpen(false);
      setAdjustmentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setAdjustmentToDelete(null);
  };

  const cancelEdit = () => {
    setEditingAdjustment(null);
    setEditDialogOpen(false);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const methods = useForm({
    mode: 'onBlur',
    resolver: zodResolver(AdjustmentSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    reset,
    setValue,
    control,
    watch,
    formState: { isSubmitting, errors },
  } = methods;

  const formDate = watch('date');
  const prevFormDateRef = useRef(formDate);

  useEffect(() => {
    if (
      formDate &&
      dayjs(formDate).isValid() &&
      formDate !== dayjs(currentDate).format('YYYY-MM-DD') &&
      formDate !== prevFormDateRef.current
    ) {
      prevFormDateRef.current = formDate;
      setCurrentDate(dayjs(formDate).toDate());
      refetch();
      if (refetchShift) refetchShift();
    }
  }, [formDate, currentDate, refetch, refetchShift]);

  const checkType = useWatch({ control, name: 'check_type' });

  // Set duty start/end time based on checkType
  useMemo(() => {
    function extractTime(timestamp) {
      if (!timestamp) return '';
      const parts = timestamp.split(' ');
      return parts.length === 2 ? parts[1] : parts[0];
    }

    const attendanceRecord = fetchedAttendanceData?.attendance;

    const officeStart = shiftData?.check_in
      ? dayjs(shiftData.check_in, 'hh:mm a').format('HH:mm:ss')
      : employeeData?.office_time?.office_start_time || '';
    const officeEnd = shiftData?.check_out
      ? dayjs(shiftData.check_out, 'hh:mm a').format('HH:mm:ss')
      : employeeData?.office_time?.office_end_time || '';

    if (officeStart || officeEnd) {
      if (checkType === 'check_in') {
        setValue('actual_duty_start_time', officeStart);

        if (attendanceRecord && attendanceRecord.check_in) {
          setValue('actual_arival_time', extractTime(attendanceRecord.check_in));
        } else if (attendanceData?.timestamps && attendanceData.timestamps.length > 0) {
          const ts = attendanceData.timestamps[0].timestamp || attendanceData.timestamps[0];
          setValue('actual_arival_time', extractTime(ts));
        } else if (
          attendanceData?.status === 'Absent' ||
          attendanceData?.status === 'Weekend' ||
          attendanceData?.status === 'Holiday'
        ) {
          setValue('actual_arival_time', officeStart);
        } else {
          setValue('actual_arival_time', '');
        }
      } else if (checkType === 'check_out') {
        setValue('actual_duty_start_time', officeEnd);

        if (checkOut) {
          setValue('actual_arival_time', extractTime(checkOut));
        } else if (attendanceRecord && attendanceRecord.check_out) {
          setValue('actual_arival_time', extractTime(attendanceRecord.check_out));
        } else if (
          attendanceRecord &&
          attendanceRecord.check_in &&
          !dayjs().isAfter(dayjs(`${selectedDate} ${officeEnd}`))
        ) {
          setValue('actual_arival_time', extractTime(attendanceRecord.check_in));
        } else if (
          attendanceData?.status === 'Absent' ||
          attendanceData?.status === 'Weekend' ||
          attendanceData?.status === 'Holiday'
        ) {
          setValue('actual_arival_time', officeEnd);
        } else {
          setValue('actual_arival_time', officeEnd);
        }
      }
    }
  }, [
    checkType,
    employeeData?.office_time,
    setValue,
    attendanceData,
    checkOut,
    fetchedAttendanceData,
    selectedDate,
    shiftData,
  ]);

  const onSubmit = async (data) => {
    try {
      const dateStr = dayjs(data.date).format('YYYY-MM-DD');
      const dutyStart = dayjs(`${dateStr}T${data.actual_duty_start_time}`);
      const arrival = dayjs(`${dateStr}T${data.actual_arival_time}`);

      const payload = {
        ...data,
        date: dateStr,
        actual_duty_start_time: dutyStart.isValid() ? dutyStart.toISOString() : '',
        actual_arival_time: arrival.isValid() ? arrival.toISOString() : '',
      };

      await createAttendanceAdjustment(payload);

      toast.success('Attendance adjustment submitted successfully!');
      setSubmitSuccess(true);
      setSubmitCounter((prev) => prev + 1);

      if (inDialog) {
        reset(defaultValues);
      } else {
        reset();
        if (onClose) {
          onClose();
        }
      }
    } catch (error) {
      toast.error(error?.[0] || error || 'Failed to submit adjustment');
    }
  };

  // Check if user has specific permission
  const hasPermission = (codename) => {
    // Check specific permissions
    if (!user?.user_permissions_list) return false;
    return user.user_permissions_list.some((permission) => permission.codename === codename);
  };

  const canView = hasPermission('view_attendanceadjustmentrequest');
  const canChange = hasPermission('change_attendanceadjustmentrequest');
  const canDelete = hasPermission('delete_attendanceadjustmentrequest');
  const isAdmin = user?.role === 'Admin';

  // Dialog view
  if (inDialog) {
    return (
      <Dialog
        fullWidth
        maxWidth="md"
        open={!!open}
        onClose={(e, reason) => {
          // Prevent closing on backdrop click or escape key
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          if (onClose) onClose();
        }}
        TransitionComponent={Transition}
        disableEscapeKeyDown
        keepMounted
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.customShadows.z24,
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          },
        }}
      >
        <DialogTitle>
          <Typography variant="h5">Attendance Adjustment Request</Typography>
          {employeeData && (
            <Typography variant="subtitle1" color="text.secondary" mt={0.5}>
              {employeeData.employee_name} ({employeeData.employee_id})
            </Typography>
          )}
        </DialogTitle>

        <DialogContent>
          {submitSuccess && (
            <Alert
              severity="success"
              sx={{ mb: 2 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                >
                  Close
                </Button>
              }
            >
              Attendance adjustment has been submitted successfully! Your request is now pending
              approval.
            </Alert>
          )}

          {attendanceLoading ? (
            <Box sx={{ width: 1, mb: 2 }}>
              <LinearProgress color="blue" sx={{ height: 6, borderRadius: 3 }} />
            </Box>
          ) : (
            attendanceData && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" color="text.primary">
                      Current Attendance Status:{' '}
                      <Label
                        color={
                          attendanceData.status === 'Late'
                            ? 'warning'
                            : attendanceData.status === 'Early Leave' ||
                                attendanceData.status === 'Absent'
                              ? 'error'
                              : attendanceData.status === 'Present'
                                ? 'success'
                                : attendanceData.status === 'Half Day' ||
                                    attendanceData.status === 'Half Day Leave'
                                  ? 'tertiary'
                                  : 'info'
                        }
                      >
                        {attendanceData.status}
                      </Label>
                    </Typography>
                    <Typography variant="caption" ml={2}>
                      Date: <strong>{dayjs(selectedDate).format('DD MMM YYYY')}</strong> (
                      {attendanceData.dayOfWeek})
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    {attendanceData.late_by !== null && attendanceData.late_by !== 0.0 && (
                      <Typography
                        variant="body2"
                        color="warning.dark"
                        sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
                      >
                        <Iconify icon="mdi:clock-alert-outline" width={16} sx={{ mr: 0.5 }} />
                        Late by: {attendanceData.late_by}
                      </Typography>
                    )}
                    {attendanceData.early_out_by !== null &&
                      attendanceData.early_out_by !== 0.0 && (
                        <Typography
                          variant="body2"
                          color="error.main"
                          sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
                        >
                          <Iconify icon="mdi:clock-remove-outline" width={16} sx={{ mr: 0.5 }} />
                          Early out by: {attendanceData.early_out_by}
                        </Typography>
                      )}
                  </Stack>

                  {attendanceData.totalWorkedHours !== undefined && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      <Iconify icon="mdi:clock-time-five-outline" width={16} sx={{ mr: 0.5 }} />
                      Total worked hours:{' '}
                      {typeof attendanceData.totalWorkedHours === 'number'
                        ? `${attendanceData.totalWorkedHours.toFixed(2)} hrs`
                        : attendanceData.totalWorkedHours}
                    </Typography>
                  )}

                  {attendanceData.remarks && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      <Iconify icon="mdi:note-text-outline" width={16} sx={{ mr: 0.5 }} />
                      Remarks: {attendanceData.remarks}
                    </Typography>
                  )}

                  {attendanceData.timestamps && attendanceData.timestamps.length > 0 && (
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}
                      >
                        <Iconify icon="mdi:fingerprint" width={14} sx={{ mr: 0.5 }} />
                        Timestamps:
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {attendanceData.timestamps.map((timestamp, index) => {
                          const time =
                            typeof timestamp === 'object' ? timestamp.timestamp : timestamp;
                          return (
                            <Label
                              key={index}
                              variant="soft"
                              color={
                                index === 0
                                  ? 'primary'
                                  : index === attendanceData.timestamps.length - 1
                                    ? 'success'
                                    : 'info'
                              }
                            >
                              {formatTimestamp(time)}
                            </Label>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Box>
            )
          )}
          {!submitSuccess && (
            <AdjustmentFormContent
              employee={employeeData}
              methods={methods}
              onSubmit={handleSubmit(onSubmit)}
              checkType={checkType}
              errors={errors}
              isSubmitting={isSubmitting}
              inDialog
              targetEmployeeId={targetEmployeeId}
              shiftData={shiftData}
              shiftErrorMessage={shiftErrorMessage}
            />
          )}
        </DialogContent>

        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => {
              // Reset success state when closing
              if (submitSuccess) {
                setSubmitSuccess(false);
              }
              if (onClose) onClose();
            }}
            startIcon={<Iconify icon="mdi:close" />}
          >
            {submitSuccess ? 'Close' : 'Cancel'}
          </Button>

          {!submitSuccess && (
            <LoadingButton
              type="submit"
              variant="contained"
              color="primary"
              loading={isSubmitting}
              startIcon={<Iconify icon="mdi:send" />}
              onClick={handleSubmit(onSubmit)}
            >
              Submit Adjustment
            </LoadingButton>
          )}
        </DialogActions>
      </Dialog>
    );
  }

  // Normal view
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Attendance Adjustment Form"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Attendance Adjustment' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Employee Info Section */}
      {employeeLoading && (
        <RenderContentLoading showPagination={false} showFilters={false} tableRowCount={0} />
      )}
      {!employeeLoading && (
        <>
          <AdjustmentFormContent
            employee={employeeData}
            methods={methods}
            onSubmit={handleSubmit(onSubmit)}
            checkType={checkType}
            errors={errors}
            isSubmitting={isSubmitting}
            inDialog={false}
            shiftData={shiftData}
            shiftErrorMessage={shiftErrorMessage}
          />

          {canView &&
            (isAdmin ? (
              <>
                <CustomTabs value={tabValue} onChange={handleTabChange} sx={{ mt: 5 }}>
                  <Tab label="All Adjustments" />
                  <Tab label="My Adjustments" />
                </CustomTabs>
                {tabValue === 0 && (
                  <AdjustmentApprovalsTable
                    targetEmployeeId={null}
                    table={tableAll}
                    onEditAdjustment={handleEditAdjustment}
                    onDeleteAdjustment={handleDeleteAdjustment}
                    canChange={canChange}
                    canDelete={canDelete}
                    isAdmin={isAdmin}
                    title="All Attendance Adjustments"
                    page={pageAll}
                    pageSize={pageSizeAll}
                    onPageChange={setPageAll}
                    onRowsPerPageChange={setPageSizeAll}
                    submitCounter={submitCounter}
                  />
                )}
                {tabValue === 1 && (
                  <AdjustmentApprovalsTable
                    targetEmployeeId={targetEmployeeId}
                    table={tableOwn}
                    onEditAdjustment={handleEditAdjustment}
                    onDeleteAdjustment={handleDeleteAdjustment}
                    canChange={canChange}
                    canDelete={canDelete}
                    isAdmin={isAdmin}
                    title="My Attendance Adjustments"
                    page={pageOwn}
                    pageSize={pageSizeOwn}
                    onPageChange={setPageOwn}
                    onRowsPerPageChange={setPageSizeOwn}
                    submitCounter={submitCounter}
                  />
                )}
              </>
            ) : (
              <AdjustmentApprovalsTable
                targetEmployeeId={targetEmployeeId}
                table={table}
                onEditAdjustment={handleEditAdjustment}
                onDeleteAdjustment={handleDeleteAdjustment}
                canChange={canChange}
                canDelete={canDelete}
                isAdmin={isAdmin}
                page={pageOwn}
                pageSize={pageSizeOwn}
                onPageChange={setPageOwn}
                onRowsPerPageChange={setPageSizeOwn}
                submitCounter={submitCounter}
              />
            ))}
        </>
      )}

      <Dialog fullWidth maxWidth="md" open={!!editDialogOpen} onClose={cancelEdit}>
        <DialogTitle>Edit Attendance Adjustment</DialogTitle>
        {editingAdjustment && (
          <EditFormWrapper
            editingAdjustment={editingAdjustment}
            employee={employeeData}
            onClose={cancelEdit}
            checkType={checkType}
            canChange={canChange}
            canDelete={canDelete}
            isAdmin={isAdmin}
            targetEmployeeId={targetEmployeeId}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={!!deleteConfirmOpen}
        onClose={cancelDelete}
        title="Delete"
        content="Are you sure you want to delete this adjustment?"
        action={
          <Button variant="contained" color="error" onClick={confirmDelete}>
            Delete
          </Button>
        }
      />
    </DashboardContent>
  );
}
