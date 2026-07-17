'use client';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useRouteFilters } from './use-route-filters';
import { useReceivablesWorkspace } from './use-receivables-workspace';

const RISK_COLORS = {
  low: 'success',
  medium: 'warning',
  high: 'error',
};

export default function CustomerLedger() {
  const [search, setSearch] = useState('');
  const { filters, updateFilter, buildHref } = useRouteFilters([
    {
      key: 'segment',
      defaultValue: 'all',
      allowedValues: ['all', 'Institutional', 'NGO', 'Education'],
    },
    {
      key: 'risk',
      defaultValue: 'all',
      allowedValues: ['all', 'low', 'medium', 'high'],
    },
    {
      key: 'bucket',
      defaultValue: 'all',
      allowedValues: ['all', 'not-due', '1-30', '31-60', '61-90', '90-plus'],
    },
  ]);

  const { segment } = filters;
  const { risk } = filters;
  const { bucket } = filters;
  const { customerLedgerRows } = useReceivablesWorkspace();

  const rows = useMemo(
    () =>
      customerLedgerRows.filter((customer) => {
        if (segment !== 'all' && customer.segment !== segment) return false;
        if (risk !== 'all' && customer.riskLevel !== risk) return false;
        if (bucket !== 'all' && !(customer.bucketMix?.[bucket] > 0)) return false;
        if (search) {
          const term = search.toLowerCase();
          if (
            !customer.name.toLowerCase().includes(term) &&
            !customer.collector.toLowerCase().includes(term)
          ) {
            return false;
          }
        }
        return true;
      }),
    [bucket, customerLedgerRows, risk, search, segment]
  );

  const outstanding = rows.reduce((sum, item) => sum + item.outstanding, 0);
  const disputes = rows.reduce((sum, item) => sum + item.disputeFlags, 0);
  const approvals = rows.filter((item) => item.approvalState !== 'approved').length;
  const nextActions = rows.filter((item) => item.nextActionDate !== 'No action scheduled').length;

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Customer Ledger
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Customer receivable exposure, dispute posture, aging signals, and collector ownership.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Iconify icon="solar:shield-warning-bold" />}>
          Review Disputes
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        This ledger now uses shared mock receivables data with drill-down detail pages, dispute
        visibility, and approval context.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Outstanding balance', value: formatCurrency(outstanding) },
          { label: 'Dispute flags', value: disputes },
          { label: 'Approval reviews', value: approvals },
          { label: 'Action dates set', value: nextActions },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, md: 3 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  {card.label}
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              size="small"
              placeholder="Search customer or collector"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ minWidth: 240 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:magnifer-linear" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              label="Segment"
              value={segment}
              onChange={(event) => updateFilter('segment', event.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="all">All segments</MenuItem>
              <MenuItem value="Institutional">Institutional</MenuItem>
              <MenuItem value="NGO">NGO</MenuItem>
              <MenuItem value="Education">Education</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              label="Risk level"
              value={risk}
              onChange={(event) => updateFilter('risk', event.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="all">All risk levels</MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              label="Aging bucket"
              value={bucket}
              onChange={(event) => updateFilter('bucket', event.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="all">All aging buckets</MenuItem>
              <MenuItem value="not-due">Not due</MenuItem>
              <MenuItem value="1-30">1-30 days</MenuItem>
              <MenuItem value="31-60">31-60 days</MenuItem>
              <MenuItem value="61-90">61-90 days</MenuItem>
              <MenuItem value="90-plus">90+ days</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Collector</TableCell>
                <TableCell>Risk</TableCell>
                <TableCell>Open Invoices</TableCell>
                <TableCell>Oldest Aging</TableCell>
                <TableCell>Aging Mix</TableCell>
                <TableCell>Next Action</TableCell>
                <TableCell>Approval</TableCell>
                <TableCell align="right">Outstanding</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((customer) => (
                <TableRow key={customer.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {customer.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {customer.email} • {customer.segment} • {customer.disputeFlags} disputes
                    </Typography>
                  </TableCell>
                  <TableCell>{customer.collector}</TableCell>
                  <TableCell>
                    <Chip
                      label={customer.riskLevel}
                      size="small"
                      color={RISK_COLORS[customer.riskLevel]}
                    />
                  </TableCell>
                  <TableCell>{customer.openInvoiceCount}</TableCell>
                  <TableCell>
                    {customer.oldestDays ? `${customer.oldestDays} days` : 'Current'}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {Object.entries(customer.bucketMix || {}).map(([bucketId, amount]) => (
                        <Chip
                          key={bucketId}
                          size="small"
                          variant="outlined"
                          label={`${bucketId}: ${formatCurrency(amount)}`}
                        />
                      ))}
                      {!Object.keys(customer.bucketMix || {}).length ? (
                        <Chip size="small" label="Current" />
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {customer.nextActionDate}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {customer.collectionNote}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={customer.approvalState}
                      size="small"
                      color={customer.approvalState === 'approved' ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color={customer.outstanding ? 'error.main' : 'success.main'}
                    >
                      {formatCurrency(customer.outstanding)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {customer.disputeFlags} dispute flags
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      component={RouterLink}
                      href={buildHref(
                        paths.dashboard.accountingFinance.receivables.customerLedgerDetail(
                          customer.id
                        )
                      )}
                      variant="outlined"
                      color="inherit"
                    >
                      View Detail
                    </Button>
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
