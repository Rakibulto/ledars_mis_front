'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';

import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Table,
  Button,
  Dialog,
  Switch,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Typography,
  CardContent,
  DialogTitle,
  DialogActions,
  DialogContent,
  TableContainer,
  FormControlLabel,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Date' },
  { value: 'textarea', label: 'Long Text' },
];

function FormDetail({ id }) {
  const router = useRouter();

  const { data: rawForms } = useGetRequest(EP.forms);
  const FORMS = Array.isArray(rawForms) ? rawForms : rawForms?.results || [];
  const { data: rawSpaces } = useGetRequest(EP.spaces);
  const SPACES = Array.isArray(rawSpaces) ? rawSpaces : rawSpaces?.results || [];
  const { data: rawUsers } = useGetRequest('/api/employees/');
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];
  const { data: rawSubmissions } = useGetRequest(id ? `${EP.form_submissions}?form=${id}` : null);
  const submissions = Array.isArray(rawSubmissions)
    ? rawSubmissions
    : rawSubmissions?.results || [];
  const { data: rawFields } = useGetRequest(id ? `${EP.form_fields}?form=${id}` : null);
  const formFields = Array.isArray(rawFields) ? rawFields : rawFields?.results || [];

  const getSpaceById = (sid) => SPACES.find((s) => s.id === sid);
  const getUserById = (uid) => USERS.find((u) => u.id === uid);

  const form = FORMS.find((f) => f.id === Number(id));

  const [saving, setSaving] = useState(false);

  // --- Edit form properties ---
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const openEditForm = () => {
    setEditForm({ name: form?.name || '', description: form?.description || '' });
    setEditOpen(true);
  };
  const handleEditForm = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(EP.form_by_id(id), editForm);
      mutate(EP.forms);
      toast.success('Form updated');
      setEditOpen(false);
    } catch (err) {
      toast.error(err?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  // --- Delete form ---
  const [deleteFormOpen, setDeleteFormOpen] = useState(false);
  const handleDeleteForm = async () => {
    setSaving(true);
    try {
      await axiosInstance.delete(EP.form_by_id(id));
      mutate(EP.forms);
      toast.success('Form deleted');
      router.push(paths.dashboard.projectManagement.forms.root);
    } catch (err) {
      toast.error(err?.message || 'Delete failed');
    } finally {
      setSaving(false);
    }
  };

  // --- Add field ---
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [newField, setNewField] = useState({ label: '', field_type: 'text', required: false });
  const handleAddField = async () => {
    setSaving(true);
    try {
      await axiosInstance.post(EP.form_fields, { ...newField, form: Number(id) });
      mutate(`${EP.form_fields}?form=${id}`);
      toast.success('Field added');
      setAddFieldOpen(false);
      setNewField({ label: '', field_type: 'text', required: false });
    } catch (err) {
      toast.error(err?.message || 'Add field failed');
    } finally {
      setSaving(false);
    }
  };

  // --- Edit field ---
  const [editFieldId, setEditFieldId] = useState(null);
  const [editFieldForm, setEditFieldForm] = useState({});
  const openEditField = (f) => {
    setEditFieldId(f.id);
    setEditFieldForm({ label: f.label, field_type: f.field_type, required: f.required });
  };
  const handleEditField = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(EP.form_field_by_id(editFieldId), editFieldForm);
      mutate(`${EP.form_fields}?form=${id}`);
      toast.success('Field updated');
      setEditFieldId(null);
    } catch (err) {
      toast.error(err?.message || 'Update field failed');
    } finally {
      setSaving(false);
    }
  };

  // --- Delete field ---
  const [deleteFieldId, setDeleteFieldId] = useState(null);
  const handleDeleteField = async () => {
    setSaving(true);
    try {
      await axiosInstance.delete(EP.form_field_by_id(deleteFieldId));
      mutate(`${EP.form_fields}?form=${id}`);
      toast.success('Field deleted');
      setDeleteFieldId(null);
    } catch (err) {
      toast.error(err?.message || 'Delete field failed');
    } finally {
      setSaving(false);
    }
  };

  // --- Delete submission ---
  const [deleteSubId, setDeleteSubId] = useState(null);
  const handleDeleteSub = async () => {
    setSaving(true);
    try {
      await axiosInstance.delete(EP.form_submission_by_id(deleteSubId));
      mutate(`${EP.form_submissions}?form=${id}`);
      toast.success('Submission deleted');
      setDeleteSubId(null);
    } catch (err) {
      toast.error(err?.message || 'Delete submission failed');
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <Alert severity="error">Form not found.</Alert>;

  const space = getSpaceById(form.space_id || form.space);
  const creator = getUserById(form.created_by);

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            {form.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Chip label={space?.name} size="small" variant="outlined" />
            <Chip
              label={form.is_active ? 'Active' : 'Inactive'}
              size="small"
              color={form.is_active ? 'success' : 'default'}
            />
            <Typography variant="body2" color="text.secondary">
              Created by {creator?.name}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Icon icon="solar:share-bold" />}>
            Share
          </Button>
          <Button
            variant="contained"
            startIcon={<Icon icon="solar:pen-bold" />}
            onClick={openEditForm}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Icon icon="solar:trash-bin-trash-bold" />}
            onClick={() => setDeleteFormOpen(true)}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={700} color="primary">
                {form.submissions_count || submissions.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Submissions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={700}>
                {formFields.length || (form.fields_list || form.fields || []).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fields
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography
                variant="h3"
                fontWeight={700}
                color={form.is_active ? 'success.main' : 'text.disabled'}
              >
                {form.is_active ? 'Active' : 'Off'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Form Fields */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              Form Fields
            </Typography>
            <Button
              size="small"
              startIcon={<Icon icon="solar:add-circle-bold" />}
              onClick={() => setAddFieldOpen(true)}
            >
              Add Field
            </Button>
          </Box>
          {formFields.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Label</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Required</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formFields.map((f) => (
                  <TableRow key={f.id} hover>
                    <TableCell>{f.label}</TableCell>
                    <TableCell>
                      <Chip label={f.field_type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{f.required ? 'Yes' : 'No'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEditField(f)}>
                        <Icon icon="solar:pen-bold" width={16} />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteFieldId(f.id)}>
                        <Icon icon="solar:trash-bin-trash-bold" width={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {(form.fields_list || form.fields || []).map((f) => {
                const label = typeof f === 'string' ? f : f.label;
                return (
                  <Chip
                    key={label}
                    label={label}
                    icon={<Icon icon="solar:text-field-bold" width={16} />}
                    variant="outlined"
                  />
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Submissions */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Recent Submissions
          </Typography>
          {submissions.length === 0 ? (
            <Alert severity="info">No submissions yet.</Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Submitted By</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissions.slice(0, 10).map((s, i) => {
                    const submitter = getUserById(s.submitted_by);
                    return (
                      <TableRow key={s.id} hover>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>
                          {submitter?.name || s.submitted_by_name || `User ${s.submitted_by}`}
                        </TableCell>
                        <TableCell>{new Date(s.submitted_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                            {typeof s.data === 'object'
                              ? Object.values(s.data).join(', ')
                              : String(s.data || '')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteSubId(s.id)}
                          >
                            <Icon icon="solar:trash-bin-trash-bold" width={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Edit Form Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Form</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}
        >
          <TextField
            label="Name"
            fullWidth
            value={editForm.name || ''}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={editForm.description || ''}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditForm} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Form Dialog */}
      <Dialog open={deleteFormOpen} onClose={() => setDeleteFormOpen(false)}>
        <DialogTitle>Delete Form</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this form? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteFormOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteForm} disabled={saving}>
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Field Dialog */}
      <Dialog open={addFieldOpen} onClose={() => setAddFieldOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Field</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}
        >
          <TextField
            label="Label"
            fullWidth
            value={newField.label}
            onChange={(e) => setNewField({ ...newField, label: e.target.value })}
          />
          <TextField
            select
            label="Field Type"
            fullWidth
            value={newField.field_type}
            onChange={(e) => setNewField({ ...newField, field_type: e.target.value })}
          >
            {FIELD_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            label="Required"
            control={
              <Switch
                checked={newField.required}
                onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
              />
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddFieldOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddField} disabled={!newField.label || saving}>
            {saving ? 'Adding...' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Field Dialog */}
      <Dialog open={!!editFieldId} onClose={() => setEditFieldId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Field</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}
        >
          <TextField
            label="Label"
            fullWidth
            value={editFieldForm.label || ''}
            onChange={(e) => setEditFieldForm({ ...editFieldForm, label: e.target.value })}
          />
          <TextField
            select
            label="Field Type"
            fullWidth
            value={editFieldForm.field_type || 'text'}
            onChange={(e) => setEditFieldForm({ ...editFieldForm, field_type: e.target.value })}
          >
            {FIELD_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            label="Required"
            control={
              <Switch
                checked={editFieldForm.required || false}
                onChange={(e) => setEditFieldForm({ ...editFieldForm, required: e.target.checked })}
              />
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditFieldId(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditField} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Field Dialog */}
      <Dialog open={!!deleteFieldId} onClose={() => setDeleteFieldId(null)}>
        <DialogTitle>Delete Field</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this field?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteFieldId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteField} disabled={saving}>
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Submission Dialog */}
      <Dialog open={!!deleteSubId} onClose={() => setDeleteSubId(null)}>
        <DialogTitle>Delete Submission</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this submission?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteSubId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteSub} disabled={saving}>
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FormDetail;
