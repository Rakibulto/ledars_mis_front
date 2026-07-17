'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import { Button } from '@mui/material';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import CheckPrintView from './check-print-view';
import { useCurrency } from '../currency-context';
import { useBankingWorkspace } from './use-banking-workspace';
import { BankingWorkspaceToolbar } from './banking-workspace-toolbar';

const STATUS_COLORS = {
  prepared: 'warning',
  issued: 'info',
  cleared: 'success',
  bounced: 'error',
  voided: 'default',
};

const EMPTY_CHECK = {
  issueDate: '2026-03-29',
  dueDate: '2026-03-30',
  payee: '',
  bankAccountId: 1,
  amount: '',
  memo: '',
  owner: '',
  paymentReference: '',
};

const chequeStyles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, fontFamily: 'Helvetica' },
  row: { flexDirection: 'row', marginBottom: 6 },
  label: { width: 120, fontWeight: 'bold' },
  value: { flex: 1 },
  title: { fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  box: { border: '1 solid #000', padding: 12, borderRadius: 4 },
});

// const handlePrintCheck = async (check) => {
//   try {
//     const blob = await pdf(<CheckPrintPDF check={check} account={accounts.find((a) => a.id === check.bankAccountId)} />).toBlob();
//     const url = URL.createObjectURL(blob);

//     const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
//     if (!win) {
//       toast.error('Popup blocked');
//       URL.revokeObjectURL(url);
//       return;
//     }

//     win.document.write(`
//       <html>
//         <head>
//           <title>Print Check ${check.checkNumber}</title>
//           <style>
//             html, body { margin: 0; height: 100%; }
//             iframe { border: 0; width: 100%; height: 100vh; }
//           </style>
//         </head>
//         <body>
//           <iframe src="${url}"></iframe>
//         </body>
//       </html>
//     `);
//     win.document.close();

//     win.onafterprint = () => {
//       actions.printCheck(check.id);
//       URL.revokeObjectURL(url);
//     };

//     setTimeout(() => {
//       win.focus();
//       win.print();
//     }, 300);
//   } catch {
//     toast.error('Failed to print check');
//   }
// };

function CheckPrintPDF({ check, account }) {
  return (
    <Document>
      <Page size="A4" style={chequeStyles.page}>
        <View style={chequeStyles.box}>
          <Text style={chequeStyles.title}>Cheque Print</Text>

          <View style={chequeStyles.row}>
            <Text style={chequeStyles.label}>Check #</Text>
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
            <Text style={chequeStyles.label}>Issue Date</Text>
            <Text style={chequeStyles.value}>{check.issueDate}</Text>
          </View>

          <View style={chequeStyles.row}>
            <Text style={chequeStyles.label}>Due Date</Text>
            <Text style={chequeStyles.value}>{check.dueDate}</Text>
          </View>

          <View style={chequeStyles.row}>
            <Text style={chequeStyles.label}>Memo</Text>
            <Text style={chequeStyles.value}>{check.memo || '—'}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default function CheckManagement() {
  const { formatAmount } = useCurrency();
  const { accounts, checks, formatBankingStatus, actions } = useBankingWorkspace();
  const [activePrintCheck, setActivePrintCheck] = useState(null);
  const [status, setStatus] = useState('all');
  const [bankFilter, setBankFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftCheck, setDraftCheck] = useState(EMPTY_CHECK);

  const filtered = useMemo(
    () =>
      checks.filter((check) => {
        const statusPass = status === 'all' ? true : check.status === status;
        const bankPass = bankFilter === 'all' ? true : check.bankAccountId === Number(bankFilter);
        return statusPass && bankPass;
      }),
    [bankFilter, checks, status]
  );

  const outstandingChecks = checks.filter((check) =>
    ['prepared', 'issued', 'bounced'].includes(check.status)
  );
  const issuedValue = outstandingChecks.reduce((sum, check) => sum + Number(check.amount || 0), 0);
  const exceptionCount = checks.filter((check) =>
    ['bounced', 'voided'].includes(check.status)
  ).length;
  const printedCount = checks.filter((check) => check.printStatus === 'printed').length;

  const createCheck = () => {
    actions.createCheck(draftCheck);
    toast.success('Check instrument created');
    setDialogOpen(false);
    setDraftCheck(EMPTY_CHECK);
  };

  const updateStatus = (checkId, nextStatus, message) => {
    actions.updateCheckStatus(checkId, nextStatus);
    toast.success(message);
  };

  const handlePrint = (checkId) => {
    actions.printCheck(checkId);
    toast.success('Check marked as printed');
  };

  if (activePrintCheck) {
    return (
      <CheckPrintView
        check={activePrintCheck}
        account={accounts.find((a) => a.id === activePrintCheck.bankAccountId)}
        onBack={() => setActivePrintCheck(null)}
        onMarkPrinted={(checkId) => {
          actions.printCheck(checkId);
        }}
      />
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <BankingWorkspaceToolbar
        printTitle="Check Management"
        printContent={
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                  Check #
                </th>
                <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                  Payee
                </th>
                <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                  Bank
                </th>
                <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                  Amount
                </th>
                <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                  Issue Date
                </th>
                <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                  Due Date
                </th>
                <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((check) => (
                <tr key={check.id}>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                    {check.checkNumber}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{check.payee}</td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{check.bankName}</td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                    {formatCurrency(check.amount)}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                    {check.issueDate}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{check.dueDate}</td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{check.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      />
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Check Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Control prepared, printed, issued, cleared, bounced, and voided checks with outstanding
            exposure tracking.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => setDialogOpen(true)}
        >
          Issue Check
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        Checks now move through preparation, printing, issuance, clearing, bouncing, and voiding,
        with exposure visible before liquidity is overstated.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Outstanding value
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {formatAmount(issuedValue)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                {outstandingChecks.length} checks reduce available cash
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Printed instruments
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {printedCount}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                {checks.length - printedCount} still waiting for check stock
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Exceptions
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {exceptionCount}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Bounced or voided items requiring follow-up
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    select
                    size="small"
                    label="Status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    fullWidth
                  >
                    <MenuItem value="all">All status</MenuItem>
                    <MenuItem value="prepared">Prepared</MenuItem>
                    <MenuItem value="issued">Issued</MenuItem>
                    <MenuItem value="cleared">Cleared</MenuItem>
                    <MenuItem value="bounced">Bounced</MenuItem>
                    <MenuItem value="voided">Voided</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    select
                    size="small"
                    label="Bank account"
                    value={bankFilter}
                    onChange={(event) => setBankFilter(event.target.value)}
                    fullWidth
                  >
                    <MenuItem value="all">All accounts</MenuItem>
                    {accounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Check #</TableCell>
                <TableCell>Issue / Due</TableCell>
                <TableCell>Payee</TableCell>
                <TableCell>Bank</TableCell>
                <TableCell>Memo</TableCell>
                <TableCell>Print</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((check) => (
                <TableRow key={check.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                      {check.checkNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {check.paymentReference || 'No payment reference'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(check.issueDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Due {new Date(check.dueDate).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {check.payee}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Owner {check.owner}
                    </Typography>
                  </TableCell>
                  <TableCell>{check.bankName}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{check.memo}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Last action {new Date(check.lastActionAt).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        check.printStatus === 'printed'
                          ? `Printed x${check.printCount}`
                          : 'Pending print'
                      }
                      size="small"
                      color={check.printStatus === 'printed' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">{formatAmount(check.amount)}</TableCell>
                  <TableCell>
                    <Chip
                      label={formatBankingStatus(check.status)}
                      size="small"
                      color={STATUS_COLORS[check.status]}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setActivePrintCheck(check)}
                      >
                        {check.printStatus === 'printed' ? 'Reprint' : 'Print'}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => updateStatus(check.id, 'issued', 'Check issued')}
                        disabled={check.status !== 'prepared'}
                      >
                        Issue
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => updateStatus(check.id, 'cleared', 'Check cleared')}
                        disabled={!['issued', 'bounced'].includes(check.status)}
                      >
                        Clear
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        onClick={() => updateStatus(check.id, 'bounced', 'Check marked as bounced')}
                        disabled={!['issued', 'prepared'].includes(check.status)}
                      >
                        Bounce
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        onClick={() => updateStatus(check.id, 'voided', 'Check voided')}
                        disabled={check.status === 'cleared' || check.status === 'voided'}
                      >
                        Void
                      </Button>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      component={RouterLink}
                      href={paths.dashboard.accountingFinance.banking.checkDetail(check.id)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Issue Check</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Issue date"
                  value={draftCheck.issueDate}
                  onChange={(event) =>
                    setDraftCheck((current) => ({ ...current, issueDate: event.target.value }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Due date"
                  value={draftCheck.dueDate}
                  onChange={(event) =>
                    setDraftCheck((current) => ({ ...current, dueDate: event.target.value }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Payee"
                  value={draftCheck.payee}
                  onChange={(event) =>
                    setDraftCheck((current) => ({ ...current, payee: event.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Bank account"
                  value={draftCheck.bankAccountId}
                  onChange={(event) =>
                    setDraftCheck((current) => ({
                      ...current,
                      bankAccountId: Number(event.target.value),
                    }))
                  }
                >
                  {accounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Amount"
                  value={draftCheck.amount}
                  onChange={(event) =>
                    setDraftCheck((current) => ({ ...current, amount: event.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Treasury owner"
                  value={draftCheck.owner}
                  onChange={(event) =>
                    setDraftCheck((current) => ({ ...current, owner: event.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Payment reference"
                  value={draftCheck.paymentReference}
                  onChange={(event) =>
                    setDraftCheck((current) => ({
                      ...current,
                      paymentReference: event.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Memo / purpose"
                  value={draftCheck.memo}
                  onChange={(event) =>
                    setDraftCheck((current) => ({ ...current, memo: event.target.value }))
                  }
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={createCheck}
            disabled={!draftCheck.payee || !draftCheck.owner || Number(draftCheck.amount) <= 0}
          >
            Create Check
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
