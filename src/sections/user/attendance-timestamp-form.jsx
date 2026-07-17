'use client';

import dayjs from 'dayjs';
import { mutate } from 'swr';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, forwardRef } from 'react';

import Box from '@mui/material/Box';
import Slide from '@mui/material/Slide';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import axios, { endpoints } from 'src/utils/axios';
import { getLocalIP } from 'src/utils/get-local-ip';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export const ScheduleQuickEditSchema = zod.object({
  timestamp: zod.string().min(1, { message: 'Date-Time is required!' }),
  time: zod.string().min(1, { message: 'Time is required!' }),
  device_serial_number: zod.string().min(1, { message: 'Device Serial Number is required!' }),
  employee: zod
    .union([zod.string(), zod.number()])
    .refine((val) => val !== '' && val !== null && val !== undefined, {
      message: 'User ID is required!',
    }),
  login_type: zod.string().min(1, { message: 'Login type is required' }),
});

const Transition = forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

// ----------------------------------------------------------------------

export function AttendanceTimestampForm({ currentEntry, open, onClose }) {
  const { user } = useAuthContext();
  const [localIp, setLocalIp] = useState('');
  const [publicIp, setPublicIp] = useState('');
  const [localIpLoading, setLocalIpLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLocalIpLoading(true);
    getLocalIP()
      .then((ipInfo) => {
        if (mounted) {
          setLocalIp(ipInfo.localIP);
          setPublicIp(ipInfo.publicIP);
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

  // Determine if both IPs should be shown and posted
  const showBothIPs = localIp && publicIp && localIp !== publicIp;

  const defaultValues = useMemo(
    () => ({
      employee: currentEntry?.user_info?.id || user?.id || '',
      timestamp: currentEntry?.timestamp || dayjs().toISOString(),
      time: currentEntry?.timestamp
        ? dayjs(currentEntry.timestamp).format('HH:mm:ss')
        : dayjs().format('HH:mm:ss'),
      device_serial_number: publicIp || currentEntry?.device_serial_number || 'Manual',
      local_ip_address: showBothIPs ? localIp || currentEntry?.local_ip_address || '' : '',
      login_type: currentEntry?.login_type || 'Manual Entry',
    }),
    [currentEntry, user, localIp, publicIp, showBothIPs]
  );

  const methods = useForm({
    mode: 'onBlur',
    resolver: zodResolver(ScheduleQuickEditSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useMemo(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, defaultValues, reset]);

  // Helper function to mutate attendance report URLs
  const mutateAttendanceReports = async () => {
    const today = dayjs().format('YYYY-MM-DD');

    // Build query params for today's data
    const queryParams = new URLSearchParams();
    queryParams.append('start_date', today);
    queryParams.append('end_date', today);

    const queryString = queryParams.toString();

    // Mutate the attendance report URLs that the daily view uses
    const reportUrls = [
      // Main attendance report endpoint
      `${endpoints.attendance.report}?${queryString}`,
      // Supervisor-specific endpoint if user is supervisor
      ...(user?.role === 'Supervisor'
        ? [`${endpoints.attendance.reportBySupervisor(user?.id)}&${queryString}`]
        : []),
      // Employee-specific endpoint if user has employee_id
      ...(user?.employee_id ? [endpoints.attendance.reportByEmployeeId(user.employee_id)] : []),
      // General attendance list
      endpoints.attendance.list,
    ];

    // Mutate all relevant URLs
    await Promise.all(reportUrls.map((url) => mutate(url)));
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = { ...data };

      if (user?.role === 'Admin') {
        const dateStr = data.timestamp;
        const timeStr = data.time;
        const combined = dayjs(`${dayjs(dateStr).format('YYYY-MM-DD')}T${timeStr}`);
        payload.timestamp = combined.isValid() ? combined.toISOString() : dayjs().toISOString();
      } else {
        payload.timestamp = currentEntry?.timestamp || dayjs().toISOString();
      }

      delete payload.time;

      // Ensure local_ip_address is set if showBothIPs is true
      if (showBothIPs) {
        payload.local_ip_address = localIp;
      } else {
        delete payload.local_ip_address;
      }

      if (currentEntry || user) {
        await axios.post(endpoints.attendance.create, payload);
        toast.success('Attendance recorded successfully!');
        reset();
        if (onClose) onClose();
        await mutateAttendanceReports();
      } else {
        toast.warning('User not found');
      }
    } catch (error) {
      console.error('Error submitting attendance:', error);
      toast.error(error?.detail || 'Something went wrong!');
    }
  });

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={!!open}
      onClose={onClose}
      TransitionComponent={Transition}
    >
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>
          {currentEntry ? 'Edit Attendance' : 'Add Attendance'}: {user?.username} -{' '}
          {user?.employee_id}
        </DialogTitle>
        <DialogContent>
          {user?.role !== 'Admin' && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Iconify icon="mdi:lock" color="warning.main" />
                <Typography variant="body2" color="text.secondary">
                  You don&apos;t have permission to modify the date or time of attendance records.
                </Typography>
              </Stack>
            </Box>
          )}

          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            gridTemplateColumns={{
              xs: '1fr',
              sm: '1fr 1fr',
            }}
            pt={1}
          >
            <Field.DatePicker
              name="timestamp"
              label="Date"
              disabled={isSubmitting || localIpLoading || user?.role !== 'Admin'}
              helperText="Date cannot be changed"
              maxDate={dayjs()}
              slotProps={{
                textField: {
                  InputProps: {
                    startAdornment: user?.role !== 'Admin' && (
                      <Iconify
                        icon={user?.role === 'Admin' ? 'solar:clock-circle-bold' : 'mdi:lock'}
                        width={18}
                        sx={{
                          mr: 1,
                          color: user?.role === 'Admin' ? 'primary.main' : 'warning.main',
                        }}
                      />
                    ),
                  },
                },
              }}
            />

            <Field.TimePicker
              name="time"
              label="Time"
              disabled={isSubmitting || localIpLoading}
              slotProps={{
                textField: {
                  InputProps: {
                    startAdornment: (
                      <Iconify
                        icon="solar:clock-circle-bold"
                        width={18}
                        sx={{
                          mr: 1,
                          color: 'primary.main',
                        }}
                      />
                    ),
                  },
                },
              }}
            />

            <input type="hidden" name="employee" value={defaultValues.employee} />
            <Field.Text
              name="device_serial_number"
              label="Device Serial Number"
              defaultValue={defaultValues.device_serial_number}
              disabled
            />
            <input type="hidden" name="login_type" value={defaultValues.login_type} />
            {showBothIPs && (
              <input type="hidden" name="local_ip_address" value={defaultValues.local_ip_address} />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting || localIpLoading}
            color="primary"
          >
            Add
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
