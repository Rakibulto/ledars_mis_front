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

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const EP = endpoints.accounting;

const DEFAULT_RULES = [
  {
    id: 'rule-1',
    name: 'Expense to Operating Costs',
    transaction_type: 'expense',
    debit_account: '6100 - Program Expenses',
    credit_account: '2100 - Expense Clearing',
    condition: 'amount <= 10,000 and category = operational',
    active: true,
    amountBand: '0-10,000',
    previewResult: 'Posted to program expense and clearing',
    journalScope: 'Expense Journal',
    documentCondition: 'Approved expense sheet',
    companyScope: 'Programs entity',
    approvalRequirement: 'Department head approval required',
  },
  {
    id: 'rule-2',
    name: 'Customer Receipt Allocation',
    transaction_type: 'payment',
    debit_account: '1100 - Bank',
    credit_account: '1200 - Accounts Receivable',
    condition: 'direction = inflow and document = customer receipt',
    active: true,
    amountBand: 'All amounts',
    previewResult: 'Credits receivable on matched invoice',
    journalScope: 'Bank Journal',
    documentCondition: 'Matched customer receipt',
    companyScope: 'All entities',
    approvalRequirement: 'Auto-post after receipt matching',
  },
];

const EMPTY_RULE = {
  name: '',
  transaction_type: 'invoice',
  debit_account: '',
  credit_account: '',
  condition: '',
  amountBand: '',
  previewResult: '',
  journalScope: '',
  documentCondition: '',
  companyScope: '',
  approvalRequirement: '',
};

function normalizeAccount(account) {
  if (typeof account === 'string') return account;
  if (!account) return '';
  return `${account.code || account.id} - ${account.name || 'Account'}`;
}

function normalizeRule(rule, index) {
  return {
    id: rule.id || `rule-${index + 1}`,
    name: rule.name || `Posting rule ${index + 1}`,
    transaction_type: rule.transaction_type || 'invoice',
    debit_account: normalizeAccount(rule.debit_account),
    credit_account: normalizeAccount(rule.credit_account),
    condition: rule.condition || 'Always apply',
    active: rule.active !== false,
    amountBand: rule.amountBand || rule.amount_band || 'All amounts',
    previewResult: rule.previewResult || rule.preview_result || 'No preview configured',
    journalScope: rule.journalScope || rule.journal_scope || 'General Journal',
    documentCondition:
      rule.documentCondition || rule.document_condition || 'Approved source document',
    companyScope: rule.companyScope || rule.company_scope || 'All entities',
    approvalRequirement:
      rule.approvalRequirement || rule.approval_requirement || 'Controller review not required',
  };
}

function PostingRules() {
  const { data: rawPostingRules } = useGetRequest(EP.posting_rules);
  const { data: rawAccounts } = useGetRequest(EP.accounts);
  const postingRules = useMemo(
    () => (Array.isArray(rawPostingRules) ? rawPostingRules : rawPostingRules?.results || []),
    [rawPostingRules]
  );
  const normalizedPostingRules = useMemo(
    () => postingRules.map((rule, index) => normalizeRule(rule, index)),
    [postingRules]
  );
  const remoteRulesSignature = useMemo(
    () => JSON.stringify(normalizedPostingRules),
    [normalizedPostingRules]
  );
  const chartOfAccounts = useMemo(
    () => (Array.isArray(rawAccounts) ? rawAccounts : rawAccounts?.results || []),
    [rawAccounts]
  );

  const [rules, setRules] = useState(DEFAULT_RULES);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [draftRule, setDraftRule] = useState(EMPTY_RULE);
  const [selectedRuleId, setSelectedRuleId] = useState(DEFAULT_RULES[0].id);
  const lastRemoteRulesSignatureRef = useRef('');
  const [sandboxInput, setSandboxInput] = useState({
    transaction_type: 'invoice',
    amount: 25000,
    category: 'operational',
    direction: 'inflow',
    document: 'customer receipt',
    journal: 'Bank Journal',
    status: 'approved',
    company: 'All entities',
  });

  useEffect(() => {
    if (!normalizedPostingRules.length) return;
    if (lastRemoteRulesSignatureRef.current === remoteRulesSignature) return;

    lastRemoteRulesSignatureRef.current = remoteRulesSignature;
    setRules(normalizedPostingRules);
    setSelectedRuleId((current) => {
      if (normalizedPostingRules.some((rule) => rule.id === current)) {
        return current;
      }

      return normalizedPostingRules[0]?.id || current;
    });
  }, [normalizedPostingRules, remoteRulesSignature]);

  const availableAccounts = chartOfAccounts.length
    ? chartOfAccounts.map((account) => ({
        id: account.id,
        label: `${account.code} - ${account.name}`,
      }))
    : [
        { id: '1100', label: '1100 - Bank' },
        { id: '1200', label: '1200 - Accounts Receivable' },
        { id: '2100', label: '2100 - Expense Clearing' },
        { id: '6100', label: '6100 - Program Expenses' },
      ];

  const activeCount = rules.filter((rule) => rule.active).length;
  const conditionalCount = rules.filter(
    (rule) => rule.condition && rule.condition !== 'Always apply'
  ).length;
  const selectedRule = rules.find((rule) => rule.id === selectedRuleId) || rules[0] || null;

  const sandboxResult = useMemo(() => {
    if (!selectedRule) return null;

    const normalizedCondition = String(selectedRule.condition || '').toLowerCase();
    const normalizedType = String(selectedRule.transaction_type || '').toLowerCase();
    const amountMatch = normalizedCondition.includes('<= 10,000')
      ? Number(sandboxInput.amount) <= 10000
      : normalizedCondition.includes('> 50,000')
        ? Number(sandboxInput.amount) > 50000
        : true;
    const typeMatch = normalizedType
      ? normalizedType === String(sandboxInput.transaction_type).toLowerCase()
      : true;
    const categoryMatch = normalizedCondition.includes('operational')
      ? String(sandboxInput.category).toLowerCase() === 'operational'
      : true;
    const directionMatch = normalizedCondition.includes('inflow')
      ? String(sandboxInput.direction).toLowerCase() === 'inflow'
      : true;
    const documentMatch = normalizedCondition.includes('customer receipt')
      ? String(sandboxInput.document).toLowerCase() === 'customer receipt'
      : true;
    const journalMatch = selectedRule.journalScope
      ? String(selectedRule.journalScope).toLowerCase() ===
        String(sandboxInput.journal).toLowerCase()
      : true;
    const statusMatch = selectedRule.documentCondition
      ? String(selectedRule.documentCondition)
          .toLowerCase()
          .includes(String(sandboxInput.status).toLowerCase())
      : true;
    const companyMatch = selectedRule.companyScope
      ? String(selectedRule.companyScope).toLowerCase() ===
          String(sandboxInput.company).toLowerCase() ||
        String(selectedRule.companyScope).toLowerCase() === 'all entities'
      : true;
    const matched =
      amountMatch &&
      typeMatch &&
      categoryMatch &&
      directionMatch &&
      documentMatch &&
      journalMatch &&
      statusMatch &&
      companyMatch;

    return {
      matched,
      explanation: matched
        ? `Rule would post Debit ${selectedRule.debit_account} and Credit ${selectedRule.credit_account} through ${selectedRule.journalScope}.`
        : 'Sandbox inputs do not satisfy the selected rule condition set.',
    };
  }, [sandboxInput, selectedRule]);

  const executionLog = useMemo(
    () =>
      rules.slice(0, 4).map((rule, index) => ({
        id: `${rule.id}-log`,
        ruleName: rule.name,
        timestamp: `2026-03-30 ${String(9 + index).padStart(2, '0')}:15`,
        outcome: rule.active ? 'matched' : 'skipped',
      })),
    [rules]
  );

  const previewText = useMemo(() => {
    if (!draftRule.debit_account || !draftRule.credit_account) {
      return 'Select debit and credit accounts to preview posting effect.';
    }

    return `Debit ${draftRule.debit_account} / Credit ${draftRule.credit_account} when ${draftRule.condition || 'rule conditions are met'}.`;
  }, [draftRule]);

  const openCreateDialog = () => {
    setEditingRuleId(null);
    setDraftRule(EMPTY_RULE);
    setDialogOpen(true);
  };

  const openEditDialog = (rule) => {
    setEditingRuleId(rule.id);
    setDraftRule({
      name: rule.name,
      transaction_type: rule.transaction_type,
      debit_account: rule.debit_account,
      credit_account: rule.credit_account,
      condition: rule.condition,
      amountBand: rule.amountBand,
      previewResult: rule.previewResult,
      journalScope: rule.journalScope,
      documentCondition: rule.documentCondition,
      companyScope: rule.companyScope,
      approvalRequirement: rule.approvalRequirement,
    });
    setDialogOpen(true);
  };

  const saveRule = async () => {
    const payload = {
      name: draftRule.name,
      transaction_type: draftRule.transaction_type,
      debit_account: draftRule.debit_account,
      credit_account: draftRule.credit_account,
      condition: draftRule.condition || '',
      active: true,
      amount_band: draftRule.amountBand || 'All amounts',
      preview_result: draftRule.previewResult || previewText,
      journal_scope: draftRule.journalScope || 'General Journal',
      document_condition: draftRule.documentCondition || 'Approved source document',
      company_scope: draftRule.companyScope || 'All entities',
      approval_requirement: draftRule.approvalRequirement || 'Controller review not required',
    };

    try {
      if (editingRuleId) {
        const { data: updated } = await axiosInstance.patch(
          EP.posting_rule_by_id(editingRuleId),
          payload
        );
        const normalized = normalizeRule(updated, 0);
        setRules((current) =>
          current.map((rule) => (rule.id === editingRuleId ? normalized : rule))
        );
        toast.success('Posting rule updated');
      } else {
        const { data: created } = await axiosInstance.post(EP.posting_rules, payload);
        const normalized = normalizeRule(created, rules.length);
        setRules((current) => [normalized, ...current]);
        setSelectedRuleId(normalized.id);
        toast.success('Posting rule created');
      }
      await mutate(EP.posting_rules);
    } catch (error) {
      toast.error(error?.detail || error?.message || 'Failed to save posting rule');
    }

    setDialogOpen(false);
    setEditingRuleId(null);
    setDraftRule(EMPTY_RULE);
  };

  const toggleRule = async (id) => {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;
    const nextActive = !rule.active;

    // Optimistic update
    setRules((current) => current.map((r) => (r.id === id ? { ...r, active: nextActive } : r)));

    try {
      await axiosInstance.patch(EP.posting_rule_by_id(id), { active: nextActive });
      await mutate(EP.posting_rules);
      toast.success(nextActive ? 'Posting rule activated' : 'Posting rule disabled');
    } catch (error) {
      // Revert optimistic update on failure
      setRules((current) => current.map((r) => (r.id === id ? { ...r, active: rule.active } : r)));
      toast.error(error?.detail || error?.message || 'Failed to update rule status');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Posting Rules
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Build conditional accounting logic with transaction routing, amount bands, and posting
            previews.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={openCreateDialog}
        >
          Add Rule
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        Posting rules now behave like a rule builder with condition preview and amount-band
        governance instead of a minimal text form.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Active rules
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {activeCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Conditional logic rules
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {conditionalCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Account options
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {availableAccounts.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rule</TableCell>
                <TableCell>Transaction</TableCell>
                <TableCell>Debit</TableCell>
                <TableCell>Credit</TableCell>
                <TableCell>Amount band</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell align="center">Active</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.map((rule) => (
                <TableRow
                  key={rule.id}
                  hover
                  selected={rule.id === selectedRule?.id}
                  onClick={() => setSelectedRuleId(rule.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {rule.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {rule.previewResult}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={rule.transaction_type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{rule.debit_account}</TableCell>
                  <TableCell>{rule.credit_account}</TableCell>
                  <TableCell>{rule.amountBand}</TableCell>
                  <TableCell>{rule.condition}</TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={rule.active}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => toggleRule(rule.id)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {selectedRule ? (
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Rule Sandbox
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Transaction type"
                      value={sandboxInput.transaction_type}
                      onChange={(event) =>
                        setSandboxInput((current) => ({
                          ...current,
                          transaction_type: event.target.value,
                        }))
                      }
                    >
                      <MenuItem value="invoice">Invoice</MenuItem>
                      <MenuItem value="payment">Payment</MenuItem>
                      <MenuItem value="expense">Expense</MenuItem>
                      <MenuItem value="payroll">Payroll</MenuItem>
                      <MenuItem value="inventory">Inventory</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Amount"
                      value={sandboxInput.amount}
                      onChange={(event) =>
                        setSandboxInput((current) => ({
                          ...current,
                          amount: Number(event.target.value),
                        }))
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Category"
                      value={sandboxInput.category}
                      onChange={(event) =>
                        setSandboxInput((current) => ({ ...current, category: event.target.value }))
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Direction"
                      value={sandboxInput.direction}
                      onChange={(event) =>
                        setSandboxInput((current) => ({
                          ...current,
                          direction: event.target.value,
                        }))
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Document"
                      value={sandboxInput.document}
                      onChange={(event) =>
                        setSandboxInput((current) => ({ ...current, document: event.target.value }))
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Journal"
                      value={sandboxInput.journal}
                      onChange={(event) =>
                        setSandboxInput((current) => ({ ...current, journal: event.target.value }))
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Status"
                      value={sandboxInput.status}
                      onChange={(event) =>
                        setSandboxInput((current) => ({ ...current, status: event.target.value }))
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Company"
                      value={sandboxInput.company}
                      onChange={(event) =>
                        setSandboxInput((current) => ({ ...current, company: event.target.value }))
                      }
                    />
                  </Grid>
                </Grid>
                <Alert
                  severity={sandboxResult?.matched ? 'success' : 'warning'}
                  sx={{ borderRadius: 2 }}
                >
                  <Typography variant="subtitle2" fontWeight={700}>
                    {selectedRule.name}
                  </Typography>
                  {sandboxResult?.explanation}
                </Alert>
                <Card variant="outlined" sx={{ borderRadius: 2, mt: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                      Document Conditions
                    </Typography>
                    <Stack spacing={1}>
                      <Typography variant="body2">
                        Journal scope: <strong>{selectedRule.journalScope}</strong>
                      </Typography>
                      <Typography variant="body2">
                        Document condition: <strong>{selectedRule.documentCondition}</strong>
                      </Typography>
                      <Typography variant="body2">
                        Company scope: <strong>{selectedRule.companyScope}</strong>
                      </Typography>
                      <Typography variant="body2">
                        Approval requirement: <strong>{selectedRule.approvalRequirement}</strong>
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => openEditDialog(selectedRule)}
                  >
                    Edit Rule
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 5 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Execution Log
                </Typography>
                <Stack spacing={1.25}>
                  {executionLog.map((entry) => (
                    <Stack
                      key={entry.id}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {entry.ruleName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {entry.timestamp}
                        </Typography>
                      </Box>
                      <Chip
                        label={entry.outcome}
                        size="small"
                        color={entry.outcome === 'matched' ? 'success' : 'default'}
                      />
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : null}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingRuleId ? 'Edit Posting Rule' : 'Add Posting Rule'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Rule name"
                  value={draftRule.name}
                  onChange={(event) =>
                    setDraftRule((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Transaction type"
                  value={draftRule.transaction_type}
                  onChange={(event) =>
                    setDraftRule((current) => ({
                      ...current,
                      transaction_type: event.target.value,
                    }))
                  }
                >
                  <MenuItem value="invoice">Invoice</MenuItem>
                  <MenuItem value="payment">Payment</MenuItem>
                  <MenuItem value="expense">Expense</MenuItem>
                  <MenuItem value="payroll">Payroll</MenuItem>
                  <MenuItem value="inventory">Inventory</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Debit account"
                  value={draftRule.debit_account}
                  onChange={(event) =>
                    setDraftRule((current) => ({ ...current, debit_account: event.target.value }))
                  }
                >
                  {availableAccounts.map((account) => (
                    <MenuItem key={account.id} value={account.label}>
                      {account.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Credit account"
                  value={draftRule.credit_account}
                  onChange={(event) =>
                    setDraftRule((current) => ({ ...current, credit_account: event.target.value }))
                  }
                >
                  {availableAccounts.map((account) => (
                    <MenuItem key={account.id} value={account.label}>
                      {account.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Amount band"
                  value={draftRule.amountBand}
                  onChange={(event) =>
                    setDraftRule((current) => ({ ...current, amountBand: event.target.value }))
                  }
                  placeholder="e.g. 0-10,000"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Journal scope"
                  value={draftRule.journalScope}
                  onChange={(event) =>
                    setDraftRule((current) => ({ ...current, journalScope: event.target.value }))
                  }
                  placeholder="e.g. Bank Journal"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Document condition"
                  value={draftRule.documentCondition}
                  onChange={(event) =>
                    setDraftRule((current) => ({
                      ...current,
                      documentCondition: event.target.value,
                    }))
                  }
                  placeholder="e.g. Approved customer receipt"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Company scope"
                  value={draftRule.companyScope}
                  onChange={(event) =>
                    setDraftRule((current) => ({ ...current, companyScope: event.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Approval requirement"
                  value={draftRule.approvalRequirement}
                  onChange={(event) =>
                    setDraftRule((current) => ({
                      ...current,
                      approvalRequirement: event.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Preview result"
                  value={draftRule.previewResult}
                  onChange={(event) =>
                    setDraftRule((current) => ({ ...current, previewResult: event.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Condition"
                  value={draftRule.condition}
                  onChange={(event) =>
                    setDraftRule((current) => ({ ...current, condition: event.target.value }))
                  }
                  placeholder="e.g. amount > 50,000 and cost_center = Education"
                />
              </Grid>
            </Grid>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              {previewText}
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={saveRule}
            disabled={!draftRule.name || !draftRule.debit_account || !draftRule.credit_account}
          >
            Save Rule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PostingRules;
