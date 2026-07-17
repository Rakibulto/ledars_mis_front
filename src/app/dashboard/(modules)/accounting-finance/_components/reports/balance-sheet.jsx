'use client';

import { toast } from 'sonner';
import NextLink from 'next/link';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
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

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { formatCurrency } from '../utils';
import { getBalanceSheetReport } from './mock-data';
import { ReportExportActions } from './report-export-actions';
import { exportReportJson, exportReportExcel } from './reports-export';

function StatementSection({ title, rows, total, tone }) {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
          <Chip label={formatCurrency(total)} color={tone} variant="outlined" />
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Account</TableCell>
                <TableCell align="right">Current</TableCell>
                <TableCell align="right">Comparative</TableCell>
                <TableCell align="right">Variance</TableCell>
                <TableCell align="right">Drilldown</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Stack spacing={0.35}>
                      <Typography variant="body2" fontWeight={700}>
                        {row.code} - {row.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.typeName}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(row.balance)}</TableCell>
                  <TableCell align="right">{formatCurrency(row.comparativeBalance)}</TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: row.variance >= 0 ? 'success.main' : 'error.main',
                      fontWeight: 700,
                    }}
                  >
                    {formatCurrency(row.variance)}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      component={NextLink}
                      href={paths.dashboard.accountingFinance.reports.accountLedger}
                      size="small"
                    >
                      Account Ledger
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

export default function BalanceSheet() {
  const [asOfDate, setAsOfDate] = useState('2026-03-29');
  const [comparisonDate, setComparisonDate] = useState('2025-12-31');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('consolidated');
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);
  const report = useMemo(() => getBalanceSheetReport({ asOfDate, search }), [asOfDate, search]);

  const comparisonFactor = useMemo(() => {
    const baseDate = new Date(`${asOfDate}T00:00:00`).getTime();
    const compareDate = new Date(`${comparisonDate}T00:00:00`).getTime();
    const dayGap = Math.max(0, Math.round((baseDate - compareDate) / (1000 * 60 * 60 * 24)));
    return Math.max(0.72, 1 - dayGap / 1000);
  }, [asOfDate, comparisonDate]);

  const comparativeSections = useMemo(() => {
    const mapRows = (rows) =>
      rows.map((row) => ({
        ...row,
        comparativeBalance: Number(row.balance || 0) * comparisonFactor,
        variance: Number(row.balance || 0) - Number(row.balance || 0) * comparisonFactor,
      }));

    return {
      assets: mapRows(report.sections.assets),
      liabilities: mapRows(report.sections.liabilities),
      equity: mapRows(report.sections.equity),
    };
  }, [
    comparisonFactor,
    report.sections.assets,
    report.sections.equity,
    report.sections.liabilities,
  ]);

  const consolidatedEntities = useMemo(() => {
    const assets = report.totalAssets;
    const liabilities = report.totalLiabilities;
    const equity = report.totalEquity;

    return [
      {
        id: 'core',
        entity: 'NGO Core',
        assets: assets * 0.46,
        liabilities: liabilities * 0.38,
        equity: equity * 0.42,
      },
      {
        id: 'programs',
        entity: 'Programs',
        assets: assets * 0.39,
        liabilities: liabilities * 0.33,
        equity: equity * 0.36,
      },
      {
        id: 'shared',
        entity: 'Shared Services',
        assets: assets * 0.15,
        liabilities: liabilities * 0.29,
        equity: equity * 0.22,
      },
    ].map((row) => ({
      ...row,
      netAssets: row.assets - row.liabilities,
    }));
  }, [report.totalAssets, report.totalEquity, report.totalLiabilities]);

  const exportConfig = useMemo(
    () => ({
      title: 'Balance Sheet',
      subtitle: `As of ${report.asOfDate} compared with ${comparisonDate}`,
      summary: [
        { label: 'Assets', value: formatCurrency(report.totalAssets) },
        { label: 'Liabilities', value: formatCurrency(report.totalLiabilities) },
        { label: 'Equity', value: formatCurrency(report.totalEquity) },
        { label: 'Net assets', value: formatCurrency(report.netAssets) },
      ],
      controlChecks: [
        {
          label: 'Balance control',
          value:
            report.controlStatus === 'balanced'
              ? 'Assets match liabilities and equity'
              : `Gap ${formatCurrency(report.balancingGap)}`,
          status: report.controlStatus === 'balanced' ? 'success' : 'warning',
        },
      ],
      tables: [
        {
          title: 'Assets',
          columns: [
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Name' },
            { key: 'balance', label: 'Current' },
            { key: 'comparativeBalance', label: 'Comparative' },
            { key: 'variance', label: 'Variance' },
          ],
          rows: comparativeSections.assets,
        },
        {
          title: 'Liabilities',
          columns: [
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Name' },
            { key: 'balance', label: 'Current' },
            { key: 'comparativeBalance', label: 'Comparative' },
            { key: 'variance', label: 'Variance' },
          ],
          rows: comparativeSections.liabilities,
        },
        {
          title: 'Equity',
          columns: [
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Name' },
            { key: 'balance', label: 'Current' },
            { key: 'comparativeBalance', label: 'Comparative' },
            { key: 'variance', label: 'Variance' },
          ],
          rows: comparativeSections.equity,
        },
        {
          title: 'Consolidated Entities',
          columns: [
            { key: 'entity', label: 'Entity' },
            { key: 'assets', label: 'Assets' },
            { key: 'liabilities', label: 'Liabilities' },
            { key: 'equity', label: 'Equity' },
            { key: 'netAssets', label: 'Net Assets' },
          ],
          rows: consolidatedEntities,
        },
      ],
      payload: {
        report,
        comparativeSections,
        consolidatedEntities,
        filters: { asOfDate, comparisonDate, search, viewMode },
      },
    }),
    [asOfDate, comparisonDate, comparativeSections, consolidatedEntities, report, search, viewMode]
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
                        /balance|amount|debit|credit|net|cost|budget|actual|available|variance|opening|closing|total|value|assets|liabilities|equity|comparative/i.test(
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
            Balance Sheet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Statement of financial position with asset, liability, and equity control posture.
          </Typography>
        </Box>
        <ReportExportActions
          actions={[
            {
              key: 'excel',
              onClick: () =>
                runAction(
                  'Export Balance Sheet Excel',
                  () => exportReportExcel('balance-sheet', exportConfig),
                  'Balance sheet workbook exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'json',
              onClick: () =>
                runAction(
                  'Export Balance Sheet JSON',
                  () => exportReportJson('balance-sheet', exportConfig),
                  'Balance sheet JSON exported'
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
                label="View"
                value={viewMode}
                onChange={(event) => setViewMode(event.target.value)}
              >
                <MenuItem value="single">Single Entity</MenuItem>
                <MenuItem value="consolidated">Consolidated View</MenuItem>
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

      {report.controlStatus !== 'balanced' ? (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          The mock statement currently shows a balancing difference of{' '}
          {formatCurrency(report.balancingGap)}. The report still surfaces full account detail for
          review.
        </Alert>
      ) : null}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Assets', value: formatCurrency(report.totalAssets) },
          { label: 'Liabilities', value: formatCurrency(report.totalLiabilities) },
          { label: 'Equity', value: formatCurrency(report.totalEquity) },
          {
            label: 'Comparative delta',
            value: formatCurrency(
              report.totalAssets -
                comparativeSections.assets.reduce((sum, row) => sum + row.comparativeBalance, 0)
            ),
          },
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
          <StatementSection
            title="Assets"
            rows={comparativeSections.assets}
            value={report.totalAssets}
            tone="info"
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Stack spacing={3}>
            <StatementSection
              title="Liabilities"
              rows={comparativeSections.liabilities}
              value={report.totalLiabilities}
              tone="error"
            />
            <StatementSection
              title="Equity"
              rows={comparativeSections.equity}
              value={report.totalEquity}
              tone="success"
            />
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Liabilities + Equity
                    </Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                      {formatCurrency(report.totalLiabilitiesAndEquity)}
                    </Typography>
                  </Box>
                  <Chip
                    label={report.controlStatus}
                    color={report.controlStatus === 'balanced' ? 'success' : 'warning'}
                  />
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  This view follows the Odoo-style statement posture with comparative periods,
                  account-ledger drill-through cues, and a consolidated entity lens for leadership
                  review.
                </Typography>
              </CardContent>
            </Card>
            {viewMode === 'consolidated' ? (
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Consolidated View
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Entity</TableCell>
                          <TableCell align="right">Assets</TableCell>
                          <TableCell align="right">Liabilities</TableCell>
                          <TableCell align="right">Equity</TableCell>
                          <TableCell align="right">Net Assets</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {consolidatedEntities.map((row) => (
                          <TableRow key={row.id} hover>
                            <TableCell>{row.entity}</TableCell>
                            <TableCell align="right">{formatCurrency(row.assets)}</TableCell>
                            <TableCell align="right">{formatCurrency(row.liabilities)}</TableCell>
                            <TableCell align="right">{formatCurrency(row.equity)}</TableCell>
                            <TableCell align="right">{formatCurrency(row.netAssets)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            ) : null}
          </Stack>
        </Grid>
      </Grid>

      {printOpen && (
        <PdfPrintLayout title="Balance Sheet" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
