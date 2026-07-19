'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { Iconify } from 'src/components/iconify';

export function GatewayKpiCard({ title, total, icon, helper, sx }) {
  return (
    <Card sx={{ borderRadius: 2, height: '100%', ...sx }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="flex-start">
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 0.75 }}>
              {total}
            </Typography>
            {helper && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }} noWrap>
                {helper}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 1.25,
              borderRadius: 1.5,
              bgcolor: 'background.neutral',
              color: 'text.secondary',
              flexShrink: 0,
            }}
          >
            <Iconify icon={icon} width={22} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
