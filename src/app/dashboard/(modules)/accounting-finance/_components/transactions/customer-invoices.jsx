'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import AlertTitle from '@mui/material/AlertTitle';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import StatusActionMenu from '../shared/status-action-menu';
import { useCustomerInvoicesApi } from './use-customer-invoices-api';
import { useTransactionStatusApi } from '../shared/use-transaction-status-api';
import {
  formatStatusLabel,
  STATUS_CHIP_COLORS,
  getStatusActionMeta,
  buildNextStatusTransitions,
} from '../shared/status-workflow';

const INVOICE_STATUS_SEQUENCE = ['draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled'];

const DUNNING_COLORS = {
  none: 'default',
  stage_1: 'info',
  stage_2: 'warning',
  stage_3: 'error',
};

function formatStageLabel(value) {
  return value.replace(/_/g, ' ');
}

export default function CustomerInvoices() {
  const { invoices, customers, getCustomerById, isLoading, actions } = useCustomerInvoicesApi();
  const invoicesUrl = `${endpoints.accounting.customer_invoices}?ordering=-created_at,-id`;
  const { transitionStatus, loadingKey } = useTransactionStatusApi({
    statusEndpoint: (id) => `${endpoints.accounting.customer_invoice_by_id(id)}status/`,
    mutateKeys: [invoicesUrl],
  });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dunningStage, setDunningStage] = useState('all');
  const [customerId, setCustomerId] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredInvoices = useMemo(
    () =>
      invoices.filter((invoice) => {
        const customer = getCustomerById(invoice.customer_id);
        const haystack = `${invoice.number} ${customer?.name || ''}`.toLowerCase();
        if (search && !haystack.includes(search.toLowerCase())) return false;
        if (status !== 'all' && invoice.status !== status) return false;
        if (dunningStage !== 'all' && invoice.dunningStage !== dunningStage) return false;
        if (customerId !== 'all' && invoice.customer_id !== customerId) return false;
        return true;
      }),
    [customerId, dunningStage, invoices, search, status]
  );

  const overdueCount = invoices.filter((invoice) => invoice.status === 'overdue').length;
  const recurringCount = invoices.filter((invoice) => invoice.recurring).length;
  const creditWarningCount = invoices.filter((invoice) => invoice.creditWarning).length;
  const openExposure = invoices.reduce((sum, invoice) => sum + Number(invoice.balance_due || 0), 0);

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Customer Invoices
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Receivables workspace with dunning visibility, customer risk checks, recurring billing,
            and open balance control.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
          <Button
            component={Link}
            href={paths.dashboard.accountingFinance.transactions.customerReceipts}
            variant="outlined"
            startIcon={<Iconify icon="solar:wallet-money-bold" />}
          >
            Open receipts
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() =>
              window.open('/accounting-finance/transactions/customer-invoices/new', '_blank')
            }
          >
            Create Invoice
          </Button>
        </Stack>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        <AlertTitle>Collections workflow active</AlertTitle>
        Dunning stage, promise-to-pay, recurring templates, and credit-warning tracking are live
        from the backend transaction records.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: 'Overdue invoices',
            value: overdueCount,
            icon: 'solar:danger-circle-bold-duotone',
            color: '#dc2626',
          },
          {
            label: 'Recurring invoices',
            value: recurringCount,
            icon: 'solar:restart-bold-duotone',
            color: '#8b5cf6',
          },
          {
            label: 'Credit warnings',
            value: creditWarningCount,
            icon: 'solar:shield-warning-bold-duotone',
            color: '#f59e0b',
          },
          {
            label: 'Open exposure',
            value: formatCurrency(openExposure),
            icon: 'solar:wallet-money-bold-duotone',
            color: '#16a34a',
          },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {card.label}
                    </Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color }}>
                    <Iconify icon={card.icon} width={28} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
            <TextField
              size="small"
              placeholder="Search invoice number or customer"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ flex: 1, minWidth: 220 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:magnifer-linear" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All status</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="sent">Sent</MenuItem>
              <MenuItem value="partial">Partial</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              value={dunningStage}
              onChange={(event) => setDunningStage(event.target.value)}
              sx={{ minWidth: 170 }}
            >
              <MenuItem value="all">All dunning</MenuItem>
              <MenuItem value="none">No dunning</MenuItem>
              <MenuItem value="stage_1">Stage 1</MenuItem>
              <MenuItem value="stage_2">Stage 2</MenuItem>
              <MenuItem value="stage_3">Stage 3</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="all">All customers</MenuItem>
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Dunning</TableCell>
                <TableCell>Promise</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Due</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices.map((invoice) => {
                const customer = getCustomerById(invoice.customer_id);

                return (
                  <TableRow key={invoice.id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{ fontFamily: 'monospace' }}
                        >
                          {invoice.number}
                        </Typography>
                        {invoice.recurring && (
                          <Chip
                            label={invoice.recurringLabel || 'Recurring'}
                            size="small"
                            variant="outlined"
                            sx={{ width: 'fit-content' }}
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {customer?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Risk {customer?.risk || 'n/a'} Â· Terms {invoice.paymentTerms}
                      </Typography>
                    </TableCell>
                    <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={formatStageLabel(invoice.dunningStage)}
                        size="small"
                        color={DUNNING_COLORS[invoice.dunningStage]}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      {invoice.promiseToPay
                        ? new Date(invoice.promiseToPay).toLocaleDateString()
                        : 'No promise'}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(invoice.total)}</TableCell>
                    <TableCell align="right">
                      <Stack alignItems="flex-end" spacing={0.25}>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color={invoice.balance_due > 0 ? 'error.main' : 'success.main'}
                        >
                          {formatCurrency(invoice.balance_due)}
                        </Typography>
                        {invoice.creditWarning && (
                          <Chip
                            label="Credit warning"
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.status_display || formatStatusLabel(invoice.status)}
                        size="small"
                        color={STATUS_CHIP_COLORS[invoice.status] || 'default'}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                        alignItems="center"
                      >
                        <Tooltip title="Delete invoice">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteTarget(invoice)}
                            disabled={invoice.status === 'paid' || invoice.status === 'cancelled'}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                          </IconButton>
                        </Tooltip>
                        <Button
                          component={Link}
                          href={paths.dashboard.accountingFinance.transactions.invoiceDetail(
                            invoice.id
                          )}
                          size="small"
                        >
                          Open
                        </Button>
                        <StatusActionMenu
                          currentStatus={invoice.status}
                          loading={loadingKey?.startsWith(`${invoice.id}:`)}
                          transitions={buildNextStatusTransitions(
                            invoice.status,
                            INVOICE_STATUS_SEQUENCE
                          ).map((nextStatus) => ({
                            status: nextStatus,
                            ...getStatusActionMeta(nextStatus),
                          }))}
                          onTransition={async (nextStatus) => {
                            try {
                              await transitionStatus({ id: invoice.id, status: nextStatus });
                              toast.success(
                                `Invoice status changed to ${formatStatusLabel(nextStatus)}`
                              );
                            } catch (error) {
                              toast.error(
                                error?.response?.data?.error ||
                                  error?.message ||
                                  'Failed to update status'
                              );
                            }
                          }}
                        />
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Invoice?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete invoice <strong>{deleteTarget?.number}</strong>? This
            action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (!deleteTarget) return;
              try {
                await actions.deleteInvoice(deleteTarget.id);
              } catch (err) {
                console.error(err);
              } finally {
                setDeleteTarget(null);
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
