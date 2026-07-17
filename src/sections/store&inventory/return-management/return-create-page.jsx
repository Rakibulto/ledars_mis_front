'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  Chip,
  Step,
  Alert,
  Paper,
  Stack,
  Table,
  Button,
  Divider,
  Stepper,
  Tooltip,
  TableRow,
  StepLabel,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Typography,
  CardContent,
  Autocomplete,
  InputAdornment,
  TableContainer,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest, extractErrorMessage } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const EP = endpoints.storeInventory;

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  {
    label: 'Return Type',
    desc: 'Select whether you are returning project-issued items or internal transfer items.',
  },
  {
    label: 'Source Document',
    desc: 'Select the original GIN or Internal Transfer document that contains the items to be returned.',
  },
  {
    label: 'Review & Submit',
    desc: 'Review the selected items, quantities, and office information before saving the return.',
  },
];

const RETURN_TYPES = [
  {
    value: 'project_return',
    label: 'Project Item Return',
    shortLabel: 'Project Return',
    description: 'Return unused items issued to a project through a Goods Issue Note (GIN).',
    icon: 'solar:folder-with-files-bold-duotone',
    color: 'primary',
  },
  {
    value: 'internal_transfer_return',
    label: 'Internal Transfer Return',
    shortLabel: 'Transfer Return',
    description:
      'Return items previously received from another office through an Internal Transfer.',
    icon: 'solar:delivery-bold-duotone',
    color: 'warning',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getDocInfo(returnType, doc) {
  if (!doc) return null;
  if (returnType === 'project_return') {
    return {
      number: doc.gin_number || `GIN #${doc.id}`,
      date: doc.issue_date,
      dateLabel: 'Issue Date',
      from: doc.issued_to || doc.project || '—',
      fromLabel: 'Returning From (Project Site)',
      to: doc.office_location_name || doc.issue_from || '—',
      toLabel: 'Returning To (Office)',
      totalQty: doc.issued_qty_total ?? null,
      totalItems: doc.item_count ?? null,
    };
  }
  return {
    number: doc.transfer_number || `IT #${doc.id}`,
    date: doc.transfer_date,
    dateLabel: 'Transfer Date',
    from: doc.to_office_name || String(doc.to_office || '') || '—',
    fromLabel: 'Returning From (Current Holder)',
    to: doc.from_office_name || String(doc.from_office || '') || '—',
    toLabel: 'Returning To (Origin Office)',
    totalQty: null,
    totalItems: null,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReturnTypeCards({ value, onChange }) {
  const theme = useTheme();
  return (
    <Stack spacing={2}>
      {RETURN_TYPES.map((opt) => {
        const selected = value === opt.value;
        const color = theme.palette[opt.color];
        return (
          <Paper
            key={opt.value}
            variant="outlined"
            onClick={() => onChange(opt.value)}
            sx={{
              p: 3,
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              borderWidth: 2,
              borderColor: selected ? color.main : 'divider',
              bgcolor: selected ? alpha(color.main, 0.06) : 'background.paper',
              '&:hover': {
                borderColor: color.main,
                bgcolor: alpha(color.main, 0.04),
                transform: 'translateY(-1px)',
                boxShadow: theme.shadows[2],
              },
            }}
          >
            <Stack direction="row" alignItems="flex-start" spacing={2}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: selected
                    ? alpha(color.main, 0.16)
                    : alpha(theme.palette.text.secondary, 0.08),
                  flexShrink: 0,
                }}
              >
                <Iconify
                  icon={opt.icon}
                  width={28}
                  sx={{ color: selected ? color.main : 'text.secondary' }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    color={selected ? color.main : 'text.primary'}
                  >
                    {opt.label}
                  </Typography>
                  {selected && (
                    <Iconify icon="solar:check-circle-bold" width={22} sx={{ color: color.main }} />
                  )}
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {opt.description}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}

function DocSelector({ returnType, selected, onSelect }) {
  const url =
    returnType === 'project_return'
      ? `${EP.gin}?status=Issued&page_size=100`
      : `${EP.internal_transfers}?status=Received&page_size=100`;

  const { data: raw, loading } = useGetRequest(url);
  const options = useMemo(
    () => (Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []),
    [raw]
  );

  const getLabel = (o) =>
    returnType === 'project_return'
      ? `${o.gin_number || o.id}  —  ${o.project || o.issued_to || ''}`
      : `${o.transfer_number || o.id}  —  ${o.from_office_name || ''}  →  ${o.to_office_name || ''}`;

  return (
    <Autocomplete
      loading={loading}
      options={options}
      value={selected}
      onChange={(_, v) => onSelect(v)}
      getOptionLabel={getLabel}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      renderInput={(params) => (
        <TextField
          {...params}
          label={returnType === 'project_return' ? 'Search GIN Number' : 'Search Transfer Number'}
          placeholder={returnType === 'project_return' ? 'e.g. GIN-2026-004' : 'e.g. IT-2026-0009'}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <InputAdornment position="start">
                  <Iconify icon="solar:magnifer-bold" width={18} sx={{ color: 'text.disabled' }} />
                </InputAdornment>
                {params.InputProps.startAdornment}
              </>
            ),
          }}
        />
      )}
      noOptionsText={loading ? 'Loading documents…' : 'No eligible documents found.'}
    />
  );
}

function DirectionCard({ returnType, doc }) {
  const theme = useTheme();
  const info = getDocInfo(returnType, doc);
  if (!info) return null;
  const typeConfig = RETURN_TYPES.find((t) => t.value === returnType);
  const color = theme.palette[typeConfig?.color || 'primary'];

  return (
    <Paper
      variant="outlined"
      sx={{ borderRadius: 2, overflow: 'hidden', borderColor: alpha(color.main, 0.3) }}
    >
      {/* Doc header bar */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          bgcolor: alpha(color.main, 0.06),
          borderBottom: `1px solid ${alpha(color.main, 0.15)}`,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Iconify icon="solar:document-bold-duotone" width={22} sx={{ color: color.main }} />
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                {info.number}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {info.dateLabel}: {fmtDate(info.date)}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            {info.totalItems !== null && (
              <Chip
                size="small"
                label={`${info.totalItems} item${info.totalItems !== 1 ? 's' : ''}`}
                color={typeConfig?.color}
                variant="soft"
              />
            )}
            {info.totalQty !== null && (
              <Chip size="small" label={`${info.totalQty} pcs issued`} variant="soft" />
            )}
          </Stack>
        </Stack>
      </Box>
      {/* Direction row */}
      <Stack direction={{ xs: 'column', sm: 'row' }}>
        <Box sx={{ flex: 1, p: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <Iconify
              icon="solar:map-point-wave-bold-duotone"
              width={16}
              sx={{ color: 'text.disabled' }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              textTransform="uppercase"
              letterSpacing={0.6}
            >
              {info.fromLabel}
            </Typography>
          </Stack>
          <Typography variant="body1" fontWeight={700}>
            {info.from}
          </Typography>
        </Box>
        <Stack alignItems="center" justifyContent="center" sx={{ px: 1, py: { xs: 0, sm: 2 } }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(color.main, 0.1),
            }}
          >
            <Iconify icon="solar:arrow-right-bold" width={18} sx={{ color: color.main }} />
          </Box>
        </Stack>
        <Box sx={{ flex: 1, p: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <Iconify
              icon="solar:buildings-bold-duotone"
              width={16}
              sx={{ color: 'text.disabled' }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              textTransform="uppercase"
              letterSpacing={0.6}
            >
              {info.toLabel}
            </Typography>
          </Stack>
          <Typography variant="body1" fontWeight={700}>
            {info.to}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function ItemsTable({ returnType, sourceDoc, lines, setLines }) {
  const sourceLines =
    returnType === 'project_return'
      ? sourceDoc?.line_items || sourceDoc?.lines || []
      : sourceDoc?.transfer_lines || sourceDoc?.lines || [];

  const syncFromSource = () => {
    setLines(
      sourceLines.map((sl) => {
        const itemName =
          sl.item_name || sl.product_name || sl.item?.name || sl.product?.name || 'Unknown Item';
        const itemCode = sl.item_code || sl.product_code || sl.item?.code || sl.product?.code || '';
        const itemId = sl.item || sl.product || sl.item_id || sl.product_id || null;
        const unitName = sl.unit || sl.unit_name || sl.uom || '';
        const issuedQty = Number(
          sl.issued_qty || sl.quantity || sl.issued_quantity || sl.transfer_quantity || 0
        );
        const prevReturned = Number(sl.previously_returned_quantity || 0);
        const available = issuedQty - prevReturned;
        return {
          _source_id: sl.id,
          source_document_number:
            returnType === 'project_return' ? sourceDoc.gin_number : sourceDoc.transfer_number,
          source_line_id: sl.id,
          item_name: itemName,
          item_code: itemCode,
          item: itemId,
          unit: unitName,
          issued_quantity: issuedQty,
          previously_returned_quantity: prevReturned,
          available_quantity: available,
          return_quantity: available > 0 ? available : 0,
          remarks: '',
        };
      })
    );
  };

  if (!lines.length && sourceLines.length) {
    syncFromSource();
  }

  const handleQtyChange = (id, val) =>
    setLines((prev) => prev.map((l) => (l._source_id === id ? { ...l, return_quantity: val } : l)));
  const handleRemarksChange = (id, val) =>
    setLines((prev) => prev.map((l) => (l._source_id === id ? { ...l, remarks: val } : l)));

  const totalReturnQty = lines.reduce((s, l) => s + Number(l.return_quantity || 0), 0);

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="solar:box-bold-duotone" width={20} sx={{ color: 'text.secondary' }} />
          <Typography variant="subtitle1" fontWeight={700}>
            Items to Return
          </Typography>
          {lines.length > 0 && (
            <Chip
              size="small"
              label={`${lines.length} item${lines.length !== 1 ? 's' : ''}`}
              variant="soft"
            />
          )}
        </Stack>
        <Tooltip title="Reload quantities from the source document">
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={syncFromSource}
            startIcon={<Iconify icon="solar:refresh-bold" width={14} />}
          >
            Reload
          </Button>
        </Tooltip>
      </Stack>

      {!sourceLines.length && (
        <Alert severity="warning" icon={<Iconify icon="solar:info-circle-bold" />}>
          No line items found on this source document.
        </Alert>
      )}

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 700, minWidth: 40 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 700, minWidth: 80 }}>Code</TableCell>
              <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Product Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Unit</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Original Qty
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Prev. Returned
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'info.main' }}>
                Available
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 700, color: 'primary.main', minWidth: 130 }}
              >
                Qty to Return *
              </TableCell>
              <TableCell sx={{ fontWeight: 700, minWidth: 150 }}>Remarks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lines.map((line, idx) => {
              const available = Number(line.available_quantity || 0);
              const ret = Number(line.return_quantity || 0);
              const overLimit = ret > available;
              return (
                <TableRow
                  key={line._source_id}
                  sx={{
                    bgcolor: overLimit ? 'error.lighter' : ret === 0 ? 'grey.50' : 'transparent',
                  }}
                >
                  <TableCell>
                    <Typography variant="caption" color="text.disabled">
                      {idx + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                      {line.item_code || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {line.item_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {line.unit || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{line.issued_quantity}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      color={
                        line.previously_returned_quantity > 0 ? 'warning.main' : 'text.secondary'
                      }
                    >
                      {line.previously_returned_quantity}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      size="small"
                      label={available}
                      color={available > 0 ? 'info' : 'default'}
                      variant="soft"
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={line.return_quantity}
                      onChange={(e) => handleQtyChange(line._source_id, e.target.value)}
                      inputProps={{
                        min: 0,
                        max: available,
                        style: { textAlign: 'right', fontWeight: 700 },
                      }}
                      error={overLimit}
                      helperText={overLimit ? `Max ${available}` : ''}
                      sx={{ width: 110 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={line.remarks}
                      onChange={(e) => handleRemarksChange(line._source_id, e.target.value)}
                      placeholder="Optional…"
                      sx={{ width: 140 }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {!lines.length && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                  <Stack alignItems="center" spacing={1}>
                    <Iconify
                      icon="solar:box-minimalistic-bold-duotone"
                      width={40}
                      sx={{ color: 'text.disabled' }}
                    />
                    <Typography variant="body2" color="text.disabled">
                      Select a source document to populate items.
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {lines.length > 0 && (
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell
                  colSpan={7}
                  align="right"
                  sx={{ fontWeight: 700, color: 'text.secondary' }}
                >
                  Total Quantity to Return
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  {totalReturnQty}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
          )}
        </Table>
      </TableContainer>
    </Stack>
  );
}

function SummaryBar({ returnType, sourceDoc, validLines }) {
  if (!sourceDoc || !validLines.length) return null;
  const typeConfig = RETURN_TYPES.find((t) => t.value === returnType);
  const info = getDocInfo(returnType, sourceDoc);
  const totalQty = validLines.reduce((s, l) => s + Number(l.return_quantity || 0), 0);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        borderColor: 'primary.light',
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
      }}
    >
      <Stack direction="row" alignItems="center" flexWrap="wrap" gap={2}>
        <Iconify
          icon="solar:clipboard-check-bold-duotone"
          width={22}
          sx={{ color: 'primary.main' }}
        />
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={700}
          textTransform="uppercase"
        >
          Return Summary
        </Typography>
        <Divider orientation="vertical" flexItem />
        <Chip
          size="small"
          icon={<Iconify icon={typeConfig?.icon} width={14} />}
          label={typeConfig?.shortLabel}
          color={typeConfig?.color}
          variant="soft"
        />
        <Chip size="small" label={info?.number} variant="outlined" />
        <Chip
          size="small"
          icon={<Iconify icon="solar:box-bold" width={14} />}
          label={`${validLines.length} item${validLines.length !== 1 ? 's' : ''}`}
          variant="soft"
        />
        <Chip
          size="small"
          icon={<Iconify icon="solar:layers-bold" width={14} />}
          label={`${totalQty} pcs`}
          color="primary"
          variant="soft"
        />
        {info?.from && (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              From:
            </Typography>
            <Typography variant="caption" fontWeight={700}>
              {info.from}
            </Typography>
            <Iconify icon="solar:arrow-right-bold" width={12} sx={{ color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary">
              To:
            </Typography>
            <Typography variant="caption" fontWeight={700}>
              {info.to}
            </Typography>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ minWidth: 180 }}>
      <Iconify icon={icon} width={18} sx={{ color: 'text.disabled', mt: 0.3, flexShrink: 0 }} />
      <Box>
        <Typography variant="caption" color="text.secondary" display="block">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {value || '—'}
        </Typography>
      </Box>
    </Stack>
  );
}

function ReviewStep({ returnType, sourceDoc, lines, remarks, setRemarks }) {
  const theme = useTheme();
  const typeConfig = RETURN_TYPES.find((t) => t.value === returnType);
  const info = getDocInfo(returnType, sourceDoc);
  const validLines = lines.filter((l) => Number(l.return_quantity) > 0);
  const totalQty = validLines.reduce((s, l) => s + Number(l.return_quantity || 0), 0);
  const color = theme.palette[typeConfig?.color || 'primary'];

  return (
    <Stack spacing={2.5}>
      {/* Header info card */}
      <Paper
        variant="outlined"
        sx={{ borderRadius: 2, overflow: 'hidden', borderColor: alpha(color.main, 0.3) }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            bgcolor: alpha(color.main, 0.06),
            borderBottom: `1px solid ${alpha(color.main, 0.15)}`,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Iconify icon="solar:check-read-bold-duotone" width={22} sx={{ color: color.main }} />
            <Typography variant="subtitle1" fontWeight={700}>
              Return Details
            </Typography>
          </Stack>
        </Box>
        <Box sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} flexWrap="wrap">
              <InfoRow
                icon="solar:tag-bold-duotone"
                label="Return Type"
                value={typeConfig?.label}
              />
              <InfoRow
                icon="solar:document-bold-duotone"
                label="Source Document"
                value={info?.number}
              />
              <InfoRow
                icon="solar:calendar-bold-duotone"
                label={info?.dateLabel}
                value={fmtDate(info?.date)}
              />
            </Stack>
            <Divider />
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems="center"
              spacing={2}
              flexWrap="wrap"
            >
              <InfoRow
                icon="solar:map-point-wave-bold-duotone"
                label={info?.fromLabel}
                value={info?.from}
              />
              <Iconify icon="solar:arrow-right-bold" width={20} sx={{ color: color.main }} />
              <InfoRow icon="solar:buildings-bold-duotone" label={info?.toLabel} value={info?.to} />
            </Stack>
          </Stack>
        </Box>
      </Paper>

      {/* Items review table */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            bgcolor: 'grey.50',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="solar:box-bold-duotone" width={20} sx={{ color: 'text.secondary' }} />
              <Typography variant="subtitle1" fontWeight={700}>
                Items Being Returned
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Chip
                size="small"
                label={`${validLines.length} item${validLines.length !== 1 ? 's' : ''}`}
                variant="soft"
              />
              <Chip
                size="small"
                label={`${totalQty} pcs total`}
                color={typeConfig?.color}
                variant="soft"
              />
            </Stack>
          </Stack>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Product Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Unit</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Available
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  Qty to Return
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {validLines.map((line, idx) => (
                <TableRow key={line._source_id}>
                  <TableCell>
                    <Typography variant="caption" color="text.disabled">
                      {idx + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                      {line.item_code || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {line.item_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {line.unit || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      size="small"
                      label={line.available_quantity}
                      color="info"
                      variant="soft"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      {line.return_quantity}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {line.remarks || '—'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Remarks */}
      <TextField
        label="General Remarks"
        multiline
        minRows={2}
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        placeholder="Optional notes for this return (reason, instructions, etc.)…"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ alignSelf: 'flex-start', pt: 1.5 }}>
              <Iconify
                icon="solar:chat-round-dots-bold-duotone"
                width={18}
                sx={{ color: 'text.disabled' }}
              />
            </InputAdornment>
          ),
        }}
      />
    </Stack>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReturnCreatePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [returnType, setReturnType] = useState('');
  const [sourceDoc, setSourceDoc] = useState(null);
  const [lines, setLines] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validLines = lines.filter((l) => Number(l.return_quantity) > 0);
  const hasOverLimit = lines.some((l) => Number(l.return_quantity) > Number(l.available_quantity));
  const canGoNext = (step === 0 && !!returnType) || (step === 1 && !!sourceDoc && lines.length > 0);

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async (asDraft = true) => {
    setSubmitting(true);
    const payload = {
      return_type: returnType,
      source_document_type: returnType === 'project_return' ? 'GIN' : 'INTERNAL_TRANSFER',
      return_date: new Date().toISOString().split('T')[0],
      remarks,
      lines: validLines.map(({ _source_id, available_quantity, ...l }) => ({
        ...l,
        return_quantity: Number(l.return_quantity),
        issued_quantity: Number(l.issued_quantity),
        previously_returned_quantity: Number(l.previously_returned_quantity),
      })),
    };
    try {
      const resp = await axiosInstance.post(EP.return_management, payload);
      const newId = resp?.data?.id;
      if (!asDraft && newId) {
        await axiosInstance.post(EP.return_management_submit(newId));
      }
      toast.success(asDraft ? 'Return saved as Draft.' : 'Return created and submitted.');
      router.push(
        newId
          ? paths.dashboard.storeInventory.returnManagement_detail(newId)
          : paths.dashboard.storeInventory.returnManagement
      );
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err) || 'Failed to create return.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* Page header */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton
            onClick={() => router.push(paths.dashboard.storeInventory.returnManagement)}
            size="small"
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <Iconify icon="solar:arrow-left-bold" width={18} />
          </IconButton>
          <Box>
            <Typography variant="h5" fontWeight={800}>
              Create Return
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Return items against a GIN or Internal Transfer
            </Typography>
          </Box>
        </Stack>

        {/* Stepper */}
        <Stepper activeStep={step} alternativeLabel>
          {STEPS.map((s, i) => (
            <Step key={s.label} completed={step > i}>
              <StepLabel
                optional={
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: { xs: 'none', sm: 'block' } }}
                  >
                    {s.desc.length > 55 ? `${s.desc.slice(0, 55)}…` : s.desc}
                  </Typography>
                }
              >
                {s.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step content */}
        <Card sx={{ borderRadius: 2 }}>
          {/* Step sub-header */}
          <Box sx={{ px: 3, pt: 3, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={700}>
              {STEPS[step].label}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {STEPS[step].desc}
            </Typography>
          </Box>

          <CardContent sx={{ p: 3 }}>
            {/* ── Step 1: Return Type ── */}
            {step === 0 && <ReturnTypeCards value={returnType} onChange={setReturnType} />}

            {/* ── Step 2: Source Document + Direction + Items ── */}
            {step === 1 && (
              <Stack spacing={2.5}>
                <DocSelector
                  returnType={returnType}
                  selected={sourceDoc}
                  onSelect={(v) => {
                    setSourceDoc(v);
                    setLines([]);
                  }}
                />
                {sourceDoc ? (
                  <>
                    <DirectionCard returnType={returnType} doc={sourceDoc} />
                    <ItemsTable
                      returnType={returnType}
                      sourceDoc={sourceDoc}
                      lines={lines}
                      setLines={setLines}
                    />
                  </>
                ) : (
                  <Box sx={{ py: 5, textAlign: 'center' }}>
                    <Iconify
                      icon="solar:folder-open-bold-duotone"
                      width={48}
                      sx={{ color: 'text.disabled', mb: 1 }}
                    />
                    <Typography variant="body2" color="text.disabled">
                      Search for a document above to see its items.
                    </Typography>
                  </Box>
                )}
              </Stack>
            )}

            {/* ── Step 3: Review & Submit ── */}
            {step === 2 && (
              <ReviewStep
                returnType={returnType}
                sourceDoc={sourceDoc}
                lines={lines}
                remarks={remarks}
                setRemarks={setRemarks}
              />
            )}
          </CardContent>
        </Card>

        {/* Live summary bar (Steps 2+) */}
        {step >= 1 && (
          <SummaryBar returnType={returnType} sourceDoc={sourceDoc} validLines={validLines} />
        )}

        {/* Over-limit error */}
        {hasOverLimit && (
          <Alert severity="error" icon={<Iconify icon="solar:danger-bold" />}>
            One or more items exceed the available return quantity. Please correct before
            proceeding.
          </Alert>
        )}

        {/* Navigation */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Button
            variant="outlined"
            color="inherit"
            onClick={
              step === 0
                ? () => router.push(paths.dashboard.storeInventory.returnManagement)
                : handleBack
            }
            startIcon={<Iconify icon="solar:arrow-left-bold" width={16} />}
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>

          <Stack direction="row" spacing={1.5}>
            {step < 2 && (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!canGoNext || hasOverLimit}
                endIcon={<Iconify icon="solar:arrow-right-bold" width={16} />}
              >
                Continue
              </Button>
            )}
            {step === 2 && (
              <>
                <Button
                  variant="outlined"
                  onClick={() => handleSubmit(true)}
                  disabled={submitting || !validLines.length || hasOverLimit}
                  startIcon={<Iconify icon="solar:floppy-disk-bold" width={16} />}
                >
                  Save as Draft
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleSubmit(false)}
                  disabled={submitting || !validLines.length || hasOverLimit}
                  startIcon={<Iconify icon="solar:send-bold-duotone" width={16} />}
                >
                  {submitting ? 'Submitting…' : 'Submit Return'}
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
