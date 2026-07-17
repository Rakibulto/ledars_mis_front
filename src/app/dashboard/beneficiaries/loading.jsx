'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

export default function BeneficiariesLoading() {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Card
        sx={{
          p: 4,
          minHeight: 280,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={36} />
          <Typography variant="h6">Loading beneficiary management...</Typography>
          <Typography variant="body2" color="text.secondary">
            Preparing beneficiary data, schedules, and case details.
          </Typography>
        </Stack>
      </Card>
    </Box>
  );
}
