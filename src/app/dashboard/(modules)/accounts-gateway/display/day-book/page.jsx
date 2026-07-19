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
import Typography from '@mui/material/Typography';

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

export default function DayBookPage() {
  const [qs, setQs] = useState('');
  const { data, isLoading } = useSWR(
    qs ? `${endpoints.accounting.gateway_day_book}?${qs}` : null,
    fetcher
  );
  const rows = data?.results || [];
  const { dateFrom, dateTo } = parseDateRangeFromQs(qs);

  const exportRows = useMemo(
    () =>
      rows.map((row) => ({
        Date: row.date,
        Reference: row.reference,
        Journal: row.journal,
        Narration: row.narration,
        Debit: Number(row.total_debit || 0).toFixed(2),
        Credit: Number(row.total_credit || 0).toFixed(2),
      })),
    [rows]
  );

  const onExportCsv = () => {
    downloadCsv(`day-book-${dateFrom}-${dateTo}`, exportRows);
    toast.success('CSV downloaded.');
  };

  const onExportExcel = async () => {
    await downloadXlsx(`day-book-${dateFrom}-${dateTo}`, [
      { name: 'Day Book', rows: exportRows },
    ]);
    toast.success('Excel downloaded.');
  };

  return (
    <GatewayPage
      heading="Day Book"
      links={[
        { name: 'Dashboard', href: paths.dashboard.root },
        { name: 'Accounts', href: paths.dashboard.accountsGateway.root },
        { name: 'Display', href: paths.dashboard.accountsGateway.display.root },
        { name: 'Day Book' },
      ]}
    >
      <GatewayDateFilters
        onApply={setQs}
        canExport={exportRows.length > 0}
        onExportCsv={onExportCsv}
        onExportExcel={onExportExcel}
      />
      {qs && (
        <GatewayReportBanner title="Day Book" dateFrom={dateFrom} dateTo={dateTo} />
      )}
      <Box className="print-area">
        <GatewayReportHeader title="Day Book" dateFrom={dateFrom} dateTo={dateTo} />
        <Card>
          <Scrollbar>
            <Table size="small" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Journal</TableCell>
                  <TableCell>Narration</TableCell>
                  <TableCell align="right">Debit</TableCell>
                  <TableCell align="right">Credit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">{row.reference}</Typography>
                    </TableCell>
                    <TableCell>{row.journal}</TableCell>
                    <TableCell>{row.narration}</TableCell>
                    <TableCell align="right">{Number(row.total_debit).toFixed(2)}</TableCell>
                    <TableCell align="right">{Number(row.total_credit).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableNoData notFound={!isLoading && !!qs && !rows.length} />
              </TableBody>
            </Table>
          </Scrollbar>
          {!qs && (
            <Typography color="text.secondary" sx={{ p: 3 }}>
              Choose dates and click Apply to load the day book.
            </Typography>
          )}
        </Card>
      </Box>
    </GatewayPage>
  );
}
