'use client';

import { useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Accounting & Finance route error:', error);
  }, [error]);

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                Accounting & Finance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This page failed to load. The route is still available, and you can retry without
                leaving the module.
              </Typography>
            </Box>

            <Alert severity="error">
              {error?.message || 'Unexpected error while loading the accounting page.'}
            </Alert>

            <Stack direction="row" spacing={1.5}>
              <Button variant="contained" onClick={reset}>
                Retry
              </Button>
              <Button variant="outlined" href="/dashboard/accounting-finance/dashboard">
                Go To Dashboard
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
