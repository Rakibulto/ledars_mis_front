export const MEETING_STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'postponed', label: 'Postponed' },
];

export const MEETING_STATUS_COLORS = {
  scheduled: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
  postponed: 'default',
};

export const MEETING_STATUS_LABELS = Object.fromEntries(
  MEETING_STATUS_OPTIONS.map((o) => [o.value, o.label])
);
