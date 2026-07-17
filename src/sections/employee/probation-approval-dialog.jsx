'use client';

import { z } from 'zod';
import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useEffect, forwardRef } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Slide from '@mui/material/Slide';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';

import { fDate, fToNow } from 'src/utils/format-time';

import { useGetLeaveGroups } from 'src/actions/settings';
import { updateEmployee, useGetEmployee } from 'src/actions/employees';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';

// Update schema
const ProbationApprovalSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  employment_type: z.number().optional(),
  confirmation_date: schemaHelper
    .date({ message: { required_error: 'Confirmation date is required!' } })
    .nullable(),
  probation_period_time: z.union([z.string(), z.number()]).optional(),
  resign_terminated_date: schemaHelper.date().nullable(),
  resign_terminated_reason: z.string().optional(),
  probation_period: z.boolean().optional(),
});

const Transition = forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

// ----------------------------------------------------------------------

export function ProbationApprovalDialog({ open, onClose, notification, loading = false }) {
  const submittingRef = useRef(false);

  const { employee, employeeLoading } = useGetEmployee(notification?.employee?.id);
  const { leaveGroups } = useGetLeaveGroups(open);

  const employeeInfo = !employeeLoading && employee;

  const defaultValues = useMemo(() => {
    let status = '';
    if (employeeInfo?.confirmation_date) status = 'confirmed';
    else if (employeeInfo?.resign_terminated_date) status = 'terminated';

    return {
      status,
      employment_type: employeeInfo?.employment_type?.id || '',
      confirmation_date: employeeInfo?.confirmation_date
        ? dayjs(employeeInfo.confirmation_date)
        : dayjs(),
      probation_period_time: employeeInfo?.probation_period_time || '',
      resign_terminated_date: employeeInfo?.resign_terminated_date
        ? dayjs(employeeInfo.resign_terminated_date)
        : null,
      resign_terminated_reason: '',
      probation_period: employeeInfo?.probation_period ?? true,
    };
  }, [employeeInfo]);

  const methods = useForm({
    resolver: zodResolver(ProbationApprovalSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { isSubmitting },
  } = methods;

  const status = watch('status');

  // Set confirmation_date to today
  useMemo(() => {
    if (status === 'confirmed') {
      setValue('confirmation_date', dayjs());
    }

    if (status === 'terminated') {
      setValue('resign_terminated_date', dayjs());
    }
  }, [setValue, status]);

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, defaultValues, reset]);

  const { user } = useAuthContext();
  const canChangeEmployee = user?.user_permissions_list?.some(
    (permission) => permission.codename === 'change_employee'
  );

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data) => {
    if (!canChangeEmployee) {
      toast.error('You do not have permission to update employee probation status.');
      return;
    }

    try {
      submittingRef.current = true;
      let payload = {};

      if (status === 'confirmed') {
        payload = {
          confirmation_date: data.confirmation_date
            ? dayjs(data.confirmation_date).format('YYYY-MM-DD')
            : dayjs().format('YYYY-MM-DD'),
          employment_type: data.employment_type,
          probation_period: false,
        };
      } else if (status === 'terminated') {
        payload = {
          resign_terminated_date: data.resign_terminated_date
            ? dayjs(data.resign_terminated_date).format('YYYY-MM-DD')
            : null,
          resign_terminated_reason: data.resign_terminated_reason,
          status: 'terminated',
        };
      } else if (status === 'extended') {
        payload = {
          probation_period_time: Number(data.probation_period_time),
        };
      }

      await updateEmployee(notification?.employee?.id, payload);
      toast.success('Employee updated successfully!');
      handleClose();
    } catch (error) {
      console.error('Error updating probation status:', error);
      toast.error('Failed to update probation status. Please try again.');
    } finally {
      submittingRef.current = false;
    }
  };

  if (loading) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        TransitionComponent={Transition}
      >
        <DialogTitle>Probation Period Review</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}
        >
          <LinearProgress sx={{ width: 240 }} color="blue" />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={(e, reason) => {
        if (reason === 'backdropClick') e.stopPropagation();
        onClose();
      }}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box>
          Probation Period Review
          <Typography variant="body1" color="text.secondary">
            {notification?.title}
          </Typography>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Employee Information Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3, height: 'fit-content' }}>
              <Typography variant="h6" gutterBottom>
                Employee Information
              </Typography>

              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Employee Info
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {employeeInfo?.employee_name || employeeInfo?.user?.employee_name || 'Unknown'}
                  </Typography>
                  <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
                    {employeeInfo?.user?.id && (
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
                        ID: {employeeInfo?.user?.id}
                      </Label>
                    )}

                    {(employeeInfo?.department ||
                      employeeInfo?.designation ||
                      employeeInfo?.branch) && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          mt: 0.5,
                          display: 'block',
                        }}
                      >
                        {[
                          employeeInfo?.department?.name,
                          employeeInfo?.designation?.name,
                          employeeInfo?.branch?.name,
                        ]
                          .filter(Boolean)
                          .join(' • ')}
                      </Typography>
                    )}
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">
                    {employee?.user?.email || employee?.personal_email_id || 'N/A'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Joining Date
                  </Typography>
                  <Typography variant="body1">
                    {employeeInfo?.joining_date ? fDate(employeeInfo.joining_date) : 'N/A'}
                  </Typography>
                </Box>

                {employeeInfo?.employment_type && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Employment Type
                    </Typography>
                    <Label variant="soft" color="info">
                      {employeeInfo.employment_type?.name}
                    </Label>
                  </Box>
                )}
              </Stack>
            </Card>
          </Grid>

          {/* Probation Details & Actions */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Probation Details
              </Typography>

              <Stack spacing={2} sx={{ mb: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Notification
                  </Typography>
                  <Typography variant="body1">
                    {notification?.remarks || 'Probation period review required'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Created Date
                  </Typography>
                  <Typography variant="body1">
                    {notification?.createdAt ? `${fToNow(notification.createdAt)} ago` : 'N/A'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Label
                    variant="soft"
                    color={notification?.status === 'Unread' ? 'warning' : 'default'}
                  >
                    {notification?.status || 'Pending'}
                  </Label>
                </Box>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Form methods={methods} onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={3} mb={2}>
                  <Field.Select
                    name="status"
                    label="Probation Decision"
                    required
                    helperText="Select the probation period outcome"
                    disabled={
                      employeeInfo?.confirmation_date || employeeInfo?.resign_terminated_date
                    }
                  >
                    <MenuItem value="confirmed">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Iconify icon="mdi:check-circle" color="success.main" />
                        <Typography>Confirm Employment</Typography>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="extended">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Iconify icon="mdi:clock-outline" color="warning.main" />
                        <Typography>Extend Probation</Typography>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="terminated">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Iconify icon="mdi:close-circle" color="error.main" />
                        <Typography>Terminate Employment</Typography>
                      </Stack>
                    </MenuItem>
                  </Field.Select>

                  {status === 'confirmed' && (
                    <>
                      <Field.DatePicker
                        name="confirmation_date"
                        label="Confirmation Date"
                        disabled
                        value={dayjs()}
                        helperText="Confirmation date is set to today"
                      />
                      <Field.Select
                        name="employment_type"
                        label="Employment Type"
                        required
                        helperText="Select employment type"
                      >
                        {leaveGroups?.map((group) => (
                          <MenuItem key={group?.id} value={group?.id}>
                            {group?.name}
                          </MenuItem>
                        ))}
                      </Field.Select>
                    </>
                  )}

                  {status === 'extended' && (
                    <Field.Text
                      name="probation_period_time"
                      label="Probation Period (months)"
                      type="number"
                      required
                      helperText="Enter new probation period in months"
                    />
                  )}

                  {status === 'terminated' && (
                    <>
                      <Field.DatePicker
                        name="resign_terminated_date"
                        label="Termination/Resignation Date"
                        required
                        helperText="Select termination date"
                      />
                      <Field.Text
                        name="resign_terminated_reason"
                        label="Reason"
                        multiline
                        rows={3}
                        required
                        helperText="Enter reason for termination"
                      />
                    </>
                  )}
                </Stack>
                <DialogActions sx={{ p: 0, m: 0 }}>
                  <Button
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    disabled={isSubmitting || submittingRef.current}
                  >
                    Cancel
                  </Button>
                  <LoadingButton
                    variant="contained"
                    type="submit"
                    color="primary"
                    loading={isSubmitting || submittingRef.current}
                    disabled={!canChangeEmployee}
                    startIcon={<Iconify icon="mdi:check" />}
                  >
                    Submit Decision
                  </LoadingButton>
                </DialogActions>
              </Form>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
}
