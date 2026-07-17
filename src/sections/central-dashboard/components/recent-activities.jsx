'use client';

import {
  FileText,
  FolderOpen,
  UserPlus,
  Package,
  Target,
  Calendar,
  ClipboardList,
  Heart,
  ShoppingCart,
  Send,
  FileCheck,
  Trophy,
  FileSignature,
  Zap,
  Truck,
} from 'lucide-react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { SectionCard, EmptyState } from './common';
import { formatRelativeTime } from '../utils/formatters';

const PROCUREMENT_SUB_MODULE_ICONS = {
  'Material Requisition': ShoppingCart,
  'RFQ': Send,
  'Quotation': FileText,
  'Comparative Statement': FileCheck,
  'Award': Trophy,
  'Work Order': FileSignature,
  'Direct Purchase': Zap,
  'GRN': Truck,
};

const MODULE_CONFIG = {
  procurement: { icon: FileText, color: 'warning' },
  projects: { icon: FolderOpen, color: 'info' },
  hrm: { icon: UserPlus, color: 'secondary' },
  inventory: { icon: Package, color: 'success' },
  crm: { icon: Target, color: 'error' },
  meetings: { icon: Calendar, color: 'info' },
  todo: { icon: ClipboardList, color: 'warning' },
  beneficiaries: { icon: Heart, color: 'error' },
};

function ActivityItem({ activity, isLast }) {
  const theme = useTheme();
  const config = MODULE_CONFIG[activity.module] || MODULE_CONFIG.projects;
  const paletteColor = theme.palette[config.color]?.main;

  const SubIcon = activity.sub_module
    ? (PROCUREMENT_SUB_MODULE_ICONS[activity.sub_module] || config.icon)
    : config.icon;
  const Icon = activity.module === 'procurement' ? SubIcon : config.icon;

  return (
    <Box
      sx={{
        pb: isLast ? 0 : 1.5,
        mb: isLast ? 0 : 1.5,
        borderBottom: isLast ? 'none' : `1px solid ${theme.palette.divider}`,
      }}
    >
      <Stack direction="row" spacing={1.5}>
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
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.25 }}>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ minWidth: 0 }}>
              {activity.title}
            </Typography>
            {activity.sub_module && (
              <Chip
                label={activity.sub_module}
                size="small"
                sx={{
                  height: 18,
                  fontSize: 10,
                  fontWeight: 600,
                  bgcolor: alpha(paletteColor, 0.12),
                  color: paletteColor,
                  '& .MuiChip-label': { px: 0.75 },
                  flexShrink: 0,
                }}
              />
            )}
          </Stack>
          {activity.description && (
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ display: 'block' }}
            >
              {activity.description}
            </Typography>
          )}
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25 }}>
            {activity.user && (
              <Typography variant="caption" color="text.secondary">
                {activity.user}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              &bull;
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatRelativeTime(activity.time)}
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

export default function RecentActivities({ activities = [], isLoading }) {
  if (isLoading) {
    return (
      <SectionCard title="Recent Activities">
        <Stack spacing={2}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Stack key={i} direction="row" spacing={1.5}>
              <Skeleton variant="rounded" width={32} height={32} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="70%" height={18} />
                <Skeleton width="45%" height={14} sx={{ mt: 0.5 }} />
              </Box>
            </Stack>
          ))}
        </Stack>
      </SectionCard>
    );
  }

  if (!activities.length) {
    return (
      <SectionCard title="Recent Activities" description="Latest updates across all modules">
        <EmptyState
          icon={FileText}
          title="No Recent Activities"
          description="Activities will appear here as they happen"
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Recent Activities"
      description="Latest updates across all modules"
      contentSx={{ maxHeight: 380, overflowY: 'auto', pr: 0.5 }}
    >
      {activities.map((activity, index) => (
        <ActivityItem
          key={activity.id || index}
          activity={activity}
          isLast={index === activities.length - 1}
        />
      ))}
    </SectionCard>
  );
}
