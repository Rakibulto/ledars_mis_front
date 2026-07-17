'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Briefcase,
  Users,
  Target,
  Package,
  DollarSign,
  Heart,
  Calendar,
  ClipboardList,
  Map,
  ShoppingCart,
  Send,
  FileCheck,
  Trophy,
  FileSignature,
  Zap,
  Truck,
} from 'lucide-react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme, alpha } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';

import { formatNumber } from '../utils/formatters';

const PROCUREMENT_SUB_MODULE_CONFIG = [
  { key: 'material_requisition', label: 'Material Requisition', icon: ShoppingCart, href: '/dashboard/procurement/requisitions' },
  { key: 'rfq', label: 'RFQ', icon: Send, href: '/dashboard/procurement/rfq' },
  { key: 'quotation', label: 'Quotation', icon: FileText, href: '/dashboard/procurement/quotations' },
  { key: 'comparative_statement', label: 'Comparative Statement', icon: FileCheck, href: '/dashboard/procurement/comparative' },
  { key: 'award', label: 'Awards', icon: Trophy, href: '/dashboard/procurement/awards' },
  { key: 'work_order', label: 'Work Orders', icon: FileSignature, href: '/dashboard/procurement/work-orders' },
  { key: 'direct_purchase', label: 'Direct Purchase', icon: Zap, href: '/dashboard/procurement/direct-purchase' },
  { key: 'grn', label: 'GRN', icon: Truck, href: '/dashboard/procurement/grn' },
];

const STATUS_COLORS = {
  draft: 'default',
  pending: 'warning',
  pending_approval: 'warning',
  'pending approval': 'warning',
  under_review: 'info',
  'under review': 'info',
  published: 'info',
  open: 'info',
  approved: 'success',
  accepted: 'success',
  completed: 'success',
  verified: 'success',
  awarded: 'success',
  paid: 'success',
  active: 'success',
  sent: 'success',
  delivered: 'success',
  rejected: 'error',
  declined: 'error',
  cancelled: 'error',
  expired: 'error',
  failed: 'error',
  in_progress: 'info',
  'in progress': 'info',
  'in-progress': 'info',
  partially_verified: 'warning',
  'partially verified': 'warning',
  partial: 'warning',
  converted_to_rfq: 'info',
  'converted to rfq': 'info',
  'converted to grn': 'info',
  under_evaluation: 'info',
  closed: 'default',
  finance_review: 'info',
  'finance review': 'info',
  final_approval: 'info',
  'final approval': 'info',
  not_sent: 'default',
  'not-started': 'default',
  pending_notification: 'warning',
  'pending notification': 'warning',
  notified: 'info',
  'pending_acceptance': 'warning',
  'pending-acceptance': 'warning',
  'pending-approval': 'warning',
  'pending-committee': 'warning',
  'fully-approved': 'success',
};

function getStatusColor(status) {
  const normalized = (status || '').toLowerCase().trim();
  return STATUS_COLORS[normalized] || 'default';
}

const MODULE_WIDGETS = [
  {
    key: 'projects',
    title: 'Projects',
    icon: Briefcase,
    color: 'info',
    href: '/dashboard/project-managements/',
    metrics: (k) => [
      { label: 'Active', value: k?.active },
      { label: 'Completed', value: k?.completed },
      { label: 'Delayed', value: k?.delayed },
    ],
  },
  {
    key: 'employees',
    title: 'HRM',
    icon: Users,
    color: 'secondary',
    href: '/dashboard/hrm',
    metrics: (k) => [
      { label: 'Employees', value: k?.total },
      { label: 'On Leave', value: k?.on_leave },
      { label: 'Present', value: k?.present },
    ],
  },
  {
    key: 'crm',
    title: 'CRM',
    icon: Target,
    color: 'error',
    href: '/dashboard/crm/leads/',
    metrics: (k) => [
      { label: 'Leads', value: k?.total_leads },
      { label: 'Won', value: k?.won },
      { label: 'Lost', value: k?.lost },
    ],
  },
  {
    key: 'inventory',
    title: 'Inventory',
    icon: Package,
    color: 'success',
    href: '/dashboard/store&inventory/dashboard/',
    metrics: (k) => [
      { label: 'Items', value: k?.total_items },
      { label: 'Low Stock', value: k?.low_stock },
      { label: 'Out of Stock', value: k?.out_of_stock },
    ],
  },
  {
    key: 'accounting',
    title: 'Accounting',
    icon: DollarSign,
    color: 'success',
    href: '/dashboard/accounting-finance/dashboard/',
    metrics: (k) => [
      { label: 'Revenue', value: k?.revenue, format: 'currency' },
      { label: 'Expense', value: k?.expense, format: 'currency' },
      { label: 'Balance', value: k?.balance, format: 'currency' },
    ],
  },
  {
    key: 'beneficiaries',
    title: 'Beneficiaries',
    icon: Heart,
    color: 'error',
    href: '/dashboard/beneficiaries/dashboard/',
    metrics: (k) => [
      { label: 'Total', value: k?.total },
      { label: 'Active', value: k?.active },
      { label: 'New This Month', value: k?.new_this_month },
    ],
  },
  {
    key: 'meetings',
    title: 'Meetings',
    icon: Calendar,
    color: 'info',
    href: '/dashboard/meeting-management/list/',
    metrics: (k) => [
      { label: 'Today', value: k?.today },
      { label: 'Upcoming', value: k?.upcoming },
      { label: 'Pending', value: k?.pending },
    ],
  },
  {
    key: 'tasks',
    title: 'Todo',
    icon: ClipboardList,
    color: 'warning',
    href: '/dashboard/todo/list/',
    metrics: (k) => [
      { label: 'Pending', value: k?.pending },
      { label: 'Completed', value: k?.completed },
      { label: "Today's", value: k?.today },
    ],
  },
  {
    key: 'movement_management',
    title: 'Movement',
    icon: Map,
    color: 'primary',
    href: '/dashboard/movement-management/',
    metrics: (k) => [
      { label: 'Total', value: k?.total },
      { label: 'Submitted', value: k?.submitted },
      { label: 'Approved', value: k?.approved },
    ],
  },
];

function WidgetCard({ widget, data }) {
  const theme = useTheme();
  const Icon = widget.icon;
  const metrics = widget.metrics(data);
  const paletteColor = theme.palette[widget.color]?.main || theme.palette.primary.main;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        borderLeft: `3px solid ${paletteColor}`,
        height: '100%',
      }}
    >
      <CardActionArea component={Link} href={widget.href} sx={{ p: 2, height: '100%' }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <Box sx={{ color: paletteColor, display: 'flex' }}>
            <Icon size={16} />
          </Box>
          <Typography variant="subtitle2" fontWeight={700}>
            {widget.title}
          </Typography>
        </Stack>
        <Stack spacing={0.75}>
          {metrics.map((metric) => (
            <Stack key={metric.label} direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                {metric.label}
              </Typography>
              <Typography variant="caption" fontWeight={700}>
                {metric.format === 'currency'
                  ? formatNumber(metric.value)
                  : formatNumber(metric.value)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </CardActionArea>
    </Card>
  );
}

function SubModuleSection({ config, data }) {
  const theme = useTheme();
  const Icon = config.icon;
  const paletteColor = theme.palette.warning.main;
  const statuses = data?.statuses || {};
  const total = data?.total || 0;
  const statusEntries = Object.entries(statuses).filter(([, v]) => v > 0);

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <Box sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(paletteColor, 0.12),
                color: paletteColor,
              }}
            >
              <Icon size={14} />
            </Box>
            <Typography variant="subtitle2" fontWeight={700}>
              {config.label}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip
              label={`${formatNumber(total)} total`}
              size="small"
              sx={{ fontWeight: 600, height: 22 }}
            />
            <CardActionArea
              component={Link}
              href={config.href}
              sx={{ borderRadius: 1, px: 1, py: 0.25, width: 'auto' }}
            >
              <Typography variant="caption" fontWeight={600} color="primary" whiteSpace="nowrap">
                View All
              </Typography>
            </CardActionArea>
          </Stack>
        </Stack>

        {statusEntries.length > 0 ? (
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            {statusEntries.map(([status, count]) => (
              <Chip
                key={status}
                label={`${status.replace(/_/g, ' ')}: ${count}`}
                size="small"
                color={getStatusColor(status)}
                variant="outlined"
                sx={{ fontWeight: 500, height: 24 }}
              />
            ))}
          </Stack>
        ) : (
          <Typography variant="caption" color="text.secondary">
            No records found
          </Typography>
        )}
      </Box>
    </Card>
  );
}

function ProcurementDialog({ open, onClose, data }) {
  const subModules = data?.sub_modules || {};

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha('#FF9F40', 0.12),
              color: '#FF9F40',
            }}
          >
            <FileText size={18} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Procurement Overview
            </Typography>
            <Typography variant="caption" color="text.secondary">
              All procurement modules and their statuses
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small">
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2}>
          {PROCUREMENT_SUB_MODULE_CONFIG.map((config) => (
            <SubModuleSection
              key={config.key}
              config={config}
              data={subModules[config.key]}
            />
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function ProcurementCard({ data }) {
  const theme = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const paletteColor = theme.palette.warning.main;

  const metrics = [
    { label: 'Pending', value: data?.pending },
    { label: 'Approved', value: data?.approved },
    { label: 'Rejected', value: data?.rejected },
  ];

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          borderLeft: `3px solid ${paletteColor}`,
          height: '100%',
        }}
      >
        <CardActionArea onClick={() => setDialogOpen(true)} sx={{ p: 2, height: '100%' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ color: paletteColor, display: 'flex' }}>
                <FileText size={16} />
              </Box>
              <Typography variant="subtitle2" fontWeight={700}>
                Procurement
              </Typography>
            </Stack>
            <Chip label="8 modules" size="small" color="warning" variant="outlined" sx={{ height: 20, fontWeight: 600 }} />
          </Stack>
          <Stack spacing={0.75}>
            {metrics.map((metric) => (
              <Stack key={metric.label} direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">
                  {metric.label}
                </Typography>
                <Typography variant="caption" fontWeight={700}>
                  {formatNumber(metric.value)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </CardActionArea>
      </Card>

      <ProcurementDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        data={data}
      />
    </>
  );
}

function WidgetSkeleton() {
  return (
    <Card variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
        <Skeleton variant="rounded" width={16} height={16} />
        <Skeleton width={80} height={20} />
      </Stack>
      <Stack spacing={0.75}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Stack key={i} direction="row" justifyContent="space-between">
            <Skeleton width={60} height={14} />
            <Skeleton width={30} height={14} />
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}

export default function ModuleOverviewWidgets({ kpis, isLoading }) {
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
        Module Overview
      </Typography>
      <Grid container spacing={2}>
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <WidgetSkeleton />
              </Grid>
            ))
          : (
            <>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ProcurementCard data={kpis?.procurement} />
              </Grid>
              {MODULE_WIDGETS.map((widget) => (
                <Grid key={widget.key} size={{ xs: 12, sm: 6, md: 4 }}>
                  <WidgetCard widget={widget} data={kpis?.[widget.key]} />
                </Grid>
              ))}
            </>
          )}
      </Grid>
    </Box>
  );
}
