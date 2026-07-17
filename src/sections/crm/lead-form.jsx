'use client';

import { z } from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Box, Stack, Button, Divider, MenuItem, Typography } from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Form, Field } from 'src/components/hook-form';

import {
  DHAKA_AREAS,
  SOURCE_OPTIONS,
  STATUS_OPTIONS,
  WORLD_COUNTRIES,
  BANGLADESH_CITIES,
  PROJECT_TYPE_OPTIONS,
} from './constants';

const leadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  country: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  source: z.string().optional(),
  link: z.string().optional(),
  remarks: z.string().optional(),
  project_name: z.string().optional(),
  project_type: z.string().optional(),
  customization: z.string().optional(),
  status: z.string().optional(),
  created_by: z.any().optional(),
  assigned_to: z.any().optional(),
});

const defaultEmptyValues = {
  name: '',
  phone: '',
  email: '',
  country: 'Bangladesh',
  city: 'Dhaka',
  area: 'Uttara',
  address: '',
  source: '',
  link: '',
  remarks: '',
  project_name: '',
  project_type: '',
  customization: '',
  status: 'new',
  created_by: null,
  assigned_to: '',
};

function FormSection({ title, children }) {
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2.5 }}>
        {title}
      </Typography>
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

export function LeadForm({
  initialValues = {},
  onSubmit,
  submitLabel = 'Save',
  employees = [],
  employeesLoading = false,
  currentUser = null,
}) {
  // console.log('donors endpoint:', endpoints.donors);

  const { data: donorsData, loading: donorsLoading } = useGetRequest(
    endpoints.projectManagements.donors
  );
  // console.log('donorsData:', donorsData);
  const donors = Array.isArray(donorsData) ? donorsData : (donorsData?.results ?? []);

  const defaultValues = useMemo(
    () => ({ ...defaultEmptyValues, ...initialValues }),
    [initialValues]
  );

  const methods = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues,
  });

  return (
    <Form methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
      <Stack spacing={4} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
        <FormSection title="Section 1 — Customer Information">
          <Field.Text name="name" label="Name" fullWidth required />
          <Field.Text name="phone" label="Phone" fullWidth required />
          <Field.Text name="email" label="Email" type="email" fullWidth />
          <Field.Select name="country" label="Country" fullWidth>
            {WORLD_COUNTRIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Field.Select>
          <Field.Select name="city" label="City" fullWidth>
            {BANGLADESH_CITIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Field.Select>
          <Field.Select name="area" label="Area" fullWidth>
            {DHAKA_AREAS.map((a) => (
              <MenuItem key={a} value={a}>
                {a}
              </MenuItem>
            ))}
          </Field.Select>
          <Field.Text
            name="address"
            label="Address"
            multiline
            minRows={2}
            fullWidth
            required
            sx={{ gridColumn: { md: 'span 2' } }}
          />
          <Field.Select name="source" label="Source" fullWidth>
            <MenuItem value="">Select source</MenuItem>
            {SOURCE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Field.Select>
          <Field.Select name="link" label="Link" fullWidth>
            <MenuItem value="">Select link</MenuItem>

            {donorsLoading ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : (
              donors.map((don) => (
                <MenuItem key={don.id} value={String(don.id)}>
                  {`${don.name}`}
                </MenuItem>
              ))
            )}
          </Field.Select>
          <Field.Text
            name="remarks"
            label="Remarks"
            multiline
            minRows={2}
            fullWidth
            sx={{ gridColumn: { md: 'span 2' } }}
          />
        </FormSection>

        <FormSection title="Section 2 — Project Information">
          <Field.Text name="project_name" label="Project Name" fullWidth />
          <Field.Select name="project_type" label="Project Type" fullWidth>
            <MenuItem value="">Select type</MenuItem>
            {PROJECT_TYPE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Field.Select>
          <Field.Text
            name="customization"
            label="Customization"
            multiline
            minRows={2}
            fullWidth
            sx={{ gridColumn: { md: 'span 2' } }}
          />
          <Field.Select name="status" label="Status" fullWidth>
            {STATUS_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Field.Select>
        </FormSection>

        <FormSection title="Section 3 — Assignment">
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                display: 'block',
                mb: 0.5,
              }}
            >
              Created By
            </Typography>
            <Typography
              variant="body2"
              sx={{
                py: 1,
                px: 1.5,
                bgcolor: '#f5f5f5',
                borderRadius: 1,
                border: '1px solid #e0e0e0',
              }}
            >
              {currentUser?.username || currentUser?.email || '—'}
            </Typography>
          </Box>
          <Field.Select
            name="assigned_to"
            label="Assign To"
            fullWidth
            helperText="Defaults to you if left blank."
          >
            <MenuItem value="">Select user</MenuItem>
            {employeesLoading ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : (
              (Array.isArray(employees) ? employees : []).map((emp) => (
                <MenuItem key={emp.id} value={emp.user.id}>
                  {emp.user.username}
                </MenuItem>
              ))
            )}
          </Field.Select>
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
