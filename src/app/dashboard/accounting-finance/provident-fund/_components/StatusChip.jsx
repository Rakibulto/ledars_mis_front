'use client';

import Chip from '@mui/material/Chip';

import { STATUS_CONFIG } from 'src/constants/providentFund';

export default function StatusChip({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'default' };
  return <Chip label={config.label} color={config.color} size="small" />;
}
