'use client';

import useSWR from 'swr';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
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
import { useGatewayApi } from '../../_components/use-gateway-api';
import { AccountAutocomplete } from '../../_components/account-autocomplete';
import {
  GatewayReportBanner,
  GatewayReportHeader,
} from '../../_components/gateway-report-header';
import {
  downloadCsv,
  downloadXlsx,
  parseDateRangeFromQs,
} from '../../_components/gateway-export';

export default function LedgerPage() {
  const { accounts } = useGatewayApi();
  const searchParams = useSearchParams();
  const [accountId, setAccountId] = useState(() => searchParams.get('account') || '');
  const [qs, setQs] = useState('');

  const { data, isLoading } = useSWR(
    qs ? `${endpoints.accounting.gateway_account_ledger}?${qs}` : null,
    fetcher
  );
  const rows = data?.results || [];
  const showChildCol = Boolean(data?.includes_descendants);
  const { dateFrom, dateTo } = parseDateRangeFromQs(qs);

  const extraParams = useMemo(
    () => (accountId ? { account: accountId } : null),
    [accountId]
  );

  const exportRows = useMemo(
    () =>
      rows.map((row) => ({
        Date: row.date,
        Reference: row.reference,
        Account: showChildCol ? `${row.account_code || ''} ${row.account_name || ''}`.trim() : '',
        Particulars: row.label,
        Debit: Number(row.debit || 0).toFixed(2),
        Credit: Number(row.credit || 0).toFixed(2),
        Balance: Number(row.balance || 0).toFixed(2),
      })),
    [rows, showChildCol]
  );

  const onExportCsv = () => {
    downloadCsv(
      `ledger-${data?.account?.code || accountId}-${dateFrom}-${dateTo}`,
      exportRows
    );
    toast.success('CSV downloaded.');
  };

  const onExportExcel = async () => {
    await downloadXlsx(`ledger-${data?.account?.code || accountId}-${dateFrom}-${dateTo}`, [
      { name: 'Ledger', rows: exportRows },
    ]);
    toast.success('Excel downloaded.');
  };

  return (
    <GatewayPage
      heading="Account Ledger"
      links={[
        { name: 'Dashboard', href: paths.dashboard.root },
        { name: 'Accounts', href: paths.dashboard.accountsGateway.root },
        { name: 'Display', href: paths.dashboard.accountsGateway.display.root },
        { name: 'Ledger' },
      ]}
    >
      <GatewayDateFilters
        onApply={setQs}
        extraParams={extraParams}
        disabled={!accountId}
        onReset={() => setAccountId('')}
        canExport={exportRows.length > 0}
        onExportCsv={onExportCsv}
        onExportExcel={onExportExcel}
        extra={
          <Box sx={{ minWidth: 320 }}>
            <AccountAutocomplete
              options={accounts}
              value={accountId}
              onChange={setAccountId}
              label="Account"
              helperText={
                accountId
                  ? 'Parent accounts include all child ledger lines'
                  : 'Select an account to load the ledger'
              }
            />
          </Box>
        }
      />

      {qs && (
        <GatewayReportBanner
          title="Account Ledger"
          dateFrom={dateFrom}
          dateTo={dateTo}
          subtitle={
            data?.account
              ? `${data.account.code} ${data.account.name}`
              : undefined
          }
        />
      )}

      {data?.account && (
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          {data.account.code} {data.account.name}
          {data.includes_descendants ? (
            <Chip
              size="small"
              label={`+ ${data.descendant_account_ids.length - 1} children`}
              sx={{ ml: 1 }}
              color="info"
              variant="outlined"
            />
          ) : null}{' '}
          · Opening {Number(data.opening_balance).toFixed(2)} · Closing{' '}
          {Number(data.closing_balance).toFixed(2)}
        </Typography>
      )}

      <Box className="print-area">
        <GatewayReportHeader
          title="Account Ledger"
          dateFrom={dateFrom}
          dateTo={dateTo}
          subtitle={
            data?.account
              ? `${data.account.code} — ${data.account.name}`
              : undefined
          }
        />
        <Card>
          <Scrollbar>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Reference</TableCell>
                  {showChildCol && <TableCell>Account</TableCell>}
                  <TableCell>Particulars</TableCell>
                  <TableCell align="right">Debit</TableCell>
                  <TableCell align="right">Credit</TableCell>
                  <TableCell align="right">Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.reference}</TableCell>
                    {showChildCol && (
                      <TableCell>
                        {row.account_code} {row.account_name}
                      </TableCell>
                    )}
                    <TableCell>{row.label}</TableCell>
                    <TableCell align="right">{Number(row.debit).toFixed(2)}</TableCell>
                    <TableCell align="right">{Number(row.credit).toFixed(2)}</TableCell>
                    <TableCell align="right">{Number(row.balance).toFixed(2)}</TableCell>
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
