'use client';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import SummaryCard from '../../_components/summary-card';

const EP = endpoints.accounting;

export default function FinancialReportsPage() {
  const { data: genData, loading, error } = useGetRequest(EP.generated_reports);
  const { data: tmplData } = useGetRequest(EP.report_templates);

  const reports = useMemo(() => genData?.results || genData || [], [genData]);
  const templates = useMemo(() => tmplData?.results || tmplData || [], [tmplData]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Financial Reports
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Generated reports and report templates
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard
            title="Report Templates"
            value={templates.length}
            icon="solar:document-text-bold-duotone"
            color="#2563eb"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard
            title="Generated Reports"
            value={reports.length}
            icon="solar:chart-2-bold-duotone"
            color="#8b5cf6"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard
            title="Available"
            value={
              reports.filter((r) => r.status === 'Completed' || r.status === 'Generated').length
            }
            icon="solar:check-circle-bold-duotone"
            color="#10b981"
            loading={loading}
            error={error}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
            }}
          >
            <Typography variant="h6" fontWeight={600} mb={2}>
              Templates
            </Typography>
            <Stack spacing={1}>
              {templates.map((t) => (
                <Stack
                  key={t.id}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2">{t.name || t.title}</Typography>
                  <Chip label={t.report_type || 'Report'} size="small" variant="outlined" />
                </Stack>
              ))}
              {templates.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No templates
                </Typography>
              )}
            </Stack>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Generated Reports
              </Typography>
            </Stack>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Report</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Generated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Typography variant="subtitle2">{r.name || r.title || '-'}</Typography>
                      </TableCell>
                      <TableCell>{r.report_type || '-'}</TableCell>
                      <TableCell>
                        {r.period || `${r.start_date || ''} - ${r.end_date || ''}`}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={r.status || 'Generated'}
                          size="small"
                          color={
                            r.status === 'Completed' || r.status === 'Generated'
                              ? 'success'
                              : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {reports.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No reports generated
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
