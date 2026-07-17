'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useRouteFilters } from './use-route-filters';
import { useReceivablesWorkspace } from './use-receivables-workspace';
import { useReceivablesApiActions } from './use-receivables-api-actions';
import {
  exportReceivablesCsv,
  exportReceivablesJson,
  exportReceivablesExcel,
} from './receivables-export';

export default function CustomerStatements() {
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);
  const { hasLiveInvoices, sendMockInvoices } = useReceivablesApiActions();
  const { filters, updateFilter, buildHref } = useRouteFilters([
    {
      key: 'filter',
      defaultValue: 'all',
      allowedValues: ['all', 'draft', 'queued', 'sent'],
    },
    {
      key: 'period',
      defaultValue: 'all',
    },
  ]);
  const { actions, statementList, statementPeriods } = useReceivablesWorkspace();
  const { filter } = filters;

  const rows = useMemo(
    () =>
      statementList.filter((statement) => {
        if (filter !== 'all' && statement.sentStatus !== filter) return false;
        if (filters.period !== 'all' && statement.id !== filters.period) return false;
        return true;
      }),
    [filter, filters.period, statementList]
  );

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Statement
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Customer
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Send Status
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
              {statement.customer?.name}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{statement.sentStatus}</td>
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

  const markSent = async (statement) => {
    const liveSync = hasLiveInvoices ? await sendMockInvoices(statement.invoices) : null;

    if (liveSync?.failed && !liveSync.synced && !liveSync.skipped) {
      throw new Error(liveSync.errorMessage || 'Unable to sync statement send action.');
    }

    actions.markStatementSent(statement.id);

    if (liveSync?.synced) {
      toast.info(`Synced ${liveSync.synced} live invoices for ${statement.periodLabel}.`);
    }
  };

  const exportConfig = {
    title: 'Customer Statements Register',
    subtitle: 'Statement send pipeline',
    summary: [
      { label: 'Statements in view', value: rows.length },
      {
        label: 'Queued statements',
        value: rows.filter((statement) => statement.sentStatus === 'queued').length,
      },
      {
        label: 'Disputed statements',
        value: rows.filter((statement) => statement.disputedCount > 0).length,
      },
    ],
    tables: [
      {
        title: 'Statement Queue',
        columns: [
          { key: 'statement', label: 'Statement' },
          { key: 'customer', label: 'Customer' },
          { key: 'sendStatus', label: 'Send Status' },
          { key: 'approval', label: 'Approval' },
          { key: 'closingBalance', label: 'Closing Balance' },
        ],
        rows: rows.map((statement) => ({
          statement: statement.periodLabel,
          customer: statement.customer?.name,
          sendStatus: statement.sentStatus,
          approval: statement.approvalState,
          closingBalance: formatCurrency(statement.closingBalance),
        })),
      },
    ],
    payload: { statements: rows },
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

  const emailBatch = async () => {
    const liveSync = hasLiveInvoices
      ? await sendMockInvoices(rows.flatMap((statement) => statement.invoices))
      : null;

    if (liveSync?.failed && !liveSync.synced && !liveSync.skipped) {
      throw new Error(liveSync.errorMessage || 'Unable to sync statement batch.');
    }

    actions.queueStatements(rows.map((statement) => statement.id));

    if (liveSync?.synced) {
      toast.info(`Synced ${liveSync.synced} live invoice sends from the statement batch.`);
    }

    toast.success('Statement email batch queued in mock workflow');
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
            Customer Statements
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Statement periods, send pipeline, dispute notes, and customer statement drill-down.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            onClick={() =>
              runAction(
                'Export Statements Excel',
                () => exportReceivablesExcel('customer-statements', exportConfig),
                'Statement workbook exported'
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
                'Export Statements CSV',
                () => exportReceivablesCsv('customer-statements', exportConfig),
                'Statement CSV exported'
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
                'Export Statements JSON',
                () => exportReceivablesJson('customer-statements', exportConfig),
                'Statement JSON exported'
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
            startIcon={<Iconify icon="solar:letter-bold" />}
            onClick={() =>
              runAction('Queue Statement Batch', emailBatch, 'Statement email batch queued')
            }
            disabled={pendingAction !== null}
          >
            Email Batch
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              select
              size="small"
              label="Send status"
              value={filter}
              onChange={(event) => updateFilter('filter', event.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="all">All statements</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="queued">Queued</MenuItem>
              <MenuItem value="sent">Sent</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              label="Statement period"
              value={filters.period}
              onChange={(event) => updateFilter('period', event.target.value)}
              sx={{ minWidth: 260 }}
            >
              <MenuItem value="all">All periods</MenuItem>
              {statementPeriods.map((period) => (
                <MenuItem key={period.id} value={period.id}>
                  {period.label}
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
                <TableCell>Customer</TableCell>
                <TableCell>Send Status</TableCell>
                <TableCell>Approval</TableCell>
                <TableCell align="right">Closing Balance</TableCell>
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
                      {statement.disputeNote}
                    </Typography>
                  </TableCell>
                  <TableCell>{statement.customer?.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={statement.sentStatus}
                      size="small"
                      color={statement.sentStatus === 'sent' ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statement.approvalState}
                      size="small"
                      color={statement.approvalState === 'approved' ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell align="right">{formatCurrency(statement.closingBalance)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          runAction(
                            `Download ${statement.periodLabel}`,
                            () =>
                              exportReceivablesJson(`statement-${statement.id}`, {
                                title: statement.periodLabel,
                                subtitle: statement.customer?.name,
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
                            `Send ${statement.periodLabel}`,
                            () => markSent(statement),
                            `${statement.periodLabel} sent`
                          )
                        }
                        disabled={statement.sentStatus === 'sent' || pendingAction !== null}
                      >
                        Send
                      </Button>
                      <Button
                        component={RouterLink}
                        href={buildHref(
                          paths.dashboard.accountingFinance.receivables.customerStatementDetail(
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

      {printOpen && (
        <PdfPrintLayout title="Customer Statements" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
