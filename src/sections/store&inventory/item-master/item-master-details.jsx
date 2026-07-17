'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Stack,
  Button,
  Divider,
  Skeleton,
  Typography,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const getStockColor = (stockStatus) => {
  if (stockStatus === 'Low Stock') {
    return { bg: '#fef3c7', color: '#92400e' };
  }
  if (stockStatus === 'Out of Stock') {
    return { bg: '#fee2e2', color: '#991b1b' };
  }
  if (stockStatus === 'Overstock') {
    return { bg: '#dbeafe', color: '#1d4ed8' };
  }

  return { bg: '#d1fae5', color: '#065f46' };
};

const InfoRow = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body1" fontWeight={600} color="#1a1a1a">
      {value || 'N/A'}
    </Typography>
  </Box>
);

export default function ItemMasterDetails() {
  const params = useParams();
  const itemId = params?.itemId;

  const {
    data: item,
    loading,
    error,
  } = useGetRequest(itemId ? endpoints.storeInventory.item_by_id(itemId) : null);

  const stockColor = getStockColor(item?.stock_status);

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Link href="/dashboard/store&inventory/item-master" passHref>
            <Button variant="outlined" startIcon={<Iconify icon="eva:arrow-back-fill" />}>
              Back to List
            </Button>
          </Link>
          <Typography variant="h4" fontWeight={700} color="#1a1a1a">
            Item Details
          </Typography>
        </Stack>

        <Link
          href={`/dashboard/store&inventory/item-master/create-item/?edit_item=${itemId}`}
          passHref
        >
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:pen-bold" />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Edit Item
          </Button>
        </Link>
      </Stack>

      {loading && (
        <Card sx={{ p: 3, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Skeleton variant="text" height={42} width="30%" />
            <Skeleton variant="rounded" height={120} />
            <Skeleton variant="rounded" height={220} />
          </Stack>
        </Card>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Failed to load item details. Please try again.
        </Alert>
      )}

      {!loading && !error && item && (
        <Stack spacing={3}>
          <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              spacing={2}
            >
              <Box>
                <Typography variant="h5" fontWeight={700} color="#1a1a1a">
                  {item?.item_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Code: {item?.item_code || 'N/A'}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label={item?.stock_status || 'In Stock'}
                  sx={{
                    bgcolor: stockColor.bg,
                    color: stockColor.color,
                    fontWeight: 700,
                  }}
                />
                <Chip
                  label={item?.status || 'Active'}
                  sx={{
                    bgcolor: item?.status === 'Active' ? '#d1fae5' : '#f3f4f6',
                    color: item?.status === 'Active' ? '#065f46' : '#6b7280',
                    fontWeight: 700,
                  }}
                />
              </Stack>
            </Stack>
          </Card>

          <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 3 }}>
                <InfoRow label="Category" value={item?.category} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <InfoRow label="Subcategory" value={item?.subcategory} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <InfoRow label="Unit" value={item?.unit} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <InfoRow label="Location" value={item?.office_location_name || item?.location} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 3 }}>
                <InfoRow label="Current Stock" value={item?.current_stock} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <InfoRow label="Reorder Level" value={item?.reorder_level} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <InfoRow
                  label="Unit Price"
                  value={`৳${Number(item?.unit_price || 0).toLocaleString('en-BD')}`}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <InfoRow
                  label="Old Price"
                  value={
                    item?.old_unit_price != null
                      ? `৳${Number(item.old_unit_price).toLocaleString('en-BD')}`
                      : 'N/A'
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <InfoRow label="Supplier" value={item?.supplier || 'N/A'} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <InfoRow label="Description" value={item?.description} />
          </Card>
        </Stack>
      )}
    </Box>
  );
}
