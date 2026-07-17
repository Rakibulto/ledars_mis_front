'use client';

/* eslint-disable import/order, sort-imports */

import useSWR from 'swr';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import ListItem from '@mui/material/ListItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import AlertTitle from '@mui/material/AlertTitle';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import ListItemText from '@mui/material/ListItemText';
import { alpha, useTheme } from '@mui/material/styles';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';

import { fetcher } from 'src/utils/axios';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from './utils';

const COMPANIES = [
  { value: 'all', label: 'All Entities', factor: 1.08 },
  { value: 'leaders-foundation', label: 'Leaders Foundation', factor: 1 },
  { value: 'field-operations', label: 'Field Operations Unit', factor: 0.74 },
  { value: 'education-program', label: 'Education Program', factor: 0.58 },
];

const PERIODS = [
  { value: 'march-2026', label: 'March 2026', factor: 1 },
  { value: 'q1-2026', label: 'Q1 2026', factor: 2.76 },
  { value: 'fy-2026', label: 'FY 2025-2026', factor: 11.4 },
];

const BASE_SUMMARY = {
  totalRevenue: 428000,
  totalExpenses: 301000,
  netIncome: 127000,
  receivables: 164000,
  payables: 119000,
  cashBank: 356000,
};

const BASE_TREND = [
  { month: 'Oct', revenue: 298000, expenses: 221000 },
  { month: 'Nov', revenue: 326000, expenses: 234000 },
  { month: 'Dec', revenue: 341000, expenses: 252000 },
  { month: 'Jan', revenue: 362000, expenses: 266000 },
  { month: 'Feb', revenue: 389000, expenses: 281000 },
  { month: 'Mar', revenue: 428000, expenses: 301000 },
];

const BASE_AGING = [
  { bucket: 'Current', invoices: 17, amount: 68000, risk: 'low' },
  { bucket: '1-30 Days', invoices: 12, amount: 42000, risk: 'medium' },
  { bucket: '31-60 Days', invoices: 7, amount: 29000, risk: 'medium' },
  { bucket: '61-90 Days', invoices: 4, amount: 16000, risk: 'high' },
  { bucket: '90+ Days', invoices: 2, amount: 9000, risk: 'high' },
];

const BASE_CASH_ACCOUNTS = [
  {
    id: 'operating',
    name: 'Operating Account',
    institution: 'Dutch Bangla Bank',
    type: 'bank',
    balance: 214000,
    delta: '+5.2%',
    status: 'Healthy',
  },
  {
    id: 'program',
    name: 'Program Disbursement',
    institution: 'BRAC Bank',
    type: 'bank',
    balance: 101000,
    delta: '-1.1%',
    status: 'Monitor',
  },
  {
    id: 'petty-cash',
    name: 'Petty Cash',
    institution: 'Head Office',
    type: 'cash',
    balance: 7000,
    delta: '+0.4%',
    status: 'Healthy',
  },
];

const BASE_BUDGETS = [
  {
    id: 'education',
    name: 'Education Recovery',
    planned: 240000,
    committed: 181000,
    actual: 166000,
  },
  {
    id: 'health',
    name: 'Health Outreach',
    planned: 180000,
    committed: 149000,
    actual: 136000,
  },
  {
    id: 'ops',
    name: 'Operations Support',
    planned: 115000,
    committed: 91000,
    actual: 82000,
  },
];

const BASE_CLOSE_STATUS = [
  {
    id: 'bank-rec',
    title: 'Bank reconciliation',
    owner: 'Treasury desk',
    status: 'in_progress',
    due: '29 Mar',
    completion: 72,
  },
  {
    id: 'ar-review',
    title: 'Receivable review',
    owner: 'AR team',
    status: 'attention',
    due: '28 Mar',
    completion: 54,
  },
  {
    id: 'ap-accrual',
    title: 'Accruals and provisions',
    owner: 'Finance manager',
    status: 'on_track',
    due: '30 Mar',
    completion: 80,
  },
  {
    id: 'period-lock',
    title: 'Period lock preparation',
    owner: 'Controller',
    status: 'not_started',
    due: '31 Mar',
    completion: 18,
  },
];

const BASE_INBOX = [
  {
    id: 'recon-01',
    title: 'Unmatched bank lines',
    detail: '14 statement lines need matching or write-off rules.',
    count: 14,
    priority: 'high',
    route: paths.dashboard.accountingFinance.banking.reconciliation,
  },
  {
    id: 'ar-01',
    title: 'Overdue customer follow-up',
    detail: '6 invoices crossed 60 days and need escalation.',
    count: 6,
    priority: 'high',
    route: paths.dashboard.accountingFinance.receivables.collectionFollowUp,
  },
  {
    id: 'ap-01',
    title: 'Payments ready for release',
    detail: '9 vendor payments are due in the next 3 days.',
    count: 9,
    priority: 'medium',
    route: paths.dashboard.accountingFinance.payables.paymentSchedule,
  },
  {
    id: 'gl-01',
    title: 'Draft journals awaiting posting',
    detail: '5 journals need final review before post.',
    count: 5,
    priority: 'medium',
    route: paths.dashboard.accountingFinance.transactions.journalEntries,
  },
];

const BASE_ALERTS = [
  {
    id: 'alert-1',
    severity: 'error',
    title: 'Urgent close blocker',
    detail: 'Two reconciliation differences exceed approval threshold and are still unresolved.',
  },
  {
    id: 'alert-2',
    severity: 'warning',
    title: 'Budget pressure',
    detail: 'Health Outreach has committed 83% of the approved ceiling before month-end.',
  },
  {
    id: 'alert-3',
    severity: 'info',
    title: 'Collection opportunity',
    detail: 'Top three overdue customers represent 61% of total overdue receivables.',
  },
];

const BASE_ACTIVITIES = [
  {
    id: 'act-1',
    title: 'Vendor bill VB-2409 approved',
    detail: 'Medical supply bill approved and queued for payment run.',
    time: '15 min ago',
    route: paths.dashboard.accountingFinance.transactions.vendorBills,
  },
  {
    id: 'act-2',
    title: 'Journal JE-2026-032 posted',
    detail: 'Grant income accrual posted by Finance Manager.',
    time: '42 min ago',
    route: paths.dashboard.accountingFinance.transactions.journalEntries,
  },
  {
    id: 'act-3',
    title: 'Statement import prepared',
    detail: 'March operating account statement is ready for reconciliation.',
    time: '1 hr ago',
    route: paths.dashboard.accountingFinance.banking.bankStatements,
  },
  {
    id: 'act-4',
    title: 'Customer statement generated',
    detail: 'Quarterly partner statement prepared for donor receivable review.',
    time: '2 hr ago',
    route: paths.dashboard.accountingFinance.receivables.customerStatements,
  },
];

const SECTION_LINKS = [
  {
    id: 'transactions',
    title: 'Transactions',
    subtitle: 'Post journals, invoices, bills, and adjustments.',
    icon: 'solar:document-text-bold-duotone',
    color: '#2563eb',
    route: paths.dashboard.accountingFinance.transactions.root,
  },
  {
    id: 'banking',
    title: 'Banking',
    subtitle: 'Statements, reconciliation, transfers, and cash control.',
    icon: 'solar:card-bold-duotone',
    color: '#0891b2',
    route: paths.dashboard.accountingFinance.banking.root,
  },
  {
    id: 'receivables',
    title: 'Receivables',
    subtitle: 'Collections, aging, customer ledgers, and statements.',
    icon: 'solar:card-recive-bold-duotone',
    color: '#f59e0b',
    route: paths.dashboard.accountingFinance.receivables.root,
  },
  {
    id: 'payables',
    title: 'Payables',
    subtitle: 'Payment schedule, unpaid bills, supplier ledgers.',
    icon: 'solar:card-send-bold-duotone',
    color: '#8b5cf6',
    route: paths.dashboard.accountingFinance.payables.root,
  },
  {
    id: 'reports',
    title: 'Reports',
    subtitle: 'Trial balance, P and L, balance sheet, and analytics.',
    icon: 'solar:chart-2-bold-duotone',
    color: '#16a34a',
    route: paths.dashboard.accountingFinance.reports.root,
  },
  {
    id: 'configuration',
    title: 'Configuration',
    subtitle: 'Chart of accounts, journals, periods, and rules.',
    icon: 'solar:settings-bold-duotone',
    color: '#ef4444',
    route: paths.dashboard.accountingFinance.configuration.root,
  },
];

const ACTION_LINKS = [
  {
    id: 'new-entry',
    label: 'New journal entry',
    icon: 'solar:add-circle-bold',
    route: paths.dashboard.accountingFinance.transactions.journalEntries,
  },
  {
    id: 'run-rec',
    label: 'Run reconciliation',
    icon: 'solar:check-circle-bold',
    route: paths.dashboard.accountingFinance.banking.reconciliation,
  },
  {
    id: 'review-aging',
    label: 'Review aging',
    icon: 'solar:hourglass-line-duotone',
    route: paths.dashboard.accountingFinance.receivables.agingReport,
  },
  {
    id: 'close-status',
    label: 'Year-end closing',
    icon: 'solar:calendar-mark-bold',
    route: paths.dashboard.accountingFinance.yearEnd.root,
  },
];

function roundValue(value) {
  return Math.round(value);
}

function scaleAmount(value, companyFactor, periodFactor) {
  return roundValue(value * companyFactor * periodFactor);
}

function getPriorityColor(priority) {
  if (priority === 'high') return 'error';
  if (priority === 'medium') return 'warning';
  return 'info';
}

function getStatusColor(status) {
  if (status === 'on_track') return 'success';
  if (status === 'in_progress') return 'warning';
  if (status === 'attention') return 'error';
  return 'default';
}

function buildDashboard(companyValue, periodValue) {
  const company = COMPANIES.find((item) => item.value === companyValue) || COMPANIES[0];
  const period = PERIODS.find((item) => item.value === periodValue) || PERIODS[0];
  const companyFactor = company.factor;
  const periodFactor = period.factor;
  const growthFactor = companyValue === 'all' ? 1.14 : 1.08;

  const summary = {
    totalRevenue: scaleAmount(BASE_SUMMARY.totalRevenue, companyFactor, periodFactor),
    totalExpenses: scaleAmount(BASE_SUMMARY.totalExpenses, companyFactor, periodFactor),
    netIncome: scaleAmount(BASE_SUMMARY.netIncome, companyFactor, periodFactor),
    receivables: scaleAmount(BASE_SUMMARY.receivables, companyFactor, periodFactor),
    payables: scaleAmount(BASE_SUMMARY.payables, companyFactor, periodFactor),
    cashBank: scaleAmount(BASE_SUMMARY.cashBank, companyFactor, periodFactor),
  };

  const trend = BASE_TREND.map((row, index) => ({
    ...row,
    revenue: scaleAmount(row.revenue, companyFactor, periodFactor / growthFactor),
    expenses: scaleAmount(row.expenses, companyFactor, periodFactor / growthFactor),
    marginRate: 28 + index * 2,
  }));

  const aging = BASE_AGING.map((row) => ({
    ...row,
    invoices: Math.max(1, Math.round(row.invoices * companyFactor)),
    amount: scaleAmount(row.amount, companyFactor, periodFactor),
  }));

  const budgets = BASE_BUDGETS.map((row) => ({
    ...row,
    planned: scaleAmount(row.planned, companyFactor, periodFactor),
    committed: scaleAmount(row.committed, companyFactor, periodFactor),
    actual: scaleAmount(row.actual, companyFactor, periodFactor),
  })).map((row) => ({
    ...row,
    available: row.planned - row.committed,
    utilization: row.planned ? Math.min(100, Math.round((row.committed / row.planned) * 100)) : 0,
    actualRatio: row.planned ? Math.round((row.actual / row.planned) * 100) : 0,
  }));

  const cashAccounts = BASE_CASH_ACCOUNTS.map((row) => ({
    ...row,
    balance: scaleAmount(row.balance, companyFactor, periodFactor),
  }));

  const closeStatus = BASE_CLOSE_STATUS.map((row, index) => ({
    ...row,
    completion: Math.min(100, row.completion + (periodValue === 'fy-2026' ? index * 3 : 0)),
  }));

  const inbox = BASE_INBOX.map((row) => ({
    ...row,
    count: Math.max(1, Math.round(row.count * companyFactor)),
  }));

  const overdueShare = summary.receivables
    ? Math.round(((aging[3].amount + aging[4].amount) / summary.receivables) * 100)
    : 0;
  const liquidityCoverage = summary.payables
    ? (summary.cashBank / summary.payables).toFixed(1)
    : '0.0';
  const collectionCoverage = summary.receivables
    ? Math.round((aging[0].amount / summary.receivables) * 100)
    : 0;
  const budgetAtRisk = budgets.filter((row) => row.utilization >= 80).length;

  return {
    company,
    period,
    summary,
    trend,
    aging,
    budgets,
    cashAccounts,
    closeStatus,
    inbox,
    alerts: BASE_ALERTS,
    activities: BASE_ACTIVITIES,
    overdueShare,
    liquidityCoverage,
    collectionCoverage,
    budgetAtRisk,
  };
}

export default function AccountingDashboard() {
  const theme = useTheme();
  const [company, setCompany] = useState('all');
  const [period, setPeriod] = useState('march-2026');

  // ── Real expense data ─────────────────────────────────────────────────────
  const { data: rawExpenses } = useSWR('/api/acc-workspace-expense-entries/', fetcher);
  const realTotalExpenses = useMemo(() => {
    const list = Array.isArray(rawExpenses)
      ? rawExpenses
      : Array.isArray(rawExpenses?.results)
        ? rawExpenses.results
        : [];
    return list.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [rawExpenses]);
  const hasRealExpenses = realTotalExpenses > 0;

  const dashboard = buildDashboard(company, period);

  // Merge real expenses into summary (keep mock if API returns nothing)
  const summary = useMemo(() => {
    if (!hasRealExpenses) return dashboard.summary;
    const company_ = COMPANIES.find((c) => c.value === company) || COMPANIES[0];
    const period_ = PERIODS.find((p) => p.value === period) || PERIODS[0];
    const scaledExpenses = Math.round(realTotalExpenses * company_.factor * period_.factor);
    const scaledNet = dashboard.summary.totalRevenue - scaledExpenses;
    return { ...dashboard.summary, totalExpenses: scaledExpenses, netIncome: scaledNet };
  }, [hasRealExpenses, realTotalExpenses, dashboard.summary, company, period]);
  // Replace last trend bar (current month) expense with real API value if available
  const trend = useMemo(() => {
    if (!hasRealExpenses) return dashboard.trend;
    const company_ = COMPANIES.find((c) => c.value === company) || COMPANIES[0];
    const period_ = PERIODS.find((p) => p.value === period) || PERIODS[0];
    const scaledExpenses = Math.round(realTotalExpenses * company_.factor * period_.factor);
    return dashboard.trend.map((row, i, arr) =>
      i === arr.length - 1 ? { ...row, expenses: scaledExpenses } : row
    );
  }, [hasRealExpenses, realTotalExpenses, dashboard.trend, company, period]);

  const maxTrendAmount = Math.max(...trend.map((row) => Math.max(row.revenue, row.expenses)));
  const totalBudget = dashboard.budgets.reduce((sum, row) => sum + row.planned, 0);
  const totalCommitted = dashboard.budgets.reduce((sum, row) => sum + row.committed, 0);
  const totalActual = dashboard.budgets.reduce((sum, row) => sum + row.actual, 0);
  const budgetUtilization = totalBudget ? Math.round((totalCommitted / totalBudget) * 100) : 0;

  const statCards = [
    {
      label: 'Revenue',
      value: summary.totalRevenue,
      icon: 'solar:wallet-money-bold-duotone',
      color: '#16a34a',
      delta: '+12.4%',
    },
    {
      label: 'Expenses',
      value: summary.totalExpenses,
      icon: 'solar:bill-list-bold-duotone',
      color: '#ef4444',
      delta: hasRealExpenses ? 'Live data' : '+8.1%',
    },
    {
      label: 'Net surplus',
      value: summary.netIncome,
      icon: 'solar:chart-bold-duotone',
      color: '#2563eb',
      delta: '+18.7%',
    },
    {
      label: 'Receivables',
      value: summary.receivables,
      icon: 'solar:card-recive-bold-duotone',
      color: '#f59e0b',
      delta: `${dashboard.overdueShare}% overdue`,
    },
    {
      label: 'Payables',
      value: summary.payables,
      icon: 'solar:card-send-bold-duotone',
      color: '#8b5cf6',
      delta: `${dashboard.liquidityCoverage}x cash cover`,
    },
    {
      label: 'Cash and bank',
      value: summary.cashBank,
      icon: 'solar:safe-square-bold-duotone',
      color: '#0891b2',
      delta: 'Month-end ready',
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Accounting Command Center
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Mock-driven finance workspace for close control, banking, receivables, payables, and
            reporting.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            select
            size="small"
            label="Entity"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            sx={{ minWidth: 210 }}
          >
            {COMPANIES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Period"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            sx={{ minWidth: 170 }}
          >
            {PERIODS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <Button
            component={Link}
            href={paths.dashboard.accountingFinance.transactions.journalEntries}
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
          >
            New Entry
          </Button>
        </Stack>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        <AlertTitle>Mock dataset active</AlertTitle>
        This dashboard now runs from stable mock accounting data so it can be expanded page by page
        without API fallback failures.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 4, xl: 2 }}>
            <Card sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {card.label}
                    </Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
                      {formatCurrency(card.value)}
                    </Typography>
                    <Chip
                      label={card.delta}
                      size="small"
                      sx={{
                        mt: 1.25,
                        height: 22,
                        bgcolor: alpha(card.color, 0.12),
                        color: card.color,
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                  <Avatar sx={{ bgcolor: alpha(card.color, 0.12), color: card.color }}>
                    <Iconify icon={card.icon} width={22} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2.5 }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Revenue vs Expense Momentum
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Period trend view with margin direction for {dashboard.company.label}.
                  </Typography>
                </Box>
                <Chip label={dashboard.period.label} size="small" color="primary" />
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="flex-end" sx={{ minHeight: 250 }}>
                {trend.map((row) => {
                  const revenueHeight = Math.max(24, (row.revenue / maxTrendAmount) * 180);
                  const expenseHeight = Math.max(18, (row.expenses / maxTrendAmount) * 180);

                  return (
                    <Box key={row.month} sx={{ flex: 1, minWidth: 62 }}>
                      <Stack
                        direction="row"
                        justifyContent="center"
                        spacing={1}
                        alignItems="flex-end"
                      >
                        <Box
                          sx={{
                            width: 18,
                            height: revenueHeight,
                            borderRadius: 6,
                            bgcolor: '#16a34a',
                          }}
                        />
                        <Box
                          sx={{
                            width: 18,
                            height: expenseHeight,
                            borderRadius: 6,
                            bgcolor: '#ef4444',
                          }}
                        />
                      </Stack>
                      <Typography variant="caption" display="block" align="center" sx={{ mt: 1 }}>
                        {row.month}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        align="center"
                      >
                        {row.marginRate}% margin
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2.5 }}>
                <Chip
                  icon={
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#16a34a' }} />
                  }
                  label="Revenue"
                  variant="outlined"
                />
                <Chip
                  icon={
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ef4444' }} />
                  }
                  label="Expenses"
                  variant="outlined"
                />
                <Chip
                  label={`${dashboard.collectionCoverage}% current AR coverage`}
                  color="success"
                  size="small"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3} sx={{ height: '100%' }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Close Status
                </Typography>
                <Stack spacing={2}>
                  {dashboard.closeStatus.map((item) => (
                    <Box key={item.id}>
                      <Stack direction="row" justifyContent="space-between" spacing={2}>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            {item.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.owner} - due {item.due}
                          </Typography>
                        </Box>
                        <Chip
                          label={item.status.replace('_', ' ')}
                          size="small"
                          color={getStatusColor(item.status)}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={item.completion}
                        sx={{ mt: 1, height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3, flex: 1 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Exception Watchlist
                </Typography>
                <Stack spacing={1.5}>
                  {dashboard.alerts.map((item) => (
                    <Alert key={item.id} severity={item.severity} variant="outlined">
                      <AlertTitle>{item.title}</AlertTitle>
                      {item.detail}
                    </Alert>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Budget Discipline
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#2563eb', 0.08) }}>
                    <Typography variant="caption" color="text.secondary">
                      Planned budget
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      {formatCurrency(totalBudget)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#f59e0b', 0.08) }}>
                    <Typography variant="caption" color="text.secondary">
                      Committed
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      {formatCurrency(totalCommitted)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#16a34a', 0.08) }}>
                    <Typography variant="caption" color="text.secondary">
                      Actual spent
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      {formatCurrency(totalActual)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Alert severity={dashboard.budgetAtRisk > 1 ? 'warning' : 'success'} sx={{ mb: 2.5 }}>
                {dashboard.budgetAtRisk > 1
                  ? `${dashboard.budgetAtRisk} budget lines are above 80% commitment.`
                  : 'Budget consumption is within control limits.'}
              </Alert>

              <Stack spacing={2}>
                {dashboard.budgets.map((row) => (
                  <Box key={row.id}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {row.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Actual ratio {row.actualRatio}%
                        </Typography>
                      </Box>
                      <Chip
                        label={`${row.utilization}% committed`}
                        size="small"
                        color={
                          row.utilization >= 90
                            ? 'error'
                            : row.utilization >= 75
                              ? 'warning'
                              : 'success'
                        }
                      />
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={row.utilization}
                      sx={{ height: 8, borderRadius: 4, mb: 0.75 }}
                    />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        Planned {formatCurrency(row.planned)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Available {formatCurrency(row.available)}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1.5}
                sx={{ mb: 2 }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Reconciliation Inbox
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Queue of actions that usually drive the accounting close.
                  </Typography>
                </Box>
                <Chip
                  label={`${budgetUtilization}% budget utilization`}
                  size="small"
                  color="primary"
                />
              </Stack>

              <Stack spacing={1.5}>
                {dashboard.inbox.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      justifyContent="space-between"
                      spacing={2}
                    >
                      <Stack direction="row" spacing={1.5}>
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            color: 'primary.main',
                          }}
                        >
                          <Iconify icon="solar:inbox-bold-duotone" width={20} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            {item.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.detail}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label={`${item.count} items`} size="small" variant="outlined" />
                        <Chip
                          label={item.priority}
                          size="small"
                          color={getPriorityColor(item.priority)}
                          sx={{ textTransform: 'capitalize' }}
                        />
                        <Button component={Link} href={item.route} size="small" variant="contained">
                          Open
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Receivable Aging
                </Typography>
                <Button
                  component={Link}
                  href={paths.dashboard.accountingFinance.receivables.agingReport}
                  size="small"
                  endIcon={<Iconify icon="solar:arrow-right-up-linear" />}
                >
                  Open report
                </Button>
              </Stack>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Bucket</TableCell>
                      <TableCell align="right">Invoices</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Risk</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboard.aging.map((row) => (
                      <TableRow key={row.bucket} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            {row.bucket}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{row.invoices}</TableCell>
                        <TableCell align="right">{formatCurrency(row.amount)}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={row.risk}
                            size="small"
                            color={getPriorityColor(row.risk)}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Liquidity Snapshot
                </Typography>
                <Chip
                  label={`${dashboard.liquidityCoverage}x payable cover`}
                  size="small"
                  color="success"
                />
              </Stack>
              <Stack spacing={2}>
                {dashboard.cashAccounts.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: alpha(item.type === 'bank' ? '#0891b2' : '#16a34a', 0.08),
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.institution}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle2" fontWeight={800}>
                          {formatCurrency(item.balance)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.delta} / {item.status}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Activity Stream
                </Typography>
                <Button
                  component={Link}
                  href={paths.dashboard.accountingFinance.settings.auditLog}
                  size="small"
                  endIcon={<Iconify icon="solar:arrow-right-up-linear" />}
                >
                  Audit log
                </Button>
              </Stack>
              <List disablePadding>
                {dashboard.activities.map((item, index) => (
                  <Box key={item.id}>
                    <ListItem disableGutters sx={{ py: 1.25 }}>
                      <ListItemText
                        primary={
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            justifyContent="space-between"
                            spacing={1}
                          >
                            <Typography variant="body2" fontWeight={700}>
                              {item.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.time}
                            </Typography>
                          </Stack>
                        }
                        secondary={
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            justifyContent="space-between"
                            spacing={1}
                            sx={{ mt: 0.5 }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              {item.detail}
                            </Typography>
                            <Button component={Link} href={item.route} size="small">
                              View
                            </Button>
                          </Stack>
                        }
                        disableTypography
                      />
                    </ListItem>
                    {index < dashboard.activities.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Action Center
              </Typography>
              <Stack spacing={1.25}>
                {ACTION_LINKS.map((item) => (
                  <Button
                    key={item.id}
                    component={Link}
                    href={item.route}
                    variant="outlined"
                    startIcon={<Iconify icon={item.icon} />}
                    sx={{ justifyContent: 'flex-start', py: 1.25 }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {SECTION_LINKS.map((item) => (
          <Grid key={item.id} size={{ xs: 12, md: 6, xl: 4 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: alpha(item.color, 0.12), color: item.color }}>
                    <Iconify icon={item.icon} width={22} />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.subtitle}
                    </Typography>
                  </Box>
                </Stack>
                <Button
                  component={Link}
                  href={item.route}
                  size="small"
                  endIcon={<Iconify icon="solar:arrow-right-up-linear" />}
                >
                  Open workspace
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
