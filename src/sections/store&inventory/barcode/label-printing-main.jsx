'use client';

import JsBarcode from 'jsbarcode';
import React, { useRef, useMemo, useState, useEffect } from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Table,
  Button,
  Dialog,
  Select,
  Divider,
  Tooltip,
  Checkbox,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  InputLabel,
  Typography,
  DialogTitle,
  FormControl,
  DialogActions,
  DialogContent,
  InputAdornment,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

// ─── constants ────────────────────────────────────────────────────────────────

const LABEL_FORMATS = [
  { value: '58mm', label: '58mm Roll', desc: '58×40mm', width: 220, height: 155 },
  { value: '80mm', label: '80mm Roll', desc: '80×50mm', width: 302, height: 189 },
  { value: 'a4', label: 'A4 Grid', desc: '3×8 per page', width: 210, height: 99 },
];

const norm = (v) =>
  String(v || '')
    .trim()
    .toLowerCase();
const STOCK_COLOR = {
  'in stock': 'success',
  'low stock': 'warning',
  'out of stock': 'error',
  overstock: 'secondary',
};
const stockColor = (s) => STOCK_COLOR[norm(s)] || 'default';

// ─── Barcode SVG sticker ──────────────────────────────────────────────────────

function BarcodeSticker({ item, format, showName, showCode, showPrice }) {
  const svgRef = useRef(null);
  const fmt = LABEL_FORMATS.find((f) => f.value === format) || LABEL_FORMATS[0];

  useEffect(() => {
    if (!svgRef.current) return;
    const value = item.barcode || item.item_code || String(item.id);
    try {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        displayValue: false,
        width: format === 'a4' ? 1.2 : 1.6,
        height: format === 'a4' ? 32 : 40,
        margin: 0,
      });
    } catch {
      // ignore invalid barcode values
    }
  }, [item, format]);

  return (
    <Box
      sx={{
        width: fmt.width,
        minHeight: fmt.height,
        border: '1px solid #d1d5db',
        borderRadius: 1,
        p: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        bgcolor: '#fff',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      {showName && (
        <Typography
          sx={{
            fontSize: format === 'a4' ? 8 : 9,
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.2,
            maxWidth: '100%',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {item.item_name || item.name || ''}
        </Typography>
      )}
      <svg ref={svgRef} style={{ maxWidth: '100%' }} />
      {showCode && (
        <Typography
          sx={{ fontSize: format === 'a4' ? 7 : 8, fontFamily: 'monospace', letterSpacing: 1 }}
        >
          {item.barcode || item.item_code || ''}
        </Typography>
      )}
      {showPrice && item.unit_price && (
        <Typography sx={{ fontSize: format === 'a4' ? 7 : 9, fontWeight: 700 }}>
          BDT {Number(item.unit_price).toLocaleString('en-BD', { maximumFractionDigits: 2 })}
        </Typography>
      )}
    </Box>
  );
}

// ─── Print Preview Dialog ─────────────────────────────────────────────────────

function PrintPreviewDialog({ open, onClose, queue, format, showName, showCode, showPrice }) {
  const printAreaRef = useRef(null);

  const handlePrint = () => {
    const svgEls = printAreaRef.current?.querySelectorAll('svg');
    const svgContents = [];
    svgEls?.forEach((el) => {
      svgContents.push(el.outerHTML);
    });

    const isA4 = format === 'a4';
    const htmlLabels = queue
      .flatMap((entry) => Array.from({ length: entry.copies }, () => entry.item))
      .map((item, idx) => {
        const svgHtml = svgContents[idx] || '<svg/>';
        return `
          <div class="label">
            ${showName ? `<div class="name">${item.item_name || item.name || ''}</div>` : ''}
            ${svgHtml}
            ${showCode ? `<div class="code">${item.barcode || item.item_code || ''}</div>` : ''}
            ${showPrice && item.unit_price ? `<div class="price">BDT ${Number(item.unit_price).toLocaleString('en-BD', { maximumFractionDigits: 2 })}</div>` : ''}
          </div>`;
      })
      .join('');

    const css = isA4
      ? `
        body { margin:0; padding: 8mm; font-family: Arial, sans-serif; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
        .label { border:1px solid #ccc; border-radius:3px; padding:4mm 3mm; display:flex; flex-direction:column; align-items:center; gap:2mm; break-inside:avoid; }
        .name { font-size:7pt; font-weight:700; text-align:center; line-height:1.2; }
        .code { font-size:6pt; font-family:monospace; letter-spacing:1px; }
        .price { font-size:7pt; font-weight:700; }
        svg { max-width:100%; }
        @media print { body { margin:0; } }
      `
      : `
        body { margin: 0; padding: 3mm; font-family: Arial, sans-serif; }
        .grid { display: flex; flex-direction:column; gap:3mm; }
        .label { border:1px solid #ccc; border-radius:3px; padding:3mm; display:flex; flex-direction:column; align-items:center; gap:2mm; break-inside:avoid; width:${format === '58mm' ? '54mm' : '74mm'}; }
        .name { font-size:8pt; font-weight:700; text-align:center; line-height:1.2; }
        .code { font-size:7pt; font-family:monospace; }
        .price { font-size:8pt; font-weight:700; }
        svg { max-width:100%; }
        @media print { body { margin:0; } }
      `;

    const win = window.open('', '_blank', 'width=800,height=700');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html><head><title>Labels</title><style>${css}</style></head>
      <body><div class="grid">${htmlLabels}</div></body>
      </html>`);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 400);
  };

  const allItems = queue.flatMap((e) => Array.from({ length: e.copies }, () => e.item));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}
    >
      <DialogTitle
        sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1.5, pt: 2, px: 3 }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={1}>
            <Iconify icon="solar:printer-bold-duotone" width={22} sx={{ color: 'primary.main' }} />
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>
                Print Preview
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {allItems.length} label{allItems.length !== 1 ? 's' : ''} ·{' '}
                {LABEL_FORMATS.find((f) => f.value === format)?.label}
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={onClose}>
            <Iconify icon="solar:close-circle-bold" width={20} />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ p: 3, overflowY: 'auto' }}>
        <Box
          ref={printAreaRef}
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            justifyContent: format === 'a4' ? 'flex-start' : 'flex-start',
          }}
        >
          {allItems.map((item, idx) => (
            <BarcodeSticker
              key={`${item.id}-${idx}`}
              item={item}
              format={format}
              showName={showName}
              showCode={showCode}
              showPrice={showPrice}
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
        <Button variant="outlined" onClick={onClose} color="inherit">
          Close
        </Button>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:printer-bold-duotone" width={18} />}
          onClick={handlePrint}
        >
          Print {allItems.length} Label{allItems.length !== 1 ? 's' : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Queue Entry ──────────────────────────────────────────────────────────────

function QueueEntry({ entry, onCopiesChange, onRemove }) {
  const theme = useTheme();
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1.5}
      sx={{
        px: 2,
        py: 1.2,
        borderRadius: 1.5,
        '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.03) },
      }}
    >
      <Typography variant="body2" fontWeight={600} flex={1} noWrap>
        {entry.item.item_name || entry.item.name || '—'}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
        {entry.item.item_code || entry.item.barcode || '—'}
      </Typography>
      <Stack direction="row" alignItems="center" gap={0.5} sx={{ flexShrink: 0 }}>
        <IconButton size="small" onClick={() => onCopiesChange(Math.max(1, entry.copies - 1))}>
          <Iconify icon="solar:minus-circle-bold-duotone" width={16} />
        </IconButton>
        <Typography variant="body2" fontWeight={700} sx={{ width: 20, textAlign: 'center' }}>
          {entry.copies}
        </Typography>
        <IconButton size="small" onClick={() => onCopiesChange(Math.min(50, entry.copies + 1))}>
          <Iconify icon="solar:add-circle-bold-duotone" width={16} />
        </IconButton>
      </Stack>
      <Tooltip title="Remove from queue">
        <IconButton size="small" color="error" onClick={onRemove}>
          <Iconify icon="solar:trash-bin-minimalistic-bold-duotone" width={16} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, color }) {
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
        <Typography variant="h4" fontWeight={800} color={`${color}.main`} lineHeight={1}>
          {value}
        </Typography>
        <Typography variant="body2" fontWeight={600} color="text.secondary">
          {label}
        </Typography>
      </Stack>
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LabelPrintingMain() {
  const theme = useTheme();

  const [search, setSearch] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const [selected, setSelected] = useState([]); // ids of selected products
  const [queue, setQueue] = useState([]); // [{ item, copies }]
  const [format, setFormat] = useState('58mm');
  const [showName, setShowName] = useState(true);
  const [showCode, setShowCode] = useState(true);
  const [showPrice, setShowPrice] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const ROWS = 10;

  const { data: rawItems, loading } = useGetRequest(
    `${endpoints.storeInventory.items}?page_size=1000`
  );
  const items = useMemo(
    () => (Array.isArray(rawItems) ? rawItems : (rawItems?.results ?? [])),
    [rawItems]
  );

  const filtered = useMemo(() => {
    if (!search) return items;
    const t = norm(search);
    return items.filter(
      (it) =>
        norm(it.item_name || it.name).includes(t) ||
        norm(it.item_code).includes(t) ||
        norm(it.barcode).includes(t) ||
        norm(it.category).includes(t)
    );
  }, [items, search]);

  const paginated = filtered.slice((tablePage - 1) * ROWS, tablePage * ROWS);
  const pageCount = Math.ceil(filtered.length / ROWS);

  const stats = useMemo(
    () => ({
      total: items.length,
      queued: queue.length,
      totalLabels: queue.reduce((s, e) => s + e.copies, 0),
      inStock: items.filter((it) => norm(it.stock_status) === 'in stock').length,
    }),
    [items, queue]
  );

  // ── selection helpers ─────────────────────────────────────────────────────
  const allPageSelected = paginated.length > 0 && paginated.every((it) => selected.includes(it.id));
  const somePageSelected = paginated.some((it) => selected.includes(it.id));

  const toggleAll = () => {
    if (allPageSelected) {
      setSelected((prev) => prev.filter((id) => !paginated.map((it) => it.id).includes(id)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...paginated.map((it) => it.id)])]);
    }
  };

  const toggleOne = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // ── add selected to queue ────────────────────────────────────────────────
  const addToQueue = () => {
    const toAdd = items.filter(
      (it) => selected.includes(it.id) && !queue.find((e) => e.item.id === it.id)
    );
    if (toAdd.length === 0) return;
    setQueue((prev) => [...prev, ...toAdd.map((it) => ({ item: it, copies: 1 }))]);
    setSelected([]);
  };

  const updateCopies = (itemId, copies) => {
    setQueue((prev) => prev.map((e) => (e.item.id === itemId ? { ...e, copies } : e)));
  };

  const removeFromQueue = (itemId) => {
    setQueue((prev) => prev.filter((e) => e.item.id !== itemId));
  };

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
            Label Printing
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.3}>
            Select products, configure label format, then print barcode labels in bulk.
          </Typography>
        </Box>
        <Button
          variant="contained"
          disabled={queue.length === 0}
          startIcon={<Iconify icon="solar:printer-bold-duotone" width={18} />}
          onClick={() => setPreviewOpen(true)}
          sx={{ fontWeight: 700 }}
        >
          Preview & Print ({stats.totalLabels})
        </Button>
      </Stack>

      {/* KPI cards */}
      <Grid container spacing={2}>
        {[
          {
            icon: 'solar:box-bold-duotone',
            label: 'Total Items',
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
            icon: 'solar:tag-price-bold-duotone',
            label: 'In Print Queue',
            value: stats.queued,
            color: 'info',
          },
          {
            icon: 'solar:printer-bold-duotone',
            label: 'Total Labels',
            value: stats.totalLabels,
            color: 'warning',
          },
        ].map((kpi) => (
          <Grid size={{ xs: 6, md: 3 }} key={kpi.label}>
            <KpiCard {...kpi} />
          </Grid>
        ))}
      </Grid>

      {/* Main area: product selection + print queue */}
      <Grid container spacing={2.5}>
        {/* Product selection table */}
        <Grid size={{ xs: 12, lg: 8 }}>
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
                <Iconify icon="solar:list-bold-duotone" width={18} sx={{ color: 'primary.main' }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Product Catalogue
                </Typography>
                <Chip
                  label={`${filtered.length} / ${items.length}`}
                  size="small"
                  variant="soft"
                  sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                />
                {selected.length > 0 && (
                  <Chip
                    label={`${selected.length} selected`}
                    size="small"
                    color="primary"
                    variant="soft"
                    sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                  />
                )}
              </Stack>
              <Stack direction="row" gap={1}>
                {selected.length > 0 && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Iconify icon="solar:add-circle-bold-duotone" width={14} />}
                    onClick={addToQueue}
                    sx={{ fontWeight: 700 }}
                  >
                    Add {selected.length} to Queue
                  </Button>
                )}
                <TextField
                  size="small"
                  placeholder="Search items…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setTablePage(1);
                  }}
                  sx={{ width: { sm: 200 } }}
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
                    endAdornment: search ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSearch('');
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
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.text.primary, 0.03) }}>
                    <TableCell padding="checkbox" sx={{ pl: 2 }}>
                      <Checkbox
                        size="small"
                        indeterminate={somePageSelected && !allPageSelected}
                        checked={allPageSelected}
                        onChange={toggleAll}
                      />
                    </TableCell>
                    {['Name', 'Code / Barcode', 'Category', 'Unit', 'Stock', 'Status'].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700, py: 1.2, whiteSpace: 'nowrap' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={28} />
                      </TableCell>
                    </TableRow>
                  ) : paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                        <Iconify
                          icon="solar:inbox-bold-duotone"
                          width={36}
                          sx={{ color: 'text.disabled', display: 'block', mx: 'auto', mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {search ? `No items match "${search}"` : 'No items found.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((row) => {
                      const inQueue = queue.some((e) => e.item.id === row.id);
                      return (
                        <TableRow
                          key={row.id}
                          hover
                          selected={selected.includes(row.id)}
                          sx={{ opacity: inQueue ? 0.5 : 1 }}
                        >
                          <TableCell padding="checkbox" sx={{ pl: 2 }}>
                            <Checkbox
                              size="small"
                              checked={selected.includes(row.id)}
                              disabled={inQueue}
                              onChange={() => toggleOne(row.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              noWrap
                              sx={{ maxWidth: 180 }}
                            >
                              {row.item_name || row.name || '—'}
                            </Typography>
                            {inQueue && (
                              <Chip
                                label="In queue"
                                size="small"
                                color="info"
                                variant="soft"
                                sx={{ fontSize: 9, height: 16, mt: 0.3 }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="caption"
                              sx={{ fontFamily: 'monospace', display: 'block' }}
                            >
                              {row.item_code || '—'}
                            </Typography>
                            {row.barcode && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontFamily: 'monospace' }}
                              >
                                {row.barcode}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{row.category || '—'}</TableCell>
                          <TableCell>{row.unit || '—'}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={700}>
                              {Number(row.current_stock || 0).toLocaleString('en-BD', {
                                maximumFractionDigits: 2,
                              })}
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
                      );
                    })
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

        {/* Print queue + label options sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2}>
            {/* Label options */}
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: 'none',
                border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                p: 2.5,
              }}
            >
              <Stack direction="row" alignItems="center" gap={1} mb={2}>
                <Iconify
                  icon="solar:settings-bold-duotone"
                  width={18}
                  sx={{ color: 'info.main' }}
                />
                <Typography variant="subtitle2" fontWeight={700}>
                  Label Options
                </Typography>
              </Stack>
              <Stack spacing={2}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Format</InputLabel>
                  <Select value={format} label="Format" onChange={(e) => setFormat(e.target.value)}>
                    {LABEL_FORMATS.map((f) => (
                      <MenuItem key={f.value} value={f.value}>
                        <Stack>
                          <Typography variant="body2" fontWeight={700}>
                            {f.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {f.desc}
                          </Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Divider sx={{ borderStyle: 'dashed' }} />
                {[
                  { label: 'Show product name', value: showName, onChange: setShowName },
                  { label: 'Show barcode / code', value: showCode, onChange: setShowCode },
                  { label: 'Show unit price', value: showPrice, onChange: setShowPrice },
                ].map((opt) => (
                  <Stack
                    key={opt.label}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography variant="body2">{opt.label}</Typography>
                    <Box
                      component="input"
                      type="checkbox"
                      checked={opt.value}
                      onChange={(e) => opt.onChange(e.target.checked)}
                      sx={{
                        width: 16,
                        height: 16,
                        cursor: 'pointer',
                        accentColor: theme.palette.primary.main,
                      }}
                    />
                  </Stack>
                ))}
              </Stack>
            </Card>

            {/* Print queue */}
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
                  <Iconify
                    icon="solar:printer-bold-duotone"
                    width={18}
                    sx={{ color: 'warning.main' }}
                  />
                  <Typography variant="subtitle2" fontWeight={700}>
                    Print Queue
                  </Typography>
                  {queue.length > 0 && (
                    <Chip
                      label={queue.length}
                      size="small"
                      color="warning"
                      variant="soft"
                      sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                    />
                  )}
                </Stack>
                {queue.length > 0 && (
                  <Tooltip title="Clear queue">
                    <IconButton size="small" onClick={() => setQueue([])}>
                      <Iconify icon="solar:trash-bin-minimalistic-bold-duotone" width={16} />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>

              <Box sx={{ maxHeight: 320, overflowY: 'auto' }}>
                {queue.length === 0 ? (
                  <Box py={5} textAlign="center">
                    <Iconify
                      icon="solar:printer-bold-duotone"
                      width={36}
                      sx={{ color: 'text.disabled', mb: 1 }}
                    />
                    <Typography variant="body2" color="text.disabled">
                      Select products and click &ldquo;Add to Queue&rdquo;
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
                    {queue.map((entry) => (
                      <QueueEntry
                        key={entry.item.id}
                        entry={entry}
                        onCopiesChange={(n) => updateCopies(entry.item.id, n)}
                        onRemove={() => removeFromQueue(entry.item.id)}
                      />
                    ))}
                  </Stack>
                )}
              </Box>

              {queue.length > 0 && (
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
                    {stats.totalLabels} total label{stats.totalLabels !== 1 ? 's' : ''}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Iconify icon="solar:printer-bold-duotone" width={16} />}
                    onClick={() => setPreviewOpen(true)}
                    sx={{ fontWeight: 700 }}
                  >
                    Preview & Print
                  </Button>
                </Stack>
              )}
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Print preview dialog */}
      <PrintPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        queue={queue}
        format={format}
        showName={showName}
        showCode={showCode}
        showPrice={showPrice}
      />
    </Stack>
  );
}
