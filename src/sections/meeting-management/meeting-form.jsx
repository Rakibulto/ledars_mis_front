'use client';

import { z } from 'zod';
import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Box,
  Chip,
  Stack,
  Button,
  Select,
  Divider,
  MenuItem,
  IconButton,
  InputLabel,
  Typography,
  FormControl,
  OutlinedInput,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { MEETING_STATUS_OPTIONS } from './constants';

// ----------------------------------------------------------------------

const meetingSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    date: z
      .any()
      .refine((val) => val !== null && val !== undefined && val !== '', 'Date is required'),
    start_time: z
      .any()
      .refine((val) => val !== null && val !== undefined && val !== '', 'Start time is required'),
    end_time: z
      .any()
      .refine((val) => val !== null && val !== undefined && val !== '', 'End time is required'),
    status: z.string().optional(),
    location: z.string().optional(),
    meeting_link: z.string().optional(),
    agenda: z.string().optional(),
    minutes: z.string().optional(),
    assigned_to: z.array(z.any()).optional(),
  })
  .refine(
    (data) => {
      if (!data.start_time || !data.end_time) return true;
      return data.start_time < data.end_time;
    },
    { message: 'End time must be after start time', path: ['end_time'] }
  );

const defaultEmptyValues = {
  title: '',
  description: '',
  date: null,
  start_time: null,
  end_time: null,
  status: 'scheduled',
  location: '',
  meeting_link: '',
  agenda: '',
  minutes: '',
  assigned_to: [],
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

// ----------------------------------------------------------------------

export function MeetingForm({
  initialValues = {},
  onSubmit,
  submitLabel = 'Save',
  employees = [],
  employeesLoading = false,
  currentUser = null,
}) {
  const [files, setFiles] = useState([]);

  const defaultValues = useMemo(
    () => ({ ...defaultEmptyValues, ...initialValues }),
    [initialValues]
  );

  const methods = useForm({
    resolver: zodResolver(meetingSchema),
    defaultValues,
  });

  const { control, reset } = methods;

  const handleReset = () => {
    reset(defaultEmptyValues);
    setFiles([]);
  };

  const handleFileChange = (e) => {
    setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    e.target.value = '';
  };

  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = (values) => {
    onSubmit(values, files);
  };

  return (
    <Form methods={methods} onSubmit={methods.handleSubmit(handleSubmit)}>
      <Stack spacing={4} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
        <FormSection title="Section 1 — Basic Information">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' },
              gap: 2.5,
              gridColumn: '1 / -1',
            }}
          >
            <Field.Text name="title" label="Meeting Title *" fullWidth required />

            <Field.DatePicker name="date" label="Date *" fullWidth required />

            <Field.Select name="status" label="Status" fullWidth>
              {MEETING_STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Field.Select>
          </Box>

          <Field.Text
            name="description"
            label="Description"
            multiline
            minRows={3}
            fullWidth
            sx={{ gridColumn: { md: 'span 2' } }}
          />
        </FormSection>

        {/* Section 2 — Time & Location */}
        <FormSection title="Section 2 — Time & Location">
          <Field.TimePicker name="start_time" label="Start Time *" fullWidth required />
          <Field.TimePicker name="end_time" label="End Time *" fullWidth required />
          <Field.Text
            name="location"
            label="Location"
            fullWidth
            placeholder="e.g., Conference Room A"
          />
          <Field.Text
            name="meeting_link"
            label="Meeting Link"
            fullWidth
            placeholder="e.g., https://zoom.us/j/…"
          />
        </FormSection>

        {/* Section 3 — Agenda & Minutes */}
        <FormSection title="Section 3 — Agenda & Minutes">
          <Field.Text
            name="agenda"
            label="Agenda"
            multiline
            minRows={4}
            fullWidth
            sx={{ gridColumn: { md: 'span 2' } }}
          />
          <Field.Text
            name="minutes"
            label="Minutes"
            multiline
            minRows={4}
            fullWidth
            sx={{ gridColumn: { md: 'span 2' } }}
          />
        </FormSection>

        {/* Section 4 — Assignment */}
        <Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2.5 }}>
            Section 4 — Assignment
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
              gap: 2.5,
            }}
          >
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{
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

            <Controller
              name="assigned_to"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Assign To</InputLabel>
                  <Select
                    multiple
                    label="Assign To"
                    value={field.value || []}
                    onChange={(e) => field.onChange(e.target.value)}
                    input={<OutlinedInput label="Assign To" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((val) => {
                          const emp = employees.find((e) => e.user.id === val);
                          return (
                            <Chip
                              key={val}
                              label={
                                emp?.employee_name || emp?.user?.username || emp?.user?.email || val
                              }
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {employeesLoading ? (
                      <MenuItem disabled>Loading users…</MenuItem>
                    ) : (
                      employees.map((emp) => (
                        <MenuItem key={emp.user.id} value={emp.user.id}>
                          {emp.employee_name || emp.user.username || emp.user.email}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              )}
            />
          </Box>
        </Box>

        {/* Section 5 — Attachments */}
        <Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2.5 }}>
            Section 5 — Attachments
          </Typography>
          <Button
            component="label"
            variant="outlined"
            startIcon={<Iconify icon="solar:upload-bold" width={18} />}
          >
            Upload Files
            <input type="file" multiple hidden onChange={handleFileChange} />
          </Button>

          {files.length > 0 && (
            <Stack spacing={1} sx={{ mt: 2 }}>
              {files.map((file, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    bgcolor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: 1.5,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Iconify icon="solar:file-bold" width={20} sx={{ color: 'primary.main' }} />
                    <Box>
                      <Typography variant="caption" fontWeight={600} display="block">
                        {file.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(file.size / 1024).toFixed(1)} KB
                      </Typography>
                    </Box>
                  </Stack>
                  <IconButton size="small" color="error" onClick={() => removeFile(index)}>
                    <Iconify icon="solar:close-circle-bold" width={16} />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Stack>

      {/* Actions */}
      <Stack
        direction="row"
        justifyContent="flex-end"
        spacing={2}
        sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}
      >
        <Button type="button" variant="outlined" onClick={handleReset}>
          Reset
        </Button>
        <Button
          type="submit"
          variant="contained"
          size="large"
          sx={{ minWidth: 160, borderRadius: 2 }}
        >
          {submitLabel}
        </Button>
      </Stack>
    </Form>
  );
}
