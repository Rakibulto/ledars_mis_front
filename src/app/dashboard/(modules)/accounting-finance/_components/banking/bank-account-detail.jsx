'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
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

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useCurrency } from '../currency-context';
import { useBankingWorkspace } from './use-banking-workspace';

const FEED_COLORS = {
  healthy: 'success',
  warning: 'warning',
  manual: 'default',
};

const STATUS_COLORS = {
  completed: 'success',
  in_progress: 'warning',
  imported: 'info',
  draft: 'default',
};

function DetailRow({ label, value }) {
  return (
    <TableRow>
      <TableCell sx={{ color: 'text.secondary', width: '40%' }}>{label}</TableCell>
      <TableCell sx={{ fontWeight: 600 }}>{value ?? '—'}</TableCell>
    </TableRow>
  );
}

export default function BankAccountDetail({ id }) {
  useCurrency();
  const { accounts, statements, checks, transfers, formatBankingStatus, isLoading } =
    useBankingWorkspace();

  const accountId = Number(id);
  const account = accounts.find((a) => a.id === accountId);

  const accountStatements = statements.filter((s) => s.bankAccountId === accountId);
  const accountChecks = checks.filter((c) => c.bankAccountId === accountId);
  const accountTransfers = transfers.filter(
    (t) => t.fromAccountId === accountId || t.toAccountId === accountId
  );

  if (isLoading && !account) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!account) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Bank account not found.</Alert>
        <Button
          component={RouterLink}
          href={paths.dashboard.accountingFinance.banking.bankAccounts}
          startIcon={<Iconify icon="solar:arrow-left-bold" />}
          sx={{ mt: 2 }}
        >
          Back to Bank Accounts
        </Button>
      </Box>
    );
  }

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
            href={paths.dashboard.accountingFinance.banking.bankAccounts}
          >
            <Iconify icon="solar:arrow-left-bold" />
          </IconButton>
          <Avatar
            sx={{
              bgcolor: account.type === 'cash' ? '#16a34a15' : '#2563eb15',
              color: account.type === 'cash' ? '#16a34a' : '#2563eb',
              width: 56,
              height: 56,
            }}
          >
            <Iconify
              icon={account.type === 'cash' ? 'solar:wallet-money-bold' : 'solar:card-bold'}
              width={28}
            />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={800}>
              {account.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {account.bankName} • {account.maskedNumber} • {account.currency}
            </Typography>
          </Box>
          <Chip
            label={formatBankingStatus(account.feedStatus)}
            color={FEED_COLORS[account.feedStatus]}
          />
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <Button
            component={RouterLink}
            href={paths.dashboard.accountingFinance.banking.bankStatements}
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:document-text-bold" />}
          >
            Statements
          </Button>
          <Button
            component={RouterLink}
            href={paths.dashboard.accountingFinance.banking.reconciliation}
            variant="contained"
            startIcon={<Iconify icon="solar:check-circle-bold" />}
          >
            Reconcile
          </Button>
        </Stack>
      </Stack>

      {/* Balance summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Current Balance
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {formatCurrency(account.balance, account.currency)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Ledger book balance
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Available Balance
              </Typography>
              <Typography
                variant="h5"
                fontWeight={800}
                color={account.availableBalance < 0 ? 'error.main' : 'inherit'}
                sx={{ mt: 0.75 }}
              >
                {formatCurrency(account.availableBalance, account.currency)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                After pending items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Pending Balance
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {formatCurrency(account.pendingBalance, account.currency)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                In-transit net movement
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Overdraft Limit
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {formatCurrency(account.overdraftLimit, account.currency)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Authorized facility
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Account details */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                Account Details
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <DetailRow label="Account Code" value={account.code} />
                    <DetailRow label="Account Number" value={account.accountNumber} />
                    <DetailRow label="Bank Name" value={account.bankName} />
                    <DetailRow label="Currency" value={account.currency} />
                    <DetailRow label="Account Type" value={account.type} />
                    <DetailRow label="Owner" value={account.owner} />
                    <DetailRow label="Journal" value={account.journal} />
                    <DetailRow label="Feed Provider" value={account.feedProvider} />
                    <DetailRow label="Statement Frequency" value={account.statementFrequency} />
                    <DetailRow
                      label="Last Sync"
                      value={
                        account.lastSyncAt
                          ? new Date(account.lastSyncAt).toLocaleString()
                          : 'Not synced'
                      }
                    />
                    <DetailRow
                      label="Feed Status"
                      value={formatBankingStatus(account.feedStatus)}
                    />
                    <DetailRow
                      label="Reconciliation Enabled"
                      value={account.allowReconciliation ? 'Yes' : 'No'}
                    />
                    <DetailRow label="Unmatched Lines" value={account.unmatchedLines} />
                    <DetailRow label="Outstanding Checks" value={account.outstandingChecks} />
                    <DetailRow
                      label="Outstanding Check Value"
                      value={formatCurrency(account.outstandingCheckValue, account.currency)}
                    />
                    <DetailRow
                      label="Latest Statement Date"
                      value={
                        account.latestStatementDate
                          ? new Date(account.latestStatementDate).toLocaleDateString()
                          : '—'
                      }
                    />
                    <DetailRow
                      label="Statement Balance"
                      value={formatCurrency(account.statementBalance, account.currency)}
                    />
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          {/* Statements */}
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6" fontWeight={800}>
                  Statement History
                </Typography>
                <Button
                  component={RouterLink}
                  href={paths.dashboard.accountingFinance.banking.bankStatements}
                  size="small"
                  variant="outlined"
                  color="inherit"
                >
                  View All
                </Button>
              </Stack>
              {accountStatements.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No statements imported yet.
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Period</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Closing</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Open Items</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {accountStatements.map((statement) => (
                        <TableRow key={statement.id} hover>
                          <TableCell>{statement.period}</TableCell>
                          <TableCell>
                            {new Date(statement.statementDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(statement.closingBalance)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={formatBankingStatus(statement.status)}
                              size="small"
                              color={STATUS_COLORS[statement.status]}
                            />
                          </TableCell>
                          <TableCell align="right">{statement.unmatchedCount}</TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              component={RouterLink}
                              href={paths.dashboard.accountingFinance.banking.bankStatementDetail(
                                statement.id
                              )}
                            >
                              <Iconify icon="solar:eye-bold" width={16} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Checks */}
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6" fontWeight={800}>
                  Checks
                </Typography>
                <Button
                  component={RouterLink}
                  href={paths.dashboard.accountingFinance.banking.checkManagement}
                  size="small"
                  variant="outlined"
                  color="inherit"
                >
                  View All
                </Button>
              </Stack>
              {accountChecks.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No checks issued from this account.
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Check #</TableCell>
                        <TableCell>Payee</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {accountChecks.map((check) => (
                        <TableRow key={check.id} hover>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                            {check.checkNumber}
                          </TableCell>
                          <TableCell>{check.payee}</TableCell>
                          <TableCell align="right">{formatCurrency(check.amount)}</TableCell>
                          <TableCell>
                            <Chip label={formatBankingStatus(check.status)} size="small" />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              component={RouterLink}
                              href={paths.dashboard.accountingFinance.banking.checkDetail(check.id)}
                            >
                              <Iconify icon="solar:eye-bold" width={16} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Transfers */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6" fontWeight={800}>
                  Transfers
                </Typography>
                <Button
                  component={RouterLink}
                  href={paths.dashboard.accountingFinance.banking.transfers}
                  size="small"
                  variant="outlined"
                  color="inherit"
                >
                  View All
                </Button>
              </Stack>
              {accountTransfers.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No transfers linked to this account.
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Reference</TableCell>
                        <TableCell>Direction</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {accountTransfers.map((transfer) => (
                        <TableRow key={transfer.id} hover>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                            {transfer.reference}
                          </TableCell>
                          <TableCell>
                            {transfer.fromAccountId === accountId ? (
                              <Chip label="Outgoing" size="small" color="error" />
                            ) : (
                              <Chip label="Incoming" size="small" color="success" />
                            )}
                          </TableCell>
                          <TableCell align="right">{formatCurrency(transfer.amount)}</TableCell>
                          <TableCell>
                            <Chip label={formatBankingStatus(transfer.status)} size="small" />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              component={RouterLink}
                              href={paths.dashboard.accountingFinance.banking.transferDetail(
                                transfer.id
                              )}
                            >
                              <Iconify icon="solar:eye-bold" width={16} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
