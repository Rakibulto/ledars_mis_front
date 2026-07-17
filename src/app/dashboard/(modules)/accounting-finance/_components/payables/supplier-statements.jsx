'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
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
import { usePayablesWorkspace } from './use-payables-workspace';
import { exportPayablesCsv, exportPayablesJson, exportPayablesExcel } from './payables-export';

export default function SupplierStatements() {
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [reconciliationDraft, setReconciliationDraft] = useState({
    vendorStatementBalance: '',
    status: 'review',
    disputeNote: '',
    note: '',
  });
  const { filters, updateFilter, buildHref } = useRouteFilters([
    { key: 'status', defaultValue: 'all', allowedValues: ['all', 'draft', 'queued', 'released'] },
    { key: 'period', defaultValue: 'all' },
  ]);
  const { statementList, statementPeriods, actions } = usePayablesWorkspace();

  const rows = useMemo(
    () =>
      statementList.filter((statement) => {
        if (filters.status !== 'all' && statement.releaseStatus !== filters.status) return false;
        if (filters.period !== 'all' && statement.periodLabel !== filters.period) return false;
        return true;
      }),
    [filters.period, filters.status, statementList]
  );
  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Statement
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Supplier
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Release
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Reconciliation
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Approval
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Closing Balance
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((statement) => (
          <tr key={statement.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {statement.periodLabel}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {statement.supplier?.name}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {statement.releaseStatus}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {statement.reconciliationStatus}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {statement.approvalState}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {formatCurrency(statement.closingBalance)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  const exportConfig = {
    title: 'Supplier Statements Register',
    subtitle: 'Statement release pipeline',
    summary: [
      { label: 'Statements in view', value: rows.length },
      {
        label: 'Queued statements',
        value: rows.filter((statement) => statement.releaseStatus === 'queued').length,
      },
      { label: 'Held items', value: rows.reduce((sum, statement) => sum + statement.holdCount, 0) },
      {
        label: 'Variances in review',
        value: rows.filter((statement) => statement.reconciliationStatus !== 'matched').length,
      },
    ],
    tables: [
      {
        title: 'Supplier Statements',
        columns: [
          { key: 'period', label: 'Statement' },
          { key: 'supplier', label: 'Supplier' },
          { key: 'status', label: 'Release Status' },
          { key: 'reconciliation', label: 'Reconciliation' },
          { key: 'approval', label: 'Approval' },
          { key: 'closing', label: 'Closing Balance' },
        ],
        rows: rows.map((statement) => ({
          period: statement.periodLabel,
          supplier: statement.supplier?.name,
          status: statement.releaseStatus,
          reconciliation: statement.reconciliationStatus,
          approval: statement.approvalState,
          closing: formatCurrency(statement.closingBalance),
        })),
      },
    ],
    payload: { rows, filters },
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

  const releaseStatement = async (statement) => {
    if (statement.approvalState !== 'approved') {
      throw new Error('Statement still needs approval before release.');
    }

    actions.releaseStatement(statement.id);
  };

  const saveReconciliation = () => {
    if (!selectedStatement) return;

    actions.reconcileStatement(selectedStatement.id, reconciliationDraft);
    setSelectedStatement(null);
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
            Supplier Statements
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Statement release controls with reconciliation notes, hold visibility, and supplier
            detail packs.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            onClick={() =>
              runAction(
                'Export Supplier Statements CSV',
                () => exportPayablesCsv('supplier-statements', exportConfig),
                'Supplier statements CSV exported'
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
                'Export Supplier Statements JSON',
                () => exportPayablesJson('supplier-statements', exportConfig),
                'Supplier statements JSON exported'
              )
            }
            disabled={pendingAction !== null}
          >
            Export JSON
          </Button>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:printer-bold" />}
            onClick={() => setPrintOpen(true)}
            disabled={pendingAction !== null}
          >
            Print Pack
          </Button>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:download-minimalistic-bold" />}
            onClick={() =>
              runAction(
                'Export Supplier Statements Excel',
                () => exportPayablesExcel('supplier-statements', exportConfig),
                'Supplier statements workbook exported'
              )
            }
            disabled={pendingAction !== null}
          >
            Export Excel
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              select
              size="small"
              label="Release status"
              value={filters.status}
              onChange={(event) => updateFilter('status', event.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="all">All statements</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="queued">Queued</MenuItem>
              <MenuItem value="released">Released</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              label="Statement period"
              value={filters.period}
              onChange={(event) => updateFilter('period', event.target.value)}
              sx={{ minWidth: 280 }}
            >
              <MenuItem value="all">All periods</MenuItem>
              {statementPeriods.map((period) => (
                <MenuItem key={period} value={period}>
                  {period}
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
                <TableCell>Statement</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Release</TableCell>
                <TableCell>Reconciliation</TableCell>
                <TableCell>Approval</TableCell>
                <TableCell>Holds</TableCell>
                <TableCell align="right">Closing Balance</TableCell>
                <TableCell align="right">Vendor Balance</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((statement) => (
                <TableRow key={statement.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {statement.periodLabel}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {statement.disputeNote || statement.reconciliationNote}
                    </Typography>
                  </TableCell>
                  <TableCell>{statement.supplier?.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={statement.releaseStatus}
                      size="small"
                      color={statement.releaseStatus === 'released' ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statement.reconciliationStatus}
                      size="small"
                      color={
                        statement.reconciliationStatus === 'matched'
                          ? 'success'
                          : statement.reconciliationStatus === 'blocked'
                            ? 'error'
                            : 'warning'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statement.approvalState}
                      size="small"
                      color={statement.approvalState === 'approved' ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell>{statement.holdCount}</TableCell>
                  <TableCell align="right">{formatCurrency(statement.closingBalance)}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatCurrency(statement.vendorStatementBalance)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color={statement.reconciliationDifference ? 'warning.main' : 'text.secondary'}
                    >
                      variance {formatCurrency(statement.reconciliationDifference)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedStatement(statement);
                          setReconciliationDraft({
                            vendorStatementBalance: statement.vendorStatementBalance,
                            status:
                              statement.reconciliationStatus === 'matched' ? 'matched' : 'review',
                            disputeNote: statement.disputeNote || '',
                            note: statement.reconciliationNote || '',
                          });
                        }}
                      >
                        Reconcile
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          runAction(
                            `Download ${statement.periodLabel}`,
                            () =>
                              exportPayablesJson(`supplier-statement-${statement.id}`, {
                                title: statement.periodLabel,
                                subtitle: statement.supplier?.name,
                                payload: statement,
                              }),
                            `${statement.periodLabel} exported`
                          )
                        }
                        disabled={pendingAction !== null}
                      >
                        Download
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          runAction(
                            `Release ${statement.periodLabel}`,
                            () => releaseStatement(statement),
                            `${statement.periodLabel} released`
                          )
                        }
                        disabled={statement.releaseStatus === 'released' || pendingAction !== null}
                      >
                        Release
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          runAction(
                            `Queue ${statement.periodLabel}`,
                            () => Promise.resolve(actions.queueStatements([statement.id])),
                            `${statement.periodLabel} queued`
                          )
                        }
                        disabled={pendingAction !== null}
                      >
                        Queue
                      </Button>
                      <Button
                        component={RouterLink}
                        href={buildHref(
                          paths.dashboard.accountingFinance.payables.supplierStatementDetail(
                            statement.id
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


      <Dialog
        open={Boolean(selectedStatement)}
        onClose={() => setSelectedStatement(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reconcile Supplier Statement</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Match the vendor statement to internal payables for{' '}
              {selectedStatement?.supplier?.name}.
            </Typography>
            <TextField
              type="number"
              label="Vendor statement balance"
              value={reconciliationDraft.vendorStatementBalance}
              onChange={(event) =>
                setReconciliationDraft((current) => ({
                  ...current,
                  vendorStatementBalance: event.target.value,
                }))
              }
            />
            <TextField
              select
              label="Status"
              value={reconciliationDraft.status}
              onChange={(event) =>
                setReconciliationDraft((current) => ({ ...current, status: event.target.value }))
              }
            >
              <MenuItem value="review">Review</MenuItem>
              <MenuItem value="matched">Matched</MenuItem>
              <MenuItem value="blocked">Blocked</MenuItem>
            </TextField>
            <TextField
              label="Dispute note"
              value={reconciliationDraft.disputeNote}
              onChange={(event) =>
                setReconciliationDraft((current) => ({
                  ...current,
                  disputeNote: event.target.value,
                }))
              }
              multiline
              minRows={2}
            />
            <TextField
              label="Reconciliation note"
              value={reconciliationDraft.note}
              onChange={(event) =>
                setReconciliationDraft((current) => ({ ...current, note: event.target.value }))
              }
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedStatement(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveReconciliation}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
      {printOpen && (
        <PdfPrintLayout title="Supplier Statements" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
