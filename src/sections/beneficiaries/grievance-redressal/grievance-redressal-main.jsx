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
  Open: 'error',
  'Under Investigation': 'warning',
  Resolved: 'success',
  Closed: 'default',
};

const STATUS_OPTIONS = ['All', 'Open', 'Under Investigation', 'Resolved', 'Closed'];
const TYPE_OPTIONS = [
  'All',
  'Protection',
  'Service Delivery',
  'Fraud',
  'Staff Conduct',
  'Inclusion',
  'Other',
];

const INITIAL_FORM = {
  date: '',
  complainant: '',
  type: '',
  description: '',
  assigned_to: '',
  status: 'Open',
  resolution: '',
  resolution_date: '',
};

function formatDate(value) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString();
}

function getAgeInDays(value) {
  if (!value) return 0;
  const openedAt = new Date(value);
  const diff = Date.now() - openedAt.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function createCsvValue(value) {
  const safeValue = value ?? '';
  return `"${String(safeValue).replace(/"/g, '""')}"`;
}

export default function GrievanceRedressalMain() {
  const { data: rawData } = useGetRequest(endpoints.beneficiaries.grievance_records);
  const grievanceRecords = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const formDialog = useBoolean();
  const confirmDelete = useBoolean();

  const [editingItem, setEditingItem] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [formData, setFormData] = useState(INITIAL_FORM);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return grievanceRecords.filter((record) => {
      const matchesStatus = statusFilter === 'All' || record.status === statusFilter;
      const matchesType = typeFilter === 'All' || record.type === typeFilter;
      const matchesSearch =
        !normalizedQuery ||
        [record.reference, record.complainant, record.type, record.assigned_to, record.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [grievanceRecords, searchQuery, statusFilter, typeFilter]);

  const selectedRecord = useMemo(
    () => filteredRecords.find((record) => record.id === selectedId) || filteredRecords[0] || null,
    [filteredRecords, selectedId]
  );

  const summary = useMemo(() => {
    const openItems = grievanceRecords.filter((record) => record.status === 'Open').length;
    const underInvestigation = grievanceRecords.filter(
      (record) => record.status === 'Under Investigation'
    ).length;
    const resolvedItems = grievanceRecords.filter(
      (record) => record.status === 'Resolved' || record.status === 'Closed'
    );
    const overdueItems = grievanceRecords.filter(
      (record) => !['Resolved', 'Closed'].includes(record.status) && getAgeInDays(record.date) > 7
    ).length;
    const avgResolutionDays = resolvedItems.length
      ? Math.round(
          resolvedItems.reduce(
            (total, record) => total + Number(record.days_to_resolve || getAgeInDays(record.date)),
            0
          ) / resolvedItems.length
        )
      : 0;

    return {
      total: grievanceRecords.length,
      openItems,
      underInvestigation,
      overdueItems,
      avgResolutionDays,
    };
  }, [grievanceRecords]);

  const typeOptions = useMemo(() => {
    const dynamicTypes = grievanceRecords.map((record) => record.type).filter(Boolean);
    return [...new Set([...TYPE_OPTIONS, ...dynamicTypes])];
  }, [grievanceRecords]);

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
    (record) => {
      setEditingItem(record);
      setFormData({
        date: record.date || '',
        complainant: record.complainant || '',
        type: record.type || '',
        description: record.description || '',
        assigned_to: record.assigned_to || '',
        status: record.status || 'Open',
        resolution: record.resolution || '',
        resolution_date: record.resolution_date || '',
      });
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleSubmit = useCallback(async () => {
    if (!formData.date || !formData.complainant || !formData.type || !formData.description) {
      toast.error('Date, complainant, type, and description are required.');
      return;
    }

    if (['Resolved', 'Closed'].includes(formData.status) && !formData.resolution.trim()) {
      toast.error('Resolution details are required before closing a grievance.');
      return;
    }

    const payload = {
      ...formData,
      resolution_date:
        ['Resolved', 'Closed'].includes(formData.status) && !formData.resolution_date
          ? new Date().toISOString().slice(0, 10)
          : formData.resolution_date || null,
    };

    try {
      if (editingItem) {
        await axiosInstance.patch(
          `${endpoints.beneficiaries.grievance_records}${editingItem.id}/`,
          payload
        );
        toast.success('Grievance updated.');
      } else {
        const response = await axiosInstance.post(
          endpoints.beneficiaries.grievance_records,
          payload
        );
        setSelectedId(response?.data?.id || null);
        toast.success('Grievance recorded.');
      }

      mutate(endpoints.beneficiaries.grievance_records);
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
      await axiosInstance.delete(`${endpoints.beneficiaries.grievance_records}${deleteId}/`);
      mutate(endpoints.beneficiaries.grievance_records);
      if (selectedId === deleteId) {
        setSelectedId(null);
      }
      toast.success('Grievance deleted.');
      confirmDelete.onFalse();
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || 'Failed to delete grievance.');
    }
  }, [confirmDelete, deleteId, selectedId]);

  const handleQuickStatusUpdate = useCallback(async (record, nextStatus) => {
    try {
      await axiosInstance.patch(`${endpoints.beneficiaries.grievance_records}${record.id}/`, {
        status: nextStatus,
        resolution_date:
          ['Resolved', 'Closed'].includes(nextStatus) && !record.resolution_date
            ? new Date().toISOString().slice(0, 10)
            : record.resolution_date,
      });
      mutate(endpoints.beneficiaries.grievance_records);
      toast.success(`Grievance moved to ${nextStatus}.`);
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || 'Status update failed.');
    }
  }, []);

  const handleExport = useCallback(() => {
    const lines = [
      [
        'Reference',
        'Date',
        'Complainant',
        'Type',
        'Assigned To',
        'Status',
        'Days Open',
        'Resolution',
      ].join(','),
      ...filteredRecords.map((record) =>
        [
          createCsvValue(record.reference),
          createCsvValue(record.date),
          createCsvValue(record.complainant),
          createCsvValue(record.type),
          createCsvValue(record.assigned_to),
          createCsvValue(record.status),
          createCsvValue(record.days_to_resolve ?? getAgeInDays(record.date)),
          createCsvValue(record.resolution),
        ].join(',')
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'grievance-redressal.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [filteredRecords]);

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
            Grievance Redressal
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Triage open complaints, track investigations, and close cases with documented
            resolutions.
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
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={openCreateDialog}
          >
            Record Grievance
          </Button>
        </Stack>
      </Stack>

      {summary.overdueItems > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {summary.overdueItems} grievance{summary.overdueItems > 1 ? 's are' : ' is'} open for more
          than 7 days and should be reviewed.
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="Total Grievances"
            value={summary.total}
            icon="solar:document-text-bold"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="Open Queue"
            value={summary.openItems + summary.underInvestigation}
            icon="solar:clipboard-list-bold"
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="Overdue Cases"
            value={summary.overdueItems}
            icon="solar:danger-triangle-bold"
            color="error"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="Avg. Resolution Days"
            value={summary.avgResolutionDays}
            icon="solar:stopwatch-bold"
            color="success"
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
                placeholder="Search by reference, complainant, assignee, or description"
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
                sx={{ minWidth: 200 }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Type"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                sx={{ minWidth: 200 }}
              >
                {typeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Reference</TableCell>
                    <TableCell>Complainant</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Age</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRecords.map((record) => {
                    const ageInDays = record.days_to_resolve ?? getAgeInDays(record.date);

                    return (
                      <TableRow
                        key={record.id}
                        hover
                        selected={selectedRecord?.id === record.id}
                        onClick={() => setSelectedId(record.id)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography variant="subtitle2">{record.reference}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(record.date)}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{record.complainant || 'Unknown'}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={record.type || 'Unspecified'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{record.assigned_to || 'Unassigned'}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={record.status}
                            color={STATUS_COLOR[record.status] || 'default'}
                          />
                        </TableCell>
                        <TableCell>{ageInDays}d</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(event) => {
                                event.stopPropagation();
                                openEditDialog(record);
                              }}
                            >
                              <Iconify icon="solar:pen-bold" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(event) => {
                                event.stopPropagation();
                                openDeleteDialog(record.id);
                              }}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {!filteredRecords.length && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                          No grievances match the current filters.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Adjust the queue filters or record a new grievance.
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
            {selectedRecord ? (
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" spacing={1.5}>
                  <Box>
                    <Typography variant="h6">{selectedRecord.reference}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Logged on {formatDate(selectedRecord.date)}
                    </Typography>
                  </Box>
                  <Chip
                    label={selectedRecord.status}
                    color={STATUS_COLOR[selectedRecord.status] || 'default'}
                  />
                </Stack>

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Complainant
                    </Typography>
                    <Typography variant="subtitle2">
                      {selectedRecord.complainant || 'Unknown'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Assigned To
                    </Typography>
                    <Typography variant="subtitle2">
                      {selectedRecord.assigned_to || 'Unassigned'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Type
                    </Typography>
                    <Typography variant="subtitle2">
                      {selectedRecord.type || 'Unspecified'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Days Open
                    </Typography>
                    <Typography variant="subtitle2">
                      {selectedRecord.days_to_resolve ?? getAgeInDays(selectedRecord.date)}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider />

                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body2">
                    {selectedRecord.description || 'No description provided.'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Resolution Notes
                  </Typography>
                  <Typography variant="body2">
                    {selectedRecord.resolution || 'No resolution recorded yet.'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Resolution date: {formatDate(selectedRecord.resolution_date)}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Quick Actions
                  </Typography>
                  <List disablePadding>
                    {selectedRecord.status === 'Open' && (
                      <ListItemButton
                        onClick={() =>
                          handleQuickStatusUpdate(selectedRecord, 'Under Investigation')
                        }
                      >
                        <ListItemText
                          primary="Start Investigation"
                          secondary="Move the case into active review."
                        />
                      </ListItemButton>
                    )}
                    {selectedRecord.status === 'Under Investigation' && (
                      <ListItemButton
                        onClick={() => handleQuickStatusUpdate(selectedRecord, 'Resolved')}
                      >
                        <ListItemText
                          primary="Mark Resolved"
                          secondary="Set status to resolved and keep the case ready for closure."
                        />
                      </ListItemButton>
                    )}
                    {selectedRecord.status === 'Resolved' && (
                      <ListItemButton
                        onClick={() => handleQuickStatusUpdate(selectedRecord, 'Closed')}
                      >
                        <ListItemText
                          primary="Close Case"
                          secondary="Finalize the grievance after communicating the resolution."
                        />
                      </ListItemButton>
                    )}
                    {!['Resolved', 'Closed'].includes(selectedRecord.status) && (
                      <ListItemButton onClick={() => openEditDialog(selectedRecord)}>
                        <ListItemText
                          primary="Update Case Details"
                          secondary="Edit assignee, notes, or formal resolution text."
                        />
                      </ListItemButton>
                    )}
                  </List>
                </Box>
              </Stack>
            ) : (
              <Stack
                justifyContent="center"
                alignItems="center"
                spacing={1.5}
                sx={{ minHeight: 320, textAlign: 'center' }}
              >
                <Iconify icon="solar:clipboard-list-bold" width={40} />
                <Typography variant="subtitle1">No grievance selected</Typography>
                <Typography variant="body2" color="text.secondary">
                  Select a grievance from the queue to review details and take action.
                </Typography>
              </Stack>
            )}
          </Card>
        </Grid>
      </Grid>

      <Dialog open={formDialog.value} onClose={formDialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Grievance' : 'Record Grievance'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
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
              label="Complainant"
              name="complainant"
              value={formData.complainant}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Type"
              name="type"
              value={formData.type}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={4}
            />
            <TextField
              label="Assigned To"
              name="assigned_to"
              value={formData.assigned_to}
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
              label="Resolution"
              name="resolution"
              value={formData.resolution}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Resolution Date"
              name="resolution_date"
              type="date"
              value={formData.resolution_date}
              onChange={handleFormChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={formDialog.onFalse}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingItem ? 'Update' : 'Record'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Delete grievance"
        content="This will permanently remove the grievance record."
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
