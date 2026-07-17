'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller, FormProvider } from 'react-hook-form';

import {
  Box,
  Grid,
  Paper,
  Stack,
  Button,
  TextField,
  Typography,
  Autocomplete,
  CircularProgress,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, usePutRequest, useCreateRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

export default function ReceivedHistoryForm() {
  const router = useRouter();
  const beneficiaryId = useSearchParams().get('benId');
  const serviceId = useSearchParams().get('edit_service');
  const isEditMode = !!serviceId;

  // Fetch existing service data if in edit mode
  const { data: defaultServiceData, loading: defaultServiceLoading } = useGetRequest(
    serviceId ? `${endpoints.beneficiaries.services_received_history}${serviceId}/` : null
  );

  // Fetch projects for dropdown
  const { data: projectsData, loading: projectsLoading } = useGetRequest(
    `${endpoints.projects.projects}`
  );

  // Fetch employees/staff for dropdown
  const { data: staffData, loading: staffLoading } = useGetRequest(`${endpoints.employee.simple}`);

  const methods = useForm({
    defaultValues: {
      name: '',
      description: '',
      value: '',
      staff: null,
      status: null,
      project: null,
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = methods;

  // Set default values when data loads in edit mode
  useEffect(() => {
    if (defaultServiceData && isEditMode) {
      reset({
        name: defaultServiceData?.name || '',
        description: defaultServiceData?.description || '',
        value: defaultServiceData?.value || '',
        staff: defaultServiceData?.staff || null,
        status: defaultServiceData?.status || null,
        project: defaultServiceData?.project || null,
      });
    }
  }, [defaultServiceData, isEditMode, reset]);

  // Options
  const statusOptions = [
    { id: 'Completed', name: 'Completed' },
    { id: 'Ongoing', name: 'Ongoing' },
    { id: 'Planned', name: 'Planned' },
  ];

  const postService = useCreateRequest;
  const putService = usePutRequest;

  const onSubmit = async (data) => {
    try {
      // Format data for API with beneficiary from URL
      const formattedData = {
        beneficiary: beneficiaryId,
        name: data.name,
        description: data.description,
        value: data.value ? parseFloat(data.value) : null,
        staff: data.staff,
        status: data.status,
        project: data.project,
      };

      if (isEditMode) {
        await putService(
          `${endpoints.beneficiaries.services_received_history}${serviceId}/`,
          formattedData
        );
        toast.success('Service updated successfully!');
        await mutate(`${endpoints.beneficiaries.services_received_history}${serviceId}/`);
        await mutate(`${endpoints.beneficiaries.beneficiaries_database}`);
        await mutate(
          (key) =>
            typeof key === 'string' &&
            key.startsWith(endpoints.beneficiaries.beneficiaries_database),
          undefined,
          { revalidate: true }
        );
      } else {
        await postService(`${endpoints.beneficiaries.services_received_history}`, formattedData);
        toast.success('Service added successfully!');
      }

      router.back();
    } catch (error) {
      toast.error(`Error ${isEditMode ? 'updating' : 'adding'} service. Please try again.`);
      console.error('Form submission error:', error);
    }
  };

  if (!beneficiaryId && !isEditMode) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          py: 6,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper sx={{ borderRadius: 5, overflow: 'hidden', boxShadow: 3, p: 4 }}>
          <Typography variant="h6" color="error">
            Beneficiary ID is missing. Please select a beneficiary first.
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.back()}
            sx={{ mt: 2 }}
            startIcon={<Iconify icon="eva:arrow-back-fill" />}
          >
            Go Back
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 6,
        px: 2,
        background: 'linear-gradient(135deg, #F9FAFB, #E5E7EB)',
      }}
    >
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        {isEditMode && defaultServiceLoading ? (
          <Paper sx={{ borderRadius: 5, overflow: 'hidden', boxShadow: 3, p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress size={40} />
              <Typography sx={{ ml: 2 }}>Loading service data...</Typography>
            </Box>
          </Paper>
        ) : (
          <Paper sx={{ borderRadius: 5, overflow: 'hidden', boxShadow: 3 }}>
            <FormProvider {...methods}>
              <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 4 }}>
                <Stack spacing={3}>
                  {/* Header */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight={700}>
                      {isEditMode ? 'Edit Service Record' : 'Add Service Received'}
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Iconify icon="eva:arrow-back-fill" />}
                      onClick={() => router.back()}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        fontWeight: 600,
                        px: 3,
                      }}
                    >
                      Back
                    </Button>
                  </Stack>

                  {/* Service Information Section */}
                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      sx={{ mb: 2, color: 'primary.main' }}
                    >
                      Service Information
                    </Typography>
                    <Grid container spacing={3}>
                      {/* Service Name */}
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Controller
                          name="name"
                          control={control}
                          rules={{ required: 'Service name is required' }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Service Name *"
                              error={!!errors.name}
                              helperText={errors.name?.message}
                              placeholder="e.g., Medical Assistance, Education Support"
                            />
                          )}
                        />
                      </Grid>

                      {/* Value */}
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Controller
                          name="value"
                          control={control}
                          rules={{ required: 'Value is required' }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Value (BDT) *"
                              type="number"
                              error={!!errors.value}
                              helperText={errors.value?.message}
                              placeholder="0.00"
                            />
                          )}
                        />
                      </Grid>

                      {/* Description */}
                      <Grid size={{ xs: 12 }}>
                        <Controller
                          name="description"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Description"
                              multiline
                              rows={4}
                              placeholder="Enter service details..."
                            />
                          )}
                        />
                      </Grid>

                      {/* Staff */}
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Controller
                          name="staff"
                          control={control}
                          render={({ field }) => (
                            <Autocomplete
                              options={staffData || []}
                              getOptionLabel={(option) => option?.employee_name || ''}
                              loading={staffLoading}
                              value={
                                staffData?.find((item) => item?.employee_name === field.value) ||
                                null
                              }
                              isOptionEqualToValue={(option, value) =>
                                option?.employee_name === value?.employee_name
                              }
                              onChange={(event, value) =>
                                field.onChange(value?.employee_name || null)
                              }
                              renderOption={(props, option) => (
                                <li {...props} key={option.user?.id}>
                                  {option?.employee_name}
                                </li>
                              )}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Staff/Provider"
                                  placeholder="Select staff member"
                                />
                              )}
                            />
                          )}
                        />
                      </Grid>

                      {/* Project */}
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Controller
                          name="project"
                          control={control}
                          render={({ field }) => (
                            <Autocomplete
                              options={projectsData || []}
                              getOptionLabel={(option) => option?.name || ''}
                              loading={projectsLoading}
                              value={projectsData?.find((item) => item.id === field.value) || null}
                              isOptionEqualToValue={(option, value) => option.id === value?.id}
                              onChange={(event, value) => field.onChange(value?.id)}
                              renderOption={(props, option) => (
                                <li {...props} key={option.id}>
                                  {option.name}
                                </li>
                              )}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Project"
                                  placeholder="Select project"
                                />
                              )}
                            />
                          )}
                        />
                      </Grid>

                      {/* Status */}
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Controller
                          name="status"
                          control={control}
                          render={({ field }) => (
                            <Autocomplete
                              options={statusOptions}
                              getOptionLabel={(option) => option.name || ''}
                              value={statusOptions.find((item) => item.id === field.value) || null}
                              isOptionEqualToValue={(option, value) => option.id === value?.id}
                              onChange={(event, value) => field.onChange(value?.id)}
                              renderOption={(props, option) => (
                                <li {...props} key={option.id}>
                                  {option.name}
                                </li>
                              )}
                              renderInput={(params) => (
                                <TextField {...params} label="Status" placeholder="Select status" />
                              )}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Info Banner */}
                  {beneficiaryId && (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'info.lighter',
                        border: '1px solid',
                        borderColor: 'info.light',
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Iconify icon="eva:info-fill" width={20} sx={{ color: 'info.main' }} />
                        <Typography variant="body2" color="info.dark">
                          This service will be linked to Beneficiary ID:{' '}
                          <strong>{beneficiaryId}</strong>
                        </Typography>
                      </Stack>
                    </Box>
                  )}

                  {/* Action Buttons */}
                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => router.back()}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={isSubmitting}
                      sx={{
                        backgroundColor: 'primary.main',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                      }}
                    >
                      {isSubmitting ? (
                        <CircularProgress size={24} sx={{ color: 'white' }} />
                      ) : (
                        <Icon icon="mdi:content-save" width={20} height={20} />
                      )}
                      &nbsp;
                      {isSubmitting
                        ? isEditMode
                          ? 'Updating...'
                          : 'Saving...'
                        : isEditMode
                          ? 'Update Service'
                          : 'Save Service'}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </FormProvider>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
