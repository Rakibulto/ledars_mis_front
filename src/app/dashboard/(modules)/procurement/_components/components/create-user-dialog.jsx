'use client';

/**
 * UserDialog — reusable Create / Edit dialog for system users.
 *
 * CREATE mode  →  editUser = null  (or omit prop)
 *   Credentials (username, password) are AUTO-GENERATED from email — read-only in the form.
 *   Only editable fields: Full Name, Phone, Status.
 *
 * EDIT mode    →  editUser = user object from API
 *   No password fields shown. Username is read-only.
 *   Only editable fields: Full Name, Phone, Status.
 *
 * TIP: change `key` between create and edit so RHF re-initialises:
 *   key="create"  vs  key={`edit-${user.id}`}
 */

import { z } from 'zod';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useCallback } from 'react';

import {
  Stack,
  Dialog,
  Select,
  MenuItem,
  TextField,
  InputLabel,
  IconButton,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
  FormHelperText,
  InputAdornment,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { usePatchRequest, useCreateMutation } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

import { Button } from './ui/button';

// ── Schemas ───────────────────────────────────────────────────────────────────

const createUserSchema = z.object({
  name: z.string().min(1, 'Full name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  // username, password, re_password are auto-generated — always valid, just need presence
  username: z.string().min(1),
  password: z.string().min(1),
  re_password: z.string().min(1),
  phone: z.string().optional().or(z.literal('')),
  status: z.string().min(1, 'Status is required'),
});

const updateUserSchema = z.object({
  name: z.string().min(1, 'Full name is required').min(2, 'Name must be at least 2 characters'),
  username: z.string().min(1, 'Username is required'),
  phone: z.string().optional().or(z.literal('')),
  status: z.string().min(1, 'Status is required'),
});

// ── Credential generator ──────────────────────────────────────────────────────

/**
 * Derives a username and password from an email address.
 *
 * Password : First letter of email name (uppercase) + "123456@"
 *            e.g. imran@gmail.com  →  I123456@
 *
 * Username : email name part + last-5 digits of current timestamp
 *            e.g. imran  →  imran83927
 */
const generateCredentials = (email = '') => {
  const [namePart = ''] = email.split('@');
  const password = `${namePart.charAt(0).toUpperCase()}123456@`;
  const timestamp = Date.now().toString().slice(-5);
  const username = `${namePart}${timestamp}`;
  return { username, password };
};

// ── Component ─────────────────────────────────────────────────────────────────

export function UserDialog({
  open,
  onClose,
  editUser = null,
  initialValues = null,
  uniqueRoles = [], // kept in props for API compatibility; not rendered
  uniqueDepartments = [], // kept in props for API compatibility; not rendered
  onSuccess,
}) {
  const isEditMode = !!editUser;

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { trigger: createUser } = useCreateMutation(
    endpoints.settings.user_management || '/api/user-management/'
  );

  // ── Compute auto-generated values for create mode ─────────────────────────
  const email = initialValues?.email || '';
  const { username: autoUsername, password: autoPassword } = generateCredentials(email);

  // ── Form setup ────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm({
    resolver: zodResolver(isEditMode ? updateUserSchema : createUserSchema),
    defaultValues: isEditMode
      ? {
          name: '',
          username: '',
          phone: '',
          status: 'active',
        }
      : {
          name: initialValues?.name || '',
          email,
          username: autoUsername,
          password: autoPassword,
          re_password: autoPassword,
          phone: initialValues?.phone || '',
          status: initialValues?.status || 'active',
        },
  });

  // ── Pre-fill whenever the dialog opens ───────────────────────────────────
  useEffect(() => {
    if (!open) return;

    if (isEditMode && editUser) {
      reset({
        name: editUser.name || '',
        username: editUser.username || '',
        phone: editUser.phone || '',
        status: editUser.status || 'active',
      });
    } else {
      const { username: u, password: p } = generateCredentials(email);
      reset({
        name: initialValues?.name || '',
        email,
        username: u,
        password: p,
        re_password: p,
        phone: initialValues?.phone || '',
        status: initialValues?.status || 'active',
      });
    }

    setShowPassword(false);
  }, [open, editUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    reset();
    setShowPassword(false);
    onClose();
  }, [onClose, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (isEditMode) {
        const payload = {
          username: data.username, // read-only, echoed from editUser
          name: data.name,
          phone: data.phone || '',
          status: data.status || 'active',
        };
        await usePatchRequest(`${endpoints.settings.user_management}${editUser.id}/`, payload);
        toast.success('User updated successfully');
      } else {
        // Always use auto-generated credentials — never trust the (hidden) input values
        const { username, password } = generateCredentials(data.email);
        const payload = {
          username,
          email: data.email,
          password,
          re_password: password,
          name: data.name,
          phone: data.phone || '',
          status: data.status || null,
        };
        await createUser(payload);
        toast.success('User created successfully');
      }

      onSuccess?.(isEditMode ? 'edit' : 'create');
      handleClose();
    } catch (error) {
      toast.error(error?.message || `Error ${isEditMode ? 'updating' : 'creating'} user`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
        {isEditMode ? `Edit User — ${editUser?.name || editUser?.username}` : 'Add New User'}
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <form id="user-dialog-form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3} sx={{ pt: 1 }}>
            {/* ── Full Name (editable) ────────────────────────────────────── */}
            <TextField
              fullWidth
              label="Full Name"
              placeholder="Enter full name"
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
              variant="outlined"
            />

            {/* ── Username (always read-only, shown in both modes) ─────────── */}
            <TextField
              fullWidth
              label="Username"
              {...register('username')}
              variant="outlined"
              InputProps={{ readOnly: true }}
              helperText="Auto-generated — cannot be changed"
            />

            {/* ── Email (create only, read-only) ───────────────────────────── */}
            {!isEditMode && (
              <TextField
                fullWidth
                type="email"
                label="Email"
                {...register('email')}
                variant="outlined"
                InputProps={{ readOnly: true }}
                helperText="Pre-filled from your record"
              />
            )}

            {/* ── Password (create only, read-only with show/hide toggle) ──── */}
            {!isEditMode && (
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                label="Password"
                {...register('password')}
                variant="outlined"
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        size="small"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <Iconify
                          icon={showPassword ? 'solar:eye-closed-linear' : 'solar:eye-linear'}
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                helperText="Auto-generated from email — cannot be changed"
              />
            )}

            {/* ── Confirm Password (create only, read-only, mirrors password) ─ */}
            {!isEditMode && (
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                label="Confirm Password"
                {...register('re_password')}
                variant="outlined"
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        size="small"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <Iconify
                          icon={showPassword ? 'solar:eye-closed-linear' : 'solar:eye-linear'}
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                helperText="Must match password — auto-filled"
              />
            )}

            {/* ── Phone (editable, optional) ──────────────────────────────── */}
            <TextField
              fullWidth
              type="tel"
              label="Phone"
              placeholder="Enter phone number (optional)"
              {...register('phone')}
              inputProps={{ readOnly: true }}
              error={!!errors.phone}
              helperText={errors.phone?.message}
              variant="outlined"
            />

            {/* ── Status (editable) ───────────────────────────────────────── */}
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.status}>
                  <InputLabel>Status</InputLabel>
                  <Select {...field} label="Status" value={field.value || 'active'}>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                  {errors.status && <FormHelperText>{errors.status.message}</FormHelperText>}
                </FormControl>
              )}
            />
          </Stack>
        </form>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button variant="outline" onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" form="user-dialog-form" disabled={submitting}>
          {submitting
            ? isEditMode
              ? 'Updating…'
              : 'Creating…'
            : isEditMode
              ? 'Update User'
              : 'Create User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
