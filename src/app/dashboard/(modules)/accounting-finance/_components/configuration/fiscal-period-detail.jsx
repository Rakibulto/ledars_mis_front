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

import { useFiscalPeriodsApi } from './use-fiscal-periods-api';

const STATUS_COLORS = { closed: 'default', open: 'success', future: 'info' };

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

export default function FiscalPeriodDetail() {
  const router = useRouter();
  const { id } = useParams();
  const workspace = useFiscalPeriodsApi();

  const period = useMemo(
    () => workspace.fiscalPeriods.find((p) => String(p.id) === String(id)),
    [workspace.fiscalPeriods, id]
  );

  if (workspace.loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!period) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Fiscal period not found.
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
          Fiscal Periods
        </Typography>
        <Typography variant="body2" color="text.secondary">
          /
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {period.name}
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
              {period.name}
            </Typography>
            <Chip
              label={period.status}
              size="small"
              color={STATUS_COLORS[period.status] || 'default'}
              sx={{ textTransform: 'capitalize' }}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Fiscal Year: {period.fiscalYearName}
          </Typography>
        </Box>
        <Box>
          {period.status !== 'closed' ? (
            <Button
              variant="contained"
              color="warning"
              onClick={() => workspace.actions.closeFiscalPeriod(period.id)}
            >
              Close Period
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="warning"
              onClick={() => workspace.actions.reopenFiscalPeriod(period.id)}
            >
              Reopen Period
            </Button>
          )}
        </Box>
      </Stack>

      {/* Metric cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card
            sx={{
              borderRadius: 3,
              bgcolor: period.status === 'open' ? '#22c55e08' : 'background.paper',
            }}
          >
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Status
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={period.status}
                  color={STATUS_COLORS[period.status] || 'default'}
                  sx={{ textTransform: 'capitalize', fontWeight: 700 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Date Range
              </Typography>
              <Typography variant="body1" fontWeight={700}>
                {new Date(period.start_date).toLocaleDateString()} –{' '}
                {new Date(period.end_date).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Lock State
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {period.lockState}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title="Period Identity"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
            />
            <Divider />
            <CardContent sx={{ pt: 0 }}>
              <DetailRow label="ID" value={period.id} />
              <DetailRow label="Name" value={period.name} />
              <DetailRow label="Fiscal Year" value={period.fiscalYearName} />
              <DetailRow
                label="Start Date"
                value={new Date(period.start_date).toLocaleDateString()}
              />
              <DetailRow label="End Date" value={new Date(period.end_date).toLocaleDateString()} />
              <DetailRow
                label="Status"
                value={
                  <Chip
                    label={period.status}
                    size="small"
                    color={STATUS_COLORS[period.status] || 'default'}
                    sx={{ textTransform: 'capitalize' }}
                  />
                }
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title="Control & State Machine"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
            />
            <Divider />
            <CardContent sx={{ pt: 0 }}>
              <DetailRow label="Lock State" value={period.lockState} />
              <DetailRow label="Control Note" value={period.controlNote} />
              <DetailRow label="State Machine" value={period.stateMachine} />
              <DetailRow
                label="Reopen Eligible"
                value={
                  <Chip
                    label={period.reopenAllowed ? 'Yes' : 'No'}
                    size="small"
                    color={period.reopenAllowed ? 'warning' : 'default'}
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
