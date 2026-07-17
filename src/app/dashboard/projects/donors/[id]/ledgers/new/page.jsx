'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { Box, Button, Card, CardContent, MenuItem, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';

import { endpoints } from 'src/utils/axios';
import { useCreateRequest, useGetRequest } from 'src/actions/ledars-hook';
import { Form, Field } from 'src/components/hook-form';

const ledgerSchema = z.object({
  transaction_type: z.string().min(1, 'Transaction type is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  transaction_date: z.string().min(1, 'Date is required'),
  currency: z.string().min(1, 'Currency is required'),
  reference: z.string().optional(),
  description: z.string().optional(),
});

const TX_TYPE_OPTIONS = [
  { value: 'donation', label: 'Donation' },
  { value: 'debit', label: 'Debit' },
  { value: 'credit', label: 'Credit' },
  { value: 'refund', label: 'Refund' },
  { value: 'adjustment', label: 'Adjustment' },
];

const CURRENCY_OPTIONS = ['USD', 'BDT', 'EUR', 'GBP'];

export default function LedgerCreatePage() {
  const { id } = useParams();

  const [projectId, setProjectId] = useState(null);
  const [projectTitle, setProjectTitle] = useState(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setProjectId(sp.get('projectId'));
    setProjectTitle(sp.get('projectTitle'));
  }, []);

  const EP = endpoints.projectManagements;
  const { data: donor } = useGetRequest(EP.donorById(id));
  const [loading, setLoading] = useState(false);

  const methods = useForm({
    resolver: zodResolver(ledgerSchema),
    defaultValues: {
      transaction_type: 'donation',
      amount: '',
      transaction_date: new Date().toISOString().slice(0, 10),
      currency: 'BDT',
      reference: '',
      description: '',
    },
  });

  const handleCreate = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        donor: id,
        related_project: projectId,
        transaction_date: values.transaction_date
          ? dayjs(values.transaction_date).format('YYYY-MM-DD')
          : undefined,
      };
      await useCreateRequest(EP.donorLedgers, payload);
      toast.success('Ledger entry created successfully');
      mutate(
        (key) => typeof key === 'string' && key.startsWith(EP.donorLedgers)
      );

      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'switchDonorTab', tabIndex: 1 }, '*');
        window.opener.focus();
      }

      window.setTimeout(() => {
        window.close();
      }, 400);
    } catch (error) {
      toast.error(error?.message || 'Unable to create ledger entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Create Ledger Entry
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {donor?.name ? `Donor: ${donor.name}` : ''}
        {projectTitle ? ` — Project: ${projectTitle}` : ''}
      </Typography>

      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #e5e7eb', bgcolor: '#f9fafb' }}>
          <Typography variant="h6" fontWeight={600}>
            Ledger Information
          </Typography>
        </Box>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Form methods={methods} onSubmit={methods.handleSubmit(handleCreate)}>
            <Stack spacing={3}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 2.5,
                }}
              >
                <Field.Select name="transaction_type" label="Transaction type">
                  {TX_TYPE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Field.Select>

                <Field.Text name="amount" label="Amount" type="number" />

                <Field.DatePicker name="transaction_date" label="Transaction date" />

                <Field.Select name="currency" label="Currency">
                  {CURRENCY_OPTIONS.map((cur) => (
                    <MenuItem key={cur} value={cur}>
                      {cur}
                    </MenuItem>
                  ))}
                </Field.Select>

                <Field.Text name="reference" label="Reference (optional)" />
              </Box>

              <Field.Text
                name="description"
                label="Description (optional)"
                multiline
                rows={3}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => {
                    if (window.opener && !window.opener.closed) {
                      window.opener.focus();
                    }
                    window.close();
                  }}
                >
                  Cancel
                </Button>

                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Ledger'}
                </Button>
              </Box>
            </Stack>
          </Form>
        </CardContent>
      </Card>
    </Box>
  );
}
