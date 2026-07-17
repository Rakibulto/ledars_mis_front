'use client';

import dayjs from 'dayjs';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useEffect, forwardRef } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Slide from '@mui/material/Slide';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { APPROVAL_STATUS_OPTIONS } from 'src/_mock/options';
import { useGetSimpleEmployees } from 'src/actions/employees';
import {
  createLeaveRequest,
  updateLeaveRequest,
  useGetLeaveBalanceByYear,
  useGetLeavePoliciesByEmployee,
} from 'src/actions/leave';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { LeaveRequestSchema } from './leave-schema';

// ----------------------------------------------------------------------

const Transition = forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

// ----------------------------------------------------------------------

export function LeaveRequestQuickEditForm({
  currentRequest,
  open,
  onClose,
  addEntry,
  isEmployee,
  user,
  employee,
  flag = false,
}) {
  const { employees = [], employeesLoading } = useGetSimpleEmployees(open);

  // Default values
  const defaultValues = useMemo(
    () => ({
      employee:
        typeof currentRequest?.employee === 'number'
          ? currentRequest.employee
          : typeof employee?.user?.id === 'number'
            ? employee.user.id
            : typeof user?.id === 'number'
              ? user.id
              : undefined,
      leave_policy:
        typeof currentRequest?.leave_policy === 'number' ? currentRequest.leave_policy : undefined,
      start_date: currentRequest?.start_date || '',
      end_date: currentRequest?.end_date || '',
      is_half_day: currentRequest?.is_half_day || false,
      reason: currentRequest?.reason || '',
      status: currentRequest?.status || 'pending',
      half_day_period: currentRequest?.half_day_period || '',
    }),
    [currentRequest, user?.id, employee?.user?.id]
  );

  const methods = useForm({
    resolver: zodResolver(LeaveRequestSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    setValue,
  } = methods;

  const prevOpenRef = useRef(false);

  // Watch selected employee and leave_policy
  const selectedEmployeeId = useWatch({ control, name: 'employee' });
  const selectedPolicyId = useWatch({ control, name: 'leave_policy' });

  // Watch start_date and end_date
  const startDate = useWatch({ control, name: 'start_date' });
  const endDate = useWatch({ control, name: 'end_date' });

  // watch half day toggle as well
  const isHalfDaySelected = useWatch({ control, name: 'is_half_day' });

  // Compute if is_half_day should be disabled
  const isHalfDayDisabled = useMemo(() => {
    if (!startDate || !endDate) return false;
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    return end.diff(start, 'day') > 0;
  }, [startDate, endDate]);

  // Get leave policies for selected employee
  const selectedEmployee = employees.find((emp) => emp?.user?.id === selectedEmployeeId);
  const selectedEmployeeEmpId = selectedEmployee?.employee_id;

  const { data: employeePolicies = [], dataLoading: employeePoliciesLoading } =
    useGetLeavePoliciesByEmployee(open && selectedEmployeeEmpId);

  const { data: leaveBalances = [] } = useGetLeaveBalanceByYear(open && selectedEmployeeEmpId);

  // Reset leave_policy if employee changes and current policy is not in the list
  useMemo(() => {
    if (
      selectedEmployeeId &&
      selectedPolicyId &&
      !employeePolicies.some((p) => p?.id === selectedPolicyId)
    ) {
      setValue('leave_policy', undefined);
    }
  }, [selectedEmployeeId, selectedPolicyId, employeePolicies, setValue]);

  useEffect(() => {
    if (
      open &&
      typeof currentRequest?.leave_policy === 'number' &&
      employeePolicies.some((p) => p?.id === currentRequest.leave_policy)
    ) {
      setValue('leave_policy', currentRequest.leave_policy);
    }
  }, [open, currentRequest?.leave_policy, employeePolicies, setValue]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      reset(defaultValues);
    }
    prevOpenRef.current = open;
  }, [open, reset, defaultValues]);

  const noPolicyAvailable = selectedEmployeeId && employeePolicies.length === 0;

  // clear half_day_period when half day is not active or disabled
  useEffect(() => {
    if (!isHalfDaySelected || isHalfDayDisabled) {
      setValue('half_day_period', '');
    }
  }, [isHalfDaySelected, isHalfDayDisabled, setValue]);

  const leaveBalance = Array.isArray(leaveBalances)
    ? leaveBalances.find((b) => b.leave_policy_id === selectedPolicyId)
    : undefined;

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (formData) => {
    const data = {
      ...formData,
      start_date: formData.start_date ? dayjs(formData.start_date).format('YYYY-MM-DD') : '',
      end_date: formData.end_date ? dayjs(formData.end_date).format('YYYY-MM-DD') : '',
    };

    try {
      if (addEntry) {
        await createLeaveRequest(data, employee?.employee_id || user?.employee_id || user?.id);
        toast.success('Leave request added!');
      } else {
        await updateLeaveRequest(currentRequest.id, data);
        toast.success('Leave request updated!');
      }
      reset();
      onClose();
    } catch (error) {
      if (error) {
        Object.entries(error).forEach(([field, messages]) => {
          const msg = Array.isArray(messages) ? messages.join(', ') : String(messages);
          toast.error(msg);
        });
      } else {
        toast.error(error.detail || 'Failed to save leave request. Please try again.');
      }
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
    >
      <Form methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{addEntry ? 'New Leave Request' : 'Edit Leave Request'}</DialogTitle>

        <DialogContent sx={{ pb: 0 }}>
          {/* Main Form Fields */}
          <Box
            sx={{
              display: 'grid',
              rowGap: 3,
              columnGap: 2,
              pt: 1,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              mb: 2,
              alignItems: 'center',
            }}
          >
            {/* Employee Selection (Admin only) */}
            {!isEmployee && !flag && (
              <Field.Autocomplete
                name="employee"
                label="Employee"
                placeholder="Search employee"
                fullWidth
                loading={employeesLoading}
                error={!!errors.employee}
                helperText={errors.employee?.message}
                options={employees || []}
                getOptionLabel={(option) => {
                  let emp = option;
                  if (typeof option === 'number') {
                    emp = employees?.find((e) => e?.user?.id === option);
                  }
                  if (!emp) return '';
                  const name = emp.employee_name || emp.user?.username || '';
                  const id = emp.employee_id ? ` (${emp.employee_id})` : '';
                  return `${name}${id}`;
                }}
                isOptionEqualToValue={(option, value) =>
                  option?.user?.id === value || option?.user?.id === Number(value)
                }
                renderOption={(props, option) => (
                  <li {...props} key={option?.user?.id}>
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
                        {option.employee_id && (
                          <Typography variant="caption" color="text.secondary">
                            {option.employee_id}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </li>
                )}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option?.user?.id}
                      label={option?.employee_name || option?.user?.username || option?.employee_id}
                      variant="soft"
                      color="primary"
                      size="small"
                    />
                  ))
                }
                onChange={(_, value) => setValue('employee', value ? value.user.id : undefined)}
                value={employees?.find((emp) => emp?.user?.id === selectedEmployeeId) || null}
              />
            )}

            {/* Leave Policy */}
            <Field.Select
              name="leave_policy"
              label="Leave Policy"
              fullWidth
              loading={employeePoliciesLoading}
              error={!!errors.leave_policy}
              helperText={
                errors.leave_policy?.message ||
                (noPolicyAvailable && 'No leave policy available for this employee')
              }
              disabled={noPolicyAvailable || !selectedEmployeeId}
              SelectProps={{
                startAdornment: (
                  <Iconify
                    icon="solar:file-text-bold"
                    width={18}
                    sx={{ ml: -0.5, mr: 1, color: 'text.disabled' }}
                  />
                ),
              }}
            >
              {employeePolicies?.map((policy) => (
                <MenuItem key={policy?.id} value={policy?.id}>
                  {policy?.leave_type_name}
                </MenuItem>
              ))}
            </Field.Select>

            {/* Date Range */}
            <Field.DatePicker
              name="start_date"
              label="Start Date"
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.start_date,
                  helperText: errors.start_date?.message,
                  InputProps: {
                    startAdornment: (
                      <Iconify
                        icon="solar:calendar-mark-bold"
                        width={18}
                        sx={{ ml: -0.5, mr: 1, color: 'text.disabled' }}
                      />
                    ),
                  },
                },
              }}
            />
            <Field.DatePicker
              name="end_date"
              label="End Date"
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.end_date,
                  helperText: errors.end_date?.message,
                  InputProps: {
                    startAdornment: (
                      <Iconify
                        icon="solar:calendar-mark-bold-duotone"
                        width={18}
                        sx={{ ml: -0.5, mr: 1, color: 'text.disabled' }}
                      />
                    ),
                  },
                },
              }}
            />

            {/* Half-day Toggle */}
            <Field.Switch
              name="is_half_day"
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Iconify icon="solar:clock-circle-bold" width={18} />
                  <Typography variant="body2">Half Day Leave</Typography>
                </Stack>
              }
              labelPlacement="start"
              sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
              disabled={isHalfDayDisabled}
            />

            {isHalfDayDisabled && (
              <Typography variant="caption" color="text.secondary">
                Half day option can only be selected for single-day leave requests
              </Typography>
            )}

            {/* Half-day period selection (only when half day is selected) */}
            {isHalfDaySelected && !isHalfDayDisabled && (
              <Field.Select
                name="half_day_period"
                label="Half Day Period"
                fullWidth
                error={!!errors.half_day_period}
                helperText={errors.half_day_period?.message}
                SelectProps={{
                  startAdornment: (
                    <Iconify
                      icon="solar:calendar-half-alt-bold"
                      width={18}
                      sx={{ ml: -0.5, mr: 1, color: 'text.disabled' }}
                    />
                  ),
                }}
              >
                <MenuItem value="first half">First Half</MenuItem>
                <MenuItem value="second half">Second Half</MenuItem>
              </Field.Select>
            )}

            {/* Reason */}
            <Field.Text
              name="reason"
              label="Reason"
              fullWidth
              multiline
              rows={3}
              error={!!errors.reason}
              helperText={errors.reason?.message}
              sx={{ gridColumn: { xs: '1', sm: 'span 2' } }}
              InputProps={{
                startAdornment: (
                  <Iconify
                    icon="solar:notebook-bold"
                    width={18}
                    sx={{ ml: -0.5, mr: 1, mt: 1, color: 'text.disabled' }}
                  />
                ),
              }}
            />

            {/* Status (Admin only) */}
            {user?.role === 'Admin' && (
              <Field.Select
                name="status"
                label="Status"
                fullWidth
                disabled={addEntry}
                error={!!errors.status}
                helperText={errors.status?.message}
                SelectProps={{
                  startAdornment: (
                    <Iconify
                      icon="solar:check-circle-bold"
                      width={18}
                      sx={{ ml: -0.5, mr: 1, color: 'text.disabled' }}
                    />
                  ),
                }}
              >
                {APPROVAL_STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Field.Select>
            )}
          </Box>
          {leaveBalance && (
            <Box sx={{ mb: 3, mt: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                <Iconify
                  icon="solar:wallet-money-bold"
                  sx={{ mr: 1, verticalAlign: 'text-bottom' }}
                />
                Leave Balance
              </Typography>

              <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                <Box
                  sx={{
                    p: 1.5,
                    flex: 1,
                    borderRadius: 1,
                    bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
                    border: (theme) => `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify icon="solar:calendar-mark-bold" width={20} color="success.main" />
                    <Typography variant="subtitle2" color="success.darker">
                      Remaining: {leaveBalance.remaining} days
                    </Typography>
                  </Stack>
                </Box>

                <Box
                  sx={{
                    p: 1.5,
                    flex: 1,
                    borderRadius: 1,
                    bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08),
                    border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify icon="solar:hourglass-bold" width={20} color="warning.main" />
                    <Typography variant="subtitle2" color="warning.darker">
                      Pending: {leaveBalance.pending} days
                    </Typography>
                  </Stack>
                </Box>

                <Box
                  sx={{
                    p: 1.5,
                    flex: 1,
                    borderRadius: 1,
                    bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
                    border: (theme) => `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify icon="solar:chart-bold" width={20} color="error.main" />
                    <Typography variant="subtitle2" color="error.darker">
                      Used: {leaveBalance.used} days
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Policy Details */}
          {selectedPolicyId && employeePolicies.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                <Iconify
                  icon="solar:info-circle-bold"
                  sx={{ mr: 1, verticalAlign: 'text-bottom' }}
                />
                Policy Details
              </Typography>

              {employeePolicies
                .filter((policy) => policy.id === selectedPolicyId)
                .map((policy) => (
                  <Box
                    key={policy.id}
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: 'background.neutral',
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              Type:{' '}
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {policy.leave_type_name}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              Total Days:{' '}
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {policy.total_leave_days}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              Min/Max Days:{' '}
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {policy.min_days_per_request} - {policy.max_days_per_request}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              Gender:{' '}
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {policy.gender}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              Apply Before:{' '}
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {policy.apply_before_days} days
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              Half-Day Allowed:{' '}
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {policy.allow_half_day ? 'Yes' : 'No'}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              Count Holidays:{' '}
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {policy.count_holidays ? 'Yes' : 'No'}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              Count Weekends:{' '}
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {policy.count_weekends ? 'Yes' : 'No'}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
            </Box>
          )}
        </DialogContent>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleClose}
            startIcon={<Iconify icon="eva:close-outline" />}
          >
            Cancel
          </Button>

          <LoadingButton
            type="submit"
            variant="contained"
            color="primary"
            loading={isSubmitting}
            disabled={noPolicyAvailable}
            startIcon={<Iconify icon={addEntry ? 'eva:plus-outline' : 'eva:save-outline'} />}
          >
            {addEntry ? 'Submit Request' : 'Update Request'}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
