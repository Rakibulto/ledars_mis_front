'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useCallback } from 'react';
import {
  Pie,
  Cell,
  Line,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
  PieChart,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Table,
  Avatar,
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
  Pagination,
  Typography,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
  InputAdornment,
  TableContainer,
  FormControlLabel,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest, useDeleteRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import TableRowSkeleton from 'src/components/table/tableRowSkeleton';

import SummaryCard from 'src/sections/_components/summary-card';
import { formatCurrencyAuto } from 'src/sections/_components/format-currency';

// Status badge color function
const getStatusColor = (status) => {
  switch (status) {
    case 'Completed':
      return { bg: '#d1fae5', color: '#065f46' };
    case 'In Progress':
    case 'Ongoing':
      return { bg: '#fed7aa', color: '#92400e' };
    case 'Planned':
      return { bg: '#e9d5ff', color: '#6b21a8' };
    case 'Cancelled':
      return { bg: '#fee2e2', color: '#991b1b' };
    default:
      return { bg: '#f3f4f6', color: '#6b7280' };
  }
};

// Service Table Row Component
function ServiceTableRow({ service, onView, onEdit, onDelete }) {
  const statusColor = getStatusColor(service?.status);

  return (
    <TableRow
      sx={{
        '&:hover': {
          bgcolor: '#f9fafb',
        },
        borderBottom: '1px solid #f3f4f6',
      }}
    >
      {/* Service ID */}
      <TableCell>
        <Typography variant="body2" fontWeight={600} color="#1a1a1a">
          {service?.service_code || service?.id}
        </Typography>
      </TableCell>

      {/* Beneficiary */}
      <TableCell>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            sx={{
              bgcolor: 'primary.lighter',
              color: 'primary.dark',
              width: 36,
              height: 36,
            }}
          >
            <Iconify icon="solar:user-bold" width={20} />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600} color="#1a1a1a">
              {service?.beneficiary_info?.name || service?.beneficiary_name}
            </Typography>
            <Typography variant="caption" color="#6b7280">
              {service?.beneficiary_info?.ben_code || service?.beneficiary_code}
            </Typography>
          </Box>
        </Stack>
      </TableCell>

      {/* Service Type */}
      <TableCell>
        <Typography variant="body2" color="#1a1a1a">
          {service?.service_type}
        </Typography>
      </TableCell>

      {/* Category */}
      <TableCell>
        <Chip
          label={service?.category || 'General'}
          size="small"
          sx={{
            bgcolor: '#dbeafe',
            color: '#1e40af',
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        />
      </TableCell>

      {/* Location */}
      <TableCell>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Iconify icon="solar:map-point-bold" width={14} sx={{ color: '#9ca3af' }} />
          <Typography variant="body2" color="#6b7280">
            {service?.location || 'N/A'}
          </Typography>
        </Stack>
      </TableCell>

      {/* Date */}
      <TableCell>
        <Typography variant="body2" color="#1a1a1a">
          {service?.delivery_date
            ? new Date(service.delivery_date).toLocaleDateString('en-GB')
            : 'N/A'}
        </Typography>
      </TableCell>

      {/* Quantity */}
      <TableCell align="center">
        <Typography variant="body2" color="#1a1a1a">
          {service?.quantity || 1} {service?.unit || ''}
        </Typography>
      </TableCell>

      {/* Cost */}
      <TableCell align="right">
        <Typography variant="body2" fontWeight={600} color="#1a1a1a">
          ৳{parseFloat(service?.cost || 0).toLocaleString('en-BD')}
        </Typography>
      </TableCell>

      {/* Status */}
      <TableCell align="center">
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 2,
            py: 0.5,
            borderRadius: 1.5,
            bgcolor: statusColor.bg,
            color: statusColor.color,
          }}
        >
          <Typography variant="body2" fontWeight={600} fontSize="0.8125rem">
            {service?.status}
          </Typography>
        </Box>
      </TableCell>

      {/* Actions */}
      <TableCell align="center">
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <IconButton
            onClick={() => onView && onView(service)}
            size="small"
            sx={{
              color: '#2563eb',
              '&:hover': {
                bgcolor: 'rgba(37, 99, 235, 0.08)',
              },
            }}
          >
            <Iconify icon="solar:eye-bold" width={18} />
          </IconButton>
          <IconButton
            onClick={() => onEdit && onEdit(service)}
            size="small"
            sx={{
              color: '#f59e0b',
              '&:hover': {
                bgcolor: 'rgba(245, 158, 11, 0.08)',
              },
            }}
          >
            <Iconify icon="solar:pen-bold" width={18} />
          </IconButton>
          <IconButton
            onClick={() => onDelete && onDelete(service)}
            size="small"
            sx={{
              color: '#ef4444',
              '&:hover': {
                bgcolor: 'rgba(239, 68, 68, 0.08)',
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

export default function ServiceDeliveryMain() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const confirm = useBoolean();
  const createDialog = useBoolean();
  const editDialog = useBoolean();
  const [deleteServiceId, setDeleteServiceId] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const deleteData = useDeleteRequest;

  const [dense, setDense] = useState(false);

  // Create form state
  const [createFormData, setCreateFormData] = useState({
    service_type: '',
    beneficiary: '',
    location: '',
    delivery_date: '',
    status: 'Planned',
    quantity: '',
    unit: '',
    cost: '',
    remarks: '',
  });

  const handleChangeDense = (event) => {
    setDense(event.target.checked);
  };
  // sort beneficiary list alphabetically by name
  const { data: simpleBeneficiaries } = useGetRequest(
    `${endpoints.beneficiaries.simple_beneficiaries}`
  );
  // main api call
  const { data: servicesDeliveryData, loading: servicesDeliveryLoading } = useGetRequest(
    `${endpoints.beneficiaries.service_delivery}?page=${page}&pagination=true`
  );
  // filtered API calls
  const { data: filteredServicesDeliveryData, loading: filteredServicesDeliveryLoading } =
    useGetRequest(
      `${endpoints.beneficiaries.service_delivery}?search=${searchQuery}&status=${statusFilter}&category=${categoryFilter}&page=${page}&pagination=true`
    );

  const { data: serviceSummary, loading: summaryLoading } = useGetRequest(
    `${endpoints.beneficiaries.service_delivery_summary}`
  );

  // Extract services - only show filtered data when filters are applied
  const hasFilters = searchQuery || statusFilter || categoryFilter;

  const services = useMemo(() => {
    if (hasFilters) {
      // When filters are applied, only show filtered results (even if empty)
      return filteredServicesDeliveryData?.results || [];
    }
    // When no filters, show all data
    return servicesDeliveryData?.results || [];
  }, [hasFilters, filteredServicesDeliveryData, servicesDeliveryData]);

  // Use appropriate pagination data based on filters
  const totalPages = hasFilters
    ? filteredServicesDeliveryData?.total_pages || 1
    : servicesDeliveryData?.total_pages || 1;

  const totalCount = hasFilters
    ? filteredServicesDeliveryData?.count || 0
    : servicesDeliveryData?.count || 0;

  // Category data for pie chart
  const categoryData = useMemo(
    () => [
      { name: 'Education', count: 45, color: '#3B82F6' },
      { name: 'Health', count: 38, color: '#10B981' },
      { name: 'WASH', count: 52, color: '#F59E0B' },
      { name: 'Protection', count: 29, color: '#EF4444' },
      { name: 'Livelihood', count: 18, color: '#8B5CF6' },
      { name: 'Shelter', count: 15, color: '#EC4899' },
    ],
    []
  );

  // Monthly trend data for line chart
  const trendData = useMemo(
    () => [
      { month: 'Jul', services: 142, beneficiaries: 128 },
      { month: 'Aug', services: 156, beneficiaries: 142 },
      { month: 'Sep', services: 168, beneficiaries: 155 },
      { month: 'Oct', services: 175, beneficiaries: 162 },
      { month: 'Nov', services: 189, beneficiaries: 175 },
      { month: 'Dec', services: 197, beneficiaries: 183 },
    ],
    []
  );

  // Handlers
  const handleView = (service) => {
    router.push(`/dashboard/beneficiaries/service-delivery/${service.id}`);
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setCreateFormData({
      service_type: service.service_type || '',
      beneficiary: service.beneficiary || '',
      location: service.location || '',
      delivery_date: service.delivery_date || '',
      status: service.status || 'Planned',
      quantity: service.quantity || '',
      unit: service.unit || '',
      cost: service.cost || '',
      remarks: service.remarks || '',
    });
    editDialog.onTrue();
  };

  const handleDelete = (service) => {
    setDeleteServiceId(service.id);
    confirm.onTrue();
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteData(`${endpoints.beneficiaries.service_delivery}${deleteServiceId}/`);
      await mutate(
        `${endpoints.beneficiaries.service_delivery}?search=${searchQuery}&status=${statusFilter}&category=${categoryFilter}&page=${page}&pagination=true`
      );
      toast.success('Service deleted successfully');
    } catch (error) {
      toast.error('Failed to delete service. Please try again.');
    } finally {
      confirm.onFalse();
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleCreateFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setCreateFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleCreateSubmit = useCallback(async () => {
    try {
      await axiosInstance.post(endpoints.beneficiaries.service_delivery, createFormData);
      toast.success('Service recorded successfully');
      await mutate(`${endpoints.beneficiaries.service_delivery}?page=${page}&pagination=true`);
      await mutate(endpoints.beneficiaries.service_delivery_summary);
      createDialog.onFalse();
      setCreateFormData({
        service_type: '',
        beneficiary: '',
        location: '',
        delivery_date: '',
        status: 'Planned',
        quantity: '',
        unit: '',
        cost: '',
        remarks: '',
      });
    } catch (error) {
      toast.error('Failed to record service');
    }
  }, [createFormData, createDialog, page]);

  const handleEditSubmit = useCallback(async () => {
    try {
      await axiosInstance.patch(
        `${endpoints.beneficiaries.service_delivery}${editingService.id}/`,
        createFormData
      );
      toast.success('Service updated successfully');
      await mutate(`${endpoints.beneficiaries.service_delivery}?page=${page}&pagination=true`);
      await mutate(endpoints.beneficiaries.service_delivery_summary);
      editDialog.onFalse();
      setEditingService(null);
      setCreateFormData({
        service_type: '',
        beneficiary: '',
        location: '',
        delivery_date: '',
        status: 'Planned',
        quantity: '',
        unit: '',
        cost: '',
        remarks: '',
      });
    } catch (error) {
      toast.error('Failed to update service');
    }
  }, [createFormData, editDialog, editingService, page]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>
      {/* Header with Gradient */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #0891b2 100%)',
          boxShadow: '0 8px 24px rgba(5, 150, 105, 0.3)',
        }}
      >
        <Box sx={{ p: { xs: 3, md: 4 } }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={2}
          >
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ color: 'white', mb: 1 }}>
                Service Delivery Management
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Track and manage all services provided to beneficiaries
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:download-minimalistic-bold" width={20} />}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 3,
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.35)',
                  },
                }}
              >
                Export Report
              </Button>
              <Button
                variant="contained"
                onClick={createDialog.onTrue}
                startIcon={<Iconify icon="mingcute:add-line" width={20} />}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 3,
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                  },
                }}
              >
                Record Service
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Card>
      {/* {

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <SummaryCard
            title="Total Services"
            value={serviceSummary?.total_services}
            subtitle="All time"
            icon="solar:calendar-mark-bold-duotone"
            bgcolor="#2563eb"
            boxShadow="0 4px 20px rgba(37, 99, 235, 0.24)"
            loading={summaryLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <SummaryCard
            title="Completed"
            value={serviceSummary?.completed_services}
            subtitle="Successfully delivered"
            icon="solar:check-circle-bold-duotone"
            bgcolor="#10b981"
            boxShadow="0 4px 20px rgba(16, 185, 129, 0.24)"
            loading={summaryLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <SummaryCard
            title="In Progress"
            value={serviceSummary?.in_progress_services}
            subtitle="Being delivered"
            icon="solar:clock-circle-bold-duotone"
            bgcolor="#f59e0b"
            boxShadow="0 4px 20px rgba(245, 158, 11, 0.24)"
            loading={summaryLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <SummaryCard
            title="Planned"
            value={serviceSummary?.planned_services}
            subtitle="Upcoming"
            icon="solar:calendar-bold-duotone"
            bgcolor="#8b5cf6"
            boxShadow="0 4px 20px rgba(139, 92, 246, 0.24)"
            loading={summaryLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <SummaryCard
            title="Total Cost"
            value={formatCurrencyAuto(serviceSummary?.total_cost || 0)}
            subtitle="This month"
            icon="solar:dollar-minimalistic-bold-duotone"
            bgcolor="#ec4899"
            boxShadow="0 4px 20px rgba(236, 72, 153, 0.24)"
            loading={summaryLoading}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Services by Category - Pie Chart */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
              height: '100%',
            }}
          >
            <Typography variant="h6" fontWeight={700} color="#1a1a1a" sx={{ mb: 3 }}>
              Services by Category
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  label={({ name, count }) => `${name}: ${count}`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Service Delivery Trend - Line Chart */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
              height: '100%',
            }}
          >
            <Typography variant="h6" fontWeight={700} color="#1a1a1a" sx={{ mb: 3 }}>
              Service Delivery Trend
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="services"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Services Delivered"
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="beneficiaries"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Beneficiaries Reached"
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
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
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by beneficiary name, service type, or ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
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
                    bgcolor: '#f9fafb',
                    '& fieldset': {
                      borderColor: '#e5e7eb',
                    },
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  displayEmpty
                  sx={{
                    borderRadius: 2,
                    bgcolor: '#f9fafb',
                    '& fieldset': {
                      borderColor: '#e5e7eb',
                    },
                  }}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Ongoing">Ongoing</MenuItem>
                  <MenuItem value="Planned">Planned</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <Select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  displayEmpty
                  sx={{
                    borderRadius: 2,
                    bgcolor: '#f9fafb',
                    '& fieldset': {
                      borderColor: '#e5e7eb',
                    },
                  }}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="Education">Education</MenuItem>
                  <MenuItem value="Health">Health</MenuItem>
                  <MenuItem value="WASH">WASH</MenuItem>
                  <MenuItem value="Protection">Protection</MenuItem>
                  <MenuItem value="Livelihood">Livelihood</MenuItem>
                  <MenuItem value="Shelter">Shelter</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Services Table */}
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
                  Service ID
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                  Beneficiary
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                  Service Type
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                  Category
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                  Location
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}>
                  Date
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}
                >
                  Quantity
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}
                >
                  Cost
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 700, color: '#374151', fontSize: '0.875rem' }}
                >
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
              {(hasFilters ? filteredServicesDeliveryLoading : servicesDeliveryLoading)
                ? Array.from({ length: 5 }, (_, i) => (
                    <TableRowSkeleton
                      key={i}
                      columns={[
                        { type: 'text', width: 80 },
                        { type: 'text', lines: 2, width: 150 },
                        { type: 'text', width: 120 },
                        { type: 'rect', width: 80, height: 24 },
                        { type: 'text', width: 100 },
                        { type: 'text', width: 90 },
                        { type: 'text', width: 60, align: 'center' },
                        { type: 'text', width: 80, align: 'right' },
                        { type: 'rect', width: 80, height: 24, align: 'center' },
                        { type: 'circle', count: 3, size: 32, align: 'center' },
                      ]}
                    />
                  ))
                : services?.map((service) => (
                    <ServiceTableRow
                      key={service.id}
                      service={service}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}

              {services.length === 0 &&
                !(hasFilters ? filteredServicesDeliveryLoading : servicesDeliveryLoading) && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                      <Stack alignItems="center" spacing={2}>
                        <Iconify
                          icon="solar:calendar-mark-bold-duotone"
                          width={64}
                          sx={{ color: '#d1d5db' }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          {hasFilters
                            ? 'No services found matching your filters'
                            : 'No services found'}
                        </Typography>
                        <Typography variant="body2" color="text.disabled">
                          {hasFilters
                            ? 'Try adjusting your search or filter criteria'
                            : 'Start by recording your first service delivery'}
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderTop: '1px solid #e5e7eb',
          }}
        >
          {/* <Typography variant="body2" color="text.secondary">
            Showing {services.length} of {totalCount} services
          </Typography> */}
          <FormControlLabel
            control={<Switch checked={dense} onChange={handleChangeDense} />}
            label="Dense"
          />
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            variant="outlined"
            shape="rounded"
            color="primary"
          />
        </Box>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Service"
        content="Are you sure you want to delete this service record? This action cannot be undone."
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        }
      />

      {/* Create Service Dialog */}
      <Dialog open={createDialog.value} onClose={createDialog.onFalse} fullWidth maxWidth="sm">
        <DialogTitle>Record New Service</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Service Type"
              name="service_type"
              value={createFormData.service_type}
              onChange={handleCreateFormChange}
            />
            {/* <TextField
              fullWidth
              label="Beneficiary ID"
              name="beneficiary"
              value={createFormData.beneficiary}
              onChange={handleCreateFormChange}
            /> */}
            <Select
              fullWidth
              displayEmpty
              name="beneficiary"
              value={createFormData.beneficiary || ''}
              onChange={handleCreateFormChange}
            >
              <MenuItem value="" disabled>
                Select Beneficiary
              </MenuItem>
              {simpleBeneficiaries?.map((beneficiary) => (
                <MenuItem key={beneficiary.id} value={beneficiary.id}>
                  {`${beneficiary.name} (${beneficiary.ben_code})`}
                </MenuItem>
              ))}
            </Select>
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={createFormData.location}
              onChange={handleCreateFormChange}
            />
            <TextField
              fullWidth
              label="Delivery Date"
              name="delivery_date"
              type="date"
              value={createFormData.delivery_date}
              onChange={handleCreateFormChange}
              InputLabelProps={{ shrink: true }}
            />
            <Select
              fullWidth
              displayEmpty
              name="status"
              value={createFormData.status}
              onChange={handleCreateFormChange}
            >
              <MenuItem value="Planned">Planned</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </Select>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Quantity"
                name="quantity"
                type="number"
                value={createFormData.quantity}
                onChange={handleCreateFormChange}
              />
              <TextField
                fullWidth
                label="Unit"
                name="unit"
                value={createFormData.unit}
                onChange={handleCreateFormChange}
              />
            </Stack>
            <TextField
              fullWidth
              label="Cost (৳)"
              name="cost"
              type="number"
              value={createFormData.cost}
              onChange={handleCreateFormChange}
            />
            <TextField
              fullWidth
              label="Remarks"
              name="remarks"
              multiline
              rows={2}
              value={createFormData.remarks}
              onChange={handleCreateFormChange}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={createDialog.onFalse}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateSubmit}>
            Record Service
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={editDialog.value} onClose={editDialog.onFalse} fullWidth maxWidth="sm">
        <DialogTitle>Edit Service</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Service Type"
              name="service_type"
              value={createFormData.service_type}
              onChange={handleCreateFormChange}
            />
            <Select
              fullWidth
              label="Beneficiary ID"
              name="beneficiary"
              value={createFormData.beneficiary}
              onChange={handleCreateFormChange}
            />
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={createFormData.location}
              onChange={handleCreateFormChange}
            />
            <TextField
              fullWidth
              label="Delivery Date"
              name="delivery_date"
              type="date"
              value={createFormData.delivery_date}
              onChange={handleCreateFormChange}
              InputLabelProps={{ shrink: true }}
            />
            <Select
              fullWidth
              displayEmpty
              name="status"
              value={createFormData.status}
              onChange={handleCreateFormChange}
            >
              <MenuItem value="Planned">Planned</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </Select>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Quantity"
                name="quantity"
                type="number"
                value={createFormData.quantity}
                onChange={handleCreateFormChange}
              />
              <TextField
                fullWidth
                label="Unit"
                name="unit"
                value={createFormData.unit}
                onChange={handleCreateFormChange}
              />
            </Stack>
            <TextField
              fullWidth
              label="Cost (৳)"
              name="cost"
              type="number"
              value={createFormData.cost}
              onChange={handleCreateFormChange}
            />
            <TextField
              fullWidth
              label="Remarks"
              name="remarks"
              multiline
              rows={2}
              value={createFormData.remarks}
              onChange={handleCreateFormChange}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={editDialog.onFalse}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleEditSubmit}>
            Update Service
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
