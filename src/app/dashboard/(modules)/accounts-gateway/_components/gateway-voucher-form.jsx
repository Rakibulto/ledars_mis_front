'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSWRConfig } from 'swr';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { useGatewayProject } from './gateway-project-context';
import { useGatewayApi } from './use-gateway-api';
import { AccountAutocomplete } from './account-autocomplete';
import { printGatewayVoucher } from './gateway-voucher-print';
import { GatewayVoucherList } from './gateway-voucher-list';

const emptyLine = () => ({ account: '', description: '', debit: '', credit: '' });

const META = {
  payment: {
    title: 'Payment Voucher',
    subtitle: 'Money going out — expense/party Dr, bank/cash Cr',
    color: 'error',
    icon: 'solar:card-send-bold-duotone',
  },
  receipt: {
    title: 'Receipt Voucher',
    subtitle: 'Money coming in — bank/cash Dr, income/party Cr',
    color: 'success',
            icon: 'solar:card-recive-bold-duotone',
  },
  journal: {
    title: 'Journal Voucher',
    subtitle: 'Non-cash adjustments — any Dr/Cr pair that balances',
    color: 'info',
    icon: 'solar:notebook-bold-duotone',
  },
  contra: {
    title: 'Contra Voucher',
    subtitle: 'Bank ↔ cash / bank ↔ bank transfers',
    color: 'warning',
    icon: 'solar:transfer-horizontal-bold-duotone',
  },
};

export function GatewayVoucherForm({ voucherType = 'payment' }) {
  const meta = META[voucherType] || META.journal;
  const { projectId, project } = useGatewayProject();
  const { mutate: globalMutate } = useSWRConfig();
  const { accounts, journals, banks, saveAndPost, journalsLoading, accountsLoading } =
    useGatewayApi();

  const firstAccountRef = useRef(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [narration, setNarration] = useState('');
  const [payee, setPayee] = useState('');
  const [journalId, setJournalId] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [lines, setLines] = useState([emptyLine(), emptyLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [printSnapshot, setPrintSnapshot] = useState(null);

  const bankCoaId = useMemo(() => {
    const bank = banks.find((b) => String(b.id) === String(bankAccountId));
    return bank?.account || null;
  }, [banks, bankAccountId]);

  const selectedBank = useMemo(
    () => banks.find((b) => String(b.id) === String(bankAccountId)),
    [banks, bankAccountId]
  );

  const totals = useMemo(() => {
    const debit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const credit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    const diff = Math.abs(debit - credit);
    return {
      debit,
      credit,
      diff,
      balanced: diff < 0.005 && debit > 0,
    };
  }, [lines]);

  const preferredJournals = useMemo(() => {
    const typeMap = {
      payment: ['bank', 'cash'],
      receipt: ['bank', 'cash'],
      journal: ['general'],
      contra: ['bank', 'cash', 'general'],
    };
    const wanted = typeMap[voucherType] || [];
    const filtered = journals.filter((j) => wanted.includes(j.journal_type));
    return filtered.length ? filtered : journals;
  }, [journals, voucherType]);

  useEffect(() => {
    if (!journalId && preferredJournals[0]) {
      setJournalId(String(preferredJournals[0].id));
    }
  }, [preferredJournals, journalId]);

  useEffect(() => {
    firstAccountRef.current?.focus?.();
  }, [voucherType]);

  const updateLine = (index, field, value) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === 'debit' && value) next[index].credit = '';
      if (field === 'credit' && value) next[index].debit = '';
      return next;
    });
  };

  const applyBankOpposite = () => {
    if (!bankCoaId) {
      toast.error('Select a bank/cash account first.');
      return;
    }
    // Exclude existing bank line(s) so VAT/tax/other credits are kept
    const partyLines = lines.filter(
      (l) => l.account && String(l.account) !== String(bankCoaId)
    );
    const partyDebit = partyLines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const partyCredit = partyLines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    // Net cash movement after deductions (e.g. 50k expense − 10k VAT − 5k tax = 35k)
    const net = Math.round((partyDebit - partyCredit) * 100) / 100;

    let bankDebit = 0;
    let bankCredit = 0;
    if (voucherType === 'payment') {
      if (net <= 0) {
        toast.error(
          'Bank credit needs a positive net (Debits − other Credits). Check expense vs VAT/tax lines.'
        );
        return;
      }
      bankCredit = net;
    } else if (voucherType === 'receipt') {
      // Receipt: income credits minus any debit deductions → bank debit
      const receiptNet = Math.round((partyCredit - partyDebit) * 100) / 100;
      if (receiptNet <= 0) {
        toast.error(
          'Bank debit needs a positive net (Credits − other Debits). Check income vs deduction lines.'
        );
        return;
      }
      bankDebit = receiptNet;
    } else {
      toast.success('Auto bank line is for Payment / Receipt vouchers.');
      return;
    }

    const withoutBank = lines.filter((l) => String(l.account) !== String(bankCoaId));
    setLines([
      ...withoutBank,
      {
        account: String(bankCoaId),
        description: voucherType === 'payment' ? 'Bank payment' : 'Bank receipt',
        debit: bankDebit ? String(bankDebit) : '',
        credit: bankCredit ? String(bankCredit) : '',
      },
    ]);
    toast.success(
      voucherType === 'payment'
        ? `Bank credit set to ${bankCredit.toLocaleString()}`
        : `Bank debit set to ${bankDebit.toLocaleString()}`
    );
  };

  const handleSubmit = async () => {
    if (!journalId) {
      toast.error('Select a journal.');
      return;
    }
    if (!totals.balanced) {
      toast.error('Debit and Credit must be equal.');
      return;
    }
    const payloadLines = lines
      .filter((l) => l.account && (Number(l.debit) || Number(l.credit)))
      .map((l) => ({
        account: Number(l.account),
        description: l.description || '',
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
      }));
    if (payloadLines.length < 2) {
      toast.error('Add at least two voucher lines.');
      return;
    }

    setSubmitting(true);
    setLastResult(null);
    try {
      const snapshot = {
        voucherType,
        date,
        narration,
        payee,
        project,
        lines: [...lines],
        accounts,
        bankAccountId: bankCoaId,
        bank: selectedBank || null,
        bankLabel: selectedBank
          ? [selectedBank.name, selectedBank.bank_name, selectedBank.account_number ? `A/C ${selectedBank.account_number}` : '']
              .filter(Boolean)
              .filter((p, i, arr) => i === 0 || p !== arr[i - 1])
              .join(' — ')
          : '',
        netAmount: null,
      };
      const { voucher, result } = await saveAndPost({
        voucher_type: voucherType,
        journal: Number(journalId),
        date,
        narration,
        payee,
        ngo_project: projectId || null,
        lines: payloadLines,
        total_amount: totals.debit,
      });
      setLastResult({ voucher, result });
      setPrintSnapshot({
        ...snapshot,
        voucherNumber: voucher?.voucher_number || '',
      });
      toast.success(result?.detail || 'Voucher posted.');
      setNarration('');
      setPayee('');
      setLines([emptyLine(), emptyLine()]);
      globalMutate(
        (key) => typeof key === 'string' && key.includes('/api/acc-vouchers/'),
        undefined,
        { revalidate: true }
      );
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.code ||
        err?.message ||
        'Failed to post voucher.';
      toast.error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    try {
      const source = printSnapshot || {
        voucherType,
        voucherNumber: lastResult?.voucher?.voucher_number || '',
        date,
        narration,
        payee,
        project,
        lines,
        accounts,
        bankAccountId: bankCoaId,
        bank: selectedBank || null,
        bankLabel: selectedBank
          ? [selectedBank.name, selectedBank.bank_name, selectedBank.account_number ? `A/C ${selectedBank.account_number}` : '']
              .filter(Boolean)
              .filter((p, i, arr) => i === 0 || p !== arr[i - 1])
              .join(' — ')
          : '',
        netAmount: null,
      };
      const hasLines = (source.lines || []).some(
        (l) => l.account && (Number(l.debit) > 0 || Number(l.credit) > 0)
      );
      if (!hasLines && !printSnapshot) {
        toast.error('Add voucher lines before printing.');
        return;
      }
      printGatewayVoucher(source);
    } catch (err) {
      toast.error(err?.message || 'Print failed.');
    }
  };

  // Ctrl+Enter to post when balanced
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && totals.balanced && !submitting) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totals.balanced, submitting, lines, journalId, date, narration, payee, projectId]);

  return (
    <Stack spacing={3}>
      <Card
        sx={{
          p: 2.5,
          bgcolor: `${meta.color}.lighter`,
          border: (theme) => `1px solid ${theme.vars.palette.divider}`,
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: `${meta.color}.main`,
              color: 'common.white',
            }}
          >
            <Iconify icon={meta.icon} width={28} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5">{meta.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {meta.subtitle}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              variant="soft"
              color={totals.balanced ? 'success' : 'warning'}
              label={
                totals.balanced
                  ? `Balanced · ${totals.debit.toFixed(2)}`
                  : `Diff ${totals.diff.toFixed(2)}`
              }
            />
            {project && (
              <Chip size="small" variant="soft" color="info" label={project.code || project.title} />
            )}
            <Chip size="small" variant="outlined" label="Ctrl+Enter to post" />
          </Stack>
        </Stack>
      </Card>

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Voucher header
        </Typography>
        <Box
          rowGap={3}
          columnGap={2}
          display="grid"
          gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
        >
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            select
            label="Journal"
            value={journalId}
            onChange={(e) => setJournalId(e.target.value)}
            disabled={journalsLoading}
          >
            {preferredJournals.map((j) => (
              <MenuItem key={j.id} value={j.id}>
                {j.code} — {j.name}
              </MenuItem>
            ))}
          </TextField>
          {(voucherType === 'payment' || voucherType === 'receipt') && (
            <TextField
              select
              label="Bank / Cash book"
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              helperText={
                selectedBank
                  ? `Balance: ${Number(selectedBank.current_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                  : 'Required for auto bank line'
              }
            >
              {banks.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name} ({b.account_type})
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            label="Payee / Party"
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            placeholder="Supplier, staff, donor…"
          />
          <TextField
            label="Narration"
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            placeholder="Particulars / story of the entry"
            sx={{ gridColumn: { md: 'span 2' } }}
          />
        </Box>
      </Card>

      <Card>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
          sx={{ px: 3, py: 2 }}
        >
          <Box>
            <Typography variant="h6">Accounting lines</Typography>
            <Typography variant="caption" color="text.secondary">
              {voucherType === 'payment' || voucherType === 'receipt'
                ? 'Enter ledger + Amount (use Less for VAT/tax deductions), then Auto bank line'
                : 'Enter ledger amounts — Debit and Credit must balance'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            {(voucherType === 'payment' || voucherType === 'receipt') && (
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="solar:magic-stick-3-bold-duotone" />}
                onClick={applyBankOpposite}
              >
                Auto bank line
              </Button>
            )}
            <Button
              variant="soft"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => setLines((prev) => [...prev, emptyLine()])}
            >
              Add line
            </Button>
          </Stack>
        </Stack>
        <Divider />
        <Scrollbar>
          <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 56 }}>#</TableCell>
                <TableCell>Account (ledger)</TableCell>
                <TableCell>Particulars</TableCell>
                {voucherType === 'payment' || voucherType === 'receipt' ? (
                  <>
                    <TableCell align="right" sx={{ width: 140 }}>
                      Amount
                    </TableCell>
                    <TableCell align="right" sx={{ width: 140 }}>
                      Less
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell align="right" sx={{ width: 140 }}>
                      Debit
                    </TableCell>
                    <TableCell align="right" sx={{ width: 140 }}>
                      Credit
                    </TableCell>
                  </>
                )}
                <TableCell width={48} />
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.map((line, idx) => {
                const isPayRec = voucherType === 'payment' || voucherType === 'receipt';
                const amountValue =
                  voucherType === 'payment'
                    ? line.debit
                    : voucherType === 'receipt'
                      ? line.credit
                      : line.debit;
                const lessValue =
                  voucherType === 'payment'
                    ? line.credit
                    : voucherType === 'receipt'
                      ? line.debit
                      : line.credit;

                return (
                  <TableRow key={idx} hover>
                    <TableCell>
                      <Typography variant="caption" color="text.disabled">
                        {idx + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <AccountAutocomplete
                        options={accounts}
                        value={line.account}
                        onChange={(id) => updateLine(idx, 'account', id)}
                        label=""
                        placeholder="Search account…"
                        disabled={accountsLoading}
                        inputRef={idx === 0 ? firstAccountRef : undefined}
                        allowClear={false}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        value={line.description}
                        onChange={(e) => updateLine(idx, 'description', e.target.value)}
                        placeholder="Optional"
                      />
                    </TableCell>
                    {isPayRec ? (
                      <>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={amountValue}
                            onChange={(e) =>
                              updateLine(
                                idx,
                                voucherType === 'payment' ? 'debit' : 'credit',
                                e.target.value
                              )
                            }
                            inputProps={{ min: 0, step: '0.01' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={lessValue}
                            onChange={(e) =>
                              updateLine(
                                idx,
                                voucherType === 'payment' ? 'credit' : 'debit',
                                e.target.value
                              )
                            }
                            inputProps={{ min: 0, step: '0.01' }}
                          />
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={line.debit}
                            onChange={(e) => updateLine(idx, 'debit', e.target.value)}
                            inputProps={{ min: 0, step: '0.01' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={line.credit}
                            onChange={(e) => updateLine(idx, 'credit', e.target.value)}
                            inputProps={{ min: 0, step: '0.01' }}
                          />
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                        disabled={lines.length <= 2}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow
                sx={{
                  bgcolor: totals.balanced ? 'success.lighter' : 'warning.lighter',
                }}
              >
                <TableCell colSpan={3}>
                  <Typography variant="subtitle2">
                    {totals.balanced ? 'Balanced' : 'Totals'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle1">{totals.debit.toFixed(2)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle1">{totals.credit.toFixed(2)}</Typography>
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </Scrollbar>

        {!totals.balanced && (
          <Alert severity="warning" sx={{ m: 2 }}>
            Debit and Credit must be equal before posting.
          </Alert>
        )}

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          justifyContent="flex-end"
          sx={{ p: 2.5 }}
        >
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => {
              setLines([emptyLine(), emptyLine()]);
              setNarration('');
              setPayee('');
              setLastResult(null);
              setPrintSnapshot(null);
            }}
          >
            Clear
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:printer-bold-duotone" />}
            onClick={handlePrint}
          >
            Print voucher
          </Button>
          <Button
            variant="contained"
            size="large"
            color={meta.color === 'error' ? 'error' : 'primary'}
            disabled={submitting || !totals.balanced}
            onClick={handleSubmit}
            startIcon={
              submitting ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <Iconify icon="solar:check-circle-bold" />
              )
            }
          >
            Save & Post
          </Button>
        </Stack>
      </Card>

      {lastResult && (
        <Alert
          severity="success"
          icon={<Iconify icon="solar:verified-check-bold" width={24} />}
          action={
            <Button color="inherit" size="small" onClick={handlePrint}>
              Print voucher
            </Button>
          }
          sx={{ borderRadius: 2 }}
        >
          <Typography variant="subtitle2">
            Posted {lastResult.voucher?.voucher_number}
          </Typography>
          <Typography variant="body2">
            Journal {lastResult.result?.journal_entry} · Bank movements{' '}
            {lastResult.result?.bank_transactions ?? 0}
          </Typography>
        </Alert>
      )}

      {(voucherType === 'payment' ||
        voucherType === 'receipt' ||
        voucherType === 'journal') && (
        <GatewayVoucherList voucherType={voucherType} compact pageSize={12} />
      )}
    </Stack>
  );
}
