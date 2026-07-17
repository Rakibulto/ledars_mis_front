export const QCP_FREQUENCY_OPTIONS = ['Daily', 'Weekly', 'Monthly', 'Per Batch'];

export const QCP_PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

export const QCP_STATUS_OPTIONS = ['Active', 'Inactive'];

export function normalizeCollection(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  return Array.isArray(payload?.results) ? payload.results : [];
}

export function normalizeBooleanValue(value) {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return Boolean(value);
}

export function formatDate(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

export function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

export function normalizeText(value) {
  return String(value || '').trim();
}

export function truncateText(value, maxLength = 88) {
  const str = normalizeText(value);
  return str.length > maxLength ? `${str.slice(0, maxLength)}…` : str;
}

export function getFrequencyChipProps(frequency) {
  switch (String(frequency || '').toLowerCase()) {
    case 'daily':
      return { label: 'Daily', color: 'error' };
    case 'weekly':
      return { label: 'Weekly', color: 'warning' };
    case 'monthly':
      return { label: 'Monthly', color: 'info' };
    case 'per batch':
      return { label: 'Per Batch', color: 'secondary' };
    default:
      return { label: frequency || 'Unknown', color: 'default' };
  }
}

export function getPriorityChipProps(priority) {
  switch (String(priority || '').toLowerCase()) {
    case 'critical':
      return { label: 'Critical', color: 'error' };
    case 'high':
      return { label: 'High', color: 'warning' };
    case 'medium':
      return { label: 'Medium', color: 'info' };
    case 'low':
      return { label: 'Low', color: 'success' };
    default:
      return { label: priority || 'Unknown', color: 'default' };
  }
}

export function getStatusChipProps(isActive) {
  if (isActive === true || isActive === 'true' || isActive === 'Active') {
    return { label: 'Active', color: 'success' };
  }
  return { label: 'Inactive', color: 'default' };
}

export function getOperationTypeLabel(operationType) {
  const name = operationType?.operation_type_name || operationType?.name || '';
  const code = operationType?.operation_type_code || operationType?.code || '';
  if (name && code) return `${name} (${code})`;
  return name || code || 'Not linked';
}

export function getQCPNarrative(point) {
  if (!point?.is_active) {
    return 'This control point is currently inactive. Reactivate it before assigning it to active inspection routines.';
  }

  const priority = String(point?.priority || '').toLowerCase();

  if (priority === 'critical') {
    return 'Critical priority — this control point must be cleared before product can advance to the next warehouse stage.';
  }

  if (priority === 'high') {
    return 'High priority — escalate any failed inspection immediately and prevent batch release until resolved.';
  }

  if (point?.frequency) {
    return `Inspect ${point.frequency.toLowerCase()} and record results immediately. Unresolved deviations should be flagged to the quality lead.`;
  }

  return 'Review the inspection criteria and assigned staff to ensure this control point is ready for active use.';
}

// Legacy export — kept for backward compatibility with old imports
export function getQualityControlPointNarrative(point) {
  return getQCPNarrative(point);
}
