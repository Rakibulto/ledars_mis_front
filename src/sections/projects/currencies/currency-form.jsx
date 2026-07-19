'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import { Box, Stack, Button, Divider, MenuItem, Typography } from '@mui/material';

import { Form, Field } from 'src/components/hook-form';

export const currencySchema = z.object({
  code: z.string().min(1, 'Code is required').max(10, 'Max 10 characters'),
  name: z.string().optional().nullable(),
  symbol: z.string().optional().nullable(),
  exchange_rate: z.coerce.number().min(0, 'Rate must be positive').optional().nullable(),
  base_currency: z.string().optional().nullable(),
  decimal_places: z.coerce.number().int().min(0).max(10).optional().nullable(),
  status: z.string().optional().nullable(),
});

const defaultEmptyValues = {
  code: '',
  name: '',
  symbol: '',
  exchange_rate: '',
  base_currency: '',
  decimal_places: 2,
  status: 'active',
};

export function CurrencyForm({ initialValues = {}, onSubmit, submitLabel = 'Save' }) {
  const defaultValues = useMemo(
    () => ({
      ...defaultEmptyValues,
      ...initialValues,
      exchange_rate:
        initialValues.exchange_rate !== undefined && initialValues.exchange_rate !== null
          ? String(initialValues.exchange_rate)
          : '',
      decimal_places:
        initialValues.decimal_places !== undefined && initialValues.decimal_places !== null
          ? Number(initialValues.decimal_places)
          : 2,
    }),
    [initialValues]
  );

  const methods = useForm({
    resolver: zodResolver(currencySchema),
    defaultValues,
  });

  useEffect(() => {
    if (Object.keys(initialValues).length > 0) {
      methods.reset(defaultValues);
    }
  }, [initialValues, defaultValues, methods]);

  return (
    <Form methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
      <Stack spacing={4} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
            Currency Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Define the currency code, symbol, and exchange rate
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
            gap: 2.5,
          }}
        >
          <Field.Text name="code" label="Currency Code" fullWidth placeholder="e.g. USD" />
          <Field.Text name="name" label="Currency Name" fullWidth placeholder="e.g. US Dollar" />
          <Field.Text name="symbol" label="Symbol" fullWidth placeholder="e.g. $" />
          <Field.Text
            name="exchange_rate"
            label="Exchange Rate"
            type="number"
            fullWidth
            placeholder="1.0"
          />
          <Field.Text name="base_currency" label="Base Currency" fullWidth placeholder="e.g. BDT" />
          <Field.Text name="decimal_places" label="Decimal Places" type="number" fullWidth />
          <Field.Select name="status" label="Status" fullWidth>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Field.Select>
        </Box>
      </Stack>

      <Stack
        direction="row"
        justifyContent="flex-end"
        spacing={2}
        sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}
      >
        <Button type="submit" variant="contained" size="large" sx={{ minWidth: 160 }}>
          {submitLabel}
        </Button>
      </Stack>
    </Form>
  );
}
