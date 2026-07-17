'use client';

import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { NewPasswordIcon } from 'src/assets/icons';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { FormHead } from 'src/auth/components/form-head';
import { resetPasswordConfirm } from 'src/auth/context/jwt';
import { FormReturnLink } from 'src/auth/components/form-return-link';

// ----------------------------------------------------------------------

export const ResetPasswordConfirmSchema = zod
  .object({
    password: zod
      .string()
      .min(1, { message: 'Password is required!' })
      .min(8, { message: 'Password must be at least 8 characters!' }),
    confirmPassword: zod.string().min(1, { message: 'Confirm password is required!' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match!',
    path: ['confirmPassword'],
  });

// ----------------------------------------------------------------------

export function PasswordResetConfirmView({ uid, token }) {
  const router = useRouter();
  const password = useBoolean();
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const defaultValues = {
    password: '',
    confirmPassword: '',
  };

  const methods = useForm({
    resolver: zodResolver(ResetPasswordConfirmSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await resetPasswordConfirm({
        uid,
        token,
        new_password: data.password,
      });

      setSuccess(true);
      setErrorMsg('');
      toast.success('Password has been reset successfully!');

      // Redirect to sign-in page after 2 seconds
      setTimeout(() => {
        router.push(paths.auth.jwt.signIn);
      }, 2000);
    } catch (error) {
      console.error(error);
      setSuccess(false);
      setErrorMsg(typeof error === 'string' ? error : error?.detail || 'Failed to reset password!');

      if (error) {
        Object.entries(error).forEach(([field, messages]) => {
          const msg = Array.isArray(messages) ? messages.join(', ') : String(messages);
          toast.error(msg);
        });
      } else {
        toast.error(error.detail || 'Failed to reset password');
      }
    }
  });

  const renderForm = (
    <Box gap={3} display="flex" flexDirection="column">
      {!!errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Password reset successfully. Redirecting to login page...
        </Alert>
      )}

      <Field.Text
        name="password"
        label="New Password"
        placeholder="8+ characters"
        type={password.value ? 'text' : 'password'}
        InputLabelProps={{ shrink: true }}
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
          <Box component="span" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <Iconify icon="eva:info-fill" width={16} sx={{ mr: 0.5 }} />
            Password must be at least 8 characters
          </Box>
        }
        disabled={success}
      />

      <Field.Text
        name="confirmPassword"
        label="Confirm New Password"
        type={password.value ? 'text' : 'password'}
        InputLabelProps={{ shrink: true }}
        placeholder="8+ characters"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={password.onToggle} edge="end">
                <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
        disabled={success}
      />

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        disabled={success}
      >
        Reset Password
      </LoadingButton>
    </Box>
  );

  return (
    <>
      <FormHead
        icon={<NewPasswordIcon />}
        title="Reset Your Password"
        description="Please enter your new password below to complete the reset process."
      />

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </Form>

      <FormReturnLink href={paths.auth.jwt.signIn} />
    </>
  );
}
