'use client';

import useSWR from 'swr';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fetcher, endpoints } from 'src/utils/axios';

import { Iconify } from 'src/components/iconify';

import { useCurrency } from '../currency-context';
import { useBankingWorkspace } from './use-banking-workspace';

const STATUS_COLORS = {
  completed: 'success',
  in_progress: 'warning',
  pending: 'default',
  cancelled: 'error',
};

function DetailRow({ label, value }) {
  return (
    <TableRow>
      <TableCell sx={{ color: 'text.secondary', width: '40%' }}>{label}</TableCell>
      <TableCell sx={{ fontWeight: 600 }}>{value ?? '—'}</TableCell>
    </TableRow>
  );
}

export default function ReconciliationDetail({ id }) {
  const { formatAmount } = useCurrency();
  const { formatBankingStatus } = useBankingWorkspace();

  const detailUrl = id ? endpoints.accounting.bank_reconciliation_by_id(id) : null;
  const { data: rec, isLoading } = useSWR(detailUrl, fetcher);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!rec) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Reconciliation detail not found.</Alert>
        <Button
          component={RouterLink}
          href={paths.dashboard.accountingFinance.banking.reconciliation}
          startIcon={<Iconify icon="solar:arrow-left-bold" />}
          sx={{ mt: 2 }}
        >
          Back to Reconciliation
        </Button>
      </Box>
    );
  }

  const account = rec.bank_account_detail;
  const lines = rec.lines ?? [];
  const matchedCount = lines.filter((l) => l.is_matched).length;
  const unmatchedCount = lines.length - matchedCount;
  const computedDifference = Math.abs(
    parseFloat(rec?.book_balance || 0) - parseFloat(rec?.statement_balance || 0)
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton
            component={RouterLink}
            href={paths.dashboard.accountingFinance.banking.reconciliation}
          >
            <Iconify icon="solar:arrow-left-bold" />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={800}>
              {account?.name} — {rec.statement_date}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Reconciliation details for the selected statement period.
            </Typography>
          </Box>
          <Chip
            label={formatBankingStatus(rec.status)}
            color={STATUS_COLORS[rec.status] || 'default'}
          />
        </Stack>

        <Button
          component={RouterLink}
          href={paths.dashboard.accountingFinance.banking.reconciliation}
          variant="contained"
          startIcon={<Iconify icon="solar:arrow-left-bold" />}
        >
          Back to Reconciliation
        </Button>
      </Stack>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Book Balance
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {formatAmount(rec.book_balance ?? 0, account?.currency_code)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Current ledger balance for the selected account.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Statement Balance
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {formatAmount(rec.statement_balance ?? 0, account?.currency_code)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Imported closing balance from the bank statement.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Difference
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {computedDifference.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Amount still pending reconciliation.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Matched Lines
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {matchedCount} / {lines.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Lines matched out of total statement lines.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Statement Info */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                Statement Information
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <DetailRow label="Bank Account" value={account?.name} />
                    <DetailRow label="Account Number" value={account?.account_number} />
                    <DetailRow label="Bank Name" value={account?.bank_name} />
                    <DetailRow label="Currency" value={account?.currency_code} />
                    <DetailRow
                      label="Statement Date"
                      value={
                        rec.statement_date ? new Date(rec.statement_date).toLocaleDateString() : '—'
                      }
                    />
                    <DetailRow label="Status" value={formatBankingStatus(rec.status)} />
                    <DetailRow label="Notes" value={rec.notes || '—'} />
                    <DetailRow
                      label="Completed At"
                      value={
                        rec.completed_at ? new Date(rec.completed_at).toLocaleDateString() : '—'
                      }
                    />
                    <DetailRow
                      label="Created At"
                      value={rec.created_at ? new Date(rec.created_at).toLocaleDateString() : '—'}
                    />
                    <DetailRow label="Total Lines" value={lines.length} />
                    <DetailRow label="Matched Lines" value={matchedCount} />
                    <DetailRow label="Unmatched Lines" value={unmatchedCount} />
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Lines Table */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6" fontWeight={800}>
                  Statement Lines
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip label={`${matchedCount} matched`} size="small" color="success" />
                  <Chip label={`${unmatchedCount} unmatched`} size="small" color="warning" />
                </Stack>
              </Stack>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Matched</TableCell>
                      <TableCell>Difference</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lines.map((line) => {
                      const tx = line.transaction_detail;
                      return (
                        <TableRow key={line.id} hover>
                          <TableCell>
                            {tx?.date ? new Date(tx.date).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {tx?.description || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>
                            {tx?.reference || '—'}
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              color={
                                tx?.transaction_type === 'credit' ? 'success.main' : 'error.main'
                              }
                            >
                              {formatAmount(tx?.amount ?? 0, account?.currency_code)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={tx?.type_display || tx?.transaction_type || '—'}
                              size="small"
                              color={tx?.transaction_type === 'credit' ? 'success' : 'error'}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={line.is_matched ? 'Matched' : 'Unmatched'}
                              size="small"
                              color={line.is_matched ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              color={line.is_matched ? 'success.main' : 'error.main'}
                            >
                              {line.is_matched
                                ? formatAmount(0, account?.currency_code)
                                : formatAmount(
                                    Math.abs(parseFloat(line.transaction_detail?.amount || 0)),
                                    account?.currency_code
                                  )}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
