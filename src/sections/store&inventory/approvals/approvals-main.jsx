/* eslint-disable perfectionist/sort-named-imports */

'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import React, { useMemo, useState } from 'react';

import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  Chip,
  Collapse,
  Divider,
  Dialog,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Pagination,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, usePatchRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import MuiAutocomplete from 'src/components/hook-form/mui-autocomplete';

import SummaryCard from '../../_components/summary-card';

const normalizeStatus = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

export default function ApprovalsMain() {
  // Dialog state
  const approvalDialog = useBoolean();
  const rejectionDialog = useBoolean();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);

  // Table state
  const [page, setPage] = useState(1);
  const [dense, setDense] = useState(false);

  // Form state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [approvalComments, setApprovalComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [expandedRows, setExpandedRows] = useState([]);

  // Fetch data from multiple endpoints
  const { data: rawGRNs } = useGetRequest(endpoints.storeInventory.grn);
  const { data: rawGINs } = useGetRequest(endpoints.storeInventory.gin);
  const { data: rawTransfers } = useGetRequest(endpoints.storeInventory.stock_transfers);
  const { data: rawAdjustments } = useGetRequest(endpoints.storeInventory.stock_adjustments);

  // Combine all approval requests from different endpoints
  const requests = useMemo(() => {
    const grnList = Array.isArray(rawGRNs) ? rawGRNs : rawGRNs?.results || [];
    const ginList = Array.isArray(rawGINs) ? rawGINs : rawGINs?.results || [];
    const transferList = Array.isArray(rawTransfers) ? rawTransfers : rawTransfers?.results || [];
    const adjustmentList = Array.isArray(rawAdjustments)
      ? rawAdjustments
      : rawAdjustments?.results || [];

    const grnRequests = grnList.map((item) => ({
      id: `grn-${item.id}`,
      documentType: 'GRN',
      documentNumber: item.grn_number || item.documentNumber,
      requestedBy: item.requested_by || item.requestedBy || 'Store Officer',
      requestDate: item.receive_date || item.requestDate,
      department: item.department || 'Store',
      totalValue: item.total_value || item.totalValue,
      status: item.approval_status || item.status || 'Pending',
      currentLevel: item.current_level || item.currentLevel || 1,
      totalLevels: item.total_levels || item.totalLevels || 2,
      description: item.description || `Goods receipt - ${item.supplier_name || ''}`,
      priority: item.priority || 'Medium',
      approvalHistory: item.approval_history || item.approvalHistory || [],
    }));

    const ginRequests = ginList.map((item) => ({
      id: `gin-${item.id}`,
      documentType: 'GIN',
      documentNumber: item.gin_number || item.ginNumber || item.documentNumber,
      requestedBy: item.requested_by || item.requestedBy || item.issuedTo,
      requestDate: item.issue_date || item.issueDate || item.requestDate,
      department: item.department || 'Store',
      totalValue: item.total_value || item.totalValue,
      status: item.approval_status || item.status || 'Pending',
      currentLevel: item.current_level || item.currentLevel || 1,
      totalLevels: item.total_levels || item.totalLevels || 2,
      description: item.description || item.purpose || '',
      priority: item.priority || 'Medium',
      approvalHistory: item.approval_history || item.approvalHistory || [],
    }));

    const transferRequests = transferList.map((item) => ({
      id: `st-${item.id}`,
      documentType: 'Stock Transfer',
      documentNumber: item.transfer_number || item.transferNumber || item.documentNumber,
      requestedBy: item.requested_by || item.requestedBy || item.sentBy || 'Store Officer',
      requestDate: item.transfer_date || item.transferDate || item.requestDate,
      department: item.department || 'Store',
      totalValue: item.total_value || item.totalValue,
      status: item.approval_status || item.status || 'Pending',
      currentLevel: item.current_level || item.currentLevel || 1,
      totalLevels: item.total_levels || item.totalLevels || 1,
      description:
        item.description ||
        `Transfer from ${item.from_location || item.fromLocation || ''} to ${item.to_location || item.toLocation || ''}`,
      priority: item.priority || 'Medium',
      approvalHistory: item.approval_history || item.approvalHistory || [],
    }));

    const adjustmentRequests = adjustmentList.map((item) => ({
      id: `sa-${item.id}`,
      documentType: 'Stock Adjustment',
      documentNumber: item.adjustment_number || item.adjustmentNumber || item.documentNumber,
      requestedBy: item.requested_by || item.requestedBy || item.adjustedBy || 'Store Officer',
      requestDate: item.adjustment_date || item.adjustmentDate || item.requestDate,
      department: item.department || 'Store',
      totalValue: item.total_value || item.totalValue,
      status: item.approval_status || item.status || 'Pending',
      currentLevel: item.current_level || item.currentLevel || 1,
      totalLevels: item.total_levels || item.totalLevels || 2,
      description: item.description || item.reason || '',
      priority: item.priority || 'Medium',
      approvalHistory: item.approval_history || item.approvalHistory || [],
    }));

    return [...grnRequests, ...ginRequests, ...transferRequests, ...adjustmentRequests];
  }, [rawGRNs, rawGINs, rawTransfers, rawAdjustments]);

  // Filter options
  const typeOptions = useMemo(
    () => [
      { id: 'GRN', name: 'Goods Receipt Note' },
      { id: 'GIN', name: 'Goods Issue Note' },
      { id: 'Stock Transfer', name: 'Stock Transfer' },
      { id: 'Stock Adjustment', name: 'Stock Adjustment' },
    ],
    []
  );

  const statusOptions = useMemo(
    () => [
      { id: 'Pending', name: 'Pending' },
      { id: 'Approved', name: 'Approved' },
      { id: 'Rejected', name: 'Rejected' },
    ],
    []
  );

  // Filtered and paginated data
  const filteredRequests = useMemo(
    () =>
      requests.filter((req) => {
        const matchesSearch =
          (req.documentNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (req.requestedBy || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (req.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !filterType || req.documentType === filterType.id;
        const matchesStatus = !filterStatus || req.status === filterStatus.id;
        return matchesSearch && matchesType && matchesStatus;
      }),
    [requests, searchTerm, filterType, filterStatus]
  );

  // Pagination
  const ROWS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredRequests.length / ROWS_PER_PAGE);
  const paginatedRequests = useMemo(() => {
    const startIndex = (page - 1) * ROWS_PER_PAGE;
    return filteredRequests.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredRequests, page]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeDense = (event) => {
    setDense(event.target.checked);
  };

  // Statistics
  const stats = useMemo(
    () => ({
      pending: requests.filter((r) => r.status === 'Pending').length,
      approved: requests.filter((r) => r.status === 'Approved').length,
      rejected: requests.filter((r) => r.status === 'Rejected').length,
      total: requests.length,
    }),
    [requests]
  );

  const selectedDeskRequest =
    filteredRequests.find((request) => request.id === selectedRequestId) ||
    filteredRequests[0] ||
    null;

  const approvalControls = useMemo(
    () => ({
      pending: requests.filter((request) => normalizeStatus(request.status) === 'pending').length,
      approved: requests.filter((request) => normalizeStatus(request.status) === 'approved').length,
      rejected: requests.filter((request) => normalizeStatus(request.status) === 'rejected').length,
      urgent: requests.filter((request) => normalizeStatus(request.priority) === 'urgent').length,
    }),
    [requests]
  );

  // Helper functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return { bgcolor: '#fef3c7', color: '#92400e' };
      case 'Approved':
        return { bgcolor: '#d1fae5', color: '#065f46' };
      case 'Rejected':
        return { bgcolor: '#fee2e2', color: '#991b1b' };
      default:
        return { bgcolor: '#f3f4f6', color: '#374151' };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low':
        return { bgcolor: '#dbeafe', color: '#1e40af' };
      case 'Medium':
        return { bgcolor: '#fef3c7', color: '#92400e' };
      case 'High':
        return { bgcolor: '#fed7aa', color: '#9a3412' };
      case 'Urgent':
        return { bgcolor: '#fee2e2', color: '#991b1b' };
      default:
        return { bgcolor: '#f3f4f6', color: '#374151' };
    }
  };

  const getDocumentIcon = (type) => {
    switch (type) {
      case 'GRN':
        return 'solar:box-minimalistic-bold-duotone';
      case 'GIN':
        return 'solar:outgoing-call-bold-duotone';
      case 'Stock Transfer':
        return 'solar:delivery-bold-duotone';
      case 'Stock Adjustment':
        return 'solar:settings-bold-duotone';
      default:
        return 'solar:document-bold-duotone';
    }
  };

  // Helper to resolve the PATCH endpoint from the composite id
  const getEndpointForRequest = (request) => {
    const rawId = request.id.split('-').slice(1).join('-');
    switch (request.documentType) {
      case 'GRN':
        return endpoints.storeInventory.grn_by_id(rawId);
      case 'GIN':
        return endpoints.storeInventory.gin_by_id(rawId);
      case 'Stock Transfer':
        return endpoints.storeInventory.stock_transfer_by_id(rawId);
      case 'Stock Adjustment':
        return endpoints.storeInventory.stock_adjustment_by_id(rawId);
      default:
        return null;
    }
  };

  const revalidateAll = () => {
    mutate(endpoints.storeInventory.grn);
    mutate(endpoints.storeInventory.gin);
    mutate(endpoints.storeInventory.stock_transfers);
    mutate(endpoints.storeInventory.stock_adjustments);
  };

  // Handlers
  const handleApprove = async () => {
    try {
      const url = getEndpointForRequest(selectedRequest);
      if (!url) throw new Error('Unknown document type');
      await usePatchRequest(url, { approval_status: 'approved' });
      revalidateAll();
      toast.success(`${selectedRequest.documentNumber} approved successfully`);
    } catch (error) {
      console.error('Approval failed:', error);
      toast.error(error?.message || 'Failed to approve request');
    } finally {
      approvalDialog.onFalse();
      setSelectedRequest(null);
      setApprovalComments('');
    }
  };

  const handleReject = async () => {
    try {
      const url = getEndpointForRequest(selectedRequest);
      if (!url) throw new Error('Unknown document type');
      await usePatchRequest(url, { approval_status: 'rejected' });
      revalidateAll();
      toast.success(`${selectedRequest.documentNumber} rejected`);
    } catch (error) {
      console.error('Rejection failed:', error);
      toast.error(error?.message || 'Failed to reject request');
    } finally {
      rejectionDialog.onFalse();
      setSelectedRequest(null);
      setRejectionReason('');
    }
  };

  const toggleRowExpansion = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" color="#1a1a1a" fontWeight={700} gutterBottom>
          Store & Inventory Approvals
        </Typography>
        <Typography variant="body1" color="#6b7280">
          Review and approve store transactions and adjustments
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        The approvals desk should separate waiting requests, escalations, and closed decisions so
        approvers can act on the right document without losing the audit trail.
      </Alert>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Pending Approval"
            value={stats.pending}
            icon="solar:clock-circle-bold-duotone"
            iconColor="#eab308"
            gradientFrom="#eab308"
            gradientTo="#ca8a04"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Approved"
            value={stats.approved}
            icon="solar:check-circle-bold-duotone"
            iconColor="#10b981"
            gradientFrom="#10b981"
            gradientTo="#059669"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Rejected"
            value={stats.rejected}
            icon="solar:close-circle-bold-duotone"
            iconColor="#ef4444"
            gradientFrom="#ef4444"
            gradientTo="#dc2626"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Requests"
            value={stats.total}
            icon="solar:document-text-bold-duotone"
            iconColor="#2563eb"
            gradientFrom="#2563eb"
            gradientTo="#1d4ed8"
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3, border: '1px solid #e5e7eb', borderRadius: 2, boxShadow: 'none' }}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                placeholder="Search by document number, requester, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" sx={{ color: '#9ca3af' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MuiAutocomplete
                options={typeOptions}
                value={filterType}
                onChange={(event, newValue) => setFilterType(newValue)}
                placeholder="All Document Types"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MuiAutocomplete
                options={statusOptions}
                value={filterStatus}
                onChange={(event, newValue) => setFilterStatus(newValue)}
                placeholder="All Status"
              />
            </Grid>
          </Grid>
        </Box>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ border: '1px solid #e5e7eb', borderRadius: 2, boxShadow: 'none' }}>
            <TableContainer>
              <Table size={dense ? 'small' : 'medium'}>
                <TableHead sx={{ bgcolor: '#f9fafb' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Document</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Requested By</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      Value
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Approval Level</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRequests.map((request) => {
                    const isExpanded = expandedRows.includes(request.id);

                    return (
                      <React.Fragment key={request.id}>
                        <TableRow
                          selected={request.id === selectedDeskRequest?.id}
                          onClick={() => setSelectedRequestId(request.id)}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: '#f9fafb',
                            },
                          }}
                        >
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <IconButton
                                size="small"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toggleRowExpansion(request.id);
                                }}
                                sx={{
                                  '&:hover': {
                                    bgcolor: '#f3f4f6',
                                  },
                                }}
                              >
                                <Iconify
                                  icon={
                                    isExpanded
                                      ? 'solar:alt-arrow-up-bold-duotone'
                                      : 'solar:alt-arrow-down-bold-duotone'
                                  }
                                  width={20}
                                />
                              </IconButton>
                              <Box>
                                <Typography variant="body2" fontWeight={600} color="#1a1a1a">
                                  {request.documentNumber}
                                </Typography>
                                <Typography variant="caption" color="#6b7280">
                                  {request.description}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Iconify
                                icon={getDocumentIcon(request.documentType)}
                                width={20}
                                sx={{ color: '#2563eb' }}
                              />
                              <Typography variant="body2">{request.documentType}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} color="#1a1a1a">
                              {request.requestedBy}
                            </Typography>
                            <Typography variant="caption" color="#6b7280">
                              {request.department}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="#6b7280">
                              {new Date(request.requestDate).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                ...getPriorityColor(request.priority),
                                display: 'inline-block',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1,
                                fontSize: '0.875rem',
                                fontWeight: 600,
                              }}
                            >
                              {request.priority}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>
                              {request.totalValue ? `৳${request.totalValue.toLocaleString()}` : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="#6b7280">
                              Level {request.currentLevel} of {request.totalLevels}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                ...getStatusColor(request.status),
                                display: 'inline-block',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1,
                                fontSize: '0.875rem',
                                fontWeight: 600,
                              }}
                            >
                              {request.status}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {request.status === 'Pending' ? (
                              <Stack direction="row" spacing={1}>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setSelectedRequest(request);
                                    approvalDialog.onTrue();
                                  }}
                                  sx={{
                                    bgcolor: '#10b981',
                                    '&:hover': {
                                      bgcolor: '#059669',
                                    },
                                    borderRadius: 1.5,
                                    textTransform: 'none',
                                  }}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setSelectedRequest(request);
                                    rejectionDialog.onTrue();
                                  }}
                                  sx={{
                                    bgcolor: '#ef4444',
                                    '&:hover': {
                                      bgcolor: '#dc2626',
                                    },
                                    borderRadius: 1.5,
                                    textTransform: 'none',
                                  }}
                                >
                                  Reject
                                </Button>
                              </Stack>
                            ) : (
                              <Button
                                variant="contained"
                                size="small"
                                sx={{
                                  bgcolor: '#2563eb',
                                  '&:hover': {
                                    bgcolor: '#1d4ed8',
                                  },
                                  borderRadius: 1.5,
                                  textTransform: 'none',
                                }}
                              >
                                View
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell colSpan={9} sx={{ p: 0, border: 'none' }}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 3, bgcolor: '#f9fafb' }}>
                                <Typography variant="h6" fontWeight={600} mb={2}>
                                  Approval History
                                </Typography>
                                <Stack spacing={2}>
                                  {request.approvalHistory.map((history, index) => (
                                    <Card key={index} sx={{ p: 2, border: '1px solid #e5e7eb' }}>
                                      <Stack spacing={1.5}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                          <Box
                                            sx={{
                                              ...getStatusColor(history.action),
                                              px: 1.5,
                                              py: 0.5,
                                              borderRadius: 1,
                                              fontSize: '0.75rem',
                                              fontWeight: 600,
                                            }}
                                          >
                                            Level {history.level}
                                          </Box>
                                          <Typography variant="body2" fontWeight={600}>
                                            {history.approver}
                                          </Typography>
                                          <Typography variant="body2" color="#6b7280">
                                            ({history.role})
                                          </Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                          <Stack
                                            direction="row"
                                            spacing={0.5}
                                            alignItems="center"
                                            sx={{
                                              color:
                                                history.action === 'Approved'
                                                  ? '#10b981'
                                                  : history.action === 'Rejected'
                                                    ? '#ef4444'
                                                    : '#eab308',
                                            }}
                                          >
                                            <Iconify
                                              icon={
                                                history.action === 'Approved'
                                                  ? 'solar:check-circle-bold-duotone'
                                                  : history.action === 'Rejected'
                                                    ? 'solar:close-circle-bold-duotone'
                                                    : 'solar:clock-circle-bold-duotone'
                                              }
                                              width={16}
                                            />
                                            <Typography variant="caption">
                                              {history.action}
                                            </Typography>
                                          </Stack>
                                          {history.date && (
                                            <Typography variant="caption" color="#6b7280">
                                              {new Date(history.date).toLocaleString()}
                                            </Typography>
                                          )}
                                        </Stack>
                                        {history.comments && (
                                          <Typography variant="body2" color="#374151">
                                            <strong>Comments:</strong> {history.comments}
                                          </Typography>
                                        )}
                                      </Stack>
                                    </Card>
                                  ))}
                                </Stack>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Box
              sx={{
                p: 2,
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <FormControl>
                <FormControlLabel
                  control={<Switch checked={dense} onChange={handleChangeDense} />}
                  label="Dense"
                />
              </FormControl>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="#6b7280">
                  Showing {(page - 1) * ROWS_PER_PAGE + 1}-
                  {Math.min(page * ROWS_PER_PAGE, filteredRequests.length)} of{' '}
                  {filteredRequests.length}
                </Typography>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handleChangePage}
                  color="primary"
                />
              </Stack>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Selected Approval Review
                </Typography>
                {selectedDeskRequest ? (
                  <Stack spacing={1.5}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedDeskRequest.documentNumber || 'Approval request'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedDeskRequest.documentType || 'Document type'}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip
                        label={selectedDeskRequest.status || 'Unknown'}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(selectedDeskRequest.status).bgcolor,
                          color: getStatusColor(selectedDeskRequest.status).color,
                          fontWeight: 700,
                        }}
                      />
                      <Chip
                        label={selectedDeskRequest.priority || 'Medium'}
                        size="small"
                        sx={{
                          bgcolor: getPriorityColor(selectedDeskRequest.priority).bgcolor,
                          color: getPriorityColor(selectedDeskRequest.priority).color,
                          fontWeight: 700,
                        }}
                      />
                    </Stack>

                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 6 }}>
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                          Level {selectedDeskRequest.currentLevel || 0}/
                          {selectedDeskRequest.totalLevels || 0}
                        </Alert>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Alert severity="warning" sx={{ borderRadius: 2 }}>
                          {selectedDeskRequest.requestedBy || 'Requester'}
                        </Alert>
                      </Grid>
                    </Grid>

                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Description
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedDeskRequest.description || 'Description not captured'}
                      </Typography>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Next control action
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {normalizeStatus(selectedDeskRequest.status) === 'pending'
                          ? 'Review the document details and either approve it forward or reject it with a clear reason.'
                          : normalizeStatus(selectedDeskRequest.status) === 'approved'
                            ? 'This request is approved. Confirm the downstream operation was completed and logged.'
                            : 'This request was rejected. Review the rejection reason and decide whether a corrected resubmission is needed.'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        Approval history count
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedDeskRequest.approvalHistory?.length || 0} history steps recorded.
                      </Typography>
                    </Box>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select an approval request to review document context and next action.
                  </Typography>
                )}
              </Box>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Approval Control Queue
                </Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fff7ed' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Pending
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {approvalControls.pending} requests are waiting for a decision.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#ecfdf5' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Approved
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {approvalControls.approved} requests have completed approval and should be
                      checked for downstream action.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fef2f2' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Rejected
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {approvalControls.rejected} requests need correction, clarification, or
                      closure.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#eff6ff' }}>
                    <Typography variant="body2" fontWeight={700}>
                      Urgent priority
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {approvalControls.urgent} requests are marked urgent and should be reviewed
                      first.
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Approval Dialog */}
      <Dialog
        open={approvalDialog.value && selectedRequest !== null}
        onClose={() => {
          approvalDialog.onFalse();
          setSelectedRequest(null);
          setApprovalComments('');
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        {/* Dialog Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            px: 3,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'rgba(255,255,255,0.2)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify icon="solar:check-circle-bold-duotone" width={24} sx={{ color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h6" color="white" fontWeight={700}>
                Approve Request
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                {selectedRequest?.documentNumber}
              </Typography>
            </Box>
          </Stack>
          <IconButton
            onClick={() => {
              approvalDialog.onFalse();
              setSelectedRequest(null);
              setApprovalComments('');
            }}
            sx={{
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)',
              },
            }}
          >
            <Iconify icon="solar:close-circle-bold-duotone" width={24} />
          </IconButton>
        </Box>

        <Box sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* Request Summary */}
            <Card sx={{ bgcolor: '#f9fafb', p: 2.5, border: '1px solid #e5e7eb' }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Request Details
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="#6b7280">
                    Document Type:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedRequest?.documentType}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="#6b7280">
                    Requested By:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedRequest?.requestedBy}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="#6b7280">
                    Department:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedRequest?.department}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="#6b7280">
                    Request Date:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedRequest?.requestDate &&
                      new Date(selectedRequest.requestDate).toLocaleDateString()}
                  </Typography>
                </Grid>
                {selectedRequest?.totalValue && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="#6b7280">
                      Total Value:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      ৳{selectedRequest.totalValue.toLocaleString()}
                    </Typography>
                  </Grid>
                )}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="#6b7280">
                    Approval Level:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    Level {selectedRequest?.currentLevel} of {selectedRequest?.totalLevels}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="#6b7280">
                    Description:
                  </Typography>
                  <Typography variant="body2" fontWeight={600} mt={0.5}>
                    {selectedRequest?.description}
                  </Typography>
                </Grid>
              </Grid>
            </Card>

            {/* Comments */}
            <Box>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Approval Comments (Optional)"
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                placeholder="Add any comments or notes about this approval..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>

            {/* Actions */}
            <Stack direction="row" justifyContent="flex-end" spacing={2}>
              <Button
                variant="outlined"
                onClick={() => {
                  approvalDialog.onFalse();
                  setSelectedRequest(null);
                  setApprovalComments('');
                }}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleApprove}
                sx={{
                  bgcolor: '#10b981',
                  '&:hover': {
                    bgcolor: '#059669',
                  },
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                }}
              >
                Confirm Approval
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog
        open={rejectionDialog.value && selectedRequest !== null}
        onClose={() => {
          rejectionDialog.onFalse();
          setSelectedRequest(null);
          setRejectionReason('');
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        {/* Dialog Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            px: 3,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'rgba(255,255,255,0.2)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify icon="solar:close-circle-bold-duotone" width={24} sx={{ color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h6" color="white" fontWeight={700}>
                Reject Request
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                {selectedRequest?.documentNumber}
              </Typography>
            </Box>
          </Stack>
          <IconButton
            onClick={() => {
              rejectionDialog.onFalse();
              setSelectedRequest(null);
              setRejectionReason('');
            }}
            sx={{
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)',
              },
            }}
          >
            <Iconify icon="solar:close-circle-bold-duotone" width={24} />
          </IconButton>
        </Box>

        <Box sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* Warning */}
            <Alert severity="error" icon={<Iconify icon="solar:danger-triangle-bold-duotone" />}>
              <AlertTitle>Important</AlertTitle>
              Rejecting this request will stop the approval process. Please provide a clear reason
              for rejection.
            </Alert>

            {/* Request Summary */}
            <Card sx={{ bgcolor: '#f9fafb', p: 2.5, border: '1px solid #e5e7eb' }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Request Details
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="#6b7280">
                    Document Type:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedRequest?.documentType}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="#6b7280">
                    Requested By:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedRequest?.requestedBy}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="#6b7280">
                    Description:
                  </Typography>
                  <Typography variant="body2" fontWeight={600} mt={0.5}>
                    {selectedRequest?.description}
                  </Typography>
                </Grid>
              </Grid>
            </Card>

            {/* Rejection Reason */}
            <Box>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Rejection Reason *"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a detailed reason for rejection..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>

            {/* Actions */}
            <Stack direction="row" justifyContent="flex-end" spacing={2}>
              <Button
                variant="outlined"
                onClick={() => {
                  rejectionDialog.onFalse();
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                sx={{
                  bgcolor: '#ef4444',
                  '&:hover': {
                    bgcolor: '#dc2626',
                  },
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  '&.Mui-disabled': {
                    opacity: 0.5,
                  },
                }}
              >
                Confirm Rejection
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Dialog>
    </Box>
  );
}
