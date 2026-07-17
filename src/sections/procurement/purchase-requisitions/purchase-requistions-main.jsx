'use client';

import dayjs from 'dayjs';
import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';

// MUI imports
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Pagination from '@mui/material/Pagination';
import { Tooltip, Container } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import FormControlLabel from '@mui/material/FormControlLabel';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, useDeleteRequest } from 'src/actions/ledars-hook';

import TableRowSkeleton from 'src/components/table/tableRowSkeleton';

import SummaryCard from 'src/sections/_components/summary-card';

const DEPARTMENTS = ['Programs', 'Admin', 'Finance', 'HR', 'IT'];

const APPROVAL_ROUTING = [
  'Procurement Officer',
  'Finance Manager',

  'Procurement Officer',
  'Finance Manager',

  'Director',
  'Executive Director',
];

// Format currency
const formatCurrency = (amount) => `৳${amount.toLocaleString()}`;

// Workflow Step Component
const WorkflowStep = ({ number, title, subtitle, isLast }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
    <Box sx={{ textAlign: 'left', flex: 1 }}>
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          bgcolor: '#E3F2FD',
          color: '#5C6BC0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: 20,
          mb: 1.5,
        }}
      >
        {number}
      </Box>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: '#212121' }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
        {subtitle}
      </Typography>
    </Box>
    {!isLast && (
      <Divider
        sx={{
          width: 80,
          borderWidth: 1,
          borderColor: '#E0E0E0',
          mt: -5,
          mx: 2,
        }}
      />
    )}
  </Box>
);

// Purchase Requisition Table Row Component
function PurchaseRequisitionTableRow({ pr, onView, mutateKey }) {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return { bg: '#f3f4f6', color: '#6b7280' };
      case 'pending':
        return { bg: '#fef3c7', color: '#d97706' };
      case 'approved':
        return { bg: '#d1fae5', color: '#065f46' };
      case 'rejected':
        return { bg: '#fee2e2', color: '#dc2626' };
      case 'po_created':
        return { bg: '#dbeafe', color: '#2563eb' };
      default:
        return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const statusColor = getStatusColor(pr?.status);
  const router = useRouter();
  const deleteData = useDeleteRequest;
  const handleDelete = async (id) => {
    try {
      await deleteData(`${endpoints.procurement.purchase_requisitions}${id}/`);

      toast.success('Purchase Requisition deleted successfully');
      mutate(mutateKey);

      // Navigate back to PR list after deletion

      router.push('/dashboard/procurement/purchase-requisitions/');
    } catch (error) {
      toast.error('Purchase Requisition delete Failed!');
    }
  };

  return (
    <TableRow
      sx={{
        '&:hover': { bgcolor: '#f9fafb' },
        transition: 'background-color 0.2s',
      }}
    >
      <TableCell>
        <Box>
          <Typography variant="subtitle2" fontWeight="bold">
            {pr?.pr_number || pr?.prNumber}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ID: {pr?.id}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {pr?.created_by?.employee_name || '--'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {pr?.created_by?.designation || '--'}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {pr?.department_name || '--'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {pr?.project_name || '--'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            maxWidth: 200,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {pr?.item_count}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight="bold">
          {formatCurrency(pr?.estimated_amount || pr?.estimatedAmount)}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {dayjs(pr?.created_at || pr?.date).format('DD/MM/YYYY')}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={pr?.status}
          size="small"
          sx={{
            bgcolor: statusColor.bg,
            color: statusColor.color,
            '&:hover': { bgcolor: statusColor.bg },
            fontWeight: 600,
            borderRadius: '16px',
          }}
        />
      </TableCell>
      <TableCell align="center">
        <Link
          href={`${paths.dashboard.procurement.purchase_requisitions}/view?pr_id=${pr?.id}`}
          passHref
        >
          <Tooltip title="View Details" arrow placement="bottom">
            <IconButton
              size="small"
              onClick={() => onView && onView(pr)}
              sx={{
                color: 'primary.main',
                '&:hover': { bgcolor: 'primary.lighter' },
              }}
            >
              <Icon icon="eva:eye-fill" width={18} />
            </IconButton>
          </Tooltip>
        </Link>
        {/* <Tooltip title="Delete Item" placement="top">
          <IconButton
            size="small"
            onClick={() => handleDelete(pr?.id)}
            sx={{
              color: 'error.main',
              bgcolor: 'error.lighter',
              '&:hover': {
                bgcolor: 'error.light',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s',
            }}
          >
            <Icon icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Tooltip> */}
      </TableCell>
    </TableRow>
  );
}

// Main Component
export default function PurchaseRequisitionsPage() {
  // main data start
  const [page, setPage] = useState(0);
  const [department, setDepartment] = useState('');
  const [project, setProject] = useState('');
  const [status, setStatus] = useState('');
  const [approver, setApprover] = useState('');
  const [searchquery, setSearchQuery] = useState('');
  const [dense, setDense] = useState(false);
  const listKey = `${endpoints.procurement.purchase_requisitions}?department=${department}&search=${searchquery}&project=${project}&status=${status}&approver=${approver}&page=${page + 1}&pagination=true`;
  const {
    data: prData,
    loading: prDataLoading,
    error: prDataError,
  } = useGetRequest(
    `${endpoints.procurement.purchase_requisitions}?page=${page + 1}&pagination=true`
  );
  const { data: departmentsData, loading: departmentsLoading } = useGetRequest(
    `${endpoints.settings.department}`
  );
  useEffect(() => {
    mutate(`${endpoints.procurement.purchase_requisitions}?pagination=true`);
  }, [page]);
  // /api/purchase-requisitions/?department=...&status=...&search=&page=1&pagination=true
  const {
    data: filteredPrData,
    loading: filteredPrDataLoading,
    error: filteredPrDataError,
  } = useGetRequest(
    `${endpoints.procurement.purchase_requisitions}?department=${department}&search=${searchquery}&project=${project}&status=${status}&approver=${approver}&page=${page + 1}&pagination=true`
  );

  // console.log('filtered datai item:', filteredPrData);

  const {
    data: summary,
    loading: summaryLoading,
    error: summaryError,
  } = useGetRequest(endpoints.procurement.purchase_requisition_summary);
  const { data: allCategories, loading: allCategoriesLoading } = useGetRequest(
    `${endpoints.storeInventory.item_category}` // Assuming this endpoint exists, or adjust as needed
  );

  const ROWS_PER_PAGE = prData?.page_size || 10; // Fallback to 10 if API doesn't provide page_size

  // Calculate total pages based on API response
  const totalPages = useMemo(() => {
    const total = filteredPrData?.total ?? prData?.total ?? 0;

    return Math.ceil(total / ROWS_PER_PAGE);
  }, [filteredPrData?.total, prData?.total, ROWS_PER_PAGE]);

  // Form states
  const [formData, setFormData] = useState({
    prNumber: `PR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
    date: dayjs(),
    priority: 'Normal',
    requestedBy: 'Current User',
    department: '',
    project: '',
    purpose: '',
    requiredBy: null,
    approvalRouting: '',
    notes: '',
    items: [{ description: '', quantity: 1, unit: 'Pcs', unitPrice: 0 }],
  });

  // Statistics calculations
  const stats = useMemo(
    () => ({
      total: summary?.total_prs ?? 0,
      draft: summary?.draft_prs ?? 0,
      submitted: summary?.submitted_prs ?? 0,
      approved: summary?.approved_prs ?? 0,
      poCreated: summary?.po_created_prs ?? 0,
    }),
    [summary]
  );

  // PRs to display are simply the paginated results from the API
  const prsToDisplay = useMemo(() => {
    console.log('API prData:'); // Debug log to check API response structure
    return filteredPrData?.results ? filteredPrData?.results : prData?.results || [];
  }, [prData, filteredPrData]);

  // Handlers
  const handleChangePage = (event, newPage) => {
    // newPage is 0-based index from MUI TablePagination
    setPage(newPage);
  };

  const handleChangeDense = (event) => {
    setDense(event.target.checked);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="2xl" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4, px: { xs: 2, md: 3 } }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            flexWrap="wrap"
            gap={2}
          >
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Procurement Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage purchase requisitions and orders
              </Typography>
            </Box>
            <Link href={`${paths.dashboard.procurement.add_purchase_requisition}`} passHref>
              <Button
                variant="outlined"
                startIcon={<Icon icon="eva:plus-fill" width={20} />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  fontWeight: 600,
                  px: 3,
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: (theme) => `rgba(${theme.palette.primary.main}, 0.04)`,
                  },
                }}
              >
                New Purchase Requisition
              </Button>
            </Link>
          </Stack>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <SummaryCard
              title="Total PRs"
              value={summary?.total_prs ?? 0}
              icon="solar:document-text-bold-duotone"
              bgcolor="#2563EB90"
              boxShadow="0 4px 20px rgba(37, 99, 235, 0.3)"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <SummaryCard
              title="Draft"
              value={summary?.draft ?? 0}
              icon="solar:clipboard-list-bold-duotone"
              bgcolor="#F59E0B90"
              boxShadow="0 4px 20px rgba(245, 158, 11, 0.3)"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <SummaryCard
              title="Approved"
              value={summary?.approved ?? 0}
              icon="solar:check-circle-bold-duotone"
              bgcolor="#10B98190"
              boxShadow="0 4px 20px rgba(16, 185, 129, 0.3)"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <SummaryCard
              title="Submitted"
              value={summary?.submitted ?? 0}
              icon="solar:cart-bold-duotone"
              bgcolor="#0EA5E990"
              boxShadow="0 4px 20px rgba(14, 165, 233, 0.3)"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <SummaryCard
              title="PO Created"
              value={summary?.po_created ?? 0}
              icon="solar:cart-bold-duotone"
              bgcolor="#8B5CF690"
              boxShadow="0 4px 20px rgba(139, 92, 246, 0.3)"
            />
          </Grid>
        </Grid>

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
              <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {/* Search */}
                <TextField
                  placeholder="Search PRs..."
                  value={searchquery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Icon icon="eva:search-fill" sx={{ color: '#9ca3af' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    minHeight: 40,
                    flexGrow: 1,
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
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                {/* Status Filter */}
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  label="Status"
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
                  <MenuItem value="Draft">Draft</MenuItem>
                  <MenuItem value="Submitted">Submitted</MenuItem>
                  <MenuItem value="Approved">Approved</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                  <MenuItem value="PO Created">PO Created</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                {/* Department Filter */}
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  label="Department"
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
                  <MenuItem value="">All Departments</MenuItem>
                  {departmentsData.map((dept, i) => (
                    <MenuItem key={dept?.id || i} value={dept?.name}>
                      {dept?.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                {/* Approver Filter */}
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={approver}
                  onChange={(e) => setApprover(e.target.value)}
                  label="Approver"
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
                  <MenuItem value="">All Approvers</MenuItem>
                  {APPROVAL_ROUTING?.map((app, i) => (
                    <MenuItem key={i} value={app}>
                      {app}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Box>
        </Card>

        {/* Purchase Requisitions Table */}
        <Box sx={{ px: 1 }}>
          <Card sx={{ mb: 4, border: '1px solid #e0e0e0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <TableContainer>
              <Table size={dense ? 'small' : 'medium'}>
                {/* Apply dense padding */}
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                      PR Details
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                      Requested By
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                      Department
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                      Project
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                      Items
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                      Amount
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                      Date
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                      Status
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
                  {prDataLoading || filteredPrDataLoading
                    ? Array.from({ length: 5 }, (_, i) => (
                        <TableRowSkeleton
                          key={i}
                          columns={[
                            { type: 'text', lines: 2, width: 120 },
                            { type: 'text', lines: 2, width: 100 },
                            { type: 'text', lines: 2, width: 100 },
                            { type: 'text', width: 80 },
                            { type: 'text', width: 150 },
                            { type: 'text', width: 80, align: 'right' },
                            { type: 'text', width: 80 },
                            { type: 'rect', width: 80, height: 24 },
                            { type: 'circle', count: 1, size: 32, align: 'center' },
                          ]}
                        />
                      ))
                    : prsToDisplay?.map((pr, i) => (
                        <PurchaseRequisitionTableRow
                          key={i}
                          pr={pr}
                          onView={() => {
                            // Handle view action
                            // console.log('View PR:', pr);
                          }}
                          mutateKey={listKey}
                        />
                      ))}

                  {prsToDisplay?.length === 0 && !prDataLoading && !filteredPrDataLoading && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                        <Stack alignItems="center" spacing={2}>
                          <Icon
                            icon="solar:box-minimalistic-bold-duotone"
                            width={64}
                            sx={{ color: '#d1d5db' }}
                          />
                          <Typography variant="h6" color="text.secondary">
                            No purchase requisitions found
                          </Typography>
                          <Typography variant="body2" color="text.disabled">
                            Try adjusting your search or filter
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 3, px: 1 }}>
                {/* Table Pagination - Server Controlled */}
                {/* Dense Padding Control */}
                <FormControlLabel
                  control={<Switch checked={dense} onChange={handleChangeDense} />}
                  label="Dense"
                />
                <Pagination
                  count={totalPages}
                  variant="outlined"
                  shape="rounded"
                  page={page + 1}
                  onChange={(event, pageNumber) => {
                    setPage(pageNumber - 1);
                  }}
                />
              </Box>
            </TableContainer>
          </Card>
        </Box>

        {/* Workflow Visualization */}
        <Box sx={{ px: 1 }}>
          <Card sx={{ p: 3, bgcolor: 'white', boxShadow: 1, border: '1px solid #E0E0E0' }}>
            <Typography
              variant="h6"
              fontWeight="bold"
              gutterBottom
              sx={{ mb: 3, color: '#212121' }}
            >
              Procurement Workflow
            </Typography>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={{ xs: 3, md: 0 }}
              alignItems="center"
            >
              <WorkflowStep
                number={1}
                title="Purchase Requisition"
                subtitle="Create and submit PR"
              />
              <WorkflowStep number={2} title="Approval" subtitle="Management approval" />
              <WorkflowStep number={3} title="Quotation" subtitle="RFQ & Comparative" />
              <WorkflowStep number={4} title="Purchase Order" subtitle="Create PO" />
              <WorkflowStep number={5} title="Goods Receipt" subtitle="GRN creation" isLast />
            </Stack>
          </Card>
        </Box>
      </Container>
    </LocalizationProvider>
  );
}
