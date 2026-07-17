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
  Checkbox,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  IconButton,
  Typography,
  DialogTitle,
  Autocomplete,
  DialogActions,
  DialogContent,
  LinearProgress,
  TableContainer,
  FormControlLabel,
  DialogContentText,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import SummaryCard from '../../_components/summary-card';

const RISK_COLOR = { Critical: 'error', High: 'warning', Medium: 'info', Low: 'default' };
const STATUS_COLOR = {
  Open: 'warning',
  'Under Investigation': 'info',
  Resolved: 'success',
  Closed: 'default',
};
const TYPE_CHOICES = ['GBV', 'Child Protection', 'Trafficking Risk', 'Other'];
const RISK_LEVEL_CHOICES = ['Critical', 'High', 'Medium', 'Low'];
const STATUS_CHOICES = ['Open', 'Under Investigation', 'Resolved', 'Closed'];
const INITIAL_FORM = {
  beneficiary: null,
  type: null,
  risk_level: null,
  status: null,
  case_worker: null,
  opened_date: null,
  safe_space_referred: false,
  legal_action: '',
  psychosocial_sessions: null,
};
const INITIAL_FOLLOW_UP_FORM = {
  beneficiary: '',
  case_worker: '',
  follow_up_date: '',
  type: 'Protection Follow-up',
  purpose: '',
  status: 'Scheduled',
  priority: 'High',
};

export default function ProtectionCasesMain() {
  const { data: rawData, loading } = useGetRequest(endpoints.beneficiaries.protection_cases);
  const { data: rawBeneficiaries, loading: beneficiariesLoading } = useGetRequest(
    endpoints.beneficiaries.beneficiaries_database
  );
  const { data: rawFollowUps, loading: followUpsLoading } = useGetRequest(
    endpoints.beneficiaries.follow_up_schedules
  );
  const { data: rawSimpleUsers } = useGetRequest(endpoints.auth.simpleUsers);

  const PROTECTION_CASES = useMemo(
    () => (Array.isArray(rawData) ? rawData : rawData?.results || []),
    [rawData]
  );
  const beneficiaries = useMemo(
    () => (Array.isArray(rawBeneficiaries) ? rawBeneficiaries : rawBeneficiaries?.results || []),
    [rawBeneficiaries]
  );
  const followUps = useMemo(
    () => (Array.isArray(rawFollowUps) ? rawFollowUps : rawFollowUps?.results || []),
    [rawFollowUps]
  );
  const simpleUsers = useMemo(
    () => (Array.isArray(rawSimpleUsers) ? rawSimpleUsers : rawSimpleUsers?.results || []),
    [rawSimpleUsers]
  );

  const active = PROTECTION_CASES.filter((p) => p.status === 'Open').length;
  const critical = PROTECTION_CASES.filter((p) => p.risk_level === 'Critical').length;

  const formDialog = useBoolean();
  const followUpDialog = useBoolean();
  const confirmDelete = useBoolean();
  const [editingItem, setEditingItem] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [followUpData, setFollowUpData] = useState(INITIAL_FOLLOW_UP_FORM);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredCases = useMemo(() => {
    const term = search.trim().toLowerCase();

    return PROTECTION_CASES.filter((row) => {
      const matchesSearch =
        !term ||
        row.reference?.toLowerCase().includes(term) ||
        row.beneficiary_name?.toLowerCase().includes(term) ||
        row.case_worker?.toLowerCase().includes(term) ||
        row.type?.toLowerCase().includes(term);

      const matchesRisk = riskFilter === 'all' || row.risk_level === riskFilter;
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;

      return matchesSearch && matchesRisk && matchesStatus;
    });
  }, [PROTECTION_CASES, riskFilter, search, statusFilter]);

  const selectedCaseFollowUps = useMemo(() => {
    if (!selectedCase) {
      return [];
    }

    return followUps.filter(
      (row) =>
        row.beneficiary === selectedCase.beneficiary ||
        row.beneficiary_name === selectedCase.beneficiary_name ||
        row.case_worker === selectedCase.case_worker
    );
  }, [followUps, selectedCase]);

  const overdueLinkedFollowUps = useMemo(
    () => selectedCaseFollowUps.filter((row) => row.status === 'Overdue').length,
    [selectedCaseFollowUps]
  );

  const casesWithSafeSpace = PROTECTION_CASES.filter((p) => p.safe_space_referred).length;
  const highRiskOpen = PROTECTION_CASES.filter(
    (p) => ['Critical', 'High'].includes(p.risk_level) && p.status === 'Active'
  ).length;

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleToggleChange = useCallback((event) => {
    const { name, checked } = event.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  }, []);

  const handleFollowUpChange = useCallback((event) => {
    const { name, value } = event.target;
    setFollowUpData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    formDialog.onTrue();
  }, [formDialog]);

  const handleOpenEdit = useCallback(
    (row) => {
      setEditingItem(row);
      setSelectedCase(row);
      setFormData({
        beneficiary: row.beneficiary ?? null,
        type: row.type ?? null,
        risk_level: row.risk_level ?? null,
        status: row.status ?? null,
        case_worker: row.case_worker ?? null,
        opened_date: row.opened_date ?? null,
        safe_space_referred: row.safe_space_referred ?? false,
        legal_action: row.legal_action ?? '',
        psychosocial_sessions: row.psychosocial_sessions ?? null,
      });
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleSelectCase = useCallback((row) => {
    setSelectedCase(row);
  }, []);

  const handleOpenFollowUp = useCallback(
    (row) => {
      setSelectedCase(row);
      setFollowUpData({
        ...INITIAL_FOLLOW_UP_FORM,
        beneficiary: row.beneficiary || '',
        case_worker: row.case_worker || '',
        priority:
          row.risk_level === 'Critical'
            ? 'Critical'
            : row.risk_level === 'High'
              ? 'High'
              : 'Medium',
        purpose: `${row.type || 'Protection'} case follow-up for ${row.reference || row.beneficiary_name || 'beneficiary'}`,
      });
      followUpDialog.onTrue();
    },
    [followUpDialog]
  );

  const handleSubmit = useCallback(async () => {
    if (!formData.beneficiary || !formData.type || !formData.case_worker || !formData.opened_date) {
      toast.error('Beneficiary, case type, case worker, and opened date are required');
      return;
    }

    try {
      if (editingItem) {
        await axiosInstance.patch(
          `${endpoints.beneficiaries.protection_cases}${editingItem.id}/`,
          formData
        );
        toast.success('Protection case updated');
      } else {
        await axiosInstance.post(endpoints.beneficiaries.protection_cases, formData);
        toast.success('Protection case created');
      }
      mutate(endpoints.beneficiaries.protection_cases);
      formDialog.onFalse();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  }, [editingItem, formData, formDialog]);

  const handleCreateFollowUp = useCallback(async () => {
    if (!followUpData.beneficiary || !followUpData.case_worker || !followUpData.follow_up_date) {
      toast.error('Beneficiary, case worker, and follow-up date are required');
      return;
    }

    try {
      await axiosInstance.post(endpoints.beneficiaries.follow_up_schedules, followUpData);
      mutate(endpoints.beneficiaries.follow_up_schedules);
      toast.success('Protection follow-up scheduled');
      followUpDialog.onFalse();
    } catch (err) {
      toast.error(err.message || 'Failed to schedule follow-up');
    }
  }, [followUpData, followUpDialog]);

  const handleOpenDelete = useCallback(
    (id) => {
      setDeleteId(id);
      confirmDelete.onTrue();
    },
    [confirmDelete]
  );

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await axiosInstance.delete(`${endpoints.beneficiaries.protection_cases}${deleteId}/`);
      toast.success('Protection case deleted');
      mutate(endpoints.beneficiaries.protection_cases);
      confirmDelete.onFalse();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
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
            Protection Cases
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage sensitive protection and safeguarding cases
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="error"
          onClick={handleOpenCreate}
          startIcon={<Iconify icon="solar:shield-bold" />}
        >
          New Case
        </Button>
      </Stack>

      {(loading || beneficiariesLoading || followUpsLoading) && <LinearProgress sx={{ mb: 3 }} />}

      <Alert severity="warning" sx={{ mb: 3 }}>
        <strong>Confidentiality Notice:</strong> All protection cases are strictly confidential.
        Access is restricted to authorized personnel only.
      </Alert>

      {!beneficiaries.length && !beneficiariesLoading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Beneficiary lookup data is unavailable. Existing cases can still be reviewed, but creating
          accurate new protection cases depends on the beneficiary database endpoint.
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 3 }}>
          <SummaryCard
            title="Total Cases"
            value={PROTECTION_CASES.length}
            icon="solar:shield-bold"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <SummaryCard
            title="Active"
            value={active}
            icon="solar:folder-open-bold"
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <SummaryCard
            title="Critical Risk"
            value={critical}
            icon="solar:danger-bold"
            color="error"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <SummaryCard
            title="Safe Space Referrals"
            value={PROTECTION_CASES.filter((p) => p.safe_space_referred).length}
            icon="solar:home-bold"
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
                  label="Search cases"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Select
                  fullWidth
                  value={riskFilter}
                  onChange={(event) => setRiskFilter(event.target.value)}
                >
                  <MenuItem value="all">All risk levels</MenuItem>
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
                  <MenuItem value="Open">Open</MenuItem>
                  <MenuItem value="Under Investigation">Under Investigation</MenuItem>
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
              <Typography variant="h6">Response Queue</Typography>
              <Typography variant="body2" color="text.secondary">
                Focus on high-risk open cases and beneficiaries whose protection follow-up is
                overdue.
              </Typography>
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">High-risk open cases</Typography>
                <Chip label={highRiskOpen} size="small" color="error" />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Safe-space referrals</Typography>
                <Chip label={casesWithSafeSpace} size="small" color="success" />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Linked overdue follow-ups</Typography>
                <Chip label={overdueLinkedFollowUps} size="small" color="warning" />
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
                    <TableCell>Beneficiary</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Risk Level</TableCell>
                    <TableCell>Case Worker</TableCell>
                    <TableCell>Opened</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCases.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      selected={selectedCase?.id === row.id}
                      onClick={() => handleSelectCase(row)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>
                        {row.reference}
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Typography variant="subtitle2">
                            {row.beneficiary_name || 'Unassigned beneficiary'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.ben_code || row.beneficiary || 'No code'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip label={row.type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.risk_level}
                          size="small"
                          color={RISK_COLOR[row.risk_level] || 'default'}
                        />
                      </TableCell>
                      <TableCell>{row.case_worker}</TableCell>
                      <TableCell>{row.opened_date}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.status}
                          size="small"
                          color={STATUS_COLOR[row.status] || 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton
                            size="small"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenEdit(row);
                            }}
                          >
                            <Iconify icon="solar:pen-bold" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenFollowUp(row);
                            }}
                          >
                            <Iconify icon="solar:calendar-add-bold" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenDelete(row.id);
                            }}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filteredCases.length && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          No protection cases match the current filters.
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
            {selectedCase ? (
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6">Case Details</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedCase.reference || 'No reference'}
                    </Typography>
                  </Box>
                  <Chip
                    label={selectedCase.risk_level}
                    color={RISK_COLOR[selectedCase.risk_level] || 'default'}
                    size="small"
                  />
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="subtitle2">Beneficiary</Typography>
                  <Typography variant="body2">
                    {selectedCase.beneficiary_name || 'Unknown beneficiary'}
                  </Typography>
                </Stack>

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Typography variant="body2">{selectedCase.status || 'Unknown'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Case Worker
                    </Typography>
                    <Typography variant="body2">
                      {selectedCase.case_worker || 'Unassigned'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Opened Date
                    </Typography>
                    <Typography variant="body2">{selectedCase.opened_date || 'Not set'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      PSS Sessions
                    </Typography>
                    <Typography variant="body2">
                      {selectedCase.psychosocial_sessions || 0}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider />

                <Stack spacing={1}>
                  <Typography variant="subtitle2">Response Actions</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      label={
                        selectedCase.safe_space_referred
                          ? 'Safe space referred'
                          : 'Needs safe-space decision'
                      }
                      color={selectedCase.safe_space_referred ? 'success' : 'warning'}
                    />
                    <Chip
                      label={selectedCase.legal_action || 'No legal action logged'}
                      variant="outlined"
                    />
                  </Stack>
                </Stack>

                <Divider />

                <Stack spacing={1.25}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2">Linked Follow-ups</Typography>
                    <Button
                      size="small"
                      onClick={() => handleOpenFollowUp(selectedCase)}
                      startIcon={<Iconify icon="solar:calendar-add-bold" />}
                    >
                      Schedule
                    </Button>
                  </Stack>
                  {selectedCaseFollowUps.length ? (
                    selectedCaseFollowUps.slice(0, 4).map((item) => (
                      <Card key={item.id} variant="outlined" sx={{ p: 1.5 }}>
                        <Stack direction="row" justifyContent="space-between" spacing={1}>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {item.type || 'Follow-up'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.follow_up_date || 'No date'} · {item.case_worker || 'No worker'}
                            </Typography>
                          </Box>
                          <Chip
                            label={item.status || 'Scheduled'}
                            size="small"
                            color={
                              item.status === 'Overdue'
                                ? 'error'
                                : item.status === 'Completed'
                                  ? 'success'
                                  : 'info'
                            }
                          />
                        </Stack>
                      </Card>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No follow-up entries found for this case yet.
                    </Typography>
                  )}
                </Stack>
              </Stack>
            ) : (
              <Stack spacing={1.5} justifyContent="center" sx={{ height: '100%' }}>
                <Typography variant="h6">Select a Case</Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a protection case from the table to review beneficiary details, response
                  actions, and linked follow-up activity.
                </Typography>
              </Stack>
            )}
          </Card>
        </Grid>
      </Grid>

      <Dialog open={formDialog.value} onClose={formDialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Protection Case' : 'New Protection Case'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <DialogContentText>
            Record core protection details, current risk level, and the immediate support pathway
            for the beneficiary.
          </DialogContentText>
          <Autocomplete
            options={beneficiaries}
            getOptionLabel={(option) =>
              option?.full_name || option?.name || option?.beneficiary_name || ''
            }
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            value={beneficiaries.find((option) => option.id === formData.beneficiary) || null}
            onChange={(_, value) =>
              setFormData((prev) => ({ ...prev, beneficiary: value?.id || '' }))
            }
            renderInput={(params) => <TextField {...params} label="Beneficiary" required />}
          />
          <Select name="type" value={formData.type ?? ''} onChange={handleFormChange} displayEmpty>
            <MenuItem value="">Select case type</MenuItem>
            {TYPE_CHOICES.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
          <Select
            name="risk_level"
            value={formData.risk_level ?? ''}
            onChange={handleFormChange}
            displayEmpty
          >
            <MenuItem value="">Select risk level</MenuItem>
            {RISK_LEVEL_CHOICES.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
          <Select
            name="status"
            value={formData.status ?? ''}
            onChange={handleFormChange}
            displayEmpty
          >
            <MenuItem value="">Select status</MenuItem>
            {STATUS_CHOICES.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
          <Select
            name="case_worker"
            value={formData.case_worker ?? ''}
            onChange={handleFormChange}
            displayEmpty
          >
            <MenuItem value="">Select case worker</MenuItem>
            {simpleUsers.map((user) => (
              <MenuItem
                key={user.id ?? user.username ?? user.email}
                value={user.id ?? user.username ?? user.case_worker_name ?? user.full_name}
              >
                {user.username ??
                  user.case_worker_name ??
                  user.full_name ??
                  user.email ??
                  'Unknown user'}
              </MenuItem>
            ))}
          </Select>
          <TextField
            label="Opened Date"
            name="opened_date"
            type="date"
            value={formData.opened_date ?? ''}
            onChange={handleFormChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Legal Action"
            name="legal_action"
            value={formData.legal_action}
            onChange={handleFormChange}
            fullWidth
          />
          <TextField
            label="Psychosocial Sessions"
            name="psychosocial_sessions"
            type="number"
            value={formData.psychosocial_sessions ?? ''}
            onChange={handleFormChange}
            fullWidth
          />
          <FormControlLabel
            control={
              <Checkbox
                name="safe_space_referred"
                checked={Boolean(formData.safe_space_referred)}
                onChange={handleToggleChange}
              />
            }
            label="Safe-space referral completed"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={formDialog.onFalse}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={followUpDialog.value} onClose={followUpDialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Protection Follow-up</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <DialogContentText>
            Use follow-up scheduling to track the next protection response step, home visit, or case
            worker review.
          </DialogContentText>
          <Autocomplete
            options={beneficiaries}
            getOptionLabel={(option) =>
              option?.full_name || option?.name || option?.beneficiary_name || ''
            }
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            value={beneficiaries.find((option) => option.id === followUpData.beneficiary) || null}
            onChange={(_, value) =>
              setFollowUpData((prev) => ({ ...prev, beneficiary: value?.id || '' }))
            }
            renderInput={(params) => <TextField {...params} label="Beneficiary" required />}
          />
          <TextField
            label="Case Worker"
            name="case_worker"
            value={followUpData.case_worker}
            onChange={handleFollowUpChange}
            fullWidth
          />
          <TextField
            label="Follow-up Date"
            name="follow_up_date"
            type="date"
            value={followUpData.follow_up_date}
            onChange={handleFollowUpChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Type"
            name="type"
            value={followUpData.type}
            onChange={handleFollowUpChange}
            fullWidth
          />
          <TextField
            label="Purpose"
            name="purpose"
            value={followUpData.purpose}
            onChange={handleFollowUpChange}
            fullWidth
            multiline
            rows={3}
          />
          <Select
            name="priority"
            value={followUpData.priority}
            onChange={handleFollowUpChange}
            fullWidth
          >
            <MenuItem value="Critical">Critical</MenuItem>
            <MenuItem value="High">High</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="Low">Low</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={followUpDialog.onFalse}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateFollowUp}>
            Schedule
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Delete Protection Case"
        content="Are you sure you want to delete this protection case? This action cannot be undone."
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
