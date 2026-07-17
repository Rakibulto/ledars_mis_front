'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

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
  Switch,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  InputLabel,
  Pagination,
  Typography,
  DialogTitle,
  FormControl,
  DialogActions,
  DialogContent,
  InputAdornment,
  TableContainer,
  FormControlLabel,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axios, { endpoints } from 'src/utils/axios';

import { useGetRequest, useDeleteRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import TableRowSkeleton from 'src/components/table/tableRowSkeleton';

import SummaryCard from '../../_components/summary-card';

// Reusable Case Table Row Component
function CaseTableRow({ caseItem, setDeleteCaseId, confirm, onEdit }) {
  const router = useRouter();
  const getStatusColor = (status) => {
    switch (status) {
      case 'Open':
        return { bg: '#fef3c7', color: '#92400e' };
      case 'In Progress':
        return { bg: '#dbeafe', color: '#1e40af' };
      case 'Resolved':
        return { bg: '#d1fae5', color: '#065f46' };
      case 'Closed':
        return { bg: '#f3f4f6', color: '#6b7280' };
      default:
        return { bg: '#f9fafb', color: '#374151' };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return { bg: '#fee2e2', color: '#991b1b' };
      case 'Medium':
        return { bg: '#fef3c7', color: '#92400e' };
      case 'Low':
        return { bg: '#d1fae5', color: '#065f46' };
      default:
        return { bg: '#f9fafb', color: '#374151' };
    }
  };

  return (
    <TableRow
      sx={{
        '&:hover': {
          bgcolor: '#f9fafb',
        },
        borderBottom: '1px solid #f3f4f6',
      }}
    >
      {/* Case ID */}
      <TableCell>
        <Typography variant="body2" fontWeight={600} color="#1a1a1a">
          {caseItem?.id}
        </Typography>
      </TableCell>

      {/* Beneficiary */}
      <TableCell>
        <Typography variant="body2" color="#1a1a1a">
          {caseItem?.beneficiary_info?.name}
        </Typography>
      </TableCell>

      {/* Case Type */}
      <TableCell>
        <Typography variant="body2" color="#1a1a1a" fontWeight={500}>
          {caseItem?.case_type}
        </Typography>
      </TableCell>

      {/* Priority */}
      <TableCell align="center">
        <Chip
          label={caseItem?.priority}
          size="small"
          sx={{
            bgcolor: getPriorityColor(caseItem?.priority).bg,
            color: getPriorityColor(caseItem?.priority).color,
            fontWeight: 600,
          }}
        />
      </TableCell>

      {/* Status */}
      <TableCell align="center">
        <Chip
          label={caseItem?.status}
          size="small"
          sx={{
            bgcolor: getStatusColor(caseItem?.status).bg,
            color: getStatusColor(caseItem?.status).color,
            fontWeight: 600,
          }}
        />
      </TableCell>

      {/* Case Worker */}
      <TableCell>
        <Typography variant="body2" color="#1a1a1a">
          {caseItem?.case_worke_name}
        </Typography>
      </TableCell>

      {/* Opened */}
      <TableCell>
        <Typography variant="body2" color="#6b7280">
          {new Date(caseItem?.created_at).toLocaleDateString()}
        </Typography>
      </TableCell>

      {/* Next Follow-up */}
      <TableCell>
        <Typography variant="body2" color="#6b7280">
          {caseItem?.next_follow_up
            ? new Date(caseItem?.next_follow_up).toLocaleDateString()
            : 'Not scheduled'}
        </Typography>
      </TableCell>

      {/* Actions */}
      <TableCell align="center">
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <IconButton
            onClick={() => router.push(`/dashboard/beneficiaries/case-management/${caseItem?.id}`)}
            size="small"
            sx={{
              color: '#2563eb',
              '&:hover': {
                bgcolor: (theme) => `rgba(${theme.palette.primary.main}, 0.08)`,
              },
            }}
          >
            <Iconify icon="solar:eye-bold" width={18} />
          </IconButton>
          <IconButton
            onClick={() => onEdit(caseItem)}
            size="small"
            sx={{
              color: '#059669',
              '&:hover': {
                bgcolor: (theme) => `rgba(${theme.palette.success.main}, 0.08)`,
              },
            }}
          >
            <Iconify icon="solar:pen-bold" width={18} />
          </IconButton>
          <IconButton
            onClick={() => {
              setDeleteCaseId(caseItem?.id);
              confirm.onTrue();
            }}
            size="small"
            sx={{
              color: '#ef4444',
              '&:hover': {
                bgcolor: (theme) => `rgba(${theme.palette.error.main}, 0.08)`,
              },
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

// Fallback data removed - using real API data

export default function CaseManagementMain() {
  const [page, setPage] = useState(1);
  const [dense, setDense] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const dialogOpen = useBoolean();
  const confirm = useBoolean();
  const [editingCase, setEditingCase] = useState(null); // null = Create mode, object = Edit mode

  // ============================================
  // FORM CONFIGURATION
  // ============================================
  const INITIAL_FORM = {
    beneficiary: null,
    case_type: '',
    priority: 'Medium',
    status: 'Open',
    opened_date: null,
    description: '',
    interventions: null,
    next_follow_up: null,
    case_worker: null,
  };

  const { control, handleSubmit, reset } = useForm({
    mode: 'onBlur',
    defaultValues: INITIAL_FORM,
  });

  // ============================================
  // API DATA FETCHING
  // ============================================
  const { data: simpleBeneficiaries } = useGetRequest(
    `${endpoints.beneficiaries.simple_beneficiaries}`
  );

  const {
    data: caseFileData,
    loading,
    error,
  } = useGetRequest(
    `${endpoints.beneficiaries.case_management}?search=${searchQuery}&status=${statusFilter}&priority=${priorityFilter}&page=${page}&pagination=true`
  );

  const {
    data: summary,
    loading: summaryLoading,
    error: summaryError,
  } = useGetRequest(endpoints.beneficiaries.case_summary || '/api/cases/summary');

  const { data: simpleUsers } = useGetRequest(endpoints.auth.simpleUsers);
  console.log('Simple Users:', simpleUsers);
  const { data: workerData } = useGetRequest(endpoints.beneficiaries.case_worker_assignments);

  const summaryData = useMemo(() => summary || {}, [summary]);
  const caseWorkers = useMemo(() => workerData || [], [workerData]);

  const [deleteCaseId, setDeleteCaseId] = useState(null);
  const deleteRequest = useDeleteRequest;

  // ============================================
  // DIALOG HANDLERS
  // ============================================
  const handleOpenCreateDialog = (editItem) => {
    // setEditingCase(editItem || null);
    reset(INITIAL_FORM);
    dialogOpen.onTrue();
  };

  const handleOpenEditDialog = (caseItem) => {
    // alert('Edit functionality is under development. Please try again later.');
    console.log('Editing case item:', caseItem);
    const seledtedBeneficiary = simpleBeneficiaries?.find((b) => b.id === caseItem?.beneficiary);
    const selectedWorker = simpleUsers?.find((w) => w.id === caseItem?.case_worker);
    setEditingCase(caseItem);
    reset({
      beneficiary: seledtedBeneficiary?.id ?? null,
      case_type: caseItem.case_type ?? '',
      priority: caseItem.priority ?? 'Medium',
      status: caseItem.status ?? 'Open',
      opened_date: caseItem.opened_date ?? null,
      description: caseItem.description ?? '',
      interventions: caseItem.interventions ?? null,
      next_follow_up: caseItem.next_follow_up ?? null,
      case_worker: selectedWorker?.id ?? null,
    });
    dialogOpen.onTrue();
  };

  const handleCloseDialog = () => {
    dialogOpen.onFalse();
    reset(INITIAL_FORM);
    setEditingCase(null);
  };

  // ============================================
  // FORM SUBMISSION
  // ============================================
  const onSubmit = handleSubmit(async (data) => {
    try {
      if (editingCase) {
        // EDIT MODE - PATCH request
        await axios.patch(`${endpoints.beneficiaries.case_management}${editingCase.id}/`, data);
        toast.success('Case updated successfully');
      } else {
        // CREATE MODE - POST request
        await axios.post(endpoints.beneficiaries.case_management, data);
        toast.success('Case created successfully');
      }

      // Refresh data and close
      await mutate(endpoints.beneficiaries.case_management);
      await mutate(endpoints.beneficiaries.case_summary);
      handleCloseDialog();
    } catch (err) {
      toast.error(editingCase ? 'Failed to update case' : 'Failed to create case');
    }
  });

  // ============================================
  // DELETE HANDLER
  // ============================================
  const handleCaseDelete = async () => {
    try {
      await deleteRequest(`${endpoints.beneficiaries.case_management}/${deleteCaseId}/`);
      toast.success('Case deleted successfully');
      await mutate(endpoints.beneficiaries.case_management);
      await mutate(endpoints.beneficiaries.case_summary);
    } catch (err) {
      toast.error('Failed to delete case. Please try again.');
    } finally {
      confirm.onFalse();
    }
  };

  // ============================================
  // PAGINATION
  // ============================================
  const ROWS_PER_PAGE = 10;
  const totalPages = Math.ceil(
    (caseFileData?.count || 0) / (caseFileData?.page_size || ROWS_PER_PAGE)
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeDense = (event) => {
    setDense(event.target.checked);
  };

  //   const casesToDisplay = useMemo(() => {
  //     if (!caseFileData?.results) return [];
  //     return caseFileData.results.filter((caseItem) => {
  //       const matchesSearch =
  //         searchQuery ||
  //         caseItem.case_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //         caseItem.beneficiary_name?.toLowerCase().includes(searchQuery.toLowerCase());
  //       const matchesStatus = !statusFilter || caseItem.status === statusFilter;
  //       const matchesPriority = !priorityFilter || caseItem.priority === priorityFilter;
  //       return matchesSearch && matchesStatus && matchesPriority;
  //     });
  //   }, [caseFileData, searchQuery, statusFilter, priorityFilter]);

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      {/* Header */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="#1a1a1a" gutterBottom>
            Case Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage beneficiary cases, track progress, and ensure timely resolution
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            onClick={handleOpenCreateDialog}
            startIcon={<Iconify icon="mingcute:add-line" />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            New Case
          </Button>
        </Stack>
      </Stack>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Cases"
            value={summaryData?.total_cases ?? 0}
            icon="solar:document-bold-duotone"
            bgcolor="#2563eb90"
            boxShadow="0 4px 20px rgba(37, 99, 235, 0.3)"
            loading={summaryLoading}
            error={summaryError}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Open Cases"
            value={summaryData?.open_cases ?? 0}
            icon="solar:clock-circle-bold-duotone"
            bgcolor="#f59e0b90"
            boxShadow="0 4px 20px rgba(245, 158, 11, 0.3)"
            loading={summaryLoading}
            error={summaryError}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Resolved Cases"
            value={summaryData?.resolved_cases ?? 0}
            icon="solar:check-circle-bold-duotone"
            bgcolor="#10b98190"
            boxShadow="0 4px 20px rgba(16, 185, 129, 0.3)"
            loading={summaryLoading}
            error={summaryError}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="High Priority"
            value={summaryData?.high_priority ?? 0}
            icon="solar:danger-triangle-bold-duotone"
            bgcolor="#ef444490"
            boxShadow="0 4px 20px rgba(239, 68, 68, 0.3)"
            loading={summaryLoading}
            error={summaryError}
          />
        </Grid>
      </Grid>
      {/* Case Worker Load */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
          p: 3,
          mb: 3,
        }}
      >
        <Typography variant="h6" fontWeight={600} color="#1a1a1a" gutterBottom>
          Case Worker Workload
        </Typography>
        {/* 
            {
        "id": 1,
        "case_worker_name": "testuser",
        "created_by": "admin",
        "designation": "Officia autem itaque",
        "area": "Ut provident proide",
        "active_cases": 87,
        "max_capacity": 19,
        "specialization": "Quas in similique du",
        "phone": "+1 (606) 305-9449",
        "email": "gacawuciq@mailinator.com",
        "created_at": "2026-04-07T16:44:38.309551+06:00",
        "case_worker": 4
    }, */}
        <Grid container spacing={3}>
          {caseWorkers?.map((worker, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                  border: '1px solid #e5e7eb',
                  p: 2,
                  height: '100%',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '1rem',
                    }}
                  >
                    {worker?.case_worker_name?.charAt(0)}
                  </Box>
                  <Box>
                    <Typography variant="body1" fontWeight={600} color="#1a1a1a">
                      {worker?.case_worker_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Case Worker
                    </Typography>
                  </Box>
                </Stack>
                <Grid container spacing={1}>
                  <Grid size={4}>
                    <Box textAlign="center">
                      <Typography variant="caption" color="text.secondary" display="block">
                        Active
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="#1a1a1a">
                        {worker?.active_cases}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={4}>
                    <Box textAlign="center">
                      <Typography variant="caption" color="text.secondary" display="block">
                        Closed
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="#1a1a1a">
                        {worker?.closed_cases}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={4}>
                    <Box textAlign="center">
                      <Typography variant="caption" color="text.secondary" display="block">
                        Avg Time
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="#1a1a1a">
                        {worker?.avg_response_time}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Card>

      {/* Search and Filter Bar */}
      <Card
        sx={{
          mb: 3,

          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" sx={{ color: '#9ca3af' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minHeight: 40,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f9fafb',
                    '& fieldset': {
                      borderColor: '#e5e7eb',
                    },
                    '&:hover fieldset': {
                      borderColor: '#d1d5db',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#d1d5db',
                    },
                  },
                }}
                size="small"
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: 2,
                    bgcolor: '#f9fafb',
                    '& fieldset': {
                      borderColor: '#e5e7eb',
                    },
                    '&:hover fieldset': {
                      borderColor: '#d1d5db',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#d1d5db',
                    },
                  }}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="Open">Open</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Resolved">Resolved</MenuItem>
                  <MenuItem value="Closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: 2,
                    bgcolor: '#f9fafb',
                    '& fieldset': {
                      borderColor: '#e5e7eb',
                    },
                    '&:hover fieldset': {
                      borderColor: '#d1d5db',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#d1d5db',
                    },
                  }}
                >
                  <MenuItem value="">All Priority</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Table */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
        <TableContainer>
          <Table size={dense ? 'small' : 'medium'}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                  Case ID
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                  Beneficiary
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                  Case Type
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}
                >
                  Priority
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}
                >
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                  Case Worker
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                  Opened
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                  Next Follow-up
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }, (_, i) => (
                    <TableRowSkeleton
                      key={i}
                      columns={[
                        { type: 'text', lines: 1, width: 100 },
                        { type: 'text', lines: 1, width: 120 },
                        { type: 'text', lines: 1, width: 100 },
                        { type: 'rect', width: 80, height: 24, align: 'center' },
                        { type: 'rect', width: 80, height: 24, align: 'center' },
                        { type: 'text', lines: 1, width: 100 },
                        { type: 'text', lines: 1, width: 80 },
                        { type: 'text', lines: 1, width: 80 },
                        { type: 'circle', count: 3, size: 32, align: 'center' },
                      ]}
                    />
                  ))
                : (caseFileData?.results || []).map((caseItem) => (
                    <CaseTableRow
                      key={caseItem?.id}
                      caseItem={caseItem}
                      setDeleteCaseId={setDeleteCaseId}
                      confirm={confirm}
                      onEdit={handleOpenEditDialog}
                    />
                  ))}

              {(caseFileData?.results || []).length === 0 && !loading && !error && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <Stack alignItems="center" spacing={2}>
                      <Iconify
                        icon="solar:document-bold-duotone"
                        width={64}
                        sx={{ color: '#d1d5db' }}
                      />
                      <Typography variant="h6" color="text.secondary">
                        No cases found
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        Try adjusting your search or filter
                      </Typography>
                      <Typography
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('');
                          setPriorityFilter('');
                          setPage(1);
                        }}
                        variant="body2"
                        color="primary"
                        sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Reset filters to see all cases
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 3, px: 1 }}>
            <FormControlLabel
              control={<Switch checked={dense} onChange={handleChangeDense} />}
              label="Dense"
            />
            <Pagination
              count={totalPages}
              variant="outlined"
              shape="rounded"
              onChange={(event, pageNumber) => {
                setPage(pageNumber);
              }}
            />
          </Box>
        </TableContainer>
      </Card>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Case"
        content="Are you sure you want to delete this case? This action cannot be undone."
        action={
          <Button variant="contained" color="error" onClick={handleCaseDelete}>
            Delete
          </Button>
        }
      />

      {/* Unified Case Dialog - Create & Edit */}
      <Dialog open={dialogOpen.value} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600, color: '#1a1a1a' }}>
          {editingCase ? 'Edit Case' : 'Create New Case'}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {/* Beneficiary */}
            <Controller
              name="beneficiary"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth size="small">
                  <InputLabel>Beneficiary</InputLabel>
                  <Select {...field} value={field.value ?? ''} label="Beneficiary">
                    <MenuItem value="">
                      <em>Select Beneficiary</em>
                    </MenuItem>
                    {simpleBeneficiaries?.map((b) => (
                      <MenuItem key={b.id} value={b.id}>
                        {b.name} ({b.ben_code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            {/* Case Type */}
            <Controller
              name="case_type"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Case Type"
                  placeholder="e.g. Medical, Financial, Emergency"
                  size="small"
                />
              )}
            />

            {/* Priority */}
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select {...field} value={field.value ?? ''} label="Priority">
                    <MenuItem value="">
                      <em>Select Priority</em>
                    </MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                  </Select>
                </FormControl>
              )}
            />

            {/* Status */}
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select {...field} value={field.value ?? ''} label="Status">
                    <MenuItem value="">
                      <em>Select Status</em>
                    </MenuItem>
                    <MenuItem value="Open">Open</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Resolved">Resolved</MenuItem>
                    <MenuItem value="Closed">Closed</MenuItem>
                  </Select>
                </FormControl>
              )}
            />

            {/* Opened Date */}
            <Controller
              name="opened_date"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="date"
                  label="Opened Date"
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              )}
            />

            {/* Case Worker */}
            <Controller
              name="case_worker"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth size="small">
                  <InputLabel>Case Worker</InputLabel>
                  <Select {...field} value={field.value ?? ''} label="Case Worker">
                    <MenuItem value="">
                      <em>Select Case Worker</em>
                    </MenuItem>
                    {simpleUsers?.map((w) => (
                      <MenuItem key={w.id} value={w.id}>
                        {w.username}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            {/* Interventions */}
            <Controller
              name="interventions"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Interventions"
                  placeholder="Describe interventions"
                  size="small"
                />
              )}
            />

            {/* Next Follow Up */}
            <Controller
              name="next_follow_up"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="date"
                  label="Next Follow-up"
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              )}
            />

            {/* Description */}
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Description"
                  placeholder="Write case details..."
                  multiline
                  rows={3}
                  size="small"
                />
              )}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" color="inherit" onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Button variant="contained" onClick={onSubmit} sx={{ borderRadius: 1 }}>
            {editingCase ? 'Update Case' : 'Create Case'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
