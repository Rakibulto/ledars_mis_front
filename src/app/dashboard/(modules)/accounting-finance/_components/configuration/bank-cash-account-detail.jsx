'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useBankCashAccountsApi } from './use-bank-cash-accounts-api';

function DetailRow({ label, value }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      spacing={2}
      sx={{ py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 180 }}>
        {label}
      </Typography>
      <Box textAlign="right">
        {typeof value === 'string' || typeof value === 'number' ? (
          <Typography variant="body2" fontWeight={500}>
            {value ?? '—'}
          </Typography>
        ) : (
          value
        )}
      </Box>
    </Stack>
  );
}

export default function BankCashAccountDetail() {
  const router = useRouter();
  const { id } = useParams();
  const workspace = useBankCashAccountsApi();

  const account = useMemo(
    () => workspace.bankCashAccounts.find((item) => String(item.id) === String(id)),
    [workspace.bankCashAccounts, id]
  );

  if (workspace.loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!account) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Account not found.
        </Typography>
        <Button
          sx={{ mt: 2 }}
          startIcon={<Iconify icon="solar:arrow-left-bold" />}
          onClick={() => router.back()}
        >
          Back
        </Button>
      </Box>
    );
  }

  const isBank = account.type === 'bank';
  const accentColor = isBank ? '#2563eb' : '#16a34a';

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumb */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<Iconify icon="solar:arrow-left-bold" />}
          onClick={() => router.back()}
        >
          Back
        </Button>
        <Typography variant="body2" color="text.secondary">
          /
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Bank & Cash Accounts
        </Typography>
        <Typography variant="body2" color="text.secondary">
          /
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {account.name}
        </Typography>
      </Stack>

      {/* Title row */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: `${accentColor}20`, color: accentColor, width: 56, height: 56 }}>
            <Iconify icon={isBank ? 'solar:safe-square-bold' : 'solar:wallet-bold'} width={28} />
          </Avatar>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="h4" fontWeight={700}>
                {account.name}
              </Typography>
              <Chip label={account.currency} size="small" variant="outlined" />
              <Chip
                label={isBank ? 'Bank' : 'Cash'}
                size="small"
                sx={{ bgcolor: `${accentColor}15`, color: accentColor, fontWeight: 700 }}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {account.bank_name} • {account.account_number}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      {/* Metric cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Balance
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {formatCurrency(account.balance, account.currency)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Current ledger balance
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Available Balance
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {formatCurrency(account.availableBalance, account.currency)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Net of pending items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Pending Balance
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {formatCurrency(account.pendingBalance, account.currency)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Uncleared transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detail cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Account Details
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <DetailRow label="Account Name" value={account.name} />
              <DetailRow
                label="Type"
                value={isBank ? 'Bank settlement account' : 'Cash holding account'}
              />
              <DetailRow label="Bank / Register" value={account.bank_name} />
              <DetailRow label="Account Number" value={account.account_number} />
              <DetailRow label="Currency" value={account.currency} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Liquidity & Reconciliation
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <DetailRow label="Treasury Default" value={account.treasuryDefault} />
              <DetailRow label="Liquidity Tag" value={account.liquidityTag} />
              <DetailRow label="Liquidity Horizon" value={account.liquidityHorizon} />
              <DetailRow label="Reconciliation State" value={account.reconciliationState} />
              <DetailRow label="Reconciliation Cadence" value={account.reconciliationCadence} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
