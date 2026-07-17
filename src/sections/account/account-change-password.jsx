import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { useBoolean } from 'src/hooks/use-boolean';

import axios, { endpoints } from 'src/utils/axios';

import { setPassword } from 'src/actions/employees';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

export const ChangePassWordSchema = (isSelf) =>
  zod
    .object({
      oldPassword: isSelf
        ? zod
            .string()
            .min(1, { message: 'Password is required!' })
            .min(8, { message: 'Password must be at least 8 characters!' })
        : zod.string().optional(),
      newPassword: zod.string().min(1, { message: 'New password is required!' }),
      confirmNewPassword: zod.string().min(1, { message: 'Confirm password is required!' }),
    })
    .refine((data) => !isSelf || data.oldPassword !== data.newPassword, {
      message: 'New password must be different than old password',
      path: ['newPassword'],
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: 'Passwords do not match!',
      path: ['confirmNewPassword'],
    });

// ----------------------------------------------------------------------

export function AccountChangePassword({ isSelf, userId }) {
  const password = useBoolean();

  const defaultValues = { oldPassword: '', newPassword: '', confirmNewPassword: '' };

  const methods = useForm({
    mode: 'onBlur',
    resolver: zodResolver(ChangePassWordSchema(isSelf)),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (isSelf) {
        await setPassword(data.oldPassword, data.newPassword);
        toast.success('Password updated successfully!');
      } else {
        await axios.patch(endpoints.auth.updatePassword(userId), { password: data.newPassword });
        toast.success('Password set successfully!');
      }

      reset();
    } catch (error) {
      console.error(error);

      if (error) {
        Object.entries(error).forEach(([field, messages]) => {
          const msg = Array.isArray(messages) ? messages.join(', ') : String(messages);
          toast.error(msg);
        });
      } else {
        toast.error(error.detail || 'Failed to update password');
      }
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3, gap: 3, display: 'flex', flexDirection: 'column' }}>
        {isSelf && (
          <Field.Text
            name="oldPassword"
            type={password.value ? 'text' : 'password'}
            label="Old password"
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
        )}

        <Field.Text
          name="newPassword"
          label={isSelf ? 'New password' : 'Set password'}
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
              <Iconify icon="eva:info-fill" width={16} sx={{ mr: 0.5 }} /> Password must be minimum
              8+
            </Stack>
          }
        />

        <Field.Text
          name="confirmNewPassword"
          type={password.value ? 'text' : 'password'}
          label={isSelf ? 'Confirm new password' : 'Confirm password'}
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

        <LoadingButton
          type="submit"
          variant="contained"
          color="primary"
          loading={isSubmitting}
          sx={{ ml: 'auto' }}
        >
          {isSelf ? 'Save changes' : 'Reset password'}
        </LoadingButton>
      </Card>
    </Form>
  );
}
