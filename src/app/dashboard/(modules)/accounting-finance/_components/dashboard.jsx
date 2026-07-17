'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { fetcher, endpoints } from 'src/utils/axios';
import { Iconify } from 'src/components/iconify';
import { formatCurrency } from './utils';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

function StatCard({ title, value, subtitle, icon, color, trend }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '0 0 0 80px', bgcolor: `${color}10` }} />
      <CardContent sx={{ position: 'relative' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</Typography>
            <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>{value}</Typography>
            {subtitle && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
          </Box>
          <Avatar sx={{ width: 44, height: 44, bgcolor: `${color}15`, color }}>
            <Iconify icon={icon} width={22} />
          </Avatar>
        </Stack>
        {trend && (
          <Chip
            label={trend}
            size="small"
            color={trend.startsWith('+') ? 'success' : trend.startsWith('-') ? 'error' : 'default'}
            sx={{ mt: 1, fontWeight: 600 }}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default function AccountingDashboard() {
  const { data: rawBills } = useSWR(endpoints.accounting.bills, fetcher);
  const { data: rawInvoices } = useSWR(endpoints.accounting.customer_invoices, fetcher);
  const { data: rawJournalEntries } = useSWR(endpoints.accounting.journal_entries, fetcher);
  const { data: rawTrialBalance } = useSWR(
    `${endpoints.accounting.account_trial_balance}?date_from=${new Date().getFullYear()}-01-01&date_to=${new Date().toISOString().slice(0, 10)}`,
    fetcher
  );

  const bills = useMemo(() => {
    const list = Array.isArray(rawBills) ? rawBills : Array.isArray(rawBills?.results) ? rawBills.results : [];
    return list;
  }, [rawBills]);

  const totalPayables = useMemo(() => bills.reduce((sum, b) => sum + Number(b.amount_due || 0), 0), [bills]);
  const unpaidBills = useMemo(() => bills.filter((b) => Number(b.amount_due || 0) > 0), [bills]);
  const overdueBills = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return unpaidBills.filter((b) => b.due_date < today);
  }, [unpaidBills]);

  const invoices = useMemo(() => {
    const list = Array.isArray(rawInvoices) ? rawInvoices : Array.isArray(rawInvoices?.results) ? rawInvoices.results : [];
    return list;
  }, [rawInvoices]);

  const totalReceivables = useMemo(() => invoices.reduce((sum, i) => sum + Number(i.balance_due || 0), 0), [invoices]);
  const unpaidInvoices = useMemo(() => invoices.filter((i) => Number(i.balance_due || 0) > 0), [invoices]);
  const overdueInvoices = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return unpaidInvoices.filter((i) => i.due_date < today);
  }, [unpaidInvoices]);

  const journalEntries = useMemo(() => {
    const list = Array.isArray(rawJournalEntries) ? rawJournalEntries : Array.isArray(rawJournalEntries?.results) ? rawJournalEntries.results : [];
    return list.filter((e) => e.status === 'posted');
  }, [rawJournalEntries]);

  const trialBalance = useMemo(() => {
    if (!rawTrialBalance) return [];
    if (Array.isArray(rawTrialBalance)) return rawTrialBalance;
    return rawTrialBalance.accounts || [];
  }, [rawTrialBalance]);

  const cashAccounts = useMemo(() =>
    trialBalance.filter((a) => a.classification === 'asset' && (a.code?.startsWith('10') || a.code?.startsWith('11'))),
    [trialBalance]
  );
  const totalCash = useMemo(() => cashAccounts.reduce((sum, a) => sum + (a.closing_dr || 0) - (a.closing_cr || 0), 0), [cashAccounts]);

  const expenseAccounts = useMemo(() =>
    trialBalance.filter((a) => a.classification === 'expense'),
    [trialBalance]
  );
  const totalExpenses = useMemo(() => expenseAccounts.reduce((sum, a) => sum + (a.period_dr || 0), 0), [expenseAccounts]);

  const incomeAccounts = useMemo(() =>
    trialBalance.filter((a) => a.classification === 'income'),
    [trialBalance]
  );
  const totalIncome = useMemo(() => incomeAccounts.reduce((sum, a) => sum + (a.period_cr || 0), 0), [incomeAccounts]);

  const overdueCount = overdueBills.length + overdueInvoices.length;
  const overdueAmount = overdueBills.reduce((sum, b) => sum + Number(b.amount_due || 0), 0) + overdueInvoices.reduce((sum, i) => sum + Number(i.balance_due || 0), 0);

  // Aging data for pie chart
  const agingData = useMemo(() => {
    const buckets = [
      { name: 'Current', value: 0 },
      { name: '1-30 Days', value: 0 },
      { name: '31-60 Days', value: 0 },
      { name: '61-90 Days', value: 0 },
      { name: '90+ Days', value: 0 },
    ];
    const today = new Date();
    unpaidInvoices.forEach((inv) => {
      const due = new Date(inv.due_date);
      const days = Math.floor((today - due) / (1000 * 60 * 60 * 24));
      const amount = Number(inv.balance_due || 0);
      if (days <= 0) buckets[0].value += amount;
      else if (days <= 30) buckets[1].value += amount;
      else if (days <= 60) buckets[2].value += amount;
      else if (days <= 90) buckets[3].value += amount;
      else buckets[4].value += amount;
    });
    return buckets.filter((b) => b.value > 0);
  }, [unpaidInvoices]);

  // Monthly trend data from journal entries
  const trendData = useMemo(() => {
    const months = {};
    journalEntries.forEach((entry) => {
      if (!entry.date) return;
      const month = entry.date.slice(0, 7);
      if (!months[month]) months[month] = { month, income: 0, expense: 0 };
      // Simple approximation: sum debits as income, credits as expense
      months[month].income += Number(entry.total_debit || 0);
      months[month].expense += Number(entry.total_credit || 0);
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [journalEntries]);

  const quickLinks = [
    { label: 'Vendor Bills', href: paths.dashboard.accountingFinance.transactions.vendorBills, icon: 'solar:bill-list-bold', color: '#ef4444' },
    { label: 'Customer Invoices', href: paths.dashboard.accountingFinance.transactions.customerInvoices, icon: 'solar:document-text-bold', color: '#10b981' },
    { label: 'Journal Entries', href: paths.dashboard.accountingFinance.transactions.journalEntries, icon: 'solar:book-bold', color: '#3b82f6' },
    { label: 'Trial Balance', href: paths.dashboard.accountingFinance.reports.trialBalance, icon: 'solar:chart-bold', color: '#8b5cf6' },
    { label: 'Balance Sheet', href: paths.dashboard.accountingFinance.reports.balanceSheet, icon: 'solar:scale-bold', color: '#f59e0b' },
    { label: 'Configuration', href: paths.dashboard.accountingFinance.configuration.chartOfAccounts, icon: 'solar:settings-bold', color: '#6b7280' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Accounting Dashboard</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Financial overview from your chart of accounts, bills, and invoices.
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Receivables" value={formatCurrency(totalReceivables)} subtitle={`${unpaidInvoices.length} unpaid invoices`} icon="solar:arrow-up-bold" color="#10b981" trend={overdueInvoices.length > 0 ? `${overdueInvoices.length} overdue` : undefined} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Payables" value={formatCurrency(totalPayables)} subtitle={`${unpaidBills.length} unpaid bills`} icon="solar:arrow-down-bold" color="#ef4444" trend={overdueBills.length > 0 ? `${overdueBills.length} overdue` : undefined} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Cash & Bank" value={formatCurrency(totalCash)} subtitle={`${cashAccounts.length} accounts`} icon="solar:wallet-money-bold" color="#3b82f6" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Net Result" value={formatCurrency(totalIncome - totalExpenses)} subtitle={`Income: ${formatCurrency(totalIncome)}`} icon="solar:chart-square-bold" color={totalIncome >= totalExpenses ? '#10b981' : '#ef4444'} trend={totalIncome >= totalExpenses ? `+${formatCurrency(totalIncome - totalExpenses)}` : `${formatCurrency(totalExpenses - totalIncome)}`} />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Revenue vs Expense Bar Chart */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ borderRadius: 3, height: 320 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Revenue vs Expenses</Typography>
              <Typography variant="caption" color="text.secondary">Monthly trend from journal entries</Typography>
              <Box sx={{ height: 250, mt: 1 }}>
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography color="text.secondary">No journal entry data available</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Receivable Aging Pie Chart */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ borderRadius: 3, height: 320 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Receivable Aging</Typography>
              <Typography variant="caption" color="text.secondary">Outstanding invoices by age</Typography>
              <Box sx={{ height: 250, mt: 1 }}>
                {agingData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={agingData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {agingData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography color="text.secondary">No receivable data</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Overdue Alert */}
      {overdueCount > 0 && (
        <Card sx={{ mb: 3, borderRadius: 3, borderLeft: '4px solid #ef4444', bgcolor: '#fef2f2' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: '#ef444420', color: '#ef4444', width: 40, height: 40 }}>
                <Iconify icon="solar:danger-bold" width={20} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {overdueCount} overdue item{overdueCount !== 1 ? 's' : ''} requiring attention
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatCurrency(overdueAmount)} total outstanding from overdue bills and invoices
                </Typography>
              </Box>
              <Button variant="outlined" color="error" size="small" component={Link} href={paths.dashboard.accountingFinance.reports.supplierLedger}>
                View Details
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions + Recent Entries */}
      <Grid container spacing={2}>
        {/* Quick Actions */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Quick Actions</Typography>
              <Stack spacing={1}>
                {quickLinks.map((link) => (
                  <Button
                    key={link.label}
                    component={Link}
                    href={link.href}
                    fullWidth
                    variant="outlined"
                    startIcon={<Iconify icon={link.icon} width={18} sx={{ color: link.color }} />}
                    sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1.25 }}
                  >
                    {link.label}
                  </Button>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Journal Entries */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Recent Journal Entries</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell align="right">Debit</TableCell>
                      <TableCell align="right">Credit</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {journalEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary">No journal entries yet</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      journalEntries.slice(0, 8).map((entry) => (
                        <TableRow key={entry.id} hover sx={{ cursor: 'pointer' }} onClick={() => window.location.href = paths.dashboard.accountingFinance.transactions.journalEntryDetail(entry.id)}>
                          <TableCell>
                            <Typography variant="body2">{entry.date || '-'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                              {entry.reference || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="success.main">{formatCurrency(entry.total_debit || 0)}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="error.main">{formatCurrency(entry.total_credit || 0)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={entry.status} size="small" color={entry.status === 'posted' ? 'success' : 'default'} sx={{ textTransform: 'capitalize' }} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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
