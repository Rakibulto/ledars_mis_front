'use client';

import useSWR from 'swr';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import axiosInstance, { endpoints, fetcher } from 'src/utils/axios';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { TableNoData } from 'src/components/table';

import { useGatewayProject } from './gateway-project-context';
import { printGatewayVoucher } from './gateway-voucher-print';
import { useGatewayApi } from './use-gateway-api';

const TYPE_META = {
  payment: {
    title: 'Payment vouchers',
    listHref: paths.dashboard.accountsGateway.vouchers.paymentList,
    createHref: paths.dashboard.accountsGateway.vouchers.paymentCreate,
  },
  receipt: {
    title: 'Receipt vouchers',
    listHref: paths.dashboard.accountsGateway.vouchers.receiptList,
    createHref: paths.dashboard.accountsGateway.vouchers.receiptCreate,
  },
  journal: {
    title: 'Journal vouchers',
    listHref: paths.dashboard.accountsGateway.vouchers.journalList,
    createHref: paths.dashboard.accountsGateway.vouchers.journalCreate,
  },
};

function formatLineAmount(line) {
  const debit = Number(line.debit || 0);
  const credit = Number(line.credit || 0);
  if (debit > 0) return `${debit.toLocaleString(undefined, { minimumFractionDigits: 2 })} Dr`;
  if (credit > 0) return `${credit.toLocaleString(undefined, { minimumFractionDigits: 2 })} Cr`;
  return '—';
}

function LinesCell({ lines = [] }) {
  if (!lines.length) {
    return (
      <Typography variant="caption" color="text.disabled">
        —
      </Typography>
    );
  }
  return (
    <Stack spacing={0.5} sx={{ py: 0.5, minWidth: 220 }}>
      {lines.map((line) => (
        <Stack
          key={line.id || `${line.account}-${line.debit}-${line.credit}`}
          direction="row"
          spacing={1}
          justifyContent="space-between"
          alignItems="baseline"
        >
          <Typography variant="caption" sx={{ pr: 1 }}>
            {line.account_code ? `${line.account_code} ` : ''}
            {line.account_name || line.description || 'Account'}
          </Typography>
          <Typography variant="caption" fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>
            {formatLineAmount(line)}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

/**
 * Shared voucher table — full page or compact embed on create screens.
 */
export function GatewayVoucherList({
  voucherType = null,
  compact = false,
  pageSize = 100,
  showHeader = true,
  mutateKey,
}) {
  const { projectId } = useGatewayProject();
  const { banks } = useGatewayApi();
  const [busyId, setBusyId] = useState(null);
  const meta = voucherType ? TYPE_META[voucherType] : null;

  const url = useMemo(() => {
    const params = new URLSearchParams({
      ordering: '-date,-id',
      page_size: String(compact ? Math.min(pageSize, 12) : pageSize),
    });
    if (projectId) params.set('ngo_project', String(projectId));
    if (voucherType) params.set('voucher_type', voucherType);
    const qs = params.toString();
    return mutateKey || `${endpoints.accounting.vouchers}?${qs}`;
  }, [projectId, voucherType, pageSize, compact, mutateKey]);

  const { data, isLoading, mutate } = useSWR(url, fetcher);
  const vouchers = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  }, [data]);

  const reverse = async (id) => {
    setBusyId(id);
    try {
      await axiosInstance.post(endpoints.accounting.voucher_reverse(id), {
        remarks: 'Reversed from Gateway',
      });
      toast.success('Voucher reversed.');
      mutate();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Reverse failed.');
    } finally {
      setBusyId(null);
    }
  };

  const printVoucher = async (id) => {
    setBusyId(id);
    try {
      const { data: detail } = await axiosInstance.get(endpoints.accounting.voucher_by_id(id));
      const lines = (detail.lines || []).map((line) => ({
        account: line.account,
        account_code: line.account_code,
        account_name: line.account_name,
        description: line.description || '',
        debit: line.debit,
        credit: line.credit,
      }));

      const bankLine = lines.find((line) => {
        const code = String(line.account_code || '');
        const name = String(line.account_name || '').toLowerCase();
        const isBankSide =
          (detail.voucher_type === 'payment' && Number(line.credit) > 0) ||
          (detail.voucher_type === 'receipt' && Number(line.debit) > 0) ||
          (!detail.voucher_type && (Number(line.debit) > 0 || Number(line.credit) > 0));
        return (
          isBankSide &&
          (code.startsWith('1103') || name.includes('bank') || name.includes('cash'))
        );
      });
      const matchedBank =
        banks.find((b) => bankLine && String(b.account) === String(bankLine.account)) ||
        banks.find((b) => bankLine && String(b.account_code) === String(bankLine.account_code)) ||
        null;

      printGatewayVoucher({
        voucherType: detail.voucher_type || voucherType || 'journal',
        voucherNumber: detail.voucher_number || '',
        date: detail.date || '',
        narration: detail.narration || '',
        payee: detail.payee || '',
        project: {
          code: detail.ngo_project_code,
          title: detail.ngo_project_title,
          short_name: detail.ngo_project_title,
        },
        lines,
        bankAccountId: matchedBank?.account || bankLine?.account || null,
        bank: matchedBank,
        bankLabel: matchedBank
          ? [matchedBank.name, matchedBank.bank_name, matchedBank.account_number ? `A/C ${matchedBank.account_number}` : '']
              .filter(Boolean)
              .filter((p, i, arr) => i === 0 || p !== arr[i - 1])
              .join(' — ')
          : '',
        netAmount: null,
      });
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || 'Print failed.');
    } finally {
      setBusyId(null);
    }
  };

  const notFound = !isLoading && vouchers.length === 0;

  const table = (
    <Scrollbar>
      <Table size="small" sx={{ minWidth: compact ? 720 : 960 }}>
        <TableHead>
          <TableRow>
            <TableCell>Number</TableCell>
            {!voucherType && <TableCell>Type</TableCell>}
            <TableCell>Date</TableCell>
            {!compact && <TableCell>Project</TableCell>}
            <TableCell>Payee</TableCell>
            <TableCell sx={{ minWidth: 260 }}>Lines</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {vouchers.map((v) => (
            <TableRow key={v.id} hover>
              <TableCell>
                <Typography variant="subtitle2">{v.voucher_number}</Typography>
              </TableCell>
              {!voucherType && (
                <TableCell sx={{ textTransform: 'capitalize' }}>{v.voucher_type}</TableCell>
              )}
              <TableCell>{v.date}</TableCell>
              {!compact && (
                <TableCell>{v.ngo_project_title || v.ngo_project_code || '—'}</TableCell>
              )}
              <TableCell>{v.payee || '—'}</TableCell>
              <TableCell>
                <LinesCell lines={v.lines || []} />
              </TableCell>
              <TableCell align="right">
                {Number(v.total_amount || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell>
                <Label
                  variant="soft"
                  color={
                    (v.status === 'posted' && 'success') ||
                    (v.status === 'pending' && 'warning') ||
                    (v.status === 'approved' && 'info') ||
                    (v.status === 'cancelled' && 'error') ||
                    'default'
                  }
                >
                  {v.status}
                </Label>
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                  <Button
                    size="small"
                    color="inherit"
                    disabled={busyId === v.id}
                    onClick={() => printVoucher(v.id)}
                    startIcon={<Iconify icon="solar:printer-bold-duotone" width={16} />}
                  >
                    Print
                  </Button>
                  {v.status === 'posted' && (
                    <Button
                      size="small"
                      color="warning"
                      disabled={busyId === v.id}
                      onClick={() => reverse(v.id)}
                    >
                      Reverse
                    </Button>
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
          <TableNoData notFound={notFound} />
        </TableBody>
      </Table>
    </Scrollbar>
  );

  if (!showHeader) {
    return <Card>{table}</Card>;
  }

  return (
    <Card>
      {compact && meta && (
        <CardHeader
          title={meta.title}
          subheader="Recent entries for this project"
          action={
            <Button
              component={RouterLink}
              href={meta.listHref}
              size="small"
              endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
            >
              View all
            </Button>
          }
          sx={{ pb: 0 }}
        />
      )}
      {compact && <Box sx={{ pt: 1 }} />}
      {table}
    </Card>
  );
}
