'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

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
import { useCurrency } from '../currency-context';
import { useBankingWorkspace } from './use-banking-workspace';
import { BankingWorkspaceToolbar } from './banking-workspace-toolbar';

const EMPTY_TRANSFER = {
  requestedDate: '2026-03-29',
  scheduledDate: '2026-03-30',
  fromAccountId: 1,
  toAccountId: 3,
  amount: '',
  owner: '',
  approver: '',
  priority: 'normal',
  purpose: '',
};

const STATUS_COLORS = {
  pending_approval: 'warning',
  approved: 'info',
  in_transit: 'secondary',
  completed: 'success',
  cancelled: 'default',
};

export default function BankTransfers() {
  useCurrency();
  const { accounts, transfers, formatBankingStatus, actions } = useBankingWorkspace();

  const [status, setStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftTransfer, setDraftTransfer] = useState(EMPTY_TRANSFER);

  const filtered = useMemo(
    () => transfers.filter((transfer) => (status === 'all' ? true : transfer.status === status)),
    [status, transfers]
  );

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Reference
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Requested
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>From</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>To</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Amount
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((transfer) => (
          <tr key={transfer.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{transfer.reference}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {new Date(transfer.requestedDate).toLocaleDateString()}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {accounts.find((a) => a.id === transfer.fromAccountId)?.name}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {accounts.find((a) => a.id === transfer.toAccountId)?.name}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{transfer.amount}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{transfer.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const pendingApproval = transfers.filter((transfer) => transfer.status === 'pending_approval');
  const inTransitValue = transfers
    .filter((transfer) => transfer.status === 'in_transit')
    .reduce((sum, transfer) => sum + Number(transfer.amount || 0), 0);

  const getAccountName = (accountId) =>
    accounts.find((account) => account.id === accountId)?.name || 'Unknown account';

  const createTransfer = () => {
    actions.createTransfer(draftTransfer);
    setDialogOpen(false);
    setDraftTransfer(EMPTY_TRANSFER);
    toast.success('Transfer submitted for approval');
  };

  const advanceTransfer = (id, nextStatus, message) => {
    actions.advanceTransferStatus(id, nextStatus);
    toast.success(message);
  };

  return (
    <Box sx={{ p: 3 }}>
      <BankingWorkspaceToolbar printTitle="Bank Transfers" printContent={printContent} />
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Bank Transfers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Control internal treasury transfers with scheduling, ownership, and completion workflow.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:transfer-horizontal-bold" />}
          onClick={() => setDialogOpen(true)}
        >
          New Transfer
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        Transfers now move through approval, posting, in-transit, and completion states with
        traceability back to journal posting and treasury ownership.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Awaiting approval
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {pendingApproval.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Transfers queued for approver sign-off
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                In transit value
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {formatCurrency(inTransitValue)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Posted transfers not yet closed by treasury
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <TextField
                select
                size="small"
                label="Status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                fullWidth
              >
                <MenuItem value="all">All status</MenuItem>
                <MenuItem value="pending_approval">Pending approval</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="in_transit">In transit</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Transfer #</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Route</TableCell>
                <TableCell>Owner / Approver</TableCell>
                <TableCell>Traceability</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((transfer) => (
                <TableRow key={transfer.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                      {transfer.reference}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      Requested {new Date(transfer.requestedDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Scheduled {new Date(transfer.scheduledDate).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {getAccountName(transfer.fromAccountId)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      to {getAccountName(transfer.toAccountId)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{transfer.owner}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Approver {transfer.approver || 'Pending assignment'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{transfer.traceCode}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {transfer.journalEntry || 'Journal not posted yet'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(transfer.amount)}</TableCell>
                  <TableCell>
                    <Chip
                      label={formatBankingStatus(transfer.status)}
                      size="small"
                      color={STATUS_COLORS[transfer.status]}
                      sx={{ textTransform: 'capitalize' }}
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
                        disabled={transfer.status !== 'pending_approval'}
                        onClick={() =>
                          advanceTransfer(transfer.id, 'approved', 'Transfer approved')
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={transfer.status !== 'approved'}
                        onClick={() =>
                          advanceTransfer(
                            transfer.id,
                            'in_transit',
                            'Transfer posted and marked in transit'
                          )
                        }
                      >
                        Post
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={transfer.status !== 'in_transit'}
                        onClick={() =>
                          advanceTransfer(transfer.id, 'completed', 'Transfer completed')
                        }
                      >
                        Complete
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        disabled={['completed', 'cancelled'].includes(transfer.status)}
                        onClick={() =>
                          advanceTransfer(transfer.id, 'cancelled', 'Transfer cancelled')
                        }
                      >
                        Cancel
                      </Button>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      component={RouterLink}
                      href={paths.dashboard.accountingFinance.banking.transferDetail(transfer.id)}
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
        <DialogTitle>New Transfer</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Request date"
                  value={draftTransfer.requestedDate}
                  onChange={(event) =>
                    setDraftTransfer((current) => ({
                      ...current,
                      requestedDate: event.target.value,
                    }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Scheduled date"
                  value={draftTransfer.scheduledDate}
                  onChange={(event) =>
                    setDraftTransfer((current) => ({
                      ...current,
                      scheduledDate: event.target.value,
                    }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Transfer owner"
                  value={draftTransfer.owner}
                  onChange={(event) =>
                    setDraftTransfer((current) => ({ ...current, owner: event.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Approver"
                  value={draftTransfer.approver}
                  onChange={(event) =>
                    setDraftTransfer((current) => ({ ...current, approver: event.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="From account"
                  value={draftTransfer.fromAccountId}
                  onChange={(event) =>
                    setDraftTransfer((current) => ({
                      ...current,
                      fromAccountId: Number(event.target.value),
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
                  select
                  fullWidth
                  label="To account"
                  value={draftTransfer.toAccountId}
                  onChange={(event) =>
                    setDraftTransfer((current) => ({
                      ...current,
                      toAccountId: Number(event.target.value),
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
                  value={draftTransfer.amount}
                  onChange={(event) =>
                    setDraftTransfer((current) => ({ ...current, amount: event.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Priority"
                  value={draftTransfer.priority}
                  onChange={(event) =>
                    setDraftTransfer((current) => ({ ...current, priority: event.target.value }))
                  }
                >
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Purpose"
                  value={draftTransfer.purpose}
                  onChange={(event) =>
                    setDraftTransfer((current) => ({ ...current, purpose: event.target.value }))
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
            onClick={createTransfer}
            disabled={
              !draftTransfer.owner ||
              !draftTransfer.approver ||
              draftTransfer.fromAccountId === draftTransfer.toAccountId ||
              Number(draftTransfer.amount) <= 0
            }
          >
            Create Transfer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
