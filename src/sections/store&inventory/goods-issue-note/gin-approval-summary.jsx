'use client';

import { Box, Chip, Grid, Stack, Divider, Typography } from '@mui/material';

function SummaryField({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} color="#0f172a">
        {value ?? 'N/A'}
      </Typography>
    </Box>
  );
}

function HistoryList({ title, items, emptyLabel }) {
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        {title}
      </Typography>
      {items?.length ? (
        <Stack spacing={1}>
          {items.map((entry, index) => (
            <Box
              key={`${entry.label}-${index}`}
              sx={{
                px: 1.5,
                py: 1,
                borderRadius: 1.5,
                bgcolor: '#ffffff',
                border: '1px solid #e2e8f0',
              }}
            >
              <Typography variant="body2" fontWeight={600} color="#0f172a">
                {entry.label}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {entry.actor}
              </Typography>
            </Box>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {emptyLabel}
        </Typography>
      )}
    </Box>
  );
}

export default function GinApprovalSummary({ wfInfo }) {
  if (!wfInfo?.matchedLevel) {
    return null;
  }

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: '#f8fafc',
        border: '1px solid #e2e8f0',
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
        Workflow Summary
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryField label="Current Status" value={wfInfo.currentStatus} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryField label="Current Level" value={wfInfo.currentLevelLabel} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryField label="Minimum Approval Required" value={String(wfInfo.minRequired)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryField label="Approved Count" value={String(wfInfo.approvedCount)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryField
            label="Remaining Approval Count"
            value={String(wfInfo.remainingApprovalCount)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryField label="Approval Progress" value={wfInfo.approvalProgress || '0 / 0'} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SummaryField
            label="Approved Users"
            value={wfInfo.approvedNames?.length ? wfInfo.approvedNames.join(', ') : 'None'}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SummaryField
            label="Pending Users"
            value={wfInfo.pendingNames?.length ? wfInfo.pendingNames.join(', ') : 'None'}
          />
        </Grid>
        {wfInfo.orderedApproval ? (
          <Grid size={{ xs: 12 }}>
            <SummaryField label="Next Approver" value={wfInfo.nextApprover || 'None'} />
          </Grid>
        ) : null}
        <Grid size={{ xs: 12 }}>
          <SummaryField label="Issued By" value={wfInfo.issuedBy || 'Not issued yet'} />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1} sx={{ mt: 1.5, mb: 2 }}>
        <Chip
          size="small"
          color={wfInfo.fullyApproved ? 'success' : 'warning'}
          label={`Progress ${wfInfo.approvalProgress}`}
          variant="soft"
        />
        <Chip
          size="small"
          color={wfInfo.orderedApproval ? 'info' : 'default'}
          label={wfInfo.orderedApproval ? 'Ordered approval' : 'Any-order approval'}
          variant="outlined"
        />
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Stack spacing={2}>
        <HistoryList
          title="Approval History"
          items={wfInfo.approvalHistory}
          emptyLabel="No approvals recorded yet."
        />
        <HistoryList
          title="Status Change History"
          items={wfInfo.statusChangeHistory}
          emptyLabel="No status changes recorded yet."
        />
      </Stack>
    </Box>
  );
}
