'use client';

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
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import CardContent from '@mui/material/CardContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useRouteFilters } from './use-route-filters';
import { useReceivablesWorkspace } from './use-receivables-workspace';
import { useReceivablesApiActions } from './use-receivables-api-actions';
import { exportReceivablesCsv, exportReceivablesExcel } from './receivables-export';
import { getNextCollectionStage, RECEIVABLE_COLLECTION_STAGE_ORDER } from './mock-data';

const PRIORITY_COLORS = {
  routine: 'info',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

export default function CollectionFollowUp() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [emailDraft, setEmailDraft] = useState({
    subject: 'Receivables Reminder Batch',
    note: 'Please review the attached overdue receivables and confirm settlement dates.',
  });
  const [workflowDraft, setWorkflowDraft] = useState({
    stage: 'Negotiation',
    template: 'Collector escalation template',
    promiseToPay: '2026-04-05',
    note: 'Escalation batch prepared for aged receivables.',
  });
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);
  const { hasLiveInvoices, sendMockInvoices } = useReceivablesApiActions();
  const { filters, updateFilter, buildHref } = useRouteFilters([
    {
      key: 'priority',
      defaultValue: 'all',
      allowedValues: ['all', 'routine', 'medium', 'high', 'critical'],
    },
    {
      key: 'stage',
      defaultValue: 'all',
    },
  ]);
  const { collectionQueue, actions } = useReceivablesWorkspace();

  const rows = useMemo(
    () =>
      collectionQueue.filter((invoice) => {
        if (filters.priority !== 'all' && invoice.priority !== filters.priority) return false;
        if (filters.stage !== 'all' && invoice.followUpStage !== filters.stage) return false;
        return true;
      }),
    [collectionQueue, filters.priority, filters.stage]
  );

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Invoice
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Customer
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Stage</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Priority
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Balance
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((invoice) => (
          <tr key={invoice.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{invoice.number}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {invoice.customer?.name}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {invoice.followUpStage}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{invoice.priority}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {formatCurrency(invoice.balanceDue)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const stageOptions = useMemo(
    () => ['all', ...RECEIVABLE_COLLECTION_STAGE_ORDER],
    []
  );

  const getAdvanceLabel = (nextStage) => {
    switch (nextStage) {
      case 'Reminder sent':
        return 'Send reminder';
      case 'Negotiation':
        return 'Negotiate';
      case 'Promise secured':
        return 'Secure promise';
      case 'Payment plan draft':
        return 'Draft plan';
      case 'Awaiting approval':
        return 'Request approval';
      case 'Escalated':
        return 'Escalate';
      case 'Executive escalation':
        return 'Executive escalate';
      case 'Executive review':
        return 'Review';
      case 'Closed':
        return 'Close';
      default:
        return `Next: ${nextStage}`;
    }
  };

  const critical = rows.filter((item) => item.priority === 'critical').length;
  const exportConfig = {
    title: 'Collection Follow-Up Queue',
    subtitle: 'Receivables follow-up workflow',
    summary: [
      { label: 'Queue items', value: rows.length },
      { label: 'Promise-to-pay secured', value: rows.filter((item) => item.promiseToPay).length },
      { label: 'Disputed items', value: rows.filter((item) => item.disputed).length },
    ],
    tables: [
      {
        title: 'Follow-Up Queue',
        columns: [
          { key: 'invoice', label: 'Invoice' },
          { key: 'customer', label: 'Customer' },
          { key: 'stage', label: 'Stage' },
          { key: 'priority', label: 'Priority' },
          { key: 'balance', label: 'Balance' },
        ],
        rows: rows.map((invoice) => ({
          invoice: invoice.number,
          customer: invoice.customer?.name,
          stage: invoice.followUpStage,
          priority: invoice.priority,
          balance: formatCurrency(invoice.balanceDue),
        })),
      },
    ],
    payload: { queue: rows, emailDraft, priority: filters.priority },
  };

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

  const launchReminderBatch = () => {
    setDialogOpen(true);
  };

  const confirmReminderBatch = async () => {
    const liveSync = hasLiveInvoices ? await sendMockInvoices(rows) : null;

    if (liveSync?.failed && !liveSync.synced && !liveSync.skipped) {
      throw new Error(liveSync.errorMessage || 'Unable to sync reminder batch to live invoices.');
    }

    actions.applyReminderBatch(
      rows.map((invoice) => invoice.id),
      { subject: emailDraft.subject, note: emailDraft.note }
    );
    setDialogOpen(false);

    if (liveSync?.synced) {
      toast.info(`Synced ${liveSync.synced} live invoice reminders.`);
    }

    toast.success('Bulk reminder workflow recorded in mock queue');
  };

  const applyBulkWorkflow = () => {
    actions.applyCollectionWorkflow(selectedIds, workflowDraft);
    setWorkflowOpen(false);
    setSelectedIds([]);
    toast.success('Bulk collection workflow applied');
  };

  const toggleSelected = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
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
            Collection Follow-Up
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Follow-up queue with stages, promises to pay, reminder templates, and escalation
            control.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            onClick={() =>
              runAction(
                'Export Queue Excel',
                () => exportReceivablesExcel('collection-follow-up', exportConfig),
                'Collection queue workbook exported'
              )
            }
            disabled={pendingAction !== null}
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            onClick={() =>
              runAction(
                'Export Queue CSV',
                () => exportReceivablesCsv('collection-follow-up', exportConfig),
                'Collection queue CSV exported'
              )
            }
            disabled={pendingAction !== null}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            onClick={() => setPrintOpen(true)}
            disabled={pendingAction !== null}
          >
            Print Pack
          </Button>

          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:settings-bold" />}
            onClick={() => setWorkflowOpen(true)}
            disabled={!selectedIds.length}
          >
            Bulk Workflow
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:letter-bold" />}
            onClick={launchReminderBatch}
          >
            Bulk Reminder
          </Button>
        </Stack>
      </Stack>

      <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
        {critical} critical receivable items require executive or controller escalation in the
        current mock workflow.
      </Alert>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <TextField
            select
            size="small"
            label="Priority"
            value={filters.priority}
            onChange={(event) => updateFilter('priority', event.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="all">All priorities</MenuItem>
            <MenuItem value="routine">Routine</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Stage"
            value={filters.stage}
            onChange={(event) => updateFilter('stage', event.target.value)}
            sx={{ minWidth: 240, mt: { xs: 2, md: 0 }, ml: { md: 2 } }}
          >
            {stageOptions.map((stage) => (
              <MenuItem key={stage} value={stage}>
                {stage === 'all' ? 'All stages' : stage}
              </MenuItem>
            ))}
          </TextField>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Queue items
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {rows.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Promise-to-pay secured
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {rows.filter((item) => item.promiseToPay).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Disputed items
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                {rows.filter((item) => item.disputed).length}
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
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={rows.length > 0 && selectedIds.length === rows.length}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < rows.length}
                    onChange={() =>
                      setSelectedIds(
                        selectedIds.length === rows.length ? [] : rows.map((invoice) => invoice.id)
                      )
                    }
                  />
                </TableCell>
                <TableCell>Invoice</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Follow-Up Stage</TableCell>
                <TableCell>Last Contact</TableCell>
                <TableCell>Promise to Pay</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Escalation Rule</TableCell>
                <TableCell align="right">Balance Due</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedIds.includes(invoice.id)}
                      onChange={() => toggleSelected(invoice.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {invoice.number}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {invoice.reminderTemplate}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {invoice.customer?.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {invoice.notes?.[0]?.message || 'No recent activity logged'}
                    </Typography>
                  </TableCell>
                  <TableCell>{invoice.followUpStage}</TableCell>
                  <TableCell>{invoice.lastContact || 'No contact'}</TableCell>
                  <TableCell>{invoice.promiseToPay || 'Not secured'}</TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.priority}
                      size="small"
                      color={PRIORITY_COLORS[invoice.priority]}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{invoice.escalationRule}</Typography>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(invoice.balanceDue)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {(() => {
                        const nextStage = getNextCollectionStage(invoice.followUpStage);
                        const isFinalStage = nextStage === invoice.followUpStage;

                        return (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => actions.advanceCollectionStage(invoice.id)}
                            disabled={isFinalStage}
                            title={isFinalStage ? invoice.followUpStage : `Next: ${nextStage}`}
                          >
                            {isFinalStage ? 'Done' : getAdvanceLabel(nextStage)}
                          </Button>
                        );
                      })()}
                      <Button
                        component={RouterLink}
                        href={buildHref(
                          paths.dashboard.accountingFinance.receivables.collectionFollowUpDetail(
                            invoice.id
                          )
                        )}
                        size="small"
                        variant="outlined"
                        color="inherit"
                      >
                        Detail
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Reminder Batch</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Prepare the current follow-up batch for overdue invoices and promise-to-pay items.
            </Typography>
            <TextField
              label="Email subject"
              value={emailDraft.subject}
              onChange={(event) =>
                setEmailDraft((current) => ({ ...current, subject: event.target.value }))
              }
            />
            <TextField
              label="Batch note"
              multiline
              minRows={3}
              value={emailDraft.note}
              onChange={(event) =>
                setEmailDraft((current) => ({ ...current, note: event.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() =>
              runAction('Sync Reminder Batch', confirmReminderBatch, 'Reminder batch completed')
            }
          >
            Confirm Batch
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={workflowOpen} onClose={() => setWorkflowOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Collection Workflow</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Apply a shared stage, template, promise date, and note to the selected receivable
              items.
            </Typography>
            <TextField
              select
              label="Stage"
              value={workflowDraft.stage}
              onChange={(event) =>
                setWorkflowDraft((current) => ({ ...current, stage: event.target.value }))
              }
            >
              {stageOptions
                .filter((stage) => stage !== 'all')
                .map((stage) => (
                  <MenuItem key={stage} value={stage}>
                    {stage}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              label="Template"
              value={workflowDraft.template}
              onChange={(event) =>
                setWorkflowDraft((current) => ({ ...current, template: event.target.value }))
              }
            />
            <TextField
              type="date"
              label="Promise to pay"
              value={workflowDraft.promiseToPay}
              onChange={(event) =>
                setWorkflowDraft((current) => ({ ...current, promiseToPay: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Workflow note"
              multiline
              minRows={3}
              value={workflowDraft.note}
              onChange={(event) =>
                setWorkflowDraft((current) => ({ ...current, note: event.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkflowOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={applyBulkWorkflow}>
            Apply Workflow
          </Button>
        </DialogActions>
      </Dialog>
      {printOpen && (
        <PdfPrintLayout title="Collection Follow-Up" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
