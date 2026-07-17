'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { exportReportExcel } from './reports-export';
import { ReportExportActions } from './report-export-actions';
import { getReportOverview, getReportsHomeCards } from './mock-data';

const toneMap = {
  info: 'info.main',
  warning: 'warning.main',
  success: 'success.main',
  error: 'error.main',
  secondary: 'secondary.main',
  primary: 'primary.main',
};

export default function ReportsHome() {
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);
  const overview = getReportOverview();
  const cards = getReportsHomeCards();

  const exportConfig = useMemo(
    () => ({
      title: 'Reports Workspace',
      subtitle: 'Accounting analysis command center',
      alerts: [
        {
          title: 'Reports module now has shared mock-driven drill-downs',
          description:
            'Use the workspace cards to move between ledger, liquidity, and leadership analysis without relying on redirect-only routes.',
        },
      ],
      summary: [
        { label: 'Net result', value: formatCurrency(overview.netResult) },
        { label: 'Bank balance', value: formatCurrency(overview.bankBalance) },
        { label: 'Open statement lines', value: overview.openStatementLines },
        { label: 'Accounts in scope', value: overview.accountCount },
      ],
      tables: [
        {
          title: 'Report Workspace Cards',
          columns: [
            { key: 'title', label: 'Report' },
            { key: 'description', label: 'Description' },
          ],
          rows: cards,
        },
      ],
      payload: { overview, cards },
    }),
    [cards, overview]
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
                  {table.columns.map((column) => (
                    <td key={column.key} style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                      {row[column.key]}
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

  const reportHref = (key) => paths.dashboard.accountingFinance.reports[key];

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
            Reports Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Shared accounting analysis hub for ledgers, liquidity, statements, and executive review.
          </Typography>
        </Box>
        <ReportExportActions
          actions={[
            {
              key: 'excel',
              onClick: () =>
                runAction(
                  'Export Reports Workspace',
                  () => exportReportExcel('reports-workspace', exportConfig),
                  'Reports workspace workbook exported'
                ),
              disabled: pendingAction !== null,
            },
            { key: 'print', onClick: () => setPrintOpen(true), disabled: pendingAction !== null },
          ]}
        />
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        Reports root is now a real workspace instead of a redirect, so accounting users can start
        from the right drill-down and export a review pack.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: 'Net result',
            value: formatCurrency(overview.netResult),
            icon: 'solar:chart-2-bold-duotone',
          },
          {
            label: 'Bank balance',
            value: formatCurrency(overview.bankBalance),
            icon: 'solar:wallet-money-bold-duotone',
          },
          {
            label: 'Open statement lines',
            value: overview.openStatementLines,
            icon: 'solar:bill-list-bold-duotone',
          },
          {
            label: 'Accounts in scope',
            value: overview.accountCount,
            icon: 'solar:calculator-bold-duotone',
          },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, xl: 3 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                      {item.value}
                    </Typography>
                  </Box>
                  <Iconify icon={item.icon} width={28} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid key={card.title} size={{ xs: 12, md: 6, xl: 4 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Box
                    sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.200', color: toneMap[card.tone] }}
                  >
                    <Iconify icon={card.icon} width={24} />
                  </Box>
                </Stack>
                <Typography variant="h6" fontWeight={700}>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 2 }}>
                  {card.description}
                </Typography>
                <Button
                  component={RouterLink}
                  href={reportHref(card.hrefKey)}
                  variant="contained"
                  fullWidth
                >
                  Open Report
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {printOpen && (
        <PdfPrintLayout title="Reports Workspace" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
