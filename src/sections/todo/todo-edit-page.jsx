'use client';

import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';

import {
  Box,
  Card,
  Link,
  Chip,
  Stack,
  Button,
  TextField,
  MenuItem,
  Typography,
  Breadcrumbs,
  Autocomplete,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fetchTodo, updateTodo, fetchTodoUsers, createTodoAttachment } from 'src/actions/todo';

import { Iconify } from 'src/components/iconify';
import TiptapEditor from 'src/components/tiptap-editor';

import { useAuthContext } from 'src/auth/hooks';

const STATUS_OPTIONS = [
  { key: 'draft', label: 'Draft', color: 'default' },
  { key: 'pending', label: 'Pending', color: 'info' },
  { key: 'hold', label: 'Hold', color: 'warning' },
  { key: 'completed', label: 'Completed', color: 'success' },
];

export default function TodoEditPage({ id }) {
  console.log('TodoEditPage rendered with id:', id); // Debug log to check if id is received
  const router = useRouter();
  const { user } = useAuthContext();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('draft');
  const [expectedDate, setExpectedDate] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [userSearchInput, setUserSearchInput] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [notFound, setNotFound] = useState(false);
  // Optional attachment fields for edit
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentRemarks, setAttachmentRemarks] = useState('');
  // Recurrence fields
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState('daily');
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState([]);
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState(1);

  // Load todo data
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchTodo(id)
      .then((data) => {
        setTitle(data.todo_title);
        setDescription(data.description || '');
        setStatus(data.status);
        setExpectedDate(data.expected_date || '');
        setSelectedUsers(
          (data.assigned_users || []).map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
          }))
        );
        setIsRecurring(data.is_recurring || false);
        setRecurrenceType(data.recurrence_type || 'daily');
        setRecurrenceWeekdays(data.recurrence_weekdays || []);
        setRecurrenceDayOfMonth(data.recurrence_day_of_month || 1);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  // Load users for assign dropdown
  useEffect(() => {
    setLoadingUsers(true);
    fetchTodoUsers(userSearchInput)
      .then((data) => setUserOptions(data || []))
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
  }, [userSearchInput]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      await updateTodo(id, {
        todo_title: title.trim(),
        description: description || '',
        expected_date: expectedDate || null,
        status,
        assign_user_ids: selectedUsers.map((u) => u.id),
        is_recurring: isRecurring,
        recurrence_type: isRecurring ? recurrenceType : 'none',
        recurrence_weekdays: isRecurring && recurrenceType === 'weekly' ? recurrenceWeekdays : null,
        recurrence_day_of_month: isRecurring && recurrenceType === 'monthly' ? recurrenceDayOfMonth : null,
      });

      // If file or remarks provided, create attachment for the current user
      if (attachmentFile || attachmentRemarks) {
        const formData = new FormData();
        if (attachmentFile) formData.append('file', attachmentFile);
        if (attachmentRemarks) formData.append('remarks', attachmentRemarks);
        await createTodoAttachment(id, formData);
      }

      toast.success('Todo updated successfully!');
      router.push(paths.dashboard.todo.list);
    } catch (error) {
      toast.error(error.message || 'Failed to update todo');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (notFound) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6">Todo not found or you do not have permission to edit.</Typography>
        <Button
          sx={{ mt: 2 }}
          variant="contained"
          onClick={() => router.push(paths.dashboard.todo.list)}
        >
          Back to List
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',

        minHeight: '100vh',
        width: '100%',
        px: 2,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 720,
          mx: 'auto',
        }}
      >
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link underline="hover" color="inherit" onClick={() => router.push(paths.dashboard.root)}>
            Dashboard
          </Link>
          <Link
            underline="hover"
            color="inherit"
            onClick={() => router.push(paths.dashboard.todo.list)}
          >
            Todo Management
          </Link>
          <Typography color="text.primary">Edit Todo</Typography>
        </Breadcrumbs>

        <Typography variant="h4" sx={{ mb: 3 }}>
          Edit Todo
        </Typography>

        <Card sx={{ p: 3, maxWidth: 720 }}>
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            {/* Title */}
            <TextField
              label="Todo Title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              fullWidth
            />

            {/* Description - Tiptap */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Description
              </Typography>
              <TiptapEditor
                value={description}
                onChange={(html) => setDescription(html)}
                placeholder="Write a description..."
                minHeight={120}
              />
            </Box>

            {/* Expected Date */}
            <TextField
              label="Expected Date"
              type="date"
              fullWidth
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            {/* Status - all 4 options on edit */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Status
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {STATUS_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.key}
                    label={opt.label}
                    color={status === opt.key ? opt.color : 'default'}
                    variant={status === opt.key ? 'filled' : 'outlined'}
                    onClick={() => setStatus(opt.key)}
                    clickable
                  />
                ))}
              </Stack>
            </Box>

            {/* ── Recurrence Section ── */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: isRecurring ? 'primary.main' : 'divider',
                bgcolor: isRecurring ? 'primary.lighter' : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: isRecurring ? 1.5 : 0 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Iconify icon="solar:recurso-bold" width={18} sx={{ color: isRecurring ? 'primary.dark' : 'text.secondary' }} />
                  <Typography variant="subtitle2" sx={{ color: isRecurring ? 'primary.dark' : 'text.secondary' }}>
                    Recurring Todo
                  </Typography>
                </Stack>
                <Box
                  onClick={() => setIsRecurring(!isRecurring)}
                  sx={{
                    width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
                    bgcolor: isRecurring ? 'primary.main' : 'action.disabledBackground',
                    position: 'relative', transition: 'all 0.2s ease',
                  }}
                >
                  <Box
                    sx={{
                      width: 18, height: 18, borderRadius: '50%', bgcolor: 'white',
                      position: 'absolute', top: 2,
                      left: isRecurring ? 20 : 2,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  />
                </Box>
              </Stack>

              {isRecurring && (
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block', fontWeight: 600 }}>
                      Frequency
                    </Typography>
                    <Stack direction="row" spacing={0.75}>
                      {[
                        { key: 'daily', label: 'Daily' },
                        { key: 'weekly', label: 'Weekly' },
                        { key: 'monthly', label: 'Monthly' },
                      ].map((opt) => (
                        <Box
                          key={opt.key}
                          onClick={() => setRecurrenceType(opt.key)}
                          sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.5,
                            px: 1.5, py: 0.75, borderRadius: 1.5, cursor: 'pointer',
                            border: '1.5px solid',
                            borderColor: recurrenceType === opt.key ? 'primary.main' : 'divider',
                            bgcolor: recurrenceType === opt.key ? 'primary.lighter' : 'transparent',
                            color: recurrenceType === opt.key ? 'primary.dark' : 'text.secondary',
                            fontSize: 12, fontWeight: recurrenceType === opt.key ? 700 : 500,
                            transition: 'all 0.15s ease',
                            '&:hover': { borderColor: 'primary.main' },
                          }}
                        >
                          {recurrenceType === opt.key && <Iconify icon="solar:check-circle-bold" width={13} />}
                          {opt.label}
                        </Box>
                      ))}
                    </Stack>
                  </Box>

                  {recurrenceType === 'weekly' && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block', fontWeight: 600 }}>
                        Select Days
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {[
                          { key: 0, label: 'Mon' }, { key: 1, label: 'Tue' }, { key: 2, label: 'Wed' },
                          { key: 3, label: 'Thu' }, { key: 4, label: 'Fri' }, { key: 5, label: 'Sat' },
                          { key: 6, label: 'Sun' },
                        ].map((day) => {
                          const isSelected = recurrenceWeekdays.includes(day.key);
                          return (
                            <Box
                              key={day.key}
                              onClick={() => {
                                setRecurrenceWeekdays((prev) =>
                                  isSelected ? prev.filter((d) => d !== day.key) : [...prev, day.key]
                                );
                              }}
                              sx={{
                                px: 1.5, py: 0.65, borderRadius: 1.5, cursor: 'pointer',
                                border: '1.5px solid',
                                borderColor: isSelected ? 'primary.main' : 'divider',
                                bgcolor: isSelected ? 'primary.main' : 'transparent',
                                color: isSelected ? 'white' : 'text.secondary',
                                fontSize: 11.5, fontWeight: isSelected ? 700 : 500,
                                transition: 'all 0.15s ease',
                                '&:hover': { borderColor: 'primary.main' },
                              }}
                            >
                              {day.label}
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}

                  {recurrenceType === 'monthly' && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block', fontWeight: 600 }}>
                        Day of Month
                      </Typography>
                      <TextField
                        select
                        size="small"
                        value={recurrenceDayOfMonth}
                        onChange={(e) => setRecurrenceDayOfMonth(Number(e.target.value))}
                        sx={{ width: 120 }}
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <MenuItem key={day} value={day}>{day}</MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  )}
                </Stack>
              )}
            </Box>

            {/* Assign Users */}
            <Autocomplete
              multiple
              options={userOptions}
              value={selectedUsers}
              onChange={(event, newValue) => setSelectedUsers(newValue)}
              onInputChange={(event, newInputValue) => setUserSearchInput(newInputValue)}
              getOptionLabel={(option) => `${option.name || ''} (${option.email || ''})`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              loading={loadingUsers}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assign Users"
                  placeholder="Search by name or email..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingUsers ? <CircularProgress size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.name || option.email}
                    size="small"
                  />
                ))
              }
            />

            {/* Optional File Upload */}

            {/* Optional Remarks - Tiptap */}

            {/* Submit */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </Stack>
          </Stack>
        </Card>
      </Box>
    </Box>
  );
}
