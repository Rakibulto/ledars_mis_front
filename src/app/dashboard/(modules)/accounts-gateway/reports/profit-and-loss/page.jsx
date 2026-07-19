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

function AmountTable({ title, rows }) {
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
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rows || []).map((row) => (
              <TableRow key={row.account_id || row.code} hover>
                <TableCell>{row.code}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell align="right">{Number(row.amount || 0).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function ProfitAndLossReportPage() {
  const [qs, setQs] = useState('');
  const { data } = useSWR(
    qs ? `${endpoints.accounting.gateway_profit_and_loss}?${qs}` : null,
    fetcher
  );
  const { dateFrom, dateTo } = parseDateRangeFromQs(qs);

  const exportRows = useMemo(() => {
    const income = (data?.income || []).map((r) => ({
      Section: 'Income',
      Code: r.code,
      Account: r.name,
      Amount: Number(r.amount || 0).toFixed(2),
    }));
    const expense = (data?.expense || []).map((r) => ({
      Section: 'Expense',
      Code: r.code,
      Account: r.name,
      Amount: Number(r.amount || 0).toFixed(2),
    }));
    return [...income, ...expense];
  }, [data]);

  const onExportCsv = () => {
    downloadCsv(`profit-and-loss-${dateFrom}-${dateTo}`, exportRows);
    toast.success('CSV downloaded.');
  };

  const onExportExcel = async () => {
    await downloadXlsx(`profit-and-loss-${dateFrom}-${dateTo}`, [
      {
        name: 'Income',
        rows: (data?.income || []).map((r) => ({
          Code: r.code,
          Account: r.name,
          Amount: Number(r.amount || 0).toFixed(2),
        })),
      },
      {
        name: 'Expense',
        rows: (data?.expense || []).map((r) => ({
          Code: r.code,
          Account: r.name,
          Amount: Number(r.amount || 0).toFixed(2),
        })),
      },
      {
        name: 'Summary',
        rows: [
          { Metric: 'Total Income', Amount: Number(data?.total_income || 0).toFixed(2) },
          { Metric: 'Total Expense', Amount: Number(data?.total_expense || 0).toFixed(2) },
          { Metric: 'Net Profit', Amount: Number(data?.net_profit || 0).toFixed(2) },
        ],
      },
    ]);
    toast.success('Excel downloaded.');
  };

  return (
    <GatewayPage
      heading="Profit & Loss"
      links={[
        { name: 'Dashboard', href: paths.dashboard.root },
        { name: 'Accounts', href: paths.dashboard.accountsGateway.root },
        { name: 'Reports', href: paths.dashboard.accountsGateway.reports.root },
        { name: 'Profit & Loss' },
      ]}
    >
      <GatewayDateFilters
        onApply={setQs}
        canExport={exportRows.length > 0}
        onExportCsv={onExportCsv}
        onExportExcel={onExportExcel}
      />
      {qs && (
        <GatewayReportBanner title="Profit & Loss A/c" dateFrom={dateFrom} dateTo={dateTo} />
      )}
      <Box className="print-area">
        <GatewayReportHeader title="Profit & Loss A/c" dateFrom={dateFrom} dateTo={dateTo} />
        {data && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <GatewayKpiCard
                title="Total income"
                total={Number(data.total_income || 0).toFixed(2)}
                icon="solar:graph-up-bold-duotone"
                color="success"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <GatewayKpiCard
                title="Total expense"
                total={Number(data.total_expense || 0).toFixed(2)}
                icon="solar:graph-down-bold-duotone"
                color="error"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <GatewayKpiCard
                title="Net profit"
                total={Number(data.net_profit || 0).toFixed(2)}
                icon="solar:wallet-money-bold-duotone"
                color="primary"
              />
            </Grid>
          </Grid>
        )}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <AmountTable title="Income" rows={data?.income} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <AmountTable title="Expense" rows={data?.expense} />
          </Grid>
        </Grid>
      </Box>
    </GatewayPage>
  );
}
