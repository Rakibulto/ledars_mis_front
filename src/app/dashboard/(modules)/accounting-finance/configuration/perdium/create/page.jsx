'use client';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import PerdiumClaimForm from '../../../_components/configuration/perdium-claim-form';

export default function CreatePerdiumPage() {
  return (
    <>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ px: 3, pt: 3 }}
      >
        <Typography variant="h4" fontWeight="bold">
          New Perdium Claim
        </Typography>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => window.close()}
          startIcon={<Iconify icon="solar:close-circle-bold" />}
        >
          Cancel
        </Button>
      </Stack>
      <PerdiumClaimForm hideHeader />
    </>
  );
}
