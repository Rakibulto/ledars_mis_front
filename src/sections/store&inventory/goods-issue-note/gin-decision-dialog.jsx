'use client';

import dayjs from 'dayjs';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Box, Grid, Stack, Button, Divider, TextField, Typography } from '@mui/material';

import { ConfirmDialog } from 'src/components/custom-dialog';

import GinApprovalSummary from './gin-approval-summary';
import { formatDate, formatCurrency } from './gin-decision-utils';

function ApprovalDetailField({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} color="#0f172a">
        {value || 'N/A'}
      </Typography>
    </Box>
  );
}

export default function GinDecisionDialog({
  open,
  onClose,
  decisionDialog,
  decisionSubmitting,
  moduleConfig,
  workflowEnabled,
  decisionWorkflowInfo,
  showsIssueToField,
  usesOfficeParties,
  onDecision,
  onLineItemChange,
  onTransportChange,
}) {
  const decisionTarget = decisionDialog?.target || null;
  const decisionLineItems = decisionDialog?.lineItems || [];
  const isIssueDialog = decisionDialog?.mode === 'issue';
  const decisionMetrics = {
    items: decisionLineItems.length,
    totalValue: decisionLineItems.reduce(
      (total, line) => total + Number(line.issued_qty || 0) * Number(line.unit_price || 0),
      0
    ),
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title={
        isIssueDialog
          ? moduleConfig.issueDialogTitle || `Issue ${moduleConfig.singularTitle}`
          : moduleConfig.approveDialogTitle
      }
      maxWidth="md"
      cancelLabel="Back"
      content={
        decisionTarget ? (
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {isIssueDialog
                ? moduleConfig.issueDialogDescription ||
                  `Review the ${moduleConfig.recordSingular} below, then confirm whether it should be marked as issued.`
                : moduleConfig.approveDialogDescription}
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ApprovalDetailField label="Issue Number" value={decisionTarget.gin_number} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ApprovalDetailField label="Status" value={decisionTarget.status} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ApprovalDetailField
                  label={moduleConfig.issueFromLabel}
                  value={decisionTarget.issue_from || moduleConfig.issueFromFallback}
                />
              </Grid>
              {showsIssueToField ? (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ApprovalDetailField
                    label={moduleConfig.issueToLabel}
                    value={decisionTarget.issued_to || moduleConfig.issueToFallback}
                  />
                </Grid>
              ) : (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ApprovalDetailField
                    label="Department / Project"
                    value={
                      [decisionTarget.department, decisionTarget.project]
                        .filter(Boolean)
                        .join(' | ') || moduleConfig.issueContextFallback
                    }
                  />
                </Grid>
              )}
              {!usesOfficeParties && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ApprovalDetailField
                    label="Warehouse"
                    value={decisionTarget.warehouse_name || 'Warehouse not assigned'}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
                <ApprovalDetailField
                  label="Issue Date"
                  value={formatDate(decisionTarget.issue_date)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ApprovalDetailField
                  label="Items"
                  value={String(decisionMetrics.items || decisionTarget.item_count || 0)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ApprovalDetailField
                  label="Total Value"
                  value={formatCurrency(decisionMetrics.totalValue || decisionTarget.total_value)}
                />
              </Grid>
            </Grid>

            {workflowEnabled && decisionWorkflowInfo ? (
              <GinApprovalSummary wfInfo={decisionWorkflowInfo} />
            ) : null}

            <Divider />

            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Line Items
              </Typography>
              <Stack spacing={1}>
                {decisionLineItems.length ? (
                  decisionLineItems.map((line) => (
                    <Stack
                      key={line.localId}
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      spacing={1.5}
                      sx={{
                        px: 1.5,
                        py: 1.25,
                        borderRadius: 1.5,
                        bgcolor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600} color="#0f172a">
                          {line.product_name || line.item_name || 'Unknown item'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {line.item_code || 'No code'}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.25 }}
                        >
                          Current stock{' '}
                          {Number(line.item_current_quantity || 0).toLocaleString('en-BD')}{' '}
                          {line.unit || ''}
                        </Typography>
                      </Box>

                      {isIssueDialog ? (
                        <Typography variant="body2" color="text.secondary">
                          Issued {Number(line.issued_qty || 0).toLocaleString('en-BD')}{' '}
                          {line.unit || ''}
                        </Typography>
                      ) : (
                        <TextField
                          size="small"
                          type="number"
                          label="Issued Qty"
                          value={line.issued_qty}
                          onChange={(event) => onLineItemChange(line.localId, event.target.value)}
                          inputProps={{
                            min: 0,
                            max: Number(line.item_current_quantity || 0) || undefined,
                            step: 'any',
                          }}
                          helperText={`Max ${Number(line.item_current_quantity || 0).toLocaleString('en-BD')} ${line.unit || ''}`}
                          sx={{ minWidth: { xs: '100%', sm: 180 } }}
                        />
                      )}
                    </Stack>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No line items were attached to this issue.
                  </Typography>
                )}
              </Stack>
            </Box>

            {isIssueDialog && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                    Transport / Dispatch Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Transport Person / Courier Name"
                        required
                        value={decisionDialog?.transport?.transport_person || ''}
                        onChange={(e) => onTransportChange('transport_person', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Phone Number"
                        required
                        value={decisionDialog?.transport?.transport_phone || ''}
                        onChange={(e) => onTransportChange('transport_phone', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DatePicker
                        label="Dispatch Date *"
                        value={
                          decisionDialog?.transport?.dispatch_date
                            ? dayjs(decisionDialog.transport.dispatch_date)
                            : null
                        }
                        onChange={(val) => onTransportChange('dispatch_date', val)}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Vehicle Number (optional)"
                        value={decisionDialog?.transport?.vehicle_number || ''}
                        onChange={(e) => onTransportChange('vehicle_number', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Delivery Address"
                        multiline
                        rows={2}
                        value={decisionDialog?.transport?.transport_address || ''}
                        onChange={(e) => onTransportChange('transport_address', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </>
            )}
          </Stack>
        ) : null
      }
      action={
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
          {isIssueDialog ? (
            <>
              <Button
                variant="outlined"
                color="error"
                onClick={() => onDecision('Cancelled')}
                disabled={decisionSubmitting}
              >
                {decisionSubmitting ? 'Saving...' : 'Not Issued'}
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => onDecision('Issued')}
                disabled={
                  decisionSubmitting ||
                  !decisionDialog?.transport?.transport_person?.trim() ||
                  !decisionDialog?.transport?.transport_phone?.trim() ||
                  !decisionDialog?.transport?.dispatch_date
                }
              >
                {decisionSubmitting ? 'Saving...' : 'Issued'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                color="error"
                onClick={() => onDecision('Cancelled')}
                disabled={decisionSubmitting}
              >
                {decisionSubmitting ? 'Saving...' : 'Not Approved'}
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => onDecision('Approved')}
                disabled={decisionSubmitting}
              >
                {decisionSubmitting ? 'Saving...' : 'Confirm'}
              </Button>
            </>
          )}
        </Stack>
      }
    />
  );
}
