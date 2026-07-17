'use client';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Sun, Moon } from 'lucide-react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { getGreeting } from '../utils/formatters';

export default function WelcomeHeader() {
  const theme = useTheme();
  const { user } = useAuthContext();
  const [currentTime, setCurrentTime] = useState(dayjs());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 60000);
    return () => clearInterval(timer);
  }, []);

  const userName = user?.username || user?.email?.split('@')[0] || 'User';
  const userRole = user?.role || 'User';
  const greeting = getGreeting();
  const isDark = currentTime.hour() >= 18 || currentTime.hour() < 6;

  return (
    <Card
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.14)} 0%, ${alpha(
          theme.palette.primary.main,
          0.03
        )} 60%, transparent 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.16),
              color: 'primary.main',
            }}
          >
            {isDark ? <Moon size={22} /> : <Sun size={22} />}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={700} noWrap>
              {greeting}, {userName}!
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {userRole} &bull; LEDARS Management Information System
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
          <Typography variant="body2" fontWeight={600}>
            {currentTime.format('dddd, MMMM D, YYYY')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {currentTime.format('hh:mm A')}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

export function WelcomeHeaderSkeleton() {
  return (
    <Card sx={{ p: 3, borderRadius: 3 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Skeleton variant="circular" width={48} height={48} />
          <Box>
            <Skeleton width={220} height={28} />
            <Skeleton width={160} height={18} sx={{ mt: 0.5 }} />
          </Box>
        </Stack>
        <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
          <Skeleton width={140} height={18} sx={{ ml: { sm: 'auto' } }} />
          <Skeleton width={90} height={16} sx={{ ml: { sm: 'auto' }, mt: 0.5 }} />
        </Box>
      </Stack>
    </Card>
  );
}
