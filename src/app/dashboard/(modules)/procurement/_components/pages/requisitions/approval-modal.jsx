'use client';

import { mutate } from 'swr';
import { useState, forwardRef } from 'react';
import {
  X,
  Send,
  Stamp,
  XCircle,
  RotateCcw,
  UserCheck,
  DollarSign,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Slide from '@mui/material/Slide';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { endpoints } from 'src/utils/axios';

import { usePatchRequest } from 'src/actions/ledars-hook';

const Transition = forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

export function ApprovalModal({ requisition, onClose }) {
  const [action, setAction] = useState(null);
  const [comments, setComments] = useState('');
  const [notifyRequester, setNotifyRequester] = useState(true);
  const [notifyNextApprover, setNotifyNextApprover] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  // Current workflow step (would come from context in real app)
  const currentStep = {
    step: 2,
    title: 'Endorsement',
    role: 'Area Manager',
    icon: UserCheck,
  };
  const nextStep = {
    step: 3,
    title: 'Final Approval',
    approver: 'Sharif Uddin (Head of Operations)',
  };

  const actions = [
    {
      type: 'approve',
      label: `Approve & Forward to Step ${nextStep.step}`,
      description: `Endorse this MRF and forward to ${nextStep.approver} for ${nextStep.title}`,
      icon: CheckCircle,
      borderColor: '#4caf50',
      activeBorderColor: '#2e7d32',
      bgColor: '#f1f8e9',
      hoverBg: '#e8f5e9',
      textColor: '#2e7d32',
    },
    {
      type: 'return',
      label: 'Return for Revision',
      description:
        'Send back to requester with comments for revision. The MRF version will increment.',
      icon: RotateCcw,
      borderColor: '#ff9800',
      activeBorderColor: '#f57c00',
      bgColor: '#fff8e1',
      hoverBg: '#fff3e0',
      textColor: '#e65100',
    },
    {
      type: 'reject',
      label: 'Reject MRF',
      description:
        'Reject this MRF entirely. Requester will be notified. This action cannot be undone.',
      icon: XCircle,
      borderColor: '#ef5350',
      activeBorderColor: '#d32f2f',
      bgColor: '#ffebee',
      hoverBg: '#fce4ec',
      textColor: '#c62828',
    },
  ];

  const handleSubmit = async () => {
    if (!action || (action !== 'approve' && !comments.trim())) return;
    const STATUS_MAP = { approve: 'Approved', return: 'Returned', reject: 'Rejected' };
    setSubmitting(true);
    setApiError('');
    try {
      await usePatchRequest(
        endpoints.procurement_management.requisitionsChangeStatus(requisition?.id),
        { status: STATUS_MAP[action], action, comments }
      );
      mutate(endpoints.procurement_management.requisitionById(requisition?.id));
      mutate(endpoints.procurement_management.requisitions);
      onClose();
    } catch (err) {
      setApiError(
        err?.response?.data?.detail || err?.message || 'Action failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const workflowSteps = [
    { label: 'Budget Clearance', icon: DollarSign, done: true },
    { label: 'Endorsement', icon: UserCheck, done: false, current: true },
    { label: 'Final Approval', icon: Stamp, done: false },
    { label: 'Route to Procurement', icon: Send, done: false },
  ];

  const submitButtonColor =
    action === 'approve' ? 'success' : action === 'reject' ? 'error' : 'primary';

  const submitButtonContent =
    action === 'approve' ? (
      <Box display="flex" alignItems="center" gap={1}>
        <CheckCircle size={16} />
        Confirm Endorsement
      </Box>
    ) : action === 'return' ? (
      <Box display="flex" alignItems="center" gap={1}>
        <RotateCcw size={16} />
        Return for Revision
      </Box>
    ) : action === 'reject' ? (
      <Box display="flex" alignItems="center" gap={1}>
        <XCircle size={16} />
        Confirm Rejection
      </Box>
    ) : (
      'Select an Action'
    );

  return (
    <Dialog
      open
      onClose={onClose}
      slots={{ transition: Transition }}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, maxHeight: '90vh' },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', py: 2.5 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Typography variant="h6" fontWeight={600}>
                Workflow Action
              </Typography>
              <Chip
                icon={<currentStep.icon size={12} />}
                label={`Step ${currentStep.step}: ${currentStep.title}`}
                color="warning"
                size="small"
                sx={{ fontWeight: 500 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Review and take action on {requisition?.id}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ mt: -0.5 }}>
            <X size={18} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
        {/* MRF Summary */}
        <Box sx={{ p: 3, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
          <Grid container spacing={2}>
            <Grid size={4}>
              <Typography variant="caption" color="text.secondary">
                MRF Number
              </Typography>
              <Typography fontFamily="monospace" fontWeight={700}>
                {requisition?.id}
              </Typography>
            </Grid>
            <Grid size={4}>
              <Typography variant="caption" color="text.secondary">
                Requester
              </Typography>
              <Typography fontWeight={500}>{requisition?.requester}</Typography>
            </Grid>
            <Grid size={4}>
              <Typography variant="caption" color="text.secondary">
                Total Amount
              </Typography>
              <Typography fontWeight={700} color="primary" variant="h6">
                ৳{requisition?.amount?.toLocaleString()}
              </Typography>
            </Grid>
            <Grid size={4}>
              <Typography variant="caption" color="text.secondary">
                Category
              </Typography>
              <Typography>{requisition?.category}</Typography>
            </Grid>
            <Grid size={4}>
              <Typography variant="caption" color="text.secondary">
                Date Required
              </Typography>
              <Typography>{requisition?.dateRequired}</Typography>
            </Grid>
            <Grid size={4}>
              <Typography variant="caption" color="text.secondary">
                Department
              </Typography>
              <Typography>{requisition?.department}</Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="caption" color="text.secondary">
            Purpose:
          </Typography>
          <Typography
            variant="body2"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {requisition?.purpose}
          </Typography>
        </Box>

        {/* Workflow Progress */}
        <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{ letterSpacing: 1 }}
          >
            WORKFLOW PROGRESS
          </Typography>
          <Box display="flex" alignItems="center" mt={1.5}>
            {workflowSteps.map((step, idx) => (
              <Box key={idx} display="flex" alignItems="center" flex={1}>
                <Box display="flex" flexDirection="column" alignItems="center" flex={1}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: step.done
                        ? 'success.main'
                        : step.current
                          ? 'primary.main'
                          : 'grey.200',
                      color: step.done || step.current ? 'white' : 'text.secondary',
                      boxShadow: step.current ? '0 0 0 4px rgba(25,118,210,0.2)' : 'none',
                    }}
                  >
                    {step.done ? <CheckCircle size={16} /> : <step.icon size={16} />}
                  </Box>
                  <Typography
                    variant="caption"
                    fontWeight={500}
                    textAlign="center"
                    mt={0.5}
                    sx={{ fontSize: '10px' }}
                  >
                    {step.label}
                  </Typography>
                </Box>
                {idx < workflowSteps.length - 1 && (
                  <Box
                    sx={{
                      height: 2,
                      width: 32,
                      flexShrink: 0,
                      mb: 2.5,
                      bgcolor: step.done ? 'success.light' : 'grey.200',
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Action Selection */}
        <Box sx={{ p: 3 }}>
          <Typography variant="body2" fontWeight={600} mb={2}>
            Select Action:
          </Typography>
          <Box display="flex" flexDirection="column" gap={1.5}>
            {actions.map((a) => (
              <Paper
                key={a.type}
                variant="outlined"
                onClick={() => setAction(a.type)}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  borderWidth: 2,
                  borderColor: action === a.type ? a.activeBorderColor : a.borderColor,
                  bgcolor: a.bgColor,
                  boxShadow: action === a.type ? `0 0 0 3px ${a.activeBorderColor}30` : 'none',
                  '&:hover': { bgcolor: a.hoverBg },
                  transition: 'all 0.15s ease',
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  <a.icon size={20} color={a.textColor} />
                  <Box>
                    <Typography variant="body2" fontWeight={600} sx={{ color: a.textColor }}>
                      {a.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: a.textColor, opacity: 0.8 }}>
                      {a.description}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>

          {/* Comments */}
          <Box mt={3}>
            <Typography variant="body2" fontWeight={500} mb={1}>
              Comments{' '}
              <Box component="span" sx={{ color: 'error.main' }}>
                *
              </Box>
              {action === 'return' && (
                <Box
                  component="span"
                  sx={{ color: 'warning.dark', ml: 0.5, fontWeight: 400, fontSize: '0.75rem' }}
                >
                  (Please explain what needs revision)
                </Box>
              )}
              {action === 'reject' && (
                <Box
                  component="span"
                  sx={{ color: 'error.main', ml: 0.5, fontWeight: 400, fontSize: '0.75rem' }}
                >
                  (Rejection reason is mandatory)
                </Box>
              )}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              size="small"
              placeholder={
                action === 'approve'
                  ? 'Optional: Add endorsement comments or notes for the final approver...'
                  : action === 'return'
                    ? 'Required: Explain what changes are needed before resubmission...'
                    : action === 'reject'
                      ? 'Required: Provide reason for rejection...'
                      : 'Select an action first...'
              }
            />
          </Box>

          {/* Notification Options */}
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', mt: 2 }}>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{ letterSpacing: 1 }}
            >
              NOTIFICATIONS
            </Typography>
            <Box mt={1} display="flex" flexDirection="column">
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={notifyRequester}
                    onChange={(e) => setNotifyRequester(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2">
                    Notify requester ({requisition?.requester}) via email
                  </Typography>
                }
              />
              {action === 'approve' && (
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={notifyNextApprover}
                      onChange={(e) => setNotifyNextApprover(e.target.checked)}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Notify next approver ({nextStep.approver}) via email
                    </Typography>
                  }
                />
              )}
            </Box>
          </Paper>

          {/* Warning for rejection */}
          {action === 'reject' && (
            <Alert severity="error" icon={<AlertTriangle size={18} />} sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight={600}>
                This action cannot be undone
              </Typography>
              <Typography variant="caption">
                Rejecting this MRF will close it permanently. The requester will need to create a
                new MRF if the requirement still exists.
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'grey.50',
          justifyContent: 'space-between',
        }}
      >
        <Box display="flex" flexDirection="column" alignItems="flex-start" gap={0.5}>
          <Button variant="text" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          {apiError && (
            <Typography variant="caption" color="error" maxWidth={280}>
              {apiError}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          color={submitButtonColor}
          onClick={handleSubmit}
          disabled={submitting || !action || (action !== 'approve' && !comments.trim())}
        >
          {submitButtonContent}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
