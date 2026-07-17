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
} from '@mui/material';

import { Iconify } from 'src/components/iconify';
import { toast } from 'sonner';

import { createTodo, fetchTodoUsers } from 'src/actions/todo';

export default function TodoCreatePage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('draft');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [userSearchInput, setUserSearchInput] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

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
      await createTodo({
        todo_title: title.trim(),
        description: description.trim(),
        status,
        assign_user_ids: selectedUsers.map((u) => u.id),
      });
      toast.success('Todo created successfully!');
      router.push(paths.dashboard.todo.list);
    } catch (error) {
      toast.error(error.message || 'Failed to create todo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 3 }}>
      {/* Breadcrumbs */}
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
        <Typography color="text.primary">Create Todo</Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ mb: 3 }}>
        Create Todo
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

          {/* Status Toggle - only draft and hold at creation */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Status
            </Typography>
            <Stack direction="row" spacing={1}>
              {[
                { key: 'draft', label: 'Draft' },
                { key: 'hold', label: 'Hold' },
              ].map((opt) => (
                <Chip
                  key={opt.key}
                  label={opt.label}
                  color={status === opt.key ? 'primary' : 'default'}
                  variant={status === opt.key ? 'filled' : 'outlined'}
                  onClick={() => setStatus(opt.key)}
                  clickable
                />
              ))}
            </Stack>
          </Box>

          {/* Assign Users (multi-select, searchable) */}
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
              {submitting ? 'Creating...' : 'Create Todo'}
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Box>
  );
}
