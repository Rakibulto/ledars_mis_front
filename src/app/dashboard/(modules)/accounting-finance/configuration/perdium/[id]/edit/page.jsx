'use client';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { Iconify } from 'src/components/iconify';

import StatusActionMenu from '../../../../_components/shared/status-action-menu';
import PerdiumClaimForm from '../../../../_components/configuration/perdium-claim-form';

const STATUS_LABEL = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
};

const STATUS_COLOR = {
  draft: 'default',
  submitted: 'info',
  approved: 'success',
  rejected: 'error',
};

const STATUS_TRANSITIONS = {
  draft: [
    { status: 'submitted', label: 'Submit for Review' },
    { status: 'approved', label: 'Approve' },
    { status: 'rejected', label: 'Reject', destructive: true },
  ],
  submitted: [
    { status: 'approved', label: 'Approve' },
    { status: 'rejected', label: 'Reject', destructive: true },
  ],
  approved: [{ status: 'rejected', label: 'Reject', destructive: true }],
  rejected: [{ status: 'submitted', label: 'Resubmit' }],
};

export default function EditPerdiumPage() {
  const params = useParams();
  const id = params?.id;
  const [claimStatus, setClaimStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    axiosInstance
      .get(endpoints.accounting.perdium_claim_by_id(id))
      .then((res) => setClaimStatus(res.data?.status))
      .catch(() => {});
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true);
    try {
      await axiosInstance.post(`${endpoints.accounting.perdium_claim_by_id(id)}change_status/`, {
        status: newStatus,
      });
      setClaimStatus(newStatus);
      toast.success(`Status changed to ${STATUS_LABEL[newStatus] || newStatus}`);
    } catch {
      toast.error('Failed to change status');
    } finally {
      setStatusLoading(false);
    }
  };

  if (!id) return null;

  return (
    <>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ px: 3, pt: 3 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="h4" fontWeight="bold">
            Edit Perdium Claim
          </Typography>
          {claimStatus && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Chip
                label={STATUS_LABEL[claimStatus] || claimStatus}
                color={STATUS_COLOR[claimStatus] || 'default'}
                size="small"
              />
              <StatusActionMenu
                currentStatus={claimStatus}
                transitions={STATUS_TRANSITIONS[claimStatus] || []}
                onTransition={handleStatusChange}
                loading={statusLoading}
              />
            </Stack>
          )}
        </Stack>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => window.close()}
          startIcon={<Iconify icon="solar:close-circle-bold" />}
        >
          Cancel
        </Button>
      </Stack>
      <PerdiumClaimForm claimId={id} hideHeader />
    </>
  );
}
