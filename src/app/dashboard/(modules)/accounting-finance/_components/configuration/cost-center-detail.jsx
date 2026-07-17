'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';

import { Iconify } from 'src/components/iconify';

import { useCostCentersApi } from './use-cost-centers-api';

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

const REVIEW_COLORS = { critical: '#ef4444', watch: '#f59e0b', healthy: '#16a34a' };

export default function CostCenterDetail() {
  const router = useRouter();
  const { id } = useParams();
  const workspace = useCostCentersApi();

  const cc = useMemo(
    () => workspace.costCenters.find((item) => String(item.id) === String(id)),
    [workspace.costCenters, id]
  );

  if (workspace.loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!cc) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Cost center not found.
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

  const reviewColor = REVIEW_COLORS[cc.reviewState] || '#6b7280';
  const utilPct = Math.min(Number(cc.utilization) || 0, 100);

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
          Cost Centers
        </Typography>
        <Typography variant="body2" color="text.secondary">
          /
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {cc.name}
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
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 700,
                bgcolor: 'action.hover',
                px: 1,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              {cc.code}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {cc.name}
            </Typography>
            <Chip
              label={cc.active ? 'Active' : 'Inactive'}
              size="small"
              color={cc.active ? 'success' : 'default'}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {cc.hierarchyLabel}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color={cc.active ? 'error' : 'success'}
          onClick={() => workspace.actions.toggleCostCenterStatus(cc.id)}
        >
          {cc.active ? 'Disable' : 'Enable'}
        </Button>
      </Stack>

      {/* Metric cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Budget
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {cc.budget ?? '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Allocated budget
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Spent
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {cc.spent ?? '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Expenditure to date
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Review State
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={cc.reviewState}
                  sx={{
                    bgcolor: `${reviewColor}15`,
                    color: reviewColor,
                    fontWeight: 700,
                    textTransform: 'capitalize',
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5 }}
              >
                Budget health posture
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Utilization bar */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              Budget Utilization
            </Typography>
            <Typography variant="subtitle2" fontWeight={700}>
              {utilPct.toFixed(1)}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={utilPct}
            color={utilPct >= 90 ? 'error' : utilPct >= 70 ? 'warning' : 'success'}
            sx={{ height: 10, borderRadius: 5 }}
          />
          {utilPct >= 90 && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
              Budget utilization is critically high. Consider reviewing expenditure or requesting
              additional allocation.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Detail cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Hierarchy & Driver
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <DetailRow label="Parent Center" value={cc.parentName || '—'} />
              <DetailRow label="Hierarchy Label" value={cc.hierarchyLabel} />
              <DetailRow label="Cost Driver" value={cc.driver} />
              <DetailRow label="Budget Linkage" value={cc.budgetLinkage} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Ownership & Governance
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <DetailRow label="Manager" value={cc.manager} />
              <DetailRow label="Manager Ownership" value={cc.managerOwnership} />
              <DetailRow
                label="Review State"
                value={
                  <Chip
                    label={cc.reviewState}
                    size="small"
                    sx={{
                      bgcolor: `${reviewColor}15`,
                      color: reviewColor,
                      textTransform: 'capitalize',
                    }}
                  />
                }
              />
              <DetailRow
                label="Status"
                value={
                  <Chip
                    label={cc.active ? 'Active' : 'Inactive'}
                    size="small"
                    color={cc.active ? 'success' : 'default'}
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
