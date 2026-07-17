'use client';

import { AlertTriangle } from 'lucide-react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

export default function DashboardError({ title = 'Something went wrong', message, onRetry }) {
  const theme = useTheme();
  return (
    <Card variant="outlined" sx={{ p: { xs: 4, sm: 6 }, borderRadius: 3, textAlign: 'center' }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          mx: 'auto',
          mb: 2,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(theme.palette.error.main, 0.1),
          color: 'error.main',
        }}
      >
        <AlertTriangle size={30} />
      </Box>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        {title}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 420, mx: 'auto', mb: onRetry ? 3 : 0 }}
      >
        {message || 'Failed to load dashboard data. Please try again later.'}
      </Typography>
      {onRetry && (
        <Button variant="outlined" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </Card>
  );
}
