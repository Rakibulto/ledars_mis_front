'use client';

import { toast } from 'sonner';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import { alpha, useTheme } from '@mui/material/styles';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import {
  useProjectManagementExpense,
  updateProjectManagementExpense,
  exportProjectManagementExpensePdf,
  transitionProjectManagementExpense,
} from './use-project-managements-api';

const STATUS_COLOR = {
  Draft: 'default',
  Submitted: 'warning',
  Approved: 'primary',
  Paid: 'success',
  Rejected: 'error',
};

function formatCurrency(amount, currency = 'BDT') {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function formatDate(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString();
}

function getExpenseActionButtonSx(theme, variant = 'outlined') {
  return {
    minWidth: { xs: '100%', sm: 'auto' },
    px: 1.6,
    py: 0.75,
    borderRadius: 999,
    fontWeight: 800,
    textTransform: 'none',
    whiteSpace: 'nowrap',
    lineHeight: 1,
    boxShadow:
      variant === 'contained' ? `0 10px 20px ${alpha(theme.palette.primary.main, 0.18)}` : 'none',
  };
}

function getExpenseWorkflowActions(expense) {
  if (expense.status === 'Draft') {
    return [
      {
        key: 'submit',
        label: 'Submit',
        nextStatus: 'Submitted',
        color: 'primary',
        variant: 'contained',
        icon: 'solar:clipboard-check-bold',
      },
      {
        key: 'reject',
        label: 'Reject',
        nextStatus: 'Rejected',
        color: 'error',
        variant: 'outlined',
        icon: 'solar:close-circle-bold',
      },
    ];
  }

  if (expense.status === 'Submitted') {
    return [
      {
        key: 'approve',
        label: 'Approve',
        nextStatus: 'Approved',
        color: 'primary',
        variant: 'contained',
        icon: 'solar:verified-check-bold',
      },
      {
        key: 'return-draft',
        label: 'Return Draft',
        nextStatus: 'Draft',
        color: 'inherit',
        variant: 'outlined',
        icon: 'solar:restart-bold',
      },
      {
        key: 'reject',
        label: 'Reject',
        nextStatus: 'Rejected',
        color: 'error',
        variant: 'outlined',
        icon: 'solar:close-circle-bold',
      },
    ];
  }

  if (expense.status === 'Approved') {
    return [
      {
        key: 'mark-paid',
        label: 'Mark Paid',
        nextStatus: 'Paid',
        color: 'success',
        variant: 'contained',
        icon: 'solar:wallet-money-bold',
      },
      {
        key: 'reject',
        label: 'Reject',
        nextStatus: 'Rejected',
        color: 'error',
        variant: 'outlined',
        icon: 'solar:close-circle-bold',
      },
    ];
  }

  if (expense.status === 'Rejected') {
    return [
      {
        key: 'draft',
        label: 'Move to Draft',
        nextStatus: 'Draft',
        color: 'inherit',
        variant: 'outlined',
        icon: 'solar:restart-bold',
      },
      {
        key: 'resubmit',
        label: 'Resubmit',
        nextStatus: 'Submitted',
        color: 'primary',
        variant: 'contained',
        icon: 'solar:clipboard-check-bold',
      },
    ];
  }

  return [];
}

function DetailItem({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.45 }}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

export default function ExpenseDetail({ expenseId }) {
  const theme = useTheme();
  const { expense, isLoading, error } = useProjectManagementExpense(expenseId);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [savingDescription, setSavingDescription] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setDescriptionDraft(expense?.description || '');
  }, [expense?.description]);

  const workflowActions = useMemo(
    () => (expense ? getExpenseWorkflowActions(expense) : []),
    [expense]
  );

  async function handleStatusAction(nextStatus) {
    if (!expense?.id) return;

    setTransitioning(true);
    try {
      await transitionProjectManagementExpense(expense.id, nextStatus);
      toast.success(`Expense moved to ${nextStatus}.`);
    } catch (transitionError) {
      toast.error(
        transitionError?.message || transitionError?.detail || 'Failed to update expense status.'
      );
    } finally {
      setTransitioning(false);
    }
  }

  async function handleDownloadPdf() {
    if (!expense?.id) return;

    setDownloading(true);
    try {
      await exportProjectManagementExpensePdf(expense.id);
      toast.success('Expense invoice PDF downloaded.');
    } catch (downloadError) {
      toast.error(downloadError?.message || 'Failed to download expense invoice PDF.');
    } finally {
      setDownloading(false);
    }
  }

  async function handleSaveDescription() {
    if (!expense?.id) return;

    setSavingDescription(true);
    try {
      await updateProjectManagementExpense(expense.id, { description: descriptionDraft });
      toast.success('Expense description updated.');
    } catch (saveError) {
      toast.error(
        saveError?.message || saveError?.detail || 'Failed to update expense description.'
      );
    } finally {
      setSavingDescription(false);
    }
  }

  if (isLoading) {
    return (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Loading expense details...
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (error || !expense) {
    return <Alert severity="error">Unable to load the selected expense.</Alert>;
  }

  return (
    <Box>
      <Card
        sx={{
          mb: 3,
          borderRadius: 4,
          overflow: 'hidden',
          color: 'common.white',
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 58%, ${theme.palette.secondary.main} 100%)`,
          boxShadow: `0 22px 44px ${alpha(theme.palette.primary.main, 0.2)}`,
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            justifyContent="space-between"
            spacing={2.5}
          >
            <Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.25 }}>
                <Chip
                  size="small"
                  label={expense.invoiceNumber}
                  sx={{ bgcolor: alpha('#ffffff', 0.16), color: 'common.white' }}
                />
                <Chip
                  size="small"
                  label={expense.status}
                  sx={{ bgcolor: alpha('#ffffff', 0.16), color: 'common.white' }}
                />
                <Chip
                  size="small"
                  label={formatCurrency(expense.totalAmount, expense.currency)}
                  sx={{ bgcolor: alpha('#ffffff', 0.16), color: 'common.white' }}
                />
              </Stack>
              <Typography variant="h4" fontWeight={800}>
                {expense.title}
              </Typography>
              <Typography
                variant="body1"
                sx={{ mt: 1.1, maxWidth: 860, color: alpha('#ffffff', 0.84) }}
              >
                Detailed expense invoice view with bill lines, status timeline, and direct
                approval/payment actions.
              </Typography>
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.25}
              alignItems={{ xs: 'stretch', lg: 'flex-start' }}
            >
              <Button
                component={RouterLink}
                href={paths.dashboard.projectManagements.expenses.root}
                variant="outlined"
                startIcon={<Iconify icon="solar:arrow-left-bold" />}
                sx={{
                  borderColor: alpha('#ffffff', 0.35),
                  color: 'common.white',
                  borderRadius: 2.5,
                }}
              >
                Back to Expenses
              </Button>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:file-download-bold" />}
                onClick={handleDownloadPdf}
                disabled={downloading}
                sx={{
                  bgcolor: 'common.white',
                  color: 'primary.main',
                  fontWeight: 800,
                  borderRadius: 2.5,
                }}
              >
                {downloading ? 'Preparing...' : 'Download PDF'}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: 'Total Amount',
            value: formatCurrency(expense.totalAmount, expense.currency),
            icon: 'solar:wallet-money-bold-duotone',
          },
          {
            label: 'Bill Lines',
            value: expense.items.length,
            icon: 'solar:bill-list-bold-duotone',
          },
          {
            label: 'Expense Date',
            value: formatDate(expense.expenseDate),
            icon: 'solar:calendar-mark-bold-duotone',
          },
          {
            label: 'Current Status',
            value: expense.status,
            icon: 'solar:clipboard-check-bold-duotone',
          },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card
              sx={{
                borderRadius: 3.5,
                border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
                boxShadow: 'none',
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography variant="h6" fontWeight={800} sx={{ mt: 0.75 }}>
                      {item.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2.5,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Iconify icon={item.icon} width={26} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card
            sx={{
              borderRadius: 3.5,
              border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
              boxShadow: 'none',
              mb: 3,
            }}
          >
            <CardContent>
              <Stack spacing={2.5}>
                <Typography variant="h6" fontWeight={800}>
                  Expense Overview
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailItem label="Invoice Number" value={expense.invoiceNumber} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailItem label="Vendor / Payee" value={expense.vendorName || '—'} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailItem label="Project" value={expense.projectTitle} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailItem
                      label="Task / Roadmap step"
                      value={expense.planTitle || 'No linked task'}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailItem
                      label="Created By"
                      value={expense.createdBy?.username || 'System'}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailItem label="Approved By" value={expense.approvedBy?.username || '—'} />
                  </Grid>
                </Grid>

                <TextField
                  label="Description"
                  multiline
                  minRows={5}
                  value={descriptionDraft}
                  onChange={(event) => setDescriptionDraft(event.target.value)}
                  fullWidth
                />
                <Stack direction="row" justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={handleSaveDescription}
                    disabled={savingDescription}
                  >
                    {savingDescription ? 'Saving...' : 'Save Description'}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Card
            sx={{
              borderRadius: 3.5,
              border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
              boxShadow: 'none',
            }}
          >
            <CardContent>
              <Stack spacing={2.5}>
                <Typography variant="h6" fontWeight={800}>
                  Bill Lines
                </Typography>
                <TableContainer>
                  <Table sx={{ minWidth: 760 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell>Analytic / Notes</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {expense.items.map((item) => (
                        <TableRow key={item.id || item.sortOrder} hover>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {item.title}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {item.description || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.unitPrice, expense.currency)}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2" fontWeight={700}>
                              {formatCurrency(item.lineTotal, expense.currency)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} align="right">
                          <Typography variant="subtitle1" fontWeight={800}>
                            Total
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle1" fontWeight={800}>
                            {formatCurrency(expense.totalAmount, expense.currency)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card
            sx={{
              borderRadius: 3.5,
              border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
              boxShadow: 'none',
              mb: 3,
            }}
          >
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={800}>
                  Workflow Actions
                </Typography>
                <Chip
                  size="small"
                  label={expense.status}
                  color={STATUS_COLOR[expense.status] || 'default'}
                  sx={{ width: 'fit-content' }}
                />
                {workflowActions.length ? (
                  workflowActions.map((action) => (
                    <Button
                      key={action.key}
                      size="small"
                      variant={action.variant}
                      color={action.color}
                      startIcon={<Iconify icon={action.icon} width={16} />}
                      disabled={transitioning}
                      onClick={() => handleStatusAction(action.nextStatus)}
                      sx={getExpenseActionButtonSx(theme, action.variant)}
                    >
                      {transitioning && action.variant === 'contained'
                        ? 'Working...'
                        : action.label}
                    </Button>
                  ))
                ) : (
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    This expense has completed its workflow.
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Card
            sx={{
              borderRadius: 3.5,
              border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
              boxShadow: 'none',
            }}
          >
            <CardContent>
              <Stack spacing={1.75}>
                <Typography variant="h6" fontWeight={800}>
                  Status Timeline
                </Typography>
                <DetailItem label="Created" value={formatDate(expense.createdAt)} />
                <DetailItem label="Submitted" value={formatDate(expense.submittedAt)} />
                <DetailItem label="Approved" value={formatDate(expense.approvedAt)} />
                <DetailItem label="Paid" value={formatDate(expense.paidAt)} />
                <DetailItem label="Last Updated" value={formatDate(expense.updatedAt)} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
