'use client';

import useSWR from 'swr';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';

import { endpoints, fetcher } from 'src/utils/axios';

import { toast } from 'src/components/snackbar';

import { GatewayPage } from '../../_components/gateway-page';
import { GatewayDateFilters } from '../../_components/gateway-date-filters';
import { GatewayKpiCard } from '../../_components/gateway-kpi-card';
import {
  GatewayReportBanner,
  GatewayReportHeader,
} from '../../_components/gateway-report-header';
import {
  downloadCsv,
  downloadXlsx,
  parseDateRangeFromQs,
} from '../../_components/gateway-export';

function Section({ title, rows, total }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Account</TableCell>
              <TableCell align="right">Balance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rows || []).map((row) => (
              <TableRow key={row.account_id || row.code} hover>
                <TableCell>{row.code}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell align="right">{Number(row.balance || 0).toFixed(2)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={2}>
                <strong>Total</strong>
              </TableCell>
              <TableCell align="right">
                <strong>{Number(total || 0).toFixed(2)}</strong>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function BalanceSheetReportPage() {
  const [qs, setQs] = useState('');
  const { data } = useSWR(
    qs ? `${endpoints.accounting.gateway_balance_sheet}?${qs}` : null,
    fetcher
  );
  const { dateFrom, dateTo } = parseDateRangeFromQs(qs);
  const asOf = data?.as_of || dateTo;

  const exportRows = useMemo(() => {
    const mapSection = (section, rows) =>
      (rows || []).map((r) => ({
        Section: section,
        Code: r.code,
        Account: r.name,
        Balance: Number(r.balance || 0).toFixed(2),
      }));
    return [
      ...mapSection('Assets', data?.assets),
      ...mapSection('Liabilities', data?.liabilities),
      ...mapSection('Equity', data?.equity),
    ];
  }, [data]);

  const onExportCsv = () => {
    downloadCsv(`balance-sheet-${asOf}`, exportRows);
    toast.success('CSV downloaded.');
  };

  const onExportExcel = async () => {
    await downloadXlsx(`balance-sheet-${asOf}`, [
      {
        name: 'Assets',
        rows: (data?.assets || []).map((r) => ({
          Code: r.code,
          Account: r.name,
          Balance: Number(r.balance || 0).toFixed(2),
        })),
      },
      {
        name: 'Liabilities',
        rows: (data?.liabilities || []).map((r) => ({
          Code: r.code,
          Account: r.name,
          Balance: Number(r.balance || 0).toFixed(2),
        })),
      },
      {
        name: 'Equity',
        rows: (data?.equity || []).map((r) => ({
          Code: r.code,
          Account: r.name,
          Balance: Number(r.balance || 0).toFixed(2),
        })),
      },
      {
        name: 'Totals',
        rows: [
          { Metric: 'Total Assets', Amount: Number(data?.total_assets || 0).toFixed(2) },
          {
            Metric: 'Total Liabilities',
            Amount: Number(data?.total_liabilities || 0).toFixed(2),
          },
          { Metric: 'Total Equity', Amount: Number(data?.total_equity || 0).toFixed(2) },
        ],
      },
    ]);
    toast.success('Excel downloaded.');
  };

  return (
    <GatewayPage
      heading="Balance Sheet"
      links={[
        { name: 'Dashboard', href: paths.dashboard.root },
        { name: 'Accounts', href: paths.dashboard.accountsGateway.root },
        { name: 'Reports', href: paths.dashboard.accountsGateway.reports.root },
        { name: 'Balance Sheet' },
      ]}
    >
      <GatewayDateFilters
        onApply={setQs}
        canExport={exportRows.length > 0}
        onExportCsv={onExportCsv}
        onExportExcel={onExportExcel}
      />
      {qs && (
        <GatewayReportBanner
          title="Balance Sheet"
          dateFrom={dateFrom}
          dateTo={dateTo}
          asOf={asOf}
        />
      )}
      <Box className="print-area">
        <GatewayReportHeader title="Balance Sheet" asOf={asOf} />
        {data && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <GatewayKpiCard
                title="Assets"
                total={Number(data.total_assets || 0).toFixed(2)}
                icon="solar:safe-square-bold-duotone"
                color="success"
                helper={`As of ${data.as_of}`}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <GatewayKpiCard
                title="Liabilities"
                total={Number(data.total_liabilities || 0).toFixed(2)}
                icon="solar:bill-list-bold-duotone"
                color="warning"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <GatewayKpiCard
                title="Equity"
                total={Number(data.total_equity || 0).toFixed(2)}
                icon="solar:crown-star-bold-duotone"
                color="info"
              />
            </Grid>
          </Grid>
        )}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Section title="Assets" rows={data?.assets} total={data?.total_assets} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Section title="Liabilities" rows={data?.liabilities} total={data?.total_liabilities} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Section title="Equity" rows={data?.equity} total={data?.total_equity} />
          </Grid>
        </Grid>
      </Box>
    </GatewayPage>
  );
}
