'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { mutate } from 'swr';

import { pdf } from '@react-pdf/renderer';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Tooltip,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { endpoints } from 'src/utils/axios';
import axiosInstance from 'src/utils/axios';
import { useGetRequest, extractErrorMessage } from 'src/actions/ledars-hook';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import ReturnReceiveDialog from './return-receive-dialog';
import ReturnReleaseNotePDF from './return-release-note-pdf';
import ReturnDispatchDialog from './return-dispatch-dialog';

const EP = endpoints.storeInventory;

const STATUS_CONFIG = {
  Draft: { color: 'default', step: 0 },
  'Pending Approval': { color: 'warning', step: 1 },
  'In Transit': { color: 'info', step: 2 },
  Received: { color: 'success', step: 3 },
  Cancelled: { color: 'error', step: -1 },
};

const RETURN_TYPE_LABELS = {
  project_return: 'Project Item Return',
  internal_transfer_return: 'Internal Transfer Return',
  instant_it_return: 'Instant Internal Transfer Return',
};

function InfoRow({ label, value }) {
  return (
    <Stack direction="row" spacing={1} alignItems="baseline">
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {value || '—'}
      </Typography>
    </Stack>
  );
}

export default function ReturnDetailsPage() {
  const router = useRouter();
  const { returnId } = useParams();
  const url = EP.return_management_by_id(returnId);
  const { data: doc, loading, error } = useGetRequest(url);

  const [actionLoading, setActionLoading] = useState(null);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const invalidate = () => mutate((k) => typeof k === 'string' && k.includes(`/api/returns/`));

  const handleDownloadRelease = async () => {
    setPdfLoading(true);
    try {
      const blob = await pdf(<ReturnReleaseNotePDF doc={doc} />).toBlob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${doc.return_number}-release-note.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      toast.success('Release Note PDF downloaded.');
    } catch (err) {
      toast.error('Failed to generate Release Note PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleAction = async (actionKey) => {
    setActionLoading(actionKey);
    try {
      const endpoint = EP[`return_management_${actionKey}`]?.(returnId);
      if (!endpoint) return;
      await axiosInstance.post(endpoint);
      toast.success(
        `Return ${actionKey === 'submit' ? 'submitted' : actionKey === 'dispatch' ? 'dispatched' : actionKey + 'ed'} successfully.`
      );
      invalidate();
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err) || `Failed to ${actionKey}.`);
    } finally {
      setActionLoading(null);
      setCancelDialog(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(url);
      toast.success('Return deleted.');
      router.push(paths.dashboard.storeInventory.returnManagement);
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err) || 'Delete failed.');
    } finally {
      setDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">Loading return document…</Typography>
      </Box>
    );
  }

  if (error || !doc) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Return document not found or failed to load.</Alert>
      </Box>
    );
  }

  const status = doc.status || 'Draft';
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
  const lines = doc.lines || [];
  const damageHistories = doc.damage_histories || [];

  // Group lines by source document
  const linesBySource = lines.reduce((acc, l) => {
    const key = l.source_document_number || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(l);
    return acc;
  }, {});

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ sm: 'center' }}
          spacing={2}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton
              size="small"
              onClick={() => router.push(paths.dashboard.storeInventory.returnManagement)}
            >
              <Iconify icon="solar:arrow-left-bold-duotone" />
            </IconButton>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Typography variant="h5" fontWeight={800}>
                  {doc.return_number}
                </Typography>
                <Chip size="small" color={statusCfg.color} label={status} variant="soft" />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {RETURN_TYPE_LABELS[doc.return_type] || doc.return_type}
              </Typography>
            </Box>
          </Stack>

          {/* Action buttons */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {status === 'Draft' && (
              <>
                <Button
                  variant="contained"
                  color="warning"
                  size="small"
                  startIcon={<Iconify icon="solar:send-bold-duotone" width={16} />}
                  onClick={() => handleAction('submit')}
                  disabled={actionLoading === 'submit'}
                >
                  {actionLoading === 'submit' ? 'Submitting…' : 'Submit'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => setDeleteDialog(true)}
                >
                  Delete
                </Button>
              </>
            )}
            {status === 'Pending Approval' && (
              <Button
                variant="contained"
                color="info"
                size="small"
                startIcon={<Iconify icon="solar:delivery-bold-duotone" width={16} />}
                onClick={() => setDispatchOpen(true)}
                disabled={actionLoading === 'dispatch'}
              >
                Dispatch
              </Button>
            )}
            {status === 'In Transit' && (
              <>
                <Button
                  variant="outlined"
                  color="info"
                  size="small"
                  startIcon={<Iconify icon="solar:document-add-bold-duotone" width={16} />}
                  onClick={handleDownloadRelease}
                  disabled={pdfLoading}
                >
                  {pdfLoading ? 'Preparing…' : 'Release Note'}
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<Iconify icon="solar:check-circle-bold-duotone" width={16} />}
                  onClick={() => setReceiveOpen(true)}
                >
                  Receive
                </Button>
              </>
            )}
            {['Draft', 'Pending Approval'].includes(status) && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => setCancelDialog(true)}
                disabled={actionLoading === 'cancel'}
              >
                Cancel
              </Button>
            )}
          </Stack>
        </Stack>

        {/* Summary Cards */}
        <Grid container spacing={2}>
          {[
            {
              label: 'Total Lines',
              value: lines.length,
              color: 'primary',
              icon: 'solar:list-bold-duotone',
            },
            {
              label: 'Total Return Qty',
              value: lines.reduce((s, l) => s + Number(l.return_quantity || 0), 0),
              color: 'info',
              icon: 'solar:box-bold-duotone',
            },
            {
              label: 'Total Good Qty',
              value: lines.reduce((s, l) => s + Number(l.good_quantity || 0), 0),
              color: 'success',
              icon: 'solar:check-circle-bold-duotone',
            },
            {
              label: 'Total Damaged Qty',
              value: lines.reduce((s, l) => s + Number(l.damaged_quantity || 0), 0),
              color: 'error',
              icon: 'solar:danger-bold-duotone',
            },
          ].map((kpi) => (
            <Grid size={{ xs: 6, sm: 3 }} key={kpi.label}>
              <Card sx={{ borderRadius: 2, borderLeft: 4, borderColor: `${kpi.color}.main` }}>
                <CardContent sx={{ py: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify icon={kpi.icon} width={24} sx={{ color: `${kpi.color}.main` }} />
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

        {/* Info Card */}
        <Card sx={{ borderRadius: 2 }}>
          <CardHeader title="Return Information" />
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={1}>
                  <InfoRow label="Return Number" value={doc.return_number} />
                  <InfoRow
                    label="Return Type"
                    value={RETURN_TYPE_LABELS[doc.return_type] || doc.return_type}
                  />
                  <InfoRow label="Source Doc Type" value={doc.source_document_type} />
                  <InfoRow
                    label="Return Date"
                    value={
                      doc.return_date
                        ? new Intl.DateTimeFormat('en-BD', { dateStyle: 'long' }).format(
                            new Date(doc.return_date)
                          )
                        : '—'
                    }
                  />
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={1}>
                  <InfoRow label="Status" value={status} />
                  <InfoRow label="Created By" value={doc.created_by_name} />
                  <InfoRow
                    label="Created At"
                    value={
                      doc.created_at
                        ? new Intl.DateTimeFormat('en-BD', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }).format(new Date(doc.created_at))
                        : '—'
                    }
                  />
                  <InfoRow label="Remarks" value={doc.remarks} />
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Line Items grouped by source */}
        {Object.entries(linesBySource).map(([sourceDoc, srcLines]) => (
          <Card key={sourceDoc} sx={{ borderRadius: 2 }}>
            <CardHeader
              title={`Source Document: ${sourceDoc}`}
              subheader={`${srcLines.length} line item(s)`}
            />
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        Issued
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        Prev. Returned
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        Return Qty
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                        Good
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>
                        Damaged
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {srcLines.map((line, idx) => (
                      <TableRow key={line.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell>
                          <Typography variant="caption" color="text.disabled" fontWeight={700}>
                            {idx + 1}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {line.item_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {line.item_code}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{line.issued_quantity}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {line.previously_returned_quantity}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={line.return_quantity}
                            color="primary"
                            variant="soft"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {line.good_quantity > 0 ? (
                            <Chip
                              size="small"
                              label={line.good_quantity}
                              color="success"
                              variant="soft"
                            />
                          ) : (
                            <Typography variant="caption" color="text.disabled">
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {line.damaged_quantity > 0 ? (
                            <Chip
                              size="small"
                              label={line.damaged_quantity}
                              color="error"
                              variant="soft"
                            />
                          ) : (
                            <Typography variant="caption" color="text.disabled">
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {line.remarks || '—'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        ))}

        {/* Damage History */}
        {damageHistories.length > 0 && (
          <Card sx={{ borderRadius: 2 }}>
            <CardHeader
              title="Damage Records"
              subheader="Items recorded as damaged during receive."
            />
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        Damaged Qty
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Source Doc</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Recorded At</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {damageHistories.map((dh) => (
                      <TableRow key={dh.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {dh.item_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {dh.item_code}
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
                          <Typography variant="caption">{dh.source_document_number}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {dh.recorded_at
                              ? new Intl.DateTimeFormat('en-BD', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                }).format(new Date(dh.recorded_at))
                              : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {dh.remarks || '—'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Stack>

      {/* Confirm Cancel */}
      <ConfirmDialog
        open={cancelDialog}
        onClose={() => setCancelDialog(false)}
        title="Cancel Return"
        content="Are you sure you want to cancel this return? This cannot be undone."
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => handleAction('cancel')}
            disabled={actionLoading === 'cancel'}
          >
            {actionLoading === 'cancel' ? 'Cancelling…' : 'Cancel Return'}
          </Button>
        }
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        title="Delete Return"
        content={`Delete "${doc.return_number}"? This cannot be undone.`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />

      {/* Receive Dialog */}
      {receiveOpen && (
        <ReturnReceiveDialog
          open={receiveOpen}
          returnDoc={doc}
          onClose={() => setReceiveOpen(false)}
          onSuccess={() => {
            setReceiveOpen(false);
            invalidate();
          }}
        />
      )}

      {/* Dispatch Dialog */}
      {dispatchOpen && (
        <ReturnDispatchDialog
          open={dispatchOpen}
          returnDoc={doc}
          onClose={() => setDispatchOpen(false)}
          onSuccess={() => {
            setDispatchOpen(false);
            invalidate();
          }}
        />
      )}
    </Box>
  );
}
