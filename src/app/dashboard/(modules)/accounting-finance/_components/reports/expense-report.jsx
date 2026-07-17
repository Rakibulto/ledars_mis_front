'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
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

import { formatCurrency } from '../utils';
import { getGeneralLedgerAccounts } from './mock-data';
import { ReportExportActions } from './report-export-actions';
import { ACCOUNTING_MOCK_BUDGETS, ACCOUNTING_MOCK_COST_CENTERS } from '../demo-data';
import { exportReportCsv, exportReportJson, exportReportExcel } from './reports-export';

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

export default function ExpenseReport() {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [costCenterId, setCostCenterId] = useState('all');
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  const rows = useMemo(
    () =>
      getGeneralLedgerAccounts()
        .filter((account) => account.nature === 'expense')
        .map((account, index) => {
          const amount = Math.abs(Number(account.balance || 0));
          const costCenter =
            ACCOUNTING_MOCK_COST_CENTERS[index % ACCOUNTING_MOCK_COST_CENTERS.length];
          const budget = ACCOUNTING_MOCK_BUDGETS.find(
            (item) => item.cost_center_id === costCenter.id
          );
          const category = account.group_id === 5 ? 'Program' : 'Operating';
          const policyStatus =
            amount > 100000 ? 'exception' : amount > 50000 ? 'review' : 'compliant';

          return {
            ...account,
            amount,
            category,
            costCenter,
            budget: Number(budget?.total_amount || 0),
            budgetUtilization: budget?.total_amount
              ? (amount / Number(budget.total_amount)) * 100
              : 0,
            policyStatus,
          };
        })
        .filter((row) => (categoryFilter === 'all' ? true : row.category === categoryFilter))
        .filter((row) =>
          costCenterId === 'all' ? true : String(row.costCenter.id) === String(costCenterId)
        ),
    [categoryFilter, costCenterId]
  );

  const totals = useMemo(
    () => ({
      amount: rows.reduce((sum, row) => sum + row.amount, 0),
      budget: rows.reduce((sum, row) => sum + row.budget, 0),
      exceptions: rows.filter((row) => row.policyStatus !== 'compliant').length,
      centers: new Set(rows.map((row) => row.costCenter.id)).size,
    }),
    [rows]
  );

  const centerRows = useMemo(
    () =>
      ACCOUNTING_MOCK_COST_CENTERS.map((center) => {
        const centerItems = rows.filter((row) => row.costCenter.id === center.id);
        const total = centerItems.reduce((sum, row) => sum + row.amount, 0);
        const budget = centerItems.reduce((sum, row) => sum + row.budget, 0);
        return {
          ...center,
          total,
          budget,
          variance: budget - total,
        };
      }).filter((center) => center.total > 0),
    [rows]
  );

  const exportConfig = useMemo(
    () => ({
      title: 'Expense Report',
      subtitle: 'Policy, category, and cost center analysis',
      summary: [
        { label: 'Expense total', value: formatCurrency(totals.amount) },
        { label: 'Budget envelope', value: formatCurrency(totals.budget) },
        { label: 'Exceptions', value: totals.exceptions },
        { label: 'Cost centers', value: totals.centers },
      ],
      tables: [
        {
          title: 'Expense Lines',
          columns: [
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Account' },
            { key: 'category', label: 'Category' },
            { key: 'costCenter', label: 'Cost Center' },
            { key: 'amount', label: 'Amount' },
            { key: 'budget', label: 'Budget' },
            { key: 'status', label: 'Status' },
          ],
          rows: rows.map((row) => ({
            ...row,
            costCenter: row.costCenter.name,
            status: row.policyStatus,
          })),
        },
        {
          title: 'Cost Center Analysis',
          columns: [
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Cost Center' },
            { key: 'total', label: 'Expense' },
            { key: 'budget', label: 'Budget' },
            { key: 'variance', label: 'Variance' },
          ],
          rows: centerRows,
        },
      ],
      controlChecks: rows.map((row) => ({
        label: row.name,
        value: row.policyStatus,
        status:
          row.policyStatus === 'exception'
            ? 'warning'
            : row.policyStatus === 'review'
              ? 'info'
              : 'success',
      })),
      payload: { rows, centerRows, filters: { categoryFilter, costCenterId } },
    }),
    [
      categoryFilter,
      centerRows,
      costCenterId,
      rows,
      totals.amount,
      totals.budget,
      totals.centers,
      totals.exceptions,
    ]
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
                        /balance|amount|debit|credit|net|cost|budget|actual|available|variance|opening|closing|total|value|expense/i.test(
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
            Expense Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Expense policy review with category analysis, cost center linkage, and budget variance
            from seeded report data.
          </Typography>
        </Box>
        <ReportExportActions
          actions={[
            {
              key: 'csv',
              onClick: () =>
                runAction(
                  'Export Expense Report CSV',
                  () => exportReportCsv('expense-report', exportConfig),
                  'Expense report CSV exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'excel',
              onClick: () =>
                runAction(
                  'Export Expense Report Excel',
                  () => exportReportExcel('expense-report', exportConfig),
                  'Expense report workbook exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'json',
              onClick: () =>
                runAction(
                  'Export Expense Report JSON',
                  () => exportReportJson('expense-report', exportConfig),
                  'Expense report JSON exported'
                ),
              disabled: pendingAction !== null,
            },
            { key: 'print', onClick: () => setPrintOpen(true), disabled: pendingAction !== null },
          ]}
        />
      </Stack>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Category"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="Program">Program</MenuItem>
                <MenuItem value="Operating">Operating</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Cost Center"
                value={costCenterId}
                onChange={(event) => setCostCenterId(event.target.value)}
              >
                <MenuItem value="all">All Cost Centers</MenuItem>
                {ACCOUNTING_MOCK_COST_CENTERS.map((center) => (
                  <MenuItem key={center.id} value={center.id}>
                    {center.code} - {center.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Expense total"
            value={formatCurrency(totals.amount)}
            helper="Expense volume inside current filter"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Budget envelope"
            value={formatCurrency(totals.budget)}
            helper="Linked budget capacity across selected centers"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Policy exceptions"
            value={totals.exceptions}
            helper="Rows flagged for review or exception"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Centers"
            value={totals.centers}
            helper="Centers represented in the filtered spend"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ borderRadius: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Account</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Cost Center</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Budget</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {row.code} - {row.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{row.category}</TableCell>
                      <TableCell>{row.costCenter.name}</TableCell>
                      <TableCell align="right">{formatCurrency(row.amount)}</TableCell>
                      <TableCell align="right">{formatCurrency(row.budget)}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.policyStatus}
                          size="small"
                          color={
                            row.policyStatus === 'exception'
                              ? 'error'
                              : row.policyStatus === 'review'
                                ? 'warning'
                                : 'success'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          component={RouterLink}
                          href={paths.dashboard.accountingFinance.reports.accountLedger}
                          size="small"
                          variant="outlined"
                          color="inherit"
                        >
                          View Account
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Cost Center Analysis
                </Typography>
                <Stack spacing={1.5}>
                  {centerRows.map((center) => (
                    <Card key={center.id} variant="outlined">
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" spacing={2}>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {center.code} - {center.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Expense {formatCurrency(center.total)} • Budget{' '}
                              {formatCurrency(center.budget)}
                            </Typography>
                          </Box>
                          <Chip
                            label={center.variance >= 0 ? 'Within Budget' : 'Over Budget'}
                            size="small"
                            color={center.variance >= 0 ? 'success' : 'warning'}
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {printOpen && (
        <PdfPrintLayout title="Expense Report" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
