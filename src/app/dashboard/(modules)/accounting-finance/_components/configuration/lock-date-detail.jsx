'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { Iconify } from 'src/components/iconify';

import { useLockDatesApi } from './use-lock-dates-api';

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

const TYPE_COLOR = { hard: '#ef4444', tax: '#f59e0b', soft: '#3b82f6' };

export default function LockDateDetail() {
  const router = useRouter();
  const { id } = useParams();
  const api = useLockDatesApi();

  const ld = useMemo(
    () => api.lockDates.find((item) => String(item.id) === String(id)),
    [api.lockDates, id]
  );

  if (api.loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!ld) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Lock date not found.
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

  const typeColor = TYPE_COLOR[ld.type] || '#6b7280';

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
          Lock Dates
        </Typography>
        <Typography variant="body2" color="text.secondary">
          /
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {ld.name}
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
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: `${typeColor}20`, color: typeColor, width: 56, height: 56 }}>
            <Iconify
              icon={ld.type === 'hard' ? 'solar:lock-bold' : 'solar:lock-unlocked-bold'}
              width={28}
            />
          </Avatar>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="h4" fontWeight={700}>
                {ld.name}
              </Typography>
              <Chip
                label={ld.enforcementLevel}
                size="small"
                color={ld.type === 'hard' ? 'error' : ld.type === 'tax' ? 'warning' : 'info'}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {ld.description}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      {/* Metric cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Lock Date
              </Typography>
              <Typography variant="h5" fontWeight={800}>
                {ld.lock_date}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Effective close date
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Enforcement Level
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={ld.enforcementLevel}
                  color={ld.type === 'hard' ? 'error' : ld.type === 'tax' ? 'warning' : 'info'}
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Audit Owner
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
                {ld.auditOwner}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Responsible controller
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Enforcement alert */}
      <Alert
        severity={ld.type === 'hard' ? 'error' : ld.type === 'tax' ? 'warning' : 'info'}
        sx={{ mb: 3, borderRadius: 2 }}
      >
        {ld.type === 'hard'
          ? 'Hard lock should block posting and require controller exception handling.'
          : ld.type === 'tax'
            ? 'Tax lock should allow narrow exception routing with explicit approval.'
            : 'Soft lock should warn and route approvals before late posting is allowed.'}
      </Alert>

      {/* Detail cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Policy Details
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <DetailRow label="Lock Type" value={ld.type} />
              <DetailRow label="Enforcement Level" value={ld.enforcementLevel} />
              <DetailRow label="Lock Date" value={ld.lock_date} />
              <DetailRow label="Scope" value={ld.scopeLabel} />
              <DetailRow label="Applies To" value={ld.applies_to} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Governance & Escalation
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <DetailRow label="Audit Owner" value={ld.auditOwner} />
              <DetailRow label="Escalation Rule" value={ld.escalationRule} />
              <DetailRow label="Impact Summary" value={ld.impactSummary} />
            </CardContent>
          </Card>
        </Grid>

        {/* Audit History */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Audit History
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <Stack spacing={1}>
                {ld.history.map((item) => (
                  <Box
                    key={item.id}
                    sx={{ p: 1.25, borderRadius: 2, bgcolor: 'background.neutral' }}
                  >
                    <Typography variant="body2" fontWeight={700}>
                      {item.action}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.date} • {item.actor}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
