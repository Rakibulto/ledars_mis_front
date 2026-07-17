'use client';

import { useMemo, useState } from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Stack,
  Table,
  Button,
  Divider,
  TableRow,
  Collapse,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  LinearProgress,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const PERIOD_OPTIONS = [
  { value: 'daily', label: 'Daily', caption: 'Today', icon: 'solar:clock-circle-bold-duotone' },
  { value: 'weekly', label: 'Weekly', caption: 'This Week', icon: 'solar:calendar-bold-duotone' },
  {
    value: 'monthly',
    label: 'Monthly',
    caption: 'This Month',
    icon: 'solar:calendar-date-bold-duotone',
  },
  {
    value: 'yearly',
    label: 'Yearly',
    caption: 'This Year',
    icon: 'solar:calendar-search-bold-duotone',
  },
  {
    value: 'custom',
    label: 'Custom',
    caption: 'Date Range',
    icon: 'solar:calendar-add-bold-duotone',
  },
];

const TIMELINE_FILTER_OPTIONS = [
  { value: 'active', label: 'With Data' },
  { value: 'all', label: 'All Buckets' },
  { value: 'empty', label: 'No Data' },
];

function toNumber(value) {
  return Number(value || 0);
}

function formatCurrency(value) {
  return `BDT ${toNumber(value).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatQuantity(value) {
  return toNumber(value).toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatSignedQuantity(value) {
  const amount = toNumber(value);
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
  return `${sign}${Math.abs(amount).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatSignedCurrency(value) {
  const amount = toNumber(value);
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
  return `${sign}BDT ${Math.abs(amount).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDate(value, withTime = false) {
  if (!value) return 'Not recorded';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' } : {}),
  }).format(parsed);
}

function getMoveChipProps(moveType) {
  switch (String(moveType || '').trim()) {
    case 'Receipt':
    case 'Return':
      return { color: 'success', label: moveType };
    case 'Delivery':
    case 'Scrap':
      return { color: 'warning', label: moveType };
    case 'Transfer':
      return { color: 'info', label: moveType };
    case 'Adjustment':
      return { color: 'secondary', label: moveType };
    default:
      return { color: 'default', label: moveType || 'Movement' };
  }
}

function getDocumentStatusChipProps(status) {
  switch (
    String(status || '')
      .trim()
      .toLowerCase()
  ) {
    case 'issued':
    case 'approved':
    case 'posted':
    case 'received':
    case 'verified':
    case 'posted to stock':
      return { color: 'success', label: status };
    case 'pending approval':
    case 'pending quality check':
    case 'in transit':
      return { color: 'warning', label: status };
    case 'draft':
      return { color: 'default', label: status || 'Draft' };
    case 'cancelled':
    case 'declined':
      return { color: 'error', label: status };
    default:
      return { color: 'info', label: status || 'Unknown' };
  }
}

function getTimelineActivityCount(row) {
  return toNumber(row?.in_count) + toNumber(row?.out_count) + toNumber(row?.internal_count);
}

function hasTimelineBucketData(row) {
  return getTimelineActivityCount(row) > 0;
}

function SectionLabel({ children }) {
  return (
    <Typography
      variant="overline"
      sx={{ color: '#64748b', letterSpacing: 1.6, fontWeight: 700, display: 'block', mb: 1.5 }}
    >
      {children}
    </Typography>
  );
}

function MetricCard({ title, value, helper, icon, accent, loading, badge }) {
  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: alpha(accent, 0.2),
        boxShadow: 'none',
        background: `linear-gradient(160deg, ${alpha(accent, 0.09)} 0%, #ffffff 60%)`,
      }}
    >
      <Stack spacing={1.5} sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography
              variant="overline"
              sx={{ color: alpha('#0f172a', 0.6), letterSpacing: 1.1, fontSize: '0.68rem' }}
            >
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={800} color="#0f172a" sx={{ lineHeight: 1.15 }}>
              {loading ? <CircularProgress size={20} /> : value}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(accent, 0.14),
              color: accent,
              flexShrink: 0,
            }}
          >
            <Iconify icon={icon} width={22} />
          </Box>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
          {helper}
        </Typography>
        {badge && <Chip size="small" label={badge.label} color={badge.color} variant="soft" />}
      </Stack>
    </Card>
  );
}

function OperationModuleCard({ title, icon, accent, stats, loading }) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: alpha(accent, 0.2),
        boxShadow: 'none',
        height: '100%',
        background: `linear-gradient(160deg, ${alpha(accent, 0.07)} 0%, #fff 55%)`,
      }}
    >
      <Stack spacing={2} sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(accent, 0.14),
              color: accent,
              flexShrink: 0,
            }}
          >
            <Iconify icon={icon} width={20} />
          </Box>
          <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
            {title}
          </Typography>
        </Stack>
        <Stack spacing={1}>
          {stats.map((stat) => (
            <Stack
              key={stat.label}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="caption" color="text.secondary">
                {stat.label}
              </Typography>
              {loading ? (
                <Typography variant="caption" color="text.disabled">
                  —
                </Typography>
              ) : (
                <Typography variant="caption" fontWeight={700} color={stat.color || '#0f172a'}>
                  {stat.value}
                </Typography>
              )}
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}

function TimelineTable({ rows, loading, emptyMessage }) {
  const peakQuantity = useMemo(
    () =>
      Math.max(
        1,
        ...rows.map((row) => Math.max(toNumber(row.in_quantity), toNumber(row.out_quantity)))
      ),
    [rows]
  );

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Period</TableCell>
            <TableCell align="right">Stock In</TableCell>
            <TableCell align="right">Stock Out</TableCell>
            <TableCell align="right">Net Flow</TableCell>
            <TableCell sx={{ minWidth: 200 }}>Activity Bar</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                <CircularProgress size={24} />
              </TableCell>
            </TableRow>
          )}
          {!loading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => {
            const inRatio = (toNumber(row.in_quantity) / peakQuantity) * 100;
            const outRatio = (toNumber(row.out_quantity) / peakQuantity) * 100;
            const net = toNumber(row.net_quantity);
            return (
              <TableRow key={`${row.bucket_start}-${row.label}`} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={700} color="#0f172a">
                    {row.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatQuantity(getTimelineActivityCount(row))} moves
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={700} color="#0f766e">
                    {formatQuantity(row.in_quantity)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(row.in_value)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={700} color="#b45309">
                    {formatQuantity(row.out_quantity)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(row.out_value)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color={net >= 0 ? '#0f766e' : '#b91c1c'}
                  >
                    {formatSignedQuantity(net)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatSignedCurrency(row.net_value)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.75}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.65rem' }}
                        >
                          In
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.65rem' }}
                        >
                          {formatQuantity(row.in_quantity)}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, inRatio)}
                        sx={{
                          height: 6,
                          borderRadius: 999,
                          bgcolor: alpha('#0f766e', 0.1),
                          '& .MuiLinearProgress-bar': { borderRadius: 999, bgcolor: '#0f766e' },
                        }}
                      />
                    </Box>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.65rem' }}
                        >
                          Out
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.65rem' }}
                        >
                          {formatQuantity(row.out_quantity)}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, outRatio)}
                        sx={{
                          height: 6,
                          borderRadius: 999,
                          bgcolor: alpha('#d97706', 0.1),
                          '& .MuiLinearProgress-bar': { borderRadius: 999, bgcolor: '#d97706' },
                        }}
                      />
                    </Box>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function MovementProductPanel({ title, subtitle, rows, tone, emptyMessage }) {
  return (
    <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%' }}>
      <Stack spacing={2} sx={{ p: 2.5 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
        <Stack spacing={1.25}>
          {rows.map((row, idx) => (
            <Box
              key={`${title}-${row.product_id || idx}`}
              sx={{
                p: 1.75,
                borderRadius: 2.5,
                border: '1px solid #e2e8f0',
                bgcolor: alpha(tone, 0.04),
              }}
            >
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700} color="#0f172a" noWrap>
                    {idx + 1}. {row.product_name || 'Unnamed product'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.product_code || 'No code'} • {row.move_count || 0} move(s)
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Typography variant="body2" fontWeight={700} color={tone}>
                    {formatQuantity(row.quantity)} units
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(row.value)}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ))}
          {rows.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              {emptyMessage}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}

function DocumentFeedPanel({ title, subtitle, rows, tone, emptyMessage }) {
  return (
    <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%' }}>
      <Stack spacing={2} sx={{ p: 2.5 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
        <Stack spacing={1.25}>
          {rows.map((row) => {
            const statusChip = getDocumentStatusChipProps(row.status);
            return (
              <Box
                key={`${title}-${row.id}`}
                sx={{
                  p: 1.75,
                  borderRadius: 2.5,
                  border: '1px solid #e2e8f0',
                  bgcolor: alpha(tone, 0.04),
                }}
              >
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  spacing={1.5}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Typography variant="body2" fontWeight={700} color="#0f172a">
                        {row.reference || 'Document'}
                      </Typography>
                      <Chip
                        size="small"
                        color={statusChip.color}
                        label={statusChip.label}
                        variant="soft"
                      />
                    </Stack>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.4 }}
                    >
                      {row.context || 'Context not recorded'}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.25 }}
                    >
                      {formatDate(row.document_date)} • Logged {formatDate(row.created_at, true)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: { xs: 'left', md: 'right' }, flexShrink: 0 }}>
                    <Typography variant="body2" fontWeight={700} color={tone}>
                      {formatQuantity(row.quantity_total)} {row.quantity_label || 'Qty'}
                    </Typography>
                    {row.secondary_quantity_label && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.25 }}
                      >
                        {formatQuantity(row.secondary_quantity_total)}{' '}
                        {row.secondary_quantity_label}
                      </Typography>
                    )}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.25 }}
                    >
                      {formatQuantity(row.item_count)} item(s) • {formatCurrency(row.total_value)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            );
          })}
          {rows.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              {emptyMessage}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}

export default function InventoryLogAnalyticsMain() {
  useTheme();
  const [period, setPeriod] = useState('monthly');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [timelineFilter, setTimelineFilter] = useState('active');

  const analyticsUrl = useMemo(() => {
    const base = endpoints.storeInventory.inventory_log_analytics;
    const params = new URLSearchParams({ period });
    if (period === 'custom' && dateFrom && dateTo) {
      params.set('date_from', dateFrom);
      params.set('date_to', dateTo);
    }
    return `${base}?${params.toString()}`;
  }, [period, dateFrom, dateTo]);

  const { data, loading, error } = useGetRequest(analyticsUrl);

  const inventoryOverview = useMemo(() => data?.inventory_overview || {}, [data]);
  const movementSummary = useMemo(() => data?.movement_summary || {}, [data]);
  const movementMix = useMemo(() => data?.movement_mix || [], [data]);
  const movementTimeline = useMemo(() => data?.movement_timeline || [], [data]);
  const operationsSummary = useMemo(() => data?.operations_summary || {}, [data]);
  const ginOps = useMemo(() => operationsSummary?.gin || {}, [operationsSummary]);
  const stOps = useMemo(() => operationsSummary?.stock_transfer || {}, [operationsSummary]);
  const saOps = useMemo(() => operationsSummary?.stock_adjustment || {}, [operationsSummary]);
  const scrapOps = useMemo(() => operationsSummary?.scrap || {}, [operationsSummary]);
  const rrOps = useMemo(() => operationsSummary?.return_records || {}, [operationsSummary]);
  const rmOps = useMemo(() => operationsSummary?.return_management || {}, [operationsSummary]);
  const topInboundProducts = useMemo(() => data?.top_inbound_products || [], [data]);
  const topOutboundProducts = useMemo(() => data?.top_outbound_products || [], [data]);
  const stockStatusBreakdown = useMemo(() => data?.stock_status_breakdown || [], [data]);
  const categoryBreakdown = useMemo(() => data?.category_breakdown || [], [data]);
  const topInventory = useMemo(() => data?.top_inventory || [], [data]);
  const recentMoves = useMemo(() => data?.recent_moves || [], [data]);
  const latestGins = useMemo(() => data?.latest_gins || [], [data]);
  const latestGrns = useMemo(() => data?.latest_grns || [], [data]);
  const liveTransitCount = useMemo(() => toNumber(data?.live_transit_count), [data]);

  const timelineFilterCounts = useMemo(
    () => ({
      active: movementTimeline.filter(hasTimelineBucketData).length,
      all: movementTimeline.length,
      empty: movementTimeline.filter((row) => !hasTimelineBucketData(row)).length,
    }),
    [movementTimeline]
  );

  const filteredTimeline = useMemo(() => {
    if (timelineFilter === 'active') return movementTimeline.filter(hasTimelineBucketData);
    if (timelineFilter === 'empty')
      return movementTimeline.filter((r) => !hasTimelineBucketData(r));
    return movementTimeline;
  }, [movementTimeline, timelineFilter]);

  const timelineEmptyMsg = useMemo(() => {
    if (timelineFilter === 'active')
      return 'No timeline bucket with movement data for the selected period.';
    if (timelineFilter === 'empty') return 'Every timeline bucket has movement data.';
    return 'No stock movement available for the selected period.';
  }, [timelineFilter]);

  const mixPeak = useMemo(
    () => Math.max(1, ...movementMix.map((r) => toNumber(r.count))),
    [movementMix]
  );
  const categoryPeak = useMemo(
    () => Math.max(1, ...categoryBreakdown.map((r) => toNumber(r.stock_value))),
    [categoryBreakdown]
  );
  const currentPeriod = PERIOD_OPTIONS.find((o) => o.value === period) || PERIOD_OPTIONS[2];
  const netIsPositive = toNumber(movementSummary.net_value) >= 0;

  if (loading && (!data || Array.isArray(data) || Object.keys(data).length === 0)) {
    return (
      <Box sx={{ p: 4, minHeight: '50vh', display: 'grid', placeItems: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={36} sx={{ color: '#0f766e' }} />
          <Typography variant="body1" color="text.secondary">
            Loading inventory analytics…
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${alpha('#0f766e', 0.06)} 0%, ${alpha('#f59e0b', 0.03)} 30%, #f8fafc 100%)`,
      }}
    >
      <Stack spacing={3}>
        {/* HERO HEADER */}
        <Card
          sx={{
            borderRadius: 4,
            border: 'none',
            boxShadow: 'none',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #0c2340 0%, #0f4c75 40%, #0f766e 100%)',
          }}
        >
          <Grid container>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Stack spacing={3} sx={{ p: { xs: 3, md: 4 } }}>
                <Box>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: alpha('#f8fafc', 0.15),
                        display: 'grid',
                        placeItems: 'center',
                        color: '#f8fafc',
                      }}
                    >
                      <Iconify icon="solar:graph-up-bold-duotone" width={22} />
                    </Box>
                    <Chip
                      label="ERP Analytics"
                      size="small"
                      sx={{ bgcolor: alpha('#f59e0b', 0.25), color: '#fde68a', fontWeight: 700 }}
                    />
                  </Stack>
                  <Typography variant="h3" fontWeight={900} color="#f8fafc">
                    Inventory Analytics
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ mt: 1, maxWidth: 600, color: alpha('#f8fafc', 0.8) }}
                  >
                    Complete operational overview covering Goods Issue Notes, Internal Transfers,
                    Stock Adjustments, Scrap, and Return Management — across all inventory movement
                    operations.
                  </Typography>
                </Box>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {PERIOD_OPTIONS.map((option) => {
                      const selected = option.value === period;
                      return (
                        <Button
                          key={option.value}
                          onClick={() => setPeriod(option.value)}
                          variant={selected ? 'contained' : 'outlined'}
                          size="small"
                          startIcon={<Iconify icon={option.icon} width={16} />}
                          sx={{
                            borderRadius: 999,
                            px: 2,
                            color: selected ? '#0f172a' : '#f8fafc',
                            bgcolor: selected ? '#fde68a' : alpha('#ffffff', 0.1),
                            borderColor: alpha('#ffffff', selected ? 0 : 0.25),
                            fontWeight: selected ? 800 : 600,
                            '&:hover': {
                              bgcolor: selected ? '#fcd34d' : alpha('#ffffff', 0.18),
                              borderColor: alpha('#ffffff', 0.4),
                            },
                          }}
                        >
                          {option.label}
                        </Button>
                      );
                    })}
                  </Stack>
                  <Collapse in={period === 'custom'}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <TextField
                        type="date"
                        size="small"
                        label="From"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: alpha('#ffffff', 0.12),
                            color: '#f8fafc',
                            '& fieldset': { borderColor: alpha('#ffffff', 0.3) },
                            '&:hover fieldset': { borderColor: alpha('#ffffff', 0.5) },
                          },
                          '& .MuiInputLabel-root': { color: alpha('#f8fafc', 0.7) },
                          '& .MuiInputBase-input': { color: '#f8fafc' },
                        }}
                      />
                      <TextField
                        type="date"
                        size="small"
                        label="To"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: alpha('#ffffff', 0.12),
                            color: '#f8fafc',
                            '& fieldset': { borderColor: alpha('#ffffff', 0.3) },
                            '&:hover fieldset': { borderColor: alpha('#ffffff', 0.5) },
                          },
                          '& .MuiInputLabel-root': { color: alpha('#f8fafc', 0.7) },
                          '& .MuiInputBase-input': { color: '#f8fafc' },
                        }}
                      />
                    </Stack>
                  </Collapse>
                </Stack>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <Stack
                spacing={2}
                sx={{ p: { xs: 3, md: 4 }, height: '100%', justifyContent: 'center' }}
              >
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: alpha('#ffffff', 0.1),
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${alpha('#ffffff', 0.15)}`,
                  }}
                >
                  <Typography
                    variant="overline"
                    sx={{ color: alpha('#f8fafc', 0.7), letterSpacing: 1.1 }}
                  >
                    Active Window
                  </Typography>
                  <Typography variant="h5" fontWeight={800} color="#f8fafc">
                    {data?.period_label || currentPeriod.caption}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.75, color: alpha('#f8fafc', 0.75) }}>
                    {formatDate(data?.window_started_at)} – {formatDate(data?.window_ended_at)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: alpha('#f59e0b', 0.18),
                    border: `1px solid ${alpha('#f59e0b', 0.35)}`,
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: alpha('#f59e0b', 0.3),
                        display: 'grid',
                        placeItems: 'center',
                        color: '#fde68a',
                      }}
                    >
                      <Iconify icon="solar:delivery-bold-duotone" width={20} />
                    </Box>
                    <Box>
                      <Typography
                        variant="overline"
                        sx={{ color: alpha('#f8fafc', 0.7), letterSpacing: 1 }}
                      >
                        Live In Transit
                      </Typography>
                      <Typography variant="h5" fontWeight={800} color="#fde68a">
                        {loading ? '…' : liveTransitCount}
                      </Typography>
                    </Box>
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{ display: 'block', mt: 0.75, color: alpha('#f8fafc', 0.7) }}
                  >
                    Active stock transfers + return shipments in transit
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    label={`${formatQuantity(movementSummary.total_move_count)} movement(s)`}
                    size="small"
                    sx={{ bgcolor: alpha('#ffffff', 0.12), color: '#f8fafc' }}
                  />
                  <Chip
                    label={`Net ${formatSignedQuantity(movementSummary.net_quantity)} units`}
                    size="small"
                    sx={{ bgcolor: alpha('#ffffff', 0.12), color: '#f8fafc' }}
                  />
                  <Chip
                    label={`Avg idle ${data?.avg_days_since_movement || 0}d`}
                    size="small"
                    sx={{ bgcolor: alpha('#ffffff', 0.12), color: '#f8fafc' }}
                  />
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Card>

        {/* ERROR BANNER */}
        {error && (
          <Alert severity="error" sx={{ borderRadius: 3 }}>
            Inventory analytics could not be loaded. Please check your backend connection.
          </Alert>
        )}

        {/* PRIMARY KPI CARDS */}
        <Box>
          <SectionLabel>Inventory Overview</SectionLabel>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4, xl: 2 }}>
              <MetricCard
                title="Stocked Products"
                value={formatQuantity(inventoryOverview.stock_product_count)}
                helper={`${formatQuantity(inventoryOverview.total_on_hand_qty)} units on hand`}
                icon="solar:box-bold-duotone"
                accent="#0f766e"
                loading={loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, xl: 2 }}>
              <MetricCard
                title="Stock Value"
                value={formatCurrency(inventoryOverview.total_stock_value)}
                helper={`${formatQuantity(inventoryOverview.total_available_qty)} available`}
                icon="solar:wallet-money-bold-duotone"
                accent="#0369a1"
                loading={loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, xl: 2 }}>
              <MetricCard
                title="Total Stock In"
                value={formatQuantity(movementSummary.total_in_count)}
                helper={`${formatQuantity(movementSummary.total_in_quantity)} units • ${formatCurrency(movementSummary.total_in_value)}`}
                icon="solar:login-3-bold-duotone"
                accent="#15803d"
                loading={loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, xl: 2 }}>
              <MetricCard
                title="Total Stock Out"
                value={formatQuantity(movementSummary.total_out_count)}
                helper={`${formatQuantity(movementSummary.total_out_quantity)} units • ${formatCurrency(movementSummary.total_out_value)}`}
                icon="solar:logout-3-bold-duotone"
                accent="#d97706"
                loading={loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, xl: 2 }}>
              <MetricCard
                title="Live In Transit"
                value={liveTransitCount}
                helper={`${formatQuantity(stOps.in_transit || 0)} transfers + ${formatQuantity(rmOps.in_transit || 0)} returns`}
                icon="solar:delivery-bold-duotone"
                accent="#7c3aed"
                loading={loading}
                badge={
                  liveTransitCount > 0
                    ? { label: 'Active', color: 'warning' }
                    : { label: 'Clear', color: 'success' }
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, xl: 2 }}>
              <MetricCard
                title="Net Flow"
                value={formatSignedCurrency(movementSummary.net_value)}
                helper={`${formatSignedQuantity(movementSummary.net_quantity)} units in ${currentPeriod.caption.toLowerCase()}`}
                icon="solar:scale-bold-duotone"
                accent={netIsPositive ? '#0f766e' : '#b91c1c'}
                loading={loading}
              />
            </Grid>
          </Grid>
        </Box>

        {/* OPERATIONS SUMMARY */}
        <Box>
          <SectionLabel>
            Operations Summary — {data?.period_label || currentPeriod.caption}
          </SectionLabel>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <OperationModuleCard
                title="Goods Issue Note (GIN)"
                icon="solar:document-text-bold-duotone"
                accent="#d97706"
                loading={loading}
                stats={[
                  { label: 'Total Documents', value: formatQuantity(ginOps.total) },
                  {
                    label: `Period (${currentPeriod.caption})`,
                    value: formatQuantity(ginOps.period_total),
                    color: '#0369a1',
                  },
                  {
                    label: 'Issued (Period)',
                    value: formatQuantity(ginOps.period_issued),
                    color: '#15803d',
                  },
                  {
                    label: 'Issued Qty',
                    value: `${formatQuantity(ginOps.period_issued_qty)} units`,
                  },
                  {
                    label: 'Issued Value',
                    value: formatCurrency(ginOps.period_issued_value),
                    color: '#d97706',
                  },
                  {
                    label: 'Pending / Draft',
                    value: formatQuantity(ginOps.pending),
                    color: '#92400e',
                  },
                  { label: 'Cancelled', value: formatQuantity(ginOps.cancelled), color: '#991b1b' },
                ]}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <OperationModuleCard
                title="Internal Stock Transfers"
                icon="solar:transfer-horizontal-bold-duotone"
                accent="#7c3aed"
                loading={loading}
                stats={[
                  { label: 'Total Transfers', value: formatQuantity(stOps.total) },
                  {
                    label: `Period (${currentPeriod.caption})`,
                    value: formatQuantity(stOps.period_total),
                    color: '#0369a1',
                  },
                  {
                    label: 'Live in Transit',
                    value: formatQuantity(stOps.in_transit),
                    color: '#7c3aed',
                  },
                  { label: 'Completed', value: formatQuantity(stOps.received), color: '#15803d' },
                  { label: 'Draft', value: formatQuantity(stOps.draft), color: '#64748b' },
                  {
                    label: 'Period Value',
                    value: formatCurrency(stOps.period_value),
                    color: '#7c3aed',
                  },
                  { label: 'Cancelled', value: formatQuantity(stOps.cancelled), color: '#991b1b' },
                ]}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <OperationModuleCard
                title="Stock Adjustments"
                icon="solar:pen-2-bold-duotone"
                accent="#0369a1"
                loading={loading}
                stats={[
                  { label: 'Total Adjustments', value: formatQuantity(saOps.total) },
                  {
                    label: `Period (${currentPeriod.caption})`,
                    value: formatQuantity(saOps.period_total),
                    color: '#0369a1',
                  },
                  {
                    label: 'Posted (Period)',
                    value: formatQuantity(saOps.period_posted),
                    color: '#15803d',
                  },
                  {
                    label: 'Adj. In Qty (+)',
                    value: `+${formatQuantity(saOps.period_in_qty)}`,
                    color: '#15803d',
                  },
                  {
                    label: 'Adj. Out Qty (−)',
                    value: `-${formatQuantity(saOps.period_out_qty)}`,
                    color: '#b91c1c',
                  },
                  {
                    label: 'Adj. Value (Period)',
                    value: formatCurrency(saOps.period_value),
                    color: '#0369a1',
                  },
                  {
                    label: 'Pending Approval',
                    value: formatQuantity(saOps.pending),
                    color: '#92400e',
                  },
                ]}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <OperationModuleCard
                title="Scrap Management"
                icon="solar:trash-bin-minimalistic-bold-duotone"
                accent="#dc2626"
                loading={loading}
                stats={[
                  { label: 'Total Scrap Records', value: formatQuantity(scrapOps.total) },
                  {
                    label: `Period (${currentPeriod.caption})`,
                    value: formatQuantity(scrapOps.period_total),
                    color: '#0369a1',
                  },
                  {
                    label: 'Scrapped Qty (Period)',
                    value: `${formatQuantity(scrapOps.period_qty)} units`,
                    color: '#dc2626',
                  },
                  { label: 'Pending', value: formatQuantity(scrapOps.pending), color: '#92400e' },
                  { label: 'Approved', value: formatQuantity(scrapOps.approved), color: '#15803d' },
                  { label: '30-day Count', value: formatQuantity(data?.scrap_last_30_days) },
                ]}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <OperationModuleCard
                title="Return Records"
                icon="solar:arrow-left-up-bold-duotone"
                accent="#059669"
                loading={loading}
                stats={[
                  { label: 'Total Return Records', value: formatQuantity(rrOps.total) },
                  {
                    label: `Period (${currentPeriod.caption})`,
                    value: formatQuantity(rrOps.period_total),
                    color: '#0369a1',
                  },
                  {
                    label: 'Return Qty (Period)',
                    value: `${formatQuantity(rrOps.period_qty)} units`,
                    color: '#059669',
                  },
                  {
                    label: 'Customer Returns',
                    value: formatQuantity(rrOps.customer_returns),
                    color: '#0369a1',
                  },
                  {
                    label: 'Supplier Returns',
                    value: formatQuantity(rrOps.supplier_returns),
                    color: '#7c3aed',
                  },
                  { label: '30-day Count', value: formatQuantity(data?.returns_last_30_days) },
                ]}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <OperationModuleCard
                title="Return Management"
                icon="solar:undo-right-round-bold-duotone"
                accent="#0891b2"
                loading={loading}
                stats={[
                  { label: 'Total Returns', value: formatQuantity(rmOps.total) },
                  {
                    label: `Period (${currentPeriod.caption})`,
                    value: formatQuantity(rmOps.period_total),
                    color: '#0369a1',
                  },
                  {
                    label: 'In Transit',
                    value: formatQuantity(rmOps.in_transit),
                    color: '#7c3aed',
                  },
                  { label: 'Received', value: formatQuantity(rmOps.received), color: '#15803d' },
                  { label: 'Draft', value: formatQuantity(rmOps.draft), color: '#64748b' },
                  {
                    label: 'Received (Period)',
                    value: formatQuantity(rmOps.period_received),
                    color: '#15803d',
                  },
                ]}
              />
            </Grid>
          </Grid>
        </Box>

        {/* 30-DAY ROLLING ACTIVITY */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <Stack spacing={2.5} sx={{ p: 3 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                30-Day Rolling Activity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Operational movement counts across all modules in the last 30 days.
              </Typography>
            </Box>
            <Grid container spacing={1.5}>
              {[
                {
                  label: 'GRN Receipts',
                  value: data?.receipts_last_30_days,
                  color: '#15803d',
                  icon: 'solar:box-bold-duotone',
                },
                {
                  label: 'GIN Deliveries',
                  value: data?.deliveries_last_30_days,
                  color: '#d97706',
                  icon: 'solar:document-text-bold-duotone',
                },
                {
                  label: 'Transfers',
                  value: data?.transfers_last_30_days,
                  color: '#7c3aed',
                  icon: 'solar:transfer-horizontal-bold-duotone',
                },
                {
                  label: 'Adjustments',
                  value: data?.adjustments_last_30_days,
                  color: '#0369a1',
                  icon: 'solar:pen-2-bold-duotone',
                },
                {
                  label: 'Returns',
                  value: data?.returns_last_30_days,
                  color: '#059669',
                  icon: 'solar:arrow-left-up-bold-duotone',
                },
                {
                  label: 'Scraps',
                  value: data?.scrap_last_30_days,
                  color: '#dc2626',
                  icon: 'solar:trash-bin-minimalistic-bold-duotone',
                },
              ].map((item) => (
                <Grid key={item.label} size={{ xs: 6, sm: 4, md: 2 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      border: '1px solid #e2e8f0',
                      textAlign: 'center',
                      bgcolor: alpha(item.color, 0.05),
                    }}
                  >
                    <Box sx={{ color: item.color, mb: 0.5 }}>
                      <Iconify icon={item.icon} width={22} />
                    </Box>
                    <Typography variant="h5" fontWeight={800} color={item.color}>
                      {loading ? '—' : formatQuantity(item.value)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Card>

        {/* MOVEMENT TIMELINE + MIX */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Stack spacing={2.5} sx={{ p: 3 }}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  spacing={1.5}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                      Movement Timeline
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Stock in vs. stock out across the selected {period} window.
                    </Typography>
                  </Box>
                  <Stack spacing={1} alignItems={{ xs: 'stretch', md: 'flex-end' }}>
                    <Chip
                      label={`${data?.period_label || currentPeriod.caption} snapshot`}
                      color="info"
                      variant="soft"
                    />
                    <Stack
                      direction="row"
                      spacing={0.75}
                      flexWrap="wrap"
                      justifyContent={{ md: 'flex-end' }}
                      useFlexGap
                    >
                      {TIMELINE_FILTER_OPTIONS.map((opt) => {
                        const sel = opt.value === timelineFilter;
                        return (
                          <Button
                            key={opt.value}
                            size="small"
                            variant={sel ? 'contained' : 'outlined'}
                            onClick={() => setTimelineFilter(opt.value)}
                            sx={{
                              borderRadius: 999,
                              px: 1.5,
                              minWidth: 'auto',
                              borderColor: sel ? '#0f766e' : '#cbd5e1',
                              bgcolor: sel ? '#0f766e' : 'transparent',
                              color: sel ? '#f8fafc' : '#475569',
                            }}
                          >
                            {opt.label} ({timelineFilterCounts[opt.value]})
                          </Button>
                        );
                      })}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Showing {filteredTimeline.length} of {movementTimeline.length} bucket(s)
                    </Typography>
                  </Stack>
                </Stack>
                <TimelineTable
                  rows={filteredTimeline}
                  loading={loading}
                  emptyMessage={timelineEmptyMsg}
                />
              </Stack>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={3}>
              <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <Stack spacing={2} sx={{ p: 3 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                      Movement Mix
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Inbound, outbound, and internal breakdown.
                    </Typography>
                  </Box>
                  <Stack spacing={1.75}>
                    {movementMix.map((row) => (
                      <Box key={row.key}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" fontWeight={700} color="#0f172a">
                            {row.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatQuantity(row.count)} entries
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, (toNumber(row.count) / mixPeak) * 100)}
                          sx={{
                            mt: 0.75,
                            height: 7,
                            borderRadius: 999,
                            bgcolor: alpha('#0f172a', 0.07),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 999,
                              bgcolor:
                                row.key === 'stock_in'
                                  ? '#15803d'
                                  : row.key === 'stock_out'
                                    ? '#d97706'
                                    : '#7c3aed',
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.4 }}
                        >
                          {formatQuantity(row.quantity)} units • {formatCurrency(row.value)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </Card>
              <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <Stack spacing={2} sx={{ p: 3 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                      Stock Health
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Live inventory health indicators.
                    </Typography>
                  </Box>
                  <Stack spacing={1}>
                    {[
                      {
                        label: 'Low Stock Items',
                        value: data?.low_stock_items,
                        color: 'warning',
                        icon: 'solar:danger-circle-bold-duotone',
                      },
                      {
                        label: 'Out of Stock',
                        value: data?.out_of_stock_items,
                        color: 'error',
                        icon: 'solar:close-circle-bold-duotone',
                      },
                      {
                        label: 'Non-Moving (90d)',
                        value: data?.non_moving_items,
                        color: 'info',
                        icon: 'solar:sleeping-square-bold-duotone',
                      },
                      {
                        label: 'Expiring Soon',
                        value: data?.expiring_soon_items,
                        color: 'warning',
                        icon: 'solar:calendar-date-bold-duotone',
                      },
                    ].map((item) => (
                      <Alert
                        key={item.label}
                        severity={item.color}
                        icon={<Iconify icon={item.icon} width={18} />}
                        sx={{
                          borderRadius: 2,
                          py: 0.5,
                          '& .MuiAlert-message': {
                            display: 'flex',
                            justifyContent: 'space-between',
                            width: '100%',
                          },
                        }}
                      >
                        <Typography variant="body2">{item.label}</Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {loading ? '—' : formatQuantity(item.value)}
                        </Typography>
                      </Alert>
                    ))}
                  </Stack>
                  {stockStatusBreakdown.length > 0 && (
                    <>
                      <Divider />
                      <Stack spacing={1}>
                        {stockStatusBreakdown.map((row) => (
                          <Box
                            key={row.stock_status}
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="body2" fontWeight={700} color="#0f172a">
                                {row.stock_status}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatQuantity(row.sku_count)} SKU(s)
                              </Typography>
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              {formatQuantity(row.on_hand)} units •{' '}
                              {formatCurrency(row.stock_value)}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </>
                  )}
                </Stack>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        {/* TOP PRODUCTS */}
        <Box>
          <SectionLabel>Product Movement Leaders</SectionLabel>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <MovementProductPanel
                title="Top Inbound Products"
                subtitle="Highest inbound quantity and value in the selected window."
                rows={topInboundProducts}
                tone="#15803d"
                emptyMessage="No inbound product movement available for the selected period."
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <MovementProductPanel
                title="Top Outbound Products"
                subtitle="Products driving the most outbound quantity and value."
                rows={topOutboundProducts}
                tone="#d97706"
                emptyMessage="No outbound product movement available for the selected period."
              />
            </Grid>
          </Grid>
        </Box>

        {/* CATEGORY BREAKDOWN + INVENTORY EXPOSURE */}
        <Grid container spacing={3}>
          {categoryBreakdown.length > 0 && (
            <Grid size={{ xs: 12, lg: 6 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  border: '1px solid #e2e8f0',
                  boxShadow: 'none',
                  height: '100%',
                }}
              >
                <Stack spacing={2} sx={{ p: 3 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                      Category Breakdown
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Stock value distribution by product category.
                    </Typography>
                  </Box>
                  <Stack spacing={1.5}>
                    {categoryBreakdown.map((row) => (
                      <Box key={row.category_name}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={700} color="#0f172a">
                            {row.category_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatQuantity(row.sku_count)} SKU(s) • {formatQuantity(row.on_hand)}{' '}
                            units
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box sx={{ flex: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(
                                100,
                                (toNumber(row.stock_value) / categoryPeak) * 100
                              )}
                              sx={{
                                height: 7,
                                borderRadius: 999,
                                bgcolor: alpha('#0369a1', 0.1),
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 999,
                                  bgcolor: '#0369a1',
                                },
                              }}
                            />
                          </Box>
                          <Typography
                            variant="caption"
                            fontWeight={700}
                            color="#0369a1"
                            sx={{ flexShrink: 0 }}
                          >
                            {formatCurrency(row.stock_value)}
                          </Typography>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </Card>
            </Grid>
          )}
          <Grid size={{ xs: 12, lg: categoryBreakdown.length > 0 ? 6 : 12 }}>
            <Card
              sx={{
                borderRadius: 3,
                border: '1px solid #e2e8f0',
                boxShadow: 'none',
                height: '100%',
              }}
            >
              <Stack spacing={2} sx={{ p: 3 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                    Top Inventory Exposure
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Products holding the highest current on-hand value.
                  </Typography>
                </Box>
                <Stack spacing={1.25}>
                  {topInventory.map((row) => (
                    <Box
                      key={row.product_id}
                      sx={{
                        p: 1.75,
                        borderRadius: 2.5,
                        border: '1px solid #e2e8f0',
                        bgcolor: alpha('#0369a1', 0.04),
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" spacing={2}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={700} color="#0f172a" noWrap>
                            {row.product_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.product_code} • {formatQuantity(row.on_hand)} on hand •{' '}
                            {row.stock_status}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color="#0369a1"
                          sx={{ flexShrink: 0 }}
                        >
                          {formatCurrency(row.inventory_value)}
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                  {topInventory.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No inventory valuation records available.
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </Card>
          </Grid>
        </Grid>

        {/* RECENT ACTIVITY FEED */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <Stack spacing={2} sx={{ p: 3 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                Recent Activity Feed
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Latest stock movements across all operation types in the selected window.
              </Typography>
            </Box>
            <Grid container spacing={1.5}>
              {recentMoves.map((move) => {
                const moveChip = getMoveChipProps(move.move_type);
                return (
                  <Grid key={move.id} size={{ xs: 12, md: 6 }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        border: '1px solid #e2e8f0',
                        bgcolor: '#fcfcfd',
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" spacing={2}>
                        <Box sx={{ minWidth: 0 }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            flexWrap="wrap"
                            useFlexGap
                          >
                            <Typography variant="body2" fontWeight={700} color="#0f172a" noWrap>
                              {move.reference || 'Inventory movement'}
                            </Typography>
                            <Chip
                              size="small"
                              color={moveChip.color}
                              label={moveChip.label}
                              variant="soft"
                            />
                          </Stack>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 0.4 }}
                          >
                            {move.product_name || 'Unknown product'} •{' '}
                            {move.done_by_name || 'System'}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 0.25 }}
                          >
                            {move.source_location || 'Origin'} →{' '}
                            {move.destination_location || 'Destination'}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                          <Typography variant="body2" fontWeight={700} color="#0f172a">
                            {formatQuantity(move.quantity)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(move.date, true)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Grid>
                );
              })}
              {recentMoves.length === 0 && (
                <Grid size={12}>
                  <Typography variant="body2" color="text.secondary">
                    No recent activity available for the selected window.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Stack>
        </Card>

        {/* DOCUMENT FEEDS */}
        <Box>
          <SectionLabel>Latest Document Activity</SectionLabel>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <DocumentFeedPanel
                title="Latest GIN Documents"
                subtitle="Recent goods issue notes from the GIN module."
                rows={latestGins}
                tone="#d97706"
                emptyMessage="No goods issue notes available for analytics."
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <DocumentFeedPanel
                title="Latest GRN Documents"
                subtitle="Recent goods receipt notes from the procurement module."
                rows={latestGrns}
                tone="#15803d"
                emptyMessage="No goods receipt notes available for analytics."
              />
            </Grid>
          </Grid>
        </Box>

        {/* FOOTER SUMMARY */}
        <Card
          sx={{
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            boxShadow: 'none',
            bgcolor: '#f8fafc',
          }}
        >
          <Stack spacing={2} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
              Period Summary — {data?.period_label || currentPeriod.caption}
            </Typography>
            <Grid container spacing={2}>
              {[
                {
                  label: 'Total SKUs',
                  value: formatQuantity(data?.total_skus),
                  icon: 'solar:box-bold-duotone',
                  color: '#0f766e',
                },
                {
                  label: 'Active SKUs',
                  value: formatQuantity(data?.active_skus),
                  icon: 'solar:check-circle-bold-duotone',
                  color: '#15803d',
                },
                {
                  label: 'Total Stock Value',
                  value: formatCurrency(data?.total_stock_value),
                  icon: 'solar:wallet-money-bold-duotone',
                  color: '#0369a1',
                },
                {
                  label: 'On Hand Qty',
                  value: formatQuantity(data?.total_on_hand_qty),
                  icon: 'solar:layers-bold-duotone',
                  color: '#7c3aed',
                },
                {
                  label: 'Available Qty',
                  value: formatQuantity(data?.total_available_qty),
                  icon: 'solar:shield-check-bold-duotone',
                  color: '#059669',
                },
                {
                  label: 'Avg Days Idle',
                  value: `${data?.avg_days_since_movement || 0} day(s)`,
                  icon: 'solar:clock-circle-bold-duotone',
                  color: '#92400e',
                },
              ].map((item) => (
                <Grid key={item.label} size={{ xs: 6, sm: 4, md: 2 }}>
                  <Stack
                    spacing={0.5}
                    alignItems="center"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: '#fff',
                      border: '1px solid #e2e8f0',
                      textAlign: 'center',
                    }}
                  >
                    <Box sx={{ color: item.color }}>
                      <Iconify icon={item.icon} width={20} />
                    </Box>
                    <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                      {loading ? '—' : item.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Card>
      </Stack>
    </Box>
  );
}
