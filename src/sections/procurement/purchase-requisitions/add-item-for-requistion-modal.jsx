'use client';

import React from 'react';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';

import {
  Box,
  Grid,
  Card,
  Stack,
  Button,
  Dialog,
  TextField,
  Typography,
  IconButton,
  Autocomplete,
  CircularProgress,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, useCreateRequest } from 'src/actions/ledars-hook';

export default function AddItemsForRequisitionModal({ pr_number, onClose, onOpen }) {
  const prId = useSearchParams().get('prId');
  // console.log('pr number pr Number:', pr_number);

  // Fetch items data
  const {
    data: itemsData,
    loading: itemsDataLoading,
    error: itemsDataError,
  } = useGetRequest(`${endpoints.storeInventory.items}?status=active`);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      pr_items: [{ item: null, quantity: 1, pr_number }],
    },
  });

  const pr_items = watch('pr_items');

  // Add new item row
  const handleAddItem = () => {
    setValue('pr_items', [...pr_items, { item: null, quantity: 1, pr_number }]);
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

  const onSubmit = async (data) => {
    // Transform data to match the required payload format
    const createPayload = data.pr_items.map((item) => ({
      pr_number,
      item: item.item?.id,
      quantity: item.quantity,
    }));

    try {
      await postPurchaseRequisition(
        `${endpoints.procurement.items_for_requisition}`,
        createPayload
      );
      toast.success('Items added successfully!');
      mutate(`${endpoints.procurement.purchase_requisitions}${prId}/`);
      mutate(
        (key) =>
          typeof key === 'string' && key.startsWith(endpoints.procurement.purchase_requisitions),
        undefined,
        { revalidate: true }
      );
      reset();
      onClose?.();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error adding items. Please try again.');
    }
  };

  return (
    <Dialog onClose={onClose} open={onOpen}>
      <Typography>{pr_number}</Typography>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1300,
          p: 2,
        }}
        onClick={onClose}
      >
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            maxWidth: 800,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Card sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Add Items to Purchase Requisition
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Icon icon="eva:plus-fill" width={16} />}
                    onClick={handleAddItem}
                    sx={{ textTransform: 'none' }}
                  >
                    Add Item
                  </Button>
                </Stack>

                <Stack spacing={2}>
                  {pr_items.map((prItem, index) => (
                    <Card
                      key={index}
                      sx={{
                        p: 2,
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        bgcolor: '#fff',
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={2}
                      >
                        <Typography variant="subtitle2" fontWeight={600} color="primary">
                          Item {index + 1}
                        </Typography>
                        {pr_items.length > 1 && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Icon icon="solar:trash-bin-trash-bold" width={16} />
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

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={onClose}
                  disabled={isSubmitting}
                  sx={{ textTransform: 'none' }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{ textTransform: 'none' }}
                >
                  {isSubmitting ? <CircularProgress size={16} color="inherit" /> : 'Add Items'}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
