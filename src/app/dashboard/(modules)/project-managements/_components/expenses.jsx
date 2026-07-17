'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import { alpha, useTheme } from '@mui/material/styles';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import {
  useProjectManagementExpenses,
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
    py: 0.7,
    borderRadius: 999,
    fontWeight: 800,
    textTransform: 'none',
    whiteSpace: 'nowrap',
    lineHeight: 1,
    boxShadow:
      variant === 'contained' ? `0 10px 20px ${alpha(theme.palette.primary.main, 0.18)}` : 'none',
    borderWidth: 1,
    '&:hover': {
      borderWidth: 1,
      transform: 'translateY(-1px)',
      boxShadow:
        variant === 'contained'
          ? `0 14px 26px ${alpha(theme.palette.primary.main, 0.24)}`
          : `0 10px 22px ${alpha(theme.palette.grey[900], 0.08)}`,
    },
    '& .MuiButton-startIcon': {
      mr: 0.6,
    },
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

export default function Expenses() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { expenses, overview, isLoading, error } = useProjectManagementExpenses();
  const [transitioningId, setTransitioningId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const projectFilter = searchParams.get('project') || 'all';

  const projectOptions = useMemo(() => {
    const groupedProjects = new Map();

    expenses.forEach((expense) => {
      const projectKey = String(expense.projectId || expense.projectTitle || 'unknown');

      if (!groupedProjects.has(projectKey)) {
        groupedProjects.set(projectKey, {
          key: projectKey,
          id: expense.projectId,
          title: expense.projectTitle,
          count: 0,
        });
      }

      groupedProjects.get(projectKey).count += 1;
    });

    return Array.from(groupedProjects.values())
      .filter((option) => option.title)
      .sort((left, right) => left.title.localeCompare(right.title));
  }, [expenses]);

  const selectedProject = useMemo(
    () => projectOptions.find((project) => project.key === String(projectFilter)),
    [projectFilter, projectOptions]
  );

  const filteredExpenses = useMemo(
    () =>
      expenses.filter((expense) => {
        const matchesProject =
          projectFilter === 'all' ||
          String(expense.projectId || expense.projectTitle || 'unknown') === String(projectFilter);

        return matchesProject;
      }),
    [expenses, projectFilter]
  );

  const filteredTotal = useMemo(
    () => filteredExpenses.reduce((sum, expense) => sum + Number(expense.totalAmount || 0), 0),
    [filteredExpenses]
  );
  const isFocusedSheetView = projectFilter !== 'all';

  function updateProjectFilter(nextProject) {
    const params = new URLSearchParams(searchParams.toString());

    if (!nextProject || nextProject === 'all') params.delete('project');
    else params.set('project', nextProject);

    const nextQuery = params.toString();
    router.push(
      nextQuery
        ? `${paths.dashboard.projectManagements.expenses.root}?${nextQuery}`
        : paths.dashboard.projectManagements.expenses.root
    );
  }

  async function handleStatusAction(expense, nextStatus) {
    setTransitioningId(expense.id);
    try {
      await transitionProjectManagementExpense(expense.id, nextStatus);
      toast.success(`Expense moved to ${nextStatus}.`);
    } catch (transitionError) {
      toast.error(
        transitionError?.message || transitionError?.detail || 'Failed to update expense status.'
      );
    } finally {
      setTransitioningId(null);
    }
  }

  async function handleDownloadExpense(expenseId) {
    setDownloadingId(expenseId);
    try {
      await exportProjectManagementExpensePdf(expenseId);
      toast.success('Expense invoice PDF downloaded.');
    } catch (downloadError) {
      toast.error(downloadError?.message || 'Failed to download expense invoice PDF.');
    } finally {
      setDownloadingId(null);
    }
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
                  label={`${overview.total} Expenses`}
                  sx={{ bgcolor: alpha('#ffffff', 0.16), color: 'common.white' }}
                />
                <Chip
                  size="small"
                  label={`${overview.draft} Draft`}
                  sx={{ bgcolor: alpha('#ffffff', 0.16), color: 'common.white' }}
                />
                <Chip
                  size="small"
                  label={`${overview.submitted} Submitted`}
                  sx={{ bgcolor: alpha('#ffffff', 0.16), color: 'common.white' }}
                />
                <Chip
                  size="small"
                  label={`${overview.approved} Approved`}
                  sx={{ bgcolor: alpha('#ffffff', 0.16), color: 'common.white' }}
                />
                <Chip
                  size="small"
                  label={`${overview.paid} Paid`}
                  sx={{ bgcolor: alpha('#ffffff', 0.16), color: 'common.white' }}
                />
              </Stack>
              <Typography variant="h4" fontWeight={800}>
                Expense Management
              </Typography>
              <Typography
                variant="body1"
                sx={{ mt: 1.1, maxWidth: 860, color: alpha('#ffffff', 0.84) }}
              >
                Invoice-style expense register with direct approval actions, PDF invoice downloads,
                and a cleaner project ledger view.
              </Typography>
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.25}
              alignItems={{ xs: 'stretch', lg: 'flex-start' }}
            >
              <Button
                component={RouterLink}
                href={paths.dashboard.projectManagements.expenses.create}
                variant="contained"
                startIcon={<Iconify icon="solar:add-square-bold" />}
                sx={{
                  bgcolor: 'common.white',
                  color: 'primary.main',
                  fontWeight: 800,
                  borderRadius: 2.5,
                }}
              >
                Create Expense
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Unable to load expenses right now.
        </Alert>
      ) : null}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Expenses', value: overview.total, icon: 'solar:bill-list-bold-duotone' },
          { label: 'Draft', value: overview.draft, icon: 'solar:document-text-bold-duotone' },
          {
            label: 'Submitted',
            value: overview.submitted,
            icon: 'solar:clipboard-check-bold-duotone',
          },
          {
            label: 'Approved',
            value: overview.approved,
            icon: 'solar:verified-check-bold-duotone',
          },
          { label: 'Paid', value: overview.paid, icon: 'solar:wallet-money-bold-duotone' },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, lg: 4, xl: 2.4 }}>
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
                    <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
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

      <Card
        sx={{
          borderRadius: 3.5,
          mb: 3,
          border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
          boxShadow: 'none',
          background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
        }}
      >
        <CardContent>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={2}
            >
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  Projects
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click a project to view only its expense list.
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                clickable
                label={`All Projects (${expenses.length})`}
                color={projectFilter === 'all' ? 'primary' : 'default'}
                variant={projectFilter === 'all' ? 'filled' : 'outlined'}
                onClick={() => updateProjectFilter('all')}
              />
              {projectOptions.map((project) => {
                const isSelected = project.key === String(projectFilter);

                return (
                  <Chip
                    key={project.key}
                    clickable
                    label={`${project.title} (${project.count})`}
                    color={isSelected ? 'primary' : 'default'}
                    variant={isSelected ? 'filled' : 'outlined'}
                    onClick={() => updateProjectFilter(project.key)}
                  />
                );
              })}
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label={`Showing ${filteredExpenses.length} of ${expenses.length} expenses`}
                color="primary"
                variant="outlined"
              />
              {selectedProject ? <Chip label={`Project: ${selectedProject.title}`} /> : null}
              <Chip label={`Filtered total: ${formatCurrency(filteredTotal || 0, 'BDT')}`} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: isFocusedSheetView
            ? `1px solid ${alpha(theme.palette.primary.main, 0.18)}`
            : 'none',
          boxShadow: isFocusedSheetView
            ? `0 18px 34px ${alpha(theme.palette.primary.main, 0.08)}`
            : undefined,
        }}
      >
        {isFocusedSheetView ? (
          <Box
            sx={{
              px: 2.25,
              py: 1.4,
              borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              spacing={1.5}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight={800}>
                  Focused Expense Sheet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Showing expenses for {selectedProject?.title || 'the selected project'}.
                </Typography>
              </Box>
              {selectedProject ? (
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={selectedProject.title}
                />
              ) : null}
            </Stack>
          </Box>
        ) : null}

        {isLoading ? (
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            justifyContent="center"
            sx={{ py: 8 }}
          >
            <CircularProgress size={22} />
            <Typography variant="body2" color="text.secondary">
              Loading expense ledger...
            </Typography>
          </Stack>
        ) : (
          <TableContainer>
            <Table
              stickyHeader
              sx={{
                minWidth: 1300,
                '& .MuiTableCell-root': {
                  borderColor: isFocusedSheetView
                    ? alpha(theme.palette.primary.main, 0.18)
                    : alpha(theme.palette.grey[500], 0.18),
                  verticalAlign: 'top',
                },
                '& .MuiTableHead-root .MuiTableCell-root': {
                  bgcolor: isFocusedSheetView
                    ? alpha(theme.palette.primary.main, 0.12)
                    : alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <TableHead>
                <TableRow>
                  {[
                    'Invoice',
                    'Expense',
                    'Vendor / Task',
                    'Timeline',
                    'Amount',
                    'Status',
                    'Action',
                  ].map((label) => (
                    <TableCell
                      key={label}
                      sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}
                      align={label === 'Action' ? 'right' : 'left'}
                    >
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExpenses.map((expense) => {
                  const workflowActions = getExpenseWorkflowActions(expense);

                  return (
                    <TableRow
                      key={expense.id}
                      hover
                      onClick={() =>
                        router.push(paths.dashboard.projectManagements.expenses.detail(expense.id))
                      }
                      sx={{
                        cursor: 'pointer',
                        '&:nth-of-type(odd)': {
                          bgcolor: isFocusedSheetView
                            ? alpha(theme.palette.primary.main, 0.025)
                            : alpha(theme.palette.secondary.main, 0.035),
                        },
                        '&:hover': {
                          bgcolor: alpha(
                            theme.palette.primary.main,
                            isFocusedSheetView ? 0.08 : 0.05
                          ),
                        },
                      }}
                    >
                      <TableCell sx={{ minWidth: 180 }}>
                        <Stack spacing={0.8}>
                          <Typography variant="subtitle2" fontWeight={800}>
                            {expense.invoiceNumber}
                          </Typography>
                          <Chip
                            size="small"
                            color="primary"
                            variant="outlined"
                            label={expense.currency}
                            sx={{ width: 'fit-content' }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Line items: {expense.items.length}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ minWidth: 300 }}>
                        <Stack spacing={1}>
                          <Typography variant="body2" fontWeight={800}>
                            {expense.title}
                          </Typography>
                          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                            <Chip size="small" label={expense.projectTitle} variant="outlined" />
                            {expense.planTitle ? (
                              <Chip size="small" label={expense.planTitle} variant="outlined" />
                            ) : null}
                          </Stack>
                          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440 }}>
                            {expense.description || 'No description provided yet.'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ minWidth: 220 }}>
                        <Stack spacing={0.75}>
                          <Typography variant="body2" fontWeight={700}>
                            {expense.vendorName || 'No vendor selected'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Task: {expense.planTitle || 'No linked task'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Created by: {expense.createdBy?.username || 'System'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ minWidth: 220 }}>
                        <Stack spacing={0.75}>
                          <Typography variant="body2" fontWeight={600}>
                            Expense date: {formatDate(expense.expenseDate)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Created: {formatDate(expense.createdAt)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Submitted: {formatDate(expense.submittedAt)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Approved: {formatDate(expense.approvedAt)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ minWidth: 170 }}>
                        <Stack spacing={0.75}>
                          <Typography variant="h6" fontWeight={800}>
                            {formatCurrency(expense.totalAmount, expense.currency)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Updated: {formatDate(expense.updatedAt)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        <Stack spacing={1}>
                          <Chip
                            size="small"
                            label={expense.status}
                            color={STATUS_COLOR[expense.status] || 'default'}
                            sx={{ width: 'fit-content' }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {expense.status === 'Draft' && 'Ready to submit for approval.'}
                            {expense.status === 'Submitted' && 'Awaiting finance approval.'}
                            {expense.status === 'Approved' && 'Approved and ready for payment.'}
                            {expense.status === 'Paid' && 'Payment completed.'}
                            {expense.status === 'Rejected' && 'Needs review before resubmission.'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ minWidth: 340 }}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1}
                          justifyContent="flex-end"
                          alignItems={{ xs: 'stretch', sm: 'center' }}
                          useFlexGap
                          flexWrap="wrap"
                        >
                          <Button
                            component={RouterLink}
                            href={paths.dashboard.projectManagements.expenses.detail(expense.id)}
                            size="small"
                            variant="contained"
                            startIcon={<Iconify icon="solar:eye-bold" width={16} />}
                            sx={{
                              ...getExpenseActionButtonSx(theme, 'contained'),
                              background: `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, ${theme.palette.grey[800]} 100%)`,
                              color: 'common.white',
                            }}
                          >
                            Details
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="inherit"
                            startIcon={<Iconify icon="solar:file-download-bold" width={16} />}
                            onClick={() => handleDownloadExpense(expense.id)}
                            disabled={downloadingId === expense.id}
                            sx={{
                              ...getExpenseActionButtonSx(theme, 'outlined'),
                              borderColor: alpha(theme.palette.grey[500], 0.28),
                              bgcolor: alpha(theme.palette.background.paper, 0.9),
                            }}
                          >
                            {downloadingId === expense.id ? 'Preparing...' : 'Invoice PDF'}
                          </Button>
                          {workflowActions.map((action) => (
                            <Button
                              key={`${expense.id}-${action.key}`}
                              size="small"
                              variant={action.variant}
                              color={action.color}
                              startIcon={<Iconify icon={action.icon} width={16} />}
                              disabled={transitioningId === expense.id}
                              onClick={() => handleStatusAction(expense, action.nextStatus)}
                              sx={getExpenseActionButtonSx(theme, action.variant)}
                            >
                              {transitioningId === expense.id && action.variant === 'contained'
                                ? 'Working...'
                                : action.label}
                            </Button>
                          ))}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {!filteredExpenses.length ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Stack alignItems="center" spacing={1.2} sx={{ py: 6 }}>
                        <Iconify icon="solar:bill-list-bold-duotone" width={30} />
                        <Typography variant="subtitle1" fontWeight={700}>
                          No expenses found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Try adjusting the filters or create a new project expense.
                        </Typography>
                        <Button
                          component={RouterLink}
                          href={paths.dashboard.projectManagements.expenses.create}
                          variant="contained"
                        >
                          Create Expense
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
}
