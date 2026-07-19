'use client';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { toast } from 'src/components/snackbar';
import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { TableNoData } from 'src/components/table';

import { GatewayPage } from '../../_components/gateway-page';
import { useGatewayApi } from '../../_components/use-gateway-api';

const EMPTY_FORM = {
  name: '',
  journal_type: 'bank',
  sequence_prefix: '',
};

const TYPE_HINT = {
  bank: 'Payment / Receipt vouchers',
  cash: 'Cash Payment / Receipt',
  general: 'Journal voucher',
  sales: 'Sales / invoices',
  purchase: 'Purchases / bills',
};

export default function GatewayJournalsPage() {
  const { journals, journalsLoading, mutateJournals } = useGatewayApi();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const sorted = useMemo(
    () =>
      [...journals].sort((a, b) =>
        String(a.journal_type || '').localeCompare(String(b.journal_type || ''))
      ),
    [journals]
  );

  const onSeed = async () => {
    setSeeding(true);
    try {
      const { data } = await axiosInstance.post(endpoints.accounting.journal_seed);
      toast.success(data?.detail || 'Journals seeded.');
      await mutateJournals?.();
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message;
      toast.error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setSeeding(false);
    }
  };

  const onSave = async () => {
    if (!form.name.trim()) {
      toast.error('Journal name is required.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        journal_type: form.journal_type,
        is_active: true,
      };
      if (form.sequence_prefix.trim()) {
        body.sequence_prefix = form.sequence_prefix.trim().toUpperCase();
      }
      await axiosInstance.post(endpoints.accounting.journals, body);
      toast.success('Journal created.');
      setForm(EMPTY_FORM);
      await mutateJournals?.();
    } catch (err) {
      const detail = err?.response?.data || err?.message;
      toast.error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setSaving(false);
    }
  };

  return (
    <GatewayPage
      heading="Journals"
      links={[
        { name: 'Dashboard', href: paths.dashboard.root },
        { name: 'Accounts', href: paths.dashboard.accountsGateway.root },
        { name: 'Masters', href: paths.dashboard.accountsGateway.masters.root },
        { name: 'Journals' },
      ]}
      action={
        <Button
          variant="outlined"
          color="secondary"
          onClick={onSeed}
          disabled={seeding}
          startIcon={<Iconify icon="solar:magic-stick-bold-duotone" />}
        >
          {seeding ? 'Seeding…' : 'Seed Journals'}
        </Button>
      }
    >
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Create journal
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Vouchers need a journal to post into. Use <strong>Seed Journals</strong> for Bank, Cash,
          and General defaults, or add one manually below.
        </Typography>
        <Box
          rowGap={3}
          columnGap={2}
          display="grid"
          gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
        >
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Bank Payments Journal"
          />
          <TextField
            select
            label="Type"
            value={form.journal_type}
            onChange={(e) => setForm((f) => ({ ...f, journal_type: e.target.value }))}
            helperText={TYPE_HINT[form.journal_type] || ''}
          >
            <MenuItem value="bank">Bank</MenuItem>
            <MenuItem value="cash">Cash</MenuItem>
            <MenuItem value="general">General</MenuItem>
            <MenuItem value="sales">Sales</MenuItem>
            <MenuItem value="purchase">Purchase</MenuItem>
          </TextField>
          <TextField
            label="Sequence prefix"
            value={form.sequence_prefix}
            onChange={(e) => setForm((f) => ({ ...f, sequence_prefix: e.target.value }))}
            placeholder="Optional, e.g. BPY"
          />
        </Box>
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button
            variant="contained"
            onClick={onSave}
            disabled={saving}
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Save journal
          </Button>
        </Stack>
      </Card>

      <Card>
        <Scrollbar>
          <Table size="small" sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Prefix</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!journalsLoading &&
                sorted.map((j) => (
                  <TableRow key={j.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{j.code}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">{j.name}</Typography>
                    </TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{j.journal_type}</TableCell>
                    <TableCell>{j.sequence_prefix || '—'}</TableCell>
                    <TableCell>
                      <Label
                        variant="soft"
                        color={j.is_active !== false ? 'success' : 'default'}
                      >
                        {j.is_active !== false ? 'Active' : 'Inactive'}
                      </Label>
                    </TableCell>
                  </TableRow>
                ))}
              <TableNoData notFound={!journalsLoading && !sorted.length} />
            </TableBody>
          </Table>
        </Scrollbar>
      </Card>
    </GatewayPage>
  );
}
