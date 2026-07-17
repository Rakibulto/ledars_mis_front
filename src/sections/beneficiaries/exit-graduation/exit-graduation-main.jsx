'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState, useCallback } from 'react';

import {
  Box,
  Card,
  Grid,
  Chip,
  Alert,
  Stack,
  Table,
  Button,
  Dialog,
  Select,
  Divider,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Typography,
  Pagination,
  DialogTitle,
  Autocomplete,
  DialogContent,
  DialogActions,
  TableContainer,
  LinearProgress,
  DialogContentText,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import SummaryCard from '../../_components/summary-card';

const STATUS_COLOR = {
  Graduated: 'success',
  'Ready for Exit': 'info',
  'In Progress': 'warning',
};

const OUTCOME_COLOR = {
  Employed: 'success',
  'Self-sufficient': 'primary',
  'Business Owner': 'secondary',
  Pending: 'default',
};

const INITIAL_FORM = {
  beneficiary: '',
  program: '',
  entry_date: '',
  exit_date: '',
  duration: '',
  status: 'In Progress',
  outcome: 'Pending',
  satisfaction: '',
};

const INITIAL_ALUMNI_FORM = {
  beneficiary: '',
  graduation_date: '',
  program: '',
  current_status: 'In Training',
  income_change: '',
  last_contact: '',
  follow_up_interval: 'Monthly',
  needs_support: false,
};

const ROWS_PER_PAGE = 10;

function GraduationTableRow({ row, onEdit, onDelete, onSelect, onOpenAlumni, selected }) {
  return (
    <TableRow hover selected={selected} onClick={() => onSelect(row)} sx={{ cursor: 'pointer' }}>
      <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>
        {row.graduation_code || row.id}
      </TableCell>
      <TableCell>
        <Stack spacing={0.25}>
          <Typography variant="subtitle2">
            {row.beneficiary_info?.name || row.beneficiary || 'Unknown beneficiary'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.beneficiary_info?.code || row.beneficiary_info?.ben_code || 'No code'}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>{row.program_info?.name || row.program || 'No program'}</TableCell>
      <TableCell>{row.entry_date || '-'}</TableCell>
      <TableCell>{row.exit_date || '-'}</TableCell>
      <TableCell>
        <Chip
          label={row.status || 'In Progress'}
          size="small"
          color={STATUS_COLOR[row.status] || 'default'}
        />
      </TableCell>
      <TableCell>
        <Chip
          label={row.outcome || 'Pending'}
          size="small"
          color={OUTCOME_COLOR[row.outcome] || 'default'}
          variant="outlined"
        />
      </TableCell>
      <TableCell align="center">{row.satisfaction || '-'}</TableCell>
      <TableCell>
        <Stack direction="row" spacing={0.5}>
          <IconButton
            size="small"
            color="primary"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(row);
            }}
          >
            <Iconify icon="solar:pen-bold" width={18} />
          </IconButton>
          <IconButton
            size="small"
            color="warning"
            onClick={(event) => {
              event.stopPropagation();
              onOpenAlumni(row);
            }}
          >
            <Iconify icon="solar:user-plus-bold" width={18} />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(row.id);
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default function ExitGraduationMain() {
  const { data: rawGraduations, loading } = useGetRequest(endpoints.beneficiaries.exit_graduation);
  const { data: summaryData } = useGetRequest(endpoints.beneficiaries.exit_graduation_summary);
  const { data: rawBeneficiaries, loading: beneficiariesLoading } = useGetRequest(
    endpoints.beneficiaries.beneficiaries_database
  );
  const { data: rawPrograms, loading: programsLoading } = useGetRequest(
    endpoints.projects.projects
  );
  const { data: rawCriteria } = useGetRequest(endpoints.beneficiaries.graduation_criteria);
  const { data: rawProgress } = useGetRequest(endpoints.beneficiaries.progress_tracking);
  const { data: rawAlumni } = useGetRequest(endpoints.beneficiaries.alumni_tracking);

  const graduations = Array.isArray(rawGraduations)
    ? rawGraduations
    : rawGraduations?.results || [];
  const beneficiaries = Array.isArray(rawBeneficiaries)
    ? rawBeneficiaries
    : rawBeneficiaries?.results || [];
  const programs = Array.isArray(rawPrograms) ? rawPrograms : rawPrograms?.results || [];
  const criteria = Array.isArray(rawCriteria) ? rawCriteria : rawCriteria?.results || [];
  const progressRecords = Array.isArray(rawProgress) ? rawProgress : rawProgress?.results || [];
  const alumniRecords = Array.isArray(rawAlumni) ? rawAlumni : rawAlumni?.results || [];

  const formDialog = useBoolean();
  const alumniDialog = useBoolean();
  const confirmDelete = useBoolean();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [alumniForm, setAlumniForm] = useState(INITIAL_ALUMNI_FORM);

  const filteredGraduations = useMemo(() => {
    const term = search.trim().toLowerCase();

    return graduations.filter((row) => {
      const matchesSearch =
        !term ||
        row.graduation_code?.toLowerCase().includes(term) ||
        row.beneficiary_info?.name?.toLowerCase().includes(term) ||
        row.program_info?.name?.toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      const matchesProgram =
        programFilter === 'all' ||
        String(row.program) === String(programFilter) ||
        String(row.program_info?.id) === String(programFilter);

      return matchesSearch && matchesStatus && matchesProgram;
    });
  }, [graduations, programFilter, search, statusFilter]);

  const paginatedGraduations = useMemo(() => {
    const startIndex = (page - 1) * ROWS_PER_PAGE;
    return filteredGraduations.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredGraduations, page]);

  const totalPages = Math.max(1, Math.ceil(filteredGraduations.length / ROWS_PER_PAGE));

  const stats = useMemo(() => {
    if (summaryData) {
      return {
        graduated: summaryData.graduated?.count || 0,
        readyForExit: summaryData.ready_for_exit?.count || 0,
        inProgress: summaryData.in_progress?.count || 0,
        avgDuration: summaryData.avg_duration?.count || 0,
      };
    }

    return {
      graduated: graduations.filter((item) => item.status === 'Graduated').length,
      readyForExit: graduations.filter((item) => item.status === 'Ready for Exit').length,
      inProgress: graduations.filter((item) => item.status === 'In Progress').length,
      avgDuration: 0,
    };
  }, [graduations, summaryData]);

  const selectedProgress = useMemo(() => {
    if (!selectedRecord) {
      return null;
    }

    return progressRecords.find(
      (item) =>
        String(item.beneficiary) === String(selectedRecord.beneficiary) ||
        item.beneficiary_name === selectedRecord.beneficiary_info?.name
    );
  }, [progressRecords, selectedRecord]);

  const selectedAlumni = useMemo(() => {
    if (!selectedRecord) {
      return [];
    }

    return alumniRecords.filter(
      (item) =>
        String(item.beneficiary) === String(selectedRecord.beneficiary) ||
        item.name === selectedRecord.beneficiary_info?.name
    );
  }, [alumniRecords, selectedRecord]);

  const selectedCriteria = useMemo(() => {
    if (!selectedRecord) {
      return [];
    }

    return criteria.filter(
      (item) => !item.program || String(item.program) === String(selectedRecord.program)
    );
  }, [criteria, selectedRecord]);

  const readinessScore = useMemo(() => {
    if (!selectedRecord) {
      return 0;
    }

    const progressScore = selectedProgress?.progress || 0;
    const satisfactionScore = selectedRecord.satisfaction
      ? (selectedRecord.satisfaction / 5) * 20
      : 0;
    const statusScore =
      selectedRecord.status === 'Graduated'
        ? 20
        : selectedRecord.status === 'Ready for Exit'
          ? 12
          : 5;

    return Math.min(100, Math.round(progressScore * 0.6 + satisfactionScore + statusScore));
  }, [selectedProgress, selectedRecord]);

  const handleFormChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleAlumniChange = useCallback((event) => {
    const { name, value } = event.target;
    setAlumniForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const openCreateDialog = useCallback(() => {
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    formDialog.onTrue();
  }, [formDialog]);

  const openEditDialog = useCallback(
    (row) => {
      setEditingItem(row);
      setSelectedRecord(row);
      setFormData({
        beneficiary: row.beneficiary || '',
        program: row.program || '',
        entry_date: row.entry_date || '',
        exit_date: row.exit_date || '',
        duration: row.duration || '',
        status: row.status || 'In Progress',
        outcome: row.outcome || 'Pending',
        satisfaction: row.satisfaction || '',
      });
      formDialog.onTrue();
    },
    [formDialog]
  );

  const openAlumniDialog = useCallback(
    (row) => {
      setSelectedRecord(row);
      setAlumniForm({
        ...INITIAL_ALUMNI_FORM,
        beneficiary: row.beneficiary || '',
        graduation_date: row.exit_date || '',
        program: row.program || '',
        current_status:
          row.outcome === 'Employed'
            ? 'Employed'
            : row.outcome === 'Business Owner'
              ? 'Self-employed'
              : 'In Training',
        needs_support: row.outcome === 'Pending',
      });
      alumniDialog.onTrue();
    },
    [alumniDialog]
  );

  const handleSubmit = useCallback(async () => {
    if (!formData.beneficiary || !formData.entry_date || !formData.status) {
      toast.error('Beneficiary, entry date, and status are required');
      return;
    }

    try {
      if (editingItem) {
        await axiosInstance.patch(
          `${endpoints.beneficiaries.exit_graduation}${editingItem.id}/`,
          formData
        );
        toast.success('Graduation record updated');
      } else {
        await axiosInstance.post(endpoints.beneficiaries.exit_graduation, formData);
        toast.success('Graduation record created');
      }

      await mutate(endpoints.beneficiaries.exit_graduation);
      await mutate(endpoints.beneficiaries.exit_graduation_summary);
      formDialog.onFalse();
    } catch (error) {
      toast.error(error?.message || 'Failed to save graduation record');
    }
  }, [editingItem, formData, formDialog]);

  const handleCreateAlumni = useCallback(async () => {
    if (!alumniForm.beneficiary || !alumniForm.graduation_date) {
      toast.error('Beneficiary and graduation date are required');
      return;
    }

    try {
      await axiosInstance.post(endpoints.beneficiaries.alumni_tracking, alumniForm);
      await mutate(endpoints.beneficiaries.alumni_tracking);
      alumniDialog.onFalse();
      toast.success('Alumni transition record created');
    } catch (error) {
      toast.error(error?.message || 'Failed to create alumni transition');
    }
  }, [alumniDialog, alumniForm]);

  const handleDelete = useCallback(
    (id) => {
      setDeleteId(id);
      confirmDelete.onTrue();
    },
    [confirmDelete]
  );

  const confirmDeleteRecord = useCallback(async () => {
    try {
      await axiosInstance.delete(`${endpoints.beneficiaries.exit_graduation}${deleteId}/`);
      await mutate(endpoints.beneficiaries.exit_graduation);
      await mutate(endpoints.beneficiaries.exit_graduation_summary);
      confirmDelete.onFalse();
      toast.success('Graduation record deleted');
    } catch (error) {
      toast.error(error?.message || 'Failed to delete graduation record');
    }
  }, [confirmDelete, deleteId]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} color="#1a1a1a" gutterBottom>
            Exit and Graduation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track graduation readiness, record exits, and move graduated beneficiaries into alumni
            follow-up.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button href="/dashboard/beneficiaries/graduation-criteria" variant="outlined">
            Graduation Criteria
          </Button>
          <Button
            variant="contained"
            onClick={openCreateDialog}
            startIcon={<Iconify icon="solar:diploma-bold" />}
          >
            New Graduation Record
          </Button>
        </Stack>
      </Stack>

      {(loading || beneficiariesLoading || programsLoading) && <LinearProgress sx={{ mb: 3 }} />}

      <Alert severity="info" sx={{ mb: 3 }}>
        Use this workflow to review readiness, confirm program exit, and hand off graduated
        beneficiaries into alumni tracking.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Graduated"
            value={stats.graduated}
            icon="solar:diploma-bold"
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Ready for Exit"
            value={stats.readyForExit}
            icon="solar:check-circle-bold"
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="In Progress"
            value={stats.inProgress}
            icon="solar:clock-circle-bold"
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Avg Duration"
            value={stats.avgDuration || '-'}
            icon="solar:calendar-bold"
            color="primary"
          />
        </Grid>
      </Grid>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ p: 2.5 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Search records"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Select
                  fullWidth
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <MenuItem value="all">All statuses</MenuItem>
                  <MenuItem value="Graduated">Graduated</MenuItem>
                  <MenuItem value="Ready for Exit">Ready for Exit</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                </Select>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Select
                  fullWidth
                  value={programFilter}
                  onChange={(event) => setProgramFilter(event.target.value)}
                >
                  <MenuItem value="all">All programs</MenuItem>
                  {programs.map((program) => (
                    <MenuItem key={program.id} value={program.id}>
                      {program.name}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
            </Grid>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ p: 2.5, height: '100%' }}>
            <Stack spacing={1.5}>
              <Typography variant="h6">Graduation Queue</Typography>
              <Typography variant="body2" color="text.secondary">
                Review readiness before marking exit complete, then create alumni follow-up for
                graduated beneficiaries.
              </Typography>
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Near graduation</Typography>
                <Chip
                  label={progressRecords.filter((item) => (item.progress || 0) >= 70).length}
                  size="small"
                  color="info"
                />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Criteria available</Typography>
                <Chip
                  label={criteria.filter((item) => item.status === 'Active').length}
                  size="small"
                  color="success"
                />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Alumni records created</Typography>
                <Chip label={alumniRecords.length} size="small" color="primary" />
              </Stack>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Beneficiary</TableCell>
                    <TableCell>Program</TableCell>
                    <TableCell>Entry Date</TableCell>
                    <TableCell>Exit Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Outcome</TableCell>
                    <TableCell align="center">Satisfaction</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedGraduations.map((row) => (
                    <GraduationTableRow
                      key={row.id}
                      row={row}
                      onEdit={openEditDialog}
                      onDelete={handleDelete}
                      onSelect={setSelectedRecord}
                      onOpenAlumni={openAlumniDialog}
                      selected={selectedRecord?.id === row.id}
                    />
                  ))}
                  {!paginatedGraduations.length && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          No graduation records match the current filters.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {totalPages > 1 && (
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  page={page}
                  count={totalPages}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ p: 2.5, minHeight: 520 }}>
            {selectedRecord ? (
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6">Graduation Review</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedRecord.graduation_code || selectedRecord.id}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${readinessScore}% ready`}
                    color={
                      readinessScore >= 80
                        ? 'success'
                        : readinessScore >= 60
                          ? 'warning'
                          : 'default'
                    }
                    size="small"
                  />
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="subtitle2">Beneficiary</Typography>
                  <Typography variant="body2">
                    {selectedRecord.beneficiary_info?.name || 'Unknown beneficiary'}
                  </Typography>
                </Stack>

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Typography variant="body2">{selectedRecord.status || 'Not set'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Outcome
                    </Typography>
                    <Typography variant="body2">{selectedRecord.outcome || 'Pending'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Satisfaction
                    </Typography>
                    <Typography variant="body2">
                      {selectedRecord.satisfaction || 'Not rated'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Duration
                    </Typography>
                    <Typography variant="body2">{selectedRecord.duration || 'Not set'}</Typography>
                  </Grid>
                </Grid>

                <Divider />

                <Stack spacing={1}>
                  <Typography variant="subtitle2">Progress Tracking</Typography>
                  {selectedProgress ? (
                    <Card variant="outlined" sx={{ p: 1.5 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedProgress.current_phase || 'Current phase unavailable'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Progress {selectedProgress.progress || 0}% · Target graduation{' '}
                        {selectedProgress.target_graduation || 'Not set'}
                      </Typography>
                    </Card>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No linked progress record found for this beneficiary.
                    </Typography>
                  )}
                </Stack>

                <Divider />

                <Stack spacing={1}>
                  <Typography variant="subtitle2">Graduation Criteria</Typography>
                  {selectedCriteria.length ? (
                    selectedCriteria.slice(0, 4).map((item) => (
                      <Card key={item.id} variant="outlined" sx={{ p: 1.25 }}>
                        <Stack direction="row" justifyContent="space-between" spacing={1}>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {item.criteria}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.indicator || item.measurement || 'No indicator'}
                            </Typography>
                          </Box>
                          <Chip label={`${item.weight || 0}%`} size="small" color="info" />
                        </Stack>
                      </Card>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No graduation criteria are linked to this program.
                    </Typography>
                  )}
                </Stack>

                <Divider />

                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2">Alumni Transition</Typography>
                    <Button
                      size="small"
                      onClick={() => openAlumniDialog(selectedRecord)}
                      startIcon={<Iconify icon="solar:user-plus-bold" />}
                    >
                      Create
                    </Button>
                  </Stack>
                  {selectedAlumni.length ? (
                    selectedAlumni.slice(0, 3).map((item) => (
                      <Card key={item.id} variant="outlined" sx={{ p: 1.25 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {item.current_status || 'Unknown status'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Last contact {item.last_contact || 'Not set'} · Support{' '}
                          {item.needs_support ? 'required' : 'stable'}
                        </Typography>
                      </Card>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No alumni transition exists for this beneficiary yet.
                    </Typography>
                  )}
                </Stack>
              </Stack>
            ) : (
              <Stack spacing={1.5} justifyContent="center" sx={{ height: '100%' }}>
                <Typography variant="h6">Select a Record</Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose an exit record to review readiness, graduation criteria, progress, and
                  alumni handover.
                </Typography>
              </Stack>
            )}
          </Card>
        </Grid>
      </Grid>

      <Dialog open={formDialog.value} onClose={formDialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Graduation Record' : 'New Graduation Record'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <DialogContentText>
              Record the beneficiary program exit state and outcome. Alumni tracking can be created
              separately after graduation is confirmed.
            </DialogContentText>
            <Autocomplete
              options={beneficiaries}
              getOptionLabel={(option) =>
                option?.name || option?.full_name || option?.beneficiary_name || ''
              }
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              value={
                beneficiaries.find(
                  (option) => String(option.id) === String(formData.beneficiary)
                ) || null
              }
              onChange={(_, value) =>
                setFormData((prev) => ({ ...prev, beneficiary: value?.id || '' }))
              }
              renderInput={(params) => <TextField {...params} label="Beneficiary" required />}
            />
            <Autocomplete
              options={programs}
              getOptionLabel={(option) => option?.name || option?.title || ''}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              value={
                programs.find((option) => String(option.id) === String(formData.program)) || null
              }
              onChange={(_, value) =>
                setFormData((prev) => ({ ...prev, program: value?.id || '' }))
              }
              renderInput={(params) => <TextField {...params} label="Program" />}
            />
            <TextField
              label="Entry Date"
              name="entry_date"
              type="date"
              value={formData.entry_date}
              onChange={handleFormChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Exit Date"
              name="exit_date"
              type="date"
              value={formData.exit_date}
              onChange={handleFormChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Duration"
              name="duration"
              value={formData.duration}
              onChange={handleFormChange}
              fullWidth
            />
            <Select name="status" value={formData.status} onChange={handleFormChange} fullWidth>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Ready for Exit">Ready for Exit</MenuItem>
              <MenuItem value="Graduated">Graduated</MenuItem>
            </Select>
            <Select name="outcome" value={formData.outcome} onChange={handleFormChange} fullWidth>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Employed">Employed</MenuItem>
              <MenuItem value="Self-sufficient">Self-sufficient</MenuItem>
              <MenuItem value="Business Owner">Business Owner</MenuItem>
            </Select>
            <TextField
              label="Satisfaction (1-5)"
              name="satisfaction"
              type="number"
              value={formData.satisfaction}
              onChange={handleFormChange}
              fullWidth
              inputProps={{ min: 1, max: 5 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={formDialog.onFalse}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={alumniDialog.value} onClose={alumniDialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>Create Alumni Transition</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <DialogContentText>
              Create a follow-up alumni record after graduation so the beneficiary can be tracked
              post-program.
            </DialogContentText>
            <Autocomplete
              options={beneficiaries}
              getOptionLabel={(option) =>
                option?.name || option?.full_name || option?.beneficiary_name || ''
              }
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              value={
                beneficiaries.find(
                  (option) => String(option.id) === String(alumniForm.beneficiary)
                ) || null
              }
              onChange={(_, value) =>
                setAlumniForm((prev) => ({ ...prev, beneficiary: value?.id || '' }))
              }
              renderInput={(params) => <TextField {...params} label="Beneficiary" required />}
            />
            <Autocomplete
              options={programs}
              getOptionLabel={(option) => option?.name || option?.title || ''}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              value={
                programs.find((option) => String(option.id) === String(alumniForm.program)) || null
              }
              onChange={(_, value) =>
                setAlumniForm((prev) => ({ ...prev, program: value?.id || '' }))
              }
              renderInput={(params) => <TextField {...params} label="Program" />}
            />
            <TextField
              label="Graduation Date"
              name="graduation_date"
              type="date"
              value={alumniForm.graduation_date}
              onChange={handleAlumniChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <Select
              name="current_status"
              value={alumniForm.current_status}
              onChange={handleAlumniChange}
              fullWidth
            >
              <MenuItem value="Employed">Employed</MenuItem>
              <MenuItem value="Self-employed">Self-employed</MenuItem>
              <MenuItem value="Unemployed">Unemployed</MenuItem>
              <MenuItem value="In Training">In Training</MenuItem>
            </Select>
            <TextField
              label="Income Change"
              name="income_change"
              value={alumniForm.income_change}
              onChange={handleAlumniChange}
              fullWidth
            />
            <TextField
              label="Last Contact"
              name="last_contact"
              type="date"
              value={alumniForm.last_contact}
              onChange={handleAlumniChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <Select
              name="follow_up_interval"
              value={alumniForm.follow_up_interval}
              onChange={handleAlumniChange}
              fullWidth
            >
              <MenuItem value="Monthly">Monthly</MenuItem>
              <MenuItem value="Quarterly">Quarterly</MenuItem>
              <MenuItem value="Biannual">Biannual</MenuItem>
            </Select>
            <Select
              name="needs_support"
              value={String(alumniForm.needs_support)}
              onChange={(event) =>
                setAlumniForm((prev) => ({ ...prev, needs_support: event.target.value === 'true' }))
              }
              fullWidth
            >
              <MenuItem value="false">No additional support needed</MenuItem>
              <MenuItem value="true">Needs additional support</MenuItem>
            </Select>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={alumniDialog.onFalse}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateAlumni}>
            Create Alumni Record
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Delete Graduation Record"
        content="Are you sure you want to delete this graduation record?"
        action={
          <Button variant="contained" color="error" onClick={confirmDeleteRecord}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
