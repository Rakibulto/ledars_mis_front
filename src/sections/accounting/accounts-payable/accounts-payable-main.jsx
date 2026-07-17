'use client';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
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
const STATUS_COLOR = {
  Draft: 'default',
  Pending: 'warning',
  Approved: 'info',
  Posted: 'success',
  Paid: 'primary',
  Overdue: 'error',
};

export default function AccountsPayablePage() {
  const { data, loading, error } = useGetRequest(EP.bills);
  const { data: vendorData } = useGetRequest(EP.vendors);

  const bills = useMemo(() => data?.results || data || [], [data]);
  const vendors = useMemo(() => vendorData?.results || vendorData || [], [vendorData]);

  const stats = useMemo(() => {
    const totalAmount = bills.reduce((s, b) => s + (Number(b.total_amount || b.amount) || 0), 0);
    const unpaid = bills.filter((b) => b.status !== 'Paid');
    const unpaidAmount = unpaid.reduce((s, b) => s + (Number(b.total_amount || b.amount) || 0), 0);
    return { totalAmount, unpaidCount: unpaid.length, unpaidAmount };
  }, [bills]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Accounts Payable
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Vendor bills and payment tracking
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Bills"
            value={bills.length}
            icon="solar:bill-list-bold-duotone"
            color="#2563eb"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Vendors"
            value={vendors.length}
            icon="solar:users-group-rounded-bold-duotone"
            color="#8b5cf6"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Unpaid Bills"
            value={stats.unpaidCount}
            icon="solar:clock-circle-bold-duotone"
            color="#f97316"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Payable"
            value={`UGX ${stats.unpaidAmount.toLocaleString()}`}
            icon="solar:wallet-bold-duotone"
            color="#ef4444"
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
                <TableCell>Bill #</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bills.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {b.bill_number || b.reference || b.id}
                    </Typography>
                  </TableCell>
                  <TableCell>{b.vendor_name || b.vendor || '-'}</TableCell>
                  <TableCell>
                    {b.total_amount || b.amount
                      ? `UGX ${Number(b.total_amount || b.amount).toLocaleString()}`
                      : '-'}
                  </TableCell>
                  <TableCell>{b.due_date || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={b.status || 'Draft'}
                      size="small"
                      color={STATUS_COLOR[b.status] || 'default'}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {bills.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No bills found
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
