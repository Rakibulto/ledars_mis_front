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
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useYearEndWorkspace } from './use-year-end-workspace';
import { YearEndWorkspaceToolbar } from './year-end-workspace-toolbar';
import {
  exportYearEndCsv,
  printYearEndPack,
  exportYearEndJson,
  exportYearEndExcel,
} from './year-end-export';

function SummaryCard({ label, value, helper, icon, color }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              {helper}
            </Typography>
          </Box>
          <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: `${color}15`, color }}>
            <Iconify icon={icon} width={24} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

const WORKSPACE_LINKS = [
  {
    title: 'Year-End Closing',
    description:
      'Advance the close workflow, publish the close certificate, and review prior close history.',
    href: paths.dashboard.accountingFinance.yearEnd.yearEndClosing,
    icon: 'solar:check-read-bold-duotone',
  },
  {
    title: 'Opening Entries',
    description: 'Generate and publish the carry-forward batch for the next fiscal year.',
    href: paths.dashboard.accountingFinance.yearEnd.openingEntries,
    icon: 'solar:document-add-bold-duotone',
  },
  {
    title: 'Period Lock',
    description: 'Control soft-lock and hard-close posture before final year certification.',
    href: paths.dashboard.accountingFinance.yearEnd.periodLock,
    icon: 'solar:lock-keyhole-bold-duotone',
  },
];

export default function YearEndHome() {
  const [pendingAction, setPendingAction] = useState(null);
  const {
    selectedFiscalYearId,
    fiscalYears,
    overview,
    alerts,
    steps,
    closingHistory,
    periods,
    openingBatch,
    actions,
  } = useYearEndWorkspace();

  const selectedYear = fiscalYears.find((year) => year.id === selectedFiscalYearId);
  const openPeriods = periods.filter((period) => period.status !== 'closed').length;
  const completedSteps = steps.filter((step) => step.status === 'complete').length;

  const exportConfig = useMemo(
    () => ({
      title: 'Year-End Overview Workspace',
      subtitle: selectedYear?.name || 'Year-end overview',
      alerts,
      summary: [
        { label: 'Retained earnings', value: formatCurrency(overview.retainedEarnings) },
        { label: 'Close progress', value: `${completedSteps}/${steps.length}` },
        { label: 'Periods open', value: openPeriods },
        { label: 'Opening batch', value: openingBatch.batchStatus },
      ],
      tables: [
        {
          title: 'Close Workflow',
          columns: [
            { key: 'label', label: 'Step' },
            { key: 'status', label: 'Status' },
            { key: 'helper', label: 'Review Note' },
          ],
          rows: steps,
        },
        {
          title: 'Recent Closings',
          columns: [
            { key: 'fiscal_year', label: 'Fiscal Year' },
            { key: 'closing_date', label: 'Closing Date' },
            { key: 'closed_by', label: 'Closed By' },
            { key: 'status', label: 'Status' },
          ],
          rows: closingHistory,
        },
      ],
      controlChecks: [
        {
          label: 'Period posture',
          value: openPeriods ? 'Open periods remain' : 'All periods locked',
          description:
            'Use the period lock workspace to finish year-end control posture before publish.',
        },
        {
          label: 'Opening entries',
          value: openingBatch.batchStatus,
          description:
            'Opening balances must be generated and published before the close pack is considered final.',
        },
      ],
      payload: { selectedYear, overview, steps, closingHistory, periods, openingBatch },
    }),
    [
      alerts,
      closingHistory,
      completedSteps,
      openPeriods,
      openingBatch,
      overview,
      periods,
      selectedYear,
      steps,
    ]
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

  const printContent = (
    <div>
      {alerts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Alerts</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <tbody>
              {alerts.map((alert, idx) => (
                <tr key={idx}>
                  <td
                    style={{
                      border: '1px solid #ddd',
                      padding: '6px 8px',
                      fontWeight: 600,
                      width: '30%',
                    }}
                  >
                    {alert.title}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                    {alert.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Summary</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <tbody>
            {exportConfig.summary.map((item, idx) => (
              <tr key={idx}>
                <td
                  style={{
                    border: '1px solid #ddd',
                    padding: '6px 8px',
                    fontWeight: 600,
                    width: '40%',
                  }}
                >
                  {item.label}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                  {String(item.value ?? '—')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {exportConfig.tables.map((table, tIdx) => (
        <div key={tIdx} style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{table.title}</div>
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
              {table.rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {table.columns.map((column) => (
                    <td key={column.key} style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                      {typeof row[column.key] === 'object' && row[column.key] !== null
                        ? JSON.stringify(row[column.key])
                        : String(row[column.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );

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
            Year-End Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Overview cockpit for close readiness, opening balances, lock posture, and close history.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:refresh-bold" />}
            onClick={() =>
              runAction(
                'Advance Close Review',
                () => Promise.resolve(actions.advanceStep(selectedFiscalYearId)),
                'Year-end review advanced'
              )
            }
            disabled={pendingAction !== null}
          >
            Mark Next Step
          </Button>
        </Stack>
      </Stack>

      <YearEndWorkspaceToolbar
        fiscalYears={fiscalYears}
        selectedFiscalYearId={selectedFiscalYearId}
        onFiscalYearChange={actions.setFiscalYear}
        exportDisabled={pendingAction !== null}
        onExportExcel={() =>
          runAction(
            'Export Year-End Workbook',
            () => exportYearEndExcel('year-end-overview', exportConfig),
            'Year-end workbook exported'
          )
        }
        onExportCsv={() =>
          runAction(
            'Export Year-End CSV',
            () => exportYearEndCsv('year-end-overview', exportConfig),
            'Year-end CSV exported'
          )
        }
        onExportJson={() =>
          runAction(
            'Export Year-End JSON',
            () => exportYearEndJson('year-end-overview', exportConfig),
            'Year-end JSON exported'
          )
        }
        printTitle="Year-End Workspace"
        printContent={printContent}
      />

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {alerts.map((alert) => (
          <Alert key={alert.id} severity={alert.severity} sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {alert.title}
            </Typography>
            {alert.description}
          </Alert>
        ))}
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Retained earnings"
            value={formatCurrency(overview.retainedEarnings)}
            helper="Net movement transferred into closing equity"
            icon="solar:wallet-money-bold-duotone"
            color="#2563eb"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Close progress"
            value={`${completedSteps}/${steps.length}`}
            helper="Workflow steps marked complete in the current close cycle"
            icon="solar:checklist-minimalistic-bold-duotone"
            color="#059669"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Periods still open"
            value={openPeriods}
            helper="Remaining posting windows before final certification"
            icon="solar:lock-keyhole-bold-duotone"
            color="#d97706"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Opening batch"
            value={openingBatch.batchStatus}
            helper={`${openingBatch.entries.length} carry-forward lines prepared`}
            icon="solar:document-add-bold-duotone"
            color="#7c3aed"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {WORKSPACE_LINKS.map((item) => (
          <Grid key={item.title} size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Box
                  sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.200', width: 'fit-content', mb: 2 }}
                >
                  <Iconify icon={item.icon} width={24} />
                </Box>
                <Typography variant="h6" fontWeight={700}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 2 }}>
                  {item.description}
                </Typography>
                <Button component={RouterLink} href={item.href} variant="contained" fullWidth>
                  Open Workspace
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Close Readiness Review
              </Typography>
              <Stack divider={<Divider flexItem />}>
                {steps.map((step) => (
                  <Stack
                    key={step.id}
                    direction={{ xs: 'column', md: 'row' }}
                    justifyContent="space-between"
                    spacing={1.5}
                    sx={{ py: 1.5 }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {step.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {step.description}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={step.status}
                        size="small"
                        color={
                          step.status === 'complete'
                            ? 'success'
                            : step.status === 'current'
                              ? 'warning'
                              : 'default'
                        }
                      />
                      <Typography variant="caption" color="text.secondary">
                        {step.helper}
                      </Typography>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Recent Closings
                </Typography>
                <Stack spacing={1.5}>
                  {closingHistory.map((entry) => (
                    <Box
                      key={entry.id}
                      sx={{ p: 2, borderRadius: 2, bgcolor: 'background.neutral' }}
                    >
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={700}>
                          {entry.fiscal_year}
                        </Typography>
                        <Chip label={entry.status} size="small" color="success" />
                      </Stack>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block' }}
                      >
                        Closed on {entry.closing_date} by {entry.closed_by}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.75 }}>
                        Retained earnings {formatCurrency(entry.retained_earnings)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Export and Review
                </Typography>
                <Stack spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={() =>
                      runAction(
                        'Export Year-End CSV',
                        () => exportYearEndCsv('year-end-overview', exportConfig),
                        'Year-end CSV exported'
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
                        'Export Year-End JSON',
                        () => exportYearEndJson('year-end-overview', exportConfig),
                        'Year-end JSON exported'
                      )
                    }
                    disabled={pendingAction !== null}
                  >
                    Export JSON
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() =>
                      runAction(
                        'Print Year-End Pack',
                        () => printYearEndPack(exportConfig),
                        'Year-end pack opened'
                      )
                    }
                    disabled={pendingAction !== null}
                  >
                    Print Pack
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
