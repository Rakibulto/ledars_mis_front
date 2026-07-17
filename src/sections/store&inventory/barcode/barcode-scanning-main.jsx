'use client';

import { toast } from 'sonner';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

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
  Divider,
  Tooltip,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

// ─── helpers ──────────────────────────────────────────────────────────────────

const norm = (v) =>
  String(v || '')
    .trim()
    .toLowerCase();
const fmtQty = (v) => Number(v || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 });
const fmtTime = (d) =>
  d.toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const STOCK_COLOR = {
  'in stock': 'success',
  'low stock': 'warning',
  'out of stock': 'error',
  overstock: 'secondary',
};
const stockColor = (s) => STOCK_COLOR[norm(s)] || 'default';

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, color, loading: busy }) {
  const theme = useTheme();
  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: 3,
        boxShadow: 'none',
        border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
        bgcolor: alpha(theme.palette[color].main, 0.04),
        height: '100%',
      }}
    >
      <Stack spacing={1.5}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette[color].main, 0.14),
            color: theme.palette[color].main,
          }}
        >
          <Iconify icon={icon} width={22} />
        </Box>
        {busy ? (
          <CircularProgress size={20} color={color} />
        ) : (
          <>
            <Typography variant="h4" fontWeight={800} color={`${color}.main`} lineHeight={1}>
              {value}
            </Typography>
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              {label}
            </Typography>
          </>
        )}
      </Stack>
    </Card>
  );
}

// ─── Scan Result Card ─────────────────────────────────────────────────────────

function ScanResultCard({ result, onClear }) {
  const theme = useTheme();
  if (!result) return null;

  if (result.type === 'error') {
    return (
      <Card
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
          bgcolor: alpha(theme.palette.error.main, 0.05),
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.error.main, 0.12),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'error.main',
              }}
            >
              <Iconify icon="solar:close-circle-bold-duotone" width={22} />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="error.main">
                No product found
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Barcode / code: <strong>{result.query}</strong>
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={onClear}>
            <Iconify icon="solar:close-circle-bold" width={18} />
          </IconButton>
        </Stack>
      </Card>
    );
  }

  const p = result.product;
  const color = stockColor(p.stock_status);

  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
        bgcolor: alpha(theme.palette.success.main, 0.04),
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2}>
        <Stack direction="row" alignItems="flex-start" gap={2} flex={1}>
          <Avatar
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              fontWeight: 800,
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {(p.name || '?')[0].toUpperCase()}
          </Avatar>
          <Box flex={1}>
            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
              <Typography variant="subtitle1" fontWeight={800}>
                {p.name || '—'}
              </Typography>
              <Chip
                label={p.stock_status || 'Unknown'}
                size="small"
                color={color}
                variant="soft"
                sx={{ fontWeight: 700, fontSize: 11 }}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Code: <strong>{p.code || '—'}</strong>
              {p.barcode ? (
                <>
                  &nbsp;·&nbsp;Barcode: <strong>{p.barcode}</strong>
                </>
              ) : null}
              {p.category_name || p.category ? (
                <>
                  &nbsp;·&nbsp;Category: <strong>{p.category_name || p.category}</strong>
                </>
              ) : null}
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {[
                {
                  label: 'On Hand',
                  value: fmtQty(p.on_hand),
                  icon: 'solar:box-bold-duotone',
                  color: 'success',
                },
                {
                  label: 'Available',
                  value: fmtQty(p.available),
                  icon: 'solar:check-circle-bold-duotone',
                  color: 'info',
                },
                {
                  label: 'Reorder Lvl',
                  value: fmtQty(p.reorder_level),
                  icon: 'solar:bell-bold-duotone',
                  color: 'warning',
                },
                {
                  label: 'Unit',
                  value: p.unit || '—',
                  icon: 'solar:ruler-bold-duotone',
                  color: 'primary',
                },
                {
                  label: 'Location',
                  value: p.location || '—',
                  icon: 'solar:map-point-bold-duotone',
                  color: 'secondary',
                },
              ].map((item) => (
                <Grid size={{ xs: 6, sm: 'auto' }} key={item.label}>
                  <Stack direction="row" alignItems="center" gap={0.75}>
                    <Iconify
                      icon={item.icon}
                      width={14}
                      sx={{ color: `${item.color}.main`, flexShrink: 0 }}
                    />
                    <Box>
                      <Typography variant="caption" color="text.disabled" lineHeight={1}>
                        {item.label}
                      </Typography>
                      <Typography variant="body2" fontWeight={700} lineHeight={1.3}>
                        {item.value}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClear} sx={{ flexShrink: 0 }}>
          <Iconify icon="solar:close-circle-bold" width={18} />
        </IconButton>
      </Stack>
    </Card>
  );
}

// ─── History Row ──────────────────────────────────────────────────────────────

function HistoryRow({ entry, onSelect }) {
  const theme = useTheme();
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1.5}
      onClick={() => entry.found && onSelect(entry.product)}
      sx={{
        px: 2,
        py: 1.2,
        cursor: entry.found ? 'pointer' : 'default',
        borderRadius: 1.5,
        '&:hover': entry.found ? { bgcolor: alpha(theme.palette.success.main, 0.05) } : {},
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: entry.found ? 'success.main' : 'error.main',
          flexShrink: 0,
        }}
      />
      <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0, width: 60 }}>
        {entry.time}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={600}
        flex={1}
        noWrap
        color={entry.found ? 'text.primary' : 'error.main'}
      >
        {entry.found ? entry.product.name : `Not found: ${entry.query}`}
      </Typography>
      {entry.found && (
        <Chip
          label={entry.product.stock_status || '?'}
          size="small"
          color={stockColor(entry.product.stock_status)}
          variant="soft"
          sx={{ fontSize: 10, height: 18, fontWeight: 700 }}
        />
      )}
    </Stack>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BarcodeScanningMain() {
  const theme = useTheme();
  const inputRef = useRef(null);

  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [tableSearch, setTableSearch] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const ROWS = 10;

  const { data: rawProducts, loading } = useGetRequest(
    `${endpoints.storeInventory.products}?page_size=1000`
  );
  const products = useMemo(
    () => (Array.isArray(rawProducts) ? rawProducts : (rawProducts?.results ?? [])),
    [rawProducts]
  );

  // auto-focus
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  // F9 global shortcut
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F9') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const stats = useMemo(
    () => ({
      total: products.length,
      inStock: products.filter((p) => norm(p.stock_status) === 'in stock').length,
      lowStock: products.filter((p) => norm(p.stock_status) === 'low stock').length,
      outOfStock: products.filter((p) => norm(p.stock_status) === 'out of stock').length,
      scanned: scanHistory.length,
    }),
    [products, scanHistory]
  );

  const doScan = useCallback(
    (raw) => {
      const query = raw.trim();
      if (!query) return;
      setScanInput('');
      const match = products.find(
        (p) =>
          norm(p.barcode) === norm(query) ||
          norm(p.code) === norm(query) ||
          norm(String(p.id)) === norm(query)
      );
      const entry = {
        id: Date.now(),
        time: fmtTime(new Date()),
        query,
        found: Boolean(match),
        product: match || null,
      };
      setScanHistory((prev) => [entry, ...prev].slice(0, 50));
      if (match) {
        setScanResult({ type: 'found', product: match });
        toast.success(`Found: ${match.name}`);
      } else {
        setScanResult({ type: 'error', query });
        toast.error(`No product matches "${query}"`);
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    [products]
  );

  const filtered = useMemo(() => {
    if (!tableSearch) return products;
    const t = norm(tableSearch);
    return products.filter(
      (p) =>
        norm(p.name).includes(t) ||
        norm(p.code).includes(t) ||
        norm(p.barcode).includes(t) ||
        norm(p.category_name || p.category).includes(t) ||
        norm(p.location).includes(t)
    );
  }, [products, tableSearch]);

  const paginated = filtered.slice((tablePage - 1) * ROWS, tablePage * ROWS);
  const pageCount = Math.ceil(filtered.length / ROWS);

  return (
    <Stack spacing={3} sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 3 }}>
      {/* Page header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
      >
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Barcode Scanning
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.3}>
            Scan or type a barcode / product code to look up stock instantly.
          </Typography>
        </Box>
        <Tooltip title="Press F9 to focus scanner at any time">
          <Chip
            icon={<Iconify icon="solar:keyboard-bold-duotone" width={14} />}
            label="F9 — Focus scanner"
            size="small"
            variant="soft"
            color="primary"
            sx={{ fontWeight: 600 }}
          />
        </Tooltip>
      </Stack>

      {/* KPI cards */}
      <Grid container spacing={2}>
        {[
          {
            icon: 'solar:box-bold-duotone',
            label: 'Total Products',
            value: stats.total,
            color: 'primary',
          },
          {
            icon: 'solar:check-circle-bold-duotone',
            label: 'In Stock',
            value: stats.inStock,
            color: 'success',
          },
          {
            icon: 'solar:danger-triangle-bold-duotone',
            label: 'Low Stock',
            value: stats.lowStock,
            color: 'warning',
          },
          {
            icon: 'solar:close-circle-bold-duotone',
            label: 'Out of Stock',
            value: stats.outOfStock,
            color: 'error',
          },
          {
            icon: 'solar:scanner-bold-duotone',
            label: 'Session Scans',
            value: stats.scanned,
            color: 'info',
          },
        ].map((kpi) => (
          <Grid size={{ xs: 6, sm: 4, md: 'grow' }} key={kpi.label}>
            <KpiCard {...kpi} loading={loading} />
          </Grid>
        ))}
      </Grid>

      {/* Scanner input */}
      <Card
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: `2px solid ${alpha(theme.palette.primary.main, 0.25)}`,
          bgcolor: alpha(theme.palette.primary.main, 0.02),
          boxShadow: 'none',
        }}
      >
        <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.main',
            }}
          >
            <Iconify icon="solar:scanner-bold-duotone" width={18} />
          </Box>
          <Typography variant="subtitle2" fontWeight={700}>
            Scan Barcode / Enter Product Code
          </Typography>
          <Chip
            label="Ready"
            color="success"
            size="small"
            variant="soft"
            sx={{ fontWeight: 700, ml: 'auto' }}
          />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}>
          <TextField
            inputRef={inputRef}
            fullWidth
            size="small"
            placeholder="Scan barcode or type product code, then press Enter…"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                doScan(scanInput);
              }
            }}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify
                    icon="solar:barcode-bold-duotone"
                    width={18}
                    sx={{ color: 'primary.main' }}
                  />
                </InputAdornment>
              ),
              sx: { fontFamily: 'monospace', letterSpacing: 1 },
            }}
          />
          <Button
            variant="contained"
            size="small"
            sx={{ px: 3, flexShrink: 0 }}
            onClick={() => doScan(scanInput)}
            disabled={!scanInput.trim()}
            startIcon={<Iconify icon="solar:magnifer-bold-duotone" width={16} />}
          >
            Search
          </Button>
          {scanResult && (
            <Button
              variant="outlined"
              size="small"
              color="inherit"
              sx={{ flexShrink: 0 }}
              onClick={() => {
                setScanResult(null);
                inputRef.current?.focus();
              }}
            >
              Clear
            </Button>
          )}
        </Stack>
      </Card>

      {/* Scan result */}
      {scanResult && (
        <ScanResultCard
          result={scanResult}
          onClear={() => {
            setScanResult(null);
            setTimeout(() => inputRef.current?.focus(), 80);
          }}
        />
      )}

      {/* Scan history + product table */}
      <Grid container spacing={2.5}>
        {/* History panel */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 'none',
              border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                px: 2.5,
                py: 1.8,
                borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.07)}`,
              }}
            >
              <Stack direction="row" alignItems="center" gap={1}>
                <Iconify icon="solar:history-bold-duotone" width={18} sx={{ color: 'info.main' }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Session History
                </Typography>
                {scanHistory.length > 0 && (
                  <Chip
                    label={scanHistory.length}
                    size="small"
                    color="info"
                    variant="soft"
                    sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                  />
                )}
              </Stack>
              {scanHistory.length > 0 && (
                <Tooltip title="Clear history">
                  <IconButton size="small" onClick={() => setScanHistory([])}>
                    <Iconify icon="solar:trash-bin-minimalistic-bold-duotone" width={16} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
            <Box sx={{ overflowY: 'auto', maxHeight: 420 }}>
              {scanHistory.length === 0 ? (
                <Box py={5} textAlign="center">
                  <Iconify
                    icon="solar:history-bold-duotone"
                    width={36}
                    sx={{ color: 'text.disabled', mb: 1 }}
                  />
                  <Typography variant="body2" color="text.disabled">
                    No scans yet this session
                  </Typography>
                </Box>
              ) : (
                <Stack
                  divider={
                    <Divider
                      sx={{
                        borderStyle: 'dashed',
                        mx: 2,
                        borderColor: alpha(theme.palette.text.primary, 0.05),
                      }}
                    />
                  }
                >
                  {scanHistory.map((entry) => (
                    <HistoryRow
                      key={entry.id}
                      entry={entry}
                      onSelect={(p) => setScanResult({ type: 'found', product: p })}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Product table */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 'none',
              border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ sm: 'center' }}
              justifyContent="space-between"
              gap={1}
              sx={{
                px: 2.5,
                py: 1.8,
                borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.07)}`,
              }}
            >
              <Stack direction="row" alignItems="center" gap={1}>
                <Iconify icon="solar:box-bold-duotone" width={18} sx={{ color: 'primary.main' }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Product Catalogue
                </Typography>
                <Chip
                  label={`${filtered.length} / ${products.length}`}
                  size="small"
                  variant="soft"
                  sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                />
              </Stack>
              <TextField
                size="small"
                placeholder="Search by name, code, barcode…"
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setTablePage(1);
                }}
                sx={{ width: { sm: 240 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify
                        icon="solar:magnifer-bold-duotone"
                        width={16}
                        sx={{ color: 'text.disabled' }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: tableSearch ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setTableSearch('');
                          setTablePage(1);
                        }}
                      >
                        <Iconify icon="solar:close-circle-bold" width={14} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.text.primary, 0.03) }}>
                    {[
                      'Code',
                      'Name',
                      'Barcode',
                      'Category',
                      'On Hand',
                      'Unit',
                      'Location',
                      'Status',
                    ].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700, py: 1.2, whiteSpace: 'nowrap' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={28} />
                      </TableCell>
                    </TableRow>
                  ) : paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <Iconify
                          icon="solar:inbox-bold-duotone"
                          width={36}
                          sx={{ color: 'text.disabled', display: 'block', mx: 'auto', mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {tableSearch
                            ? `No products match "${tableSearch}"`
                            : 'No products found.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((row) => (
                      <TableRow
                        key={row.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => setScanResult({ type: 'found', product: row })}
                      >
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {row.code || '—'}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            noWrap
                            sx={{ maxWidth: 160 }}
                          >
                            {row.name || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell
                          sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' }}
                        >
                          {row.barcode || '—'}
                        </TableCell>
                        <TableCell>{row.category_name || row.category || '—'}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700}>
                            {fmtQty(row.on_hand)}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.unit || '—'}</TableCell>
                        <TableCell>
                          <Typography
                            variant="caption"
                            noWrap
                            sx={{ maxWidth: 100, display: 'block' }}
                          >
                            {row.location || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.stock_status || 'Unknown'}
                            size="small"
                            color={stockColor(row.stock_status)}
                            variant="soft"
                            sx={{ fontWeight: 700, fontSize: 10 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {pageCount > 1 && (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  px: 2.5,
                  py: 1.5,
                  borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.07)}`,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {(tablePage - 1) * ROWS + 1}–{Math.min(tablePage * ROWS, filtered.length)} of{' '}
                  {filtered.length}
                </Typography>
                <Stack direction="row" gap={0.5}>
                  <IconButton
                    size="small"
                    disabled={tablePage === 1}
                    onClick={() => setTablePage((p) => p - 1)}
                  >
                    <Iconify icon="solar:alt-arrow-left-bold" width={16} />
                  </IconButton>
                  {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
                    const pg = tablePage <= 3 ? i + 1 : tablePage - 2 + i;
                    if (pg > pageCount) return null;
                    return (
                      <Button
                        key={pg}
                        size="small"
                        variant={pg === tablePage ? 'contained' : 'text'}
                        onClick={() => setTablePage(pg)}
                        sx={{ minWidth: 32, px: 0.5 }}
                      >
                        {pg}
                      </Button>
                    );
                  })}
                  <IconButton
                    size="small"
                    disabled={tablePage === pageCount}
                    onClick={() => setTablePage((p) => p + 1)}
                  >
                    <Iconify icon="solar:alt-arrow-right-bold" width={16} />
                  </IconButton>
                </Stack>
              </Stack>
            )}
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
