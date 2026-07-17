'use client';

import dayjs from 'dayjs';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
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

import {
  useGetRequest,
  usePutRequest,
  usePatchRequest,
  useCreateRequest,
} from 'src/actions/ledars-hook';

export default function PurchaseOrderForm() {
  // const poId = new URLSearchParams(window.location.search).get('po_id');
  const editPoId = useSearchParams().get('edit_po');
  const isEditMode = !!editPoId;

  const {
    data: defaultPoData,
    loading: defaultPoLoading,
    error: defaultPoError,
  } = useGetRequest(editPoId ? endpoints.procurement.purchase_order_by_id(editPoId) : null);

  const router = useRouter();

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      supplier_id: null,
      po_items: [{ item: null, quantity: 1 }],
      delivery_date: null,
      approval_status: 'Draft',
    },
  });

  // Fetch suppliers list
  const {
    data: supplierData,
    loading: supplierLoading,
    error: supplierError,
  } = useGetRequest(`${endpoints.procurement.suppliers}`);
  // console.log('Supplier Data:', supplierData);

  // Fetch items data
  const {
    data: itemsData,
    loading: itemsDataLoading,
    error: itemsDataError,
  } = useGetRequest(`${endpoints.storeInventory.items}?status=active`);

  //  supplier option for autocomplete and value pass id and lavel name
  // delevery data hobe 2085-08-27 ai formate e
  // Default values for edit mode
  useEffect(() => {
    if (defaultPoData) {
      // Find supplier by name since the API returns supplier_name
      const supplierOption =
        supplierData?.find((sup) => sup.name === defaultPoData.supplier_name) || null;

      reset({
        supplier_id: supplierOption?.id || null,
        delivery_date: defaultPoData.delivery_date ? dayjs(defaultPoData.delivery_date) : null,
        approval_status: defaultPoData.approval_status || 'Pending Approval',
      });
    }
  }, [defaultPoData, reset, supplierData]);

  const po_items = watch('po_items') || [{ item: null, quantity: 1 }];
  // console.log('Watched po_items:', po_items);

  // Add new item row
  const handleAddItem = () => {
    setValue('po_items', [...po_items, { item: null, quantity: 1 }]);
  };

  // Remove item row
  const handleRemoveItem = (index) => {
    if (po_items.length > 1) {
      const newItems = po_items.filter((_, i) => i !== index);
      setValue('po_items', newItems);
    }
  };

  // Handle item change
  const handleItemChange = (index, field, value) => {
    const newItems = [...po_items];
    newItems[index] = { ...newItems[index], [field]: value };
    setValue('po_items', newItems);
  };

  const approvalStatusOptions = [
    { id: 'Draft', name: 'Draft' },
    { id: 'Pending Approval', name: 'Pending Approval' },
    { id: 'Approved', name: 'Approved' },
    { id: 'Sent to Supplier', name: 'Sent to Supplier' },
    { id: 'Partially Received', name: 'Partially Received' },
    { id: 'Completed', name: 'Completed' },
    { id: 'Cancelled', name: 'Cancelled' },
  ];

  const postPurchaseOrder = useCreateRequest;
  const putPurchaseOrder = usePutRequest;
  const patchPurchaseOrder = usePatchRequest;

  const onSubmit = async (data) => {
    // console.log('Form Data:', data);
    try {
      const createPayload = {
        supplier: data.supplier_id,
        po_items: data?.po_items?.map((item) => ({
          item: item.item?.id || item.item,
          quantity: item.quantity,
        })),
        delivery_date: data.delivery_date ? data.delivery_date.format('YYYY-MM-DD') : null,
        approval_status: data.approval_status,
      };
      const patchPayload = {
        supplier: data.supplier_id,
        delivery_date: data.delivery_date ? data.delivery_date.format('YYYY-MM-DD') : null,
        approval_status: data.approval_status,
      };

      const payload = isEditMode ? patchPayload : createPayload;

      if (isEditMode) {
        // console.log('payload for update', payload);
        await patchPurchaseOrder(`${endpoints.procurement.purchase_orders}${editPoId}/`, payload);
        toast.success('Purchase order updated successfully!');
        mutate(`${endpoints.procurement.purchase_orders}${editPoId}/`);
        mutate(endpoints.procurement.purchase_orders);
        mutate(endpoints.procurement.purchase_order_summary);
        router.push(`${paths.dashboard.procurement.purchase_orders}/details/?po_id=${editPoId}`);
      } else {
        await postPurchaseOrder(endpoints.procurement.purchase_orders, payload);
        toast.success('Purchase order created successfully!');
        mutate(endpoints.procurement.purchase_orders);
        mutate(endpoints.procurement.purchase_order_summary);
        router.push(paths.dashboard.procurement.purchase_orders);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(
        `Error ${isEditMode ? 'updating' : 'creating'} purchase order. Please try again.`
      );
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
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Paper sx={{ borderRadius: 5, overflow: 'hidden', boxShadow: 3 }}>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 4 }}>
              <Stack spacing={4}>
                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h5" fontWeight={700} color="primary">
                    {editPoId ? 'Edit Purchase Order' : 'Create Purchase Order'}
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
                    {/* Supplier */}
                    <Grid size={{ xs: 12, sm: editPoId ? 4 : 6 }}>
                      <Controller
                        name="supplier_id"
                        control={control}
                        rules={{ required: 'Supplier is required' }}
                        render={({ field }) => (
                          <Autocomplete
                            options={supplierData || []}
                            getOptionLabel={(option) => option.name || ''}
                            value={supplierData?.find((item) => item.id === field.value) || null}
                            isOptionEqualToValue={(option, value) => option.id === value?.id}
                            onChange={(event, value) => field.onChange(value?.id)}
                            loading={supplierLoading}
                            renderOption={(props, option) => (
                              <li {...props} key={option.id}>
                                {option.name}
                              </li>
                            )}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Supplier *"
                                error={!!errors.supplier_id}
                                helperText={errors.supplier_id?.message}
                                InputProps={{
                                  ...params.InputProps,
                                  endAdornment: (
                                    <>
                                      {supplierLoading ? (
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

                    {/* Delivery Date */}
                    <Grid size={{ xs: 12, sm: editPoId ? 4 : 6 }}>
                      <Controller
                        name="delivery_date"
                        control={control}
                        rules={{ required: 'Delivery date is required' }}
                        render={({ field }) => (
                          <DatePicker
                            {...field}
                            label="Delivery Date *"
                            format="YYYY-MM-DD"
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: !!errors.delivery_date,
                                helperText: errors.delivery_date?.message,
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>

                    {/* Approval Status */}
                    {editPoId && (
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Controller
                          name="approval_status"
                          control={control}
                          rules={{ required: 'Approval status is required' }}
                          render={({ field }) => (
                            <Autocomplete
                              options={approvalStatusOptions}
                              getOptionLabel={(option) => option.name || ''}
                              value={
                                approvalStatusOptions.find((item) => item.id === field.value) ||
                                null
                              }
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
                                  label="Approval Status *"
                                  error={!!errors.approval_status}
                                  helperText={errors.approval_status?.message}
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
                {editPoId ? (
                  ''
                ) : (
                  <Card sx={{ p: 3, bgcolor: '#e3f2fd', border: '1px solid #90caf9' }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={3}
                    >
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
                          {po_items?.length > 0 ? po_items.length : 1}
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
                      {po_items?.map((poItem, index) => (
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
                            {po_items.length > 1 && (
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
                                name={`po_items.${index}.item`}
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
                                    isOptionEqualToValue={(option, value) =>
                                      option.id === value?.id
                                    }
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
                                            Category: {option.category} | Unit: {option.unit} |
                                            Stock: {option.current_stock}
                                          </Typography>
                                        </Stack>
                                      </li>
                                    )}
                                    renderInput={(params) => (
                                      <TextField
                                        {...params}
                                        label="Select Item *"
                                        error={!!errors.po_items?.[index]?.item}
                                        helperText={errors.po_items?.[index]?.item?.message}
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
                                name={`po_items.${index}.quantity`}
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
                                    error={!!errors.po_items?.[index]?.quantity}
                                    helperText={errors.po_items?.[index]?.quantity?.message}
                                  />
                                )}
                              />
                            </Grid>
                          </Grid>

                          {/* Display selected item details */}
                          {poItem?.item && (
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
                                    {poItem.item.unit}
                                  </Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 4 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Unit Price
                                  </Typography>
                                  <Typography variant="body2" fontWeight={600}>
                                    ৳{poItem.item.unit_price}
                                  </Typography>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 4 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Current Stock
                                  </Typography>
                                  <Typography variant="body2" fontWeight={600}>
                                    {poItem.item.current_stock}
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
                    ) : isEditMode ? (
                      'Update Purchase Order'
                    ) : (
                      'Create Purchase Order'
                    )}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Paper>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
