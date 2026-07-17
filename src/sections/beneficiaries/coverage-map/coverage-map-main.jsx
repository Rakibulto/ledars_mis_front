'use client';

import {
  Box,
  Card,
  Grid,
  Chip,
  Stack,
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableContainer,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

import SummaryCard from '../../_components/summary-card';

export default function CoverageMapMain() {
  const { data: rawCoverage, loading: coverageLoading } = useGetRequest(
    endpoints.beneficiaries.coverage_areas
  );
  const COVERAGE_MAP = Array.isArray(rawCoverage) ? rawCoverage : rawCoverage?.results || [];

  const { data: rawKpi, loading: kpiLoading } = useGetRequest(
    endpoints.beneficiaries.beneficiary_dashboard_kpis
  );
  const DASHBOARD_KPIS = rawKpi || {};

  const totalDistricts = COVERAGE_MAP.reduce((s, c) => s + c.districts.length, 0);
  const totalFieldOffices = COVERAGE_MAP.reduce((s, c) => s + c.field_offices, 0);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Coverage Map
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Geographic coverage of beneficiary programs across Bangladesh
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Divisions"
            value={COVERAGE_MAP.length}
            icon="solar:map-bold"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Districts"
            value={totalDistricts}
            icon="solar:map-point-bold"
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Field Offices"
            value={totalFieldOffices}
            icon="solar:buildings-bold"
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Beneficiaries"
            value={DASHBOARD_KPIS.total_beneficiaries}
            icon="solar:users-group-rounded-bold"
            color="success"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {COVERAGE_MAP.map((region) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={region.id}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">{region.division}</Typography>
                  <Chip
                    label={`${region.beneficiaries} beneficiaries`}
                    size="small"
                    color="primary"
                  />
                </Stack>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Districts
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                    {region.districts.map((d) => (
                      <Chip key={d} label={d} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
                <Stack direction="row" spacing={3}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Iconify icon="solar:folder-bold" width={18} color="info.main" />
                    <Typography variant="body2">{region.projects} projects</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Iconify icon="solar:buildings-bold" width={18} color="warning.main" />
                    <Typography variant="body2">{region.field_offices} offices</Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mt: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Division</TableCell>
                <TableCell>Districts</TableCell>
                <TableCell align="center">Beneficiaries</TableCell>
                <TableCell align="center">Projects</TableCell>
                <TableCell align="center">Field Offices</TableCell>
                <TableCell align="center">Coverage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {COVERAGE_MAP.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Typography fontWeight="bold">{row.division}</Typography>
                  </TableCell>
                  <TableCell>{row.districts.join(', ')}</TableCell>
                  <TableCell align="center">{row.beneficiaries.toLocaleString()}</TableCell>
                  <TableCell align="center">{row.projects}</TableCell>
                  <TableCell align="center">{row.field_offices}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${((row.beneficiaries / DASHBOARD_KPIS.total_beneficiaries) * 100).toFixed(1)}%`}
                      size="small"
                      color="primary"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
