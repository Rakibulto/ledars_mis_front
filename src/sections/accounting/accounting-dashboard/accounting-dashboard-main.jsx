'use client';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import SummaryCard from '../../_components/summary-card';

const EP = endpoints.accounting;

export default function AccountingDashboardPage() {
  const { data: dashData, loading, error } = useGetRequest(EP.dashboard);
  const { data: accData } = useGetRequest(EP.accounts);
  const { data: jeData } = useGetRequest(EP.journal_entries);
  const { data: vData } = useGetRequest(EP.vouchers);

  const accounts = useMemo(() => accData?.results || accData || [], [accData]);
  const journalEntries = useMemo(() => jeData?.results || jeData || [], [jeData]);
  const vouchers = useMemo(() => vData?.results || vData || [], [vData]);

  const stats = useMemo(() => {
    const posted = journalEntries.filter((je) => je.status === 'Posted').length;
    const draft = journalEntries.filter((je) => je.status === 'Draft').length;
    const pendingVouchers = vouchers.filter(
      (v) => v.status === 'Pending' || v.status === 'Submitted'
    ).length;
    return { posted, draft, pendingVouchers };
  }, [journalEntries, vouchers]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Accounting Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Financial overview and key metrics
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Chart of Accounts"
            value={accounts.length}
            icon="solar:notebook-bold-duotone"
            color="#2563eb"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Journal Entries"
            value={journalEntries.length}
            icon="solar:document-text-bold-duotone"
            color="#8b5cf6"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Posted Entries"
            value={stats.posted}
            icon="solar:check-circle-bold-duotone"
            color="#10b981"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Pending Vouchers"
            value={stats.pendingVouchers}
            icon="solar:clock-circle-bold-duotone"
            color="#f97316"
            loading={loading}
            error={error}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
            }}
          >
            <Typography variant="h6" fontWeight={600} mb={2}>
              Journal Entries Summary
            </Typography>
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Total Entries</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {journalEntries.length}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Posted</Typography>
                <Typography variant="body2" fontWeight={600} color="success.main">
                  {stats.posted}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Draft</Typography>
                <Typography variant="body2" fontWeight={600} color="warning.main">
                  {stats.draft}
                </Typography>
              </Stack>
            </Stack>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
            }}
          >
            <Typography variant="h6" fontWeight={600} mb={2}>
              Vouchers Overview
            </Typography>
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Total Vouchers</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {vouchers.length}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Pending</Typography>
                <Typography variant="body2" fontWeight={600} color="warning.main">
                  {stats.pendingVouchers}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Approved</Typography>
                <Typography variant="body2" fontWeight={600} color="success.main">
                  {vouchers.filter((v) => v.status === 'Approved' || v.status === 'Posted').length}
                </Typography>
              </Stack>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
