'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import { Button } from '@mui/material';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { useCurrency } from '../currency-context';
import { useBankingWorkspace } from './use-banking-workspace';
import { BankingWorkspaceToolbar } from './banking-workspace-toolbar';

const FEED_COLORS = {
  healthy: 'success',
  warning: 'warning',
  manual: 'default',
};

const EMPTY_ACCOUNT = {
  name: '',
  bankName: '',
  accountNumber: '',
  currency: 'BDT',
  openingBalance: '',
  overdraftLimit: '',
  owner: '',
  journal: 'Bank Journal',
  feedEnabled: true,
  feedProvider: 'Bank feed API',
  statementFrequency: 'Daily',
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : 'Not synced');

function SummaryCard({ label, value, helper, icon, color = 'primary.main' }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              {helper}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}15`, color, width: 48, height: 48 }}>
            <Iconify icon={icon} width={24} />
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function BankAccountsList() {
  const { formatAmount } = useCurrency();
  const { accounts, statements, alerts, overview, formatBankingStatus, actions, isLoading } =
    useBankingWorkspace();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftAccount, setDraftAccount] = useState(EMPTY_ACCOUNT);

  const healthyFeeds = accounts.filter((account) => account.feedStatus === 'healthy').length;
  const unmatchedLines = accounts.reduce(
    (sum, account) => sum + Number(account.unmatchedLines || 0),
    0
  );
  const recentlyImported = useMemo(
    () =>
      statements
        .slice()
        .sort((left, right) => (right.statementDate || '').localeCompare(left.statementDate || ''))
        .slice(0, 5),
    [statements]
  );

  const createAccount = () => {
    actions.createBankAccount(draftAccount);
    toast.success('Bank account workspace updated');
    setDialogOpen(false);
    setDraftAccount(EMPTY_ACCOUNT);
  };

  const handleSync = (accountId) => {
    actions.syncBankFeed(accountId);
    toast.success('Bank feed synchronized');
  };

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Name</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Bank</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Number
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Balance
          </th>
        </tr>
      </thead>
      <tbody>
        {accounts.map((acct) => (
          <tr key={acct.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{acct.name}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {acct.bankName || acct.bank}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {acct.accountNumber || acct.number}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {acct.balance || acct.available}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <Box sx={{ p: 3 }}>
      <BankingWorkspaceToolbar printTitle="Bank Accounts" printContent={printContent} />
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Bank Accounts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor balances, feed health, pending liquidity, and direct handoff into statement
            review and reconciliation.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
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
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:check-circle-bold" />}
          >
            Reconciliation
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => setDialogOpen(true)}
          >
            Add Account
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {alerts.map((alert) => (
          <Alert key={alert.id} severity={alert.severity} sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {alert.title}
            </Typography>
            {alert.description}
          </Alert>
        ))}
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label="Tracked accounts"
            value={accounts.length}
            helper="Bank and cash positions in one treasury workspace"
            icon="solar:safe-square-bold"
            color="#1d4ed8"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label="Healthy feeds"
            value={`${healthyFeeds}/${accounts.filter((account) => account.allowReconciliation).length || accounts.length}`}
            helper="Connected accounts ready for statement intake"
            icon="solar:refresh-circle-bold"
            color="#059669"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label="Unmatched lines"
            value={unmatchedLines}
            helper="Exceptions still waiting for counterpart, write-off, or match"
            icon="solar:danger-circle-bold"
            color="#d97706"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label="Outstanding checks"
            value={formatAmount(overview.outstandingCheckValue)}
            helper={`${overview.outstandingCheckCount} instruments still reduce available liquidity`}
            icon="solar:bill-list-bold"
            color="#7c3aed"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Grid container spacing={3}>
            {isLoading && accounts.length === 0 && (
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: 200,
                  }}
                >
                  <CircularProgress />
                </Box>
              </Grid>
            )}
            {!isLoading && accounts.length === 0 && (
              <Grid size={{ xs: 12 }}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Stack spacing={2} alignItems="center" sx={{ py: 6 }}>
                      <Avatar
                        sx={{ bgcolor: '#2563eb15', color: '#2563eb', width: 64, height: 64 }}
                      >
                        <Iconify icon="solar:safe-square-bold" width={32} />
                      </Avatar>
                      <Typography variant="h6" fontWeight={700}>
                        No bank accounts yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        Add your first bank or cash account to start tracking balances, importing
                        statements, and reconciling transactions.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Iconify icon="solar:add-circle-bold" />}
                        onClick={() => setDialogOpen(true)}
                      >
                        Add Account
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}
            {accounts.map((account) => {
              const accountStatements = statements
                .filter((statement) => statement.bankAccountId === account.id)
                .slice(0, 3);

              return (
                <Grid key={account.id} size={{ xs: 12, md: 4 }}>
                  <Card sx={{ borderRadius: 3, height: '100%' }}>
                    <CardContent>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        spacing={2}
                        sx={{ mb: 2 }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            sx={{
                              bgcolor: account.type === 'cash' ? '#16a34a15' : '#2563eb15',
                              color: account.type === 'cash' ? '#16a34a' : '#2563eb',
                              width: 48,
                              height: 48,
                            }}
                          >
                            <Iconify
                              icon={
                                account.type === 'cash'
                                  ? 'solar:wallet-money-bold'
                                  : 'solar:card-bold'
                              }
                              width={24}
                            />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={800}>
                              {account.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {account.bankName} • {account.maskedNumber}
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Chip
                            label={formatBankingStatus(account.feedStatus)}
                            color={FEED_COLORS[account.feedStatus]}
                            size="small"
                          />
                          <Button
                            size="small"
                            component={RouterLink}
                            href={paths.dashboard.accountingFinance.banking.bankAccountDetail(
                              account.id
                            )}
                          >
                            View Details
                          </Button>
                        </Stack>
                      </Stack>

                      <Typography variant="h5" fontWeight={800}>
                        {formatAmount(account.balance, account.currency)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Available {formatAmount(account.availableBalance, account.currency)} •
                        Pending {formatAmount(account.pendingBalance, account.currency)}
                      </Typography>

                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                        <Chip
                          label={`Overdraft ${formatAmount(account.overdraftLimit, account.currency)}`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`${account.unmatchedLines} unmatched`}
                          size="small"
                          color={account.unmatchedLines ? 'warning' : 'success'}
                        />
                        <Chip
                          label={`${account.outstandingChecks} outstanding checks`}
                          size="small"
                          color={account.outstandingChecks ? 'warning' : 'default'}
                        />
                      </Stack>

                      <Divider sx={{ my: 2 }} />

                      <Grid container spacing={1.5} sx={{ mb: 2 }}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">
                            Last sync
                          </Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {formatDateTime(account.lastSyncAt)}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">
                            Feed provider
                          </Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {account.feedProvider}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        Statement history
                      </Typography>
                      <Stack spacing={1.25} sx={{ mb: 2 }}>
                        {accountStatements.map((statement) => (
                          <Stack
                            key={statement.id}
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            spacing={1.5}
                          >
                            <Box>
                              <Typography variant="body2" fontWeight={700}>
                                {statement.period}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {statement.source} • {statement.unmatchedCount} open items
                              </Typography>
                            </Box>
                            <Chip
                              label={formatBankingStatus(statement.status)}
                              size="small"
                              color={statement.unmatchedCount ? 'warning' : 'success'}
                            />
                          </Stack>
                        ))}
                      </Stack>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <Button
                          component={RouterLink}
                          href={paths.dashboard.accountingFinance.banking.reconciliation}
                          variant="contained"
                          fullWidth
                          startIcon={<Iconify icon="solar:check-circle-bold" />}
                        >
                          Reconcile
                        </Button>
                        <Button
                          component={RouterLink}
                          href={paths.dashboard.accountingFinance.banking.bankStatements}
                          variant="outlined"
                          color="inherit"
                          fullWidth
                          startIcon={<Iconify icon="solar:document-text-bold" />}
                        >
                          View Statements
                        </Button>
                        <Button
                          variant="outlined"
                          color="inherit"
                          fullWidth
                          startIcon={<Iconify icon="solar:refresh-bold" />}
                          onClick={() => handleSync(account.id)}
                        >
                          Sync Feed
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Grid>
      </Grid>

        {/* <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                Latest imports
              </Typography>
              <Stack spacing={1.5}>
                {recentlyImported.map((statement) => (
                  <Box
                    key={statement.id}
                    sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                  >
                    <Stack direction="row" justifyContent="space-between" spacing={1.5}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {statement.bankAccountName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {statement.period} • {statement.parser}
                        </Typography>
                      </Box>
                      <Chip
                        label={formatBankingStatus(statement.status)}
                        size="small"
                        color={statement.unmatchedCount ? 'warning' : 'success'}
                      />
                    </Stack>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 1 }}
                    >
                      Batch {statement.feedBatch} • {statement.importedLines} lines •{' '}
                      {statement.unmatchedCount} exceptions
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                Treasury controls
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Control</TableCell>
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Statements imported</TableCell>
                      <TableCell align="right">{overview.importedStatements}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Transfers pending approval</TableCell>
                      <TableCell align="right">{overview.transfersAwaitingApproval}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Transfers in transit</TableCell>
                      <TableCell align="right">{overview.transfersInTransit}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Unreconciled value</TableCell>
                      <TableCell align="right">
                        {formatAmount(overview.unreconciledValue)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid> */}
  

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Add Bank Account</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Account name"
                value={draftAccount.name}
                onChange={(event) =>
                  setDraftAccount((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Bank name"
                value={draftAccount.bankName}
                onChange={(event) =>
                  setDraftAccount((current) => ({ ...current, bankName: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Account number"
                value={draftAccount.accountNumber}
                onChange={(event) =>
                  setDraftAccount((current) => ({ ...current, accountNumber: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Currency"
                value={draftAccount.currency}
                onChange={(event) =>
                  setDraftAccount((current) => ({ ...current, currency: event.target.value }))
                }
              >
                <MenuItem value="BDT">BDT</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Opening balance"
                value={draftAccount.openingBalance}
                onChange={(event) =>
                  setDraftAccount((current) => ({ ...current, openingBalance: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Overdraft limit"
                value={draftAccount.overdraftLimit}
                onChange={(event) =>
                  setDraftAccount((current) => ({ ...current, overdraftLimit: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Owner"
                value={draftAccount.owner}
                onChange={(event) =>
                  setDraftAccount((current) => ({ ...current, owner: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Journal"
                value={draftAccount.journal}
                onChange={(event) =>
                  setDraftAccount((current) => ({ ...current, journal: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Feed mode"
                value={draftAccount.feedEnabled ? 'feed' : 'manual'}
                onChange={(event) =>
                  setDraftAccount((current) => ({
                    ...current,
                    feedEnabled: event.target.value === 'feed',
                  }))
                }
              >
                <MenuItem value="feed">Connected feed</MenuItem>
                <MenuItem value="manual">Manual upload</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Feed provider"
                value={draftAccount.feedProvider}
                onChange={(event) =>
                  setDraftAccount((current) => ({ ...current, feedProvider: event.target.value }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={createAccount}
            disabled={!draftAccount.name || !draftAccount.bankName || !draftAccount.accountNumber}
          >
            Create Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
