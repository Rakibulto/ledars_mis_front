import SendIcon from '@mui/icons-material/Send';
import ErrorIcon from '@mui/icons-material/Error';
import BlockIcon from '@mui/icons-material/Block';
import CancelIcon from '@mui/icons-material/Cancel';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';

export const STATUS_CHIP_COLORS = {
  draft: 'default',
  pending: 'info',
  sent: 'info',
  submitted: 'info',
  partial: 'warning',
  paid: 'success',
  posted: 'success',
  reconciled: 'success',
  overdue: 'error',
  cancelled: 'error',
  voided: 'error',
};

export function formatStatusLabel(value) {
  if (!value) return '—';
  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getStatusActionMeta(status) {
  switch (status) {
    case 'draft':
      return { label: 'Draft', icon: <PendingActionsIcon fontSize="small" /> };
    case 'pending':
    case 'submitted':
    case 'sent':
      return { label: formatStatusLabel(status), icon: <SendIcon fontSize="small" /> };
    case 'partial':
      return { label: 'Partial', icon: <PublishedWithChangesIcon fontSize="small" /> };
    case 'paid':
    case 'posted':
    case 'reconciled':
    case 'completed':
    case 'approved':
      return { label: formatStatusLabel(status), icon: <CheckCircleIcon fontSize="small" /> };
    case 'overdue':
      return { label: 'Overdue', icon: <ErrorIcon fontSize="small" /> };
    case 'cancelled':
    case 'voided':
      return {
        label: formatStatusLabel(status),
        icon: <CancelIcon fontSize="small" />,
        destructive: true,
      };
    case 'rejected':
      return { label: 'Rejected', icon: <BlockIcon fontSize="small" />, destructive: true };
    case 'running':
      return { label: 'Running', icon: <PlayCircleIcon fontSize="small" /> };
    case 'in_progress':
      return { label: 'In Progress', icon: <PendingActionsIcon fontSize="small" /> };
    case 'confirmed':
      return { label: 'Confirmed', icon: <PlaylistAddCheckIcon fontSize="small" /> };
    default:
      return { label: formatStatusLabel(status), icon: <PendingActionsIcon fontSize="small" /> };
  }
}

export function buildNextStatusTransitions(currentStatus, sequence) {
  const currentIndex = sequence.indexOf(currentStatus);
  const transitions = [];

  if (currentStatus === 'cancelled' || currentStatus === 'voided') {
    return transitions;
  }

  if (currentStatus === 'overdue') {
    if (sequence.includes('sent')) {
      transitions.push('sent');
    }
    if (sequence.includes('cancelled')) {
      transitions.push('cancelled');
    }
    if (sequence.includes('voided')) {
      transitions.push('voided');
    }
    return Array.from(new Set(transitions));
  }

  if (currentStatus === 'paid' || currentStatus === 'posted' || currentStatus === 'reconciled') {
    if (sequence.includes('cancelled')) transitions.push('cancelled');
    if (sequence.includes('voided')) transitions.push('voided');
    return Array.from(new Set(transitions));
  }

  if (currentIndex >= 0 && currentIndex < sequence.length - 1) {
    transitions.push(sequence[currentIndex + 1]);
  }

  if (sequence.includes('cancelled')) transitions.push('cancelled');
  if (sequence.includes('voided')) transitions.push('voided');

  return Array.from(new Set(transitions));
}
