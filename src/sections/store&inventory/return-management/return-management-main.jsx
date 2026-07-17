'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';

import {
  Box,
  Card,
  Chip,
  Stack,
  Table,
  Button,
  Tooltip,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  IconButton,
  TableContainer,
  InputAdornment,
  TablePagination,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import ReturnReceiveDialog from './return-receive-dialog';
import ReturnDispatchDialog from './return-dispatch-dialog';
import ReturnReleaseNotePDF from './return-release-note-pdf';

const EP = endpoints.storeInventory;

const STATUS_CONFIG = {
  Draft: { color: 'default', icon: 'solar:document-text-bold-duotone' },
  'Pending Approval': { color: 'warning', icon: 'solar:clock-circle-bold-duotone' },
  'In Transit': { color: 'info', icon: 'solar:delivery-bold-duotone' },
  Received: { color: 'success', icon: 'solar:check-circle-bold-duotone' },
  Cancelled: { color: 'error', icon: 'solar:close-circle-bold-duotone' },
};

const RETURN_TYPE_LABELS = {
  project_return: 'Project Item Return',
  internal_transfer_return: 'Internal Transfer Return',
};

function StatusChip({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
  return <Chip size="small" color={cfg.color} label={status} variant="soft" />;
}

export default function ReturnManagementMain() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [receiveTarget, setReceiveTarget] = useState(null);
  const [dispatchTarget, setDispatchTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (filterStatus) params.set('status', filterStatus);
  if (filterType) params.set('return_type', filterType);
  params.set('page', page + 1);
  params.set('page_size', rowsPerPage);

  const url = `${EP.return_management}?${params.toString()}`;
  const { data: raw, loading } = useGetRequest(url);

  const rows = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : [];
  const total = raw?.count ?? rows.length;

  const invalidate = () =>
    mutate((k) => typeof k === 'string' && k.startsWith(EP.return_management));

  const handleDownloadRelease = async (row) => {
    setPdfLoadingId(row.id);
    try {
      const blob = await pdf(<ReturnReleaseNotePDF doc={row} />).toBlob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${row.return_number}-release-note.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      toast.success(`Release Note for ${row.return_number} downloaded.`);
    } catch (err) {
      toast.error('Failed to generate Release Note PDF.');
    } finally {
      setPdfLoadingId(null);
    }
  };

  const handleAction = async (actionKey, id) => {
    setActionLoading(`${actionKey}-${id}`);
    try {
      const endpoint = EP[`return_management_${actionKey}`]?.(id);
      if (!endpoint) return;
      await axiosInstance.post(endpoint);
      toast.success(`Return ${actionKey}ted successfully.`);
      invalidate();
    } catch (err) {
      toast.error(
        extractErrorMessage(err?.response?.data || err) || `Failed to ${actionKey} return.`
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRequest(EP.return_management_by_id(deleteTarget.id));
      toast.success('Return deleted.');
      invalidate();
    } catch (err) {
      toast.error(extractErrorMessage(err?.response?.data || err) || 'Delete failed.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ sm: 'center' }}
          spacing={1.5}
        >
          <Box>
            <Typography variant="h4" fontWeight={800}>
              Return Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage project item returns and internal transfer returns.
            </Typography>
          </Box>
          <Button
            component={Link}
            href={paths.dashboard.storeInventory.returnManagement_create}
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
          >
            Create Return
          </Button>
        </Stack>

        {/* Filters */}
        <Card sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              size="small"
              placeholder="Search by return number, item, document…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:magnifer-bold" width={16} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              label="Status"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">All Status</MenuItem>
              {Object.keys(STATUS_CONFIG).map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Return Type"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="project_return">Project Item Return</MenuItem>
              <MenuItem value="internal_transfer_return">Internal Transfer Return</MenuItem>
            </TextField>
            {(search || filterStatus || filterType) && (
              <Button
                size="small"
                onClick={() => {
                  setSearch('');
                  setFilterStatus('');
                  setFilterType('');
                  setPage(0);
                }}
              >
                Clear
              </Button>
            )}
          </Stack>
        </Card>

        {/* Table */}
        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Return No.</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Source Doc.</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Return Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Loading…
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && !rows.length && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Stack alignItems="center" spacing={1}>
                        <Iconify
                          icon="solar:box-bold-duotone"
                          width={40}
                          sx={{ color: 'text.disabled' }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          No return documents found.
                        </Typography>
                        <Button
                          component={Link}
                          href={paths.dashboard.storeInventory.returnManagement_create}
                          variant="contained"
                          size="small"
                        >
                          Create First Return
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row, idx) => {
                  const sourceDocs = [
                    ...new Set(
                      (row.lines || []).map((l) => l.source_document_number).filter(Boolean)
                    ),
                  ];
                  const isActing = (k) => actionLoading === `${k}-${row.id}`;
                  return (
                    <TableRow key={row.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell>
                        <Typography variant="caption" color="text.disabled" fontWeight={700}>
                          {page * rowsPerPage + idx + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          component={Link}
                          href={paths.dashboard.storeInventory.returnManagement_detail(row.id)}
                          variant="body2"
                          fontWeight={700}
                          sx={{
                            color: 'primary.main',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          {row.return_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {RETURN_TYPE_LABELS[row.return_type] || row.return_type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {sourceDocs.join(', ') || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {row.return_date
                            ? new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(
                                new Date(row.return_date)
                              )
                            : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={`${(row.lines || []).length} items`}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <StatusChip status={row.status} />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          {row.status === 'Draft' && (
                            <Tooltip title="Submit for Approval">
                              <IconButton
                                size="small"
                                color="warning"
                                disabled={isActing('submit')}
                                onClick={() => handleAction('submit', row.id)}
                              >
                                <Iconify icon="solar:send-bold-duotone" width={16} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {row.status === 'Pending Approval' && (
                            <Tooltip title="Dispatch">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => setDispatchTarget(row)}
                              >
                                <Iconify icon="solar:delivery-bold-duotone" width={16} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {row.status === 'In Transit' && (
                            <>
                              <Tooltip title="Download Release Note PDF">
                                <IconButton
                                  size="small"
                                  color="info"
                                  disabled={pdfLoadingId === row.id}
                                  onClick={() => handleDownloadRelease(row)}
                                >
                                  <Iconify icon="solar:document-add-bold-duotone" width={16} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Receive">
                                <IconButton
                                  size="small"
                                  color="success"
                                  disabled={isActing('receive')}
                                  onClick={() => setReceiveTarget(row)}
                                >
                                  <Iconify icon="solar:check-circle-bold-duotone" width={16} />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              component={Link}
                              href={paths.dashboard.storeInventory.returnManagement_detail(row.id)}
                            >
                              <Iconify icon="solar:eye-bold-duotone" width={16} />
                            </IconButton>
                          </Tooltip>
                          {['Draft', 'Pending Approval'].includes(row.status) && (
                            <Tooltip title="Cancel">
                              <IconButton
                                size="small"
                                color="error"
                                disabled={isActing('cancel')}
                                onClick={() => handleAction('cancel', row.id)}
                              >
                                <Iconify icon="solar:close-circle-bold-duotone" width={16} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {row.status === 'Draft' && (
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteTarget(row)}
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(+e.target.value);
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </Card>
      </Stack>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Return"
        content={`Delete "${deleteTarget?.return_number}"? This cannot be undone.`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />

      {receiveTarget && (
        <ReturnReceiveDialog
          open={!!receiveTarget}
          returnDoc={receiveTarget}
          onClose={() => setReceiveTarget(null)}
          onSuccess={() => {
            setReceiveTarget(null);
            invalidate();
          }}
        />
      )}

      {dispatchTarget && (
        <ReturnDispatchDialog
          open={!!dispatchTarget}
          returnDoc={dispatchTarget}
          onClose={() => setDispatchTarget(null)}
          onSuccess={() => {
            setDispatchTarget(null);
            invalidate();
          }}
        />
      )}
    </Box>
  );
}
