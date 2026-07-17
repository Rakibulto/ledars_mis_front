'use client';

import {
  Briefcase,
  FolderOpen,
  Clock,
  Users,
  UserCheck,
  Heart,
  Package,
  AlertTriangle,
  Calendar,
  ClipboardList,
  Target,
  CheckSquare,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { formatNumber, formatCurrency } from '../utils/formatters';

function KpiCard({ title, value, icon: Icon, color = 'primary', format = 'number', trend }) {
  const theme = useTheme();
  const displayValue = format === 'currency' ? formatCurrency(value) : formatNumber(value);
  const paletteColor = theme.palette[color]?.main || theme.palette.primary.main;
  const isPositive = trend >= 0;

  return (
    <Card
      variant="outlined"
      sx={{
        p: 2.5,
        height: '100%',
        borderRadius: 3,
        transition: (t) => t.transitions.create(['box-shadow', 'transform']),
        '&:hover': {
          boxShadow: (t) => t.shadows[8],
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }} noWrap>
            {displayValue}
          </Typography>
          {trend !== undefined && trend !== null && (
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.75 }}>
              {isPositive ? (
                <TrendingUp size={14} color={theme.palette.success.main} />
              ) : (
                <TrendingDown size={14} color={theme.palette.error.main} />
              )}
              <Typography
                variant="caption"
                sx={{ color: isPositive ? 'success.main' : 'error.main', fontWeight: 600 }}
              >
                {Math.abs(trend)}%
              </Typography>
            </Stack>
          )}
        </Box>
        <Box
          sx={{
            width: 44,
            height: 44,
            flexShrink: 0,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(paletteColor, 0.12),
            color: paletteColor,
          }}
        >
          <Icon size={20} />
        </Box>
      </Stack>
    </Card>
  );
}

function KpiSkeleton() {
  return (
    <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
      <Stack direction="row" justifyContent="space-between">
        <Box sx={{ flex: 1 }}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="45%" height={32} sx={{ mt: 0.5 }} />
          <Skeleton width="30%" height={14} sx={{ mt: 0.75 }} />
        </Box>
        <Skeleton variant="rounded" width={44} height={44} />
      </Stack>
    </Card>
  );
}

export default function KpiCards({ kpis, isLoading }) {
  const cards = [
    { title: 'Total Projects', value: kpis?.projects?.total, icon: FolderOpen, color: 'primary' },
    { title: 'Active Projects', value: kpis?.projects?.active, icon: Briefcase, color: 'success' },
    { title: 'Pending Procurement', value: kpis?.procurement?.pending, icon: Clock, color: 'warning' },
    { title: 'Total Employees', value: kpis?.employees?.total, icon: Users, color: 'secondary' },
    { title: 'Present Today', value: kpis?.employees?.present, icon: UserCheck, color: 'success' },
    { title: 'Beneficiaries', value: kpis?.beneficiaries?.total, icon: Heart, color: 'error' },
    { title: 'Inventory Items', value: kpis?.inventory?.total_items, icon: Package, color: 'info' },
    { title: 'Low Stock', value: kpis?.inventory?.low_stock, icon: AlertTriangle, color: 'error' },
    { title: "Today's Meetings", value: kpis?.meetings?.today, icon: Calendar, color: 'info' },
    { title: 'Pending Tasks', value: kpis?.tasks?.pending, icon: ClipboardList, color: 'warning' },
    { title: 'Total Leads', value: kpis?.crm?.total_leads, icon: Target, color: 'secondary' },
    { title: "Today's Tasks", value: kpis?.tasks?.today, icon: CheckSquare, color: 'success' },
    {
      title: 'Total Revenue',
      value: kpis?.accounting?.revenue,
      icon: DollarSign,
      color: 'success',
      format: 'currency',
    },
    {
      title: 'Total Expenses',
      value: kpis?.accounting?.expense,
      icon: TrendingDown,
      color: 'error',
      format: 'currency',
    },
    {
      title: 'Current Balance',
      value: kpis?.accounting?.balance,
      icon: Wallet,
      color: 'primary',
      format: 'currency',
    },
  ];

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
        Key Metrics
      </Typography>
      <Grid container spacing={2}>
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2.4 }}>
                <KpiSkeleton />
              </Grid>
            ))
          : cards.map((card) => (
              <Grid key={card.title} size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2.4 }}>
                <KpiCard {...card} />
              </Grid>
            ))}
      </Grid>
    </Box>
  );
}
