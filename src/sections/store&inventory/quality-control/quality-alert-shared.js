export const QUALITY_ALERT_SEVERITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

export const QUALITY_ALERT_STATUS_OPTIONS = ['New', 'In Progress', 'Resolved'];

export function normalizeCollection(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.results) ? payload.results : [];
}

export function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

export function formatDate(value) {
  if (!value) {
    return 'Not recorded';
  }

  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
  }).format(new Date(value));
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

export function getAlertSeverityChipProps(severity) {
  switch (normalizeText(severity)) {
    case 'critical':
      return { color: 'error', label: 'Critical' };
    case 'high':
      return { color: 'warning', label: 'High' };
    case 'medium':
      return { color: 'info', label: 'Medium' };
    case 'low':
      return { color: 'success', label: 'Low' };
    default:
      return { color: 'default', label: severity || 'Unknown' };
  }
}

export function getAlertStatusChipProps(status) {
  switch (normalizeText(status)) {
    case 'new':
      return { color: 'warning', label: 'New' };
    case 'in progress':
      return { color: 'info', label: 'In Progress' };
    case 'resolved':
      return { color: 'success', label: 'Resolved' };
    default:
      return { color: 'default', label: status || 'Unknown' };
  }
}

export function getAlertAction({ severity, status }) {
  const normalizedStatus = normalizeText(status);
  const normalizedSeverity = normalizeText(severity);

  if (normalizedStatus === 'resolved') {
    return 'The alert is resolved. Confirm the corrective action is complete and keep the incident history linked for audit review.';
  }

  if (normalizedSeverity === 'critical') {
    return 'Escalate immediately, isolate affected stock, and assign a named owner until the root cause and corrective action are documented.';
  }

  if (normalizedStatus === 'in progress') {
    return 'Keep the investigation moving by documenting current findings, ownership, and the next operational checkpoint.';
  }

  return 'Triage the alert, verify the affected product scope, and assign the responsible reporter or team before warehouse movement continues.';
}

export function truncateText(value, maxLength = 88) {
  const content = String(value || '').trim();

  if (!content) {
    return 'No additional notes';
  }

  if (content.length <= maxLength) {
    return content;
  }

  return `${content.slice(0, maxLength - 1)}...`;
}
