'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
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
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fetcher, endpoints } from 'src/utils/axios';

import { Iconify } from 'src/components/iconify';

import { exportCsvFile, formatCurrency } from '../utils';

function fmtBalance(dr, cr) {
  const net = dr - cr;
  if (Math.abs(net) < 0.005) return '0.00';
  const abs = Math.abs(net);
  return `${formatCurrency(abs)} ${net > 0 ? 'Dr' : 'Cr'}`;
}

export default function GeneralLedgerPosting() {
  const searchParams = useSearchParams();
  const accountsParam = searchParams.get('accounts');
  const accountParam = searchParams.get('account');

  const initialAccountCodes = useMemo(() => {
    if (accountsParam) return accountsParam.split(',').filter(Boolean);
    if (accountParam) return [accountParam];
    return [];
  }, [accountsParam, accountParam]);

  const isMultiAccountFilter = initialAccountCodes.length > 1;

  const today = new Date();
  const firstDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
  const [dateFrom, setDateFrom] = useState(firstDay);
  const [dateTo, setDateTo] = useState(lastDay);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const trialBalanceUrl = useMemo(() => {
    const base = endpoints.accounting.account_trial_balance;
    return `${base}?date_from=${dateFrom}&date_to=${dateTo}`;
  }, [dateFrom, dateTo]);

  const { data: rawResponse, isLoading } = useSWR(trialBalanceUrl, fetcher);

  const allAccounts = useMemo(() => {
    if (!rawResponse) return [];
    if (Array.isArray(rawResponse)) return rawResponse;
    return rawResponse.accounts || [];
  }, [rawResponse]);

  const filteredAccounts = useMemo(() => {
    let list = allAccounts;

    // Filter to specific account codes if provided
    if (initialAccountCodes.length > 0) {
      const codeSet = new Set(initialAccountCodes);
      list = list.filter((a) => codeSet.has(String(a.code || '')));
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          String(a.code).toLowerCase().includes(q) ||
          String(a.name).toLowerCase().includes(q)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      list = list.filter((a) => a.classification === typeFilter);
    }

    return list;
  }, [allAccounts, initialAccountCodes, search, typeFilter]);

  const totals = useMemo(() => {
    let openingDr = 0;
    let openingCr = 0;
    let periodDr = 0;
    let periodCr = 0;
    let closingDr = 0;
    let closingCr = 0;
    let lineCount = 0;

    filteredAccounts.forEach((a) => {
      openingDr += a.opening_dr || 0;
      openingCr += a.opening_cr || 0;
      periodDr += a.period_dr || 0;
      periodCr += a.period_cr || 0;
      closingDr += a.closing_dr || 0;
      closingCr += a.closing_cr || 0;
      lineCount += a.line_count || 0;
    });

    return { openingDr, openingCr, periodDr, periodCr, closingDr, closingCr, lineCount };
  }, [filteredAccounts]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            General Ledger Posting
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isMultiAccountFilter
              ? `Showing ${initialAccountCodes.length} accounts from Chart of Accounts`
              : 'Account-level summary with opening, period activity, and closing balances.'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Iconify icon="solar:download-minimalistic-bold" />}
          onClick={() => {
            const rows = filteredAccounts.map((a) => ({
              Account: `${a.code} - ${a.name}`,
              Opening: fmtBalance(a.opening_dr, a.opening_cr),
              Debit: a.period_dr || 0,
              Credit: a.period_cr || 0,
              Ending: fmtBalance(a.closing_dr, a.closing_cr),
              Lines: a.line_count || 0,
            }));
            rows.push({
              Account: 'Total',
              Opening: fmtBalance(totals.openingDr, totals.openingCr),
              Debit: totals.periodDr,
              Credit: totals.periodCr,
              Ending: fmtBalance(totals.closingDr, totals.closingCr),
              Lines: totals.lineCount,
            });
            exportCsvFile('general-ledger', rows);
          }}
        >
          Export
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total accounts', value: filteredAccounts.length, icon: 'solar:wallet-money-bold-duotone', color: '#3b82f6' },
          { label: 'Total debit', value: formatCurrency(totals.periodDr), icon: 'solar:arrow-up-bold', color: '#10b981' },
          { label: 'Total credit', value: formatCurrency(totals.periodCr), icon: 'solar:arrow-down-bold', color: '#ef4444' },
          {
            label: 'Net balance',
            value: `${formatCurrency(Math.abs(totals.closingDr - totals.closingCr))} ${(totals.closingDr - totals.closingCr) >= 0 ? 'Dr' : 'Cr'}`,
            icon: 'solar:scale-bold',
            color: '#8b5cf6',
          },
          { label: 'Active accounts', value: filteredAccounts.filter((a) => (a.period_dr || 0) + (a.period_cr || 0) > 0).length, icon: 'solar:chart-bold', color: '#f59e0b' },
          { label: 'Total lines', value: totals.lineCount, icon: 'solar:documents-bold', color: '#6b7280' },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 2 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {card.label}
                  </Typography>
                  <Typography variant="h6" fontWeight={800} sx={{ mt: 0.5 }}>
                    {card.value}
                  </Typography>
                </Box>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Iconify icon={card.icon} width={22} sx={{ color: card.color }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Date From"
              type="date"
              size="small"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 160 }}
            />
            <TextField
              label="Date To"
              type="date"
              size="small"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 160 }}
            />
            <TextField
              label="Search accounts"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Code or name"
              sx={{ minWidth: 200, maxWidth: 300 }}
              size="small"
            />
            <TextField
              select
              size="small"
              label="Account Type"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              sx={{ width: 180 }}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="asset">Asset</MenuItem>
              <MenuItem value="liability">Liability</MenuItem>
              <MenuItem value="equity">Equity</MenuItem>
              <MenuItem value="income">Income</MenuItem>
              <MenuItem value="expense">Expense</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table
            size="small"
            sx={{
              borderCollapse: 'collapse',
              '& .MuiTableCell-root': {
                border: '1px solid #e0e0e0 !important',
                borderColor: '#e0e0e0 !important',
                borderStyle: 'solid !important',
                py: 1.25,
                px: 1.5,
              },
              '& .MuiTableHead-root .MuiTableCell-root': {
                borderBottom: '2px solid #bdbdbd !important',
                bgcolor: '#f5f5f5',
                fontWeight: 700,
                fontSize: 13,
                border: '1px solid #bdbdbd !important',
                borderColor: '#bdbdbd !important',
                borderStyle: 'solid !important',
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Account</TableCell>
                <TableCell align="right">Opening Dr</TableCell>
                <TableCell align="right">Opening Cr</TableCell>
                <TableCell align="right">Period Dr</TableCell>
                <TableCell align="right">Period Cr</TableCell>
                <TableCell align="right">Closing Dr</TableCell>
                <TableCell align="right">Closing Cr</TableCell>
                <TableCell align="right">Lines</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">Loading...</Typography>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filteredAccounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">No accounts found.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {filteredAccounts.map((account) => (
                <TableRow
                  key={account.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    window.location.href = `/dashboard/accounting-finance/transactions/general-ledger-posting/item/0?account_code=${account.code}`;
                  }}
                >
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', minWidth: 50 }}>
                        {account.code}
                      </Typography>
                      <Typography variant="body2">
                        {account.name}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {account.opening_dr ? formatCurrency(account.opening_dr) : '0.00'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {account.opening_cr ? formatCurrency(account.opening_cr) : '0.00'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {account.period_dr ? formatCurrency(account.period_dr) : '0.00'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {account.period_cr ? formatCurrency(account.period_cr) : '0.00'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {account.closing_dr ? formatCurrency(account.closing_dr) : '0.00'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {account.line_count || 0}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals row */}
              {filteredAccounts.length > 0 && (
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell>
                    <Typography fontWeight={700}>Total</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700}>{formatCurrency(totals.openingDr)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700}>{formatCurrency(totals.openingCr)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700}>{formatCurrency(totals.periodDr)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700}>{formatCurrency(totals.periodCr)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700}>{formatCurrency(totals.closingDr)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700}>{formatCurrency(totals.closingCr)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700}>{totals.lineCount}</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Double Entry View */}
      <Box sx={{ mt: 4 }}>
        <DoubleEntryView dateFrom={dateFrom} dateTo={dateTo} accountCodes={initialAccountCodes} />
      </Box>
    </Box>
  );
}

function DoubleEntryView({ dateFrom, dateTo, accountCodes = [] }) {
  const { data: rawEntries, isLoading } = useSWR(endpoints.accounting.journal_entries, fetcher);

  const entries = useMemo(() => {
    const list = Array.isArray(rawEntries)
      ? rawEntries
      : Array.isArray(rawEntries?.results)
        ? rawEntries.results
        : [];
    // Filter by date range
    let filtered = list.filter((e) => {
      if (!e.date) return false;
      return e.date >= dateFrom && e.date <= dateTo;
    });
    // Filter by account codes if provided
    if (accountCodes.length > 0) {
      const codeSet = new Set(accountCodes);
      filtered = filtered.filter((e) =>
        (e.items || []).some((item) => codeSet.has(String(item.account_code || '')))
      );
    }
    return filtered.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id || 0) - (a.id || 0));
  }, [rawEntries, dateFrom, dateTo, accountCodes]);

  return (
    <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <CardContent sx={{ pb: 1 }}>
        <Typography variant="h6" fontWeight={800}>
          Double Entry View
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Journal entries grouped with debit/credit totals.
        </Typography>
      </CardContent>
      <TableContainer>
        <Table
          size="small"
          sx={{
            borderCollapse: 'collapse',
            '& .MuiTableCell-root': {
              border: '1px solid #e0e0e0 !important',
              borderColor: '#e0e0e0 !important',
              borderStyle: 'solid !important',
              py: 1.25,
              px: 1.5,
              verticalAlign: 'top',
            },
            '& .MuiTableHead-root .MuiTableCell-root': {
              borderBottom: '2px solid #bdbdbd !important',
              bgcolor: '#f5f5f5',
              fontWeight: 700,
              fontSize: 13,
              border: '1px solid #bdbdbd !important',
              borderColor: '#bdbdbd !important',
              borderStyle: 'solid !important',
              verticalAlign: 'middle',
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 100 }}>Date</TableCell>
              <TableCell sx={{ width: 220 }}>Entry</TableCell>
              <TableCell>Lines</TableCell>
              <TableCell sx={{ width: 90 }}>Status</TableCell>
              <TableCell align="right" sx={{ width: 120 }}>Total Debit</TableCell>
              <TableCell align="right" sx={{ width: 120 }}>Total Credit</TableCell>
              <TableCell align="center" sx={{ width: 60 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">Loading entries...</Typography>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">No journal entries found for this period.</Typography>
                </TableCell>
              </TableRow>
            )}
            {entries.map((entry) => (
              <TableRow
                key={entry.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => {
                  window.location.href = paths.dashboard.accountingFinance.transactions.journalEntryDetail(entry.id);
                }}
              >
                <TableCell>
                  <Typography variant="body2">{entry.date || '-'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                    {entry.reference || '-'}
                  </Typography>
                  {entry.source_document && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {entry.source_document}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Stack spacing={0.25}>
                    {(entry.items || []).map((item, idx) => (
                      <Typography key={idx} variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                        {item.account_code || ''} - {item.account_name || item.label || ''}
                      </Typography>
                    ))}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    label={entry.status || 'draft'}
                    size="small"
                    color={entry.status === 'posted' ? 'success' : entry.status === 'cancelled' ? 'error' : 'default'}
                    sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(entry.total_debit || 0)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(entry.total_credit || 0)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = paths.dashboard.accountingFinance.transactions.journalEntryDetail(entry.id);
                    }}
                  >
                    <Iconify icon="solar:eye-bold" width={18} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
