'use client';

import { Stack, Tooltip, Typography } from '@mui/material';

export default function GinApprovalInfo({ wfInfo }) {
  if (
    !wfInfo?.matchedLevel ||
    wfInfo.currentStatus?.toLowerCase() === 'issued' ||
    wfInfo.currentStatus?.toLowerCase() === 'approved' ||
    wfInfo.fullyApproved
  ) {
    return null;
  }

  return (
    <Stack spacing={0.25} sx={{ maxWidth: 180 }}>
      {wfInfo.nextApprover ? (
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
