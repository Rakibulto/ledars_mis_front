'use client';

import { useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

export default function BeneficiariesError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Card sx={{ p: 4, maxWidth: 760, mx: 'auto' }}>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Iconify icon="solar:danger-circle-bold" width={28} sx={{ color: 'error.main' }} />
              <Typography variant="h4">Beneficiary module error</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              This page could not be loaded. You can retry the page or return to a stable
              beneficiary screen.
            </Typography>
          </Stack>

          <Alert severity="error" variant="outlined">
            {error?.message || 'Unexpected error while loading beneficiary management.'}
          </Alert>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="contained"
              onClick={reset}
              startIcon={<Iconify icon="solar:restart-bold" />}
            >
              Retry
            </Button>
            <Button href={paths.dashboard.beneficiaries.dashboard} variant="outlined">
              Open Dashboard
            </Button>
            <Button href={paths.dashboard.beneficiaries.database} variant="text">
              Open Database
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Box>
  );
}
