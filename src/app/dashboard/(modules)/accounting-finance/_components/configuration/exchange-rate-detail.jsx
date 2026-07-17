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

import { useExchangeRatesApi } from './use-exchange-rates-api';

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

export default function ExchangeRateDetail() {
  const router = useRouter();
  const { id } = useParams();
  const workspace = useExchangeRatesApi();

  const rate = useMemo(
    () => workspace.exchangeRates.find((item) => String(item.id) === String(id)),
    [workspace.exchangeRates, id]
  );

  if (workspace.loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!rate) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Exchange rate not found.
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

  const isWatch = rate.varianceFlag === 'watch';

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
          Currency Exchange Rates
        </Typography>
        <Typography variant="body2" color="text.secondary">
          /
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {rate.from_currency}/{rate.to_currency}
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
            <Chip
              label={`${rate.from_currency} / ${rate.to_currency}`}
              variant="outlined"
              sx={{ fontWeight: 700, fontSize: '1rem' }}
            />
            <Chip
              label={isWatch ? 'Review' : 'Stable'}
              size="small"
              color={isWatch ? 'warning' : 'success'}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Effective {rate.effective_date} • Source: {rate.source}
          </Typography>
        </Box>
      </Stack>

      {/* Metric cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Rate
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {Number(rate.rate).toFixed(4)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {rate.from_currency} → {rate.to_currency}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Inverse Rate
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {Number(rate.inverseRate).toFixed(6)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {rate.to_currency} → {rate.from_currency}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Variance Posture
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={isWatch ? 'Treasury review required' : 'Within normal band'}
                  color={isWatch ? 'warning' : 'success'}
                  sx={{ fontWeight: 700 }}
                />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5 }}
              >
                Rate stability flag
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
                Rate Details
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <DetailRow
                label="Currency Pair"
                value={`${rate.from_currency} / ${rate.to_currency}`}
              />
              <DetailRow label="Rate" value={Number(rate.rate).toFixed(4)} />
              <DetailRow label="Inverse Rate" value={Number(rate.inverseRate).toFixed(6)} />
              <DetailRow label="Effective Date" value={rate.effective_date} />
              <DetailRow label="Source" value={rate.source} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Automation & Governance
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <DetailRow label="Import Mode" value={rate.importMode} />
              <DetailRow label="Gain/Loss Policy" value={rate.gainLossAutomation} />
              <DetailRow label="Settlement Anchor" value={`${rate.toSymbol} translation target`} />
              <DetailRow
                label="Variance Flag"
                value={
                  <Chip
                    label={isWatch ? 'Review' : 'Stable'}
                    size="small"
                    color={isWatch ? 'warning' : 'success'}
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
