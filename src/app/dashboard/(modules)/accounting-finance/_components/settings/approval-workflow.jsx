'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
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

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest, extractErrorMessage } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const EP = endpoints.accounting;

const DEFAULT_WORKFLOWS = [
  {
    id: 'wf-1',
    name: 'High Value Payment Release',
    document_type: 'payment',
    threshold: 50000,
    active: true,
    escalation: '24h escalation to Finance Director',
    delegation: 'Treasury backup allowed',
    journalScope: 'Bank Journal',
    companyScope: 'All entities',
    amountCondition: 'amount > 50,000',
    roleAssignment: 'AP Supervisor -> Controller -> Executive Director',
    levels: [
      { role: 'AP Supervisor', condition: 'base review' },
      { role: 'Finance Controller', condition: 'amount > 50,000' },
      { role: 'Executive Director', condition: 'grant-funded exceptions' },
    ],
  },
  {
    id: 'wf-2',
    name: 'Expense Exception Approval',
    document_type: 'expense',
    threshold: 10000,
    active: true,
    escalation: '12h escalation to Program Director',
    delegation: 'Department delegate allowed',
    journalScope: 'Expense Journal',
    companyScope: 'Programs entity',
    amountCondition: 'amount > 10,000 or policy breach',
    roleAssignment: 'Department Head -> Finance Manager',
    levels: [
      { role: 'Department Head', condition: 'base review' },
      { role: 'Finance Manager', condition: 'out of policy or > 10,000' },
    ],
  },
];

const EMPTY_WORKFLOW = {
  name: '',
  document_type: 'payment',
  threshold: '',
  escalation: '',
  delegation: '',
  journalScope: '',
  companyScope: '',
  amountCondition: '',
  roleAssignment: '',
  levels: [
    { role: 'Manager', condition: 'base review' },
    { role: 'Finance Controller', condition: 'amount threshold' },
  ],
};

function normalizeWorkflow(item, index) {
  const levels = Array.isArray(item.levels)
    ? item.levels.map((level) =>
        typeof level === 'string' ? { role: level, condition: 'manual review' } : level
      )
    : [
        { role: 'Manager', condition: 'base review' },
        { role: 'Director', condition: 'threshold review' },
      ];

  return {
    id: item.id || `wf-${index + 1}`,
    name: item.name || `Workflow ${index + 1}`,
    document_type: item.document_type || 'journal_entry',
    threshold: Number(item.threshold || 0),
    active: item.is_active !== false,
    escalation: item.escalation || 'No escalation rule configured',
    delegation: item.delegation || 'No delegation configured',
    journalScope: item.journal_scope || item.journalScope || 'General Journal',
    companyScope: item.company_scope || item.companyScope || 'All entities',
    amountCondition:
      item.amount_condition ||
      item.amountCondition ||
      `amount > ${Number(item.threshold || 0).toLocaleString()}`,
    roleAssignment:
      item.role_assignment || item.roleAssignment || levels.map((level) => level.role).join(' -> '),
    levels,
  };
}

function ApprovalWorkflow() {
  const { data: rawApprovalWorkflows } = useGetRequest(EP.approval_workflows);
  const approvalWorkflows = Array.isArray(rawApprovalWorkflows)
    ? rawApprovalWorkflows
    : rawApprovalWorkflows?.results || [];
  const normalizedApprovalWorkflows = useMemo(
    () => approvalWorkflows.map(normalizeWorkflow),
    [approvalWorkflows]
  );
  const workflowsSignature = useMemo(
    () => JSON.stringify(normalizedApprovalWorkflows),
    [normalizedApprovalWorkflows]
  );

  const [workflows, setWorkflows] = useState(DEFAULT_WORKFLOWS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkflowId, setEditingWorkflowId] = useState(null);
  const [draftWorkflow, setDraftWorkflow] = useState(EMPTY_WORKFLOW);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(DEFAULT_WORKFLOWS[0].id);
  const lastWorkflowsSignatureRef = useRef('');

  useEffect(() => {
    if (!normalizedApprovalWorkflows.length) return;
    if (lastWorkflowsSignatureRef.current === workflowsSignature) return;

    lastWorkflowsSignatureRef.current = workflowsSignature;
    setWorkflows(normalizedApprovalWorkflows);
    setSelectedWorkflowId((current) => {
      if (normalizedApprovalWorkflows.some((workflow) => workflow.id === current)) {
        return current;
      }

      return normalizedApprovalWorkflows[0]?.id || current;
    });
  }, [normalizedApprovalWorkflows, workflowsSignature]);

  const activeCount = workflows.filter((workflow) => workflow.active).length;
  const maxLevelCount = Math.max(...workflows.map((workflow) => workflow.levels.length), 0);
  const escalatedCount = workflows.filter((workflow) => workflow.escalation).length;
  const selectedWorkflow =
    workflows.find((workflow) => workflow.id === selectedWorkflowId) || workflows[0] || null;
  const selectedWorkflowRoutes = selectedWorkflow
    ? {
        journal_entry: paths.dashboard.accountingFinance.transactions.journalEntries,
        payment: paths.dashboard.accountingFinance.transactions.supplierPayments,
        expense: paths.dashboard.accountingFinance.transactions.expenseEntries,
        invoice: paths.dashboard.accountingFinance.transactions.customerInvoices,
        budget: paths.dashboard.accountingFinance.budgets.lines,
      }
    : {};

  const workflowPreview = useMemo(
    () => draftWorkflow.levels.filter((level) => level.role.trim()),
    [draftWorkflow.levels]
  );

  const updateLevel = (index, field, value) => {
    setDraftWorkflow((current) => ({
      ...current,
      levels: current.levels.map((level, levelIndex) =>
        levelIndex === index ? { ...level, [field]: value } : level
      ),
    }));
  };

  const addLevel = () => {
    setDraftWorkflow((current) => ({
      ...current,
      levels: [...current.levels, { role: '', condition: '' }],
    }));
  };

  const openCreateDialog = () => {
    setEditingWorkflowId(null);
    setDraftWorkflow(EMPTY_WORKFLOW);
    setDialogOpen(true);
  };

  const openEditDialog = (workflow) => {
    setEditingWorkflowId(workflow.id);
    setDraftWorkflow({
      name: workflow.name,
      document_type: workflow.document_type,
      threshold: workflow.threshold,
      escalation: workflow.escalation,
      delegation: workflow.delegation,
      journalScope: workflow.journalScope,
      companyScope: workflow.companyScope,
      amountCondition: workflow.amountCondition,
      roleAssignment: workflow.roleAssignment,
      levels: workflow.levels,
    });
    setDialogOpen(true);
  };

  const saveWorkflow = async () => {
    const cleanLevels = draftWorkflow.levels.filter((level) => level.role.trim());
    const payload = {
      name: draftWorkflow.name,
      document_type: draftWorkflow.document_type,
      threshold: Number(draftWorkflow.threshold || 0),
      is_active: true,
      escalation: draftWorkflow.escalation,
      delegation: draftWorkflow.delegation,
      journal_scope: draftWorkflow.journalScope,
      company_scope: draftWorkflow.companyScope,
      amount_condition: draftWorkflow.amountCondition,
      role_assignment: draftWorkflow.roleAssignment,
      levels: cleanLevels,
    };

    try {
      if (editingWorkflowId) {
        await axiosInstance.patch(EP.approval_workflow_by_id(editingWorkflowId), payload);
        toast.success('Approval workflow updated');
      } else {
        await axiosInstance.post(EP.approval_workflows, payload);
        toast.success('Approval workflow created');
      }
      await mutate(EP.approval_workflows);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to save approval workflow'));
      return;
    }

    setDialogOpen(false);
    setEditingWorkflowId(null);
    setDraftWorkflow(EMPTY_WORKFLOW);
  };

  const toggleWorkflow = async (workflow) => {
    const nextActive = !workflow.active;

    // Optimistic update
    setWorkflows((current) =>
      current.map((item) => (item.id === workflow.id ? { ...item, active: nextActive } : item))
    );

    try {
      await axiosInstance.patch(EP.approval_workflow_by_id(workflow.id), {
        is_active: nextActive,
      });
      toast.success(nextActive ? 'Approval workflow activated' : 'Approval workflow disabled');
    } catch (error) {
      // Revert optimistic update on failure
      setWorkflows((current) =>
        current.map((item) => (item.id === workflow.id ? { ...item, active: !nextActive } : item))
      );
      toast.error(extractErrorMessage(error, 'Failed to update approval workflow status'));
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Approval Workflows
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Build multi-level approval matrices with escalation rules, delegation, and
            document-specific thresholds.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={openCreateDialog}
        >
          Add Workflow
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        The workflow page now supports multi-step approval design, escalation policy, and visible
        approval paths instead of only a minimal create form.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Active workflows', value: activeCount },
          { label: 'Max approval depth', value: maxLevelCount },
          { label: 'Escalation enabled', value: escalatedCount },
          {
            label: 'Journal-scoped routes',
            value: workflows.filter((workflow) => workflow.journalScope).length,
          },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, md: 3 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  {card.label}
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Workflow</TableCell>
                <TableCell>Document</TableCell>
                <TableCell>Threshold</TableCell>
                <TableCell>Approval Path</TableCell>
                <TableCell>Escalation</TableCell>
                <TableCell align="center">Active</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workflows.map((workflow) => (
                <TableRow
                  key={workflow.id}
                  hover
                  selected={workflow.id === selectedWorkflow?.id}
                  onClick={() => setSelectedWorkflowId(workflow.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {workflow.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {workflow.delegation}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={workflow.document_type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{workflow.threshold.toLocaleString()}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap">
                      {workflow.levels.map((level, index) => (
                        <Chip
                          key={`${workflow.id}-${level.role}-${index}`}
                          size="small"
                          label={`${index + 1}. ${level.role}`}
                        />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{workflow.escalation}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={workflow.active}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => toggleWorkflow(workflow)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {selectedWorkflow ? (
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Approval Route
                </Typography>
                <Stack divider={<Divider flexItem />}>
                  {selectedWorkflow.levels.map((level, index) => (
                    <Stack
                      key={`${selectedWorkflow.id}-${level.role}-${index}`}
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      sx={{ py: 1.25 }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {index + 1}. {level.role}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {level.condition}
                        </Typography>
                      </Box>
                      <Chip
                        label={
                          index === selectedWorkflow.levels.length - 1
                            ? 'Final approval'
                            : 'Review step'
                        }
                        size="small"
                        color={index === selectedWorkflow.levels.length - 1 ? 'success' : 'info'}
                      />
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 5 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Workflow Control
                </Typography>
                <Stack spacing={1.25}>
                  <Typography variant="body2">
                    Document: {selectedWorkflow.document_type}
                  </Typography>
                  <Typography variant="body2">
                    Threshold: {selectedWorkflow.threshold.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    Journal scope: {selectedWorkflow.journalScope}
                  </Typography>
                  <Typography variant="body2">
                    Company scope: {selectedWorkflow.companyScope}
                  </Typography>
                  <Typography variant="body2">
                    Amount condition: {selectedWorkflow.amountCondition}
                  </Typography>
                  <Typography variant="body2">Delegation: {selectedWorkflow.delegation}</Typography>
                  <Typography variant="body2">Escalation: {selectedWorkflow.escalation}</Typography>
                  <Typography variant="body2">
                    Depth: {selectedWorkflow.levels.length} approval levels
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Role Assignment Matrix
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
                  {selectedWorkflow.levels.map((level, index) => (
                    <Chip
                      key={`${selectedWorkflow.id}-${level.role}-assignment-${index}`}
                      label={`${index + 1}. ${level.role}`}
                      size="small"
                      color={index === selectedWorkflow.levels.length - 1 ? 'success' : 'info'}
                    />
                  ))}
                </Stack>
                <Typography variant="body2">
                  Assignment summary: {selectedWorkflow.roleAssignment}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                  Workflow Handoff
                </Typography>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.25}
                  flexWrap="wrap"
                  useFlexGap
                >
                  <Button
                    component={RouterLink}
                    href={
                      selectedWorkflowRoutes[selectedWorkflow.document_type] ||
                      paths.dashboard.accountingFinance.transactions.journalEntries
                    }
                    variant="contained"
                  >
                    Open Document Queue
                  </Button>
                  <Button
                    component={RouterLink}
                    href={paths.dashboard.accountingFinance.configuration.lockDates}
                    variant="outlined"
                    color="inherit"
                  >
                    View Lock Dates
                  </Button>
                </Stack>
                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => openEditDialog(selectedWorkflow)}
                  >
                    Edit Workflow
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : null}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingWorkflowId ? 'Edit Approval Workflow' : 'Add Approval Workflow'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Workflow name"
                  value={draftWorkflow.name}
                  onChange={(event) =>
                    setDraftWorkflow((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Document type"
                  value={draftWorkflow.document_type}
                  onChange={(event) =>
                    setDraftWorkflow((current) => ({
                      ...current,
                      document_type: event.target.value,
                    }))
                  }
                >
                  <MenuItem value="journal_entry">Journal Entry</MenuItem>
                  <MenuItem value="invoice">Invoice</MenuItem>
                  <MenuItem value="payment">Payment</MenuItem>
                  <MenuItem value="expense">Expense</MenuItem>
                  <MenuItem value="budget">Budget</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Threshold"
                  value={draftWorkflow.threshold}
                  onChange={(event) =>
                    setDraftWorkflow((current) => ({ ...current, threshold: event.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Delegation rule"
                  value={draftWorkflow.delegation}
                  onChange={(event) =>
                    setDraftWorkflow((current) => ({ ...current, delegation: event.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Journal scope"
                  value={draftWorkflow.journalScope}
                  onChange={(event) =>
                    setDraftWorkflow((current) => ({
                      ...current,
                      journalScope: event.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Company scope"
                  value={draftWorkflow.companyScope}
                  onChange={(event) =>
                    setDraftWorkflow((current) => ({
                      ...current,
                      companyScope: event.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Amount condition"
                  value={draftWorkflow.amountCondition}
                  onChange={(event) =>
                    setDraftWorkflow((current) => ({
                      ...current,
                      amountCondition: event.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Escalation rule"
                  value={draftWorkflow.escalation}
                  onChange={(event) =>
                    setDraftWorkflow((current) => ({ ...current, escalation: event.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Role assignment summary"
                  value={draftWorkflow.roleAssignment}
                  onChange={(event) =>
                    setDraftWorkflow((current) => ({
                      ...current,
                      roleAssignment: event.target.value,
                    }))
                  }
                />
              </Grid>
            </Grid>

            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Approval Levels
                  </Typography>
                  <Button
                    size="small"
                    onClick={addLevel}
                    startIcon={<Iconify icon="solar:add-circle-bold" />}
                  >
                    Add Level
                  </Button>
                </Stack>
                <Stack spacing={2}>
                  {draftWorkflow.levels.map((level, index) => (
                    <Grid key={`level-${index}`} container spacing={2}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label={`Level ${index + 1} role`}
                          value={level.role}
                          onChange={(event) => updateLevel(index, 'role', event.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 8 }}>
                        <TextField
                          fullWidth
                          label="Condition / routing rule"
                          value={level.condition}
                          onChange={(event) => updateLevel(index, 'condition', event.target.value)}
                        />
                      </Grid>
                    </Grid>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Preview path:{' '}
              {workflowPreview.map((level) => level.role).join(' -> ') || 'No levels configured'}
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={saveWorkflow}
            disabled={!draftWorkflow.name || workflowPreview.length === 0}
          >
            Save Workflow
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ApprovalWorkflow;
