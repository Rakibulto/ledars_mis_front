'use client';

import { Calendar, ClipboardList, Clock } from 'lucide-react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { SectionCard, EmptyState } from './common';
import { formatTime } from '../utils/formatters';

const TYPE_CONFIG = {
  meeting: { icon: Calendar, color: 'info' },
  task: { icon: ClipboardList, color: 'warning' },
  deadline: { icon: Clock, color: 'error' },
};

function ScheduleItem({ item }) {
  const theme = useTheme();
  const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.task;
  const Icon = config.icon;
  const paletteColor = theme.palette[config.color]?.main;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{
        p: 1.25,
        borderRadius: 2,
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: paletteColor, flexShrink: 0 }} />
      <Box
        sx={{
          width: 32,
          height: 32,
          flexShrink: 0,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(paletteColor, 0.12),
          color: paletteColor,
        }}
      >
        <Icon size={16} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {item.title}
        </Typography>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {formatTime(item.time)}
          </Typography>
          {item.location && (
            <>
              <Typography variant="caption" color="text.secondary">
                &bull;
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {item.location}
              </Typography>
            </>
          )}
        </Stack>
      </Box>
      <Chip
        label={item.type}
        size="small"
        sx={{
          textTransform: 'capitalize',
          fontWeight: 600,
          bgcolor: alpha(paletteColor, 0.12),
          color: paletteColor,
        }}
      />
    </Stack>
  );
}

export default function TodaySchedule({ schedule = [], isLoading }) {
  if (isLoading) {
    return (
      <SectionCard title="Today's Schedule">
        <Stack spacing={1.5}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Stack key={i} direction="row" alignItems="center" spacing={1.5}>
              <Skeleton variant="circular" width={6} height={6} />
              <Skeleton variant="rounded" width={32} height={32} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="60%" height={18} />
                <Skeleton width="40%" height={14} sx={{ mt: 0.5 }} />
              </Box>
              <Skeleton variant="rounded" width={64} height={22} />
            </Stack>
          ))}
        </Stack>
      </SectionCard>
    );
  }

  if (!schedule.length) {
    return (
      <SectionCard title="Today's Schedule" description="Meetings, tasks, and deadlines">
        <EmptyState icon={Calendar} title="No Schedule Today" description="Nothing scheduled for today" />
      </SectionCard>
    );
  }

  const sorted = [...schedule].sort(
    (a, b) => new Date(a.time || 0).getTime() - new Date(b.time || 0).getTime()
  );

  return (
    <SectionCard
      title="Today's Schedule"
      description={`${schedule.length} item${schedule.length === 1 ? '' : 's'} today`}
    >
      <Stack spacing={0.5}>
        {sorted.map((item, index) => (
          <ScheduleItem key={item.id || index} item={item} />
        ))}
      </Stack>
    </SectionCard>
  );
}
