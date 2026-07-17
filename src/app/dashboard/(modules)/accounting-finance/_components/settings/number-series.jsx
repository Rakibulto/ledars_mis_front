'use client';

import { toast } from 'sonner';
import { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import axiosInstance, { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  usePutRequest,
  useCreateRequest,
  extractErrorMessage,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const EP = endpoints.accounting;

const RESET_PERIOD_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const DEFAULT_FORM = {
  id: null,
  name: '',
  document_type: '',
  prefix: '',
  current_number: 1,
  padding: 4,
  reset_period: 'yearly',
  journal_scope: 'General Ledger',
  policy_owner: 'Finance Controller',
  active: true,
};

function normalizeSeries(item, index) {
  const nextNumber = Number(item.next_number || item.nextNumber || 1);
  const resetPeriod = item.reset_period || (item.reset_yearly === false ? 'never' : 'yearly');

  return {
    id: item.id || `series-${index + 1}`,
    name: item.name || item.document_type || `Series ${index + 1}`,
    document_type: item.document_type || item.name || 'Accounting Document',
    prefix: item.prefix || 'DOC-',
    current_number:
      item.current_number !== undefined
        ? Number(item.current_number || 0)
        : Math.max(nextNumber - 1, 0),
    next_number: nextNumber,
    padding: Number(item.padding || 4),
    reset_period: resetPeriod,
    journal_scope: item.journal_scope || item.module || 'General Ledger',
    policy_owner: item.policy_owner || item.owner || 'Finance Controller',
    active: item.active !== false,
    current_year: Number(item.current_year || new Date().getFullYear()),
  };
}

function buildBackendPayload(form) {
  return {
    document_type: form.document_type.trim() || form.name.trim(),
    prefix: form.prefix.trim(),
    padding: Number(form.padding || 4),
    next_number: Number(form.current_number || 0) + 1,
    reset_yearly: form.reset_period !== 'never',
    current_year: new Date().getFullYear(),
  };
}

function buildPreview(prefix, nextNumber, padding) {
  return `${prefix}${String(nextNumber).padStart(padding, '0')}`;
}

function SummaryCard({ label, value, helper, icon, color }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              {helper}
            </Typography>
          </Box>
          <Box sx={{ color }}>
            <Iconify icon={icon} width={28} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function NumberSeries() {
  const { data: rawNumberSeries } = useGetRequest(EP.number_sequences);
  const numberSeries = Array.isArray(rawNumberSeries)
    ? rawNumberSeries
    : rawNumberSeries?.results || [];
  const normalizedNumberSeries = useMemo(() => numberSeries.map(normalizeSeries), [numberSeries]);
  const numberSeriesSignature = useMemo(
    () => JSON.stringify(normalizedNumberSeries),
    [normalizedNumberSeries]
  );

  const [series, setSeries] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const lastNumberSeriesSignatureRef = useRef('');

  useEffect(() => {
    if (!normalizedNumberSeries.length) return;
    if (lastNumberSeriesSignatureRef.current === numberSeriesSignature) return;

    lastNumberSeriesSignatureRef.current = numberSeriesSignature;
    setSeries(normalizedNumberSeries);
    setSelectedId((current) => {
      if (normalizedNumberSeries.some((item) => item.id === current)) {
        return current;
      }

      return normalizedNumberSeries[0]?.id ?? current ?? null;
    });
  }, [normalizedNumberSeries, numberSeriesSignature]);

  const selectedSeries = useMemo(
    () => series.find((item) => item.id === selectedId) || series[0] || null,
    [selectedId, series]
  );

  const activeCount = series.filter((item) => item.active).length;
  const periodicCount = series.filter((item) => item.reset_period !== 'never').length;
  const uniquePrefixes = new Set(series.map((item) => item.prefix)).size;
  const nextReady = series.filter((item) => item.next_number - item.current_number === 1).length;

  const alerts = [];
  if (series.some((item) => item.padding < 4)) {
    alerts.push({
      id: 'short-padding',
      severity: 'warning',
      title: 'Some sequences use short padding',
      description: 'Short numeric width can make year-end volume harder to manage across journals.',
    });
  }
  if (series.some((item) => !item.active)) {
    alerts.push({
      id: 'inactive-series',
      severity: 'info',
      title: 'Inactive sequences are present',
      description:
        'Review whether inactive document sequences should be archived or reassigned to a replacement series.',
    });
  }
  if (!alerts.length) {
    alerts.push({
      id: 'sequence-steady',
      severity: 'success',
      title: 'Numbering policies look stable',
      description:
        'The seeded workspace has active sequence coverage for core accounting documents and journals.',
    });
  }

  const openCreate = () => {
    setForm(DEFAULT_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setForm({
      id: item.id,
      name: item.name,
      document_type: item.document_type,
      prefix: item.prefix,
      current_number: item.current_number,
      padding: item.padding,
      reset_period: item.reset_period,
      journal_scope: item.journal_scope,
      policy_owner: item.policy_owner,
      active: item.active,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (submitting) return;
    setDialogOpen(false);
    setForm(DEFAULT_FORM);
  };

  const handleChange = (field) => (event) => {
    const value =
      field === 'current_number' || field === 'padding'
        ? Number(event.target.value)
        : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      document_type: form.document_type.trim(),
      prefix: form.prefix.trim(),
      current_number: Number(form.current_number || 1),
      padding: Number(form.padding || 4),
      reset_period: form.reset_period,
      journal_scope: form.journal_scope.trim(),
      policy_owner: form.policy_owner.trim(),
      active: form.active,
    };
    const backendPayload = buildBackendPayload(form);

    try {
      if (form.id) {
        let updated;

        try {
          const response = await axiosInstance.put(
            EP.number_sequence_by_id(form.id),
            backendPayload
          );
          updated = response.data;
        } catch (error) {
          updated = await usePutRequest(EP.number_sequence_by_id(form.id), payload);
          toast.info(
            extractErrorMessage(error, 'Saved in mock mode because live update was unavailable')
          );
        }

        const normalized = normalizeSeries(updated, 0);
        setSeries((current) => current.map((item) => (item.id === form.id ? normalized : item)));
        setSelectedId(normalized.id);
        toast.success('Number series updated');
      } else {
        let created;

        try {
          const response = await axiosInstance.post(EP.number_sequences, backendPayload);
          created = response.data;
        } catch (error) {
          created = await useCreateRequest(EP.number_sequences, payload);
          toast.info(
            extractErrorMessage(error, 'Saved in mock mode because live create was unavailable')
          );
        }

        const normalized = normalizeSeries(created, series.length);
        setSeries((current) => [normalized, ...current]);
        setSelectedId(normalized.id);
        toast.success('Number series created');
      }

      closeDialog();
    } catch (error) {
      toast.error(error?.message || 'Failed to save number series');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSeries = async (item) => {
    const nextActive = !item.active;

    try {
      try {
        await axiosInstance.put(EP.number_sequence_by_id(item.id), {
          document_type: item.document_type,
          prefix: item.prefix,
          padding: item.padding,
          next_number: item.next_number,
          reset_yearly: item.reset_period !== 'never',
          current_year: item.current_year || new Date().getFullYear(),
        });
      } catch (error) {
        await usePutRequest(EP.number_sequence_by_id(item.id), {
          ...item,
          active: nextActive,
        });
        toast.info(
          extractErrorMessage(
            error,
            'Status updated in mock mode because live update was unavailable'
          )
        );
      }

      setSeries((current) =>
        current.map((entry) => (entry.id === item.id ? { ...entry, active: nextActive } : entry))
      );
      toast.success(nextActive ? 'Sequence activated' : 'Sequence paused');
    } catch (error) {
      toast.error(error?.message || 'Failed to update sequence status');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Number Series
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Govern document numbering with prefix policies, reset cadence, ownership, and
            next-number preview.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={openCreate}
        >
          Add Series
        </Button>
      </Stack>

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {alerts.map((alert) => (
          <Alert key={alert.id} severity={alert.severity} sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {alert.title}
            </Typography>
            {alert.description}
          </Alert>
        ))}
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Active sequences"
            value={activeCount}
            helper={`${series.length} configured document sequences`}
            icon="solar:sort-by-time-bold-duotone"
            color="#2563eb"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Reset-controlled"
            value={periodicCount}
            helper="Sequences with monthly, quarterly, or yearly restart policies"
            icon="solar:calendar-mark-bold-duotone"
            color="#059669"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Unique prefixes"
            value={uniquePrefixes}
            helper="Prefix collisions should remain near zero across journals"
            icon="solar:tag-bold-duotone"
            color="#d97706"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Next-number ready"
            value={nextReady}
            helper="Sequences with clean next-number continuity"
            icon="solar:check-circle-bold-duotone"
            color="#7c3aed"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Series</TableCell>
                    <TableCell>Scope</TableCell>
                    <TableCell>Current</TableCell>
                    <TableCell>Preview</TableCell>
                    <TableCell>Reset</TableCell>
                    <TableCell align="center">Active</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {series.map((item) => (
                    <TableRow
                      key={item.id}
                      hover
                      selected={selectedSeries?.id === item.id}
                      onClick={() => setSelectedId(item.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.document_type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={item.journal_scope} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{item.current_number}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="primary.main">
                          {buildPreview(item.prefix, item.next_number, item.padding)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>
                        {item.reset_period}
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={item.active}
                          size="small"
                          onClick={(event) => event.stopPropagation()}
                          onChange={() => toggleSeries(item)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          color="inherit"
                          onClick={(event) => {
                            event.stopPropagation();
                            openEdit(item);
                          }}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Sequence Policy Preview
              </Typography>
              {selectedSeries ? (
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      {selectedSeries.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedSeries.document_type}
                    </Typography>
                  </Box>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Next number</Typography>
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      {buildPreview(
                        selectedSeries.prefix,
                        selectedSeries.next_number,
                        selectedSeries.padding
                      )}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Owner</Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {selectedSeries.policy_owner}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Journal scope</Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {selectedSeries.journal_scope}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Reset cadence</Typography>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{ textTransform: 'capitalize' }}
                    >
                      {selectedSeries.reset_period}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip label={`${selectedSeries.padding}-digit padding`} size="small" />
                    <Chip
                      label={selectedSeries.active ? 'Active' : 'Paused'}
                      size="small"
                      color={selectedSeries.active ? 'success' : 'default'}
                    />
                  </Stack>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Select a sequence to inspect policy details and next-number preview.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Reset Simulation
              </Typography>
              {selectedSeries ? (
                <Stack spacing={1.25}>
                  <Typography variant="body2">
                    Current sequence:{' '}
                    <strong>
                      {buildPreview(
                        selectedSeries.prefix,
                        selectedSeries.current_number,
                        selectedSeries.padding
                      )}
                    </strong>
                  </Typography>
                  <Typography variant="body2">
                    Next sequence:{' '}
                    <strong>
                      {buildPreview(
                        selectedSeries.prefix,
                        selectedSeries.next_number,
                        selectedSeries.padding
                      )}
                    </strong>
                  </Typography>
                  <Typography variant="body2">
                    After reset:{' '}
                    <strong>
                      {buildPreview(selectedSeries.prefix, 1, selectedSeries.padding)}
                    </strong>
                  </Typography>
                  <Typography variant="body2">
                    Reset rule:{' '}
                    <strong>
                      {selectedSeries.reset_period === 'never'
                        ? 'Continuous numbering'
                        : `${selectedSeries.reset_period} sequence restart`}
                    </strong>
                  </Typography>
                </Stack>
              ) : null}
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Governance Checks
              </Typography>
              <Stack spacing={1.25}>
                <Typography variant="body2" color="text.secondary">
                  Keep document prefixes unique per operational stream to avoid duplicate-looking
                  journal references.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Reserve shorter reset periods for high-volume receipt or payment sequences where
                  monthly close packs require tighter control.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Assign a named policy owner so sequence breaks can be investigated during audit
                  review.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id ? 'Edit Number Series' : 'Add Number Series'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              label="Series name"
              value={form.name}
              onChange={handleChange('name')}
              fullWidth
            />
            <TextField
              label="Document type"
              value={form.document_type}
              onChange={handleChange('document_type')}
              fullWidth
            />
            <TextField
              label="Prefix"
              value={form.prefix}
              onChange={handleChange('prefix')}
              fullWidth
              placeholder="e.g. JE-2026-"
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Current number"
                  type="number"
                  value={form.current_number}
                  onChange={handleChange('current_number')}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Padding"
                  type="number"
                  value={form.padding}
                  onChange={handleChange('padding')}
                  fullWidth
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Reset period"
                  value={form.reset_period}
                  onChange={handleChange('reset_period')}
                  fullWidth
                >
                  {RESET_PERIOD_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Journal scope"
                  value={form.journal_scope}
                  onChange={handleChange('journal_scope')}
                  fullWidth
                />
              </Grid>
            </Grid>
            <TextField
              label="Policy owner"
              value={form.policy_owner}
              onChange={handleChange('policy_owner')}
              fullWidth
            />
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Next preview:{' '}
              {buildPreview(
                form.prefix || 'DOC-',
                Number(form.current_number || 1) + 1,
                Number(form.padding || 4)
              )}
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={submitting}>
            {form.id ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default NumberSeries;
