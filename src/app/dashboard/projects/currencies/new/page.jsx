'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';

import { Box, Card, Typography, CardContent } from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useCreateRequest } from 'src/actions/ledars-hook';

import { CurrencyForm } from 'src/sections/projects/currencies/currency-form';

export default function CurrencyCreatePage() {
  const [loading, setLoading] = useState(false);

  const handleCreate = async (values) => {
    setLoading(true);
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
      await useCreateRequest(endpoints.projectManagements.currencies, payload);
      toast.success('Currency created successfully');
      mutate(endpoints.projectManagements.currencies);

      if (window.opener && !window.opener.closed) {
        window.opener.focus();
      }

      window.setTimeout(() => {
        window.close();
      }, 400);
    } catch (error) {
      toast.error(error?.message || 'Unable to create currency.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Add New Currency
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Register a new currency with its symbol and exchange rate
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
            Fields marked with validation rules are required on submit
          </Typography>
        </Box>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <CurrencyForm
            onSubmit={handleCreate}
            submitLabel={loading ? 'Saving...' : 'Create Currency'}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
