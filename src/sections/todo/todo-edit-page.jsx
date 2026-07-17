'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import {
  Box,
  Card,
  Button,
  TextField,
  Typography,
  Breadcrumbs,
  Link,
  Stack,
  Chip,
  Autocomplete,
  CircularProgress,
  Alert,
} from '@mui/material';

import { toast } from 'sonner';
import { Iconify } from 'src/components/iconify';
import { useAuthContext } from 'src/auth/hooks';

import { fetchTodo, updateTodo, fetchTodoUsers } from 'src/actions/todo';

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
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [userSearchInput, setUserSearchInput] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [notFound, setNotFound] = useState(false);

  // Load todo data
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchTodo(id)
      .then((data) => {
        setTitle(data.todo_title);
        setDescription(data.description || '');
        setStatus(data.status);
        setSelectedUsers(
          (data.assigned_users || []).map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
          }))
        );
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
        description: description.trim(),
        status,
        assign_user_ids: selectedUsers.map((u) => u.id),
      });
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
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 3 }}>
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

          {/* Description */}
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            fullWidth
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
  );
}
