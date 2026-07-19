'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Box,
  Stack,
  Button,
  Divider,
  MenuItem,
  TextField,
  Typography,
  Autocomplete,
} from '@mui/material';

import { CONFIG } from 'src/config-global';

import { Form, Field } from 'src/components/hook-form';

export function resolveDonorPhotoUrl(photo) {
  if (!photo || typeof photo !== 'string') return undefined;
  if (photo.startsWith('http://') || photo.startsWith('https://') || photo.startsWith('blob:')) {
    return photo;
  }
  const path = photo.startsWith('/') ? photo : `/${photo}`;
  return `${CONFIG.serverUrl}${path}`;
}

export const donorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  organization_name: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
  total_donated_amount: z.coerce.number().optional().nullable(),
  last_donation_date: z.any().optional().nullable(),
  date_of_birth: z.any().optional().nullable(),
  gender: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  emergency_contact_name: z.string().optional().nullable(),
  emergency_contact_phone: z.string().optional().nullable(),
  preferred_language: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  national_id_number: z.string().optional().nullable(),
  registration_number: z.string().optional().nullable(),
  preferred_contact_method: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  document: z.any().optional().nullable(),
  photo: z.any().optional().nullable(),
});

const defaultEmptyValues = {
  name: '',
  email: '',
  phone: '',
  organization_name: '',
  type: 'individual',
  status: 'active',
  currency: 'USD',
  total_donated_amount: '',
  last_donation_date: '',
  date_of_birth: '',
  gender: '',
  nationality: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  preferred_language: '',
  website: '',
  national_id_number: '',
  registration_number: '',
  preferred_contact_method: '',
  address: '',
  description: '',
  document: null,
  photo: null,
};

export function buildFormData(values) {
  const formData = new FormData();
  const payload = {
    ...values,
    total_donated_amount: values.total_donated_amount || 0,
  };

  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) return;

    if (value === '') {
      formData.append(key, '');
      return;
    }

    if (key === 'document' || key === 'photo') {
      if (typeof value === 'string') return;
      if (value instanceof File) {
        formData.append(key, value);
        return;
      }
    }

    if (key === 'last_donation_date' || key === 'date_of_birth') {
      const formattedDate = value ? new Date(value).toISOString().slice(0, 10) : null;
      if (formattedDate) {
        formData.append(key, formattedDate);
      }
      return;
    }

    formData.append(key, value);
  });

  return formData;
}

function FormSection({ title, description, children }) {
  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {description}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
          gap: 2.5,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export function DonorForm({ initialValues = {}, onSubmit, submitLabel = 'Save', currencies = [] }) {
  const defaultValues = useMemo(
    () => ({
      ...defaultEmptyValues,
      ...initialValues,
      last_donation_date: initialValues.last_donation_date || '',
      date_of_birth: initialValues.date_of_birth || '',
      photo: resolveDonorPhotoUrl(initialValues.photo) || null,
    }),
    [initialValues]
  );

  const methods = useForm({
    resolver: zodResolver(donorSchema),
    defaultValues,
  });

  useEffect(() => {
    if (Object.keys(initialValues).length > 0) {
      methods.reset(defaultValues);
    }
  }, [initialValues, defaultValues, methods]);

  return (
    <Form methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
      <Stack spacing={4} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
        <Box>
          <Box sx={{ mb: 2.5, textAlign: 'center' }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Profile Picture
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Upload a photo to display on the donor profile
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', pb: 1 }}>
            <Field.UploadAvatar
              name="photo"
              helperText={
                <Typography
                  variant="caption"
                  sx={{
                    mt: 2,
                    mx: 'auto',
                    display: 'block',
                    textAlign: 'center',
                    color: 'text.disabled',
                  }}
                >
                  Allowed *.jpeg, *.jpg, *.png
                </Typography>
              }
            />
          </Box>
        </Box>

        <FormSection
          title="Basic Information"
          description="Primary donor identity and classification"
        >
          <Field.Text name="name" label="Donor Name" fullWidth />
          <Field.Text name="email" label="Email" fullWidth />
          <Field.Text name="phone" label="Phone" fullWidth />
          <Field.Text name="organization_name" label="Organization" fullWidth />
          <Field.Select name="type" label="Type" fullWidth>
            <MenuItem value="individual">Individual</MenuItem>
            <MenuItem value="organization">Organization</MenuItem>
            <MenuItem value="government">Government</MenuItem>
            <MenuItem value="ngo">NGO</MenuItem>
          </Field.Select>
          <Field.Select name="status" label="Status" fullWidth>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
          </Field.Select>
        </FormSection>

        <FormSection
          title="Donation Details"
          description="Financial contribution history and currency"
        >
          <Autocomplete
            options={currencies}
            value={currencies.find((c) => c.code === methods.watch('currency')) || null}
            getOptionLabel={(option) =>
              option ? `${option.code}${option.symbol ? ` (${option.symbol})` : ''}` : ''
            }
            isOptionEqualToValue={(option, value) => option.code === value.code}
            onChange={(_, value) =>
              methods.setValue('currency', value?.code || '', { shouldValidate: true })
            }
            renderInput={(params) => (
              <TextField {...params} size="small" label="Currency" fullWidth />
            )}
          />
          <Field.Text
            name="total_donated_amount"
            label="Total Donated Amount"
            type="number"
            fullWidth
          />
          <Field.DatePicker name="last_donation_date" label="Last Donation Date" fullWidth />
        </FormSection>

        <FormSection
          title="Personal Details"
          description="Demographic and identification information"
        >
          <Field.DatePicker name="date_of_birth" label="Date of Birth" fullWidth />
          <Field.Select name="gender" label="Gender" fullWidth>
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Field.Select>
          <Field.Text name="nationality" label="Nationality" fullWidth />
          <Field.Text name="national_id_number" label="National ID" fullWidth />
          <Field.Text name="registration_number" label="Registration Number" fullWidth />
        </FormSection>

        <FormSection
          title="Contact Preferences"
          description="Emergency contacts and communication preferences"
        >
          <Field.Text name="emergency_contact_name" label="Emergency Contact Name" fullWidth />
          <Field.Text name="emergency_contact_phone" label="Emergency Contact Phone" fullWidth />
          <Field.Text name="preferred_language" label="Preferred Language" fullWidth />
          <Field.Text name="website" label="Website" fullWidth />
          <Field.Select name="preferred_contact_method" label="Preferred Contact Method" fullWidth>
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="phone">Phone</MenuItem>
            <MenuItem value="whatsapp">WhatsApp</MenuItem>
            <MenuItem value="sms">SMS</MenuItem>
          </Field.Select>
          <Field.Text
            name="address"
            label="Address"
            multiline
            minRows={2}
            fullWidth
            sx={{ gridColumn: { md: 'span 2' } }}
          />
        </FormSection>

        <FormSection title="Additional Notes" description="Supporting context and file attachments">
          <Field.Text
            name="description"
            label="Description"
            multiline
            minRows={3}
            fullWidth
            sx={{ gridColumn: { md: 'span 2' } }}
          />
          <Field.Upload
            name="document"
            label="Supporting Document"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            fullWidth
          />
        </FormSection>
      </Stack>

      <Stack
        direction="row"
        justifyContent="flex-end"
        spacing={2}
        sx={{
          mt: 4,
          pt: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Button type="submit" variant="contained" size="large" sx={{ minWidth: 160 }}>
          {submitLabel}
        </Button>
      </Stack>
    </Form>
  );
}
