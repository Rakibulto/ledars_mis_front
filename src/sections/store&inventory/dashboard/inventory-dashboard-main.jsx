'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Table,
  Avatar,
  Button,
  Dialog,
  Divider,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmtQty = (v) => Number(v || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 });
const fmtCurrency = (v) =>
  `৳ ${Number(v || 0).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;
const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-BD', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const MOVE_COLORS = {
  Receipt: 'success',
  Delivery: 'error',
  Transfer: 'info',
  Return: 'warning',
  Scrap: 'default',
  Adjustment: 'secondary',
  'Status Change': 'primary',
};
const PALETTE = ['primary', 'success', 'warning', 'info', 'error', 'secondary'];

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color, onClick, loading: busy }) {
  const theme = useTheme();
  return (
    <Card
      onClick={onClick}
      sx={{
        p: 2.5,
        borderRadius: 3,
        boxShadow: 'none',
        border: `1px solid ${alpha(theme.palette[color].main, 0.18)}`,
        bgcolor: alpha(theme.palette[color].main, 0.03),
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.18s, transform 0.18s',
        '&:hover': onClick
          ? {
              boxShadow: `0 6px 24px ${alpha(theme.palette[color].main, 0.22)}`,
              transform: 'translateY(-2px)',
            }
          : {},
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          right: -20,
          top: -20,
          width: 90,
          height: 90,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette[color].main, 0.07),
        }}
      />
      <Stack spacing={1.5}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette[color].main, 0.14),
            color: theme.palette[color].main,
          }}
        >
          <Iconify icon={icon} width={24} />
        </Box>
        {busy ? (
          <CircularProgress size={20} color={color} />
        ) : (
          <>
            <Typography variant="h4" fontWeight={800} lineHeight={1} color={`${color}.main`}>
              {value}
            </Typography>
            <Box>
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {label}
              </Typography>
              {sub && (
                <Typography variant="caption" color="text.secondary">
                  {sub}
                </Typography>
              )}
            </Box>
          </>
        )}
      </Stack>
    </Card>
  );
}

// ─── Compact Location Row ─────────────────────────────────────────────────────

function LocationRow({ item, index, onClick, totalQty }) {
  const theme = useTheme();
  const color = PALETTE[index % PALETTE.length];
  const initials = (item.name || '?')
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1.5}
      onClick={onClick}
      sx={{
        px: 2,
        py: 1.4,
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'background 0.15s',
        '&:hover': { bgcolor: alpha(theme.palette[color].main, 0.06) },
      }}
    >
      <Avatar
        sx={{
          width: 34,
          height: 34,
          bgcolor: alpha(theme.palette[color].main, 0.14),
          color: theme.palette[color].main,
          fontWeight: 800,
          fontSize: 12,
        }}
      >
        {initials}
      </Avatar>

      <Box flex={1} minWidth={0}>
        <Typography variant="body2" fontWeight={700} noWrap>
          {item.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {[item.district, item.division].filter(Boolean).join(', ') || item.office_id || '—'}
        </Typography>
      </Box>

      <Stack alignItems="flex-end" gap={0.3}>
        <Chip
          label={item.status || 'active'}
          size="small"
          sx={{
            height: 18,
            fontSize: 10,
            fontWeight: 700,
            bgcolor: alpha(theme.palette[color].main, 0.12),
            color: theme.palette[color].main,
            textTransform: 'capitalize',
          }}
        />
        <Chip
          icon={<Iconify icon="solar:box-minimalistic-bold-duotone" width={11} />}
          label={totalQty !== undefined && totalQty !== null ? `${fmtQty(totalQty)} pcs` : '0 pcs'}
          size="small"
          sx={{
            height: 16,
            fontSize: 10,
            fontWeight: 600,
            bgcolor: alpha(theme.palette[color].main, 0.08),
            color: theme.palette[color].main,
            '& .MuiChip-icon': { color: theme.palette[color].main, ml: 0.5 },
          }}
        />
      </Stack>

      <Iconify
        icon="solar:alt-arrow-right-bold-duotone"
        width={16}
        sx={{ color: 'text.disabled', flexShrink: 0 }}
      />
    </Stack>
  );
}

// ─── Location Panel Card ──────────────────────────────────────────────────────

function LocationPanel({
  title,
  icon,
  color,
  items,
  loading: busy,
  onViewAll,
  onRowClick,
  emptyMsg,
  officeItemCountMap,
}) {
  const theme = useTheme();

  // total on-hand qty across all rows in this panel (for the header badge)
  const totalQty = useMemo(
    () => items.reduce((sum, it) => sum + (officeItemCountMap?.[it.id]?.on_hand_total ?? 0), 0),
    [items, officeItemCountMap]
  );

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: 'none',
        border: `1px solid ${alpha(theme.palette[color].main, 0.16)}`,
        overflow: 'hidden',
        height: '100%',
      }}
    >
      {/* header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2.5,
          py: 2,
          bgcolor: alpha(theme.palette[color].main, 0.05),
          borderBottom: `1px solid ${alpha(theme.palette[color].main, 0.1)}`,
        }}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette[color].main, 0.14),
              color: theme.palette[color].main,
            }}
          >
            <Iconify icon={icon} width={18} />
          </Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
          <Chip
            label={`${items.length} locations`}
            size="small"
            sx={{
              height: 18,
              fontSize: 10,
              fontWeight: 700,
              bgcolor: alpha(theme.palette[color].main, 0.12),
              color: theme.palette[color].main,
            }}
          />
          {totalQty > 0 && (
            <Chip
              icon={<Iconify icon="solar:box-minimalistic-bold-duotone" width={11} />}
              label={`${fmtQty(totalQty)} pcs total`}
              size="small"
              sx={{
                height: 18,
                fontSize: 10,
                fontWeight: 700,
                bgcolor: alpha(theme.palette[color].main, 0.08),
                color: theme.palette[color].main,
                '& .MuiChip-icon': { color: theme.palette[color].main, ml: 0.5 },
              }}
            />
          )}
        </Stack>
        <Button
          size="small"
          endIcon={<Iconify icon="solar:alt-arrow-right-bold-duotone" width={14} />}
          onClick={onViewAll}
          sx={{
            fontSize: 12,
            fontWeight: 600,
            color: theme.palette[color].main,
            '&:hover': { bgcolor: alpha(theme.palette[color].main, 0.08) },
          }}
        >
          View All
        </Button>
      </Stack>

      {/* body */}
      <Box>
        {busy ? (
          <Box py={4} textAlign="center">
            <CircularProgress size={26} color={color} />
          </Box>
        ) : items.length === 0 ? (
          <Box py={4} textAlign="center">
            <Iconify
              icon="solar:inbox-bold-duotone"
              width={36}
              sx={{ color: 'text.disabled', mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              {emptyMsg}
            </Typography>
          </Box>
        ) : (
          <Stack
            divider={
              <Divider
                sx={{
                  borderStyle: 'dashed',
                  mx: 2,
                  borderColor: alpha(theme.palette.text.primary, 0.06),
                }}
              />
            }
          >
            {items.map((item, idx) => (
              <LocationRow
                key={item.id}
                item={item}
                index={idx}
                onClick={() => onRowClick(item)}
                totalQty={officeItemCountMap?.[item.id]?.on_hand_total}
              />
            ))}
          </Stack>
        )}
      </Box>
    </Card>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, count, color }) {
  const theme = useTheme();
  return (
    <Stack direction="row" alignItems="center" gap={1.2} mb={2}>
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(theme.palette[color].main, 0.12),
          color: theme.palette[color].main,
        }}
      >
        <Iconify icon={icon} width={19} />
      </Box>
      <Typography variant="h6" fontWeight={700}>
        {title}
      </Typography>
      {count !== undefined && (
        <Chip
          label={count}
          size="small"
          sx={{
            fontWeight: 700,
            bgcolor: alpha(theme.palette[color].main, 0.12),
            color: theme.palette[color].main,
          }}
        />
      )}
    </Stack>
  );
}

// ─── Stock Detail Dialog ──────────────────────────────────────────────────────

function StockDetailDialog({ open, office, onClose }) {
  const theme = useTheme();
  const detailUrl =
    open && office
      ? `${endpoints.storeInventory.inventory_office_stock_detail}?office_id=${office.id}`
      : null;
  const { data: detailData, loading: detailLoading } = useGetRequest(detailUrl);
  const rows = Array.isArray(detailData) ? detailData : [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: 'primary.main',
            }}
          >
            <Iconify icon="solar:box-bold-duotone" width={20} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {office?.name || 'Stock Detail'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Products &amp; storage locations
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 0, px: 2, pb: 2 }}>
        {detailLoading ? (
          <Box py={6} textAlign="center">
            <CircularProgress size={32} />
          </Box>
        ) : rows.length === 0 ? (
          <Box py={6} textAlign="center">
            <Iconify
              icon="solar:inbox-bold-duotone"
              width={42}
              sx={{ color: 'text.disabled', mb: 1 }}
            />
            <Typography color="text.secondary">
              No stock records found for this location.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto', mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.text.primary, 0.04) }}>
                  {['#', 'Product Name', 'SKU', 'Location', 'Qty'].map((h) => (
                    <TableCell
                      key={h}
                      align={h === 'Qty' ? 'right' : 'left'}
                      sx={{ fontWeight: 700, py: 1.2, whiteSpace: 'nowrap' }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow key={row.product_id ?? idx} hover>
                    <TableCell sx={{ color: 'text.disabled', width: 40 }}>{idx + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 220 }}>
                        {row.product_name || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {row.sku || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {row.storage_location_name || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700} component="span">
                        {fmtQty(row.quantity)}
                      </Typography>
                      {row.unit && (
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          sx={{ ml: 0.5 }}
                        >
                          {row.unit}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <Chip
          label={`${rows.length} product${rows.length !== 1 ? 's' : ''}`}
          size="small"
          sx={{ mr: 'auto', fontWeight: 600 }}
        />
        <Button variant="outlined" size="small" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function InventoryDashboardMain() {
  const theme = useTheme();
  const router = useRouter();

  // ── dialog state ─────────────────────────────────────────────────────
  const [detailOffice, setDetailOffice] = useState(null);
  const handleRowClick = (office) => setDetailOffice(office);

  // ── fetches ──────────────────────────────────────────────────────────
  const { data: officeData, loading: officeLoading } = useGetRequest(
    `${endpoints.procurement_management.office_management}?type=office`
  );
  const { data: warehouseData, loading: warehouseLoading } = useGetRequest(
    `${endpoints.procurement_management.office_management}?type=warehouse`
  );
  const { data: overview, loading: overviewLoading } = useGetRequest(
    endpoints.storeInventory.inventory_dashboard_overview
  );
  const { data: itemsData, loading: itemsLoading } = useGetRequest(endpoints.storeInventory.items);
  const { data: officeItemCountsData } = useGetRequest(
    endpoints.storeInventory.inventory_office_item_counts
  );

  // ── derived ───────────────────────────────────────────────────────────
  const offices = useMemo(
    () => (Array.isArray(officeData) ? officeData : (officeData?.results ?? [])),
    [officeData]
  );
  const warehouses = useMemo(
    () => (Array.isArray(warehouseData) ? warehouseData : (warehouseData?.results ?? [])),
    [warehouseData]
  );
  const totals = useMemo(() => overview?.totals || {}, [overview]);
  const recentMoves = useMemo(
    () => (Array.isArray(overview?.recent_moves) ? overview.recent_moves : []),
    [overview]
  );

  const itemCount = useMemo(() => {
    if (Array.isArray(itemsData)) return itemsData.length;
    if (typeof itemsData?.count === 'number') return itemsData.count;
    if (Array.isArray(itemsData?.results)) return itemsData.results.length;
    return totals.total_products ?? 0;
  }, [itemsData, totals]);

  // total distinct office + warehouse locations
  const locationCount = useMemo(
    () => offices.length + warehouses.length,
    [offices.length, warehouses.length]
  );

  // ── map office_id → item count data (from FK-based endpoint) ─────────────
  const officeItemCountMap = useMemo(() => {
    const map = {};
    if (Array.isArray(officeItemCountsData)) {
      officeItemCountsData.forEach((row) => {
        if (row.office_id != null) map[row.office_id] = row;
      });
    }
    return map;
  }, [officeItemCountsData]);

  return (
    <>
      <Stack spacing={4} sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 3 }}>
        {/* ── Page title ───────────────────────────────────────────────── */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1}
        >
          <Box>
            <Typography variant="h5" fontWeight={800}>
              Store & Inventory Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.3}>
              Real-time overview of offices, warehouses, items and stock.
            </Typography>
          </Box>
          <Chip
            icon={<Iconify icon="solar:refresh-circle-bold-duotone" width={15} />}
            label="Live"
            size="small"
            color="success"
            variant="soft"
            sx={{ fontWeight: 700 }}
          />
        </Stack>

        {/* ── 6 KPI cards ─────────────────────────────────────────────── */}
        <Grid container spacing={2}>
          {[
            {
              icon: 'solar:buildings-2-bold-duotone',
              label: 'Total Offices',
              value: offices.length,
              sub: 'Field offices',
              color: 'primary',
              loading: officeLoading,
              href: paths.dashboard.storeInventory.officeLocations,
            },
            {
              icon: 'solar:warehouse-bold-duotone',
              label: 'Warehouses',
              value: warehouses.length,
              sub: 'Storage warehouses',
              color: 'info',
              loading: warehouseLoading,
              href: paths.dashboard.storeInventory.warehouses,
            },
            {
              icon: 'solar:box-bold-duotone',
              label: 'Total Items',
              value: itemCount,
              sub: 'Item master records',
              color: 'warning',
              loading: itemsLoading || overviewLoading,
              href: paths.dashboard.storeInventory.itemMaster,
            },
            {
              icon: 'solar:layers-bold-duotone',
              label: 'On Hand',
              value: fmtQty(totals.total_on_hand),
              sub: 'Units total',
              color: 'success',
              loading: overviewLoading,
            },
            {
              icon: 'solar:wallet-money-bold-duotone',
              label: 'Stock Value',
              value: fmtCurrency(totals.total_value),
              sub: 'Current valuation',
              color: 'error',
              loading: overviewLoading,
            },
            {
              icon: 'solar:pin-bold-duotone',
              label: 'Total Locations',
              value: locationCount,
              sub: 'Offices & warehouses',
              color: 'secondary',
              loading: officeLoading || warehouseLoading,
              href: paths.dashboard.storeInventory.officeLocations,
            },
          ].map((kpi) => (
            <Grid key={kpi.label} size={{ xs: 6, sm: 4, md: 2 }}>
              <KpiCard {...kpi} onClick={kpi.href ? () => router.push(kpi.href) : undefined} />
            </Grid>
          ))}
        </Grid>

        {/* ── Offices + Warehouses ─────────────────────────────────────── */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <LocationPanel
              title="Offices"
              icon="solar:buildings-2-bold-duotone"
              color="primary"
              items={offices}
              loading={officeLoading}
              onViewAll={() => router.push(paths.dashboard.storeInventory.officeLocations)}
              onRowClick={handleRowClick}
              emptyMsg="No offices found."
              officeItemCountMap={officeItemCountMap}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <LocationPanel
              title="Warehouses"
              icon="solar:warehouse-bold-duotone"
              color="info"
              items={warehouses}
              loading={warehouseLoading}
              onViewAll={() => router.push(paths.dashboard.storeInventory.warehouses)}
              onRowClick={handleRowClick}
              emptyMsg="No warehouses found."
              officeItemCountMap={officeItemCountMap}
            />
          </Grid>
        </Grid>

        {/* ── Recent stock moves ───────────────────────────────────────── */}
        <Box>
          <SectionHeader
            icon="solar:history-bold-duotone"
            title="Recent Stock Moves"
            count={recentMoves.length > 0 ? `Top ${recentMoves.length}` : undefined}
            color="secondary"
          />
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 'none',
              border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
              overflow: 'hidden',
            }}
          >
            {overviewLoading ? (
              <Box p={4} textAlign="center">
                <CircularProgress size={28} />
              </Box>
            ) : recentMoves.length === 0 ? (
              <Box p={4} textAlign="center">
                <Iconify
                  icon="solar:inbox-bold-duotone"
                  width={38}
                  sx={{ color: 'text.disabled', mb: 1 }}
                />
                <Typography color="text.secondary">No stock moves yet.</Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.text.primary, 0.04) }}>
                      {['Date', 'Reference', 'Product', 'Type', 'Qty', 'From → To'].map((h) => (
                        <TableCell
                          key={h}
                          align={h === 'Qty' ? 'right' : 'left'}
                          sx={{ fontWeight: 700, whiteSpace: 'nowrap', py: 1.4 }}
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentMoves.map((move) => (
                      <TableRow key={move.id} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                          {fmtDate(move.date)}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 500 }}>
                          {move.reference || '—'}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            noWrap
                            sx={{ maxWidth: 160 }}
                          >
                            {move.product_name || '—'}
                          </Typography>
                          {move.product_code && (
                            <Typography variant="caption" color="text.secondary">
                              {move.product_code}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={move.move_type}
                            size="small"
                            color={MOVE_COLORS[move.move_type] || 'default'}
                            variant="soft"
                            sx={{ fontWeight: 600, fontSize: 11 }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {fmtQty(move.quantity)}
                          {move.uom && (
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.secondary"
                              ml={0.5}
                            >
                              {move.uom}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell
                          sx={{ color: 'text.secondary', fontSize: 12, whiteSpace: 'nowrap' }}
                        >
                          {move.source_location || '—'} → {move.destination_location || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Card>
        </Box>
      </Stack>

      {/* ── Stock detail drill-down dialog ──────────────────────────── */}
      <StockDetailDialog
        open={Boolean(detailOffice)}
        office={detailOffice}
        onClose={() => setDetailOffice(null)}
      />
    </>
  );
}
