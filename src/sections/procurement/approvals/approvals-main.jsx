'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { useMemo, useState, useCallback } from 'react';

// MUI imports
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { Container } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.procurement_management;

// Format currency
const formatCurrency = (amount) => `৳${Number(amount).toLocaleString()}`;

// Statistics Card Component
const StatCard = ({ icon, label, value, bgColor, iconBgColor, iconColor, borderColor }) => (
  <Card
    sx={{
      p: 3,
      bgcolor: bgColor,
      border: `1px solid ${borderColor}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderRadius: 2,
      transition: 'all 0.3s',
      '&:hover': {
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transform: 'translateY(-2px)',
      },
    }}
  >
    <Stack direction="row" spacing={2} alignItems="center">
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          bgcolor: iconBgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon icon={icon} width={28} style={{ color: iconColor }} />
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h4" fontWeight="bold">
          {value}
        </Typography>
      </Box>
    </Stack>
  </Card>
);

// Main Component
export default function ApprovalsMain() {
  const { data: apiData, loading: apiLoading } = useGetRequest(EP.approval_requests);
  const requests = useMemo(() => apiData?.results || apiData || [], [apiData]);

  const [filterStatus, setFilterStatus] = useState('Pending');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
  const [approvalComments, setApprovalComments] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Statistics calculations
  const stats = useMemo(
    () => ({
      pending: requests.filter((r) => r.status === 'Pending').length,
      approved: requests.filter((r) => r.status === 'Approved').length,
      rejected: requests.filter((r) => r.status === 'Rejected').length,
      total: requests.length,
    }),
    [requests]
  );

  // Filtered requests
  const filteredRequests = useMemo(
    () =>
      requests.filter((req) => {
        const matchesSearch =
          (req.reference_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (req.created_by || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (req.description || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
        const matchesType = filterType === 'all' || req.type === filterType;

        return matchesSearch && matchesStatus && matchesType;
      }),
    [requests, searchTerm, filterStatus, filterType]
  );

  // Paginated requests
  const paginatedRequests = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredRequests.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredRequests, page, rowsPerPage]);

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle approval action
  const handleApprovalAction = (request, action) => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setApprovalComments('');
    setShowApprovalModal(true);
  };

  // Handle confirm approval/rejection
  const handleConfirmAction = useCallback(async () => {
    if (approvalAction === 'reject' && !approvalComments.trim()) {
      toast.error('Comments are required for rejection');
      return;
    }

    try {
      // Update approval request status via API
      await axiosInstance.patch(`${EP.approval_requests}${selectedRequest.id}/`, {
        status: approvalAction === 'approve' ? 'Approved' : 'Rejected',
      });

      // Create approval history record
      await axiosInstance.post(EP.approval_history, {
        approval_request: selectedRequest.id,
        action: approvalAction === 'approve' ? 'Approved' : 'Rejected',
        comments: approvalComments,
      });

      mutate(EP.approval_requests);
      toast.success(approvalAction === 'approve' ? 'Request approved' : 'Request rejected');
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }

    // Close modal and reset
    setShowApprovalModal(false);
    setSelectedRequest(null);
    setApprovalAction(null);
    setApprovalComments('');
  }, [approvalAction, approvalComments, selectedRequest]);

  // Handle view history
  const handleViewHistory = useCallback(async (request) => {
    setSelectedRequest(request);
    setHistoryLoading(true);
    setShowHistoryModal(true);
    try {
      const res = await axiosInstance.get(EP.approval_history, {
        params: { approval_request: request.id },
      });
      setSelectedHistory(res.data?.results || res.data || []);
    } catch (err) {
      setSelectedHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent':
        return { bg: '#ffebee', color: '#c62828' };
      case 'High':
        return { bg: '#fff3e0', color: '#e65100' };
      case 'Normal':
        return { bg: '#e3f2fd', color: '#1976d2' };
      default:
        return { bg: '#f5f5f5', color: '#616161' };
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return { bg: '#fff9c4', color: '#f57f17' };
      case 'Approved':
        return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'Rejected':
        return { bg: '#ffebee', color: '#c62828' };
      default:
        return { bg: '#f5f5f5', color: '#616161' };
    }
  };

  return (
    <Container maxWidth="2xl" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4, px: { xs: 2, md: 3 } }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Approval System
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review and approve procurement requests
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ mb: 4, px: 1 }}>
        <Grid container spacing={1.5} sx={{ m: 0, width: '100%' }}>
          <Grid item xs={12} sm={6} md={4} lg={2.4} sx={{ flex: { lg: '1 1 0' } }}>
            <StatCard
              icon="solar:clock-circle-bold"
              label="Pending Approval"
              value={stats.pending}
              bgColor="#fffbf0"
              iconBgColor="#fef3c7"
              iconColor="#d97706"
              borderColor="#fde68a"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2.4} sx={{ flex: { lg: '1 1 0' } }}>
            <StatCard
              icon="solar:check-circle-bold"
              label="Approved"
              value={stats.approved}
              bgColor="#f0fdf4"
              iconBgColor="#d1fae5"
              iconColor="#059669"
              borderColor="#a7f3d0"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2.4} sx={{ flex: { lg: '1 1 0' } }}>
            <StatCard
              icon="solar:close-circle-bold"
              label="Rejected"
              value={stats.rejected}
              bgColor="#fef2f2"
              iconBgColor="#fecaca"
              iconColor="#dc2626"
              borderColor="#fca5a5"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2.4} sx={{ flex: { lg: '1 1 0' } }}>
            <StatCard
              icon="solar:document-text-bold"
              label="Total Requests"
              value={stats.total}
              bgColor="#eff6ff"
              iconBgColor="#dbeafe"
              iconColor="#2563eb"
              borderColor="#bfdbfe"
            />
          </Grid>
        </Grid>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 4, px: 1 }}>
        <Card sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon icon="eva:search-fill" width={20} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              label="Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              label="Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="Purchase Requisition">Purchase Requisition</MenuItem>
              <MenuItem value="Purchase Order">Purchase Order</MenuItem>
              <MenuItem value="Quotation">Quotation</MenuItem>
            </TextField>
          </Stack>
        </Card>
      </Box>

      {/* Approval Requests List */}
      <Box sx={{ px: 1 }}>
        <Stack spacing={2}>
          {paginatedRequests.length > 0 ? (
            paginatedRequests.map((request) => {
              const priorityColor = getPriorityColor(request.priority);
              const statusColor = getStatusColor(request.status);

              return (
                <Card
                  key={request.id}
                  sx={{
                    p: 3,
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                    {/* Left side - Main content */}
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            bgcolor: '#e3f2fd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon
                            icon="solar:document-text-bold"
                            width={24}
                            style={{ color: '#1976d2' }}
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {request.reference_number}
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Chip
                              label={request.priority}
                              size="small"
                              sx={{
                                bgcolor: priorityColor.bg,
                                color: priorityColor.color,
                                fontWeight: 600,
                              }}
                            />
                            <Chip
                              label={request.status}
                              size="small"
                              sx={{
                                bgcolor: statusColor.bg,
                                color: statusColor.color,
                                fontWeight: 600,
                              }}
                            />
                          </Stack>
                        </Box>
                      </Stack>

                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {request.description}
                      </Typography>

                      <Grid container spacing={2} mb={2}>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            Type
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {request.type}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            Requested By
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {request.created_by}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            Project
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {request.project}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            Amount
                          </Typography>
                          <Typography variant="body2" fontWeight={600} color="primary">
                            {formatCurrency(request.amount)}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <Icon
                          icon="solar:info-circle-bold"
                          width={16}
                          style={{ color: '#1976d2' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Approval Level: {request.approval_level} of {request.total_levels} •
                          Current Approver: {request.current_approver}
                        </Typography>
                      </Stack>
                    </Box>

                    {/* Right side - Action buttons */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 180 }}>
                      {request.status === 'Pending' && (
                        <>
                          <Button
                            variant="contained"
                            startIcon={<Icon icon="solar:check-circle-bold" width={18} />}
                            onClick={() => handleApprovalAction(request, 'approve')}
                            sx={{
                              bgcolor: '#2e7d32',
                              '&:hover': { bgcolor: '#1b5e20' },
                              textTransform: 'none',
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="contained"
                            startIcon={<Icon icon="solar:close-circle-bold" width={18} />}
                            onClick={() => handleApprovalAction(request, 'reject')}
                            sx={{
                              bgcolor: '#c62828',
                              '&:hover': { bgcolor: '#b71c1c' },
                              textTransform: 'none',
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outlined"
                        startIcon={<Icon icon="solar:chat-round-dots-bold" width={18} />}
                        onClick={() => handleViewHistory(request)}
                        sx={{ textTransform: 'none' }}
                      >
                        View History
                      </Button>
                    </Box>
                  </Stack>
                </Card>
              );
            })
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Icon icon="solar:document-text-bold" width={64} style={{ color: '#bdbdbd' }} />
              <Typography variant="h6" color="text.secondary" mt={2}>
                No approval requests found
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Pagination */}
        {filteredRequests.length > 0 && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <TablePagination
              component="div"
              count={filteredRequests.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Box>
        )}
      </Box>

      {/* Approval Action Modal */}
      <Dialog
        open={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedRequest && (
          <>
            <DialogTitle
              sx={{
                background:
                  approvalAction === 'approve'
                    ? 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)'
                    : 'linear-gradient(135deg, #c62828 0%, #b71c1c 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Icon
                icon={
                  approvalAction === 'approve'
                    ? 'solar:check-circle-bold'
                    : 'solar:close-circle-bold'
                }
                width={32}
              />
              <Box>
                <Typography variant="h6">
                  {approvalAction === 'approve' ? 'Approve Request' : 'Reject Request'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {selectedRequest.reference_number}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Requested By
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedRequest.created_by}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Department
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedRequest.department}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Project
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedRequest.project}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Amount
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="primary">
                      {formatCurrency(selectedRequest.amount)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body2">{selectedRequest.description}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={4}
                label={approvalAction === 'reject' ? 'Comments / Remarks *' : 'Comments / Remarks'}
                placeholder="Enter your comments..."
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                helperText={
                  approvalAction === 'reject' ? 'Comments are required for rejection' : 'Optional'
                }
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={() => setShowApprovalModal(false)} sx={{ textTransform: 'none' }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleConfirmAction}
                disabled={approvalAction === 'reject' && !approvalComments.trim()}
                sx={{
                  bgcolor: approvalAction === 'approve' ? '#2e7d32' : '#c62828',
                  '&:hover': {
                    bgcolor: approvalAction === 'approve' ? '#1b5e20' : '#b71c1c',
                  },
                  textTransform: 'none',
                }}
              >
                Confirm {approvalAction === 'approve' ? 'Approval' : 'Rejection'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Approval History Modal */}
      <Dialog
        open={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Icon icon="solar:chat-round-dots-bold" width={32} />
          <Box>
            <Typography variant="h6">Approval History</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Complete approval trail
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedHistory.length > 0 ? (
            <Stack spacing={2}>
              {selectedHistory.map((history) => (
                <Box
                  key={history.id}
                  sx={{
                    bgcolor: '#f5f5f5',
                    borderLeft: '4px solid #1976d2',
                    p: 2,
                    borderRadius: 2,
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                    <Icon
                      icon={
                        history.action === 'Approved'
                          ? 'solar:check-circle-bold'
                          : 'solar:close-circle-bold'
                      }
                      width={24}
                      style={{
                        color: history.action === 'Approved' ? '#2e7d32' : '#c62828',
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {history.approver}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {history.role}
                      </Typography>
                    </Box>
                    <Chip
                      label={history.action}
                      size="small"
                      sx={{
                        bgcolor: history.action === 'Approved' ? '#e8f5e9' : '#ffebee',
                        color: history.action === 'Approved' ? '#2e7d32' : '#c62828',
                        fontWeight: 600,
                      }}
                    />
                  </Stack>
                  <Typography variant="body2" mb={1}>
                    {history.comments}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Level {history.level} •{' '}
                    {history.created_at
                      ? new Date(history.created_at).toLocaleString()
                      : history.date}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Icon icon="solar:chat-round-dots-bold" width={64} style={{ color: '#bdbdbd' }} />
              <Typography variant="h6" color="text.secondary" mt={2}>
                No approval history available
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setShowHistoryModal(false)} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
