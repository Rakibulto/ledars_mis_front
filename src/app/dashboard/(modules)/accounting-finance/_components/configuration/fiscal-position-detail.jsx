'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';

import { Iconify } from 'src/components/iconify';

import { useFiscalPositionsApi } from './use-fiscal-positions-api';

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

export default function FiscalPositionDetail() {
  const router = useRouter();
  const { id } = useParams();
  const api = useFiscalPositionsApi();

  const fp = useMemo(
    () => api.fiscalPositions.find((item) => String(item.id) === String(id)),
    [api.fiscalPositions, id]
  );

  if (api.loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!fp) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Fiscal position not found.
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
          Fiscal Positions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          /
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {fp.name}
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
              {fp.name}
            </Typography>
            <Chip label={fp.country} size="small" variant="outlined" />
            <Chip
              label={fp.auto_apply ? 'Auto Apply' : 'Manual'}
              size="small"
              color={fp.auto_apply ? 'success' : 'default'}
            />
            <Chip
              label={fp.active ? 'Active' : 'Inactive'}
              size="small"
              color={fp.active ? 'success' : 'default'}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {fp.previewScenario}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color={fp.active ? 'error' : 'success'}
          onClick={() => api.actions.toggleFiscalPositionStatus(fp.id)}
        >
          {fp.active ? 'Disable' : 'Enable'}
        </Button>
      </Stack>

      {/* Metric cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Tax Mappings
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {fp.tax_mappings?.length ?? 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Configured tax rules
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Account Mappings
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {fp.account_mappings?.length ?? 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Configured account rules
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Mapping Coverage
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {fp.mappingCoverage}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total mapped rules
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detail cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Jurisdiction
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <DetailRow label="Country" value={fp.country} />
              <DetailRow label="Jurisdiction Cluster" value={fp.jurisdictionCluster} />
              <DetailRow label="Document Scope" value={fp.documentScope} />
              <DetailRow
                label="Auto Apply"
                value={
                  <Chip
                    label={fp.auto_apply ? 'Yes' : 'No'}
                    size="small"
                    color={fp.auto_apply ? 'success' : 'default'}
                  />
                }
              />
              <DetailRow label="Auto Apply Reason" value={fp.autoApplyReason} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Preview Scenario
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <Typography variant="body2" color="text.secondary">
                {fp.previewScenario}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tax Mappings table */}
      {fp.tax_mappings?.length > 0 && (
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              Tax Mappings
            </Typography>
          </CardContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tax on Product (From)</TableCell>
                  <TableCell>Tax to Apply (To)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fp.tax_mappings.map((tm, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{tm.from || '—'}</TableCell>
                    <TableCell>{tm.to || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Account Mappings table */}
      {fp.account_mappings?.length > 0 && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              Account Mappings
            </Typography>
          </CardContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Account on Product (From)</TableCell>
                  <TableCell>Account to Use (To)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fp.account_mappings.map((am, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{am.from || '—'}</TableCell>
                    <TableCell>{am.to || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}
