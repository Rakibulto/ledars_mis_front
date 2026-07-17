'use client';

import dayjs from 'dayjs';
import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
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

import RHFAutocomplete from 'src/components/hook-form/rhf2-autocomplete';

export default function AddSupplierForm() {
  // const supplierId = new URLSearchParams(window.location.search).get('edit_supplier');

  const searchParams = useSearchParams();
  const supplierId = searchParams ? searchParams.get('edit_supplier') : null;
  const isEditMode = !!supplierId;

  const {
    data: defaultSupplierData,
    loading: defaultSupplierLoading,
    error: defaultSupplierError,
  } = useGetRequest(supplierId ? endpoints.procurement.supplier_by_id(supplierId) : null);
  //   console.log('Default Supplier Data:', defaultSupplierData);

  const router = useRouter();

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      category_id: null,
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      rating: null,
      total_orders: null,
      active_contracts: null,
      payment_terms: '',
      tax_id: '',
      status: null,
      registration_date: null,
    },
  });

  // Fetch categories if needed
  const {
    data: categoryData,
    loading: categoryLoading,
    error: categoryError,
  } = useGetRequest(`${endpoints.storeInventory.item_category}?level=main&status=active`);

  // Default values for edit mode
  useEffect(() => {
    if (defaultSupplierData) {
      const categoryOption =
        categoryData?.find((cat) => cat.name === defaultSupplierData.category) || null;
      // console.log('Mapped Category Option:', categoryOption?.name);
      reset({
        category_id: categoryOption?.id || '',
        name: defaultSupplierData.name || '',
        contact_person: defaultSupplierData.contact_person || '',
        phone: defaultSupplierData.phone || '',
        email: defaultSupplierData.email || '',
        address: defaultSupplierData.address || '',
        rating: defaultSupplierData.rating || null,
        total_orders: defaultSupplierData.total_orders || null,
        active_contracts: defaultSupplierData.active_contracts || null,
        payment_terms: defaultSupplierData.payment_terms || '',
        tax_id: defaultSupplierData.tax_id || '',
        status: defaultSupplierData.status || null,
        registration_date: defaultSupplierData.registration_date
          ? dayjs(defaultSupplierData.registration_date)
          : null,
      });
    }
  }, [defaultSupplierData, reset, categoryData]);

  const statusOptions = [
    { id: 'Active', name: 'Active' },
    { id: 'Inactive', name: 'Inactive' },
    { id: 'Blacklisted', name: 'Blacklisted' },
  ];

  const postSupplier = useCreateRequest;
  const putSupplier = usePutRequest;
  const onSubmit = async (data) => {
    // console.log('Form Data:', data);
    try {
      const payload = {
        ...data,
        registration_date: data.registration_date
          ? data.registration_date.format('YYYY-MM-DD')
          : null,
      };

      // console.log('Transformed Payload:', payload);

      //   console.log('Payload:', payload);/
      if (isEditMode) {
        await putSupplier(`${endpoints.procurement.suppliers}${supplierId}/`, payload);
        toast.success('Supplier updated successfully!');
        mutate(endpoints.procurement.supplier_by_id(supplierId)); // Update the specific supplier data in SWR cache
        mutate(endpoints.procurement.suppliers); // Update the suppliers list in SWR cache
      } else {
        await postSupplier(`${endpoints.procurement.suppliers}`, payload);
        toast.success('Supplier created successfully!');
        mutate(endpoints.procurement.suppliers); // Update the suppliers list in SWR cache
      }

      router.push(paths.dashboard.procurement.supplier_management);
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Error ${isEditMode ? 'updating' : 'creating'} supplier. Please try again.`);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          minHeight: '100vh',
          py: 6,
          px: 2,
          background: 'linear-gradient(135deg, #F9FAFB, #E5E7EB)',
        }}
      >
        <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
          {isEditMode && defaultSupplierLoading ? (
            <Paper sx={{ borderRadius: 5, overflow: 'hidden', boxShadow: 3, p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                <CircularProgress size={40} />
                <Typography sx={{ ml: 2 }}>Loading supplier data...</Typography>
              </Box>
            </Paper>
          ) : (
            <Paper sx={{ borderRadius: 5, overflow: 'hidden', boxShadow: 3 }}>
              <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 4 }}>
                <Stack spacing={3}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight={700}>
                      {isEditMode ? 'Edit Supplier' : 'Create New Supplier'}
                    </Typography>
                    <Link href={paths.dashboard.storeInventory.add_category} passHref>
                      <Button
                        variant="outlined"
                        // startIcon={<Iconify icon="mingcute:add-line" />}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          fontWeight: { xs: 500, sm: 600 },
                          px: { xs: 2, sm: 3 },
                          '&:hover': {
                            borderColor: 'primary.dark',
                            bgcolor: (theme) => `rgba(${theme.palette.primary.main}, 0.04)`,
                          },
                        }}
                      >
                        Manage Category
                      </Button>
                    </Link>
                  </Stack>

                  <Grid container spacing={3}>
                    {/* Category */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <RHFAutocomplete
                        name="category_id"
                        control={control}
                        label="Category"
                        options={categoryData || []}
                        loading={categoryLoading}
                        errors={errors}
                        sx={{ borderRadius: 2 }}
                      />
                    </Grid>

                    {/* Name */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name="name"
                        control={control}
                        rules={{ required: 'Name is required' }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Name"
                            error={!!errors.name}
                            helperText={errors.name?.message}
                          />
                        )}
                      />
                    </Grid>

                    {/* Contact Person */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name="contact_person"
                        control={control}
                        rules={{ required: 'Contact Person is required' }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Contact Person"
                            error={!!errors.contact_person}
                            helperText={errors.contact_person?.message}
                          />
                        )}
                      />
                    </Grid>

                    {/* Phone */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name="phone"
                        control={control}
                        rules={{ required: 'Phone is required' }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Phone"
                            error={!!errors.phone}
                            helperText={errors.phone?.message}
                          />
                        )}
                      />
                    </Grid>

                    {/* Email */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name="email"
                        control={control}
                        rules={{
                          required: 'Email is required',
                          pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' },
                        }}
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

                    {/* Address */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name="address"
                        control={control}
                        rules={{ required: 'Address is required' }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Address"
                            multiline
                            rows={2}
                            error={!!errors.address}
                            helperText={errors.address?.message}
                          />
                        )}
                      />
                    </Grid>

                    {/* Rating */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name="rating"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            value={field.value ?? ''}
                            fullWidth
                            label="Rating"
                            type="number"
                            inputProps={{ min: 0, max: 5, step: 0.1 }}
                            error={!!errors?.rating}
                            helperText={errors?.rating?.message}
                          />
                        )}
                      />
                    </Grid>

                    {/* Total Orders */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name="total_orders"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            value={field.value ?? ''}
                            fullWidth
                            label="Total Orders"
                            type="number"
                            error={!!errors.total_orders}
                            helperText={errors.total_orders?.message}
                          />
                        )}
                      />
                    </Grid>

                    {/* Active Contracts */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name="active_contracts"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            value={field.value ?? ''}
                            fullWidth
                            label="Active Contracts"
                            type="number"
                            error={!!errors.active_contracts}
                            helperText={errors.active_contracts?.message}
                          />
                        )}
                      />
                    </Grid>

                    {/* Payment Terms */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name="payment_terms"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Payment Terms"
                            value={field.value ?? ''}
                            error={!!errors.payment_terms}
                            helperText={errors.payment_terms?.message}
                          />
                        )}
                      />
                    </Grid>

                    {/* Tax ID */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name="tax_id"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Tax ID"
                            value={field.value ?? ''}
                            error={!!errors?.tax_id}
                            helperText={errors?.tax_id?.message}
                          />
                        )}
                      />
                    </Grid>

                    {/* Status */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name="status"
                        control={control}
                        rules={{ required: 'Status is required' }}
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
                              <TextField
                                {...params}
                                label="Status"
                                error={!!errors.status}
                                helperText={errors.status?.message}
                              />
                            )}
                          />
                        )}
                      />
                    </Grid>

                    {/* Registration Date */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name="registration_date"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            {...field}
                            label="Registration Date"
                            maxDate={dayjs()}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                fullWidth
                                error={!!errors.registration_date}
                                helperText={errors.registration_date?.message}
                              />
                            )}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>

                  <Stack direction="row" spacing={2}>
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
                          backgroundColor: 'primary.main',
                        },
                      }}
                    >
                      {isSubmitting ? (
                        <CircularProgress size={20} />
                      ) : isEditMode ? (
                        'Update Supplier'
                      ) : (
                        'Create Supplier'
                      )}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
