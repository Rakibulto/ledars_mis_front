'use client';

import dayjs from 'dayjs';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller, FormProvider } from 'react-hook-form';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
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

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, usePutRequest, useCreateRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const getAutocompleteLabel = (option) => {
  if (typeof option === 'string') {
    return option;
  }

  if (!option || Array.isArray(option)) {
    return '';
  }

  return option.label || option.name || option.value || option.id || '';
};

export default function AddDatabaseForm() {
  const router = useRouter();
  const beneficiaryId = useSearchParams().get('editId');
  // console.log('Beneficiary ID from query params:', beneficiaryId);
  const isEditMode = !!beneficiaryId;

  // Fetch existing beneficiary data if in edit mode
  const {
    data: defaultBeneficiaryData,
    loading: defaultBeneficiaryLoading,
    error: defaultBeneficiaryError,
  } = useGetRequest(
    beneficiaryId ? endpoints.beneficiaries.beneficiary_by_id(beneficiaryId) : null
  );

  // Fetch projects for dropdown
  const { data: projectsData, loading: projectsLoading } = useGetRequest(
    `${endpoints.projects.projects}`
  );

  const methods = useForm({
    defaultValues: {
      name: '',
      father_name: '',
      mother_name: '',
      age: '',
      date_of_birth: null,
      sex: null,
      nid: '',
      contact: '',
      email: '',
      address: '',
      division: null,
      district: '',
      upazila: '',
      union: '',
      village: '',
      vulnerability_type: [],
      household_size: '',
      monthly_income: '',
      education_level: '',
      occupation: '',
      marital_status: null,
      registration_date: null,
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
    if (defaultBeneficiaryData && isEditMode) {
      reset({
        name: defaultBeneficiaryData?.name || '',
        father_name: defaultBeneficiaryData?.father_name || '',
        mother_name: defaultBeneficiaryData?.mother_name || '',
        age: defaultBeneficiaryData?.age || '',
        date_of_birth: defaultBeneficiaryData?.date_of_birth
          ? dayjs(defaultBeneficiaryData.date_of_birth)
          : null,
        sex: defaultBeneficiaryData?.sex || null,
        nid: defaultBeneficiaryData?.nid || '',
        contact: defaultBeneficiaryData?.contact || '',
        email: defaultBeneficiaryData?.email || '',
        address: defaultBeneficiaryData?.address || '',
        division: defaultBeneficiaryData?.division || null,
        district: defaultBeneficiaryData?.district || '',
        upazila: defaultBeneficiaryData?.upazila || '',
        union: defaultBeneficiaryData?.union || '',
        village: defaultBeneficiaryData?.village || '',
        vulnerability_type: defaultBeneficiaryData?.vulnerability_type || [],
        household_size: defaultBeneficiaryData?.household_size || '',
        monthly_income: defaultBeneficiaryData?.monthly_income || '',
        education_level: defaultBeneficiaryData?.education_level || '',
        occupation: defaultBeneficiaryData?.occupation || '',
        marital_status: defaultBeneficiaryData?.marital_status || null,
        registration_date: defaultBeneficiaryData?.registration_date
          ? dayjs(defaultBeneficiaryData.registration_date)
          : null,
        status: defaultBeneficiaryData?.status || null,
        project: defaultBeneficiaryData?.project || null,
      });
    }
  }, [defaultBeneficiaryData, isEditMode, reset]);

  // Options
  const genderOptions = [
    { id: 'Male', name: 'Male' },
    { id: 'Female', name: 'Female' },
    { id: 'Other', name: 'Other' },
  ];

  const divisionOptions = [
    { id: 'Dhaka', name: 'Dhaka' },
    { id: 'Chattogram', name: 'Chattogram' },
    { id: 'Khulna', name: 'Khulna' },
    { id: 'Rajshahi', name: 'Rajshahi' },
    { id: 'Barishal', name: 'Barishal' },
    { id: 'Sylhet', name: 'Sylhet' },
    { id: 'Rangpur', name: 'Rangpur' },
    { id: 'Mymensingh', name: 'Mymensingh' },
  ];

  const maritalStatusOptions = [
    { id: 'Single', name: 'Single' },
    { id: 'Married', name: 'Married' },
    { id: 'Divorced', name: 'Divorced' },
    { id: 'Widowed', name: 'Widowed' },
  ];

  const statusOptions = [
    { id: 'Active', name: 'Active' },
    { id: 'Inactive', name: 'Inactive' },
    { id: 'Completed', name: 'Completed' },
  ];

  const vulnerabilityTypeOptions = [
    { value: 'Extreme Poverty', label: 'Extreme Poverty' },
    { value: 'Disability', label: 'Disability' },
    { value: 'Elderly', label: 'Elderly' },
    { value: 'Orphan', label: 'Orphan' },
    { value: 'Widowed', label: 'Widowed' },
    { value: 'Chronic Illness', label: 'Chronic Illness' },
    { value: 'Gender-Based Violence', label: 'Gender-Based Violence' },
    { value: 'Natural Disaster Affected', label: 'Natural Disaster Affected' },
    { value: 'Landless', label: 'Landless' },
    { value: 'Food Insecurity', label: 'Food Insecurity' },
  ];

  const projectOptions = Array.isArray(projectsData)
    ? projectsData
    : Array.isArray(projectsData?.results)
      ? projectsData.results
      : [];

  const postBeneficiary = useCreateRequest;
  const putBeneficiary = usePutRequest;

  const onSubmit = async (data) => {
    console.log('Form Data:', data);
    try {
      // Format data for API
      const formattedData = {
        ...data,
        date_of_birth: data.date_of_birth ? dayjs(data.date_of_birth).format('YYYY-MM-DD') : null,
        registration_date: data.registration_date
          ? dayjs(data.registration_date).format('YYYY-MM-DD')
          : null,
        age: data.age ? parseInt(data.age, 10) : null,
        household_size: data.household_size ? parseInt(data.household_size, 10) : null,
        monthly_income: data.monthly_income ? parseFloat(data.monthly_income) : null,
      };

      if (isEditMode) {
        await putBeneficiary(
          `${endpoints.beneficiaries.beneficiaries_database}${beneficiaryId}/`,
          formattedData
        );
        toast.success('Beneficiary updated successfully!');
        await mutate(endpoints.beneficiaries.beneficiary_by_id(beneficiaryId));
      } else {
        await postBeneficiary(`${endpoints.beneficiaries.beneficiaries_database}`, formattedData);
        toast.success('Beneficiary created successfully!');
      }

      router.push(`${paths.dashboard.beneficiaries.database}`);
    } catch (error) {
      toast.error(`Error ${isEditMode ? 'updating' : 'creating'} beneficiary. Please try again.`);
      console.error('Form submission error:', error);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 6,
        px: 2,
        background: 'linear-gradient(135deg, #F9FAFB, #E5E7EB)',
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {isEditMode && defaultBeneficiaryLoading ? (
          <Paper sx={{ borderRadius: 5, overflow: 'hidden', boxShadow: 3, p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress size={40} />
              <Typography sx={{ ml: 2 }}>Loading beneficiary data...</Typography>
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
                      {isEditMode ? 'Edit Beneficiary' : 'Add New Beneficiary'}
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

                  {/* Personal Information Section */}
                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      sx={{ mb: 2, color: 'primary.main' }}
                    >
                      Personal Information
                    </Typography>
                    <Grid container spacing={3}>
                      {/* Name */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="name"
                          control={control}
                          rules={{ required: 'Name is required' }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Name *"
                              error={!!errors.name}
                              helperText={errors.name?.message}
                            />
                          )}
                        />
                      </Grid>

                      {/* Father's Name */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="father_name"
                          control={control}
                          render={({ field }) => (
                            <TextField {...field} fullWidth label="Father's Name" />
                          )}
                        />
                      </Grid>

                      {/* Mother's Name */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="mother_name"
                          control={control}
                          render={({ field }) => (
                            <TextField {...field} fullWidth label="Mother's Name" />
                          )}
                        />
                      </Grid>

                      {/* Date of Birth */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="date_of_birth"
                          control={control}
                          render={({ field }) => (
                            <DatePicker
                              {...field}
                              label="Date of Birth"
                              format="DD/MM/YYYY"
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  error: !!errors.date_of_birth,
                                  helperText: errors.date_of_birth?.message,
                                },
                              }}
                            />
                          )}
                        />
                      </Grid>

                      {/* Age */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="age"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Age"
                              type="number"
                              error={!!errors.age}
                              helperText={errors.age?.message}
                            />
                          )}
                        />
                      </Grid>

                      {/* Gender */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="sex"
                          control={control}
                          rules={{ required: 'Gender is required' }}
                          render={({ field }) => (
                            <Autocomplete
                              options={genderOptions}
                              getOptionLabel={(option) => option.name || ''}
                              value={genderOptions.find((item) => item.id === field.value) || null}
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
                                  label="Gender *"
                                  error={!!errors.sex}
                                  helperText={errors.sex?.message}
                                />
                              )}
                            />
                          )}
                        />
                      </Grid>

                      {/* Marital Status */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="marital_status"
                          control={control}
                          render={({ field }) => (
                            <Autocomplete
                              options={maritalStatusOptions}
                              getOptionLabel={(option) => option.name || ''}
                              value={
                                maritalStatusOptions.find((item) => item.id === field.value) || null
                              }
                              isOptionEqualToValue={(option, value) => option.id === value?.id}
                              onChange={(event, value) => field.onChange(value?.id)}
                              renderOption={(props, option) => (
                                <li {...props} key={option.id}>
                                  {option.name}
                                </li>
                              )}
                              renderInput={(params) => (
                                <TextField {...params} label="Marital Status" />
                              )}
                            />
                          )}
                        />
                      </Grid>

                      {/* NID */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="nid"
                          control={control}
                          render={({ field }) => (
                            <TextField {...field} fullWidth label="National ID (NID)" />
                          )}
                        />
                      </Grid>

                      {/* Education Level */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="education_level"
                          control={control}
                          render={({ field }) => (
                            <TextField {...field} fullWidth label="Education Level" />
                          )}
                        />
                      </Grid>

                      {/* Occupation */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="occupation"
                          control={control}
                          render={({ field }) => (
                            <TextField {...field} fullWidth label="Occupation" />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Contact Information Section */}
                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      sx={{ mb: 2, color: 'primary.main' }}
                    >
                      Contact Information
                    </Typography>
                    <Grid container spacing={3}>
                      {/* Contact */}
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Controller
                          name="contact"
                          control={control}
                          render={({ field }) => (
                            <TextField {...field} fullWidth label="Contact Number" />
                          )}
                        />
                      </Grid>

                      {/* Email */}
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Controller
                          name="email"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Email"
                              type="email"
                              error={!!errors.email}
                              helperText={errors.email?.message}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Location Information Section */}
                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      sx={{ mb: 2, color: 'primary.main' }}
                    >
                      Location Information
                    </Typography>
                    <Grid container spacing={3}>
                      {/* Division */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="division"
                          control={control}
                          render={({ field }) => (
                            <Autocomplete
                              options={divisionOptions}
                              getOptionLabel={(option) => option.name || ''}
                              value={
                                divisionOptions.find((item) => item.id === field.value) || null
                              }
                              isOptionEqualToValue={(option, value) => option.id === value?.id}
                              onChange={(event, value) => field.onChange(value?.id)}
                              renderOption={(props, option) => (
                                <li {...props} key={option.id}>
                                  {option.name}
                                </li>
                              )}
                              renderInput={(params) => <TextField {...params} label="Division" />}
                            />
                          )}
                        />
                      </Grid>

                      {/* District */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="district"
                          control={control}
                          render={({ field }) => (
                            <TextField {...field} fullWidth label="District" />
                          )}
                        />
                      </Grid>

                      {/* Upazila */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="upazila"
                          control={control}
                          render={({ field }) => <TextField {...field} fullWidth label="Upazila" />}
                        />
                      </Grid>

                      {/* Union */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="union"
                          control={control}
                          render={({ field }) => <TextField {...field} fullWidth label="Union" />}
                        />
                      </Grid>

                      {/* Village */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="village"
                          control={control}
                          render={({ field }) => <TextField {...field} fullWidth label="Village" />}
                        />
                      </Grid>

                      {/* Address */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="address"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Full Address"
                              multiline
                              rows={1}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Household & Vulnerability Information Section */}
                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      sx={{ mb: 2, color: 'primary.main' }}
                    >
                      Household & Vulnerability Information
                    </Typography>
                    <Grid container spacing={3}>
                      {/* Household Size */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="household_size"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Household Size"
                              type="number"
                              error={!!errors.household_size}
                              helperText={errors.household_size?.message}
                            />
                          )}
                        />
                      </Grid>

                      {/* Monthly Income */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="monthly_income"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Monthly Income (BDT)"
                              type="number"
                              error={!!errors.monthly_income}
                              helperText={errors.monthly_income?.message}
                            />
                          )}
                        />
                      </Grid>

                      {/* Vulnerability Type (Multiple Select) */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="vulnerability_type"
                          control={control}
                          render={({ field }) => {
                            const selectedValues = Array.isArray(field.value) ? field.value : [];
                            const selectedOptions = selectedValues
                              .map((value) => {
                                if (value && typeof value === 'object' && !Array.isArray(value)) {
                                  return value;
                                }

                                return (
                                  vulnerabilityTypeOptions.find(
                                    (option) => option.value === value
                                  ) || null
                                );
                              })
                              .filter(Boolean);

                            return (
                              <Autocomplete
                                multiple
                                options={vulnerabilityTypeOptions}
                                getOptionLabel={getAutocompleteLabel}
                                value={selectedOptions}
                                isOptionEqualToValue={(option, value) =>
                                  option.value === value?.value
                                }
                                onChange={(_, value) => {
                                  field.onChange(value.map((item) => item.value));
                                }}
                                renderOption={(props, option) => (
                                  <li {...props} key={option.value}>
                                    {option.label}
                                  </li>
                                )}
                                renderInput={(params) => (
                                  <TextField {...params} fullWidth label="Vulnerability Type" />
                                )}
                              />
                            );
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Program Information Section */}
                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      sx={{ mb: 2, color: 'primary.main' }}
                    >
                      Program Information
                    </Typography>
                    <Grid container spacing={3}>
                      {/* Project */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="project"
                          control={control}
                          render={({ field }) => (
                            <Autocomplete
                              options={projectOptions}
                              getOptionLabel={getAutocompleteLabel}
                              loading={projectsLoading}
                              value={projectOptions.find((item) => item.id === field.value) || null}
                              isOptionEqualToValue={(option, value) => option.id === value?.id}
                              onChange={(event, value) => field.onChange(value?.id)}
                              renderOption={(props, option) => (
                                <li {...props} key={option.id}>
                                  {option.name}
                                </li>
                              )}
                              renderInput={(params) => <TextField {...params} label="Project" />}
                            />
                          )}
                        />
                      </Grid>

                      {/* Registration Date */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Controller
                          name="registration_date"
                          control={control}
                          render={({ field }) => (
                            <DatePicker
                              {...field}
                              label="Registration Date"
                              format="DD/MM/YYYY"
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  error: !!errors.registration_date,
                                  helperText: errors.registration_date?.message,
                                },
                              }}
                            />
                          )}
                        />
                      </Grid>

                      {/* Status */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
                              renderInput={(params) => <TextField {...params} label="Status" />}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </Box>

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
                        <Icon icon="mdi:account-plus" width={20} height={20} />
                      )}
                      &nbsp;
                      {isSubmitting
                        ? isEditMode
                          ? 'Updating...'
                          : 'Creating...'
                        : isEditMode
                          ? 'Update Beneficiary'
                          : 'Create Beneficiary'}
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
