'use client';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, forwardRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Slide from '@mui/material/Slide';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';

import { fDateTime } from 'src/utils/format-time';

import { APPROVAL_STATUS_OPTIONS } from 'src/_mock/options';
import { useGetAttendanceApproval, updateAttendanceApproval } from 'src/actions/attendance';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';

const Transition = forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

const ApprovalSchema = zod.object({
  status: zod.string().min(1, { message: 'Status is required' }),
  comments: zod.string().nullable().optional(),
});

export function AdjustmentApprovalView({ id, open, onClose }) {
  const { user } = useAuthContext();
  const canUpdateApproval = user?.user_permissions_list?.some(
    (permission) => permission.codename === 'change_attendanceadjustmentapproval'
  );
  const { approval, approvalLoading } = useGetAttendanceApproval({ id: open ? id : null });

  const defaultValues = useMemo(
    () => ({
      status: approval?.status || 'pending',
      comments: approval?.comments || '',
    }),
    [approval]
  );

  const methods = useForm({
    resolver: zodResolver(ApprovalSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = methods;

  useMemo(() => {
    if (open) reset(defaultValues);
  }, [open, defaultValues, reset]);

  const onSubmit = async (formData) => {
    try {
      await updateAttendanceApproval(id, { ...formData, userId: user?.id });
      toast.success('Attendance adjustment reviewed!');
      reset();
      onClose();
    } catch (error) {
      toast.error(
        error?.[0] || error?.status || error?.detail || 'Failed to update. Please try again.'
      );
    }
  };

  if (approvalLoading) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        TransitionComponent={Transition}
      >
        <DialogTitle>Attendance Adjustment Review</DialogTitle>
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

  if (!approval) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" TransitionComponent={Transition}>
      <DialogTitle>Attendance Adjustment Review</DialogTitle>
      {approvalLoading && <LinearProgress sx={{ width: '100%' }} color="blue" />}
      <Form methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Adjustment Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Employee ID:</strong>
                </Typography>
                <Typography variant="body1">{approval.employee_id}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Request Type:</strong>
                </Typography>
                <Typography variant="body1">
                  {approval.adjustment_request_name
                    ? approval.adjustment_request_name
                        .split('_')
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ')
                    : ''}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Remarks:</strong>
                </Typography>
                <Typography variant="body1">{approval.remarks || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Duty Start/End Time:</strong>
                </Typography>
                <Typography variant="body1">
                  {fDateTime(approval.actual_duty_start_time) || '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Actual Arrival/Departure Time:</strong>
                </Typography>
                <Typography variant="body1">
                  {fDateTime(approval.actual_arrival_time) || '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Requested Arrival:</strong>
                </Typography>
                <Typography variant="body1">
                  {fDateTime(approval.requested_arrival_time) || '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Current Status:</strong>
                </Typography>
                {approval?.status && (
                  <Typography
                    variant="body1"
                    sx={{
                      color:
                        approval.status === 'approved'
                          ? 'success.main'
                          : approval.status === 'rejected'
                            ? 'error.main'
                            : 'warning.main',
                    }}
                  >
                    {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                  </Typography>
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Action Date:</strong>
                </Typography>
                <Typography variant="body1">
                  {approval.action_date ? fDateTime(approval.action_date) : '-'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Update Status
          </Typography>
          <Box display="grid" rowGap={3} columnGap={2} pt={1} gridTemplateColumns="1fr">
            <Field.Select
              name="status"
              label="Status"
              fullWidth
              error={!!errors.status}
              helperText={errors.status?.message}
            >
              {APPROVAL_STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Field.Select>
            <Field.Text
              name="comments"
              label="Comments"
              fullWidth
              multiline
              minRows={2}
              error={!!errors.comments}
              helperText={errors.comments?.message}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            color="primary"
            disabled={!canUpdateApproval}
          >
            Save
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
