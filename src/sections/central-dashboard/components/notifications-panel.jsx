'use client';

import { CheckCircle } from 'lucide-react';

import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import MuiAlert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

import { SectionCard, EmptyState } from './common';

const SEVERITY_MAP = {
  warning: 'warning',
  danger: 'error',
  error: 'error',
  info: 'info',
  success: 'success',
};

function NotificationItem({ notification }) {
  const severity = SEVERITY_MAP[notification.type] || 'info';
  return (
    <MuiAlert severity={severity} variant="outlined" sx={{ borderRadius: 2 }}>
      {notification.title && <AlertTitle sx={{ fontWeight: 700 }}>{notification.title}</AlertTitle>}
      {notification.message}
    </MuiAlert>
  );
}

export default function NotificationsPanel({ notifications = [], isLoading }) {
  if (isLoading) {
    return (
      <SectionCard title="Notifications">
        <Stack spacing={1.5}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={64} />
          ))}
        </Stack>
      </SectionCard>
    );
  }

  if (!notifications.length) {
    return (
      <SectionCard title="Notifications" description="Important alerts and warnings">
        <EmptyState icon={CheckCircle} title="All Clear" description="No notifications at this time" />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Notifications"
      description={`${notifications.length} item${notifications.length === 1 ? '' : 's'} require attention`}
    >
      <Stack spacing={1.5}>
        {notifications.map((notification, index) => (
          <NotificationItem key={notification.id || index} notification={notification} />
        ))}
      </Stack>
    </SectionCard>
  );
}
