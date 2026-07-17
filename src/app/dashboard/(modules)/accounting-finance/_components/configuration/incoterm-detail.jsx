'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { Iconify } from 'src/components/iconify';

import { useIncotermApi } from './use-incoterms-api';

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

export default function IncotermDetail() {
  const router = useRouter();
  const { id } = useParams();
  const api = useIncotermApi();

  const inc = useMemo(
    () => api.incoterms.find((item) => String(item.id) === String(id)),
    [api.incoterms, id]
  );

  if (api.loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!inc) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Incoterm not found.
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
          Incoterms
        </Typography>
        <Typography variant="body2" color="text.secondary">
          /
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {inc.code} – {inc.name}
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
            <Chip label={inc.code} color="primary" sx={{ fontWeight: 700, fontSize: '1rem' }} />
            <Typography variant="h4" fontWeight={700}>
              {inc.name}
            </Typography>
            <Chip
              label={inc.active ? 'Active' : 'Inactive'}
              size="small"
              color={inc.active ? 'success' : 'default'}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {inc.description}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color={inc.active ? 'error' : 'success'}
          onClick={() => api.actions.toggleIncotermStatus(inc.id)}
        >
          {inc.active ? 'Disable' : 'Enable'}
        </Button>
      </Stack>

      {/* Metric cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Adoption Rate
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {inc.adoptionRate ?? '—'}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Of mapped trade flows
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Usage Scope
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
                {inc.usageScope}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Trade coverage
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Risk Transfer
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
                {inc.risk_transfer || 'At delivery point'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Handover posture
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
                Trade Flow
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <DetailRow label="Risk Transfer" value={inc.risk_transfer || 'At delivery point'} />
              <DetailRow label="Usage Scope" value={inc.usageScope} />
              <DetailRow label="Allocation Rule" value={inc.allocationRule} />
              <DetailRow label="Adoption Rate" value={`${inc.adoptionRate ?? 0}% of trade flows`} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Document Flow
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <DetailRow label="Vendor-Bill Flow" value={inc.billFlowUsage} />
              <DetailRow label="Customer-Invoice Flow" value={inc.invoiceFlowUsage} />
              <DetailRow
                label="Status"
                value={
                  <Chip
                    label={
                      inc.active
                        ? 'Enabled for logistics and invoicing'
                        : 'Disabled for new documents'
                    }
                    size="small"
                    color={inc.active ? 'success' : 'default'}
                  />
                }
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
