'use client';

import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { useBoolean } from 'src/hooks/use-boolean';

import { createUser } from 'src/actions/employees';
import { useGetPermissions, updateUserPermissions } from 'src/actions/permissions';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { employeeCodenames, supervisorCodenames } from './utils/user-utils';

// ----------------------------------------------------------------------

// Validation schema for user creation
const UserCreateSchema = zod
  .object({
    email: zod
      .string()
      .min(1, { message: 'Email is required!' })
      .email({ message: 'Email must be a valid email address!' }),
    username: zod
      .string()
      .min(3, { message: 'Username must be at least 3 characters!' })
      .max(100, { message: 'Username cannot exceed 100 characters!' }),
    password: zod
      .string()
      .min(1, { message: 'Password is required!' })
      .min(8, { message: 'Password must be at least 8 characters!' }),
    re_password: zod.string().min(1, { message: 'Confirm password is required!' }),
  })
  .refine((data) => data.password === data.re_password, {
    message: 'Passwords do not match!',
    path: ['re_password'],
  });

// ----------------------------------------------------------------------

export function UserCreateSimpleForm({ onClose }) {
  const [generalError, setGeneralError] = useState('');
  const password = useBoolean();

  const { permissions = [] } = useGetPermissions();

  const defaultValues = {
    email: '',
    username: '',
    password: '',
    re_password: '',
  };

  const methods = useForm({
    mode: 'onBlur',
    resolver: zodResolver(UserCreateSchema),
    defaultValues,
  });

  const {
    reset,
    setError,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Create user
      const user = await createUser(data);
      // Patch permissions for the new user based on role
      if (user && user.id) {
        // Find role (default to Employee if not specified)
        const role = data.role || 'Employee';
        let permissionIds = [];
        if (role === 'Admin') {
          // Admin: all permissions
          permissionIds = permissions.map((p) => p.id);
        } else if (role === 'Supervisor') {
          permissionIds = permissions
            .filter((p) => supervisorCodenames.includes(p.codename))
            .map((p) => p.id);
        } else {
          permissionIds = permissions
            .filter((p) => employeeCodenames.includes(p.codename))
            .map((p) => p.id);
        }
        await updateUserPermissions(user.id, permissionIds);
      }
      toast.success('User created successfully!');
      reset();
      if (onClose) onClose();
    } catch (error) {
      console.error('Error creating user:', error);

      // Handle API error response
      if (
        typeof error === 'string' &&
        (error.startsWith('<!DOCTYPE html>') || error.includes('<html'))
      ) {
        setGeneralError('Server error occurred. Please try again later.');
      } else if (typeof error === 'object' && error !== null) {
        // Reset general error
        setGeneralError('');

        // Process each field error
        Object.entries(error).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            // Set field-specific errors in the form
            if (field in defaultValues) {
              setError(field, {
                type: 'manual',
                message: messages.join(' '),
              });
            } else {
              // For non-field errors, display as general error
              setGeneralError((prev) =>
                prev
                  ? `${prev}\n${field}: ${messages.join(' ')}`
                  : `${field}: ${messages.join(' ')}`
              );
            }
          } else if (field in defaultValues) {
            // Handle non-array messages
            setError(field, {
              type: 'manual',
              message: messages,
            });
          } else {
            // Handle non-array messages
            setGeneralError((prev) =>
              prev ? `${prev}\n${field}: ${messages}` : `${field}: ${messages}`
            );
          }
        });
      } else {
        setGeneralError(typeof error === 'string' ? error : 'Something went wrong!');
      }

      toast.error('Failed to create user!');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Box
        rowGap={3}
        columnGap={2}
        display="grid"
        mt={0.5}
        gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(1, 1fr)' }}
      >
        {!!generalError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {generalError.split('\n').map((line, index) => (
              <Typography key={index} variant="body2">
                {line}
              </Typography>
            ))}
          </Alert>
        )}

        <Field.Text name="username" label="Username" placeholder="Enter username" />

        <Field.Text name="email" label="Email address" placeholder="example@domain.com" />

        <Field.Text
          name="password"
          label="Password"
          type={password.value ? 'text' : 'password'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={password.onToggle} edge="end">
                  <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          }}
          helperText={
            <Stack component="span" direction="row" alignItems="center">
              <Iconify icon="eva:info-fill" width={16} sx={{ mr: 0.5 }} />
              Password must be at least 8 characters and not entirely numeric
            </Stack>
          }
        />

        <Field.Text
          name="re_password"
          label="Confirm Password"
          type={password.value ? 'text' : 'password'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={password.onToggle} edge="end">
                  <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Stack alignItems="flex-end" sx={{ my: 3 }}>
        <LoadingButton type="submit" variant="contained" color="primary" loading={isSubmitting}>
          Create User
        </LoadingButton>
      </Stack>
    </Form>
  );
}
