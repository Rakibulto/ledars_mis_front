'use client';

import {
  Box,
  Card,
  Grid,
  Chip,
  Stack,
  Table,
  Alert,
  Button,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  CardContent,
  TableContainer,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

import SummaryCard from 'src/sections/_components/summary-card';

export default function MisAccountingMain() {
  const accountingModules = [
    {
      title: 'Chart of Accounts',
      description: 'Manage account structure and hierarchy',
      icon: 'solar:document-text-bold-duotone',
      iconColor: '#2563eb',
      iconBg: '#E3F2FD',
      count: '35 Accounts',
      link: '/accounting/chart-of-accounts',
    },
    {
      title: 'Voucher Entry',
      description: 'Create debit, credit, journal & contra vouchers',
      icon: 'solar:document-add-bold-duotone',
      iconColor: '#10b981',
      iconBg: '#D1FAE5',
      count: '3 Pending',
      link: '/accounting/vouchers',
    },
    {
      title: 'Bank Reconciliation',
      description: 'Reconcile bank statements with records',
      icon: 'solar:card-bold-duotone',
      iconColor: '#ec4899',
      iconBg: '#FCE7F3',
      count: '1 Pending',
      link: '/accounting/bank-reconciliation',
    },
    {
      title: 'Bills Payable',
      description: 'Track receivables & external bills',
      icon: 'solar:bill-list-bold-duotone',
      iconColor: '#f97316',
      iconBg: '#FFEDD5',
      count: '5 Unpaid',
      link: '/accounting/bills',
    },
    {
      title: 'Accounting Reports',
      description: 'Trial balance, P&L, Balance sheet',
      icon: 'solar:chart-bold-duotone',
      iconColor: '#06b6d4',
      iconBg: '#CFFAFE',
      count: '12 Reports',
      link: '/accounting/reports',
    },
    {
      title: 'Tally Integration',
      description: 'Export to Tally XML format',
      icon: 'solar:transfer-horizontal-bold-duotone',
      iconColor: '#8b5cf6',
      iconBg: '#EDE9FE',
      count: 'Auto Sync',
      link: '/accounting/tally',
    },
  ];

  const recentTransactions = [
    {
      voucher: 'V001',
      date: '2026-03-03',
      type: 'Payment',
      account: 'Rent Expense',
      amount: '-৳5,000',
      status: 'Approved',
    },
    {
      voucher: 'V002',
      date: '2026-03-02',
      type: 'Receipt',
      account: 'Donor Contribution',
      amount: '+১,000,000',
      status: 'Approved',
    },
    {
      voucher: 'V003',
      date: '2026-03-02',
      type: 'Journal',
      account: 'Salary Expense',
      amount: '-২00,000',
      status: 'Approved',
    },
    {
      voucher: 'V004',
      date: '2026-02-31',
      type: 'Payment',
      account: 'Office Supplies',
      amount: '-৳5,000',
      status: 'Pending',
    },
    {
      voucher: 'V005',
      date: '2026-02-26',
      type: 'Receipt',
      account: 'Service Income',
      amount: '+১75,000',
      status: 'Approved',
    },
  ];

  const getStatusColor = (status) => {
    const colors = {
      Approved: 'success',
      Pending: 'warning',
      Rejected: 'error',
    };
    return colors[status] || 'default';
  };

  const getTypeColor = (type) => {
    const colors = {
      Payment: 'error',
      Receipt: 'success',
      Journal: 'info',
    };
    return colors[type] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard
            title="Total Revenue"
            value="৳8,500,000"
            subtitle="+12% from last month"
            icon="solar:dollar-minimalistic-bold-duotone"
            color="#10b981"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard
            title="Total Expenses"
            value="৳6,200,000"
            subtitle="+8% from last month"
            icon="solar:wallet-money-bold-duotone"
            color="#ec4899"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard
            title="Net Income"
            value="৳2,300,000"
            subtitle="27% profit margin"
            icon="solar:graph-up-bold-duotone"
            color="#6366f1"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard
            title="Cash in Bank"
            value="৳4,500,000"
            subtitle="Across 3 bank accounts"
            icon="solar:card-bold-duotone"
            color="#8b5cf6"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard
            title="Accounts Payable"
            value="৳850,000"
            subtitle="Due within 30 days"
            icon="solar:bill-list-bold-duotone"
            color="#f97316"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard
            title="Working Capital"
            value="৳9,300,000"
            subtitle="Positive liquidity position"
            icon="solar:chart-2-bold-duotone"
            color="#06b6d4"
          />
        </Grid>
      </Grid>

      {/* Pending Approvals */}
      <Alert
        severity="warning"
        icon={<Iconify icon="solar:clock-circle-bold-duotone" width={24} />}
        sx={{ mb: 3, borderRadius: 2 }}
      >
        <Stack direction="row" spacing={4} flexWrap="wrap">
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ea580c' }}>
              3
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vouchers pending approval
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ea580c' }}>
              5
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bills pending payment
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ea580c' }}>
              1
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bank reconciliation pending
            </Typography>
          </Box>
        </Stack>
      </Alert>

      {/* Accounting Modules */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Accounting Modules
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {accountingModules.map((module, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                borderRadius: 2,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: module.iconBg,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Iconify icon={module.icon} width={24} sx={{ color: module.iconColor }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {module.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {module.description}
                    </Typography>
                    <Typography variant="caption" sx={{ color: module.iconColor, fontWeight: 600 }}>
                      {module.count}
                    </Typography>
                  </Box>
                  <Iconify
                    icon="solar:arrow-right-bold"
                    width={16}
                    sx={{ color: 'text.disabled', mt: 0.5 }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Transactions */}
      <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderRadius: 2, mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ p: 2.5, pb: 2 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Recent Transactions
            </Typography>
            <Button
              size="small"
              endIcon={<Iconify icon="solar:arrow-right-bold" />}
              sx={{ textTransform: 'none' }}
            >
              View All
            </Button>
          </Stack>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>VOUCHER ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>DATE</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>TYPE</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>ACCOUNT</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    AMOUNT
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>STATUS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentTransactions.map((transaction, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{transaction.voucher}</TableCell>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.type}
                        size="small"
                        color={getTypeColor(transaction.type)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{transaction.account}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {transaction.amount}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.status}
                        size="small"
                        color={getStatusColor(transaction.status)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Assets
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                +১2,500,000
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Liabilities
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                ৳3,200,000
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Accounts Receivable
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                +১,200,000
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Ratio
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                3.91
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
