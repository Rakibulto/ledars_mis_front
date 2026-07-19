'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

export function GatewayHubTile({ title, description, href, icon }) {
  return (
    <Card sx={{ borderRadius: 2, height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            p: 1.5,
            mb: 2,
            width: 'fit-content',
            borderRadius: 1.5,
            bgcolor: 'background.neutral',
            color: 'text.secondary',
          }}
        >
          <Iconify icon={icon} width={24} />
        </Box>

        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 2, flexGrow: 1 }}>
          {description}
        </Typography>

        <Button
          component={RouterLink}
          href={href}
          variant="outlined"
          color="inherit"
          fullWidth
          endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={16} />}
        >
          Open
        </Button>
      </CardContent>
    </Card>
  );
}
