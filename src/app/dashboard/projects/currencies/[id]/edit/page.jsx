'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo } from 'react';
import { useParams } from 'next/navigation';

import { Box, Card, Alert, Skeleton, Typography, CardContent } from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, usePutRequest } from 'src/actions/ledars-hook';

import { CurrencyForm } from 'src/sections/projects/currencies/currency-form';

export default function CurrencyEditPage() {
  const { id } = useParams();
  const EP = endpoints.projectManagements;
  const { data: currency, loading } = useGetRequest(EP.currencyById(id));

  const initialValues = useMemo(
    () => ({
      ...currency,
    }),
    [currency]
  );

  const handleUpdate = async (values) => {
    try {
      const payload = {
        ...values,
        exchange_rate:
          values.exchange_rate === '' || values.exchange_rate === null
            ? 1
            : Number(values.exchange_rate),
        decimal_places:
          values.decimal_places === '' || values.decimal_places === null
            ? 2
            : Number(values.decimal_places),
      };
      await usePutRequest(EP.currencyById(id), payload);
      toast.success('Currency updated successfully');
      mutate(EP.currencies);
      mutate(EP.currencyById(id));
      window.close();
    } catch (error) {
      toast.error(error?.message || 'Unable to update currency.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={240} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={360} height={24} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={420} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (!currency) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Currency not found.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Edit Currency
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Update details for {currency.code}
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
            Currency Information
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Changes are saved when you submit the form
          </Typography>
        </Box>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <CurrencyForm
            initialValues={initialValues}
            onSubmit={handleUpdate}
            submitLabel="Save Changes"
          />
        </CardContent>
      </Card>
    </Box>
  );
}
