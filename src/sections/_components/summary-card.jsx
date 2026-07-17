import { Box, Card, Skeleton, Typography } from '@mui/material';

import { Iconify } from 'src/components/iconify';

export default function SummaryCard({
  title,
  value = 0,
  icon,
  bgcolor = 'primary.main',
  boxShadow = '0 8px 24px rgba(0,0,0,0.12)',
  loading = false,
  error = false,
}) {
  const isBusy = loading || error;

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor,
        color: 'common.white',
        position: 'relative',
        overflow: 'hidden',
        boxShadow,
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {isBusy ? (
          <>
            <Skeleton
              variant="text"
              width={120}
              height={20}
              sx={{ bgcolor: 'rgba(255,255,255,0.25)', mb: 1 }}
            />
            <Skeleton
              variant="text"
              width={80}
              height={40}
              sx={{ bgcolor: 'rgba(255,255,255,0.25)' }}
            />
          </>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography variant="h3" fontWeight={700}>
              {value}
            </Typography>
          </>
        )}
      </Box>

      {icon && (
        <Box
          sx={{
            position: 'absolute',
            right: 20,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0.2,
          }}
        >
          <Iconify icon={icon} width={80} />
        </Box>
      )}
    </Card>
  );
}
