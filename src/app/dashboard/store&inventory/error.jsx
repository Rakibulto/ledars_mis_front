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
    console.error('Store & Inventory route error:', error);
  }, [error]);

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                Store & Inventory
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This inventory page failed to load. You can retry the route without leaving the
                module.
              </Typography>
            </Box>

            <Alert severity="error">{error?.message || 'Unexpected inventory page error.'}</Alert>

            <Stack direction="row" spacing={1.5}>
              <Button variant="contained" onClick={reset}>
                Retry
              </Button>
              <Button variant="outlined" href="/dashboard/store&inventory/dashboard">
                Go To Dashboard
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
