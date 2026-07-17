'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState, useCallback } from 'react';

import {
  Box,
  Grid,
  Chip,
  Card,
  Table,
  Stack,
  Alert,
  Dialog,
  Button,
  Divider,
  TableRow,
  MenuItem,
  TextField,
  TableHead,
  TableCell,
  TableBody,
  Typography,
  Pagination,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  LinearProgress,
  InputAdornment,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import SummaryCard from 'src/sections/_components/summary-card';

const SHELTER_OPTIONS = ['Temporary', 'Semi-permanent', 'Permanent'];
const RISK_OPTIONS = ['High', 'Medium', 'Low'];
const INITIAL_FORM_DATA = {
  head_of_household: '',
  members: '',
  location: '',
  block: '',
  shelter: '',
  income: '',
  vulnerable_members: '',
  risk: '',
};
const ROWS_PER_PAGE = 10;

function normalizeText(value) {
  return (value || '').toString().trim().toLowerCase();
}

function getShelterColor(shelter) {
  if (shelter === 'Permanent') return 'success';
  if (shelter === 'Semi-permanent') return 'warning';
  if (shelter === 'Temporary') return 'error';
  return 'default';
}

function getRiskLabel(household) {
  if (household?.risk) {
    const { risk } = household;
    if (risk === 'High') return { label: 'High', color: 'error' };
    if (risk === 'Medium') return { label: 'Medium', color: 'warning' };
    if (risk === 'Low') return { label: 'Low', color: 'success' };
  }

  const vulnerableMembers = Number(household?.vulnerable_members || 0);
  const members = Number(household?.members || 0);
  const income = Number(household?.income || 0);
  const shelter = household?.shelter;

  if (shelter === 'Temporary' || vulnerableMembers >= 4 || income <= 4000) {
    return { label: 'High', color: 'error' };
  }
  if (shelter === 'Semi-permanent' || vulnerableMembers >= 2 || (members >= 6 && income <= 8000)) {
    return { label: 'Medium', color: 'warning' };
  }
  return { label: 'Low', color: 'success' };
}

function buildCsv(rows) {
  const header = [
    'Household ID',
    'Head of Household',
    'Members',
    'Location',
    'Block',
    'Shelter Type',
    'Risk Level',
    'Monthly Income',
    'Vulnerable Members',
  ];

  const body = rows.map((row) => [
    row.household_code || row.id || '',
    row.head_of_household || '',
    row.members || 0,
    row.location || '',
    row.block || '',
    row.shelter || '',
    row.risk || '',
    row.income || 0,
    row.vulnerable_members || 0,
  ]);

  return [header, ...body]
    .map((cols) => cols.map((col) => `"${String(col).replaceAll('"', '""')}"`).join(','))
    .join('\n');
}

export default function HouseholdProfilingMain() {
  const formDialog = useBoolean();
  const confirmDelete = useBoolean();

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [deleteHouseholdId, setDeleteHouseholdId] = useState(null);
  const [shelterFilter, setShelterFilter] = useState('all');
  const [blockFilter, setBlockFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const { data, loading } = useGetRequest(endpoints.beneficiaries.household_profiling);
  const { data: summaryData } = useGetRequest(endpoints.beneficiaries.household_profiling_summary);
  const { data: rawCoverageAreas, loading: coverageLoading } = useGetRequest(
    endpoints.beneficiaries.coverage_areas
  );

  const households = useMemo(() => data?.results || data || [], [data]);
  const coverageAreas = useMemo(
    () => rawCoverageAreas?.results || rawCoverageAreas || [],
    [rawCoverageAreas]
  );

  const totalHouseholds = summaryData?.total_households ?? households.length;
  const totalMembers =
    summaryData?.total_members ??
    households.reduce((sum, item) => sum + Number(item.members || 0), 0);
  const avgMembers =
    summaryData?.average_members ??
    (totalHouseholds ? (totalMembers / totalHouseholds).toFixed(1) : 0);
  const totalVulnerable =
    summaryData?.total_vulnerable ??
    households.reduce((sum, item) => sum + Number(item.vulnerable_members || 0), 0);

  const blockOptions = useMemo(
    () => Array.from(new Set(households.map((item) => item.block).filter(Boolean))).sort(),
    [households]
  );

  const filteredHouseholds = useMemo(() => {
    const term = normalizeText(searchTerm);

    return households.filter((household) => {
      const risk = household?.risk || getRiskLabel(household).label;
      const matchesSearch =
        !term ||
        normalizeText(household?.household_code).includes(term) ||
        normalizeText(household?.head_of_household).includes(term) ||
        normalizeText(household?.location).includes(term) ||
        normalizeText(household?.block).includes(term);
      const matchesShelter = shelterFilter === 'all' || household?.shelter === shelterFilter;
      const matchesBlock = blockFilter === 'all' || household?.block === blockFilter;
      const matchesRisk = riskFilter === 'all' || risk === riskFilter;

      return matchesSearch && matchesShelter && matchesBlock && matchesRisk;
    });
  }, [blockFilter, households, riskFilter, searchTerm, shelterFilter]);

  const totalPages = Math.ceil(filteredHouseholds.length / ROWS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const paginatedHouseholds = useMemo(
    () => filteredHouseholds.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE),
    [currentPage, filteredHouseholds]
  );

  const selectedHouseholdDetails = useMemo(() => {
    if (selectedHousehold) {
      return selectedHousehold;
    }
    return filteredHouseholds[0] || null;
  }, [filteredHouseholds, selectedHousehold]);

  const selectedCoverageArea = useMemo(() => {
    if (!selectedHouseholdDetails?.location) {
      return null;
    }
    const location = normalizeText(selectedHouseholdDetails.location);
    return (
      coverageAreas.find((area) => {
        const division = normalizeText(area.division);
        const districts = (area.districts || []).map(normalizeText);
        return (
          location.includes(division) || districts.some((district) => location.includes(district))
        );
      }) || null
    );
  }, [coverageAreas, selectedHouseholdDetails]);

  const highRiskCount = useMemo(
    () => households.filter((item) => getRiskLabel(item).label === 'High').length,
    [households]
  );
  const temporaryShelterCount = useMemo(
    () => households.filter((item) => item.shelter === 'Temporary').length,
    [households]
  );

  const handlePageChange = useCallback((event, value) => {
    setPage(value);
  }, []);

  const handleExport = useCallback(() => {
    const csv = buildCsv(filteredHouseholds);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'household-profiling.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }, [filteredHouseholds]);

  const handleOpenCreate = useCallback(() => {
    setEditingItem(null);
    setFormData(INITIAL_FORM_DATA);
    formDialog.onTrue();
  }, [formDialog]);

  const handleOpenEdit = useCallback(
    (household) => {
      setSelectedHousehold(household);
      setEditingItem(household);
      setFormData({
        head_of_household: household.head_of_household || '',
        members: household.members ?? '',
        location: household.location || '',
        block: household.block || '',
        shelter: household.shelter || '',
        income: household.income ?? '',
        vulnerable_members: household.vulnerable_members ?? '',
        risk: household.risk || '',
      });
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleCloseForm = useCallback(() => {
    formDialog.onFalse();
    setEditingItem(null);
    setFormData(INITIAL_FORM_DATA);
  }, [formDialog]);

  const handleFormChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData.head_of_household || !formData.location || !formData.shelter) {
      toast.error('Head of household, location, and shelter type are required');
      return;
    }

    try {
      if (editingItem) {
        await axiosInstance.patch(
          `${endpoints.beneficiaries.household_profiling}${editingItem.id}/`,
          formData
        );
        toast.success('Household updated successfully');
      } else {
        await axiosInstance.post(endpoints.beneficiaries.household_profiling, formData);
        toast.success('Household created successfully');
      }
      await mutate(endpoints.beneficiaries.household_profiling);
      await mutate(endpoints.beneficiaries.household_profiling_summary);
      handleCloseForm();
    } catch (error) {
      toast.error(editingItem ? 'Failed to update household' : 'Failed to create household');
    }
  }, [editingItem, formData, handleCloseForm]);

  const handleOpenDelete = useCallback(
    (household) => {
      setDeleteHouseholdId(household.id);
      setSelectedHousehold(household);
      confirmDelete.onTrue();
    },
    [confirmDelete]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteHouseholdId) return;
    try {
      await axiosInstance.delete(
        `${endpoints.beneficiaries.household_profiling}${deleteHouseholdId}/`
      );
      await mutate(endpoints.beneficiaries.household_profiling);
      await mutate(endpoints.beneficiaries.household_profiling_summary);
      toast.success('Household deleted successfully');
      if (selectedHousehold?.id === deleteHouseholdId) {
        setSelectedHousehold(null);
      }
    } catch (error) {
      toast.error('Failed to delete household');
    } finally {
      confirmDelete.onFalse();
      setDeleteHouseholdId(null);
    }
  }, [confirmDelete, deleteHouseholdId, selectedHousehold]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Household Profiling
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review household vulnerability, shelter conditions, and location coverage without losing
            the existing CRUD workflow.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:download-outline" />}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={handleOpenCreate}
          >
            Add Household
          </Button>
        </Stack>
      </Stack>

      {(loading || coverageLoading) && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Households"
            value={totalHouseholds}
            icon="mdi:home"
            bgcolor="primary.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Members"
            value={totalMembers}
            icon="mdi:account-group"
            bgcolor="success.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="High Risk Households"
            value={highRiskCount}
            icon="mdi:alert-circle"
            bgcolor="error.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Temporary Shelters"
            value={temporaryShelterCount}
            icon="mdi:home-alert"
            bgcolor="warning.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Alert severity={highRiskCount > 0 ? 'warning' : 'success'} sx={{ borderRadius: 2 }}>
            {highRiskCount > 0
              ? `${highRiskCount} household${highRiskCount > 1 ? 's are' : ' is'} currently flagged high risk based on shelter condition, income, and vulnerable member count.`
              : 'No households are currently flagged as high risk under the configured review rules.'}
          </Alert>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={700}>
                Coverage Snapshot
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={`${coverageAreas.length} coverage areas`} variant="outlined" />
                <Chip label={`${avgMembers} avg members`} color="info" />
                <Chip label={`${totalVulnerable} vulnerable people`} color="warning" />
              </Stack>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 8 }}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField
                    fullWidth
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Search by household ID, head of household, location, or block..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2.333 }}>
                  <TextField
                    select
                    fullWidth
                    label="Shelter"
                    value={shelterFilter}
                    onChange={(event) => {
                      setShelterFilter(event.target.value);
                      setPage(1);
                    }}
                  >
                    <MenuItem value="all">All Shelter Types</MenuItem>
                    {SHELTER_OPTIONS.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2.333 }}>
                  <TextField
                    select
                    fullWidth
                    label="Block"
                    value={blockFilter}
                    onChange={(event) => {
                      setBlockFilter(event.target.value);
                      setPage(1);
                    }}
                  >
                    <MenuItem value="all">All Blocks</MenuItem>
                    {blockOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2.333 }}>
                  <TextField
                    select
                    fullWidth
                    label="Risk"
                    value={riskFilter}
                    onChange={(event) => {
                      setRiskFilter(event.target.value);
                      setPage(1);
                    }}
                  >
                    <MenuItem value="all">All Risk Levels</MenuItem>
                    {RISK_OPTIONS.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Household ID</TableCell>
                    <TableCell>Head of Household</TableCell>
                    <TableCell align="right">Members</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Shelter Type</TableCell>
                    <TableCell>Risk</TableCell>
                    <TableCell align="right">Monthly Income</TableCell>
                    <TableCell align="right">Vulnerable</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedHouseholds.map((household) => {
                    const risk = getRiskLabel(household);
                    return (
                      <TableRow
                        key={household?.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => setSelectedHousehold(household)}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {household?.household_code || household?.id}
                          </Typography>
                        </TableCell>
                        <TableCell>{household?.head_of_household}</TableCell>
                        <TableCell align="right">{household?.members}</TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Iconify
                              icon="mdi:map-marker"
                              width={16}
                              sx={{ color: 'text.secondary' }}
                            />
                            <Typography variant="body2">{household?.location}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={household?.shelter || 'Unknown'}
                            color={getShelterColor(household?.shelter)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={risk.label}
                            color={risk.color}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          ৳{Number(household?.income || 0).toLocaleString()}
                        </TableCell>
                        <TableCell align="right">{household?.vulnerable_members}</TableCell>
                        <TableCell align="center" onClick={(event) => event.stopPropagation()}>
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => setSelectedHousehold(household)}
                            >
                              <Iconify icon="solar:eye-bold" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleOpenEdit(household)}
                            >
                              <Iconify icon="eva:edit-fill" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenDelete(household)}
                            >
                              <Iconify icon="eva:trash-2-outline" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {paginatedHouseholds.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                        <Stack spacing={2} alignItems="center">
                          <Iconify
                            icon="mdi:home-search-outline"
                            width={56}
                            sx={{ color: 'text.disabled' }}
                          />
                          <Typography variant="h6">No households found</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Adjust the search or household filters.
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages || 1}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      Household Detail
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Select a household to review vulnerability and coverage context.
                    </Typography>
                  </Box>
                  {selectedHouseholdDetails && (
                    <Chip
                      label={getRiskLabel(selectedHouseholdDetails).label}
                      color={getRiskLabel(selectedHouseholdDetails).color}
                    />
                  )}
                </Stack>

                {!selectedHouseholdDetails ? (
                  <Alert severity="info">No household selected.</Alert>
                ) : (
                  <>
                    <Box>
                      <Typography variant="body1" fontWeight={700}>
                        {selectedHouseholdDetails.head_of_household || 'Unknown head of household'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedHouseholdDetails.household_code || selectedHouseholdDetails.id} •{' '}
                        {selectedHouseholdDetails.location || 'Location not set'}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          Members
                        </Typography>
                        <Typography variant="body2">
                          {selectedHouseholdDetails.members || 0}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          Vulnerable Members
                        </Typography>
                        <Typography variant="body2">
                          {selectedHouseholdDetails.vulnerable_members || 0}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          Block
                        </Typography>
                        <Typography variant="body2">
                          {selectedHouseholdDetails.block || '-'}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          Income
                        </Typography>
                        <Typography variant="body2">
                          ৳{Number(selectedHouseholdDetails.income || 0).toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Shelter and risk context
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip
                          label={selectedHouseholdDetails.shelter || 'Unknown shelter'}
                          color={getShelterColor(selectedHouseholdDetails.shelter)}
                        />
                        <Chip
                          label={`${selectedHouseholdDetails.vulnerable_members || 0} vulnerable`}
                          variant="outlined"
                        />
                        <Chip
                          label={`${selectedHouseholdDetails.members || 0} members`}
                          variant="outlined"
                        />
                      </Stack>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Coverage area
                      </Typography>
                      {selectedCoverageArea ? (
                        <Stack spacing={1}>
                          <Typography variant="body2" fontWeight={600}>
                            {selectedCoverageArea.division}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Districts:{' '}
                            {(selectedCoverageArea.districts || []).join(', ') || 'None listed'}
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip
                              label={`${selectedCoverageArea.beneficiaries || 0} beneficiaries`}
                              size="small"
                            />
                            <Chip
                              label={`${selectedCoverageArea.projects || 0} projects`}
                              size="small"
                            />
                            <Chip
                              label={`${selectedCoverageArea.field_offices || 0} field offices`}
                              size="small"
                            />
                          </Stack>
                        </Stack>
                      ) : (
                        <Alert severity="warning">
                          This household location is not clearly matched to a configured coverage
                          area.
                        </Alert>
                      )}
                    </Box>

                    <Divider />

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Button
                        variant="outlined"
                        onClick={() => handleOpenEdit(selectedHouseholdDetails)}
                      >
                        Edit Household
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleOpenDelete(selectedHouseholdDetails)}
                      >
                        Delete Household
                      </Button>
                    </Stack>
                  </>
                )}
              </Stack>
            </Card>

            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={700}>
                  Coverage Areas
                </Typography>
                {coverageAreas.slice(0, 4).map((area) => (
                  <Stack
                    key={area.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {area.division}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(area.districts || []).slice(0, 3).join(', ') || 'No districts listed'}
                      </Typography>
                    </Box>
                    <Chip label={area.beneficiaries || 0} color="primary" variant="outlined" />
                  </Stack>
                ))}
              </Stack>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Dialog open={formDialog.value} onClose={handleCloseForm} fullWidth maxWidth="sm">
        <DialogTitle>{editingItem ? 'Edit Household' : 'Add Household'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Head of Household"
              name="head_of_household"
              value={formData.head_of_household}
              onChange={handleFormChange}
            />
            <TextField
              fullWidth
              label="Members"
              name="members"
              type="number"
              value={formData.members}
              onChange={handleFormChange}
            />
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleFormChange}
            />
            <TextField
              fullWidth
              label="Block"
              name="block"
              value={formData.block}
              onChange={handleFormChange}
            />
            <TextField
              select
              fullWidth
              name="shelter"
              label="Shelter Type"
              value={formData.shelter}
              onChange={handleFormChange}
            >
              {SHELTER_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              fullWidth
              name="risk"
              label="Risk Level"
              value={formData.risk}
              onChange={handleFormChange}
            >
              <MenuItem value="">Select risk</MenuItem>
              {RISK_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Monthly Income"
              name="income"
              type="number"
              value={formData.income}
              onChange={handleFormChange}
            />
            <TextField
              fullWidth
              label="Vulnerable Members"
              name="vulnerable_members"
              type="number"
              value={formData.vulnerable_members}
              onChange={handleFormChange}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={handleCloseForm}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Delete Household"
        content="Are you sure you want to delete this household? This action cannot be undone."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
