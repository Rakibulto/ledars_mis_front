'use client';

import { useState } from 'react';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { toast } from 'sonner';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useCurrency } from '../currency-context';
import { useBankingWorkspace } from './use-banking-workspace';
import CheckPrintView from './check-print-view';

const STATUS_COLORS = {
  prepared: 'warning',
  issued: 'info',
  cleared: 'success',
  bounced: 'error',
  voided: 'default',
};

const STATUS_TIMELINE = ['prepared', 'issued', 'cleared'];

const chequeStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  box: { border: '1 solid #000', padding: 20, borderRadius: 4 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  row: { flexDirection: 'row', marginBottom: 8 },
  label: { width: 140, color: '#555' },
  value: { flex: 1, fontWeight: 'bold' },
  divider: { borderBottom: '1 solid #eee', marginVertical: 12 },
  footer: {
    position: 'absolute', bottom: 30, left: 40, right: 40,
    borderTop: '1 solid #eee', paddingTop: 8,
    flexDirection: 'row', justifyContent: 'space-between',
    fontSize: 8, color: '#999',
  },
});

function CheckPrintPDF({ check, account }) {
  return (
    <Document>
      <Page size="A4" style={chequeStyles.page}>
        <View style={chequeStyles.box}>
          <Text style={chequeStyles.title}>Cheque — {check.checkNumber}</Text>

          <View style={chequeStyles.row}>
            <Text style={chequeStyles.label}>Check Number</Text>
            <Text style={chequeStyles.value}>{check.checkNumber}</Text>
          </View>
          <View style={chequeStyles.row}>
            <Text style={chequeStyles.label}>Payee</Text>
            <Text style={chequeStyles.value}>{check.payee}</Text>
          </View>
          <View style={chequeStyles.row}>
            <Text style={chequeStyles.label}>Amount</Text>
            <Text style={chequeStyles.value}>{formatCurrency(check.amount)}</Text>
          </View>
          <View style={chequeStyles.row}>
            <Text style={chequeStyles.label}>Bank</Text>
            <Text style={chequeStyles.value}>{check.bankName || account?.name || '—'}</Text>
          </View>
          <View style={chequeStyles.row}>
            <Text style={chequeStyles.label}>Account</Text>
            <Text style={chequeStyles.value}>{account?.maskedNumber || '—'}</Text>
          </View>

          <View style={chequeStyles.divider} />

          <View style={chequeStyles.row}>
            <Text style={chequeStyles.label}>Issue Date</Text>
            <Text style={chequeStyles.value}>{check.issueDate}</Text>
          </View>
          <View style={chequeStyles.row}>
            <Text style={chequeStyles.label}>Due Date</Text>
            <Text style={chequeStyles.value}>{check.dueDate}</Text>
          </View>
          <View style={chequeStyles.row}>
            <Text style={chequeStyles.label}>Status</Text>
            <Text style={chequeStyles.value}>{check.status?.toUpperCase()}</Text>
          </View>
          <View style={chequeStyles.row}>
            <Text style={chequeStyles.label}>Treasury Owner</Text>
            <Text style={chequeStyles.value}>{check.owner || '—'}</Text>
          </View>
          <View style={chequeStyles.row}>
            <Text style={chequeStyles.label}>Payment Reference</Text>
            <Text style={chequeStyles.value}>{check.paymentReference || '—'}</Text>
          </View>
          <View style={chequeStyles.row}>
            <Text style={chequeStyles.label}>Memo / Purpose</Text>
            <Text style={chequeStyles.value}>{check.memo || '—'}</Text>
          </View>
        </View>

        <View style={chequeStyles.footer}>
          <Text>Generated {new Date().toLocaleDateString()}</Text>
          <Text>LEDARS — NGO Management System</Text>
        </View>
      </Page>
    </Document>
  );
}

function DetailRow({ label, value }) {
  return (
    <TableRow>
      <TableCell sx={{ color: 'text.secondary', width: '40%' }}>{label}</TableCell>
      <TableCell sx={{ fontWeight: 600 }}>{value ?? '—'}</TableCell>
    </TableRow>
  );
}

export default function CheckDetail({ id }) {
  useCurrency();
  const { accounts, checks, formatBankingStatus, isLoading, actions } = useBankingWorkspace();
  const [isPrinting, setIsPrinting] = useState(false);

  const checkId = Number(id);
  const check = checks.find((c) => c.id === checkId);
  const account = check ? accounts.find((a) => a.id === check.bankAccountId) : null;

  if (isPrinting && check) {
    return (
      <CheckPrintView
        check={check}
        account={account}
        onBack={() => setIsPrinting(false)}
        onMarkPrinted={(checkId) => {
          actions.printCheck(checkId);
        }}
      />
    );
  }

  if (isLoading && !check) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!check) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Check not found.</Alert>
        <Button
          component={RouterLink}
          href={paths.dashboard.accountingFinance.banking.checkManagement}
          startIcon={<Iconify icon="solar:arrow-left-bold" />}
          sx={{ mt: 2 }}
        >
          Back to Check Management
        </Button>
      </Box>
    );
  }

  const isException = ['bounced', 'voided'].includes(check.status);
  const timelineStep = STATUS_TIMELINE.indexOf(check.status);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton
            component={RouterLink}
            href={paths.dashboard.accountingFinance.banking.checkManagement}
          >
            <Iconify icon="solar:arrow-left-bold" />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={800}>
              {check.checkNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Payable to {check.payee} • {account?.name || 'Unknown account'}
            </Typography>
          </Box>
          <Chip label={formatBankingStatus(check.status)} color={STATUS_COLORS[check.status]} />
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:printer-bold" />}
            onClick={() => setIsPrinting(true)}
          >
            {check.printStatus === 'printed' ? 'Reprint' : 'Print'}
          </Button>
          <Button
            component={RouterLink}
            href={paths.dashboard.accountingFinance.banking.checkManagement}
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:arrow-left-bold" />}
          >
            Back
          </Button>
        </Stack>
      </Stack>

      {isException && (
        <Alert
          severity={check.status === 'bounced' ? 'error' : 'warning'}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {check.status === 'bounced'
            ? `This check has bounced and requires follow-up — reissue or void it.`
            : `This check has been voided and is no longer active.`}
        </Alert>
      )}

      {/* Amount highlight */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="caption" color="text.secondary">
                Check Amount
              </Typography>
              <Typography variant="h3" fontWeight={800} sx={{ mt: 0.5 }}>
                {formatCurrency(check.amount)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="caption" color="text.secondary">
                Issue Date
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
                {new Date(check.issueDate).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Due {new Date(check.dueDate).toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="caption" color="text.secondary">
                Print Status
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                <Chip
                  label={
                    check.printStatus === 'printed'
                      ? `Printed ×${check.printCount}`
                      : 'Pending print'
                  }
                  color={check.printStatus === 'printed' ? 'success' : 'default'}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Last action {new Date(check.lastActionAt).toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Details */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                Check Details
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <DetailRow label="Check Number" value={check.checkNumber} />
                    <DetailRow label="Payee" value={check.payee} />
                    <DetailRow label="Bank Account" value={account?.name} />
                    <DetailRow label="Bank Name" value={check.bankName} />
                    <DetailRow label="Account Number" value={account?.maskedNumber} />
                    <DetailRow label="Amount" value={formatCurrency(check.amount)} />
                    <DetailRow
                      label="Issue Date"
                      value={new Date(check.issueDate).toLocaleDateString()}
                    />
                    <DetailRow
                      label="Due Date"
                      value={new Date(check.dueDate).toLocaleDateString()}
                    />
                    <DetailRow label="Status" value={formatBankingStatus(check.status)} />
                    <DetailRow label="Treasury Owner" value={check.owner} />
                    <DetailRow label="Payment Reference" value={check.paymentReference} />
                    <DetailRow label="Memo / Purpose" value={check.memo} />
                    <DetailRow label="Print Status" value={check.printStatus} />
                    <DetailRow label="Print Count" value={check.printCount} />
                    <DetailRow
                      label="Last Action"
                      value={new Date(check.lastActionAt).toLocaleString()}
                    />
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Status lifecycle */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                Lifecycle Status
              </Typography>
              <Stack spacing={2}>
                {['prepared', 'issued', 'cleared'].map((step, index) => {
                  const isPast = timelineStep > index;
                  const isCurrent = timelineStep === index;

                  return (
                    <Stack key={step} direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor:
                            isPast || isCurrent
                              ? check.status === 'bounced' && isCurrent
                                ? 'error.main'
                                : 'primary.main'
                              : 'action.disabledBackground',
                          color: isPast || isCurrent ? 'primary.contrastText' : 'text.disabled',
                          flexShrink: 0,
                        }}
                      >
                        {isPast ? (
                          <Iconify icon="solar:check-circle-bold" width={20} />
                        ) : (
                          <Typography variant="caption" fontWeight={700}>
                            {index + 1}
                          </Typography>
                        )}
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{ textTransform: 'capitalize' }}
                        >
                          {step}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {step === 'prepared' && 'Check instrument created and ready for printing'}
                          {step === 'issued' && 'Check handed to payee or posted to mail'}
                          {step === 'cleared' && 'Bank confirmed funds have been debited'}
                        </Typography>
                      </Box>
                      {isCurrent && !isException && (
                        <Chip label="Current" size="small" color="primary" sx={{ ml: 'auto' }} />
                      )}
                    </Stack>
                  );
                })}
                {isException && (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: check.status === 'bounced' ? 'error.main' : 'text.disabled',
                        color: 'white',
                        flexShrink: 0,
                      }}
                    >
                      <Iconify icon="solar:close-circle-bold" width={20} />
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ textTransform: 'capitalize' }}
                      >
                        {check.status}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {check.status === 'bounced' && 'Check returned unpaid — follow-up required'}
                        {check.status === 'voided' &&
                          'Check cancelled and removed from circulation'}
                      </Typography>
                    </Box>
                    <Chip
                      label="Current"
                      size="small"
                      color={check.status === 'bounced' ? 'error' : 'default'}
                      sx={{ ml: 'auto' }}
                    />
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>

          {account && (
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6" fontWeight={800}>
                    Issuing Account
                  </Typography>
                  <IconButton
                    size="small"
                    component={RouterLink}
                    href={paths.dashboard.accountingFinance.banking.bankAccountDetail(account.id)}
                  >
                    <Iconify icon="solar:eye-bold" width={16} />
                  </IconButton>
                </Stack>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Account</Typography>
                    <Typography variant="body2" fontWeight={600}>{account.name}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Balance</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(account.balance, account.currency)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Available</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(account.availableBalance, account.currency)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}