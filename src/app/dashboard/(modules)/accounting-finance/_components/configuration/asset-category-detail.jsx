'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const EP = endpoints.accounting;

function DetailRow({ label, value }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      spacing={2}
      sx={{ py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 180 }}>
        {label}
      </Typography>
      <Box textAlign="right">
        {typeof value === 'string' || typeof value === 'number' ? (
          <Typography variant="body2" fontWeight={500}>
            {value ?? '—'}
          </Typography>
        ) : (
          value
        )}
      </Box>
    </Stack>
  );
}

export default function AssetCategoryDetail() {
  const router = useRouter();
  const { id } = useParams();

  const { data: rawCats, isLoading } = useGetRequest(EP.asset_categories);
  const { data: rawAccounts } = useGetRequest(EP.accounts);

  const ASSET_CATEGORIES = Array.isArray(rawCats) ? rawCats : rawCats?.results || [];
  const ASSETS = Array.isArray(rawAccounts) ? rawAccounts : rawAccounts?.results || [];

  const category = useMemo(() => {
    const raw = ASSET_CATEGORIES.find((item) => String(item.id) === String(id));
    if (!raw) return null;
    const assetCount = ASSETS.filter((asset) => asset.category_id === raw.id).length;
    const annualRate = raw.useful_life ? Number((100 / Number(raw.useful_life)).toFixed(2)) : 0;
    return {
      ...raw,
      assetCount,
      annualRate,
      depreciationAccount: `${String(raw.name || 'Asset')
        .slice(0, 3)
        .toUpperCase()} Depreciation Expense`,
      disposalAccount: `${String(raw.name || 'Asset')
        .slice(0, 3)
        .toUpperCase()} Disposal Gain/Loss`,
      setupProfile:
        raw.depreciation_method === 'straight_line'
          ? 'Even periodic depreciation with predictable carrying value'
          : 'Accelerated recognition for higher early-period expense',
    };
  }, [ASSET_CATEGORIES, ASSETS, id]);

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(EP.asset_category_by_id(id));
      mutate(EP.asset_categories);
      toast.success('Category deleted');
      router.back();
    } catch {
      toast.error('Delete failed');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ height: 60, bgcolor: 'action.hover', borderRadius: 2, mb: 2 }} />
        <Box sx={{ height: 300, bgcolor: 'action.hover', borderRadius: 2 }} />
      </Box>
    );
  }

  if (!category) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Asset category not found.
        </Typography>
        <Button
          sx={{ mt: 2 }}
          startIcon={<Iconify icon="solar:arrow-left-bold" />}
          onClick={() => router.back()}
        >
          Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumb */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<Iconify icon="solar:arrow-left-bold" />}
          onClick={() => router.back()}
        >
          Back
        </Button>
        <Typography variant="body2" color="text.secondary">
          /
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Asset Categories
        </Typography>
        <Typography variant="body2" color="text.secondary">
          /
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {category.name}
        </Typography>
      </Stack>

      {/* Title row */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="h4" fontWeight={700}>
              {category.name}
            </Typography>
            <Chip
              label={category.depreciation_method.replace('_', ' ')}
              size="small"
              sx={{ textTransform: 'capitalize' }}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {category.setupProfile}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="error"
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
          onClick={handleDelete}
        >
          Delete Category
        </Button>
      </Stack>

      {/* Metric cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Useful Life
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {category.useful_life} yrs
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Estimated service life
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Annual Rate
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {category.annualRate}% p.a.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Depreciation per year
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Linked Assets
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {category.assetCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Assets in this category
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detail cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Depreciation Setup
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <DetailRow
                label="Depreciation Method"
                value={category.depreciation_method.replace('_', ' ')}
              />
              <DetailRow label="Useful Life" value={`${category.useful_life} years`} />
              <DetailRow label="Salvage Percentage" value={`${category.salvage_percent}%`} />
              <DetailRow label="Annual Rate" value={`${category.annualRate}% p.a.`} />
              <DetailRow label="Setup Profile" value={category.setupProfile} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Default Accounts
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <DetailRow label="Depreciation Account" value={category.depreciationAccount} />
              <DetailRow label="Disposal Account" value={category.disposalAccount} />
              <DetailRow label="Linked Assets" value={`${category.assetCount} asset(s)`} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
