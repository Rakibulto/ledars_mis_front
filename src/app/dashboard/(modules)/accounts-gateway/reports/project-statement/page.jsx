'use client';

import useSWR from 'swr';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
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
import { useGatewayProject } from '../../_components/gateway-project-context';
import {
  GatewayReportBanner,
  GatewayReportHeader,
} from '../../_components/gateway-report-header';
import {
  downloadCsv,
  downloadXlsx,
  parseDateRangeFromQs,
} from '../../_components/gateway-export';

export default function ProjectStatementPage() {
  const { projectId, project } = useGatewayProject();
  const [qs, setQs] = useState('');
  const { data, error } = useSWR(
    qs && projectId ? `${endpoints.accounting.gateway_project_statement}?${qs}` : null,
    fetcher
  );
  const { dateFrom, dateTo } = parseDateRangeFromQs(qs);

  const exportRows = useMemo(() => {
    const income = (data?.income_lines || []).map((r) => ({
      Section: 'Income',
      Code: r.code,
      Account: r.name,
      Amount: Number(r.amount || 0).toFixed(2),
    }));
    const expense = (data?.expense_lines || []).map((r) => ({
      Section: 'Expense',
      Code: r.code,
      Account: r.name,
      Amount: Number(r.amount || 0).toFixed(2),
    }));
    return [...income, ...expense];
  }, [data]);

  const onExportCsv = () => {
    downloadCsv(
      `project-statement-${project?.code || projectId}-${dateFrom}-${dateTo}`,
      exportRows
    );
    toast.success('CSV downloaded.');
  };

  const onExportExcel = async () => {
    await downloadXlsx(
      `project-statement-${project?.code || projectId}-${dateFrom}-${dateTo}`,
      [
        {
          name: 'Income',
          rows: (data?.income_lines || []).map((r) => ({
            Code: r.code,
            Account: r.name,
            Amount: Number(r.amount || 0).toFixed(2),
          })),
        },
        {
          name: 'Expense',
          rows: (data?.expense_lines || []).map((r) => ({
            Code: r.code,
            Account: r.name,
            Amount: Number(r.amount || 0).toFixed(2),
          })),
        },
        {
          name: 'Summary',
          rows: [
            {
              Metric: 'Income',
              Amount: Number(data?.profit_and_loss?.total_income || 0).toFixed(2),
            },
            {
              Metric: 'Expense',
              Amount: Number(data?.profit_and_loss?.total_expense || 0).toFixed(2),
            },
            {
              Metric: 'Net',
              Amount: Number(data?.profit_and_loss?.net_profit || 0).toFixed(2),
            },
            { Metric: 'Entries', Amount: data?.voucher_entry_count || 0 },
          ],
        },
      ]
    );
    toast.success('Excel downloaded.');
  };

  return (
    <GatewayPage
      heading="Project Statement"
      links={[
        { name: 'Dashboard', href: paths.dashboard.root },
        { name: 'Accounts', href: paths.dashboard.accountsGateway.root },
        { name: 'Reports', href: paths.dashboard.accountsGateway.reports.root },
        { name: 'Project Statement' },
      ]}
    >
      {!projectId && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Select an NGO project in the context bar first — this report is project-wise only.
        </Alert>
      )}
      <GatewayDateFilters
        onApply={setQs}
        canExport={exportRows.length > 0}
        onExportCsv={onExportCsv}
        onExportExcel={onExportExcel}
      />
      {qs && projectId && (
        <GatewayReportBanner title="Project Statement" dateFrom={dateFrom} dateTo={dateTo} />
      )}
      {project && (
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          {project.code} — {project.title}
        </Typography>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error?.info?.detail || error.message || 'Failed to load statement.'}
        </Alert>
      )}
      <Box className="print-area">
        <GatewayReportHeader
          title="Project Statement"
          dateFrom={dateFrom}
          dateTo={dateTo}
          subtitle={project ? `${project.code} — ${project.title}` : undefined}
        />
        {data && (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 3 }}>
                <GatewayKpiCard
                  title="Income"
                  total={Number(data.profit_and_loss?.total_income || 0).toFixed(2)}
                  icon="solar:graph-up-bold-duotone"
                  color="success"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <GatewayKpiCard
                  title="Expense"
                  total={Number(data.profit_and_loss?.total_expense || 0).toFixed(2)}
                  icon="solar:graph-down-bold-duotone"
                  color="error"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <GatewayKpiCard
                  title="Net"
                  total={Number(data.profit_and_loss?.net_profit || 0).toFixed(2)}
                  icon="solar:wallet-money-bold-duotone"
                  color="primary"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <GatewayKpiCard
                  title="Entries"
                  total={data.voucher_entry_count || 0}
                  icon="solar:document-text-bold-duotone"
                  color="info"
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Income
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Code</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(data.income_lines || []).map((row) => (
                          <TableRow key={row.account_id} hover>
                            <TableCell>{row.code}</TableCell>
                            <TableCell>{row.name}</TableCell>
                            <TableCell align="right">{Number(row.amount).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Expense
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Code</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(data.expense_lines || []).map((row) => (
                          <TableRow key={row.account_id} hover>
                            <TableCell>{row.code}</TableCell>
                            <TableCell>{row.name}</TableCell>
                            <TableCell align="right">{Number(row.amount).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </GatewayPage>
  );
}
