'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { formatCurrency } from '../utils';
import { ReportExportActions } from './report-export-actions';
import { exportReportCsv, exportReportJson, exportReportExcel } from './reports-export';
import {
  ACCOUNTING_MOCK_BILLS,
  ACCOUNTING_MOCK_INVOICES,
  ACCOUNTING_MOCK_AUDIT_LOGS,
  ACCOUNTING_MOCK_JOURNAL_ENTRIES,
} from '../demo-data';

function MetricCard({ label, value, helper }) {
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
      </CardContent>
    </Card>
  );
}

export default function TaxAudit() {
  const [search, setSearch] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  const sourceRows = useMemo(() => {
    const invoices = ACCOUNTING_MOCK_INVOICES.map((invoice) => ({
      id: `inv-${invoice.id}`,
      date: invoice.invoice_date,
      document: invoice.number,
      module: 'Receivables',
      party: invoice.customer_name,
      amount: Number(invoice.total_amount || 0),
      taxAmount: Number(invoice.total_amount || 0) * 0.05,
      status: invoice.status,
      approvalState: invoice.approval_state,
      source: 'invoice',
    }));
    const bills = ACCOUNTING_MOCK_BILLS.map((bill) => ({
      id: `bill-${bill.id}`,
      date: bill.issue_date,
      document: bill.number,
      module: 'Payables',
      party: bill.vendor_name,
      amount: Number(bill.total_amount || 0),
      taxAmount: Number(bill.total_amount || 0) * 0.075,
      status: bill.status,
      approvalState: bill.approval_state,
      source: 'bill',
    }));

    return [...invoices, ...bills]
      .filter((row) => {
        if (!search) return true;
        return [row.document, row.party, row.module, row.source]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());
      })
      .sort((left, right) => right.date.localeCompare(left.date));
  }, [search]);

  const exceptions = useMemo(() => {
    const items = [];

    sourceRows.forEach((row) => {
      if (row.status !== 'paid' && row.amount > 50000) {
        items.push({
          id: `${row.id}-status`,
          severity: 'warning',
          title: `${row.document} remains open above threshold`,
          description: `${row.module} source document for ${row.party} is still outstanding.`,
        });
      }

      if (row.approvalState && row.approvalState !== 'approved') {
        items.push({
          id: `${row.id}-approval`,
          severity: 'error',
          title: `${row.document} is not fully approved`,
          description: `Approval state is ${row.approvalState}; tax evidence should be reviewed before filing.`,
        });
      }
    });

    if (!items.length) {
      items.push({
        id: 'clear-tax-audit',
        severity: 'success',
        title: 'No material tax-audit exceptions in current mock review',
        description:
          'Source documents, statuses, and approvals do not show obvious exception flags.',
      });
    }

    return items.slice(0, 6);
  }, [sourceRows]);

  const journalRows = ACCOUNTING_MOCK_JOURNAL_ENTRIES.slice(0, 8);
  const auditRows = ACCOUNTING_MOCK_AUDIT_LOGS;

  const exportConfig = useMemo(
    () => ({
      title: 'Tax Audit Report',
      subtitle: 'Source traceability, exception review, and audit trail',
      alerts: exceptions,
      summary: [
        { label: 'Tax source docs', value: sourceRows.length },
        {
          label: 'Exception flags',
          value: exceptions.filter((item) => item.severity !== 'success').length,
        },
        { label: 'Journal entries', value: journalRows.length },
        { label: 'Audit logs', value: auditRows.length },
      ],
      tables: [
        {
          title: 'Tax Source Trace',
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'document', label: 'Document' },
            { key: 'module', label: 'Module' },
            { key: 'party', label: 'Party' },
            { key: 'amount', label: 'Amount' },
            { key: 'tax', label: 'Tax' },
            { key: 'status', label: 'Status' },
            { key: 'approval', label: 'Approval' },
          ],
          rows: sourceRows.map((row) => ({
            date: row.date,
            document: row.document,
            module: row.module,
            party: row.party,
            amount: formatCurrency(row.amount),
            tax: formatCurrency(row.taxAmount),
            status: row.status,
            approval: row.approvalState || 'approved',
          })),
        },
        {
          title: 'Recent Audit Trail',
          columns: [
            { key: 'timestamp', label: 'Timestamp' },
            { key: 'user', label: 'User' },
            { key: 'action', label: 'Action' },
            { key: 'document', label: 'Document' },
          ],
          rows: auditRows.map((log) => ({
            timestamp: log.timestamp,
            user: log.user,
            action: log.action,
            document: log.document,
          })),
        },
      ],
      controlChecks: exceptions.map((item) => ({
        label: item.title,
        value: item.severity,
        description: item.description,
      })),
      payload: { sourceRows, exceptions, journalRows, auditRows },
    }),
    [auditRows, exceptions, journalRows, sourceRows]
  );

  const printContent = (
    <div>
      {exportConfig.tables.map((table) => (
        <div key={table.title} style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, margin: '16px 0 8px' }}>{table.title}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {table.columns.map((column) => (
                  <th
                    key={column.key}
                    style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, index) => (
                <tr key={row.id || index}>
                  {table.columns.map((column) => {
                    const value = row[column.key];
                    return (
                      <td key={column.key} style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                        {typeof value === 'number' &&
                        /balance|amount|debit|credit|net|cost|budget|actual|available|variance|opening|closing|total|value|tax/i.test(
                          column.key
                        )
                          ? formatCurrency(value)
                          : value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
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

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Tax Audit Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Audit pack for tax source tracing, approval exceptions, and journal support evidence.
          </Typography>
        </Box>
        <ReportExportActions
          actions={[
            {
              key: 'csv',
              onClick: () =>
                runAction(
                  'Export Tax Audit CSV',
                  () => exportReportCsv('tax-audit', exportConfig),
                  'Tax audit CSV exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'excel',
              onClick: () =>
                runAction(
                  'Export Tax Audit Excel',
                  () => exportReportExcel('tax-audit', exportConfig),
                  'Tax audit workbook exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'json',
              onClick: () =>
                runAction(
                  'Export Tax Audit JSON',
                  () => exportReportJson('tax-audit', exportConfig),
                  'Tax audit JSON exported'
                ),
              disabled: pendingAction !== null,
            },
            { key: 'print', onClick: () => setPrintOpen(true), disabled: pendingAction !== null },
          ]}
        />
      </Stack>

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            label="Search source documents"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Document, party, module"
          />
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Tax source docs"
            value={sourceRows.length}
            helper="Invoices and vendor bills in audit scope"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Exception flags"
            value={exceptions.filter((item) => item.severity !== 'success').length}
            helper="Approval or status issues needing tax review"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Journal support"
            value={journalRows.length}
            helper="Journal entries available for trace-back review"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Audit trail"
            value={auditRows.length}
            helper="Recent accounting actions captured in the mock logs"
          />
        </Grid>
      </Grid>

      <Stack spacing={1.25} sx={{ mb: 3 }}>
        {exceptions.map((item) => (
          <Alert key={item.id} severity={item.severity} sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {item.title}
            </Typography>
            {item.description}
          </Alert>
        ))}
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 7 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Source Traceability
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th align="left">Date</th>
                      <th align="left">Document</th>
                      <th align="left">Module</th>
                      <th align="left">Party</th>
                      <th align="right">Amount</th>
                      <th align="right">Tax</th>
                      <th align="left">Approval</th>
                      <th align="right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sourceRows.map((row) => (
                      <tr key={row.id}>
                        <td style={{ padding: '12px 8px' }}>{row.date}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <Typography variant="body2" fontWeight={700}>
                            {row.document}
                          </Typography>
                        </td>
                        <td style={{ padding: '12px 8px' }}>{row.module}</td>
                        <td style={{ padding: '12px 8px' }}>{row.party}</td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(row.amount)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px', fontWeight: 700 }}>
                          {formatCurrency(row.taxAmount)}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <Chip
                            label={row.approvalState || 'approved'}
                            size="small"
                            color={row.approvalState === 'approved' ? 'success' : 'warning'}
                          />
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          <Button
                            component={RouterLink}
                            href={paths.dashboard.accountingFinance.reports.journalReport}
                            size="small"
                            variant="outlined"
                            color="inherit"
                          >
                            View Entry
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Recent Audit Trail
              </Typography>
              <Stack spacing={1.25}>
                {auditRows.map((log) => (
                  <Box key={log.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}>
                    <Typography variant="body2" fontWeight={700}>
                      {log.action}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {log.timestamp} • {log.user} • {log.document}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 5 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Journal Support Sample
              </Typography>
              <Stack spacing={1.25}>
                {journalRows.map((entry) => (
                  <Box
                    key={entry.id}
                    sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                  >
                    <Typography variant="body2" fontWeight={700}>
                      {entry.number}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {entry.date} • {entry.journal_name} • {formatCurrency(entry.total)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {printOpen && (
        <PdfPrintLayout title="Tax Audit Report" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
