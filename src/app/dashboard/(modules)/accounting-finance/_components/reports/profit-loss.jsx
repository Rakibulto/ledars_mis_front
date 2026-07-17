'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { formatCurrency } from '../utils';
import { getProfitLossReport } from './mock-data';
import { ReportExportActions } from './report-export-actions';
import { exportReportCsv, exportReportExcel } from './reports-export';
import { useBudgetsWorkspace } from '../budgets/use-budgets-workspace';
import { useAnalyticWorkspace } from '../analytic-accounting/use-analytic-workspace';

function GroupedTable({ title, groups, total, tone, drilldownHref }) {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
          <Chip label={formatCurrency(total)} color={tone} variant="outlined" />
        </Stack>
        <Stack spacing={2}>
          {Object.entries(groups).map(([groupName, rows]) => (
            <Box key={groupName}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                {groupName}
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td style={{ padding: '10px 8px', width: 120 }}>{row.code}</td>
                        <td style={{ padding: '10px 8px' }}>{row.name}</td>
                        <td align="right" style={{ padding: '10px 8px', fontWeight: 700 }}>
                          {formatCurrency(row.normalizedBalance)}
                        </td>
                        {drilldownHref && (
                          <td align="right" style={{ padding: '10px 8px' }}>
                            <RouterLink
                              href={`${drilldownHref}?account=${encodeURIComponent(row.code)}`}
                            >
                              <Chip
                                label="View Account"
                                size="small"
                                variant="outlined"
                                clickable
                              />
                            </RouterLink>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function ProfitLoss() {
  const budgetsWorkspace = useBudgetsWorkspace();
  const analyticWorkspace = useAnalyticWorkspace();
  const [asOfDate, setAsOfDate] = useState('2026-03-29');
  const [comparisonDate, setComparisonDate] = useState('2026-02-29');
  const [search, setSearch] = useState('');
  const [costCenterFilter, setCostCenterFilter] = useState('all');
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);
  const report = useMemo(() => getProfitLossReport({ asOfDate, search }), [asOfDate, search]);

  const comparisonFactor = useMemo(() => {
    const baseDate = new Date(`${asOfDate}T00:00:00`).getTime();
    const compareDate = new Date(`${comparisonDate}T00:00:00`).getTime();
    const dayGap = Math.max(0, Math.round((baseDate - compareDate) / (1000 * 60 * 60 * 24)));
    return Math.max(0.7, 1 - dayGap / 900);
  }, [asOfDate, comparisonDate]);

  const costCenterRows = useMemo(() => {
    const map = new Map();

    analyticWorkspace.items.forEach((item) => {
      const key = item.costCenterName || 'Unassigned';
      const current = map.get(key) || { name: key, actual: 0, analytic: 0 };
      map.set(key, {
        ...current,
        actual: current.actual + Math.abs(Number(item.amount || 0)),
        analytic: current.analytic + Math.abs(Number(item.amount || 0)),
      });
    });

    budgetsWorkspace.budgets.forEach((budget) => {
      const key = budget.costCenterName;
      const current = map.get(key) || { name: key, actual: 0, analytic: 0 };
      map.set(key, {
        ...current,
        budget: (current.budget || 0) + Number(budget.totalAmount || 0),
      });
    });

    return [...map.values()]
      .map((row) => ({
        ...row,
        budget: row.budget || 0,
        variance: (row.budget || 0) - row.actual,
        trend: row.actual * comparisonFactor,
      }))
      .filter((row) => (costCenterFilter === 'all' ? true : row.name === costCenterFilter))
      .sort((left, right) => right.actual - left.actual);
  }, [analyticWorkspace.items, budgetsWorkspace.budgets, comparisonFactor, costCenterFilter]);

  const priorPeriodNet = report.netProfit * comparisonFactor;
  const periodVariance = report.netProfit - priorPeriodNet;
  const budgetEnvelope = budgetsWorkspace.overview.totalBudget;
  const budgetVariance = budgetEnvelope - report.totalExpenses;

  const exportConfig = useMemo(
    () => ({
      title: 'Profit & Loss',
      subtitle: `Through ${report.asOfDate} compared with ${comparisonDate}`,
      summary: [
        { label: 'Income', value: formatCurrency(report.totalIncome) },
        { label: 'Expenses', value: formatCurrency(report.totalExpenses) },
        { label: 'Net result', value: formatCurrency(report.netProfit) },
        { label: 'Operating margin', value: `${report.operatingMargin.toFixed(1)}%` },
      ],
      controlChecks: [
        {
          label: 'Cost ratio',
          value: `${report.costRatio.toFixed(1)}% of income`,
          status: report.costRatio > 85 ? 'warning' : 'success',
        },
        {
          label: 'Largest expense line',
          value: report.topExpense
            ? `${report.topExpense.name} ${formatCurrency(report.topExpense.normalizedBalance)}`
            : 'No expense lines',
          status: 'info',
        },
        {
          label: 'Budget variance',
          value: formatCurrency(budgetVariance),
          status: budgetVariance >= 0 ? 'success' : 'warning',
        },
      ],
      tables: [
        {
          title: 'Income',
          columns: [
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Name' },
            { key: 'normalizedBalance', label: 'Amount' },
          ],
          rows: report.income,
        },
        {
          title: 'Expenses',
          columns: [
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Name' },
            { key: 'normalizedBalance', label: 'Amount' },
          ],
          rows: report.expenses,
        },
        {
          title: 'Cost Center Split',
          columns: [
            { key: 'name', label: 'Cost Center' },
            { key: 'budget', label: 'Budget' },
            { key: 'actual', label: 'Actual' },
            { key: 'variance', label: 'Variance' },
            { key: 'trend', label: 'Prior Period' },
          ],
          rows: costCenterRows,
        },
      ],
      payload: {
        report,
        costCenterRows,
        filters: { asOfDate, comparisonDate, search, costCenterFilter },
      },
    }),
    [asOfDate, budgetVariance, comparisonDate, costCenterFilter, costCenterRows, report, search]
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
                        /balance|amount|debit|credit|net|cost|budget|actual|available|variance|opening|closing|total|value/i.test(
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
            Profit & Loss
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Income and expense performance with operating margin and line-by-line review.
          </Typography>
        </Box>
        <ReportExportActions
          actions={[
            {
              key: 'csv',
              onClick: () =>
                runAction(
                  'Export Profit and Loss CSV',
                  () => exportReportCsv('profit-loss', exportConfig),
                  'Profit and loss CSV exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'excel',
              onClick: () =>
                runAction(
                  'Export Profit and Loss Excel',
                  () => exportReportExcel('profit-loss', exportConfig),
                  'Profit and loss workbook exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'print',
              onClick: () => setPrintOpen(true),
              disabled: pendingAction !== null,
            },
          ]}
        />
      </Stack>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="As of"
                value={asOfDate}
                onChange={(event) => setAsOfDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Comparative Date"
                value={comparisonDate}
                onChange={(event) => setComparisonDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Cost Center Split"
                value={costCenterFilter}
                onChange={(event) => setCostCenterFilter(event.target.value)}
              >
                <MenuItem value="all">All Cost Centers</MenuItem>
                {costCenterRows.map((row) => (
                  <MenuItem key={row.name} value={row.name}>
                    {row.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Search account"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Code, name, or type"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Income', value: formatCurrency(report.totalIncome) },
          { label: 'Expenses', value: formatCurrency(report.totalExpenses) },
          { label: 'Net result', value: formatCurrency(report.netProfit) },
          { label: 'Period variance', value: formatCurrency(periodVariance) },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, xl: 3 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <GroupedTable
            title="Income"
            groups={report.groupedIncome}
            value={report.totalIncome}
            tone="success"
            drilldownHref={paths.dashboard.accountingFinance.reports.accountLedger}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Stack spacing={3}>
            <GroupedTable
              title="Expenses"
              groups={report.groupedExpenses}
              value={report.totalExpenses}
              tone="error"
              drilldownHref={paths.dashboard.accountingFinance.reports.accountLedger}
            />
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Net result
                    </Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                      {formatCurrency(report.netProfit)}
                    </Typography>
                  </Box>
                  <Chip
                    label={report.netProfit >= 0 ? 'profit' : 'loss'}
                    color={report.netProfit >= 0 ? 'success' : 'error'}
                  />
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Odoo-style management view: top-line income, cost load, budget alignment, and
                  prior-period posture in one screen.
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Cost Center Split
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Center</TableCell>
                        <TableCell align="right">Budget</TableCell>
                        <TableCell align="right">Actual</TableCell>
                        <TableCell align="right">Variance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {costCenterRows.slice(0, 5).map((row) => (
                        <TableRow key={row.name} hover>
                          <TableCell>{row.name}</TableCell>
                          <TableCell align="right">{formatCurrency(row.budget)}</TableCell>
                          <TableCell align="right">{formatCurrency(row.actual)}</TableCell>
                          <TableCell
                            align="right"
                            sx={{ color: row.variance >= 0 ? 'success.main' : 'error.main' }}
                          >
                            {formatCurrency(row.variance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Prior-period net result: {formatCurrency(priorPeriodNet)}. Budget envelope:{' '}
                  {formatCurrency(budgetEnvelope)}. Expense variance versus budget:{' '}
                  {formatCurrency(budgetVariance)}.
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {printOpen && (
        <PdfPrintLayout title="Profit & Loss" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
