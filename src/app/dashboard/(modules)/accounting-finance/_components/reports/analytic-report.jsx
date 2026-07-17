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
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { formatCurrency } from '../utils';
import { ReportExportActions } from './report-export-actions';
import { useAnalyticWorkspace } from '../analytic-accounting/use-analytic-workspace';
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

function sumBy(rows, selector) {
  return rows.reduce((sum, row) => sum + Number(selector(row) || 0), 0);
}

function groupTotals(rows, keySelector, valueSelector) {
  return rows.reduce((accumulator, row) => {
    const key = keySelector(row) || 'Unassigned';
    const current = accumulator.get(key) || 0;
    accumulator.set(key, current + Number(valueSelector(row) || 0));
    return accumulator;
  }, new Map());
}

export default function AnalyticReport() {
  const workspace = useAnalyticWorkspace();
  const [planFilter, setPlanFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState('2026-03-30');
  const [search, setSearch] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  const filteredItems = useMemo(
    () =>
      workspace.items.filter((item) => {
        if (planFilter !== 'all' && String(item.planId) !== String(planFilter)) return false;
        if (accountFilter !== 'all' && String(item.analytic_account_id) !== String(accountFilter))
          return false;
        if (sourceFilter !== 'all' && item.sourceType !== sourceFilter) return false;
        if (statusFilter !== 'all' && item.distributionStatus !== statusFilter) return false;
        if (fromDate && item.date < fromDate) return false;
        if (toDate && item.date > toDate) return false;
        if (!search) return true;

        return [
          item.reference,
          item.accountName,
          item.planName,
          item.partnerName,
          item.projectName,
          item.costCenterName,
          item.description,
        ]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());
      }),
    [
      accountFilter,
      fromDate,
      planFilter,
      search,
      sourceFilter,
      statusFilter,
      toDate,
      workspace.items,
    ]
  );

  const filteredAccounts = useMemo(() => {
    const visibleIds = new Set(filteredItems.map((item) => String(item.analytic_account_id)));

    return workspace.accounts.filter((account) => {
      if (planFilter !== 'all' && String(account.plan_id) !== String(planFilter)) return false;
      if (accountFilter !== 'all' && String(account.id) !== String(accountFilter)) return false;
      if (visibleIds.size === 0) return planFilter !== 'all' || accountFilter !== 'all';
      return visibleIds.has(String(account.id));
    });
  }, [accountFilter, filteredItems, planFilter, workspace.accounts]);

  const planSummaries = useMemo(
    () =>
      workspace.plans
        .map((plan) => {
          const planItems = filteredItems.filter((item) => String(item.planId) === String(plan.id));
          const planAccounts = filteredAccounts.filter(
            (account) => String(account.plan_id) === String(plan.id)
          );

          return {
            id: plan.id,
            name: plan.name,
            color: plan.color,
            mandatoryDimensions: plan.mandatoryDimensions,
            applicability: plan.applicability,
            exceptionCount: planItems.filter((item) => item.distributionStatus !== 'validated')
              .length,
            itemCount: planItems.length,
            accountCount: planAccounts.length,
            netAmount: sumBy(planItems, (item) => item.amount),
          };
        })
        .filter((plan) => plan.itemCount > 0 || String(plan.id) === String(planFilter)),
    [filteredAccounts, filteredItems, planFilter, workspace.plans]
  );

  const topProjects = useMemo(
    () =>
      [
        ...groupTotals(
          filteredItems,
          (item) => item.projectName,
          (item) => item.amount
        ).entries(),
      ]
        .map(([name, amount]) => ({ name, amount }))
        .sort((left, right) => Math.abs(right.amount) - Math.abs(left.amount))
        .slice(0, 5),
    [filteredItems]
  );

  const topCostCenters = useMemo(
    () =>
      [
        ...groupTotals(
          filteredItems,
          (item) => item.costCenterName,
          (item) => item.amount
        ).entries(),
      ]
        .map(([name, amount]) => ({ name, amount }))
        .sort((left, right) => Math.abs(right.amount) - Math.abs(left.amount))
        .slice(0, 5),
    [filteredItems]
  );

  const topAccounts = useMemo(
    () =>
      filteredAccounts
        .map((account) => {
          const accountItems = filteredItems.filter(
            (item) => String(item.analytic_account_id) === String(account.id)
          );

          return {
            ...account,
            filteredAmount: sumBy(accountItems, (item) => item.amount),
            exceptionCount: accountItems.filter((item) => item.distributionStatus !== 'validated')
              .length,
          };
        })
        .sort((left, right) => Math.abs(right.filteredAmount) - Math.abs(left.filteredAmount))
        .slice(0, 8),
    [filteredAccounts, filteredItems]
  );

  const validatedCount = filteredItems.filter(
    (item) => item.distributionStatus === 'validated'
  ).length;
  const exceptionCount = filteredItems.filter(
    (item) => item.distributionStatus !== 'validated'
  ).length;
  const totalAmount = sumBy(filteredItems, (item) => item.amount);
  const validationRate = filteredItems.length
    ? Math.round((validatedCount / filteredItems.length) * 100)
    : 0;

  const exportConfig = useMemo(
    () => ({
      title: 'Analytic Report',
      subtitle: `${fromDate} to ${toDate} | ${planFilter === 'all' ? 'All plans' : planSummaries[0]?.name || 'Selected plan'}`,
      summary: [
        { label: 'Analytic lines', value: filteredItems.length },
        { label: 'Accounts in scope', value: filteredAccounts.length },
        { label: 'Net amount', value: formatCurrency(totalAmount) },
        { label: 'Validation rate', value: `${validationRate}%` },
      ],
      sections: [
        {
          title: 'Governance',
          items: [
            { label: 'Distribution exceptions', value: exceptionCount },
            { label: 'Validated lines', value: validatedCount },
            { label: 'Plans in scope', value: planSummaries.length },
            {
              label: 'Source types',
              value: [...new Set(filteredItems.map((item) => item.sourceType))].length,
            },
          ],
        },
      ],
      tables: [
        {
          title: 'Plan Summary',
          columns: [
            { key: 'name', label: 'Plan' },
            { key: 'items', label: 'Items' },
            { key: 'accounts', label: 'Accounts' },
            { key: 'exceptions', label: 'Exceptions' },
            { key: 'netAmount', label: 'Net Amount' },
          ],
          rows: planSummaries.map((plan) => ({
            name: plan.name,
            items: plan.itemCount,
            accounts: plan.accountCount,
            exceptions: plan.exceptionCount,
            netAmount: formatCurrency(plan.netAmount),
          })),
        },
        {
          title: 'Top Analytic Accounts',
          columns: [
            { key: 'account', label: 'Account' },
            { key: 'plan', label: 'Plan' },
            { key: 'amount', label: 'Amount' },
            { key: 'exceptions', label: 'Exceptions' },
          ],
          rows: topAccounts.map((account) => ({
            account: `${account.code} - ${account.name}`,
            plan: account.planName,
            amount: formatCurrency(account.filteredAmount),
            exceptions: account.exceptionCount,
          })),
        },
        {
          title: 'Analytic Lines',
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'reference', label: 'Reference' },
            { key: 'account', label: 'Account' },
            { key: 'project', label: 'Project' },
            { key: 'costCenter', label: 'Cost center' },
            { key: 'amount', label: 'Amount' },
            { key: 'status', label: 'Status' },
          ],
          rows: filteredItems.map((item) => ({
            date: item.date,
            reference: item.reference,
            account: item.accountName,
            project: item.projectName,
            costCenter: item.costCenterName,
            amount: formatCurrency(item.amount),
            status: item.distributionStatus,
          })),
        },
      ],
      controlChecks: planSummaries.map((plan) => ({
        label: plan.name,
        value: `${plan.exceptionCount} exceptions`,
        description: `${plan.mandatoryDimensions.join(', ') || 'No mandatory dimensions'} | ${plan.applicability.join(', ')}`,
      })),
      payload: {
        filters: {
          planFilter,
          accountFilter,
          sourceFilter,
          statusFilter,
          fromDate,
          toDate,
          search,
        },
        planSummaries,
        topAccounts,
        filteredItems,
      },
    }),
    [
      accountFilter,
      exceptionCount,
      filteredAccounts.length,
      filteredItems,
      fromDate,
      planFilter,
      planSummaries,
      search,
      sourceFilter,
      statusFilter,
      toDate,
      topAccounts,
      totalAmount,
      validatedCount,
      validationRate,
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
                        /balance|amount|debit|credit|net|cost|budget|actual|available|variance|opening|closing|total|value|items|accounts|exceptions/i.test(
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
            Analytic Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Odoo-style analytic slicing across plans, accounts, projects, and cost centers using the
            shared analytic mock workspace.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <ReportExportActions
            actions={[
              {
                key: 'csv',
                onClick: () =>
                  runAction(
                    'Export Analytic Report CSV',
                    () => exportReportCsv('analytic-report', exportConfig),
                    'Analytic report CSV exported'
                  ),
                disabled: pendingAction !== null,
              },
              {
                key: 'excel',
                onClick: () =>
                  runAction(
                    'Export Analytic Report Excel',
                    () => exportReportExcel('analytic-report', exportConfig),
                    'Analytic report workbook exported'
                  ),
                disabled: pendingAction !== null,
              },
              {
                key: 'json',
                onClick: () =>
                  runAction(
                    'Export Analytic Report JSON',
                    () => exportReportJson('analytic-report', exportConfig),
                    'Analytic report JSON exported'
                  ),
                disabled: pendingAction !== null,
              },
              { key: 'print', onClick: () => setPrintOpen(true), disabled: pendingAction !== null },
            ]}
          />
        </Stack>
      </Stack>

      <Alert severity={exceptionCount ? 'warning' : 'success'} sx={{ mb: 3, borderRadius: 2 }}>
        {exceptionCount
          ? `${exceptionCount} analytic lines still require governance review before posting is fully compliant.`
          : 'All filtered analytic lines are validated against the current mandatory-dimension rules.'}
      </Alert>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                label="Plan"
                value={planFilter}
                onChange={(event) => setPlanFilter(event.target.value)}
              >
                <MenuItem value="all">All plans</MenuItem>
                {workspace.plans.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                label="Analytic account"
                value={accountFilter}
                onChange={(event) => setAccountFilter(event.target.value)}
              >
                <MenuItem value="all">All accounts</MenuItem>
                {workspace.accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                select
                fullWidth
                label="Source"
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
              >
                <MenuItem value="all">All sources</MenuItem>
                <MenuItem value="journal">Journal</MenuItem>
                <MenuItem value="invoice">Invoice</MenuItem>
                <MenuItem value="bill">Bill</MenuItem>
                <MenuItem value="budget">Budget</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                select
                fullWidth
                label="Status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <MenuItem value="all">All status</MenuItem>
                <MenuItem value="validated">Validated</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                label="Search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Project, partner, memo"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                type="date"
                label="From"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                type="date"
                label="To"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Net analytic amount"
            value={formatCurrency(totalAmount)}
            helper="Signed total across the filtered analytic move lines"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Validation rate"
            value={`${validationRate}%`}
            helper={`${validatedCount} of ${filteredItems.length} lines validated`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Plans in scope"
            value={planSummaries.length}
            helper="Analytic plans contributing to the current reporting slice"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Exceptions"
            value={exceptionCount}
            helper="Lines still failing mandatory-dimension or review controls"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 8 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Plan Slices
                </Typography>
                <Grid container spacing={2}>
                  {planSummaries.map((plan) => (
                    <Grid key={plan.id} size={{ xs: 12, md: 6 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: `${plan.color}12`,
                          border: `1px solid ${plan.color}30`,
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" spacing={1}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={700}>
                              {plan.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {plan.applicability.join(', ')}
                            </Typography>
                          </Box>
                          <Chip
                            label={`${plan.exceptionCount} exceptions`}
                            size="small"
                            color={plan.exceptionCount ? 'warning' : 'success'}
                          />
                        </Stack>
                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                          sx={{ mt: 1.5 }}
                        >
                          {plan.mandatoryDimensions.map((dimension) => (
                            <Chip
                              key={`${plan.id}-${dimension}`}
                              label={dimension}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                        <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                          <Grid size={{ xs: 4 }}>
                            <Typography variant="caption" color="text.secondary">
                              Accounts
                            </Typography>
                            <Typography variant="body2" fontWeight={700}>
                              {plan.accountCount}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 4 }}>
                            <Typography variant="caption" color="text.secondary">
                              Lines
                            </Typography>
                            <Typography variant="body2" fontWeight={700}>
                              {plan.itemCount}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 4 }}>
                            <Typography variant="caption" color="text.secondary">
                              Net
                            </Typography>
                            <Typography variant="body2" fontWeight={700}>
                              {formatCurrency(plan.netAmount)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Top Analytic Accounts
                </Typography>
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th align="left">Account</th>
                        <th align="left">Plan</th>
                        <th align="right">Filtered amount</th>
                        <th align="left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topAccounts.map((account) => (
                        <tr key={account.id}>
                          <td style={{ padding: '12px 8px' }}>
                            <Stack spacing={0.25}>
                              <Typography variant="body2" fontWeight={700}>
                                {account.code} - {account.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {account.projectDistribution
                                  .map((entry) => `${entry.name} ${entry.percent}%`)
                                  .join(' | ')}
                              </Typography>
                            </Stack>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <Chip
                              label={account.planName}
                              size="small"
                              sx={{ bgcolor: `${account.planColor}20`, color: account.planColor }}
                            />
                          </td>
                          <td align="right" style={{ padding: '12px 8px', fontWeight: 700 }}>
                            {formatCurrency(account.filteredAmount)}
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <Chip
                              label={
                                account.exceptionCount
                                  ? `${account.exceptionCount} exceptions`
                                  : 'Validated'
                              }
                              size="small"
                              color={account.exceptionCount ? 'warning' : 'success'}
                            />
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
                  Analytic Move Lines
                </Typography>
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th align="left">Date</th>
                        <th align="left">Reference</th>
                        <th align="left">Account / Plan</th>
                        <th align="left">Project / Cost center</th>
                        <th align="right">Amount</th>
                        <th align="left">Status</th>
                        <th align="right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => (
                        <tr key={item.id}>
                          <td style={{ padding: '12px 8px' }}>{item.date}</td>
                          <td style={{ padding: '12px 8px' }}>
                            <Stack spacing={0.25}>
                              <Typography variant="body2" fontWeight={700}>
                                {item.reference}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.journalNumber} - {item.sourceType}
                              </Typography>
                            </Stack>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <Stack spacing={0.25}>
                              <Typography variant="body2" fontWeight={700}>
                                {item.accountCode} - {item.accountName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.planName}
                              </Typography>
                            </Stack>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <Stack spacing={0.25}>
                              <Typography variant="body2">{item.projectName}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.costCenterName} - {item.partnerName}
                              </Typography>
                            </Stack>
                          </td>
                          <td
                            align="right"
                            style={{
                              padding: '12px 8px',
                              fontWeight: 700,
                              color: item.amount >= 0 ? '#15803d' : '#b91c1c',
                            }}
                          >
                            {formatCurrency(item.amount)}
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <Chip
                              label={workspace.formatAnalyticStatus(item.distributionStatus)}
                              size="small"
                              color={
                                item.distributionStatus === 'validated'
                                  ? 'success'
                                  : item.distributionStatus === 'warning'
                                    ? 'warning'
                                    : 'default'
                              }
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
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Project Exposure
                </Typography>
                <Stack spacing={1.25}>
                  {topProjects.map((project) => (
                    <Stack key={project.name} direction="row" justifyContent="space-between">
                      <Typography variant="body2">{project.name}</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(project.amount)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Cost Center Exposure
                </Typography>
                <Stack spacing={1.25}>
                  {topCostCenters.map((center) => (
                    <Stack key={center.name} direction="row" justifyContent="space-between">
                      <Typography variant="body2">{center.name}</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(center.amount)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Governance Watchlist
                </Typography>
                <Stack spacing={1.25}>
                  {workspace.rules.map((rule) => (
                    <Box
                      key={rule.id}
                      sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                    >
                      <Stack direction="row" justifyContent="space-between" spacing={1}>
                        <Typography variant="body2" fontWeight={700}>
                          {rule.planName}
                        </Typography>
                        <Chip
                          label={`${rule.exceptionCount} exceptions`}
                          size="small"
                          color={rule.exceptionCount ? 'warning' : 'success'}
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {rule.mandatoryDimensions.join(', ') || 'No mandatory dimensions'}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {printOpen && (
        <PdfPrintLayout title="Analytic Report" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
