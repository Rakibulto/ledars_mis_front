'use client';

import { useForm } from 'react-hook-form';
import { useMemo, forwardRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
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

import { formatTimestamp } from 'src/utils/format-time';

import { APPROVAL_STATUS_OPTIONS } from 'src/_mock/options';
import {
  useGetLeaveApproval,
  updateLeaveApproval,
  useGetLeaveBalanceByYear,
} from 'src/actions/leave';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';

import { LeaveApprovalSchema } from './leave-schema';

// ----------------------------------------------------------------------

const Transition = forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

// ----------------------------------------------------------------------

export function LeaveApprovalQuickEditForm({
  currentApproval,
  open,
  onClose,
  addEntry,
  id,
  currentUserId,
}) {
  const { user } = useAuthContext();
  const canChangeLeaveApproval = user?.user_permissions_list?.some(
    (permission) => permission.codename === 'change_leaveapproval'
  );

  // If id is provided, fetch approval data
  const { data: approvalData, dataLoading } = useGetLeaveApproval(open ? id : null);

  // Use fetched data if id is present, otherwise fallback to currentApproval prop
  const approval = id ? approvalData : currentApproval;

  // Fetch leave balances for the employee (only if approval is available and has employee_id)
  const { data: leaveBalances = [], dataLoading: balanceLoading } = useGetLeaveBalanceByYear(
    open ? approval?.employee_id : null
  );

  // Ensure leaveBalances is always an array
  const leaveBalancesArray = Array.isArray(leaveBalances) ? leaveBalances : [];

  // Find the balance for the applied leave type
  const appliedBalance = leaveBalancesArray.find(
    (b) => b?.leave_type_name === approval?.leave_request_name
  );

  const defaultValues = useMemo(
    () => ({
      status: approval?.status || 'pending',
      comments: approval?.comments || '',
    }),
    [approval]
  );

  const methods = useForm({
    resolver: zodResolver(LeaveApprovalSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = methods;

  useMemo(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  // Dynamic multi-level approval restriction
  const myLevel = approval?.level;
  const approvalStatusTracking = approval?.approval_status_tracking || [];

  let disableFields = false;
  if (myLevel > 1 && approvalStatusTracking.length > 0) {
    for (let lvl = 1; lvl < myLevel; lvl += 1) {
      const prev = approvalStatusTracking.find((a) => a.level === lvl);
      if (!prev || prev.status !== 'approved') {
        disableFields = true;
        break;
      }
    }
  }

  const onSubmit = async (formData) => {
    if (!canChangeLeaveApproval) {
      toast.error('You do not have permission to update this leave approval.');
      return;
    }

    try {
      await updateLeaveApproval(approval.id, formData, currentUserId, approval.leave_request);
      toast.success('Leave approval updated!');
      reset();
      onClose();
    } catch (error) {
      toast.error(error?.detail || error[0] || 'Failed to save leave approval. Please try again.');
    }
  };

  // Display loading state while fetching data
  if (id && (dataLoading || balanceLoading)) {
    return (
      <Dialog
        fullWidth
        maxWidth="md"
        open={open}
        onClose={onClose}
        TransitionComponent={Transition}
      >
        <DialogTitle>Leave Approval Details</DialogTitle>
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
      fullWidth
      maxWidth="md"
      open={open}
      onClose={(e, reason) => {
        if (reason === 'backdropClick') e.stopPropagation();
        onClose();
      }}
      TransitionComponent={Transition}
    >
      <Form methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{addEntry ? 'Add Leave Approval' : 'Leave Approval Details'}</DialogTitle>
        {(dataLoading || balanceLoading) && <LinearProgress sx={{ width: '100%' }} color="blue" />}
        <DialogContent>
          {/* Display leave details when id is present */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Leave Request Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Employee:
                </Typography>
                <Typography variant="body1">{approval.employee_name}</Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Employee ID:
                </Typography>
                <Typography variant="body1">{approval.employee_id}</Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Branch Name
                </Typography>
                <Typography variant="body1">{approval.branch_name}</Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Department Name
                </Typography>
                <Typography variant="body1">{approval.department_name}</Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Leave Type:
                </Typography>
                <Typography variant="body1">{approval.leave_request_name}</Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Requested Days:
                </Typography>
                <Typography variant="body1">{approval.requested_days}</Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  From:
                </Typography>
                <Typography variant="body1">{approval.leave_from}</Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  To:
                </Typography>
                <Typography variant="body1">{approval.leave_to}</Typography>
              </Grid>
              {approval?.reason && (
                <Grid size={12}>
                  <Typography variant="body2" color="text.secondary">
                    Reason:
                  </Typography>
                  <Typography variant="caption">{approval.reason}</Typography>
                </Grid>
              )}
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Current Status:
                </Typography>
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
                  {approval?.status
                    ? approval.status.charAt(0).toUpperCase() + approval.status.slice(1)
                    : 'Pending'}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Created At:
                </Typography>
                <Typography variant="body1">
                  {approval.created_at ? formatTimestamp(approval.created_at) : '-'}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Updated At:
                </Typography>
                <Typography variant="body1">
                  {approval.updated_at ? formatTimestamp(approval.updated_at) : '-'}
                </Typography>
              </Grid>
              {/* Show Leave Balance for this policy */}
              {appliedBalance && (
                <Grid size={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Leave Balance ({appliedBalance.leave_type_name})
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Used: <b>{appliedBalance.used}</b>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending: <b>{appliedBalance.pending}</b>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Remaining: <b>{appliedBalance.remaining}</b>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Allowed: <b>{appliedBalance.total_allowed}</b>
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Update Approval Status
            </Typography>
          </Box>

          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            pt={1}
            gridTemplateColumns={{ xs: 'repeat(1, 1fr)' }}
          >
            <Field.Select
              name="status"
              label="Status"
              fullWidth
              error={!!errors.status}
              helperText={
                errors.status?.message ||
                (disableFields
                  ? 'You cannot update until all previous levels are approved.'
                  : undefined)
              }
              disabled={disableFields || dataLoading}
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
              rows={3}
              error={!!errors.comments}
              helperText={errors.comments?.message}
              disabled={disableFields || dataLoading}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            color="primary"
            loading={isSubmitting}
            disabled={disableFields || dataLoading || !canChangeLeaveApproval}
          >
            {addEntry ? 'Add' : 'Update'}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
