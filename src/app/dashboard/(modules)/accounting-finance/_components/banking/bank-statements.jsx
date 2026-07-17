'use client';

import { toast } from 'sonner';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import { Button } from '@mui/material';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
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

const STATUS_COLORS = {
  completed: 'success',
  in_progress: 'warning',
  imported: 'info',
  draft: 'default',
};

const LINE_STATUS_COLORS = {
  matched: 'success',
  writeoff: 'info',
  counterpart_created: 'primary',
  suggested: 'warning',
  unmatched: 'default',
  duplicate: 'error',
};

const EMPTY_IMPORT = {
  bankAccountId: '',
  period: 'Apr 2026',
  startDate: '2026-04-01',
  endDate: '2026-04-30',
  statementDate: '2026-04-30',
  openingBalance: '',
  closingBalance: '',
  source: 'Manual import',
  parser: 'CSV mapping',
  mappingProfile: 'Default cashbook mapping',
  itemsText:
    '2026-04-04 | Mobile collection deposit | MB-2044 | 12500\n2026-04-08 | Bank charge | FEE-APR-01 | -220\n2026-04-10 | Supplier settlement | PAY-9981 | -8300',
};

function SummaryCard({ label, value, helper, icon, color = '#1d4ed8' }) {
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
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: `${color}15`,
              color,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Iconify icon={icon} width={24} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function BankStatements() {
  useCurrency();
  const { accounts, statements, formatBankingStatus, actions } = useBankingWorkspace();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDraft, setImportDraft] = useState(EMPTY_IMPORT);
  const [accountFilter, setAccountFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStatementId, setSelectedStatementId] = useState(null);
  const [selectedStatementLineId, setSelectedStatementLineId] = useState(null);
  const [selectedPreviewLineId, setSelectedPreviewLineId] = useState(null);

  // Populate importDraft.bankAccountId once bank accounts are loaded from the API.
  // The constant EMPTY_IMPORT uses '' as placeholder because accounts are not
  // available at module-evaluation time (SWR resolves asynchronously).
  useEffect(() => {
    if (importDraft.bankAccountId === '' && accounts.length > 0) {
      setImportDraft((prev) => ({ ...prev, bankAccountId: accounts[0].id }));
    }
  }, [accounts, importDraft.bankAccountId]);

  const filteredStatements = useMemo(
    () =>
      statements.filter((statement) => {
        const accountPass =
          accountFilter === 'all' ? true : statement.bankAccountId === Number(accountFilter);
        const statusPass = statusFilter === 'all' ? true : statement.status === statusFilter;
        return accountPass && statusPass;
      }),
    [accountFilter, statements, statusFilter]
  );

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Statement
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Date</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Closing
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Exceptions
          </th>
        </tr>
      </thead>
      <tbody>
        {filteredStatements.map((statement) => (
          <tr key={statement.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {statement.bankAccountName} • {statement.period}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {new Date(statement.statementDate).toLocaleDateString()}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {statement.closingBalance}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {statement.unmatchedCount}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const parsedImportPreview = useMemo(
    () =>
      importDraft.itemsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => {
          const [date = '', description = '', reference = '', amount = '0'] = line
            .split('|')
            .map((part) => part.trim());

          return {
            id: `preview-${index + 1}`,
            date,
            description,
            reference,
            amount: Number(amount || 0),
          };
        }),
    [importDraft.itemsText]
  );

  const existingStatementReferences = useMemo(
    () =>
      new Set(
        statements
          .filter((statement) => statement.bankAccountId === Number(importDraft.bankAccountId))
          .flatMap((statement) =>
            statement.lines.map((line) => String(line.reference || '').toLowerCase())
          )
      ),
    [importDraft.bankAccountId, statements]
  );

  const importQuality = useMemo(() => {
    const duplicateCount = parsedImportPreview.filter((line) =>
      existingStatementReferences.has(String(line.reference || '').toLowerCase())
    ).length;

    return {
      parsedCount: parsedImportPreview.length,
      duplicateCount,
      positiveLines: parsedImportPreview.filter((line) => line.amount >= 0).length,
      negativeLines: parsedImportPreview.filter((line) => line.amount < 0).length,
      mappingCoverage: parsedImportPreview.length
        ? `${parsedImportPreview.length - duplicateCount}/${parsedImportPreview.length}`
        : '0/0',
    };
  }, [existingStatementReferences, parsedImportPreview]);

  const importDiagnostics = useMemo(() => {
    const validDatePattern = /^\d{4}-\d{2}-\d{2}$/;
    const missingReferenceCount = parsedImportPreview.filter(
      (line) => !String(line.reference || '').trim()
    ).length;
    const invalidDateCount = parsedImportPreview.filter(
      (line) => !validDatePattern.test(String(line.date || ''))
    ).length;
    const invalidAmountCount = parsedImportPreview.filter(
      (line) => !Number.isFinite(line.amount)
    ).length;
    const zeroAmountCount = parsedImportPreview.filter(
      (line) => Number.isFinite(line.amount) && Number(line.amount || 0) === 0
    ).length;
    const openingBalance = Number(importDraft.openingBalance || 0);
    const calculatedClosingBalance =
      openingBalance +
      parsedImportPreview.reduce(
        (sum, line) => sum + (Number.isFinite(line.amount) ? Number(line.amount) : 0),
        0
      );
    const providedClosingBalance =
      importDraft.closingBalance === '' ? null : Number(importDraft.closingBalance);
    const balanceDifference =
      providedClosingBalance === null ? 0 : providedClosingBalance - calculatedClosingBalance;
    const blockingIssues = missingReferenceCount + invalidDateCount + invalidAmountCount;

    return {
      missingReferenceCount,
      invalidDateCount,
      invalidAmountCount,
      zeroAmountCount,
      calculatedClosingBalance,
      balanceDifference,
      blockingIssues,
      readyToImport:
        Boolean(importDraft.period) &&
        Boolean(importDraft.itemsText.trim()) &&
        parsedImportPreview.length > 0 &&
        blockingIssues === 0 &&
        Math.abs(balanceDifference) < 0.01,
    };
  }, [
    importDraft.closingBalance,
    importDraft.itemsText,
    importDraft.openingBalance,
    importDraft.period,
    parsedImportPreview,
  ]);

  const selectedStatement =
    filteredStatements.find((statement) => statement.id === selectedStatementId) ||
    filteredStatements[0] ||
    null;
  const duplicateLines = statements.reduce(
    (sum, statement) => sum + Number(statement.duplicateCount || 0),
    0
  );
  const unmatchedLines = statements.reduce(
    (sum, statement) => sum + Number(statement.unmatchedCount || 0),
    0
  );
  const selectedDuplicates =
    selectedStatement?.lines.filter((line) => line.status === 'duplicate') || [];
  const selectedUnmatched =
    selectedStatement?.lines.filter((line) => line.status === 'unmatched') || [];
  const selectedSuggested =
    selectedStatement?.lines.filter((line) => line.status === 'suggested') || [];
  const selectedStatementLine =
    selectedStatement?.lines.find((line) => line.id === selectedStatementLineId) ||
    selectedStatement?.lines[0] ||
    null;
  const selectedPreviewLine =
    parsedImportPreview.find((line) => line.id === selectedPreviewLineId) ||
    parsedImportPreview[0] ||
    null;
  const selectedPreviewLineDuplicate = selectedPreviewLine
    ? existingStatementReferences.has(String(selectedPreviewLine.reference || '').toLowerCase())
    : false;
  const selectedStatementResolvedCount =
    selectedStatement?.lines.filter((line) =>
      ['matched', 'writeoff', 'counterpart_created'].includes(line.status)
    ).length || 0;
  const selectedStatementResolutionRate = selectedStatement?.lines.length
    ? Math.round((selectedStatementResolvedCount / selectedStatement.lines.length) * 100)
    : 0;

  const handleImport = () => {
    if (!importDiagnostics.readyToImport) {
      toast.error('Resolve import control issues before loading the statement');
      return;
    }

    const createdStatementId = actions.importBankStatement(importDraft);
    toast.success('Statement imported into treasury workspace');
    setDialogOpen(false);
    setImportDraft(EMPTY_IMPORT);
    setSelectedStatementId(createdStatementId);
    setSelectedStatementLineId(null);
    setSelectedPreviewLineId(null);
  };

  const handleDialogOpen = () => {
    setDialogOpen(true);
    setSelectedPreviewLineId(parsedImportPreview[0]?.id || null);
  };

  const handleAutoClassify = () => {
    if (!selectedStatement) return;

    actions.runStatementAutoMatch(selectedStatement.id);
    toast.success('Suggested statement lines auto-classified where confidence allows');
  };

  return (
    <Box sx={{ p: 3 }}>
      <BankingWorkspaceToolbar printTitle="Bank Statements" printContent={printContent} />
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Bank Statements
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Import bank files, review mapping quality, isolate duplicates, and hand exceptions
            directly into reconciliation.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            component={RouterLink}
            href={paths.dashboard.accountingFinance.banking.reconciliation}
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:check-circle-bold" />}
          >
            Open Reconciliation
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:upload-minimalistic-bold" />}
            onClick={handleDialogOpen}
          >
            Import Statement
          </Button>
        </Stack>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        Imported lines are tagged as matched, suggested, unmatched, or duplicate so the
        reconciliation screen starts from real control points instead of a flat file view.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label="Statements loaded"
            value={statements.length}
            helper="Manual upload and bank-feed batches combined"
            icon="solar:document-text-bold"
            color="#1d4ed8"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label="Unmatched items"
            value={unmatchedLines}
            helper="Items still waiting for manual review or automated rule handling"
            icon="solar:danger-circle-bold"
            color="#d97706"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label="Duplicate risk"
            value={duplicateLines}
            helper="Potentially duplicated bank lines detected during import"
            icon="solar:copy-bold"
            color="#dc2626"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label="Completed reconciliations"
            value={statements.filter((statement) => statement.status === 'completed').length}
            helper="Statements with no remaining unresolved lines"
            icon="solar:verified-check-bold"
            color="#059669"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Bank account"
                    value={accountFilter}
                    onChange={(event) => setAccountFilter(event.target.value)}
                  >
                    <MenuItem value="all">All accounts</MenuItem>
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
                    size="small"
                    label="Status"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <MenuItem value="all">All status</MenuItem>
                    <MenuItem value="imported">Imported</MenuItem>
                    <MenuItem value="in_progress">In progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Statement</TableCell>
                    <TableCell>Parser</TableCell>
                    <TableCell align="right">Closing</TableCell>
                    <TableCell align="right">Exceptions</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStatements.map((statement) => (
                    <TableRow
                      key={statement.id}
                      hover
                      selected={statement.id === selectedStatement?.id}
                      onClick={() => setSelectedStatementId(statement.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {statement.bankAccountName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {statement.period} •{' '}
                          {new Date(statement.statementDate).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{statement.parser}</Typography>
                        <Chip
                          label={formatBankingStatus(statement.status)}
                          size="small"
                          color={STATUS_COLORS[statement.status]}
                          sx={{ mt: 0.75 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(statement.closingBalance)}
                      </TableCell>
                      <TableCell align="right">{statement.unmatchedCount}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="small"
                          component={RouterLink}
                          href={paths.dashboard.accountingFinance.banking.bankStatementDetail(
                            statement.id
                          )}
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
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          {selectedStatement ? (
            <Stack spacing={3}>
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
                        {selectedStatement.bankAccountName} • {selectedStatement.period}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedStatement.source} via {selectedStatement.parser} • Mapping{' '}
                        {selectedStatement.mappingProfile}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip
                        label={`${selectedStatement.importedLines} lines`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`${selectedStatement.duplicateCount} duplicates`}
                        size="small"
                        color={selectedStatement.duplicateCount ? 'error' : 'default'}
                      />
                      <Chip
                        label={`${selectedStatement.unmatchedCount} open items`}
                        size="small"
                        color={selectedStatement.unmatchedCount ? 'warning' : 'success'}
                      />
                      <Chip
                        label={`${selectedStatementResolutionRate}% resolved`}
                        size="small"
                        color={selectedStatementResolutionRate === 100 ? 'success' : 'info'}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleAutoClassify}
                        disabled={!selectedSuggested.length}
                      >
                        Auto-classify suggested
                      </Button>
                      <Button
                        component={RouterLink}
                        href={paths.dashboard.accountingFinance.banking.reconciliation}
                        size="small"
                        variant="outlined"
                        color="inherit"
                      >
                        Send To Reconciliation
                      </Button>
                    </Stack>
                  </Stack>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Opening balance
                      </Typography>
                      <Typography variant="body1" fontWeight={700}>
                        {formatCurrency(selectedStatement.openingBalance)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Closing balance
                      </Typography>
                      <Typography variant="body1" fontWeight={700}>
                        {formatCurrency(selectedStatement.closingBalance)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Import batch
                      </Typography>
                      <Typography variant="body1" fontWeight={700}>
                        {selectedStatement.feedBatch}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Alert
                        severity={selectedDuplicates.length ? 'error' : 'success'}
                        sx={{ borderRadius: 2 }}
                      >
                        Duplicate review:{' '}
                        {selectedDuplicates.length
                          ? `${selectedDuplicates.length} flagged`
                          : 'clear'}
                      </Alert>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Alert
                        severity={selectedUnmatched.length ? 'warning' : 'success'}
                        sx={{ borderRadius: 2 }}
                      >
                        Unmatched queue: {selectedUnmatched.length}
                      </Alert>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Alert
                        severity={selectedSuggested.length ? 'info' : 'success'}
                        sx={{ borderRadius: 2 }}
                      >
                        Suggested matches: {selectedSuggested.length}
                      </Alert>
                    </Grid>
                  </Grid>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Reference</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Recommendation</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedStatement.lines.map((line) => (
                          <TableRow
                            key={line.id}
                            hover
                            selected={line.id === selectedStatementLine?.id}
                            onClick={() => setSelectedStatementLineId(line.id)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell>{new Date(line.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {line.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Confidence {line.confidence}%
                              </Typography>
                            </TableCell>
                            <TableCell>{line.reference}</TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                color={line.amount >= 0 ? 'success.main' : 'error.main'}
                              >
                                {formatCurrency(Math.abs(line.amount))}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={formatBankingStatus(line.status)}
                                size="small"
                                color={LINE_STATUS_COLORS[line.status]}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{line.recommendation}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {line.counterpartLabel}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ borderRadius: 3, height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                        Selected Line Review
                      </Typography>
                      {selectedStatementLine ? (
                        <Stack spacing={1.5}>
                          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}>
                            <Typography variant="body2" fontWeight={700}>
                              {selectedStatementLine.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {selectedStatementLine.reference || 'Missing reference'} •{' '}
                              {new Date(selectedStatementLine.date).toLocaleDateString()}
                            </Typography>
                          </Box>
                          <Grid container spacing={1.5}>
                            <Grid size={{ xs: 6 }}>
                              <Alert
                                severity={
                                  selectedStatementLine.status === 'duplicate' ? 'error' : 'info'
                                }
                                sx={{ borderRadius: 2 }}
                              >
                                Status: {formatBankingStatus(selectedStatementLine.status)}
                              </Alert>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <Alert
                                severity={
                                  selectedStatementLine.confidence >= 90
                                    ? 'success'
                                    : selectedStatementLine.confidence >= 70
                                      ? 'info'
                                      : 'warning'
                                }
                                sx={{ borderRadius: 2 }}
                              >
                                Confidence: {selectedStatementLine.confidence}%
                              </Alert>
                            </Grid>
                          </Grid>
                          <Divider />
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700}>
                              Recommended action
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {selectedStatementLine.recommendation}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700}>
                              Counterpart route
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {selectedStatementLine.counterpartLabel}
                            </Typography>
                          </Box>
                          <Alert
                            severity={selectedStatementLine.note ? 'warning' : 'info'}
                            sx={{ borderRadius: 2 }}
                          >
                            {selectedStatementLine.note ||
                              'No exception note recorded yet. Use reconciliation for final posting action.'}
                          </Alert>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Select a line to review its import recommendation and exception posture.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ borderRadius: 3, height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                        Duplicate Review
                      </Typography>
                      <Stack spacing={1.5}>
                        {selectedDuplicates.length ? (
                          selectedDuplicates.map((line) => (
                            <Box
                              key={line.id}
                              sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                            >
                              <Typography variant="body2" fontWeight={700}>
                                {line.reference}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {line.description} -{' '}
                                {line.note || 'Reference already exists in prior statement history'}
                              </Typography>
                            </Box>
                          ))
                        ) : (
                          <Alert severity="success" sx={{ borderRadius: 2 }}>
                            No duplicate references are flagged on this statement.
                          </Alert>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ borderRadius: 3, height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                        Mapping And Handoff
                      </Typography>
                      <Stack spacing={1.5}>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}>
                          <Typography variant="body2" fontWeight={700}>
                            Parser
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {selectedStatement.parser}
                          </Typography>
                        </Box>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}>
                          <Typography variant="body2" fontWeight={700}>
                            Mapping profile
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {selectedStatement.mappingProfile}
                          </Typography>
                        </Box>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}>
                          <Typography variant="body2" fontWeight={700}>
                            Reconciliation handoff
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {selectedStatement.unmatchedCount} unresolved lines are ready for
                            assisted matching, write-off, or counterpart creation.
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Stack>
          ) : (
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  No statements match the current filter.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import Bank Statement</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Bank account"
                value={importDraft.bankAccountId}
                onChange={(event) =>
                  setImportDraft((current) => ({
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
                label="Statement period"
                value={importDraft.period}
                onChange={(event) =>
                  setImportDraft((current) => ({ ...current, period: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="date"
                label="Start date"
                value={importDraft.startDate}
                onChange={(event) =>
                  setImportDraft((current) => ({ ...current, startDate: event.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="date"
                label="End date"
                value={importDraft.endDate}
                onChange={(event) =>
                  setImportDraft((current) => ({ ...current, endDate: event.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="date"
                label="Statement date"
                value={importDraft.statementDate}
                onChange={(event) =>
                  setImportDraft((current) => ({ ...current, statementDate: event.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Opening balance"
                value={importDraft.openingBalance}
                onChange={(event) =>
                  setImportDraft((current) => ({ ...current, openingBalance: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Closing balance (optional)"
                value={importDraft.closingBalance}
                onChange={(event) =>
                  setImportDraft((current) => ({ ...current, closingBalance: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Source"
                value={importDraft.source}
                onChange={(event) =>
                  setImportDraft((current) => ({ ...current, source: event.target.value }))
                }
              >
                <MenuItem value="Manual import">Manual import</MenuItem>
                <MenuItem value="Bank feed">Bank feed</MenuItem>
                <MenuItem value="SWIFT upload">SWIFT upload</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Parser"
                value={importDraft.parser}
                onChange={(event) =>
                  setImportDraft((current) => ({ ...current, parser: event.target.value }))
                }
                helperText="Examples: CSV mapping, MT940, CAMT.053"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Mapping profile"
                value={importDraft.mappingProfile}
                onChange={(event) =>
                  setImportDraft((current) => ({ ...current, mappingProfile: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={6}
                label="Import lines"
                value={importDraft.itemsText}
                onChange={(event) =>
                  setImportDraft((current) => ({ ...current, itemsText: event.target.value }))
                }
                helperText="One transaction per line: date | description | reference | amount"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Alert
                severity={importQuality.parsedCount ? 'success' : 'info'}
                sx={{ borderRadius: 2 }}
              >
                Parsed rows: {importQuality.parsedCount}
              </Alert>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Alert
                severity={importQuality.duplicateCount ? 'error' : 'success'}
                sx={{ borderRadius: 2 }}
              >
                Duplicate references: {importQuality.duplicateCount}
              </Alert>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Mapping coverage: {importQuality.mappingCoverage}
              </Alert>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Alert
                severity={
                  importDiagnostics.readyToImport
                    ? 'success'
                    : importDiagnostics.blockingIssues
                      ? 'error'
                      : 'warning'
                }
                sx={{ borderRadius: 2 }}
              >
                {importDiagnostics.readyToImport
                  ? 'Import controls are satisfied. This statement is ready to load into the workspace.'
                  : `Review import controls: ${importDiagnostics.missingReferenceCount} missing references, ${importDiagnostics.invalidDateCount} invalid dates, ${importDiagnostics.invalidAmountCount} invalid amounts, ${importDiagnostics.zeroAmountCount} zero-amount lines, balance variance ${formatCurrency(Math.abs(importDiagnostics.balanceDifference))}.`}
              </Alert>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Alert
                severity={importDiagnostics.missingReferenceCount ? 'error' : 'success'}
                sx={{ borderRadius: 2 }}
              >
                Missing references: {importDiagnostics.missingReferenceCount}
              </Alert>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Alert
                severity={
                  importDiagnostics.invalidDateCount || importDiagnostics.invalidAmountCount
                    ? 'error'
                    : 'success'
                }
                sx={{ borderRadius: 2 }}
              >
                Parse errors:{' '}
                {importDiagnostics.invalidDateCount + importDiagnostics.invalidAmountCount}
              </Alert>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Alert
                severity={
                  Math.abs(importDiagnostics.balanceDifference) >= 0.01 ? 'warning' : 'success'
                }
                sx={{ borderRadius: 2 }}
              >
                Balance variance: {formatCurrency(Math.abs(importDiagnostics.balanceDifference))}
              </Alert>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                    Import Preview
                  </Typography>
                  <Stack spacing={1.25}>
                    {parsedImportPreview.slice(0, 5).map((line) => {
                      const duplicate = existingStatementReferences.has(
                        String(line.reference || '').toLowerCase()
                      );

                      return (
                        <Stack
                          key={line.id}
                          direction={{ xs: 'column', md: 'row' }}
                          justifyContent="space-between"
                          spacing={1}
                          onClick={() => setSelectedPreviewLineId(line.id)}
                          sx={{
                            cursor: 'pointer',
                            p: 1,
                            borderRadius: 2,
                            bgcolor:
                              line.id === selectedPreviewLine?.id
                                ? 'action.selected'
                                : 'transparent',
                          }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              {line.description || 'Unparsed line'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {line.date} • {line.reference || 'Missing reference'}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" fontWeight={700}>
                              {formatCurrency(Math.abs(line.amount || 0))}
                            </Typography>
                            <Chip
                              label={duplicate ? 'duplicate risk' : 'mapped'}
                              size="small"
                              color={duplicate ? 'error' : 'success'}
                            />
                          </Stack>
                        </Stack>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                    Selected Preview Line
                  </Typography>
                  {selectedPreviewLine ? (
                    <Stack spacing={1.5}>
                      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}>
                        <Typography variant="body2" fontWeight={700}>
                          {selectedPreviewLine.description || 'Unparsed line'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {selectedPreviewLine.date || 'Missing date'} •{' '}
                          {selectedPreviewLine.reference || 'Missing reference'}
                        </Typography>
                      </Box>
                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Alert
                            severity={selectedPreviewLineDuplicate ? 'error' : 'success'}
                            sx={{ borderRadius: 2 }}
                          >
                            {selectedPreviewLineDuplicate
                              ? 'Duplicate risk found'
                              : 'Reference is clear'}
                          </Alert>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Alert
                            severity={selectedPreviewLine.reference ? 'success' : 'error'}
                            sx={{ borderRadius: 2 }}
                          >
                            {selectedPreviewLine.reference
                              ? 'Reference present'
                              : 'Reference required'}
                          </Alert>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Alert
                            severity={
                              Number.isFinite(selectedPreviewLine.amount) ? 'info' : 'error'
                            }
                            sx={{ borderRadius: 2 }}
                          >
                            Amount:{' '}
                            {Number.isFinite(selectedPreviewLine.amount)
                              ? formatCurrency(Math.abs(selectedPreviewLine.amount))
                              : 'Invalid'}
                          </Alert>
                        </Grid>
                      </Grid>
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Select an imported row to inspect its parser quality before loading the
                      statement.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={!importDiagnostics.readyToImport}
          >
            Import and Map
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
