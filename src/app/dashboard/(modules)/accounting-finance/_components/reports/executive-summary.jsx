'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { getExecutiveSummaryReport } from './mock-data';
import { ReportExportActions } from './report-export-actions';
import { exportReportJson, exportReportExcel } from './reports-export';

function MetricCard({ item }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: `${item.color}20`, color: item.color, width: 48, height: 48 }}>
          <Iconify icon={item.icon} width={24} />
        </Avatar>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {item.label}
          </Typography>
          <Typography variant="h5" fontWeight={800}>
            {item.value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {item.helper}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function ExecutiveSummary() {
  const [asOfDate, setAsOfDate] = useState('2026-03-29');
  const [focusArea, setFocusArea] = useState('liquidity');
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);
  const report = useMemo(() => getExecutiveSummaryReport({ asOfDate }), [asOfDate]);

  const auditExceptions = useMemo(
    () =>
      [
        report.openInvoices > 2
          ? {
              id: 'inv',
              severity: 'warning',
              title: 'Receivable collection pressure',
              description: `${report.openInvoices} invoices remain open and ${formatCurrency(report.receivables)} is still outstanding.`,
            }
          : null,
        report.openBills > 2
          ? {
              id: 'bill',
              severity: 'warning',
              title: 'Payable settlement queue',
              description: `${report.openBills} supplier bills remain open with ${formatCurrency(report.payables)} payable exposure.`,
            }
          : null,
        report.bankStatements.some((statement) => statement.status !== 'imported')
          ? {
              id: 'stmt',
              severity: 'info',
              title: 'Bank statement import lag',
              description:
                'At least one statement is still in draft and needs reconciliation follow-through.',
            }
          : null,
      ].filter(Boolean),
    [
      report.bankStatements,
      report.openBills,
      report.openInvoices,
      report.payables,
      report.receivables,
    ]
  );

  const varianceStory = useMemo(
    () => [
      {
        id: 'working-capital',
        label: 'Working capital',
        value: formatCurrency(report.workingCapital),
        note:
          report.workingCapital >= 0
            ? 'Cash and receivables cover current obligations.'
            : 'Short-term obligations exceed liquid coverage.',
      },
      {
        id: 'liquidity',
        label: 'Liquidity coverage',
        value: `${report.liquidityCoverage.toFixed(1)}%`,
        note:
          report.liquidityCoverage >= 100
            ? 'Cash position covers current payables.'
            : 'Collections still need to convert before full payable cover.',
      },
      {
        id: 'counterparty',
        label: 'Top exposure',
        value: report.topCustomerExposure
          ? `${report.topCustomerExposure.name} ${formatCurrency(report.topCustomerExposure.balance)}`
          : 'No exposure concentration',
        note: report.topSupplierExposure
          ? `Largest supplier settlement is ${report.topSupplierExposure.name}.`
          : 'Supplier exposure remains distributed.',
      },
    ],
    [
      report.liquidityCoverage,
      report.topCustomerExposure,
      report.topSupplierExposure,
      report.workingCapital,
    ]
  );

  const kpis = [
    {
      label: 'Net Result',
      value: formatCurrency(report.overview.netResult),
      helper: 'Current mock reporting margin',
      color: '#16a34a',
      icon: 'solar:chart-2-bold-duotone',
    },
    {
      label: 'Cash Balance',
      value: formatCurrency(report.cashBalance),
      helper: 'Bank and cash accounts combined',
      color: '#2563eb',
      icon: 'solar:wallet-money-bold-duotone',
    },
    {
      label: 'Receivables',
      value: formatCurrency(report.receivables),
      helper: `${report.openInvoices} open invoices`,
      color: '#d97706',
      icon: 'solar:bill-list-bold-duotone',
    },
    {
      label: 'Payables',
      value: formatCurrency(report.payables),
      helper: `${report.openBills} open bills`,
      color: '#dc2626',
      icon: 'solar:card-bold-duotone',
    },
  ];

  const exportConfig = useMemo(
    () => ({
      title: 'Executive Summary',
      subtitle: `Leadership view as of ${asOfDate}`,
      alerts: auditExceptions.map((item) => ({
        title: item.title,
        description: item.description,
        severity: item.severity,
      })),
      summary: [
        { label: 'Net result', value: formatCurrency(report.overview.netResult) },
        { label: 'Cash', value: formatCurrency(report.cashBalance) },
        { label: 'Receivables', value: formatCurrency(report.receivables) },
        { label: 'Payables', value: formatCurrency(report.payables) },
      ],
      tables: [
        {
          title: 'Bank Position',
          columns: [
            { key: 'name', label: 'Bank Account' },
            { key: 'currency', label: 'Currency' },
            { key: 'balance', label: 'Balance' },
          ],
          rows: report.bankAccounts,
        },
        {
          title: 'Working Capital',
          columns: [
            { key: 'label', label: 'Item' },
            { key: 'value', label: 'Amount' },
          ],
          rows: [
            { label: 'Receivables', value: report.receivables },
            { label: 'Cash', value: report.cashBalance },
            { label: 'Payables', value: report.payables },
            { label: 'Working Capital', value: report.workingCapital },
          ],
        },
        {
          title: 'Variance Story',
          columns: [
            { key: 'label', label: 'Theme' },
            { key: 'value', label: 'Value' },
            { key: 'note', label: 'Story' },
          ],
          rows: varianceStory,
        },
      ],
      controlChecks: auditExceptions.map((item) => ({
        label: item.title,
        value: item.description,
        status: item.severity === 'warning' ? 'warning' : 'info',
      })),
      payload: { report, auditExceptions, varianceStory, focusArea },
    }),
    [asOfDate, auditExceptions, focusArea, report, varianceStory]
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
                        /balance|amount|debit|credit|net|cost|budget|actual|available|variance|opening|closing|total|value|cash|receivables|payables|working/i.test(
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

  const renderFocusPanel = () => {
    if (focusArea === 'liquidity') {
      return (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Account</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.bankAccounts.map((account) => (
                <TableRow key={account.id} hover>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>{account.currency}</TableCell>
                  <TableCell align="right">
                    {formatCurrency(account.balance, account.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }

    if (focusArea === 'exceptions') {
      return (
        <Stack spacing={1.5}>
          {auditExceptions.map((item) => (
            <Alert key={item.id} severity={item.severity} sx={{ borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                {item.title}
              </Typography>
              {item.description}
            </Alert>
          ))}
        </Stack>
      );
    }

    if (focusArea === 'counterparty') {
      return (
        <Stack spacing={2}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700}>
                Top customer exposure
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {report.topCustomerExposure
                  ? `${report.topCustomerExposure.name} currently carries ${formatCurrency(report.topCustomerExposure.balance)} outstanding.`
                  : 'No customer exposure in scope.'}
              </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700}>
                Top supplier settlement
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {report.topSupplierExposure
                  ? `${report.topSupplierExposure.name} represents ${formatCurrency(Math.abs(report.topSupplierExposure.balance))} in unpaid bills.`
                  : 'No supplier exposure in scope.'}
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      );
    }

    return (
      <Stack spacing={1.5}>
        {varianceStory.map((item) => (
          <Card key={item.id} variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700}>
                {item.label}
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.75 }}>
                {item.value}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                {item.note}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
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
            Executive Summary
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Leadership cockpit with interactive drill-down, audit exceptions, and variance story
            using report mock data.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <TextField
            type="date"
            label="As of"
            value={asOfDate}
            onChange={(event) => setAsOfDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />
          <ReportExportActions
            actions={[
              {
                key: 'excel',
                onClick: () =>
                  runAction(
                    'Export Executive Summary Excel',
                    () => exportReportExcel('executive-summary', exportConfig),
                    'Executive summary workbook exported'
                  ),
                disabled: pendingAction !== null,
              },
              {
                key: 'json',
                onClick: () =>
                  runAction(
                    'Export Executive Summary JSON',
                    () => exportReportJson('executive-summary', exportConfig),
                    'Executive summary JSON exported'
                  ),
                disabled: pendingAction !== null,
              },
              { key: 'print', onClick: () => setPrintOpen(true), disabled: pendingAction !== null },
            ]}
          />
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, xl: 3 }}>
            <MetricCard item={item} />
          </Grid>
        ))}
      </Grid>

      <Stack spacing={1.25} sx={{ mb: 3 }}>
        {auditExceptions.map((item) => (
          <Alert key={item.id} severity={item.severity} sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {item.title}
            </Typography>
            {item.description}
          </Alert>
        ))}
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                spacing={2}
                sx={{ mb: 2 }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Variance Story
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    size="small"
                    variant={focusArea === 'liquidity' ? 'contained' : 'outlined'}
                    onClick={() => setFocusArea('liquidity')}
                  >
                    Liquidity
                  </Button>
                  <Button
                    size="small"
                    variant={focusArea === 'exceptions' ? 'contained' : 'outlined'}
                    onClick={() => setFocusArea('exceptions')}
                  >
                    Exceptions
                  </Button>
                  <Button
                    size="small"
                    variant={focusArea === 'counterparty' ? 'contained' : 'outlined'}
                    onClick={() => setFocusArea('counterparty')}
                  >
                    Counterparties
                  </Button>
                  <Button
                    size="small"
                    variant={focusArea === 'story' ? 'contained' : 'outlined'}
                    onClick={() => setFocusArea('story')}
                  >
                    Story
                  </Button>
                </Stack>
              </Stack>
              {renderFocusPanel()}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Working Capital
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Receivables</TableCell>
                        <TableCell align="right">{formatCurrency(report.receivables)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Cash</TableCell>
                        <TableCell align="right">{formatCurrency(report.cashBalance)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Payables</TableCell>
                        <TableCell align="right">{formatCurrency(report.payables)}</TableCell>
                      </TableRow>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell>
                          <Typography fontWeight={700}>Working Capital</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={700}>
                            {formatCurrency(report.workingCapital)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
                  Statement Import Posture
                </Typography>
                {report.bankStatements.map((statement) => (
                  <Stack
                    key={statement.id}
                    direction="row"
                    justifyContent="space-between"
                    sx={{ py: 0.75 }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {statement.bank_account_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {statement.period}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {statement.status}
                    </Typography>
                  </Stack>
                ))}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {printOpen && (
        <PdfPrintLayout title="Executive Summary" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
