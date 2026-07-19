'use client';

import useSWR from 'swr';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';

import { paths } from 'src/routes/paths';

import { endpoints, fetcher } from 'src/utils/axios';

import { toast } from 'src/components/snackbar';
import { Scrollbar } from 'src/components/scrollbar';
import { TableNoData } from 'src/components/table';

import { GatewayPage } from '../../_components/gateway-page';
import { GatewayDateFilters } from '../../_components/gateway-date-filters';
import {
  GatewayReportBanner,
  GatewayReportHeader,
} from '../../_components/gateway-report-header';
import {
  downloadCsv,
  downloadXlsx,
  parseDateRangeFromQs,
} from '../../_components/gateway-export';

export default function TrialBalanceReportPage() {
  const [qs, setQs] = useState('');
  const { data, isLoading } = useSWR(
    qs ? `${endpoints.accounting.account_trial_balance}?${qs}` : null,
    fetcher
  );
  const rows = Array.isArray(data?.accounts)
    ? data.accounts
    : Array.isArray(data)
      ? data
      : data?.results || [];
  const { dateFrom, dateTo } = parseDateRangeFromQs(qs);

  const exportRows = useMemo(
    () =>
      rows.map((row) => ({
        Code: row.code,
        Account: row.name,
        'Opening Dr': Number(row.opening_dr || 0).toFixed(2),
        'Opening Cr': Number(row.opening_cr || 0).toFixed(2),
        'Period Dr': Number(row.period_dr || 0).toFixed(2),
        'Period Cr': Number(row.period_cr || 0).toFixed(2),
        'Closing Dr': Number(row.closing_dr || 0).toFixed(2),
        'Closing Cr': Number(row.closing_cr || 0).toFixed(2),
      })),
    [rows]
  );

  const onExportCsv = () => {
    downloadCsv(`trial-balance-${dateFrom}-${dateTo}`, exportRows);
    toast.success('CSV downloaded.');
  };

  const onExportExcel = async () => {
    await downloadXlsx(`trial-balance-${dateFrom}-${dateTo}`, [
      { name: 'Trial Balance', rows: exportRows },
    ]);
    toast.success('Excel downloaded.');
  };

  return (
    <GatewayPage
      heading="Trial Balance"
      links={[
        { name: 'Dashboard', href: paths.dashboard.root },
        { name: 'Accounts', href: paths.dashboard.accountsGateway.root },
        { name: 'Reports', href: paths.dashboard.accountsGateway.reports.root },
        { name: 'Trial Balance' },
      ]}
    >
      <GatewayDateFilters
        onApply={setQs}
        canExport={exportRows.length > 0}
        onExportCsv={onExportCsv}
        onExportExcel={onExportExcel}
      />
      {qs && (
        <GatewayReportBanner title="Trial Balance" dateFrom={dateFrom} dateTo={dateTo} />
      )}
      <Box className="print-area">
        <GatewayReportHeader title="Trial Balance" dateFrom={dateFrom} dateTo={dateTo} />
        <Card>
          <Scrollbar>
            <Table size="small" sx={{ minWidth: 960 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell align="right">Opening Dr</TableCell>
                  <TableCell align="right">Opening Cr</TableCell>
                  <TableCell align="right">Period Dr</TableCell>
                  <TableCell align="right">Period Cr</TableCell>
                  <TableCell align="right">Closing Dr</TableCell>
                  <TableCell align="right">Closing Cr</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id || row.code} hover>
                    <TableCell>{row.code}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell align="right">{Number(row.opening_dr || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">{Number(row.opening_cr || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">{Number(row.period_dr || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">{Number(row.period_cr || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">{Number(row.closing_dr || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">{Number(row.closing_cr || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableNoData notFound={!isLoading && !!qs && !rows.length} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Card>
      </Box>
    </GatewayPage>
  );
}
