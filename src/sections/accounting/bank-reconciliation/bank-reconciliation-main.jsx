'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import SummaryCard from '../../_components/summary-card';

const EP = endpoints.accounting;
const STATUS_COLOR = { Draft: 'default', 'In Progress': 'info', Completed: 'success' };

export default function BankReconciliationPage() {
  const { data, loading, error } = useGetRequest(EP.bank_reconciliations);
  const { data: bankData } = useGetRequest(EP.bank_accounts);

  const reconciliations = useMemo(() => data?.results || data || [], [data]);
  const banks = useMemo(() => bankData?.results || bankData || [], [bankData]);

  const stats = useMemo(
    () => ({
      total: reconciliations.length,
      completed: reconciliations.filter((r) => r.status === 'Completed').length,
      inProgress: reconciliations.filter((r) => r.status === 'In Progress').length,
      bankAccounts: banks.length,
    }),
    [reconciliations, banks]
  );

  const handleComplete = useCallback(async (id) => {
    try {
      await axiosInstance.post(EP.bank_reconciliation_complete(id));
      mutate(EP.bank_reconciliations);
      toast.success('Reconciliation completed');
    } catch (err) {
      toast.error(err.message || 'Failed to complete');
    }
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Bank Reconciliation
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Reconcile bank statements with system records
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Reconciliations"
            value={stats.total}
            icon="solar:document-text-bold-duotone"
            color="#2563eb"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Bank Accounts"
            value={stats.bankAccounts}
            icon="solar:wallet-bold-duotone"
            color="#8b5cf6"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="In Progress"
            value={stats.inProgress}
            icon="solar:refresh-circle-bold-duotone"
            color="#f97316"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Completed"
            value={stats.completed}
            icon="solar:check-circle-bold-duotone"
            color="#10b981"
            loading={loading}
            error={error}
          />
        </Grid>
      </Grid>

      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Bank Account</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Statement Balance</TableCell>
                <TableCell>System Balance</TableCell>
                <TableCell>Difference</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reconciliations.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {r.bank_account_name || r.bank_account || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{r.period || r.date || '-'}</TableCell>
                  <TableCell>
                    {r.statement_balance
                      ? `UGX ${Number(r.statement_balance).toLocaleString()}`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {r.system_balance ? `UGX ${Number(r.system_balance).toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell>
                    {r.difference != null ? `UGX ${Number(r.difference).toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={r.status || 'Draft'}
                      size="small"
                      color={STATUS_COLOR[r.status] || 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {r.status !== 'Completed' && (
                      <Button size="small" variant="outlined" onClick={() => handleComplete(r.id)}>
                        Complete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {reconciliations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No reconciliations found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
