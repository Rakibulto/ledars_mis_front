'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
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

import { formatCurrency } from '../utils';
import { useBudgetsWorkspace } from './use-budgets-workspace';
import { BudgetsWorkspaceToolbar } from './budgets-workspace-toolbar';

function BudgetVsActual() {
  const workspace = useBudgetsWorkspace();
  const searchParams = useSearchParams();
  const [selectedBudgetId, setSelectedBudgetId] = useState(
    searchParams.get('budget') || workspace.budgets[0]?.id || ''
  );
  const [comparisonPeriodId, setComparisonPeriodId] = useState('q1_2026');
  const [selectedRowId, setSelectedRowId] = useState(null);

  useEffect(() => {
    const budgetFromQuery = searchParams.get('budget');
    if (budgetFromQuery) {
      setSelectedBudgetId(budgetFromQuery);
    }
  }, [searchParams]);

  const selectedBudget =
    workspace.budgets.find((budget) => String(budget.id) === String(selectedBudgetId)) ||
    workspace.budgets[0] ||
    null;
  const rows = useMemo(
    () => workspace.calculateBudgetVarianceRows(selectedBudget, comparisonPeriodId),
    [comparisonPeriodId, selectedBudget, workspace]
  );

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Account
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Planned
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Actual
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Commitments
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Encumbrance
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Variance
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {row.accountCode} • {row.accountName}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{row.planned}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{row.actual}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{row.commitments}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{row.encumbrance}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{row.variance}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const varianceSummary = useMemo(
    () => ({
      planned: rows.reduce((sum, row) => sum + row.planned, 0),
      actual: rows.reduce((sum, row) => sum + row.actual, 0),
      commitments: rows.reduce((sum, row) => sum + row.commitments, 0),
      encumbrance: rows.reduce((sum, row) => sum + row.encumbrance, 0),
      variance: rows.reduce((sum, row) => sum + row.variance, 0),
    }),
    [rows]
  );

  const selectedRow = rows.find((row) => row.id === selectedRowId) || rows[0] || null;
  const criticalRows = rows.filter((row) => row.status === 'critical').length;
  const warningRows = rows.filter((row) => row.status === 'warning').length;

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
            Budget vs Actual
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Variance engine with comparison periods, commitments, encumbrances, and direct
            drill-down into editable line planning.
          </Typography>
        </Box>
      </Stack>

      <BudgetsWorkspaceToolbar printTitle="Budget vs Actual" printContent={printContent} />

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Budget Plan"
                value={selectedBudget?.id || ''}
                onChange={(event) => setSelectedBudgetId(event.target.value)}
              >
                {workspace.budgets.map((budget) => (
                  <MenuItem key={budget.id} value={budget.id}>
                    {budget.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Comparison Period"
                value={comparisonPeriodId}
                onChange={(event) => setComparisonPeriodId(event.target.value)}
              >
                {workspace.comparisonPeriods.map((period) => (
                  <MenuItem key={period.id} value={period.id}>
                    {period.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Planned
              </Typography>
              <Typography variant="h6" fontWeight={800}>
                {formatCurrency(varianceSummary.planned)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Actual
              </Typography>
              <Typography variant="h6" fontWeight={800}>
                {formatCurrency(varianceSummary.actual)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Commitments + Encumbrance
              </Typography>
              <Typography variant="h6" fontWeight={800}>
                {formatCurrency(varianceSummary.commitments + varianceSummary.encumbrance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Variance
              </Typography>
              <Typography
                variant="h6"
                fontWeight={800}
                color={varianceSummary.variance >= 0 ? 'success.main' : 'error.main'}
              >
                {varianceSummary.variance >= 0 ? '+' : ''}
                {formatCurrency(varianceSummary.variance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 8 }}>
          <Card sx={{ borderRadius: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Account Line</TableCell>
                    <TableCell align="right">Planned</TableCell>
                    <TableCell align="right">Actual</TableCell>
                    <TableCell align="right">Commitments</TableCell>
                    <TableCell align="right">Encumbrance</TableCell>
                    <TableCell align="right">Variance</TableCell>
                    <TableCell align="right">Var %</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      selected={selectedRow?.id === row.id}
                      onClick={() => setSelectedRowId(row.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Stack spacing={0.4}>
                          <Typography variant="body2" fontWeight={700}>
                            {row.accountCode} • {row.accountName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Owner: {row.owner}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">{formatCurrency(row.planned)}</TableCell>
                      <TableCell align="right">{formatCurrency(row.actual)}</TableCell>
                      <TableCell align="right">{formatCurrency(row.commitments)}</TableCell>
                      <TableCell align="right">{formatCurrency(row.encumbrance)}</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: row.variance >= 0 ? 'success.main' : 'error.main',
                          fontWeight: 700,
                        }}
                      >
                        {row.variance >= 0 ? '+' : ''}
                        {formatCurrency(row.variance)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: row.variance >= 0 ? 'success.main' : 'error.main' }}
                      >
                        {row.variancePercent.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={workspace.formatBudgetStatus(row.status)}
                          size="small"
                          color={
                            row.status === 'critical'
                              ? 'error'
                              : row.status === 'warning'
                                ? 'warning'
                                : 'success'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          component={RouterLink}
                          href={`${paths.dashboard.accountingFinance.budgets.lines}?budget=${selectedBudget?.id}&account=${encodeURIComponent(row.accountCode)}`}
                          size="small"
                          variant="outlined"
                          color="inherit"
                          onClick={(event) => event.stopPropagation()}
                        >
                          View Lines
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Plan Review
              </Typography>
              {selectedBudget ? (
                <Stack spacing={1.25}>
                  <Typography variant="body2" fontWeight={700}>
                    {selectedBudget.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedBudget.department} • {selectedBudget.owner}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip label={`${selectedBudget.lines.length} lines`} size="small" />
                    <Chip
                      label={`${selectedBudget.versions[0]?.label || 'Version 1.0'}`}
                      size="small"
                    />
                    <Chip
                      label={`${criticalRows} critical`}
                      size="small"
                      color={criticalRows ? 'error' : 'default'}
                    />
                    <Chip
                      label={`${warningRows} warning`}
                      size="small"
                      color={warningRows ? 'warning' : 'default'}
                    />
                  </Stack>
                  <Button
                    component={RouterLink}
                    href={`${paths.dashboard.accountingFinance.budgets.lines}?budget=${selectedBudget.id}`}
                    variant="contained"
                  >
                    Open Line Manager
                  </Button>
                </Stack>
              ) : null}
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Selected Variance
              </Typography>
              {selectedRow ? (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      {selectedRow.accountCode} • {selectedRow.accountName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Owner: {selectedRow.owner}
                    </Typography>
                  </Box>
                  <Alert
                    severity={
                      selectedRow.status === 'critical'
                        ? 'error'
                        : selectedRow.status === 'warning'
                          ? 'warning'
                          : 'success'
                    }
                  >
                    {selectedRow.status === 'critical'
                      ? 'Variance is materially off plan and needs reforecast or control action.'
                      : selectedRow.status === 'warning'
                        ? 'Variance needs review before additional commitments are released.'
                        : 'Variance is within the current budget tolerance.'}
                  </Alert>
                  <Grid container spacing={1.5}>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary">
                        Available
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(selectedRow.available)}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary">
                        Variance
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(selectedRow.variance)}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Divider />
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Variance Drivers
                    </Typography>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Actual spending</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(selectedRow.actual)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Commitments</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(selectedRow.commitments)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Encumbrance</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(selectedRow.encumbrance)}
                      </Typography>
                    </Stack>
                  </Stack>
                  <Button
                    component={RouterLink}
                    href={`${paths.dashboard.accountingFinance.budgets.lines}?budget=${selectedBudget.id}&account=${encodeURIComponent(selectedRow.accountCode)}`}
                    variant="contained"
                  >
                    Drill Into Line Manager
                  </Button>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Select a variance row to inspect drivers and jump into editing.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Period Comparison
              </Typography>
              <Stack spacing={1.25}>
                {(selectedBudget?.actualsByPeriod || [])
                  .filter((period) =>
                    workspace.comparisonPeriods
                      .find((item) => item.id === comparisonPeriodId)
                      ?.periodLabels.includes(period.label)
                  )
                  .map((period) => (
                    <Stack key={period.label} direction="row" justifyContent="space-between">
                      <Typography variant="body2">{period.label}</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(period.actual)} / {formatCurrency(period.planned)}
                      </Typography>
                    </Stack>
                  ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default BudgetVsActual;
