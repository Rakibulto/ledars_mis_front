'use client';

import { useRouter, useParams } from 'next/navigation';

import { useTheme, alpha } from '@mui/material/styles';
import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Table,
  Button,
  Divider,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CardContent,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { endpoints } from 'src/utils/axios';
import { useGetRequest } from 'src/actions/ledars-hook';
import { Iconify } from 'src/components/iconify';

const EP = endpoints.storeInventory;

const RETURN_TYPE_LABELS = {
  project_return: 'Project Item Return',
  internal_transfer_return: 'Internal Transfer Return',
  instant_it_return: 'Instant Internal Transfer Return',
};

const TYPE_COLORS = {
  project_return: 'warning',
  internal_transfer_return: 'info',
  instant_it_return: 'secondary',
};

const STATUS_COLORS = {
  Draft: 'default',
  'Pending Approval': 'warning',
  'In Transit': 'info',
  Received: 'success',
  Cancelled: 'error',
};

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(dateStr));
}

function fmtDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(dateStr)
  );
}

function MetaRow({ label, value, valueColor }) {
  return (
    <Stack direction="row" spacing={1} alignItems="flex-start">
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 160, pt: 0.15 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} color={valueColor || 'text.primary'}>
        {value || '—'}
      </Typography>
    </Stack>
  );
}

export default function ReturnHistoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const theme = useTheme();
  const id = params?.historyId;

  const { data: transfer, loading } = useGetRequest(id ? EP.return_management_by_id(id) : null);

  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!transfer) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Record not found.
        </Typography>
        <Button
          sx={{ mt: 2 }}
          startIcon={<Iconify icon="solar:arrow-left-bold" width={16} />}
          onClick={() => router.push(paths.dashboard.storeInventory.returnManagement_history)}
        >
          Back to History
        </Button>
      </Box>
    );
  }

  const lines = transfer.lines || [];
  const damageHistories = transfer.damage_histories || [];
  const typeColor = TYPE_COLORS[transfer.return_type] || 'default';
  const statusColor = STATUS_COLORS[transfer.status] || 'default';

  const totalReturnQty = lines.reduce((s, l) => s + Number(l.return_quantity || 0), 0);
  const totalGoodQty = lines.reduce((s, l) => s + Number(l.good_quantity || 0), 0);
  const totalDamagedQty = lines.reduce((s, l) => s + Number(l.damaged_quantity || 0), 0);

  const sourceDocs = [...new Set(lines.map((l) => l.source_document_number).filter(Boolean))];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        {/* Back + Header */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:arrow-left-bold" width={16} />}
            onClick={() => router.push(paths.dashboard.storeInventory.returnManagement_history)}
          >
            Back to History
          </Button>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="h5" fontWeight={800}>
                {transfer.return_number}
              </Typography>
              <Chip
                size="small"
                label={RETURN_TYPE_LABELS[transfer.return_type] || transfer.return_type}
                color={typeColor}
                variant="soft"
              />
              <Chip size="small" label={transfer.status} color={statusColor} variant="soft" />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              History Detail — read-only view
            </Typography>
          </Box>
        </Stack>

        {/* Summary KPIs */}
        <Grid container spacing={2}>
          {[
            {
              label: 'Total Returned',
              value: totalReturnQty,
              color: 'primary',
              icon: 'solar:box-bold-duotone',
            },
            {
              label: 'Good Quantity',
              value: totalGoodQty,
              color: 'success',
              icon: 'solar:shield-check-bold-duotone',
            },
            {
              label: 'Damaged Quantity',
              value: totalDamagedQty,
              color: 'error',
              icon: 'solar:danger-bold-duotone',
            },
            {
              label: 'Line Items',
              value: lines.length,
              color: 'warning',
              icon: 'solar:list-bold-duotone',
            },
          ].map((kpi) => (
            <Grid size={{ xs: 6, sm: 3 }} key={kpi.label}>
              <Card sx={{ borderRadius: 2, borderLeft: 4, borderColor: `${kpi.color}.main` }}>
                <CardContent sx={{ py: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify icon={kpi.icon} width={22} sx={{ color: `${kpi.color}.main` }} />
                    <Box>
                      <Typography variant="h5" fontWeight={800}>
                        {kpi.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {kpi.label}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2.5}>
          {/* Return Info Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Iconify
                    icon="solar:document-text-bold-duotone"
                    width={20}
                    sx={{ color: 'primary.main' }}
                  />
                  <Typography variant="subtitle1" fontWeight={700}>
                    Return Information
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1.5}>
                  <MetaRow
                    label="Return Number"
                    value={transfer.return_number}
                    valueColor="primary.main"
                  />
                  <MetaRow
                    label="Return Type"
                    value={RETURN_TYPE_LABELS[transfer.return_type] || transfer.return_type}
                  />
                  <MetaRow label="Status" value={transfer.status} />
                  <MetaRow label="Return Date" value={fmt(transfer.return_date)} />
                  <MetaRow label="Source Document Type" value={transfer.source_document_type} />
                  <MetaRow label="Source Reference(s)" value={sourceDocs.join(', ') || '—'} />
                  <MetaRow label="Remarks" value={transfer.remarks} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Route & People Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Iconify
                    icon="solar:routing-bold-duotone"
                    width={20}
                    sx={{ color: 'warning.main' }}
                  />
                  <Typography variant="subtitle1" fontWeight={700}>
                    Route &amp; People
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 2 }} />

                {/* Route visual */}
                <Box
                  sx={{
                    p: 1.5,
                    mb: 2,
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.warning.main, 0.06),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        FROM
                      </Typography>
                      <Typography variant="body2" fontWeight={700} noWrap>
                        {transfer.resolved_source_location || transfer.source_location || '—'}
                      </Typography>
                    </Box>
                    <Iconify
                      icon="solar:arrow-right-bold-duotone"
                      width={20}
                      sx={{ color: 'warning.main', flexShrink: 0 }}
                    />
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        TO
                      </Typography>
                      <Typography variant="body2" fontWeight={700} noWrap>
                        {transfer.resolved_destination_location ||
                          transfer.destination_location ||
                          '—'}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Stack spacing={1.5}>
                  <MetaRow label="Created By" value={transfer.created_by_name} />
                  <MetaRow label="Approved By" value={transfer.approved_by_name} />
                  <MetaRow label="Received By" value={transfer.received_by_name} />
                  <MetaRow label="Created At" value={fmtDateTime(transfer.created_at)} />
                  <MetaRow label="Updated At" value={fmtDateTime(transfer.updated_at)} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Line Items Table */}
        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="solar:list-bold-duotone" width={20} sx={{ color: 'info.main' }} />
              <Typography variant="subtitle1" fontWeight={700}>
                Line Items
              </Typography>
              <Chip size="small" label={lines.length} color="info" variant="soft" />
            </Stack>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
                  <TableCell sx={{ fontWeight: 700, width: 40 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Item Code</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Unit</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Source Ref</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Return Qty
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                    Good Qty
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>
                    Damaged Qty
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No line items.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {lines.map((line, idx) => (
                  <TableRow key={line.id} sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <Typography variant="caption" color="text.disabled">
                        {idx + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {line.item_name || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {line.item_code || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{line.unit || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {line.source_document_number || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        size="small"
                        label={line.return_quantity ?? '—'}
                        color="primary"
                        variant="soft"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        size="small"
                        label={line.good_quantity ?? '—'}
                        color="success"
                        variant="soft"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {Number(line.damaged_quantity) > 0 ? (
                        <Chip
                          size="small"
                          label={line.damaged_quantity}
                          color="error"
                          variant="soft"
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          0
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {lines.length > 0 && (
                  <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
                    <TableCell colSpan={5} sx={{ fontWeight: 700, fontSize: 12 }}>
                      Total
                    </TableCell>
                    <TableCell align="right">
                      <Chip size="small" label={totalReturnQty} color="primary" variant="soft" />
                    </TableCell>
                    <TableCell align="right">
                      <Chip size="small" label={totalGoodQty} color="success" variant="soft" />
                    </TableCell>
                    <TableCell align="right">
                      {totalDamagedQty > 0 ? (
                        <Chip size="small" label={totalDamagedQty} color="error" variant="soft" />
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          0
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Damage History */}
        {damageHistories.length > 0 && (
          <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box
              sx={{
                px: 2.5,
                py: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.error.main, 0.04),
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon="solar:danger-bold-duotone" width={20} sx={{ color: 'error.main' }} />
                <Typography variant="subtitle1" fontWeight={700} color="error.main">
                  Damage History
                </Typography>
                <Chip size="small" label={damageHistories.length} color="error" variant="soft" />
              </Stack>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
                    <TableCell sx={{ fontWeight: 700, width: 40 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Item Code</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Source Ref</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>
                      Damaged Qty
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Recorded At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {damageHistories.map((dh, idx) => (
                    <TableRow key={dh.id} sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell>
                        <Typography variant="caption" color="text.disabled">
                          {idx + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {dh.item_name || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {dh.item_code || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {dh.source_document_number || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          size="small"
                          label={dh.damaged_quantity}
                          color="error"
                          variant="soft"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{fmtDateTime(dh.recorded_at)}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
