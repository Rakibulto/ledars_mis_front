'use client';

import dayjs from 'dayjs';
import { useParams } from 'next/navigation';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDate } from 'src/utils/format-time';
import { fetcher, endpoints } from 'src/utils/axios';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  useGetLeaveRequest,
  updateLeaveRequest,
  useGetApprovalByRequestId,
} from 'src/actions/leave';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import LeaveRequestPrintDialog from './leave-request-print-dialog';

// ----------------------------------------------------------------------

function SignatureCard({ fieldKey, label, signatureData, onSign, disabled, blockReason }) {
  const confirmDialog = useBoolean();
  const [loading, setLoading] = useState(false);

  const handleConfirmSign = async () => {
    setLoading(true);
    try {
      await onSign(fieldKey);
      confirmDialog.onFalse();
      toast.success(`${label} completed successfully!`);
    } catch {
      toast.error(`Failed to complete ${label}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Already signed — show the signature info
  if (signatureData) {
    return (
      <Card sx={{ p: 2, border: '1px solid', borderColor: 'success.light' }}>
        <Stack spacing={1}>
          <Typography variant="subtitle2" color="success.main">
            {label}
          </Typography>
          {signatureData.signature_image && (
            <Box
              component="img"
              src={signatureData.signature_image}
              alt={label}
              sx={{ maxWidth: 160, maxHeight: 60, objectFit: 'contain' }}
            />
          )}
          <Typography variant="caption" color="text.secondary">
            Signed by: {signatureData.name || 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Email: {signatureData.email || 'N/A'}
          </Typography>
          {signatureData.signed_at && (
            <Typography variant="caption" color="text.secondary">
              Date: {signatureData.signed_at}
            </Typography>
          )}
        </Stack>
      </Card>
    );
  }

  // Not yet signed — show the sign button
  return (
    <>
      <Card
        sx={{
          p: 2,
          border: '1px dashed',
          borderColor: disabled ? 'grey.300' : 'primary.light',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          '&:hover': disabled ? {} : { borderColor: 'primary.main', bgcolor: 'action.hover' },
        }}
        onClick={() => !disabled && confirmDialog.onTrue()}
      >
        <Stack spacing={1} alignItems="center">
          <Iconify
            icon="solar:pen-bold"
            width={32}
            sx={{ color: disabled ? 'grey.400' : 'primary.main' }}
          />
          <Typography variant="subtitle2" color={disabled ? 'text.disabled' : 'text.primary'}>
            {label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {blockReason || 'Click to sign'}
          </Typography>
        </Stack>
      </Card>

      <ConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        title={label}
        content={`Are you sure you want to sign as ${label.replace(' Sign', '')}? This action cannot be undone.`}
        action={
          <Button variant="contained" onClick={handleConfirmSign} disabled={loading}>
            {loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
            Confirm & Sign
          </Button>
        }
      />
    </>
  );
}

// ----------------------------------------------------------------------

function InfoRow({ label, value, children, sx }) {
  return (
    <Stack direction="row" spacing={2} sx={{ py: 0.75, ...sx }}>
      <Typography variant="subtitle2" sx={{ minWidth: 180, color: 'text.secondary' }}>
        {label}
      </Typography>
      {children || <Typography variant="body2">{value || '-'}</Typography>}
    </Stack>
  );
}

// ----------------------------------------------------------------------

export default function LeaveRequestDetailView() {
  const params = useParams();
  const id = params?.id;

  const { user } = useAuthContext();
  const printDialog = useBoolean();

  const { data: leaveRequest, dataLoading } = useGetLeaveRequest(id);
  const { data: approvals = [] } = useGetApprovalByRequestId(id);

  const [signing, setSigning] = useState(false);
  const [actualJoiningDate, setActualJoiningDate] = useState(null);
  const [savingDate, setSavingDate] = useState(false);

  const isJoiningExecutiveSigned = !!leaveRequest?.joining_excutive_sign;

  const handleSign = useCallback(
    async (fieldKey) => {
      setSigning(true);
      try {
        const employeeRes = await fetcher(endpoints.employee.details(user?.id));
        const employeeData = employeeRes || {};

        const payload = {
          user_id: user?.id,
          name: employeeData.employee_name || user?.name || user?.username || '',
          email: employeeData.email || user?.email || '',
          signature_image: employeeData.signature || user?.signature || '',
          signed_at: new Date().toLocaleString(),
        };

        const updateData = { [fieldKey]: payload };

        // If signing joining executive, also save the actual joining date
        if (fieldKey === 'joining_excutive_sign' && actualJoiningDate) {
          updateData.actual_joining_date = actualJoiningDate.format('YYYY-MM-DD');
        }

        await updateLeaveRequest(id, updateData);
        setSigning(false);
      } catch (err) {
        setSigning(false);
        throw err;
      }
    },
    [id, user, actualJoiningDate]
  );

  const handleSaveJoiningDate = useCallback(async () => {
    if (!actualJoiningDate) return;
    setSavingDate(true);
    try {
      await updateLeaveRequest(id, { actual_joining_date: actualJoiningDate.format('YYYY-MM-DD') });
      toast.success('Actual joining date saved!');
    } catch {
      toast.error('Failed to save joining date.');
    } finally {
      setSavingDate(false);
    }
  }, [id, actualJoiningDate]);

  const handlePrint = () => {
    printDialog.onTrue();
  };

  if (dataLoading) {
    return (
      <DashboardContent>
        <Stack alignItems="center" justifyContent="center" sx={{ py: 10 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading leave request details...
          </Typography>
        </Stack>
      </DashboardContent>
    );
  }

  if (!leaveRequest?.id) {
    return (
      <DashboardContent>
        <Stack alignItems="center" justifyContent="center" sx={{ py: 10 }}>
          <Typography variant="h6">Leave request not found</Typography>
          <Button
            variant="contained"
            component={RouterLink}
            href={paths.dashboard.leave.request}
            sx={{ mt: 2 }}
          >
            Back to Leave Requests
          </Button>
        </Stack>
      </DashboardContent>
    );
  }

  const signatureImage = leaveRequest?.signature || '';

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Leave Request Details"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Leave Requests', href: paths.dashboard.leave.request },
          { name: `Request #${leaveRequest.id}` },
        ]}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              component={RouterLink}
              href={paths.dashboard.leave.request}
              startIcon={<Iconify icon="solar:arrow-left-bold" />}
            >
              Back
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:printer-bold" />}
              onClick={handlePrint}
            >
              Print
            </Button>
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        {/* Basic Information */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Leave Request Information
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <Stack flex={1}>
              <InfoRow label="Employee Name" value={leaveRequest.employee_name} />
              <InfoRow label="Employee ID" value={leaveRequest.employee_id} />
              <InfoRow label="Department" value={leaveRequest.department_name} />
              <InfoRow label="Branch" value={leaveRequest.branch_name} />
              <InfoRow label="Leave Type" value={leaveRequest.leave_policy_name} />
            </Stack>
            <Stack flex={1}>
              <InfoRow label="Start Date" value={fDate(leaveRequest.start_date)} />
              <InfoRow label="End Date" value={fDate(leaveRequest.end_date)} />
              <InfoRow label="Requested Days" value={leaveRequest.requested_days} />
              <InfoRow
                label="Half Day"
                value={leaveRequest.is_half_day ? `Yes (${leaveRequest.half_day_period})` : 'No'}
              />
              <InfoRow label="Status">
                <Label
                  color={
                    leaveRequest.status === 'approved'
                      ? 'success'
                      : leaveRequest.status === 'pending'
                        ? 'warning'
                        : leaveRequest.status === 'rejected'
                          ? 'error'
                          : 'default'
                  }
                  sx={{ textTransform: 'capitalize' }}
                >
                  {leaveRequest.status}
                </Label>
              </InfoRow>
            </Stack>
          </Stack>

          {leaveRequest.reason && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                Reason
              </Typography>
              <Typography variant="body2">{leaveRequest.reason}</Typography>
            </Box>
          )}

          {leaveRequest.present_address && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                Contact Address
              </Typography>
              <Typography variant="body2">{leaveRequest.present_address}</Typography>
            </Box>
          )}

          {leaveRequest.approval_status_tracking?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                Approval Tracking
              </Typography>
              <Stack spacing={0.5}>
                {leaveRequest.approval_status_tracking.map((track, idx) => (
                  <Typography
                    key={idx}
                    variant="caption"
                    color={`${track.status === 'approved' ? 'success' : track.status === 'pending' ? 'warning' : 'error'}.main`}
                  >
                    {`${track.status.charAt(0).toUpperCase() + track.status.slice(1)} by L${track.level} (${track.approver_name})`}
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}
        </Card>

        {/* Applicant Signature */}
        {signatureImage && (
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Applicant Signature
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box
              component="img"
              src={signatureImage}
              alt="Applicant Signature"
              sx={{ maxWidth: 200, maxHeight: 80, objectFit: 'contain' }}
            />
            <Typography variant="body2" sx={{ mt: 1 }}>
              {leaveRequest.employee_name}
            </Typography>
          </Card>
        )}

        {/* Section 1: Application Request Signatures */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Application Request
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Required signatures for leave application approval
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Box flex={1}>
              <SignatureCard
                fieldKey="admin_check_sign"
                label="Admin Sign"
                signatureData={leaveRequest.admin_check_sign}
                onSign={handleSign}
                disabled={signing}
              />
            </Box>
            <Box flex={1}>
              <SignatureCard
                fieldKey="req_unit_head_sign"
                label="Unit Head Sign"
                signatureData={leaveRequest.req_unit_head_sign}
                onSign={handleSign}
                disabled={signing}
              />
            </Box>
            <Box flex={1}>
              <SignatureCard
                fieldKey="req_excutive_sign"
                label="Executive Sign"
                signatureData={leaveRequest.req_excutive_sign}
                onSign={handleSign}
                disabled={signing}
              />
            </Box>
          </Stack>
        </Card>

        {/* Section 2: Joining */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Joining
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Joining information and signatures
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 3 }}>
            <Box flex={1}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Actual Joining Date
              </Typography>
              <DatePicker
                value={
                  actualJoiningDate ||
                  (leaveRequest.actual_joining_date
                    ? dayjs(leaveRequest.actual_joining_date)
                    : null)
                }
                onChange={(newValue) => setActualJoiningDate(newValue)}
                disabled={isJoiningExecutiveSigned}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    placeholder: 'Select actual joining date',
                  },
                }}
              />
              {!isJoiningExecutiveSigned && actualJoiningDate && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleSaveJoiningDate}
                  disabled={savingDate}
                  sx={{ mt: 1 }}
                >
                  {savingDate ? 'Saving...' : 'Save Date'}
                </Button>
              )}
            </Box>
            <Box flex={1}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                As Per Leave Joining Date
              </Typography>
              <Typography variant="body2">
                {leaveRequest.as_per_leave_joining_date
                  ? fDate(leaveRequest.as_per_leave_joining_date)
                  : '-'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                (Auto-calculated: End date + 1 day)
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Box flex={1}>
              <SignatureCard
                fieldKey="joining_employee_sign"
                label="Employee Sign"
                signatureData={leaveRequest.joining_employee_sign}
                onSign={handleSign}
                disabled={signing}
              />
            </Box>
            <Box flex={1}>
              <SignatureCard
                fieldKey="joining_excutive_sign"
                label="Executive Sign (Joining)"
                signatureData={leaveRequest.joining_excutive_sign}
                onSign={handleSign}
                disabled={
                  signing ||
                  (!isJoiningExecutiveSigned &&
                    !actualJoiningDate &&
                    !leaveRequest.actual_joining_date)
                }
                blockReason={
                  !isJoiningExecutiveSigned &&
                  !actualJoiningDate &&
                  !leaveRequest.actual_joining_date
                    ? 'Please select an actual joining date first'
                    : undefined
                }
              />
            </Box>
          </Stack>
        </Card>
      </Stack>

      {/* Print Dialog */}
      <LeaveRequestPrintDialog
        open={printDialog.value}
        onClose={printDialog.onFalse}
        leaveRequest={leaveRequest}
        approvals={approvals}
      />
    </DashboardContent>
  );
}
