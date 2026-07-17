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
  Autocomplete,
  ListItemText,
  DialogActions,
  DialogContent,
  InputAdornment,
  ListItemButton,
  TableContainer,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import SummaryCard from '../../_components/summary-card';

const EP = endpoints.beneficiaries;
const STATUS_OPTIONS = ['All', 'Open', 'Under Review', 'Closed'];
const TYPE_OPTIONS = ['All', 'Complaint', 'Feedback', 'Suggestion'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
const INITIAL_FORM = {
  beneficiary: null,
  type: 'Complaint',
  category: '',
  subject: '',
  message: '',
  priority: 'Medium',
  status: 'Open',
  satisfaction: '',
};

function normalizeText(value) {
  return (value || '').toString().trim().toLowerCase();
}

function createCsvValue(value) {
  const safeValue = value ?? '';
  return `"${String(safeValue).replace(/"/g, '""')}"`;
}

function getTypeColor(type) {
  if (type === 'Complaint') return 'error';
  if (type === 'Feedback') return 'success';
  if (type === 'Suggestion') return 'info';
  return 'default';
}

function getPriorityColor(priority) {
  if (priority === 'Critical') return 'error';
  if (priority === 'High') return 'warning';
  if (priority === 'Medium') return 'info';
  return 'default';
}

function getStatusColor(status) {
  if (status === 'Open') return 'warning';
  if (status === 'Under Review') return 'info';
  if (status === 'Closed') return 'success';
  return 'default';
}

function getBeneficiaryLabel(option) {
  if (!option) return '';
  const code = option.ben_code || option.beneficiary_info?.ben_code || option.id;
  const name = option.name || option.beneficiary_info?.name || 'Unnamed beneficiary';
  return `${code} - ${name}`;
}

export default function ComplaintsFeedbackMain() {
  const formDialog = useBoolean();
  const confirmDelete = useBoolean();

  const { data: listData } = useGetRequest(EP.complaints_feedback);
  const { data: summaryData } = useGetRequest(EP.complaints_feedback_summary);
  const { data: beneficiariesData } = useGetRequest(EP.beneficiaries_database);

  const submissions = Array.isArray(listData)
    ? listData
    : listData?.results || listData?.data || [];
  const beneficiaries = Array.isArray(beneficiariesData)
    ? beneficiariesData
    : beneficiariesData?.results || beneficiariesData?.data || [];

  const [editingItem, setEditingItem] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [formData, setFormData] = useState(INITIAL_FORM);

  const summary = useMemo(() => {
    const fallback = {
      total_cases: submissions.length,
      open_cases: submissions.filter((row) => row.status === 'Open').length,
      under_review: submissions.filter((row) => row.status === 'Under Review').length,
      closed_cases: submissions.filter((row) => row.status === 'Closed').length,
      critical: submissions.filter((row) => row.priority === 'Critical').length,
      high: submissions.filter((row) => row.priority === 'High').length,
    };

    return summaryData && typeof summaryData === 'object'
      ? { ...fallback, ...summaryData }
      : fallback;
  }, [submissions, summaryData]);

  const filteredSubmissions = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery);

    return submissions.filter((submission) => {
      const matchesStatus = statusFilter === 'All' || submission.status === statusFilter;
      const matchesType = typeFilter === 'All' || submission.type === typeFilter;
      const matchesSearch =
        !normalizedQuery ||
        [
          submission.subject,
          submission.message,
          submission.category,
          submission.beneficiary_info?.name,
          submission.beneficiary_info?.ben_code,
        ]
          .filter(Boolean)
          .some((value) => normalizeText(value).includes(normalizedQuery));

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [searchQuery, statusFilter, submissions, typeFilter]);

  const selectedSubmission = useMemo(
    () =>
      filteredSubmissions.find((submission) => submission.id === selectedId) ||
      filteredSubmissions[0] ||
      null,
    [filteredSubmissions, selectedId]
  );

  const handleTextChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const openCreateDialog = useCallback(() => {
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    formDialog.onTrue();
  }, [formDialog]);

  const openEditDialog = useCallback(
    (submission) => {
      const beneficiaryOption =
        beneficiaries.find((item) => item.id === submission.beneficiary) || null;

      setEditingItem(submission);
      setFormData({
        beneficiary: beneficiaryOption,
        type: submission.type || 'Complaint',
        category: submission.category || '',
        subject: submission.subject || '',
        message: submission.message || '',
        priority: submission.priority || 'Medium',
        status: submission.status || 'Open',
        satisfaction: submission.satisfaction ?? '',
      });
      formDialog.onTrue();
    },
    [beneficiaries, formDialog]
  );

  const handleSubmit = useCallback(async () => {
    if (!formData.subject.trim()) {
      toast.error('Subject is required.');
      return;
    }

    if (!formData.message.trim()) {
      toast.error('Message is required.');
      return;
    }

    const payload = {
      beneficiary: formData.beneficiary?.id || null,
      type: formData.type,
      category: formData.category,
      subject: formData.subject,
      message: formData.message,
      priority: formData.priority,
      status: formData.status,
      satisfaction: formData.satisfaction === '' ? null : Number(formData.satisfaction),
    };

    try {
      if (editingItem) {
        await axiosInstance.patch(`${EP.complaints_feedback}${editingItem.id}/`, payload);
        toast.success('Submission updated.');
      } else {
        const response = await axiosInstance.post(EP.complaints_feedback, payload);
        setSelectedId(response?.data?.id || null);
        toast.success('Submission created.');
      }

      mutate(EP.complaints_feedback);
      mutate(EP.complaints_feedback_summary);
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
      await axiosInstance.delete(`${EP.complaints_feedback}${deleteId}/`);
      mutate(EP.complaints_feedback);
      mutate(EP.complaints_feedback_summary);
      if (selectedId === deleteId) {
        setSelectedId(null);
      }
      toast.success('Submission deleted.');
      confirmDelete.onFalse();
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || 'Failed to delete submission.');
    }
  }, [confirmDelete, deleteId, selectedId]);

  const handleQuickStatusUpdate = useCallback(async (submission, nextStatus) => {
    try {
      await axiosInstance.patch(`${EP.complaints_feedback}${submission.id}/`, {
        status: nextStatus,
      });
      mutate(EP.complaints_feedback);
      mutate(EP.complaints_feedback_summary);
      toast.success(`Submission moved to ${nextStatus}.`);
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || 'Status update failed.');
    }
  }, []);

  const handleExport = useCallback(() => {
    const lines = [
      [
        'ID',
        'Beneficiary',
        'Type',
        'Category',
        'Subject',
        'Date',
        'Priority',
        'Status',
        'Satisfaction',
      ].join(','),
      ...filteredSubmissions.map((submission) =>
        [
          createCsvValue(submission.id),
          createCsvValue(getBeneficiaryLabel(submission.beneficiary_info)),
          createCsvValue(submission.type),
          createCsvValue(submission.category),
          createCsvValue(submission.subject),
          createCsvValue(submission.date),
          createCsvValue(submission.priority),
          createCsvValue(submission.status),
          createCsvValue(submission.satisfaction),
        ].join(',')
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'complaints-feedback.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [filteredSubmissions]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{
          mb: 3,
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Complaints & Feedback
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track beneficiary submissions, triage urgent issues, and close the loop with documented
            follow-up.
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
            New Submission
          </Button>
        </Stack>
      </Stack>

      {summary.critical > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {summary.critical} critical submission{summary.critical > 1 ? 's are' : ' is'} waiting in
          the queue and should be reviewed immediately.
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="Total Submissions"
            value={summary.total_cases}
            icon="solar:clipboard-text-bold"
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="Open Cases"
            value={summary.open_cases + summary.under_review}
            icon="solar:clipboard-list-bold"
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="Closed Cases"
            value={summary.closed_cases}
            icon="solar:check-circle-bold"
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            title="Critical / High"
            value={summary.critical + summary.high}
            icon="solar:danger-triangle-bold"
            color="error"
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
                placeholder="Search by subject, beneficiary, category, or message"
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
                select
                label="Type"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                sx={{ minWidth: 180 }}
              >
                {TYPE_OPTIONS.map((option) => (
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
                    <TableCell>Submission</TableCell>
                    <TableCell>Beneficiary</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow
                      key={submission.id}
                      hover
                      selected={selectedSubmission?.id === submission.id}
                      onClick={() => setSelectedId(submission.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Typography variant="subtitle2">
                            {submission.subject || `Submission #${submission.id}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {submission.category || 'Uncategorized'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Typography variant="body2">
                            {submission.beneficiary_info?.name || 'Anonymous / not linked'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {submission.beneficiary_info?.ben_code || 'No beneficiary code'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={submission.type || 'Unknown'}
                          color={getTypeColor(submission.type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={submission.priority || 'Low'}
                          color={getPriorityColor(submission.priority)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={submission.status || 'Open'}
                          color={getStatusColor(submission.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{submission.date || 'Not set'}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditDialog(submission);
                            }}
                          >
                            <Iconify icon="solar:pen-bold" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(event) => {
                              event.stopPropagation();
                              openDeleteDialog(submission.id);
                            }}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}

                  {!filteredSubmissions.length && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                          No submissions match the current filters.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Adjust the queue filters or add a new submission.
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
            {selectedSubmission ? (
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" spacing={1.5}>
                  <Box>
                    <Typography variant="h6">
                      {selectedSubmission.subject || `Submission #${selectedSubmission.id}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Received on {selectedSubmission.date || 'Not set'}
                    </Typography>
                  </Box>
                  <Chip
                    label={selectedSubmission.status || 'Open'}
                    color={getStatusColor(selectedSubmission.status)}
                  />
                </Stack>

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Beneficiary
                    </Typography>
                    <Typography variant="subtitle2">
                      {selectedSubmission.beneficiary_info?.name || 'Not linked'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Code
                    </Typography>
                    <Typography variant="subtitle2">
                      {selectedSubmission.beneficiary_info?.ben_code || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Type
                    </Typography>
                    <Typography variant="subtitle2">
                      {selectedSubmission.type || 'Unknown'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Priority
                    </Typography>
                    <Typography variant="subtitle2">
                      {selectedSubmission.priority || 'Low'}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider />

                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Message
                  </Typography>
                  <Typography variant="body2">
                    {selectedSubmission.message || 'No details provided.'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Category / Satisfaction
                  </Typography>
                  <Typography variant="body2">
                    {selectedSubmission.category || 'No category'}
                    {selectedSubmission.satisfaction
                      ? ` • Satisfaction ${selectedSubmission.satisfaction}/5`
                      : ''}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Quick Actions
                  </Typography>
                  <List disablePadding>
                    {selectedSubmission.status === 'Open' && (
                      <ListItemButton
                        onClick={() => handleQuickStatusUpdate(selectedSubmission, 'Under Review')}
                      >
                        <ListItemText
                          primary="Start Review"
                          secondary="Move the submission into active review."
                        />
                      </ListItemButton>
                    )}
                    {selectedSubmission.status === 'Under Review' && (
                      <ListItemButton
                        onClick={() => handleQuickStatusUpdate(selectedSubmission, 'Closed')}
                      >
                        <ListItemText
                          primary="Close Submission"
                          secondary="Mark the case as resolved and closed."
                        />
                      </ListItemButton>
                    )}
                    <ListItemButton onClick={() => openEditDialog(selectedSubmission)}>
                      <ListItemText
                        primary="Update Submission"
                        secondary="Edit beneficiary linkage, priority, or message details."
                      />
                    </ListItemButton>
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
                <Iconify icon="solar:chat-round-like-bold" width={40} />
                <Typography variant="subtitle1">No submission selected</Typography>
                <Typography variant="body2" color="text.secondary">
                  Select a complaint or feedback record to review the details and take action.
                </Typography>
              </Stack>
            )}
          </Card>
        </Grid>
      </Grid>

      <Dialog open={formDialog.value} onClose={formDialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Submission' : 'New Submission'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete
              options={beneficiaries}
              value={formData.beneficiary}
              onChange={(_, value) => setFormData((prev) => ({ ...prev, beneficiary: value }))}
              getOptionLabel={getBeneficiaryLabel}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Beneficiary"
                  placeholder="Optional beneficiary linkage"
                />
              )}
            />
            <TextField
              select
              label="Type"
              name="type"
              value={formData.type}
              onChange={handleTextChange}
              fullWidth
            >
              {TYPE_OPTIONS.filter((option) => option !== 'All').map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleTextChange}
              fullWidth
            />
            <TextField
              label="Subject"
              name="subject"
              value={formData.subject}
              onChange={handleTextChange}
              fullWidth
              required
            />
            <TextField
              label="Message"
              name="message"
              value={formData.message}
              onChange={handleTextChange}
              fullWidth
              multiline
              rows={4}
            />
            <TextField
              select
              label="Priority"
              name="priority"
              value={formData.priority}
              onChange={handleTextChange}
              fullWidth
            >
              {PRIORITY_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleTextChange}
              fullWidth
            >
              {STATUS_OPTIONS.filter((option) => option !== 'All').map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Satisfaction Score"
              name="satisfaction"
              type="number"
              value={formData.satisfaction}
              onChange={handleTextChange}
              fullWidth
              inputProps={{ min: 1, max: 5 }}
              helperText="Optional score from 1 to 5 for feedback or suggestion items."
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
        title="Delete submission"
        content="This will permanently remove the complaint or feedback record."
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
