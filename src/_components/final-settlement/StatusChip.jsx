'use client';

import Chip from '@mui/material/Chip';

const STATUS_CONFIG = {
  Draft: { label: 'Draft', color: 'default' },
  Submitted: { label: 'Submitted', color: 'info' },
  Under_Review: { label: 'Under Review', color: 'warning' },
  Approved: { label: 'Approved', color: 'success' },
  Rejected: { label: 'Rejected', color: 'error' },
  Payment_Pending: { label: 'Payment Pending', color: 'secondary' },
  Completed: { label: 'Completed', color: 'success' },
};

export default function StatusChip({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'default' };
  return <Chip label={config.label} color={config.color} size="small" />;
}
