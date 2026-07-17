'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Grid,
  List,
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
  DialogTitle,
  ListItemText,
  DialogContent,
  DialogActions,
  InputAdornment,
  TableContainer,
  ListItemButton,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import SummaryCard from '../../_components/summary-card';

const STATUS_COLOR = {
  Draft: 'default',
  'In Progress': 'warning',
  Completed: 'success',
  Reviewed: 'info',
};

const STATUS_OPTIONS = ['All', 'Draft', 'In Progress', 'Completed', 'Reviewed'];

const INITIAL_FORM = {
  location: '',
  date: '',
  assessor: '',
  population: '',
  priority_needs: '',
  gap_score: '',
  status: 'Draft',
  recommendations: '',
};

function formatDate(value) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString();
}

function toNeedsArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function createCsvValue(value) {
  const safeValue = value ?? '';
  return `"${String(safeValue).replace(/"/g, '""')}"`;
}

export default function NeedsAssessmentMain() {
  const { data: rawData } = useGetRequest(endpoints.beneficiaries.needs_assessments);
  const needsAssessments = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const formDialog = useBoolean();
  const confirmDelete = useBoolean();

  const [editingItem, setEditingItem] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [minGapFilter, setMinGapFilter] = useState('');
  const [formData, setFormData] = useState(INITIAL_FORM);

  const filteredAssessments = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return needsAssessments.filter((assessment) => {
      const matchesStatus = statusFilter === 'All' || assessment.status === statusFilter;
      const matchesGap = !minGapFilter || Number(assessment.gap_score || 0) >= Number(minGapFilter);
      const matchesSearch =
        !normalizedQuery ||
        [assessment.reference, assessment.location, assessment.assessor]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));

      return matchesStatus && matchesGap && matchesSearch;
    });
  }, [minGapFilter, needsAssessments, searchQuery, statusFilter]);

  const selectedAssessment = useMemo(
    () =>
      filteredAssessments.find((assessment) => assessment.id === selectedId) ||
      filteredAssessments[0] ||
      null,
    [filteredAssessments, selectedId]
  );

  const summary = useMemo(() => {
    const totalPopulation = needsAssessments.reduce(
      (total, assessment) => total + Number(assessment.population || 0),
      0
    );
    const highGapCount = needsAssessments.filter(
      (assessment) => Number(assessment.gap_score || 0) >= 7
    ).length;
    const completedCount = needsAssessments.filter((assessment) =>
      ['Completed', 'Reviewed'].includes(assessment.status)
    ).length;
    const averageGapScore = needsAssessments.length
      ? (
          needsAssessments.reduce(
            (total, assessment) => total + Number(assessment.gap_score || 0),
            0
          ) / needsAssessments.length
        ).toFixed(1)
      : '0.0';

    return {
      total: needsAssessments.length,
      totalPopulation,
      highGapCount,
      completedCount,
      averageGapScore,
    };
  }, [needsAssessments]);

  const topNeeds = useMemo(() => {
    const needsMap = new Map();
    needsAssessments.forEach((assessment) => {
      toNeedsArray(assessment.priority_needs).forEach((need) => {
        needsMap.set(need, (needsMap.get(need) || 0) + 1);
      });
    });
    return [...needsMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [needsAssessments]);

  const handleFormChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const openCreateDialog = useCallback(() => {
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    formDialog.onTrue();
  }, [formDialog]);

  const openEditDialog = useCallback(
    (assessment) => {
      setEditingItem(assessment);
      setFormData({
        location: assessment.location || '',
        date: assessment.date || '',
        assessor: assessment.assessor || '',
        population: assessment.population || '',
        priority_needs: toNeedsArray(assessment.priority_needs).join(', '),
        gap_score: assessment.gap_score || '',
        status: assessment.status || 'Draft',
        recommendations: assessment.recommendations || '',
      });
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleSubmit = useCallback(async () => {
    if (!formData.location || !formData.date || !formData.assessor) {
      toast.error('Location, date, and assessor are required.');
      return;
    }

    const parsedNeeds = toNeedsArray(formData.priority_needs);
    if (!parsedNeeds.length) {
      toast.error('Enter at least one priority need.');
      return;
    }

    const payload = {
      ...formData,
      priority_needs: parsedNeeds,
      population: Number(formData.population || 0),
      gap_score: formData.gap_score === '' ? null : Number(formData.gap_score),
    };

    try {
      if (editingItem) {
        await axiosInstance.patch(
          `${endpoints.beneficiaries.needs_assessments}${editingItem.id}/`,
          payload
        );
        toast.success('Assessment updated successfully.');
      } else {
        const response = await axiosInstance.post(
          endpoints.beneficiaries.needs_assessments,
          payload
        );
        setSelectedId(response?.data?.id || null);
        toast.success('Assessment created successfully.');
      }

      mutate(endpoints.beneficiaries.needs_assessments);
      formDialog.onFalse();
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || 'Operation failed.');
    }
  }, [editingItem, formData, formDialog]);

  const openDeleteDialog = useCallback(
    (id) => {
      setDeleteId(id);
      confirmDelete.onTrue();
    },
    [confirmDelete]
  );

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await axiosInstance.delete(`${endpoints.beneficiaries.needs_assessments}${deleteId}/`);
      mutate(endpoints.beneficiaries.needs_assessments);
      if (selectedId === deleteId) {
        setSelectedId(null);
      }
      toast.success('Assessment deleted.');
      confirmDelete.onFalse();
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || 'Failed to delete assessment.');
    }
  }, [confirmDelete, deleteId, selectedId]);

  const handleQuickStatusUpdate = useCallback(async (assessment, nextStatus) => {
    try {
      await axiosInstance.patch(`${endpoints.beneficiaries.needs_assessments}${assessment.id}/`, {
        status: nextStatus,
      });
      mutate(endpoints.beneficiaries.needs_assessments);
      toast.success(`Assessment moved to ${nextStatus}.`);
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || 'Status update failed.');
    }
  }, []);

  const handleExport = useCallback(() => {
    const lines = [
      [
        'Reference',
        'Location',
        'Date',
        'Assessor',
        'Population',
        'Gap Score',
        'Status',
        'Priority Needs',
      ].join(','),
      ...filteredAssessments.map((assessment) =>
        [
          createCsvValue(assessment.reference),
          createCsvValue(assessment.location),
          createCsvValue(assessment.date),
          createCsvValue(assessment.assessor),
          createCsvValue(assessment.population),
          createCsvValue(assessment.gap_score),
          createCsvValue(assessment.status),
          createCsvValue(toNeedsArray(assessment.priority_needs).join('; ')),
        ].join(',')
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'needs-assessments.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [filteredAssessments]);

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
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Needs Assessment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review assessment coverage, track completion, and surface the highest-gap communities.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:export-bold" />}
            onClick={handleExport}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:clipboard-add-bold" />}
            onClick={openCreateDialog}
          >
            New Assessment
          </Button>
        </Stack>
      </Stack>

      {summary.highGapCount > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {summary.highGapCount} assessment{summary.highGapCount > 1 ? 's have' : ' has'} a gap
          score of 7 or above and should be prioritized for response planning.
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="Total Assessments"
            value={summary.total}
            icon="solar:clipboard-text-bold"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="Population Covered"
            value={summary.totalPopulation}
            icon="solar:users-group-rounded-bold"
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="High-Gap Areas"
            value={summary.highGapCount}
            icon="solar:danger-triangle-bold"
            color="error"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="Avg. Gap Score"
            value={summary.averageGapScore}
            icon="solar:chart-2-bold"
            color="warning"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ p: 2.5 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2.5 }}>
              <TextField
                fullWidth
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by reference, location, or assessor"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:magnifer-bold" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                select
                label="Status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                sx={{ minWidth: 180 }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Min Gap Score"
                type="number"
                value={minGapFilter}
                onChange={(event) => setMinGapFilter(event.target.value)}
                inputProps={{ min: 0, max: 10, step: 0.1 }}
                sx={{ minWidth: 160 }}
              />
            </Stack>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Reference</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Assessor</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Population</TableCell>
                    <TableCell>Gap Score</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAssessments.map((assessment) => {
                    const gapScore = Number(assessment.gap_score || 0);

                    return (
                      <TableRow
                        key={assessment.id}
                        hover
                        selected={selectedAssessment?.id === assessment.id}
                        onClick={() => setSelectedId(assessment.id)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography variant="subtitle2">{assessment.reference}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(assessment.date)}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{assessment.location || 'Unknown'}</TableCell>
                        <TableCell>{assessment.assessor || 'Unassigned'}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={assessment.status}
                            color={STATUS_COLOR[assessment.status] || 'default'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {Number(assessment.population || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={assessment.gap_score || '0'}
                            color={gapScore >= 8 ? 'error' : gapScore >= 6 ? 'warning' : 'success'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(event) => {
                                event.stopPropagation();
                                openEditDialog(assessment);
                              }}
                            >
                              <Iconify icon="solar:pen-bold" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(event) => {
                                event.stopPropagation();
                                openDeleteDialog(assessment.id);
                              }}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {!filteredAssessments.length && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                          No assessments match the current filters.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Clear the filters or record a new assessment.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ p: 2.5, minHeight: '100%' }}>
            {selectedAssessment ? (
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" spacing={1.5}>
                  <Box>
                    <Typography variant="h6">{selectedAssessment.reference}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedAssessment.location || 'Unknown location'}
                    </Typography>
                  </Box>
                  <Chip
                    label={selectedAssessment.status}
                    color={STATUS_COLOR[selectedAssessment.status] || 'default'}
                  />
                </Stack>

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Date
                    </Typography>
                    <Typography variant="subtitle2">
                      {formatDate(selectedAssessment.date)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Assessor
                    </Typography>
                    <Typography variant="subtitle2">
                      {selectedAssessment.assessor || 'Not assigned'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Population
                    </Typography>
                    <Typography variant="subtitle2">
                      {Number(selectedAssessment.population || 0).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Gap Score
                    </Typography>
                    <Typography variant="subtitle2">
                      {selectedAssessment.gap_score || '0'}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider />

                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Priority Needs
                  </Typography>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                    {toNeedsArray(selectedAssessment.priority_needs).map((need) => (
                      <Chip key={need} label={need} size="small" variant="outlined" />
                    ))}
                    {!toNeedsArray(selectedAssessment.priority_needs).length && (
                      <Typography variant="body2">No priority needs listed.</Typography>
                    )}
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Recommendations
                  </Typography>
                  <Typography variant="body2">
                    {selectedAssessment.recommendations || 'No recommendations provided.'}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Quick Actions
                  </Typography>
                  <List disablePadding>
                    {selectedAssessment.status === 'Draft' && (
                      <ListItemButton
                        onClick={() => handleQuickStatusUpdate(selectedAssessment, 'In Progress')}
                      >
                        <ListItemText
                          primary="Start Assessment"
                          secondary="Move the assessment from draft into active fieldwork."
                        />
                      </ListItemButton>
                    )}
                    {selectedAssessment.status === 'In Progress' && (
                      <ListItemButton
                        onClick={() => handleQuickStatusUpdate(selectedAssessment, 'Completed')}
                      >
                        <ListItemText
                          primary="Mark Completed"
                          secondary="Record that data collection and scoring are complete."
                        />
                      </ListItemButton>
                    )}
                    {selectedAssessment.status === 'Completed' && (
                      <ListItemButton
                        onClick={() => handleQuickStatusUpdate(selectedAssessment, 'Reviewed')}
                      >
                        <ListItemText
                          primary="Mark Reviewed"
                          secondary="Confirm program review and readiness for action planning."
                        />
                      </ListItemButton>
                    )}
                    <ListItemButton onClick={() => openEditDialog(selectedAssessment)}>
                      <ListItemText
                        primary="Update Assessment"
                        secondary="Edit the assessment form, needs list, or recommendations."
                      />
                    </ListItemButton>
                  </List>
                </Box>

                {!!topNeeds.length && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Common Needs Across Assessments
                    </Typography>
                    <Stack spacing={1}>
                      {topNeeds.map(([need, count]) => (
                        <Stack key={need} direction="row" justifyContent="space-between">
                          <Typography variant="body2">{need}</Typography>
                          <Chip size="small" label={`${count} assessments`} />
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            ) : (
              <Stack
                justifyContent="center"
                alignItems="center"
                spacing={1.5}
                sx={{ minHeight: 320, textAlign: 'center' }}
              >
                <Iconify icon="solar:clipboard-text-bold" width={40} />
                <Typography variant="subtitle1">No assessment selected</Typography>
                <Typography variant="body2" color="text.secondary">
                  Select an assessment from the queue to review details and move it forward.
                </Typography>
              </Stack>
            )}
          </Card>
        </Grid>
      </Grid>

      <Dialog open={formDialog.value} onClose={formDialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Assessment' : 'New Needs Assessment'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleFormChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Assessor"
              name="assessor"
              value={formData.assessor}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Population"
              name="population"
              type="number"
              value={formData.population}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Priority Needs"
              name="priority_needs"
              value={formData.priority_needs}
              onChange={handleFormChange}
              helperText="Separate multiple needs with commas."
              fullWidth
            />
            <TextField
              label="Gap Score"
              name="gap_score"
              type="number"
              value={formData.gap_score}
              onChange={handleFormChange}
              fullWidth
            />
            <Select name="status" value={formData.status} onChange={handleFormChange} fullWidth>
              {STATUS_OPTIONS.filter((option) => option !== 'All').map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            <TextField
              label="Recommendations"
              name="recommendations"
              value={formData.recommendations}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={4}
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

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Delete assessment"
        content="This will permanently remove the selected needs assessment."
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
