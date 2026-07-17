'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useCurrency } from '../currency-context';
import { useBankingWorkspace } from './use-banking-workspace';
import { BankingWorkspaceToolbar } from './banking-workspace-toolbar';

const NAV_ITEMS = [
  {
    title: 'Bank Accounts',
    description: 'Connected accounts, feed health, pending liquidity, and statement history.',
    href: paths.dashboard.accountingFinance.banking.bankAccounts,
    icon: 'solar:safe-square-bold-duotone',
    metricKey: 'accounts',
  },
  {
    title: 'Bank Statements',
    description: 'Import wizard, parser mapping, duplicate review, and unmatched line control.',
    href: paths.dashboard.accountingFinance.banking.bankStatements,
    icon: 'solar:file-text-bold-duotone',
    metricKey: 'statements',
  },
  {
    title: 'Reconciliation',
    description: 'Assisted matching, write-offs, counterparts, and reconciliation models.',
    href: paths.dashboard.accountingFinance.banking.reconciliation,
    icon: 'solar:check-circle-bold-duotone',
    metricKey: 'exceptions',
  },
  {
    title: 'Transfers',
    description:
      'Approval queue, posting traceability, in-transit treasury movement, and settlement.',
    href: paths.dashboard.accountingFinance.banking.transfers,
    icon: 'solar:transfer-horizontal-bold-duotone',
    metricKey: 'transfers',
  },
  {
    title: 'Check Management',
    description: 'Prepared, printed, issued, cleared, bounced, and voided instrument tracking.',
    href: paths.dashboard.accountingFinance.banking.checkManagement,
    icon: 'solar:bill-list-bold-duotone',
    metricKey: 'checks',
  },
];

function SummaryCard({ label, value, helper, icon }) {
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
          <Iconify icon={icon} width={28} />
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function BankingHome() {
  useCurrency();
  const [pendingAction, setPendingAction] = useState(null);
  const { overview, alerts, accounts, statements, reconciliations, checks, transfers } =
    useBankingWorkspace();

  const latestStatements = useMemo(() => statements.slice(0, 4), [statements]);
  const priorityChecks = useMemo(
    () =>
      checks
        .filter((check) => ['bounced', 'prepared', 'issued'].includes(check.status))
        .slice(0, 4),
    [checks]
  );
  const transferQueue = useMemo(
    () =>
      transfers
        .filter((transfer) =>
          ['pending_approval', 'approved', 'in_transit'].includes(transfer.status)
        )
        .slice(0, 4),
    [transfers]
  );

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

  const navMetrics = {
    accounts: `${accounts.length} active`,
    statements: `${statements.length} imported`,
    exceptions: `${accounts.reduce((sum, account) => sum + Number(account.unmatchedLines || 0), 0)} open lines`,
    transfers: `${overview.transfersAwaitingApproval} awaiting approval`,
    checks: `${overview.outstandingCheckCount} outstanding`,
  };

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Account
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Bank</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Number
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Available
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
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{acct.number}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{acct.available}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <Box sx={{ p: 3 }}>
      <BankingWorkspaceToolbar printTitle="Banking Workspace" printContent={printContent} />
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Banking Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Treasury command center for bank connectivity, statement imports, reconciliation
            exceptions, transfer approvals, and check exposure.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:refresh-circle-bold" />}
            onClick={() =>
              runAction(
                'Treasury refresh',
                async () => Promise.resolve(),
                'Treasury workspace refreshed'
              )
            }
            disabled={pendingAction !== null}
          >
            Refresh
          </Button>
          <Button
            component={RouterLink}
            href={paths.dashboard.accountingFinance.banking.reconciliation}
            variant="contained"
            startIcon={<Iconify icon="solar:check-circle-bold" />}
          >
            Open Reconciliation
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Ledger balance"
            value={formatCurrency(overview.totalBalance)}
            helper="Total booked bank and cash position"
            icon="solar:wallet-money-bold-duotone"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Available balance"
            value={formatCurrency(overview.availableBalance)}
            helper="After pending transfers and outstanding checks"
            icon="solar:shield-check-bold-duotone"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Unreconciled value"
            value={formatCurrency(overview.unreconciledValue)}
            helper="Value still unresolved in statement-to-book matching"
            icon="solar:danger-triangle-bold-duotone"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Transfer control"
            value={`${overview.transfersAwaitingApproval}/${overview.transfersInTransit}`}
            helper="Awaiting approval versus currently in transit"
            icon="solar:transfer-horizontal-bold-duotone"
          />
        </Grid>
      </Grid>

      <Stack spacing={2} sx={{ mb: 3 }}>
        {alerts.map((alert) => (
          <Alert key={alert.id} severity={alert.severity} sx={{ borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={700}>
              {alert.title}
            </Typography>
            <Typography variant="caption">{alert.description}</Typography>
          </Alert>
        ))}
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {NAV_ITEMS.map((item) => (
          <Grid key={item.title} size={{ xs: 12, md: 6, xl: 4 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.200' }}>
                    <Iconify icon={item.icon} width={24} />
                  </Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    {navMetrics[item.metricKey]}
                  </Typography>
                </Stack>
                <Typography variant="h6" fontWeight={700}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 2 }}>
                  {item.description}
                </Typography>
                <Button component={RouterLink} href={item.href} variant="contained" fullWidth>
                  Open Page
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Latest statement batches
              </Typography>
              <Stack divider={<Divider flexItem />}>
                {latestStatements.map((statement) => (
                  <Stack
                    key={statement.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ py: 1.25 }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {statement.bankAccountName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {statement.period} • {statement.parser} • {statement.unmatchedCount} open
                      </Typography>
                    </Box>
                    <Button
                      component={RouterLink}
                      href={paths.dashboard.accountingFinance.banking.bankStatements}
                      variant="outlined"
                      color="inherit"
                    >
                      View
                    </Button>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Checks needing attention
              </Typography>
              <Stack divider={<Divider flexItem />}>
                {priorityChecks.map((check) => (
                  <Stack
                    key={check.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ py: 1.25 }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {check.checkNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {check.payee} • {check.status} • {formatCurrency(check.amount)}
                      </Typography>
                    </Box>
                    <Button
                      component={RouterLink}
                      href={paths.dashboard.accountingFinance.banking.checkManagement}
                      variant="outlined"
                      color="inherit"
                    >
                      Open
                    </Button>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Transfer queue
              </Typography>
              <Stack divider={<Divider flexItem />}>
                {transferQueue.map((transfer) => (
                  <Stack
                    key={transfer.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ py: 1.25 }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {transfer.reference}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatCurrency(transfer.amount)} • {transfer.status} • {transfer.traceCode}
                      </Typography>
                    </Box>
                    <Button
                      component={RouterLink}
                      href={paths.dashboard.accountingFinance.banking.transfers}
                      variant="outlined"
                      color="inherit"
                    >
                      View
                    </Button>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
