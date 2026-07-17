'use client';

import useSWR from 'swr';
import { Icon } from '@iconify/react';
import { useMemo, useState } from 'react';

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
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fetcher, endpoints } from 'src/utils/axios';

import { formatCurrency } from '../utils';

function JournalItems() {
  const [journalFilter, setJournalFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch journal items (latest first via ordering set in ViewSet)
  const itemsUrl = `${endpoints.accounting.journal_items}?ordering=-journal_entry__date,-id`;
  const journalsUrl = endpoints.accounting.journals;

  const { data: rawItems, isLoading: itemsLoading } = useSWR(itemsUrl, fetcher);
  const { data: rawJournals } = useSWR(journalsUrl, fetcher);

  const journals = useMemo(() => {
    if (Array.isArray(rawJournals)) return rawJournals;
    if (Array.isArray(rawJournals?.results)) return rawJournals.results;
    return [];
  }, [rawJournals]);

  const allItems = useMemo(() => {
    const list = Array.isArray(rawItems)
      ? rawItems
      : Array.isArray(rawItems?.results)
        ? rawItems.results
        : [];
    return list.map((item) => ({
      id: item.id,
      reference: item.entry_reference || `JE-${item.journal_entry}`,
      date: item.entry_date,
      description: item.label || item.entry_narration || '-',
      journalId: item.journal_id,
      journalName: item.journal_name || '-',
      status: item.entry_status || 'draft',
      accountCode: item.account_code || '',
      accountName: item.account_name || '-',
      analytic: item.analytic_account_name || '-',
      debit: Number(item.debit || 0),
      credit: Number(item.credit || 0),
    }));
  }, [rawItems]);

  const filtered = allItems.filter((item) => {
    if (journalFilter !== 'all' && item.journalId !== journalFilter) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    return true;
  });

  const totalDebit = filtered.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = filtered.reduce((sum, item) => sum + item.credit, 0);

  const handleExport = () => {
    const headers = [
      'Date',
      'Reference',
      'Journal',
      'Account Code',
      'Account Name',
      'Analytic',
      'Description',
      'Debit',
      'Credit',
      'Status',
    ];
    const rows = filtered.map((item) => [
      item.date ? new Date(item.date).toLocaleDateString() : '',
      item.reference,
      item.journalName,
      item.accountCode,
      item.accountName,
      item.analytic,
      `"${(item.description || '').replace(/"/g, '""')}"`,
      item.debit || '',
      item.credit || '',
      item.status,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `journal-items-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
            Journal Items
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Flattened journal lines with journal, analytic, and posting filters.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Icon icon="solar:download-minimalistic-bold" />}
          onClick={handleExport}
        >
          Export Items
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Visible items', value: filtered.length },
          { label: 'Debit total', value: formatCurrency(totalDebit) },
          { label: 'Credit total', value: formatCurrency(totalCredit) },
          { label: 'Balanced delta', value: formatCurrency(Math.abs(totalDebit - totalCredit)) },
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
              label="Journal"
              value={journalFilter}
              onChange={(event) => setJournalFilter(event.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="all">All Journals</MenuItem>
              {journals.map((journal) => (
                <MenuItem key={journal.id} value={journal.id}>
                  {journal.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="all">All statuses</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="posted">Posted</MenuItem>
              <MenuItem value="reversed">Reversed</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        {itemsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Journal</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>Analytic</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Debit</TableCell>
                  <TableCell align="right">Credit</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      {item.date ? new Date(item.date).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip label={item.reference} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{item.journalName}</TableCell>
                    <TableCell>
                      {item.accountCode} - {item.accountName}
                    </TableCell>
                    <TableCell>{item.analytic}</TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography variant="body2" noWrap>
                        {item.description}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {item.debit > 0 ? formatCurrency(item.debit) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {item.credit > 0 ? formatCurrency(item.credit) : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        size="small"
                        color={item.status === 'posted' ? 'success' : 'default'}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="text"
                        component={RouterLink}
                        href={paths.dashboard.accountingFinance.transactions.journalItemDetail(
                          item.id
                        )}
                      >
                        View Item
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && !itemsLoading && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No journal items found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                <TableRow sx={{ bgcolor: 'action.selected' }}>
                  <TableCell colSpan={6} />
                  <TableCell align="right">
                    <Typography fontWeight={700}>{formatCurrency(totalDebit)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700}>{formatCurrency(totalCredit)}</Typography>
                  </TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
}

export default JournalItems;
