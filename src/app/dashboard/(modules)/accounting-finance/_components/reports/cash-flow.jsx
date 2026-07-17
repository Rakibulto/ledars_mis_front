'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { formatCurrency } from '../utils';
import { getCashFlowReport } from './mock-data';
import { ReportExportActions } from './report-export-actions';
import { exportReportJson, exportReportExcel } from './reports-export';

function SectionCard({ title, rows, total }) {
  return (
    <Card sx={{ height: '100%', borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} sx={{ textTransform: 'capitalize', mb: 2 }}>
          {title}
        </Typography>
        <Stack spacing={1.5}>
          {rows.map((item) => (
            <Stack key={item.name} direction="row" justifyContent="space-between" spacing={2}>
              <Typography variant="body2">{item.name}</Typography>
              <Typography variant="body2" fontWeight={700}>
                {formatCurrency(item.amount)}
              </Typography>
            </Stack>
          ))}
        </Stack>
        <Stack
          direction="row"
          justifyContent="space-between"
          sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}
        >
          <Typography variant="subtitle2">Total</Typography>
          <Typography variant="subtitle2" fontWeight={800}>
            {formatCurrency(total)}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function CashFlow() {
  const [viewMode, setViewMode] = useState('direct');
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);
  const report = useMemo(() => getCashFlowReport(), []);

  const exportConfig = useMemo(
    () => ({
      title: 'Cash Flow Statement',
      subtitle: `${viewMode === 'direct' ? 'Direct' : 'Indirect'} liquidity analysis`,
      summary: [
        { label: 'Opening balance', value: formatCurrency(report.openingBalance) },
        { label: 'Net change', value: formatCurrency(report.netChange) },
        { label: 'Closing balance', value: formatCurrency(report.closingBalance) },
        { label: 'Operating cash', value: formatCurrency(report.operatingTotal) },
      ],
      tables:
        viewMode === 'direct'
          ? [
              {
                title: 'Operating',
                columns: [
                  { key: 'name', label: 'Line' },
                  { key: 'amount', label: 'Amount' },
                ],
                rows: report.direct.operating,
              },
              {
                title: 'Investing',
                columns: [
                  { key: 'name', label: 'Line' },
                  { key: 'amount', label: 'Amount' },
                ],
                rows: report.direct.investing,
              },
              {
                title: 'Financing',
                columns: [
                  { key: 'name', label: 'Line' },
                  { key: 'amount', label: 'Amount' },
                ],
                rows: report.direct.financing,
              },
            ]
          : [
              {
                title: 'Indirect bridge',
                columns: [
                  { key: 'name', label: 'Line' },
                  { key: 'amount', label: 'Amount' },
                ],
                rows: report.indirect,
              },
            ],
      alerts: report.liquidityNotes.map((note) => ({ title: 'Liquidity note', description: note })),
      payload: { report, viewMode },
    }),
    [report, viewMode]
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
            Cash Flow
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Liquidity review across operating, investing, and financing movements with direct and
            indirect views.
          </Typography>
        </Box>
        <ReportExportActions
          actions={[
            {
              key: 'excel',
              onClick: () =>
                runAction(
                  'Export Cash Flow Excel',
                  () => exportReportExcel('cash-flow', exportConfig),
                  'Cash flow workbook exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'json',
              onClick: () =>
                runAction(
                  'Export Cash Flow JSON',
                  () => exportReportJson('cash-flow', exportConfig),
                  'Cash flow JSON exported'
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

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <ToggleButtonGroup
          exclusive
          value={viewMode}
          onChange={(_, value) => value && setViewMode(value)}
          size="small"
        >
          <ToggleButton value="direct">Direct</ToggleButton>
          <ToggleButton value="indirect">Indirect</ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="body2" color="text.secondary">
          Opening {formatCurrency(report.openingBalance)} | Net change{' '}
          {formatCurrency(report.netChange)} | Closing {formatCurrency(report.closingBalance)}
        </Typography>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Opening balance', value: formatCurrency(report.openingBalance) },
          { label: 'Operating cash', value: formatCurrency(report.operatingTotal) },
          { label: 'Net change', value: formatCurrency(report.netChange) },
          { label: 'Closing balance', value: formatCurrency(report.closingBalance) },
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

      {viewMode === 'direct' ? (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <SectionCard
              title="operating"
              rows={report.direct.operating}
              value={report.operatingTotal}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <SectionCard
              title="investing"
              rows={report.direct.investing}
              value={report.investingTotal}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <SectionCard
              title="financing"
              rows={report.direct.financing}
              value={report.financingTotal}
            />
          </Grid>
        </Grid>
      ) : (
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Indirect Bridge
            </Typography>
            <Stack spacing={1.5}>
              {report.indirect.map((item) => (
                <Stack key={item.name} direction="row" justifyContent="space-between">
                  <Typography variant="body2">{item.name}</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {formatCurrency(item.amount)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Stack spacing={1.5}>
        {report.liquidityNotes.map((note) => (
          <Alert key={note} severity="info" sx={{ borderRadius: 2 }}>
            {note}
          </Alert>
        ))}
      </Stack>

      {printOpen && (
        <PdfPrintLayout title="Cash Flow" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
