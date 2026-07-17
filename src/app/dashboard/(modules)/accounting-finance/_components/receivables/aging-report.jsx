'use client';

import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
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

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useRouteFilters } from './use-route-filters';
import { useReceivablesWorkspace } from './use-receivables-workspace';
import {
  exportReceivablesCsv,
  printReceivablesPack,
  exportReceivablesExcel,
} from './receivables-export';

export default function ReceivableAgingReport() {
  const [pendingAction, setPendingAction] = useState(null);
  const { filters, updateFilter, buildHref } = useRouteFilters([
    {
      key: 'cutoffDate',
      defaultValue: '2026-03-29',
    },
    {
      key: 'focus',
      defaultValue: 'all',
      allowedValues: ['all', 'not-due', '1-30', '31-60', '61-90', '90-plus'],
    },
  ]);

  const { cutoffDate, focus } = filters;
  const { agingBuckets: buckets } = useReceivablesWorkspace(cutoffDate);
  const filteredBuckets = buckets.filter((bucket) =>
    focus === 'all' ? true : bucket.id === focus
  );
  const total = buckets.reduce((sum, bucket) => sum + bucket.amount, 0);

  const exportConfig = {
    title: 'Receivable Aging Report',
    subtitle: `Cutoff ${cutoffDate}`,
    summary: filteredBuckets.map((bucket) => ({
      label: bucket.label,
      value: formatCurrency(bucket.amount),
      helper: `${bucket.count} invoices`,
    })),
    tables: [
      {
        title: 'Aging Buckets',
        columns: [
          { key: 'bucket', label: 'Bucket' },
          { key: 'amount', label: 'Amount' },
          { key: 'count', label: 'Invoices' },
          { key: 'approvals', label: 'Approvals' },
          { key: 'disputes', label: 'Disputes' },
        ],
        rows: filteredBuckets.map((bucket) => ({
          bucket: bucket.label,
          amount: formatCurrency(bucket.amount),
          count: bucket.count,
          approvals: bucket.approvals,
          disputes: bucket.disputed,
        })),
      },
    ],
    payload: { cutoffDate, buckets: filteredBuckets, total },
  };

  const runAction = async (label, action, successMessage) => {
    const loadingId = toast.loading(`${label}...`);
    setPendingAction(label);

    try {
      await action();
      toast.dismiss(loadingId);
      toast.success(successMessage);
    } catch (error) {
      toast.dismiss(loadingId);
      toast.error(error?.message || `${label} failed`);
    } finally {
      setPendingAction(null);
    }
  };

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
            Receivable Aging Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Aging bucket exposure with approval counts, disputes, and batch follow-up routing.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            onClick={() =>
              runAction(
                'Export Aging CSV',
                () => exportReceivablesCsv('receivable-aging-report', exportConfig),
                'Aging CSV exported'
              )
            }
            disabled={pendingAction !== null}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:download-minimalistic-bold" />}
            onClick={() =>
              runAction(
                'Export Aging Excel',
                () => exportReceivablesExcel('receivable-aging-report', exportConfig),
                'Aging workbook exported'
              )
            }
            disabled={pendingAction !== null}
          >
            Export Aging
          </Button>
          <Button
            component={RouterLink}
            href={buildHref(paths.dashboard.accountingFinance.receivables.collectionFollowUp, {
              priority: 'high',
            })}
            variant="outlined"
            startIcon={<Iconify icon="solar:clipboard-list-bold" />}
          >
            Open Queue
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:mailbox-bold" />}
            onClick={() =>
              runAction(
                'Follow-Up Batch',
                () => printReceivablesPack(exportConfig),
                'Aging follow-up pack opened'
              )
            }
            disabled={pendingAction !== null}
          >
            Start Follow-Up Batch
          </Button>
        </Stack>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        Aging analysis now supports dynamic cutoff dates, bucket drill-down, and batch collection
        context using the shared mock receivables layer.
      </Alert>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              type="date"
              size="small"
              label="Cutoff date"
              value={cutoffDate}
              onChange={(event) => updateFilter('cutoffDate', event.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 220 }}
            />
            <TextField
              select
              size="small"
              label="Bucket focus"
              value={focus}
              onChange={(event) => updateFilter('focus', event.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="all">All buckets</MenuItem>
              {buckets.map((bucket) => (
                <MenuItem key={bucket.id} value={bucket.id}>
                  {bucket.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {buckets.map((bucket) => (
          <Grid key={bucket.id} size={{ xs: 12, sm: 6, lg: 2.4 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  {bucket.label}
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ mt: 0.75 }}>
                  {formatCurrency(bucket.amount)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {`${bucket.count} invoices • ${bucket.approvals} approvals • ${bucket.disputed} disputes`}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Bucket</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Invoices</TableCell>
                <TableCell align="right">Approvals</TableCell>
                <TableCell align="right">Disputes</TableCell>
                <TableCell align="right">Share</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBuckets.map((bucket) => (
                <TableRow key={bucket.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {bucket.label}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(bucket.amount)}</TableCell>
                  <TableCell align="right">{bucket.count}</TableCell>
                  <TableCell align="right">{bucket.approvals}</TableCell>
                  <TableCell align="right">{bucket.disputed}</TableCell>
                  <TableCell align="right">
                    {total ? `${((bucket.amount / total) * 100).toFixed(1)}%` : '0%'}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      component={RouterLink}
                      href={buildHref(
                        paths.dashboard.accountingFinance.receivables.agingBucketDetail(bucket.id)
                      )}
                      variant="outlined"
                      color="inherit"
                    >
                      View Bucket
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
