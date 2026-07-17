'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { useForm, Controller } from 'react-hook-form';
import React, { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  Box,
  Grid,
  Card,
  Stack,
  Button,
  Avatar,
  Divider,
  TextField,
  IconButton,
  Typography,
  CardContent,
  Autocomplete,
  CircularProgress,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  usePutRequest,
  usePatchRequest,
  useCreateRequest,
  useDeleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import RHFAutocomplete from 'src/components/hook-form/rhf2-autocomplete';

const PRODUCT_GROUP_OPTIONS = [
  { id: 'consumable', name: 'Consumable' },
  { id: 'asset', name: 'Asset' },
];

const STATUS_OPTIONS = [
  { id: 'Active', name: 'Active' },
  { id: 'Inactive', name: 'Inactive' },
];

const ASSET_TYPE_OPTIONS = [
  { id: 'Fixed Asset', name: 'Fixed Asset' },
  { id: 'Consumable Asset', name: 'Consumable Asset' },
];

const mapProductTypeToGroup = (productType) =>
  productType === 'consumable' ? 'consumable' : 'asset';
const mapGroupToProductType = (group) => (group === 'consumable' ? 'consumable' : 'storable');

export default function CreateItemForm() {
  const itemId = useSearchParams().get('edit_item');
  const isEditMode = Boolean(itemId);
  const router = useRouter();

  const [mainCategoryId, setMainCategoryId] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [locationStockRecord, setLocationStockRecord] = useState(null);

  const { data: officeLocationData, loading: officeLocationLoading } = useGetRequest(
    endpoints.procurement_management.office_management
  );
  const officeLocations = useMemo(() => {
    const raw = Array.isArray(officeLocationData)
      ? officeLocationData
      : officeLocationData?.results || [];
    return raw.filter((o) => o.type === 'office' || o.type === 'warehouse');
  }, [officeLocationData]);

  const {
    data: defaultItemData,
    loading: defaultItemLoading,
    error: defaultItemError,
  } = useGetRequest(itemId ? endpoints.storeInventory.item_by_id(itemId) : null);

  const { data: locationStocksData } = useGetRequest(
    itemId ? `${endpoints.storeInventory.location_stocks}?product=${itemId}` : null
  );

  const { data: mainCategoryData, loading: mainCategoryLoading } = useGetRequest(
    `${endpoints.storeInventory.item_category}?level=main&status=active`
  );
  const { data: subcategoryData, loading: subcategoryLoading } = useGetRequest(
    mainCategoryId
      ? `${endpoints.storeInventory.item_category}?parent=${mainCategoryId}&status=active`
      : null
  );
  const { data: supplierData, loading: supplierLoading } = useGetRequest(
    endpoints.storeInventory.supplier
  );
  const { data: uomData, loading: uomLoading } = useGetRequest(endpoints.storeInventory.uom);

  const suppliers = useMemo(
    () => (Array.isArray(supplierData) ? supplierData : supplierData?.results || []),
    [supplierData]
  );
  const uomOptions = useMemo(
    () => (Array.isArray(uomData) ? uomData : uomData?.results || []),
    [uomData]
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      item_name: '',
      product_group: 'asset',
      asset_type: 'Fixed Asset',
      description: '',
      barcode: '',
      category: null,
      subcategory: null,
      unit: null,
      unit_price: '',
      sale_price: '',
      reorder_level: '',
      current_stock: '',
      maximum_stock: '',
      office_location: null,
      supplier: null,
      specifications: '',
      status: 'Active',
    },
  });

  const watchedCategory = watch('category');

  useEffect(() => {
    if (watchedCategory) {
      setMainCategoryId(watchedCategory);
      if (!isEditMode) {
        setValue('subcategory', null);
      }
    } else {
      setMainCategoryId(null);
    }
  }, [watchedCategory, setValue, isEditMode]);

  useEffect(() => {
    if (!defaultItemData) return;

    // Extract location-stock record (first one for this item)
    const lsResults = Array.isArray(locationStocksData)
      ? locationStocksData
      : locationStocksData?.results || [];
    const firstLs = lsResults[0] || null;
    setLocationStockRecord(firstLs);

    reset({
      item_name: defaultItemData?.item_name || '',
      product_group: mapProductTypeToGroup(defaultItemData?.product_type),
      asset_type: defaultItemData?.asset_type || 'Fixed Asset',
      description: defaultItemData?.description || '',
      barcode: defaultItemData?.barcode || '',
      category: defaultItemData?.category_id || null,
      subcategory: defaultItemData?.subcategory_id || null,
      unit: defaultItemData?.uom_id || null,
      unit_price: defaultItemData?.unit_price || '',
      sale_price: defaultItemData?.sale_price || '',
      reorder_level: defaultItemData?.reorder_level || '',
      current_stock: firstLs != null ? firstLs.quantity : defaultItemData?.current_stock || '',
      maximum_stock: defaultItemData?.maximum_stock || '',
      office_location: firstLs ? firstLs.office_location : defaultItemData?.office_location || null,
      supplier: defaultItemData?.supplier_id || null,
      specifications: defaultItemData?.specifications || '',
      status: defaultItemData?.status || 'Active',
    });

    setMainCategoryId(defaultItemData?.category_id || null);

    // Load existing images for edit mode
    if (defaultItemData?.images?.length) {
      setExistingImages(defaultItemData.images);
    }
  }, [defaultItemData, locationStocksData, reset]);

  useEffect(
    () => () => {
      imageFiles.forEach((fileItem) => URL.revokeObjectURL(fileItem.preview));
    },
    [imageFiles]
  );

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const mapped = files.map((file) => ({
      id: `${file.name}-${file.lastModified}`,
      file,
      preview: URL.createObjectURL(file),
    }));

    setImageFiles((prev) => [...prev, ...mapped]);
  };

  const handleRemoveImage = (id) => {
    setImageFiles((prev) => {
      const selected = prev.find((item) => item.id === id);
      if (selected) {
        URL.revokeObjectURL(selected.preview);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const uploadImages = async (productId) => {
    if (!imageFiles.length) return;
    const formData = new FormData();
    imageFiles.forEach((item) => formData.append('images', item.file));
    await axiosInstance.post(endpoints.storeInventory.product_images(productId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  const handleDeleteExistingImage = async (imageObj) => {
    if (!itemId) return;
    const filename =
      imageObj.id ||
      imageObj.name ||
      String(imageObj.url || '')
        .split('/')
        .pop();
    try {
      await axiosInstance.delete(endpoints.storeInventory.product_images(itemId), {
        data: { filenames: [filename] },
      });
      setExistingImages((prev) =>
        prev.filter((img) => (img.id || img.url) !== (imageObj.id || imageObj.url))
      );
      toast.success('Image removed.');
    } catch {
      toast.error('Failed to remove image.');
    }
  };

  const onSubmit = async (formData) => {
    // Use selected location, or fall back to the first warehouse
    const defaultWarehouse = officeLocations.find((o) => o.type === 'warehouse');
    const selectedLocationId = formData.office_location || defaultWarehouse?.id || null;

    const payload = {
      name: formData.item_name,
      description: formData.description,
      product_type: mapGroupToProductType(formData.product_group),
      asset_type: formData.asset_type || 'Fixed Asset',
      category: formData.category || null,
      subcategory: formData.subcategory || null,
      uom: formData.unit || null,
      cost: Number(formData.unit_price || 0),
      sale_price: Number(formData.sale_price || formData.unit_price || 0),
      reorder_level: Number(formData.reorder_level || 0),
      max_stock: Number(formData.maximum_stock || 0),
      barcode: formData.barcode || null,
      supplier: formData.supplier || null,
      office_location: selectedLocationId || null,
      specifications: formData.specifications || '',
      status: formData.status || 'Active',
    };

    try {
      if (isEditMode) {
        // PATCH item — on_hand is managed by backend signal via location-stocks
        await usePatchRequest(endpoints.storeInventory.item_by_id(itemId), payload);
        await uploadImages(itemId);

        // Sync the location-stock record
        const newQty = Number(formData.current_stock || 0);
        if (locationStockRecord) {
          if (locationStockRecord.office_location === selectedLocationId) {
            // Same location — update quantity only
            await usePatchRequest(
              endpoints.storeInventory.location_stock_by_id(locationStockRecord.id),
              { quantity: newQty }
            );
          } else {
            // Location changed — delete old record and create a new one
            await useDeleteRequest(
              endpoints.storeInventory.location_stock_by_id(locationStockRecord.id)
            );
            if (selectedLocationId) {
              await useCreateRequest(endpoints.storeInventory.location_stocks, {
                product: Number(itemId),
                office_location: selectedLocationId,
                quantity: newQty,
              });
            }
          }
        } else if (selectedLocationId) {
          // No existing location-stock record — create one
          await useCreateRequest(endpoints.storeInventory.location_stocks, {
            product: Number(itemId),
            office_location: selectedLocationId,
            quantity: newQty,
          });
        }

        toast.success('Item updated successfully!');
        await mutate(endpoints.storeInventory.item_by_id(itemId));
      } else {
        // Create item (on_hand starts at 0; backend signal updates it via location-stock)
        const created = await useCreateRequest(endpoints.storeInventory.items, payload);
        const newId = created?.id;

        if (newId) {
          await uploadImages(newId);

          // Create the location-stock record for opening quantity
          if (selectedLocationId) {
            await useCreateRequest(endpoints.storeInventory.location_stocks, {
              product: newId,
              office_location: selectedLocationId,
              quantity: Number(formData.current_stock || 0),
            });
          }
        }

        toast.success('Item created successfully!');
      }

      await Promise.all([
        mutate(endpoints.storeInventory.items),
        mutate(endpoints.storeInventory.products),
        mutate(endpoints.storeInventory.item_summary),
        mutate(endpoints.storeInventory.location_stocks),
      ]);

      router.push('/dashboard/store&inventory/item-master');
    } catch (error) {
      toast.error(`Error ${isEditMode ? 'updating' : 'creating'} item. Please try again.`);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 4,
        px: { xs: 2, md: 3 },
        background:
          'radial-gradient(circle at top right, rgba(14,116,144,0.12), transparent 35%), linear-gradient(120deg, #f8fafc, #eef2ff)',
      }}
    >
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          gap={2}
          mb={3}
        >
          <Box>
            <Typography variant="h4" fontWeight={800} color="#0f172a">
              {isEditMode ? 'Update Item Master' : 'Create Item Master'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Full item setup by section: identity, classification, pricing, stock policy, and
              supporting media.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Link href="/dashboard/store&inventory/item-master/category-list" passHref>
              <Button variant="outlined" startIcon={<Iconify icon="mingcute:add-line" />}>
                Manage Category
              </Button>
            </Link>
            <Button
              variant="outlined"
              onClick={() => router.back()}
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
            >
              Back
            </Button>
          </Stack>
        </Stack>

        {isEditMode && defaultItemLoading ? (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="center" py={8} spacing={2}>
                <CircularProgress size={34} />
                <Typography>Loading item data...</Typography>
              </Stack>
            </CardContent>
          </Card>
        ) : (
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, lg: 8 }}>
                <Stack spacing={2.5}>
                  <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} mb={2}>
                        1. Item Identity
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 8 }}>
                          <Controller
                            name="item_name"
                            control={control}
                            rules={{ required: 'Item Name is required' }}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Item Name"
                                error={Boolean(errors.item_name)}
                                helperText={errors.item_name?.message}
                              />
                            )}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Controller
                            name="barcode"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Barcode"
                                placeholder="Scan or type barcode"
                                error={Boolean(errors.barcode)}
                                helperText={errors.barcode?.message}
                              />
                            )}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Controller
                            name="description"
                            control={control}
                            rules={{ required: 'Description is required' }}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Description"
                                multiline
                                rows={3}
                                error={Boolean(errors.description)}
                                helperText={errors.description?.message}
                              />
                            )}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} mb={2}>
                        2. Product Group & Classification
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <Controller
                            name="product_group"
                            control={control}
                            rules={{ required: 'Product group is required' }}
                            render={({ field }) => (
                              <Autocomplete
                                options={PRODUCT_GROUP_OPTIONS}
                                getOptionLabel={(option) => option.name || ''}
                                value={
                                  PRODUCT_GROUP_OPTIONS.find((item) => item.id === field.value) ||
                                  null
                                }
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                onChange={(event, value) => field.onChange(value?.id || null)}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Product Group"
                                    helperText="Main groups: Consumable or Asset"
                                    error={Boolean(errors.product_group)}
                                  />
                                )}
                              />
                            )}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <Controller
                            name="asset_type"
                            control={control}
                            rules={{ required: 'Asset type is required' }}
                            render={({ field }) => (
                              <Autocomplete
                                options={ASSET_TYPE_OPTIONS}
                                getOptionLabel={(option) => option.name || ''}
                                value={
                                  ASSET_TYPE_OPTIONS.find((item) => item.id === field.value) || null
                                }
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                onChange={(event, value) =>
                                  field.onChange(value?.id || 'Fixed Asset')
                                }
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Asset Type"
                                    error={Boolean(errors.asset_type)}
                                    helperText={errors.asset_type?.message}
                                  />
                                )}
                              />
                            )}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <RHFAutocomplete
                            name="category"
                            control={control}
                            label="Category"
                            options={mainCategoryData}
                            loading={mainCategoryLoading}
                            errors={errors}
                            onChangeState={(value) => {
                              setMainCategoryId(value ? value.id : null);
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <Controller
                            name="subcategory"
                            control={control}
                            render={({ field }) => (
                              <Autocomplete
                                options={subcategoryData || []}
                                getOptionLabel={(option) => option.name || ''}
                                loading={subcategoryLoading}
                                disabled={!watchedCategory}
                                value={
                                  (subcategoryData || []).find((item) => item.id === field.value) ||
                                  null
                                }
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                onChange={(event, value) => field.onChange(value?.id || null)}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Subcategory"
                                    error={Boolean(errors.subcategory)}
                                    helperText={errors.subcategory?.message}
                                  />
                                )}
                              />
                            )}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} mb={2}>
                        3. Pricing, Stock & Operations
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Controller
                            name="unit"
                            control={control}
                            rules={{ required: 'Unit is required' }}
                            render={({ field }) => (
                              <Autocomplete
                                options={uomOptions}
                                getOptionLabel={(option) => option?.name || ''}
                                loading={uomLoading}
                                value={uomOptions.find((item) => item.id === field.value) || null}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                onChange={(event, value) => field.onChange(value?.id || null)}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Unit"
                                    error={Boolean(errors.unit)}
                                    helperText={errors.unit?.message}
                                  />
                                )}
                              />
                            )}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Controller
                            name="unit_price"
                            control={control}
                            rules={{ required: 'Unit price is required' }}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                type="number"
                                label="Unit Price"
                                error={Boolean(errors.unit_price)}
                                helperText={errors.unit_price?.message}
                              />
                            )}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Controller
                            name="sale_price"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                type="number"
                                label="Sale Price"
                                helperText="Optional"
                                error={Boolean(errors.sale_price)}
                              />
                            )}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Controller
                            name="current_stock"
                            control={control}
                            rules={{ required: 'Current stock is required' }}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                type="number"
                                label="Current Stock"
                                error={Boolean(errors.current_stock)}
                                helperText={errors.current_stock?.message}
                              />
                            )}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Controller
                            name="reorder_level"
                            control={control}
                            rules={{ required: 'Reorder level is required' }}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                type="number"
                                label="Reorder Level"
                                error={Boolean(errors.reorder_level)}
                                helperText={errors.reorder_level?.message}
                              />
                            )}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Controller
                            name="maximum_stock"
                            control={control}
                            rules={{ required: 'Maximum stock is required' }}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                type="number"
                                label="Maximum Stock"
                                error={Boolean(errors.maximum_stock)}
                                helperText={errors.maximum_stock?.message}
                              />
                            )}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Controller
                            name="supplier"
                            control={control}
                            render={({ field }) => (
                              <Autocomplete
                                options={suppliers}
                                getOptionLabel={(option) => option?.name || ''}
                                loading={supplierLoading}
                                value={suppliers.find((item) => item.id === field.value) || null}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                onChange={(event, value) => field.onChange(value?.id || null)}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Supplier"
                                    error={Boolean(errors.supplier)}
                                    helperText={errors?.supplier?.message}
                                  />
                                )}
                              />
                            )}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Controller
                            name="status"
                            control={control}
                            rules={{ required: 'Status is required' }}
                            render={({ field }) => (
                              <Autocomplete
                                options={STATUS_OPTIONS}
                                getOptionLabel={(option) => option.name || ''}
                                value={
                                  STATUS_OPTIONS.find((item) => item.id === field.value) || null
                                }
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                onChange={(event, value) => field.onChange(value?.id || null)}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Status"
                                    error={Boolean(errors.status)}
                                    helperText={errors.status?.message}
                                  />
                                )}
                              />
                            )}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Controller
                            name="office_location"
                            control={control}
                            render={({ field }) => (
                              <Autocomplete
                                options={officeLocations}
                                getOptionLabel={(option) => {
                                  if (!option) return '';
                                  const typLabel =
                                    option.type === 'warehouse' ? 'Warehouse' : 'Office';
                                  return `${option.name} (${typLabel})`;
                                }}
                                loading={officeLocationLoading}
                                value={
                                  officeLocations.find((item) => item.id === field.value) || null
                                }
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                onChange={(event, value) => field.onChange(value?.id || null)}
                                renderOption={(props, option) => (
                                  <li {...props} key={option.id}>
                                    <Box>
                                      <Typography variant="body2" fontWeight={600}>
                                        {option.name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {option.type === 'warehouse' ? 'Warehouse' : 'Office'}
                                      </Typography>
                                    </Box>
                                  </li>
                                )}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Location"
                                    helperText="Select an office or warehouse"
                                    error={Boolean(errors.office_location)}
                                  />
                                )}
                              />
                            )}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Controller
                            name="specifications"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Specifications"
                                multiline
                                rows={3}
                                helperText="Optional technical details"
                                error={Boolean(errors.specifications)}
                              />
                            )}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, lg: 4 }}>
                <Stack spacing={2.5}>
                  <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} mb={1.5}>
                        4. Image Upload
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        Upload one or multiple images. Uploaded images are displayed below as a list
                        preview.
                      </Typography>

                      <Button
                        component="label"
                        fullWidth
                        variant="outlined"
                        startIcon={<Iconify icon="solar:upload-bold" />}
                      >
                        Add Images
                        <input
                          hidden
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                        />
                      </Button>

                      <Divider sx={{ my: 2 }} />

                      {existingImages.length === 0 && imageFiles.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No images selected yet.
                        </Typography>
                      ) : (
                        <Stack spacing={1.25}>
                          {existingImages.map((imgObj) => {
                            const imgUrl = imgObj?.url || imgObj;
                            const imgName =
                              imgObj?.name || imgObj?.id || String(imgUrl).split('/').pop();
                            return (
                              <Stack
                                key={imgObj?.id || imgUrl}
                                direction="row"
                                alignItems="center"
                                spacing={1}
                                sx={{
                                  p: 1,
                                  borderRadius: 1.5,
                                  border: '1px solid #e2e8f0',
                                  bgcolor: '#f0fdf4',
                                }}
                              >
                                <Avatar
                                  variant="rounded"
                                  src={imgUrl}
                                  alt="existing"
                                  sx={{ width: 48, height: 48 }}
                                />
                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                  <Typography variant="body2" noWrap fontWeight={600}>
                                    {imgName}
                                  </Typography>
                                  <Typography variant="caption" color="success.main">
                                    Saved
                                  </Typography>
                                </Box>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteExistingImage(imgObj)}
                                >
                                  <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                                </IconButton>
                              </Stack>
                            );
                          })}
                          {imageFiles.map((imageItem) => (
                            <Stack
                              key={imageItem.id}
                              direction="row"
                              alignItems="center"
                              spacing={1}
                              sx={{
                                p: 1,
                                borderRadius: 1.5,
                                border: '1px solid #e2e8f0',
                                bgcolor: '#f8fafc',
                              }}
                            >
                              <Avatar
                                variant="rounded"
                                src={imageItem.preview}
                                alt={imageItem.file.name}
                                sx={{ width: 48, height: 48 }}
                              />
                              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                <Typography variant="body2" noWrap fontWeight={600}>
                                  {imageItem.file.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {(imageItem.file.size / 1024).toFixed(1)} KB
                                </Typography>
                              </Box>
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveImage(imageItem.id)}
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                              </IconButton>
                            </Stack>
                          ))}
                        </Stack>
                      )}
                    </CardContent>
                  </Card>

                  {defaultItemError && (
                    <Card sx={{ borderRadius: 3, border: '1px solid #fecaca', bgcolor: '#fff1f2' }}>
                      <CardContent>
                        <Typography variant="body2" color="#9f1239">
                          Could not load existing item details. Please reload and try again.
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                  <CardContent>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
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
                          fontWeight: 700,
                          textTransform: 'none',
                          background: 'linear-gradient(90deg, #0f766e, #0284c7)',
                          '&:hover': {
                            background: 'linear-gradient(90deg, #115e59, #0369a1)',
                          },
                        }}
                      >
                        {isSubmitting ? (
                          <CircularProgress size={22} sx={{ color: 'white' }} />
                        ) : (
                          <Icon icon="mdi:package-variant" width={20} height={20} />
                        )}
                        &nbsp;
                        {isSubmitting
                          ? isEditMode
                            ? 'Updating...'
                            : 'Creating...'
                          : isEditMode
                            ? 'Update Item'
                            : 'Create Item'}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    </Box>
  );
}
