'use client';

import { toast } from 'sonner';
import { useMemo, useState, useEffect } from 'react';

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
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { useCurrency } from '../currency-context';
import { useBankingWorkspace } from './use-banking-workspace';
import { BankingWorkspaceToolbar } from './banking-workspace-toolbar';

const STATUS_COLORS = {
  matched: 'success',
  writeoff: 'info',
  counterpart_created: 'primary',
  suggested: 'warning',
  unmatched: 'default',
  duplicate: 'error',
};

const EMPTY_RULE = {
  name: '',
  type: 'writeoff',
  matchLabel: '',
  matchJournal: 'Bank Journal',
  account: '',
  tax: '',
  autoValidate: false,
};

function SummaryCard({ label, value, helper, color = '#1d4ed8' }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {helper}
        </Typography>
        <Box sx={{ mt: 2, width: 42, height: 4, borderRadius: 999, bgcolor: color }} />
      </CardContent>
    </Card>
  );
}

export default function Reconciliation({ initialStatementId = null }) {
  const { formatAmount } = useCurrency();
  const {
    accounts,
    reconciliations,
    statements,
    models,
    bankReconciliations,
    formatBankingStatus,
    actions,
  } = useBankingWorkspace();
  const reconcilableAccounts = accounts.filter((account) => account.allowReconciliation);
  const [bankId, setBankId] = useState(null);
  const [statementId, setStatementId] = useState(initialStatementId);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [selectedLineIds, setSelectedLineIds] = useState([]);
  const [writeoffModelId, setWriteoffModelId] = useState('');
  const [counterpartLabel, setCounterpartLabel] = useState('1105 - Cash in Transit');
  const [note, setNote] = useState('');
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [ruleDraft, setRuleDraft] = useState(EMPTY_RULE);

  const bank =
    reconcilableAccounts.find((account) => account.id === bankId) ||
    reconcilableAccounts[0] ||
    null;
  // Memoised so the reference is stable — required for the late-load guard effect below.
  const accountStatements = useMemo(
    () => statements.filter((statement) => statement.bankAccountId === bank?.id),
    [statements, bank?.id]
  );
  const selectedStatement =
    accountStatements.find((statement) => statement.id === statementId) ||
    accountStatements[0] ||
    null;
  const currentReconciliation =
    reconciliations.find((item) => item.statementId === selectedStatement?.id) || null;
  const selectedLines = (selectedStatement?.lines || []).filter((line) =>
    selectedLineIds.includes(line.id)
  );

  // Initialise bankId only once BOTH accounts and statements have loaded.
  // This prevents the common race-condition where accounts resolve first and
  // lock bankId to reconcilableAccounts[0] before we know which account the
  // imported statements actually belong to.
  // We prefer the first reconcilable account that has at least one statement so
  // the Statement-period dropdown is populated automatically on first visit.
  useEffect(() => {
    if (bankId === null && reconcilableAccounts.length > 0 && statements.length > 0) {
      const accountWithStatements = reconcilableAccounts.find((a) =>
        statements.some((s) => s.bankAccountId === a.id)
      );
      setBankId((accountWithStatements ?? reconcilableAccounts[0]).id);
    }
  }, [bankId, reconcilableAccounts.length, statements.length]);

  useEffect(() => {
    if (
      bankId === null &&
      initialStatementId !== null &&
      reconcilableAccounts.length > 0 &&
      statements.length > 0
    ) {
      const initialStatement = statements.find((statement) => statement.id === initialStatementId);
      if (initialStatement) {
        const initialBank = reconcilableAccounts.find(
          (account) => account.id === initialStatement.bankAccountId
        );
        if (initialBank) {
          setBankId(initialBank.id);
          setStatementId(initialStatement.id);
        }
      }
    }
  }, [bankId, initialStatementId, reconcilableAccounts, statements]);

  // Initialise writeoffModelId once reconciliation models are loaded from the API.
  // models is [] on first render (SWR not yet resolved), so we cannot set a valid
  // id in useState — we do it reactively here instead.
  useEffect(() => {
    if (writeoffModelId === '' && models.length > 0) {
      setWriteoffModelId(models[0].id);
    }
  }, [models, writeoffModelId]);

  useEffect(() => {
    setStatementId(accountStatements[0]?.id || null);
    setSelectedLineIds([]);
    setSelectedLineId(accountStatements[0]?.lines?.[0]?.id || null);
  }, [bankId]);

  useEffect(() => {
    setSelectedLineIds([]);
    setSelectedLineId(selectedStatement?.lines?.[0]?.id || null);
  }, [statementId]);

  // Guard: statements SWR can resolve after the bankId effect already ran.
  // In that case statementId is still null even though statements are available.
  // This effect fills the gap whenever accountStatements becomes non-empty
  // and statementId is still unset.
  useEffect(() => {
    if (statementId === null && accountStatements.length > 0) {
      setStatementId(accountStatements[0].id);
      setSelectedLineId(accountStatements[0]?.lines?.[0]?.id || null);
    }
  }, [accountStatements, statementId]);

  const suggestedLines =
    selectedStatement?.lines.filter((line) => line.status === 'suggested') || [];
  const unresolvedLines =
    selectedStatement?.lines.filter((line) =>
      ['suggested', 'unmatched', 'duplicate'].includes(line.status)
    ) || [];
  const matchedLines = selectedStatement?.lines.filter((line) => line.status === 'matched') || [];
  const autoResolvableLines = suggestedLines.filter(
    (line) =>
      (line.recommendationType === 'writeoff' && line.confidence >= 90) ||
      (line.recommendationType === 'counterpart' && line.confidence >= 80)
  );
  const selectedLine =
    (selectedStatement?.lines || []).find((line) => line.id === selectedLineId) ||
    unresolvedLines[0] ||
    selectedStatement?.lines?.[0] ||
    null;
  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Date</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Description
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Reference
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Amount
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {(selectedStatement?.lines || []).map((line) => (
          <tr key={line.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{line.date}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{line.description}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{line.reference}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{line.amount}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{line.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  const selectedModel = models.find((model) => model.id === Number(writeoffModelId)) || null;
  const unresolvedAmount = unresolvedLines.reduce(
    (sum, line) => sum + Math.abs(Number(line.amount || 0)),
    0
  );
  const selectedLineAmount = selectedLines.reduce(
    (sum, line) => sum + Math.abs(Number(line.amount || 0)),
    0
  );

  const toggleLine = (lineId) => {
    setSelectedLineIds((current) =>
      current.includes(lineId) ? current.filter((item) => item !== lineId) : [...current, lineId]
    );
  };

  const toggleAll = () => {
    if (!selectedStatement) return;
    const unresolvedIds = unresolvedLines.map((line) => line.id);
    setSelectedLineIds(selectedLineIds.length === unresolvedIds.length ? [] : unresolvedIds);
  };

  const applyAction = (action) => {
    if (!selectedStatement || !selectedLineIds.length) {
      toast.error('Select at least one statement line');
      return;
    }

    actions.applyStatementAction({
      statementId: selectedStatement.id,
      lineIds: selectedLineIds,
      action,
      modelId: writeoffModelId,
      counterpartLabel,
      note,
    });

    setSelectedLineIds([]);
    setNote('');
    toast.success(`${formatBankingStatus(action)} applied to selected lines`);
  };

  const handleAutoMatch = () => {
    if (!selectedStatement) return;
    actions.runStatementAutoMatch(selectedStatement.id);
    toast.success('Suggested lines processed with reconciliation models');
  };

  const handleFinalize = () => {
    if (!selectedStatement) return;
    const completed = actions.finalizeReconciliation(selectedStatement.id);
    if (completed) toast.success('Reconciliation completed');
    else toast.error('Resolve all unmatched lines before finalizing');
  };

  const createRule = () => {
    actions.createReconciliationModel(ruleDraft);
    toast.success('Reconciliation model created');
    setRuleDialogOpen(false);
    setRuleDraft(EMPTY_RULE);
  };

  return (
    <Box sx={{ p: 3 }}>
      <BankingWorkspaceToolbar printTitle="Bank Reconciliation" printContent={printContent} />
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Bank Reconciliation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Match bank lines, apply rule-driven write-offs, create counterparts, and close statement
            differences with full control context.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:settings-bold" />}
            onClick={() => setRuleDialogOpen(true)}
          >
            New Rule
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            component={RouterLink}
            href={paths.dashboard.accountingFinance.banking.bankStatements}
            startIcon={<Iconify icon="solar:document-text-bold" />}
          >
            Open Statement Import
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:verified-check-bold" />}
            onClick={handleFinalize}
          >
            Finalize Reconciliation
          </Button>
        </Stack>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        Recommended actions are generated from reconciliation models, line confidence, and known
        banking references to mimic Odoo-style assisted matching.
      </Alert>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Bank account"
                  value={bank?.id ?? ''}
                  onChange={(event) => setBankId(Number(event.target.value))}
                >
                  {reconcilableAccounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name}
                    </MenuItem>
                  ))}
                </TextField>
                {bank && (
                  <IconButton
                    size="small"
                    component={RouterLink}
                    href={paths.dashboard.accountingFinance.banking.bankAccountDetail(bank.id)}
                    title="View account detail"
                  >
                    <Iconify icon="solar:eye-bold" width={18} />
                  </IconButton>
                )}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Statement period"
                  value={selectedStatement?.id || ''}
                  onChange={(event) => setStatementId(Number(event.target.value))}
                >
                  {accountStatements.map((statement) => (
                    <MenuItem key={statement.id} value={statement.id}>
                      {statement.period}
                    </MenuItem>
                  ))}
                </TextField>
                {selectedStatement && (
                  <IconButton
                    size="small"
                    component={RouterLink}
                    href={paths.dashboard.accountingFinance.banking.reconciliationDetail(
                      selectedStatement.id
                    )}
                    title="View reconciliation detail"
                  >
                    <Iconify icon="solar:eye-bold" width={18} />
                  </IconButton>
                )}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction="row" spacing={1} justifyContent={{ xs: 'stretch', md: 'flex-end' }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  fullWidth
                  startIcon={<Iconify icon="solar:magic-stick-3-bold" />}
                  onClick={handleAutoMatch}
                >
                  Auto-Match
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label="Book balance"
            value={formatAmount(bank?.balance || 0, bank?.currency)}
            helper="Current ledger balance on the selected treasury account"
            color="#1d4ed8"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label="Statement balance"
            value={formatAmount(
              currentReconciliation?.statementBalance || selectedStatement?.closingBalance || 0,
              bank?.currency
            )}
            helper="Imported closing balance from the selected statement"
            color="#0f766e"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label="Difference"
            value={formatAmount(Math.abs(currentReconciliation?.difference || 0), bank?.currency)}
            helper="Zero this balance before completion"
            color="#d97706"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label="Matched lines"
            value={`${matchedLines.length}/${selectedStatement?.lines.length || 0}`}
            helper={`Auto-match rate ${currentReconciliation?.autoMatchRate || 0}%`}
            color="#7c3aed"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label="Auto-resolvable"
            value={autoResolvableLines.length}
            helper="High-confidence suggestions ready for auto processing"
            color="#0891b2"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label="Unresolved exposure"
            value={formatAmount(unresolvedAmount, bank?.currency)}
            helper="Outstanding amount still blocking zero-difference close"
            color="#dc2626"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                spacing={2}
                sx={{ mb: 2 }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Statement lines
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedStatement?.bankAccountName} • {selectedStatement?.period} •{' '}
                    {formatBankingStatus(selectedStatement?.status || 'imported')}
                  </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    onClick={() => applyAction('match')}
                    disabled={!selectedLineIds.length}
                  >
                    Match Selected
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    onClick={() => applyAction('writeoff')}
                    disabled={!selectedLineIds.length}
                  >
                    Write-Off
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    onClick={() => applyAction('counterpart')}
                    disabled={!selectedLineIds.length}
                  >
                    Create Counterpart
                  </Button>
                </Stack>
              </Stack>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" />
                      <TableCell>Statement Date</TableCell>
                      <TableCell>Bank Account</TableCell>
                      <TableCell>Book Balance</TableCell>
                      <TableCell>Statement Balance</TableCell>
                      <TableCell>Difference</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Lines</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bankReconciliations.map((rec) => (
                      <TableRow key={rec.id} hover>
                        <TableCell padding="checkbox" />
                        <TableCell>
                          {rec.statementDate
                            ? new Date(rec.statementDate).toLocaleDateString()
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            {rec.bankAccountName ||
                              accounts.find((a) => a.id === rec.bankAccountId)?.name ||
                              '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatAmount(rec.bookBalance, bank?.currency)}</TableCell>
                        <TableCell>{formatAmount(rec.statementBalance, bank?.currency)}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            color={
                              Math.abs(rec.bookBalance - rec.statementBalance) === 0
                                ? 'success.main'
                                : 'error.main'
                            }
                          >
                            {formatAmount(
                              Math.abs(rec.bookBalance - rec.statementBalance),
                              bank?.currency
                            )}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={formatBankingStatus(rec.status)}
                            size="small"
                            color={STATUS_COLORS[rec.status] || 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            component={RouterLink}
                            href={paths.dashboard.accountingFinance.banking.reconciliationDetail(
                              rec.id
                            )}
                          >
                            View Details
                          </Button>
                        </TableCell>
                        {/* <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="small"
                            component={RouterLink}
                            href={paths.dashboard.accountingFinance.banking.reconciliationDetail(rec.id)}
                          >
                            View Details
                          </Button>
                        </TableCell> */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                Selection workspace
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedLineIds.length
                  ? `${selectedLineIds.length} line(s) selected`
                  : 'Select statement lines to apply a match, write-off, or counterpart journal.'}
              </Typography>
              {selectedLineIds.length > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Selected exposure {formatAmount(selectedLineAmount, bank?.currency)} across{' '}
                  {selectedLineIds.length} line(s).
                </Alert>
              )}
              <TextField
                select
                fullWidth
                size="small"
                label="Write-off model"
                value={writeoffModelId}
                onChange={(event) => setWriteoffModelId(Number(event.target.value))}
                sx={{ mb: 2 }}
              >
                {models.map((model) => (
                  <MenuItem key={model.id} value={model.id}>
                    {model.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                size="small"
                label="Counterpart account"
                value={counterpartLabel}
                onChange={(event) => setCounterpartLabel(event.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Reconciliation note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                sx={{ mb: 2 }}
              />
              <Stack spacing={1}>
                <Button
                  variant="contained"
                  onClick={() => applyAction('match')}
                  disabled={!selectedLineIds.length}
                >
                  Match Selected Lines
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => applyAction('writeoff')}
                  disabled={!selectedLineIds.length}
                >
                  Apply Write-Off Model
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => applyAction('counterpart')}
                  disabled={!selectedLineIds.length}
                >
                  Create Counterpart Entry
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                Suggested engine
              </Typography>
              <Stack spacing={1.5} sx={{ mb: 2.5 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}>
                  <Typography variant="body2" fontWeight={700}>
                    {suggestedLines.length} suggested lines
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Ready for rule-based write-off or counterpart creation.
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}>
                  <Typography variant="body2" fontWeight={700}>
                    {autoResolvableLines.length} high-confidence actions
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    These lines can be auto-resolved by the assisted matching engine.
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}>
                  <Typography variant="body2" fontWeight={700}>
                    {unresolvedLines.length} unresolved lines
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    These lines are still driving the bank-book difference.
                  </Typography>
                </Box>
              </Stack>
              {selectedModel ? (
                <Box
                  sx={{
                    mb: 2.5,
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                    Active write-off simulation
                  </Typography>
                  <Stack spacing={0.75}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Model</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedModel.name}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Account</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedModel.account}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Auto validate</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedModel.autoValidate ? 'Yes' : 'No'}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              ) : null}
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                Active reconciliation models
              </Typography>
              <Stack spacing={1.25}>
                {models.map((model) => (
                  <Box
                    key={model.id}
                    sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
                  >
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {model.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {model.account} • {model.matchLabel}
                        </Typography>
                      </Box>
                      <Chip
                        label={formatBankingStatus(model.type)}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={ruleDialogOpen}
        onClose={() => setRuleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Reconciliation Model</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Model name"
                value={ruleDraft.name}
                onChange={(event) =>
                  setRuleDraft((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Type"
                value={ruleDraft.type}
                onChange={(event) =>
                  setRuleDraft((current) => ({ ...current, type: event.target.value }))
                }
              >
                <MenuItem value="writeoff">Write-off</MenuItem>
                <MenuItem value="suggestion">Suggestion</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Match label"
                value={ruleDraft.matchLabel}
                onChange={(event) =>
                  setRuleDraft((current) => ({ ...current, matchLabel: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Journal"
                value={ruleDraft.matchJournal}
                onChange={(event) =>
                  setRuleDraft((current) => ({ ...current, matchJournal: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Account"
                value={ruleDraft.account}
                onChange={(event) =>
                  setRuleDraft((current) => ({ ...current, account: event.target.value }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRuleDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={createRule}
            disabled={!ruleDraft.name || !ruleDraft.matchLabel || !ruleDraft.account}
          >
            Create Rule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
