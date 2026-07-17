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
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';

import { Iconify } from 'src/components/iconify';

import { useCurrenciesApi } from './use-currencies-api';

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
          (value ?? (
            <Typography variant="body2" fontWeight={500}>
              —
            </Typography>
          ))
        )}
      </Box>
    </Stack>
  );
}

export default function CurrencyDetail() {
  const router = useRouter();
  const { id } = useParams();
  const workspace = useCurrenciesApi();

  const currency = useMemo(
    () => workspace.currencies.find((c) => String(c.id) === String(id)),
    [workspace.currencies, id]
  );

  const rateHistory = useMemo(
    () =>
      workspace.exchangeRates
        .filter((r) => Number(r.currency) === Number(id))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5),
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

  if (!currency) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Currency not found.
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
          Currencies
        </Typography>
        <Typography variant="body2" color="text.secondary">
          /
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {currency.name}
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
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'primary.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                {currency.symbol || currency.code?.slice(0, 1)}
              </Typography>
            </Box>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h4" fontWeight={700}>
                  {currency.name}
                </Typography>
                <Chip label={currency.code} sx={{ fontFamily: 'monospace', fontWeight: 700 }} />
                {currency.is_base && <Chip label="Base" color="primary" size="small" />}
                <Chip
                  label={currency.active ? 'Active' : 'Inactive'}
                  size="small"
                  color={currency.active ? 'success' : 'default'}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {currency.triangulation}
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Button
          variant="outlined"
          color={currency.active ? 'error' : 'success'}
          onClick={() => workspace.actions.toggleCurrencyStatus(currency.id)}
        >
          {currency.active ? 'Disable' : 'Enable'}
        </Button>
      </Stack>

      {/* Metric cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Exchange Rate
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {currency.exchange_rate || (currency.is_base ? '1.0000' : '—')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                as of {currency.lastRateDate}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Precision
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {currency.precision}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                decimal places
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Rate Source
              </Typography>
              <Typography variant="body1" fontWeight={700}>
                {currency.source}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Rounding Method
              </Typography>
              <Typography variant="body1" fontWeight={700}>
                {currency.roundingMethod}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title="Currency Identity"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
            />
            <Divider />
            <CardContent sx={{ pt: 0 }}>
              <DetailRow label="ID" value={currency.id} />
              <DetailRow label="Code" value={currency.code} />
              <DetailRow label="Name" value={currency.name} />
              <DetailRow label="Symbol" value={currency.symbol} />
              <DetailRow
                label="Base Currency"
                value={
                  <Chip
                    label={currency.is_base ? 'Yes' : 'No'}
                    size="small"
                    color={currency.is_base ? 'primary' : 'default'}
                  />
                }
              />
              <DetailRow label="Decimal Places" value={currency.precision} />
              <DetailRow
                label="Status"
                value={
                  <Chip
                    label={currency.active ? 'Active' : 'Inactive'}
                    size="small"
                    color={currency.active ? 'success' : 'default'}
                  />
                }
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title="Rate & Automation"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
            />
            <Divider />
            <CardContent sx={{ pt: 0 }}>
              <DetailRow
                label="Current Rate"
                value={currency.is_base ? '1.0000 (Base)' : String(currency.exchange_rate || '—')}
              />
              <DetailRow label="Last Rate Date" value={currency.lastRateDate} />
              <DetailRow label="Source" value={currency.source} />
              <DetailRow label="Rounding Method" value={currency.roundingMethod} />
              <DetailRow label="Gain/Loss Automation" value={currency.gainLossAutomation} />
              <DetailRow label="Triangulation" value={currency.triangulation} />
            </CardContent>
          </Card>
        </Grid>

        {/* Recent exchange rates */}
        {rateHistory.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardHeader
                title="Recent Exchange Rates"
                titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
              />
              <Divider />
              <CardContent sx={{ pt: 0 }}>
                {rateHistory.map((r) => (
                  <Stack
                    key={r.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {r.date}
                    </Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                      {r.rate}
                    </Typography>
                    <Chip label={r.source || 'Manual'} size="small" variant="outlined" />
                  </Stack>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
