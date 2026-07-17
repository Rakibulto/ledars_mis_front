'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  Box,
  Grid,
  Card,
  Paper,
  Stack,
  Button,
  TextField,
  Typography,
  IconButton,
  Autocomplete,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, usePatchRequest, useCreateRequest } from 'src/actions/ledars-hook';

import { useAuthContext } from 'src/auth/hooks';

export default function AddPRForm() {
  const editId = useSearchParams().get('edit_pr');

  const addItems = useSearchParams().get('add_items') === 'true';
  const {
    data: prDetailsData,
    loading: prDetailsLoading,
    error: prDetailsError,
  } = useGetRequest(`${endpoints.procurement.purchase_requisitions}${editId}/`);

  // console.log('prDetailsData:', prDetailsData);
  const { user } = useAuthContext();
  const router = useRouter();

  // Fetch items data
  const {
    data: itemsData,
    loading: itemsDataLoading,
    error: itemsDataError,
  } = useGetRequest(`${endpoints.storeInventory.items}?status=active`);

  // Fetch departments data
  const { data: departmentsData, loading: departmentsLoading } = useGetRequest(
    `${endpoints.settings.department}`
  );

  // Fetch projects data
  const { data: projectsData, loading: projectsLoading } = useGetRequest(
    `${endpoints.projects.projects}`
  ); // Adjust endpoint as needed

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      pr_items: [{ item: null, quantity: 1 }],
      department: prDetailsData?.department_name || null,
      project: prDetailsData?.project_name || null,
      status: prDetailsData?.status || 'Draft',
      approver: prDetailsData?.approver || '',
    },
  });

  useEffect(() => {
    const departmentId =
      departmentsData?.find((dept) => dept.name === prDetailsData?.department_name)?.id || null;
    const projectId =
      projectsData?.find((proj) => proj.name === prDetailsData?.project_name)?.id || null;
    if (editId && prDetailsData) {
      reset({
        department: departmentId,
        project: projectId,
        status: prDetailsData.status,
        approver: prDetailsData.approver || '',
      });
    }
  }, [editId, prDetailsData, reset, departmentsData, projectsData, setValue]);
  const pr_items = watch('pr_items');

  // Add new item row
  const handleAddItem = () => {
    setValue('pr_items', [...pr_items, { item: null, quantity: 1 }]);
  };

  // Remove item row
  const handleRemoveItem = (index) => {
    if (pr_items.length > 1) {
      const newItems = pr_items.filter((_, i) => i !== index);
      setValue('pr_items', newItems);
    }
  };

  // Handle item change
  const handleItemChange = (index, field, value) => {
    const newItems = [...pr_items];
    newItems[index] = { ...newItems[index], [field]: value };
    setValue('pr_items', newItems);
  };

  const postPurchaseRequisition = useCreateRequest;
  const patchPurchaseRequisition = usePatchRequest;

  const onSubmit = async (data) => {
    // Transform data to match the required payload format
    const createPayload = {
      pr_items: data.pr_items?.map((item) => ({
        item: item.item?.id || item.item,
        quantity: item.quantity,
      })),
      department: data.department,
      project: data.project,
      status: 'Draft',
      created_by: user?.email || user?.id || 'Unknown User',
      approver: data.approver || '',
    };
    // console.log('createPayload:', createPayload);
    const updatePayload = {
      department: data.department,
      project: data.project,
      status: data.status || prDetailsData?.status || 'Draft',
      created_by: user?.email || user?.id || 'Unknown User',
      approver: data.approver || '',
    };

    try {
      if (editId) {
        await patchPurchaseRequisition(
          `${endpoints.procurement.purchase_requisitions}${editId}/`,
          updatePayload
        );
        toast.success('Purchase Requisition updated successfully!');
        router.push(`${paths.dashboard.procurement.purchase_requisitions}/view?pr_id=${editId}`);
        mutate(
          (key) =>
            typeof key === 'string' &&
            key.startsWith(`${endpoints.procurement.purchase_requisitions}${editId}/`),
          undefined,
          { revalidate: true }
        );
      } else {
        await postPurchaseRequisition(
          `${endpoints.procurement.purchase_requisitions}`,
          createPayload
        );
        toast.success('Purchase Requisition created successfully!');
        router.push(paths.dashboard.procurement.purchase_requisitions);
      }
    } catch (error) {
      // console.error('Error:', error);
      toast.error('Error creating purchase requisition. Please try again.');
    }
  };

  // Department options
  const departmentOptions =
    departmentsData?.map((dept) => ({
      id: dept.id,
      name: dept.name,
    })) || [];

  // Project options (adjust based on your actual data structure)
  const projectOptions =
    projectsData?.map((proj) => ({
      id: proj.id,
      name: proj.name,
    })) || [];

  const statusOptions = ['Draft', 'Submitted', 'Approved', 'Rejected', 'Pending'];

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
        <Paper sx={{ borderRadius: 5, overflow: 'hidden', boxShadow: 3 }}>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 4 }}>
            <Stack spacing={4}>
              {/* Header */}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" fontWeight={700} color="primary">
                  {editId ? 'Edit Purchase Requisition' : 'Create Purchase Requisition'}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => router.back()}
                  sx={{ border: 'none', borderRadius: '100%' }}
                >
                  <Icon icon="solar:close-circle-bold" width={20} />
                </Button>
              </Stack>

              {/* Basic Information Section */}
              <Card sx={{ p: 3, bgcolor: '#f5f5f5', border: '1px solid #e0e0e0' }}>
                <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                    }}
                  >
                    1
                  </Box>
                  <Typography variant="h6" fontWeight="bold">
                    Basic Information
                  </Typography>
                </Stack>

                <Grid container spacing={3}>
                  {/* Department */}
                  <Grid size={{ xs: 12, sm: editId ? 4 : 6 }}>
                    <Controller
                      name="department"
                      control={control}
                      rules={{ required: 'Department is required' }}
                      render={({ field }) => (
                        <Autocomplete
                          options={departmentOptions}
                          getOptionLabel={(option) => option.name || ''}
                          value={departmentOptions.find((item) => item.id === field.value) || null}
                          isOptionEqualToValue={(option, value) => option.id === value?.id}
                          onChange={(event, value) => field.onChange(value?.id)}
                          loading={departmentsLoading}
                          renderOption={(props, option) => (
                            <li {...props} key={option.id}>
                              {option.name}
                            </li>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Department *"
                              error={!!errors.department}
                              helperText={errors.department?.message}
                              // InputProps={{
                              //   ...params.InputProps,
                              //   endAdornment: (
                              //     <>
                              //       {departmentsLoading ? (
                              //         <CircularProgress color="inherit" size={20} />
                              //       ) : null}
                              //       {params.InputProps.endAdornment}
                              //     </>
                              //   ),
                              // }}
                            />
                          )}
                        />
                      )}
                    />
                  </Grid>

                  {/* Project */}
                  <Grid size={{ xs: 12, sm: editId ? 4 : 6 }}>
                    <Controller
                      name="project"
                      control={control}
                      rules={{ required: 'Project is required' }}
                      render={({ field }) => (
                        <Autocomplete
                          options={projectOptions}
                          getOptionLabel={(option) => option.name || ''}
                          value={projectOptions.find((item) => item.id === field.value) || null}
                          isOptionEqualToValue={(option, value) => option.id === value?.id}
                          onChange={(event, value) => field.onChange(value?.id)}
                          loading={projectsLoading}
                          renderOption={(props, option) => (
                            <li {...props} key={option.id}>
                              {option.name}
                            </li>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Project *"
                              error={!!errors.project}
                              helperText={errors.project?.message}
                              // InputProps={{
                              //   ...params.InputProps,
                              //   endAdornment: (
                              //     <>
                              //       {projectsLoading ? (
                              //         <CircularProgress color="inherit" size={20} />
                              //       ) : null}
                              //       {params.InputProps.endAdornment}
                              //     </>
                              //   ),
                              // }}
                            />
                          )}
                        />
                      )}
                    />
                  </Grid>
                  {editId && (
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Controller
                        name="status"
                        control={control}
                        rules={{ required: 'Status is required' }}
                        render={({ field }) => (
                          <Autocomplete
                            options={statusOptions}
                            getOptionLabel={(option) => option || ''}
                            value={statusOptions.find((item) => item === field.value) || null}
                            isOptionEqualToValue={(option, value) => option === value}
                            onChange={(event, value) => field.onChange(value)}
                            loading={projectsLoading}
                            renderOption={(props, option) => (
                              <li {...props} key={option}>
                                {option}
                              </li>
                            )}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Status *"
                                error={!!errors.status}
                                helperText={errors.status?.message}
                                // InputProps={{
                                //   ...params.InputProps,
                                //   endAdornment: (
                                //     <>
                                //       {projectsLoading ? (
                                //         <CircularProgress color="inherit" size={20} />
                                //       ) : null}
                                //       {params.InputProps.endAdornment}
                                //     </>
                                //   ),
                                // }}
                              />
                            )}
                          />
                        )}
                      />
                    </Grid>
                  )}
                </Grid>
              </Card>

              {/* Items Section */}
              {editId ? (
                ''
              ) : (
                <Card sx={{ p: 3, bgcolor: '#e3f2fd', border: '1px solid #90caf9' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                        }}
                      >
                        2
                      </Box>
                      <Typography variant="h6" fontWeight="bold">
                        Items Requested
                      </Typography>
                    </Stack>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Icon icon="eva:plus-fill" width={20} />}
                      onClick={handleAddItem}
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      Add Item
                    </Button>
                  </Stack>

                  <Stack spacing={2}>
                    {pr_items.map((prItem, index) => (
                      <Card
                        key={index}
                        sx={{
                          p: 2.5,
                          border: '1px solid #e0e0e0',
                          borderRadius: 2,
                          bgcolor: '#fff',
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          mb={2}
                        >
                          <Typography variant="subtitle2" fontWeight="bold" color="primary">
                            Item {index + 1}
                          </Typography>
                          {pr_items.length > 1 && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Icon icon="solar:trash-bin-trash-bold" width={18} />
                            </IconButton>
                          )}
                        </Stack>

                        <Grid container spacing={2}>
                          {/* Item Autocomplete */}
                          <Grid size={{ xs: 12, md: 8 }}>
                            <Controller
                              name={`pr_items.${index}.item`}
                              control={control}
                              rules={{ required: 'Item is required' }}
                              render={({ field }) => (
                                <Autocomplete
                                  options={itemsData || []}
                                  getOptionLabel={(option) =>
                                    option.item_name
                                      ? `${option.item_code} - ${option.item_name} (${option.category})`
                                      : ''
                                  }
                                  value={field.value || null}
                                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                                  onChange={(event, value) => {
                                    field.onChange(value);
                                    handleItemChange(index, 'item', value);
                                  }}
                                  loading={itemsDataLoading}
                                  renderOption={(props, option) => (
                                    <li {...props} key={option.id}>
                                      <Stack>
                                        <Typography variant="body2" fontWeight={600}>
                                          {option.item_code} - {option.item_name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          Category: {option.category} | Unit: {option.unit} | Stock:{' '}
                                          {option.current_stock}
                                        </Typography>
                                      </Stack>
                                    </li>
                                  )}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label="Select Item *"
                                      error={!!errors.pr_items?.[index]?.item}
                                      helperText={errors.pr_items?.[index]?.item?.message}
                                      InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                          <>
                                            {itemsDataLoading ? (
                                              <CircularProgress color="inherit" size={20} />
                                            ) : null}
                                            {params.InputProps.endAdornment}
                                          </>
                                        ),
                                      }}
                                    />
                                  )}
                                />
                              )}
                            />
                          </Grid>

                          {/* Quantity */}
                          <Grid size={{ xs: 12, md: 4 }}>
                            <Controller
                              name={`pr_items.${index}.quantity`}
                              control={control}
                              rules={{
                                required: 'Quantity is required',
                                min: { value: 1, message: 'Minimum quantity is 1' },
                              }}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  type="number"
                                  label="Quantity *"
                                  inputProps={{ min: 1 }}
                                  onChange={(e) => {
                                    const value = Number(e.target.value);
                                    field.onChange(value);
                                    handleItemChange(index, 'quantity', value);
                                  }}
                                  error={!!errors.pr_items?.[index]?.quantity}
                                  helperText={errors.pr_items?.[index]?.quantity?.message}
                                />
                              )}
                            />
                          </Grid>
                        </Grid>

                        {/* Display selected item details */}
                        {prItem?.item && (
                          <Box
                            sx={{
                              mt: 2,
                              p: 2,
                              bgcolor: '#f5f5f5',
                              borderRadius: 1,
                              border: '1px dashed #ccc',
                            }}
                          >
                            <Grid container spacing={1}>
                              <Grid size={{ xs: 6, sm: 4 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Unit
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                  {prItem.item.unit}
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 6, sm: 4 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Unit Price
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                  ৳{prItem.item.unit_price}
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 6, sm: 4 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Current Stock
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                  {prItem.item.current_stock}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Box>
                        )}
                      </Card>
                    ))}
                  </Stack>
                </Card>
              )}

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    backgroundColor: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : editId ? (
                    'Update Requisition'
                  ) : (
                    'Create Requisition'
                  )}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
