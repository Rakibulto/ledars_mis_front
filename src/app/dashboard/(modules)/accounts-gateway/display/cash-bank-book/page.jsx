'use client';

import useSWR from 'swr';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { endpoints, fetcher } from 'src/utils/axios';

import { toast } from 'src/components/snackbar';
import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { TableNoData } from 'src/components/table';

import { GatewayPage } from '../../_components/gateway-page';
import { GatewayDateFilters } from '../../_components/gateway-date-filters';
import { useGatewayApi } from '../../_components/use-gateway-api';
import {
  GatewayReportBanner,
  GatewayReportHeader,
} from '../../_components/gateway-report-header';
import {
  downloadCsv,
  downloadXlsx,
  parseDateRangeFromQs,
} from '../../_components/gateway-export';

export default function CashBankBookPage() {
  const { banks } = useGatewayApi();
  const [bankId, setBankId] = useState('');
  const [qs, setQs] = useState('');

  const { data, isLoading } = useSWR(
    qs ? `${endpoints.accounting.gateway_cash_bank_book}?${qs}` : null,
    fetcher
  );
  const rows = data?.results || [];
  const { dateFrom, dateTo } = parseDateRangeFromQs(qs);

  const extraParams = useMemo(
    () => (bankId ? { bank_account: bankId } : null),
    [bankId]
  );

  const exportRows = useMemo(
    () =>
      rows.map((row) => ({
        Date: row.date,
        Description: row.description,
        Reference: row.reference || row.voucher_number,
        Type: row.transaction_type,
        Amount: Number(row.amount || 0).toFixed(2),
        Running: Number(row.running_balance || 0).toFixed(2),
        Bank: row.bank_account_name || '',
      })),
    [rows]
  );

  const onExportCsv = () => {
    downloadCsv(`cash-bank-book-${dateFrom}-${dateTo}`, exportRows);
    toast.success('CSV downloaded.');
  };

  const onExportExcel = async () => {
    await downloadXlsx(`cash-bank-book-${dateFrom}-${dateTo}`, [
      { name: 'Cash Bank Book', rows: exportRows },
    ]);
    toast.success('Excel downloaded.');
  };

  return (
    <GatewayPage
      heading="Cash / Bank Book"
      links={[
        { name: 'Dashboard', href: paths.dashboard.root },
        { name: 'Accounts', href: paths.dashboard.accountsGateway.root },
        { name: 'Display', href: paths.dashboard.accountsGateway.display.root },
        { name: 'Cash / Bank Book' },
      ]}
    >
      <GatewayDateFilters
        onApply={setQs}
        extraParams={extraParams}
        onReset={() => setBankId('')}
        canExport={exportRows.length > 0}
        onExportCsv={onExportCsv}
        onExportExcel={onExportExcel}
        extra={
          <TextField
            select
            size="small"
            label="Bank / Cash"
            value={bankId}
            onChange={(e) => setBankId(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">All</MenuItem>
            {banks.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>
        }
      />

      {qs && (
        <GatewayReportBanner title="Cash / Bank Book" dateFrom={dateFrom} dateTo={dateTo} />
      )}

      {data?.bank_account && (
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          {data.bank_account.name} · Balance{' '}
          {Number(data.bank_account.current_balance).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
        </Typography>
      )}

      <Box className="print-area">
        <GatewayReportHeader title="Cash / Bank Book" dateFrom={dateFrom} dateTo={dateTo} />
        <Card>
          <Scrollbar>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Running</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{row.reference || row.voucher_number}</TableCell>
                    <TableCell>
                      <Label
                        variant="soft"
                        color={row.transaction_type === 'credit' ? 'success' : 'error'}
                      >
                        {row.transaction_type}
                      </Label>
                    </TableCell>
                    <TableCell align="right">{Number(row.amount).toFixed(2)}</TableCell>
                    <TableCell align="right">{Number(row.running_balance).toFixed(2)}</TableCell>
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
