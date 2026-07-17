'use client';

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
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useCurrency } from '../currency-context';
import { useBankingWorkspace } from './use-banking-workspace';

const STATUS_COLORS = {
  pending_approval: 'warning',
  approved: 'info',
  in_transit: 'secondary',
  completed: 'success',
  cancelled: 'default',
};

const STATUS_TIMELINE = ['pending_approval', 'approved', 'in_transit', 'completed'];

function DetailRow({ label, value }) {
  return (
    <TableRow>
      <TableCell sx={{ color: 'text.secondary', width: '40%' }}>{label}</TableCell>
      <TableCell sx={{ fontWeight: 600 }}>{value ?? '—'}</TableCell>
    </TableRow>
  );
}

export default function TransferDetail({ id }) {
  useCurrency();
  const { accounts, transfers, formatBankingStatus, isLoading } = useBankingWorkspace();

  const transferId = Number(id);
  const transfer = transfers.find((t) => t.id === transferId);
  const fromAccount = transfer ? accounts.find((a) => a.id === transfer.fromAccountId) : null;
  const toAccount = transfer ? accounts.find((a) => a.id === transfer.toAccountId) : null;

  if (isLoading && !transfer) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!transfer) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Transfer not found.</Alert>
        <Button
          component={RouterLink}
          href={paths.dashboard.accountingFinance.banking.transfers}
          startIcon={<Iconify icon="solar:arrow-left-bold" />}
          sx={{ mt: 2 }}
        >
          Back to Transfers
        </Button>
      </Box>
    );
  }

  const isCancelled = transfer.status === 'cancelled';
  const currentStep = STATUS_TIMELINE.indexOf(transfer.status);

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
            href={paths.dashboard.accountingFinance.banking.transfers}
          >
            <Iconify icon="solar:arrow-left-bold" />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={800}>
              {transfer.reference}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {fromAccount?.name || 'Unknown'} → {toAccount?.name || 'Unknown'}
            </Typography>
          </Box>
          <Chip
            label={formatBankingStatus(transfer.status)}
            color={STATUS_COLORS[transfer.status]}
            sx={{ textTransform: 'capitalize' }}
          />
        </Stack>
        <Button
          component={RouterLink}
          href={paths.dashboard.accountingFinance.banking.transfers}
          variant="outlined"
          color="inherit"
          startIcon={<Iconify icon="solar:arrow-left-bold" />}
        >
          Back
        </Button>
      </Stack>

      {isCancelled && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          This transfer has been cancelled and is no longer active.
        </Alert>
      )}

      {/* Amount highlight */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Transfer Amount
              </Typography>
              <Typography variant="h3" fontWeight={800} sx={{ mt: 0.5 }}>
                {formatCurrency(transfer.amount)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="caption" color="text.secondary">
                From Account
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
                {fromAccount?.name || 'Unknown'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {fromAccount?.maskedNumber}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="caption" color="text.secondary">
                To Account
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
                {toAccount?.name || 'Unknown'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {toAccount?.maskedNumber}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Priority
              </Typography>
              <Chip
                label={transfer.priority}
                size="small"
                color={
                  transfer.priority === 'critical'
                    ? 'error'
                    : transfer.priority === 'high'
                      ? 'warning'
                      : 'default'
                }
                sx={{ mt: 0.5, textTransform: 'capitalize' }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Transfer details */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                Transfer Details
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <DetailRow label="Reference" value={transfer.reference} />
                    <DetailRow label="From Account" value={fromAccount?.name} />
                    <DetailRow label="To Account" value={toAccount?.name} />
                    <DetailRow label="Amount" value={formatCurrency(transfer.amount)} />
                    <DetailRow label="Priority" value={transfer.priority} />
                    <DetailRow label="Status" value={formatBankingStatus(transfer.status)} />
                    <DetailRow label="Owner" value={transfer.owner} />
                    <DetailRow label="Approver" value={transfer.approver} />
                    <DetailRow
                      label="Requested Date"
                      value={
                        transfer.requestedDate
                          ? new Date(transfer.requestedDate).toLocaleDateString()
                          : '—'
                      }
                    />
                    <DetailRow
                      label="Scheduled Date"
                      value={
                        transfer.scheduledDate
                          ? new Date(transfer.scheduledDate).toLocaleDateString()
                          : '—'
                      }
                    />
                    <DetailRow
                      label="Posted Date"
                      value={
                        transfer.postedDate
                          ? new Date(transfer.postedDate).toLocaleDateString()
                          : 'Not yet posted'
                      }
                    />
                    <DetailRow label="Trace Code" value={transfer.traceCode} />
                    <DetailRow
                      label="Journal Entry"
                      value={transfer.journalEntry || 'Not yet posted'}
                    />
                    <DetailRow label="Purpose" value={transfer.purpose} />
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Lifecycle */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                Approval Lifecycle
              </Typography>
              {isCancelled && (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                  Transfer was cancelled before completion.
                </Alert>
              )}
              <Stack spacing={2}>
                {STATUS_TIMELINE.map((step, index) => {
                  const isPast = !isCancelled && currentStep > index;
                  const isCurrent = !isCancelled && currentStep === index;

                  return (
                    <Stack key={step} direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor:
                            isPast || isCurrent ? 'primary.main' : 'action.disabledBackground',
                          color: isPast || isCurrent ? 'primary.contrastText' : 'text.disabled',
                          flexShrink: 0,
                        }}
                      >
                        {isPast ? (
                          <Iconify icon="solar:check-circle-bold" width={20} />
                        ) : (
                          <Typography variant="caption" fontWeight={700}>
                            {index + 1}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{ textTransform: 'capitalize' }}
                        >
                          {step.replace(/_/g, ' ')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {step === 'pending_approval' && 'Transfer awaiting approver sign-off'}
                          {step === 'approved' && 'Approved and ready for posting to journal'}
                          {step === 'in_transit' &&
                            'Journal posted — funds moving between accounts'}
                          {step === 'completed' &&
                            'Treasury confirmed receipt on destination account'}
                        </Typography>
                      </Box>
                      {isCurrent && <Chip label="Current" size="small" color="primary" />}
                    </Stack>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>

          {/* Account cards */}
          <Grid container spacing={2}>
            {fromAccount && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1.5 }}
                    >
                      <Typography variant="subtitle2" fontWeight={700}>
                        From Account
                      </Typography>
                      <IconButton
                        size="small"
                        component={RouterLink}
                        href={paths.dashboard.accountingFinance.banking.bankAccountDetail(
                          fromAccount.id
                        )}
                      >
                        <Iconify icon="solar:eye-bold" width={16} />
                      </IconButton>
                    </Stack>
                    <Typography variant="body2" fontWeight={700}>
                      {fromAccount.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {fromAccount.bankName} • {fromAccount.maskedNumber}
                    </Typography>
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Balance
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(fromAccount.balance, fromAccount.currency)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        Available
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(fromAccount.availableBalance, fromAccount.currency)}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}
            {toAccount && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1.5 }}
                    >
                      <Typography variant="subtitle2" fontWeight={700}>
                        To Account
                      </Typography>
                      <IconButton
                        size="small"
                        component={RouterLink}
                        href={paths.dashboard.accountingFinance.banking.bankAccountDetail(
                          toAccount.id
                        )}
                      >
                        <Iconify icon="solar:eye-bold" width={16} />
                      </IconButton>
                    </Stack>
                    <Typography variant="body2" fontWeight={700}>
                      {toAccount.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {toAccount.bankName} • {toAccount.maskedNumber}
                    </Typography>
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Balance
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(toAccount.balance, toAccount.currency)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        Available
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(toAccount.availableBalance, toAccount.currency)}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
