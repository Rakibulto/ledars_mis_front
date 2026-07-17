'use client';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
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
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { MOCK_JOURNAL_ENTRIES } from './mock-data';
import { exportCsvFile, formatCurrency } from '../utils';

function getAccountOptions(lines) {
  const accountMap = new Map();
  lines.forEach((line) => {
    const key = line.account_code || line.account_id;
    if (!accountMap.has(key)) {
      accountMap.set(key, {
        id: key,
        code: line.account_code || line.account_id,
        name: line.account_name || 'Account',
      });
    }
  });
  return Array.from(accountMap.values()).sort((a, b) => a.code.localeCompare(b.code));
}

export default function GeneralLedgerPosting() {
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [postingStatus, setPostingStatus] = useState('posted');

  const allLines = useMemo(
    () =>
      MOCK_JOURNAL_ENTRIES.filter((entry) =>
        postingStatus === 'all' ? true : entry.status === postingStatus
      ).flatMap((entry) =>
        (entry.lines || []).map((line) => ({
          ...line,
          entry_number: entry.number,
          reference: entry.reference,
          date: entry.date,
          journalStatus: entry.status,
        }))
      ),
    [postingStatus]
  );

  const accountOptions = useMemo(() => getAccountOptions(allLines), [allLines]);

  const filteredLines = useMemo(() => {
    const lines =
      selectedAccount === 'all'
        ? allLines
        : allLines.filter((line) => (line.account_code || line.account_id) === selectedAccount);

    let runningBalance = 0;
    return lines.map((line) => {
      runningBalance += Number(line.debit || 0) - Number(line.credit || 0);
      return { ...line, balance: runningBalance };
    });
  }, [allLines, selectedAccount]);

  const totalDebit = filteredLines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const totalCredit = filteredLines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  const closingBalance = filteredLines.at(-1)?.balance || 0;

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
            Mock ledger view with running balance, account drilldown, and posting status filters.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Iconify icon="solar:download-minimalistic-bold" />}
          onClick={() => {
            const rows = filteredLines.map((line) => ({
              Date: line.date || '',
              'Entry #': line.entry_number || '',
              Reference: line.reference || '',
              Account: `${line.account_code || ''} - ${line.account_name || ''}`.trim(),
              Description: line.description || '',
              Debit: Number(line.debit || 0),
              Credit: Number(line.credit || 0),
              Balance: Number(line.balance || 0),
            }));
            exportCsvFile('general-ledger', rows);
          }}
        >
          Export Ledger
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Ledger lines', value: filteredLines.length },
          { label: 'Total debit', value: formatCurrency(totalDebit) },
          { label: 'Total credit', value: formatCurrency(totalCredit) },
          {
            label: 'Closing balance',
            value: `${formatCurrency(Math.abs(closingBalance))} ${closingBalance < 0 ? 'Cr' : 'Dr'}`,
          },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
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
              select
              size="small"
              label="Account"
              value={selectedAccount}
              onChange={(event) => setSelectedAccount(event.target.value)}
              sx={{ minWidth: 280 }}
            >
              <MenuItem value="all">All Accounts</MenuItem>
              {accountOptions.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.code} - {account.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Posting status"
              value={postingStatus}
              onChange={(event) => setPostingStatus(event.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="all">All entries</MenuItem>
              <MenuItem value="posted">Posted only</MenuItem>
              <MenuItem value="draft">Draft only</MenuItem>
              <MenuItem value="pending">Pending only</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Entry #</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Debit</TableCell>
                <TableCell align="right">Credit</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLines.map((line, index) => (
                <TableRow key={`${line.entry_number}-${line.account_code}-${index}`} hover>
                  <TableCell>{new Date(line.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                      {line.entry_number}
                    </Typography>
                  </TableCell>
                  <TableCell>{line.reference}</TableCell>
                  <TableCell>
                    {line.account_code} - {line.account_name}
                  </TableCell>
                  <TableCell>{line.description}</TableCell>
                  <TableCell align="right">
                    {line.debit ? formatCurrency(line.debit) : '-'}
                  </TableCell>
                  <TableCell align="right">
                    {line.credit ? formatCurrency(line.credit) : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color={line.balance < 0 ? 'error.main' : 'text.primary'}
                    >
                      {formatCurrency(Math.abs(line.balance))} {line.balance < 0 ? 'Cr' : 'Dr'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="text"
                      component={RouterLink}
                      href={paths.dashboard.accountingFinance.transactions.generalLedgerPostingDetail(
                        line.account_code || line.account_id
                      )}
                    >
                      View Account
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
