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
  Checkbox,
  MenuItem,
  TableRow,
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
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import SummaryCard from '../../_components/summary-card';

const INITIAL_FORM = {
  beneficiary: null,
  consent_type: null,
  granted: false,
  date: null,
  expiry: null,
  collected_by: '',
  photo_consent: false,
  data_sharing: null,
};
const CONSENT_TYPE_OPTIONS = [
  'Data Collection',
  'Photo/Video',
  'Data Sharing',
  'Program Participation',
];
const DATA_SHARING_OPTIONS = ['Full', 'Partial', 'Anonymized Only', 'None'];

export default function ConsentManagementMain() {
  const { data: rawData, loading } = useGetRequest(endpoints.beneficiaries.consent_records);
  const { data: rawBeneficiaries, loading: beneficiariesLoading } = useGetRequest(
    endpoints.beneficiaries.beneficiaries_database
  );

  const CONSENT_RECORDS = useMemo(
    () => (Array.isArray(rawData) ? rawData : rawData?.results || []),
    [rawData]
  );
  const beneficiaries = useMemo(
    () => (Array.isArray(rawBeneficiaries) ? rawBeneficiaries : rawBeneficiaries?.results || []),
    [rawBeneficiaries]
  );

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const formDialog = useBoolean();
  const confirmDelete = useBoolean();
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [deleteId, setDeleteId] = useState(null);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    return CONSENT_RECORDS.filter((record) => {
      const matchesSearch =
        !term ||
        record.beneficiary_name?.toLowerCase().includes(term) ||
        record.ben_code?.toLowerCase().includes(term) ||
        record.collected_by?.toLowerCase().includes(term);

      const matchesType = typeFilter === 'all' || record.consent_type === typeFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'granted' && record.granted) ||
        (statusFilter === 'revoked' && !record.granted) ||
        (statusFilter === 'expiring' &&
          record.expiry &&
          new Date(record.expiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [CONSENT_RECORDS, search, statusFilter, typeFilter]);

  const active = CONSENT_RECORDS.filter((c) => c.granted).length;
  const revoked = CONSENT_RECORDS.filter((c) => !c.granted).length;
  const photoConsent = CONSENT_RECORDS.filter((c) => c.photo_consent).length;
  const expiringSoon = CONSENT_RECORDS.filter(
    (c) => c.expiry && new Date(c.expiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  ).length;
  const consentTypeOptions = useMemo(() => {
    const types = CONSENT_RECORDS.map((record) => record.consent_type).filter(Boolean);
    return Array.from(new Set([...CONSENT_TYPE_OPTIONS, ...types]));
  }, [CONSENT_RECORDS]);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleToggleChange = useCallback((event) => {
    const { name, checked } = event.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    formDialog.onTrue();
  }, [formDialog]);

  const handleOpenEdit = useCallback(
    (row) => {
      setEditingItem(row);
      setFormData({
        beneficiary: row.beneficiary ?? null,
        consent_type: row.consent_type ?? null,
        granted: row.granted ?? false,
        date: row.date ?? null,
        expiry: row.expiry ?? null,
        collected_by: row.collected_by || '',
        photo_consent: row.photo_consent ?? false,
        data_sharing: row.data_sharing ?? null,
      });
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleSubmit = useCallback(async () => {
    if (!formData.beneficiary || !formData.consent_type || !formData.date) {
      toast.error('Beneficiary, consent type, and consent date are required');
      return;
    }

    const payload = {
      beneficiary: formData.beneficiary ?? null,
      consent_type: formData.consent_type ?? null,
      granted: Boolean(formData.granted),
      date: formData.date ?? null,
      expiry: formData.expiry ?? null,
      collected_by: formData.collected_by || '',
      photo_consent: Boolean(formData.photo_consent),
      data_sharing: formData.data_sharing ?? null,
    };

    try {
      if (editingItem) {
        await axiosInstance.patch(
          `${endpoints.beneficiaries.consent_records}${editingItem.id}/`,
          payload
        );
        toast.success('Consent record updated');
      } else {
        await axiosInstance.post(endpoints.beneficiaries.consent_records, payload);
        toast.success('Consent record created');
      }
      mutate(endpoints.beneficiaries.consent_records);
      formDialog.onFalse();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  }, [editingItem, formData, formDialog]);

  const handleOpenDelete = useCallback(
    (id) => {
      setDeleteId(id);
      confirmDelete.onTrue();
    },
    [confirmDelete]
  );

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await axiosInstance.delete(`${endpoints.beneficiaries.consent_records}${deleteId}/`);
      toast.success('Consent record deleted');
      mutate(endpoints.beneficiaries.consent_records);
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
            Consent Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track beneficiary consent for data collection, photos, and sharing
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleOpenCreate}
          startIcon={<Iconify icon="solar:document-add-bold" />}
        >
          Record Consent
        </Button>
      </Stack>

      {(loading || beneficiariesLoading) && <LinearProgress sx={{ mb: 3 }} />}

      {!beneficiaries.length && !beneficiariesLoading && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Beneficiary master data is unavailable. You can still review consent records, but creating
          accurate new consent records depends on the beneficiary database endpoint.
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 3 }}>
          <SummaryCard
            title="Total Records"
            value={CONSENT_RECORDS.length}
            icon="solar:document-bold"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <SummaryCard
            title="Consent Granted"
            value={active}
            icon="solar:check-circle-bold"
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <SummaryCard
            title="Photo Consent"
            value={photoConsent}
            icon="solar:camera-bold"
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <SummaryCard
            title="Expiring Soon"
            value={expiringSoon}
            icon="solar:alarm-bold"
            color="warning"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 2.5 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Search consent records"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Select
                  fullWidth
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                >
                  <MenuItem value="all">All consent types</MenuItem>
                  {consentTypeOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Select
                  fullWidth
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <MenuItem value="all">All statuses</MenuItem>
                  <MenuItem value="granted">Granted</MenuItem>
                  <MenuItem value="revoked">Revoked</MenuItem>
                  <MenuItem value="expiring">Expiring in 30 days</MenuItem>
                </Select>
              </Grid>
            </Grid>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2.5, height: '100%' }}>
            <Stack spacing={1.5}>
              <Typography variant="h6">Compliance Snapshot</Typography>
              <Typography variant="body2" color="text.secondary">
                Track consent validity, revocations, and sharing scope before using beneficiary data
                in reports, media, or referrals.
              </Typography>
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Revoked records</Typography>
                <Chip label={revoked} color="error" size="small" />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Expiring soon</Typography>
                <Chip label={expiringSoon} color="warning" size="small" />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Records with media consent</Typography>
                <Chip label={photoConsent} color="info" size="small" />
              </Stack>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Beneficiary</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Consent Type</TableCell>
                <TableCell>Granted</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Expiry</TableCell>
                <TableCell>Photo</TableCell>
                <TableCell>Data Sharing</TableCell>
                <TableCell>Collected By</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRecords.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{row.beneficiary_name}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>
                    {row.ben_code}
                  </TableCell>
                  <TableCell>
                    <Chip label={row.consent_type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Iconify
                      icon={row.granted ? 'solar:check-circle-bold' : 'solar:close-circle-bold'}
                      color={row.granted ? 'success.main' : 'error.main'}
                    />
                  </TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.expiry}</TableCell>
                  <TableCell>
                    <Iconify
                      icon={
                        row.photo_consent ? 'solar:check-circle-bold' : 'solar:close-circle-bold'
                      }
                      color={row.photo_consent ? 'success.main' : 'error.main'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={row.data_sharing} size="small" />
                  </TableCell>
                  <TableCell>{row.collected_by}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenEdit(row)}>
                      <Iconify icon="solar:pen-bold" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleOpenDelete(row.id)}>
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!filteredRecords.length && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      No consent records match the current filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={formDialog.value} onClose={formDialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Consent Record' : 'Record New Consent'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Autocomplete
            options={beneficiaries}
            getOptionLabel={(option) =>
              option?.full_name || option?.name || option?.beneficiary_name || ''
            }
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            value={beneficiaries.find((option) => option.id === formData.beneficiary) || null}
            onChange={(_, value) =>
              setFormData((prev) => ({ ...prev, beneficiary: value?.id ?? null }))
            }
            renderInput={(params) => <TextField {...params} label="Beneficiary" required />}
          />
          <Select
            name="consent_type"
            value={formData.consent_type ?? ''}
            onChange={handleFormChange}
            displayEmpty
          >
            <MenuItem value="">Select consent type</MenuItem>
            {CONSENT_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
          <TextField
            label="Date"
            name="date"
            type="date"
            value={formData.date ?? ''}
            onChange={handleFormChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Expiry"
            name="expiry"
            type="date"
            value={formData.expiry ?? ''}
            onChange={handleFormChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Collected By"
            name="collected_by"
            value={formData.collected_by}
            onChange={handleFormChange}
            fullWidth
          />
          <Select
            name="data_sharing"
            value={formData.data_sharing ?? ''}
            onChange={handleFormChange}
            displayEmpty
          >
            <MenuItem value="">Select data sharing scope</MenuItem>
            {DATA_SHARING_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
          <FormControlLabel
            control={
              <Checkbox
                name="granted"
                checked={Boolean(formData.granted)}
                onChange={handleToggleChange}
              />
            }
            label="Consent is currently granted"
          />
          <FormControlLabel
            control={
              <Checkbox
                name="photo_consent"
                checked={Boolean(formData.photo_consent)}
                onChange={handleToggleChange}
              />
            }
            label="Photo and media consent granted"
          />
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
        title="Delete Consent Record"
        content="Are you sure you want to delete this consent record?"
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
