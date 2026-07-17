export const QUALITY_STATUS_OPTIONS = ['Pending', 'Approved', 'Declined'];

export const QUALITY_TYPE_OPTIONS = ['Receipt', 'Periodic', 'Return', 'Random'];

export const QUALITY_RESULT_OPTIONS = ['Pass', 'Fail', 'Conditional Pass'];

export const QUALITY_PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

export function normalizeCollection(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.results) ? payload.results : [];
}

export function normalizeStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

export function formatDate(value) {
  if (!value) {
    return 'Not recorded';
  }

  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) {
    return 'Not recorded';
  }

  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function getStatusChipProps(status) {
  switch (normalizeStatus(status)) {
    case 'approved':
      return { color: 'success', label: 'Approved' };
    case 'declined':
      return { color: 'error', label: 'Declined' };
    case 'pending':
      return { color: 'warning', label: 'Pending' };
    default:
      return { color: 'default', label: status || 'Unknown' };
  }
}

export function getResultChipProps(result) {
  switch (normalizeStatus(result)) {
    case 'pass':
      return { color: 'success', label: 'Pass' };
    case 'fail':
      return { color: 'error', label: 'Fail' };
    case 'conditional pass':
      return { color: 'info', label: 'Conditional Pass' };
    default:
      return { color: 'default', label: result || '—' };
  }
}

export function getPriorityChipProps(priority) {
  switch (normalizeStatus(priority)) {
    case 'critical':
      return { color: 'error', label: 'Critical' };
    case 'high':
      return { color: 'warning', label: 'High' };
    case 'medium':
      return { color: 'info', label: 'Medium' };
    case 'low':
      return { color: 'success', label: 'Low' };
    default:
      return { color: 'default', label: priority || 'Medium' };
  }
}

export function getRecommendedAction(status) {
  switch (normalizeStatus(status)) {
    case 'approved':
      return 'Stock has been approved. Release to the next warehouse step and keep the inspection evidence linked to the item movement.';
    case 'declined':
      return 'Stock is declined. Block the stock, record the defect root cause, and assign corrective action before any release.';
    default:
      return 'Complete the inspection, capture findings and result, then approve or decline accordingly.';
  }
}
