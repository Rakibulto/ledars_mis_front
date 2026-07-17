'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Step from '@mui/material/Step';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Stepper from '@mui/material/Stepper';
import TableRow from '@mui/material/TableRow';
import StepLabel from '@mui/material/StepLabel';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import StepContent from '@mui/material/StepContent';
import DialogTitle from '@mui/material/DialogTitle';
import CardContent from '@mui/material/CardContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useYearEndWorkspace } from './use-year-end-workspace';
import { YearEndWorkspaceToolbar } from './year-end-workspace-toolbar';
import {
  exportYearEndCsv,
  printYearEndPack,
  exportYearEndJson,
  exportYearEndExcel,
} from './year-end-export';

const STEP_TONES = {
  complete: 'success.main',
  current: 'warning.main',
  upcoming: 'text.secondary',
};

const VALIDATION_TONES = {
  pass: 'success',
  warning: 'warning',
  fail: 'error',
};

export default function YearEndClosing() {
  const [pendingAction, setPendingAction] = useState(null);
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState(
    'Post-close audit adjustment required for final retained earnings allocation.'
  );
  const {
    selectedFiscalYearId,
    fiscalYears,
    overview,
    alerts,
    steps,
    closingHistory,
    validation,
    closingEntries,
    auditTrail,
    reopenStatus,
    openingBatch,
    exceptionPermissions,
    actions,
  } = useYearEndWorkspace();
  const selectedYear = fiscalYears.find((year) => year.id === selectedFiscalYearId);
  const lastClosed = closingHistory[0];
  const activeExceptions = exceptionPermissions.filter((item) => item.active);

  const exportConfig = useMemo(
    () => ({
      title: 'Year-End Close Workspace',
      subtitle: selectedYear?.name || 'Fiscal year close',
      alerts,
      summary: [
        { label: 'Total income', value: formatCurrency(overview.totalIncome) },
        { label: 'Total expenses', value: formatCurrency(overview.totalExpenses) },
        { label: 'Retained earnings movement', value: formatCurrency(overview.retainedEarnings) },
        { label: 'Periods locked', value: `${overview.closedPeriods}/${overview.totalPeriods}` },
      ],
      tables: [
        {
          title: 'Close Workflow',
          columns: [
            { key: 'label', label: 'Step' },
            { key: 'status', label: 'Status' },
            { key: 'helper', label: 'Review Note' },
          ],
          rows: steps,
        },
        {
          title: 'Validation Checks',
          columns: [
            { key: 'label', label: 'Check' },
            { key: 'status', label: 'Status' },
            { key: 'detail', label: 'Detail' },
          ],
          rows: validation.checks,
        },
        {
          title: 'Auto Generated Closing Entries',
          columns: [
            { key: 'reference', label: 'Reference' },
            { key: 'account_name', label: 'Account' },
            { key: 'debit', label: 'Debit' },
            { key: 'credit', label: 'Credit' },
            { key: 'status', label: 'Status' },
          ],
          rows: closingEntries.map((entry) => ({
            ...entry,
            debit: entry.debit ? formatCurrency(entry.debit) : '-',
            credit: entry.credit ? formatCurrency(entry.credit) : '-',
          })),
        },
      ],
      controlChecks: [
        {
          label: 'Close readiness',
          description:
            'Validation and exception posture should be reviewed before publish or reopen.',
          status: validation.checks.every((item) => item.status === 'pass') ? 'success' : 'warning',
          value: validation.checks.every((item) => item.status === 'pass')
            ? 'ready'
            : 'review required',
        },
      ],
      payload: { selectedYear, overview, steps, validation, closingEntries, auditTrail },
    }),
    [alerts, auditTrail, closingEntries, overview, selectedYear, steps, validation]
  );

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
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Close Step
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Status
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Review Note
            </th>
          </tr>
        </thead>
        <tbody>
          {steps.map((step, idx) => (
            <tr key={idx}>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{step.label}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{step.status}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{step.helper}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontWeight: 700, fontSize: 12, margin: '8px 0 4px' }}>Validation Checks</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Check
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Status
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Detail
            </th>
          </tr>
        </thead>
        <tbody>
          {(validation.checks || []).map((check, idx) => (
            <tr key={idx}>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{check.label}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{check.status}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{check.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontWeight: 700, fontSize: 12, margin: '8px 0 4px' }}>Closing Entries</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Reference
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Account
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              Debit
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              Credit
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {closingEntries.map((entry, idx) => (
            <tr key={idx}>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{entry.reference}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{entry.account_name}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {entry.debit}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {entry.credit}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{entry.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

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
            Year-End Closing
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Close cockpit for validation, auto-generated closing entries, controller audit trail,
            and reopen control.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:shield-check-bold" />}
            onClick={() =>
              runAction(
                'Validate Year-End Close',
                () => Promise.resolve(actions.validateClosing(selectedFiscalYearId)),
                'Year-end validation completed'
              )
            }
            disabled={pendingAction !== null}
          >
            Validate Close
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:check-circle-bold" />}
            onClick={() =>
              runAction(
                'Publish Year-End Close',
                () => Promise.resolve(actions.completeClosing(selectedFiscalYearId)),
                'Year-end close published'
              )
            }
            disabled={pendingAction !== null}
          >
            Publish Close
          </Button>
        </Stack>
      </Stack>

      <YearEndWorkspaceToolbar
        fiscalYears={fiscalYears}
        selectedFiscalYearId={selectedFiscalYearId}
        onFiscalYearChange={actions.setFiscalYear}
        exportDisabled={pendingAction !== null}
        onExportExcel={() =>
          runAction(
            'Export Close Workbook',
            () => exportYearEndExcel('year-end-closing', exportConfig),
            'Year-end workbook exported'
          )
        }
        onExportCsv={() =>
          runAction(
            'Export Close CSV',
            () => exportYearEndCsv('year-end-closing', exportConfig),
            'Year-end CSV exported'
          )
        }
        onExportJson={() =>
          runAction(
            'Export Close JSON',
            () => exportYearEndJson('year-end-closing', exportConfig),
            'Year-end JSON exported'
          )
        }
        printTitle="Year-End Closing"
        printContent={printContent}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          color="warning"
          onClick={() => setReopenDialogOpen(true)}
          disabled={pendingAction !== null}
        >
          Reopen Close
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: 'Total income',
            value: formatCurrency(overview.totalIncome),
            icon: 'solar:chart-2-bold-duotone',
          },
          {
            label: 'Total expenses',
            value: formatCurrency(overview.totalExpenses),
            icon: 'solar:chart-square-bold-duotone',
          },
          {
            label: 'Retained earnings',
            value: formatCurrency(overview.retainedEarnings),
            icon: 'solar:wallet-money-bold-duotone',
          },
          {
            label: 'Active exceptions',
            value: activeExceptions.length,
            icon: 'solar:danger-triangle-bold-duotone',
          },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, xl: 3 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                      {item.value}
                    </Typography>
                  </Box>
                  <Iconify icon={item.icon} width={28} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: 'Validation posture',
            value: validation.checks.every((item) => item.status === 'pass') ? 'Ready' : 'Review',
            helper: `${validation.checks.filter((item) => item.status !== 'pass').length} checks still need attention`,
            tone: validation.checks.every((item) => item.status === 'pass')
              ? 'success.main'
              : 'warning.main',
          },
          {
            label: 'Opening batch handoff',
            value: openingBatch.batchStatus,
            helper: `${openingBatch.entries.length} carry-forward entries prepared for next year`,
            tone: openingBatch.batchStatus === 'published' ? 'success.main' : 'info.main',
          },
          {
            label: 'Reopen posture',
            value: reopenStatus ? 'Approved' : 'Closed',
            helper: reopenStatus
              ? `${reopenStatus.requestedBy} approved a reopen request`
              : 'No reopen request is active',
            tone: reopenStatus ? 'warning.main' : 'text.primary',
          },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ mt: 0.75, color: item.tone }}>
                  {item.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  {item.helper}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Stack spacing={2} sx={{ mb: 3 }}>
        {alerts.map((alert) => (
          <Alert key={alert.id} severity={alert.severity} sx={{ borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={700}>
              {alert.title}
            </Typography>
            <Typography variant="caption">{alert.description}</Typography>
          </Alert>
        ))}
        {reopenStatus ? (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={700}>
              Reopen approved by {reopenStatus.requestedBy}
            </Typography>
            <Typography variant="caption">
              {reopenStatus.requestedAt} - {reopenStatus.reason}
            </Typography>
          </Alert>
        ) : null}
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Close Workflow
                </Typography>
                <Stepper orientation="vertical">
                  {steps.map((step) => (
                    <Step
                      key={step.id}
                      active={step.status === 'current'}
                      completed={step.status === 'complete'}
                    >
                      <StepLabel>
                        <Typography fontWeight={700} color={STEP_TONES[step.status]}>
                          {step.label}
                        </Typography>
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {step.description}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mb: 2 }}
                        >
                          {step.helper}
                        </Typography>
                        {step.status !== 'complete' && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              runAction(
                                `Advance ${step.label}`,
                                () => Promise.resolve(actions.advanceStep(selectedFiscalYearId)),
                                `${step.label} recorded`
                              )
                            }
                            disabled={pendingAction !== null}
                          >
                            Mark Reviewed
                          </Button>
                        )}
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6" fontWeight={700}>
                    Validation Checks
                  </Typography>
                  <Chip
                    label={
                      validation.validatedAt
                        ? `Validated ${validation.validatedAt}`
                        : 'Pending validation'
                    }
                    size="small"
                    color={validation.validatedAt ? 'success' : 'warning'}
                  />
                </Stack>
                <Stack spacing={1.5}>
                  {validation.checks.map((check) => (
                    <Box
                      key={check.id}
                      sx={{ p: 2, borderRadius: 2, bgcolor: 'background.neutral' }}
                    >
                      <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            {check.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {check.detail}
                          </Typography>
                        </Box>
                        <Chip
                          label={check.status}
                          size="small"
                          color={VALIDATION_TONES[check.status]}
                        />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Auto Generated Closing Entries
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Reference</TableCell>
                        <TableCell>Journal</TableCell>
                        <TableCell>Account</TableCell>
                        <TableCell align="right">Debit</TableCell>
                        <TableCell align="right">Credit</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {closingEntries.map((entry) => (
                        <TableRow key={entry.id} hover>
                          <TableCell>{entry.reference}</TableCell>
                          <TableCell>{entry.journal}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>
                              {entry.account_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {entry.note}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {entry.debit ? formatCurrency(entry.debit) : '-'}
                          </TableCell>
                          <TableCell align="right">
                            {entry.credit ? formatCurrency(entry.credit) : '-'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={entry.status}
                              size="small"
                              color={
                                entry.status === 'posted'
                                  ? 'success'
                                  : entry.status === 'validated'
                                    ? 'info'
                                    : 'warning'
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Controller Snapshot
                </Typography>
                <Stack spacing={1.5}>
                  <Typography variant="body2">
                    Selected year: <strong>{selectedYear?.name || 'N/A'}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Opening pack: <strong>{openingBatch.batchStatus}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Last closed year: <strong>{lastClosed?.fiscal_year || 'None'}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Published by: <strong>{lastClosed?.closed_by || 'Pending'}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Validated by: <strong>{validation.validatedBy || 'Pending'}</strong>
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Carry-Forward Automation
                </Typography>
                <Stack spacing={1.5}>
                  <Typography variant="body2">
                    Batch status: <strong>{openingBatch.batchStatus}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Generated by: <strong>{openingBatch.generatedBy || 'Pending'}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Carry-forward lines: <strong>{openingBatch.entries.length}</strong>
                  </Typography>
                  <Alert
                    severity={
                      openingBatch.batchStatus === 'posted'
                        ? 'success'
                        : openingBatch.batchStatus === 'generated'
                          ? 'warning'
                          : 'info'
                    }
                    sx={{ borderRadius: 2 }}
                  >
                    {openingBatch.batchStatus === 'posted'
                      ? 'Opening balances are already posted to the next fiscal year.'
                      : openingBatch.batchStatus === 'generated'
                        ? 'Opening balances are prepared but still need publication.'
                        : 'Generate the carry-forward batch before relying on next-year opening balances.'}
                  </Alert>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                    <Button
                      variant="outlined"
                      onClick={() =>
                        runAction(
                          'Generate Carry-Forward Batch',
                          () =>
                            Promise.resolve(actions.generateOpeningEntries(selectedFiscalYearId)),
                          'Carry-forward batch generated'
                        )
                      }
                      disabled={pendingAction !== null}
                    >
                      Generate Batch
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() =>
                        runAction(
                          'Publish Carry-Forward Batch',
                          () =>
                            Promise.resolve(actions.publishOpeningEntries(selectedFiscalYearId)),
                          'Carry-forward batch published'
                        )
                      }
                      disabled={pendingAction !== null || openingBatch.batchStatus === 'posted'}
                    >
                      Publish Batch
                    </Button>
                    <Button
                      component={RouterLink}
                      href={paths.dashboard.accountingFinance.yearEnd.openingEntries}
                      variant="outlined"
                      color="inherit"
                    >
                      Open Opening Entries
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Exception Handling
                </Typography>
                <Stack spacing={1.5}>
                  {exceptionPermissions.map((entry) => (
                    <Box
                      key={entry.id}
                      sx={{ p: 2, borderRadius: 2, bgcolor: 'background.neutral' }}
                    >
                      <Stack direction="row" justifyContent="space-between" spacing={1}>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            {entry.role}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {entry.scope} - {entry.reason}
                          </Typography>
                        </Box>
                        <Chip
                          label={entry.active ? 'active' : 'inactive'}
                          size="small"
                          color={entry.active ? 'warning' : 'default'}
                        />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Audit Trail
                </Typography>
                <Stack spacing={1.5} divider={<Divider flexItem />}>
                  {auditTrail.map((entry) => (
                    <Box key={entry.id}>
                      <Stack direction="row" justifyContent="space-between" spacing={1}>
                        <Typography variant="body2" fontWeight={700}>
                          {entry.action}
                        </Typography>
                        <Chip
                          label={entry.status}
                          size="small"
                          color={entry.status === 'warning' ? 'warning' : 'success'}
                        />
                      </Stack>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5 }}
                      >
                        {entry.timestamp} - {entry.actor}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                        {entry.detail}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          onClick={() =>
            runAction(
              'Export Close CSV',
              () => exportYearEndCsv('year-end-closing', exportConfig),
              'Year-end CSV exported'
            )
          }
          disabled={pendingAction !== null}
        >
          Export CSV
        </Button>
        <Button
          variant="outlined"
          onClick={() =>
            runAction(
              'Export Close JSON',
              () => exportYearEndJson('year-end-closing', exportConfig),
              'Year-end JSON exported'
            )
          }
          disabled={pendingAction !== null}
        >
          Export JSON
        </Button>
        <Button
          variant="outlined"
          onClick={() =>
            runAction(
              'Print Close Pack',
              () => printYearEndPack(exportConfig),
              'Year-end close pack opened'
            )
          }
          disabled={pendingAction !== null}
        >
          Print Pack
        </Button>
      </Stack>

      <Dialog
        open={reopenDialogOpen}
        onClose={() => setReopenDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Reopen Year-End Close</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              Reopen should only be used when a post-close adjustment, audit exception, or corrected
              controller entry is fully documented.
            </Alert>
            <TextField
              multiline
              minRows={4}
              label="Reopen reason"
              value={reopenReason}
              onChange={(event) => setReopenReason(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReopenDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            color="warning"
            variant="contained"
            onClick={async () => {
              await runAction(
                'Reopen Year-End Close',
                () => Promise.resolve(actions.reopenClosing(selectedFiscalYearId, reopenReason)),
                'Year-end close reopened'
              );
              setReopenDialogOpen(false);
            }}
            disabled={pendingAction !== null}
          >
            Confirm Reopen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
