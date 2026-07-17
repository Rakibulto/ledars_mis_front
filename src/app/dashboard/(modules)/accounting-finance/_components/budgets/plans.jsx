'use client';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
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
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useBudgetsWorkspace } from './use-budgets-workspace';
import { BudgetsWorkspaceToolbar } from './budgets-workspace-toolbar';

const DEFAULT_CREATE_FORM = {
  name: '',
  department: '',
  fiscalYearId: '',
  costCenterId: '',
  totalAmount: 0,
  owner: 'Budget Controller',
  accountId: '',
  warningThreshold: 85,
  criticalThreshold: 95,
};

const DEFAULT_AMEND_FORM = {
  budgetId: '',
  targetLineId: '',
  amount: 0,
  reason: '',
  effectivePeriod: 'Apr 2026',
  requestedBy: 'Budget Controller',
};

function SummaryCard({ label, value, helper, icon, color }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              {helper}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}15`, color, width: 48, height: 48 }}>
            <Iconify icon={icon} width={24} />
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}

function BudgetPlans() {
  const workspace = useBudgetsWorkspace();
  const [selectedBudgetId, setSelectedBudgetId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [amendOpen, setAmendOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [createForm, setCreateForm] = useState(DEFAULT_CREATE_FORM);
  const [amendForm, setAmendForm] = useState(DEFAULT_AMEND_FORM);

  useEffect(() => {
    if (selectedBudgetId === null && workspace.budgets.length) {
      setSelectedBudgetId(workspace.budgets[0].id);
    }
  }, [selectedBudgetId, workspace.budgets]);

  // Reactively fill empty select fields when workspace data arrives after dialog opens
  useEffect(() => {
    if (!createOpen) return;
    setCreateForm((current) => ({
      ...current,
      fiscalYearId: current.fiscalYearId || workspace.fiscalYears[0]?.id || '',
      costCenterId: current.costCenterId || workspace.costCenters[0]?.id || '',
      accountId: current.accountId || workspace.accountOptions[0]?.id || '',
    }));
  }, [createOpen, workspace.fiscalYears, workspace.costCenters, workspace.accountOptions]);

  const selectedBudget =
    workspace.budgets.find((budget) => String(budget.id) === String(selectedBudgetId)) ||
    workspace.budgets[0] ||
    null;

  const runAction = async (label, action, successMessage) => {
    const loadingId = toast.loading(`${label}...`);
    setPendingAction(label);

    try {
      await action();
      toast.dismiss(loadingId);
      toast.success(successMessage);
    } catch (error) {
      toast.dismiss(loadingId);
      toast.error(error?.message || `${label} failed`);
    } finally {
      setPendingAction(null);
    }
  };

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Plan</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Version
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Budget
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Actual
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Commitments
          </th>
        </tr>
      </thead>
      <tbody>
        {workspace.budgets.map((b) => (
          <tr key={b.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{b.name}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {b.versions?.[0]?.label || 'v1'}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{b.totalAmount}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{b.spentAmount}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{b.commitments}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const submitCreate = () => {
    if (!createForm.name.trim()) {
      toast.error('Budget name is required');
      return Promise.resolve();
    }

    if (Number(createForm.totalAmount) <= 0) {
      toast.error('Total amount must be greater than zero');
      return Promise.resolve();
    }

    if (!createForm.fiscalYearId) {
      toast.error('Fiscal year is required');
      return Promise.resolve();
    }

    return runAction(
      'Create Budget Plan',
      async () => {
        const result = await workspace.actions.createBudgetPlan(createForm);
        if (result?.budgetId) {
          setSelectedBudgetId(result.budgetId);
        }
      },
      'Budget plan created'
    ).then(() => {
      setCreateOpen(false);
      setCreateForm(DEFAULT_CREATE_FORM);
    });
  };

  const openAmendment = (budget) => {
    setSelectedBudgetId(budget.id);
    setAmendForm({
      budgetId: budget.id,
      targetLineId: budget.lines[0]?.id || '',
      amount: 0,
      reason: '',
      effectivePeriod: 'Apr 2026',
      requestedBy: budget.owner,
    });
    setAmendOpen(true);
  };

  const submitAmendment = () => {
    if (!amendForm.targetLineId) {
      toast.error('Target line is required');
      return Promise.resolve();
    }

    if (Number(amendForm.amount) === 0) {
      toast.error('Amendment amount cannot be zero');
      return Promise.resolve();
    }

    if (!amendForm.reason.trim()) {
      toast.error('Amendment reason is required');
      return Promise.resolve();
    }

    return runAction(
      'Submit Budget Amendment',
      async () => workspace.actions.createBudgetAmendment(amendForm.budgetId, amendForm),
      'Budget amendment submitted'
    ).then(() => {
      setAmendOpen(false);
      setAmendForm(DEFAULT_AMEND_FORM);
    });
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Budget Plans
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage approved envelopes, amendments, version history, encumbrance exposure, and
            approval routing.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => {
            setCreateForm({
              ...DEFAULT_CREATE_FORM,
              fiscalYearId: workspace.fiscalYears[0]?.id || '',
              costCenterId: workspace.costCenters[0]?.id || '',
              accountId: workspace.accountOptions[0]?.id || '',
            });
            setCreateOpen(true);
          }}
        >
          Create Budget
        </Button>
      </Stack>

      <BudgetsWorkspaceToolbar printTitle="Budget Plans" printContent={printContent} />

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {workspace.alerts.map((alert) => (
          <Alert key={alert.id} severity={alert.severity} sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {alert.title}
            </Typography>
            {alert.description}
          </Alert>
        ))}
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Approved envelope"
            value={formatCurrency(workspace.overview.totalBudget)}
            helper="Current approved and draft planning envelope"
            icon="solar:wallet-money-bold-duotone"
            color="#2563eb"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Actuals booked"
            value={formatCurrency(workspace.overview.totalActual)}
            helper="Recognized spend in the current workspace"
            icon="solar:card-send-bold-duotone"
            color="#d97706"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Commitments + encumbrance"
            value={formatCurrency(
              workspace.overview.totalCommitments + workspace.overview.totalEncumbrance
            )}
            helper="Open purchasing and reserved allocations"
            icon="solar:safe-square-bold-duotone"
            color="#7c3aed"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Available"
            value={formatCurrency(workspace.overview.totalAvailable)}
            helper={`${workspace.overview.warningPlans} warning • ${workspace.overview.criticalPlans} critical`}
            icon="solar:shield-check-bold-duotone"
            color="#059669"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Card sx={{ borderRadius: 3 }}>
            {workspace.isLoading && workspace.budgets.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Budget Plan</TableCell>
                      <TableCell>Version</TableCell>
                      <TableCell align="right">Budget</TableCell>
                      <TableCell align="right">Actual</TableCell>
                      <TableCell align="right">Commitments</TableCell>
                      <TableCell align="right">Encumbrance</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {workspace.budgets.map((budget) => (
                      <TableRow
                        key={budget.id}
                        hover
                        selected={String(selectedBudget?.id) === String(budget.id)}
                        onClick={() => setSelectedBudgetId(budget.id)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Stack spacing={0.4}>
                            <Typography variant="body2" fontWeight={700}>
                              {budget.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {budget.department} • {budget.costCenterCode} • {budget.owner}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Chip
                              label={budget.versions[0]?.label || 'Version 1.0'}
                              size="small"
                              variant="outlined"
                            />
                            <Typography variant="caption" color="text.secondary">
                              {budget.versions[0]?.status || 'approved'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">{formatCurrency(budget.totalAmount)}</TableCell>
                        <TableCell align="right">{formatCurrency(budget.spentAmount)}</TableCell>
                        <TableCell align="right">{formatCurrency(budget.commitments)}</TableCell>
                        <TableCell align="right">{formatCurrency(budget.encumbrance)}</TableCell>
                        <TableCell>
                          <Chip
                            label={workspace.formatBudgetStatus(budget.status)}
                            size="small"
                            color={
                              budget.thresholdStatus === 'critical'
                                ? 'error'
                                : budget.thresholdStatus === 'warning'
                                  ? 'warning'
                                  : 'success'
                            }
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" justifyContent="flex-end" spacing={1}>
                            <Button
                              component={RouterLink}
                              href={paths.dashboard.accountingFinance.budgets.planDetail(budget.id)}
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={(event) => event.stopPropagation()}
                            >
                              View Details
                            </Button>
                            <Button
                              component={RouterLink}
                              href={`${paths.dashboard.accountingFinance.budgets.lines}?budget=${budget.id}`}
                              size="small"
                              variant="outlined"
                              color="inherit"
                            >
                              Lines
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="inherit"
                              onClick={(event) => {
                                event.stopPropagation();
                                openAmendment(budget);
                              }}
                            >
                              Amend
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={(event) => {
                                event.stopPropagation();
                                runAction(
                                  'Approve Budget Plan',
                                  async () => workspace.actions.approveBudgetPlan(budget.id),
                                  `${budget.name} approved`
                                );
                              }}
                              disabled={pendingAction !== null || budget.status === 'active'}
                            >
                              Approve
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>
      </Grid>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Budget Plan</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              label="Budget Name"
              value={createForm.name}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, name: event.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Department"
              value={createForm.department}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, department: event.target.value }))
              }
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Fiscal Year"
                  value={createForm.fiscalYearId}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      fiscalYearId: Number(event.target.value),
                    }))
                  }
                  fullWidth
                >
                  {workspace.fiscalYears.map((year) => (
                    <MenuItem key={year.id} value={year.id}>
                      {year.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Cost Center"
                  value={createForm.costCenterId}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      costCenterId: Number(event.target.value),
                    }))
                  }
                  fullWidth
                >
                  {workspace.costCenters.map((center) => (
                    <MenuItem key={center.id} value={center.id}>
                      {center.code} • {center.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Total Amount"
                  type="number"
                  value={createForm.totalAmount}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      totalAmount: Number(event.target.value),
                    }))
                  }
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Primary Account"
                  value={createForm.accountId}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      accountId: Number(event.target.value),
                    }))
                  }
                  fullWidth
                >
                  {workspace.accountOptions.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.code} • {account.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            <TextField
              select
              label="Owner"
              value={createForm.owner}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, owner: event.target.value }))
              }
              fullWidth
            >
              {workspace.ownerOptions.map((owner) => (
                <MenuItem key={owner} value={owner}>
                  {owner}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitCreate}
            disabled={
              pendingAction !== null ||
              !createForm.name.trim() ||
              Number(createForm.totalAmount) <= 0
            }
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={amendOpen} onClose={() => setAmendOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Budget Amendment</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              select
              label="Target Line"
              value={amendForm.targetLineId}
              onChange={(event) =>
                setAmendForm((current) => ({ ...current, targetLineId: event.target.value }))
              }
              fullWidth
            >
              {(selectedBudget?.lines || []).map((line) => (
                <MenuItem key={line.id} value={line.id}>
                  {line.accountCode} • {line.accountName}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Amendment Amount"
              type="number"
              value={amendForm.amount}
              onChange={(event) =>
                setAmendForm((current) => ({ ...current, amount: Number(event.target.value) }))
              }
              fullWidth
            />
            <TextField
              label="Reason"
              value={amendForm.reason}
              onChange={(event) =>
                setAmendForm((current) => ({ ...current, reason: event.target.value }))
              }
              fullWidth
              multiline
              minRows={3}
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Effective Period"
                  value={amendForm.effectivePeriod}
                  onChange={(event) =>
                    setAmendForm((current) => ({ ...current, effectivePeriod: event.target.value }))
                  }
                  fullWidth
                >
                  {workspace.comparisonPeriods
                    .find((item) => item.id === 'fy_2026')
                    ?.periodLabels.map((label) => (
                      <MenuItem key={label} value={label}>
                        {label}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Requested By"
                  value={amendForm.requestedBy}
                  onChange={(event) =>
                    setAmendForm((current) => ({ ...current, requestedBy: event.target.value }))
                  }
                  fullWidth
                >
                  {workspace.ownerOptions.map((owner) => (
                    <MenuItem key={owner} value={owner}>
                      {owner}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAmendOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitAmendment}
            disabled={
              pendingAction !== null ||
              !amendForm.targetLineId ||
              Number(amendForm.amount) === 0 ||
              !amendForm.reason.trim()
            }
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default BudgetPlans;
