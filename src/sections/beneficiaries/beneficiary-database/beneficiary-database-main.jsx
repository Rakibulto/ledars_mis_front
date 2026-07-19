'use client';

import { mutate } from 'swr';
import Link from 'next/link';
import ExcelJS from 'exceljs';
import { toast } from 'sonner';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
// import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Collapse from '@mui/material/Collapse';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import axios, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import SummaryCard from 'src/sections/_components/summary-card';
import { formatCurrencyAuto } from 'src/sections/_components/format-currency';

import BeneficiaryPDFButton from './beneficiary-pdf-button';
import BeneficiaryProfileDetails from './beneficiary-profile-details';

function BeneficiaryTableRow({ beneficiary, onView, onDelete }) {
  return (
    <TableRow
      sx={{
        '&:hover': {
          bgcolor: 'action.hover',
        },
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Beneficiary ID */}
      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight={600} color="text.primary">
            {beneficiary?.id}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {beneficiary?.ben_code}
          </Typography>
        </Box>
      </TableCell>

      {/* Name & Contact */}
      <TableCell>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              bgcolor: 'success.lighter',
              color: 'success.dark',
              width: 40,
              height: 40,
            }}
          >
            <Iconify icon="solar:user-bold" width={24} />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {beneficiary?.name}
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Iconify icon="solar:phone-bold" width={12} sx={{ color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">
                {beneficiary?.contact}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </TableCell>

      {/* Demographics */}
      <TableCell>
        <Typography variant="body2" color="text.primary">
          {beneficiary?.age != null ? `${beneficiary.age} yrs` : '—'} / {beneficiary?.sex || '—'}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          {beneficiary?.education_level || '—'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {Array.isArray(beneficiary?.main_income_sources)
            ? beneficiary.main_income_sources.join(', ')
            : '—'}
        </Typography>
      </TableCell>

      {/* Location */}
      <TableCell>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <Iconify
            icon="solar:map-point-bold"
            width={16}
            sx={{ color: 'text.disabled', mt: 0.5 }}
          />
          <Box>
            <Typography variant="body2" color="text.primary">
              {beneficiary?.district || '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {beneficiary?.upazila || '—'}, {beneficiary?.union || '—'}
            </Typography>
          </Box>
        </Stack>
      </TableCell>

      {/* Project / Donor */}
      <TableCell>
        <Typography variant="body2" fontWeight={600} color="info.dark">
          {beneficiary?.project_name || '—'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {beneficiary?.donor_name || '—'}
        </Typography>
      </TableCell>

      {/* Household */}
      <TableCell>
        <Typography variant="body2" fontWeight={600}>
          {beneficiary?.household_id || beneficiary?.household_code || '—'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {beneficiary?.household_type || '—'}
        </Typography>
      </TableCell>

      {/* Services */}
      <TableCell>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Iconify icon="solar:graph-up-bold" width={16} sx={{ color: 'primary.main' }} />
          <Typography variant="body2" fontWeight={600} color="text.primary">
            {beneficiary?.total_services_received || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            services
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Total: ৳{Number(beneficiary?.total_services_value || 0).toLocaleString()}
        </Typography>
      </TableCell>

      {/* Actions */}
      <TableCell align="center">
        <Stack direction="row" spacing={1} justifyContent="center">
          <Link
            href={`${paths.dashboard.beneficiaries.database}/add-received-history?benId=${beneficiary?.id}`}
          >
            <Tooltip title="Add Received Service History" arrow>
              <IconButton
                size="small"
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.lighter',
                  },
                }}
              >
                <Iconify icon="material-symbols:receipt-long" width={20} />
              </IconButton>
            </Tooltip>
          </Link>
          <Tooltip title="View Beneficiary Details" arrow>
            <IconButton
              onClick={() => onView && onView(beneficiary)}
              size="small"
              sx={{
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.lighter',
                },
              }}
            >
              <Iconify icon="solar:eye-bold" width={20} />
            </IconButton>
          </Tooltip>
          <Link href={`${paths.dashboard.beneficiaries.add_database}?editId=${beneficiary?.id}`}>
            <Tooltip title="Edit Beneficiary" arrow>
              <IconButton
                size="small"
                sx={{
                  color: 'success.main',
                  '&:hover': {
                    bgcolor: 'success.lighter',
                  },
                }}
              >
                <Iconify icon="solar:pen-bold" width={20} />
              </IconButton>
            </Tooltip>
          </Link>
          <Tooltip title="Delete Beneficiary" arrow>
            <IconButton
              onClick={() => onDelete && onDelete(beneficiary?.id)}
              size="small"
              sx={{
                color: 'error.main',
                '&:hover': {
                  bgcolor: 'error.lighter',
                },
              }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" width={20} />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default function BeneficiaryDatabaseMain() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Filter states
  const [projectFilter, setProjectFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [sexFilter, setSexFilter] = useState('');

  // Delete state
  const confirmDelete = useBoolean();
  const [deleteBeneficiaryId, setDeleteBeneficiaryId] = useState(null);

  // Service expand state in modal
  const [expandedService, setExpandedService] = useState(null);

  // Build API query parameters
  const apiParams = useMemo(() => {
    const params = new URLSearchParams();
    params.append('pagination', 'true');
    params.append('page', page.toString());
    if (searchQuery) params.append('search', searchQuery);
    if (projectFilter) params.append('project', projectFilter);
    if (districtFilter) params.append('district', districtFilter);
    if (sexFilter) params.append('sex', sexFilter);
    return params.toString();
  }, [page, searchQuery, projectFilter, districtFilter, sexFilter]);
  //   project data
  const { data: ProjectData, loading: projectLoading } = useGetRequest(
    `${endpoints.projects.projects}`
  );
  // beneficiary summary data
  const { data: beneficiarySummaryData, loading: summaryLoading } = useGetRequest(
    `${endpoints.beneficiaries.beneficiary_summary}`
  );
  // console.log('Project data:', ProjectData, 'Loading:', projectLoading);
  // Fetch beneficiaries with filters
  const { data: beneficiariesData, loading: beneficiariesLoading } = useGetRequest(
    `${endpoints.beneficiaries.beneficiaries_database}?${apiParams}`
  );

  // Fetch services for selected beneficiary
  const { data: beneficiaryServicesData, loading: servicesLoading } = useGetRequest(
    selectedBeneficiary?.ben_code
      ? `${endpoints.beneficiaries.services_received_history}?beneficiary_code=${selectedBeneficiary.ben_code}`
      : null
  );

  // Use API data directly
  const beneficiaries = useMemo(() => {
    if (!beneficiariesData?.results) return [];
    return beneficiariesData.results;
  }, [beneficiariesData]);

  // Services data directly from API with full details
  const beneficiaryServices = useMemo(() => {
    if (!beneficiaryServicesData?.results) return [];

    return beneficiaryServicesData.map((service) => ({
      id: service?.id,
      beneficiary: service?.beneficiary,
      beneficiary_info: service?.beneficiary_info,
      name: service?.name,
      date: service?.date,
      description: service?.description,
      value: parseFloat(service?.value) || 0,
      staff: service?.staff,
      status: service?.status,
      project: service?.project,
      project_name: service?.project_name || `Project ${service?.project}`,
      created_at: service?.created_at,
      created_by: service?.created_by,
    }));
  }, [beneficiaryServicesData]);

  const projects = useMemo(
    () => ['', ...new Set(beneficiaries.map((b) => b.project_name).filter(Boolean))],
    [beneficiaries]
  );
  const districts = useMemo(
    () => ['', ...new Set(beneficiaries.map((b) => b.district).filter(Boolean))],
    [beneficiaries]
  );

  const handleClearFilters = () => {
    setSearchQuery('');
    setProjectFilter('');
    setDistrictFilter('');
    setSexFilter('');
    setPage(1);
  };

  const hasActiveFilters = searchQuery || projectFilter || districtFilter || sexFilter;

  // Handle view beneficiary
  const handleViewBeneficiary = (beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedBeneficiary(null);
    setExpandedService(null);
  };

  // Handle delete beneficiary
  const handleOpenDelete = useCallback(
    (id) => {
      setDeleteBeneficiaryId(id);
      confirmDelete.onTrue();
    },
    [confirmDelete]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteBeneficiaryId) return;
    try {
      await axios.delete(
        `${endpoints.beneficiaries.beneficiaries_database}${deleteBeneficiaryId}/`
      );
      await mutate(
        (key) =>
          typeof key === 'string' && key.startsWith(endpoints.beneficiaries.beneficiaries_database),
        undefined,
        { revalidate: true }
      );
      toast.success('Beneficiary deleted successfully');
    } catch (error) {
      toast.error('Failed to delete beneficiary');
    } finally {
      confirmDelete.onFalse();
      setDeleteBeneficiaryId(null);
    }
  }, [deleteBeneficiaryId, confirmDelete]);

  // Export to Excel function
  const exportToExcel = async () => {
    if (exportingExcel) return;

    try {
      setExportingExcel(true);

      // Create a new workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Beneficiaries');

      // Define columns with headers
      worksheet.columns = [
        { header: 'SI No', key: 'si_no', width: 10 },
        { header: 'Ben Code', key: 'ben_code', width: 18 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Mother Name', key: 'mother_name', width: 25 },
        { header: 'Father Name', key: 'father_name', width: 25 },
        { header: 'Husband Name', key: 'husband_name', width: 25 },
        { header: 'Age', key: 'age', width: 10 },
        { header: 'Date of Birth', key: 'date_of_birth', width: 15 },
        { header: 'Gender', key: 'sex', width: 12 },
        { header: 'NID', key: 'nid', width: 20 },
        { header: 'Contact', key: 'contact', width: 15 },
        { header: 'Education Level', key: 'education_level', width: 20 },
        { header: 'Main Income Sources', key: 'main_income_sources', width: 25 },
        { header: 'Monthly Income', key: 'monthly_income', width: 15 },
        { header: 'Household Size', key: 'household_size', width: 15 },
        { header: 'Household Type', key: 'household_type', width: 18 },
        { header: 'Household Code', key: 'household_code', width: 18 },
        { header: 'District', key: 'district', width: 20 },
        { header: 'Upazila', key: 'upazila', width: 20 },
        { header: 'Union', key: 'union', width: 20 },
        { header: 'Village', key: 'village', width: 20 },
        { header: 'Vulnerability Categories', key: 'vulnerability_categories', width: 30 },
        { header: 'Project', key: 'project_name', width: 25 },
        { header: 'Donor', key: 'donor_name', width: 25 },
        { header: 'Enrollment Date', key: 'enrollment_date', width: 18 },
        { header: 'Total Services', key: 'total_services_received', width: 15 },
        { header: 'Total Value (BDT)', key: 'total_services_value', width: 18 },
      ];

      // Style the header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, size: 12 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }, // Blue background
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 25;

      // Add data rows
      beneficiaries?.forEach((beneficiary, index) => {
        worksheet.addRow({
          si_no: index + 1,
          ben_code: beneficiary.ben_code,
          name: beneficiary.name,
          mother_name: beneficiary.mother_name,
          father_name: beneficiary.father_name,
          husband_name: beneficiary.husband_name,
          age: beneficiary.age,
          date_of_birth: beneficiary.date_of_birth,
          sex: beneficiary.sex,
          nid: beneficiary.nid,
          contact: beneficiary.contact,
          education_level: beneficiary.education_level,
          main_income_sources: Array.isArray(beneficiary.main_income_sources)
            ? beneficiary.main_income_sources.join(', ')
            : '',
          monthly_income: beneficiary.monthly_income,
          household_size: beneficiary.household_size,
          household_type: beneficiary.household_type,
          household_code: beneficiary.household_id || beneficiary.household_code,
          district: beneficiary.district,
          upazila: beneficiary.upazila,
          union: beneficiary.union,
          village: beneficiary.village,
          vulnerability_categories: Array.isArray(beneficiary.vulnerability_categories)
            ? beneficiary.vulnerability_categories.join(', ')
            : '',
          project_name: beneficiary.project_name,
          donor_name: beneficiary.donor_name,
          enrollment_date: beneficiary.enrollment_date,
          total_services_received: beneficiary.total_services_received,
          total_services_value: beneficiary.total_services_value,
        });
      });

      // Add borders to all cells
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };

          // Data rows alignment
          if (rowNumber > 1) {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          }
        });
      });

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'beneficiary-data.xlsx';
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExportingExcel(false);
    }
  };

  // Pagination from API
  const totalPages = beneficiariesData?.total_pages || 1;
  const totalCount = beneficiariesData?.count || beneficiaries.length;
  console.log('Beneficiaries API Data:', beneficiariesData);

  // Service details are already available in beneficiaryServicesData
  // The API returns the full service object with all details
  // console.log('Service details for modal:', beneficiaryServicesData);
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
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                <Iconify icon="solar:users-group-rounded-bold" width={32} sx={{ color: 'white' }} />
                <Typography variant="h4" fontWeight={700} sx={{ color: 'white' }}>
                  Beneficiary Database
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Secure database with comprehensive beneficiary management and tracking
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={
                  exportingExcel ? (
                    <CircularProgress size={16} sx={{ color: 'white' }} />
                  ) : (
                    <Iconify icon="solar:download-minimalistic-bold" width={20} />
                  )
                }
                onClick={exportToExcel}
                disabled={exportingExcel || beneficiaries.length === 0}
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
                  '&:disabled': {
                    bgcolor: 'rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.5)',
                  },
                }}
              >
                {exportingExcel ? 'Exporting...' : 'Export'}
              </Button>
              <Link
                href={paths.dashboard.beneficiaries.add_database}
                underline="none"
                sx={{ display: 'inline-flex' }}
              >
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="solar:plus-bold" width={20} />}
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
                  Add New
                </Button>
              </Link>
            </Stack>
          </Stack>
        </Box>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3, lg: 1.71 }}>
          <SummaryCard
            title="Total Beneficiaries"
            value={beneficiarySummaryData?.total_beneficiaries || 0}
            icon="solar:users-group-rounded-bold-duotone"
            bgcolor="primary.main"
            boxShadow="0 4px 20px rgba(37, 99, 235, 0.24)"
            loading={beneficiariesLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3, lg: 1.71 }}>
          <SummaryCard
            title="Transgender"
            value={beneficiarySummaryData?.transgender || 0}
            icon="solar:users-group-rounded-bold-duotone"
            bgcolor="info.main"
            boxShadow="0 4px 20px rgba(59, 130, 246, 0.24)"
            loading={beneficiariesLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3, lg: 1.71 }}>
          <SummaryCard
            title="Services"
            value={beneficiarySummaryData?.Services || 0}
            icon="solar:graph-up-bold-duotone"
            bgcolor="#9333ea"
            boxShadow="0 4px 20px rgba(147, 51, 234, 0.24)"
            loading={beneficiariesLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3, lg: 1.71 }}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 2,
              bgcolor: 'background.paper',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              boxShadow: (theme) => theme.customShadows?.card || 'none',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Iconify icon="solar:user-bold" width={20} sx={{ color: 'primary.main' }} />
                <Typography variant="body2" color="text.secondary">
                  Male
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                {beneficiarySummaryData?.male || 0}
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3, lg: 1.71 }}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 2,
              bgcolor: 'background.paper',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              boxShadow: (theme) => theme.customShadows?.card || 'none',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Iconify icon="solar:user-bold" width={20} sx={{ color: 'error.main' }} />
                <Typography variant="body2" color="text.secondary">
                  Female
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                {beneficiarySummaryData?.female || 0}
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3, lg: 1.71 }}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 2,
              bgcolor: 'background.paper',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              boxShadow: (theme) => theme.customShadows?.card || 'none',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Iconify
                  icon="solar:dollar-minimalistic-bold"
                  width={20}
                  sx={{ color: 'success.main' }}
                />
                <Typography variant="body2" color="text.secondary">
                  Total Value
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                {formatCurrencyAuto(beneficiarySummaryData?.total_value || 0)}
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          boxShadow: (theme) => theme.customShadows?.card || 'none',
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems="center"
            sx={{ width: '100%' }}
          >
            <Box sx={{ width: { xs: '100%', md: '80%' } }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name, ID, NID, or contact number..."
                value={searchQuery}
                onChange={(e) => {
                  setPage(1);
                  setSearchQuery(e.target.value);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" width={20} sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'background.neutral',
                  },
                }}
              />
            </Box>

            <Box
              sx={{
                width: { xs: '100%', md: '20%' },
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Button
                variant={showFilters ? 'contained' : 'outlined'}
                onClick={() => setShowFilters(!showFilters)}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  width: '100%',
                  fontWeight: 600,
                  borderColor: 'primary.main',
                  color: showFilters ? 'white' : 'primary.main',
                  display: 'flex',
                  bgcolor: showFilters ? 'primary.main' : 'transparent',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  px: 2,
                }}
              >
                <Iconify icon="solar:filter-bold" width={20} />
                Advanced Filters
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: showFilters ? 'primary.main' : 'primary.lighter',
                    color: showFilters ? 'white' : 'primary.main',
                    borderRadius: '50%',
                    width: 18,
                    height: 18,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: 2,
                  }}
                >
                  {showFilters ? 'ON' : 'OFF'}
                </Box>
              </Button>
            </Box>
          </Stack>

          {/* Advanced Filters Dropdown */}
          {showFilters && (
            <Box sx={{ mt: 3, pt: 3, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: 'block' }}
                  >
                    Project
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={projectFilter}
                      onChange={(e) => {
                        setProjectFilter(e.target.value);
                        setPage(1);
                      }}
                      sx={{ borderRadius: 1.5 }}
                    >
                      <MenuItem value="">All Projects</MenuItem>
                      {/* {projects
                        .filter((p) => p)
                        .map((project) => (
                          <MenuItem key={project} value={project}>
                            {project}
                          </MenuItem>
                        ))} */}
                      {(Array.isArray(ProjectData)
                        ? ProjectData
                        : ProjectData?.results || []
                      ).map((project) => (
                        <MenuItem key={project?.id || project?.name} value={project?.name}>
                          {project?.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: 'block' }}
                  >
                    District
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={districtFilter}
                      onChange={(e) => {
                        setDistrictFilter(e.target.value);
                        setPage(1);
                      }}
                      sx={{ borderRadius: 1.5 }}
                    >
                      <MenuItem value="">All Districts</MenuItem>
                      {districts.filter(Boolean).map((district) => (
                        <MenuItem key={district} value={district}>
                          {district}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: 'block' }}
                  >
                    Gender
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={sexFilter}
                      onChange={(e) => {
                        setSexFilter(e.target.value);
                        setPage(1);
                      }}
                      sx={{ borderRadius: 1.5 }}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Transgender">Transgender</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Filter Results Count */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                sx={{ mt: 2 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Showing <strong>{beneficiaries.length}</strong> of <strong>{totalCount}</strong>{' '}
                  beneficiaries
                </Typography>
                {hasActiveFilters && (
                  <Link
                    component="button"
                    variant="body2"
                    onClick={handleClearFilters}
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Clear All Filters
                  </Link>
                )}
              </Stack>
            </Box>
          )}
        </Box>
      </Card>

      {/* Beneficiary Table */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: (theme) => theme.customShadows?.card || 'none',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.neutral' }}>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Beneficiary ID
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Name & Contact
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Demographics</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Project / Donor</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Household</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Services</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {beneficiariesLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Stack alignItems="center" spacing={2}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          border: (theme) => `4px solid ${theme.palette.divider}`,
                          borderTopColor: 'primary.main',
                          animation: 'spin 1s linear infinite',
                          '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' },
                          },
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Loading beneficiaries...
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : beneficiaries?.length > 0 ? (
                beneficiaries?.map((beneficiary) => (
                  <BeneficiaryTableRow
                    key={beneficiary.id}
                    beneficiary={beneficiary}
                    onView={handleViewBeneficiary}
                    onDelete={handleOpenDelete}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Stack alignItems="center" spacing={2}>
                      <Iconify
                        icon="solar:users-group-rounded-bold-duotone"
                        width={64}
                        sx={{ color: 'text.disabled' }}
                      />
                      <Typography variant="h6" color="text.secondary">
                        No beneficiaries found
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        Try adjusting your search or filter criteria
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
            justifyContent: 'flex-end',
            p: 2,
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, pageNumber) => setPage(pageNumber)}
            variant="outlined"
            shape="rounded"
            color="primary"
          />
        </Box>
      </Card>

      {/* Beneficiary Details Modal */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: 'success.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2.5,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Iconify icon="solar:user-id-bold" width={28} />
            <Typography variant="h5" fontWeight={700}>
              Beneficiary Profile
            </Typography>
          </Stack>
          <IconButton
            onClick={handleCloseModal}
            sx={{
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            <Iconify icon="solar:close-circle-bold" width={24} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedBeneficiary && (
            <Box>
              <BeneficiaryProfileDetails beneficiary={selectedBeneficiary} />

              <Divider />

              {/* Services Received History */}
              <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  color="primary.dark"
                  sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Iconify icon="solar:history-bold" width={20} />
                  Services Received History
                </Typography>
                {servicesLoading ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Loading services...
                    </Typography>
                  </Box>
                ) : beneficiaryServicesData?.length > 0 ? (
                  <Stack spacing={1.5}>
                    {beneficiaryServicesData?.map((service) => (
                      <Card
                        key={service?.id}
                        sx={{
                          border: (theme) => `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          onClick={() =>
                            setExpandedService(expandedService === service?.id ? null : service?.id)
                          }
                          sx={{
                            p: 2,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                          }}
                        >
                          {/* [
    {
        "id": 1,
        "beneficiary": 7,
        "beneficiary_info": {
            "id": 7,
            "ben_code": "BEN-2026-0006",
            "name": "Azalia Bush"
        },
        "name": "Jelani Savage",
        "date": "2026-03-08",
        "description": "Omnis reprehenderit",
        "value": "52.00",
        "staff": "Dolor proident",
        "status": "Ongoing",
        "created_at": "2026-03-08T13:55:28.985861+06:00",
        "project": 1,
        "created_by": 1
    }
] */}
                          <Stack direction="row" spacing={2} alignItems="center" flex={1}>
                            <Avatar
                              sx={{
                                bgcolor: 'success.lighter',
                                color: 'success.dark',
                                width: 40,
                                height: 40,
                              }}
                            >
                              <Iconify icon="solar:check-circle-bold" width={24} />
                            </Avatar>
                            <Box flex={1}>
                              <Typography variant="body2" fontWeight={600}>
                                {service?.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {service?.date}
                              </Typography>
                            </Box>
                            <Chip
                              label={service?.status}
                              size="small"
                              sx={{
                                bgcolor:
                                  service?.status === 'Completed'
                                    ? 'success.lighter'
                                    : service?.status === 'Ongoing'
                                      ? 'warning.lighter'
                                      : 'grey.300',
                                color:
                                  service?.status === 'Completed'
                                    ? 'success.dark'
                                    : service?.status === 'Ongoing'
                                      ? 'warning.dark'
                                      : 'text.secondary',
                                fontWeight: 600,
                              }}
                            />
                          </Stack>
                          <IconButton size="small">
                            <Iconify
                              icon={
                                expandedService === service?.id
                                  ? 'solar:alt-arrow-up-bold'
                                  : 'solar:alt-arrow-down-bold'
                              }
                              width={20}
                            />
                          </IconButton>
                        </Box>
                        <Collapse in={expandedService === service?.id}>
                          <Box sx={{ px: 2, pb: 2, pt: 0, bgcolor: 'background.neutral' }}>
                            <Grid container spacing={2}>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Project
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                  {service?.project}
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Cost
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                  ৳{service?.value?.toLocaleString()}
                                </Typography>
                              </Grid>
                              {service?.description && (
                                <Grid size={{ xs: 12 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Description
                                  </Typography>
                                  <Typography variant="body2" fontWeight={600}>
                                    {service?.description}
                                  </Typography>
                                </Grid>
                              )}
                              <Grid size={{ xs: 12 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Service Officer
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                  {service?.staff}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Box>
                        </Collapse>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: 3,
                      bgcolor: 'background.neutral',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No services recorded yet
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{ p: 2.5, gap: 1, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}
        >
          <Button
            variant="outlined"
            onClick={handleCloseModal}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              fontWeight: 600,
              borderColor: 'text.secondary',
              color: 'text.secondary',
            }}
          >
            Close
          </Button>
          <BeneficiaryPDFButton
            beneficiary={selectedBeneficiary}
            services={beneficiaryServicesData}
          />
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Delete Beneficiary"
        content="Are you sure you want to delete this beneficiary? This action cannot be undone."
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
