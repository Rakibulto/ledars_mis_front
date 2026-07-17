'use client';

import { Stack, Tooltip, Typography } from '@mui/material';

export default function AdjustmentApprovalInfo({ wfInfo, showEligibleWhenCannotApprove = false }) {
  if (
    !wfInfo?.matchedLevel ||
    wfInfo.currentStatus?.toLowerCase() === 'approved' ||
    wfInfo.fullyApproved
  ) {
    return null;
  }

  const showEligible =
    showEligibleWhenCannotApprove &&
    !wfInfo.canApprove &&
    !wfInfo.alreadyApproved &&
    wfInfo.eligibleApproverNames?.length;

  return (
    <Stack spacing={0.25} sx={{ maxWidth: 200 }}>
      {showEligible ? (
        <Tooltip title={`Eligible approvers: ${wfInfo.eligibleApproverNames.join(', ')}`}>
          <Typography variant="caption" color="text.secondary" noWrap>
            Approvers: {wfInfo.eligibleApproverNames.join(', ')}
          </Typography>
        </Tooltip>
      ) : null}
      {wfInfo.nextApprover && wfInfo.orderedApproval ? (
        <Tooltip title={`Next approver: ${wfInfo.nextApprover}`}>
          <Typography variant="caption" color="text.secondary" noWrap>
            Next: {wfInfo.nextApprover}
          </Typography>
        </Tooltip>
      ) : null}
      {wfInfo.approvedNames?.length ? (
        <Tooltip title={`Approved: ${wfInfo.approvedNames.join(', ')}`}>
          <Typography variant="caption" color="success.main" noWrap>
            Approved: {wfInfo.approvedNames.join(', ')}
          </Typography>
        </Tooltip>
      ) : null}
      {wfInfo.pendingNames?.length ? (
        <Tooltip title={`Pending: ${wfInfo.pendingNames.join(', ')}`}>
          <Typography variant="caption" color="warning.main" noWrap>
            Pending: {wfInfo.pendingNames.join(', ')}
          </Typography>
        </Tooltip>
      ) : null}
    </Stack>
  );
}
