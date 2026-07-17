'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState, useCallback } from 'react';

import {
  Box,
  Card,
  Grid,
  Chip,
  Stack,
  Table,
  Alert,
  Button,
  Dialog,
  Select,
  Divider,
  MenuItem,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  IconButton,
  Typography,
  InputLabel,
  FormControl,
  DialogTitle,
  Autocomplete,
  DialogContent,
  DialogActions,
  LinearProgress,
  TableContainer,
  DialogContentText,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import SummaryCard from '../../_components/summary-card';

const SEVERITY_COLOR = { Critical: 'error', High: 'warning', Medium: 'info', Low: 'default' };
const STATUS_COLOR = {
  Reported: 'info',
  'Under Investigation': 'warning',
  'Action Taken': 'primary',
  Resolved: 'success',
  Closed: 'default',
};
const INCIDENT_TYPE_OPTIONS = [
  'Verbal',
  'Physical',
  'Sexual Exploitation',
  'Neglect',
  'Harassment',
  'Child Protection',
];
const PROTECTION_TYPE_OPTIONS = ['GBV', 'Child Protection', 'Trafficking Risk', 'Other'];

const EP = endpoints.beneficiaries;
const INITIAL_FORM = {
  reference: '',
  date: '',
  type: '',
  severity: 'Medium',
  location: '',
  reporter: '',
  action_taken: '',
  investigation_lead: '',
  status: 'Reported',
  resolution_date: '',
};
const INITIAL_LINKED_CASE_FORM = {
  beneficiary: '',
  type: 'Other',
  risk_level: 'High',
  status: 'Open',
  case_worker: '',
  opened_date: '',
  safe_space_referred: false,
  legal_action: '',
  psychosocial_sessions: 0,
};

export default function SafeguardingIncidentsMain() {
  const { data: rawData, loading } = useGetRequest(EP.safeguarding_incidents);
  const { data: rawBeneficiaries, loading: beneficiariesLoading } = useGetRequest(
    EP.beneficiaries_database
  );
  const { data: rawProtectionCases, loading: protectionCasesLoading } = useGetRequest(
    EP.protection_cases
  );
  const SAFEGUARDING_INCIDENTS = Array.isArray(rawData) ? rawData : rawData?.results || [];
  const beneficiaries = Array.isArray(rawBeneficiaries)
    ? rawBeneficiaries
    : rawBeneficiaries?.results || [];
  const protectionCases = Array.isArray(rawProtectionCases)
    ? rawProtectionCases
    : rawProtectionCases?.results || [];

  const formDialog = useBoolean();
  const linkedCaseDialog = useBoolean();
  const confirmDelete = useBoolean();
  const [editingItem, setEditingItem] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [linkedCaseForm, setLinkedCaseForm] = useState(INITIAL_LINKED_CASE_FORM);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredIncidents = useMemo(() => {
    const term = search.trim().toLowerCase();

    return SAFEGUARDING_INCIDENTS.filter((row) => {
      const matchesSearch =
        !term ||
        row.reference?.toLowerCase().includes(term) ||
        row.type?.toLowerCase().includes(term) ||
        row.location?.toLowerCase().includes(term) ||
        row.reporter?.toLowerCase().includes(term) ||
        row.investigation_lead?.toLowerCase().includes(term);

      const matchesSeverity = severityFilter === 'all' || row.severity === severityFilter;
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;

      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [SAFEGUARDING_INCIDENTS, search, severityFilter, statusFilter]);

  const criticalIncidents = SAFEGUARDING_INCIDENTS.filter(
    (item) => item.severity === 'Critical'
  ).length;
  const openInvestigations = SAFEGUARDING_INCIDENTS.filter(
    (item) => item.status === 'Under Investigation'
  ).length;
  const pendingAction = SAFEGUARDING_INCIDENTS.filter(
    (item) =>
      ['Critical', 'High'].includes(item.severity) &&
      ['Reported', 'Under Investigation'].includes(item.status)
  ).length;

  const likelyRelatedProtectionCases = useMemo(() => {
    if (!selectedIncident) {
      return [];
    }

    return protectionCases.filter((item) => {
      const sameType =
        item.type &&
        selectedIncident.type &&
        item.type.toLowerCase().includes(selectedIncident.type.toLowerCase());
      const sameDate =
        item.opened_date && selectedIncident.date && item.opened_date === selectedIncident.date;
      return sameType || sameDate;
    });
  }, [protectionCases, selectedIncident]);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleLinkedCaseChange = useCallback((event) => {
    const { name, value } = event.target;
    setLinkedCaseForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    formDialog.onTrue();
  }, [formDialog]);

  const handleOpenEdit = useCallback(
    (row) => {
      setEditingItem(row);
      setSelectedIncident(row);
      setFormData({
        reference: row.reference || '',
        date: row.date || '',
        type: row.type || '',
        severity: row.severity || 'Medium',
        location: row.location || '',
        reporter: row.reporter || '',
        action_taken: row.action_taken || '',
        investigation_lead: row.investigation_lead || '',
        status: row.status || 'Reported',
        resolution_date: row.resolution_date || '',
      });
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleSelectIncident = useCallback((row) => {
    setSelectedIncident(row);
  }, []);

  const handleOpenLinkedCase = useCallback(
    (row) => {
      setSelectedIncident(row);
      setLinkedCaseForm({
        ...INITIAL_LINKED_CASE_FORM,
        opened_date: row.date || '',
        legal_action: row.action_taken || '',
        type:
          row.type === 'Child Protection'
            ? 'Child Protection'
            : row.type === 'Verbal'
              ? 'Other'
              : 'GBV',
        risk_level:
          row.severity === 'Critical' ? 'Critical' : row.severity === 'High' ? 'High' : 'Medium',
      });
      linkedCaseDialog.onTrue();
    },
    [linkedCaseDialog]
  );

  const handleSubmit = useCallback(async () => {
    if (!formData.type) {
      toast.error('Incident type is required');
      return;
    }
    try {
      if (editingItem) {
        await axiosInstance.patch(`${EP.safeguarding_incidents}${editingItem.id}/`, formData);
        toast.success('Incident updated');
      } else {
        await axiosInstance.post(EP.safeguarding_incidents, formData);
        toast.success('Incident reported');
      }
      mutate(EP.safeguarding_incidents);
      formDialog.onFalse();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  }, [formData, editingItem, formDialog]);

  const handleCreateLinkedCase = useCallback(async () => {
    if (!linkedCaseForm.beneficiary || !linkedCaseForm.type || !linkedCaseForm.opened_date) {
      toast.error('Beneficiary, protection type, and opened date are required');
      return;
    }

    try {
      await axiosInstance.post(EP.protection_cases, linkedCaseForm);
      mutate(EP.protection_cases);
      toast.success('Linked protection case created');
      linkedCaseDialog.onFalse();
    } catch (err) {
      toast.error(err.message || 'Failed to create linked protection case');
    }
  }, [linkedCaseDialog, linkedCaseForm]);

  const handleOpenDelete = useCallback(
    (id) => {
      setDeleteId(id);
      confirmDelete.onTrue();
    },
    [confirmDelete]
  );

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await axiosInstance.delete(`${EP.safeguarding_incidents}${deleteId}/`);
      mutate(EP.safeguarding_incidents);
      toast.success('Incident deleted');
      confirmDelete.onFalse();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  }, [deleteId, confirmDelete]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Safeguarding Incidents
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Report and track safeguarding incidents
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="error"
          onClick={handleOpenCreate}
          startIcon={<Iconify icon="solar:danger-bold" />}
        >
          Report Incident
        </Button>
      </Stack>

      {(loading || beneficiariesLoading || protectionCasesLoading) && (
        <LinearProgress sx={{ mb: 3 }} />
      )}

      <Alert severity="error" sx={{ mb: 3 }}>
        <strong>Safeguarding Policy:</strong> All incidents must be reported within 24 hours.
        Contact the Safeguarding Focal Point immediately for critical cases.
      </Alert>

      {!beneficiaries.length && !beneficiariesLoading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Beneficiary lookup data is unavailable. Incident reporting still works, but creating a
          linked protection case depends on the beneficiary database endpoint.
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Total Incidents"
            value={SAFEGUARDING_INCIDENTS.length}
            icon="solar:danger-bold"
            color="error"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Under Investigation"
            value={openInvestigations}
            icon="solar:magnifer-bold"
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Critical Incidents"
            value={criticalIncidents}
            icon="solar:check-circle-bold"
            color="success"
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
                  label="Search incidents"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Select
                  fullWidth
                  value={severityFilter}
                  onChange={(event) => setSeverityFilter(event.target.value)}
                >
                  <MenuItem value="all">All severities</MenuItem>
                  <MenuItem value="Critical">Critical</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </Select>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Select
                  fullWidth
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <MenuItem value="all">All statuses</MenuItem>
                  <MenuItem value="Reported">Reported</MenuItem>
                  <MenuItem value="Under Investigation">Under Investigation</MenuItem>
                  <MenuItem value="Action Taken">Action Taken</MenuItem>
                  <MenuItem value="Resolved">Resolved</MenuItem>
                  <MenuItem value="Closed">Closed</MenuItem>
                </Select>
              </Grid>
            </Grid>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ p: 2.5, height: '100%' }}>
            <Stack spacing={1.5}>
              <Typography variant="h6">Incident Queue</Typography>
              <Typography variant="body2" color="text.secondary">
                Prioritize severe incidents still awaiting action and escalate them into protection
                cases when a formal beneficiary case response is required.
              </Typography>
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Needs immediate action</Typography>
                <Chip label={pendingAction} size="small" color="error" />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Under investigation</Typography>
                <Chip label={openInvestigations} size="small" color="warning" />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Critical incidents</Typography>
                <Chip label={criticalIncidents} size="small" color="error" />
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
                    <TableCell>Reference</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Investigation Lead</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredIncidents.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      selected={selectedIncident?.id === row.id}
                      onClick={() => handleSelectIncident(row)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>
                        {row.reference}
                      </TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>
                        <Chip label={row.type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.severity}
                          size="small"
                          color={SEVERITY_COLOR[row.severity] || 'default'}
                        />
                      </TableCell>
                      <TableCell>{row.location}</TableCell>
                      <TableCell>{row.investigation_lead}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.status}
                          size="small"
                          color={STATUS_COLOR[row.status] || 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenEdit(row);
                            }}
                          >
                            <Iconify icon="solar:pen-bold" width={18} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenLinkedCase(row);
                            }}
                          >
                            <Iconify icon="solar:shield-bold" width={18} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenDelete(row.id);
                            }}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filteredIncidents.length && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          No safeguarding incidents match the current filters.
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
          <Card sx={{ p: 2.5, minHeight: 480 }}>
            {selectedIncident ? (
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6">Incident Detail</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedIncident.reference || 'No reference'}
                    </Typography>
                  </Box>
                  <Chip
                    label={selectedIncident.severity || 'Unknown'}
                    color={SEVERITY_COLOR[selectedIncident.severity] || 'default'}
                    size="small"
                  />
                </Stack>

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Type
                    </Typography>
                    <Typography variant="body2">{selectedIncident.type || 'Not set'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Typography variant="body2">{selectedIncident.status || 'Not set'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Reported by
                    </Typography>
                    <Typography variant="body2">
                      {selectedIncident.reporter || 'Not captured'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Lead
                    </Typography>
                    <Typography variant="body2">
                      {selectedIncident.investigation_lead || 'Unassigned'}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider />

                <Stack spacing={0.75}>
                  <Typography variant="subtitle2">Action Taken</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedIncident.action_taken || 'No action logged yet.'}
                  </Typography>
                </Stack>

                <Divider />

                <Stack spacing={1.25}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2">Possible Linked Protection Cases</Typography>
                    <Button
                      size="small"
                      onClick={() => handleOpenLinkedCase(selectedIncident)}
                      startIcon={<Iconify icon="solar:shield-bold" />}
                    >
                      Create Case
                    </Button>
                  </Stack>
                  {likelyRelatedProtectionCases.length ? (
                    likelyRelatedProtectionCases.slice(0, 4).map((item) => (
                      <Card key={item.id} variant="outlined" sx={{ p: 1.5 }}>
                        <Stack direction="row" justifyContent="space-between" spacing={1}>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {item.reference || 'Protection case'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.type || 'No type'} · {item.opened_date || 'No date'}
                            </Typography>
                          </Box>
                          <Chip
                            label={item.status || 'Open'}
                            size="small"
                            color={item.status === 'Resolved' ? 'success' : 'warning'}
                          />
                        </Stack>
                      </Card>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No likely related protection cases were found from the current incident data.
                    </Typography>
                  )}
                </Stack>
              </Stack>
            ) : (
              <Stack spacing={1.5} justifyContent="center" sx={{ height: '100%' }}>
                <Typography variant="h6">Select an Incident</Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose an incident to review its investigation state and escalate it into a
                  protection case when beneficiary-level response is needed.
                </Typography>
              </Stack>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={formDialog.value} onClose={formDialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Incident' : 'Report New Incident'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <DialogContentText>
              Record the incident details, severity, and the current investigation status. Escalate
              to a protection case separately if a beneficiary case response is needed.
            </DialogContentText>
            <TextField
              label="Reference"
              name="reference"
              value={formData.reference}
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
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select name="type" value={formData.type} label="Type" onChange={handleFormChange}>
                {INCIDENT_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select
                name="severity"
                value={formData.severity}
                label="Severity"
                onChange={handleFormChange}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Critical">Critical</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Reporter"
              name="reporter"
              value={formData.reporter}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Action Taken"
              name="action_taken"
              value={formData.action_taken}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Investigation Lead"
              name="investigation_lead"
              value={formData.investigation_lead}
              onChange={handleFormChange}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                label="Status"
                onChange={handleFormChange}
              >
                <MenuItem value="Reported">Reported</MenuItem>
                <MenuItem value="Under Investigation">Under Investigation</MenuItem>
                <MenuItem value="Action Taken">Action Taken</MenuItem>
                <MenuItem value="Resolved">Resolved</MenuItem>
                <MenuItem value="Closed">Closed</MenuItem>
              </Select>
            </FormControl>
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
            {editingItem ? 'Update' : 'Report'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={linkedCaseDialog.value}
        onClose={linkedCaseDialog.onFalse}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Linked Protection Case</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <DialogContentText>
              Use this when the incident requires a formal beneficiary protection workflow. This
              creates a protection case; it does not modify the incident record.
            </DialogContentText>
            <Autocomplete
              options={beneficiaries}
              getOptionLabel={(option) =>
                option?.name || option?.full_name || option?.beneficiary_name || ''
              }
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              value={
                beneficiaries.find((option) => option.id === linkedCaseForm.beneficiary) || null
              }
              onChange={(_, value) =>
                setLinkedCaseForm((prev) => ({ ...prev, beneficiary: value?.id || '' }))
              }
              renderInput={(params) => <TextField {...params} label="Beneficiary" required />}
            />
            <FormControl fullWidth>
              <InputLabel>Protection Type</InputLabel>
              <Select
                name="type"
                value={linkedCaseForm.type}
                label="Protection Type"
                onChange={handleLinkedCaseChange}
              >
                {PROTECTION_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Risk Level</InputLabel>
              <Select
                name="risk_level"
                value={linkedCaseForm.risk_level}
                label="Risk Level"
                onChange={handleLinkedCaseChange}
              >
                <MenuItem value="Critical">Critical</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={linkedCaseForm.status}
                label="Status"
                onChange={handleLinkedCaseChange}
              >
                <MenuItem value="Open">Open</MenuItem>
                <MenuItem value="Under Investigation">Under Investigation</MenuItem>
                <MenuItem value="Resolved">Resolved</MenuItem>
                <MenuItem value="Closed">Closed</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Case Worker ID"
              name="case_worker"
              value={linkedCaseForm.case_worker}
              onChange={handleLinkedCaseChange}
              fullWidth
            />
            <TextField
              label="Opened Date"
              name="opened_date"
              type="date"
              value={linkedCaseForm.opened_date}
              onChange={handleLinkedCaseChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Legal Action"
              name="legal_action"
              value={linkedCaseForm.legal_action}
              onChange={handleLinkedCaseChange}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Psychosocial Sessions"
              name="psychosocial_sessions"
              type="number"
              value={linkedCaseForm.psychosocial_sessions}
              onChange={handleLinkedCaseChange}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={linkedCaseDialog.onFalse}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateLinkedCase}>
            Create Case
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Delete Incident"
        content="Are you sure you want to delete this incident record?"
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
