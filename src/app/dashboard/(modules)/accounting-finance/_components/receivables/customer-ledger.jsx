'use client';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';

import { useReceivablesWorkspace } from './use-receivables-workspace';
import { formatCurrency } from '../utils';

export default function CustomerLedger() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { customerLedgerRows } = useReceivablesWorkspace();

  const filteredCustomers = useMemo(() => {
    let list = customerLedgerRows;
    if (search) {
      const term = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(term));
    }
    if (statusFilter === 'overdue') {
      list = list.filter((c) => c.totals.overdue > 0);
    } else if (statusFilter === 'clear') {
      list = list.filter((c) => c.totals.outstanding <= 0);
    }
    return list;
  }, [customerLedgerRows, search, statusFilter]);

  const globalTotals = useMemo(() => ({
    invoiced: filteredCustomers.reduce((s, c) => s + c.totals.invoiced, 0),
    collected: filteredCustomers.reduce((s, c) => s + c.totals.collected, 0),
    outstanding: filteredCustomers.reduce((s, c) => s + c.totals.outstanding, 0),
    overdue: filteredCustomers.reduce((s, c) => s + c.totals.overdue, 0),
  }), [filteredCustomers]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>Customer Ledger</Typography>
        <Typography variant="body2" color="text.secondary">
          Customer invoice history with outstanding balances.
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Customers', value: filteredCustomers.length },
          { label: 'Invoiced', value: formatCurrency(globalTotals.invoiced) },
          { label: 'Outstanding', value: formatCurrency(globalTotals.outstanding) },
          { label: 'Overdue', value: formatCurrency(globalTotals.overdue) },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, md: 3 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>{card.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField size="small" placeholder="Search customer" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 250 }} />
            <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ width: 160 }}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
              <MenuItem value="clear">Clear</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={3}>
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ pb: 1 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: '#2563eb20', color: '#2563eb' }}>
                    {customer.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>{customer.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Invoiced {formatCurrency(customer.totals.invoiced)} • Collected {formatCurrency(customer.totals.collected)} • Outstanding {formatCurrency(customer.totals.outstanding)}
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  label={customer.totals.overdue > 0 ? 'Overdue' : 'Clear'}
                  color={customer.totals.overdue > 0 ? 'warning' : 'success'}
                />
              </Stack>
            </CardContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell align="right">Debit</TableCell>
                    <TableCell align="right">Credit</TableCell>
                    <TableCell align="right">Outstanding</TableCell>
                    <TableCell align="right">Overdue Days</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customer.invoices.map((inv) => (
                    <TableRow key={inv.id} hover>
                      <TableCell><Chip label={inv.number} size="small" variant="outlined" /></TableCell>
                      <TableCell>{inv.invoice_date}</TableCell>
                      <TableCell>{inv.due_date}</TableCell>
                      <TableCell align="right">{formatCurrency(inv.debit)}</TableCell>
                      <TableCell align="right">{formatCurrency(inv.credit)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(inv.balance)}</TableCell>
                      <TableCell align="right">{inv.overdueDays}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell colSpan={3}>
                      <Typography fontWeight={700}>Total</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(customer.totals.invoiced)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(customer.totals.collected)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(customer.totals.outstanding)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
